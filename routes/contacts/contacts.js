import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

const router = express.Router()

import '../../models/contacts/contacts.js'
const contactsSchema = mongoose.model(`${process.env.MDB_PREFIX}contacts`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifyEmpresa from '../../middleware/valid_empresa.js'
import verifyPermissions from '../../middleware/valid_permissions.js'

import cache from '../../cache/cache.js'
cache.set('memory', 10, 'contacts')

router.get('/', verifyJWT, verifyEmpresa, (req, res, next) => {
	
	verifyPermissions(req, res, next, 'contacts')

}, async (req, res) => {
	
	const empresa_id = req.query.empresa_id
	let query = {
		empresa_id: mongoose.Types.ObjectId(empresa_id)
	}

	await contactsSchema.find(query).then(async resp => {
			
		let found_documents = resp.length > 0 ? resp.length : 0	
				
		res.send(outputMsg(true, resp, found_documents, null))
	})
})

router.get('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'contacts')

}, async (req, res) => {
	let id = req.params.id

	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await contactsSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)})

	if(resp == null){
		res.send(outputMsg(false, 'Contato não encontrado no banco de dados.'))
		return
	}

	res.send({success: 1, data: resp})
})


router.post('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'contacts')

}, async (req, res) => {
	let body = req.body

	if(body == undefined){
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	// Checa se já existe uma segmentação no banco com o mesmo nome
	const checkUnique = await contactsSchema.findOne({phone_ddd : body.fields.phone_ddd, phone: body.fields.phone}, {_id : 1})

	if(checkUnique != null){
		res.send(outputMsg(false, 'Número de telefone já cadastrado para outro contato.'))
		return
	}
	let insert = new contactsSchema({
		
		first_name: body.fields.first_name,
		last_name: body.fields.last_name,
		phone_ddd: body.fields.phone_ddd,
		phone: body.fields.phone,
		segmentation: body.fields.segmentation,
		empresa_id: mongoose.Types.ObjectId(req.query.empresa_id)
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

router.put('/rm/:id/:tag_id', verifyJWT, verifyEmpresa, (req, res, next) => {
	verifyPermissions(req, res, next, 'contacts')
}, async (req, res) => {
	let id = req.params.id
	let tag_id = req.params.tag_id


	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido e portanto a TAG não pôde ser removida.'))
		return
	}
	let contato = await contactsSchema.findById(id)

	if (contato) {
		for (let i = 0; i < contato.segmentation.length; i++) {
			if (contato.segmentation[i].toString() === tag_id) {
				contato.segmentation.splice(i, 1)
			}
		}
		await contactsSchema.updateOne({ _id: id }, contato)

		res.send(outputMsg(true, 'Removido com sucesso'))
	}
})


router.put('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'contacts')

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

	// Checa se já existe uma segmentação no banco com o mesmo nome
	const checkUnique = await contactsSchema.findOne({phone_ddd : body.fields.phone_ddd, phone: body.fields.phone}, {_id : 1})

	if(checkUnique != null && checkUnique._id != id){
		res.send(outputMsg(false, 'Número de telefone já cadastrado para outro contato.'))
		return
	}

	const new_data = {
		
		first_name: body.fields.first_name,
		last_name: body.fields.last_name,
		phone_ddd: body.fields.phone_ddd,
		phone: body.fields.phone,
		segmentation: body.fields.segmentation,
	}

	await contactsSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(async resp => {
		await cache.clear()
		res.send({success: 1, message: 'Contato atualizado com sucesso!'})
	})
	
})


router.delete('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {
	
	verifyPermissions(req, res, next, 'contacts')

}, async (req, res) => {

	let id = req.params.id
	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido e portanto a TAG não pôde ser removida.'))
		return
	}

	const resp = await contactsSchema.findOneAndDelete({_id : mongoose.Types.ObjectId(id)})
	
	if(resp == null){
		res.send(outputMsg(false, 'Registro não encontrado no sistema.'))
		return
	}

	res.send(outputMsg(true, 'Removido com sucesso'))
})

export default router