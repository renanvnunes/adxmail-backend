import mongoose from 'mongoose'

const Schema = mongoose.Schema
const default_date = new Date()


const contactsSchema = new Schema({
	first_name: String,
	last_name: String,
	phone_ddd: Number,
	phone: Number,
	segmentation: Array,
	empresa_id: mongoose.Schema.Types.ObjectId,
	created_at: {
		type: Date,
		default: default_date
	},

})

mongoose.model(`${process.env.MDB_PREFIX}contacts`, contactsSchema)