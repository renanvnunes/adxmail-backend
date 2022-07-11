import redis_client from '../connections/redis.js'
import jwt from 'jsonwebtoken'
import 'dotenv/config'

const customerVerify = (req, res, next) => {
	
	if(req.headers['token'] == undefined)
	{	
		res.send(outputMsg(false, 'Acesso negado.'))
		return
	}

	const token = req.headers['token'].replace('token_', '').split("").reverse().join("")

	jwt.verify(token, process.env.JWT_KEY_SHOP, async (error, success) => {
		
		if(error){
			res.send({success: 0, message: 'Acesso negado, token inválido.', login: true})
			return
		}

		const customer_data = await redis_client.get(`shop_clientes:empresa_id:${success.ei}:auth_users:_id:${success.ui}:browser_hash:${success.bh}`)

		if(customer_data == null){
			res.send({success: 0, message: 'A sessão do usuário foi expirada.', relogin: true})
			return
		}

		req.customer_data = JSON.parse(customer_data)
		
		if(req.customer_data.token != `token_${req.headers['token'].replace('token_', '').split("").reverse().join("")}`){
			res.send({success: 0, message: 'Erro ao validar sua sessão, verifique se você logou em outro dispositivo.', relogin: true})
			return
		}
		
		next()
	})
}

export default customerVerify