(function(){
    const lat = 21.163633;
    const lng = -86.8458795;
    const mapa = L.map('mapa-inicio').setView([lat, lng ], 13);

    let markers = new L.featureGroup().addTo(mapa)
    
    let propiedades = []

    //Filtros
    const filtros = {
        categoria: '',
        precio: ''
    }

    const categoriasSelect = document.querySelector('#categorias')
    const precioSelect = document.querySelector('#precios')

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

    //Filtrado de los select categorias y precios
    categoriasSelect.addEventListener('change', e => {
        filtros.categoria = +e.target.value
        filtrarPropiedades()
    })
    precioSelect.addEventListener('change', e => {
        filtros.precio = +e.target.value
        filtrarPropiedades()
    })

    const obtenerPropiedades = async () =>{
        try {

            //hago la consulta a la api propiedades y la paso a la variable mostrarPropiedades 
            const url = '/api/propiedades'
            const respuesta = await fetch(url)
            propiedades = await respuesta.json()

            mostrarPropiedades(propiedades)

        } catch (error) {
            console.log(error)
        }
    }

    const mostrarPropiedades = propiedades => {
        //Filtro por pines
        markers.clearLayers()

        propiedades.forEach(propiedad => {


            //Agrega los pines en el mapa
            const marker = new L.marker([propiedad?.lat, propiedad?.lng], {
                autoPan: true
            })
            .addTo(mapa)
            .bindPopup(`
                <p class="text-indigo-600 font-bold">${propiedad.categoria.nombre}</p>
                <h1 class="text-xl font-extrabold uppercase py-2">${propiedad?.titulo}</h1>
                <img src="/uploads/${propiedad?.imagen}" alt="Imagen de la propiedad ${propiedad.titulo}">
                <p class="text-gray-600 font-bold">${propiedad.precio.nombre}</p>
                <a href="/propiedad/${propiedad.id}" class="bg-indigo-600 block p-2 text-center font-bold uppercase">Ver propiedad</a>
            `)

            markers.addLayer(marker)
        })
    }

    const filtrarPropiedades = async () =>{
        const resultado = propiedades.filter(filtrarCategoria).filter(filtrarPrecio)
        mostrarPropiedades(resultado)
    }
    //La función solo tiene un parámetro por lo que puedo eliminar el paréntesis y como tiene solo una línea
    //Puedo eliminar las llaves y también el return ya que se da por implícito
    /* const filtrarCategoria = (propiedad) => {
        return filtros.categoria ? propiedad.categoriaId === filtros.categoria : propiedad
    } */
    
    const filtrarCategoria = propiedad => filtros.categoria ? propiedad.categoriaId === filtros.categoria : propiedad

    const filtrarPrecio = propiedad => filtros.precio ? propiedad.precioId === filtros.precio : propiedad

    obtenerPropiedades()
})()