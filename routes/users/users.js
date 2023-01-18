import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

import bcrypt from 'bcrypt'

import '../../models/users/users.js'

const router = express.Router()

const usersSchema = mongoose.model(`${process.env.MDB_PREFIX}users`)
const empresasSchema = mongoose.model(`${process.env.MDB_PREFIX}empresas`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifyEmpresa from '../../middleware/valid_empresa.js'
import verifyPermissions from '../../middleware/valid_permissions.js'
import VeryfySuper from '../../middleware/valid_super.js'

router.get('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {

	const empresa_id = req.query.empresa_id
	const user_data = JSON.parse(req.user_data)

	let query = {
		empresas: empresa_id
	}

	if(user_data.super_user == 0){
		query.super_user = 0
	}

	await usersSchema.find(query).then(async resp => {
			
		let found_documents = resp.length > 0 ? resp.length : 0	
				
		res.send(outputMsg(true, resp, found_documents, null))
	})
})

router.get('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {
	let id = req.params.id

	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await usersSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)})

	if(resp == null){
		res.send(outputMsg(false, 'Usuário não encontrado no sistema.'))
		return
	}

	res.send({success: 1, data: resp})
})

router.post('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {
	
	let fields = req.body.fields
	if(fields == undefined)
	{
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	const user_data = JSON.parse(req.user_data)

	if(fields.super_user == 1 && user_data.super_user == 0)
	{
		res.send(outputMsg(false, 'Você não pode criar esse tipo de usuário.'))
		return
	}

	const consulta_email = await usersSchema.findOne({email : fields.email}, {_id : 1})

	if(consulta_email != null){
		res.send(outputMsg(false, 'Esse e-mail já está em uso por outro usuário.'))
		return
	}

	const hash = bcrypt.hashSync(fields.senha, 10)

	let insert = new usersSchema({

		nome: fields.nome.trim(),
		email: fields.email.trim(),
		empresas: [req.query.empresa_id],
		senha: hash,
		super_user: fields.super_user,
		perfil_id: mongoose.Types.ObjectId(fields.perfil_id),
		empresa_id: mongoose.Types.ObjectId(req.query.empresa_id),

	})
	
	await insert.save((error, success) => {
		if(error == null){
			res.status(201)
			res.send(outputMsg(true, insert))
		}else{
			res.send(outputMsg(false, error))
		}
	})
})

router.put('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {	
	let fields = req.body.fields
	if(fields == undefined){
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	let id = fields.id

	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const user = await usersSchema.findOne({_id : mongoose.Types.ObjectId(id)}, {_id : 1})

	if(user == null){
		res.send(outputMsg(false, 'Usuário não encontrado no sistema.'))
		return
	}

	const user_data = JSON.parse(req.user_data)

	if(fields.super_user == 1 && user_data.super_user == 0)
	{
		res.send(outputMsg(false, 'Você não pode alterar esse tipo de usuário.'))
		return
	}

	const consulta_email = await usersSchema.findOne({email : fields.email}, {_id : 1})

	if(consulta_email != null && consulta_email._id != fields.id){
		res.send(outputMsg(false, 'Esse e-mail já está em uso por outro usuário.'))
		return
	}

	let senha = ''
	if(fields.senha){
		senha = bcrypt.hashSync(fields.senha, 10)
	}else{
		senha = fields.senha_atual
	}
	
	const new_data = {
		nome: fields.nome,
		super_user: fields.super_user,
		senha: senha,
		email: fields.email,
		perfil_id: mongoose.Types.ObjectId(fields.perfil_id),
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}

	await usersSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(resp => {
		res.send({success: 1, message: 'Usuário atualizado com sucesso.'})
	})
	
})

router.delete('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'users')

}, async (req, res) => {

	let id = req.params.id
	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await usersSchema.findOne({_id : mongoose.Types.ObjectId(id)}).remove()

	if(resp == null){
		res.send(outputMsg(false, 'Usuário não encontrado no sistema.'))
		return
	}
	
	res.send(outputMsg(true, 'Usuário removido com sucesso'))
})

router.get('/empresas/:user_id', verifyJWT, VeryfySuper, async (req, res) => {
	
	let user_id = req.params.user_id

	if(mongoose.isValidObjectId(user_id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const user = await usersSchema.findOne({_id : mongoose.Types.ObjectId(user_id)}, {empresas: 1})
	
	if(user == null){
		res.send(outputMsg(false, 'Usuário não encontrado no sistema.'))
		return
	}

	const empresas = await empresasSchema.find({}, {_id : 1, nome: 1})

	let i = 0
	let arr_empresas = []
	for(i in empresas){
		arr_empresas.push({
			nome: empresas[i].nome,
			empresa_id: empresas[i]._id,
			checked: user.empresas.includes(empresas[i]._id),
		})
	}

	res.send({success: 1, data: arr_empresas})
})

router.put('/empresas/:user_id', verifyJWT, VeryfySuper, async (req, res) => {
	
	let user_id = req.params.user_id

	if(mongoose.isValidObjectId(user_id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const user = await usersSchema.findOne({_id : mongoose.Types.ObjectId(user_id)}, {empresas: 1})
	
	if(user == null){
		res.send(outputMsg(false, 'Usuário não encontrado no sistema.'))
		return
	}

	let i = 0
	let arr_empresas = []
	for(i in req.body.empresas){
		if(req.body.empresas[i].checked == true){
			arr_empresas.push(req.body.empresas[i].empresa_id)
		}
	}

	if(arr_empresas.length == 0){
		res.send(outputMsg(false, 'Ao menos uma empresa deve ser selecionada.'))
		return
	}

	const new_data = {
		empresas: arr_empresas,
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}

	await usersSchema.updateOne({'_id' : mongoose.Types.ObjectId(user_id)}, {'$set' : new_data}, {'upsert' : true}).then(resp => {
		res.send({success: 1, message: 'As empresas do usuário foram salvas.'})
	})

})

export default router