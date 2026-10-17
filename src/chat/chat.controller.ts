import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UsuarioActual } from '../usuarios/decoradores.js';
import type { Actor } from '../usuarios/decoradores.js';
import { ChatService } from './chat.service.js';

const nombreSesion = (s?: string) => String(s ?? 'web').slice(0, 60);

@ApiTags('chat')
@ApiBearerAuth()
@Controller('api/chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('historial')
  historial(@UsuarioActual() actor: Actor, @Query('sesion') sesion?: string) {
    return this.chat.historial(actor, nombreSesion(sesion));
  }

  @Post()
  @HttpCode(200)
  async conversar(
    @UsuarioActual() actor: Actor,
    @Body() cuerpo: { sesion?: string; mensaje?: string },
    @Res() res: Response,
  ) {
    const mensaje = String(cuerpo?.mensaje ?? '').trim();
    if (!mensaje || mensaje.length > 500) {
      throw new BadRequestException('Envíe un mensaje de máximo 500 caracteres');
    }
    // La respuesta se envía por partes: el navegador la muestra mientras se genera.
    try {
      for await (const parte of this.chat.responder(
        actor,
        nombreSesion(cuerpo.sesion),
        mensaje,
      )) {
        if (!res.headersSent) res.type('text/plain; charset=utf-8');
        res.write(parte);
      }
    } catch (error) {
      // Si aún no se ha enviado nada, NestJS responde con el error (por ejemplo,
      // 503).
      if (!res.headersSent) throw error;
      res.write('\n[La respuesta se interrumpió]');
    }
    res.end();
  }
}
