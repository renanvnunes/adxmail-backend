import express  from 'express'
import mongoose from 'mongoose'
import moment   from 'moment'
import Jimp     from 'jimp'
import slug     from 'slug'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '../../middleware/s3_client.js'
import fs from 'fs'

const router = express.Router()

import '../../models/produtos/produtos.js'
const produtosSchema = mongoose.model(`${process.env.MDB_PREFIX}produtos`)

import verifyJWT from '../../middleware/valid_jwt.js'
import verifyEmpresa from '../../middleware/valid_empresa.js'
import verifyPermissions from '../../middleware/valid_permissions.js'

import cache from '../../cache/cache.js'

router.get('/', verifyJWT, verifyEmpresa, (req, res, next) => {

	verifyPermissions(req, res, next, 'produtos')

}, cache.set('memory', 3600, 'produtos'), async (req, res) => {
	const empresa_id = req.query.empresa_id
	const cliente_id = req.query.cliente_id

	let query = {
		empresa_id: mongoose.Types.ObjectId(empresa_id),
		cliente_id: mongoose.Types.ObjectId(cliente_id)
	}

	function getUniqueListBy(arr, key) {
		return [...new Map(arr.map(item => [item[key], item])).values()]
	}

	await produtosSchema.find(query).then(async resp => {
			
		let found_documents = resp.length > 0 ? resp.length : 0	
			
		res.send(outputMsg(true, getUniqueListBy(resp, 'nome'), found_documents, null))
	})
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

	const resp = await produtosSchema.findOne({_id : mongoose.Types.ObjectId(req.params.id)})

	if(resp == null)
	{
		res.send(outputMsg(false, 'Produto não encontrado no sistema.'))
		return
	}

	res.send({success: 1, data: resp})
})

export default router