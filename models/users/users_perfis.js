import mongoose from 'mongoose'
const Schema = mongoose.Schema

const default_date = new Date()

const usersProfileSchema = new Schema({
	empresa_id: mongoose.Schema.Types.ObjectId,
	nome: String,
	acessos: Array,
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

mongoose.model(`${process.env.MDB_PREFIX}users_perfis`, usersProfileSchema)