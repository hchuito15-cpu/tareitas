'use strict';
/* Tareitas — to-do list para Meni 🌸
   Todo se guarda en el teléfono (localStorage). Sin frameworks ni compilación. */

/* ───────────── Configuración fácil de cambiar ───────────── */

// Saludos por horario: [desde, hasta) en formato 24 h. Si ninguno aplica se usa el predeterminado.
const GREETINGS = [
  { from: '04:00', to: '08:00', text: 'Buenos días Meni 💗' },
  { from: '10:20', to: '11:20', text: '¿Qué se te olvidó? 😭' },
  { from: '13:30', to: '14:20', text: 'Ya casi sales, aguanta 💗' },
  { from: '21:00', to: '01:00', text: 'Ya descansate miamor 💗' },
];
const DEFAULT_GREETING = 'Holuuu Meni 💗';

// Colores pastel para materias y tarjetas
const PASTELS = ['#F7E7A6', '#F4CDC6', '#CBDCEE', '#D5E8CB', '#E2D3F2', '#F7D9BE', '#CDE9E2', '#E5E0D6'];
const PRIO_TEXT = ['', 'Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'];
const PRIO_COLORS = ['#AEB6F4', '#BEB3EC', '#CDB0E3', '#E0ACC5', '#F2A7A7'];

/* ───────────── Utilidades ───────────── */

const $ = (sel, root = document) => root.querySelector(sel);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const norm = (s) => String(s ?? '').trim().toLowerCase();
const haptic = (pattern = 8) => { try { navigator.vibrate?.(pattern); } catch (_) { /* sin vibración */ } };
// Resistencia elástica cuando se arrastra más allá del límite
const rubber = (d, max) => max * (1 - 1 / ((d * 0.9) / max + 1));
const EASE = 'cubic-bezier(.22, 1, .36, 1)';
const SPRING = 'cubic-bezier(.34, 1.36, .64, 1)';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const svg = (body, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON = {
  x: svg('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', 2.8),
  check: svg('<path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"/>', 2.6),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  pencil: svg('<path d="M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
  cal: svg('<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  flag: svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
  bolt: svg('<path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 2.6),
  list: svg('<path d="M9.5 6.5h10M9.5 12h10M9.5 17.5h10"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" stroke-width="3"/>'),
};

/* ───────────── Fechas ───────────── */

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAY_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const DAY_LETTER = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const pad = (n) => String(n).padStart(2, '0');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayISO = () => isoDate(new Date());
const dayDiff = (iso) => Math.round((parseISO(iso) - parseISO(todayISO())) / 86400000);
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const fmtTime = (hhmm) => { const [h, m] = hhmm.split(':'); return `${Number(h)}:${m}`; };
const nowMinutes = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

function greetingFor(d) {
  const m = d.getHours() * 60 + d.getMinutes();
  const hit = GREETINGS.find(({ from, to }) => {
    const a = toMin(from), b = toMin(to);
    return a <= b ? m >= a && m < b : m >= a || m < b; // el de la noche cruza la medianoche
  });
  return hit ? hit.text : DEFAULT_GREETING;
}

function dueLabel(iso) {
  const n = dayDiff(iso), d = parseISO(iso);
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  if (n === -1) return 'Ayer';
  if (n > 1 && n < 7) return cap(WEEKDAYS[d.getDay()]);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}
function dueRelative(iso) {
  const n = dayDiff(iso);
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  if (n === -1) return 'Ayer';
  return n > 0 ? `En ${n} días` : `Hace ${-n} días`;
}
function longDate(iso) {
  const d = parseISO(iso);
  const year = d.getFullYear() !== new Date().getFullYear() ? ` de ${d.getFullYear()}` : '';
  return `${cap(WEEKDAYS[d.getDay()])} ${pad(d.getDate())} de ${MONTHS[d.getMonth()]}${year}`;
}

/* ───────────── Datos ───────────── */

const STORE_KEY = 'tareitas:v1';

function defaultSchedule() {
  const slots = [];
  for (let h = 7; h < 14; h++) slots.push({ id: uid(), start: fromMin(h * 60), end: fromMin(h * 60 + 60) });
  return { days: [1, 2, 3, 4, 5], slots, subjects: [], cells: {} };
}
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved) {
      return {
        tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
        schedule: saved.schedule?.slots ? saved.schedule : defaultSchedule(),
      };
    }
  } catch (_) { /* datos ilegibles: empezar de cero */ }
  return { tasks: [], schedule: defaultSchedule() };
}
const state = load();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { /* almacenamiento bloqueado */ }
}

const subjectById = (id) => (id ? state.schedule.subjects.find((s) => s.id === id) : null);
const findSubject = (name) => state.schedule.subjects.find((s) => norm(s.name) && norm(s.name) === norm(name));
function hashColor(s) {
  let h = 7;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return PASTELS[h % (PASTELS.length - 1)]; // sin el gris
}
// La tarjeta toma el color de su materia del horario; si no existe, uno fijo según el texto
const taskColor = (t) => findSubject(t.subject)?.color || hashColor(norm(t.subject) || norm(t.name));

function sortTasks(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;
  if (a.done) return (b.doneAt || 0) - (a.doneAt || 0);
  if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.priority !== b.priority) return b.priority - a.priority;
  return a.createdAt - b.createdAt;
}

/* ───────────── Elementos ───────────── */

const appEl = $('#app'), mainEl = $('#main'), mainDim = $('#mainDim');
const greetEl = $('#greeting'), dateEl = $('#date'), weekdayEl = $('#weekday');
const taskList = $('#taskList'), emptyEl = $('#empty');
const swipeZone = $('#swipeZone'), edgeZone = $('#edgeZone');
const scrim = $('#scrim'), scrim2 = $('#scrim2'), toastEl = $('#toast');
const appW = () => appEl.clientWidth;

/* ───────────── Botón "atrás" de Android ─────────────
   `nav.stack` es lo único que dice qué está abierto. Abrir o cerrar desde la interfaz
   no toca el historial del navegador. Solo existe UNA entrada extra ("trampa"):
   cuando llega un "atrás", se cierra lo de arriba (o se abre el horario si no hay
   nada, porque en Samsung deslizar desde el borde izquierdo es "atrás") y se vuelve
   a la trampa con history.forward(). */

const nav = { stack: [] }; // [{ name, close }]
const topIs = (name) => nav.stack.at(-1)?.name === name;
const atTrap = () => history.state?.tareitas === 'trap';

