import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

const router = express.Router()

import '../../models/segmentations/segmentations.js'
const segmentationsSchema = mongoose.model(`${process.env.MDB_PREFIX}segmentations`)

import '../../models/contacts/contacts.js'
const contactsSchema = mongoose.model(`${process.env.MDB_PREFIX}contacts`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifyEmpresa from '../../middleware/valid_empresa.js'
import verifyPermissions from '../../middleware/valid_permissions.js'

import cache from '../../cache/cache.js'

cache.set('memory', 10, 'segmentations')

router.get('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'segmentations')

}, async (req, res) => {
	
	const empresa_id = req.query.empresa_id
	let query = {
		empresa_id: mongoose.Types.ObjectId(empresa_id)
	}

	await segmentationsSchema.find(query).then(async resp => {
			
		let found_documents = resp.length > 0 ? resp.length : 0	
				
		res.send(outputMsg(true, resp, found_documents, null))
	})
})

router.get('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'segmentations')

}, async (req, res) => {
	let id = req.params.id

	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await segmentationsSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)})

	if(resp == null){
		res.send(outputMsg(false, 'Segmentação não encontrada no banco de dados.'))
		return
	}

	res.send({success: 1, data: resp})
})


router.post('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'segmentations')

}, async (req, res) => {
	let body = req.body

	if(body == undefined){
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	// Checa se já existe uma segmentação no banco com o mesmo nome
	const checkUnique = await segmentationsSchema.findOne({tag_name : body.fields.tag_name}, {_id : 1})

	if(checkUnique != null){
		res.send(outputMsg(false, 'Já existe uma segmentação criada com este nome disponível para uso.'))
		return
	}
	
	let insert = new segmentationsSchema({
		
		tag_name: body.fields.tag_name,
		tag_color: body.fields.tag_color,
		empresa_id: mongoose.Types.ObjectId(req.query.empresa_id),		
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

	verifyPermissions(req, res, next, 'segmentations')

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
	const checkUnique = await segmentationsSchema.findOne({tag_name : body.fields.tag_name}, {_id : 1})

	if(checkUnique != null && checkUnique._id != id){
		res.send(outputMsg(false, 'Já existe uma segmentação criada com este nome disponível para uso.'))
		return
	}

	const new_data = {
		
		tag_name: body.fields.tag_name,
		tag_color: body.fields.tag_color,
	}

	await segmentationsSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(async resp => {
		await cache.clear()
		res.send({success: 1, message: 'Segmentação atualizada com sucesso!'})
	})
	
})

router.delete('/:id', verifyJWT, verifyEmpresa, (req, res, next) => {
	
	verifyPermissions(req, res, next, 'segmentations')

}, async (req, res) => {

	let id = req.params.id
	if(mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código informado é inválido e portanto a TAG não pôde ser removida.'))
		return
	}

	const resp = await segmentationsSchema.findOneAndDelete({_id : mongoose.Types.ObjectId(id)})

	if(resp == null){
		res.send(outputMsg(false, 'Registro não encontrado no sistema.'))
		return
	}
	res.send(outputMsg(true, 'Removido com sucesso'))

	const empresa_id = req.query.empresa_id
	await contactsSchema.find({ empresa_id: mongoose.Types.ObjectId(empresa_id) }).then(async resp => {
		if (resp.length > 0) {
			for (let i = 0; i < resp.length; i++) {
				for (let j = 0; j < resp[i].segmentation.length; j++) {
					if (resp[i].segmentation[j].toString() === id) {
						resp[i].segmentation.splice(j, 1)

						await contactsSchema.updateOne({ _id: resp[i]._id }, resp[i])
					}
				}
			}
		}

	})

})

export default router