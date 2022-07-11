import mongoose from 'mongoose'

const Schema = mongoose.Schema

const default_date = new Date()

const modulosSchema = new Schema({
	nome: String,
	created_at: {
		type: Date,
		default: default_date
	},
	update_at: {
		type: Date,
		default: default_date
	},
	rota: String
})

mongoose.model(`${process.env.MDB_PREFIX}modulos`, modulosSchema)