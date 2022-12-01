import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

const router = express.Router()

import '../../models/clientes/clientes.js'
const clientesSchema = mongoose.model(`${process.env.MDB_PREFIX}clientes`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifyEmpresa from '../../middleware/valid_empresa.js'
import verifyPermissions from '../../middleware/valid_permissions.js'

import cache from '../../cache/cache.js'

router.get('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'clientes')

}, async (req, res) => {
	
	const empresa_id = req.query.empresa_id

	let query = {
		empresa_id: mongoose.Types.ObjectId(empresa_id)
	}

	await clientesSchema.find(query).sort({nome: -1}).then(async resp => {
			
		let found_documents = resp.length > 0 ? resp.length : 0	
				
		res.send(outputMsg(true, resp, found_documents, null))
	})
})

router.get('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'clientes')

}, async (req, res) => {
	let id = req.params.id

	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await clientesSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)})

	if(resp == null){
		res.send(outputMsg(false, 'Cliente não encontrado no sistema.'))
		return
	}

	res.send({success: 1, data: resp})
})

router.post('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'clientes')

}, async (req, res) => {
	let fields = req.body.fields

	if(fields == undefined){
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	let user = JSON.parse(req.user_data)
	
	let insert = new clientesSchema({
		
		nome: fields.nome.trim(),
		site: fields.site.trim(),
		tipo: fields.tipo.trim(),
		status: fields.status,
		facebook: fields.facebook,
		instagram: fields.instagram,
		youtube: fields.youtube,
		tiktok: fields.tiktok,
		xml: fields.xml.trim(),
		empresa_id: mongoose.Types.ObjectId(req.query.empresa_id),
		created_by: user.user_nome,
		updated_by: user.user_nome
		
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

	verifyPermissions(req, res, next, 'clientes')

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

	let user = JSON.parse(req.user_data)
	
	const new_data = {
		nome: fields.nome,
		site: fields.site,
		tipo: fields.tipo.trim(),
		status: fields.status,
		xml: fields.xml,
		facebook: fields.facebook,
		instagram: fields.instagram,
		youtube: fields.youtube,
		tiktok: fields.tiktok,
		updated_by: user.user_nome,
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}

	await clientesSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(resp => {
		res.send({success: 1, message: 'Atualizado com sucesso.'})
	})
	
})

router.delete('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'clientes')

}, async (req, res) => {

	let id = req.params.id
	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await clientesSchema.findOne({_id : mongoose.Types.ObjectId(id)}).remove()

	if(resp == null){
		res.send(outputMsg(false, 'Registro não encontrado no sistema.'))
		return
	}
	
	res.send(outputMsg(true, 'Removido com sucesso'))
})

export default router