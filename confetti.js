'use strict';
/* Confeti ligero (sin librerías) para celebrar lo que se termina 🎉
   Uso: confetti(x, y, { count, spread, power }) con x, y relativos a #app. */

window.confetti = (() => {
  const COLORS = ['#F2A3BB', '#F7E7A6', '#CBDCEE', '#D5E8CB', '#E2D3F2', '#F7D9BE', '#7C8AEB', '#F0A04B'];
  let canvas = null, ctx = null, parts = [], raf = 0, last = 0, dpr = 1;

  function setup() {
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'confetti';
      canvas.setAttribute('aria-hidden', 'true');
      document.getElementById('app').appendChild(canvas);
      ctx = canvas.getContext('2d');
    }
    const host = canvas.parentElement;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(host.clientWidth * dpr), h = Math.round(host.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function heart(s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s, -s * 0.35, -s * 0.45, -s * 1.1, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.45, -s * 1.1, s, -s * 0.35, 0, s * 0.35);
    ctx.fill();
  }

  function frame(now) {
    const dt = Math.min(2.5, (now - last) / 16.67); // en "cuadros" de 60 fps
    last = now;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const drag = Math.pow(0.985, dt);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vx *= drag;
      p.vy = p.vy * drag + 0.3 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.wob += 0.12 * dt;
      p.life -= dt;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life / 25);
      ctx.translate(p.x + Math.sin(p.wob) * 2, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'heart') heart(p.s / 2);
      else if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(0, 0, p.s / 3, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.scale(1, Math.cos(p.wob)); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); }
      ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(frame);
    else { raf = 0; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  return function burst(x, y, { count = 60, spread = 55, power = 1 } = {}) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setup();
    for (let i = 0; i < count; i++) {
      const angle = (-90 + (Math.random() - 0.5) * spread * 2) * Math.PI / 180; // hacia arriba
      const speed = (6 + Math.random() * 7) * power;
      parts.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        wob: Math.random() * Math.PI * 2,
        s: 7 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        shape: i % 7 === 0 ? 'heart' : i % 3 === 0 ? 'dot' : 'strip',
        life: 70 + Math.random() * 50,
      });
    }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };
})();
