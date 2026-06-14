(() => {
  "use strict";

  /* =========================================================
     01. UTILIDADES Y CONFIGURACIÓN GENERAL
     ========================================================= */

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Textos y colores que utiliza el Laboratorio de piezas. */
  const stateCopy = {
    green: {
      label: "CAMINO DESPEJADO",
      description: "La pieza positiva expande el sistema y abre nuevas posibilidades de conexión.",
      color: "#68a932",
      toast: "Ruta positiva activada"
    },
    blue: {
      label: "SISTEMA EN MOVIMIENTO",
      description: "La pieza azul altera el ritmo, hace girar la composición y cambia la percepción del tablero.",
      color: "#008eb8",
      toast: "Movimiento activado"
    },
    red: {
      label: "RUTA INTERRUMPIDA",
      description: "La pieza roja introduce tensión, bloquea el paso y obliga a reconsiderar la ruta.",
      color: "#d93424",
      toast: "Bloqueo activado"
    }
  };

  let toastTimer = null;

  /* Espera a que el HTML esté listo antes de activar la experiencia. */
  document.addEventListener("DOMContentLoaded", init);

  /* 02. INICIO: conecta todas las funciones de la página. */
  function init() {
    if (hasGSAP && hasScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    initIntro();
    initCursor();
    initNavigation();
    initProgress();
    initChapterObserver();
    initHero();
    initRevealAnimations();
    initModeLaboratory();
    initRouteGame();
  }

  /* 03. PANTALLA DE ENTRADA: animación y apertura del sitio. */
  function initIntro() {
    const gate = $("#intro-gate");
    const enterButton = $("#enter-experience");
    const topbar = $("#topbar");

    if (!gate || !enterButton) return;

    document.body.classList.add("intro-is-open");

    const revealSite = () => {
      gate.setAttribute("aria-hidden", "true");
      document.body.classList.remove("intro-is-open");
      topbar?.classList.add("is-visible");

      if (hasGSAP && !prefersReducedMotion) {
        gsap.timeline({
          onComplete: () => gate.remove()
        })
          .to(".intro-gate__title span", {
            y: -45,
            opacity: 0,
            stagger: 0.07,
            duration: 0.55,
            ease: "power3.in"
          })
          .to(".intro-gate__eyebrow, .intro-gate__copy, #enter-experience", {
            opacity: 0,
            y: 15,
            duration: 0.35,
            ease: "power2.in"
          }, "<")
          .to(gate, {
            clipPath: "inset(0 0 100% 0)",
            duration: 0.85,
            ease: "power4.inOut"
          });
      } else {
        gate.remove();
      }
    };

    enterButton.addEventListener("click", revealSite);

    if (hasGSAP && !prefersReducedMotion) {
      gsap.from(".intro-gate__eyebrow", { opacity: 0, y: 15, duration: 0.6, delay: 0.15 });
      gsap.from(".intro-gate__title span", {
        opacity: 0,
        y: 42,
        stagger: 0.09,
        duration: 0.9,
        delay: 0.25,
        ease: "power4.out"
      });
      gsap.from(".intro-gate__copy, #enter-experience", {
        opacity: 0,
        y: 18,
        stagger: 0.1,
        duration: 0.65,
        delay: 0.7,
        ease: "power3.out"
      });
      gsap.to(".floating-piece", {
        rotation: "+=80",
        y: () => gsap.utils.random(-30, 30),
        x: () => gsap.utils.random(-18, 18),
        duration: () => gsap.utils.random(7, 12),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2
      });
    }
  }

  /* 04. CURSOR PERSONALIZADO: punto inmediato y aro con seguimiento. */
  function initCursor() {
    const dot = $("#cursor-dot");
    const ring = $("#cursor-ring");
    if (!dot || !ring || window.matchMedia("(pointer: coarse)").matches) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    // Posición visible desde el primer fotograma, antes del primer movimiento.
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;

    window.addEventListener("pointermove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    const follow = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(follow);
    };
    follow();

    document.addEventListener("pointerover", (event) => {
      if (event.target.closest("a, button, .route-node")) ring.classList.add("is-hovering");
    });

    document.addEventListener("pointerout", (event) => {
      if (event.target.closest("a, button, .route-node")) ring.classList.remove("is-hovering");
    });
  }

  /* 05. NAVEGACIÓN INTERNA: botones que llevan a cada sección. */
  function initNavigation() {
    $$('[data-scroll-target]').forEach((control) => {
      control.addEventListener("click", () => {
        const target = $(control.dataset.scrollTarget);
        target?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      });
    });
  }

  /* 06. BARRA DE PROGRESO: calcula cuánto se ha recorrido. */
  function initProgress() {
    const fill = $("#scroll-progress-fill");
    if (!fill) return;

    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* 07. CAPÍTULOS: destaca el punto lateral de la sección visible. */
  function initChapterObserver() {
    const sections = $$(".section-observe");
    const dots = $$(".chapter-dot");
    if (!sections.length || !dots.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const chapterIndex = Number(visible.target.dataset.chapter);
      dots.forEach((dot, index) => dot.classList.toggle("is-active", index === chapterIndex));
    }, { threshold: [0.22, 0.45, 0.7] });

    sections.forEach((section) => observer.observe(section));
  }

  /* 08. PORTADA: movimiento de la tuerca, piezas y parallax. */
  function initHero() {
    if (!hasGSAP || prefersReducedMotion) return;

    gsap.to("#hero-gear", {
      rotation: 360,
      duration: 24,
      repeat: -1,
      ease: "none"
    });

    gsap.to(".mini-piece", {
      rotation: "+=160",
      y: () => gsap.utils.random(-22, 22),
      x: () => gsap.utils.random(-12, 12),
      duration: () => gsap.utils.random(5, 9),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.12
    });

    gsap.from(".hero-title__line", {
      opacity: 0,
      yPercent: 85,
      stagger: 0.08,
      duration: 1,
      delay: 0.2,
      ease: "power4.out"
    });

    gsap.from(".hero-description, .hero .text-link, .hero .kicker", {
      opacity: 0,
      y: 20,
      stagger: 0.08,
      duration: 0.75,
      delay: 0.55,
      ease: "power3.out"
    });

    gsap.to(".hero-copy", {
      yPercent: 14,
      opacity: 0.55,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.to(".hero-board", {
      yPercent: -10,
      rotation: 7,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });
  }

  /* 09. ENTRADAS AL SCROLL: revela textos, botones y estrella. */
  function initRevealAnimations() {
    if (!hasGSAP || !hasScrollTrigger || prefersReducedMotion) return;

    $$(".reveal-group").forEach((group) => {
      gsap.from(group.children, {
        opacity: 0,
        y: 40,
        stagger: 0.1,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: group,
          start: "top 78%",
          toggleActions: "play none none reverse"
        }
      });
    });

    gsap.from(".mode-button", {
      opacity: 0,
      y: 45,
      stagger: 0.1,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".mode-controls",
        start: "top 84%",
        toggleActions: "play none none reverse"
      }
    });

    gsap.from(".closing-star", {
      scale: 0.3,
      rotation: -75,
      opacity: 0,
      duration: 1.2,
      ease: "back.out(1.8)",
      scrollTrigger: {
        trigger: ".closing",
        start: "top 65%",
        toggleActions: "play none none reverse"
      }
    });
  }

  /* 10. LABORATORIO: comportamiento visual verde, azul y rojo. */
  function initModeLaboratory() {
    const buttons = $$(".mode-button");
    const core = $("#mode-core");
    const label = $("#mode-label");
    const description = $("#mode-description");
    const stage = $("#mode-stage");

    if (!buttons.length || !core || !label || !stage) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const mode = button.dataset.mode;
        const copy = stateCopy[mode];
        if (!copy) return;

        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
        label.textContent = copy.label;
        if (description) description.textContent = copy.description;
        core.style.background = copy.color;
        showToast(copy.toast);

        if (!hasGSAP || prefersReducedMotion) return;

        gsap.killTweensOf(core);
        gsap.killTweensOf(stage);
        gsap.killTweensOf(".mode-stage__halo");

        if (mode === "green") {
          gsap.fromTo(core,
            { scale: 0.82, rotation: -18 },
            { scale: 1.14, rotation: 45, duration: 0.75, ease: "back.out(1.7)" }
          );
          gsap.to(core, { scale: 1, rotation: 0, duration: 0.8, delay: 0.6, ease: "elastic.out(1, .5)" });
          gsap.fromTo(".mode-stage__halo", { scale: 0.72, opacity: 0.2 }, { scale: 1.1, opacity: 1, duration: 0.9, ease: "power3.out" });
        }

        if (mode === "blue") {
          gsap.fromTo(core,
            { rotation: 0, scale: 0.95 },
            { rotation: 360, scale: 1.05, duration: 1.15, ease: "power2.inOut" }
          );
          gsap.to(".mode-stage__halo", { rotation: 180, duration: 1.15, ease: "power2.inOut" });
        }

        if (mode === "red") {
          gsap.fromTo(stage,
            { x: -10 },
            { x: 10, duration: 0.06, repeat: 9, yoyo: true, ease: "none", onComplete: () => gsap.set(stage, { x: 0 }) }
          );
          gsap.fromTo(core,
            { scale: 1.08 },
            { scale: 0.88, duration: 0.22, repeat: 1, yoyo: true, ease: "power2.inOut" }
          );
        }
      });
    });
  }

  /* =========================================================
     11. JUEGO DE RUTA: tablero, colores, peón, puntaje y meta
     ========================================================= */
  function initRouteGame() {
    const routeSection = $("#ruta");
    const routeShell = $(".route-shell");
    const routeTrack = $("#route-track");
    const nodesLayer = $("#route-nodes");
    const linesSvg = $("#route-lines");
    const pawn = $("#route-pawn");
    const goal = $("#route-goal");
    const connectedCount = $("#connected-count");
    const score = $("#route-score");
    const message = $("#route-message");
    const resetButton = $("#route-reset");
    const hintButton = $("#route-demo");
    const closingTitle = $("#closing-title");
    const closingCopy = $("#closing-copy");

    if (!routeSection || !routeShell || !routeTrack || !nodesLayer || !linesSvg || !pawn || !goal) return;

    // Cuatro decisiones. Cada una presenta exactamente tres caminos.
    const nodeData = [
      { id: 0,  x: 4.2,  y: 50, state: "green", color: "green", locked: true, kind: "start" },

      { id: 1,  x: 12.5, y: 25, state: "hidden", color: null, kind: "choice" },
      { id: 2,  x: 12.5, y: 50, state: "hidden", color: null, kind: "choice" },
      { id: 3,  x: 12.5, y: 75, state: "hidden", color: null, kind: "choice" },
      { id: 4,  x: 22.5, y: 50, state: "hidden", color: "green", kind: "junction" },

      { id: 5,  x: 32.5, y: 25, state: "hidden", color: null, kind: "choice" },
      { id: 6,  x: 32.5, y: 50, state: "hidden", color: null, kind: "choice" },
      { id: 7,  x: 32.5, y: 75, state: "hidden", color: null, kind: "choice" },
      { id: 8,  x: 42.5, y: 50, state: "hidden", color: "green", kind: "junction" },

      { id: 9,  x: 52.5, y: 25, state: "hidden", color: null, kind: "choice" },
      { id: 10, x: 52.5, y: 50, state: "hidden", color: null, kind: "choice" },
      { id: 11, x: 52.5, y: 75, state: "hidden", color: null, kind: "choice" },
      { id: 12, x: 62.5, y: 50, state: "hidden", color: "green", kind: "junction" },

      { id: 13, x: 72.5, y: 25, state: "hidden", color: null, kind: "choice" },
      { id: 14, x: 72.5, y: 50, state: "hidden", color: null, kind: "choice" },
      { id: 15, x: 72.5, y: 75, state: "hidden", color: null, kind: "choice" },
      { id: 16, x: 82.5, y: 50, state: "hidden", color: "green", kind: "junction" },
      { id: 17, x: 91.5, y: 50, state: "hidden", color: "green", kind: "finish" }
    ];

    const choiceGroups = [
      [1, 2, 3],
      [5, 6, 7],
      [9, 10, 11],
      [13, 14, 15]
    ];

    const junctions = [4, 8, 12, 16];

    // Cada trío se abre desde un punto verde y vuelve a converger en otro.
    const edges = [
      [0, 1], [0, 2], [0, 3],
      [1, 4], [2, 4], [3, 4],

      [4, 5], [4, 6], [4, 7],
      [5, 8], [6, 8], [7, 8],

      [8, 9], [8, 10], [8, 11],
      [9, 12], [10, 12], [11, 12],

      [12, 13], [12, 14], [12, 15],
      [13, 16], [14, 16], [15, 16],

      [16, 17]
    ];

    const adjacency = new Map(nodeData.map((node) => [node.id, []]));
    const nodeElements = new Map();
    const lineElements = [];
    let effectTimers = [];
    let routeWon = false;
    let effectRunning = false;

    edges.forEach(([a, b]) => {
      adjacency.get(a).push(b);
      adjacency.get(b).push(a);
    });

    generateRound();

    linesSvg.setAttribute("viewBox", "0 0 100 100");
    linesSvg.setAttribute("preserveAspectRatio", "none");

    edges.forEach(([a, b], index) => {
      const start = nodeData[a];
      const end = nodeData[b];
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", start.x);
      line.setAttribute("y1", start.y);
      line.setAttribute("x2", end.x);
      line.setAttribute("y2", end.y);
      line.setAttribute("vector-effect", "non-scaling-stroke");
      line.classList.add("route-line");
      line.dataset.edge = String(index);
      line.dataset.a = String(a);
      line.dataset.b = String(b);
      linesSvg.appendChild(line);
      lineElements.push(line);
    });

    nodeData.forEach((node, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "route-node";
      button.dataset.nodeId = String(node.id);
      button.dataset.state = node.state;
      button.dataset.kind = node.kind;
      button.style.left = `${node.x}%`;
      button.style.top = `${node.y}%`;

      if (node.locked) {
        button.classList.add("is-start", "is-connected");
        button.setAttribute("aria-label", "Pieza inicial conectada");
      } else if (node.kind === "choice") {
        button.setAttribute("aria-label", `Opción de camino ${index + 1}, oculta.`);
        button.addEventListener("click", () => revealNode(node, button));
      } else {
        button.classList.add("is-junction");
        button.disabled = true;
        button.setAttribute("aria-label", "Punto de unión del camino");
      }

      nodesLayer.appendChild(button);
      nodeElements.set(node.id, button);
    });

    resetButton?.addEventListener("click", resetRoute);
    hintButton?.addEventListener("click", showGreenHint);

    updateRoute({ announce: false, move: true });
    initHorizontalScroll();

    /* Mezcla los colores para que cambien de posición al reiniciar. */
    function shuffle(values) {
      const result = [...values];
      for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
      }
      return result;
    }

    /* Prepara una ronda: en cada grupo hay verde, azul y rojo. */
    function generateRound() {
      nodeData.forEach((node) => {
        if (node.locked) {
          node.state = "green";
          node.color = "green";
          return;
        }

        node.state = "hidden";
        if (node.kind === "choice") node.color = null;
        if (node.kind === "junction" || node.kind === "finish") node.color = "green";
      });

      // En cada grupo hay siempre una verde, una azul y una roja.
      choiceGroups.forEach((group) => {
        const colors = shuffle(["green", "blue", "red"]);
        group.forEach((id, optionIndex) => {
          nodeData[id].color = colors[optionIndex];
        });
      });
    }

    /* Revela la opción elegida por la persona. */
    function revealNode(node, button) {
      if (effectRunning || node.state !== "hidden" || node.kind !== "choice") return;

      const connectedBefore = getConnectedGreenNodes();
      const frontier = getFrontierNodes(connectedBefore);

      if (!frontier.has(node.id)) {
        showToast("Elige una de las tres opciones iluminadas");
        message.textContent = "Solo puedes descubrir las tres piezas del tramo activo.";
        pulseUnavailable(button);
        return;
      }

      clearEffectTimers();
      node.state = node.color;
      setNodeVisual(node, button);

      if (node.state === "green") {
        completeChoiceGroup(node, button);
        return;
      }

      updateRoute({ announce: false, move: false });
      const fallback = getFarthestConnectedNode(connectedBefore);

      if (node.state === "blue") {
        triggerBluePiece(node, button, fallback);
      } else {
        triggerRedPiece(button);
      }
    }

    /* Al elegir verde, conecta el tramo y habilita el siguiente trío. */
    function completeChoiceGroup(node, button) {
      const groupIndex = choiceGroups.findIndex((group) => group.includes(node.id));
      if (groupIndex < 0) return;

      const group = choiceGroups[groupIndex];
      const junction = nodeData[junctions[groupIndex]];

      // Al acertar la verde se revelan también las otras dos opciones del trío.
      group.forEach((id, optionIndex) => {
        const option = nodeData[id];
        const optionElement = nodeElements.get(id);
        if (!optionElement) return;

        if (option.state === "hidden") {
          option.state = option.color;
          setNodeVisual(option, optionElement);
          if (hasGSAP && !prefersReducedMotion) {
            gsap.fromTo(optionElement,
              { scale: 0.72, rotation: option.color === "blue" ? -90 : 18 },
              { scale: 1, rotation: 0, duration: 0.5, delay: optionIndex * 0.07, ease: "back.out(2)" }
            );
          }
        }
      });

      animateReveal(button, "green");

      // El punto de unión se activa automáticamente y abre el siguiente trío.
      junction.state = "green";
      const junctionElement = nodeElements.get(junction.id);
      if (junctionElement) {
        setNodeVisual(junction, junctionElement);
        junctionElement.classList.add("is-junction");
      }

      // En la última decisión, la conexión final a la estrella también se activa.
      if (groupIndex === choiceGroups.length - 1) {
        const finish = nodeData[17];
        finish.state = "green";
        const finishElement = nodeElements.get(17);
        if (finishElement) setNodeVisual(finish, finishElement);
      }

      updateRoute({ announce: true, move: true });

      if (!routeWon) {
        message.textContent = `Tramo ${groupIndex + 1} superado: se reveló una verde, una azul y una roja. Ahora elige entre las siguientes tres opciones.`;
        showToast("Verde · Se abre el siguiente trío");
      }
    }

    function setNodeVisual(node, button) {
      button.dataset.state = node.state;
      button.disabled = true;
      button.classList.remove("is-available", "is-hint");
      button.setAttribute("aria-label", `Pieza ${node.id + 1}. Estado ${translateState(node.state)}.`);
    }

    function animateReveal(button, color) {
      if (!hasGSAP || prefersReducedMotion) return;

      const rotation = color === "green" ? 45 : color === "blue" ? 180 : -18;
      gsap.fromTo(button,
        { rotation: -rotation, scale: 0.72 },
        { rotation: 0, scale: 1, duration: 0.58, ease: "back.out(2.2)" }
      );
    }

    /* Azul: mueve el peón y hace girar las piezas del tablero. */
    function triggerBluePiece(node, button, fallback) {
      effectRunning = true;
      routeShell.classList.add("is-blue-event");
      updateRoute({ announce: false, move: false });
      message.textContent = "Caíste en azul: las piezas giran. Después podrás probar una de las otras dos opciones.";
      showToast("Azul · Todo se mueve");

      movePawn(node, 0.42);

      const startSpin = window.setTimeout(() => {
        if (hasGSAP && !prefersReducedMotion) {
          const pieces = [...nodeElements.values()];
          gsap.fromTo(button,
            { scale: 0.85 },
            { scale: 1.18, duration: 0.22, repeat: 1, yoyo: true, ease: "power2.inOut" }
          );
          gsap.to(pieces, {
            rotation: "+=360",
            duration: 0.95,
            stagger: { each: 0.025, from: "center" },
            ease: "power2.inOut"
          });
          gsap.fromTo(".route-grid",
            { opacity: 0.8, scale: 1.04 },
            { opacity: 0.4, scale: 1, duration: 1, ease: "power2.out" }
          );
        }
      }, prefersReducedMotion ? 0 : 280);

      const returnPawn = window.setTimeout(() => {
        movePawn(fallback, 0.55, () => {
          effectRunning = false;
          routeShell.classList.remove("is-blue-event");
          updateRoute({ announce: false, move: false });
          message.textContent = "La opción azul hizo girar el tablero. Elige una de las opciones restantes del mismo trío.";
        });
      }, prefersReducedMotion ? 350 : 1450);

      effectTimers.push(startSpin, returnPawn);
    }

    /* Rojo: bloquea la opción y reproduce una vibración de alerta. */
    function triggerRedPiece(button) {
      message.textContent = "La opción roja bloqueó ese camino. Aún puedes probar las otras opciones del trío.";
      showToast("Rojo · Camino bloqueado");

      if (hasGSAP && !prefersReducedMotion) {
        gsap.fromTo(button,
          { x: -8, rotation: -7 },
          { x: 8, rotation: 7, duration: 0.07, repeat: 7, yoyo: true, ease: "none",
            onComplete: () => gsap.set(button, { x: 0, rotation: 0 }) }
        );
        gsap.fromTo(routeShell,
          { boxShadow: "inset 0 0 0 0 rgba(217,52,36,0)" },
          { boxShadow: "inset 0 0 0 8px rgba(217,52,36,0.18)", duration: 0.18, repeat: 1, yoyo: true }
        );
      }
    }

    function pulseUnavailable(button) {
      if (!hasGSAP || prefersReducedMotion) return;
      gsap.fromTo(button,
        { scale: 1 },
        { scale: 0.88, duration: 0.12, repeat: 1, yoyo: true, ease: "power2.inOut" }
      );
    }

    /* Busca todas las piezas verdes conectadas desde el inicio. */
    function getConnectedGreenNodes() {
      const connected = new Set();
      const queue = [];

      if (nodeData[0].state !== "green") return connected;

      connected.add(0);
      queue.push(0);

      while (queue.length) {
        const current = queue.shift();
        adjacency.get(current).forEach((neighbor) => {
          if (!connected.has(neighbor) && nodeData[neighbor].state === "green") {
            connected.add(neighbor);
            queue.push(neighbor);
          }
        });
      }

      return connected;
    }

    function getFrontierNodes(connected) {
      const frontier = new Set();
      connected.forEach((id) => {
        adjacency.get(id).forEach((neighbor) => {
          const candidate = nodeData[neighbor];
          if (candidate.state === "hidden" && candidate.kind === "choice") frontier.add(neighbor);
        });
      });
      return frontier;
    }

    function getFarthestConnectedNode(connected) {
      return [...connected]
        .map((id) => nodeData[id])
        .sort((a, b) => b.x - a.x)[0] || nodeData[0];
    }

    /* Actualiza disponibilidad, líneas, puntaje, peón y condición de victoria. */
    function updateRoute({ announce = false, move = true } = {}) {
      const connected = getConnectedGreenNodes();
      const frontier = getFrontierNodes(connected);

      nodeData.forEach((node) => {
        const element = nodeElements.get(node.id);
        if (!element) return;

        const isConnected = connected.has(node.id);
        const isAvailable = node.kind === "choice" && node.state === "hidden" && frontier.has(node.id);
        element.classList.toggle("is-connected", isConnected);
        element.classList.toggle("is-available", isAvailable);

        if (node.kind === "choice") {
          element.disabled = node.state !== "hidden" || !isAvailable || effectRunning;
          if (node.state === "hidden") {
            element.setAttribute(
              "aria-label",
              isAvailable
                ? `Opción ${node.id + 1} oculta y disponible. Haz clic para descubrirla.`
                : `Opción ${node.id + 1} oculta. Completa el tramo anterior para habilitarla.`
            );
          }
        } else {
          element.disabled = true;
        }
      });

      lineElements.forEach((line) => {
        const a = Number(line.dataset.a);
        const b = Number(line.dataset.b);
        const bothGreen = nodeData[a].state === "green" && nodeData[b].state === "green";
        const connectedLine = connected.has(a) && connected.has(b);
        line.classList.toggle("is-green", bothGreen);
        line.classList.toggle("is-connected", connectedLine);
      });

      const farthest = getFarthestConnectedNode(connected);
      if (move && !effectRunning) movePawn(farthest);

      if (connectedCount) connectedCount.textContent = String(connected.size);
      if (score) score.textContent = String(Math.max(0, connected.size - 1) * 10);

      const wonNow = connected.has(17);
      goal.classList.toggle("is-active", wonNow);

      if (wonNow) {
        message.textContent = "¡Ruta completada! Elegiste la opción verde de cada trío y llegaste a la estrella.";
        closingTitle.textContent = "Encontraste la opción verde en cada decisión.";
        closingCopy.textContent = "Cada tramo ofrecía tres caminos: uno verde, uno azul y uno rojo. Reinicia para cambiar sus posiciones.";

        if (!routeWon || announce) {
          celebrateGoal();
          showToast(`Ruta completada · +${Math.max(0, connected.size - 1) * 10} puntos`);
        }
        routeWon = true;
        return;
      }

      routeWon = false;
      closingTitle.innerHTML = "No existe una única ruta.<br>Existe la que logras construir.";
      closingCopy.textContent = "Puedes volver al tablero, probar otra combinación y observar cómo cambia el recorrido.";

      if (!announce || effectRunning) return;

      const availableCount = frontier.size;
      if (availableCount === 3) {
        message.textContent = "Tienes tres opciones: una verde, una azul y una roja. Elige una para revelar su color.";
      } else if (availableCount > 0) {
        message.textContent = `Quedan ${availableCount} opciones ocultas en este trío. Una de ellas abre el camino.`;
      }
    }

    function movePawn(node, duration = 0.75, onComplete) {
      const left = `${node.x}%`;
      const top = `${node.y}%`;

      if (hasGSAP && !prefersReducedMotion) {
        gsap.to(pawn, {
          left,
          top,
          duration,
          ease: "power3.inOut",
          onComplete
        });
        gsap.fromTo(pawn,
          { y: -10 },
          { y: 0, duration: Math.min(0.34, duration / 2), repeat: 1, yoyo: true, ease: "sine.inOut" }
        );
      } else {
        pawn.style.left = left;
        pawn.style.top = top;
        if (typeof onComplete === "function") onComplete();
      }
    }

    function celebrateGoal() {
      if (!hasGSAP || prefersReducedMotion) return;

      gsap.fromTo(goal,
        { scale: 0.65, rotation: -25 },
        { scale: 1.25, rotation: 10, duration: 0.9, ease: "elastic.out(1, .45)" }
      );
      gsap.to(".route-node.is-connected", {
        scale: 1.14,
        stagger: 0.05,
        duration: 0.22,
        repeat: 1,
        yoyo: true,
        ease: "power2.inOut"
      });
    }

    /* Reinicia colores, piezas, puntaje y posición del peón. */
    function resetRoute() {
      clearEffectTimers();
      effectRunning = false;
      routeShell.classList.remove("is-blue-event");
      generateRound();

      nodeData.forEach((node) => {
        const element = nodeElements.get(node.id);
        if (!element) return;
        element.dataset.state = node.state;
        element.classList.remove("is-hint", "is-available", "is-connected");
        element.setAttribute(
          "aria-label",
          node.locked
            ? "Pieza inicial conectada"
            : node.kind === "choice"
              ? `Opción ${node.id + 1} oculta.`
              : "Punto de unión del camino"
        );
      });

      if (hasGSAP) {
        gsap.killTweensOf([...nodeElements.values()]);
        gsap.set([...nodeElements.values()], { rotation: 0, scale: 1, x: 0 });
      }

      routeWon = false;
      message.textContent = "Tienes tres opciones: una verde, una azul y una roja. Elige una para revelar su color.";
      updateRoute({ announce: false, move: true });
      showToast("Nueva combinación de tres caminos preparada");
    }

    /* Destaca temporalmente la opción verde del grupo activo. */
    function showGreenHint() {
      if (effectRunning) return;

      const connected = getConnectedGreenNodes();
      const frontier = [...getFrontierNodes(connected)];
      const greenOption = frontier.find((id) => nodeData[id].color === "green");

      if (greenOption === undefined) {
        showToast(routeWon ? "La ruta ya está completa" : "Continúa con el siguiente trío");
        return;
      }

      const element = nodeElements.get(greenOption);
      if (!element) return;

      element.classList.add("is-hint");
      showToast("La opción verde está vibrando");
      message.textContent = "Pista: una de las tres piezas disponibles está pulsando.";

      if (hasGSAP && !prefersReducedMotion) {
        gsap.fromTo(element,
          { scale: 1 },
          { scale: 1.2, duration: 0.28, repeat: 3, yoyo: true, ease: "sine.inOut" }
        );
      }

      const timer = window.setTimeout(() => element.classList.remove("is-hint"), 1800);
      effectTimers.push(timer);
    }

    function clearEffectTimers() {
      effectTimers.forEach((timer) => window.clearTimeout(timer));
      effectTimers = [];
    }

    /* Convierte el scroll vertical en desplazamiento horizontal del tablero. */
    function initHorizontalScroll() {
      if (!hasGSAP || !hasScrollTrigger || prefersReducedMotion) return;

      const getDistance = () => Math.max(0, routeTrack.scrollWidth - window.innerWidth);

      gsap.to(routeTrack, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: routeSection,
          start: "top top",
          end: () => `+=${getDistance()}`,
          scrub: 0.8,
          pin: routeShell,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
    }
  }
  /* 12. UTILIDADES FINALES: traducción de estados y mensajes toast. */
  function translateState(state) {
    const labels = {
      hidden: "oculto",
      green: "verde",
      blue: "azul",
      red: "rojo"
    };
    return labels[state] || state;
  }

  function showToast(text) {
    const toast = $("#toast");
    if (!toast) return;

    window.clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }
})();
