import express  from 'express'
import axios from 'axios'
import mongoose from 'mongoose'
import 'dotenv/config'

const router = express.Router()

router.get('/', async (req, res) => {
	
	const empresa_id = req.query.empresa_id

	if(empresa_id == undefined){
		res.send(outputMsg(false, 'O código da empresa deve ser informados.'))
		return
	}

	if(mongoose.isValidObjectId(empresa_id) == false){
		res.send(outputMsg(false, 'O código da empresa é inválido.'))
		return
	}
	
	const headers = {
		'Authorization': `Bearer ${process.env.DO_API_KEY}`
	}
	const data = {
		files: [`/hub/company/${empresa_id}*`]
	}

	const clear = await axios.delete(`https://api.digitalocean.com/v2/cdn/endpoints/${process.env.DO_ENDPOINT_ID}/cache`, {headers, data}).then(() => {
		res.send({success: 1, data: 'O cache CDN foi limpo.'})
	}).catch(() => {
		res.send({success: 1, data: 'Erro ao limpar o cache CDN.'})
	})
	
})


export default router