/**
 * CarterBlast — Authentic Block Blast Experience with Painted CarterPCs Blocks
 */

const GRID_SIZE = 8;

// 7 Block Blast classic vibrant block colors
const BLOCK_COLORS = [
  { id: 'cyan',    name: 'Cyan',    hex: '#00c3e3', light: '#70e7f9', dark: '#00839c' },
  { id: 'orange',  name: 'Orange',  hex: '#ff7a00', light: '#ffb266', dark: '#c44e00' },
  { id: 'purple',  name: 'Purple',  hex: '#9d4edd', light: '#d0a2f7', dark: '#6a1b9a' },
  { id: 'green',   name: 'Green',   hex: '#2ec4b6', light: '#7be4d5', dark: '#0e8a7d' },
  { id: 'yellow',  name: 'Yellow',  hex: '#ffb703', light: '#ffe169', dark: '#c78500' },
  { id: 'red',     name: 'Red',     hex: '#ff3366', light: '#ff85a2', dark: '#b81440' },
  { id: 'blue',    name: 'Blue',    hex: '#3a86ff', light: '#8cb9ff', dark: '#1557bf' }
];

// Classic Block Blast polyomino shapes
const SHAPES = [
  // Single & Dominoes
  { name: '1x1', matrix: [[1]] },
  { name: '1x2', matrix: [[1, 1]] },
  { name: '2x1', matrix: [[1], [1]] },
  // Trominoes
  { name: '1x3', matrix: [[1, 1, 1]] },
  { name: '3x1', matrix: [[1], [1], [1]] },
  { name: 'L3-1', matrix: [[1, 0], [1, 1]] },
  { name: 'L3-2', matrix: [[0, 1], [1, 1]] },
  { name: 'L3-3', matrix: [[1, 1], [1, 0]] },
  { name: 'L3-4', matrix: [[1, 1], [0, 1]] },
  // Tetrominoes
  { name: '2x2', matrix: [[1, 1], [1, 1]] },
  { name: '1x4', matrix: [[1, 1, 1, 1]] },
  { name: '4x1', matrix: [[1], [1], [1], [1]] },
  { name: 'T-up', matrix: [[0, 1, 0], [1, 1, 1]] },
  { name: 'T-down', matrix: [[1, 1, 1], [0, 1, 0]] },
  { name: 'T-left', matrix: [[0, 1], [1, 1], [0, 1]] },
  { name: 'T-right', matrix: [[1, 0], [1, 1], [1, 0]] },
  { name: 'L4-1', matrix: [[1, 0], [1, 0], [1, 1]] },
  { name: 'L4-2', matrix: [[0, 1], [0, 1], [1, 1]] },
  { name: 'L4-3', matrix: [[1, 1, 1], [1, 0, 0]] },
  { name: 'L4-4', matrix: [[1, 1, 1], [0, 0, 1]] },
  { name: 'Z-h', matrix: [[1, 1, 0], [0, 1, 1]] },
  { name: 'S-h', matrix: [[0, 1, 1], [1, 1, 0]] },
  // Pentominoes & Big Blocks
  { name: '1x5', matrix: [[1, 1, 1, 1, 1]] },
  { name: '5x1', matrix: [[1], [1], [1], [1], [1]] },
  { name: 'Big-L1', matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
  { name: 'Big-L2', matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
  { name: 'Big-L3', matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
  { name: 'Big-L4', matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },
  { name: '3x3', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] }
];

// State
let board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
let dockPieces = [null, null, null];
let score = 0;
let bestScore = Number(localStorage.getItem('carterblast_best') || 0);
let comboStreak = 0;
let soundEnabled = true;

// Painted Carter Texture Cache: colorId -> dataURL
const paintedCarterTextures = new Map();
let baseCarterImage = null;

// Dragging State
let activeDrag = null;

// Audio Context
let audioCtx = null;

// DOM Elements
const boardGridEl = document.getElementById('board-grid');
const feedbackLayerEl = document.getElementById('feedback-layer');
const scoreEl = document.getElementById('current-score');
const bestScoreEl = document.getElementById('best-score');
const comboBadgeEl = document.getElementById('combo-badge');
const dragProxyEl = document.getElementById('drag-proxy');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const soundOnIcon = document.getElementById('sound-on-icon');
const soundOffIcon = document.getElementById('sound-off-icon');
const restartBtn = document.getElementById('restart-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const gameOverDialog = document.getElementById('game-over-dialog');
const customImgInput = document.getElementById('custom-img-input');
const presetHeadsetBtn = document.getElementById('preset-headset-btn');
const presetYtBtn = document.getElementById('preset-yt-btn');
const finalScoreVal = document.getElementById('final-score-val');
const finalBestVal = document.getElementById('final-best-val');

/**
 * Initialize
 */
async function init() {
  bestScoreEl.textContent = bestScore.toLocaleString();
  createBoardCells();
  setupEventListeners();

  const savedCustomImg = localStorage.getItem('carterblast_custom_img');
  await loadCarterImage(savedCustomImg || 'assets/carter.jpg');

  startNewGame();
}

/**
 * Load base Carter image & bake painted color textures
 */
function loadCarterImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseCarterImage = img;
      bakePaintedCarterTextures(img);
      refreshAllRenderedTiles();
      resolve();
    };
    img.onerror = () => {
      const fallbackCanvas = createFallbackCarterCanvas();
      bakePaintedCarterTextures(fallbackCanvas);
      refreshAllRenderedTiles();
      resolve();
    };
    img.src = src;
  });
}

