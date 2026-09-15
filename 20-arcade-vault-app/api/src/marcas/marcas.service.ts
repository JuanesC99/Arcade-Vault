import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { NuevaMarcaDto } from './dto.js';

export interface MarcaPublica {
  id: string;
  juego: string;
  alias: string;
  valor: number;
  unidad: string;
  etiqueta: string;
  creada: string;
}

/** Una cabina con sus mejores marcas, tal como la pinta el Hall of Fame. */
export interface CabinaDelHall {
  juego: string;
  menorEsMejor: boolean;
  unidad: string;
  marcas: MarcaPublica[];
}

const TOPE = 5;

@Injectable()
export class MarcasService {
  constructor(private readonly prisma: PrismaService) {}

  private aPublica(m: {
    id: string;
    juego: string;
    valor: number;
    unidad: string;
    etiqueta: string;
    creada: Date;
    jugador: { alias: string };
  }): MarcaPublica {
    return {
      id: m.id,
      juego: m.juego,
      alias: m.jugador.alias,
      valor: m.valor,
      unidad: m.unidad,
      etiqueta: m.etiqueta,
      creada: m.creada.toISOString(),
    };
  }

  /** Guarda la partida y devuelve en qué puesto del hall quedó (0 si no entró). */
  async registrar(
    jugadorId: string,
    datos: NuevaMarcaDto,
  ): Promise<{ marca: MarcaPublica; puesto: number }> {
    const creada = await this.prisma.marca.create({
      data: {
        juego: datos.juego,
        valor: Math.round(datos.valor),
        unidad: datos.unidad ?? 'pts',
        etiqueta: datos.etiqueta ?? '',
        menorEsMejor: datos.menorEsMejor ?? false,
        jugadorId,
      },
      include: { jugador: { select: { alias: true } } },
    });

    const mejores = await this.mejoresDe(creada.juego, creada.menorEsMejor);
    const puesto = mejores.findIndex((m) => m.id === creada.id) + 1;

    return { marca: this.aPublica(creada), puesto };
  }

  private async mejoresDe(juego: string, menorEsMejor: boolean) {
    return this.prisma.marca.findMany({
      where: { juego },
      orderBy: [{ valor: menorEsMejor ? 'asc' : 'desc' }, { creada: 'asc' }],
      take: TOPE,
      include: { jugador: { select: { alias: true } } },
    });
  }

  /** El Hall of Fame entero: una entrada por cabina que tenga marcas. */
  async hall(): Promise<CabinaDelHall[]> {
    const juegos = await this.prisma.marca.groupBy({
      by: ['juego', 'menorEsMejor'],
      _count: { _all: true },
    });

    const salon: CabinaDelHall[] = [];
    for (const j of juegos) {
      const marcas = await this.mejoresDe(j.juego, j.menorEsMejor);
      salon.push({
        juego: j.juego,
        menorEsMejor: j.menorEsMejor,
        unidad: marcas[0]?.unidad ?? 'pts',
        marcas: marcas.map((m) => this.aPublica(m)),
      });
    }
    return salon.sort((a, b) => a.juego.localeCompare(b.juego));
  }

  /** Las últimas partidas de quien pregunta. */
  async mias(jugadorId: string): Promise<MarcaPublica[]> {
    const marcas = await this.prisma.marca.findMany({
      where: { jugadorId },
      orderBy: { creada: 'desc' },
      take: 50,
      include: { jugador: { select: { alias: true } } },
    });
    return marcas.map((m) => this.aPublica(m));
  }
}
