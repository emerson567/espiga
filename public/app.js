// Página del chat de La Espiga. El token vive en sessionStorage: se borra al cerrar la pestaña.
const $ = (id) => document.getElementById(id);
let token = null;
let registrando = false;

function guardarToken(valor) {
  token = valor;
  try { valor ? sessionStorage.setItem('token', valor) : sessionStorage.removeItem('token'); } catch {}
}

async function api(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (respuesta.status === 401 && token) salir();
  return respuesta;
}

async function mensajeDeError(respuesta) {
  try {
    const cuerpo = await respuesta.json();
    return [].concat(cuerpo.message ?? cuerpo.error ?? `HTTP ${respuesta.status}`).join('. ');
  } catch { return `HTTP ${respuesta.status}`; }
}

function agregar(rol, contenido) {
  const caja = document.createElement('div');
  caja.className = 'm ' + rol;
  caja.textContent = contenido;
  $('mensajes').appendChild(caja);
  $('mensajes').scrollTop = $('mensajes').scrollHeight;
  return caja;
}

async function mostrarChat() {
  const yo = await api('/api/auth/yo');
  if (!yo.ok) return salir();
  const usuario = await yo.json();
  $('quien').textContent = `${usuario.nombre} · rol ${usuario.rol}`;
  $('acceso').hidden = true;
  $('chat').hidden = false;
  $('salir').hidden = false;
  $('mensajes').innerHTML = '';
  // La conversación anterior viene de la base de datos.
  const historial = await (await api('/api/chat/historial')).json();
  if (historial.length === 0) agregar('assistant', `Buen día, ${usuario.nombre}. Soy Espiga. ¿En qué le puedo ayudar?`);
  for (const m of historial) agregar(m.rol, m.contenido);
  $('texto').focus();
}

function salir() {
  guardarToken(null);
  $('acceso').hidden = false;
  $('chat').hidden = true;
  $('salir').hidden = true;
  $('quien').textContent = 'Asistente de práctica. Responde un modelo que corre en este equipo.';
}

$('cambiarModo').addEventListener('click', () => {
  registrando = !registrando;
  $('campoNombre').hidden = !registrando;
  $('nombre').required = registrando;
  $('tituloAcceso').textContent = registrando ? 'Crear cuenta' : 'Entrar';
  $('botonAcceso').textContent = registrando ? 'Crear cuenta' : 'Entrar';
  $('cambiarModo').textContent = registrando ? '¿Ya tiene cuenta? Entre' : '¿No tiene cuenta? Regístrese';
  $('errorAcceso').textContent = '';
});

$('acceso').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  $('errorAcceso').textContent = '';
  const correo = $('correo').value.trim();
  const clave = $('clave').value;
  if (registrando) {
    const r = await api('/api/auth/registro', { method: 'POST', body: JSON.stringify({ nombre: $('nombre').value.trim(), correo, clave }) });
    if (!r.ok) return ($('errorAcceso').textContent = await mensajeDeError(r));
  }
  const r = await api('/api/auth/entrar', { method: 'POST', body: JSON.stringify({ correo, clave }) });
  if (!r.ok) return ($('errorAcceso').textContent = await mensajeDeError(r));
  guardarToken((await r.json()).token);
  $('clave').value = '';
  await mostrarChat();
});

$('salir').addEventListener('click', salir);

$('formulario').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const mensaje = $('texto').value.trim();
  if (!mensaje) return;
  agregar('user', mensaje);
  $('texto').value = '';
  $('enviar').disabled = true;
  const caja = agregar('assistant', '…');
  try {
    const respuesta = await api('/api/chat', { method: 'POST', body: JSON.stringify({ mensaje }) });
    if (!respuesta.ok) throw new Error(await mensajeDeError(respuesta));
    // Se lee la respuesta por partes y se va escribiendo en la pantalla.
    const lector = respuesta.body.pipeThrough(new TextDecoderStream()).getReader();
    caja.textContent = '';
    for (;;) {
      const { value, done } = await lector.read();
      if (done) break;
      caja.textContent += value;
      $('mensajes').scrollTop = $('mensajes').scrollHeight;
    }
  } catch (error) {
    caja.textContent = 'No fue posible responder: ' + error.message;
  }
  $('enviar').disabled = false;
  $('texto').focus();
});

try { token = sessionStorage.getItem('token'); } catch {}
if (token) mostrarChat();
