import '../config.js';
import { DataSource } from 'typeorm';
import { requerida } from '../config.js';
import { Negocio } from '../negocio/negocio.entity.js';
import { Producto } from '../negocio/producto.entity.js';
import { cifrarClave } from '../usuarios/claves.js';
import { Usuario } from '../usuarios/usuario.entity.js';
import { opcionesBaseDatos } from './opciones.js';

// Carga los datos iniciales. Se puede ejecutar varias veces: actualiza en lugar de
// duplicar.
const db = await new DataSource(opcionesBaseDatos).initialize();

await db.getRepository(Negocio).save({
  id: 1,
  nombre: 'Panadería La Espiga',
  horario: 'Lunes a sábado de 6:00 a.m. a 8:00 p.m. Domingos y festivos cerrado.',
  domicilioZona: 'Solo en el casco urbano',
  domicilioCosto: 3000,
  domicilioTiempo: '40 minutos',
});

await db.getRepository(Producto).save([
  { id: 'pan-integral', nombre: 'Pan integral', precio: 800 },
  { id: 'pan-alinado', nombre: 'Pan aliñado', precio: 600 },
  { id: 'pandebono', nombre: 'Pandebono', precio: 1200 },
  { id: 'bunuelo', nombre: 'Buñuelo', precio: 1000 },
  { id: 'torta-30', nombre: 'Torta para 30 personas', precio: 95000 },
]);

// El primer administrador sale del archivo .env; los demás usuarios se registran por
// la API.
const correo = requerida('ADMIN_CORREO').toLowerCase();
const clave = requerida('ADMIN_CLAVE');
if (clave.length < 10)
  throw new Error('ADMIN_CLAVE debe tener al menos 10 caracteres');
const usuarios = db.getRepository(Usuario);
const existente = await usuarios.findOneBy({ correo });
await usuarios.save({
  ...(existente ?? {}),
  nombre: existente?.nombre ?? 'Administrador',
  correo,
  rol: 'admin',
  claveHash: await cifrarClave(clave),
});

console.log(`Semilla cargada: 1 negocio, 5 productos y el administrador ${correo}`);
await db.destroy();
