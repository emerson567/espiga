import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity.js';

@Entity('mensajes')
@Index(['usuario', 'sesion', 'creadoEn'])
export class Mensaje {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Relation<Usuario>;

  @Column({ length: 60 })
  sesion: string;

  // 'user' o 'assistant', los mismos nombres que usa el modelo.
  @Column({ length: 10 })
  rol: string;

  @Column({ type: 'text' })
  contenido: string;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}
