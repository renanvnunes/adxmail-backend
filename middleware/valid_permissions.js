const verifyPermissions = (req, res, next, modulo) => {
	
	const user_data = JSON.parse(req.user_data)

	let method = ''
	if(req.method == 'GET'){
		method = 'acessar'
	}else if(req.method == 'POST'){
		method = 'criar'
	}else if(req.method == 'PUT'){
		method = 'alterar'
	}else if(req.method == 'DELETE'){
		method = 'deletar'
	}else{
		res.send(outputMsg(false, 'Método não permitido.' + req.method))
		return
	}
	
	// Verifica se possui os dados do usuário na memória Redis
	if(user_data == undefined){
		res.send(outputMsg(false, 'Não foi possível validar as permissões do usuário.'))
		return
	}
	
	// Verifica se o módulo solicitado existe no cadastro do usuário
	if(user_data.permissions[modulo] == undefined){
		res.send(outputMsg(false, `Usuário não tem permissão para acessar o módulo: ${modulo}.`))	
		return
	}

	// Verifica se pode acessar o módulo
	if(user_data.permissions[modulo].acessar == undefined || user_data.permissions[modulo].acessar == 0){
		res.send(outputMsg(false, `Usuário não tem permissão para acessar o módulo: ${modulo}.`))	
		return
	}

	// Verifica se possui permissão para o método
	if(user_data.permissions[modulo][method] == undefined || user_data.permissions[modulo][method] == 0){
		res.send(outputMsg(false, `Usuário não tem permissão para (${method}) no o módulo: ${modulo}.`))	
		return
	}

	next()
}

export default verifyPermissions