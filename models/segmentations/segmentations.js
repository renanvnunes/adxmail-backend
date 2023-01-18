import mongoose from 'mongoose'

const Schema = mongoose.Schema

const segmentationsSchema = new Schema({
	tag_name: String,
	tag_color: String,
	empresa_id: mongoose.Schema.Types.ObjectId
})

mongoose.model(`${process.env.MDB_PREFIX}segmentations`, segmentationsSchema)