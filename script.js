// ── PARALLAX original ──
const parallax = document.querySelector(".parallax");
if (parallax) {
  window.addEventListener("scroll", () => {
    parallax.style.backgroundPositionY = window.pageYOffset * 0.3 + "px";
  });
}

// ── GSAP + ScrollTrigger ──
gsap.registerPlugin(ScrollTrigger);

// Acciones por defecto: las animaciones se reproducen al entrar
// y se REVIERTEN/REPITEN al volver a pasar por la sección (subir o bajar)
const TOGGLE = "restart reverse restart reverse";

// ── CURSOR personalizado ──
const cursorEl = document.getElementById('cursor');
window.addEventListener('mousemove', e => {
  cursorEl.style.transform = `translate(${e.clientX - 9}px, ${e.clientY - 9}px)`;
});

// Cursor crece sobre elementos clickeables
document.querySelectorAll('a, button, .dress-btn').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorEl.style.width = '32px';
    cursorEl.style.height = '32px';
    cursorEl.style.background = 'rgba(0,142,184,0.15)';
  });
  el.addEventListener('mouseleave', () => {
    cursorEl.style.width = '18px';
    cursorEl.style.height = '18px';
    cursorEl.style.background = 'transparent';
  });
});

// ── HEADER: mini tuercas de navegación ──
document.querySelectorAll('.mini-tuerca').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.querySelector(btn.dataset.target);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── HERO: título escala al scrollear ──
gsap.from(".hero h1", {
  opacity: 0,
  y: 40,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".hero",
    start: "top 80%",
    toggleActions: TOGGLE
  }
});

gsap.from(".dress-btn", {
  opacity: 0,
  scale: 0.7,
  duration: 1,
  ease: "back.out(1.7)",
  scrollTrigger: {
    trigger: ".hero",
    start: "top 80%",
    toggleActions: TOGGLE
  }
});

gsap.to(".hero", {
  scrollTrigger: {
    trigger: ".hero",
    start: "top top",
    end: "bottom top",
    scrub: true
  }
});

// ── FRANJA3: entrada desde arriba ──
gsap.from(".franja3 h1", {
  opacity: 0,
  y: -30,
  duration: 0.8,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".franja3",
    start: "top 90%",
    toggleActions: TOGGLE
  }
});

// ── PARALLAX: contenido aparece al scrollear ──
gsap.from(".overlay h2", {
  opacity: 0,
  x: -60,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".parallax",
    start: "top 70%",
    toggleActions: TOGGLE
  }
});

gsap.from(".logo", {
  opacity: 0,
  scale: 0.8,
  duration: 1,
  ease: "back.out(1.5)",
  scrollTrigger: {
    trigger: ".parallax",
    start: "top 60%",
    toggleActions: TOGGLE
  }
});

gsap.from(".contenido", {
  opacity: 0,
  x: 60,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".parallax",
    start: "top 50%",
    toggleActions: TOGGLE
  }
});

gsap.from(".edad", {
  opacity: 0,
  y: 30,
  duration: 0.8,
  scrollTrigger: {
    trigger: ".parallax",
    start: "center 60%",
    toggleActions: TOGGLE
  }
});

// ── SECCIÓN INFO: imagen desde izquierda, texto desde derecha ──
gsap.from(".info .columna-imagen", {
  opacity: 0,
  x: -80,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".info",
    start: "top 75%",
    toggleActions: TOGGLE
  }
});

gsap.from(".info .columna-texto", {
  opacity: 0,
  x: 80,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".info",
    start: "top 75%",
    toggleActions: TOGGLE
  }
});

gsap.from(".info .columna-texto h3", {
  opacity: 0,
  scale: 1.2,
  duration: 0.8,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".info",
    start: "top 70%",
    toggleActions: TOGGLE
  }
});

// ── AVANZA ──
gsap.from(".avanza .columna-imagen", {
  opacity: 0,
  x: -80,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".avanza",
    start: "top 75%",
    toggleActions: TOGGLE
  }
});

gsap.from(".avanza .columna-texto", {
  opacity: 0,
  x: 80,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".avanza",
    start: "top 75%",
    toggleActions: TOGGLE
  }
});

gsap.from(".avanza .columna-texto h3", {
  opacity: 0,
  scale: 1.3,
  duration: 0.9,
  ease: "back.out(1.5)",
  scrollTrigger: {
    trigger: ".avanza",
    start: "top 70%",
    toggleActions: TOGGLE
  }
});

