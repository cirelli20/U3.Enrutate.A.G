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
    if (activeIndex === -1) return;

    const total = actionCards.length;
    const leftIndex = (activeIndex - 1 + total) % total;
    const rightIndex = (activeIndex + 1) % total;

    actionCards.forEach((item) => {
      item.classList.remove("is-expanded", "is-left", "is-center", "is-right");
    });

    actionCards[activeIndex].classList.add("is-expanded", "is-center");

    if (total > 1) {
      actionCards[leftIndex].classList.add("is-left");
    }

    if (total > 2) {
      actionCards[rightIndex].classList.add("is-right");
    }
  };

  const expandActionCard = (card) => {
    if (!card) return;
    positionActionCards(card);
  };

  expandActionCard(preferredAction);

  // La posición de las tarjetas cambia únicamente al hacer clic.
  // El hover puede conservar el zoom visual definido en CSS,
  // pero ya no modifica is-left, is-center ni is-right.
  actionCards.forEach((card) => {
    card.addEventListener("click", () => {
      preferredAction = card;
      expandActionCard(card);
    });
  });

  document.querySelectorAll(".header-action").forEach((button) => {
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
     REGLAS: TARJETAS INDEPENDIENTES + ÍNDICE LATERAL
  ───────────────────────────── */
  const ruleCards = [...document.querySelectorAll(".rule-card")];
  const discSteps = [...document.querySelectorAll(".disc-step")];
  let activeRule = 0;

  const setActiveRule = (nextIndex) => {
    const index = Math.max(0, Math.min(ruleCards.length - 1, nextIndex));
    activeRule = index;

    ruleCards.forEach((card, cardIndex) => {
      card.classList.toggle("is-active", cardIndex === index);
    });

    discSteps.forEach((step, stepIndex) => {
      step.classList.toggle("is-active", stepIndex === index);
      step.setAttribute("aria-current", stepIndex === index ? "step" : "false");
    });
  };

  setActiveRule(0);

  discSteps.forEach((step, index) => {
    step.addEventListener("click", () => {
      const targetCard = ruleCards[index];
      if (!targetCard) return;
      setActiveRule(index);
      targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  // El índice cambia según la tarjeta que se encuentre en el centro de la pantalla.
  if ("IntersectionObserver" in window) {
    const ruleObserver = new IntersectionObserver((entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visibleEntries.length) return;
      const index = ruleCards.indexOf(visibleEntries[0].target);
      if (index >= 0 && index !== activeRule) setActiveRule(index);
    }, {
      root: null,
      rootMargin: "-24% 0px -42% 0px",
      threshold: [0.12, 0.3, 0.5, 0.7]
    });

    ruleCards.forEach((card) => ruleObserver.observe(card));
  } else {
    const updateActiveRule = () => {
      const viewportCenter = window.innerHeight * 0.48;
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      ruleCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - viewportCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      if (nearestIndex !== activeRule) setActiveRule(nearestIndex);
    };

    window.addEventListener("scroll", updateActiveRule, { passive: true });
    updateActiveRule();
  }

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

    // IMPORTANTE: no animamos transform, y ni rotation en las tarjetas.
    // Esas propiedades las usa el CSS para posicionar is-left, is-center e is-right.
    gsap.utils.toArray(".action-card").forEach((card) => {
      gsap.fromTo(card,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".action-gallery",
            start: "top 78%",
            toggleActions: "play none none reverse"
          }
        }
      );

      const media = card.querySelector(".action-media img");
      if (media) {
        gsap.from(media, {
          rotation: -8,
          scale: 0.82,
          duration: 1.15,
          ease: "back.out(1.35)",
          scrollTrigger: {
            trigger: ".action-gallery",
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
      const inicioAnticipado = window.innerHeight * 0.45;

const progress = travelY > 0
  ? Math.min(
      1,
      Math.max(
        0,
        (inicioAnticipado - sectionRect.top) /
        (travelY + inicioAnticipado)
      )
    )
  : 0;
      const maxX = Math.max(0, galleryTrack.scrollWidth - galleryStage.clientWidth);
      galleryTrack.style.transform = `translate3d(${-progress * maxX}px, 0, 0)`;
    };

    window.addEventListener("scroll", updateGallery, { passive: true });
    window.addEventListener("resize", updateGallery);
    window.addEventListener("load", updateGallery);
    updateGallery();
  }
/* VIDEO COMERCIAL DE YOUTUBE */
const youtubePlayer = document.querySelector(".youtube-player");

if (youtubePlayer) {
  const playYoutubeVideo = () => {
    if (youtubePlayer.classList.contains("is-playing")) return;

    const videoId = youtubePlayer.dataset.videoId;
    const iframe = document.createElement("iframe");

    iframe.src =
      `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&controls=1`;

    iframe.title = "Video comercial de Enrútate";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    youtubePlayer.classList.add("is-playing");
    youtubePlayer.innerHTML = "";
    youtubePlayer.appendChild(iframe);
  };

  youtubePlayer.addEventListener("click", playYoutubeVideo);

  youtubePlayer.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      playYoutubeVideo();
    }
  });
}
  /* ─────────────────────────────
     AJUSTES AL CARGAR RECURSOS
  ───────────────────────────── */
  window.addEventListener("load", () => {
    if (hasGSAP && hasScrollTrigger) ScrollTrigger.refresh();
  });
  
});
