"use strict";

const ROWS = 6;
const COLS = 7;
const HUMAN = "human";
const AI = "ai";

const TYPES = {
  NORMAL: "normal",
  WILD: "wild",
  BOMB: "bomb",
  SPIN: "spin"
};

const TYPE_META = {
  normal: {
    label: "Ficha de color",
    humanInstruction: "Elige una columna para lanzar tu ficha morada.",
    aiInstruction: "El sitio está eligiendo una columna.",
    symbol: ""
  },
  wild: {
    label: "Comodín verde",
    humanInstruction: "Cuenta como una ficha morada para completar tu conexión.",
    aiInstruction: "El comodín verde contará como una ficha naranjo.",
    symbol: "✦"
  },
  bomb: {
    label: "Ficha roja",
    humanInstruction: "Lánzala y luego elige una ficha naranjo para eliminar.",
    aiInstruction: "El sitio podrá eliminar una de tus fichas.",
    symbol: "×"
  },
  spin: {
    label: "Ficha azul",
    humanInstruction: "Al caer, girará el tablero y reordenará todas las columnas.",
    aiInstruction: "El sitio hará girar el tablero después de lanzar.",
    symbol: "↻"
  }
};

const boardGrid = document.getElementById("board-grid");
const columnControls = document.getElementById("column-controls");
const boardStage = document.getElementById("board-stage");
const boardHint = document.getElementById("board-hint");
const turnCard = document.getElementById("turn-card");
const turnTitle = document.getElementById("turn-title");
const turnInstruction = document.getElementById("turn-instruction");
const currentPiece = document.getElementById("current-piece");
const humanScoreEl = document.getElementById("human-score");
const aiScoreEl = document.getElementById("ai-score");
const toast = document.getElementById("toast");
const flash = document.getElementById("flash");
const resultModal = document.getElementById("result-modal");
const resultDisc = document.getElementById("result-disc");
const resultTitle = document.getElementById("result-title");
const resultCopy = document.getElementById("result-copy");

let board = [];
let turn = HUMAN;
let currentType = TYPES.NORMAL;
let inputLocked = true;
let targetMode = false;
let gameOver = false;
let winningCells = [];
let nextPieceId = 1;
let toastTimer = null;
let scores = { human: 0, ai: 0 };

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function randomType() {
  const roll = Math.random();
  if (roll < 0.54) return TYPES.NORMAL;
  if (roll < 0.72) return TYPES.WILD;
  if (roll < 0.88) return TYPES.BOMB;
  return TYPES.SPIN;
}

function ownerLabel(owner) {
  return owner === HUMAN ? "morada" : "naranjo";
}

function createBoardDOM() {
  boardGrid.innerHTML = "";
  columnControls.innerHTML = "";

  for (let col = 0; col < COLS; col += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "column-button";
    button.dataset.col = String(col);
    button.setAttribute("aria-label", `Lanzar ficha en la columna ${col + 1}`);
    button.textContent = "↓";
    button.addEventListener("click", () => handleHumanColumn(col));
    button.addEventListener("mouseenter", () => highlightColumn(col, true));
    button.addEventListener("mouseleave", () => highlightColumn(col, false));
    columnControls.appendChild(button);
  }

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "slot";
      slot.dataset.row = String(row);
      slot.dataset.col = String(col);
      slot.setAttribute("role", "gridcell");
      slot.setAttribute("aria-label", `Fila ${row + 1}, columna ${col + 1}`);
      slot.addEventListener("click", () => handleSlotClick(row, col));
      slot.addEventListener("mouseenter", () => highlightColumn(col, !targetMode));
      slot.addEventListener("mouseleave", () => highlightColumn(col, false));
      boardGrid.appendChild(slot);
    }
  }
}

function getSlot(row, col) {
  return boardGrid.querySelector(`.slot[data-row="${row}"][data-col="${col}"]`);
}

function highlightColumn(col, active) {
  if (targetMode || gameOver) return;
  document.querySelectorAll(`.slot[data-col="${col}"]`).forEach(slot => {
    slot.classList.toggle("is-column-hover", active);
  });
  const button = columnControls.querySelector(`[data-col="${col}"]`);
  if (button) button.classList.toggle("is-hovered", active);
}