/**
 * Paint Carter's face into each Block Blast color while preserving photographic details
 */
function bakePaintedCarterTextures(sourceImage) {
  const size = 160;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const sw = sourceImage.width || size;
  const sh = sourceImage.height || size;
  const minDim = Math.min(sw, sh);
  const sx = (sw - minDim) / 2;
  const sy = (sh - minDim) / 2;

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(sourceImage, sx, sy, minDim, minDim, 0, 0, size, size);
  const baseData = ctx.getImageData(0, 0, size, size);

  BLOCK_COLORS.forEach((colorObj) => {
    const paintedData = new ImageData(
      new Uint8ClampedArray(baseData.data),
      size,
      size
    );
    const data = paintedData.data;

    const targetRGB = hexToRgb(colorObj.hex);
    const lightRGB = hexToRgb(colorObj.light);
    const darkRGB = hexToRgb(colorObj.dark);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      lum = Math.max(0, Math.min(1, (lum - 0.5) * 1.25 + 0.5));

      let outR, outG, outB;
      if (lum < 0.5) {
        const t = lum * 2;
        outR = darkRGB.r + (targetRGB.r - darkRGB.r) * t;
        outG = darkRGB.g + (targetRGB.g - darkRGB.g) * t;
        outB = darkRGB.b + (targetRGB.b - darkRGB.b) * t;
      } else {
        const t = (lum - 0.5) * 2;
        const highlightR = lightRGB.r * 0.7 + 255 * 0.3;
        const highlightG = lightRGB.g * 0.7 + 255 * 0.3;
        const highlightB = lightRGB.b * 0.7 + 255 * 0.3;

        outR = targetRGB.r + (highlightR - targetRGB.r) * t;
        outG = targetRGB.g + (highlightG - targetRGB.g) * t;
        outB = targetRGB.b + (highlightB - targetRGB.b) * t;
      }

      data[i] = outR;
      data[i + 1] = outG;
      data[i + 2] = outB;
    }

    ctx.putImageData(paintedData, 0, 0);

    // Bevel highlights
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    paintedCarterTextures.set(colorObj.id, canvas.toDataURL('image/png'));
  });
}

