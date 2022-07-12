import 'dotenv/config'
import axios from 'axios'
import cron from 'node-cron'
import moment from 'moment'

let url = process.env.TYPE_SERVER == 'local' ? `${process.env.HOST}:${process.env.PORT}` : process.env.PRODUCTION_URL

// 120
cron.schedule('*/30 * * * * *', async () => {

	if(parseInt(moment().format("mm")) < 20 && parseInt(moment().format("mm")) > 0){
		
		try{
		
			await axios.get(`${url}/xml/add_to_queue`).then(resp => {
				console.log(resp.data)
			}).catch(error => {
				Sentry.captureException('Erro ao rodar a cron - ' + error)
			})
			
		}catch(e){
			
		}
	}

})