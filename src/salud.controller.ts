import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Publico } from './usuarios/decoradores.js';

// Responde si la API y la base de datos están vivas. La usan Docker y Kubernetes en
// la sesión 5.
@ApiTags('salud')
@Publico()
@Controller('api/salud')
export class SaludController {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  @Get()
  async revisar() {
    try {
      await this.db.query('SELECT 1');
      return { estado: 'ok', base_datos: 'ok' };
    } catch {
      throw new ServiceUnavailableException({
        estado: 'error',
        base_datos: 'sin conexión',
      });
    }
  }
}
