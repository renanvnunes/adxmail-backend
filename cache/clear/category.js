import express from 'express'
import mongoose from 'mongoose'
import moment from 'moment'
import slug from 'slug'

const router = express.Router()

import '../../models/categorias.js'
const categoriasSchema = mongoose.model(`${process.env.MDB_PREFIX}produtos_categorias`)

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '../../middleware/s3_client.js'
import fs from 'fs'

router.get('/', async (req, res) => {

	const empresa_id = req.query.empresa_id
	
	let get_categorias = await categoriasSchema.find({ 
		empresa_id: mongoose.Types.ObjectId(empresa_id), 
		categoria_pai: null 
	})

	let i = 0
	let categorias = []
	for(i in get_categorias){

		let categoria = {
			nome: get_categorias[i].nome,
			slug: get_categorias[i].slug,
			_id: get_categorias[i]._id,
			categoria_pai: get_categorias[i].categoria_pai,
			subs: null
		}

		if(categoria.categoria_pai == null){
			let get_subs = await categoriasSchema.find({categoria_pai: categoria._id}, {nome: 1, slug: 1})

			if(get_subs.length > 0){
				categoria.subs = get_subs
			}
		}
		
		categorias.push(categoria)
	}

	if(categorias.length == 0){
		res.send(outputMsg(false, 'Não existem categorias cadastradas para essa empresa.'))
		return
	}

	let folder_file = `storage/tmp_files/${empresa_id}`

	if (!fs.existsSync(folder_file)){
		await fs.promises.mkdir(folder_file, { recursive: true })
	}

	fs.writeFile(`${folder_file}/categories.json`, JSON.stringify(categorias), async (err) => {
		if(err){
			res.send(outputMsg(false, `Erro ao gerar o arquivo de cache. ${err}`))
			return
		}

		let file = fs.createReadStream(`${folder_file}/categories.json`)

		const bucketParams = {
			Bucket: process.env.DO_SP_NAME,
			ContentType: 'application/json',
			Key: `${process.env.DO_SP_FOLDER}/company/${empresa_id}/category/categories.json`,
			ACL: 'public-read',
			Body: file,
		}
	
		await s3Client.send(new PutObjectCommand(bucketParams))
	
		res.send({success: 1, data: `${process.env.DO_SP_PUBLIC_CDN}/${process.env.DO_SP_FOLDER}/company/${empresa_id}/categories.json`})
	})

})

export default router