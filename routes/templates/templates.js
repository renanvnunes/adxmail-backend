import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

const router = express.Router()

import '../../models/templates/templates.js'
const templatesSchema = mongoose.model(`${process.env.MDB_PREFIX}templates`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifyEmpresa from '../../middleware/valid_empresa.js'
import verifyPermissions from '../../middleware/valid_permissions.js'

import cache from '../../cache/cache.js'
// cache.set('memory', 10, 'templates')
router.get('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'templates')

}, cache.set('memory', 360, 'templates'), async (req, res) => {
	
	const empresa_id = req.query.empresa_id

	let query = {
		empresa_id: mongoose.Types.ObjectId(empresa_id)
	}

	await templatesSchema.find(query).then(async resp => {
			
		let found_documents = resp.length > 0 ? resp.length : 0	
				
		res.send(outputMsg(true, resp, found_documents, null))
	})
})

router.get('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'templates')

}, async (req, res) => {
	let id = req.params.id

	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await templatesSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)})

	if(resp == null){
		res.send(outputMsg(false, 'Template não encontrado no sistema.'))
		return
	}

	res.send({success: 1, data: resp})
})

import SendPhoto from './send_photo.js'

router.post('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'templates')

}, async (req, res) => {
	let body = req.body

	if(body == undefined){
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	if(body.imagem_botao == null || body.imagem_botao == undefined || body.imagem_botao == ''){
		res.send(outputMsg(false, 'A imagem do botão deve ser informada.'))
		return
	}

	let user = JSON.parse(req.user_data)

	let img_topo_nome = null
	if(body.imagem_topo != null){

		let split_img_topo = body.imagem_topo.split("/")
		let type_img_topo = split_img_topo[1].split(";")[0]
		
		if(type_img_topo != 'jpg' && type_img_topo != 'jpeg' && type_img_topo != 'png' && type_img_topo != 'gif'){
			res.send({success: 0, message: 'Formato de imagem do topo não aceito, use apenas JPG, PNG ou GIT.'})
			return
		}
		
		img_topo_nome = `template_${Math.random()}.${type_img_topo}`
		SendPhoto.send(body.imagem_topo, img_topo_nome, type_img_topo, req.query.empresa_id, 700, 65)
	}

	let img_rodape_nome = null
	if(body.imagem_rodape != null){
		let split_img_rodape = body.imagem_rodape.split("/")
		let type_img_rodape = split_img_rodape[1].split(";")[0]
		
		if(type_img_rodape != 'jpg' && type_img_rodape != 'jpeg' && type_img_rodape != 'png' && type_img_rodape != 'gif'){
			res.send({success: 0, message: 'Formato de imagem do rodapé não aceita, use apenas JPG, PNG ou GIT.'})
			return
		}

		img_rodape_nome = `template_${Math.random()}.${type_img_rodape}`
		SendPhoto.send(body.imagem_rodape, img_rodape_nome, type_img_rodape, req.query.empresa_id, 700, 65)
	}

	let botao_nome = null
	if(body.imagem_botao != null){
		let split_img_botao = body.imagem_botao.split("/")
		let type_img_botao = split_img_botao[1].split(";")[0]
		
		if(type_img_botao != 'jpg' && type_img_botao != 'jpeg' && type_img_botao != 'png' && type_img_botao != 'gif'){
			res.send({success: 0, message: 'Formato de imagem do botão não aceito, use apenas JPG, PNG ou GIT.'})
			return
		}

		botao_nome = `template_${Math.random()}.${type_img_botao}`

		SendPhoto.send(body.imagem_botao, botao_nome, type_img_botao, req.query.empresa_id, 460, 100)
	}
	
	let insert = new templatesSchema({
		
		nome: body.nome.trim(),
		
		imagem_topo:   img_topo_nome,
		link_topo:     body.link_topo ? body.link_topo.trim() : null,
		imagem_rodape: img_rodape_nome,
		link_rodape:   body.link_rodape ? body.link_rodape.trim() : null,
		imagem_botao:  botao_nome,

		empresa_id: mongoose.Types.ObjectId(req.query.empresa_id),
		cliente_id: mongoose.Types.ObjectId(body.cliente_id),
		created_by: user.user_nome,
		updated_by: user.user_nome
		
	})
	
	await insert.save(async (error, success) => {
		if(error == null){
			res.status(201)
			await cache.clear()
			res.send(outputMsg(true, insert))
		}else{
			res.send(outputMsg(false, error))
		}
	})
})

