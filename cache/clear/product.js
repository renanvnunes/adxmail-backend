import express  from 'express'
import mongoose from 'mongoose'

const router = express.Router()

import '../../models/produtos/produtos.js'
const produtosSchema = mongoose.model(`${process.env.MDB_PREFIX}produtos`)

import '../../models/categorias.js'
const categoriasSchema = mongoose.model(`${process.env.MDB_PREFIX}produtos_categorias`)

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '../../middleware/s3_client.js'
import fs from 'fs'

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
	
	let get_categorias = await categoriasSchema.find({ 
		empresa_id: mongoose.Types.ObjectId(empresa_id),
	}, {_id: 1})

	let folder_file = `storage/tmp_files/${empresa_id}`

	if (!fs.existsSync(folder_file)){
		await fs.promises.mkdir(folder_file, { recursive: true })
	}

	if(get_categorias.length == 0){
		res.send(outputMsg(false, 'Não existem categorias cadastradas para essa empresa.'))
		return
	}
	
	for(let cat of get_categorias){
		let get_produtos = await produtosSchema.find({categorias: cat._id.toString()})
		
		if(get_produtos.length > 0){

			if (!fs.existsSync(`${folder_file}/categorias/${cat._id.toString()}`)){
				await fs.promises.mkdir(`${folder_file}/categorias/${cat._id.toString()}`, { recursive: true })
			}
			
			fs.writeFile(`${folder_file}/categorias/${cat._id.toString()}/produtos.json`, JSON.stringify(get_produtos), async (err) => {
				if(!err){

					let file = fs.createReadStream(`${folder_file}/categorias/${cat._id.toString()}/produtos.json`)
				
					let key = `${process.env.DO_SP_FOLDER}/company/${empresa_id}/category/${cat._id.toString()}/products.json`
					const bucketParams = {
						Bucket: process.env.DO_SP_NAME,
						ContentType: 'application/json',
						Key: key,
						ACL: 'public-read',
						Body: file,
					}
					
					await s3Client.send(new PutObjectCommand(bucketParams))
				}
			
			})
		}

	}

	res.send({success: 1, data: 'A solicitação para limpeza de cache de produtos foi enviada.'})
})

router.get('/:id', async (req, res) => {

	const empresa_id = req.query.empresa_id
	const id = req.params.id

	if(empresa_id == undefined || id == undefined ){
		res.send(outputMsg(false, 'O código da empresa e do produto precisam ser informados.'))
		return
	}

	if(mongoose.isValidObjectId(empresa_id) == false || mongoose.isValidObjectId(id) == false){
		res.send(outputMsg(false, 'O código da empresa ou do produto não são validos.'))
		return
	}
	
	let get_produto = await produtosSchema.findOne({ empresa_id: mongoose.Types.ObjectId(empresa_id), _id: mongoose.Types.ObjectId(id) })
		
	if(get_produto == null){
		res.send(outputMsg(false, 'O produto não foi encontrado.'))
		return
	}

	if(get_produto.length == 0){
		res.send(outputMsg(false, 'O produto não foi encontrado.'))
		return
	}


	let folder_file = `storage/tmp_files/${empresa_id}`

	if (!fs.existsSync(folder_file)){
		await fs.promises.mkdir(folder_file, { recursive: true })
	}
	
	if (!fs.existsSync(`${folder_file}/produtos/${get_produto._id.toString()}`)){
		await fs.promises.mkdir(`${folder_file}/produtos/${get_produto._id.toString()}`, { recursive: true })
	}
	
	fs.writeFile(`${folder_file}/produtos/${get_produto._id.toString()}/produto.json`, JSON.stringify(get_produto), async (err) => {
		if(err){
			res.send({success: 0, data: err})
		}else{

			let file = fs.createReadStream(`${folder_file}/produtos/${get_produto._id.toString()}/produto.json`)
		
			let key = `${process.env.DO_SP_FOLDER}/company/${empresa_id}/product/${get_produto._id.toString()}/product.json`

			const bucketParams = {
				Bucket: process.env.DO_SP_NAME,
				ContentType: 'application/json',
				Key: key,
				ACL: 'public-read',
				Body: file
			}
			
			await s3Client.send(new PutObjectCommand(bucketParams))

			res.send({success: 1, data: key})
		}
	
	})

})

export default router