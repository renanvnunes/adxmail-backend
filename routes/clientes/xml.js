import express from 'express'
import axios from 'axios'
import moment from 'moment'
import mongoose from 'mongoose'

import xml2js from 'xml2js'
import fs from 'fs'
import path from 'path'

const __dirname = path.resolve(path.dirname(''))
const router = express.Router()

import verifyJWT from '../../middleware/valid_jwt.js'
import verifyEmpresa from '../../middleware/valid_empresa.js'
import verifyPermissions from '../../middleware/valid_permissions.js'

import redis_client from '../../connections/redis.js'
import verifySuper from '../../middleware/valid_super.js'

import '../../models/empresas.js'
const empresasSchema = mongoose.model(`${process.env.MDB_PREFIX}empresas`)

import ProdutosXML from './produtos.js'

import '../../models/clientes/clientes.js'

const clientesSchema = mongoose.model(`${process.env.MDB_PREFIX}clientes`)


router.get('/add_to_queue', async (req, res, next) => {

	try{
		
		// console.log(d)
		const ano = moment().format('YYYY')
		const mes = moment().format('MM')
		const dia = moment().format('DD')
		const hora = moment().format('HH')
				
		let query = {
			"updated_at": {
				"$lt": moment(`${ano}-${mes}-${dia} ${hora}:00:00.000-03:00`).toDate()
			},
			"xml": {
				"$ne": ""
			}
		}

		clientesSchema.count(query).exec((err, count) => {

			let random = Math.floor(Math.random() * count)

			clientesSchema.findOne(query).skip(random).exec( async (err, cliente) => {

				if(cliente == null){
					redis_client.set('logs_queue:aviso:geral', 'Não foram encontrados outros clientes para colocar na fila, ou todos já foram atualizados...', 3600)
					res.send({success: 1, message: 'Não foram encontrados outros clientes para colocar na fila, ou todos já foram atualizados...'})
					return
				}

				// req.processamento_fila = false

				// Antes de baixar o arquivo, verifica se o cliente já está na fila
				const queue_key = `xml_queues:waiting:empresa_id:${cliente.empresa_id}`
				const queues_redis = await redis_client.get(queue_key)
				
				const success_key = `xml_queues:success:empresa_id:${cliente.empresa_id}`
				const success_redis = await redis_client.get(success_key)
				
				// Caso a fila de aguardando esteja vazia, limpa também as filas de sucesso e de falha
				if(queues_redis == null || queues_redis.length == 0){
					
					await redis_client.del(`xml_queues:failure:empresa_id:${cliente.empresa_id}`)
					await redis_client.del(`xml_queues:success:empresa_id:${cliente.empresa_id}`)
				}
				
				if(queues_redis){
	
					let index = JSON.parse(queues_redis).map(x => {
						return x.cliente_id
					}).indexOf(cliente._id.toString())
					
					if(index > -1){
						redis_client.set('logs_queue:aviso:geral', 'Esse cliente já está na fila de processamento de XML.', 3600)
						res.send({success: 1, message: 'Esse cliente já está na fila de processamento de XML.'})
						return
					}
	
				}

				if(success_redis){
	
					let index = JSON.parse(success_redis).map(x => {
						return x.cliente_id
					}).indexOf(cliente._id.toString())
					
					if(index > -1){
						
						await redis_client.del(`xml_queues:failure:empresa_id:${cliente.empresa_id}`)
						await redis_client.del(`xml_queues:success:empresa_id:${cliente.empresa_id}`)
						await redis_client.del(`xml_queues:waiting:empresa_id:${cliente.empresa_id}`)

						redis_client.set('logs_queue:aviso:geral', 'Esse cliente foi atualizado agora há pouco.', 3600)
						res.send({success: 1, message: 'Esse cliente foi atualizado agora há pouco.'})
						return
					}
					
				}
			
				await axios({
					
					method: 'get',
					url: cliente.xml,
					responseType: 'stream',
	
				}).then(async resp => {
					if(resp.status){

						const xml_dir = `${__dirname}/storage/tmp_xml/${cliente._id}.xml`
						const writer = fs.createWriteStream(xml_dir)
						
						await resp.data.pipe(writer)

						let queue_list = []
						let new_item = {
							cliente_nome: cliente.nome,
							cliente_id: cliente._id,
							user_nome: 'Rotina do sistema',
							data: moment().format("YYYY-MM-DD HH:mm:ss")
						}
	
						// Se não existir nenhuma fila para essa empresa
						if(queues_redis == null){
							queue_list.push(new_item)
						}else{
							let queues = JSON.parse(queues_redis)
	
							queues.push(new_item)
	
							queue_list = queues
						}
						
						// Adiciona no Redis
						await redis_client.set(queue_key, queue_list, process.env.EXP_XML_QUEUES)

						// Atualiza a data no cadastro do cliente
						await clientesSchema.updateOne({'_id' : cliente._id}, {'$set' : {updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_by: 'Rotina do sistema'}}, {'upsert' : true}).then(() => {
							
							redis_client.set('logs_queue:aviso:geral', `XML cliente: ${cliente._id} adicionado a fila de atualização.`, 3600)

							res.send({success: 1, message: `XML cliente: ${cliente._id} adicionado a fila de atualização.`})

						}).catch(e =>{

							redis_client.set('logs_queue:error:exception', e, 3600)
							res.send({success: 1, message: e})
							
						})
	
					}else{
						redis_client.set('logs_queue:error:xml_notfound', 'Erro ao obter dados do XML.', 3600)
						res.send({success: 1, message: 'Erro ao obter dados do XML.'})
					}
				}).catch(e => {
					redis_client.set('logs_queue:error:exception', e, 3600)
					res.send({success: 1, message: e})
				})
				
			})
	
		})

	}catch(e){
		redis_client.set('logs_queue:error:exception', e, 3600)
		res.send({success: 1, message: e})
	}

})

