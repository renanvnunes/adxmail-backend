import moment from 'moment'
import mongoose from 'mongoose'

const Schema = mongoose.Schema

const emailsSchema = new Schema({
	migrado: {
		type: Boolean,
		default: false
	},
	concluido: {
		type: Boolean,
		default: false
	},
	cliente_id: mongoose.Schema.Types.ObjectId,
	empresa_id: mongoose.Schema.Types.ObjectId,
	nome: String,
	old_id: Number,

	topo: String,
	rodape: String,
	link_topo: String,
	link_rodape: String,

	botao: String,
	obs: String,

	topo_adicional: String,
	topo_adicional_link: String,

	rodape_adicional: String,
	rodape_adicional_link: String,

	instagram: String,
	youtube: String,
	facebook: String,
	tiktok: String,

	produtos: Array,
	
	updated_at: Date,
	created_at: Date,
	created_by: String,
	updated_by: String,
})

mongoose.model(`${process.env.MDB_PREFIX}emails`, emailsSchema)