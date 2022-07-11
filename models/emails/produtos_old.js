import mongoose from 'mongoose'

const Schema = mongoose.Schema
const default_date = new Date()

const produtosAntigosSchema = new Schema({
	id: Number,
	nome:  String,
	email_id: String,
	preco: String,
	price_cash: String,
	installment_amount: String,
	installment_months: String,
	preco_desconto: String,
	foto: String,
	link: String,
	col: String
})

mongoose.model(`${process.env.MDB_PREFIX}produtos_olds`, produtosAntigosSchema)