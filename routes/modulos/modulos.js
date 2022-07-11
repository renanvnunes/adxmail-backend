import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

import '../../models/modulos.js'

const router = express.Router()

const modulosSchema = mongoose.model(`${process.env.MDB_PREFIX}modulos`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifySuper from '../../middleware/valid_super.js'

router.get('/', verifyJWT, verifySuper, async (req, res) => {
	
	await modulosSchema.find().then(async resp => {
			
		let found_documents = resp.length > 0 ? resp.length : 0	
				
		res.send(outputMsg(true, resp, found_documents, null))
	})
})

router.get('/:id', verifyJWT, verifySuper, async (req, res) => {
	let id = req.params.id

	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await modulosSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)})

	if(resp == null)
	{
		res.send(outputMsg(false, 'Módulo não encontrado no sistema.'))
		return
	}

	res.send({success: 1, data: resp})
})

router.post('/', verifyJWT, verifySuper, async (req, res) => {
	if(req.body.fields == undefined)
	{
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}
	
	let insert = new modulosSchema({

		nome: req.body.fields.nome.trim(),
		rota: req.body.fields.rota.trim()

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

router.put('/', verifyJWT, verifySuper, async (req, res) => {	
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

	const plano = await modulosSchema.findOne({_id : mongoose.Types.ObjectId(id)}, {_id : 1})

	if(plano == null)
	{
		res.send(outputMsg(false, 'Plano não encontrado no sistema.'))
		return
	}
	
	const new_data = {
		nome: fields.nome,
		rota: fields.rota,
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}
	await modulosSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(resp => {
		res.send({success: 1, message: 'Plano atualizado com sucesso.'})
	})
	
})

router.delete('/:id', verifyJWT, verifySuper, async (req, res) => {
	let id = req.params.id
	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await modulosSchema.findOne({_id : mongoose.Types.ObjectId(id)}).remove()

	if(resp == null)
	{
		res.send(outputMsg(false, 'Módulo não encontrado no sistema.'))
		return
	}
	
	res.send(outputMsg(true, 'Módulo removido com sucesso'))
})

export default router