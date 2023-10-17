import 'dotenv/config';
import axios from 'axios';
import cron from 'node-cron';
import moment from 'moment';

import redis_client from '../connections/redis.js';

let url = process.env.TYPE_SERVER == 'local' ? `${process.env.HOST}:${process.env.PORT}` : process.env.PRODUCTION_URL;

cron.schedule('*/200 * * * * *', async () => {
	if (
		parseInt(moment().format('HH')) > process.env.CRON_HOUR_START &&
		parseInt(moment().format('HH')) < process.env.CRON_HOUR_END
	) {
		// if (parseInt(moment().format('mm')) < 20 && parseInt(moment().format('mm')) > 0) {
		// 	try {
		// 		await axios
		// 			.get(`${url}/xml/add_to_queue`)
		// 			.then((resp) => {})
		// 			.catch(async (error) => {
		// 				await redis_client.set(
		// 					'logs_crons:erro:queue_xml',
		// 					'Erro ao rodar a cron de (add_to_queue) - ' + error,
		// 					60
		// 				);
		// 			});
		// 	} catch (e) {}
		// } else {
		// 	await redis_client.set(
		// 		'logs_crons:aviso:queue_xml',
		// 		'Fora do horário de baixar novos XMLs. Minuto atual: ' + moment().format('mm'),
		// 		60
		// 	);
		// }
	}
});