router.get('/process_queue', async (req, res, next) => {

	try {
		// Conta as as empresas ativas uma a uma de forma randomica
		empresasSchema.count().exec(function (err, count) {

			var random = Math.floor(Math.random() * count)
			
			// Obtem a empresa
			empresasSchema.findOne({status: 1}, {_id: 1}).skip(random).exec( async (err, empresa) => {
				
				if(err){
					
					redis_client.set('logs_xml_process:error:empresa_notfound', 'Erro ao obter os dados da empresa', 3600)
					res.send({success: 0, message: 'Erro ao obter os dados da empresa'})

				}else{

					const key_waiting = `xml_queues:waiting:empresa_id:${empresa._id}`
					const key_failure = `xml_queues:failure:empresa_id:${empresa._id}`
					const key_success = `xml_queues:success:empresa_id:${empresa._id}`

					// Busca as filas da empresa no Redis
					const queues_redis = await redis_client.get(key_waiting)
					
					// Todos os itens da fila
					const queues = JSON.parse(queues_redis)

					if(queues_redis != null && queues.length > 0){
						
						const xml_dir = `${__dirname}/storage/tmp_xml/${queues[0].cliente_id}.xml`
						
						if (!fs.existsSync(xml_dir)) {
							redis_client.set('logs_xml_process:error:xml_notfound', `Não existe: ${xml_dir}`, 3600)
							res.send({success: 0, message: `Não existe: ${xml_dir}`})
							return
						}

						let parser = new xml2js.Parser()
						let xml_string = fs.readFileSync(xml_dir, "utf8")


						parser.parseString(xml_string, async (error, result) => {
							if(error === null){
								
								let itens_loop = ''

								if(result.rss != undefined && result.rss.channel[0].item != undefined){

									itens_loop = result.rss.channel[0].item

								}else if(result.feed != undefined && result.feed.entry != undefined){
									
									itens_loop = result.feed.entry

								}else{

									queues[0].message = 'XML sem CHANNEL ou ENTRY'

									// Adiciona na fila de falha
									redis_client.setMore(key_failure, queues[0], process.env.EXP_XML_QUEUES)

									redis_client.set('logs_xml_process:error:xml_error', `XML do cliente não possui tag CHANNEL ou ENTRY: Cliente: ${queues[0].cliente_nome}.`, 3600)

									// Remove o item que foi processado ou retornado falha
									queues.splice(0, 1)
	
									// Remove o item da fila em aguardo
									redis_client.set(key_waiting, queues, process.env.EXP_XML_QUEUES)

									// Remove o arquivo XML
									// fs.unlinkSync(xml_dir)

									res.send({success: 0, message: `XML do cliente não possui tag CHANNEL ou ENTRY: Cliente: ${queues[0].cliente_nome}.`})

									return
								}

								if(itens_loop.length > 0){

									let itens = []
									for(let item of itens_loop){
										itens.push(item)
									}

									// Envia os produtos para o Mongodb
									const send_products = await ProdutosXML.update(itens_loop, queues[0].cliente_id)
									
									if(send_products == true){
										res.send({success: 1, message: `XML de produtos atualizado para cliente: ${queues[0].cliente_nome}`})

										queues[0].data = moment().format("YYYY-MM-DD HH:mm:ss")

										// Adiciona na fila de sucesso
										redis_client.setMore(key_success, queues[0], process.env.EXP_XML_QUEUES)
										
										// Remove o item que foi processado ou retornado falha
										queues.splice(0, 1)
										
										// Remove o item da fila em aguardo
										redis_client.set(key_waiting, queues, process.env.EXP_XML_QUEUES)
										
										// Remove o arquivo XML
										// fs.unlinkSync(xml_dir)
									}else{

										redis_client.set('logs_xml_process:error:product_error:db_save', `Erro ao salvar os produtos do cliente: ${queues[0].cliente_nome}.`, 3600)

										res.send({success: 0, message: `Erro ao salvar os produtos do cliente: ${queues[0].cliente_nome}.`})

									}									

								}else{

									// Adiciona na fila de falha
									redis_client.setMore(key_failure, queues[0], process.env.EXP_XML_QUEUES)

									redis_client.set('logs_xml_process:error:xml_error:channel_read', `Erro ao ler o channel de produtos do XML do cliente: ${queues[0].cliente_nome}.`, 3600)

									// E remove esse item da fila de aguarando
									queues.splice(0, 1)

									redis_client.set(key_waiting, queues, process.env.EXP_XML_QUEUES)

									res.send({success: 0, message: `Erro ao ler o channel de produtos do XML do cliente: ${queues[0].cliente_nome}.`})

									// Remove o arquivo XML
									// fs.unlinkSync(xml_dir)
								}

							}else{
								redis_client.set('logs_xml_process:error:xml_error:xml_read', `Erro ao obter dados do XML. Cliente: ${queues[0].cliente_nome}`, 3600)
								res.send({success: 0, message: `Erro ao obter dados do XML. Cliente: ${queues[0].cliente_nome}`})
							}
						})


					}else{

						redis_client.set('logs_xml_process:aviso:processo_finalizado', `Não há itens na fila de clientes da empresa: ${empresa._id}`, 3600)
						res.send({success: 0, message: `Não há itens na fila de clientes da empresa: ${empresa._id}`})
					}
				}
			})
		})

	} catch (e) {
		redis_client.set('logs_xml_process:error:geral', e, 3600)
		res.send({success: 0, message: e})
	}

})

