import mongoose from 'mongoose'

const Schema = mongoose.Schema
const default_date = new Date()

const produtosSchema = new Schema({
	cliente_id: mongoose.Schema.Types.ObjectId,
	item_sku: String,
	nome: String,
	preco: String,
	preco_desconto: String,
	parcelas: Array,
	in_stock: {
		type: Boolean,
		default: true
	},
	foto: String,
	link: String,
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

mongoose.model(`${process.env.MDB_PREFIX}produtos`, produtosSchema)