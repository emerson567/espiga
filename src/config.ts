import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Carpeta del proyecto (espiga-pro), sin importar desde dónde se ejecute el programa.
export const RAIZ = join(import.meta.dirname, '..');

// Las variables están en ia-sena/.env, el mismo archivo de las sesiones anteriores.
const archivo = join(RAIZ, '..', '.env');
if (existsSync(archivo)) process.loadEnvFile(archivo);

// Una variable obligatoria que falta detiene el programa con un mensaje claro.
export function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor)
    throw new Error(`Falta la variable ${nombre} en el archivo ia-sena/.env`);
  return valor;
}
