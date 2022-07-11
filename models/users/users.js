import mongoose from 'mongoose'
const Schema = mongoose.Schema

const default_date = new Date()

const usersSchema = new Schema({
	super_user: Number,
	nome: String,
	perfil_id: mongoose.Schema.Types.ObjectId,
	empresa_id: mongoose.Schema.Types.ObjectId, // Empresa padrão do usuário
	email: String,
	senha: String,
	data_expire: Date,
	token: String,
	empresas: Array,
	created_by: String,
	updated_by: String,
	access_logs : Array,
	update_at: {
		type: Date,
		default: default_date
	},
	created_at: {
		type: Date,
		default: default_date
	},
})

mongoose.model(`${process.env.MDB_PREFIX}users`, usersSchema)