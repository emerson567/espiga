import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import { PUBLICO, ROLES_PERMITIDOS } from './decoradores.js';
import type { Rol } from './usuario.entity.js';

// Lee "Authorization: Bearer <token>".
export function tokenDe(req: {
  headers: Record<string, unknown>;
}): string | undefined {
  const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
  return tipo === 'Bearer' ? token : undefined;
}

// Se aplica a todas las rutas. Primero: ¿quién es? (401). Después: ¿puede hacer esto?
// (403).
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const destino = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(PUBLICO, destino)) return true;

    const req = ctx.switchToHttp().getRequest();
    req.usuario = await this.auth.actorDelToken(tokenDe(req), 'web');

    const roles = this.reflector.getAllAndOverride<Rol[]>(ROLES_PERMITIDOS, destino);
    if (roles && !roles.includes(req.usuario.rol)) {
      throw new ForbiddenException('Su rol no tiene permiso para esta acción');
    }
    return true;
  }
}