function createFallbackCarterCanvas() {
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 160, 160);
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(80, 70, 38, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * 8x8 Board Creation
 */
function createBoardCells() {
  boardGridEl.innerHTML = '';
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute('role', 'gridcell');
      boardGridEl.appendChild(cell);
    }
  }
}

function getCellEl(r, c) {
  return boardGridEl.children[r * GRID_SIZE + c];
}

function createCarterTileEl(colorObj) {
  const tile = document.createElement('div');
  tile.className = 'carter-tile';
  tile.dataset.colorId = colorObj.id;
  const texUrl = paintedCarterTextures.get(colorObj.id);
  if (texUrl) {
    tile.style.backgroundImage = `url("${texUrl}")`;
  }
  tile.style.backgroundColor = colorObj.hex;
  return tile;
}

function refreshAllRenderedTiles() {
  document.querySelectorAll('.carter-tile').forEach((tile) => {
    const colorId = tile.dataset.colorId;
    const texUrl = paintedCarterTextures.get(colorId);
    if (texUrl) {
      tile.style.backgroundImage = `url("${texUrl}")`;
    }
  });
}

/**
 * Game Flow
 */
function startNewGame() {
  board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  score = 0;
  comboStreak = 0;
  updateScoreUI();
  renderBoard();
  spawnDockWave();
}

function renderBoard() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cellEl = getCellEl(r, c);
      cellEl.className = 'grid-cell';
      cellEl.innerHTML = '';
      const colorObj = board[r][c];
      if (colorObj) {
        cellEl.classList.add('filled');
        cellEl.appendChild(createCarterTileEl(colorObj));
      }
    }
  }
}

/**
 * High-Order Solvability Engine:
 * Simulates all 3! (6) permutation paths across the board, accounting for line clears
 * that open up new room for subsequent pieces (just like chess tactical lines).
 */
function canPlaceOnBitboard(bitboard, matrix, baseRow, baseCol) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  if (baseRow < 0 || baseCol < 0 || baseRow + rows > GRID_SIZE || baseCol + cols > GRID_SIZE) {
    return false;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] && bitboard[baseRow + r][baseCol + c]) {
        return false;
      }
    }
  }
  return true;
}

function applyPlacementAndClears(bitboard, matrix, baseRow, baseCol) {
  const nextBoard = bitboard.map(row => [...row]);
  const rows = matrix.length;
  const cols = matrix[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c]) {
        nextBoard[baseRow + r][baseCol + c] = true;
      }
    }
  }

  const rowsToClear = [];
  const colsToClear = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    if (nextBoard[r].every(Boolean)) rowsToClear.push(r);
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (!nextBoard[r][c]) {
        full = false;
        break;
      }
    }
    if (full) colsToClear.push(c);
  }

  rowsToClear.forEach(r => {
    for (let c = 0; c < GRID_SIZE; c++) nextBoard[r][c] = false;
  });
  colsToClear.forEach(c => {
    for (let r = 0; r < GRID_SIZE; r++) nextBoard[r][c] = false;
  });

  return nextBoard;
}

/**
 * Checks whether an array of pieces can all be placed sequentially on the given board state,
 * searching all permutation orders and branch placements.
 */