function pieceClass(piece) {
  if (piece.type === TYPES.WILD) return "piece--wild";
  if (piece.type === TYPES.BOMB) return "piece--bomb";
  if (piece.type === TYPES.SPIN) return "piece--spin";
  return piece.owner === HUMAN ? "piece--human" : "piece--ai";
}

function pieceSymbol(piece) {
  return TYPE_META[piece.type].symbol;
}

function pieceAria(piece) {
  if (piece.type === TYPES.NORMAL) return `Ficha ${ownerLabel(piece.owner)}`;
  if (piece.type === TYPES.WILD) return `Comodín verde del jugador ${piece.owner === HUMAN ? "humano" : "sitio"}`;
  if (piece.type === TYPES.BOMB) return `Ficha roja del jugador ${piece.owner === HUMAN ? "humano" : "sitio"}`;
  return `Ficha azul del jugador ${piece.owner === HUMAN ? "humano" : "sitio"}`;
}

function renderBoard(options = {}) {
  const animateId = options.animateId ?? null;
  const targetOwner = targetMode ? AI : null;

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const slot = getSlot(row, col);
      const piece = board[row][col];
      slot.innerHTML = "";
      slot.classList.toggle("is-winner", winningCells.some(cell => cell.row === row && cell.col === col));
      slot.classList.toggle("is-targetable", Boolean(targetOwner && piece && piece.owner === targetOwner));

      if (!piece) {
        slot.setAttribute("aria-label", `Casilla vacía, columna ${col + 1}`);
        continue;
      }

      const pieceEl = document.createElement("span");
      pieceEl.className = `piece ${pieceClass(piece)}`;
      pieceEl.setAttribute("aria-hidden", "true");
      if (piece.id === animateId) {
        pieceEl.classList.add("is-new");
        pieceEl.style.setProperty("--drop-distance", `${(row + 1) * 88}px`);
      }

      const symbol = pieceSymbol(piece);
      if (symbol) {
        const symbolEl = document.createElement("span");
        symbolEl.textContent = symbol;
        pieceEl.appendChild(symbolEl);
      }

      slot.appendChild(pieceEl);
      slot.setAttribute("aria-label", `${pieceAria(piece)}, fila ${row + 1}, columna ${col + 1}`);
    }
  }

  updateColumnButtons();
}

function updateColumnButtons() {
  const buttons = columnControls.querySelectorAll(".column-button");
  buttons.forEach((button, col) => {
    const full = board[0][col] !== null;
    button.disabled = inputLocked || targetMode || gameOver || turn !== HUMAN || full;
  });
}

function setCurrentPieceAppearance(owner, type) {
  const gradients = {
    human: "#b296d8",
    ai: "#f1954e",
    wild: "#69aa2d",
    bomb: "#d62716",
    spin: "#008eb8"
  };

  const key = type === TYPES.NORMAL ? owner : type;
  currentPiece.style.setProperty("--piece-bg", gradients[key]);
  currentPiece.textContent = TYPE_META[type].symbol;
  currentPiece.classList.toggle("is-pulsing", owner === AI);
}

function updateTurnUI() {
  const isHuman = turn === HUMAN;
  turnCard.classList.toggle("is-ai", !isHuman);
  turnTitle.textContent = isHuman ? "Tu turno" : "Turno del sitio";
  turnInstruction.textContent = isHuman
    ? TYPE_META[currentType].humanInstruction
    : TYPE_META[currentType].aiInstruction;
  setCurrentPieceAppearance(turn, currentType);

  if (targetMode) {
    turnTitle.textContent = "Activa la ficha roja";
    turnInstruction.textContent = "Haz clic sobre cualquier ficha naranjo para eliminarla.";
    boardHint.textContent = "Las fichas que puedes eliminar están marcadas en rojo.";
  } else if (isHuman) {
    boardHint.textContent = "Haz clic sobre una flecha o una casilla para lanzar tu ficha.";
  } else {
    boardHint.textContent = "El sitio está pensando su movimiento…";
  }

  updateColumnButtons();
}

function showToast(message, duration = 2200) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), duration);
}

