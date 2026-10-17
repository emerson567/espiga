import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Negocio } from './negocio.entity.js';
import { Producto } from './producto.entity.js';

// Para comparar textos sin importar mayúsculas ni tildes.
export const sinTildes = (texto: string) =>
  texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

@Injectable()
export class NegocioService {
  constructor(
    @InjectRepository(Negocio) private readonly negocio: Repository<Negocio>,
    @InjectRepository(Producto) private readonly productosRepo: Repository<Producto>,
  ) {}

  async informacion() {
    const n = await this.negocio.findOneBy({ id: 1 });
    if (!n)
      throw new NotFoundException(
        'Faltan los datos del negocio: ejecute npm run semilla',
      );
    return {
      nombre: n.nombre,
      horario: n.horario,
      domicilio: {
        zona: n.domicilioZona,
        costo: n.domicilioCosto,
        tiempo: n.domicilioTiempo,
      },
    };
  }

  async productos(texto = ''): Promise<Producto[]> {
    const todos = await this.productosRepo.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
    const buscado = sinTildes(texto);
    return todos.filter((p) => sinTildes(p.nombre).includes(buscado));
  }
}
