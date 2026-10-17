import { Column, Entity, PrimaryColumn } from 'typeorm';

// Una sola fila: los datos generales de la panadería.
@Entity('negocio')
export class Negocio {
  @PrimaryColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 200 })
  horario: string;

  @Column({ name: 'domicilio_zona', length: 100 })
  domicilioZona: string;

  @Column({ name: 'domicilio_costo', type: 'int' })
  domicilioCosto: number;

  @Column({ name: 'domicilio_tiempo', length: 50 })
  domicilioTiempo: string;
}
