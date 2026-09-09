const LEVELS = (() => {
  const rowColors1 = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];
  const rowColors2 = ['gray', 'cyan', 'hotpink', 'yellow', 'magenta', 'green'];
  const rowColors4 = ['cyan', 'magenta', 'green', 'yellow', 'hotpink', 'red'];

  const l1 = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      l1.push({ col, row, color: rowColors1[row] });

  const l2 = [];
  const pyStart = [4, 3, 2, 1, 0, 0];
  const pyEnd   = [5, 6, 7, 8, 9, 9];
  for (let row = 0; row < 6; row++)
    for (let col = pyStart[row]; col <= pyEnd[row]; col++)
      l2.push({ col, row, color: rowColors2[row] });

  const l3 = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if ((col + row) % 2 === 0)
        l3.push({ col, row, color: row < 3 ? 'yellow' : 'magenta' });

  const gaps4 = [
    [2, 5, 8], [0, 4, 7, 9], [1, 3, 6],
    [2, 5, 8, 9], [0, 4, 7], [1, 3, 6, 9],
  ];
  const l4 = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if (!gaps4[row].includes(col))
        l4.push({ col, row, color: rowColors4[row] });

  const l5 = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++) {
      const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
      const isCross = col === 4 || row === 2;
      if (isFrame || isCross)
        l5.push({ col, row, color: isCross && !isFrame ? 'hotpink' : 'cyan' });
    }

  const rowColors6  = ['magenta', 'red', 'yellow', 'yellow', 'red', 'magenta'];
  const rowColors7  = ['green', 'cyan', 'hotpink', 'green', 'cyan', 'hotpink'];
  const rowColors8  = ['red', 'gray', 'red', 'gray', 'red', 'gray'];
  const rowColors9  = ['cyan', 'green', 'yellow', 'hotpink', 'red', 'magenta'];

  // Nivel 6 — rombo centrado
  const diamondHalf = [1, 2, 3, 3, 2, 1];
  const l6 = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if (Math.abs(col - 4.5) <= diamondHalf[row])
        l6.push({ col, row, color: rowColors6[row], hits: (row === 2 || row === 3) ? 2 : 1 });

  // Nivel 7 — tablero de cuadros 2x2
  const l7 = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if ((Math.floor(col / 2) + Math.floor(row / 2)) % 2 === 0)
        l7.push({ col, row, color: rowColors7[row], hits: row <= 1 ? 2 : 1 });

  // Nivel 8 — dos torres laterales unidas por la fila superior
  const l8 = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if (col <= 2 || col >= 7 || row === 0)
        l8.push({ col, row, color: rowColors8[row], hits: row === 0 ? 3 : 2 });

  // Nivel 9 — pirámide invertida
  const l9 = [];
  for (let row = 0; row < 5; row++)
    for (let col = row; col <= 9 - row; col++)
      l9.push({ col, row, color: rowColors9[row], hits: row === 4 ? 3 : (row === 0 ? 2 : 1) });

  // Nivel 10 — marco con aspa
  const l10 = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++) {
      const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
      const diag = Math.round(row * 9 / 5);
      const isX = col === diag || col === 9 - diag;
      if (isFrame || isX)
        l10.push({ col, row, color: isX && !isFrame ? 'red' : 'gray', hits: isFrame ? 2 : 3 });
    }

  return [
    { speed: 1.00, blocks: l1 },
    { speed: 1.10, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
    { speed: 1.61, blocks: l6 },
    { speed: 1.77, blocks: l7 },
    { speed: 1.95, blocks: l8 },
    { speed: 2.14, blocks: l9 },
    { speed: 2.36, blocks: l10 },
  ];
})();