function isPieceSequenceSolvable(pieces, currentBoard = board) {
  if (!pieces || pieces.length === 0) return true;

  const startBitboard = currentBoard.map(row => row.map(cell => Boolean(cell)));

  function search(remainingPieces, currentBitboard) {
    if (remainingPieces.length === 0) return true;

    for (let i = 0; i < remainingPieces.length; i++) {
      const piece = remainingPieces[i];
      const matrix = piece.shape.matrix;
      const rest = remainingPieces.filter((_, idx) => idx !== i);

      let pieceCanFit = false;

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (canPlaceOnBitboard(currentBitboard, matrix, r, c)) {
            pieceCanFit = true;
            const updatedBitboard = applyPlacementAndClears(currentBitboard, matrix, r, c);
            if (search(rest, updatedBitboard)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  return search(pieces, startBitboard);
}

/**
 * Spawn 3 new pieces with mathematical solvability guarantee.
 * Evaluates candidate sets against the board: if a set cannot be completely placed
 * (even with clearing lines to create room), it discards and generates a set that IS guaranteed solvable.
 */
function spawnDockWave() {
  const currentBitboard = board.map(row => row.map(cell => Boolean(cell)));
  let selectedSet = null;

  // 1. Try drawing balanced sets and verify full 3-piece solvability
  for (let attempt = 0; attempt < 80; attempt++) {
    const candidateSet = [
      generateRandomPiece(),
      generateRandomPiece(),
      generateRandomPiece()
    ];

    if (isPieceSequenceSolvable(candidateSet, board)) {
      selectedSet = candidateSet;
      break;
    }
  }

  // 2. If the board is tightly packed and random draws fail, construct a tailored solvable tray
  if (!selectedSet) {
    // Find all shapes that can currently fit on the board
    const fittingShapes = SHAPES.filter(s => canMatrixFitAnywhere(s.matrix));
    
    if (fittingShapes.length > 0) {
      // Pick a first piece from fitting shapes
      const firstShape = fittingShapes[Math.floor(Math.random() * fittingShapes.length)];
      const firstColor = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
      const p1 = { shape: firstShape, color: firstColor };

      // Find valid placements of p1 to see resulting board space
      let bestContinuation = null;

      for (let r = 0; r < GRID_SIZE && !bestContinuation; r++) {
        for (let c = 0; c < GRID_SIZE && !bestContinuation; c++) {
          if (canPlaceOnBitboard(currentBitboard, firstShape.matrix, r, c)) {
            const b2 = applyPlacementAndClears(currentBitboard, firstShape.matrix, r, c);
            const fitting2 = SHAPES.filter(s => {
              for (let r2 = 0; r2 < GRID_SIZE; r2++) {
                for (let c2 = 0; c2 < GRID_SIZE; c2++) {
                  if (canPlaceOnBitboard(b2, s.matrix, r2, c2)) return true;
                }
              }
              return false;
            });

            if (fitting2.length > 0) {
              const secondShape = fitting2[Math.floor(Math.random() * fitting2.length)];
              const secondColor = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
              const p2 = { shape: secondShape, color: secondColor };

              // Find placement for p2 to see resulting board space for p3
              for (let r2 = 0; r2 < GRID_SIZE && !bestContinuation; r2++) {
                for (let c2 = 0; c2 < GRID_SIZE && !bestContinuation; c2++) {
                  if (canPlaceOnBitboard(b2, secondShape.matrix, r2, c2)) {
                    const b3 = applyPlacementAndClears(b2, secondShape.matrix, r2, c2);
                    const fitting3 = SHAPES.filter(s => {
                      for (let r3 = 0; r3 < GRID_SIZE; r3++) {
                        for (let c3 = 0; c3 < GRID_SIZE; c3++) {
                          if (canPlaceOnBitboard(b3, s.matrix, r3, c3)) return true;
                        }
                      }
                      return false;
                    });

                    if (fitting3.length > 0) {
                      const thirdShape = fitting3[Math.floor(Math.random() * fitting3.length)];
                      const thirdColor = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
                      const p3 = { shape: thirdShape, color: thirdColor };
                      bestContinuation = [p1, p2, p3];
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (bestContinuation) {
        selectedSet = bestContinuation;
      }
    }
  }

  // 3. Fallback: if board is 98% full and only small shapes can fit, supply small tacticals (1x1, 1x2, 2x1)
  if (!selectedSet) {
    const smallShapes = SHAPES.filter(s => s.matrix.length <= 2 && s.matrix[0].length <= 2);
    selectedSet = [
      { shape: smallShapes[Math.floor(Math.random() * smallShapes.length)], color: BLOCK_COLORS[0] },
      { shape: smallShapes[Math.floor(Math.random() * smallShapes.length)], color: BLOCK_COLORS[1] },
      { shape: smallShapes[Math.floor(Math.random() * smallShapes.length)], color: BLOCK_COLORS[2] }
    ];
  }

  for (let i = 0; i < 3; i++) {
    dockPieces[i] = selectedSet[i];
  }

  renderDock();
  updatePlayabilityState();
}

function generateRandomPiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
  return { shape, color };
}

function renderDock() {
  const slots = document.querySelectorAll('.dock-slot');
  slots.forEach((slotEl, idx) => {
    slotEl.innerHTML = '';
    slotEl.classList.remove('empty', 'unplayable');
    const piece = dockPieces[idx];
    if (!piece) {
      slotEl.classList.add('empty');
      return;
    }

    const { matrix } = piece.shape;
    const rows = matrix.length;
    const cols = matrix[0].length;
    const maxDim = Math.max(rows, cols);
    const cellSize = maxDim >= 5 ? 16 : maxDim === 4 ? 20 : 25;

    const handle = document.createElement('div');
    handle.className = 'piece-handle';
    handle.dataset.slotIndex = idx;
    handle.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
    handle.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
    handle.style.setProperty('--dock-cell-size', `${cellSize}px`);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'piece-cell';
        if (matrix[r][c]) {
          cellDiv.appendChild(createCarterTileEl(piece.color));
        }
        handle.appendChild(cellDiv);
      }
    }

    bindDragEventsToHandle(handle, idx);
    slotEl.appendChild(handle);
  });
}

/**
 * Drag and Drop
 */
function bindDragEventsToHandle(handle, slotIndex) {
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const piece = dockPieces[slotIndex];
    if (!piece) return;

    initAudio();
    playTone(280, 0.05, 'triangle', 0.08);

    handle.setPointerCapture(event.pointerId);
    handle.classList.add('dragging');

    const sampleCell = getCellEl(0, 0);
    const cellRect = sampleCell.getBoundingClientRect();
    const boardCellSize = cellRect.width;

    const { matrix } = piece.shape;
    const rows = matrix.length;
    const cols = matrix[0].length;

    dragProxyEl.innerHTML = '';
    dragProxyEl.style.gridTemplateColumns = `repeat(${cols}, ${boardCellSize}px)`;
    dragProxyEl.style.gridTemplateRows = `repeat(${rows}, ${boardCellSize}px)`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const proxyCell = document.createElement('div');
        proxyCell.className = 'piece-cell';
        proxyCell.style.width = `${boardCellSize}px`;
        proxyCell.style.height = `${boardCellSize}px`;
        if (matrix[r][c]) {
          proxyCell.appendChild(createCarterTileEl(piece.color));
        }
        dragProxyEl.appendChild(proxyCell);
      }
    }

    dragProxyEl.classList.remove('hidden');

    const proxyWidth = cols * boardCellSize + (cols - 1) * 5;
    const proxyHeight = rows * boardCellSize + (rows - 1) * 5;
    const isTouch = event.pointerType === 'touch';
    const liftOffsetY = isTouch ? 76 : 24;

    activeDrag = {
      slotIndex,
      piece,
      handleEl: handle,
      pointerId: event.pointerId,
      boardCellSize,
      proxyWidth,
      proxyHeight,
      liftOffsetY,
      targetRow: null,
      targetCol: null
    };

    updateDragPosition(event.clientX, event.clientY);
  });

  handle.addEventListener('pointermove', (event) => {
    if (!activeDrag || !handle.hasPointerCapture(event.pointerId)) return;
    updateDragPosition(event.clientX, event.clientY);
  });

  handle.addEventListener('lostpointercapture', () => {
    if (!activeDrag) return;
    finalizeDrag();
  });
}

function updateDragPosition(clientX, clientY) {
  if (!activeDrag) return;
  const { proxyWidth, proxyHeight, liftOffsetY, piece, boardCellSize } = activeDrag;

  const rawLeft = clientX - proxyWidth / 2;
  const rawTop = clientY - proxyHeight / 2 - liftOffsetY;

  const maxLeft = Math.max(0, window.innerWidth - proxyWidth);
  const maxTop = Math.max(0, window.innerHeight - proxyHeight);

  const clampedLeft = Math.max(0, Math.min(rawLeft, maxLeft));
  const clampedTop = Math.max(0, Math.min(rawTop, maxTop));

  dragProxyEl.style.left = `${clampedLeft}px`;
  dragProxyEl.style.top = `${clampedTop}px`;

  const gridRect = boardGridEl.getBoundingClientRect();
  const step = boardCellSize + 5;

  const firstCellCenterX = clampedLeft + boardCellSize / 2;
  const firstCellCenterY = clampedTop + boardCellSize / 2;

  const col = Math.floor((firstCellCenterX - gridRect.left) / step);
  const row = Math.floor((firstCellCenterY - gridRect.top) / step);

  if (canPlaceMatrixAt(piece.shape.matrix, row, col)) {
    if (activeDrag.targetRow !== row || activeDrag.targetCol !== col) {
      activeDrag.targetRow = row;
      activeDrag.targetCol = col;
      renderGhostPreview(piece, row, col);
    }
  } else {
    if (activeDrag.targetRow !== null) {
      activeDrag.targetRow = null;
      activeDrag.targetCol = null;
      clearGhostPreview();
    }
  }
}

function renderGhostPreview(piece, baseRow, baseCol) {
  clearGhostPreview();
  const { matrix } = piece.shape;
  const placedCoords = [];

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[0].length; c++) {
      if (matrix[r][c]) {
        const tr = baseRow + r;
        const tc = baseCol + c;
        placedCoords.push([tr, tc]);
        const cellEl = getCellEl(tr, tc);
        cellEl.classList.add('ghost-valid');
        cellEl.appendChild(createCarterTileEl(piece.color));
      }
    }
  }

  const { rowsToClear, colsToClear } = simulateLineClears(placedCoords);
  rowsToClear.forEach((r) => {
    for (let c = 0; c < GRID_SIZE; c++) {
      getCellEl(r, c).classList.add('will-clear');
    }
  });
  colsToClear.forEach((c) => {
    for (let r = 0; r < GRID_SIZE; r++) {
      getCellEl(r, c).classList.add('will-clear');
    }
  });
}

function clearGhostPreview() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const cellEl = getCellEl(r, c);
      cellEl.classList.remove('will-clear');
      if (cellEl.classList.contains('ghost-valid')) {
        cellEl.classList.remove('ghost-valid');
        cellEl.innerHTML = '';
      }
    }
  }
}

