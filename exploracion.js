(() => {
  'use strict';

  const scene = document.getElementById('scene');
  const intro = document.getElementById('intro');
  const pawnButton = document.getElementById('pawnButton');
  const routeStage = document.getElementById('routeStage');
  const orbitLine = document.getElementById('orbitLine');
  const nutRing = document.getElementById('nutRing');
  const scorePanel = document.getElementById('scorePanel');
  const scoreText = document.getElementById('scoreText');
  const scoreSlots = [...document.querySelectorAll('.score-slot')];

  const redTransition = document.getElementById('redTransition');
  const blueGame = document.getElementById('blueGame');
  const blueWheel = document.getElementById('blueWheel');
  const blueBreakPiece = document.getElementById('blueBreakPiece');
  const blueInstruction = document.getElementById('blueInstruction');
  const blueCounter = document.getElementById('blueCounter');
  const blueFragments = [...document.querySelectorAll('.blue-fragment')];
  const greenFeedback = document.getElementById('greenFeedback');
  const winTransition = document.getElementById('winTransition');
  const restartButton = document.getElementById('restartButton');

  const PIECE_TYPES = [
    'red', 'green', 'blue', 'red',
    'blue', 'green', 'red', 'blue',
    'green', 'red', 'blue', 'green'
  ];

  const fragmentOrder = [1, 5, 3, 7, 0, 4, 2, 6];
  const fragmentMotion = [
    ['18px', '-34px', '32deg'],
    ['34px', '-8px', '48deg'],
    ['28px', '24px', '54deg'],
    ['4px', '36px', '38deg'],
    ['-24px', '30px', '-42deg'],
    ['-36px', '4px', '-52deg'],
    ['-28px', '-26px', '-35deg'],
    ['-2px', '-38px', '40deg']
  ];

  let pieces = [];
  let started = false;
  let locked = false;
  let score = 0;
  let blueState = 'idle';
  let removedBlueFragments = 0;
  let fragmentBusy = false;

  const wait = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));

  function initCustomCursor() {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');

    if (!dot || !ring || window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('pointermove', event => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      dot.classList.add('is-visible');
      ring.classList.add('is-visible');
    });

    document.addEventListener('pointerover', event => {
      if (event.target.closest('button, a')) ring.classList.add('is-hovering');
    });

    document.addEventListener('pointerout', event => {
      if (event.target.closest('button, a')) ring.classList.remove('is-hovering');
    });

    const follow = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      window.requestAnimationFrame(follow);
    };

    follow();
  }

  function createPieces() {
    nutRing.innerHTML = '';
    pieces = [];

    PIECE_TYPES.forEach((type, index) => {
      const piece = document.createElement('button');
      const angle = (index / PIECE_TYPES.length) * Math.PI * 2 - Math.PI / 2;
      const rotation = (angle * 180 / Math.PI) + 90;

      piece.type = 'button';
      piece.className = `ring-piece type-${type}`;
      piece.dataset.type = type;
      piece.dataset.index = String(index);
      piece.dataset.angle = String(angle);
      piece.setAttribute('aria-label', `Tuerca ${index + 1}. Su color se descubre al pasar el cursor.`);
      piece.style.setProperty('--piece-rotation', `${rotation}deg`);
      piece.style.setProperty('--piece-delay', `${index * 42}ms`);
      piece.innerHTML = '<svg viewBox="0 0 64.45 74.09" aria-hidden="true"><use href="#icon-nut"></use></svg>';
      piece.addEventListener('click', () => handlePieceClick(piece));

      nutRing.appendChild(piece);
      pieces.push(piece);
    });
  }

  function positionPieces() {
    if (!pieces.length) return;

    const pieceRadius = (pieces[0].offsetWidth || 80) * 0.7;
    const mobile = window.innerWidth <= 760;
    const radiusX = orbitLine.offsetWidth / 2 + pieceRadius + (mobile ? 8 : 14);
    const radiusY = orbitLine.offsetHeight / 2 + pieceRadius + (mobile ? 30 : 14);

    pieces.forEach(piece => {
      const angle = Number(piece.dataset.angle);
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      piece.style.left = `calc(50% + ${x}px)`;
      piece.style.top = `calc(50% + ${y}px)`;
    });
  }

  function revealPieces() {
    window.requestAnimationFrame(() => {
      routeStage.classList.add('is-visible');
      routeStage.setAttribute('aria-hidden', 'false');
      scorePanel.classList.add('is-visible');

      window.requestAnimationFrame(() => {
        pieces.forEach(piece => piece.classList.add('is-ready'));
      });
    });
  }

  async function beginExperience() {
    if (started || locked) return;

    started = true;
    locked = true;
    intro.classList.add('is-hidden');
    await wait(620);
    intro.setAttribute('aria-hidden', 'true');
    revealPieces();
    await wait(1050);
    locked = false;
  }

  function muteRoute() {
    routeStage.classList.add('is-muted');
    pieces.forEach(piece => { piece.disabled = true; });
  }

  function restoreRoute() {
    routeStage.classList.remove('is-muted');
    pieces.forEach(piece => {
      piece.disabled = piece.classList.contains('is-collected');
    });
  }

  async function playRedTransition() {
    muteRoute();
    redTransition.classList.add('is-visible');
    redTransition.setAttribute('aria-hidden', 'false');

    await wait(2850);

    redTransition.classList.remove('is-visible');
    redTransition.setAttribute('aria-hidden', 'true');
    restoreRoute();
    locked = false;
  }

  function resetBlueGame() {
    blueState = 'idle';
    removedBlueFragments = 0;
    fragmentBusy = false;
    blueGame.className = 'blue-game';
    blueGame.setAttribute('aria-hidden', 'true');
    blueWheel.disabled = false;
    blueBreakPiece.disabled = true;
    blueBreakPiece.classList.remove('is-hit');
    blueInstruction.textContent = 'HAZ CLIC PARA UNIR LAS PIEZAS';
    blueCounter.textContent = '';

    blueFragments.forEach((fragment, index) => {
      fragment.classList.remove('is-gone');
      fragment.style.setProperty('--fragment-x', fragmentMotion[index][0]);
      fragment.style.setProperty('--fragment-y', fragmentMotion[index][1]);
      fragment.style.setProperty('--fragment-rotate', fragmentMotion[index][2]);
    });
  }

  async function startBlueGame() {
    muteRoute();
    resetBlueGame();
    blueState = 'orbit';
    blueGame.classList.add('is-visible', 'is-orbiting');
    blueGame.setAttribute('aria-hidden', 'false');
    blueInstruction.textContent = 'HAZ CLIC EN LAS PIEZAS PARA UNIRLAS';
    blueCounter.textContent = 'LAS PIEZAS ESTÁN GIRANDO';

    await wait(450);
    locked = false;
  }

  async function mergeBluePieces() {
    if (blueState !== 'orbit' || locked) return;

    locked = true;
    blueState = 'merging';
    blueWheel.disabled = true;
    blueGame.classList.remove('is-orbiting');
    blueGame.classList.add('is-merging');
    blueInstruction.textContent = 'LAS PIEZAS SE ESTÁN UNIENDO';
    blueCounter.textContent = '';

    await wait(880);

    blueGame.classList.add('is-piece-ready');
    blueBreakPiece.disabled = false;
    blueInstruction.textContent = 'HAZ CLIC EN LA PIEZA PARA DESARMARLA';
    blueCounter.textContent = `${blueFragments.length} FRAGMENTOS RESTANTES`;
    blueState = 'breaking';
    locked = false;
  }

  async function removeBlueFragment() {
    if (blueState !== 'breaking' || fragmentBusy) return;

    fragmentBusy = true;
    const fragmentIndex = fragmentOrder[removedBlueFragments];
    const fragment = blueFragments[fragmentIndex];

    fragment.classList.add('is-gone');
    blueBreakPiece.classList.remove('is-hit');
    void blueBreakPiece.offsetWidth;
    blueBreakPiece.classList.add('is-hit');

    removedBlueFragments += 1;
    const remaining = blueFragments.length - removedBlueFragments;
    blueCounter.textContent = remaining === 1
      ? '1 FRAGMENTO RESTANTE'
      : `${remaining} FRAGMENTOS RESTANTES`;

    await wait(420);
    blueBreakPiece.classList.remove('is-hit');

    if (remaining > 0) {
      fragmentBusy = false;
      return;
    }

    blueState = 'complete';
    blueGame.classList.add('is-complete');
    blueInstruction.textContent = 'RUTA AZUL COMPLETADA';
    blueCounter.textContent = '';
    blueBreakPiece.disabled = true;

    await wait(760);

    resetBlueGame();
    restoreRoute();
    locked = false;
    fragmentBusy = false;
  }

  function updateScore() {
    scoreText.textContent = `${score}/3`;
    scoreSlots.forEach((slot, index) => {
      slot.classList.toggle('is-filled', index < score);
    });
  }

  function animatePointToScore(piece, slotIndex) {
    const source = piece.getBoundingClientRect();
    const target = scoreSlots[slotIndex].getBoundingClientRect();
    const token = document.createElement('span');

    token.className = 'flying-point';
    token.textContent = '+1';
    token.style.left = `${source.left + source.width / 2 - 17}px`;
    token.style.top = `${source.top + source.height / 2 - 17}px`;
    document.body.appendChild(token);

    const deltaX = target.left + target.width / 2 - (source.left + source.width / 2);
    const deltaY = target.top + target.height / 2 - (source.top + source.height / 2);

    const animation = token.animate([
      { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
      { transform: `translate(${deltaX * .52}px, ${deltaY * .35 - 75}px) scale(1.22) rotate(120deg)`, opacity: 1, offset: .55 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(.55) rotate(250deg)`, opacity: .2 }
    ], {
      duration: 820,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'forwards'
    });

    animation.addEventListener('finish', () => token.remove());
  }

  async function collectGreenPoint(piece) {
    const slotIndex = score;
    piece.classList.add('is-collected');
    piece.disabled = true;
    animatePointToScore(piece, slotIndex);

    score += 1;
    muteRoute();

    greenFeedback.classList.add('is-visible');
    greenFeedback.setAttribute('aria-hidden', 'false');
    await wait(650);
    updateScore();
    await wait(500);
    greenFeedback.classList.remove('is-visible');
    greenFeedback.setAttribute('aria-hidden', 'true');

    if (score >= 3) {
      await playWinTransition();
      return;
    }

    restoreRoute();
    locked = false;
  }

  async function playWinTransition() {
    scorePanel.classList.remove('is-visible');
    routeStage.classList.remove('is-visible');
    routeStage.setAttribute('aria-hidden', 'true');
    winTransition.classList.add('is-visible');
    winTransition.setAttribute('aria-hidden', 'false');
    locked = false;
  }

  async function handlePieceClick(piece) {
    if (locked || !routeStage.classList.contains('is-visible') || piece.disabled) return;

    locked = true;
    const type = piece.dataset.type;

    if (type === 'red') {
      await playRedTransition();
      return;
    }

    if (type === 'blue') {
      await startBlueGame();
      return;
    }

    await collectGreenPoint(piece);
  }

  function resetExperience() {
    locked = false;
    started = false;
    score = 0;
    updateScore();
    resetBlueGame();

    redTransition.classList.remove('is-visible');
    greenFeedback.classList.remove('is-visible');
    winTransition.classList.remove('is-visible');
    winTransition.setAttribute('aria-hidden', 'true');
    scorePanel.classList.remove('is-visible');

    routeStage.className = 'route-stage';
    routeStage.setAttribute('aria-hidden', 'true');
    intro.classList.remove('is-hidden');
    intro.setAttribute('aria-hidden', 'false');

    createPieces();
    positionPieces();
  }

  pawnButton.addEventListener('click', beginExperience);
  blueWheel.addEventListener('click', mergeBluePieces);
  blueBreakPiece.addEventListener('click', removeBlueFragment);
  restartButton.addEventListener('click', resetExperience);
  window.addEventListener('resize', positionPieces);

  initCustomCursor();
  createPieces();
  positionPieces();
  resetBlueGame();
  updateScore();
})();
