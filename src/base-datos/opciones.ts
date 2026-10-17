import type { DataSourceOptions } from 'typeorm';
import { join } from 'node:path';
import { RAIZ, requerida } from '../config.js';

// Una sola configuración para la API y para los comandos de migración.
export const opcionesBaseDatos: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PUERTO ?? 5432),
  username: requerida('DB_USUARIO'),
  password: requerida('DB_CLAVE'),
  database: requerida('DB_NOMBRE'),
  // Toda clase en un archivo *.entity.js es una tabla; las migraciones están en su
  // carpeta.
  entities: [join(RAIZ, 'dist', '**', '*.entity.js')],
  migrations: [join(RAIZ, 'dist', 'base-datos', 'migraciones', '*.js')],
  // Las tablas solo cambian con migraciones, nunca de forma automática.
  synchronize: false,
};