router.get('/list_queues', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'clientes')

}, async (req, res) => {
	const empresa_id = req.query.empresa_id

	let queues = {
		waiting : [],
		failure : [],
		success : []
	}
	
	// Filas aguardando
	const queues_redis = await redis_client.get(`xml_queues:waiting:empresa_id:${empresa_id}`)
	if(queues_redis != null){
		let list_waiting = JSON.parse(queues_redis)
		queues.waiting = list_waiting
	}

	// Filas com falha 
	const queues_redis_failure = await redis_client.get(`xml_queues:failure:empresa_id:${empresa_id}`)
	if(queues_redis_failure != null){
		let list_failure = JSON.parse(queues_redis_failure)
		queues.failure = list_failure
	}

	// Filas com falha 
	const queues_redis_success = await redis_client.get(`xml_queues:success:empresa_id:${empresa_id}`)
	if(queues_redis_success != null){
		let list_success = JSON.parse(queues_redis_success)
		queues.success = list_success
	}

	res.send(queues)
})

router.post('/queue', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'clientes')

}, async (req, res) => {

	return 'ok'
	const xml_url = req.body.xml
	const cliente_id = req.body.id
	const cliente_nome = req.body.nome
	const empresa_id = req.query.empresa_id

	const user_data = JSON.parse(req.user_data)
	
	if(xml_url == undefined || xml_url == ''){
		res.send("XML não informado.")
		return
	}

	// Antes de baixar o arquivo, verifica se o cliente já está na fila
	const queue_key = `xml_queues:waiting:empresa_id:${empresa_id}`
	const queues_redis = await redis_client.get(queue_key)

	if(queues_redis){
		let index = JSON.parse(queues_redis).map(x => {
			return x.cliente_id
		}).indexOf(cliente_id)
		
		if(index > -1){
			res.send({success: 0, message: 'Esse cliente já está na fila de processamento de XML.'})
			return
		}
	}

	function writeToFile(filePath, arr){
		return new Promise((resolve, reject) => {
			const file = fs.createWriteStream(filePath);
			for (const row of arr) {
				file.write(row + "\n");
			}
			file.end();
			file.on("finish", () => { resolve(true); }); // not sure why you want to pass a boolean
			file.on("error", reject); // don't forget this!
		});
	}
	
	const xml_dir = `${__dirname}/storage/tmp_xml/${cliente_id}.xml`
	const writer = fs.createWriteStream(xml_dir)

	await axios({
		
		method: 'get',
		url: xml_url,
		responseType: 'stream',

	}).then(async resp => {
		if(resp.status){
			const pipe = await resp.data.pipe(writer)

			let queue_list = []
			let new_item = {
				cliente_nome: cliente_nome,
				cliente_id: cliente_id,
				user_nome: user_data.user_nome,
				data: moment().format("YYYY-MM-DD HH:mm:ss")
			}

			// Se não existir nenhuma fila para essa empresa
			if(queues_redis == null){
				queue_list.push(new_item)
			}else{
				let queues = JSON.parse(queues_redis)

				queues.push(new_item)

				queue_list = queues
			}

			redis_client.set(queue_key, queue_list, process.env.EXP_XML_QUEUES)

			// await clientesSchema.updateOne({'_id' : cliente_id}, {'$set' : {updated_at: moment().format('YYYY-MM-DD HH:mm:ss'), updated_by: 'Rotina do sistem'}}, {'upsert' : true})

			res.send({success: 1, message: 'XML adicionado a fila de atualização.'})
		}else{
			res.send({success: 1, message: 'Erro ao obter dados do XML.'})
		}
	})

})

router.delete('/remove_item_queue/:queue/:cliente_id', verifyJWT, verifyEmpresa, verifySuper, (req, res, next) => {

	verifyPermissions(req, res, next, 'clientes')

}, async (req, res) => {
	const empresa_id = req.query.empresa_id
	const queue = req.params.queue
	const cliente_id = req.params.cliente_id

	const queue_key = `xml_queues:${queue}:empresa_id:${empresa_id}`
	const queues_list = await redis_client.get(queue_key)

	if(queues_list == null){
		res.send({success: 1, message: 'Essa fila não existe.'})
		return
	}

	let index = JSON.parse(queues_list).map(x => {
		return x.cliente_id
	}).indexOf(cliente_id)

	if(index > -1){
		let new_queue = JSON.parse(queues_list)
				
		new_queue.splice(index, 1)
		
		redis_client.set(queue_key, new_queue, process.env.EXP_XML_QUEUES)

		res.send({success: 1, message: 'O item foi removido da fila.'})
	}else{
		res.send({success: 1, message: 'O item não existe na fila.'})
	}
})

export default router