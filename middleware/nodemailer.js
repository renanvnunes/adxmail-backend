import nodemailer from 'nodemailer'
let testAccount = await nodemailer.createTestAccount()

	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: "smtp.skymail.net.br",
		port: 465,
		secure: true, // true for 465, false for other ports
		auth: {
			user: 'dev@adx.digital', // generated ethereal user
			pass: 'Sam191213', // generated ethereal password
		},
	})
  
	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: '"Fred Foo 👻" <dev@adx.digital>', // sender address
		to: "renan.dev@hotmail.com", // list of receivers
		subject: "Hello ✔", // Subject line
		text: "Hello world?", // plain text body
		html: "<b>Hello world?</b>", // html body
	})
  
	console.log("Message sent: %s", info.messageId)
	// Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
	// Preview only available when sending through an Ethereal account
	console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info))

	res.send("ok")