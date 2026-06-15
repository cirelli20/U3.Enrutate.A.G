(() => {
  'use strict';

  const scene = document.getElementById('scene');
  const intro = document.getElementById('intro');
  const pawnButton = document.getElementById('pawnButton');
  const routeStage = document.getElementById('routeStage');
  const nutRing = document.getElementById('nutRing');
  const orbitLine = routeStage.querySelector('.orbit-line');
  const routeInstruction = document.getElementById('routeInstruction');
  const outro = document.getElementById('outro');
  const restartButton = document.getElementById('restartButton');
  const hudSteps = [...document.querySelectorAll('.hud-step')];

  const blueGame = document.getElementById('blueGame');
  const blueOrbitWheel = document.getElementById('blueOrbitWheel');
  const blueBreakPiece = document.getElementById('blueBreakPiece');
  const blueGameInstruction = document.getElementById('blueGameInstruction');
  const blueCounter = document.getElementById('blueCounter');
  const blueFragments = [...document.querySelectorAll('.blue-fragment')];

  const TOTAL_PIECES = 12;
  const PHASES = ['red', 'blue', 'green'];
  const targetIndexes = { green: 7 };
  const instructions = {
    red: 'HAZ CLIC EN UNA PIEZA NEGRA',
    blue: 'HAZ CLIC EN UNA PIEZA NEGRA',
    green: 'HAZ CLIC EN LA PIEZA VERDE'
  };

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

  let phaseIndex = 0;
  let locked = false;
  let pieces = [];
  let blueGameState = 'idle';
  let removedBlueFragments = 0;
  let fragmentBusy = false;

  const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  function currentPhase() {
    return PHASES[phaseIndex];
  }

  function createPieces() {
    nutRing.innerHTML = '';
    pieces = [];

    for (let index = 0; index < TOTAL_PIECES; index += 1) {
      const piece = document.createElement('button');
      piece.type = 'button';
      piece.className = 'ring-piece';
      piece.setAttribute('aria-label', `Pieza ${index + 1}`);
      piece.innerHTML = '<svg viewBox="0 0 64.45 74.09" aria-hidden="true"><use href="#icon-nut"></use></svg>';

      const angle = (index / TOTAL_PIECES) * Math.PI * 2 - Math.PI / 2;
      const rotation = (angle * 180 / Math.PI) + 90;

      piece.dataset.angle = String(angle);
      piece.style.setProperty('--piece-rotation', `${rotation}deg`);
      piece.style.setProperty('--piece-delay', `${index * 45}ms`);
      piece.addEventListener('click', () => handlePieceClick(piece, index));

      nutRing.appendChild(piece);
      pieces.push(piece);
    }
  }

  function positionPieces() {
    if (!pieces.length) return;

    const pieceRadius = (pieces[0].offsetWidth || 80) * 0.72;
    const isMobile = window.innerWidth <= 760;
    const gapX = isMobile ? 8 : 14;
    const gapY = isMobile ? 30 : 14;
    const radiusX = orbitLine.offsetWidth / 2 + pieceRadius + gapX;
    const radiusY = orbitLine.offsetHeight / 2 + pieceRadius + gapY;

    pieces.forEach(piece => {
      const angle = Number(piece.dataset.angle);
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      piece.style.left = `calc(50% + ${x}px)`;
      piece.style.top = `calc(50% + ${y}px)`;
    });
  }

  function updateHud() {
    hudSteps.forEach((step, index) => {
      step.classList.toggle('is-active', index === phaseIndex);
      step.classList.toggle('is-complete', index < phaseIndex);
    });
  }

  function configurePhase() {
    const phase = currentPhase();
    routeStage.dataset.phase = phase;
    routeInstruction.textContent = instructions[phase];

    pieces.forEach(piece => {
      piece.className = 'ring-piece';
      piece.disabled = true;
    });

    if (phase === 'red' || phase === 'blue') {
      pieces.forEach(piece => {
        piece.disabled = false;
      });
    } else {
      const target = pieces[targetIndexes.green];
      target.disabled = false;
      target.classList.add('is-green', 'is-target');
    }

    updateHud();
  }

  function resetBlueGame() {
    blueGameState = 'idle';
    removedBlueFragments = 0;
    fragmentBusy = false;
    blueGame.className = 'blue-game';
    blueGame.setAttribute('aria-hidden', 'true');
    blueOrbitWheel.disabled = false;
    blueBreakPiece.disabled = true;
    blueBreakPiece.classList.remove('is-hit');
    blueGameInstruction.textContent = 'HAZ CLIC PARA UNIR LAS PIEZAS';
    blueCounter.textContent = '';

    blueFragments.forEach((fragment, index) => {
      fragment.classList.remove('is-gone');
      fragment.style.setProperty('--fragment-x', fragmentMotion[index][0]);
      fragment.style.setProperty('--fragment-y', fragmentMotion[index][1]);
      fragment.style.setProperty('--fragment-rotate', fragmentMotion[index][2]);
    });
  }

  function showRoute() {
    scene.className = 'scene';
    resetBlueGame();
    outro.classList.remove('is-visible');
    outro.setAttribute('aria-hidden', 'true');
    routeStage.classList.remove('is-visible');

    createPieces();
    positionPieces();
    configurePhase();

    requestAnimationFrame(() => {
      routeStage.classList.add('is-visible');
      routeStage.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => {
        pieces.forEach(piece => piece.classList.add('is-ready'));
      });
    });
  }

  async function beginExperience() {
    if (locked) return;
    locked = true;

    intro.classList.add('is-hidden');
    await wait(650);
    intro.setAttribute('aria-hidden', 'true');
    showRoute();

    await wait(1150);
    locked = false;
  }

  async function colourAllPiecesBlue(selectedPiece) {
    selectedPiece.classList.add('is-blue');

    const remaining = pieces.filter(piece => piece !== selectedPiece);
    for (const piece of remaining) {
      await wait(45);
      piece.classList.add('is-blue');
    }

    await wait(280);
  }

  async function startBlueGame() {
    routeStage.classList.remove('is-visible');
    routeStage.setAttribute('aria-hidden', 'true');
    scene.classList.add('is-transitioning', 'is-blue-game');

    resetBlueGame();
    blueGameState = 'orbit';
    blueGame.classList.add('is-visible', 'is-orbiting');
    blueGame.setAttribute('aria-hidden', 'false');
    blueGameInstruction.textContent = 'HAZ CLIC EN LAS PIEZAS PARA UNIRLAS';
    blueCounter.textContent = 'LAS PIEZAS ESTÁN GIRANDO';

    await wait(500);
    locked = false;
  }

  async function mergeBluePieces() {
    if (blueGameState !== 'orbit') return;

    blueGameState = 'merging';
    locked = true;
    blueOrbitWheel.disabled = true;
    blueGame.classList.remove('is-orbiting');
    blueGame.classList.add('is-merging');
    blueGameInstruction.textContent = 'LAS PIEZAS SE ESTÁN UNIENDO';
    blueCounter.textContent = '';

    await wait(880);

    blueGame.classList.add('is-piece-ready');
    blueBreakPiece.disabled = false;
    blueGameInstruction.textContent = 'HAZ CLIC EN LA PIEZA PARA DESARMARLA';
    blueCounter.textContent = `${blueFragments.length} FRAGMENTOS RESTANTES`;
    blueGameState = 'breaking';
    locked = false;
  }

  async function removeBlueFragment() {
    if (blueGameState !== 'breaking' || fragmentBusy) return;

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

    blueGameState = 'complete';
    blueGame.classList.add('is-complete');
    blueGameInstruction.textContent = 'RUTA AZUL COMPLETADA';
    blueCounter.textContent = '';
    blueBreakPiece.disabled = true;

    await wait(760);

    scene.classList.remove('is-blue-game', 'is-transitioning');
    blueGame.className = 'blue-game';
    blueGame.setAttribute('aria-hidden', 'true');
    phaseIndex = 2;
    showRoute();
    await wait(1150);
    locked = false;
    fragmentBusy = false;
  }

  async function handlePieceClick(piece, index) {
    if (locked || !routeStage.classList.contains('is-visible')) return;

    const phase = currentPhase();
    if (phase === 'green' && index !== targetIndexes.green) return;

    locked = true;
    pieces.forEach(item => {
      item.disabled = true;
      item.classList.remove('is-target');
    });

    if (phase === 'red') {
      piece.classList.add('is-red');
      await wait(260);
      await playTransition('red', 3900);
      phaseIndex = 1;
      showRoute();
      await wait(1150);
      locked = false;
      return;
    }

    if (phase === 'blue') {
      await colourAllPiecesBlue(piece);
      await startBlueGame();
      return;
    }

    await playTransition('green', 3900);
    routeStage.classList.remove('is-visible');
    routeStage.setAttribute('aria-hidden', 'true');
    hudSteps.forEach(step => {
      step.classList.remove('is-active');
      step.classList.add('is-complete');
    });
    outro.classList.add('is-visible');
    outro.setAttribute('aria-hidden', 'false');
    locked = false;
  }

  async function playTransition(type, duration) {
    routeStage.classList.remove('is-visible');
    routeStage.setAttribute('aria-hidden', 'true');
    scene.classList.add('is-transitioning', `is-${type}-transition`);
    await wait(duration);
    scene.classList.remove(`is-${type}-transition`, 'is-transitioning');
  }

  function resetExperience() {
    locked = false;
    phaseIndex = 0;
    scene.className = 'scene';
    routeStage.classList.remove('is-visible');
    routeStage.setAttribute('aria-hidden', 'true');
    outro.classList.remove('is-visible');
    outro.setAttribute('aria-hidden', 'true');
    intro.classList.remove('is-hidden');
    intro.setAttribute('aria-hidden', 'false');
    resetBlueGame();
    updateHud();
  }

  pawnButton.addEventListener('click', beginExperience);
  restartButton.addEventListener('click', resetExperience);
  blueOrbitWheel.addEventListener('click', mergeBluePieces);
  blueBreakPiece.addEventListener('click', removeBlueFragment);

  window.addEventListener('resize', positionPieces);

  resetBlueGame();
  updateHud();
})();
