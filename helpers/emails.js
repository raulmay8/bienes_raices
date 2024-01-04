import nodemailer from 'nodemailer'

const emailRegistro = async (datos) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })
      const {email, nombre, token} = datos

      //Enviar el email
      await transport.sendMail({
        from: 'BienesRaices.com',
        to: email,
        subject: 'Confirma tu cuenta en BienesRaices.com',
        text: 'Confirma tu cuenta bro',
        html:`
            <p>Hola ${nombre}, comprueba tu cuenta</p>
            <p>Tu cuenta ya está lista, solo debes confirmarla en el siguiente enlace:
            <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/comprobar/${token}">Confirmar cuenta</a></p>

            <p>Si no has solicitado esto puedes ignorar el mensaje</p>
        `
      })
}
const emailOlvidePassword = async (datos) => {
    const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      })
      const {email, nombre, token} = datos

      //Enviar el email
      await transport.sendMail({
        from: 'BienesRaices.com',
        to: email,
        subject: 'Reestablece tu contraseña en BienesRaices.com',
        text: 'Reestablece tu contraseña bro',
        html:`
            <p>Hola ${nombre}, reestablece tu contraseña</p>
            <p>Presiona el enlace para generar una nueva contraseña: 
            <a href="${process.env.BACKEND_URL}:${process.env.PORT ?? 3000}/auth/olvide-password/${token}">Reestablecer contraseña</a></p>

            <p>Si no has solicitado esto puedes ignorar el mensaje</p>
        `
      })
}

export { 
    emailRegistro, emailOlvidePassword
}