// Chrome solo respeta entradas creadas tras una interacción, por eso se arma en pointerup/keydown
function armTrap() {
  if (!atTrap()) history.pushState({ tareitas: 'trap' }, '');
}
function navOpen(name, close) {
  nav.stack.push({ name, close });
}
function navClosed(name) {
  const i = nav.stack.findLastIndex((e) => e.name === name);
  if (i >= 0) nav.stack.splice(i, 1);
}
function navReplace(name, next, close) {
  const entry = nav.stack.findLast((e) => e.name === name);
  if (entry) Object.assign(entry, { name: next, close });
}
function closeTop() {
  nav.stack.at(-1)?.close();
}

addEventListener('popstate', () => {
  if (atTrap()) return; // es el regreso de history.forward()
  if (nav.stack.length) closeTop();
  else openSchedule();
  history.forward();
});
addEventListener('pointerup', armTrap, true);
addEventListener('keydown', armTrap, true);

/* ───────────── Gestos ───────────── */

const SLOP = 8;
let lastDragEnd = 0;

/* Arrastre genérico: `decide` elige si el gesto es nuestro tras unos px de movimiento;
   `move` sigue al dedo y `end` recibe la velocidad (px/ms) para decidir el final. */
function gesture(el, o) {
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (o.when && !o.when(e)) return;
    const g = { dx: 0, dy: 0, vx: 0, vy: 0, active: false, pts: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }] };

    const onMove = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      // Se soltó el botón sin que llegara "pointerup" (p. ej. fuera de la ventana)
      if (ev.pointerType === 'mouse' && ev.buttons === 0) { onUp(ev); return; }
      g.dx = ev.clientX - e.clientX;
      g.dy = ev.clientY - e.clientY;
      g.pts.push({ x: ev.clientX, y: ev.clientY, t: ev.timeStamp });
      while (g.pts.length > 2 && ev.timeStamp - g.pts[0].t > 90) g.pts.shift();
      if (!g.active) {
        if (Math.hypot(g.dx, g.dy) < SLOP) return;
        if (!o.decide(g)) { finish(); return; }
        g.active = true;
        try { el.setPointerCapture(e.pointerId); } catch (_) { /* puntero ya liberado */ }
        o.begin?.(g);
      }
      if (ev.cancelable) ev.preventDefault();
      o.move(g);
    };
    const onUp = (ev) => {
      if (ev.type !== 'blur' && ev.pointerId !== e.pointerId) return;
      finish();
      if (!g.active) return;
      const a = g.pts[0], b = g.pts.at(-1), dt = Math.max(1, b.t - a.t);
      const resting = ev.timeStamp - b.t > 90; // el dedo se detuvo antes de soltar
      g.vx = resting ? 0 : (b.x - a.x) / dt;
      g.vy = resting ? 0 : (b.y - a.y) / dt;
      lastDragEnd = performance.now();
      o.end(g);
    };
    function finish() {
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
      removeEventListener('blur', onUp);
    }
    addEventListener('pointermove', onMove, { passive: false });
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    addEventListener('blur', onUp); // la app pasó a segundo plano a media acción
  });
}

/* Trackpad de la Mac: deslizar con dos dedos llega como eventos "wheel".
   Se acumula el movimiento y, al pasar el umbral, se dispara la acción una sola vez
   por deslizamiento. `map` tiene la dirección en que se mueven los dedos:
   { right|left|up|down: { when(e), run(e) } } */
function wheelSwipe(el, map) {
  let ax = 0, ay = 0, fired = false, idle = 0;
  el.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return; // pellizco para zoom
    clearTimeout(idle);
    idle = setTimeout(() => { ax = 0; ay = 0; fired = false; }, 220);
    ax += e.deltaX;
    ay += e.deltaY;
    const horizontal = Math.abs(ax) > Math.abs(ay);
    const dir = horizontal ? (ax < 0 ? 'right' : 'left') : (ay < 0 ? 'down' : 'up');
    const action = map[dir];
    if (!action || (action.when && !action.when(e))) return;
    e.preventDefault();
    if (fired || Math.abs(horizontal ? ax : ay) < 60) return;
    fired = true;
    action.run(e);
  }, { passive: false });
}

// Un arrastre no debe terminar en "click"
document.addEventListener('click', (e) => {
  if (performance.now() - lastDragEnd < 300) { e.stopPropagation(); e.preventDefault(); }
}, true);

function shake(el) {
  haptic([10, 40, 10]);
  el.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }],
    { duration: 420, easing: 'ease-out' },
  );
}

// Cambia un texto con un desvanecido suave
function swapText(el, text) {
  if (el.textContent === text) return;
  if (!el.textContent || reduceMotion) { el.textContent = text; return; }
  const out = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' });
  out.onfinish = () => {
    el.textContent = text;
    el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
    out.cancel();
  };
}

/* ───────────── Encabezado ───────────── */

let lastDay = '';
function updateHeader() {
  const now = new Date();
  swapText(greetEl, greetingFor(now));
  dateEl.textContent = `${pad(now.getDate())} ${MONTHS[now.getMonth()]}`;
  weekdayEl.textContent = WEEKDAYS[now.getDay()];
  const day = isoDate(now);
  if (lastDay && day !== lastDay) renderTasks();
  lastDay = day;
  if (sch.open) { renderGrid(); updateSchSub(); }
}

/* ───────────── Lista de tareas ───────────── */

const DEL_W = 84; // cuánto se recorre la tarjeta para mostrar el botón de borrar
let openLi = null;

function taskEl() {
  const li = document.createElement('li');
  li.className = 'task';
  li.innerHTML = `
    <button class="task-del" type="button" tabindex="-1" aria-label="Eliminar tarea">${ICON.trash}</button>
    <div class="task-card" role="button" tabindex="0">
      <div class="task-text"><span class="task-name"><span></span></span><span class="task-meta"></span></div>
      <span class="task-urgent" aria-label="Urgente"></span>
      <button class="task-check" type="button">${ICON.check}</button>
    </div>`;
  li._del = li.firstElementChild;
  li._card = li.lastElementChild;
  attachCardGestures(li);
  return li;
}

function updateTaskEl(li, t) {
  const overdue = !t.done && dayDiff(t.date) < 0;
  li.classList.toggle('done', !!t.done);
  li.classList.toggle('urgent', !!t.urgent && !t.done);
  li.classList.toggle('overdue', overdue);
  li._card.style.setProperty('--c', taskColor(t));
  li.querySelector('.task-name > span').textContent = t.name;
  const when = overdue ? `Atrasada · ${dueLabel(t.date)}` : dueLabel(t.date);
  li.querySelector('.task-meta').textContent = [t.subject, when].filter(Boolean).join(' · ');
  li.querySelector('.task-check').setAttribute('aria-label', t.done ? 'Marcar como pendiente' : 'Marcar como hecha');
}

