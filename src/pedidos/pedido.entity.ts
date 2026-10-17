import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity.js';
import { PedidoItem } from './pedido-item.entity.js';

export const ESTADOS = [
  'recibido',
  'preparando',
  'despachado',
  'entregado',
  'cancelado',
] as const;
export type Estado = (typeof ESTADOS)[number];

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn()
  id: number;

  // Relation<> evita un error de importación circular con los módulos ES.
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @OneToMany(() => PedidoItem, (item) => item.pedido, { cascade: ['insert'] })
  items: Relation<PedidoItem[]>;

  @Column({ length: 10 })
  origen: string;

  @Column()
  domicilio: boolean;

  @Column({ length: 200, default: '' })
  direccion: string;

  @Column({ type: 'int' })
  total: number;

  @Column({ type: 'enum', enum: ESTADOS, default: 'recibido' })
  estado: Estado;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}
