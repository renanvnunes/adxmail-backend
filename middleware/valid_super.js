import mongoose from 'mongoose'
import 'dotenv/config'

const usersSchema = mongoose.model(`${process.env.MDB_PREFIX}users`)

const verifySuper = async (req, res, next) => {
	
	if(req.headers['token'] == undefined){	
		res.send(outputMsg(false, 'Acesso negado, token não informado.'))
		return
	}

	const token = req.headers['token'].replace('token_', '').split('').reverse().join('')
	
	await usersSchema.findOne({token: `token_${token}`}).then(resp => {
		
		// console.log(resp)
		if(resp != null && resp.super_user == 1){
			next()
		}else{
			res.send(outputMsg(false, 'Acesso negado, você não tem permissão para acessar esse recurso.'))
			return
		}

	}).catch(() => {

		res.send(outputMsg(false, 'Acesso negado, erro ao validar suas permissões.'))
		return

	})

}

export default verifySuper