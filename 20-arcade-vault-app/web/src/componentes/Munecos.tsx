/**
 * Los vecinos que rondan por detrás de la portada.
 *
 * Cada uno es una rejilla de píxeles: una letra por color, punto para el
 * hueco. De ahí sale un SVG de cuadraditos de 1x1, que escala sin
 * despeinarse por muy grande que se ponga la portada y pesa lo que pesa
 * el texto de su rejilla.
 */

const TINTA: Record<string, string> = {
  a: '#35f0d0', // volt
  b: '#ff2e88', // neón
  c: '#ffb020', // ámbar
  d: '#e9e5ff', // tinta clara
  e: '#7b5cff', // violeta
  o: '#07060d', // hueco oscuro, para los ojos
};

const VECINOS: Record<string, string[]> = {
  marciano: [
    '..a.....a..',
    '...a...a...',
    '..aaaaaaa..',
    '.aa.aaa.aa.',
    'aaaaaaaaaaa',
    'a.aaaaaaa.a',
    'a.a.....a.a',
    '...aa.aa...',
  ],
  fantasma: [
    '..bbbb..',
    '.bbbbbb.',
    'bddbbddb',
    'bdobbdob',
    'bbbbbbbb',
    'bbbbbbbb',
    'bbbbbbbb',
    'b.bb.bb.',
  ],
  robot: [
    '....c....',
    '....c....',
    '..ccccc..',
    '.ccccccc.',
    '.cocccoc.',
    '.ccccccc.',
    '.caaaaac.',
    'c.ccccc.c',
    '.c.....c.',
  ],
  platillo: [
    '...dddd...',
    '..daaaad..',
    '.daaaaaad.',
    'eeeeeeeeee',
    'ecececece.',
    '.ee....ee.',
    '..e....e..',
  ],
  pulpo: [
    '..eeee..',
    '.eeeeee.',
    'eedeedee',
    'eeoeeoee',
    'eeeeeeee',
    '.eeeeee.',
    'e.e..e.e',
    'e.e..e.e',
  ],
  copa: [
    '.cccccc.',
    '.cccccc.',
    'ccccccca',
    '.cccccc.',
    '..cccc..',
    '...cc...',
    '..cccc..',
    '.cccccc.',
  ],
};

export type NombreVecino = keyof typeof VECINOS;

/** Dibuja una rejilla como SVG de cuadraditos. */
export function Vecino({ quien }: { quien: NombreVecino }) {
  const filas = VECINOS[quien];
  const ancho = Math.max(...filas.map((f) => f.length));

  const piezas: React.ReactElement[] = [];
  filas.forEach((fila, y) => {
    for (let x = 0; x < fila.length; x++) {
      const tono = TINTA[fila[x]];
      if (!tono) continue;
      // 1.02 de lado para que no se vean costuras entre píxeles vecinos
      piezas.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={tono} />,
      );
    }
  });

  return (
    <svg viewBox={`0 0 ${ancho} ${filas.length}`} shapeRendering="crispEdges" focusable="false">
      {piezas}
    </svg>
  );
}

interface Sitio {
  quien: NombreVecino;
  x: string;
  y: string;
  ancho: number;
  plano: 'lejos' | 'medio' | 'cerca';
  ritmo: number;
  salto: number;
  giro: number;
}

/** Dónde se planta cada uno: todos a la derecha, lejos del texto. */
const REPARTO: Sitio[] = [
  { quien: 'marciano', x: '70%', y: '16%', ancho: 130, plano: 'cerca', ritmo: 13, salto: 1.7, giro: -6 },
  { quien: 'fantasma', x: '85%', y: '54%', ancho: 92, plano: 'medio', ritmo: 16, salto: 2.1, giro: 5 },
  { quien: 'robot', x: '59%', y: '60%', ancho: 104, plano: 'cerca', ritmo: 11, salto: 1.4, giro: 4 },
  { quien: 'platillo', x: '55%', y: '5%', ancho: 108, plano: 'lejos', ritmo: 19, salto: 2.6, giro: -3 },
  { quien: 'pulpo', x: '89%', y: '11%', ancho: 76, plano: 'lejos', ritmo: 15, salto: 1.9, giro: 7 },
  { quien: 'copa', x: '75%', y: '83%', ancho: 62, plano: 'lejos', ritmo: 17, salto: 2.3, giro: -5 },
];

export default function Munecos() {
  return (
    <div className="munecos" aria-hidden="true">
      {REPARTO.map((sitio, i) => (
        <div
          key={sitio.quien}
          className={`muneco ${sitio.plano} m-${sitio.quien}`}
          style={
            {
              '--x': sitio.x,
              '--y': sitio.y,
              '--ancho': `${sitio.ancho}px`,
              '--giro': `${sitio.giro}deg`,
              '--salto': `${sitio.salto}s`,
              animationDuration: `${sitio.ritmo}s`,
              animationDelay: `${(i * -2.4).toFixed(1)}s`,
            } as React.CSSProperties
          }
        >
          <Vecino quien={sitio.quien} />
        </div>
      ))}
    </div>
  );
}