function doneLabelEl() {
  const li = document.createElement('li');
  li.className = 'done-label';
  li.dataset.key = '__done';
  li.textContent = 'Hechas';
  return li;
}

/* Dibuja la lista reutilizando las tarjetas existentes y anima los cambios de
   posición (técnica FLIP) para que todo se reacomode con suavidad. */
function renderTasks(freshIds = []) {
  const before = new Map();
  for (const el of taskList.children) before.set(el.dataset.key, el.getBoundingClientRect().top);

  const existing = new Map([...taskList.children].map((el) => [el.dataset.key, el]));
  const sorted = [...state.tasks].sort(sortTasks);
  const firstDone = sorted.findIndex((t) => t.done);
  let i = 0;
  const place = (el) => {
    if (taskList.children[i] !== el) taskList.insertBefore(el, taskList.children[i] || null);
    i++;
  };
  sorted.forEach((t, idx) => {
    if (idx === firstDone) {
      const label = existing.get('__done') || doneLabelEl();
      existing.delete('__done');
      place(label);
    }
    let li = existing.get(t.id);
    if (li) existing.delete(t.id);
    else { li = taskEl(); li.dataset.key = t.id; }
    updateTaskEl(li, t);
    place(li);
  });
  existing.forEach((el) => el.remove());

  if (!reduceMotion) {
    for (const el of taskList.children) {
      const top = before.get(el.dataset.key);
      if (top === undefined) {
        if (freshIds.includes(el.dataset.key) || el.dataset.key === '__done') {
          el.animate([{ opacity: 0, transform: 'translateY(18px) scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 560, easing: EASE });
        }
        continue;
      }
      const dy = top - el.getBoundingClientRect().top;
      if (Math.abs(dy) > 0.5) el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 560, easing: EASE });
    }
  }
  emptyEl.classList.toggle('show', state.tasks.length === 0);
}

function setCardX(li, x, animate, armed = false) {
  const t = animate ? '' : 'none';
  li._card.style.transition = t;
  li._del.style.transition = t;
  li._card.style.transform = x ? `translate3d(${x}px, 0, 0)` : '';
  const p = clamp(x / DEL_W, 0, 1);
  li._del.style.opacity = String(p);
  li._del.style.transform = `scale(${armed ? 1.18 : 0.4 + 0.6 * p})`;
}
function openCard(li) {
  if (openLi && openLi !== li) closeCard(openLi);
  openLi = li;
  li.classList.add('swiped');
  setCardX(li, DEL_W, true);
}
function closeCard(li) {
  li.classList.remove('swiped');
  setCardX(li, 0, true);
  if (openLi === li) openLi = null;
}

// Deslizar la tarjeta hacia la derecha descubre el botón de eliminar (y si se desliza lejos, la elimina)
function attachCardGestures(li) {
  let base = 0, width = 0, armed = false;
  gesture(li._card, {
    when: () => nav.stack.length === 0,
    decide: (g) => {
      if (Math.abs(g.dx) < Math.abs(g.dy) * 1.2) return false;
      base = li.classList.contains('swiped') ? DEL_W : 0;
      if (g.dx < 0 && !base) return false;
      if (openLi && openLi !== li) closeCard(openLi);
      width = li.offsetWidth;
      armed = false;
      return true;
    },
    move: (g) => {
      let x = base + g.dx;
      if (x < 0) x = -rubber(-x, 18);
      const nowArmed = x > width * 0.6;
      if (nowArmed !== armed) { armed = nowArmed; haptic(armed ? 14 : 5); }
      setCardX(li, x, false, armed);
    },
    end: (g) => {
      const x = base + g.dx;
      if (armed) deleteTask(li.dataset.key);
      else if (g.vx > 0.35 || (x > DEL_W * 0.5 && g.vx > -0.35)) openCard(li);
      else closeCard(li);
    },
  });
}

document.addEventListener('pointerdown', (e) => {
  if (openLi && !openLi.contains(e.target)) closeCard(openLi);
}, true);

// Con el trackpad: dos dedos a la derecha sobre una tarjeta muestran "eliminar"
const wheelCard = (e) => !nav.stack.length && e.target.closest('.task');
wheelSwipe(taskList, {
  right: { when: wheelCard, run: (e) => openCard(e.target.closest('.task')) },
  left: { when: wheelCard, run: (e) => closeCard(e.target.closest('.task')) },
});

taskList.addEventListener('click', (e) => {
  const li = e.target.closest('.task');
  if (!li) return;
  const id = li.dataset.key;
  if (e.target.closest('.task-del')) return deleteTask(id);
  if (li.classList.contains('swiped')) return closeCard(li);
  if (e.target.closest('.task-check')) return toggleDone(id);
  if (e.target.closest('.task-card')) openDetail(id);
});
taskList.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('task-card')) {
    e.preventDefault();
    openDetail(e.target.closest('.task').dataset.key);
  }
});

let reorderTimer;
function toggleDone(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  t.doneAt = t.done ? Date.now() : null;
  save();
  haptic(t.done ? [10, 40, 12] : 8);
  const li = taskList.querySelector(`[data-key="${id}"]`);
  if (li) updateTaskEl(li, t);
  // Deja ver la palomita antes de reacomodar
  clearTimeout(reorderTimer);
  reorderTimer = setTimeout(renderTasks, 700);
}

function deleteTask(id) {
  const idx = state.tasks.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const [task] = state.tasks.splice(idx, 1);
  save();
  haptic(14);
  const li = taskList.querySelector(`[data-key="${id}"]`);
  if (li) {
    if (openLi === li) openLi = null;
    li._card.style.transition = `transform .38s ${EASE}, opacity .3s ease`;
    li._card.style.transform = 'translate3d(105%, 0, 0)';
    li._card.style.opacity = '0';
    li._del.style.transition = 'opacity .25s ease, transform .3s ease';
    li._del.style.opacity = '0';
    li._del.style.transform = 'scale(.6)';
  }
  setTimeout(() => renderTasks(), li ? 260 : 0);
  toast('Tarea eliminada', 'Deshacer', () => {
    state.tasks.splice(Math.min(idx, state.tasks.length), 0, task);
    save();
    renderTasks([task.id]);
  });
}

/* ───────────── Hojas deslizables ───────────── */

