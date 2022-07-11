import mongoose from 'mongoose'

const Schema = mongoose.Schema

const default_date = new Date()

const empresasSchema = new Schema({
	"status": Number,
	"nome": String,
	"resp_nome": String,
	"resp_sobrenome": String,
	"telefone": Number,
	"celular": Number,
	"plano_id": mongoose.Schema.Types.ObjectId,
	"created_by": String,
	"updated_by": String,
	"created_at": {
		type : Date,
		default: default_date
	},
	"updated_at": {
		type : Date,
		default: default_date
	},
})

mongoose.model(`${process.env.MDB_PREFIX}empresas`, empresasSchema)