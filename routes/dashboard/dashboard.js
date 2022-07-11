import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

router.get('/', (req, res) => {
	res.send('ok')
})

export default router