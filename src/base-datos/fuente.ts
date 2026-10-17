import '../config.js';
import { DataSource } from 'typeorm';
import { opcionesBaseDatos } from './opciones.js';

// La usan los comandos npm run migracion:generar, migracion:correr y
// migracion:revertir.
export default new DataSource(opcionesBaseDatos);
