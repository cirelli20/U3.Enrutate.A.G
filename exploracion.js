(() => {
  'use strict';

  const loadingScreen = document.getElementById('loadingScreen');
  const loadingStart = document.getElementById('loadingStart');
  const experience = document.getElementById('experience');
  const scene = document.getElementById('scene');
  const intro = document.getElementById('intro');
  const introCopy = document.getElementById('introCopy');
  const introScroll = document.querySelector('.intro-scroll');
  const pawn3d = document.getElementById('pawn3d');
  const introPathDots = [...document.querySelectorAll('.intro-path-dot')];
  const pawnCanvas = document.getElementById('pawnCanvas');
  const routeStage = document.getElementById('routeStage');
  const nutRing = document.getElementById('nutRing');
  const scorePanel = document.getElementById('scorePanel');
  const scoreText = document.getElementById('scoreText');
  const scoreSlots = [...document.querySelectorAll('.score-slot')];

  const redTransition = document.getElementById('redTransition');
  const redExplosionSeeds = document.getElementById('redExplosionSeeds');
  const redExplosionParticles = document.getElementById('redExplosionParticles');
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
  /* ARCHIVOS DE SONIDO */
  const loadingAudio = new Audio('assets/sonidos/carga.mp3');
  const clickAudio = new Audio('assets/sonidos/click.mp3');
  const winAudio = new Audio('assets/sonidos/ganaste.mp3');

  loadingAudio.preload = 'auto';
  clickAudio.preload = 'auto';
  winAudio.preload = 'auto';

  loadingAudio.volume = 0.35;
  clickAudio.volume = 0.45;
  winAudio.volume = 0.2;

  loadingAudio.loop = true;

  function playAudio(audio, restart = true) {
    if (!audio) return;

    if (restart) {
      audio.pause();
      audio.currentTime = 0;
    }

    const playback = audio.play();
    if (playback?.catch) {
      playback.catch(error => {
        console.warn('No fue posible reproducir el sonido:', error);
      });
    }
  }

  function stopAudio(audio) {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  const PIECE_TYPES = [
    'red', 'green', 'blue', 'red',
    'blue', 'green', 'red', 'blue',
    'green', 'red', 'blue', 'red'
  ];

  /*
   * Doce posiciones seguras: cuatro dentro de cada octágono.
   * El orden es izquierda → centro → derecha. Al ganar una pieza,
   * las piezas intercambian estos lugares sin salir de las figuras.
   */
  const DESKTOP_LAYOUT = [
    // Octágono izquierdo
    [11, 36, -12], [23, 31, 8], [11, 64, 10], [23, 69, -8],
    // Octágono central
    [42, 35, -10], [58, 35, 10], [42, 65, 12], [58, 65, -12],
    // Octágono derecho
    [77, 31, -8], [89, 36, 12], [77, 69, 8], [89, 64, -10]
  ];

  const MOBILE_LAYOUT = [
    // Octágono izquierdo
    [10, 43, -10], [24, 39, 8], [10, 57, 9], [24, 61, -8],
    // Octágono central
    [42, 43, -9], [58, 43, 9], [42, 57, 11], [58, 57, -11],
    // Octágono derecho
    [76, 39, -8], [90, 43, 10], [76, 61, 8], [90, 57, -10]
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
  let pieceLayoutOrder = [];
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
  let blueRingAngles = [];
  let blueRingControls = [];
  let bluePuzzleSvg = null;
  let transitionRunning = false;
  let wheelIntent = 0;
  let touchStartY = null;
  let audioContext = null;
  let pawnEraserFrame = null;
  let loadingStarted = false;

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
    pieceLayoutOrder = PIECE_TYPES.map((_, index) => index);

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

    const useCompactLayout = window.innerWidth <= 900 || window.innerHeight > window.innerWidth;
    const layout = useCompactLayout ? MOBILE_LAYOUT : DESKTOP_LAYOUT;

    pieces.forEach((piece, index) => {
      const layoutIndex = pieceLayoutOrder[index] ?? index;
      const [left, top, rotation] = layout[layoutIndex];
      piece.style.left = `${left}%`;
      piece.style.top = `${top}%`;
      piece.style.setProperty('--piece-rotation', `${rotation}deg`);
    });
  }

  function shufflePiecePositions() {
    if (pieceLayoutOrder.length < 2) return;

    const previousOrder = pieceLayoutOrder.slice();
    const displacement = 1 + Math.floor(Math.random() * (previousOrder.length - 1));

    // El desplazamiento circular garantiza que ninguna pieza conserve su lugar.
    pieceLayoutOrder = previousOrder.map(
      (_, index) => previousOrder[(index + displacement) % previousOrder.length]
    );
    routeStage.classList.add('is-reordering');
    positionPieces();

    window.setTimeout(() => {
      routeStage.classList.remove('is-reordering');
    }, 760);
  }

  function revealPieces() {
    scene.classList.add('route-active');
    routeStage.style.removeProperty('opacity');
    routeStage.style.removeProperty('transform');
    routeStage.classList.add('is-visible');
    routeStage.setAttribute('aria-hidden', 'false');
    scorePanel.classList.add('is-visible');

    window.requestAnimationFrame(() => {
      pieces.forEach(piece => piece.classList.add('is-ready'));
    });
  }

  function resetPawnEraser() {
    if (pawnEraserFrame !== null) {
      window.cancelAnimationFrame(pawnEraserFrame);
      pawnEraserFrame = null;
    }

    introPathDots.forEach(dot => {
      dot.classList.remove('is-erased');
    });
  }

  function startPawnEraser() {
    resetPawnEraser();

    if (!pawn3d || !introPathDots.length) return;

    const detectContact = () => {
      if (!scene.classList.contains('journey-playing')) {
        pawnEraserFrame = null;
        return;
      }

      const pawnRect = pawn3d.getBoundingClientRect();

      /*
       * La zona de borrado se ubica en la parte inferior del peón.
       * Al moverse, funciona como una goma y borra cada círculo
       * únicamente cuando realmente pasa sobre él.
       */
      const eraserX = pawnRect.left + pawnRect.width * 0.5;
      const eraserY = pawnRect.top + pawnRect.height * 0.72;
      const eraserRadius = Math.max(
        16,
        Math.min(pawnRect.width, pawnRect.height) * 0.13
      );

      introPathDots.forEach(dot => {
        if (dot.classList.contains('is-erased')) return;

        const dotRect = dot.getBoundingClientRect();
        const dotX = dotRect.left + dotRect.width * 0.5;
        const dotY = dotRect.top + dotRect.height * 0.5;
        const dotRadius = Math.max(dotRect.width, dotRect.height) * 0.5;
        const distance = Math.hypot(eraserX - dotX, eraserY - dotY);

        if (distance <= eraserRadius + dotRadius) {
          dot.classList.add('is-erased');
        }
      });

      pawnEraserFrame = window.requestAnimationFrame(detectContact);
    };

    pawnEraserFrame = window.requestAnimationFrame(detectContact);
  }

  async function beginExperience() {
    if (loadingScreen?.isConnected || started || transitionRunning || locked) return;

    started = true;
    transitionRunning = true;
    locked = true;
    wheelIntent = 0;

    intro.setAttribute('aria-hidden', 'false');
    routeStage.setAttribute('aria-hidden', 'false');
    routeStage.classList.add('is-cinematic');
    scene.classList.add('journey-playing');
    startPawnEraser();

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
    if (loadingScreen?.isConnected || started || transitionRunning) return;

    if (event.deltaY <= 0) {
      wheelIntent = Math.max(0, wheelIntent + event.deltaY * 0.15);
      return;
    }

    event.preventDefault();
    wheelIntent += Math.min(42, event.deltaY);

    if (wheelIntent >= 48) beginExperience();
  }

  function handleTouchStart(event) {
    if (loadingScreen?.isConnected || started || transitionRunning || !event.touches.length) return;
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    if (loadingScreen?.isConnected || started || transitionRunning || touchStartY === null || !event.touches.length) return;

    const distance = touchStartY - event.touches[0].clientY;
    if (distance > 34) {
      event.preventDefault();
      touchStartY = null;
      beginExperience();
    }
  }

  function handleKeyboardIntent(event) {
    if (loadingScreen?.isConnected || started || transitionRunning) return;
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
    playGreenRewardSound();

    await wait(720);
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
    await wait(320);
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
    shufflePiecePositions();
    await wait(720);
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

  function buildRedExplosion() {
    if (!redExplosionSeeds || !redExplosionParticles) return;

    redExplosionSeeds.innerHTML = '';
    redExplosionParticles.innerHTML = '';

    const iconMarkup = `
      <svg viewBox="0 0 122.48 118.66" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <use href="#icon-red-piece"></use>
      </svg>
    `;

    // Primera multiplicación: ocho piezas aparecen alrededor de la pieza central.
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8 - Math.PI / 2;
      const distance = 128 + (index % 2) * 24;
      const seed = document.createElement('span');

      seed.className = 'red-explosion-seed';
      seed.style.setProperty('--seed-x', `${Math.cos(angle) * distance}px`);
      seed.style.setProperty('--seed-y', `${Math.sin(angle) * distance}px`);
      seed.style.setProperty('--seed-rotation', `${index * 37 - 90}deg`);
      seed.style.setProperty('--seed-delay', `${0.31 + index * 0.018}s`);
      seed.innerHTML = iconMarkup;
      redExplosionSeeds.appendChild(seed);
    }

    /*
     * Segunda multiplicación: una retícula irregular de piezas sale desde
     * el centro y termina cubriendo la pantalla, como en el video.
     */
    const columns = window.innerWidth <= 760 ? 7 : 10;
    const rows = window.innerWidth <= 760 ? 9 : 7;
    const total = columns * rows;

    for (let index = 0; index < total; index += 1) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const xBase = columns === 1 ? 0 : -48 + (column / (columns - 1)) * 96;
      const yBase = rows === 1 ? 0 : -47 + (row / (rows - 1)) * 94;
      const particle = document.createElement('span');
      const jitterX = (Math.random() - 0.5) * 7;
      const jitterY = (Math.random() - 0.5) * 8;
      const delay = 0.48 + Math.random() * 0.24;
      const scale = 0.98 + Math.random() * 0.62;
      const rotation = -55 + Math.random() * 110;
      const particleX = xBase + jitterX;
      const particleY = yBase + jitterY;
      const exitMultiplier = 1.1 + Math.random() * 0.08;
      const exitScale = scale * (1.55 + Math.random() * 0.22);

      particle.className = 'red-explosion-particle';
      particle.style.setProperty('--particle-x', `${particleX}vw`);
      particle.style.setProperty('--particle-y', `${particleY}vh`);
      particle.style.setProperty('--particle-exit-x', `${particleX * exitMultiplier}vw`);
      particle.style.setProperty('--particle-exit-y', `${particleY * exitMultiplier}vh`);
      particle.style.setProperty('--particle-delay', `${delay}s`);
      particle.style.setProperty('--particle-scale', scale.toFixed(2));
      particle.style.setProperty('--particle-exit-scale', exitScale.toFixed(2));
      particle.style.setProperty('--particle-rotation', `${rotation.toFixed(1)}deg`);
      particle.style.setProperty('--particle-size', `${(6.6 + Math.random() * 3.8).toFixed(2)}vw`);
      particle.innerHTML = iconMarkup;
      redExplosionParticles.appendChild(particle);
    }
  }

  async function playRedTransition(sourcePiece) {
    muteRoute();
    buildRedExplosion();
    playRedTransitionSound();

    redTransition.classList.remove('is-visible', 'is-handoff');
    redTransition.setAttribute('aria-hidden', 'false');
    void redTransition.offsetWidth;
    redTransition.classList.add('is-visible');

    /*
     * El minijuego comienza antes de que termine la última expansión.
     * Así no queda un fotograma congelado con piezas rojas: la explosión
     * continúa moviéndose mientras descubre el tablero que está detrás.
     */
    await wait(1420);
    startRedGame(sourcePiece);
    locked = true;
    redTransition.classList.add('is-handoff');

    await wait(600);

    // La capa se retira de inmediato cuando termina el movimiento.
    redTransition.setAttribute('aria-hidden', 'true');
    redTransition.classList.remove('is-visible', 'is-handoff');
    locked = false;
  }

  function normalizeBlueAngle(value) {
    return ((value % 360) + 360) % 360;
  }

  function isBlueRingAligned(angle) {
    const normalized = normalizeBlueAngle(angle);
    const remainder = normalized % 90;
    return remainder < 0.5 || remainder > 89.5;
  }

  function polarPoint(cx, cy, radius, angle) {
    const radians = (angle - 90) * Math.PI / 180;
    return {
      x: cx + radius * Math.cos(radians),
      y: cy + radius * Math.sin(radians)
    };
  }

  function describeBlueRingSegment(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
    const outerStart = polarPoint(cx, cy, outerRadius, endAngle);
    const outerEnd = polarPoint(cx, cy, outerRadius, startAngle);
    const innerStart = polarPoint(cx, cy, innerRadius, startAngle);
    const innerEnd = polarPoint(cx, cy, innerRadius, endAngle);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
      'Z'
    ].join(' ');
  }

  function setBlueRingAngle(index, angle, immediate = false) {
    const ring = blueRingControls[index];
    const nextAngle = normalizeBlueAngle(angle);

    blueRingAngles[index] = nextAngle;
    if (!ring) return;

    if (immediate) ring.classList.add('is-dragging');
    ring.style.transform = `rotate(${nextAngle}deg)`;
    if (immediate) {
      window.requestAnimationFrame(() => ring.classList.remove('is-dragging'));
    }

    ring.classList.toggle('is-path-aligned', isBlueRingAligned(nextAngle));
    ring.setAttribute(
      'aria-label',
      `Anillo ${index + 1}. ${isBlueRingAligned(nextAngle) ? 'El camino blanco está alineado con el centro.' : 'El camino blanco todavía no coincide con el centro.'}`
    );
  }

  function getBluePointerAngle(event) {
    if (!bluePuzzleSvg) return 0;

    const rect = bluePuzzleSvg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
  }

  function checkBlueAlignment() {
    if (blueState !== 'aligning' || locked || !blueRingAngles.length) return;

    const stillMoving = blueRingControls.some(ring => ring.dataset.moving === 'true');
    if (stillMoving) return;

    const aligned = blueRingAngles.every(isBlueRingAligned);
    if (aligned) finishBlueAlignment();
  }

  function rotateBlueRing(index, direction = 1) {
    if (blueState !== 'aligning' || locked) return;

    const ring = blueRingControls[index];
    if (!ring || ring.dataset.moving === 'true') return;

    ring.dataset.moving = 'true';
    playBlueBubbleSound(false);
    setBlueRingAngle(index, blueRingAngles[index] + direction * 45);

    window.setTimeout(() => {
      ring.dataset.moving = 'false';
      checkBlueAlignment();
    }, 390);
  }

  function createBlueAlignment() {
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const center = 300;
    const startAngles = [45, 180, 315];
    const ringSettings = [
      { radius: 235, width: 94 },
      { radius: 145, width: 70 },
      { radius: 78, width: 42 }
    ];

    blueAlignBoard.innerHTML = '';
    blueRingAngles = startAngles.slice();
    blueRingControls = [];
    blueAlignStage.setAttribute('aria-hidden', 'false');
    blueAlignBoard.setAttribute(
      'aria-label',
      'Gira los tres anillos para que los caminos blancos lleguen al centro verde.'
    );

    const svg = document.createElementNS(svgNamespace, 'svg');
    svg.classList.add('blue-concentric-svg');
    svg.setAttribute('viewBox', '0 0 600 600');
    svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'Rompecabezas de tres anillos concéntricos');
    bluePuzzleSvg = svg;

    const disc = document.createElementNS(svgNamespace, 'circle');
    disc.classList.add('blue-puzzle-disc');
    disc.setAttribute('cx', center);
    disc.setAttribute('cy', center);
    disc.setAttribute('r', 286);
    svg.appendChild(disc);

    ringSettings.forEach((settings, index) => {
      const ring = document.createElementNS(svgNamespace, 'g');
      const outerRadius = settings.radius + settings.width / 2;
      const innerRadius = settings.radius - settings.width / 2;
      let pointerId = null;
      let pointerStartAngle = 0;
      let ringStartAngle = startAngles[index];
      let movement = 0;

      ring.classList.add('blue-puzzle-ring');
      ring.dataset.ring = String(index);
      ring.dataset.moving = 'false';
      ring.setAttribute('role', 'button');
      ring.setAttribute('tabindex', '0');

      const base = document.createElementNS(svgNamespace, 'circle');
      base.classList.add('blue-puzzle-ring-base');
      base.setAttribute('cx', center);
      base.setAttribute('cy', center);
      base.setAttribute('r', settings.radius);
      base.setAttribute('stroke-width', settings.width);
      ring.appendChild(base);

      [0, 90, 180, 270].forEach(pathAngle => {
        const whitePath = document.createElementNS(svgNamespace, 'path');
        whitePath.classList.add('blue-puzzle-white-path');
        whitePath.setAttribute(
          'd',
          describeBlueRingSegment(
            center,
            center,
            outerRadius,
            innerRadius,
            pathAngle - 13,
            pathAngle + 13
          )
        );
        ring.appendChild(whitePath);
      });

      [outerRadius, innerRadius].forEach(radius => {
        const boundary = document.createElementNS(svgNamespace, 'circle');
        boundary.classList.add('blue-puzzle-boundary');
        boundary.setAttribute('cx', center);
        boundary.setAttribute('cy', center);
        boundary.setAttribute('r', radius);
        ring.appendChild(boundary);
      });

      const hitArea = document.createElementNS(svgNamespace, 'circle');
      hitArea.classList.add('blue-puzzle-hit');
      hitArea.setAttribute('cx', center);
      hitArea.setAttribute('cy', center);
      hitArea.setAttribute('r', settings.radius);
      hitArea.setAttribute('stroke-width', settings.width);
      ring.appendChild(hitArea);

      ring.addEventListener('pointerdown', event => {
        if (blueState !== 'aligning' || locked || ring.dataset.moving === 'true') return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();
        pointerId = event.pointerId;
        pointerStartAngle = getBluePointerAngle(event);
        ringStartAngle = blueRingAngles[index];
        movement = 0;
        ring.classList.add('is-dragging');
        ring.setPointerCapture?.(event.pointerId);
      });

      ring.addEventListener('pointermove', event => {
        if (pointerId !== event.pointerId || blueState !== 'aligning') return;

        const delta = getBluePointerAngle(event) - pointerStartAngle;
        movement = delta;
        ring.style.transform = `rotate(${ringStartAngle + delta}deg)`;
        event.preventDefault();
      });

      const finishRingMove = event => {
        if (pointerId !== event.pointerId) return;

        if (ring.hasPointerCapture?.(event.pointerId)) {
          ring.releasePointerCapture(event.pointerId);
        }

        ring.classList.remove('is-dragging');
        ring.dataset.moving = 'true';

        const targetAngle = Math.abs(movement) < 7
          ? ringStartAngle + 45
          : Math.round((ringStartAngle + movement) / 45) * 45;

        playBlueBubbleSound(false);
        setBlueRingAngle(index, targetAngle);
        pointerId = null;

        window.setTimeout(() => {
          ring.dataset.moving = 'false';
          checkBlueAlignment();
        }, 390);
      };

      ring.addEventListener('pointerup', finishRingMove);
      ring.addEventListener('pointercancel', event => {
        movement = 0;
        finishRingMove(event);
      });

      ring.addEventListener('keydown', event => {
        const backward = ['ArrowLeft', 'ArrowUp'].includes(event.key);
        const forward = ['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key);
        if (!backward && !forward) return;

        event.preventDefault();
        rotateBlueRing(index, backward ? -1 : 1);
      });

      svg.appendChild(ring);
      blueRingControls.push(ring);
      setBlueRingAngle(index, startAngles[index], true);
    });

    const coreGuides = document.createElementNS(svgNamespace, 'g');
    coreGuides.classList.add('blue-puzzle-core-guides');

    [0, 90, 180, 270].forEach(angle => {
      const guide = document.createElementNS(svgNamespace, 'rect');
      guide.classList.add('blue-puzzle-core-path');
      guide.setAttribute('x', 288);
      guide.setAttribute('y', 232);
      guide.setAttribute('width', 24);
      guide.setAttribute('height', 68);
      guide.setAttribute('transform', `rotate(${angle} ${center} ${center})`);
      coreGuides.appendChild(guide);
    });

    const core = document.createElementNS(svgNamespace, 'polygon');
    core.classList.add('blue-puzzle-core');
    core.setAttribute('points', '276,266 324,266 334,276 334,324 324,334 276,334 266,324 266,276');
    coreGuides.appendChild(core);
    svg.appendChild(coreGuides);

    blueAlignBoard.appendChild(svg);
  }

  async function finishBlueAlignment() {
    if (blueState !== 'aligning' || locked) return;

    locked = true;
    blueState = 'aligned';
    blueGame.classList.add('is-aligned');
    blueRingControls.forEach(ring => {
      ring.style.pointerEvents = 'none';
      ring.setAttribute('aria-disabled', 'true');
    });
    blueInstruction.textContent = '¡CAMINOS CONECTADOS!';
    blueCounter.textContent = 'GANASTE UNA PIEZA VERDE';

    await wait(560);
    await awardBlueGreenPoint();
  }

  async function awardBlueGreenPoint() {
    const slotIndex = score;

    // Se reproduce al comenzar la recompensa, separado del último sonido azul.
    playGreenRewardSound();

    if (activeBlueSourcePiece) {
      activeBlueSourcePiece.classList.add('is-collected');
      activeBlueSourcePiece.disabled = true;
    }

    if (slotIndex < scoreSlots.length) {
      animatePointToScore(blueAlignBoard, slotIndex);
    }

    score = Math.min(5, score + 1);
    await wait(320);
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
    shufflePiecePositions();
    await wait(720);
    locked = false;
  }

  function resetBlueGame() {
    blueState = 'idle';
    removedBlueFragments = 0;
    fragmentBusy = false;
    activeBlueSourcePiece = null;
    blueRingAngles = [];
    blueRingControls = [];
    bluePuzzleSvg = null;
    blueAlignBoard.innerHTML = '';
    blueAlignStage.setAttribute('aria-hidden', 'true');
    blueGame.className = 'blue-game';
    blueGame.setAttribute('aria-hidden', 'true');
    blueWheel.disabled = false;
    blueBreakPiece.disabled = true;
    blueBreakPiece.classList.remove('is-hit');
    blueInstruction.textContent = 'HAZ CLICK PARA UNIR LAS PIEZAS';
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
    playBlueBubbleSound(false);
    resetBlueGame();
    activeBlueSourcePiece = sourcePiece;
    blueState = 'orbit';
    blueGame.classList.add('is-visible', 'is-orbiting');
    blueGame.setAttribute('aria-hidden', 'false');
    blueInstruction.textContent = 'HAZ CLICK EN LAS PIEZAS PARA UNIRLAS';
    blueCounter.textContent = 'LAS PIEZAS ESTÁN GIRANDO';

    await wait(450);
    locked = false;
  }

  async function mergeBluePieces() {
    if (blueState !== 'orbit' || locked) return;

    playBlueBubbleSound(false);
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
    blueInstruction.textContent = 'HAZ CLICK EN LA PIEZA PARA DESARMARLA';
    blueCounter.textContent = `${blueFragments.length} FRAGMENTOS RESTANTES`;
    blueState = 'breaking';
    locked = false;
  }

  async function removeBlueFragment() {
    if (blueState !== 'breaking' || fragmentBusy) return;

    playBlueBubbleSound(false);
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
    blueCounter.textContent = 'PREPÁRATE PARA GIRAR LOS ANILLOS';
    blueBreakPiece.disabled = true;

    await wait(900);

    createBlueAlignment();
    blueGame.classList.remove('is-merging', 'is-piece-ready', 'is-complete');
    blueGame.classList.add('is-aligning');
    blueInstruction.textContent = 'CONECTA LOS CAMINOS BLANCOS CON EL CENTRO';
    blueCounter.textContent = 'GIRA CADA ANILLO EN PASOS DE 45°';
    blueState = 'aligning';
    locked = false;
    fragmentBusy = false;
  }

  function updateScore() {
    if (scoreText) scoreText.textContent = `${score}/5`;
    scorePanel.setAttribute('aria-label', `Piezas verdes acumuladas: ${score} de 5`);
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
    playGreenRewardSound();
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
    shufflePiecePositions();
    await wait(720);
    locked = false;
  }

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume();
      return audioContext;
    } catch (error) {
      console.warn('No fue posible iniciar el audio de la experiencia.', error);
      return null;
    }
  }

  function playBlueBubbleSound(isAligned = false) {
    const context = getAudioContext();
    if (!context) return;

    const now = context.currentTime;
    const master = context.createGain();
    const filter = context.createBiquadFilter();
    const oscillator = context.createOscillator();
    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(isAligned ? 0.19 : 0.14, now + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, now + (isAligned ? 0.32 : 0.24));

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isAligned ? 2700 : 2100, now);
    filter.Q.setValueAtTime(1.4, now);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(isAligned ? 520 : 390, now);
    oscillator.frequency.exponentialRampToValueAtTime(isAligned ? 980 : 690, now + 0.11);
    oscillator.frequency.exponentialRampToValueAtTime(isAligned ? 760 : 540, now + 0.22);

    shimmer.type = 'triangle';
    shimmer.frequency.setValueAtTime(isAligned ? 1180 : 880, now);
    shimmer.frequency.exponentialRampToValueAtTime(isAligned ? 1540 : 1120, now + 0.12);
    shimmerGain.gain.setValueAtTime(0.0001, now);
    shimmerGain.gain.exponentialRampToValueAtTime(isAligned ? 0.055 : 0.035, now + 0.012);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    oscillator.connect(filter);
    filter.connect(master);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(master);
    master.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.28);
    shimmer.start(now);
    shimmer.stop(now + 0.22);
  }

  function playRedTransitionSound() {
    const context = getAudioContext();
    if (!context) return;

    const now = context.currentTime;
    const master = context.createGain();
    const low = context.createOscillator();
    const strike = context.createOscillator();
    const strikeGain = context.createGain();

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.24, now + 0.018);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
    master.connect(context.destination);

    low.type = 'sawtooth';
    low.frequency.setValueAtTime(150, now);
    low.frequency.exponentialRampToValueAtTime(58, now + 0.48);
    low.connect(master);

    strike.type = 'square';
    strike.frequency.setValueAtTime(310, now);
    strike.frequency.exponentialRampToValueAtTime(115, now + 0.16);
    strikeGain.gain.setValueAtTime(0.0001, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.11, now + 0.008);
    strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    strike.connect(strikeGain);
    strikeGain.connect(master);

    low.start(now);
    low.stop(now + 0.52);
    strike.start(now);
    strike.stop(now + 0.22);

    // Segundo impacto sincronizado con la multiplicación de piezas.
    const burstAt = now + 0.48;
    const noiseBuffer = context.createBuffer(
      1,
      Math.floor(context.sampleRate * 0.32),
      context.sampleRate
    );
    const noiseData = noiseBuffer.getChannelData(0);

    for (let index = 0; index < noiseData.length; index += 1) {
      const envelope = 1 - index / noiseData.length;
      noiseData[index] = (Math.random() * 2 - 1) * envelope;
    }

    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    const burstTone = context.createOscillator();
    const burstToneGain = context.createGain();

    noise.buffer = noiseBuffer;
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(760, burstAt);
    noiseFilter.Q.setValueAtTime(0.85, burstAt);
    noiseGain.gain.setValueAtTime(0.0001, burstAt);
    noiseGain.gain.exponentialRampToValueAtTime(0.12, burstAt + 0.012);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, burstAt + 0.3);

    burstTone.type = 'triangle';
    burstTone.frequency.setValueAtTime(420, burstAt);
    burstTone.frequency.exponentialRampToValueAtTime(120, burstAt + 0.34);
    burstToneGain.gain.setValueAtTime(0.0001, burstAt);
    burstToneGain.gain.exponentialRampToValueAtTime(0.13, burstAt + 0.01);
    burstToneGain.gain.exponentialRampToValueAtTime(0.0001, burstAt + 0.36);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(context.destination);
    burstTone.connect(burstToneGain);
    burstToneGain.connect(context.destination);

    noise.start(burstAt);
    noise.stop(burstAt + 0.32);
    burstTone.start(burstAt);
    burstTone.stop(burstAt + 0.38);
  }

  function playLoadingSound() {
    const context = getAudioContext();
    if (!context) return;

    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.16, now + 0.04);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
    master.connect(context.destination);

    [196, 246.94, 293.66, 392].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.32;

      oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.08, start + 0.28);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.11, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.31);

      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.34);
    });
  }

  function playGreenRewardSound() {
    const context = getAudioContext();
    if (!context) return;

    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.60, now + 0.018);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    master.connect(context.destination);

    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.075;

      oscillator.type = index === 2 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);

      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.38);
    });
  }

  async function startLoadingExperience() {
    if (loadingStarted || !loadingScreen) return;

    loadingStarted = true;
    loadingStart?.setAttribute('aria-busy', 'true');
    loadingScreen.classList.add('is-loading');
    playLoadingSound();

    await wait(1850);
    loadingScreen.classList.add('is-complete');
    await wait(620);
    loadingScreen.setAttribute('aria-hidden', 'true');
    loadingScreen.remove();
  }

  function playYellowSound() {
    const context = getAudioContext();
    if (!context) return;

    try {
      const now = context.currentTime;
      const master = context.createGain();
      const compressor = context.createDynamicsCompressor();

      compressor.threshold.setValueAtTime(-18, now);
      compressor.knee.setValueAtTime(18, now);
      compressor.ratio.setValueAtTime(4, now);
      compressor.attack.setValueAtTime(0.004, now);
      compressor.release.setValueAtTime(0.28, now);

      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.4, now + 0.025);
      master.gain.setValueAtTime(0.4, now + 0.72);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 2.15);
      master.connect(compressor);
      compressor.connect(context.destination);

      // Ascenso rápido que anuncia la victoria.
      const melody = [392, 493.88, 587.33, 783.99, 987.77, 1174.66];
      melody.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + index * 0.11;

        oscillator.type = index < 3 ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.012, start + 0.28);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.19, start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.46);

        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(start);
        oscillator.stop(start + 0.5);
      });

      // Acorde final más lleno y reconocible como “ganaste”.
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + 0.72;

        oscillator.type = index % 2 === 0 ? 'sine' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.detune.setValueAtTime(index % 2 === 0 ? -3 : 3, start);

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.15, start + 0.035);
        gain.gain.setValueAtTime(0.12, start + 0.48);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.25);

        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(start);
        oscillator.stop(start + 1.3);
      });

      // Destellos agudos al cierre.
      [1567.98, 2093].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + 0.88 + index * 0.17;

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.08, start + 0.18);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.07, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);

        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(start);
        oscillator.stop(start + 0.36);
      });
    } catch (error) {
      console.warn('No fue posible reproducir el sonido amarillo.', error);
    }
  }

  async function playWinTransition() {
    playAudio(winAudio);
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

    redTransition.classList.remove('is-visible', 'is-handoff');
    redTransition.setAttribute('aria-hidden', 'true');
    greenFeedback.classList.remove('is-visible');
    winTransition.classList.remove('is-visible');
    winTransition.setAttribute('aria-hidden', 'true');
    scorePanel.classList.remove('is-visible');

    scene.classList.remove('route-active', 'journey-playing');
    resetPawnEraser();
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

  window.setTimeout(startLoadingExperience, 650);
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
