// Conversa con el chatbot con el token de la sesión iniciada.   node pruebas/chat.mjs "mensaje" [sesion]
import { BASE, leerToken } from './comun.mjs';

const [mensaje, sesion = 'terminal'] = process.argv.slice(2);
if (!mensaje) {
  console.error('Uso: node pruebas/chat.mjs "mensaje" [sesion]');
  process.exit(1);
}
const inicio = Date.now();
let primera = 0;
try {
  const r = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leerToken('web')}` },
    body: JSON.stringify({ sesion, mensaje }),
  });
  if (!r.ok) {
    console.log(`HTTP ${r.status}: ${(await r.json()).message}`);
    process.exit(1);
  }
  for await (const parte of r.body.pipeThrough(new TextDecoderStream())) {
    if (!primera) primera = Date.now() - inicio;
    process.stdout.write(parte);
  }
  console.log(`\n[primera parte a los ${primera} ms | respuesta completa en ${Date.now() - inicio} ms]`);
} catch {
  console.error(`No hay conexión con ${BASE}. ¿Está corriendo la API (npm start)?`);
  process.exit(1);
}
