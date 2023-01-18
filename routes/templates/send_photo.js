import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '../../middleware/s3_client.js'
import fs from 'fs'
import Jimp from 'jimp'

import { writeFile } from 'node:fs/promises';

class SendPhoto{

	removeFile(image_name, empresa_id){

		
		let params = {  
			Bucket: process.env.DO_SP_NAME, 
			Key: `${process.env.DO_SP_FOLDER}/company/${empresa_id}/templates/${image_name}`,
		}

		s3Client.deleteObject(params)
	}

	async send(base64, image_name, type, empresa_id, width, quality){

		// 	var stringLength = base64.length;

		// var sizeInBytes = 4 * Math.ceil((stringLength / 3))*0.5624896334383812;
		// var sizeInKb=sizeInBytes/1000;

		// console.log(sizeInKb)

		const data = base64.replace(`data:image/${type};base64,`, '')
		
		const buffer = Buffer.from(data, "base64")
		
		let image_dir = `storage/tmp_img/`

		if(type == 'gif'){
			await writeFile(image_dir+image_name, buffer)

			fs.readFile(image_dir+image_name, async (error, file) => {
	
				const bucketParams = {
					Bucket: process.env.DO_SP_NAME,
					ContentType: `image/${type}`,
					Key: `${process.env.DO_SP_FOLDER}/company/${empresa_id}/templates/${image_name}`,
					ACL: 'public-read',
					Body: file,
				}

				await s3Client.send(new PutObjectCommand(bucketParams))

				fs.unlinkSync(image_dir+image_name)

			})	
			
		}else{
			
			await Jimp.read(buffer, async (err, success) => {
							
				if(success){
					await Jimp.read(success.resize(width, Jimp.AUTO).quality(quality).write(image_dir+image_name)).then(async () => {
					
						fs.readFile(image_dir+image_name, async (error, file) => {
	
							const bucketParams = {
								Bucket: process.env.DO_SP_NAME,
								ContentType: `image/${type}`,
								Key: `${process.env.DO_SP_FOLDER}/company/${empresa_id}/templates/${image_name}`,
								ACL: 'public-read',
								Body: file,
							}
	
							await s3Client.send(new PutObjectCommand(bucketParams))
	
							fs.unlinkSync(image_dir+image_name)
	
						})						
						
					})
				}
	
			})

		}
	}
}

export default new SendPhoto()