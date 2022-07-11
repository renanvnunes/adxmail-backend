import express from 'express'
import mongoose from 'mongoose'
// import moment from 'moment'

const router = express.Router()

// import '../../models/emails/emails.js'
// const emailsSchema = mongoose.model(`${process.env.MDB_PREFIX}emails`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifyEmpresa from '../../middleware/valid_empresa.js'
import verifyPermissions from '../../middleware/valid_permissions.js'
import redis_client from '../../connections/redis.js'

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
		public_cdn: `${process.env.DO_SP_PUBLIC_CDN}/${process.env.DO_SP_FOLDER}/company/${email.empresa_id}`
	}

	res.render('html', render)
})

router.post('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'emails')

}, async (req, res) => {

	// await new Promise(r => setTimeout(r, 4000));

	const user = JSON.parse(req.user_data)
	const fields = req.body.fields
	const products = req.body.products
	const empresa_id = req.query.empresa_id

	if(fields.cliente_id == 0 || products.length == 0){
		res.send({success: 1, message: 'Não há dados suficiente para iniciar um e-mail.'})
		return
	}

	const key = `emails:empresa_id:${empresa_id}:user_id:${user.user_id}`

	let produtos = []
	for(let p of products){
		produtos.push({
			nome: p.nome,
			preco: p.preco,
			preco: p.preco,
			foto: p.foto,
			link: p.link,
			col: p.col
		})
	}

	const body_email = {
		empresa_id   : empresa_id,
		user_id      : user.user_id,
		cliente_id   : fields.cliente_id,
		nome         : fields.nome,
		topo         : fields.template.imagem_topo ? fields.template.imagem_topo : null,
		rodape       : fields.template.imagem_rodape ? fields.template.imagem_rodape: null,
		botao        : fields.template.imagem_botao ? fields.template.imagem_botao : null,
		link_topo    : fields.template.link_topo,
		link_rodape  : fields.template.link_rodape,
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