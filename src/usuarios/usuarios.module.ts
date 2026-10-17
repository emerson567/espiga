import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { requerida } from '../config.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { Usuario } from './usuario.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
    JwtModule.register({
      secret: requerida('JWT_SECRETO'),
      signOptions: { issuer: 'espiga' },
      verifyOptions: { issuer: 'espiga' },
    }),
  ],
  controllers: [AuthController],
  // APP_GUARD: el guardia protege todas las rutas de la aplicación, no solo las de
  // este módulo.
  providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [AuthService],
})
export class UsuariosModule {}
