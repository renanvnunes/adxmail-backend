import express      from 'express'
import bodyParser   from 'body-parser'
import session      from 'express-session'
import cookieParser from 'cookie-parser'
import cors         from 'cors'
import mongoose     from './connections/mongo.js'
import https        from 'https'
import fs           from 'fs'
import { engine }   from 'express-handlebars';

import 'dotenv/config'

const app = express()

// Inclui o módulo do mongoose
mongoose.set('debug', false)

import express_status from 'express-status-monitor'

// Habilita a o uso de cors para conexões externas
app.use(cors())

// Importando rotas gerais
import auth         from './routes/users/auth.js'
import forgot       from './routes/users/forgot.js'
import dashboard    from './routes/dashboard/dashboard.js'
import modulos      from './routes/modulos/modulos.js'

// Users
import users        from './routes/users/users.js'
import users_perfis from './routes/users/users_perfis.js'
import logout       from './routes/users/logout.js'

// Empresas
import empresas     from './routes/empresas/empresas.js'
import planos       from './routes/planos/planos.js'

// Produtos
import produtos          from './routes/produtos/produtos.js'

// Clientes
import clientes from './routes/clientes/clientes.js'

// Clientes XML
import xml from './routes/clientes/xml.js'

// Templates
import templates from './routes/templates/templates.js'

// E-mails
import emails from './routes/emails/emails.js'
import emails_html from './routes/emails/html.js'

import redirect  from './routes/redirect.js'

import './middleware/functions.js'

// import cache from '../../cache/cache.js'

app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')

// Session
app.use(session({
	secret: 'adxhub',
	resave: true,
	saveUninitialized: true
}))

app.use(cookieParser())

// Middleware
app.use((req, res, next) => {
	
	res.locals.error = 0
	res.locals.success = 1
	
	next()
})

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json({limit: '500mb'}))

app.get('/', function (req, res) {
	res.send({Server: 'Api ADXMail'})
});  

// Routes backend
app.use('/auth', auth)
app.use('/forgot', forgot)
app.use('/logout', logout)
app.use('/users', users)
app.use('/users_perfis', users_perfis)
app.use('/empresas', empresas)
app.use('/planos', planos)
app.use('/dashboard', dashboard)
app.use('/modulos', modulos)
app.use('/produtos', produtos)

// Clientes backend
app.use('/clientes', clientes)

// XML de clientes backend
app.use('/xml', xml)

app.use('/templates', templates)

app.use('/emails', emails)
app.use('/html', emails_html)

app.use('/redirect', redirect)

app.use(express_status())

let type_server = process.env.TYPE_SERVER
app.listen(type_server == 'local' ? 3000 : process.env.PORT, () => {
	console.log(`Rodando em http://localhost:${type_server == 'local' ? 3000 : process.env.PORT}`)
})