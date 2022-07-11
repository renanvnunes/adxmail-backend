import mongoose from 'mongoose'

const Schema = mongoose.Schema
const default_date = new Date()

const emailsAntigosSchema = new Schema({
	old_id: String,
	empresa_id: Number,
	nome: String,
	topo_adicional: String,
	topo_adicional_link: String,
	rodape_adicional: String,
	rodape_adicional_link: String,
	topo: String,
	link_topo: String,
	rodape: String,
	link_rodape: String,
	facebook: String,
	instagram: String,
	youtube: String,
	tiktok: String,
	botao: String,
	obs: String,
		
	updated_at: {
		type: Date,
		default: default_date
	},
	created_at: {
		type: Date,
		default: default_date
	},
	user_nome: String,
})

mongoose.model(`${process.env.MDB_PREFIX}emails_olds`, emailsAntigosSchema)