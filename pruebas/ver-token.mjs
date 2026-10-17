// Muestra lo que lleva por dentro el token guardado. No lo valida: solo decodifica la parte central.
//   node pruebas/ver-token.mjs        (token web)
//   node pruebas/ver-token.mjs mcp    (token del servidor MCP)
import { leerToken } from './comun.mjs';

const tipo = process.argv[2] ?? 'web';
const [cabecera, carga, firma] = leerToken(tipo).split('.');
const decodificar = (parte) => JSON.parse(Buffer.from(parte, 'base64url').toString('utf8'));
console.log('Cabecera:', JSON.stringify(decodificar(cabecera)));
const datos = decodificar(carga);
console.log('Carga:   ', JSON.stringify(datos));
console.log(`Emitido: ${new Date(datos.iat * 1000).toLocaleString('es-CO')}  |  Vence: ${new Date(datos.exp * 1000).toLocaleString('es-CO')}`);
console.log(`Firma:    ${firma.slice(0, 12)}… (solo la puede producir quien conoce JWT_SECRETO)`);
