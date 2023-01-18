import mongoose from 'mongoose'

const verifyEmpresa = (req, res, next) => {
	
	const user_data = JSON.parse(req.user_data)
	const empresa_id = req.query.empresa_id
	
	if(empresa_id == undefined)
	{
		res.send(outputMsg(false, 'Código da empresa não foi informado.'))
		return
	}

	if(mongoose.isValidObjectId(empresa_id) == false)
	{
		res.send(outputMsg(false, 'O código da empresa é inválido.'))
		return
	}

	if(user_data.empresas.length == 0)
	{
		res.send(outputMsg(false, 'Não existem empresas no cadastro desse usuário.'))
		return
	}

	let empresas = []
	let i = 0
	for(i in user_data.empresas)
	{
		empresas.push(user_data.empresas[i].id.$oid)
	}
	
	if(empresas.includes(empresa_id) == false)
	{
		res.send(outputMsg(false, 'Usuário não tem permissão para acessar essa empresa.'))
		return
	}

	next()
}

export default verifyEmpresa