router.put('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'templates')

}, async (req, res) => {	
	let body = req.body

	if(body == undefined){
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	let id = body.id

	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	if((body.imagem_botao == null || body.imagem_botao == '') && (body.atual_imagem_topo == null || body.atual_imagem_topo == '')){
		res.send(outputMsg(false, 'A imagem do botão deve ser informada.'))
		return
	}

	let image_topo = null
	let img_topo_novo_nome = null
	if(body.imagem_topo != null){

		let split_img_topo = body.imagem_topo.split("/")
		let type_img_topo = split_img_topo[1].split(";")[0]
		
		if(type_img_topo != 'jpg' && type_img_topo != 'jpeg' && type_img_topo != 'png' && type_img_topo != 'gif'){
			res.send({success: 0, message: 'Formato de imagem do topo não aceito, use apenas JPG, PNG ou GIT.'})
			return
		}
		
		img_topo_novo_nome = `template_${Math.random()}.${type_img_topo}`
		SendPhoto.send(body.imagem_topo, img_topo_novo_nome, type_img_topo, req.query.empresa_id, 700, 65)

		image_topo = img_topo_novo_nome
		SendPhoto.removeFile(body.atual_imagem_topo, req.query.empresa_id)
	}else{
		image_topo = body.atual_imagem_topo
	}

	let image_rodape = null
	let img_rodape_novo_nome = null
	if(body.imagem_rodape != null){
		
		let split_img_rodape = body.imagem_rodape.split("/")
		let type_img_rodape = split_img_rodape[1].split(";")[0]
		
		if(type_img_rodape != 'jpg' && type_img_rodape != 'jpeg' && type_img_rodape != 'png' && type_img_rodape != 'gif'){
			res.send({success: 0, message: 'Formato de imagem do topo não aceito, use apenas JPG, PNG ou GIT.'})
			return
		}
		
		img_rodape_novo_nome = `template_${Math.random()}.${type_img_rodape}`
		SendPhoto.send(body.imagem_rodape, img_rodape_novo_nome, type_img_rodape, req.query.empresa_id, 700, 65)

		image_rodape = img_rodape_novo_nome
		SendPhoto.removeFile(body.atual_imagem_rodape, req.query.empresa_id)
	}else{
		image_rodape = body.atual_imagem_rodape
	}

	let image_botao = null
	let img_botao_novo_nome = null
	if(body.imagem_botao != null){

		let split_img_botao = body.imagem_botao.split("/")
		let type_img_botao = split_img_botao[1].split(";")[0]
		
		if(type_img_botao != 'jpg' && type_img_botao != 'jpeg' && type_img_botao != 'png' && type_img_botao != 'gif'){
			res.send({success: 0, message: 'Formato de imagem do topo não aceito, use apenas JPG, PNG ou GIT.'})
			return
		}
		
		img_botao_novo_nome = `template_${Math.random()}.${type_img_botao}`
		SendPhoto.send(body.imagem_botao, img_botao_novo_nome, type_img_botao, req.query.empresa_id, 700, 65)

		image_botao = img_botao_novo_nome
		SendPhoto.removeFile(body.atual_imagem_botao, req.query.empresa_id)
	}else{
		image_botao = body.atual_imagem_botao
	}

	let user = JSON.parse(req.user_data)

	const new_data = {
		
		nome: body.nome.trim(),
		
		imagem_topo:   image_topo,
		link_topo:     body.link_topo ? body.link_topo.trim() : null,
		imagem_rodape: image_rodape,
		link_rodape:   body.link_rodape ? body.link_rodape.trim() : null,
		imagem_botao:  image_botao,		

		updated_by: user.user_nome,
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}

	await templatesSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(async resp => {
		await cache.clear()
		res.send({success: 1, message: 'Atualizado com sucesso.'})
	})
	
})

router.delete('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'templates')

}, async (req, res) => {

	let id = req.params.id
	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await templatesSchema.findOne({_id : mongoose.Types.ObjectId(id)}).remove()

	if(resp == null){
		res.send(outputMsg(false, 'Registro não encontrado no sistema.'))
		return
	}
	
	if(req.query.topo != null){
		SendPhoto.removeFile(req.query.topo, req.query.empresa_id)
	}

	if(req.query.rodape != null){
		SendPhoto.removeFile(req.query.rodape, req.query.empresa_id)
	}

	if(req.query.botao != null){
		SendPhoto.removeFile(req.query.botao, req.query.empresa_id)
	}

	res.send(outputMsg(true, 'Removido com sucesso'))
})

export default router