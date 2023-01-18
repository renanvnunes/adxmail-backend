import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

import '../../models/users/users.js'
import '../../models/users/users_perfis.js'
import '../../models/empresas.js'
import '../../models/planos.js'
import '../../models/modulos.js'

const router = express.Router()

const usersSchema       = mongoose.model(`${process.env.MDB_PREFIX}users`)
const usersPerfisSchema = mongoose.model(`${process.env.MDB_PREFIX}users_perfis`)
const planosSchema      = mongoose.model(`${process.env.MDB_PREFIX}planos`)
const modulosSchema     = mongoose.model(`${process.env.MDB_PREFIX}modulos`)
const empresasSchema    = mongoose.model(`${process.env.MDB_PREFIX}empresas`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifyEmpresa from '../../middleware/valid_empresa.js'
import verifyPermissions from '../../middleware/valid_permissions.js'

router.get('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {
	const empresa_id = req.query.empresa_id

	await usersPerfisSchema.find({empresa_id: mongoose.Types.ObjectId(empresa_id)}).then(async resp_perfis => {
			
		let found_documents = resp_perfis.length > 0 ? resp_perfis.length : 0	
				
		res.send(outputMsg(true, resp_perfis, found_documents, null))
	})
})


router.get('/modulos/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {
	
	const id = req.params.id

	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código do perfil deve ser informado corretamente.'))
		return
	}

	const empresa_id = req.query.empresa_id

	const empresa = await empresasSchema.findOne({_id: mongoose.Types.ObjectId(empresa_id)}, {plano_id: 1})

	const perfil = await usersPerfisSchema.findOne({_id: mongoose.Types.ObjectId(id), empresa_id: mongoose.Types.ObjectId(empresa_id)})
	
	if(perfil == null)
	{
		res.send(outputMsg(false, 'Perfil não encontrado.'))
		return
	}
	
	const plano = await planosSchema.findOne({_id: empresa.plano_id})

	if(plano == null)
	{
		res.send(outputMsg(false, 'Plano não encontrado.'))
		return
	}
	
	const modulos = await modulosSchema.find({}, {nome: 1, rota: 1, _id: 0})
	
	if(modulos == null)
	{
		res.send(outputMsg(false, 'Não há módulos cadastrados no sistema.'))
		return
	}

	let m = 0
	let modulos_refined = {}
	for(m in modulos){
		modulos_refined[modulos[m].rota] = {
			rota: modulos[m].rota,
			nome: modulos[m].nome
		}
	}

	let arr_perfil = []
	let i = 0
	for(i in perfil.acessos){
		let acesso = perfil.acessos[i]
		
		arr_perfil[acesso.rota] = {
			acessar : parseInt(acesso.acessar),
			criar   : parseInt(acesso.criar),
			alterar : parseInt(acesso.alterar),
			deletar : parseInt(acesso.deletar)
		}
	}

	Object.keys(modulos_refined).map((key) => [Number(key), modulos_refined[key]])

	let arr_modulos = []
	let r = 0
	for(r in plano.rotas){
		
		let modulo = modulos_refined[plano.rotas[r]]
		
		if(modulo != undefined)
		{
			arr_modulos.push({
				'nome'    : modulo.nome,
				'rota'    : modulo.rota,
				'acessar' : arr_perfil[modulo.rota] != undefined && arr_perfil[modulo.rota].acessar ? 1 : 0,
				'criar'   : arr_perfil[modulo.rota] != undefined && arr_perfil[modulo.rota].criar   ? 1 : 0,
				'alterar' : arr_perfil[modulo.rota] != undefined && arr_perfil[modulo.rota].alterar ? 1 : 0,
				'deletar' : arr_perfil[modulo.rota] != undefined && arr_perfil[modulo.rota].deletar ? 1 : 0
			})
		}
	}
	
	res.send({success: 1, data: arr_modulos})
})

router.get('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {
	let id = req.params.id

	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await usersPerfisSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)})

	if(resp == null)
	{
		res.send(outputMsg(false, 'Perfil não encontrado no sistema.'))
		return
	}

	res.send({success: 1, data: resp})
})

router.post('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {
	if(req.body.fields == undefined)
	{
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	let user = JSON.parse(req.user_data)
	
	let insert = new usersPerfisSchema({

		nome: req.body.fields.nome.trim(),
		empresa_id: mongoose.Types.ObjectId(req.query.empresa_id),
		created_by: user.user_nome,
		updated_by: user.user_nome

	})
	
	await insert.save((error, success) => {
		if(error == null)
		{
			res.status(201)
			res.send(outputMsg(true, insert))
		}
		else
		{
			res.send(outputMsg(false, error))
		}
	})
})

router.put('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {	
	let fields = req.body.fields
	if(fields == undefined)
	{
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	let id = fields.id

	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const perfil = await usersPerfisSchema.findOne({_id : mongoose.Types.ObjectId(id)}, {_id : 1})

	if(perfil == null)
	{
		res.send(outputMsg(false, 'Perfil não encontrado no sistema.'))
		return
	}

	let user = JSON.parse(req.user_data)
	
	const new_data = {
		nome: fields.nome,
		updated_by: user.user_nome,
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}
	await usersPerfisSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(resp => {
		res.send({success: 1, message: 'Perfil atualizado com sucesso.'})
	})
	
})

router.put('/modulos/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {	
	let acessos = req.body.acessos
	if(acessos == undefined)
	{
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	let id = req.params.id

	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const perfil = await usersPerfisSchema.findOne({_id : mongoose.Types.ObjectId(id)}, {_id : 1})

	if(perfil == null)
	{
		res.send(outputMsg(false, 'Perfil não encontrado no sistema.'))
		return
	}

	let user = JSON.parse(req.user_data)
	
	const new_data = {
		acessos: acessos,
		updated_by: user.user_nome,
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}

	await usersPerfisSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(resp => {
		res.send({success: 1, message: 'Perfil atualizado com sucesso.'})
	})
	
})

router.delete('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {
	let id = req.params.id
	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	// Verifica se existem usuários utilizando esse perfil
	const users = await usersSchema.find({perfil_id : mongoose.Types.ObjectId(id)})

	if(users.length > 0)
	{
		res.send(outputMsg(false, 'Erro ao remover o perfil. Existem '+users.length+' usuários associadas a ele.'))
		return
	}

	const perfil = await usersPerfisSchema.findOne({_id : mongoose.Types.ObjectId(id)}).remove()

	if(perfil == null)
	{
		res.send(outputMsg(false, 'Perfil não encontrado no sistema.'))
		return
	}
	
	res.send(outputMsg(true, 'Perfil removido com sucesso'))
})

export default router