function flashScreen(color) {
  flash.style.background = color;
  flash.classList.add("is-visible");
  window.setTimeout(() => flash.classList.remove("is-visible"), 180);
}

function shakeScreen() {
  document.body.classList.remove("is-shaking");
  void document.body.offsetWidth;
  document.body.classList.add("is-shaking");
  window.setTimeout(() => document.body.classList.remove("is-shaking"), 460);
}

function findOpenRow(sourceBoard, col) {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (!sourceBoard[row][col]) return row;
  }
  return -1;
}

function validColumns(sourceBoard = board) {
  return Array.from({ length: COLS }, (_, col) => col).filter(col => sourceBoard[0][col] === null);
}

function placePiece(owner, type, col) {
  const row = findOpenRow(board, col);
  if (row < 0) return null;

  const piece = {
    id: nextPieceId,
    owner,
    type
  };
  nextPieceId += 1;
  board[row][col] = piece;
  renderBoard({ animateId: piece.id });
  return { row, col, piece };
}

function countsFor(piece, owner) {
  if (!piece) return false;
  if (piece.type === TYPES.NORMAL) return piece.owner === owner;
  if (piece.type === TYPES.WILD) return piece.owner === owner;
  return false;
}

function findWinningLine(sourceBoard, owner) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      for (const [rowStep, colStep] of directions) {
        const cells = [];
        let valid = true;
        for (let index = 0; index < 4; index += 1) {
          const nextRow = row + rowStep * index;
          const nextCol = col + colStep * index;
          if (
            nextRow < 0 || nextRow >= ROWS ||
            nextCol < 0 || nextCol >= COLS ||
            !countsFor(sourceBoard[nextRow][nextCol], owner)
          ) {
            valid = false;
            break;
          }
          cells.push({ row: nextRow, col: nextCol });
        }
        if (valid) return cells;
      }
    }
  }
  return null;
}

function cloneBoard(sourceBoard = board) {
  return sourceBoard.map(row => row.map(piece => piece ? { ...piece } : null));
}

function applyGravity(targetBoard = board) {
  for (let col = 0; col < COLS; col += 1) {
    const pieces = [];
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      if (targetBoard[row][col]) pieces.push(targetBoard[row][col]);
      targetBoard[row][col] = null;
    }
    pieces.forEach((piece, index) => {
      targetBoard[ROWS - 1 - index][col] = piece;
    });
  }
  return targetBoard;
}

function rotateBoardData(sourceBoard = board) {
  const rotated = emptyBoard();
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      rotated[ROWS - 1 - row][COLS - 1 - col] = sourceBoard[row][col];
    }
  }
  return applyGravity(rotated);
}

async function animateBoardRotation() {
  flashScreen("rgba(0, 142, 184, 0.22)");
  boardStage.classList.add("is-spinning");
  await wait(440);
  board = rotateBoardData(board);
  renderBoard();
  await wait(510);
  boardStage.classList.remove("is-spinning");
  showToast("La ficha azul giró y reordenó el tablero.");
}

function removePiece(row, col) {
  board[row][col] = null;
  applyGravity(board);
  renderBoard();
  flashScreen("rgba(214, 39, 22, 0.2)");
  shakeScreen();
}

function hasAnyPieces(owner) {
  return board.some(row => row.some(piece => piece && piece.owner === owner));
}

function handleSlotClick(row, col) {
  if (targetMode) {
    handleHumanBombTarget(row, col);
    return;
  }
  handleHumanColumn(col);
}

async function handleHumanColumn(col) {
  if (inputLocked || targetMode || gameOver || turn !== HUMAN) return;
  if (findOpenRow(board, col) < 0) {
    showToast("Esa columna está llena.");
    return;
  }

  inputLocked = true;
  updateTurnUI();
  const placement = placePiece(HUMAN, currentType, col);
  if (!placement) return;
  await wait(560);

  if (currentType === TYPES.BOMB) {
    if (hasAnyPieces(AI)) {
      targetMode = true;
      inputLocked = false;
      renderBoard();
      updateTurnUI();
      showToast("Elige una ficha naranjo para eliminar.", 2800);
      return;
    }
    showToast("No hay fichas naranjo para eliminar.");
  }

  if (currentType === TYPES.SPIN) {
    await animateBoardRotation();
  }

  await resolveTurn(HUMAN);
}

