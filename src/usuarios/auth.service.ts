import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { cifrarClave, claveCorrecta } from './claves.js';
import type { Actor } from './decoradores.js';
import { Usuario } from './usuario.entity.js';
import type { Rol } from './usuario.entity.js';
import type { EntrarDto, RegistroDto } from './dto.js';

// Dos tipos de token: 'web' para la página y la API (8 horas) y 'mcp' para los
// asistentes (7 días).
export type Audiencia = 'web' | 'mcp';
const DURACION: Record<Audiencia, string> = { web: '8h', mcp: '7d' };

// Huella de relleno: si el correo no existe, se compara igual para no revelarlo por
// el tiempo.
const HUELLA_RELLENO = await cifrarClave('relleno-para-comparar');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly jwt: JwtService,
  ) {}

  async registrar(datos: RegistroDto): Promise<Actor> {
    const correo = datos.correo.trim().toLowerCase();
    if (await this.usuarios.existsBy({ correo })) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    const usuario = await this.usuarios.save(
      this.usuarios.create({
        nombre: datos.nombre.trim(),
        correo,
        claveHash: await cifrarClave(datos.clave),
        // nadie se registra como empleado: eso lo decide un administrador
        rol: 'cliente',
      }),
    );
    return this.aActor(usuario);
  }

  async entrar(datos: EntrarDto) {
    const usuario = await this.usuarios
      .createQueryBuilder('u')
      .addSelect('u.claveHash')
      .where('u.correo = :correo', { correo: datos.correo.trim().toLowerCase() })
      .getOne();
    const valida = await claveCorrecta(
      datos.clave,
      usuario?.claveHash ?? HUELLA_RELLENO,
    );
    // El mismo mensaje para correo inexistente y clave errada.
    if (!usuario || !valida)
      throw new UnauthorizedException('Correo o clave incorrectos');
    return {
      token: await this.emitir(usuario, 'web'),
      usuario: this.aActor(usuario),
    };
  }

  emitir(usuario: Pick<Usuario, 'id'>, audiencia: Audiencia): Promise<string> {
    return this.jwt.signAsync(
      { sub: usuario.id },
      { audience: audiencia, expiresIn: DURACION[audiencia] as never },
    );
  }

  // Valida el token y trae al usuario de la base: si cambió su rol o ya no existe, se
  // nota de inmediato.
  async actorDelToken(
    token: string | undefined,
    audiencia: Audiencia,
  ): Promise<Actor> {
    if (!token) throw new UnauthorizedException('Falta el token de acceso');
    let sub: string;
    try {
      ({ sub } = await this.jwt.verifyAsync<{ sub: string }>(token, {
        audience: audiencia,
      }));
    } catch {
      throw new UnauthorizedException('El token no es válido o ya venció');
    }
    const usuario = await this.usuarios.findOneBy({ id: sub });
    if (!usuario) throw new UnauthorizedException('La cuenta ya no existe');
    return this.aActor(usuario);
  }

  listar() {
    return this.usuarios.find({ order: { creadoEn: 'ASC' } });
  }

  async cambiarRol(id: string, rol: Rol): Promise<Actor> {
    const usuario = await this.usuarios.findOneBy({ id });
    if (!usuario) throw new NotFoundException('No existe ese usuario');
    usuario.rol = rol;
    return this.aActor(await this.usuarios.save(usuario));
  }

  private aActor(u: Usuario): Actor {
    return { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol };
  }
}
