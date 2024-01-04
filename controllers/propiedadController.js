import { unlink } from 'node:fs/promises'
import { validationResult } from 'express-validator'
import { Precio, Categoria, Propiedad, Usuario, Mensaje} from '../models/index.js'
import { esVendedor, formatearFecha } from '../helpers/index.js'

const admin = async (req, res) => {

    //Renombro la variable pagina y uso req.query para usar el query string para poder hacer paginaciones
    const { pagina: paginaActual} = req.query

    //Entre dos diagonales uso una expresión regular, pongo un rango de entre 0 y 9 para que solo
    //Se usen números y que inicie y termine con solo dígitos y puede ser más de 1 con +
    const expresion = /^[1-9]+$/

    //Con .test verifico si se cumple lo que manda la página web(la expresion), 
    //si no se cumple me redirecciona a un link que le he proporcionado
    //De esa manera garantizo que siempre esté el query string
    if(!expresion.test(paginaActual)) {
        return res.redirect('/mis-propiedades?pagina=1')
    }

    try {
        const {id} = req.usuario

        const limit = 2
        const offset = ((paginaActual * limit) - limit) 

        //1*2-2=0 , 2*2-2=2, de esta manera indico que me muestre solo dos registros

    
        const [propiedades, total] = await Promise.all([
            Propiedad.findAll({
            
                //en sequelize hay limit y como la variable que estoy creando tiene el mismo nombre pues
                //no es necesario poner limit:limit, lo mismo pasa con offset
                limit,
                offset,
                where: {
                    usuarioId : id
                },
                include: [
                    { model: Categoria, as: 'categoria'},
                    { model: Precio, as: 'precio'},
                    { model: Mensaje, as: 'mensajes'}
                ],
            }),
            Propiedad.count({
                where: {
                    usuarioId : id
                }
            })
        ])
    
        res.render('propiedades/admin', {
            pagina: 'Mis propiedades',
            propiedades,
            csrfToken : req.csrfToken(),
            paginas: Math.ceil(total / limit),
            paginaActual: Number(paginaActual),
            total,
            limit,
            offset,
        })
        
    } catch (error) {
        console.log(error)
    }
}
const crear = async (req, res) => {
    //Consultar modelo de precio y categoría
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/crear', {
        pagina: 'Crear propiedad',
        csrfToken : req.csrfToken(),
        categorias,
        precios,
        datos: {}
    })
}
const guardar = async (req, res) => {
    //Validación
    let resultado = validationResult(req)

    if(!resultado.isEmpty()){

        const [categorias, precios] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ])
        return res.render('propiedades/crear', {
            pagina: 'Crear propiedad',
            csrfToken : req.csrfToken(),
            categorias,
            precios,
            errores: resultado.array(),
            datos: req.body
        })
    }
    //Crear registro

    const {titulo, descripcion, habitaciones, estacionamiento, 
            wc, calle, lat, lng, precio: precioId, categoria: categoriaId
        } = req.body
    
    const { id: usuarioId } = req.usuario

    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId,
            usuarioId,
            imagen: ''
        })
        const { id } = propiedadGuardada
        res.redirect(`/propiedades/agregar-imagen/${id}`)
    } catch (error) {
        console.log(error)
    }
}

