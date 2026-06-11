gsap.registerPlugin(ScrollTrigger);

// ── CURSOR ──
const cursor = document.getElementById('cursor');
window.addEventListener('mousemove', e => {
  cursor.style.transform = `translate(${e.clientX - 9}px, ${e.clientY - 9}px)`;
});

// ── TUERCA HERO gira infinito ──
gsap.to('#nut', {
  rotation: 360,
  repeat: -1,
  duration: 20,
  ease: 'none'
});

// ── HERO h1 escala al hacer scroll ──
gsap.from('#hero-title', {
  scale: 1.6,
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true
  }
});

// ── ORBIT rota con scroll ──
gsap.to('#orbit', {
  rotation: 360,
  scrollTrigger: {
    trigger: '.orbit-section',
    start: 'top center',
    end: 'bottom center',
    scrub: true
  }
});

// ── GIF se desliza horizontalmente (pinned) ──
// El track se pina mientras el scroll lo jala de izquierda a derecha
gsap.to('#gif-track', {
  x: () => -(document.getElementById('gif-track').scrollWidth - window.innerWidth + 120),
  ease: 'none',
  scrollTrigger: {
    trigger: '.gallery',
    start: 'top top',
    end: '+=1800',
    scrub: 1,
    pin: true
  }
});

// ── TOAST helper ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── OVERLAY helper ──
const overlay = document.getElementById('fx-overlay');
function flashOverlay(color, duration = 600) {
  overlay.style.background = color;
  setTimeout(() => overlay.style.background = 'transparent', duration);
}

// ── TUERCAS ──
let caosActivo = false;
let caosInterval = null;

function activarTuerca(tipo) {

  // ── POSITIVA ──
  if (tipo === 'positiva') {
    flashOverlay('rgba(154, 226, 115, 0.53)', 800);
    document.getElementById('hero-title').style.color = '#008eb8';
    document.getElementById('hero-title').style.letterSpacing = '8px';
    gsap.to('#nut', { scale: 1.4, duration: .3, yoyo: true, repeat: 1 });
    gsap.to('.hex', {
      scale: 1.3, stagger: .08, duration: .3,
      yoyo: true, repeat: 1, background: '#ffda54'
    });
    showToast('✦  CAMINO DESPEJADO');
    setTimeout(() => {
      document.getElementById('hero-title').style.color = '';
      document.getElementById('hero-title').style.letterSpacing = '';
      gsap.set('.hex', { background: '' });
    }, 3000);
  }

  // ── NEGATIVA ──
  if (tipo === 'negativa') {
    flashOverlay('rgba(248,113,113,0.3)', 500);
    gsap.to('body', {
      x: 10, duration: .05, repeat: 9, yoyo: true, ease: 'none',
      onComplete: () => gsap.set('body', { x: 0 })
    });
    gsap.to('.hex', {
      background: '#f87171', scale: .7,
      stagger: .05, duration: .2, yoyo: true, repeat: 1
    });
    gsap.to('#hero-title', { opacity: .2, duration: .15, yoyo: true, repeat: 3 });
    showToast('✕  RUTA BLOQUEADA');
  }

  // ── CAOS ──
  if (tipo === 'caos') {
    if (caosActivo) {
      // Apagar caos
      caosActivo = false;
      clearInterval(caosInterval);
      gsap.killTweensOf('.hex');
      gsap.killTweensOf('#nut');
      gsap.to('section', { y: 0, x: 0, rotation: 0, scale: 1, duration: .8, ease: 'elastic.out(1,.5)' });
      gsap.to('.hex', { background: null, rotation: 0, scale: 1, duration: .6 });
      gsap.to('#nut', { scale: 1, duration: .5 });
      document.body.style.filter = '';
      showToast('⟳  ORDEN RESTAURADO');
    } else {
      // Encender caos
      caosActivo = true;
      flashOverlay('rgba(139, 202, 250, 0.2)', 400);
      showToast('⟳  TODO SE MUEVE — APRIETA PARA PARAR');
      gsap.to('.hex', {
        rotation: 360, scale: 1.2, background: '#8bbbfa',
        stagger: { each: .1, repeat: -1, yoyo: true }, duration: .8
      });
      gsap.to('#nut', {
        scale: 1.15, rotation: '+=180',
        duration: 1, repeat: -1, yoyo: true, ease: 'sine.inOut'
      });
      caosInterval = setInterval(() => {
  gsap.to('section', {
    rotation: () => Math.random() * 20 - 10,  // ← grados de rotación
    transformOrigin: 'center center',
    duration: .4,
    ease: 'sine.inOut'
  });
}, 200);
      let hue = 0;
      const hueLoop = setInterval(() => {
        if (!caosActivo) { document.body.style.filter = ''; clearInterval(hueLoop); return; }
        hue = (hue + 2) % 360;
        document.body.style.filter = `hue-rotate(${hue}deg)`;
      }, 60);
    }
  }
}
