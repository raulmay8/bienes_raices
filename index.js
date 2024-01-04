import express from 'express'
import csrf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './Routes/usuarioRoutes.js'
import propiedadesRoutes from './Routes/propiedadesRoutes.js'
import appRoutes from './Routes/appRoutes.js'
import apiRoutes from './Routes/apiRoutes.js'
import dotenv from 'dotenv'
import db from './config/db.js'

//crear la app
const app = express()

dotenv.config()

//Habilitar lectura de formularios
//Urlencoded solo lee textos, archivos no
app.use(express.urlencoded({extended: true}))

//Implementar CSRF usamos cookie-parser
app.use(cookieParser())

app.use(csrf({cookie:true}))

//Conexión a la BD
try {
    await db.authenticate()
    /* db.sync({force:true}) */
    db.sync()
    console.log('Conexión exitosa')
} catch (error) {
    console.log(error)
}

//Habilitar Pug
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta pública
app.use(express.static('public'))

//Routing
app.use('/', appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRoutes)

//Definir un puerto y arrancar el proyecto
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`El servidor está funcionando en el puerto ${port}`)
})