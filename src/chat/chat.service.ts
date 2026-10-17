import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Repository } from 'typeorm';
import { RAIZ } from '../config.js';
import { IaService } from '../ia/ia.service.js';
import type { Mensaje as MensajeModelo } from '../ia/ia.service.js';
import { NegocioService } from '../negocio/negocio.service.js';
import { PedidosService } from '../pedidos/pedidos.service.js';
import type { Actor } from '../usuarios/decoradores.js';
import { Mensaje } from './mensaje.entity.js';

const pesos = (valor: number) => '$' + valor.toLocaleString('es-CO');

@Injectable()
export class ChatService {
  constructor(
    private readonly ia: IaService,
    private readonly negocio: NegocioService,
    private readonly pedidos: PedidosService,
    @InjectRepository(Mensaje) private readonly mensajes: Repository<Mensaje>,
  ) {}

  // El prompt se arma en cada pregunta, con los datos vigentes y solo los pedidos que
  // esta persona puede ver.
  private async sistema(actor: Actor): Promise<string> {
    const info = await this.negocio.informacion();
    const d = info.domicilio;
    const precios = (await this.negocio.productos()).map(
      (p) => `${p.nombre} ${pesos(p.precio)}`,
    );
    const pedidos = (await this.pedidos.listar(actor, 5)).map((p) => {
      const productos = p.items.map((i) => `${i.cantidad} ${i.nombre}`).join(', ');
      return (
        `- ${p.codigo}, de ${p.cliente}: ${productos}. Total ${pesos(p.total)}. ` +
        `Estado: ${p.estado}.`
      );
    });
    const datos: Record<string, string> = {
      nombre: info.nombre,
      horario: info.horario,
      domicilio:
        `${d.zona}, con un costo de ${pesos(d.costo)}. ` +
        `Tiempo estimado: ${d.tiempo}.`,
      precios: precios.join(', '),
      cliente: actor.nombre,
      rol: actor.rol,
      pedidos: pedidos.join('\n') || '- Ninguno.',
    };
    const plantilla = readFileSync(join(RAIZ, 'prompts', 'chat.txt'), 'utf8');
    return plantilla.replace(
      /\{\{(\w+)\}\}/g,
      (_, clave: string) => datos[clave] ?? '',
    );
  }

  // La memoria ya no está en una variable: está en la tabla mensajes y sobrevive a
  // los reinicios.
  historial(actor: Actor, sesion: string, limite = 50) {
    return this.mensajes
      .find({
        where: { usuario: { id: actor.id }, sesion },
        order: { id: 'DESC' },
        take: limite,
        select: { id: true, rol: true, contenido: true, creadoEn: true },
      })
      .then((lista) => lista.reverse());
  }

  async *responder(
    actor: Actor,
    sesion: string,
    texto: string,
  ): AsyncGenerator<string> {
    const anteriores = await this.historial(actor, sesion, 8);
    const mensajes: MensajeModelo[] = [
      { role: 'system', content: await this.sistema(actor) },
      ...anteriores.map((m) => ({
        role: m.rol as 'user' | 'assistant',
        content: m.contenido,
      })),
      { role: 'user', content: texto },
    ];
    let respuesta = '';
    for await (const parte of this.ia.conversar(mensajes)) {
      respuesta += parte;
      yield parte;
    }
    // Se guardan la pregunta y la respuesta solo si la respuesta terminó bien.
    await this.mensajes.save([
      this.mensajes.create({
        usuario: { id: actor.id },
        sesion,
        rol: 'user',
        contenido: texto,
      }),
      this.mensajes.create({
        usuario: { id: actor.id },
        sesion,
        rol: 'assistant',
        contenido: respuesta,
      }),
    ]);
  }
}
