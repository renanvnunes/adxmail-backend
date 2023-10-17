import axios from 'axios';
import cron from 'node-cron';
import moment from 'moment';
import 'dotenv/config';

let url = process.env.TYPE_SERVER == 'local' ? `${process.env.HOST}:${process.env.PORT}` : process.env.PRODUCTION_URL;

// 30

// cron.schedule('*/240 * * * * *', async () => {

// 	// if(parseInt(moment().format("HH")) > process.env.CRON_HOUR_START && parseInt(moment().format("HH")) < process.env.CRON_HOUR_END){

// 		if(parseInt(moment().format("mm")) > 25 && parseInt(moment().format("mm")) < 59){

// 			try{

// 				await axios.get(`${url}/xml/process_queue`).then(resp => {

// 				}).catch(async error => {
// 					await redis_client.set('logs_crons:erro:process_queue', 'Erro ao rodar a cron de (process_queue) - ' + error, 60)
// 				})

// 			}catch(e){

// 			}
// 		}else{
// 			await redis_client.set('logs_crons:aviso:process_xml', 'Fora do horário de atualização de produtos. Minuto atual: '+moment().format("mm"), 60)
// 		}

// 	// }
// })
