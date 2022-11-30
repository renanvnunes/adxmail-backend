import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

const router = express.Router()

import '../../models/emails/emails.js'
const emailsSchema = mongoose.model(`${process.env.MDB_PREFIX}emails`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifyEmpresa from '../../middleware/valid_empresa.js'
import verifyPermissions from '../../middleware/valid_permissions.js'
import redis_client from '../../connections/redis.js'

import cache from '../../cache/cache.js'

import '../../models/clientes/clientes.js'
router.get('/no-cache', async (req, res) => {

	const empresa_id = req.query.empresa_id

	let query = {
		empresa_id: mongoose.Types.ObjectId(empresa_id)
	}

	await emailsSchema.find(query).sort({created_at: -1}).then(async resp => {

		let found_documents = resp.length > 0 ? resp.length : 0

		res.send(outputMsg(true, resp, found_documents, null))
	})
})

router.get('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'emails')

}, cache.set('memory', 60, 'emails'), async (req, res) => {

	const empresa_id = req.query.empresa_id

	let query = {
		empresa_id: mongoose.Types.ObjectId(empresa_id)
	}
	
	await emailsSchema.find(query).sort({created_at: -1}).skip(0).limit(50).then(async resp => {
		let found_documents = resp.length > 0 ? resp.length : 0
		res.send(outputMsg(true, resp, found_documents, null))
	})
})

router.get('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'emails')

}, async (req, res) => {
	let id = req.params.id

	if (mongoose.isValidObjectId(id) == false) {
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await emailsSchema.findOne({ _id: mongoose.Types.ObjectId(req.params.id) })

	if (resp == null) {
		res.send(outputMsg(false, 'Cliente não encontrado no sistema.'))
		return
	}

	res.send({ success: 1, data: resp })
})

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '../../middleware/s3_client.js'
import fs from 'fs'
import Jimp from 'jimp'
import axios from 'axios'

