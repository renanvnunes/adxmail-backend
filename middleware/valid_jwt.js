import redis_client from '../connections/redis.js'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

const verifyJWT = (req, res, next) => {
	
	if(req.headers['token'] == undefined){
		res.send(outputMsg(false, 'Acesso negado, token não informado.'))
		return
	}

	const token = req.headers['token'].replace('token_', '').split("").reverse().join("")

	jwt.verify(token, process.env.JWT_KEY, async (error, success) => {
		if(error){
			res.send(outputMsg(false, 'Acesso negado, token inválido.'))
			return
		}

		const user_data = await redis_client.get(`auth_users:_id:${success._id}`)

		if(user_data == null){
			res.send({success: 0, message: 'A sessão do usuário foi expirada ou acesso não autorizado.', relogin: true})
			return
		}

		req.user_data = user_data
		
		next()
	})
}

export default verifyJWT