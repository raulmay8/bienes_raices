import express from "express";
import  { autenticar, comprobar, cerrarSesion, comprobarToken, formularioLogin, formularioOlvidePassword, 
        formularioRegistro, nuevoPassword, registrar, resetearPassword
        } from "../controllers/usuarioController.js";

const router = express.Router()

router.get('/login', formularioLogin)
router.post('/login', autenticar)

router.post('/cerrar-sesion', cerrarSesion)

router.get('/registro', formularioRegistro)
router.post('/registro', registrar)
router.get('/comprobar/:token', comprobar)

router.get('/olvide-password', formularioOlvidePassword)
router.post('/olvide-password', resetearPassword)

//Almacenar nueva contraseña
router.get('/olvide-password/:token', comprobarToken)
router.post('/olvide-password/:token', nuevoPassword)

export default router