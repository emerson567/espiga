// Llama cualquier ruta de la API con el token de la sesión iniciada (pruebas/.token-web).
//   node pruebas/api.mjs GET /api/pedidos
//   node pruebas/api.mjs PATCH /api/pedidos/P-0001/estado estado=preparando
//   node pruebas/api.mjs POST /api/pedidos pruebas/pedido.json
//   node pruebas/api.mjs GET /api/pedidos --sin-token
// Los datos van como clave=valor (texto) o en un archivo .json.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARPETA, leerToken, pedir } from './comun.mjs';

const args = process.argv.slice(2);
const sinToken = args.includes('--sin-token');
const [metodo, ruta, ...datos] = args.filter((a) => a !== '--sin-token');
if (!metodo || !ruta?.startsWith('/')) {
  console.error('Uso: node pruebas/api.mjs <GET|POST|PATCH> </api/ruta> [clave=valor ... | archivo.json] [--sin-token]');
  process.exit(1);
}
let cuerpo;
if (datos[0]?.endsWith('.json')) cuerpo = JSON.parse(readFileSync(existsSync(datos[0]) ? datos[0] : join(CARPETA, datos[0]), 'utf8'));
else if (datos.length) cuerpo = Object.fromEntries(datos.map((d) => [d.slice(0, d.indexOf('=')), d.slice(d.indexOf('=') + 1)]));

const r = await pedir(ruta, { metodo: metodo.toUpperCase(), cuerpo, token: sinToken ? undefined : leerToken('web') });
console.log(`HTTP ${r.estado}`);
console.log(r.json ? JSON.stringify(r.json, null, 2) : r.texto);