const agregarImagen = async (req, res) => {

    const {id} = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //Validar que la propiedad no esté publicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades')
    }

    //Validar que la propiedad sea editada por el titular
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }
    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar imagen: ${propiedad.titulo}`,
        csrfToken : req.csrfToken(),
        propiedad
    })
}

const almacenarImagen = async(req, res, next) =>{
    const {id} = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //Validar que la propiedad no esté publicada
    if(propiedad.publicado){
        return res.redirect('/mis-propiedades')
    }

    //Validar que la propiedad sea editada por el titular
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()){
        return res.redirect('/mis-propiedades')
    }
    res.render('propiedades/agregar-imagen', {
        pagina: `Agregar imagen: ${propiedad.titulo}`,
        csrfToken : req.csrfToken(),
        propiedad
    })
    try {
        //Almacenar la imágen y publicar la propiedad
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1

        await propiedad.save()

        next()

    } catch (error) {
        console.log(error)
    }
}

const editar = async(req, res) => {

    //Extraer el URL
    const {id} = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }
    //Revisar que quien visita la URL, es el titular
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }

    //Consultar modelo de precio y categoría
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render('propiedades/editar', {
        pagina: `Editar propiedad: ${propiedad.titulo}`,
        csrfToken : req.csrfToken(),
        categorias,
        precios,
        datos: propiedad
    })
}

const guardarCambios = async(req, res)=>{
    //Verificar la validación
     let resultado = validationResult(req)

     if(!resultado.isEmpty()){
 
         const [categorias, precios] = await Promise.all([
             Categoria.findAll(),
             Precio.findAll()
         ])
         return res.render('propiedades/editar', {
             pagina: 'Editar propiedad',
             csrfToken : req.csrfToken(),
             categorias,
             precios,
             errores: resultado.array(),
             datos: req.body
         })
     }

    //Extraer el URL
    const {id} = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }
    //Revisar que quien visita la URL, es el titular
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }

    //Reescribir el objeto y actualizarlo
    try {
        const {titulo, descripcion, habitaciones, estacionamiento, 
            wc, calle, lat, lng, precio: precioId, categoria: categoriaId
        } = req.body

        propiedad.set({
            titulo,
            descripcion, 
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId
        })

        await propiedad.save()
        res.redirect('/mis-propiedades')
    } catch (error) {
        console.log(error)
    }
}

const eliminar = async(req, res) =>{
     //Extraer el URL
     const {id} = req.params

     //Validar que la propiedad exista
     const propiedad = await Propiedad.findByPk(id)
    //Sino existe me envía a la página mis-propiedades
     if(!propiedad){
         return res.redirect('/mis-propiedades')
     }
     //Revisar que quien visita la URL, es el titular
     if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
         return res.redirect('/mis-propiedades')
     }
     //Eliminar la imagen
     await unlink(`public/uploads/${propiedad.imagen}`)

     //Eliminar la propiedad
     await propiedad.destroy()
     res.redirect('/mis-propiedades')
}

//Modifica el estado de la propiedad
const cambiarEstado = async(req, res) =>{
    //Extraer el URL
    const {id} = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)
    //Sino existe me envía a la página mis-propiedades
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }
    //Revisar que quien visita la URL, es el titular
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }
    //Actualizar
    propiedad.publicado = !propiedad.publicado

    await propiedad.save()

    res.json({
        resultado: 'ok'
    })
}

const mostrarPropiedad = async(req, res) =>{

    const {id} = req.params

    //Comprobar que la página exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {model: Precio, as: 'precio'},
            {model: Categoria, as: 'categoria'},
            {model: Usuario, as: 'usuario'}
        ]
    })


    if(!propiedad || !propiedad.publicado){
        return res.redirect('/404')
    }
    res.render('propiedades/mostrar',{
        pagina: propiedad.titulo,
        propiedad,
        csrfToken : req.csrfToken(),
        usuario: req.usuario,
        esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId)
    })
}
const enviarMensaje = async(req, res) => {
    const {id} = req.params

    //Comprobar que la página exista
    const propiedad = await Propiedad.findByPk(id, {
        include: [
            {model: Precio, as: 'precio'},
            {model: Categoria, as: 'categoria'},
        ]
    })


    if(!propiedad){
        return res.redirect('/404')
    }

    let resultado = validationResult(req)

    if(!resultado.isEmpty()){

        return res.render('propiedades/mostrar', {
            propiedad,
            pagina: propiedad.titulo,
            csrfToken : req.csrfToken(),
            usuario: req.usuario,
            esVendedor: esVendedor(req.usuario?.id, propiedad.usuarioId),
            errores: resultado.array()
        })
    }

    //Es lo que ingresa el usuario
    const {mensaje} = req.body

    //Es lo que manda params
    const {id: propiedadId} = req.params

    //Datos del usuario
    const {id: usuarioId} = req.usuario

    //Almacenar mensaje
    await  Mensaje.create({
        mensaje,
        propiedadId,
        usuarioId
    })
    
    res.redirect('/')
}

const verMensaje = async(req, res) =>{
    const {id} = req.params

    //Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id,{
        include: [
            {model: Mensaje, as: 'mensajes',
                include: [
                    {model: Usuario.scope('eliminarPassword'), as: 'usuario'}
                ]
            },
        ],
    })
    if(!propiedad){
        return res.redirect('/mis-propiedades')
    }

    //Revisar que sea el propietario el que visita la URL
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()){
        return res.redirect('/mis-propiedades')
    }

    res.render('propiedades/mensajes', {
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha
    })
}

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    cambiarEstado,
    mostrarPropiedad,
    enviarMensaje,
    verMensaje
}