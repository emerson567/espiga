// Utilidades compartidas por los programas de prueba.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const CARPETA = import.meta.dirname;
try { process.loadEnvFile(join(CARPETA, '..', '..', '.env')); } catch {}
export const BASE = process.env.API_URL ?? `http://localhost:${process.env.PUERTO ?? 3000}`;

// Los tokens se guardan en archivos ocultos de esta carpeta (están en .gitignore).
const archivo = (tipo) => join(CARPETA, `.token-${tipo}`);
export const guardarToken = (tipo, token) => writeFileSync(archivo(tipo), token);
export function leerToken(tipo) {
  if (!existsSync(archivo(tipo))) {
    console.error('No hay sesión. Primero: node pruebas/entrar.mjs <correo> <clave>');
    process.exit(1);
  }
  return readFileSync(archivo(tipo), 'utf8').trim();
}

export async function pedir(ruta, { metodo = 'GET', cuerpo, token } = {}) {
  try {
    const r = await fetch(BASE + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
    const texto = await r.text();
    let json = null;
    try { json = JSON.parse(texto); } catch {}
    return { estado: r.status, json, texto };
  } catch {
    console.error(`No hay conexión con ${BASE}. ¿Está corriendo la API (npm start)?`);
    process.exit(1);
  }
}
