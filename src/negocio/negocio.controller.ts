import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Publico } from '../usuarios/decoradores.js';
import { NegocioService } from './negocio.service.js';

@ApiTags('negocio')
@Publico() // la información del negocio y el catálogo los puede ver cualquiera
@Controller('api')
export class NegocioController {
  constructor(private readonly negocio: NegocioService) {}

  @Get('negocio')
  informacion() {
    return this.negocio.informacion();
  }

  @Get('productos')
  productos(@Query('buscar') buscar?: string) {
    return this.negocio.productos(buscar);
  }
}
