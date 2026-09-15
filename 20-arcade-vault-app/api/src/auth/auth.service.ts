import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AccesoDto, RegistroDto } from './dto.js';

const VUELTAS = 12;

/** Lo que sale hacia el navegador: jamás el hash. */
export interface JugadorPublico {
  id: string;
  usuario: string;
  alias: string;
  creado: string;
}

export interface Sesion {
  jugador: JugadorPublico;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private limpiarAlias(alias: string | undefined, usuario: string): string {
    const propuesto = (alias ?? '').trim().slice(0, 12).toUpperCase();
    return propuesto || usuario.slice(0, 12).toUpperCase();
  }

  private aPublico(j: {
    id: string;
    usuario: string;
    alias: string;
    creado: Date;
  }): JugadorPublico {
    return {
      id: j.id,
      usuario: j.usuario,
      alias: j.alias,
      creado: j.creado.toISOString(),
    };
  }

  private async firmar(jugador: JugadorPublico): Promise<Sesion> {
    const token = await this.jwt.signAsync({
      sub: jugador.id,
      usuario: jugador.usuario,
      alias: jugador.alias,
    });
    return { jugador, token };
  }

  async registrar(datos: RegistroDto): Promise<Sesion> {
    const usuario = datos.usuario.trim().toLowerCase();

    const repetido = await this.prisma.jugador.findUnique({ where: { usuario } });
    if (repetido) throw new ConflictException('Ese usuario ya está cogido.');

    const jugador = await this.prisma.jugador.create({
      data: {
        usuario,
        alias: this.limpiarAlias(datos.alias, usuario),
        clave: await bcrypt.hash(datos.clave, VUELTAS),
      },
    });

    return this.firmar(this.aPublico(jugador));
  }

  async entrar(datos: AccesoDto): Promise<Sesion> {
    const usuario = datos.usuario.trim().toLowerCase();
    const jugador = await this.prisma.jugador.findUnique({ where: { usuario } });

    // Comparamos igual aunque no exista, para no delatar qué usuarios hay
    // ni dar pistas por lo que tarda la respuesta.
    const hash = jugador?.clave ?? '$2b$12$invalidoinvalidoinvalidoinvalidoinvalidoinvalidoinvalidoinv';
    const vale = await bcrypt.compare(datos.clave, hash);

    if (!jugador || !vale) throw new UnauthorizedException('Usuario o contraseña incorrectos.');

    await this.prisma.jugador.update({
      where: { id: jugador.id },
      data: { ultimoAcceso: new Date() },
    });

    return this.firmar(this.aPublico(jugador));
  }

  async quienEs(id: string): Promise<JugadorPublico> {
    const jugador = await this.prisma.jugador.findUnique({ where: { id } });
    if (!jugador) throw new NotFoundException('La cuenta ya no existe.');
    return this.aPublico(jugador);
  }

  async cambiarAlias(id: string, alias: string): Promise<JugadorPublico> {
    const jugador = await this.prisma.jugador.findUnique({ where: { id } });
    if (!jugador) throw new NotFoundException('La cuenta ya no existe.');

    const actualizado = await this.prisma.jugador.update({
      where: { id },
      data: { alias: this.limpiarAlias(alias, jugador.usuario) },
    });
    return this.aPublico(actualizado);
  }

  async cambiarClave(id: string, actual: string, nueva: string): Promise<void> {
    const jugador = await this.prisma.jugador.findUnique({ where: { id } });
    if (!jugador) throw new NotFoundException('La cuenta ya no existe.');

    const vale = await bcrypt.compare(actual, jugador.clave);
    if (!vale) throw new UnauthorizedException('La contraseña actual no es correcta.');

    await this.prisma.jugador.update({
      where: { id },
      data: { clave: await bcrypt.hash(nueva, VUELTAS) },
    });
  }

  async borrar(id: string, clave: string): Promise<void> {
    const jugador = await this.prisma.jugador.findUnique({ where: { id } });
    if (!jugador) throw new NotFoundException('La cuenta ya no existe.');

    const vale = await bcrypt.compare(clave, jugador.clave);
    if (!vale) throw new UnauthorizedException('La contraseña no es correcta.');

    // las marcas caen con la cuenta: onDelete Cascade en el esquema
    await this.prisma.jugador.delete({ where: { id } });
  }
}
