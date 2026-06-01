/* ================================================================
   SHESHAGIRI RB — F1 ENGINEERING PORTFOLIO
   script.js — Complete JavaScript Architecture
   ================================================================ */

'use strict';

/* ================================================================
   MODULE 1 — STATE & INIT
   ================================================================ */
const Portfolio = {
  state: {
    scrollY: 0,
    mouseX: 0,
    mouseY: 0,
    heroVisible: true,
    prefersReducedMotion: false,
    canvasRafId: null,
    cursorRafId: null,
    tlGrown: false,
  },
  init() {
    this.state.prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    Loading.init();
    ScrollEngine.init();
    Hamburger.init();
    Cursor.init();
    Canvas.init();
    SpeedLines.init();
    Typewriter.init();
    Observers.init();
    Form.init();
    Lightbox.init();
  }
};

/* ================================================================
   MODULE 2 — LOADING SCREEN
   ================================================================ */
const Loading = {
  init() {
    const screen = document.getElementById('loading-screen');
    if (!screen) return;
    window.addEventListener('load', () => {
      setTimeout(() => {
        screen.classList.add('hide');
        setTimeout(() => { screen.style.display = 'none'; }, 900);
      }, 2300);
    });
  }
};

/* ================================================================
   MODULE 3 — SCROLL ENGINE (single merged listener)
   ================================================================ */
const ScrollEngine = {
  ticking: false,
  init() {
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
  },
  onScroll() {
    Portfolio.state.scrollY = window.scrollY;
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.updateProgress();
        this.updateBackTop();
        this.updateNavShadow();
        this.updateActiveNav();
        this.ticking = false;
      });
      this.ticking = true;
    }
  },
  updateProgress() {
    const d = document.documentElement;
    const pct = (d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100;
    const el = document.getElementById('scroll-progress');
    if (el) el.style.width = pct + '%';
  },
  updateBackTop() {
    const btn = document.getElementById('back-top');
    if (!btn) return;
    btn.classList.toggle('visible', Portfolio.state.scrollY > 400);
  },
  updateNavShadow() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    nav.classList.toggle('scrolled', Portfolio.state.scrollY > 50);
  },
  updateActiveNav() {
    const secs = document.querySelectorAll('section[id]');
    const navAs = document.querySelectorAll('.nav-links a');
    let current = '';
    secs.forEach(s => {
      if (Portfolio.state.scrollY >= s.offsetTop - 200) current = s.id;
    });
    navAs.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }
};

/* ================================================================
   MODULE 4 — HAMBURGER MENU
   ================================================================ */
const Hamburger = {
  btn: null,
  menu: null,
  init() {
    this.btn  = document.getElementById('hamburger');
    this.menu = document.getElementById('mobile-menu');
    if (!this.btn || !this.menu) return;
    this.btn.addEventListener('click', this.toggle.bind(this));
    // close on outside click
    document.addEventListener('click', (e) => {
      if (!this.btn.contains(e.target) && !this.menu.contains(e.target)) {
        this.close();
      }
    });
  },
  toggle() {
    const open = this.menu.classList.toggle('open');
    this.btn.setAttribute('aria-expanded', open);
  },
  close() {
    this.menu.classList.remove('open');
    this.btn.setAttribute('aria-expanded', 'false');
  }
};

// Exposed globally for onclick handlers in HTML
function closeMobile() { Hamburger.close(); }

/* ================================================================
   MODULE 5 — CUSTOM CURSOR (pointer devices only)
   ================================================================ */
const Cursor = {
  dot: null,
  ring: null,
  mx: 0, my: 0,
  rx: 0, ry: 0,
  init() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    this.dot  = document.getElementById('cur');
    this.ring = document.getElementById('curRing');
    if (!this.dot || !this.ring) return;

    document.addEventListener('mousemove', (e) => {
      this.mx = e.clientX;
      this.my = e.clientY;
      this.dot.style.left = this.mx + 'px';
      this.dot.style.top  = this.my + 'px';
    });

    const interactables = 'a, button, .skill-tag, .cert-card, .proj-card, .ws-card, .code-card, .journey-stop, .goal-value, .spec-item, .stat-box';
    document.querySelectorAll(interactables).forEach(el => {
      el.addEventListener('mouseenter', () => this.ring.classList.add('big'));
      el.addEventListener('mouseleave', () => this.ring.classList.remove('big'));
    });

    this.animate();
  },
  animate() {
    this.rx += (this.mx - this.rx) * 0.1;
    this.ry += (this.my - this.ry) * 0.1;
    this.ring.style.left = this.rx + 'px';
    this.ring.style.top  = this.ry + 'px';
    Portfolio.state.cursorRafId = requestAnimationFrame(this.animate.bind(this));
  }
};

