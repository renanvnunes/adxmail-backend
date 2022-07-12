import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'
import bcrypt from 'bcrypt'

import '../../models/users/users.js'
import '../../models/users/users_perfis.js'
import '../../models/empresas.js'
import '../../models/planos.js'
import '../../middleware/nodemailer.js'

const router = express.Router()

const usersSchema = mongoose.model(`${process.env.MDB_PREFIX}users`)

router.post('/change_pass', async (req, res) => {

	if(req.body.code == '' || req.body.code == undefined || req.body.senha == '' || req.body.senha == undefined){
		res.send({ 'success': res.locals.error, 'message': 'Payload não informado.' })
		return
	}

	await usersSchema.findOne({ recup_code: req.body.code.replaceAll(' ', '').trim() }).then(async resp_user => {
		if(resp_user == null){
			res.send({ 'success': res.locals.error, 'message': 'Erro ao validar o código informado.' })
		}else{
			const hash = bcrypt.hashSync(req.body.senha, 10)

			const new_data = {
				recup_code: '',
				senha: hash,
				token: '',
				updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
			}

			await usersSchema.updateOne({'_id' : mongoose.Types.ObjectId(resp_user._id)}, {'$set' : new_data}, {'upsert' : true}).then(() => {
				
				res.send({ 'success': res.locals.success, 'message': 'Sua senha foi atualizada, você já pode fazer login.'})

			}).catch(() => {

				res.send({ 'success': res.locals.error, 'message': 'Erro ao atualizar sua senha, entre em contato com suporte.' })

			})
		}
	})
})

router.post('/', async (req, res) => {

	// Verifica se o usuário informou o e-mail e senha no body
	if (!req.body.email || req.body.email == '') {
		res.send({ 'success': res.locals.error, 'message': 'E-mail não informado.' })
		return
	}

	// Busca o usuário pelo e-mail
	await usersSchema.findOne({ email: req.body.email }).then(async resp_user => {

		if (resp_user == null) {
			res.send({ 'success': res.locals.error, 'message': 'E-mail não encontrado.' })
		} else {
			
			try{
				let type = process.env.SMTP_TYPE_ENVIO
				let code = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`
				let msg_body = `Olá, use o código abaixo para criar uma nova senha no Adxmail:<br /><h3>${code}</h3><br />Desconsidere caso você não tenha solicitado esse e-mail.`
				let enviaEmail = await sendMail(type, 'renan.dev@hotmail.com', 'Use esse código para criar uma nova senha no ADXMail', msg_body)
				
				if(type == 'test'){
					console.log(enviaEmail)
				}

				const new_data = {
					recup_code: code.replaceAll(' ', ''),
					updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
				}

				await usersSchema.updateOne({'_id' : mongoose.Types.ObjectId(resp_user._id)}, {'$set' : new_data}, {'upsert' : true}).then(() => {
					
					res.send({ 'success': res.locals.success, 'message': 'Verificação realizada, verifique a caixa de entrada do seu e-mail.' })

				}).catch(() => {

					res.send({ 'success': res.locals.error, 'message': 'Erro ao enviar o e-mail, entre em contato com suporte.' })

				})
				
			}catch(e){
				res.send({ 'success': res.locals.error, 'message': 'Erro ao enviar o e-mail, entre em contato com suporte.' })
			}

		}

	}).catch(err => {
		res.send({ 'success': res.locals.error, err })
	})

})

export default router