import mongoose from 'mongoose'

const Schema = mongoose.Schema
const default_date = new Date()

const clientesSchema = new Schema({
	status: {
		type: String,
		default: 'ativo'
	},
	tipo: String,
	nome: String,
	site: String,
	xml: String,
	empresa_id: mongoose.Schema.Types.ObjectId,
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

mongoose.model(`${process.env.MDB_PREFIX}clientes`, clientesSchema)