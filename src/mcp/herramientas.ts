import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { NegocioService } from '../negocio/negocio.service.js';
import { ESTADOS } from '../pedidos/pedido.entity.js';
import { PedidosService } from '../pedidos/pedidos.service.js';
import type { Actor } from '../usuarios/decoradores.js';

const resultado = (datos: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(datos, null, 2) }],
});

// Un error de negocio se devuelve como resultado, para que el modelo lo lea y
// corrija.
const fallo = (error: unknown) => ({
  isError: true,
  content: [
    { type: 'text' as const, text: (error as Error).message ?? String(error) },
  ],
});

const seguro = async (accion: () => Promise<unknown>) => {
  try {
    return resultado(await accion());
  } catch (error) {
    return fallo(error);
  }
};

// Se crea un servidor por petición y para un usuario concreto: cada rol ve solo sus
// herramientas.
export function crearServidorMcp(
  negocio: NegocioService,
  pedidos: PedidosService,
  actor: Actor,
): McpServer {
  const personal = actor.rol === 'empleado' || actor.rol === 'admin';
  const servidor = new McpServer(
    { name: 'espiga', version: '2.0.0' },
    {
      instructions:
        'Herramientas de la Panadería La Espiga (datos de práctica). ' +
        `Usuario: ${actor.nombre}, rol ${actor.rol}. ` +
        'Antes de crear un pedido, consulte el catálogo con buscar_productos ' +
        'y confirme con el usuario los productos, las cantidades y el total.',
    },
  );

  servidor.registerTool(
    'consultar_negocio',
    {
      title: 'Consultar información del negocio',
      description:
        'Devuelve el horario de atención y las condiciones del servicio a domicilio.',
      annotations: { readOnlyHint: true },
    },
    () => seguro(() => negocio.informacion()),
  );

  servidor.registerTool(
    'buscar_productos',
    {
      title: 'Buscar productos',
      description:
        'Busca productos del catálogo por nombre y devuelve su id, nombre y ' +
        'precio en pesos colombianos. Sin texto, devuelve el catálogo completo.',
      inputSchema: z.object({
        texto: z.string().optional().describe('Parte del nombre; por ejemplo: pan'),
      }),
      annotations: { readOnlyHint: true },
    },
    ({ texto }) => seguro(() => negocio.productos(texto)),
  );

  servidor.registerTool(
    'crear_pedido',
    {
      title: 'Crear pedido',
      description:
        `Registra un pedido a nombre de ${actor.nombre} y devuelve su código ` +
        'y el total. Úsela solo cuando el usuario haya confirmado los productos ' +
        'y las cantidades. El domicilio tiene costo.',
      inputSchema: z.object({
        items: z
          .array(
            z.object({
              producto: z
                .string()
                .describe('id del producto, según buscar_productos'),
              cantidad: z.number().int().min(1).max(200).describe('Unidades'),
            }),
          )
          .min(1)
          .describe('Productos del pedido'),
        domicilio: z
          .boolean()
          .describe('true si se entrega a domicilio; false si se recoge'),
        direccion: z
          .string()
          .optional()
          .describe('Dirección de entrega, si es a domicilio'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    (datos) => seguro(() => pedidos.crear(actor, datos, 'mcp')),
  );

  servidor.registerTool(
    'consultar_pedidos',
    {
      title: 'Consultar pedidos',
      description:
        (personal
          ? 'Consulta cualquier pedido del negocio. '
          : 'Consulta los pedidos del usuario. ') +
        'Con un código (por ejemplo P-0001) devuelve ese pedido; ' +
        'sin código, los últimos diez.',
      inputSchema: z.object({
        codigo: z
          .string()
          .optional()
          .describe('Código del pedido; por ejemplo: P-0001'),
      }),
      annotations: { readOnlyHint: true },
    },
    ({ codigo }) =>
      seguro(() => (codigo ? pedidos.uno(actor, codigo) : pedidos.listar(actor, 10))),
  );

  servidor.registerTool(
    'cancelar_pedido',
    {
      title: 'Cancelar pedido',
      description:
        'Cancela un pedido. No se puede deshacer: úsela solo si el usuario ' +
        'lo pidió de forma explícita y confirmó el código.' +
        (personal
          ? ''
          : ' Un cliente solo puede cancelar sus pedidos en estado recibido.'),
      inputSchema: z.object({
        codigo: z.string().describe('Código del pedido; por ejemplo: P-0001'),
      }),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false,
      },
    },
    ({ codigo }) => seguro(() => pedidos.cambiarEstado(actor, codigo, 'cancelado')),
  );

  // Esta herramienta ni siquiera existe para un cliente.
  if (personal) {
    servidor.registerTool(
      'cambiar_estado_pedido',
      {
        title: 'Cambiar estado de un pedido',
        description:
          'Avanza un pedido en su proceso: recibido → preparando → ' +
          'despachado → entregado. Úsela cuando el empleado lo indique.',
        inputSchema: z.object({
          codigo: z.string().describe('Código del pedido; por ejemplo: P-0001'),
          estado: z
            .enum(ESTADOS.filter((e) => e !== 'cancelado') as [string, ...string[]])
            .describe('Nuevo estado'),
        }),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: false,
        },
      },
      ({ codigo, estado }) =>
        seguro(() => pedidos.cambiarEstado(actor, codigo, estado as never)),
    );
  }

  return servidor;
}
