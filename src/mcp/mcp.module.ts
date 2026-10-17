import { Module } from '@nestjs/common';
import { NegocioModule } from '../negocio/negocio.module.js';
import { PedidosModule } from '../pedidos/pedidos.module.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { McpController } from './mcp.controller.js';

@Module({
  imports: [NegocioModule, PedidosModule, UsuariosModule],
  controllers: [McpController],
})
export class McpModule {}
