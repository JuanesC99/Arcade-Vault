/**
 * El catálogo del salón. Sale del mismo listado que tenía la versión de
 * HTML plano: una entrada por cabina, con la carpeta como identificador.
 */

export interface Cabina {
  titulo: string;
  genero: string;
  /** clase del degradado que hace de portada, definida en salon.css */
  arte: string;
  carpeta: string;
  jugadores: string;
  controles: string;
  etiquetas: string[];
  descripcion: string;
}

export const CABINAS: Cabina[] = [
  {
    titulo:'Arkanoid', genero:'ladrillos', arte:'a1',
    carpeta:'03-arkanoid',
    jugadores:'1 jugador', controles:'Ratón o flechas',
    etiquetas:['Ladrillos','Powerups','Puntuación alta','10 niveles'],
    descripcion:'Diez pantallas con bloques que aguantan hasta tres golpes y cápsulas que caen del techo. Si te quedas sin vidas, una cuenta atrás de diez segundos decide si continúas.'
  },
  {
    titulo:'Metro Rush', genero:'corredor', arte:'a3',
    carpeta:'02-game',
    jugadores:'1 jugador', controles:'Flechas o deslizar',
    etiquetas:['Corredor infinito','3D','Monedas','Tienda'],
    descripcion:'Corredor infinito por las vías del metro. Tres carriles, trenes que puedes usar de plataforma, monedas, imán, escudo y jetpack, con un guardia pisándote los talones.'
  },
  {
    titulo:'Bloques de Bolsillo', genero:'puzle', arte:'a2',
    carpeta:'05-tetris',
    jugadores:'1 jugador', controles:'Flechas y espacio',
    etiquetas:['Puzle','Piezas','Niveles','Sombra de caída'],
    descripcion:'Las siete piezas de siempre, repartidas en bolsas para que ninguna se haga esperar. Sombra de aterrizaje, soltado instantáneo y un nivel más cada diez líneas.'
  },
  {
    titulo:'Cable Suelto', genero:'clásico', arte:'a4',
    carpeta:'06-snake',
    jugadores:'1 jugador', controles:'Flechas o WASD',
    etiquetas:['Clásico','Reflejos','Récord','Rejilla'],
    descripcion:'Recoge chispas y el cable crece y acelera. El muro y tu propia cola terminan la partida, así que el sitio se acaba antes que la paciencia.'
  },
  {
    titulo:'Duelo de Palas', genero:'deportes', arte:'a5',
    carpeta:'07-pong',
    jugadores:'1 o 2 jugadores', controles:'Ratón, flechas y W S',
    etiquetas:['Deportes','Dos jugadores','Rebote por ángulo','A siete'],
    descripcion:'El ángulo de salida depende de dónde golpees con la pala, y la pelota acelera en cada rebote. Primero en llegar a siete, contra la máquina o contra alguien al lado.'
  },
  {
    titulo:'Lluvia de Marcianos', genero:'disparos', arte:'a6',
    carpeta:'08-invaders',
    jugadores:'1 jugador', controles:'Flechas y espacio',
    etiquetas:['Disparos','Cinco oleadas','Búnkeres','Tres vidas'],
    descripcion:'Cinco oleadas que bajan más rápido cuantos menos marcianos quedan. Los cuatro búnkeres se desgastan con cada impacto, vengan de donde vengan.'
  },
  {
    titulo:'Vuelo Rasante', genero:'reflejos', arte:'a7',
    carpeta:'09-vuelo-rasante',
    jugadores:'1 jugador', controles:'Espacio o clic',
    etiquetas:['Reflejos','Un botón','Récord','Parallax'],
    descripcion:'Un toque sube la nave y la gravedad hace el resto. El hueco entre torres se estrecha cada cinco puertas y el mundo pasa más deprisa.'
  },
  {
    titulo:'Memoria Neón', genero:'memoria', arte:'a8',
    carpeta:'10-simon',
    jugadores:'1 jugador', controles:'Clic o Q W A S',
    etiquetas:['Memoria','Secuencias','Sonido','Un fallo y fuera'],
    descripcion:'Cuatro luces con su propia nota. La secuencia crece una luz por ronda y se reproduce cada vez más rápido, hasta que la mano se adelanta a la cabeza.'
  },
  {
    titulo:'Campo Minado', genero:'lógica', arte:'a9',
    carpeta:'11-campo-minado',
    jugadores:'1 jugador', controles:'Clic y clic derecho',
    etiquetas:['Lógica','Tres dificultades','Banderas','Cronómetro'],
    descripcion:'La primera casilla nunca esconde mina, así que siempre se abre un hueco para empezar. Tres tamaños de campo y un cronómetro que no perdona las dudas.'
  },
  {
    titulo:'Fusión 2048', genero:'puzle', arte:'a10',
    carpeta:'12-fusion',
    jugadores:'1 jugador', controles:'Arrastrar o flechas',
    etiquetas:['Puzle','Números','Récord','Sin límite'],
    descripcion:'Dos fichas iguales se funden en una del doble. Al llegar a 2048 puedes parar o seguir apretando el tablero hasta que no quede ni un hueco.'
  },
  {
    titulo:'Piezas Sueltas', genero:'destreza', arte:'a11',
    carpeta:'13-rompecabezas',
    jugadores:'1 jugador', controles:'Arrastrar con el ratón',
    etiquetas:['Rompecabezas','Arrastrar y soltar','Tres cuadros','Hasta 5×5'],
    descripcion:'Arrastra una pieza sobre otra para intercambiarlas. La pieza agarrada se levanta, se inclina y proyecta sombra sobre el tablero, así que siempre sabes cuál llevas en la mano.'
  },
  {
    titulo:'Chatarra Espacial', genero:'espacio', arte:'a12',
    carpeta:'14-asteroides',
    jugadores:'1 jugador', controles:'Flechas y espacio',
    etiquetas:['Espacio','Inercia','Rocas que se parten','Pantalla sin bordes'],
    descripcion:'La nave no frena sola y los bordes de la pantalla dan la vuelta, así que lo difícil no es disparar sino colocarse. Cada roca grande se parte en dos, y esas en otras dos.'
  },
  {
    titulo:'Cruce Peligroso', genero:'travesía', arte:'a13',
    carpeta:'15-cruce',
    jugadores:'1 jugador', controles:'Flechas o WASD',
    etiquetas:['Travesía','Cinco casas','Tráfico','Río'],
    descripcion:'Cinco carriles de tráfico y cinco de río. En el agua solo sobrevives encima de un tronco, y el tronco se mueve contigo hacia el borde de la pantalla.'
  },
  {
    titulo:'Cuatro en Línea', genero:'mesa', arte:'a14',
    carpeta:'16-cuatro-en-linea',
    jugadores:'1 o 2 jugadores', controles:'Clic o teclas 1 a 7',
    etiquetas:['Mesa','Contra la máquina','Tres niveles','Dos jugadores'],
    descripcion:'Contra una máquina que piensa con minimax y poda alfa-beta, en tres profundidades. En el nivel duro mira seis jugadas por delante y tapa antes de que veas la línea.'
  },
  {
    titulo:'Brigada Acorazada', genero:'tanques', arte:'a15',
    carpeta:'17-tanques',
    jugadores:'1 jugador', controles:'Flechas o WASD y espacio',
    etiquetas:['Tanques','Cinco fases','Seis premios','Defender la base'],
    descripcion:'Veinte tanques por fase y un águila que no puede caer. El muro de ladrillo se deshace a tiros, el de acero solo con el tercer ascenso, y bajo los árboles nadie te ve venir.'
  },
  {
    titulo:'Filo de Sombra', genero:'plataformas', arte:'a16',
    carpeta:'18-filo-de-sombra',
    jugadores:'1 jugador', controles:'Flechas o WASD, espacio, Z y X',
    etiquetas:['Plataformas','Trepar muros','Tres actos','Jefes'],
    descripcion:'Un ninja que se agarra a las paredes y sube a saltos de muro en muro. Tres actos con farol que romper, artes ninja que gastan espíritu y un jefe esperando al final de cada uno.'
  },
  {
    titulo:'Fuera de Combate', genero:'boxeo', arte:'a17',
    carpeta:'19-fuera-de-combate',
    jugadores:'1 jugador', controles:'Flechas, Z, X y espacio',
    etiquetas:['Boxeo','Tres rivales','Contragolpe','Estrellas'],
    descripcion:'Boxeo visto desde tu esquina. Cada rival avisa antes de pegar y solo se abre justo después de fallar: ahí está todo el juego. Esquivar da estrellas, y la estrella tumba.'
  },
  {
    titulo:'Mundo Fontanero', genero:'plataformas', arte:'a18',
    carpeta:'35-fontanero',
    jugadores:'1 jugador', controles:'Flechas, Z y X',
    etiquetas:['Plataformas','Tres mundos','Salto giratorio','Capa'],
    descripcion:'Scroll lateral de los de dieciséis bits. La seta te hace grande, la pluma te da capa y con ella se planea; el salto giratorio rompe ladrillos y no teme a las corazas. Tres mundos, del prado al castillo.'
  },
];

export const GENEROS: string[] = [
  'todos',
  ...Array.from(new Set(CABINAS.map((c) => c.genero))),
];

export function buscarCabina(carpeta: string): Cabina | undefined {
  return CABINAS.find((c) => c.carpeta === carpeta);
}

/** Ruta de la página de la cabina dentro del salón. */
export function rutaDe(cabina: Pick<Cabina, 'carpeta'>): string {
  return `/juegos/${cabina.carpeta}`;
}