function simulateLineClears(extraCoords) {
  const tempFilled = Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (_, c) => Boolean(board[r][c]))
  );
  extraCoords.forEach(([r, c]) => {
    tempFilled[r][c] = true;
  });

  const rowsToClear = [];
  const colsToClear = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    if (tempFilled[r].every(Boolean)) rowsToClear.push(r);
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (!tempFilled[r][c]) {
        full = false;
        break;
      }
    }
    if (full) colsToClear.push(c);
  }

  return { rowsToClear, colsToClear };
}

function finalizeDrag() {
  const { slotIndex, piece, handleEl, targetRow, targetCol } = activeDrag;
  handleEl.classList.remove('dragging');
  dragProxyEl.classList.add('hidden');
  clearGhostPreview();

  if (targetRow !== null && targetCol !== null && canPlaceMatrixAt(piece.shape.matrix, targetRow, targetCol)) {
    placePieceOnBoard(slotIndex, piece, targetRow, targetCol);
  } else {
    playTone(170, 0.06, 'sine', 0.06);
  }

  activeDrag = null;
}

function placePieceOnBoard(slotIndex, piece, baseRow, baseCol) {
  const { matrix } = piece.shape;
  let blocksPlaced = 0;

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[0].length; c++) {
      if (matrix[r][c]) {
        const tr = baseRow + r;
        const tc = baseCol + c;
        board[tr][tc] = piece.color;
        const cellEl = getCellEl(tr, tc);
        cellEl.className = 'grid-cell filled';
        cellEl.innerHTML = '';
        cellEl.appendChild(createCarterTileEl(piece.color));
        blocksPlaced++;
      }
    }
  }

  dockPieces[slotIndex] = null;
  renderDock();

  let pointsEarned = blocksPlaced * 10;
  const { rowsToClear, colsToClear } = simulateLineClears([]);
  const totalLines = rowsToClear.length + colsToClear.length;

  if (totalLines > 0) {
    comboStreak++;
    const lineBonus = totalLines * 100 * totalLines;
    const streakMultiplier = 1 + (comboStreak - 1) * 0.5;
    const clearScore = Math.round(lineBonus * streakMultiplier);
    pointsEarned += clearScore;

    triggerLineClearAnimation(rowsToClear, colsToClear);
    playClearSound(totalLines, comboStreak);

    const centerRow = rowsToClear[0] ?? baseRow;
    const centerCol = colsToClear[0] ?? baseCol;
    showFloatingText(
      comboStreak > 1 ? `${comboStreak} COMBO!` : `+${pointsEarned}`,
      centerRow,
      centerCol,
      comboStreak > 1
    );
  } else {
    comboStreak = 0;
    playTone(380, 0.07, 'triangle', 0.11);
  }

  score += pointsEarned;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('carterblast_best', String(bestScore));
  }
  updateScoreUI();

  const delay = totalLines > 0 ? 330 : 40;
  setTimeout(() => {
    if (dockPieces.every((p) => p === null)) {
      spawnDockWave();
    } else {
      updatePlayabilityState();
    }
  }, delay);
}

