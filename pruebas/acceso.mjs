// Banco de pruebas de acceso: comprueba quién puede hacer qué en la API y en el servidor MCP.
//   node pruebas/acceso.mjs
// Crea usuarios de prueba nuevos en cada corrida y deja el detalle en pruebas/resultados-acceso.csv
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BASE, CARPETA, pedir } from './comun.mjs';

const resultados = [];
function prueba(grupo, nombre, esperado, obtenido, detalle = '') {
  const ok = String(esperado) === String(obtenido);
  resultados.push({ grupo, nombre, esperado, obtenido, ok, detalle });
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${grupo.padEnd(9)} ${nombre.padEnd(62)} esperado ${String(esperado).padEnd(5)} obtenido ${obtenido}${ok || !detalle ? '' : '  ' + detalle}`);
}

// ---------- preparación: tres usuarios nuevos y el administrador del archivo .env ----------
const sufijo = Date.now().toString(36);
const CLAVE = 'Pandebono2026';
const correo = (nombre) => `${nombre}.${sufijo}@prueba.test`;

const salud = await pedir('/api/salud');
prueba('público', 'GET /api/salud responde sin token', 200, salud.estado);
if (salud.estado !== 200) {
  console.error('La API o la base de datos no responden. Revise npm start y docker compose ps.');
  process.exit(1);
}

async function crearYEntrar(nombre) {
  await pedir('/api/auth/registro', { metodo: 'POST', cuerpo: { nombre, correo: correo(nombre.toLowerCase()), clave: CLAVE } });
  const r = await pedir('/api/auth/entrar', { metodo: 'POST', cuerpo: { correo: correo(nombre.toLowerCase()), clave: CLAVE } });
  return { ...r.json.usuario, token: r.json.token };
}
const entradaAdmin = await pedir('/api/auth/entrar', {
  metodo: 'POST', cuerpo: { correo: process.env.ADMIN_CORREO, clave: process.env.ADMIN_CLAVE },
});
if (entradaAdmin.estado === 429) {
  console.error('La ruta de entrar está bloqueada por la corrida anterior. Espere un minuto y repita.');
  process.exit(1);
}
const admin = entradaAdmin.json;
if (!admin?.token) {
  console.error('No fue posible entrar como administrador. Revise ADMIN_CORREO y ADMIN_CLAVE y ejecute npm run semilla.');
  process.exit(1);
}
const ana = await crearYEntrar('Ana');
const beto = await crearYEntrar('Beto');
const carla = await crearYEntrar('Carla');
const promovida = await pedir(`/api/usuarios/${carla.id}/rol`, { metodo: 'PATCH', cuerpo: { rol: 'empleado' }, token: admin.token });
prueba('admin', 'El administrador vuelve empleada a Carla', 200, promovida.estado);

// ---------- 1. Identidad ----------
prueba('identidad', 'GET /api/productos sin token (catálogo público)', 200, (await pedir('/api/productos')).estado);
prueba('identidad', 'GET /api/pedidos sin token', 401, (await pedir('/api/pedidos')).estado);
prueba('identidad', 'GET /api/pedidos con un token inventado', 401, (await pedir('/api/pedidos', { token: 'abc.def.ghi' })).estado);
const alterado = ana.token.slice(0, -4) + (ana.token.endsWith('AAAA') ? 'BBBB' : 'AAAA');
prueba('identidad', 'GET /api/pedidos con la firma del token alterada', 401, (await pedir('/api/pedidos', { token: alterado })).estado);
prueba('identidad', 'Entrar con clave errada', 401, (await pedir('/api/auth/entrar', { metodo: 'POST', cuerpo: { correo: correo('ana'), clave: 'otra-clave-123' } })).estado);
prueba('identidad', 'Entrar con un correo que no existe (mismo error)', 401, (await pedir('/api/auth/entrar', { metodo: 'POST', cuerpo: { correo: correo('nadie'), clave: CLAVE } })).estado);

// ---------- 2. Registro ----------
prueba('registro', 'Registrarse con un correo que ya existe', 409, (await pedir('/api/auth/registro', { metodo: 'POST', cuerpo: { nombre: 'Ana 2', correo: correo('ana'), clave: CLAVE } })).estado);
prueba('registro', 'Registrarse con una clave de 6 caracteres', 400, (await pedir('/api/auth/registro', { metodo: 'POST', cuerpo: { nombre: 'Dora', correo: correo('dora'), clave: 'abc123' } })).estado);
prueba('registro', 'Registrarse enviando "rol": "admin" (campo no permitido)', 400, (await pedir('/api/auth/registro', { metodo: 'POST', cuerpo: { nombre: 'Eva', correo: correo('eva'), clave: CLAVE, rol: 'admin' } })).estado);
const yoAna = await pedir('/api/auth/yo', { token: ana.token });
prueba('registro', 'Una cuenta nueva siempre queda con rol cliente', 'cliente', yoAna.json?.rol);

// ---------- 3. Pedidos: cada cliente ve solo lo suyo ----------
const pedidoAna = await pedir('/api/pedidos', { metodo: 'POST', token: ana.token, cuerpo: { items: [{ producto: 'pandebono', cantidad: 10 }], domicilio: false } });
prueba('pedidos', 'Ana crea un pedido', 201, pedidoAna.estado);
const codAna = pedidoAna.json?.codigo;
prueba('pedidos', 'El pedido queda a nombre de Ana (sale del token)', 'Ana', pedidoAna.json?.cliente);
prueba('pedidos', 'Crear un pedido enviando "cliente" en el cuerpo', 400, (await pedir('/api/pedidos', { metodo: 'POST', token: beto.token, cuerpo: { cliente: 'Ana', items: [{ producto: 'pandebono', cantidad: 1 }], domicilio: false } })).estado);
prueba('pedidos', 'Crear un pedido con cantidad 500', 400, (await pedir('/api/pedidos', { metodo: 'POST', token: beto.token, cuerpo: { items: [{ producto: 'pandebono', cantidad: 500 }], domicilio: false } })).estado);
prueba('pedidos', 'Crear un pedido con un producto que no existe', 400, (await pedir('/api/pedidos', { metodo: 'POST', token: beto.token, cuerpo: { items: [{ producto: 'croissant', cantidad: 1 }], domicilio: false } })).estado);
prueba('pedidos', 'Ana consulta su pedido', 200, (await pedir(`/api/pedidos/${codAna}`, { token: ana.token })).estado);
prueba('pedidos', 'Beto consulta el pedido de Ana (no debe saber que existe)', 404, (await pedir(`/api/pedidos/${codAna}`, { token: beto.token })).estado);
const listaBeto = await pedir('/api/pedidos', { token: beto.token });
prueba('pedidos', 'La lista de Beto no incluye el pedido de Ana', 'no', listaBeto.json?.some((p) => p.codigo === codAna) ? 'sí' : 'no');
prueba('pedidos', 'Carla (empleada) consulta el pedido de Ana', 200, (await pedir(`/api/pedidos/${codAna}`, { token: carla.token })).estado);

// ---------- 4. Estados: quién puede mover un pedido ----------
const estado = (cod, nuevo, token) => pedir(`/api/pedidos/${cod}/estado`, { metodo: 'PATCH', token, cuerpo: { estado: nuevo } });
prueba('estados', 'Ana pasa su pedido a preparando', 403, (await estado(codAna, 'preparando', ana.token)).estado);
prueba('estados', 'Carla pasa el pedido de Ana a preparando', 200, (await estado(codAna, 'preparando', carla.token)).estado);
prueba('estados', 'Ana cancela su pedido cuando ya está preparando', 403, (await estado(codAna, 'cancelado', ana.token)).estado);
prueba('estados', 'Carla pasa el pedido de preparando a entregado (salta un paso)', 400, (await estado(codAna, 'entregado', carla.token)).estado);
prueba('estados', 'Carla pasa el pedido a despachado', 200, (await estado(codAna, 'despachado', carla.token)).estado);
const otro = await pedir('/api/pedidos', { metodo: 'POST', token: ana.token, cuerpo: { items: [{ producto: 'bunuelo', cantidad: 2 }], domicilio: false } });
prueba('estados', 'Ana cancela un pedido suyo que está recibido', 200, (await estado(otro.json?.codigo, 'cancelado', ana.token)).estado);
prueba('estados', 'Beto cancela un pedido de Ana', 404, (await estado(codAna, 'cancelado', beto.token)).estado);

// ---------- 5. Administración de usuarios ----------
prueba('admin', 'Ana (cliente) lista los usuarios', 403, (await pedir('/api/usuarios', { token: ana.token })).estado);
prueba('admin', 'Carla (empleada) lista los usuarios', 403, (await pedir('/api/usuarios', { token: carla.token })).estado);
prueba('admin', 'El administrador lista los usuarios', 200, (await pedir('/api/usuarios', { token: admin.token })).estado);
prueba('admin', 'Ana se cambia a sí misma el rol a admin', 403, (await pedir(`/api/usuarios/${ana.id}/rol`, { metodo: 'PATCH', token: ana.token, cuerpo: { rol: 'admin' } })).estado);
const usuarios = await pedir('/api/usuarios', { token: admin.token });
prueba('admin', 'La lista de usuarios no incluye la huella de la clave', 'no', JSON.stringify(usuarios.json ?? '').includes('clave') ? 'sí' : 'no');

// ---------- 6. Tokens: cada puerta acepta solo su tipo ----------
const tokenMcpAna = (await pedir('/api/auth/token-mcp', { metodo: 'POST', token: ana.token })).json?.token;
const tokenMcpCarla = (await pedir('/api/auth/token-mcp', { metodo: 'POST', token: carla.token })).json?.token;
prueba('tokens', 'Usar el token MCP de Ana en la API REST', 401, (await pedir('/api/pedidos', { token: tokenMcpAna })).estado);
const mcpConTokenWeb = await fetch(`${BASE}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ana.token}` }, body: '{}' });
prueba('tokens', 'Usar el token web de Ana en el servidor MCP', 401, mcpConTokenWeb.status);
const mcpSinToken = await fetch(`${BASE}/mcp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
prueba('tokens', 'Llamar al servidor MCP sin token', 401, mcpSinToken.status);

