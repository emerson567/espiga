import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Producto } from '../negocio/producto.entity.js';
import { Pedido } from './pedido.entity.js';

@Entity('pedido_items')
export class PedidoItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Pedido, (pedido) => pedido.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pedido_id' })
  pedido: Relation<Pedido>;

  @ManyToOne(() => Producto, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'producto_id' })
  producto: Relation<Producto>;

  @Column({ type: 'int' })
  cantidad: number;

  // El precio se copia al pedido: si mañana cambia, el pedido conserva el que pagó.
  @Column({ name: 'precio_unitario', type: 'int' })
  precioUnitario: number;

  @Column({ type: 'int' })
  subtotal: number;
}
