(() => {
  'use strict';

  const experience = document.getElementById('experience');
  const scene = document.getElementById('scene');
  const intro = document.getElementById('intro');
  const introCopy = document.getElementById('introCopy');
  const introScroll = document.querySelector('.intro-scroll');
  const backgroundPattern = document.querySelector('.background-pattern');
  const pawn3d = document.getElementById('pawn3d');
  const pawnCanvas = document.getElementById('pawnCanvas');
  const routeStage = document.getElementById('routeStage');
  const nutRing = document.getElementById('nutRing');
  const scorePanel = document.getElementById('scorePanel');
  const scoreText = document.getElementById('scoreText');
  const scoreSlots = [...document.querySelectorAll('.score-slot')];

  const redTransition = document.getElementById('redTransition');
  const redGame = document.getElementById('redGame');
  const redMaze = document.getElementById('redMaze');
  const redMazeLines = document.getElementById('redMazeLines');
  const redObstacleLayer = document.getElementById('redObstacleLayer');
  const redTraceGlow = document.getElementById('redTraceGlow');
  const redTracePath = document.getElementById('redTracePath');
  const redStartMarker = document.getElementById('redStartMarker');
  const redGoalMarker = document.getElementById('redGoalMarker');
  const redGameStatus = document.getElementById('redGameStatus');
  const blueGame = document.getElementById('blueGame');
  const blueWheel = document.getElementById('blueWheel');
  const blueBreakPiece = document.getElementById('blueBreakPiece');
  const blueInstruction = document.getElementById('blueInstruction');
  const blueCounter = document.getElementById('blueCounter');
  const blueAlignStage = document.getElementById('blueAlignStage');
  const blueAlignBoard = document.getElementById('blueAlignBoard');
  const blueFragments = [...document.querySelectorAll('.blue-fragment')];
  const greenFeedback = document.getElementById('greenFeedback');
  const winTransition = document.getElementById('winTransition');
  const restartButton = document.getElementById('restartButton');

  const PIECE_TYPES = [
    'red', 'green', 'blue', 'red',
    'blue', 'green', 'red', 'blue',
    'green', 'red', 'blue', 'red'
  ];

  // Las tuercas forman un recorrido abierto, no una órbita circular.
  const DESKTOP_LAYOUT = [
    [10, 23, -16], [27, 16, 8], [45, 27, -8], [64, 16, 12],
    [84, 25, -14], [91, 49, 17], [74, 61, -7], [56, 49, 11],
    [39, 66, -15], [17, 57, 13], [28, 82, -8], [68, 81, 10]
  ];

  const MOBILE_LAYOUT = [
    [15, 20, -12], [50, 15, 8], [84, 22, -8], [68, 36, 12],
    [28, 37, -12], [11, 53, 15], [48, 51, -7], [86, 54, 10],
    [70, 69, -13], [31, 70, 12], [13, 84, -7], [52, 84, 9]
  ];

  const fragmentOrder = [0, 1, 2, 3];
  const fragmentMotion = [
    ['0px', '-42px', '24deg'],
    ['42px', '0px', '36deg'],
    ['0px', '42px', '-24deg'],
    ['-42px', '0px', '-36deg']
  ];

  const RED_OBSTACLES = [
    { x: 5, y: 8, size: 20, rotation: -12 },
    { x: 23, y: 15, size: 10, rotation: 9 },
    { x: 39, y: 7, size: 9, rotation: -8 },
    { x: 55, y: 14, size: 12, rotation: 14 },
    { x: 72, y: 8, size: 10, rotation: -11 },
    { x: 94, y: 9, size: 20, rotation: 10 },
    { x: 7, y: 91, size: 20, rotation: 8 },
    { x: 26, y: 83, size: 11, rotation: -10 },
    { x: 43, y: 93, size: 12, rotation: 12 },
    { x: 61, y: 83, size: 10, rotation: -14 },
    { x: 79, y: 92, size: 13, rotation: 9 },
    { x: 97, y: 88, size: 20, rotation: -8 },
    { x: 19, y: 39, size: 8, rotation: 12 },
    { x: 35, y: 61, size: 9, rotation: -10 },
    { x: 51, y: 38, size: 10, rotation: 8 },
    { x: 67, y: 61, size: 9, rotation: -12 },
    { x: 83, y: 39, size: 8, rotation: 10 }
  ];

  let pieces = [];
  let started = false;
  let locked = false;
  let score = 0;
  let blueState = 'idle';
  let removedBlueFragments = 0;
  let fragmentBusy = false;
  let activeBlueSourcePiece = null;
  let activeRedSourcePiece = null;
  let redState = 'idle';
  let redDrawing = false;
  let redPointerId = null;
  let redPoints = [];
  let redPathLength = 0;
  let blueColumnRows = [];
  let blueColumnControls = [];
  let transitionRunning = false;
  let wheelIntent = 0;
  let touchStartY = null;
  let audioContext = null;

  const wait = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function smoothstep(start, end, value) {
    const progress = clamp((value - start) / (end - start));
    return progress * progress * (3 - 2 * progress);
  }

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

      const horizontal = ((event.clientX / window.innerWidth) - 0.5) * 2;
      const vertical = ((event.clientY / window.innerHeight) - 0.5) * 2;
      scene.style.setProperty('--pointer-x', `${horizontal * 18}px`);
      scene.style.setProperty('--pointer-y', `${vertical * 14}px`);
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

  function initPawn3D() {
    if (!pawn3d || !pawnCanvas || typeof window.THREE === 'undefined') return;

    try {
      const renderer = new THREE.WebGLRenderer({
        canvas: pawnCanvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;

      const pawnScene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
      camera.position.set(0, 0.05, 8.6);

      const pawn = new THREE.Group();
      pawn.rotation.set(-0.035, 0.34, 0);
      pawnScene.add(pawn);

      /*
       * La geometría reproduce el contorno del SVG inicio-09.svg.
       * Se extruye la silueta original para conservar la cabeza angular,
       * el cuerpo estrecho y la base amplia, añadiendo profundidad y bisel.
       */
      const centerX = 27.32;
      const centerY = 54.25;
      const px = value => value - centerX;
      const py = value => centerY - value;

      const pawnShape = new THREE.Shape();
      pawnShape.moveTo(px(13.33), py(21.37));
      pawnShape.lineTo(px(26.74), py(8.36));
      pawnShape.lineTo(px(40.52), py(21.37));
      pawnShape.lineTo(px(34.88), py(39.19));
      pawnShape.lineTo(px(54.63), py(93.87));
      pawnShape.lineTo(px(37.92), py(93.87));
      pawnShape.lineTo(px(37.92), py(97.72));
      pawnShape.bezierCurveTo(
        px(37.92), py(100.09),
        px(30.06), py(100.09),
        px(26.89), py(100.09)
      );
      pawnShape.bezierCurveTo(
        px(24.49), py(100.30),
        px(16.45), py(99.93),
        px(15.91), py(97.72)
      );
      pawnShape.lineTo(px(15.91), py(93.87));
      pawnShape.lineTo(px(-0.01), py(93.68));
      pawnShape.lineTo(px(17.98), py(39.19));
      pawnShape.lineTo(px(13.33), py(21.37));
      pawnShape.closePath();

      const geometry = new THREE.ExtrudeGeometry(pawnShape, {
        depth: 9,
        steps: 1,
        curveSegments: 22,
        bevelEnabled: true,
        bevelThickness: 1.7,
        bevelSize: 1.35,
        bevelOffset: 0,
        bevelSegments: 7
      });

      geometry.center();
      geometry.computeVertexNormals();

      const frontMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xcda3cc,
        roughness: 0.28,
        metalness: 0.04,
        clearcoat: 0.72,
        clearcoatRoughness: 0.22,
        side: THREE.DoubleSide
      });

      const sideMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x9f73a4,
        roughness: 0.34,
        metalness: 0.06,
        clearcoat: 0.42,
        clearcoatRoughness: 0.3,
        side: THREE.DoubleSide
      });

      const pawnMesh = new THREE.Mesh(geometry, [frontMaterial, sideMaterial]);
      pawnMesh.scale.setScalar(0.049);
      pawn.add(pawnMesh);

      const edgeGeometry = new THREE.EdgesGeometry(geometry, 24);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x7d5a83,
        transparent: true,
        opacity: 0.18
      });
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
      edges.scale.copy(pawnMesh.scale);
      pawn.add(edges);

      const ambient = new THREE.HemisphereLight(0xffffff, 0x6a4c71, 2.15);
      pawnScene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 4.7);
      keyLight.position.set(3.6, 5.2, 5.4);
      pawnScene.add(keyLight);

      const sideLight = new THREE.DirectionalLight(0x008eb8, 1.75);
      sideLight.position.set(-4.6, 0.6, 3.2);
      pawnScene.add(sideLight);

      const backLight = new THREE.DirectionalLight(0xffed00, 1.1);
      backLight.position.set(0, 1.5, -4);
      pawnScene.add(backLight);

      pawn3d.classList.add('has-webgl');

      const resizeRenderer = () => {
        const width = Math.max(1, pawn3d.clientWidth);
        const height = Math.max(1, pawn3d.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      let targetRotationX = -0.035;
      let targetRotationY = 0.34;

      pawn3d.addEventListener('pointermove', event => {
        const rect = pawn3d.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) - 0.5;
        const y = ((event.clientY - rect.top) / rect.height) - 0.5;
        targetRotationY = 0.34 + x * 0.34;
        targetRotationX = -0.035 + y * 0.15;
      });

      pawn3d.addEventListener('pointerleave', () => {
        targetRotationY = 0.34;
        targetRotationX = -0.035;
      });

      const renderPawn = time => {
        pawn.rotation.y += (targetRotationY - pawn.rotation.y) * 0.055;
        pawn.rotation.x += (targetRotationX - pawn.rotation.x) * 0.08;
        pawn.rotation.z = Math.sin(time * 0.00072) * 0.018;
        pawn.position.y = Math.sin(time * 0.00145) * 0.055;
        renderer.render(pawnScene, camera);
        window.requestAnimationFrame(renderPawn);
      };

      resizeRenderer();
      window.addEventListener('resize', resizeRenderer);
      window.requestAnimationFrame(renderPawn);
    } catch (error) {
      console.warn('No fue posible iniciar el peón 3D; se usará el SVG original.', error);
    }
  }

  function createPieces() {
    nutRing.innerHTML = '';
    pieces = [];

    PIECE_TYPES.forEach((type, index) => {
      const piece = document.createElement('button');

      piece.type = 'button';
      piece.className = `ring-piece type-${type}`;
      piece.dataset.type = type;
      piece.dataset.index = String(index);
      piece.setAttribute('aria-label', `Tuerca ${index + 1}. Su color se descubre al pasar el cursor.`);
      piece.style.setProperty('--piece-delay', `${index * 42}ms`);
      piece.style.setProperty('--float-delay', `${-index * 0.17}s`);
      piece.innerHTML = '<svg viewBox="0 0 64.45 74.09" aria-hidden="true"><use href="#icon-nut"></use></svg>';
      piece.addEventListener('click', () => handlePieceClick(piece));

      nutRing.appendChild(piece);
      pieces.push(piece);
    });
  }

  function positionPieces() {
    if (!pieces.length) return;

    const layout = window.innerWidth <= 760 ? MOBILE_LAYOUT : DESKTOP_LAYOUT;

    pieces.forEach((piece, index) => {
      const [left, top, rotation] = layout[index];
      piece.style.left = `${left}%`;
      piece.style.top = `${top}%`;
      piece.style.setProperty('--piece-rotation', `${rotation}deg`);
    });
  }

  function revealPieces() {
    scene.classList.add('route-active');
    routeStage.classList.remove('is-preview');
    routeStage.style.removeProperty('opacity');
    routeStage.style.removeProperty('transform');
    routeStage.classList.add('is-visible');
    routeStage.setAttribute('aria-hidden', 'false');
    scorePanel.classList.add('is-visible');

    window.requestAnimationFrame(() => {
      pieces.forEach(piece => piece.classList.add('is-ready'));
    });
  }

  async function beginExperience() {
    if (started || transitionRunning || locked) return;

    started = true;
    transitionRunning = true;
    locked = true;
    wheelIntent = 0;

    intro.setAttribute('aria-hidden', 'false');
    routeStage.setAttribute('aria-hidden', 'false');
    routeStage.classList.add('is-cinematic');
    scene.classList.add('journey-playing');

    // Las piezas aparecen durante la transición, no después de ella.
    await wait(520);
    pieces.forEach(piece => piece.classList.add('is-ready'));

    await wait(1580);

    intro.classList.add('is-hidden');
    intro.setAttribute('aria-hidden', 'true');
    routeStage.classList.remove('is-cinematic');
    routeStage.classList.add('is-visible');
    routeStage.setAttribute('aria-hidden', 'false');
    scene.classList.remove('journey-playing');
    scene.classList.add('route-active');
    scorePanel.classList.add('is-visible');

    transitionRunning = false;
    locked = false;
  }

  function handleWheelIntent(event) {
    if (started || transitionRunning) return;

    if (event.deltaY <= 0) {
      wheelIntent = Math.max(0, wheelIntent + event.deltaY * 0.15);
      return;
    }

    event.preventDefault();
    wheelIntent += Math.min(42, event.deltaY);

    if (wheelIntent >= 48) beginExperience();
  }

  function handleTouchStart(event) {
    if (started || transitionRunning || !event.touches.length) return;
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    if (started || transitionRunning || touchStartY === null || !event.touches.length) return;

    const distance = touchStartY - event.touches[0].clientY;
    if (distance > 34) {
      event.preventDefault();
      touchStartY = null;
      beginExperience();
    }
  }

  function handleKeyboardIntent(event) {
    if (started || transitionRunning) return;
    if (!['ArrowDown', 'PageDown', ' ', 'Enter'].includes(event.key)) return;

    event.preventDefault();
    beginExperience();
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

  function createRedObstacles() {
    redObstacleLayer.innerHTML = '';

    RED_OBSTACLES.forEach((obstacle, index) => {
      const element = document.createElement('span');
      element.className = 'red-maze-obstacle';
      element.dataset.obstacle = String(index);
      element.style.setProperty('--obstacle-x', `${obstacle.x}%`);
      element.style.setProperty('--obstacle-y', `${obstacle.y}%`);
      element.style.setProperty('--obstacle-size', `${obstacle.size}%`);
      element.style.setProperty('--obstacle-rotation', `${obstacle.rotation}deg`);
      element.innerHTML = '<svg viewBox="0 0 122.48 118.66" aria-hidden="true"><use href="#icon-red-piece"></use></svg>';
      redObstacleLayer.appendChild(element);
    });
  }

  function clearRedTrace() {
    redPoints = [];
    redPathLength = 0;
    redTraceGlow.setAttribute('d', '');
    redTracePath.setAttribute('d', '');
  }

  function setRedTrace() {
    if (!redPoints.length) {
      clearRedTrace();
      return;
    }

    const path = redPoints
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(' ');

    redTraceGlow.setAttribute('d', path);
    redTracePath.setAttribute('d', path);
  }

  function getRedLocalPoint(event) {
    const rect = redMaze.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function getRedMarkerCenter(marker) {
    const boardRect = redMaze.getBoundingClientRect();
    const markerCircle = marker.querySelector('i');
    const rect = markerCircle.getBoundingClientRect();

    return {
      x: rect.left + rect.width / 2 - boardRect.left,
      y: rect.top + rect.height / 2 - boardRect.top,
      radius: Math.max(20, rect.width * .72)
    };
  }

  function redPointTouchesObstacle(point) {
    const boardRect = redMaze.getBoundingClientRect();

    if (
      point.x < 3 || point.y < 3 ||
      point.x > boardRect.width - 3 ||
      point.y > boardRect.height - 3
    ) return true;

    return [...redObstacleLayer.children].some(obstacle => {
      const rect = obstacle.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - boardRect.left;
      const centerY = rect.top + rect.height / 2 - boardRect.top;
      const radius = Math.min(rect.width, rect.height) * .37 + 3;
      return Math.hypot(point.x - centerX, point.y - centerY) <= radius;
    });
  }

  function redSegmentTouchesObstacle(from, to) {
    const distance = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(distance / 4));

    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      const sample = {
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress
      };
      if (redPointTouchesObstacle(sample)) return true;
    }

    return false;
  }

  function resetRedAttempt(message = 'MANTÉN PRESIONADO DESDE INICIO HASTA META') {
    redDrawing = false;
    redPointerId = null;
    redState = 'ready';
    redMaze.classList.remove('is-drawing', 'is-failed');
    redGame.classList.remove('is-failed');
    clearRedTrace();
    redGameStatus.textContent = message;
  }

  function resetRedGame() {
    redState = 'idle';
    redDrawing = false;
    redPointerId = null;
    redPoints = [];
    redPathLength = 0;
    activeRedSourcePiece = null;
    redGame.className = 'red-game';
    redGame.setAttribute('aria-hidden', 'true');
    redMaze.className = 'red-maze';
    redGameStatus.textContent = 'MANTÉN PRESIONADO DESDE INICIO HASTA META';
    clearRedTrace();
    createRedObstacles();
  }

  function startRedGame(sourcePiece) {
    resetRedGame();
    activeRedSourcePiece = sourcePiece;
    redState = 'ready';
    redGame.classList.add('is-visible');
    redGame.setAttribute('aria-hidden', 'false');
    redGameStatus.textContent = 'COMIENZA EN EL CÍRCULO IZQUIERDO Y NO SUELTES';
    locked = false;
  }

  function failRedMaze(message) {
    if (!redDrawing && redState !== 'drawing') return;

    redDrawing = false;
    redState = 'failed';
    redMaze.classList.remove('is-drawing');
    redMaze.classList.add('is-failed');
    redGame.classList.add('is-failed');
    redGameStatus.textContent = message;

    window.setTimeout(() => {
      if (redState === 'failed' && redGame.classList.contains('is-visible')) {
        resetRedAttempt();
      }
    }, 820);
  }

  async function finishRedMaze() {
    if (redState !== 'drawing' || locked) return;

    redDrawing = false;
    redState = 'won';
    locked = true;
    redMaze.classList.remove('is-drawing');
    redGame.classList.add('is-won');
    redGameStatus.textContent = 'CAMINO COMPLETADO — GANASTE UNA PIEZA VERDE';

    await wait(980);
    await awardRedGreenPoint();
  }

  async function awardRedGreenPoint() {
    const slotIndex = score;

    if (activeRedSourcePiece) {
      activeRedSourcePiece.classList.add('is-collected');
      activeRedSourcePiece.disabled = true;
    }

    if (slotIndex < scoreSlots.length) {
      animatePointToScore(redGoalMarker, slotIndex);
    }

    score = Math.min(5, score + 1);
    await wait(430);
    updateScore();

    resetRedGame();
    greenFeedback.classList.add('is-visible');
    greenFeedback.setAttribute('aria-hidden', 'false');
    await wait(1080);
    greenFeedback.classList.remove('is-visible');
    greenFeedback.setAttribute('aria-hidden', 'true');

    if (score >= 5) {
      await playWinTransition();
      return;
    }

    restoreRoute();
    locked = false;
  }

  function handleRedPointerDown(event) {
    if (redState !== 'ready' || locked) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const point = getRedLocalPoint(event);
    const start = getRedMarkerCenter(redStartMarker);

    if (Math.hypot(point.x - start.x, point.y - start.y) > start.radius) {
      redGameStatus.textContent = 'COMIENZA DENTRO DEL CÍRCULO IZQUIERDO';
      return;
    }

    event.preventDefault();
    redDrawing = true;
    redState = 'drawing';
    redPointerId = event.pointerId;
    redPathLength = 0;
    redPoints = [{ x: start.x, y: start.y }, { x: point.x, y: point.y }];
    redMaze.classList.add('is-drawing');
    redGameStatus.textContent = 'AVANZA HASTA META SIN TOCAR LAS PIEZAS ROJAS';
    redMaze.setPointerCapture?.(event.pointerId);

    const rect = redMaze.getBoundingClientRect();
    redMazeLines.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    setRedTrace();
  }

  function handleRedPointerMove(event) {
    if (!redDrawing || redState !== 'drawing' || event.pointerId !== redPointerId) return;

    event.preventDefault();
    const point = getRedLocalPoint(event);
    const previous = redPoints[redPoints.length - 1];
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y);

    if (distance < 1.5) return;

    if (redSegmentTouchesObstacle(previous, point)) {
      failRedMaze('TOCASTE UNA PIEZA ROJA — INTÉNTALO DE NUEVO');
      return;
    }

    redPathLength += distance;
    redPoints.push({ x: point.x, y: point.y });
    setRedTrace();

    const goal = getRedMarkerCenter(redGoalMarker);
    const reachedGoal = Math.hypot(point.x - goal.x, point.y - goal.y) <= goal.radius;
    const crossedBoard = redPathLength >= point.width * .62;

    if (reachedGoal && crossedBoard) finishRedMaze();
  }

  function handleRedPointerEnd(event) {
    if (!redDrawing || event.pointerId !== redPointerId) return;

    if (redMaze.hasPointerCapture?.(event.pointerId)) {
      redMaze.releasePointerCapture(event.pointerId);
    }

    failRedMaze('NO SUELTES ANTES DE LLEGAR A META');
  }

  async function playRedTransition(sourcePiece) {
    muteRoute();
    redTransition.classList.add('is-visible');
    redTransition.setAttribute('aria-hidden', 'false');

    await wait(2850);

    redTransition.classList.remove('is-visible');
    redTransition.setAttribute('aria-hidden', 'true');
    await wait(160);
    startRedGame(sourcePiece);
  }

  function normalizeBluePhase(value) {
    return ((value % 2) + 2) % 2;
  }

  function getBlueTrack(column) {
    return column?.querySelector('.blue-ring-track') || null;
  }

  function setBlueColumnPhase(index, phase, immediate = false) {
    const nextPhase = normalizeBluePhase(phase);
    const column = blueColumnControls[index];

    blueColumnRows[index] = nextPhase;
    if (!column) return;

    const track = getBlueTrack(column);
    column.style.setProperty(
      '--track-offset',
      nextPhase === 1 ? '-14.285714%' : '-28.571429%'
    );

    if (track) {
      if (immediate) track.style.transition = 'none';
      track.style.removeProperty('transform');
      if (immediate) {
        void track.offsetHeight;
        track.style.removeProperty('transition');
      }
    }

    column.setAttribute(
      'aria-label',
      `Columna ${index + 1}. ${nextPhase === 1 ? 'El tramo azul está conectado al centro.' : 'El tramo azul todavía no está conectado.'} Arrastra hacia arriba o abajo.`
    );
  }

  function checkBlueAlignment() {
    if (blueState !== 'aligning' || locked) return;
    if (!blueColumnRows.length) return;

    const stillMoving = blueColumnControls.some(column => column.dataset.moving === 'true');
    if (stillMoving) return;

    const aligned = blueColumnRows.every(phase => phase === 1);
    if (aligned) finishBlueAlignment();
  }

  function animateBlueColumnStep(index, direction) {
    if (blueState !== 'aligning' || locked) return;

    const column = blueColumnControls[index];
    const track = getBlueTrack(column);
    if (!column || !track || column.dataset.moving === 'true') return;

    const cellHeight = Math.max(1, column.clientHeight / 3);
    const startPhase = blueColumnRows[index];
    const startOffset = startPhase === 1 ? -cellHeight : -2 * cellHeight;
    const targetOffset = startOffset + direction * cellHeight;
    const nextPhase = normalizeBluePhase(startPhase + direction);

    column.dataset.moving = 'true';
    track.style.transition = 'transform .36s cubic-bezier(.2,.82,.2,1)';
    track.style.transform = `translateY(${targetOffset}px)`;

    window.setTimeout(() => {
      setBlueColumnPhase(index, nextPhase, true);
      column.dataset.moving = 'false';
      window.setTimeout(checkBlueAlignment, 30);
    }, 370);
  }

  function createBlueAlignment() {
    // El inicio replica el video: columnas alternadas hasta completar
    // una franja azul continua en la fila central.
    const startPhases = [1, 0, 1, 0];

    blueAlignBoard.innerHTML = '';
    blueColumnRows = startPhases.slice();
    blueColumnControls = [];
    blueAlignStage.setAttribute('aria-hidden', 'false');

    startPhases.forEach((phase, index) => {
      const column = document.createElement('button');
      let pointerStartY = 0;
      let startPhase = phase;
      let currentDistance = 0;
      let dragging = false;
      let suppressClick = false;

      column.type = 'button';
      column.className = 'blue-ring-column';
      column.dataset.column = String(index);
      column.dataset.moving = 'false';
      column.innerHTML = `
        <span class="blue-ring-track" aria-hidden="true">
          <span class="blue-ring-cell is-blue"></span>
          <span class="blue-ring-cell"></span>
          <span class="blue-ring-cell is-blue"></span>
          <span class="blue-ring-cell"></span>
          <span class="blue-ring-cell is-blue"></span>
          <span class="blue-ring-cell"></span>
          <span class="blue-ring-cell is-blue"></span>
        </span>
      `;

      const finishDrag = (event, cancelled = false) => {
        if (!dragging) return;

        dragging = false;
        column.classList.remove('is-dragging');

        if (column.hasPointerCapture?.(event.pointerId)) {
          column.releasePointerCapture(event.pointerId);
        }

        const track = getBlueTrack(column);
        const cellHeight = Math.max(1, column.clientHeight / 3);
        const baseOffset = startPhase === 1 ? -cellHeight : -2 * cellHeight;
        const distance = cancelled ? 0 : currentDistance;
        const threshold = cellHeight * .18;
        const direction = distance > threshold ? 1 : distance < -threshold ? -1 : 0;
        const targetOffset = baseOffset + direction * cellHeight;
        const nextPhase = direction === 0
          ? startPhase
          : normalizeBluePhase(startPhase + direction);

        suppressClick = Math.abs(distance) > 6;
        column.dataset.moving = 'true';
        track.style.transition = 'transform .34s cubic-bezier(.2,.82,.2,1)';
        track.style.transform = `translateY(${targetOffset}px)`;

        window.setTimeout(() => {
          setBlueColumnPhase(index, nextPhase, true);
          column.dataset.moving = 'false';
          currentDistance = 0;
          window.setTimeout(checkBlueAlignment, 30);
        }, 350);
      };

      column.addEventListener('pointerdown', event => {
        if (blueState !== 'aligning' || locked || column.dataset.moving === 'true') return;

        const track = getBlueTrack(column);
        const cellHeight = Math.max(1, column.clientHeight / 3);
        const baseOffset = blueColumnRows[index] === 1 ? -cellHeight : -2 * cellHeight;

        dragging = true;
        suppressClick = false;
        pointerStartY = event.clientY;
        startPhase = blueColumnRows[index];
        currentDistance = 0;
        column.classList.add('is-dragging');
        column.setPointerCapture?.(event.pointerId);
        track.style.transition = 'none';
        track.style.transform = `translateY(${baseOffset}px)`;
      });

      column.addEventListener('pointermove', event => {
        if (!dragging || blueState !== 'aligning') return;

        const track = getBlueTrack(column);
        const cellHeight = Math.max(1, column.clientHeight / 3);
        const baseOffset = startPhase === 1 ? -cellHeight : -2 * cellHeight;
        currentDistance = Math.max(
          -cellHeight * .95,
          Math.min(cellHeight * .95, event.clientY - pointerStartY)
        );

        track.style.transform = `translateY(${baseOffset + currentDistance}px)`;
        event.preventDefault();
      });

      column.addEventListener('pointerup', event => finishDrag(event));
      column.addEventListener('pointercancel', event => finishDrag(event, true));

      column.addEventListener('click', () => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        animateBlueColumnStep(index, 1);
      });

      column.addEventListener('keydown', event => {
        if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        animateBlueColumnStep(index, event.key === 'ArrowDown' ? 1 : -1);
      });

      blueAlignBoard.appendChild(column);
      blueColumnControls.push(column);
      setBlueColumnPhase(index, phase, true);
    });
  }

  async function finishBlueAlignment() {
    if (blueState !== 'aligning' || locked) return;

    locked = true;
    blueState = 'aligned';
    blueGame.classList.add('is-aligned');
    blueColumnControls.forEach(column => { column.disabled = true; });
    blueInstruction.textContent = '¡AZUL ALINEADO!';
    blueCounter.textContent = 'GANASTE UNA PIEZA VERDE';

    await wait(1050);
    await awardBlueGreenPoint();
  }

  async function awardBlueGreenPoint() {
    const slotIndex = score;

    if (activeBlueSourcePiece) {
      activeBlueSourcePiece.classList.add('is-collected');
      activeBlueSourcePiece.disabled = true;
    }

    if (slotIndex < scoreSlots.length) {
      animatePointToScore(blueAlignBoard, slotIndex);
    }

    score = Math.min(5, score + 1);
    await wait(430);
    updateScore();

    resetBlueGame();
    greenFeedback.classList.add('is-visible');
    greenFeedback.setAttribute('aria-hidden', 'false');
    await wait(1080);
    greenFeedback.classList.remove('is-visible');
    greenFeedback.setAttribute('aria-hidden', 'true');

    if (score >= 5) {
      await playWinTransition();
      return;
    }

    restoreRoute();
    locked = false;
  }

  function resetBlueGame() {
    blueState = 'idle';
    removedBlueFragments = 0;
    fragmentBusy = false;
    activeBlueSourcePiece = null;
    blueColumnRows = [];
    blueColumnControls = [];
    blueAlignBoard.innerHTML = '';
    blueAlignStage.setAttribute('aria-hidden', 'true');
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

  async function startBlueGame(sourcePiece) {
    muteRoute();
    resetBlueGame();
    activeBlueSourcePiece = sourcePiece;
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
    blueInstruction.textContent = 'PRIMER DESAFÍO COMPLETADO';
    blueCounter.textContent = 'PREPÁRATE PARA ALINEAR EL ANILLO';
    blueBreakPiece.disabled = true;

    await wait(900);

    createBlueAlignment();
    blueGame.classList.remove('is-merging', 'is-piece-ready', 'is-complete');
    blueGame.classList.add('is-aligning');
    blueInstruction.textContent = 'FORMA UN CAMINO AZUL EN EL CENTRO';
    blueCounter.textContent = 'ARRASTRA LAS 4 COLUMNAS';
    blueState = 'aligning';
    locked = false;
    fragmentBusy = false;
  }

  function updateScore() {
    scoreText.textContent = `${score}/5`;
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

    score = Math.min(5, score + 1);
    muteRoute();

    greenFeedback.classList.add('is-visible');
    greenFeedback.setAttribute('aria-hidden', 'false');
    await wait(650);
    updateScore();
    await wait(500);
    greenFeedback.classList.remove('is-visible');
    greenFeedback.setAttribute('aria-hidden', 'true');

    if (score >= 5) {
      await playWinTransition();
      return;
    }

    restoreRoute();
    locked = false;
  }

  function playYellowSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();

      const now = audioContext.currentTime;
      const master = audioContext.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.34, now + 0.035);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
      master.connect(audioContext.destination);

      const notes = [392, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const start = now + index * 0.105;

        oscillator.type = index < 2 ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.015, start + 0.42);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.22, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.72);

        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(start);
        oscillator.stop(start + 0.75);
      });
    } catch (error) {
      console.warn('No fue posible reproducir el sonido amarillo.', error);
    }
  }

  async function playWinTransition() {
    playYellowSound();
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
      await playRedTransition(piece);
      return;
    }

    if (type === 'blue') {
      await startBlueGame(piece);
      return;
    }

    await collectGreenPoint(piece);
  }

  function resetExperience() {
    locked = false;
    started = false;
    score = 0;
    updateScore();
    resetRedGame();
    resetBlueGame();

    redTransition.classList.remove('is-visible');
    greenFeedback.classList.remove('is-visible');
    winTransition.classList.remove('is-visible');
    winTransition.setAttribute('aria-hidden', 'true');
    scorePanel.classList.remove('is-visible');

    scene.classList.remove('route-active', 'journey-playing');
    routeStage.className = 'route-stage';
    routeStage.setAttribute('aria-hidden', 'true');
    intro.classList.remove('is-hidden');
    intro.setAttribute('aria-hidden', 'false');

    transitionRunning = false;
    wheelIntent = 0;
    touchStartY = null;

    createPieces();
    positionPieces();
  }

  redMaze.addEventListener('pointerdown', handleRedPointerDown);
  redMaze.addEventListener('pointermove', handleRedPointerMove);
  redMaze.addEventListener('pointerup', handleRedPointerEnd);
  redMaze.addEventListener('pointercancel', handleRedPointerEnd);
  blueWheel.addEventListener('click', mergeBluePieces);
  blueBreakPiece.addEventListener('click', removeBlueFragment);
  restartButton.addEventListener('click', resetExperience);
  window.addEventListener('resize', positionPieces);
  window.addEventListener('wheel', handleWheelIntent, { passive: false });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchmove', handleTouchMove, { passive: false });
  window.addEventListener('touchend', () => { touchStartY = null; }, { passive: true });
  window.addEventListener('keydown', handleKeyboardIntent);

  initCustomCursor();
  initPawn3D();
  createPieces();
  positionPieces();
  resetRedGame();
  resetBlueGame();
  updateScore();
})();
