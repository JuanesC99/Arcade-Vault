import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard, type PeticionConJugador } from '../auth/jwt.guard.js';
import { NuevaMarcaDto } from './dto.js';
import { MarcasService } from './marcas.service.js';

@Controller('marcas')
export class MarcasController {
  constructor(private readonly marcas: MarcasService) {}

  /** Abierto: el salón de la fama lo ve cualquiera, con sesión o sin ella. */
  @Get('hall')
  hall() {
    return this.marcas.hall();
  }

  @Get('mias')
  @UseGuards(JwtGuard)
  mias(@Req() peticion: PeticionConJugador) {
    return this.marcas.mias(peticion.jugador!.id);
  }

  @Post()
  @UseGuards(JwtGuard)
  registrar(@Req() peticion: PeticionConJugador, @Body() datos: NuevaMarcaDto) {
    return this.marcas.registrar(peticion.jugador!.id, datos);
  }
}
