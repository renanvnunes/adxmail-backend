import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'

import '../../models/users/users.js'
import '../../models/users/users_perfis.js'
import '../../models/empresas.js'
import '../../models/planos.js'
import '../../models/modulos.js'

const router = express.Router()

const planosSchema = mongoose.model(`${process.env.MDB_PREFIX}planos`)
const modulosSchema = mongoose.model(`${process.env.MDB_PREFIX}modulos`)
const empresasSchema = mongoose.model(`${process.env.MDB_PREFIX}empresas`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifySuper from '../../middleware/valid_super.js'
// import cache from '../../cache/cache.js'

// cache.set('file', 30, 'planos')
router.get('/', verifyJWT, verifySuper, async (req, res) => {
	
	await planosSchema.find().then(async resp_planos => {
			
		let found_documents = resp_planos.length > 0 ? resp_planos.length : 0	
				
		res.send(outputMsg(true, resp_planos, found_documents, null))
	})
})

router.get('/:id', verifyJWT, verifySuper, async (req, res) => {
	let id = req.params.id

	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const modulos_plano = await planosSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)})

	if(modulos_plano == null)
	{
		res.send(outputMsg(false, 'Plano não encontrado no sistema.'))
		return
	}

	res.send({success: 1, data: modulos_plano})
})

router.get('/modulos/:id', verifyJWT, verifySuper, async (req, res) => {
	let id = req.params.id
	// await new Promise(r => setTimeout(r, 2000));

	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const modulos = await modulosSchema.find({}, {_id: 0, rota: 1, nome : 1})

	if(modulos.length == 0)
	{
		res.send(outputMsg(false, 'Não há módulos ativos no sistema.'))
		return
	}

	const modulos_plano = await planosSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)}, {rotas: 1, _id : 0})

	if(modulos_plano == null)
	{
		res.send(outputMsg(false, 'Plano não encontrado no sistema.'))
		return
	}	

	const rotas = []

	let i = 0
	for(i in modulos)
	{
		rotas.push({
			rota: modulos[i].rota, 
			nome: modulos[i].nome, 
			active: modulos_plano.rotas.includes(modulos[i].rota)
		})
	}

	res.send({success: rotas.length > 0 ? 1 : 0, data: rotas})
})

router.post('/', verifyJWT, verifySuper, async (req, res) => {
	if(req.body.fields == undefined)
	{
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	let user = JSON.parse(req.user_data)
	
	let insert = new planosSchema({

		nome: req.body.fields.nome.trim(),
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

	const plano = await planosSchema.findOne({_id : mongoose.Types.ObjectId(id)}, {_id : 1})

	if(plano == null)
	{
		res.send(outputMsg(false, 'Plano não encontrado no sistema.'))
		return
	}

	let user = JSON.parse(req.user_data)
	
	const new_data = {
		nome: fields.nome,
		updated_by: user.user_nome,
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}
	await planosSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(resp => {
		res.send({success: 1, message: 'Plano atualizado com sucesso.'})
	})
	
})

router.put('/modulos', verifyJWT, verifySuper, async (req, res) => {
	if(req.body.modulos == undefined || req.body.plano_id == undefined)
	{
		res.send(outputMsg(false, 'Payload não recebido.'))
		return
	}

	let id = req.body.plano_id
	
	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	const plano = await planosSchema.findOne({_id : mongoose.Types.ObjectId(id)}, {_id : 1})

	if(plano == null)
	{
		res.send(outputMsg(false, 'Plano não encontrado no sistema.'))
		return
	}

	let i = 0
	let modulos = []
	for(i in req.body.modulos)
	{
		if(req.body.modulos[i].active == true)
		{
			modulos.push(req.body.modulos[i].rota)
		}
	}

	let user = JSON.parse(req.user_data)
	
	const new_data = {
		rotas : modulos, 
		updated_by: user.user_nome,
		updated_at: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
	}
	await planosSchema.updateOne({'_id' : mongoose.Types.ObjectId(id)}, {'$set' : new_data}, {'upsert' : true}).then(() => {
		res.send({success: 1, message: 'Os módulos do plano foram atualizados.'})
	})

})

router.delete('/:id', verifyJWT, verifySuper, async (req, res) => {
	let id = req.params.id
	if(mongoose.isValidObjectId(id) == false)
	{
		res.send(outputMsg(false, 'O código informado é inválido.'))
		return
	}

	// Verifica se existem empresas utilizando esse plano
	const empresas = await empresasSchema.findOne({plano_id : mongoose.Types.ObjectId(id)})

	if(empresas != null)
	{
		res.send(outputMsg(false, 'Erro ao remover o plano. Existem empresas associadas a ele.'))
		return
	}

	const modulos_plano = await planosSchema.findOne({_id : mongoose.Types.ObjectId(id)}).remove()

	if(modulos_plano == null)
	{
		res.send(outputMsg(false, 'Plano não encontrado no sistema.'))
		return
	}
	
	res.send(outputMsg(true, 'Plano removido com sucesso'))
})

export default router