import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const ROLES = ['cliente', 'empleado', 'admin'] as const;
export type Rol = (typeof ROLES)[number];

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 150, unique: true })
  correo: string;

  // Nunca se guarda la clave: solo su huella. select: false evita que salga en las
  // consultas.
  @Column({ name: 'clave_hash', length: 200, select: false })
  claveHash: string;

  @Column({ type: 'enum', enum: ROLES, default: 'cliente' })
  rol: Rol;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;
}
