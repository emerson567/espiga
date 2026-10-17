import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoItem } from './pedido-item.entity.js';
import { Pedido } from './pedido.entity.js';
import { PedidosController } from './pedidos.controller.js';
import { PedidosService } from './pedidos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, PedidoItem])],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
