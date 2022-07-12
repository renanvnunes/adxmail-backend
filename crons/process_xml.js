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

let url = process.env.TYPE_SERVER == 'local' ? `${process.env.HOST}:${process.env.PORT}` : process.env.PRODUCTION_URL

// 30
cron.schedule('*/10 * * * * *', async () => {
	
	if(parseInt(moment().format("mm")) > 25 && parseInt(moment().format("mm")) < 59){
		
		// console.log()
		// console.log(' ------------------------------------------------- ')
		// console.log('  '+moment().format("HH:mm")+' - Fora do horário de atualização de produtos (Horário de atividade: Acima do minuto 30)...')
		// console.log(' ------------------------------------------------- ')
		// console.log()
		
		try{

			await axios.get(`${url}/xml/process_queue`).then(resp => {
				console.log(resp.data)
			}).catch(error => {
				Sentry.captureException('Erro ao rodar a cron - ' + error)
			})
	
		}catch(e){
			Sentry.captureException(e);
		}
	}
	
})