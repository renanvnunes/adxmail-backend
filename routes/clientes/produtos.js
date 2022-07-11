import mongoose from "mongoose"

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '../../middleware/s3_client.js'
import fs from 'fs'
import jimp from 'jimp'

import '../../models/produtos/produtos.js'
const produtosSchema = mongoose.model(`${process.env.MDB_PREFIX}produtos`)

class ProdutosXML{
	
	async update(xml_itens, cliente_id){
				
		await produtosSchema.find({cliente_id : mongoose.Types.ObjectId(cliente_id)}).remove()

		let itens = []
		for(let item of xml_itens){

			let produto = {}
			for(let key of Object.keys(xml_itens[0])){
				
				let new_key = key.replace('g:', '')
				let new_value = ''
				
				if(item[key] != undefined){
					new_value = item[key][0] instanceof Object || item[key][0] instanceof Array ? item[key][0] : item[key][0]
				}else{
					new_value = item[key]
				}
				

				if(new_key == 'id'){ produto.item_sku = new_value }
				if(new_key == 'title'){ produto.nome = new_value.trim() }
				if(new_key == 'link'){ produto.link = new_value.trim() }
				if(new_key == 'image_link'){ produto.foto = new_value }
				if(new_key == 'installment'){ produto.parcelas = new_value }
				
				if(new_key == 'sale_price'){ produto.preco_desconto = new_value }
				// if(new_key == 'sale_price'){ produto.preco_desconto = new_value instanceof String ? new_value.replace(/\D/g,'') : new_value }
				if(new_key == 'price'){ produto.preco = new_value }
				// if(new_key == 'price'){ produto.preco = new_value instanceof String ? new_value.replace(/\D/g,'') : new_value }

				if(new_key == 'availability'){ 
					produto.in_stock = new_value ==  'in stock' ? true : false
				}
				
			}
			
			if(produto.in_stock == undefined){
				produto.in_stock = true
			}

			produto.cliente_id = mongoose.Types.ObjectId(cliente_id)		
			
			if(produto.in_stock == true){
				itens.push(produto)
			}
		}
		
		const save_products = await produtosSchema.create(itens)

		if(save_products){
			// for(let prod of save_products){
			// 	console.log(await this.sendPhoto(prod._id))
				
			// }
			return true
		}else{
			return false
		}
	}

	async sendPhoto(foto_nome){

		try{

			const width = 500
			const quality = 75
			
			let image_dir = `storage/tmp_products/`
			let image_name = `foto_${foto_nome}.jpg`

			await jimp.read("https://i0.wp.com/www.multarte.com.br/wp-content/uploads/2019/03/super-mario-png.png?resize=696%2C860&ssl=1").then(image => 
				image.getBuffer(jimp.AUTO, async (err, buffer) => {

					if(buffer){
						await jimp.read(buffer, async (err, success) => {
				
							await jimp.read(success.resize(width, jimp.AUTO).quality(quality).write(image_dir+image_name)).then(async () => {
								
								fs.readFile(image_dir+image_name, async (error, file) => {
				
									const bucketParams = {
										Bucket: process.env.DO_SP_NAME,
										ContentType: 'image/jpeg',
										Key: `${process.env.DO_SP_FOLDER}/company/61cc4a60237cdf2da12f4c42/product/${image_name}`,
										ACL: 'public-read',
										Body: file,
									}
				
									await s3Client.send(new PutObjectCommand(bucketParams))
								})
								
							})
				
						})
					}

				}
			))

			return image_name

		}catch{
			return false
		}
	}

}

export default new ProdutosXML()