import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IaService } from '../ia/ia.service.js';
import { NegocioModule } from '../negocio/negocio.module.js';
import { PedidosModule } from '../pedidos/pedidos.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { Mensaje } from './mensaje.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mensaje]), NegocioModule, PedidosModule],
  controllers: [ChatController],
  providers: [IaService, ChatService],
})
export class ChatModule {}
