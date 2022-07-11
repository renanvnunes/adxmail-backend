import 'dotenv/config'
import axios from 'axios'
import cron from 'node-cron'
import moment from 'moment'

import * as Sentry from '@sentry/node'

Sentry.init({
	dsn: process.env.SENTRY_URL,
	tracesSampleRate: 1.0,
})

console.log()
console.log(' --------------------------------- ')
console.info('  Processo de queues iniciado...')
console.log(' --------------------------------- ')
console.log()

let url = process.env.TYPE_SERVER == 'local' ? `${process.env.HOST}:${process.env.PORT}` : process.env.HOST

cron.schedule('*/120 * * * * *', async () => {

	if(parseInt(moment().format("mm")) > 20 && parseInt(moment().format("mm")) < 59){
		
		console.log()
		console.log(' ------------------------------------------------- ')
		console.log(`  ${parseInt(moment().format("mm"))} - Fora do horário de atualização de XML...  (Horário de atividade: Abaixo do minuto 20) URL: ${url}`)
		console.log(' ------------------------------------------------- ')
		console.log()
		
		return
	}

	try{
		
		await axios.get(`${url}/xml/add_to_queue`).then(resp => {
			console.log(resp.data)
		}).catch(error => {
			Sentry.captureException('Erro ao rodar a cron - ' + error)
		})
		
	}catch(e){
		Sentry.captureException(e);
	}

})