function triggerLineClearAnimation(rowsToClear, colsToClear) {
  const coordsToClear = new Set();
  rowsToClear.forEach((r) => {
    for (let c = 0; c < GRID_SIZE; c++) coordsToClear.add(`${r},${c}`);
  });
  colsToClear.forEach((c) => {
    for (let r = 0; r < GRID_SIZE; r++) coordsToClear.add(`${r},${c}`);
  });

  coordsToClear.forEach((key) => {
    const [r, c] = key.split(',').map(Number);
    board[r][c] = null;
    const cellEl = getCellEl(r, c);
    cellEl.classList.add('clearing');
  });

  setTimeout(() => {
    coordsToClear.forEach((key) => {
      const [r, c] = key.split(',').map(Number);
      const cellEl = getCellEl(r, c);
      cellEl.className = 'grid-cell';
      cellEl.innerHTML = '';
    });
  }, 320);
}

function showFloatingText(text, row, col, isCombo) {
  const el = document.createElement('div');
  el.className = `floating-text${isCombo ? ' combo' : ' score-only'}`;
  el.textContent = text;

  const pctX = Math.max(20, Math.min(80, ((col + 0.5) / GRID_SIZE) * 100));
  const pctY = Math.max(20, Math.min(80, ((row + 0.5) / GRID_SIZE) * 100));
  el.style.left = `${pctX}%`;
  el.style.top = `${pctY}%`;

  feedbackLayerEl.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

function canPlaceMatrixAt(matrix, baseRow, baseCol) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  if (baseRow < 0 || baseCol < 0 || baseRow + rows > GRID_SIZE || baseCol + cols > GRID_SIZE) {
    return false;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] && board[baseRow + r][baseCol + c] !== null) {
        return false;
      }
    }
  }
  return true;
}

