import Propiedad from "./Propiedad.js";
import Precio from "./Precio.js";
import Categoria from "./Categoria.js";
import Usuario from "./Usuario.js"
import Mensaje from "./Mensaje.js";

Propiedad.belongsTo(Precio, {foreignKey: 'precioId'})
Propiedad.belongsTo(Categoria)
Propiedad.belongsTo(Usuario)

Mensaje.belongsTo(Propiedad, { foreignKey: 'propiedadId' })
Mensaje.belongsTo(Usuario)

//Relación a la inversa
Propiedad.hasMany(Mensaje, {foreignKey:'propiedadId'})

export {
    Propiedad,
    Precio,
    Categoria,
    Usuario,
    Mensaje
}