import mongoose from 'mongoose'

const Schema = mongoose.Schema
const default_date = new Date()

const emailsSchema = new Schema({
	concluido: {
		type: Boolean,
		default: false
	},
	cliente_id: mongoose.Schema.Types.ObjectId,
	empresa_id: mongoose.Schema.Types.ObjectId,
	nome: String,

	topo: String,
	rodape: String,
	botao: String,
	obs: String,

	produtos: Array,
	
	updated_at: {
		type: Date,
		default: default_date
	},
	created_at: {
		type: Date,
		default: default_date
	},
	created_by: String,
	updated_by: String,
})

mongoose.model(`${process.env.MDB_PREFIX}emails`, emailsSchema)