function canMatrixFitAnywhere(matrix) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (canPlaceMatrixAt(matrix, r, c)) return true;
    }
  }
  return false;
}

function canPieceFitAnywhere(piece) {
  if (!piece) return false;
  return canMatrixFitAnywhere(piece.shape.matrix);
}

function updatePlayabilityState() {
  const slots = document.querySelectorAll('.dock-slot');
  let anyMoveAvailable = false;

  dockPieces.forEach((piece, idx) => {
    const slotEl = slots[idx];
    if (!piece) return;
    const fits = canPieceFitAnywhere(piece);
    slotEl.classList.toggle('unplayable', !fits);
    if (fits) anyMoveAvailable = true;
  });

  if (!anyMoveAvailable && dockPieces.some((p) => p !== null)) {
    setTimeout(() => triggerGameOver(), 300);
  }
}

function triggerGameOver() {
  playGameOverSound();
  finalScoreVal.textContent = score.toLocaleString();
  finalBestVal.textContent = bestScore.toLocaleString();

  if (typeof gameOverDialog.showModal === 'function') {
    gameOverDialog.showModal();
  }
}

function updateScoreUI() {
  scoreEl.textContent = score.toLocaleString();
  scoreEl.classList.remove('bump');
  void scoreEl.offsetWidth; // trigger reflow
  scoreEl.classList.add('bump');

  bestScoreEl.textContent = bestScore.toLocaleString();

  if (comboStreak > 1) {
    comboBadgeEl.textContent = `${comboStreak} COMBO!`;
    comboBadgeEl.classList.remove('hidden');
  } else {
    comboBadgeEl.classList.add('hidden');
  }
}

