import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

import '../../models/empresas.js'

const router = express.Router()

const empresasSchema = mongoose.model(`${process.env.MDB_PREFIX}empresas`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifySuper from '../../middleware/valid_super.js'
// import cache from '../../cache/cache.js'
// cache.set('file', 30, 'empresas'), 

router.get('/', verifyJWT, verifySuper, async (req, res) => {
	
	await empresasSchema.find().then(async resp => {
			
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

	const resp = await empresasSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)})

	if(resp == null)
	{
		res.send(outputMsg(false, 'Empresa não encontrada no sistema.'))
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

	let user = JSON.parse(req.user_data)
	
	let insert = new empresasSchema({

		plano_id: mongoose.Types.ObjectId(req.body.fields.plano_id),
		nome: req.body.fields.nome.trim(),
		resp_nome: req.body.fields.resp_nome.trim(),
		resp_sobrenome: req.body.fields.resp_sobrenome,
		telefone: req.body.fields.telefone ? clearField(req.body.fields.telefone) : null,
		celular: req.body.fields.telefone ? clearField(req.body.fields.celular) : null,
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

	const resp = await empresasSchema.findOne({_id : mongoose.Types.ObjectId(id)}, {_id : 1})

	if(resp == null)
	{
		res.send(outputMsg(false, 'Empresa não encontrada no sistema.'))
		return
	}

	let user = JSON.parse(req.user_data)
	
	const new_data = {
		
		nome: req.body.fields.nome.trim(),
		resp_nome: req.body.fields.resp_nome.trim(),
		resp_sobrenome: req.body.fields.resp_sobrenome,
		telefone: clearField(req.body.fields.telefone),
		celular: clearField(req.body.fields.celular),
		updated_by: user.user_nome,
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}

	await empresasSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(() => {
		res.send({success: 1, message: 'Empresa atualizada com sucesso.'})
	})
	
})

router.put('/change_plan', verifyJWT, verifySuper, async (req, res) => {

	let plano_id = req.body.plano_id
	let empresa_id = req.body.empresa_id
	
	if(mongoose.isValidObjectId(plano_id) == false || mongoose.isValidObjectId(empresa_id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const resp = await empresasSchema.findOne({_id : mongoose.Types.ObjectId(empresa_id)}, {_id : 1})

	if(resp == null)
	{
		res.send(outputMsg(false, 'Empresa não encontrada no sistema.'))
		return
	}

	let user = JSON.parse(req.user_data)
	
	const new_data = {
		plano_id: mongoose.Types.ObjectId(plano_id),
		updated_by: user.user_nome,
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}

	await empresasSchema.updateOne({'_id' : empresa_id}, {'$set' : new_data}, {'upsert' : true}).then(() => {
		res.send({success: 1, message: 'O plano da empresa foi atualizado.'})
	})
	
})

export default router