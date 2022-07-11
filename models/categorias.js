import mongoose from 'mongoose'

const Schema = mongoose.Schema
const default_date = new Date()
const categoriasSchema = new Schema({
	nome: String,
	categoria_pai: mongoose.Schema.Types.ObjectId,
	empresa_id: mongoose.Schema.Types.ObjectId,
	slug: String,
	updated_at: {
		type: Date,
		default: default_date
	},
	created_at: {
		type: Date,
		default: default_date
	},
	created_by: String,
	updated_by: String
})

mongoose.model(`${process.env.MDB_PREFIX}produtos_categorias`, categoriasSchema)