function createSheet(el, scrimEl) {
  const sheet = {
    el,
    isOpen: false,
    closedY: () => el.offsetHeight + 48,
    place(y, animate, withScrim = true) {
      el.style.transition = animate ? '' : 'none';
      el.style.transform = `translate3d(0, ${y}px, 0)`;
      if (!withScrim) return;
      scrimEl.style.transition = animate ? '' : 'none';
      scrimEl.style.opacity = String(clamp(1 - y / sheet.closedY(), 0, 1));
    },
    open(fromCurrent = false) {
      sheet.isOpen = true;
      el.inert = false;
      scrimEl.classList.add('on');
      if (!fromCurrent) { sheet.place(sheet.closedY(), false, false); el.getBoundingClientRect(); }
      sheet.place(0, true);
    },
    close(keepScrim = false) {
      sheet.isOpen = false;
      el.inert = true;
      if (el.contains(document.activeElement)) document.activeElement.blur();
      if (!keepScrim) scrimEl.classList.remove('on');
      sheet.place(sheet.closedY(), true, !keepScrim);
    },
  };
  return sheet;
}

// Arrastrar la parte de arriba de una hoja hacia abajo la cierra
function sheetDrag(sheet, handle, onClose) {
  let h = 0;
  gesture(handle, {
    when: () => sheet.isOpen,
    decide: (g) => Math.abs(g.dy) > Math.abs(g.dx),
    begin: () => { h = sheet.closedY(); },
    move: (g) => sheet.place(g.dy > 0 ? g.dy : -rubber(-g.dy, 24), false),
    end: (g) => (g.dy > h * 0.2 || g.vy > 0.45 ? onClose() : sheet.place(0, true)),
  });
  wheelSwipe(handle, { down: { when: () => sheet.isOpen, run: onClose } });
}

/* ───────────── Agregar / editar tarea ───────────── */

const addSheet = createSheet($('#addSheet'), scrim);
const addForm = $('#addForm'), fName = $('#fName'), fSubject = $('#fSubject'), fChips = $('#fChips');
const fDate = $('#fDate'), fPrio = $('#fPrio'), prioText = $('#prioText');
const fUrgent = $('#fUrgent'), urgText = $('#urgText'), fNotes = $('#fNotes'), fSubmit = $('#fSubmit');
const form = { editingId: null, priority: 3, urgent: false };

function openAdd(task, fromDrag = false) {
  if (addSheet.isOpen) return;
  if (openLi) closeCard(openLi);
  if (!fromDrag) fillForm(task);
  addSheet.open(fromDrag);
  navOpen('add', closeAdd);
}
function closeAdd() {
  addSheet.close();
  navClosed('add');
}

function fillForm(task) {
  form.editingId = task?.id ?? null;
  fName.value = task?.name ?? '';
  fSubject.value = task?.subject ?? '';
  fDate.value = task?.date ?? todayISO();
  fNotes.value = task?.notes ?? '';
  setPriority(task?.priority ?? 3);
  setUrgent(!!task?.urgent);
  fSubmit.textContent = task ? 'Guardar' : 'Listo';
  renderChips();
  addForm.scrollTop = 0;
  autosize(fNotes);
}

function autosize(ta) {
  ta.style.height = 'auto';
  ta.style.height = `${Math.min(ta.scrollHeight + 2, 220)}px`;
}

// Sugerencias de materia: las del horario y las que ya se usaron
function subjectOptions() {
  const seen = new Map();
  for (const s of state.schedule.subjects) if (norm(s.name)) seen.set(norm(s.name), { name: s.name.trim(), color: s.color });
  for (const t of [...state.tasks].reverse()) {
    if (norm(t.subject) && !seen.has(norm(t.subject))) seen.set(norm(t.subject), { name: t.subject.trim(), color: taskColor(t) });
  }
  return [...seen.values()].slice(0, 14);
}
function renderChips() {
  const opts = subjectOptions(), cur = norm(fSubject.value);
  fChips.hidden = !opts.length;
  fChips.innerHTML = opts.map((o) => `<button type="button" class="chip${norm(o.name) === cur ? ' active' : ''}" data-name="${esc(o.name)}" style="--c:${o.color}"><i></i>${esc(o.name)}</button>`).join('');
}
function syncChips() {
  const cur = norm(fSubject.value);
  for (const c of fChips.children) c.classList.toggle('active', norm(c.dataset.name) === cur);
}
fChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  fSubject.value = chip.dataset.name;
  syncChips();
  haptic(6);
});
fSubject.addEventListener('input', syncChips);
fNotes.addEventListener('input', () => autosize(fNotes));
fName.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fSubject.focus(); } });
fSubject.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fSubject.blur(); } });

// Prioridad: el círculo sigue al dedo y al soltar se acomoda en la marca más cercana
$('.prio-track').insertAdjacentHTML('afterend', PRIO_COLORS.map((c, i) => `<i class="prio-tick" style="left:${i * 25}%;--tc:${c}"></i>`).join(''));

function setPriority(v, { user = false, snap = true } = {}) {
  v = clamp(Math.round(v), 1, 5);
  if (user && v !== form.priority) haptic(6);
  form.priority = v;
  if (snap) fPrio.style.setProperty('--p', (v - 1) / 4);
  fPrio.style.setProperty('--thumb', PRIO_COLORS[v - 1]);
  fPrio.setAttribute('aria-valuenow', v);
  fPrio.setAttribute('aria-valuetext', PRIO_TEXT[v]);
  prioText.textContent = PRIO_TEXT[v];
}
fPrio.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const rect = fPrio.getBoundingClientRect();
  const follow = (x) => {
    const f = clamp((x - rect.left) / rect.width, 0, 1);
    fPrio.style.setProperty('--p', f);
    setPriority(f * 4 + 1, { user: true, snap: false });
  };
  fPrio.setPointerCapture(e.pointerId);
  follow(e.clientX); // el primer toque se desliza con animación
  const move = (ev) => { fPrio.classList.add('dragging'); follow(ev.clientX); };
  const up = () => {
    fPrio.classList.remove('dragging');
    setPriority(form.priority);
    fPrio.removeEventListener('pointermove', move);
    fPrio.removeEventListener('pointerup', up);
    fPrio.removeEventListener('pointercancel', up);
  };
  fPrio.addEventListener('pointermove', move);
  fPrio.addEventListener('pointerup', up);
  fPrio.addEventListener('pointercancel', up);
});
fPrio.addEventListener('keydown', (e) => {
  const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
  if (step) { e.preventDefault(); setPriority(form.priority + step, { user: true }); }
});