router.post('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'emails')

}, async (req, res) => {
	let fields = req.body.fields

	if (fields == undefined) {
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	const empresa_id = req.query.empresa_id
	const user = JSON.parse(req.user_data)

	let image_dir = `storage/tmp_img/`

	let imagem_topo_adicional   = req.body.imagem_topo_adicional
	let imagem_rodape_adicional = req.body.imagem_rodape_adicional
	let link_topo_adicional     = req.body.link_topo_adicional
	let link_rodape_adicional   = req.body.link_rodape_adicional

	let image_topo_name = null
	if(imagem_topo_adicional != undefined && imagem_topo_adicional != null){

		image_topo_name = `email_${Math.random()}.jpg`
		const key_foto_topo = `${process.env.DO_SP_FOLDER}/company/${empresa_id}/emails/${image_topo_name}`
		
		const data = imagem_topo_adicional.replace(`data:image/jpeg;base64,`, '')
		const buffer = Buffer.from(data, "base64")
		
		Jimp.read(buffer, async (err, success) => {

			if (success) {
				await Jimp.read(success.resize(700, Jimp.AUTO).quality(70).write(image_dir + image_topo_name)).then(async () => {

					fs.readFile(image_dir + image_topo_name, async (error, file) => {

						const bucketParams = {
							Bucket: process.env.DO_SP_NAME,
							ContentType: `image/jpg`,
							Key: key_foto_topo,
							ACL: 'public-read',
							Body: file,
						}

						await s3Client.send(new PutObjectCommand(bucketParams))

						fs.unlinkSync(image_dir + image_topo_name)

					})

				})
			}

		}) 
	}

	let image_rodape_name = null
	if(imagem_rodape_adicional != undefined && imagem_rodape_adicional != null){

		image_rodape_name = `email_${Math.random()}.jpg`
		const key_foto_rodape = `${process.env.DO_SP_FOLDER}/company/${empresa_id}/emails/${image_rodape_name}`
		
		const data = imagem_rodape_adicional.replace(`data:image/jpeg;base64,`, '')
		const buffer = Buffer.from(data, "base64")
		
		Jimp.read(buffer, async (err, success) => {

			if (success) {
				await Jimp.read(success.resize(700, Jimp.AUTO).quality(70).write(image_dir + image_rodape_name)).then(async () => {

					fs.readFile(image_dir + image_rodape_name, async (error, file) => {

						const bucketParams = {
							Bucket: process.env.DO_SP_NAME,
							ContentType: `image/jpg`,
							Key: key_foto_rodape,
							ACL: 'public-read',
							Body: file,
						}

						await s3Client.send(new PutObjectCommand(bucketParams))

						fs.unlinkSync(image_dir + image_rodape_name)

					})

				})
			}

		}) 
	}
	
	const resize = async (url_img, img_name, image_dir) => {
		const image = await Jimp.read(url_img);
		await image.resize(400, Jimp.AUTO).quality(70);
		await image.writeAsync(`${image_dir}/${img_name}`);

		return img_name;
	}

	let produtos = []
	if(req.body.produtos.length > 0){

		// Baixa todas as imagens
		let imagens_baixadas = []
		for (let item of req.body.produtos) {

			await axios({
						
				method: 'get',
				url: item.foto,
				responseType: 'stream',

			}).then(async resp => {
				
				if(resp.status == 200){
					
					const image_name = `email_${Math.random()}.jpg`

					await resize(item.foto, image_name, image_dir)

					imagens_baixadas.push({
						name: image_name,
						path: image_dir + image_name,
						original_image:  item.foto
					})

					const key_foto = `${process.env.DO_SP_FOLDER}/company/${empresa_id}/emails/${image_name}`

					fs.readFile(image_dir + image_name, async (error, file) => {

						const bucketParams = {
							Bucket: process.env.DO_SP_NAME,
							ContentType: `image/jpg`,
							Key: key_foto,
							ACL: 'public-read',
							Body: file,
						}

						await s3Client.send(new PutObjectCommand(bucketParams))					
					})

					// await new Promise(r => setTimeout(r, 5000))
				
				}

			}).catch(error => {
				console.log('error - ' + item.foto)
				console.log(error)
				console.log()
			})
		}

		if(imagens_baixadas.length == 0){
			res.send({success: 0, message: 'Erro ao baixar as imagens dos produtos, tente novamente.'})
			return
		}

		for(let p of req.body.produtos){

			let parcelas = null
			let parcela_valor = null
			if(p.parcelas){
				for(let parc of p.parcelas){
					parcelas = parc['g:months'][0]
					parcela_valor = moneyBr(parc['g:amount'][0].replace('BRL', '').trim())
				}
			}

			let index = imagens_baixadas.map(x => {
				return x.original_image
			}).indexOf(p.foto)
		
			if(index > -1){
				fs.unlinkSync(imagens_baixadas[index].path)
			}

			produtos.push({
				nome: p.nome,
				preco: p.preco ? moneyBr(p.preco.replace('BRL', '').trim()) : null,
				preco_desconto: p.preco_desconto ? moneyBr(p.preco_desconto.replace('BRL', '').trim()) : null,
				foto: p.foto,
				link: p.link,
				col: p.col,
				parcelas: parcelas,
				parcela_valor: parcela_valor,
				foto_cdn: index > -1 ? imagens_baixadas[index].name : null
			})
		}
	}


	let insert = new emailsSchema({
		
		produtos: produtos,
		concluido: true,

		cliente_id: mongoose.Types.ObjectId(fields.cliente._id),
		empresa_id: mongoose.Types.ObjectId(empresa_id),

		nome : fields.nome,

		topo   : fields.template.imagem_topo,
		rodape : fields.template.imagem_rodape,

		link_topo   : fields.template.link_topo,
		link_rodape : fields.template.link_rodape,
		
		botao : fields.template.imagem_botao,
		obs   : fields.obs,

		facebook     : fields.cliente.facebook,
		instagram    : fields.cliente.instagram,
		youtube      : fields.cliente.youtube,
		tiktok       : fields.cliente.tiktok,

		imagem_rodape_adicional : image_rodape_name,

		topo_adicional: image_topo_name,
		topo_adicional_link: link_topo_adicional,

		rodape_adicional: image_rodape_name,
		rodape_adicional_link: link_rodape_adicional,

		created_by: user.user_nome,
		updated_by: user.user_nome,

		updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
		created_at: moment().format('YYYY-MM-DD HH:mm:ss'),

	})

	await insert.save(async (error, success) => {
		
		if(error == null){
			
			res.status(201)

			await cache.clear()
			
			res.send({success: true, message: 'E-mail salvo com sucesso.'})
		}else{
			res.send({success: true, message: 'Erro ao salvar o e-mail.'})
		}

	})
})


router.delete('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'emails')

}, async (req, res) => {

	let id = req.params.id
	if (mongoose.isValidObjectId(id) == false) {
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const item = await emailsSchema.findOne({ _id: mongoose.Types.ObjectId(id) }, {produtos: 1, empresa_id: 1})

	if(item == null){
		res.send(outputMsg(false, 'Produto não encontrado.'))
		return
	}

	for(let p of item.produtos){
		
		let params = {  
			Bucket: process.env.DO_SP_NAME, 
			Key: `${process.env.DO_SP_FOLDER}/company/${item.empresa_id}/emails/${p.foto_cdn}`,
		}

		s3Client.deleteObject(params)
	}

	const resp = await emailsSchema.findOne({ _id: mongoose.Types.ObjectId(id) }).remove()

	if (resp == null) {
		res.send(outputMsg(false, 'Registro não encontrado no sistema.'))
		return
	}

	res.send(outputMsg(true, 'Removido com sucesso'))
})

export default router