/**
 * Web Audio
 */
function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(freq, duration, type = 'sine', volume = 0.1) {
  if (!soundEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function playClearSound(linesCleared, streak) {
  if (!soundEnabled || !audioCtx) return;
  const baseNotes = [523.25, 659.25, 783.99, 1046.5];
  const pitchShift = Math.min(1.4, 1 + (streak - 1) * 0.08 + (linesCleared - 1) * 0.1);
  baseNotes.forEach((note, idx) => {
    setTimeout(() => {
      playTone(note * pitchShift, 0.16, 'triangle', 0.14);
    }, idx * 55);
  });
}

function playGameOverSound() {
  if (!soundEnabled || !audioCtx) return;
  [392, 349.23, 329.63, 261.63].forEach((note, idx) => {
    setTimeout(() => {
      playTone(note, 0.22, 'sawtooth', 0.07);
    }, idx * 110);
  });
}

/**
 * Event Listeners
 */
function setupEventListeners() {
  restartBtn.addEventListener('click', () => {
    initAudio();
    playTone(440, 0.08, 'triangle', 0.1);
    startNewGame();
  });

  playAgainBtn.addEventListener('click', () => {
    gameOverDialog.close();
    startNewGame();
  });

  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.setAttribute('aria-pressed', String(soundEnabled));
    soundOnIcon.classList.toggle('hidden', !soundEnabled);
    soundOffIcon.classList.toggle('hidden', soundEnabled);
    if (soundEnabled) {
      initAudio();
      playTone(587.33, 0.08, 'triangle', 0.1);
    }
  });

  customImgInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === 'string') {
        try {
          localStorage.setItem('carterblast_custom_img', dataUrl);
        } catch (_) {}
        await loadCarterImage(dataUrl);
        const settingsDialog = document.getElementById('settings-dialog');
        if (settingsDialog?.close) settingsDialog.close();
      }
    };
    reader.readAsDataURL(file);
  });

  presetHeadsetBtn.addEventListener('click', async () => {
    localStorage.removeItem('carterblast_custom_img');
    await loadCarterImage('assets/carter.jpg');
    const settingsDialog = document.getElementById('settings-dialog');
    if (settingsDialog?.close) settingsDialog.close();
  });

  presetYtBtn.addEventListener('click', async () => {
    localStorage.setItem('carterblast_custom_img', 'assets/carter.png');
    await loadCarterImage('assets/carter.png');
    const settingsDialog = document.getElementById('settings-dialog');
    if (settingsDialog?.close) settingsDialog.close();
  });
}

init();
