import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Negocio } from '../negocio/negocio.entity.js';
import { sinTildes } from '../negocio/negocio.service.js';
import { Producto } from '../negocio/producto.entity.js';
import type { Actor } from '../usuarios/decoradores.js';
import { PedidoItem } from './pedido-item.entity.js';
import { Pedido } from './pedido.entity.js';
import type { Estado } from './pedido.entity.js';

export interface NuevoPedido {
  items: { producto: string; cantidad: number }[];
  domicilio: boolean;
  direccion?: string;
}

// Cambios de estado permitidos. Lo que no está aquí, no se puede hacer.
const SIGUIENTE: Record<Estado, Estado[]> = {
  recibido: ['preparando', 'cancelado'],
  preparando: ['despachado', 'cancelado'],
  despachado: ['entregado'],
  entregado: [],
  cancelado: [],
};

const esPersonal = (actor: Actor) =>
  actor.rol === 'empleado' || actor.rol === 'admin';
export const codigo = (id: number) => 'P-' + String(id).padStart(4, '0');

// Todas las reglas de los pedidos, en un solo lugar. Las cumple quien entre por
// cualquier puerta.
@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>,
    @InjectDataSource() private readonly db: DataSource,
  ) {}

  async listar(actor: Actor, limite = 20) {
    const lista = await this.pedidos.find({
      where: esPersonal(actor) ? {} : { usuario: { id: actor.id } },
      relations: { usuario: true, items: { producto: true } },
      order: { id: 'DESC' },
      take: limite,
    });
    return lista.map((p) => this.aRespuesta(p));
  }

  async uno(actor: Actor, cod: string) {
    return this.aRespuesta(await this.buscar(actor, cod));
  }

  async crear(actor: Actor, datos: NuevoPedido, origen: 'api' | 'mcp') {
    if (!Array.isArray(datos?.items) || datos.items.length === 0) {
      throw new BadRequestException('El pedido no tiene productos');
    }
    const domicilio = datos.domicilio === true;
    const direccion = String(datos.direccion ?? '').trim();
    if (domicilio && !direccion)
      throw new BadRequestException('Un pedido a domicilio necesita la dirección');

    // Todo o nada: si algo falla, no queda un pedido a medias en la base.
    const id = await this.db.transaction(async (tx) => {
      const negocio = await tx.findOneByOrFail(Negocio, { id: 1 });
      const catalogo = await tx.find(Producto, { where: { activo: true } });
      const items = datos.items.map((item) => {
        const buscado = sinTildes(String(item?.producto ?? ''));
        const producto = catalogo.find(
          (p) => p.id === buscado || sinTildes(p.nombre) === buscado,
        );
        if (!producto) {
          throw new BadRequestException(
            `No existe el producto "${item?.producto}". ` +
              'Consulte primero el catálogo.',
          );
        }
        if (
          !Number.isInteger(item.cantidad) ||
          item.cantidad < 1 ||
          item.cantidad > 200
        ) {
          throw new BadRequestException(
            `La cantidad de ${producto.nombre} debe ser ` +
              'un número entero entre 1 y 200',
          );
        }
        return tx.create(PedidoItem, {
          producto,
          cantidad: item.cantidad,
          precioUnitario: producto.precio,
          subtotal: producto.precio * item.cantidad,
        });
      });
      const suma = items.reduce((total, item) => total + item.subtotal, 0);
      const pedido = await tx.save(
        tx.create(Pedido, {
          usuario: { id: actor.id },
          items,
          origen,
          domicilio,
          direccion,
          total: suma + (domicilio ? negocio.domicilioCosto : 0),
        }),
      );
      return pedido.id;
    });
    return this.uno(actor, codigo(id));
  }

  async cambiarEstado(actor: Actor, cod: string, nuevo: Estado) {
    const pedido = await this.buscar(actor, cod);
    // Un cliente solo puede cancelar su propio pedido mientras está recibido.
    if (
      !esPersonal(actor) &&
      !(nuevo === 'cancelado' && pedido.estado === 'recibido')
    ) {
      throw new ForbiddenException(
        'Un cliente solo puede cancelar un pedido suyo, y solo mientras está recibido',
      );
    }
    if (!SIGUIENTE[pedido.estado].includes(nuevo)) {
      throw new BadRequestException(
        `El pedido ${codigo(pedido.id)} está ${pedido.estado}: ` +
          `no puede pasar a ${nuevo}`,
      );
    }
    await this.pedidos.update(pedido.id, { estado: nuevo });
    return this.uno(actor, cod);
  }

  // Un cliente que pregunta por el pedido de otro recibe 404, no 403: así no sabe que
  // existe.
  private async buscar(actor: Actor, cod: string): Promise<Pedido> {
    const numero = Number(/^P-?(\d{1,9})$/i.exec(String(cod).trim())?.[1]);
    const pedido = numero
      ? await this.pedidos.findOne({
          where: { id: numero },
          relations: { usuario: true, items: { producto: true } },
        })
      : null;
    if (!pedido || (!esPersonal(actor) && pedido.usuario.id !== actor.id)) {
      throw new NotFoundException(`No existe el pedido ${cod}`);
    }
    return pedido;
  }

  private aRespuesta(p: Pedido) {
    return {
      codigo: codigo(p.id),
      fecha: p.creadoEn,
      origen: p.origen,
      cliente: p.usuario.nombre,
      items: p.items.map((i) => ({
        producto: i.producto.id,
        nombre: i.producto.nombre,
        cantidad: i.cantidad,
        precio_unitario: i.precioUnitario,
        subtotal: i.subtotal,
      })),
      domicilio: p.domicilio,
      direccion: p.direccion,
      total: p.total,
      estado: p.estado,
    };
  }
}
