import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { Publico, Roles, UsuarioActual } from './decoradores.js';
import type { Actor } from './decoradores.js';
import { CambiarRolDto, EntrarDto, RegistroDto } from './dto.js';

@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('api')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @Post('auth/registro')
  registrar(@Body() datos: RegistroDto) {
    return this.auth.registrar(datos);
  }

  // Máximo 10 intentos por minuto desde un mismo equipo: frena a quien intente
  // adivinar claves.
  @Publico()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('auth/entrar')
  @HttpCode(200)
  entrar(@Body() datos: EntrarDto) {
    return this.auth.entrar(datos);
  }

  @Get('auth/yo')
  yo(@UsuarioActual() actor: Actor) {
    return actor;
  }

  // Token de 7 días para conectar un asistente (Claude, ChatGPT) al servidor MCP.
  @Post('auth/token-mcp')
  async tokenMcp(@UsuarioActual() actor: Actor) {
    return {
      token: await this.auth.emitir(actor, 'mcp'),
      vigencia: '7 días',
      rol: actor.rol,
    };
  }

  @Roles('admin')
  @Get('usuarios')
  listar() {
    return this.auth.listar();
  }

  @Roles('admin')
  @Patch('usuarios/:id/rol')
  cambiarRol(@Param('id', ParseUUIDPipe) id: string, @Body() datos: CambiarRolDto) {
    return this.auth.cambiarRol(id, datos.rol);
  }
}
