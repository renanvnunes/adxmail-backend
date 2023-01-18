import mongoose from 'mongoose'
import 'dotenv/config'

mongoose.connect(process.env.MDB_SERVER).then(() => {
	
	console.log("Mongodb conectado")

}).catch(erro => {
	console.log(`Erro ao conectar com mongodb -> ${process.env.MDB_SERVER} -> ${erro}`)
	return
})

export default mongoose