/* ================================================================
   MODULE 6 — CANVAS — PCB Circuit Animation
   ================================================================ */
const Canvas = {
  canvas: null,
  ctx: null,
  nodes: [],
  rafId: null,
  COLS: 20,
  ROWS: 12,

  init() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Reduce nodes on mobile for performance
    if (window.innerWidth < 768) {
      this.COLS = 10;
      this.ROWS = 8;
    }

    this.resize();
    this.buildNodes();
    this.draw();

    window.addEventListener('resize', Utils.debounce(() => {
      this.COLS = window.innerWidth < 768 ? 10 : 20;
      this.ROWS = window.innerWidth < 768 ? 8  : 12;
      this.resize();
      this.buildNodes();
    }, 250));

    // Pause canvas when hero is off-screen — biggest perf gain
    const heroObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        Portfolio.state.heroVisible = e.isIntersecting;
        if (e.isIntersecting) {
          if (!this.rafId) this.draw();
        } else {
          if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
          }
        }
      });
    }, { threshold: 0.01 });

    const hero = document.getElementById('hero');
    if (hero) heroObs.observe(hero);
  },

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  buildNodes() {
    this.nodes = [];
    const cw = this.canvas.width  / (this.COLS - 1);
    const ch = this.canvas.height / (this.ROWS - 1);
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        this.nodes.push({
          x:      c * cw + (Math.random() - 0.5) * cw * 0.35,
          y:      r * ch + (Math.random() - 0.5) * ch * 0.35,
          vx:     (Math.random() - 0.5) * 0.14,
          vy:     (Math.random() - 0.5) * 0.14,
          r:      Math.random() < 0.12 ? 3.5 : Math.random() < 0.35 ? 2 : 1.2,
          active: Math.random() < 0.25,
          hue:    Math.random() < 0.82 ? '204,0,0' : '201,168,76'
        });
      }
    }
  },

  draw() {
    if (!Portfolio.state.heroVisible) { this.rafId = null; return; }
    if (Portfolio.state.prefersReducedMotion) { this.rafId = null; return; }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Move nodes
    this.nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > this.canvas.width)  n.vx *= -1;
      if (n.y < 0 || n.y > this.canvas.height) n.vy *= -1;
    });

    // Draw L-shaped PCB traces
    ctx.lineWidth = 0.7;
    const len = this.nodes.length;
    for (let i = 0; i < len; i++) {
      const ni = this.nodes[i];
      for (let j = i + 1; j < len; j++) {
        const nj = this.nodes[j];
        const dx = nj.x - ni.x;
        const dy = nj.y - ni.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) {
          const alpha = ((100 - d) / 100) * 0.24;
          ctx.globalAlpha  = alpha;
          ctx.strokeStyle  = `rgba(${ni.hue},1)`;
          ctx.beginPath();
          ctx.moveTo(ni.x, ni.y);
          if (Math.abs(dx) > Math.abs(dy)) {
            ctx.lineTo(nj.x, ni.y);
            ctx.lineTo(nj.x, nj.y);
          } else {
            ctx.lineTo(ni.x, nj.y);
            ctx.lineTo(nj.x, nj.y);
          }
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    this.nodes.forEach(n => {
      ctx.globalAlpha = n.active ? 0.55 : 0.14;
      ctx.fillStyle   = `rgba(${n.hue},1)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      if (n.r > 2.5) {
        ctx.globalAlpha = n.active ? 0.16 : 0.05;
        ctx.strokeStyle = `rgba(${n.hue},1)`;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 2.8, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1;
    this.rafId = requestAnimationFrame(this.draw.bind(this));
  }
};

/* ================================================================
   MODULE 7 — SPEED LINES
   ================================================================ */
const SpeedLines = {
  init() {
    if (Portfolio.state.prefersReducedMotion) return;
    const wrap = document.getElementById('speed-lines-wrap');
    if (!wrap) return;
    const count = window.innerWidth < 768 ? 8 : 18;
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'speed-line';
      const top      = Math.random() * 100;
      const width    = 80 + Math.random() * 220;
      const duration = 2 + Math.random() * 3.5;
      const delay    = Math.random() * 6;
      el.style.cssText = `top:${top}%;width:${width}px;animation-duration:${duration}s;animation-delay:${delay}s;`;
      wrap.appendChild(el);
    }
  }
};

/* ================================================================
   MODULE 8 — TYPEWRITER
   ================================================================ */
const Typewriter = {
  roles: [
    'Embedded Systems Developer',
    'IoT Engineer',
    'ECE @ Sona College of Technology',
    'Arduino & 8051 Programmer',
    'Hackathon Competitor',
    'Antenna Design Enthusiast',
    'NASSCOM Certified',
    'F1 Enthusiast & Engineer'
  ],
  ri: 0,
  ci: 0,
  deleting: false,
  el: null,
  timer: null,

  init() {
    this.el = document.getElementById('tw');
    if (!this.el) return;
    if (Portfolio.state.prefersReducedMotion) {
      this.el.textContent = this.roles[0];
      return;
    }
    this.tick();
  },
  tick() {
    const cur = this.roles[this.ri];
    if (!this.deleting) {
      this.el.textContent = cur.slice(0, this.ci + 1);
      this.ci++;
      if (this.ci === cur.length) {
        this.deleting = true;
        this.timer = setTimeout(() => this.tick(), 2500);
        return;
      }
    } else {
      this.el.textContent = cur.slice(0, this.ci - 1);
      this.ci--;
      if (this.ci === 0) {
        this.deleting = false;
        this.ri = (this.ri + 1) % this.roles.length;
      }
    }
    this.timer = setTimeout(() => this.tick(), this.deleting ? 46 : 102);
  }
};

/* ================================================================
   MODULE 9 — INTERSECTION OBSERVER MANAGER (single observer)
   ================================================================ */
const Observers = {
  revealObs: null,
  counterObs: null,
  barObs: null,
  projObs: null,
  tlObs: null,
  ssObs: null,

  init() {
    this.initReveal();
    this.initCounters();
    this.initBars();
    this.initProjTraces();
    this.initTimeline();
    this.initSoftSkills();
  },

  initReveal() {
    this.revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          this.revealObs.unobserve(e.target); // fire once only
        }
      });
    }, { threshold: 0.06 });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
      .forEach(el => this.revealObs.observe(el));
  },

  initCounters() {
    this.counterObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('[data-target]').forEach(el => {
            Counters.animate(el, +el.dataset.target);
          });
          this.counterObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.stats-banner, #about')
      .forEach(el => this.counterObs.observe(el));
  },

  initBars() {
    this.barObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.bar-fill').forEach(b => {
            b.style.width = b.dataset.w;
          });
          e.target.querySelectorAll('.cbf').forEach(b => {
            b.style.height = b.dataset.h;
          });
          this.barObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    const acad = document.querySelector('#academics');
    if (acad) this.barObs.observe(acad);
  },

  initSoftSkills() {
    this.ssObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.ss-bar-fill').forEach(b => {
            b.style.width = b.dataset.w;
          });
          this.ssObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    const skills = document.querySelector('#skills');
    if (skills) this.ssObs.observe(skills);
  },

  initProjTraces() {
    // Animate SVG stroke-dashoffset when project cards enter view
    this.projObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          this.projObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });

    document.querySelectorAll('.proj-card')
      .forEach(el => this.projObs.observe(el));
  },

  initTimeline() {
    // Grow timeline line downward on scroll
    this.tlObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !Portfolio.state.tlGrown) {
          Portfolio.state.tlGrown = true;
          const tl = document.querySelector('.timeline');
          if (tl) {
            setTimeout(() => tl.classList.add('tl-grown'), 200);
          }
          this.tlObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    const ach = document.querySelector('#achievements');
    if (ach) this.tlObs.observe(ach);
  }
};

/* ================================================================
   MODULE 10 — COUNTER ANIMATION
   ================================================================ */
const Counters = {
  animate(el, target, duration = 1600) {
    if (Portfolio.state.prefersReducedMotion) {
      el.textContent = target + (Number.isInteger(target) ? '+' : '');
      return;
    }
    let start = null;
    const isFloat = !Number.isInteger(target);
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      if (isFloat) {
        el.textContent = (eased * target).toFixed(2);
      } else {
        el.textContent = Math.floor(eased * target) + (progress >= 1 ? '+' : '');
      }
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
};

/* ================================================================
   MODULE 11 — CONTACT FORM (FormSubmit.co integration)
   ================================================================ */
const Form = {
  init() {
    const btn = document.getElementById('cf-submit');
    if (!btn) return;
    btn.addEventListener('click', this.handleSubmit.bind(this));
  },

  validate() {
    const name  = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const msg   = document.getElementById('cf-msg').value.trim();
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name)             return { ok: false, msg: 'Please enter your name.' };
    if (!emailRx.test(email)) return { ok: false, msg: 'Please enter a valid email.' };
    if (!msg)              return { ok: false, msg: 'Please write a message.' };
    return { ok: true };
  },

  setState(btn, state) {
    const states = {
      idle:    { html: '<i class="fas fa-paper-plane"></i> Send Message &rarr;', bg: 'var(--red)',      disabled: false },
      loading: { html: '<i class="fas fa-circle-notch fa-spin"></i> Sending...',   bg: 'var(--bg4)',      disabled: true  },
      success: { html: '<i class="fas fa-check"></i> Message Sent — Let\'s Race!', bg: '#1a6b2a',        disabled: true  },
      error:   { html: '<i class="fas fa-exclamation-circle"></i> Check the form', bg: '#8b0000',        disabled: false }
    };
    const s = states[state];
    btn.innerHTML         = s.html;
    btn.style.background  = s.bg;
    btn.disabled          = s.disabled;
  },

  handleSubmit(e) {
    e.preventDefault ? e.preventDefault() : null;
    const btn = document.getElementById('cf-submit');
    const validation = this.validate();
    if (!validation.ok) {
      this.setState(btn, 'error');
      btn.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${validation.msg}`;
      setTimeout(() => this.setState(btn, 'idle'), 3000);
      return;
    }

    // FormSubmit.co — replace YOUR_EMAIL with actual email in production
    // For now simulates success (change action on <form> to enable real send)
    this.setState(btn, 'loading');
    setTimeout(() => {
      this.setState(btn, 'success');
      ['cf-name','cf-email','cf-subj','cf-msg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      setTimeout(() => this.setState(btn, 'idle'), 4000);
    }, 1600);
  }
};

/* ================================================================
   MODULE 12 — LIGHTBOX (with focus trap)
   ================================================================ */
const Lightbox = {
  overlay: null,
  img: null,
  closeBtn: null,
  prevFocus: null,

  init() {
    this.overlay  = document.getElementById('lightbox');
    this.img      = document.getElementById('lb-img');
    this.closeBtn = document.querySelector('.lb-close');
    if (!this.overlay) return;

    this.closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
  },

  open(src, alt) {
    if (!this.overlay || !this.img) return;
    this.prevFocus = document.activeElement;
    this.img.src = src;
    this.img.alt = alt || 'Certificate image';
    this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (this.closeBtn) this.closeBtn.focus();
  },

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (this.prevFocus) this.prevFocus.focus();
  }
};

// Global helper for onclick in HTML
function openLightbox(src, alt) { Lightbox.open(src, alt); }

/* ================================================================
   MODULE 13 — UTILS
   ================================================================ */
const Utils = {
  debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  },
  throttle(fn, ms) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) { last = now; fn.apply(this, args); }
    };
  },
  lerp(a, b, t) { return a + (b - a) * t; }
};

/* ================================================================
   BOOT
   ================================================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Portfolio.init());
} else {
  Portfolio.init();
}