function setUrgent(on, user = false) {
  form.urgent = on;
  fUrgent.setAttribute('aria-checked', String(on));
  urgText.textContent = on ? 'Sí' : 'No';
  if (user) haptic(on ? 14 : 6);
}
fUrgent.addEventListener('click', () => setUrgent(!form.urgent, true));

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = fName.value.trim();
  if (!name) { shake(fName); fName.focus(); return; }
  const data = {
    name,
    subject: fSubject.value.trim(),
    date: fDate.value || todayISO(),
    priority: form.priority,
    urgent: form.urgent,
    notes: fNotes.value.trim(),
  };
  const existing = form.editingId && state.tasks.find((t) => t.id === form.editingId);
  let fresh = [];
  if (existing) Object.assign(existing, data);
  else {
    const task = { id: uid(), done: false, doneAt: null, createdAt: Date.now(), ...data };
    state.tasks.push(task);
    fresh = [task.id];
  }
  save();
  haptic(12);
  closeAdd();
  setTimeout(() => renderTasks(fresh), 140);
});

$('#addClose').innerHTML = ICON.x;
$('#addClose').addEventListener('click', closeAdd);
sheetDrag(addSheet, $('#addHead'), closeAdd);

// Deslizar hacia arriba desde el espacio vacío de abajo: la hoja sigue al dedo
let zoneH = 0;
gesture(swipeZone, {
  when: () => nav.stack.length === 0,
  decide: (g) => g.dy < 0 && -g.dy > Math.abs(g.dx),
  begin: () => { fillForm(null); zoneH = addSheet.closedY(); },
  move: (g) => {
    const y = zoneH + g.dy;
    addSheet.place(y < 0 ? -rubber(-y, 30) : y, false);
  },
  end: (g) => {
    if ((-g.dy > zoneH * 0.18 && g.vy < 0.2) || g.vy < -0.3) openAdd(null, true);
    else addSheet.place(zoneH, true);
  },
});
// Un toque en el espacio vacío de abajo, o dos dedos hacia arriba en el trackpad, también la abren
swipeZone.addEventListener('click', () => { if (!nav.stack.length) openAdd(null); });
wheelSwipe(swipeZone, { up: { when: () => !nav.stack.length, run: () => openAdd(null) } });

/* ───────────── Detalle de tarea ───────────── */

const detailSheet = createSheet($('#detailSheet'), scrim);
const detailHero = $('#detailHero'), detailBody = $('#detailBody');
let detailId = null;

const linkify = (s) => esc(s).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);

function fillDetail(t) {
  const late = !t.done && dayDiff(t.date) < 0;
  detailHero.style.setProperty('--c', taskColor(t));
  $('#dName').textContent = t.name;
  $('#dSubject').textContent = t.subject || 'Sin materia';
  detailBody.innerHTML = `
    <div class="d-row">
      <span class="d-ico">${ICON.cal}</span>
      <div class="d-txt"><small>Fecha</small><b>${longDate(t.date)}</b></div>
      <span class="d-tag${late ? ' warn' : ''}">${late ? 'Atrasada' : dueRelative(t.date)}</span>
    </div>
    <div class="d-row">
      <span class="d-ico">${ICON.flag}</span>
      <div class="d-txt"><small>Prioridad</small><b>${PRIO_TEXT[t.priority]}</b></div>
      <span class="d-dots">${PRIO_COLORS.map((c, i) => `<i class="${i < t.priority ? 'on' : ''}" style="--tc:${c}"></i>`).join('')}</span>
    </div>
    <div class="d-row">
      <span class="d-ico">${ICON.bolt}</span>
      <div class="d-txt"><small>Urgente</small><b>${t.urgent ? 'Sí' : 'No'}</b></div>
      ${t.urgent ? '<span class="d-glow"></span>' : ''}
    </div>
    <div class="d-notes">
      <small>Notas</small>
      <p class="${t.notes ? '' : 'muted'}">${t.notes ? linkify(t.notes) : 'Sin notas'}</p>
    </div>
    <div class="d-actions">
      <button class="btn-soft" type="button" data-act="edit">${ICON.pencil}Editar</button>
      <button class="btn-primary" type="button" data-act="done">${t.done ? 'Desmarcar' : 'Completar'}</button>
    </div>`;
  detailBody.scrollTop = 0;
}

function openDetail(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t || nav.stack.length) return;
  detailId = id;
  fillDetail(t);
  detailSheet.open();
  navOpen('detail', closeDetail);
}
function closeDetail() {
  detailSheet.close();
  navClosed('detail');
}

detailBody.addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  const t = state.tasks.find((x) => x.id === detailId);
  if (!act || !t) return;
  if (act === 'done') {
    closeDetail();
    setTimeout(() => toggleDone(t.id), 220);
  } else if (act === 'edit') {
    // Pasa del detalle al formulario sin apagar el fondo
    detailSheet.close(true);
    fillForm(t);
    addSheet.open();
    navReplace('detail', 'add', closeAdd);
  }
});

$('#detailClose').innerHTML = ICON.x;
$('#detailDelete').innerHTML = ICON.trash;
$('#detailClose').addEventListener('click', closeDetail);
$('#detailDelete').addEventListener('click', () => {
  const id = detailId;
  closeDetail();
  setTimeout(() => deleteTask(id), 220);
});
sheetDrag(detailSheet, detailHero, closeDetail);

scrim.addEventListener('click', () => {
  if (topIs('add') || topIs('detail')) closeTop();
});

/* ───────────── Horario ───────────── */

const scheduleEl = $('#schedule'), schBody = $('#schBody'), schHead = $('#schHead');
const schTitle = $('#schTitle'), schSub = $('#schSub'), schGrid = $('#schGrid'), schPull = $('#schPull');
const dayToggles = $('#dayToggles'), subjList = $('#subjList');
const sch = { open: false, editing: false };
schPull.innerHTML = ICON.pencil;

// Botones discretos por si el gesto no sale: editar (lápiz/✓) y volver a las tareas
const schEditBtn = $('#schEditBtn'), schBackBtn = $('#schBackBtn');
schEditBtn.innerHTML = ICON.pencil;
schBackBtn.innerHTML = ICON.list;
schEditBtn.addEventListener('click', () => setEditing(!sch.editing));
schBackBtn.addEventListener('click', closeSchedule);
$('#openSched').innerHTML = ICON.cal;
$('#openSched').addEventListener('click', openSchedule);