async function handleHumanBombTarget(row, col) {
  if (inputLocked || !targetMode || gameOver) return;
  const target = board[row][col];
  if (!target || target.owner !== AI) {
    showToast("Debes elegir una ficha del sitio.");
    return;
  }

  inputLocked = true;
  targetMode = false;
  removePiece(row, col);
  showToast("Eliminaste una ficha naranjo.");
  await wait(520);
  await resolveTurn(HUMAN);
}

async function startTurn(owner) {
  if (gameOver) return;

  if (validColumns().length === 0) {
    finishGame(null);
    return;
  }

  turn = owner;
  currentType = randomType();
  inputLocked = owner !== HUMAN;
  targetMode = false;
  updateTurnUI();
  renderBoard();

  if (owner === AI) {
    await wait(860);
    await playAITurn();
  }
}

async function resolveTurn(activeOwner) {
  const activeWin = findWinningLine(board, activeOwner);
  if (activeWin) {
    winningCells = activeWin;
    renderBoard();
    finishGame(activeOwner);
    return;
  }

  const otherOwner = activeOwner === HUMAN ? AI : HUMAN;
  const otherWin = findWinningLine(board, otherOwner);
  if (otherWin) {
    winningCells = otherWin;
    renderBoard();
    finishGame(otherOwner);
    return;
  }

  if (validColumns().length === 0) {
    finishGame(null);
    return;
  }

  await startTurn(otherOwner);
}

function simulateDrop(sourceBoard, owner, type, col) {
  const simulated = cloneBoard(sourceBoard);
  const row = findOpenRow(simulated, col);
  if (row < 0) return null;
  simulated[row][col] = { id: -1, owner, type };
  return simulated;
}

function linePotential(sourceBoard, owner) {
  let score = 0;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      for (const [rowStep, colStep] of directions) {
        const windowCells = [];
        for (let index = 0; index < 4; index += 1) {
          const nextRow = row + rowStep * index;
          const nextCol = col + colStep * index;
          if (nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLS) {
            windowCells.length = 0;
            break;
          }
          windowCells.push(sourceBoard[nextRow][nextCol]);
        }
        if (windowCells.length !== 4) continue;

        const mine = windowCells.filter(piece => countsFor(piece, owner)).length;
        const opponent = windowCells.filter(piece => countsFor(piece, owner === HUMAN ? AI : HUMAN)).length;
        const blockers = windowCells.filter(piece => piece && piece.type !== TYPES.NORMAL && piece.type !== TYPES.WILD).length;
        const empty = windowCells.filter(piece => !piece).length;

        if (opponent === 0 && blockers === 0) {
          if (mine === 3 && empty === 1) score += 90;
          else if (mine === 2 && empty === 2) score += 14;
          else if (mine === 1 && empty === 3) score += 2;
        }
      }
    }
  }

  return score;
}

function immediateWinningColumns(sourceBoard, owner) {
  return validColumns(sourceBoard).filter(col => {
    const simulated = simulateDrop(sourceBoard, owner, TYPES.NORMAL, col);
    return simulated && findWinningLine(simulated, owner);
  });
}

function chooseAIColumn(type) {
  const valid = validColumns();
  if (!valid.length) return -1;

  if (type === TYPES.NORMAL || type === TYPES.WILD) {
    for (const col of valid) {
      const simulated = simulateDrop(board, AI, type, col);
      if (simulated && findWinningLine(simulated, AI)) return col;
    }
  }

  const humanThreats = immediateWinningColumns(board, HUMAN);
  if (humanThreats.length) {
    const availableThreat = humanThreats.find(col => valid.includes(col));
    if (availableThreat !== undefined) return availableThreat;
  }

  let bestScore = -Infinity;
  let bestColumns = [];

  for (const col of valid) {
    let simulated = simulateDrop(board, AI, type, col);
    if (!simulated) continue;

    if (type === TYPES.SPIN) {
      simulated = rotateBoardData(simulated);
    }

    let score = linePotential(simulated, AI) - linePotential(simulated, HUMAN) * 0.92;
    score += 12 - Math.abs(3 - col) * 2.4;
    score += Math.random() * 4;

    if (score > bestScore + 0.01) {
      bestScore = score;
      bestColumns = [col];
    } else if (Math.abs(score - bestScore) < 0.01) {
      bestColumns.push(col);
    }
  }

  return bestColumns[Math.floor(Math.random() * bestColumns.length)] ?? valid[0];
}

