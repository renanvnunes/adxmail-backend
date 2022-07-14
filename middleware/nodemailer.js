import nodemailer from 'nodemailer'

export default {
	set: global.sendMail = async (type, destino, subject, message_body) => { 

		let testAccount = await nodemailer.createTestAccount()

		// create reusable transporter object using the default SMTP transport
		let transporter = nodemailer.createTransport({
			host: type == 'test' ? 'smtp.ethereal.email' : process.env.SMTP_HOST,
			port: type == 'test' ? 587 : process.env.SMTP_PORT,
			secure: type == 'test' ? false : process.env.SMTP_SECURE, // true for 465, false for other ports
			auth: {
				user: type == 'test' ? testAccount.user : process.env.SMTP_USER,
				pass: type == 'test' ? testAccount.pass : process.env.SMTP_PASS,
			},
		})

		let send = await transporter.sendMail({
			from: `"AdxMail" <${process.env.SMTP_USER}>`, // sender address
			to: destino, // list of receivers
			subject: `✔ ${subject}`, // Subject line
			text: "", // plain text body
			html: message_body, // html body
		})

		console.log(nodemailer)

		return type == 'test' ? nodemailer.getTestMessageUrl(send) : send 
	}
}