// p = 0 (cerrado) … 1 (abierto). La pantalla principal se recorre un poco detrás.
function schProgress(p, animate) {
  const t = animate ? '' : 'none';
  scheduleEl.style.transition = t;
  mainEl.style.transition = t;
  mainDim.style.transition = t;
  scheduleEl.style.transform = `translate3d(${(p - 1) * 100}%, 0, 0)`;
  mainEl.style.transform = p > 0 ? `translate3d(${p * 22}%, 0, 0)` : '';
  mainDim.style.opacity = String(p);
}

function openSchedule() {
  if (sch.open) { schProgress(1, true); return; }
  if (openLi) closeCard(openLi);
  renderSchedule();
  sch.open = true;
  scheduleEl.inert = false;
  mainEl.inert = true;
  schProgress(1, true);
  navOpen('schedule', closeSchedule);
}
function closeSchedule() {
  if (sch.editing) setEditing(false);
  sch.open = false;
  scheduleEl.inert = true;
  mainEl.inert = false;
  schProgress(0, true);
  navClosed('schedule');
}

function scheduleStatus() {
  const S = state.schedule, today = new Date().getDay(), m = nowMinutes();
  if (!S.subjects.some((s) => s.name.trim())) return 'Desliza el título hacia abajo para armar tu horario';
  if (!S.days.includes(today)) return 'Hoy no hay clases 🌸';
  const classes = S.slots
    .map((slot) => ({ slot, subj: subjectById(S.cells[`${slot.id}:${today}`]) }))
    .filter((c) => c.subj?.name.trim());
  if (!classes.length) return 'Hoy no hay clases 🌸';
  const now = classes.find(({ slot }) => m >= toMin(slot.start) && m < toMin(slot.end));
  if (now) return `Ahorita estás en ${now.subj.name}`;
  const next = classes.find(({ slot }) => toMin(slot.start) > m);
  if (next) return `Tu siguiente clase es ${next.subj.name} a las ${fmtTime(next.slot.start)}`;
  return 'Ya acabaste tus clases de hoy 💗';
}
function updateSchSub() {
  swapText(schSub, sch.editing ? 'Toca una casilla para elegir la materia' : scheduleStatus());
}

function renderGrid() {
  const S = state.schedule;
  S.slots.sort((a, b) => toMin(a.start) - toMin(b.start));
  const days = WEEK_ORDER.filter((d) => S.days.includes(d));
  const today = new Date().getDay(), m = nowMinutes();
  const tab = sch.editing ? '' : ' tabindex="-1"';
  schGrid.style.setProperty('--cols', days.length);
  let html = '<span></span>' + days.map((d) => `<span class="sch-day${d === today ? ' today' : ''}">${DAY_SHORT[d]}</span>`).join('');
  for (const slot of S.slots) {
    html += `<button class="sch-time" type="button" data-slot="${slot.id}"${tab} aria-label="Editar hora ${fmtTime(slot.start)}">${fmtTime(slot.start)}<small>${fmtTime(slot.end)}</small></button>`;
    const live = m >= toMin(slot.start) && m < toMin(slot.end);
    for (const d of days) {
      const subj = subjectById(S.cells[`${slot.id}:${d}`]);
      const cls = `sch-cell${subj ? '' : ' empty'}${live && d === today ? ' now' : ''}`;
      const label = `${cap(WEEKDAYS[d])} ${fmtTime(slot.start)}: ${subj?.name || 'libre'}`;
      html += `<button class="${cls}" type="button" data-slot="${slot.id}" data-day="${d}"${tab} aria-label="${esc(label)}"${subj ? ` style="--c:${subj.color}"` : ''}>${subj ? esc(subj.name) : ''}</button>`;
    }
  }
  schGrid.innerHTML = html;
}

function renderDayToggles() {
  const days = state.schedule.days;
  dayToggles.innerHTML = WEEK_ORDER.map((d) => `<button class="day-tg${days.includes(d) ? ' on' : ''}" type="button" data-day="${d}" aria-pressed="${days.includes(d)}" aria-label="${cap(WEEKDAYS[d])}">${DAY_LETTER[d]}</button>`).join('');
}

function renderSubjects() {
  const subjects = state.schedule.subjects;
  subjList.innerHTML = subjects.length
    ? subjects.map((s) => `
      <div class="subj-row" data-id="${s.id}">
        <button class="subj-color" type="button" style="--c:${s.color}" aria-label="Cambiar color"></button>
        <input class="subj-name" value="${esc(s.name)}" placeholder="Nombre de la materia" maxlength="40" enterkeyhint="done">
        <button class="subj-del" type="button" aria-label="Eliminar materia">${ICON.x}</button>
      </div>`).join('')
    : '<p class="subj-empty">Agrega tus materias aquí o desde una casilla 🌸</p>';
}

function renderSchedule() {
  renderDayToggles();
  renderGrid();
  renderSubjects();
  updateSchSub();
}

function setEditing(on) {
  if (sch.editing === on) return;
  sch.editing = on;
  if (!on) {
    if (document.activeElement && scheduleEl.contains(document.activeElement)) document.activeElement.blur();
    cleanupSubjects();
  }
  scheduleEl.classList.toggle('editing', on);
  scheduleEl.querySelectorAll('.reveal').forEach((r) => { r.inert = !on; });
  schEditBtn.innerHTML = on ? ICON.check : ICON.pencil;
  schEditBtn.setAttribute('aria-label', on ? 'Terminar de editar' : 'Editar horario');
  swapText(schTitle, on ? 'Editar horario' : 'Tus Clases');
  renderGrid();
  renderSubjects();
  updateSchSub();
  save();
  haptic(10);
  if (on) navOpen('schedEdit', () => setEditing(false));
  else navClosed('schedEdit');
}

// Las materias sin nombre se descartan al terminar de editar
function cleanupSubjects() {
  const S = state.schedule;
  const blank = new Set(S.subjects.filter((s) => !s.name.trim()).map((s) => s.id));
  S.subjects = S.subjects.filter((s) => !blank.has(s.id));
  S.subjects.forEach((s) => { s.name = s.name.trim(); });
  for (const k of Object.keys(S.cells)) if (blank.has(S.cells[k])) delete S.cells[k];
}

function nextColor() {
  const used = new Set(state.schedule.subjects.map((s) => s.color));
  return PASTELS.find((c) => !used.has(c)) || PASTELS[state.schedule.subjects.length % PASTELS.length];
}
function addSubject(name) {
  const found = findSubject(name);
  if (found) return found;
  const s = { id: uid(), name, color: nextColor() };
  state.schedule.subjects.push(s);
  save();
  return s;
}

