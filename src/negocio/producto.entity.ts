import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('productos')
export class Producto {
  // El id es un texto corto y legible: pan-integral, pandebono…
  @PrimaryColumn({ length: 40 })
  id: string;

  @Column({ length: 100 })
  nombre: string;

  // Pesos colombianos, sin decimales.
  @Column({ type: 'int' })
  precio: number;

  @Column({ default: true })
  activo: boolean;
}
