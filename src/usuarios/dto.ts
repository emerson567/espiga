import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, Length, Matches } from 'class-validator';
import { ROLES } from './usuario.entity.js';
import type { Rol } from './usuario.entity.js';

export class RegistroDto {
  @ApiProperty({ example: 'Ana Rojas' })
  @IsString()
  @Length(2, 100)
  nombre: string;

  @ApiProperty({ example: 'ana@correo.com' })
  @IsEmail({}, { message: 'El correo no es válido' })
  correo: string;

  @ApiProperty({ example: 'Pandebono2026' })
  @IsString()
  @Length(10, 72, { message: 'La clave debe tener entre 10 y 72 caracteres' })
  @Matches(/[a-zA-Z]/, { message: 'La clave debe tener al menos una letra' })
  @Matches(/[0-9]/, { message: 'La clave debe tener al menos un número' })
  clave: string;
}

export class EntrarDto {
  @ApiProperty({ example: 'ana@correo.com' })
  @IsEmail({}, { message: 'El correo no es válido' })
  correo: string;

  @ApiProperty({ example: 'Pandebono2026' })
  @IsString()
  clave: string;
}

export class CambiarRolDto {
  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES, { message: `El rol debe ser uno de: ${ROLES.join(', ')}` })
  rol: Rol;
}
