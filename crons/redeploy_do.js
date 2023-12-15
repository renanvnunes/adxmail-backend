import 'dotenv/config';
import axios from 'axios';
import cron from 'node-cron';

// Cron executada todo dia as 6 da manhã
cron.schedule('0 6 * * *', async () => {
	const api_key = process.env.DIGITALOCEAN_API_KEY;
	const app_id = process.env.DIGITALOCEAN_APP_ID;
	try {
		const response = await axios.post(
			`https://api.digitalocean.com/v2/apps/${app_id}/deployments`,
			{
				"force_build": true,
			},
			{
				headers: {
					Authorization: `Bearer ${api_key}`,
					'Content-Type': 'application/json',
				},
			}
		);
		// Salvar um log aqui??
		console.log('Deploy iniciado com sucesso:', response.data);
	} catch (error) {
		console.error('Falha ao iniciar o deploy:', error);
	}
});
