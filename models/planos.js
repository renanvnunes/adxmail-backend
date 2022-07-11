import mongoose from 'mongoose'

const Schema = mongoose.Schema

const default_date = new Date()

const planosSchema = new Schema({
	nome: String,
	rotas: Array,
	created_at: {
		type: Date,
		default: default_date
	},
	updated_at: {
		type: Date,
		default: default_date
	},
	created_by: String,
	updated_by: String
})

mongoose.model(`${process.env.MDB_PREFIX}planos`, planosSchema)