import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import redis_client from '../../connections/redis.js'

import moment from 'moment'

import '../../models/users/users.js'
import '../../models/users/users_perfis.js'
import '../../models/empresas.js'
import '../../models/planos.js'

const router = express.Router()

const usersSchema = mongoose.model(`${process.env.MDB_PREFIX}users`)
const usersProfileSchema = mongoose.model(`${process.env.MDB_PREFIX}users_perfis`)
const empresasSchema = mongoose.model(`${process.env.MDB_PREFIX}empresas`)
const planosSchema = mongoose.model(`${process.env.MDB_PREFIX}planos`)

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

router.post('/', async (req, res) => {	
	// Verifica se o usuário informou o e-mail e senha no body
	if(!req.body.email || !req.body.senha)
	{
		res.send({'success' : res.locals.error, 'message' : 'E-mail e senha não informados'})
		return
	}
	
	// Busca o usuário pelo e-mail
	await usersSchema.findOne({ email: req.body.email }).then(async resp_user => {
		
		if(resp_user == null)
		{
			res.send({'success' : res.locals.error, 'message' : 'E-mail e/ou senha não conferem'})
			return
		}
		
		// Verifica se a senha está correta
		if(bcrypt.compareSync(req.body.senha, resp_user.senha) == false)
		{
			res.send({'success' : res.locals.error, 'message' : 'E-mail e/ou senha não conferem'})
			return
		}

		// Verifica se o usuário possui ao menos uma empresa ativa em seu cadastro
		if(resp_user.empresas.length == 0)
		{
			res.send({'success' : res.locals.error, 'message' : 'Não foi possível liberar o acesso. Usuário sem empresa definida.'})
			return
		}
		
		// Gera o Jwt
		let token = jwt.sign({ _id: resp_user._id, super_user: resp_user.super_user}, process.env.JWT_KEY, { expiresIn: `${process.env.JWT_EXP}s` })

		if(token == false)
		{
			res.send({'success' : res.locals.error, 'message' : 'Erro ao gerar o token #1'})
			return
		}

		// Define a data de expiração do token
		let data_expire = moment().add(process.env.JWT_EXP, 'seconds').format("YYYY-MM-DD HH:mm:ss")
		
		resp_user.access_logs != undefined ? resp_user.access_logs.push({created_at: moment(new Date()).format("DD/MM/YYYY HH:mm")}) : {created_at: moment(new Date()).format("DD/MM/YYYY HH:mm")}

		// Atualiza o token e data de expiração no cadastro do usuário
		await usersSchema.updateOne({'_id' : resp_user._id}, {'$set' : {data_expire : data_expire, token : `token_${token}`, access_logs : resp_user.access_logs}}, {'upsert' : true}).then(async () => {

			// Busca o perfil do usuário
			await usersProfileSchema.findOne({ _id: mongoose.Types.ObjectId(resp_user.perfil_id)}).then(async resp_profile => {
				
				if(resp_profile == null)
				{
					res.send({'success' : res.locals.error, 'message' : 'Usuário sem perfil definido, entre em contato com administrador.'})
					return
				}

				// Adiciona a rota do módulo nos acessos do usuário
				let permissions_user = {}
				let i = 0
				for(i in resp_profile.acessos)
				{
					let acessos = resp_profile.acessos[i]
					
					permissions_user[acessos.rota] = {
						acessar     : parseInt(acessos.acessar),
						criar       : parseInt(acessos.criar),
						alterar     : parseInt(acessos.alterar),
						deletar     : parseInt(acessos.deletar),
						modulo_nome : acessos.nome,
						modulo_rota : acessos.rota
					}
				}				
				
				// Lista todas as empresas do usuário
				let empresas_user = []
				
				for(i in resp_user.empresas)
				{
					let empresa_id = resp_user.empresas[i]
					
					// Busca as empresas do usuário
					await empresasSchema.findOne({_id : mongoose.Types.ObjectId(empresa_id)}).then(async resp_empresa => {
						// Busca o plano de cada empresa
						
						if(resp_empresa != null)
						{
							let empresa_plano = null
							await planosSchema.findOne({_id : resp_empresa.plano_id}).then(resp_plano => {
								if(resp_plano != null)
								{
									empresa_plano = {	
										nome : resp_plano.nome
									}
								}
							})
							
							if(empresa_plano != null)
							{
								empresas_user.push({
									razao_social : resp_empresa.razao_social,
									cnpj : resp_empresa.cpf_cnpj,
									nome : resp_empresa.nome,
									id : {
										$oid : resp_empresa.id
									},
									plano : empresa_plano
								})

							}
						}
						
					})
				}

				if(empresas_user.length == 0)
				{
					res.send({'success' : res.locals.error, 'message' : 'Erro ao liberar o acesso do usuário. Usuário não possui empresas ativas ou suas empresas não possuem planos contratados..'})
					return
				}

				let retorno = {
					success : res.locals.success,
					data : {
						super_user : resp_user.super_user,
						user_nome  : resp_user.nome,
						user_id : resp_user._id,
						user_email  : resp_user.email,
						token       : `token_${token}`,
						data_expire : moment(data_expire).format("DD/MM/YYYY HH:mm:ss"),
						empresas    : empresas_user,
						permissions : permissions_user,
						// perfil_nome : resp_profile.nome
					}
				}

				// Salva as permissões do usuário no na memória Redis
				redis_client.set(`auth_users:_id:${resp_user._id}`, retorno.data, process.env.JWT_EXP)

				// Invertemos o token para dificultar qualquer ação no front-end
				retorno.data.token = `token_${retorno.data.token.replace('token_', '').split('').reverse().join('')}`

				res.send(retorno)
			})
			
		}).catch(err => {
			res.send({'success' : res.locals.error, 'message' : 'Erro ao gerar o token #2.' + err})
			return
		})


	}).catch(err =>{
		console.log(err)
	})

})

export default router