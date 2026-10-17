import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsuarioActual } from '../usuarios/decoradores.js';
import type { Actor } from '../usuarios/decoradores.js';
import { CambiarEstadoDto, CrearPedidoDto } from './dto.js';
import { PedidosService } from './pedidos.service.js';

// Sin @Publico: todas estas rutas exigen token. Qué ve cada quien lo decide el
// servicio.
@ApiTags('pedidos')
@ApiBearerAuth()
@Controller('api/pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Get()
  listar(@UsuarioActual() actor: Actor) {
    return this.pedidos.listar(actor);
  }

  @Get(':codigo')
  uno(@UsuarioActual() actor: Actor, @Param('codigo') codigo: string) {
    return this.pedidos.uno(actor, codigo);
  }

  @Post()
  crear(@UsuarioActual() actor: Actor, @Body() datos: CrearPedidoDto) {
    return this.pedidos.crear(actor, datos, 'api');
  }

  @Patch(':codigo/estado')
  cambiarEstado(
    @UsuarioActual() actor: Actor,
    @Param('codigo') codigo: string,
    @Body() datos: CambiarEstadoDto,
  ) {
    return this.pedidos.cambiarEstado(actor, codigo, datos.estado);
  }
}
