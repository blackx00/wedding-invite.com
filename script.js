/**
 * Luxury digital wedding invitation — pure JS animations (GSAP-style easing).
 * Edit WEDDING_DATE and optional MUSIC_SRC below.
 */

const DEFAULT_WEDDING_DATE = new Date("2030-07-29T4:00:00");
let weddingDate = new Date(DEFAULT_WEDDING_DATE);
/**
 * Background music file — replace anytime:
 * 1. Put your .mp3 (or .ogg / .m4a) in the /assets/ folder
 * 2. Update this path to match your filename
 * Placeholder: soft romantic piano (replace before sharing publicly if needed)
 */
const MUSIC_SRC = "assets/background-music.mp3";
const MUSIC_TARGET_VOLUME = 0.22;
const MUSIC_FADE_IN_MS = 2800;
const MUSIC_FADE_OUT_MS = 550;

/** Set by initBackgroundMusic — called when the envelope opens */
let startBackgroundMusic = null;

/* ---------- Easing (t in 0..1) ---------- */
const Easing = {
  linear: (t) => t,
  easeOutQuint: (t) => 1 - Math.pow(1 - t, 5),
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/**
 * @param {{ duration: number; easing: (t:number)=>number; onUpdate: (progress01:number)=>void; onComplete?: ()=>void }} opts
 */
function animateTimeline(opts) {
  const { duration, easing, onUpdate, onComplete } = opts;
  const start = performance.now();

  function frame(now) {
    const raw = Math.min(1, (now - start) / duration);
    const t = easing(raw);
    onUpdate(t);
    if (raw < 1) {
      requestAnimationFrame(frame);
    } else if (onComplete) {
      onComplete();
    }
  }
  requestAnimationFrame(frame);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function resolveWeddingDateFromHtml() {
  const eventDateEl = document.getElementById("eventDate");
  const heroDateEl = document.getElementById("heroDateDisplay");
  const candidates = [eventDateEl?.textContent, heroDateEl?.textContent]
    .map((v) => (v || "").trim())
    .filter(Boolean);

  for (const raw of candidates) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(DEFAULT_WEDDING_DATE);
}

/* ---------- Loader ---------- */
window.addEventListener("load", () => {
  const loader = document.getElementById("pageLoader");
  requestAnimationFrame(() => {
    setTimeout(() => {
      loader.classList.add("is-hidden");
      setTimeout(() => loader.remove(), 1100);
    }, 400);
  });
});

/* ---------- Particles ---------- */
function initParticles(canvas, options = {}) {
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");
  const { count = 55, speed = 0.15, connect = false } = options;
  let raf = 0;
  let w = 0;
  let h = 0;
  const dots = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function initDots() {
    dots.length = 0;
    for (let i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed - 0.04,
        a: 0.12 + Math.random() * 0.35,
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(165, 214, 211, 0.38)";
    dots.forEach((d) => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0) d.x = w;
      if (d.x > w) d.x = 0;
      if (d.y < 0) d.y = h;
      if (d.y > h) d.y = 0;
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    if (connect && dots.length > 2) {
      ctx.strokeStyle = "rgba(255, 192, 210, 0.12)";
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
    }
    raf = requestAnimationFrame(tick);
  }

  resize();
  initDots();
  window.addEventListener("resize", () => {
    resize();
    initDots();
  });
  tick();

  return () => cancelAnimationFrame(raf);
}

/* ---------- Petals ---------- */
function initPetals(container) {
  if (!container) return;
  const n = 38;
  for (let i = 0; i < n; i++) {
    const el = document.createElement("div");
    el.className = "petal";
    el.style.left = `${Math.random() * 100}%`;
    el.style.animationDuration = `${14 + Math.random() * 18}s`;
    el.style.animationDelay = `${-Math.random() * 20}s`;
    el.style.width = `${6 + Math.random() * 8}px`;
    el.style.height = `${8 + Math.random() * 10}px`;
    container.appendChild(el);
  }
}

/* ---------- Envelope open (cinematic) ---------- */
function runEnvelopeOpening() {
  const opening = document.getElementById("openingScreen");
  const envelope = document.getElementById("envelope");
  const flap = document.getElementById("envelopeFlap");
  const card = document.getElementById("envelopeCard");
  const seal = document.getElementById("envelopeSeal");
  const main = document.getElementById("inviteMain");

  if (!opening || envelope.classList.contains("is-animating")) return;

  startBackgroundMusic?.();

  envelope.classList.add("is-animating");
  seal.disabled = true;
  document.body.classList.add("opening-active");

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    envelope.classList.remove("is-animating");
    envelope.classList.add("is-open");
    opening.classList.add("is-done");
    main.classList.add("is-visible");
    main.setAttribute("aria-hidden", "false");
    document.body.classList.remove("opening-active");
    seal.style.pointerEvents = "none";
    requestAnimationFrame(() => initReveal());
    return;
  }

  const totalMs = 3400;
  const FLAP_CLOSED = 76;
  const FLAP_OPEN = -178;
  const CARD_START = 6;
  const CARD_END = -124;

  animateTimeline({
    duration: totalMs,
    easing: Easing.linear,
    onUpdate: (u) => {
      /* Seal — နှိပ်သည့်အခါ ချို့ချိန် ပျောက်သွား */
      const sealPhase = clamp((u - 0) / 0.16, 0, 1);
      const sealEase = Easing.easeOutQuint(sealPhase);
      const sealScale = 1 + 0.06 * Math.sin(sealPhase * Math.PI) - 0.42 * sealEase;
      const sealOpacity = 1 - 0.96 * sealEase;
      seal.style.transform = `translate(-50%, -50%) scale(${Math.max(0.15, sealScale)})`;
      seal.style.opacity = String(Math.max(0, sealOpacity));

      /* Flap — ပိတ်ရင် အရှေ့သို့ ခေါက်၊ ဖွင့်ရင် နောက်သို့ လှည့် */
      const flapT = clamp((u - 0.07) / 0.46, 0, 1);
      const flapE = Easing.easeOutExpo(flapT);
      const deg = FLAP_CLOSED + (FLAP_OPEN - FLAP_CLOSED) * flapE;
      flap.style.transform = `rotateX(${deg}deg)`;
      flap.style.webkitTransform = `rotateX(${deg}deg)`;

      /* Letter — flap ဖွင့်လာမှ တက်လာ */
      const cardT = clamp((u - 0.2) / 0.5, 0, 1);
      const cardE = Easing.easeOutBack(cardT);
      const lift = CARD_START + (CARD_END - CARD_START) * cardE;
      const cardScale = 1 + 0.035 * cardE;
      card.style.transform = `translate3d(0, ${lift}px, 0) scale(${cardScale})`;
      card.style.opacity = String(0.9 + 0.1 * cardE);

      /* မျက်နှာပြင် အဖွင့် ပြီးသွားမှန်း blur + fade */
      const bloom = clamp((u - 0.5) / 0.5, 0, 1);
      const bloomE = Easing.easeOutQuint(bloom);
      opening.style.filter = `blur(${11 * bloomE}px)`;
      opening.style.opacity = String(1 - 0.98 * bloomE);
      opening.style.transform = `scale(${1 + 0.035 * bloomE})`;
    },
    onComplete: () => {
      envelope.classList.remove("is-animating");
      envelope.classList.add("is-open");
      flap.style.removeProperty("transform");
      flap.style.removeProperty("-webkit-transform");
      card.style.removeProperty("transform");
      card.style.removeProperty("opacity");
      opening.classList.add("is-done");
      main.classList.add("is-visible");
      main.setAttribute("aria-hidden", "false");
      document.body.classList.remove("opening-active");
      seal.style.removeProperty("transform");
      seal.style.removeProperty("opacity");
      seal.style.pointerEvents = "none";
      requestAnimationFrame(() => initReveal());
    },
  });
}

/* ---------- Countdown ---------- */
function updateCountdown() {
  const now = new Date();
  const diff = weddingDate - now;
  const daysEl = document.getElementById("cdDays");
  const hEl = document.getElementById("cdHours");
  const mEl = document.getElementById("cdMins");
  const sEl = document.getElementById("cdSecs");
  if (!daysEl) return;

  if (diff <= 0) {
    daysEl.textContent = "0";
    hEl.textContent = "0";
    mEl.textContent = "0";
    sEl.textContent = "0";
    return;
  }

  const s = Math.floor(diff / 1000) % 60;
  const m = Math.floor(diff / 60000) % 60;
  const h = Math.floor(diff / 3600000) % 24;
  const d = Math.floor(diff / 86400000);

  daysEl.textContent = String(d);
  hEl.textContent = String(h);
  mEl.textContent = String(m);
  sEl.textContent = String(s);
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const root = document.getElementById("inviteMain");
  if (!root) return;
  const els = root.querySelectorAll(".reveal:not(.is-revealed)");
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-revealed");
          io.unobserve(en.target);
        }
      });
    },
    { root: null, threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- Background music ---------- */
function initBackgroundMusic() {
  const audio = document.getElementById("bgMusic");
  const btn = document.getElementById("musicToggle");
  if (!audio || !btn) return;

  if (!MUSIC_SRC) {
    btn.hidden = true;
    return;
  }

  audio.src = MUSIC_SRC;
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
  audio.muted = false;
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");

  let isPlaying = false;
  let userWantsMusic = true;
  let fadeRaf = 0;

  function cancelFade() {
    if (fadeRaf) cancelAnimationFrame(fadeRaf);
    fadeRaf = 0;
  }

  function fadeVolumeTo(target, durationMs, onComplete) {
    cancelFade();
    const startVol = audio.volume;
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = t * t * (3 - 2 * t);
      audio.volume = startVol + (target - startVol) * eased;
      if (t < 1) {
        fadeRaf = requestAnimationFrame(frame);
      } else {
        fadeRaf = 0;
        audio.volume = target;
        onComplete?.();
      }
    }
    fadeRaf = requestAnimationFrame(frame);
  }

  function setPlayingUI(playing) {
    isPlaying = playing;
    btn.classList.toggle("is-playing", playing);
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      playing ? "Pause background music" : "Play background music"
    );
  }

  async function startMusic() {
    if (!userWantsMusic || isPlaying) return;
    try {
      audio.muted = false;
      if (audio.readyState < 2) {
        audio.load();
      }
      await audio.play();
      setPlayingUI(true);
      fadeVolumeTo(MUSIC_TARGET_VOLUME, MUSIC_FADE_IN_MS);
    } catch {
      setPlayingUI(false);
    }
  }

  startBackgroundMusic = startMusic;

  function stopMusic() {
    cancelFade();
    const pause = () => {
      audio.pause();
      setPlayingUI(false);
    };
    if (audio.volume > 0.22) {
      fadeVolumeTo(0, MUSIC_FADE_OUT_MS, pause);
    } else {
      audio.volume = 0;
      pause();
    }
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isPlaying) {
      userWantsMusic = false;
      stopMusic();
    } else {
      userWantsMusic = true;
      startMusic();
    }
  });

  audio.addEventListener("error", () => {
    console.warn("[Wedding invite] Could not load background music:", MUSIC_SRC);
    btn.hidden = true;
  });
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("opening-active");

  weddingDate = resolveWeddingDateFromHtml();

  initParticles(document.getElementById("particlesCanvas"), { count: 60, speed: 0.12, connect: true });
  initParticles(document.getElementById("inviteParticles"), { count: 35, speed: 0.08, connect: false });
  initPetals(document.getElementById("petals"));

  const seal = document.getElementById("envelopeSeal");
  if (seal) {
    seal.addEventListener("click", runEnvelopeOpening);
    seal.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        runEnvelopeOpening();
      }
    });
  }

  initBackgroundMusic();
  updateCountdown();
  setInterval(updateCountdown, 1000);
});
