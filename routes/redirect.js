import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

import '../models/emails/emails.js'
const emailsSchema = mongoose.model(`${process.env.MDB_PREFIX}emails`)

router.get('/', async (req, res) => {
	const url = req.query.url
	res.redirect(url)
})

router.get('/:id', async (req, res) => {
	const id = req.params.id
	const url = req.query.url

	if(!url){
		res.send("Erro ao obter a url de destino...")
		return
	}

	// if(mongoose.isValidObjectId(id) == false){
	// 	res.send(outputMsg(false, 'O código informado é inválido.'))
	// 	return
	// }

	// const email = await emailsSchema.findOne({ _id: id }, {_id: 1}).exec()

	// if(!email){
	// 	res.send("Erro ao obter a url de destino...")
	// 	return
	// }

	res.redirect(url)
})


export default router