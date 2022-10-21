import express from 'express'
import mongoose from 'mongoose'
import redis_client from '../../connections/redis.js'
import verifyJWT from '../../middleware/valid_jwt.js'

const router = express.Router()

import '../../models/users/users.js'
const usersSchema = mongoose.model(`${process.env.MDB_PREFIX}users`)

router.get('/', verifyJWT, async (req, res) => {
	
	// const user_data = JSON.parse(req.user_data)
	// await usersSchema.findOne({ token: user_data.token }).then(async resp => {

	// 	const new_data = {
	// 		token: null
	// 	}
	
	// 	await usersSchema.updateOne({'_id' : mongoose.Types.ObjectId(resp._id)}, {'$set' : new_data}, {'upsert' : true})

	// 	redis_client.del(`auth_users:_id:${resp._id.toString()}`)
	// })
	
	// res.send({success: 1, message: 'Usuário desconectado.'})	

})

export default router