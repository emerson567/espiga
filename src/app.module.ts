import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { opcionesBaseDatos } from './base-datos/opciones.js';
import { NegocioModule } from './negocio/negocio.module.js';
import { SaludController } from './salud.controller.js';

@Module({
  imports: [
    TypeOrmModule.forRoot(opcionesBaseDatos),
    // Límite general: 120 peticiones por minuto por dirección IP.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    NegocioModule,
  ],
  controllers: [SaludController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
