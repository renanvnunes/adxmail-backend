import axios from 'axios'
import cron from 'node-cron'
import moment from 'moment'
import 'dotenv/config'
import * as Sentry from '@sentry/node'

Sentry.init({
	dsn: process.env.SENTRY_URL,
	tracesSampleRate: 1.0,
})

console.log()
console.log(' ------------------------------------------- ')
console.info('  Processo liberação de queues iniciado...')
console.log(' ------------------------------------------- ')
console.log()


cron.schedule('*/30 * * * * *', async () => {
	
	if(parseInt(moment().format("mm")) < 29 && parseInt(moment().format("mm")) > 0){
		
		console.log()
		console.log(' ------------------------------------------------- ')
		console.log('   Fora do horário de atualização de produtos...')
		console.log(' ------------------------------------------------- ')
		console.log()
		
		return
	}

	try{

		await axios.get(`${process.env.HOST}:${process.env.PORT}/xml/process_queue`).then(resp => {
			console.log(resp.data)
		}).catch(error => {
			Sentry.captureException('Erro ao rodar a cron - ' + error)
		})

	}catch(e){
		Sentry.captureException(e);
	}
	
})