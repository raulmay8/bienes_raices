import Usuario from "../models/Usuario.js"
import { check, validationResult } from "express-validator"
import jwt from 'jsonwebtoken'
import { generarId, generarJWT } from "../helpers/tokens.js"
import bcrypt from 'bcrypt'
import { emailOlvidePassword, emailRegistro } from "../helpers/emails.js"

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar sesión',
        csrfToken: req.csrfToken()
    })
}
const autenticar = async (req, res) =>{
    await check('email').isEmail().withMessage('El correo electrónico es obligatorio').run(req)
    await check('password').notEmpty().withMessage('La contraseña es obligatoria').run(req)

    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        return res.render('auth/login',{
            pagina: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }
    const {email, password} = req.body

    //Comprobar si el usuario existe
    const usuario = await Usuario.findOne({where:{email}})
    if(!usuario){
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El usuario no existe'}]
        })
    }
    //Comprobar si el usuario ha confirmado
    if(!usuario.confirmado){
        return res.render('auth/login',{
            pagina: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Cuenta no confirmada'}]
        })
    }
    //Comprobar contraseña
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            password: 'Iniciar sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'La contraseña es incorrecta'}]
        })
    }
    //Autenticar usuario
    const token = generarJWT({ id: usuario.id, nombre: usuario.nombre})

    //Almacenar en un cookie
    return res.cookie('_token', token, {
        //Para que terceros no accedan a los cookies
        httpOnly: true,
        secure: true,
        sameSite: true
    }).redirect('/mis-propiedades')
}

const cerrarSesion= async(req, res) =>{
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}
const formularioRegistro = (req, res) =>{
    res.render('auth/registro', {
        pagina: 'Crear cuenta',
        csrfToken : req.csrfToken()
    })
}
const registrar = async(req, res) =>{
    //validación
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacío').run(req)
    await check('email').isEmail().withMessage('Correo electrónico no válido').run(req)
    await check('password').isLength({min: 6}).withMessage('Contraseña mínima de 6 dígitos').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Las contraseñas no son iguales').run(req)

    let resultado = validationResult(req)

    //Verificar que el resultado esté vacío
    if(!resultado.isEmpty()){
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken : req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //Extrar datos
    const {nombre, email, password} = req.body

    //Verificar email duplicados
    const existeUsuario = await Usuario.findOne({where: {email}})
    if(existeUsuario){
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El usuario ya está registrado'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }
    
    //Almacenar usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    //Envía email de confirmación
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //Mostrar mensaje de confirmación
    res.render('templates/mensaje',{
        pagina: 'Cuenta creada correctamente',
        mensaje: 'Se ha enviado un email de confirmación, presiona en el enlace'
    })
}

const comprobar = async (req, res) =>{
    const {token} = req.params

    //Verificar si el token es válido
    const usuario = await Usuario.findOne({where: {token}})
    if(!usuario){
        return res.render('auth/confirmar-cuenta',{
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
            error: true
        })
    }
    usuario.token = null
    usuario.confirmado=true
    await usuario.save()
    
    res.render('auth/confirmar-cuenta',{
            pagina: 'Cuenta confirmada',
            mensaje: 'La cuenta se confirmó correctamente'
    })
}
const formularioOlvidePassword = (req, res) =>{
    res.render('auth/olvide-password', {
        pagina: 'Generar nueva contraseña',
        csrfToken: req.csrfToken()
    })
}
const resetearPassword = async (req, res) => {
    //Verifica que se esté ingresando un correo
    await check('email').isEmail().withMessage('Correo electrónico no válido').run(req)

    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        return res.render('auth/olvide-password', {
            pagina: 'Generar nueva contraseña',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }
    //Busca si el usuario existe
    const {email} = req.body
    const usuario = await Usuario.findOne({where: {email}})
    if(!usuario){
        return res.render('auth/olvide-password',{
            pagina: 'Recupera tu acceso a bienes raíces',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'No hay ningún usuario relacionado con el email proporcionado'}]
        })
    }

    //Generar nuevo token
    usuario.token = generarId()
    await usuario.save()

    //Enviar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })
    res.render('templates/mensaje',{
        pagina: 'Reestable tu contraseña',
        mensaje: 'Se ha enviado un email con las instrucciones'
    })

}
const comprobarToken = async (req, res) =>{
    const {token} = req.params
    const usuario = await Usuario.findOne({where: {token}})
    if(!usuario){
        return res.render('auth/confirmar-cuenta',{
            pagina: 'Reestablece tu contraseña',
            mensaje: 'Parece que el enlace ha expirado, intenta de nuevo',
            error: true
        })
    }
    res.render('auth/reset-password',{
        pagina: 'Reestablece tu password',
        csrfToken: req.csrfToken()
    })
}
const nuevoPassword = async (req, res) =>{
    await check('password').isLength({min: 6}).withMessage('El password debe tener al menos 6 dígitos').run(req)
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){
        return res.render('auth/reset-password',{
            pagina: 'Reestablece tu contraseña',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }
    const {token} = req.params
    const {password} = req.body

    //Identificar al usuario que hizo la solicitud
    const usuario = await Usuario.findOne({where: {token}})

    //Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt)
    usuario.token = null

    await usuario.save()

    res.render('auth/confirmar-cuenta',{
        pagina: 'Contraseña reestablecida',
        mensaje: 'La contraseña se guardó correctamente'
    })
}

export {
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegistro,
    registrar,
    comprobar,
    formularioOlvidePassword,
    resetearPassword,
    comprobarToken,
    nuevoPassword
}