import { All, Controller, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';
import type { Request, Response } from 'express';
import { NegocioService } from '../negocio/negocio.service.js';
import { PedidosService } from '../pedidos/pedidos.service.js';
import { tokenDe } from '../usuarios/auth.guard.js';
import { AuthService } from '../usuarios/auth.service.js';
import { Publico } from '../usuarios/decoradores.js';
import type { Actor } from '../usuarios/decoradores.js';
import { crearServidorMcp } from './herramientas.js';

@ApiExcludeController()
// el guardia web no aplica aquí: esta puerta exige su propio token, el de tipo 'mcp'
@Publico()
@SkipThrottle()
@Controller('mcp')
export class McpController {
  private readonly atender;

  constructor(
    negocio: NegocioService,
    pedidos: PedidosService,
    private readonly auth: AuthService,
  ) {
    // Por cada petición se crea un servidor para el usuario dueño del token.
    const manejador = createMcpHandler(({ authInfo }) =>
      crearServidorMcp(negocio, pedidos, authInfo?.extra?.actor as Actor),
    );
    this.atender = toNodeHandler(manejador);
  }

  @All()
  async manejar(@Req() req: Request & { auth?: unknown }, @Res() res: Response) {
    let actor: Actor;
    try {
      actor = await this.auth.actorDelToken(tokenDe(req), 'mcp');
    } catch (error) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      res.status(401).json({ error: (error as Error).message });
      return;
    }
    // El adaptador del SDK le entrega req.auth a la fábrica como authInfo.
    const token = tokenDe(req) as string;
    req.auth = { token, clientId: actor.id, scopes: [actor.rol], extra: { actor } };
    await this.atender(req as never, res, req.body);
  }
}