/* Abrir el horario deslizando hacia la derecha: desde el borde izquierdo o desde
   cualquier parte de la pantalla principal que no sea una tarjeta (el saludo, el
   espacio vacío…). Así funciona aunque Android se quede con el borde. */
const openScheduleSwipe = {
  when: (e) => nav.stack.length === 0 && !e.target.closest('.task, .swipe-zone, button'),
  decide: (g) => g.dx > 0 && g.dx > Math.abs(g.dy) * 1.1,
  begin: () => renderSchedule(),
  move: (g) => schProgress(clamp(g.dx / appW(), 0, 1), false),
  end: (g) => {
    if ((g.dx > appW() * 0.25 && g.vx > -0.2) || g.vx > 0.35) openSchedule();
    else schProgress(0, true);
  },
};
gesture(edgeZone, openScheduleSwipe);
gesture(mainEl, openScheduleSwipe);
wheelSwipe(mainEl, { right: { when: (e) => !nav.stack.length && !e.target.closest('.task'), run: openSchedule } });

// Cerrar el horario: deslizar hacia la izquierda en cualquier parte
function endScheduleSwipe(g) {
  if ((-g.dx > appW() * 0.25 && g.vx < 0.2) || g.vx < -0.35) closeSchedule();
  else schProgress(1, true);
}
gesture(scheduleEl, {
  when: (e) => topIs('schedule') && !schHead.contains(e.target),
  decide: (g) => g.dx < 0 && -g.dx > Math.abs(g.dy) * 1.1,
  move: (g) => schProgress(1 + clamp(g.dx / appW(), -1, 0), false),
  end: endScheduleSwipe,
});
wheelSwipe(scheduleEl, { left: { when: () => topIs('schedule'), run: closeSchedule } });
wheelSwipe(schHead, { down: { when: () => topIs('schedule') || topIs('schedEdit'), run: () => setEditing(!sch.editing) } });

// Jalar el título hacia abajo entra (o sale) del modo edición
const PULL_AT = 52;
gesture(schHead, {
  when: (e) => (topIs('schedule') || topIs('schedEdit')) && !e.target.closest('button'),
  decide: (g) => {
    if (g.dy > 0 && g.dy > Math.abs(g.dx)) { g.mode = 'pull'; g.armed = false; return true; }
    if (!sch.editing && g.dx < 0 && -g.dx > Math.abs(g.dy)) { g.mode = 'close'; return true; }
    return false;
  },
  move: (g) => {
    if (g.mode === 'close') { schProgress(1 + clamp(g.dx / appW(), -1, 0), false); return; }
    const y = rubber(Math.max(0, g.dy), 240);
    const p = clamp(y / PULL_AT, 0, 1);
    schBody.style.transition = 'none';
    schBody.style.transform = `translate3d(0, ${y}px, 0)`;
    schPull.style.transition = 'background-color .25s, color .25s';
    schPull.style.opacity = String(p);
    schPull.style.transform = `scale(${0.55 + 0.45 * p}) rotate(${(1 - p) * -140}deg)`;
    const armed = p >= 1;
    if (armed !== g.armed) {
      g.armed = armed;
      schPull.classList.toggle('armed', armed);
      if (armed) haptic(10);
    }
  },
  end: (g) => {
    if (g.mode === 'close') { endScheduleSwipe(g); return; }
    schBody.style.transition = '';
    schBody.style.transform = '';
    schPull.style.transition = '';
    schPull.style.opacity = '';
    schPull.style.transform = '';
    schPull.classList.remove('armed');
    if (g.armed) setEditing(!sch.editing);
  },
});

schGrid.addEventListener('click', (e) => {
  if (!topIs('schedEdit')) return;
  const cell = e.target.closest('.sch-cell');
  if (cell) return openPicker(cell.dataset.slot, Number(cell.dataset.day));
  const time = e.target.closest('.sch-time');
  if (time) openTimeEditor(time.dataset.slot);
});

dayToggles.addEventListener('click', (e) => {
  const btn = e.target.closest('.day-tg');
  if (!btn) return;
  const S = state.schedule, d = Number(btn.dataset.day);
  if (S.days.includes(d)) {
    if (S.days.length === 1) return shake(btn);
    S.days = S.days.filter((x) => x !== d);
  } else S.days.push(d);
  const on = S.days.includes(d);
  btn.classList.toggle('on', on);
  btn.setAttribute('aria-pressed', String(on));
  save();
  haptic(6);
  renderGrid();
});

