import mongoose from 'mongoose'

const Schema = mongoose.Schema
const default_date = new Date()

const templatesSchema = new Schema({
	nome: String,
	empresa_id: mongoose.Schema.Types.ObjectId,
	cliente_id: mongoose.Schema.Types.ObjectId,
	imagem_topo: {
		type: String,
		default: null
	},
	link_topo: {
		type: String,
		default: null
	},
	imagem_rodape: {
		type: String,
		default: null
	},
	link_rodape: {
		type: String,
		default: null
	},
	imagem_botao: {
		type: String,
		default: null
	},
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

mongoose.model(`${process.env.MDB_PREFIX}templates`, templatesSchema)