// ---------- 7. Servidor MCP: cada rol ve sus herramientas ----------
// Llamar una herramienta que no existe es un error del protocolo, no un resultado: se cuenta como error.
const llamar = (c, name, args) => c.callTool({ name, arguments: args }).catch((e) => ({ isError: true, content: [{ text: e.message }] }));
async function conMcp(token, accion) {
  const transporte = new StreamableHTTPClientTransport(new URL(`${BASE}/mcp`), { requestInit: { headers: { Authorization: `Bearer ${token}` } } });
  const cliente = new Client({ name: 'acceso', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
  await cliente.connect(transporte);
  try { return await accion(cliente); } finally { await cliente.close(); }
}
const herramientasAna = await conMcp(tokenMcpAna, async (c) => (await c.listTools()).tools.map((t) => t.name));
const herramientasCarla = await conMcp(tokenMcpCarla, async (c) => (await c.listTools()).tools.map((t) => t.name));
prueba('mcp', 'Herramientas que ve Ana (cliente)', 5, herramientasAna.length, herramientasAna.join(','));
prueba('mcp', 'Ana no ve cambiar_estado_pedido', 'no', herramientasAna.includes('cambiar_estado_pedido') ? 'sí' : 'no');
prueba('mcp', 'Herramientas que ve Carla (empleada)', 6, herramientasCarla.length, herramientasCarla.join(','));
const forzada = await conMcp(tokenMcpAna, (c) => llamar(c, 'cambiar_estado_pedido', { codigo: codAna, estado: 'entregado' }));
prueba('mcp', 'Ana llama cambiar_estado_pedido a la fuerza', 'error', forzada.isError ? 'error' : 'ejecutada', JSON.stringify(forzada.content?.[0]?.text ?? '').slice(0, 80));
const pedidoBeto = await pedir('/api/pedidos', { metodo: 'POST', token: beto.token, cuerpo: { items: [{ producto: 'pan-integral', cantidad: 3 }], domicilio: false } });
const espia = await conMcp(tokenMcpAna, (c) => llamar(c, 'consultar_pedidos', { codigo: pedidoBeto.json?.codigo }));
prueba('mcp', 'Ana consulta por MCP el pedido de Beto', 'error', espia.isError ? 'error' : 'lo vio');
const porMcp = await conMcp(tokenMcpAna, (c) => llamar(c, 'crear_pedido', { items: [{ producto: 'torta-30', cantidad: 1 }], domicilio: false }));
const creado = porMcp.isError ? null : JSON.parse(porMcp.content[0].text);
prueba('mcp', 'Ana crea un pedido por MCP: queda a su nombre y con origen mcp', 'Ana/mcp', creado ? `${creado.cliente}/${creado.origen}` : 'error');
const entrega = await conMcp(tokenMcpCarla, (c) => llamar(c, 'cambiar_estado_pedido', { codigo: codAna, estado: 'entregado' }));
prueba('mcp', 'Carla entrega el pedido de Ana por MCP', 'entregado', entrega.isError ? 'error' : JSON.parse(entrega.content[0].text).estado);

// ---------- 8. Un cambio de rol se aplica de inmediato ----------
await pedir(`/api/usuarios/${carla.id}/rol`, { metodo: 'PATCH', cuerpo: { rol: 'cliente' }, token: admin.token });
prueba('rol', 'Con el mismo token, Carla (ya cliente) consulta el pedido de Ana', 404, (await pedir(`/api/pedidos/${codAna}`, { token: carla.token })).estado);
const herramientasDespues = await conMcp(tokenMcpCarla, async (c) => (await c.listTools()).tools.length);
prueba('rol', 'Con el mismo token MCP, Carla ve ahora 5 herramientas', 5, herramientasDespues);

// ---------- 9. Chat: la memoria es de cada persona ----------
const historialAna = await pedir('/api/chat/historial', { token: ana.token });
prueba('chat', 'GET /api/chat/historial de una cuenta nueva', 0, historialAna.json?.length);
prueba('chat', 'POST /api/chat sin token', 401, (await pedir('/api/chat', { metodo: 'POST', cuerpo: { mensaje: 'hola' } })).estado);

// ---------- 10. Fuerza bruta: después de 10 intentos por minuto, la ruta se bloquea ----------
let ultimo = 0, intentos = 0;
while (ultimo !== 429 && intentos < 15) {
  intentos++;
  ultimo = (await pedir('/api/auth/entrar', { metodo: 'POST', cuerpo: { correo: correo('beto'), clave: `intento-${intentos}-xx` } })).estado;
}
prueba('límite', 'Intentos seguidos de entrar hasta que la API los bloquea', 429, ultimo, `bloqueó en el intento ${intentos}`);

// ---------- resumen ----------
const bien = resultados.filter((r) => r.ok).length;
console.log(`\nRESUMEN: ${bien} de ${resultados.length} pruebas de acceso correctas`);
const csv = ['grupo;prueba;esperado;obtenido;resultado']
  .concat(resultados.map((r) => [r.grupo, r.nombre, r.esperado, r.obtenido, r.ok ? 'OK' : 'FALLA'].join(';')))
  .join('\n');
writeFileSync(join(CARPETA, 'resultados-acceso.csv'), csv + '\n');
console.log('Detalle en pruebas/resultados-acceso.csv');
console.log('Nota: durante un minuto, la ruta de entrar queda bloqueada para este equipo.');
process.exit(bien === resultados.length ? 0 : 1);
