import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface PeticionConJugador extends Request {
  jugador?: { id: string; usuario: string; alias: string };
}

/** Deja pasar solo con un «Authorization: Bearer <token>» válido. */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const peticion = contexto.switchToHttp().getRequest<PeticionConJugador>();
    const cabecera = peticion.headers.authorization ?? '';
    const [tipo, token] = cabecera.split(' ');

    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Hace falta iniciar sesión.');
    }

    try {
      const datos = await this.jwt.verifyAsync<{
        sub: string;
        usuario: string;
        alias: string;
      }>(token);
      peticion.jugador = { id: datos.sub, usuario: datos.usuario, alias: datos.alias };
      return true;
    } catch {
      throw new UnauthorizedException('La sesión caducó, vuelve a entrar.');
    }
  }
}
