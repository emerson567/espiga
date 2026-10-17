import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { opcionesBaseDatos } from './base-datos/opciones.js';
import { ChatModule } from './chat/chat.module.js';
import { McpModule } from './mcp/mcp.module.js';
import { NegocioModule } from './negocio/negocio.module.js';
import { PedidosModule } from './pedidos/pedidos.module.js';
import { SaludController } from './salud.controller.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot(opcionesBaseDatos),
    // Límite general: 120 peticiones por minuto por dirección IP.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    NegocioModule,
    UsuariosModule,
    PedidosModule,
    ChatModule,
    McpModule,
  ],
  controllers: [SaludController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
