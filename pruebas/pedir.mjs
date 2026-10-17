// Envía un pedido a la API con el token de la sesión iniciada.   node pruebas/pedir.mjs [archivo.json]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARPETA, leerToken, pedir } from './comun.mjs';

const archivo = process.argv[2] ?? join(CARPETA, 'pedido.json');
const r = await pedir('/api/pedidos', { metodo: 'POST', cuerpo: JSON.parse(readFileSync(archivo, 'utf8')), token: leerToken('web') });
console.log(`HTTP ${r.estado}`);
console.log(r.json ? JSON.stringify(r.json, null, 2) : r.texto);
