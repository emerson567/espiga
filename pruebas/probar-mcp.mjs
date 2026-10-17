// Cliente de prueba del servidor MCP, con el token MCP de la sesión iniciada.
//   node pruebas/probar-mcp.mjs                                 lista las herramientas
//   node pruebas/probar-mcp.mjs buscar_productos texto=pan       llama una herramienta
//   node pruebas/probar-mcp.mjs crear_pedido pruebas/pedido.json
//   node pruebas/probar-mcp.mjs --url https://…/mcp             otra dirección (por ejemplo, el túnel)
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { readFileSync } from 'node:fs';
import { BASE, leerToken } from './comun.mjs';

const args = process.argv.slice(2);
let url = `${BASE}/mcp`;
const i = args.indexOf('--url');
if (i >= 0) [, url] = args.splice(i, 2);
const [herramienta, ...resto] = args;

const transporte = new StreamableHTTPClientTransport(new URL(url), {
  requestInit: { headers: { Authorization: `Bearer ${leerToken('mcp')}` } },
});
const cliente = new Client({ name: 'probar-mcp', version: '2.0.0' }, { versionNegotiation: { mode: 'auto' } });
const inicio = Date.now();
try {
  await cliente.connect(transporte);
  console.log(`Conectado a "${cliente.getServerVersion()?.name}" ${cliente.getServerVersion()?.version}. Protocolo ${cliente.getNegotiatedProtocolVersion?.() ?? ''}`);
  if (!herramienta) {
    const { tools } = await cliente.listTools();
    console.log(`Herramientas: ${tools.length}`);
    for (const t of tools) console.log(`- ${t.name} (${t.annotations?.readOnlyHint ? 'solo lectura' : 'escribe'})`);
  } else {
    let argumentos = {};
    if (resto[0]?.endsWith('.json')) argumentos = JSON.parse(readFileSync(resto[0], 'utf8'));
    else for (const par of resto) argumentos[par.slice(0, par.indexOf('='))] = par.slice(par.indexOf('=') + 1);
    const r = await cliente.callTool({ name: herramienta, arguments: argumentos });
    console.log(r.isError ? 'La herramienta devolvió un ERROR:' : 'Resultado:');
    for (const c of r.content ?? []) console.log(c.type === 'text' ? c.text : c);
  }
  console.log(`(${Date.now() - inicio} ms)`);
  await cliente.close();
} catch (error) {
  console.error('No fue posible:', error.message);
  process.exit(1);
}
