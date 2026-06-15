"use strict";

window.addEventListener("DOMContentLoaded", () => {
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

  if (hasGSAP && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ─────────────────────────────
     INTRO ESCRITA LETRA A LETRA
     Reproduce el efecto tipo slot-text sin depender de un bundler.
  ───────────────────────────── */
  const introScreen = document.getElementById("intro-screen");
  const introWord = document.getElementById("intro-word");
  const word = "ENRÚTATE";

  if (introWord) {
    introWord.textContent = "";
    [...word].forEach((character) => {
      const letter = document.createElement("span");
      letter.className = "intro-letter";
      letter.textContent = character;
      introWord.appendChild(letter);
    });
  }

  const finishIntro = () => {
    document.body.classList.remove("intro-active");
    if (introScreen) introScreen.remove();
    if (hasGSAP && hasScrollTrigger) ScrollTrigger.refresh();
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !hasGSAP) {
    window.setTimeout(finishIntro, 650);
  } else {
    const introTimeline = gsap.timeline({
      defaults: { ease: "power4.out" },
      onComplete: finishIntro
    });

    introTimeline
      .set(".intro-letter", {
        yPercent: -135,
        opacity: 0,
        rotateX: -90,
        filter: "blur(9px)"
      })
      .from(".intro-kicker", { opacity: 0, y: 14, duration: 0.45 })
      .to(".intro-letter", {
        yPercent: 0,
        opacity: 1,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 0.72,
        stagger: 0.11
      }, "-=0.18")
      .from(".intro-hint", { opacity: 0, y: 10, duration: 0.4 }, "-=0.18")
      .to(".intro-word", {
        letterSpacing: "0.02em",
        duration: 0.7,
        ease: "power2.inOut"
      }, "+=0.18")
      .to(".intro-screen", {
        clipPath: "circle(0% at 50% 50%)",
        duration: 0.95,
        ease: "power4.inOut"
      }, "+=0.12");
  }

  /* ─────────────────────────────
     CURSOR PERSONALIZADO
  ───────────────────────────── */
  const cursor = document.getElementById("cursor");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  if (cursor && finePointer) {
    window.addEventListener("mousemove", (event) => {
      cursor.style.transform = `translate(${event.clientX - 9}px, ${event.clientY - 9}px)`;
    });

    document.querySelectorAll("a, button, [data-action-card]").forEach((element) => {
      element.addEventListener("mouseenter", () => cursor.classList.add("is-hovering"));
      element.addEventListener("mouseleave", () => cursor.classList.remove("is-hovering"));
    });
  }

  /* ─────────────────────────────
     GALERÍA DE ACCIONES + HEADER
  ───────────────────────────── */
  const actionGallery = document.querySelector(".action-gallery");
  const actionCards = [...document.querySelectorAll("[data-action-card]")];
  let preferredAction = actionCards.find((card) => card.classList.contains("movimientos")) || actionCards[0];

  const positionActionCards = (activeCard) => {
    if (!activeCard || !actionCards.length) return;
    const activeIndex = actionCards.indexOf(activeCard);
    const total = actionCards.length;

    actionCards.forEach((item, index) => {
      item.classList.remove("is-expanded", "is-left", "is-center", "is-right");

      const offset = (index - activeIndex + total) % total;

      if (offset === 0) {
        item.classList.add("is-expanded", "is-center");
      } else if (offset === 1) {
        item.classList.add("is-right");
      } else {
        item.classList.add("is-left");
      }
    });
  };

  const expandActionCard = (card) => {
    if (!card) return;
    positionActionCards(card);
  };

  expandActionCard(preferredAction);

  // Usamos pointermove en el contenedor, en vez de mouseenter en cada tarjeta.
  // Así evitamos el bucle que se producía cuando las tarjetas se desplazaban
  // debajo de un cursor que estaba quieto.
  let hoveredAction = null;

  actionCards.forEach((card) => {
    card.addEventListener("focusin", () => {
      hoveredAction = card;
      expandActionCard(card);
    });

    card.addEventListener("click", () => {
      preferredAction = card;
      hoveredAction = card;
      expandActionCard(card);
    });
  });

  if (actionGallery) {
    actionGallery.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;

      const card = event.target.closest("[data-action-card]");
      if (!card || card === hoveredAction) return;

      hoveredAction = card;
      expandActionCard(card);
    });

    actionGallery.addEventListener("pointerleave", () => {
      hoveredAction = null;
      expandActionCard(preferredAction);
    });

    actionGallery.addEventListener("focusout", (event) => {
      if (!actionGallery.contains(event.relatedTarget)) {
        hoveredAction = null;
        expandActionCard(preferredAction);
      }
    });
  }

  document.querySelectorAll(".mini-tuerca").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.target);
      if (!target) return;

      if (target.matches("[data-action-card]")) {
        preferredAction = target;
        expandActionCard(target);
        document.querySelector(".action-gallery-section")?.scrollIntoView({ behavior: "smooth", block: "center" });

        if (window.innerWidth <= 820) {
          window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }), 350);
        }
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* ─────────────────────────────
     PROGRESO GENERAL
  ───────────────────────────── */
  const scrollFill = document.querySelector(".scroll-fill");

  const updateProgress = () => {
    if (!scrollFill) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    scrollFill.style.height = `${Math.min(100, Math.max(0, progress))}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* ─────────────────────────────
     REGLAS: DISCO Y CONTENEDOR QUE CAMBIA
  ───────────────────────────── */
  const rulesScroll = document.querySelector(".rules-scroll");
  const ruleCards = [...document.querySelectorAll(".rule-card")];
  const discSteps = [...document.querySelectorAll(".disc-step")];
  const ruleCurrent = document.getElementById("rule-current");
  const rulesDisc = document.querySelector(".rules-disc");
  let activeRule = 0;

  const setActiveRule = (nextIndex, animate = true) => {
    const index = Math.max(0, Math.min(ruleCards.length - 1, nextIndex));
    if (!ruleCards[index] || (index === activeRule && ruleCards[index].classList.contains("is-active"))) {
      return;
    }

    const previousCard = ruleCards[activeRule];
    const nextCard = ruleCards[index];
    const direction = index >= activeRule ? 1 : -1;

    ruleCards.forEach((card, cardIndex) => {
      const isActive = cardIndex === index;
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-hidden", String(!isActive));
    });

    discSteps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex === index);
    });

    if (ruleCurrent) ruleCurrent.textContent = String(index + 1).padStart(2, "0");

    if (hasGSAP && animate) {
      if (previousCard && previousCard !== nextCard) {
        gsap.fromTo(previousCard,
          { autoAlpha: 1, rotateY: 0, xPercent: 0, scale: 1 },
          { autoAlpha: 0, rotateY: 16 * direction, xPercent: -8 * direction, scale: 0.96, duration: 0.42, ease: "power2.in" }
        );
      }

      gsap.fromTo(nextCard,
        { autoAlpha: 0, rotateY: -20 * direction, xPercent: 10 * direction, scale: 0.94 },
        { autoAlpha: 1, rotateY: 0, xPercent: 0, scale: 1, duration: 0.7, ease: "power3.out", overwrite: true }
      );

      if (rulesDisc) {
        gsap.to(rulesDisc, {
          rotation: index * 120,
          duration: 0.8,
          ease: "back.out(1.35)",
          overwrite: true
        });
      }
    } else if (rulesDisc) {
      rulesDisc.style.transform = `rotate(${index * 120}deg)`;
    }

    activeRule = index;
  };

  // Estado inicial explícito.
  activeRule = -1;
  setActiveRule(0, false);

  if (rulesScroll && hasGSAP && hasScrollTrigger) {
    ScrollTrigger.create({
      trigger: rulesScroll,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const index = Math.min(ruleCards.length - 1, Math.floor(self.progress * ruleCards.length));
        if (index !== activeRule) setActiveRule(index, true);
      }
    });
  } else if (rulesScroll) {
    const updateRulesWithoutGSAP = () => {
      const rect = rulesScroll.getBoundingClientRect();
      const travel = rulesScroll.offsetHeight - window.innerHeight;
      const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      const index = Math.min(ruleCards.length - 1, Math.floor(progress * ruleCards.length));
      if (index !== activeRule) setActiveRule(index, false);
    };
    window.addEventListener("scroll", updateRulesWithoutGSAP, { passive: true });
  }

  discSteps.forEach((step, index) => {
    step.addEventListener("click", () => {
      if (!rulesScroll) return;
      const travel = rulesScroll.offsetHeight - window.innerHeight;
      const targetY = rulesScroll.offsetTop + (travel * index) / Math.max(1, ruleCards.length - 1);
      window.scrollTo({ top: targetY, behavior: "smooth" });
    });
  });

  /* ─────────────────────────────
     ANIMACIONES DE ENTRADA
  ───────────────────────────── */
  if (hasGSAP && hasScrollTrigger) {
    gsap.from(".hero-card", {
      y: 70,
      opacity: 0,
      rotation: -1.5,
      duration: 1.15,
      ease: "power3.out",
      delay: 0.2
    });

    gsap.utils.toArray(".action-card").forEach((card) => {
      gsap.from(card, {
        y: 90,
        rotation: 1.4,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 78%",
          toggleActions: "play none none reverse"
        }
      });

      const media = card.querySelector(".action-media img");
      if (media) {
        gsap.from(media, {
          rotation: -8,
          scale: 0.82,
          duration: 1.15,
          ease: "back.out(1.35)",
          scrollTrigger: {
            trigger: card,
            start: "top 72%",
            toggleActions: "play none none reverse"
          }
        });
      }
    });
  }

  /* ─────────────────────────────
     GALERÍA HORIZONTAL CONTROLADA POR SCROLL
  ───────────────────────────── */
  const gallerySection = document.querySelector(".scroll-gallery-section");
  const galleryStage = document.querySelector(".gallery-stage");
  const galleryTrack = document.querySelector(".gallery-track");

  if (gallerySection && galleryStage && galleryTrack) {
    const updateGallery = () => {
      const sectionRect = gallerySection.getBoundingClientRect();
      const travelY = gallerySection.offsetHeight - galleryStage.offsetHeight;
      const progress = travelY > 0 ? Math.min(1, Math.max(0, -sectionRect.top / travelY)) : 0;
      const maxX = Math.max(0, galleryTrack.scrollWidth - galleryStage.clientWidth);
      galleryTrack.style.transform = `translate3d(${-progress * maxX}px, 0, 0)`;
    };

    window.addEventListener("scroll", updateGallery, { passive: true });
    window.addEventListener("resize", updateGallery);
    window.addEventListener("load", updateGallery);
    updateGallery();
  }

  /* ─────────────────────────────
     AJUSTES AL CARGAR RECURSOS
  ───────────────────────────── */
  window.addEventListener("load", () => {
    if (hasGSAP && hasScrollTrigger) ScrollTrigger.refresh();
  });
});
