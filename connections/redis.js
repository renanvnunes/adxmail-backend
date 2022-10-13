import Redis from 'ioredis'
import 'dotenv/config'

class ClassRedis{
	
	constructor(){
		this.redis = new Redis({
			host      : process.env.RD_HOST,  
			port      : Number(process.env.RD_PORT),
			password  : process.env.RD_PASS,
			keyPrefix : `${process.env.RD_PREFIX}:`,
			tls: {
				host: process.env.RD_HOST
			}
		})
	}

	async get_all(search)
	{
		const value = await this.redis.keys(search)
		return value
	}

	async get(key){
		const value = await this.redis.get(key)
		
		return value
	}

	async random_key(){
		const value = await this.redis.call("randomkey")

		return value
	}

	set(key, value, timeExp){
		return this.redis.set(key, JSON.stringify(value), "EX", timeExp)
	}

	async setMore(key, value, timeExp){
		const get_data = await this.get(key)

		// Se não existe nada na key solicitada, adiciona a primeira.
		if(get_data == null){

			const new_data = [value]
			 
			this.set(key, new_data, timeExp)
			return true

		}else{

			// Dados atuais da key existente
			const data = JSON.parse(get_data)
			
			data.push(value)

			// Salva a key com os novos dados
			this.set(key, data, timeExp)

			return true
		}
	}

	async del(key){
		return await this.redis.del(key)
	}

	async delPrefix(prefix){
		const keys = (await this.redis.key(`${process.env.RD_PREFIX}:${prefix}:*`)).map((key) => {
			key.replace(`${process.env.RD_PREFIX}:`, '')
		})

		return this.del(keys)
	}
}

export default new ClassRedis()
