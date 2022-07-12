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

router.get('/public/:id', async (req, res, next) => {
	const id = req.params.id

	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const email = await emailsSchema.findOne({ _id: mongoose.Types.ObjectId(id) }, {empresa_id: 1, nome: 1, topo: 1, rodape: 1, botao: 1, link_topo: 1, link_rodape: 1, produtos: 1, migrado: 1, facebook: 1, instagram: 1, youtube: 1, tiktok: 1})

	if(email == null){
		res.send(outputMsg(false, 'E-mail não encontrado.'))
		return
	}

	const public_cdn = `${process.env.DO_SP_PUBLIC_CDN}/${process.env.DO_SP_FOLDER}/company/${email.empresa_id}`

	for(let i in email.produtos){
		let p = email.produtos[i]

		if(p.col == 12){
			email.produtos[i].col = 100
			email.produtos[i].col2 = 650
		}
		
		if(p.col == 6){
			email.produtos[i].col = 340
			email.produtos[i].col2 = 300
		}
		
		if(p.col == 4){
			email.produtos[i].col = 226
			email.produtos[i].col2 = 180
		}
		
		email.produtos[i].foto = email.migrado == false ? `${public_cdn}/emails/${p.foto_cdn}` : p.foto
	}

	let email_render = {
		_id: email._id,
		nome: email.nome,
		topo: email.topo,
		link_topo: email.link_topo,
		link_rodape: email.link_rodape,
		rodape: email.rodape,
		botao: email.botao,
		facebook: email.facebook,
		instagram: email.instagram,
		youtube: email.youtube,
		tiktok: email.tiktok,
		produtos: email.produtos,
	}

	let render = {
		email: email_render,
		redirect_base: process.env.HTML_REDIRECT_BASE,
		public_cdn: public_cdn
	}

	res.render('html', render)
})

router.get('/', async (req, res, next) => {

	const empresa_id = req.query.empresa_id
	const user_id = req.query.user_id

	const key = `emails:empresa_id:${empresa_id}:user_id:${user_id}`
	let get_email = await redis_client.get(key)
	let email = JSON.parse(get_email)

	if(email == null){
		res.render('sem_dados', {})
		return
	}

	// email.public_cdn = 'process.env.DO_SP_PUBLIC_CDN'
	for(let i in email.produtos){
		let p = email.produtos[i]

		if(p.col == 12){
			email.produtos[i].col = 100
			email.produtos[i].col2 = 650
		}
		
		if(p.col == 6){
			email.produtos[i].col = 340
			email.produtos[i].col2 = 300
		}
		
		if(p.col == 4){
			email.produtos[i].col = 226
			email.produtos[i].col2 = 180
		}
	}
	
	let render = {
		email: email,
		redirect_base: process.env.HTML_REDIRECT_BASE,
		public_cdn: `${process.env.DO_SP_PUBLIC_CDN}/${process.env.DO_SP_FOLDER}/company/${email.empresa_id}`
	}

	res.render('html', render)
})

router.post('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'emails')

}, async (req, res) => {

	const user = JSON.parse(req.user_data)
	const fields = req.body.fields
	const products = req.body.products
	const empresa_id = req.query.empresa_id

	if(fields.cliente._id == undefined || fields.cliente._id == 0 || products.length == 0){
		res.send({success: 1, message: 'Não há dados suficiente para iniciar um e-mail.'})
		return
	}

	const key = `emails:empresa_id:${empresa_id}:user_id:${user.user_id}`

	let produtos = []
	
	for(let p of products){
		produtos.push({
			nome: p.nome,
			preco: p.preco ? moneyBr(p.preco.replace('BRL', '').trim()) : null,
			preco_desconto: p.preco_desconto ? moneyBr(p.preco_desconto.replace('BRL', '').trim()) : null,
			foto: p.foto,
			link: p.link,
			col: p.col
		})
	}

	const body_email = {
		empresa_id   : empresa_id,
		user_id      : user.user_id,
		cliente_id   : fields.cliente._id,
		nome         : fields.nome,
		topo         : fields.template.imagem_topo ? fields.template.imagem_topo : null,
		rodape       : fields.template.imagem_rodape ? fields.template.imagem_rodape: null,
		botao        : fields.template.imagem_botao ? fields.template.imagem_botao : null,
		link_topo    : fields.template.link_topo,
		link_rodape  : fields.template.link_rodape,
		facebook     : fields.cliente.facebook,
		instagram    : fields.cliente.instagram,
		youtube      : fields.cliente.youtube,
		tiktok       : fields.cliente.tiktok,
		produtos     : produtos
	}

	await redis_client.set(key, body_email, 3000)

	// const fields = req.body
	res.send({success: 1, message: 'E-mail temporário salvo/atualizado.'})
})

router.delete('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'emails')

}, async (req, res) => {

	const user = JSON.parse(req.user_data)
	const empresa_id = req.query.empresa_id

	const key = `emails:empresa_id:${empresa_id}:user_id:${user.user_id}`

	await redis_client.del(key)

	res.send({success: 1, message: 'E-mail temporário removido.'})

})

export default router