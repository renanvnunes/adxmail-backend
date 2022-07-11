import cacheFile from 'cache-all/file.js'
import cacheMemory from 'cache-all/memory.js'
// import cacheRedis from 'cache-all/redis.js'

import path from 'path'

class ClassCache{
	constructor(){
		cacheFile.init({
			ttl: 90,
			isEnable: true,
			file: {
				path: path.join(process.cwd(), 'storage', 'cache')
			}
		})

		cacheMemory.init({
			ttl : 90 , 
			isEnable : true , //  Sinalizador para habilitar/desabilitar cache, útil para desenvolvimento  
		})

		// cacheRedis.init({
		// 	ttl: 90,
		// 	isEnable: true,
		// 	redis: {
		// 		host     : '127.0.0.1',  
		// 		port     : 6379,
		// 		password : 'Sam191213Redis',
		// 		prefix   : 'caches'
		// 	}
		//   })
	}

	set(type, expire, key)
	{
		if(type == 'file')
		{
			return cacheFile.middleware(expire, key)
		}

		if(type == 'memory')
		{
			return cacheMemory.middleware(expire, key)
		}

		// if(type == 'redis')
		// {
		// 	return cacheRedis.middleware(expire, key)
		// }
	}

	cacheByUser(page, req, res, next){
		// const user = JSON.parse(req.user_data)
		
		this.set('file', 10, `${page}`)
	}
}

export default new ClassCache()