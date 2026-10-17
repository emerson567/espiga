// Consulta la base de datos con los datos de conexión de ia-sena/.env.
//   node pruebas/sql.mjs pedidos            consultas guardadas: tablas, usuarios, pedidos, mensajes
//   node pruebas/sql.mjs "select * from productos"
import pg from 'pg';
import './comun.mjs';

const GUARDADAS = {
  tablas: `select table_name as tabla from information_schema.tables
           where table_schema = 'public' order by 1`,
  usuarios: `select nombre, correo, rol, left(clave_hash, 30) as clave_hash
             from usuarios order by creado_en`,
  pedidos: `select p.id, u.nombre as cliente, i.producto_id as producto, i.cantidad,
                   i.precio_unitario as precio, i.subtotal, p.total, p.estado
            from pedidos p
            join usuarios u on u.id = p.usuario_id
            join pedido_items i on i.pedido_id = p.id
            order by p.id, i.id`,
  mensajes: `select u.nombre, m.sesion, m.rol, left(m.contenido, 40) as contenido
             from mensajes m join usuarios u on u.id = m.usuario_id order by m.id`,
};
const consulta = GUARDADAS[process.argv[2]] ?? process.argv[2];
if (!consulta) {
  console.error('Uso: node pruebas/sql.mjs <tablas|usuarios|pedidos|mensajes|"consulta SQL">');
  process.exit(1);
}
// Tabla de texto simple, como la de psql.
function imprimir(filas) {
  const columnas = Object.keys(filas[0]);
  const texto = (v) => (v instanceof Date ? v.toISOString() : String(v ?? ''));
  const ancho = columnas.map((c) => Math.max(c.length, ...filas.map((f) => texto(f[c]).length)));
  const linea = (valores) => valores.map((v, i) => v.padEnd(ancho[i])).join(' | ').trimEnd();
  console.log(linea(columnas));
  console.log(ancho.map((a) => '-'.repeat(a)).join('-+-'));
  for (const f of filas) console.log(linea(columnas.map((c) => texto(f[c]))));
  console.log(`(${filas.length} ${filas.length === 1 ? 'fila' : 'filas'})`);
}

const cliente = new pg.Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PUERTO ?? 5432),
  user: process.env.DB_USUARIO,
  password: process.env.DB_CLAVE,
  database: process.env.DB_NOMBRE,
});
try {
  await cliente.connect();
  const r = await cliente.query(consulta);
  if (r.rows.length) imprimir(r.rows);
  else console.log(`(${r.command}: ${r.rowCount ?? 0} filas)`);
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exitCode = 1;
} finally {
  await cliente.end();
}
