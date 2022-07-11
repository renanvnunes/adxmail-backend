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

// import '../../models/emails/emails_old.js'
// const emailsAntigosSchema = mongoose.model(`${process.env.MDB_PREFIX}emails_olds`)

// import '../../models/emails/produtos_old.js'
// const produtosAntigosSchema = mongoose.model(`${process.env.MDB_PREFIX}produtos_olds`)

import '../../models/clientes/clientes.js'
// const clientesSchema = mongoose.model(`${process.env.MDB_PREFIX}clientes`)

// router.get('/migrate', async (req, res, next) => {
	
// 	const email_old = await emailsAntigosSchema.findOne().limit( 1 )

// 	const cliente = await clientesSchema.findOne({old_id: email_old.empresa_id})

// 	if(cliente == null){
// 		await emailsAntigosSchema.findOne({ _id: email_old._id }).remove()
// 		res.send("email sem empresa")
// 		return
// 	}

// 	const produtos_old = await produtosAntigosSchema.find({ email_id: email_old.old_id })

// 	let produtos = []
// 	for(let p of produtos_old){
// 		produtos.push({
// 			nome: p.nome,
// 			preco: p.preco,
// 			preco_desconto: p.preco_desconto,
// 			foto: p.foto,
// 			foto_cdn: p.foto,
// 			col: parseInt(p.col),
// 			parcelas: p.installment_months,
// 			parcelas_valor: p.installment_amount,
// 			link: p.link,
// 		})
// 	}
	
// 	let email = {
// 		concluido: true,
// 		migrado: true,
// 		nome: email_old.nome,
// 		cliente_id: cliente._id,
// 		empresa_id: mongoose.Types.ObjectId('61cc4a60237cdf2da12f4c42'),

// 		topo: email_old.topo,
// 		rodape: email_old.rodape,
// 		botao: email_old.botao,
// 		link_rodape: email_old.link_rodape,
// 		link_topo: email_old.link_topo,
// 		created_by: email_old.user_nome,
// 		updated_by: email_old.user_nome,

// 		facebook: email_old.facebook,
// 		instagram: email_old.instagram,
// 		youtube: email_old.youtube,
// 		tiktok: email_old.tiktok,

// 		topo_adicional: email_old.topo_adicional,
// 		topo_adicional_link: email_old.topo_adicional_link,
// 		rodape_adicional: email_old.rodape_adicional,
// 		rodape_adicional_link: email_old.rodape_adicional_link,

// 		produtos: produtos
// 	}

// 	let insert = new emailsSchema(email)
// 	await insert.save(async (error, success) => {
// 		// console.log(error)
// 		// console.log(success)

// 		if(success){
// 			await emailsAntigosSchema.findOne({ _id: email_old._id }).remove()
// 			res.send(email)
// 		}else{
// 			res.send('erro')
// 		}
// 	})

// })

router.get('/', cache.set('memory', 3600, 'emails'), verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'emails')

}, async (req, res) => {

	const empresa_id = req.query.empresa_id

	let query = {
		empresa_id: mongoose.Types.ObjectId(empresa_id)
	}

	await emailsSchema.find(query).sort({created_at: -1}).then(async resp => {

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

	// Busca o e-mail temporário no redis
	const key = `emails:empresa_id:${empresa_id}:user_id:${user.user_id}`
	let get_email = await redis_client.get(key)
	let email = JSON.parse(get_email)

	if (email == null) {
		res.send(outputMsg(false, 'Esse e-mail não pode ser salvo.'))
		return
	}

	let image_dir = `storage/tmp_img/`

	let produtos = []
	for (let item of email.produtos) {

		const image_name = `email_${Math.random()}.jpg`
		const key_foto = `${process.env.DO_SP_FOLDER}/company/${empresa_id}/emails/${image_name}`

		item.foto_cdn = image_name

		produtos.push(item)

		// Obtem a foto pela URL
		Jimp.read(item.foto).then(async image => {

			await image.getBase64Async(Jimp.MIME_JPEG).then(async base64 => {

				const data = base64.replace(`data:image/jpeg;base64,`, '')
				const buffer = Buffer.from(data, "base64")

				await Jimp.read(buffer, async (err, success) => {

					if (success) {
						await Jimp.read(success.resize(400, Jimp.AUTO).quality(70).write(image_dir + image_name)).then(async () => {

							fs.readFile(image_dir + image_name, async (error, file) => {

								const bucketParams = {
									Bucket: process.env.DO_SP_NAME,
									ContentType: `image/jpg`,
									Key: key_foto,
									ACL: 'public-read',
									Body: file,
								}

								await s3Client.send(new PutObjectCommand(bucketParams))

								fs.unlinkSync(image_dir + image_name)

							})

						})
					}

				})

			})
		})

	}

	let insert = new emailsSchema({
		
		produtos: produtos,
		concluido: true,

		cliente_id: mongoose.Types.ObjectId(fields.cliente._id),
		empresa_id: mongoose.Types.ObjectId(empresa_id),

		nome: fields.nome,

		topo: email.topo,
		rodape: email.rodape,
		botao: email.botao,
		obs: fields.obs,

		facebook     : fields.cliente.facebook,
		instagram    : fields.cliente.instagram,
		youtube      : fields.cliente.youtube,
		tiktok       : fields.cliente.tiktok,

		created_by: user.user_nome,
		updated_by: user.user_nome

	})

	await insert.save(async (error, success) => {
		
		if(error == null){
			await redis_client.del(key)

			res.status(201)
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