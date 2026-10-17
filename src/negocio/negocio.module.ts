import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Negocio } from './negocio.entity.js';
import { NegocioController } from './negocio.controller.js';
import { NegocioService } from './negocio.service.js';
import { Producto } from './producto.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Negocio, Producto])],
  controllers: [NegocioController],
  providers: [NegocioService],
  exports: [NegocioService],
})
export class NegocioModule {}
