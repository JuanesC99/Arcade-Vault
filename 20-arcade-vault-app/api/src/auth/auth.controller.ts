import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AccesoDto, AliasDto, CambioClaveDto, RegistroDto } from './dto.js';
import { JwtGuard, type PeticionConJugador } from './jwt.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('registro')
  registrar(@Body() datos: RegistroDto) {
    return this.auth.registrar(datos);
  }

  @Post('acceso')
  @HttpCode(200)
  entrar(@Body() datos: AccesoDto) {
    return this.auth.entrar(datos);
  }

  @Get('yo')
  @UseGuards(JwtGuard)
  yo(@Req() peticion: PeticionConJugador) {
    return this.auth.quienEs(peticion.jugador!.id);
  }

  @Patch('alias')
  @UseGuards(JwtGuard)
  alias(@Req() peticion: PeticionConJugador, @Body() datos: AliasDto) {
    return this.auth.cambiarAlias(peticion.jugador!.id, datos.alias);
  }

  @Patch('clave')
  @UseGuards(JwtGuard)
  @HttpCode(204)
  async clave(@Req() peticion: PeticionConJugador, @Body() datos: CambioClaveDto) {
    await this.auth.cambiarClave(peticion.jugador!.id, datos.actual, datos.nueva);
  }

  @Delete('cuenta')
  @UseGuards(JwtGuard)
  @HttpCode(204)
  async borrar(@Req() peticion: PeticionConJugador, @Body() datos: AccesoDto) {
    await this.auth.borrar(peticion.jugador!.id, datos.clave);
  }
}