$('#addSlot').addEventListener('click', () => {
  const S = state.schedule, last = S.slots.at(-1);
  const len = last ? Math.max(15, toMin(last.end) - toMin(last.start)) : 60;
  const start = last ? toMin(last.end) : 7 * 60;
  if (start + len > 24 * 60 - 1) return toast('Ya no caben más horas en el día');
  const slot = { id: uid(), start: fromMin(start), end: fromMin(start + len) };
  S.slots.push(slot);
  save();
  haptic(8);
  renderGrid();
  schGrid.querySelectorAll(`[data-slot="${slot.id}"]`).forEach((el, i) => {
    el.animate([{ opacity: 0, transform: 'translateY(10px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: i * 35, easing: EASE, fill: 'backwards' });
  });
});

$('#addSubj').addEventListener('click', () => {
  const s = { id: uid(), name: '', color: nextColor() };
  state.schedule.subjects.push(s);
  renderSubjects();
  const row = subjList.querySelector(`[data-id="${s.id}"]`);
  row.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
  row.querySelector('.subj-name').focus();
});

subjList.addEventListener('click', (e) => {
  const row = e.target.closest('.subj-row');
  const s = row && state.schedule.subjects.find((x) => x.id === row.dataset.id);
  if (!s) return;
  const colorBtn = e.target.closest('.subj-color');
  if (colorBtn) {
    s.color = PASTELS[(PASTELS.indexOf(s.color) + 1) % PASTELS.length];
    colorBtn.style.setProperty('--c', s.color);
    save();
    haptic(6);
    renderGrid();
  } else if (e.target.closest('.subj-del')) removeSubject(s.id);
});
subjList.addEventListener('input', (e) => {
  const row = e.target.closest('.subj-row');
  const s = row && state.schedule.subjects.find((x) => x.id === row.dataset.id);
  if (!s) return;
  s.name = e.target.value;
  save();
  renderGrid();
});
subjList.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });

function removeSubject(id) {
  const S = state.schedule, idx = S.subjects.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const [subject] = S.subjects.splice(idx, 1);
  const cells = {};
  for (const k of Object.keys(S.cells)) if (S.cells[k] === id) { cells[k] = id; delete S.cells[k]; }
  save();
  haptic(12);
  renderGrid();
  renderSubjects();
  if (subject.name.trim()) {
    toast('Materia eliminada', 'Deshacer', () => {
      S.subjects.splice(idx, 0, subject);
      Object.assign(S.cells, cells);
      save();
      renderGrid();
      renderSubjects();
    });
  }
}

function removeSlot(slotId) {
  const S = state.schedule, idx = S.slots.findIndex((s) => s.id === slotId);
  if (idx < 0) return;
  const [slot] = S.slots.splice(idx, 1);
  const cells = {};
  for (const k of Object.keys(S.cells)) if (k.startsWith(`${slotId}:`)) { cells[k] = S.cells[k]; delete S.cells[k]; }
  save();
  haptic(12);
  renderGrid();
  toast('Hora quitada', 'Deshacer', () => {
    S.slots.push(slot);
    Object.assign(S.cells, cells);
    save();
    renderGrid();
  });
}

$('#schDone').addEventListener('click', () => setEditing(false));

/* ───────────── Hoja pequeña: elegir materia / editar hora ───────────── */

const miniSheet = createSheet($('#miniSheet'), scrim2);
const miniTitle = $('#miniTitle'), miniBody = $('#miniBody');

function openMini() {
  miniBody.scrollTop = 0;
  miniSheet.open();
  navOpen('mini', closeMini);
}
function closeMini() {
  miniSheet.close();
  navClosed('mini');
}
$('#miniClose').innerHTML = ICON.x;
$('#miniClose').addEventListener('click', closeMini);
scrim2.addEventListener('click', closeMini);
sheetDrag(miniSheet, $('#miniHead'), closeMini);

function openPicker(slotId, day) {
  const S = state.schedule, slot = S.slots.find((s) => s.id === slotId);
  if (!slot) return;
  const key = `${slotId}:${day}`, current = S.cells[key] || '';
  miniTitle.textContent = `${cap(WEEKDAYS[day])} · ${fmtTime(slot.start)}`;
  miniBody.innerHTML = `
    <div class="pick-list">
      ${S.subjects.filter((s) => s.name.trim()).map((s) => `<button type="button" class="pick${s.id === current ? ' active' : ''}" data-id="${s.id}" style="--c:${s.color}">${esc(s.name)}</button>`).join('')}
      <button type="button" class="pick pick-free${current ? '' : ' active'}" data-id="">Libre</button>
    </div>
    <form class="pick-new" autocomplete="off">
      <input class="input" name="name" placeholder="Nueva materia" maxlength="40" enterkeyhint="done">
      <button class="round-btn" type="submit" aria-label="Agregar materia">${ICON.plus}</button>
    </form>`;
  miniBody.querySelector('.pick-list').addEventListener('click', (e) => {
    const pick = e.target.closest('.pick');
    if (!pick) return;
    closeMini();
    assignCell(key, pick.dataset.id || null);
  });
  miniBody.querySelector('.pick-new').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = e.currentTarget.elements.name, name = input.value.trim();
    if (!name) return shake(input);
    const s = addSubject(name);
    renderSubjects();
    closeMini();
    assignCell(key, s.id);
  });
  openMini();
}

function assignCell(key, subjectId) {
  const S = state.schedule;
  if (subjectId) S.cells[key] = subjectId;
  else delete S.cells[key];
  save();
  haptic(8);
  renderGrid();
  const [slot, day] = key.split(':');
  schGrid.querySelector(`.sch-cell[data-slot="${slot}"][data-day="${day}"]`)
    ?.animate([{ transform: 'scale(.8)' }, { transform: 'scale(1)' }], { duration: 560, delay: 90, easing: SPRING, fill: 'backwards' });
}

function openTimeEditor(slotId) {
  const slot = state.schedule.slots.find((s) => s.id === slotId);
  if (!slot) return;
  miniTitle.textContent = 'Editar hora';
  miniBody.innerHTML = `
    <div class="time-row">
      <label><span>Inicio</span><input class="input" type="time" value="${slot.start}"></label>
      <label><span>Fin</span><input class="input" type="time" value="${slot.end}"></label>
    </div>
    <div class="d-actions">
      <button class="btn-soft danger" type="button" data-act="del">${ICON.trash}Quitar</button>
      <button class="btn-primary" type="button" data-act="ok">Listo</button>
    </div>`;
  const [startIn, endIn] = miniBody.querySelectorAll('input');
  miniBody.querySelector('[data-act="ok"]').addEventListener('click', () => {
    if (!startIn.value || !endIn.value || toMin(endIn.value) <= toMin(startIn.value)) return shake(endIn);
    slot.start = startIn.value;
    slot.end = endIn.value;
    save();
    closeMini();
    renderGrid();
    updateSchSub();
  });
  miniBody.querySelector('[data-act="del"]').addEventListener('click', () => {
    closeMini();
    removeSlot(slotId);
  });
  openMini();
}

/* ───────────── Aviso inferior ───────────── */

let toastTimer;
function toast(text, action, onAction) {
  clearTimeout(toastTimer);
  toastEl.innerHTML = `<span>${esc(text)}</span>${action ? `<button type="button">${esc(action)}</button>` : ''}`;
  toastEl.classList.toggle('plain', !action);
  if (action) {
    toastEl.querySelector('button').addEventListener('click', () => { hideToast(); haptic(8); onAction(); });
  }
  toastEl.classList.add('show');
  toastTimer = setTimeout(hideToast, action ? 4200 : 2200);
}
function hideToast() {
  clearTimeout(toastTimer);
  toastEl.classList.remove('show');
}

/* ───────────── Teclado (para probar en la compu) ───────────── */

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeTop(); return; }
  if (e.target.closest?.('input, textarea') || nav.stack.length) return;
  if (e.key === 'n') openAdd(null);
  if (e.key === 'h') openSchedule();
});

/* ───────────── Inicio ───────────── */

function intro() {
  if (reduceMotion) return;
  const items = [...$('#hero').children, ...[...taskList.children].slice(0, 8)];
  items.forEach((el, i) => {
    el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 750, delay: 80 + i * 60, easing: EASE, fill: 'backwards' });
  });
}

function init() {
  updateHeader();
  renderTasks();
  intro();
  setInterval(updateHeader, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateHeader(); });

  navigator.storage?.persist?.().catch(() => {});
  const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator && secure) navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