function chooseBombTargetForAI() {
  const candidates = [];
  const baseThreat = linePotential(board, HUMAN);

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.owner !== HUMAN) continue;

      const simulated = cloneBoard(board);
      simulated[row][col] = null;
      applyGravity(simulated);
      const reduction = baseThreat - linePotential(simulated, HUMAN);
      const centerBonus = 3 - Math.abs(3 - col);
      const heightBonus = row * 0.18;
      candidates.push({ row, col, score: reduction * 1.5 + centerBonus + heightBonus + Math.random() });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

async function playAITurn() {
  if (gameOver || turn !== AI) return;

  const col = chooseAIColumn(currentType);
  if (col < 0) {
    finishGame(null);
    return;
  }

  const placement = placePiece(AI, currentType, col);
  await wait(620);

  if (currentType === TYPES.BOMB) {
    const target = chooseBombTargetForAI();
    if (target) {
      removePiece(target.row, target.col);
      showToast("El sitio eliminó una de tus fichas.");
      await wait(560);
    } else {
      showToast("No tienes fichas que el sitio pueda eliminar.");
    }
  }

  if (currentType === TYPES.SPIN) {
    await animateBoardRotation();
  }

  await resolveTurn(AI);
}

function finishGame(winner) {
  gameOver = true;
  inputLocked = true;
  targetMode = false;
  updateColumnButtons();

  if (winner === HUMAN) {
    scores.human += 1;
    resultTitle.textContent = "¡Ganaste!";
    resultCopy.textContent = "Conectaste cuatro fichas moradas y verdes antes que el sitio.";
    resultDisc.style.background = "#b296d8";
    flashScreen("rgba(123, 56, 209, 0.2)");
  } else if (winner === AI) {
    scores.ai += 1;
    resultTitle.textContent = "Ganó el sitio";
    resultCopy.textContent = "El sitio logró conectar cuatro fichas naranjo y verdes.";
    resultDisc.style.background = "#f1954e";
    flashScreen("rgba(255, 138, 42, 0.2)");
  } else {
    resultTitle.textContent = "Tablero completo";
    resultCopy.textContent = "No quedan columnas disponibles. La partida terminó en empate.";
    resultDisc.style.background = "#008eb8";
  }

  humanScoreEl.textContent = String(scores.human);
  aiScoreEl.textContent = String(scores.ai);

  window.setTimeout(() => {
    if (typeof resultModal.showModal === "function") resultModal.showModal();
    else resultModal.setAttribute("open", "");
  }, 720);
}

function resetBoard({ resetScores = false } = {}) {
  if (resetScores) {
    scores = { human: 0, ai: 0 };
    humanScoreEl.textContent = "0";
    aiScoreEl.textContent = "0";
  }

  board = emptyBoard();
  turn = HUMAN;
  currentType = TYPES.NORMAL;
  inputLocked = true;
  targetMode = false;
  gameOver = false;
  winningCells = [];
  boardStage.classList.remove("is-spinning");
  renderBoard();
  startTurn(HUMAN);
}

function closeResultModal() {
  if (resultModal.open && typeof resultModal.close === "function") resultModal.close();
  else resultModal.removeAttribute("open");
}

document.getElementById("play-again").addEventListener("click", () => {
  closeResultModal();
  resetBoard();
});

document.getElementById("close-result").addEventListener("click", closeResultModal);

document.getElementById("new-game-top").addEventListener("click", () => {
  closeResultModal();
  resetBoard({ resetScores: true });
  showToast("Marcador y tablero reiniciados.");
});

resultModal.addEventListener("cancel", event => {
  event.preventDefault();
  closeResultModal();
});

createBoardDOM();
resetBoard();
