// Crea una cuenta de cliente.   node pruebas/registrar.mjs "Nombre Apellido" <correo> <clave>
import { pedir } from './comun.mjs';

const [nombre, correo, clave] = process.argv.slice(2);
if (!nombre || !correo || !clave) {
  console.error('Uso: node pruebas/registrar.mjs "Nombre Apellido" <correo> <clave>');
  process.exit(1);
}
const r = await pedir('/api/auth/registro', { metodo: 'POST', cuerpo: { nombre, correo, clave } });
console.log(`HTTP ${r.estado}`);
console.log(JSON.stringify(r.json ?? r.texto, null, 2));
