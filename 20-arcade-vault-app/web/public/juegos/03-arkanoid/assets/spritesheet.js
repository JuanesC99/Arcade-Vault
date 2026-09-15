const EXPLOSION_FRAMES = {
  red: [ { sx: 256, sy: 176, sw: 32, sh: 16 }, { sx: 288, sy: 176, sw: 32, sh: 16 }, { sx: 320, sy: 176, sw: 32, sh: 16 }, { sx: 352, sy: 176, sw: 32, sh: 16 } ],
  cyan: [ { sx: 256, sy: 192, sw: 32, sh: 16 }, { sx: 288, sy: 192, sw: 32, sh: 16 }, { sx: 320, sy: 192, sw: 32, sh: 16 }, { sx: 352, sy: 192, sw: 32, sh: 16 } ],
  green: [ { sx: 256, sy: 208, sw: 32, sh: 16 }, { sx: 288, sy: 208, sw: 32, sh: 16 }, { sx: 320, sy: 208, sw: 32, sh: 16 }, { sx: 352, sy: 208, sw: 32, sh: 16 } ],
  magenta: [ { sx: 256, sy: 224, sw: 32, sh: 16 }, { sx: 288, sy: 224, sw: 32, sh: 16 }, { sx: 320, sy: 224, sw: 32, sh: 16 }, { sx: 352, sy: 224, sw: 32, sh: 16 } ],
  yellow: [ { sx: 256, sy: 240, sw: 32, sh: 16 }, { sx: 288, sy: 240, sw: 32, sh: 16 }, { sx: 320, sy: 240, sw: 32, sh: 16 }, { sx: 352, sy: 240, sw: 32, sh: 16 } ],
  hotpink: [ { sx: 256, sy: 256, sw: 32, sh: 16 }, { sx: 288, sy: 256, sw: 32, sh: 16 }, { sx: 320, sy: 256, sw: 32, sh: 16 }, { sx: 352, sy: 256, sw: 32, sh: 16 } ],
  gray: [ { sx: 256, sy: 176, sw: 32, sh: 16 }, { sx: 288, sy: 176, sw: 32, sh: 16 }, { sx: 320, sy: 176, sw: 32, sh: 16 }, { sx: 352, sy: 176, sw: 32, sh: 16 } ],
};

const EXPLOSION_DURATION = 150;

const SPRITES = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  }
};

let ssImg = null;
let ssLoaded = false;
const ssCallbacks = [];

function loadSpritesheet( cb ) {
  if ( ssLoaded ) { cb(); return; }
  ssCallbacks.push( cb );
  if ( ssImg ) return;

  const rawImg = new Image();
  rawImg.onload = () => {
    const oc = document.createElement( 'canvas' );
    oc.width = rawImg.width;
    oc.height = rawImg.height;
    const octx = oc.getContext( '2d' );
    octx.drawImage( rawImg, 0, 0 );
    ssImg = oc;
    ssLoaded = true;
    ssCallbacks.forEach( f => f() );
  };
  rawImg.onerror = () => console.error( 'Failed to load spritesheet' );
  rawImg.src = 'assets/spritesheet-breakout.png';
}

function drawFrame( ctx, frame, x, y, w, h ) {
  if ( !ssLoaded ) return;
  ctx.drawImage( ssImg, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h );
}

function drawSprite( ctx, name, x, y, w, h ) {
  if ( !ssLoaded ) return;
  let sp;
  if ( name.startsWith( 'block_' ) ) {
    sp = SPRITES.blocks[ name.slice( 6 ) ];
  } else {
    sp = SPRITES[ name ];
  }
  if ( !sp ) return;
  ctx.drawImage( ssImg, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h );
}