// ── MOVIMIENTOS ──
gsap.from(".movimientos .columna-imagen2", {
  opacity: 0,
  x: -80,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".movimientos",
    start: "top 75%",
    toggleActions: TOGGLE
  }
});

gsap.from(".movimientos .columna-texto2 h3", {
  opacity: 0,
  y: 50,
  scale: 1.4,
  duration: 1,
  ease: "back.out(1.5)",
  scrollTrigger: {
    trigger: ".movimientos",
    start: "top 70%",
    toggleActions: TOGGLE
  }
});

gsap.from(".movimientos .columna-texto2 img", {
  opacity: 0,
  y: 30,
  duration: 0.9,
  delay: 0.2,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".movimientos",
    start: "top 65%",
    toggleActions: TOGGLE
  }
});

// ── ATAQUE ──
gsap.from(".ataque .columna-texto3 h3", {
  opacity: 0,
  scale: 1.4,
  duration: 1,
  ease: "back.out(1.5)",
  scrollTrigger: {
    trigger: ".ataque",
    start: "top 75%",
    toggleActions: TOGGLE
  }
});

gsap.from(".ataque .columna-texto3 img", {
  opacity: 0,
  y: 40,
  duration: 0.9,
  delay: 0.2,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".ataque",
    start: "top 70%",
    toggleActions: TOGGLE
  }
});

gsap.from(".ataque .columna-imagen3", {
  opacity: 0,
  x: 80,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".ataque",
    start: "top 75%",
    toggleActions: TOGGLE
  }
});

// ── GANAR ──
gsap.from(".Ganar .columna-imagen4", {
  opacity: 0,
  x: -80,
  duration: 1,
  ease: "power3.out",
  scrollTrigger: {
    trigger: ".Ganar",
    start: "top 75%",
    toggleActions: TOGGLE
  }
});

gsap.from(".Ganar .columna-texto4 h3", {
  opacity: 0,
  scale: 1.4,
  duration: 1,
  ease: "back.out(1.5)",
  scrollTrigger: {
    trigger: ".Ganar",
    start: "top 75%",
    toggleActions: TOGGLE
  }
});

gsap.from(".Ganar .columna-texto4 img", {
  opacity: 0,
  y: 30,
  duration: 0.9,
  delay: 0.2,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".Ganar",
    start: "top 70%",
    toggleActions: TOGGLE
  }
});

// ── FINAL: botones, título y galería ──
gsap.from(".final-texto h3", {
  opacity: 0,
  y: 40,
  scale: 1.2,
  duration: 1,
  ease: "back.out(1.5)",
  scrollTrigger: {
    trigger: ".final",
    start: "top 75%",
    toggleActions: TOGGLE
  }
});

gsap.from(".bttn1, .bttn3", {
  opacity: 0,
  scale: 0.7,
  duration: 0.8,
  stagger: 0.2,
  ease: "back.out(1.7)",
  scrollTrigger: {
    trigger: ".final",
    start: "top 70%",
    toggleActions: TOGGLE
  }
});
// ── Galería ──
const gallerySection =
    document.querySelector('.scroll-gallery-section');

const galleryTrack =
    document.querySelector('.gallery-track');

const galleryViewport =
    document.querySelector('.gallery-viewport');

window.addEventListener('scroll', () => {

    const start = gallerySection.offsetTop;
    const end =
        start +
        gallerySection.offsetHeight -
        window.innerHeight;

    let progress =
        (window.scrollY - start) /
        (end - start);

    progress = Math.max(
        0,
        Math.min(progress, 1)
    );

    const maxMove =
        galleryTrack.scrollWidth -
        galleryViewport.offsetWidth;

    galleryTrack.style.transform =
        `translateX(-${progress * maxMove}px)`;

});

const scrollFill =
document.querySelector(".scroll-fill");

window.addEventListener("scroll",()=>{

    const scrollTop =
    window.pageYOffset;

    const docHeight =
    document.documentElement.scrollHeight -
    window.innerHeight;

    const porcentaje =
    (scrollTop/docHeight)*100;

    scrollFill.style.height =
    porcentaje + "%";

});
// ── INFO-FINAL: columnas en cascada ──
gsap.from(".info-final .columna", {
  opacity: 0,
  y: 40,
  duration: 0.8,
  stagger: 0.2,
  ease: "power2.out",
  scrollTrigger: {
    trigger: ".info-final",
    start: "top 80%",
    toggleActions: TOGGLE
  }
});


