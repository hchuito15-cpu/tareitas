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

const TABS = ['task', 'material', 'project'];
const KIND_NAME = { task: 'Tarea', material: 'Material', project: 'Proyecto' };
const SORT_OPTS = [['date', 'Fecha límite'], ['subject', 'Materia'], ['importance', 'Importancia']];
const STATUS_OPTS = [['all', 'Todas'], ['pending', 'Sin terminar'], ['done', 'Terminadas']];
const URGENCY_OPTS = [['all', 'Todas'], ['urgent', 'Urgentes'], ['normal', 'No urgentes']];
// Cuántos días antes del examen aparece el aviso en la pantalla principal (-1 = sin aviso)
const REMIND_OPTS = [[-1, 'Sin aviso'], [0, 'El mismo día'], [1, '1 día antes'], [3, '3 días antes'], [7, '1 semana antes']];
const PARTIALS = ['1er parcial', '2º parcial', '3er parcial'];

/* ───────────── Utilidades ───────────── */

const $ = (sel, root = document) => root.querySelector(sel);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const norm = (s) => String(s ?? '').trim().toLowerCase();
const haptic = (pattern = 8) => {
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; // Chrome lo bloquea antes del primer toque
  try { navigator.vibrate?.(pattern); } catch (_) { /* sin vibración */ }
};
// Resistencia elástica cuando se arrastra más allá del límite
const rubber = (d, max) => max * (1 - 1 / ((d * 0.9) / max + 1));
const EASE = 'cubic-bezier(.22, 1, .36, 1)';
const SPRING = 'cubic-bezier(.34, 1.36, .64, 1)';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const parseNum = (s) => {
  const n = parseFloat(String(s ?? '').replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const money = (n) => `$${Number(n).toLocaleString('es-MX', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

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
  book: svg('<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14.5H6.5A1.5 1.5 0 0 0 5 19z"/><path d="M5 19a1.5 1.5 0 0 0 1.5 1.5H19"/><path d="M9 7.5h6"/>'),
  sliders: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  folder: svg('<path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17z"/>'),
  tag: svg('<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.3"/>'),
  note: svg('<path d="M6 3.5h9l3.5 3.5V20.5H6z"/><path d="M9 11h6M9 15h6"/>'),
  bell: svg('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>'),
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
const addDaysISO = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoDate(d); };
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
const VIEW_DEFAULT = { sort: 'date', status: 'all', urgency: 'all' };

function newSubject(name = '', color = PASTELS[0]) {
  return { id: uid(), name, color, grades: [null, null, null], exams: [], reminders: [] };
}
function defaultSchedule() {
  const slots = [];
  for (let h = 7; h < 14; h++) slots.push({ id: uid(), start: fromMin(h * 60), end: fromMin(h * 60 + 60) });
  return { days: [1, 2, 3, 4, 5], slots, cells: {} };
}
// Lee lo guardado y lo pasa al formato actual (las versiones anteriores no tenían tipos ni proyectos)
function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (_) { /* datos ilegibles: empezar de cero */ }
  saved = saved || {};
  const schedule = saved.schedule?.slots ? saved.schedule : defaultSchedule();
  const subjects = (saved.subjects || schedule.subjects || []).map((s) => ({
    ...newSubject(),
    ...s,
    grades: [0, 1, 2].map((i) => s.grades?.[i] ?? null),
  }));
  delete schedule.subjects;
  const views = saved.prefs?.views || {};
  return {
    tasks: (Array.isArray(saved.tasks) ? saved.tasks : []).map((t) => ({ kind: 'task', projectId: null, price: null, ...t })),
    projects: Array.isArray(saved.projects) ? saved.projects : [],
    subjects,
    schedule,
    prefs: { views: Object.fromEntries(TABS.map((k) => [k, { ...VIEW_DEFAULT, ...views[k] }])) },
  };
}
const state = load();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) { /* almacenamiento bloqueado */ }
}

const subjectById = (id) => (id ? state.subjects.find((s) => s.id === id) : null);
const findSubject = (name) => state.subjects.find((s) => norm(s.name) && norm(s.name) === norm(name));
const projectById = (id) => (id ? state.projects.find((p) => p.id === id) : null);
const itemById = (id) => state.tasks.find((t) => t.id === id);
const projectItems = (p) => state.tasks.filter((t) => t.projectId === p.id);
const isComplete = (p) => { const items = projectItems(p); return items.length > 0 && items.every((t) => t.done); };

function hashColor(s) {
  let h = 7;
  for (const ch of s) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return PASTELS[h % (PASTELS.length - 1)]; // sin el gris
}
// Todo toma el color de su materia; si la materia no existe, uno fijo según el texto
const colorFor = (subject, fallback) => findSubject(subject)?.color || hashColor(norm(subject) || norm(fallback));
const taskColor = (t) => colorFor(t.subject, t.name);
const projectColor = (p) => colorFor(p.subject, p.name);

// Calificaciones: escala de 10 (o de 100 si alguna pasa de 10)
function average(grades) {
  const g = grades.filter((x) => x != null);
  return g.length ? sum(g) / g.length : null;
}
const fmtGrade = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
function gradeClass(avg, grades) {
  const scale = grades.some((x) => x != null && x > 10) ? 100 : 10;
  return avg < scale * 0.6 ? 'low' : avg < scale * 0.8 ? 'mid' : 'high';
}

/* ───────────── Elementos ───────────── */

const appEl = $('#app'), mainEl = $('#main'), mainDim = $('#mainDim');
const greetEl = $('#greeting'), dateEl = $('#date'), weekdayEl = $('#weekday'), heroNote = $('#heroNote');
const listWrap = $('#listWrap'), taskList = $('#taskList'), emptyEl = $('#empty'), emptyText = $('#emptyText');
const tabsEl = $('#tabs'), filterBtn = $('#filterBtn');
const swipeZone = $('#swipeZone'), edgeZone = $('#edgeZone'), edgeZoneR = $('#edgeZoneR');
const scrim = $('#scrim'), scrim2 = $('#scrim2'), toastEl = $('#toast');
const appW = () => appEl.clientWidth;
const ui = { tab: 'task', detail: null, subjectId: null };

/* ───────────── Botón "atrás" de Android ─────────────
   `nav.stack` es lo único que dice qué está abierto. Abrir o cerrar desde la interfaz
   no toca el historial del navegador. Solo existe UNA entrada extra ("trampa"):
   cuando llega un "atrás", se cierra lo de arriba y se vuelve a la trampa con
   history.forward(). En la pantalla principal, "atrás" avisa y el siguiente sale. */

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
  if (nav.stack.length) {
    closeTop();
    history.forward();
  } else {
    toast('Desliza otra vez para salir');
  }
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
    const g = { dx: 0, dy: 0, vx: 0, vy: 0, active: false, target: e.target, pts: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }] };
    // Se dibuja como máximo una vez por cuadro de pantalla, aunque lleguen más eventos
    let frame = 0;
    const draw = () => { frame = 0; o.move(g); };

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
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onUp = (ev) => {
      if (ev.type !== 'blur' && ev.pointerId !== e.pointerId) return;
      finish();
      if (!g.active) return;
      if (frame) { cancelAnimationFrame(frame); draw(); }
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

// Cambia un texto con un desvanecido suave (el cambio va con temporizador para que ocurra siempre)
function swapText(el, text) {
  if ((el.dataset.next ?? el.textContent) === text) return;
  clearTimeout(el._swap);
  el._out?.cancel();
  if (!el.textContent || reduceMotion) { el.textContent = text; delete el.dataset.next; return; }
  el.dataset.next = text;
  el._out = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' });
  el._swap = setTimeout(() => {
    el.textContent = text;
    delete el.dataset.next;
    el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
    el._out.cancel();
    el._out = null;
  }, 200);
}

// Control segmentado (pestañas y tipo de elemento): una píldora blanca se desliza a la opción elegida
function setupSeg(el, onPick) {
  el.style.setProperty('--n', el.querySelectorAll('button').length);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) onPick(b.dataset.val);
  });
}
function setSeg(el, val) {
  const btns = [...el.querySelectorAll('button')];
  const i = Math.max(0, btns.findIndex((b) => b.dataset.val === val));
  el.style.setProperty('--i', i);
  btns.forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));
}

// Fiesta al terminar algo 🎉 (sale desde el elemento tocado)
function celebrate(el, big = false) {
  const a = appEl.getBoundingClientRect();
  let x = a.width / 2, y = a.height * 0.45;
  const r = el?.getBoundingClientRect();
  if (r?.width) { x = r.left + r.width / 2 - a.left; y = r.top + r.height / 2 - a.top; }
  confetti(x, y, big ? { count: 150, spread: 80, power: 1.3 } : { count: 60, spread: 55 });
}

/* ───────────── Encabezado ───────────── */

let lastDay = '';
function updateHeader() {
  const now = new Date();
  swapText(greetEl, greetingFor(now));
  dateEl.textContent = `${pad(now.getDate())} ${MONTHS[now.getMonth()]}`;
  weekdayEl.textContent = WEEKDAYS[now.getDay()];
  const day = isoDate(now);
  if (lastDay && day !== lastDay) { renderList(); renderMaterias(); }
  lastDay = day;
  refreshSchedule();
  renderHeroNote();
}

// Exámenes y recordatorios que ya deben avisarse
function upcomingAlerts() {
  const out = [];
  for (const s of state.subjects) {
    if (!s.name.trim()) continue;
    for (const e of s.exams) {
      const n = dayDiff(e.date);
      if (e.remind >= 0 && n >= 0 && n <= e.remind) out.push({ n, time: e.time || '', text: `📚 ${e.title || 'Examen'} de ${s.name}`, subjectId: s.id });
    }
    for (const r of s.reminders) {
      const n = dayDiff(r.date);
      if (n >= 0 && n <= 1) out.push({ n, time: r.time || '', text: `🔔 ${r.text}`, subjectId: s.id });
    }
  }
  return out.sort((a, b) => a.n - b.n || a.time.localeCompare(b.time));
}
function renderHeroNote() {
  const alerts = upcomingAlerts();
  heroNote.hidden = !alerts.length;
  if (!alerts.length) return;
  const a = alerts[0];
  const when = `${dueLabel(addDaysISO(todayISO(), a.n)).toLowerCase()}${a.time ? ` ${fmtTime(a.time)}` : ''}`;
  heroNote.innerHTML = `<span class="note-txt">${esc(a.text)} · ${esc(when)}</span>${alerts.length > 1 ? `<span class="note-more">+${alerts.length - 1}</span>` : ''}`;
  heroNote.dataset.subject = a.subjectId;
}
heroNote.addEventListener('click', () => {
  if (nav.stack.length) return;
  openMaterias();
  setTimeout(() => openSubject(heroNote.dataset.subject), 260);
});

/* ───────────── Lista: Tareas / Materiales / Proyectos ───────────── */

const viewOf = (tab = ui.tab) => state.prefs.views[tab];
const filtersActive = (v) => v.sort !== 'date' || v.status !== 'all' || v.urgency !== 'all';
const subjKey = (x) => norm(x.subject) || '￿'; // sin materia al final
const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

function itemMatches(t, v) {
  if (v.status === 'pending' && t.done) return false;
  if (v.status === 'done' && !t.done) return false;
  if (v.urgency === 'urgent' && !t.urgent) return false;
  if (v.urgency === 'normal' && t.urgent) return false;
  return true;
}
function compareItems(sort) {
  const importance = (a, b) => (+!!b.urgent - +!!a.urgent) || (b.priority - a.priority);
  return (a, b) => {
    if (sort === 'importance') return importance(a, b) || byDate(a, b) || a.createdAt - b.createdAt;
    if (sort === 'subject') return subjKey(a).localeCompare(subjKey(b), 'es') || byDate(a, b) || importance(a, b);
    return byDate(a, b) || importance(a, b) || a.createdAt - b.createdAt;
  };
}
function compareProjects(sort) {
  const score = (p) => {
    const pending = projectItems(p).filter((t) => !t.done);
    return [pending.some((t) => t.urgent) ? 1 : 0, Math.max(0, ...pending.map((t) => t.priority || 0))];
  };
  return (a, b) => {
    const ca = isComplete(a), cb = isComplete(b);
    if (ca !== cb) return ca ? 1 : -1;
    if (sort === 'subject') return subjKey(a).localeCompare(subjKey(b), 'es') || byDate(a, b);
    if (sort === 'importance') {
      const [ua, pa] = score(a), [ub, pb] = score(b);
      return ub - ua || pb - pa || byDate(a, b);
    }
    return byDate(a, b) || a.createdAt - b.createdAt;
  };
}
const byDoneAt = (a, b) => (b.doneAt || 0) - (a.doneAt || 0);

// Filas que se van a mostrar en la pestaña actual (cada una con una clave única)
function buildRows() {
  const v = viewOf(), rows = [];
  if (ui.tab === 'project') {
    const filtered = v.status !== 'all' || v.urgency !== 'all';
    for (const p of [...state.projects].sort(compareProjects(v.sort))) {
      const items = projectItems(p);
      const visible = items.filter((t) => itemMatches(t, v));
      if (filtered && !visible.length) continue;
      rows.push({ key: `p:${p.id}`, type: 'project', project: p, items });
      const sort = v.sort === 'subject' ? 'date' : v.sort;
      for (const t of [...visible.filter((x) => !x.done).sort(compareItems(sort)), ...visible.filter((x) => x.done).sort(byDoneAt)]) {
        rows.push({ key: t.id, type: 'item', item: t, inProject: true });
      }
      if (!items.length) rows.push({ key: `h:${p.id}`, type: 'hint', text: 'Toca + para agregarle tareas o materiales' });
    }
    return rows;
  }
  const items = state.tasks.filter((t) => t.kind === ui.tab && itemMatches(t, v));
  const pending = items.filter((t) => !t.done).sort(compareItems(v.sort));
  const done = items.filter((t) => t.done).sort(byDoneAt);
  if (ui.tab === 'material') {
    const toBuy = pending.filter((t) => t.price != null);
    if (toBuy.length) rows.push({ key: '__sum', type: 'summary', text: `Por conseguir: <b>${money(sum(toBuy.map((t) => t.price)))}</b> · ${toBuy.length} ${toBuy.length === 1 ? 'material' : 'materiales'}` });
  }
  let group = null;
  for (const t of pending) {
    if (v.sort === 'subject' && subjKey(t) !== group) {
      group = subjKey(t);
      rows.push({ key: `g:${group}`, type: 'label', text: t.subject.trim() || 'Sin materia', color: t.subject.trim() ? taskColor(t) : null });
    }
    rows.push({ key: t.id, type: 'item', item: t });
  }
  if (done.length && v.status === 'all') rows.push({ key: '__done', type: 'label', text: 'Hechas' });
  for (const t of done) rows.push({ key: t.id, type: 'item', item: t });
  return rows;
}

const DEL_W = 84; // cuánto se recorre la tarjeta para mostrar el botón de borrar
let openLi = null;

function itemEl() {
  const li = document.createElement('li');
  li.className = 'task';
  li.dataset.type = 'item';
  li.innerHTML = `
    <button class="task-del" type="button" tabindex="-1" aria-label="Eliminar">${ICON.trash}</button>
    <div class="task-card" role="button" tabindex="0">
      <div class="task-text"><span class="task-name"><span></span></span><span class="task-meta"></span></div>
      <span class="task-price"></span>
      <span class="task-urgent" aria-label="Urgente"></span>
      <button class="task-check" type="button">${ICON.check}</button>
    </div>`;
  li._del = li.firstElementChild;
  li._card = li.lastElementChild;
  attachCardGestures(li);
  return li;
}
function updateItemEl(li, t, inProject) {
  const overdue = !t.done && dayDiff(t.date) < 0;
  li.classList.toggle('done', !!t.done);
  li.classList.toggle('urgent', !!t.urgent && !t.done);
  li.classList.toggle('overdue', overdue);
  li.classList.toggle('in-project', !!inProject);
  li._card.style.setProperty('--c', taskColor(t));
  li.querySelector('.task-name > span').textContent = t.name;
  const when = overdue ? `Atrasada · ${dueLabel(t.date)}` : dueLabel(t.date);
  const project = !inProject && projectById(t.projectId);
  li.querySelector('.task-meta').textContent = [t.subject, project && `📁 ${project.name}`, when].filter(Boolean).join(' · ');
  li.querySelector('.task-price').textContent = t.kind === 'material' && t.price != null ? money(t.price) : '';
  li.querySelector('.task-check').setAttribute('aria-label', t.done ? 'Marcar como pendiente' : 'Marcar como hecha');
}

function projEl() {
  const li = document.createElement('li');
  li.className = 'proj';
  li.dataset.type = 'project';
  li.innerHTML = `
    <div class="proj-card" role="button" tabindex="0">
      <div class="proj-text">
        <span class="proj-name"></span>
        <span class="proj-meta"></span>
        <span class="proj-progress"><span class="bar"><i></i></span><span class="proj-count"></span></span>
      </div>
      <button class="proj-add" type="button" aria-label="Agregar al proyecto">${ICON.plus}</button>
    </div>`;
  return li;
}
function updateProjEl(li, p, items) {
  const done = items.filter((t) => t.done).length, total = items.length;
  const complete = total > 0 && done === total;
  const cost = sum(items.filter((t) => t.kind === 'material' && t.price != null).map((t) => t.price));
  li.classList.toggle('complete', complete);
  li.querySelector('.proj-card').style.setProperty('--c', projectColor(p));
  li.querySelector('.proj-name').textContent = complete ? `${p.name} ✓` : p.name;
  const late = !complete && dayDiff(p.date) < 0;
  li.querySelector('.proj-meta').textContent = [p.subject, `${late ? 'Atrasado · ' : ''}Entrega ${dueLabel(p.date).toLowerCase()}`].filter(Boolean).join(' · ');
  li.querySelector('.proj-meta').classList.toggle('late', late);
  li.querySelector('.bar i').style.setProperty('--prog', total ? done / total : 0);
  li.querySelector('.proj-count').textContent = `${total ? `${done}/${total}` : 'Vacío'}${cost ? ` · ${money(cost)}` : ''}`;
}

function rowEl(row) {
  if (row.type === 'item') return itemEl();
  if (row.type === 'project') return projEl();
  const li = document.createElement('li');
  li.className = { label: 'group-label', hint: 'list-hint', summary: 'list-summary' }[row.type];
  li.dataset.type = row.type;
  return li;
}
function updateRow(el, row) {
  el.dataset.key = row.key;
  if (row.type === 'item') updateItemEl(el, row.item, row.inProject);
  else if (row.type === 'project') updateProjEl(el, row.project, row.items);
  else if (row.type === 'label') el.innerHTML = `${row.color ? `<i style="--c:${row.color}"></i>` : ''}${esc(row.text)}`;
  else if (row.type === 'summary') el.innerHTML = row.text;
  else el.textContent = row.text;
}

/* Dibuja la lista reutilizando lo que ya existe y anima los cambios de posición
   (técnica FLIP) para que todo se reacomode con suavidad. */
function renderList(fresh = []) {
  const before = new Map();
  for (const el of taskList.children) before.set(el.dataset.key, el.getBoundingClientRect().top);
  const existing = new Map([...taskList.children].map((el) => [el.dataset.key, el]));
  const rows = buildRows();
  let i = 0;
  for (const row of rows) {
    let el = existing.get(row.key);
    if (el && el.dataset.type === row.type) existing.delete(row.key);
    else el = rowEl(row);
    updateRow(el, row);
    if (taskList.children[i] !== el) taskList.insertBefore(el, taskList.children[i] || null);
    i++;
  }
  existing.forEach((el) => { if (openLi === el) openLi = null; el.remove(); });

  if (!reduceMotion) {
    for (const el of taskList.children) {
      const top = before.get(el.dataset.key);
      if (top === undefined) {
        if (fresh.includes(el.dataset.key) || el.dataset.type === 'label') {
          el.animate([{ opacity: 0, transform: 'translateY(18px) scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 560, easing: EASE });
        }
        continue;
      }
      const dy = top - el.getBoundingClientRect().top;
      if (Math.abs(dy) > 0.5) el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 560, easing: EASE });
    }
  }

  const hasContent = rows.some((r) => r.type === 'item' || r.type === 'project');
  const v = viewOf();
  emptyText.textContent = v.status !== 'all' || v.urgency !== 'all'
    ? 'Nada con estos filtros'
    : { task: 'Sin pendientes por ahora', material: 'Sin materiales por conseguir', project: 'Aún no hay proyectos' }[ui.tab];
  emptyEl.classList.toggle('show', !hasContent);
}

// Las tarjetas toman el color de su materia: se repinta en cuanto cambia una materia
const refreshTaskColors = () => renderList();

// Cambiar de pestaña con un deslizamiento suave en la dirección del cambio.
// El cambio de contenido va con temporizador (no con el fin de la animación) para que ocurra siempre.
let tabOut = null, tabTimer = 0;
function setTab(tab) {
  if (tab === ui.tab) return;
  const dir = TABS.indexOf(tab) > TABS.indexOf(ui.tab) ? 1 : -1;
  ui.tab = tab;
  setSeg(tabsEl, tab);
  updateFilterBtn();
  if (openLi) closeCard(openLi);
  haptic(5);
  clearTimeout(tabTimer);
  tabOut?.cancel();
  const swap = () => {
    taskList.replaceChildren();
    listWrap.scrollTop = 0;
    renderList();
  };
  if (reduceMotion) { swap(); return; }
  tabOut = taskList.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * 26}px)` }], { duration: 150, easing: 'ease-in', fill: 'forwards' });
  tabTimer = setTimeout(() => {
    swap();
    taskList.animate([{ opacity: 0, transform: `translateX(${dir * 26}px)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE });
    tabOut.cancel();
    tabOut = null;
  }, 150);
}
setupSeg(tabsEl, setTab);

function updateFilterBtn() {
  filterBtn.classList.toggle('on', filtersActive(viewOf()));
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
      if (g.dx < 0 && !base) return false; // hacia la izquierda: lo toma el gesto de Materias
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
      if (armed) deleteItem(li.dataset.key);
      else if (g.vx > 0.35 || (x > DEL_W * 0.5 && g.vx > -0.35)) openCard(li);
      else closeCard(li);
    },
  });
}

document.addEventListener('pointerdown', (e) => {
  if (openLi && !openLi.contains(e.target)) closeCard(openLi);
}, true);

// Con el trackpad: dos dedos a la derecha sobre una tarjeta muestran "eliminar"
wheelSwipe(taskList, {
  right: { when: (e) => !nav.stack.length && e.target.closest('.task'), run: (e) => openCard(e.target.closest('.task')) },
  left: { when: (e) => !nav.stack.length && e.target.closest('.task.swiped'), run: (e) => closeCard(e.target.closest('.task')) },
});

taskList.addEventListener('click', (e) => {
  const proj = e.target.closest('.proj');
  if (proj) {
    const id = proj.dataset.key.slice(2);
    if (e.target.closest('.proj-add')) openAdd(null, false, { type: 'task', projectId: id });
    else openProject(id);
    return;
  }
  const li = e.target.closest('.task');
  if (!li) return;
  const id = li.dataset.key;
  if (e.target.closest('.task-del')) return deleteItem(id);
  if (li.classList.contains('swiped')) return closeCard(li);
  if (e.target.closest('.task-check')) return toggleDone(id, e.target.closest('.task-check'));
  if (e.target.closest('.task-card')) openDetail(id);
});
taskList.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  if (e.target.classList.contains('task-card')) { e.preventDefault(); openDetail(e.target.closest('.task').dataset.key); }
  if (e.target.classList.contains('proj-card')) { e.preventDefault(); openProject(e.target.closest('.proj').dataset.key.slice(2)); }
});

let reorderTimer;
function toggleDone(id, fromEl) {
  const t = itemById(id);
  if (!t) return;
  const project = projectById(t.projectId);
  const wasComplete = project && isComplete(project);
  t.done = !t.done;
  t.doneAt = t.done ? Date.now() : null;
  save();
  haptic(t.done ? [10, 40, 12] : 8);
  const li = taskList.querySelector(`.task[data-key="${id}"]`);
  if (li) updateItemEl(li, t, li.classList.contains('in-project'));
  if (project) {
    const head = taskList.querySelector(`.proj[data-key="p:${project.id}"]`);
    if (head) updateProjEl(head, project, projectItems(project));
  }
  if (t.done) {
    celebrate(fromEl || li?.querySelector('.task-check'));
    if (project && !wasComplete && isComplete(project)) {
      setTimeout(() => { celebrate(null, true); toast(`¡Terminaste "${project.name}"! 🎉`); }, 450);
    }
  }
  // Deja ver la palomita y el confeti antes de reacomodar
  clearTimeout(reorderTimer);
  reorderTimer = setTimeout(() => renderList(), 800);
}

function deleteItem(id) {
  const idx = state.tasks.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const [item] = state.tasks.splice(idx, 1);
  save();
  haptic(14);
  const li = taskList.querySelector(`.task[data-key="${id}"]`);
  if (li) {
    if (openLi === li) openLi = null;
    li._card.style.transition = `transform .38s ${EASE}, opacity .3s ease`;
    li._card.style.transform = 'translate3d(105%, 0, 0)';
    li._card.style.opacity = '0';
    li._del.style.transition = 'opacity .25s ease, transform .3s ease';
    li._del.style.opacity = '0';
    li._del.style.transform = 'scale(.6)';
  }
  setTimeout(() => renderList(), li ? 260 : 0);
  toast(item.kind === 'material' ? 'Material eliminado' : 'Tarea eliminada', 'Deshacer', () => {
    state.tasks.splice(Math.min(idx, state.tasks.length), 0, item);
    save();
    renderList([item.id]);
  });
}

// Borra el proyecto junto con sus tareas y materiales (se puede deshacer)
function deleteProject(id) {
  const pi = state.projects.findIndex((p) => p.id === id);
  if (pi < 0) return;
  const [project] = state.projects.splice(pi, 1);
  const removed = state.tasks.filter((t) => t.projectId === id);
  state.tasks = state.tasks.filter((t) => t.projectId !== id);
  save();
  haptic(14);
  renderList();
  toast('Proyecto eliminado', 'Deshacer', () => {
    state.projects.splice(pi, 0, project);
    state.tasks.push(...removed);
    save();
    renderList([`p:${id}`]);
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
    when: (e) => sheet.isOpen && !e.target.closest('input, textarea'),
    decide: (g) => Math.abs(g.dy) > Math.abs(g.dx),
    begin: () => { h = sheet.closedY(); },
    move: (g) => sheet.place(g.dy > 0 ? g.dy : -rubber(-g.dy, 24), false),
    end: (g) => (g.dy > h * 0.2 || g.vy > 0.45 ? onClose() : sheet.place(0, true)),
  });
  wheelSwipe(handle, { down: { when: () => sheet.isOpen, run: onClose } });
}

/* ───────────── Agregar / editar ───────────── */

const addSheet = createSheet($('#addSheet'), scrim);
const addForm = $('#addForm'), fType = $('#fType'), fName = $('#fName'), fSubject = $('#fSubject'), fChips = $('#fChips');
const fProjectWrap = $('#fProjectWrap'), fProjects = $('#fProjects'), fDateLbl = $('#fDateLbl'), fDate = $('#fDate'), fPrice = $('#fPrice');
const fPrio = $('#fPrio'), prioText = $('#prioText');
const fUrgent = $('#fUrgent'), urgText = $('#urgText'), fNotes = $('#fNotes'), fSubmit = $('#fSubmit');
const form = { editing: null, type: 'task', priority: 3, urgent: false, projectId: null };

function openAdd(obj, fromDrag = false, preset = {}) {
  if (addSheet.isOpen) return;
  if (openLi) closeCard(openLi);
  if (!fromDrag) fillForm(obj, preset);
  addSheet.open(fromDrag);
  navOpen('add', closeAdd);
}
function closeAdd() {
  addSheet.close();
  navClosed('add');
}

// obj: tarea/material (tienen `kind`), proyecto, o nada para uno nuevo
function fillForm(obj = null, preset = {}) {
  const isProject = !!obj && !('kind' in obj);
  form.editing = obj ? { id: obj.id, isProject } : null;
  form.projectId = obj ? (isProject ? null : obj.projectId ?? null) : preset.projectId ?? null;
  fType.hidden = !!obj;
  fName.value = obj?.name ?? '';
  fSubject.value = obj?.subject ?? projectById(form.projectId)?.subject ?? '';
  fDate.value = obj?.date ?? (form.projectId ? projectById(form.projectId)?.date : null) ?? todayISO();
  fNotes.value = obj?.notes ?? '';
  fPrice.value = obj?.price != null ? String(obj.price) : '';
  setPriority(obj?.priority ?? 3);
  setUrgent(!!obj?.urgent);
  setFormType(obj ? (isProject ? 'project' : obj.kind) : preset.type || ui.tab);
  renderChips();
  addForm.scrollTop = 0;
  autosize(fNotes);
}

function setFormType(type) {
  form.type = type;
  setSeg(fType, type);
  addForm.querySelectorAll('[data-show]').forEach((el) => { el.hidden = !el.dataset.show.split(' ').includes(type); });
  if (type !== 'project') { renderProjectChips(); fProjectWrap.hidden = !state.projects.length; }
  fName.placeholder = { task: 'Nombre de la tarea', material: 'Nombre del material', project: 'Nombre del proyecto' }[type];
  fDateLbl.textContent = { task: 'Fecha', material: '¿Para cuándo?', project: 'Fecha de entrega' }[type];
  fSubmit.textContent = form.editing ? 'Guardar' : 'Listo';
}
setupSeg(fType, (val) => { if (val !== form.type) { haptic(5); setFormType(val); } });

function autosize(ta) {
  ta.style.height = 'auto';
  ta.style.height = `${Math.min(ta.scrollHeight + 2, 220)}px`;
}

// Sugerencias de materia: las registradas y las que ya se usaron
function subjectOptions() {
  const seen = new Map();
  for (const s of state.subjects) if (norm(s.name)) seen.set(norm(s.name), { name: s.name.trim(), color: s.color });
  for (const t of [...state.tasks, ...state.projects].reverse()) {
    if (norm(t.subject) && !seen.has(norm(t.subject))) seen.set(norm(t.subject), { name: t.subject.trim(), color: colorFor(t.subject) });
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

function renderProjectChips() {
  const list = [...state.projects].sort(compareProjects('date')).filter((p) => !isComplete(p) || p.id === form.projectId);
  fProjects.innerHTML = `<button type="button" class="chip${form.projectId ? '' : ' active'}" data-id="">Ninguno</button>`
    + list.map((p) => `<button type="button" class="chip${p.id === form.projectId ? ' active' : ''}" data-id="${p.id}" style="--c:${projectColor(p)}"><i></i>${esc(p.name)}</button>`).join('');
}
fProjects.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  form.projectId = chip.dataset.id || null;
  for (const c of fProjects.children) c.classList.toggle('active', c === chip);
  const p = projectById(form.projectId);
  if (p && !fSubject.value.trim() && p.subject) { fSubject.value = p.subject; syncChips(); }
  haptic(6);
});

fNotes.addEventListener('input', () => autosize(fNotes));
fName.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fSubject.focus(); } });
fSubject.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fSubject.blur(); } });
fPrice.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fPrice.blur(); } });

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
  const base = { name, subject: fSubject.value.trim(), date: fDate.value || todayISO(), notes: fNotes.value.trim() };
  let fresh = [], target;
  if (form.type === 'project') {
    const existing = form.editing && projectById(form.editing.id);
    if (existing) Object.assign(existing, base);
    else {
      const p = { id: uid(), createdAt: Date.now(), ...base };
      state.projects.push(p);
      fresh = [`p:${p.id}`];
    }
    target = 'project';
  } else {
    const data = {
      ...base,
      kind: form.type,
      projectId: projectById(form.projectId) ? form.projectId : null,
      price: form.type === 'material' ? parseNum(fPrice.value) : null,
      priority: form.priority,
      urgent: form.urgent,
    };
    const existing = form.editing && itemById(form.editing.id);
    if (existing) Object.assign(existing, data);
    else {
      const item = { id: uid(), done: false, doneAt: null, createdAt: Date.now(), ...data };
      state.tasks.push(item);
      fresh = [item.id];
    }
    // Se queda en Proyectos si se agregó a un proyecto desde ahí; si no, va a su pestaña
    target = ui.tab === 'project' && data.projectId ? 'project' : data.kind;
  }
  save();
  haptic(12);
  closeAdd();
  setTimeout(() => { if (target !== ui.tab) setTab(target); else renderList(fresh); }, 140);
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

/* ───────────── Detalle (tarea, material o proyecto) ───────────── */

const detailSheet = createSheet($('#detailSheet'), scrim);
const detailHero = $('#detailHero'), detailBody = $('#detailBody');

const linkify = (s) => esc(s).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
const notesBlock = (notes) => `
  <div class="d-notes">
    <small>Notas</small>
    <p class="${notes ? '' : 'muted'}">${notes ? linkify(notes) : 'Sin notas'}</p>
  </div>`;
const dateRow = (label, iso, late) => `
  <div class="d-row">
    <span class="d-ico">${ICON.cal}</span>
    <div class="d-txt"><small>${label}</small><b>${longDate(iso)}</b></div>
    <span class="d-tag${late ? ' warn' : ''}">${late ? 'Atrasado' : dueRelative(iso)}</span>
  </div>`;

function fillItemDetail(t) {
  const project = projectById(t.projectId);
  detailHero.style.setProperty('--c', taskColor(t));
  $('#dName').textContent = t.name;
  $('#dSubject').textContent = [KIND_NAME[t.kind], t.subject].filter(Boolean).join(' · ');
  detailBody.innerHTML = `
    ${dateRow(t.kind === 'material' ? 'Para cuándo' : 'Fecha', t.date, !t.done && dayDiff(t.date) < 0)}
    ${project ? `
    <button class="d-row d-link" type="button" data-act="open-project">
      <span class="d-ico">${ICON.folder}</span>
      <div class="d-txt"><small>Proyecto</small><b>${esc(project.name)}</b></div>
      <span class="d-tag">Ver</span>
    </button>` : ''}
    ${t.kind === 'material' ? `
    <div class="d-row">
      <span class="d-ico">${ICON.tag}</span>
      <div class="d-txt"><small>Precio</small><b>${t.price != null ? money(t.price) : 'Sin precio'}</b></div>
    </div>` : ''}
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
    ${notesBlock(t.notes)}
    <div class="d-actions">
      <button class="btn-soft" type="button" data-act="edit">${ICON.pencil}Editar</button>
      <button class="btn-primary" type="button" data-act="done">${t.done ? 'Desmarcar' : t.kind === 'material' ? 'Ya lo tengo' : 'Completar'}</button>
    </div>`;
}

function fillProjectDetail(p) {
  const items = projectItems(p);
  const done = items.filter((t) => t.done).length;
  const cost = sum(items.filter((t) => t.kind === 'material' && t.price != null).map((t) => t.price));
  const pendingCost = sum(items.filter((t) => t.kind === 'material' && !t.done && t.price != null).map((t) => t.price));
  const sorted = [...items.filter((t) => !t.done).sort(compareItems('date')), ...items.filter((t) => t.done).sort(byDoneAt)];
  detailHero.style.setProperty('--c', projectColor(p));
  $('#dName').textContent = p.name;
  $('#dSubject').textContent = ['Proyecto', p.subject].filter(Boolean).join(' · ');
  detailBody.innerHTML = `
    ${dateRow('Entrega', p.date, !isComplete(p) && dayDiff(p.date) < 0)}
    <div class="d-row">
      <span class="d-ico">${ICON.check}</span>
      <div class="d-txt"><small>Avance</small><b>${items.length ? `${done} de ${items.length} listas` : 'Sin tareas todavía'}</b>
        <span class="d-bar"><i style="--prog:${items.length ? done / items.length : 0}"></i></span></div>
    </div>
    ${cost ? `
    <div class="d-row">
      <span class="d-ico">${ICON.tag}</span>
      <div class="d-txt"><small>Materiales</small><b>${money(cost)}${pendingCost && pendingCost !== cost ? ` · faltan ${money(pendingCost)}` : ''}</b></div>
    </div>` : ''}
    ${notesBlock(p.notes)}
    <div class="d-items">
      ${sorted.map((t) => `
      <div class="d-item${t.done ? ' done' : ''}">
        <button class="d-check" type="button" data-act="toggle-item" data-id="${t.id}" aria-label="${t.done ? 'Marcar como pendiente' : 'Marcar como hecha'}">${ICON.check}</button>
        <button class="d-item-name" type="button" data-act="open-item" data-id="${t.id}">
          <b>${esc(t.name)}</b><small>${KIND_NAME[t.kind]} · ${dueLabel(t.date)}${t.price != null && t.kind === 'material' ? ` · ${money(t.price)}` : ''}</small>
        </button>
      </div>`).join('')}
    </div>
    <div class="d-actions">
      <button class="btn-soft" type="button" data-act="add-task">${ICON.plus}Tarea</button>
      <button class="btn-soft" type="button" data-act="add-material">${ICON.plus}Material</button>
    </div>
    <button class="btn-primary" type="button" data-act="edit-project">Editar proyecto</button>`;
}

function fillDetail() {
  const d = ui.detail;
  if (d.kind === 'project') fillProjectDetail(projectById(d.id));
  else fillItemDetail(itemById(d.id));
}
function openDetail(id) {
  if (!itemById(id) || nav.stack.length) return;
  ui.detail = { kind: 'item', id };
  fillDetail();
  detailBody.scrollTop = 0;
  detailSheet.open();
  navOpen('detail', closeDetail);
}
function openProject(id) {
  if (!projectById(id) || nav.stack.length) return;
  ui.detail = { kind: 'project', id };
  fillDetail();
  detailBody.scrollTop = 0;
  detailSheet.open();
  navOpen('detail', closeDetail);
}
function closeDetail() {
  detailSheet.close();
  navClosed('detail');
}
// Cambia lo que muestra la hoja de detalle sin cerrarla (de proyecto a tarea y viceversa)
function showInDetail(kind, id) {
  ui.detail = { kind, id };
  const el = detailSheet.el;
  el.animate([{ opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
  fillDetail();
  detailBody.scrollTop = 0;
}
// De la hoja de detalle pasa al formulario sin apagar el fondo
function detailToForm(obj, preset) {
  detailSheet.close(true);
  fillForm(obj, preset);
  addSheet.open();
  navReplace('detail', 'add', closeAdd);
}

detailBody.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const d = ui.detail, act = btn.dataset.act;
  if (d.kind === 'item') {
    const t = itemById(d.id);
    if (!t) return;
    if (act === 'done') { closeDetail(); setTimeout(() => toggleDone(t.id), 240); }
    if (act === 'edit') detailToForm(t);
    if (act === 'open-project') showInDetail('project', t.projectId);
    return;
  }
  const p = projectById(d.id);
  if (!p) return;
  if (act === 'edit-project') detailToForm(p);
  if (act === 'add-task' || act === 'add-material') detailToForm(null, { type: act === 'add-task' ? 'task' : 'material', projectId: p.id });
  if (act === 'open-item') showInDetail('item', btn.dataset.id);
  if (act === 'toggle-item') {
    const t = itemById(btn.dataset.id);
    toggleDone(btn.dataset.id, btn);
    if (t) fillDetail();
  }
});

$('#detailClose').innerHTML = ICON.x;
$('#detailDelete').innerHTML = ICON.trash;
$('#detailClose').addEventListener('click', closeDetail);
$('#detailDelete').addEventListener('click', () => {
  const { kind, id } = ui.detail;
  closeDetail();
  setTimeout(() => (kind === 'project' ? deleteProject(id) : deleteItem(id)), 220);
});
sheetDrag(detailSheet, detailHero, closeDetail);

scrim.addEventListener('click', () => {
  if (topIs('add') || topIs('detail') || topIs('subject')) closeTop();
});

/* ───────────── Ordenar y filtrar ───────────── */

filterBtn.innerHTML = ICON.sliders;
filterBtn.addEventListener('click', openFilters);

function openFilters() {
  if (nav.stack.length) return;
  const v = viewOf();
  const group = (key, label, opts) => `
    <p class="opt-label">${label}</p>
    <div class="opt-row" data-key="${key}">${opts.map(([val, text]) => `<button type="button" class="opt${v[key] === val ? ' active' : ''}" data-val="${val}">${text}</button>`).join('')}</div>`;
  miniTitle.textContent = `Ordenar ${{ task: 'tareas', material: 'materiales', project: 'proyectos' }[ui.tab]}`;
  miniBody.innerHTML = `
    ${group('sort', 'Ordenar por', SORT_OPTS)}
    ${group('status', 'Mostrar', STATUS_OPTS)}
    ${group('urgency', 'Urgencia', URGENCY_OPTS)}
    <button type="button" class="link-btn" data-act="reset">Restablecer</button>`;
  miniBody.onclick = (e) => {
    const opt = e.target.closest('.opt');
    if (opt) {
      const row = opt.parentElement;
      v[row.dataset.key] = opt.dataset.val;
      for (const o of row.children) o.classList.toggle('active', o === opt);
    } else if (e.target.closest('[data-act="reset"]')) {
      Object.assign(v, VIEW_DEFAULT);
      miniBody.querySelectorAll('.opt-row').forEach((row) => {
        for (const o of row.children) o.classList.toggle('active', o.dataset.val === v[row.dataset.key]);
      });
    } else return;
    haptic(6);
    save();
    updateFilterBtn();
    renderList();
  };
  openMini();
}

/* ───────────── Pantallas laterales ───────────── */

// p = 0 (cerrada) … 1 (abierta). La pantalla principal se recorre un poco hacia el otro lado.
function sideProgress(screen, p, animate) {
  const t = animate ? '' : 'none';
  const dir = screen === scheduleEl ? -1 : 1; // el horario entra por la izquierda, materias por la derecha
  screen.style.transition = t;
  mainEl.style.transition = t;
  mainDim.style.transition = t;
  screen.style.transform = `translate3d(${dir * (1 - p) * 100}%, 0, 0)`;
  mainEl.style.transform = p > 0 ? `translate3d(${-dir * p * 22}%, 0, 0)` : '';
  mainDim.style.opacity = String(p);
}

/* Desde la pantalla principal: deslizar a la derecha abre el horario y a la izquierda
   abre materias (desde los bordes o desde cualquier parte que no sea una tarjeta). */
const sideSwipe = {
  when: (e) => nav.stack.length === 0 && !e.target.closest('.swipe-zone'),
  decide: (g) => {
    if (Math.abs(g.dx) < Math.abs(g.dy) * 1.1) return false;
    const card = g.target.closest?.('.task');
    if (g.dx > 0) {
      if (card) return false; // a la derecha sobre una tarjeta: botón de eliminar
      g.screen = scheduleEl;
      refreshSchedule();
    } else {
      if (card?.classList.contains('swiped')) return false;
      g.screen = matEl;
    }
    return true;
  },
  move: (g) => {
    const toward = g.screen === scheduleEl ? 1 : -1; // dirección del dedo que abre la pantalla
    sideProgress(g.screen, clamp((g.dx * toward) / appW(), 0, 1), false);
  },
  end: (g) => {
    const toward = g.screen === scheduleEl ? 1 : -1;
    const dist = g.dx * toward, vel = g.vx * toward;
    if ((dist > appW() * 0.25 && vel > -0.2) || vel > 0.35) (g.screen === scheduleEl ? openSchedule : openMaterias)();
    else sideProgress(g.screen, 0, true);
  },
};
gesture(mainEl, sideSwipe);
gesture(edgeZone, sideSwipe);
gesture(edgeZoneR, sideSwipe);
wheelSwipe(mainEl, {
  right: { when: (e) => !nav.stack.length && !e.target.closest('.task'), run: () => openSchedule() },
  left: { when: (e) => !nav.stack.length && !e.target.closest('.task.swiped'), run: () => openMaterias() },
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

function openSchedule() {
  if (sch.open) { sideProgress(scheduleEl, 1, true); return; }
  if (nav.stack.length) return;
  if (openLi) closeCard(openLi);
  refreshSchedule();
  sch.open = true;
  scheduleEl.inert = false;
  mainEl.inert = true;
  sideProgress(scheduleEl, 1, true);
  navOpen('schedule', closeSchedule);
}
function closeSchedule() {
  if (sch.editing) setEditing(false);
  sch.open = false;
  scheduleEl.inert = true;
  mainEl.inert = false;
  sideProgress(scheduleEl, 0, true);
  navClosed('schedule');
}

function scheduleStatus() {
  const S = state.schedule, today = new Date().getDay(), m = nowMinutes();
  if (!state.subjects.some((s) => s.name.trim())) return 'Desliza el título hacia abajo para armar tu horario';
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
  const subjects = state.subjects;
  subjList.innerHTML = subjects.length
    ? subjects.map((s) => `
      <div class="subj-row" data-id="${s.id}">
        <button class="subj-color" type="button" style="--c:${s.color}" aria-label="Cambiar color"></button>
        <input class="subj-name" value="${esc(s.name)}" placeholder="Nombre de la materia" maxlength="40" enterkeyhint="done">
        <button class="subj-del" type="button" aria-label="Eliminar materia">${ICON.x}</button>
      </div>`).join('')
    : '<p class="subj-empty">Agrega tus materias aquí o desde una casilla 🌸</p>';
}

/* El horario se mantiene dibujado de antemano para que deslizar hacia él no se trabe:
   solo se vuelve a dibujar cuando cambia el día o la clase en curso. */
let schNowKey = '';
function refreshSchedule() {
  const S = state.schedule, m = nowMinutes();
  const slot = S.slots.find((s) => m >= toMin(s.start) && m < toMin(s.end));
  const key = `${new Date().getDay()}|${slot?.id || ''}`;
  if (key === schNowKey) return;
  schNowKey = key;
  renderGrid();
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
  if (on) renderDayToggles();
  renderGrid();
  renderSubjects();
  updateSchSub();
  if (!on) subjectsChanged({ skip: 'schedule' });
  save();
  haptic(10);
  if (on) navOpen('schedEdit', () => setEditing(false));
  else navClosed('schedEdit');
}

// Una materia sin nombre y sin nada guardado se descarta; si tiene datos, se le pone nombre
const usedInSchedule = (id) => Object.values(state.schedule.cells).includes(id);
const subjectHasData = (s) => s.exams.length || s.reminders.length || s.grades.some((g) => g != null) || usedInSchedule(s.id);
function cleanupSubjects() {
  state.subjects = state.subjects.filter((s) => s.name.trim() || subjectHasData(s));
  for (const s of state.subjects) s.name = s.name.trim() || 'Materia sin nombre';
  const ids = new Set(state.subjects.map((s) => s.id));
  for (const k of Object.keys(state.schedule.cells)) if (!ids.has(state.schedule.cells[k])) delete state.schedule.cells[k];
}

function nextColor() {
  const used = new Set(state.subjects.map((s) => s.color));
  return PASTELS.find((c) => !used.has(c)) || PASTELS[state.subjects.length % PASTELS.length];
}
function addSubject(name) {
  const found = findSubject(name);
  if (found) return found;
  const s = newSubject(name, nextColor());
  state.subjects.push(s);
  subjectsChanged();
  return s;
}

// Después de cambiar materias: horario, lista de materias, tarjetas y avisos al día
function subjectsChanged({ skip } = {}) {
  save();
  renderGrid();
  updateSchSub();
  if (skip !== 'schedule') renderSubjects();
  renderMaterias();
  refreshTaskColors();
  renderHeroNote();
}

// Cerrar el horario: deslizar hacia la izquierda en cualquier parte
function endScheduleSwipe(g) {
  if ((-g.dx > appW() * 0.25 && g.vx < 0.2) || g.vx < -0.35) closeSchedule();
  else sideProgress(scheduleEl, 1, true);
}
gesture(scheduleEl, {
  when: (e) => topIs('schedule') && !schHead.contains(e.target),
  decide: (g) => g.dx < 0 && -g.dx > Math.abs(g.dy) * 1.1,
  move: (g) => sideProgress(scheduleEl, 1 + clamp(g.dx / appW(), -1, 0), false),
  end: endScheduleSwipe,
});
wheelSwipe(scheduleEl, { left: { when: () => topIs('schedule'), run: closeSchedule } });

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
    if (g.mode === 'close') { sideProgress(scheduleEl, 1 + clamp(g.dx / appW(), -1, 0), false); return; }
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
wheelSwipe(schHead, { down: { when: () => topIs('schedule') || topIs('schedEdit'), run: () => setEditing(!sch.editing) } });

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
  const s = newSubject('', nextColor());
  state.subjects.push(s);
  renderSubjects();
  const row = subjList.querySelector(`[data-id="${s.id}"]`);
  row.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
  row.querySelector('.subj-name').focus();
});

subjList.addEventListener('click', (e) => {
  const row = e.target.closest('.subj-row');
  const s = row && subjectById(row.dataset.id);
  if (!s) return;
  const colorBtn = e.target.closest('.subj-color');
  if (colorBtn) {
    s.color = PASTELS[(PASTELS.indexOf(s.color) + 1) % PASTELS.length];
    colorBtn.style.setProperty('--c', s.color);
    haptic(6);
    subjectsChanged({ skip: 'schedule' });
  } else if (e.target.closest('.subj-del')) removeSubject(s.id);
});
subjList.addEventListener('input', (e) => {
  const row = e.target.closest('.subj-row');
  const s = row && subjectById(row.dataset.id);
  if (!s) return;
  s.name = e.target.value;
  subjectsChanged({ skip: 'schedule' });
});
subjList.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.target.blur(); });

function removeSubject(id) {
  const idx = state.subjects.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const [subject] = state.subjects.splice(idx, 1);
  const cells = {};
  for (const k of Object.keys(state.schedule.cells)) if (state.schedule.cells[k] === id) { cells[k] = id; delete state.schedule.cells[k]; }
  haptic(12);
  subjectsChanged();
  if (subject.name.trim() || subjectHasData(subject)) {
    toast('Materia eliminada', 'Deshacer', () => {
      state.subjects.splice(idx, 0, subject);
      Object.assign(state.schedule.cells, cells);
      subjectsChanged();
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

/* ───────────── Materias ───────────── */

const matEl = $('#materias'), matList = $('#matList'), matSub = $('#matSub');
const mat = { open: false };
$('#matBackBtn').innerHTML = ICON.list;
$('#matAddBtn').innerHTML = ICON.plus;
$('#openMat').innerHTML = ICON.book;
$('#matBackBtn').addEventListener('click', closeMaterias);
$('#matAddBtn').addEventListener('click', createSubject);
$('#openMat').addEventListener('click', openMaterias);

function openMaterias() {
  if (mat.open) { sideProgress(matEl, 1, true); return; }
  if (nav.stack.length) return;
  if (openLi) closeCard(openLi);
  mat.open = true;
  matEl.inert = false;
  mainEl.inert = true;
  sideProgress(matEl, 1, true);
  navOpen('materias', closeMaterias);
}
function closeMaterias() {
  mat.open = false;
  matEl.inert = true;
  mainEl.inert = false;
  sideProgress(matEl, 0, true);
  navClosed('materias');
}

const nextExam = (s) => [...s.exams].filter((e) => dayDiff(e.date) >= 0).sort(byDate)[0];

function renderMaterias() {
  const subjects = state.subjects.filter((s) => s.name.trim());
  const avgs = subjects.map((s) => average(s.grades)).filter((a) => a != null);
  matSub.textContent = !subjects.length
    ? 'Toca + para agregar tu primera materia'
    : avgs.length ? `Promedio general: ${fmtGrade(sum(avgs) / avgs.length)}` : 'Aún sin calificaciones';
  matList.innerHTML = subjects.map((s) => {
    const avg = average(s.grades), exam = nextExam(s);
    const rems = s.reminders.filter((r) => dayDiff(r.date) >= 0).length;
    return `
    <button class="mat-card" type="button" data-id="${s.id}" style="--c:${s.color}">
      <span class="mat-top"><b>${esc(s.name)}</b>${avg != null ? `<span class="avg ${gradeClass(avg, s.grades)}">${fmtGrade(avg)}</span>` : ''}</span>
      <span class="mat-meta">${exam ? `📚 ${esc(exam.title || 'Examen')} · ${dueLabel(exam.date).toLowerCase()}` : 'Sin exámenes próximos'}${rems ? ` · 🔔 ${rems}` : ''}</span>
      <span class="mat-grades">${s.grades.map((g, i) => `<i>P${i + 1} <b>${g ?? '—'}</b></i>`).join('')}</span>
    </button>`;
  }).join('') + '<button class="ghost-btn" type="button" data-act="add">+ Nueva materia</button>';
}
matList.addEventListener('click', (e) => {
  if (e.target.closest('[data-act="add"]')) return createSubject();
  const card = e.target.closest('.mat-card');
  if (card) openSubject(card.dataset.id);
});

// Cerrar materias: deslizar hacia la derecha en cualquier parte
gesture(matEl, {
  when: (e) => topIs('materias') && !e.target.closest('input, textarea'),
  decide: (g) => g.dx > 0 && g.dx > Math.abs(g.dy) * 1.1,
  move: (g) => sideProgress(matEl, 1 - clamp(g.dx / appW(), 0, 1), false),
  end: (g) => {
    if ((g.dx > appW() * 0.25 && g.vx > -0.2) || g.vx > 0.35) closeMaterias();
    else sideProgress(matEl, 1, true);
  },
});
wheelSwipe(matEl, { right: { when: () => topIs('materias'), run: closeMaterias } });

/* Hoja de una materia */

const subjSheet = createSheet($('#subjectSheet'), scrim);
const subjHero = $('#subjHero'), subjName = $('#subjName'), subjColors = $('#subjColors'), subjBody = $('#subjBody');
$('#subjClose').innerHTML = ICON.x;
$('#subjDelete').innerHTML = ICON.trash;

function createSubject() {
  if (!topIs('materias')) return;
  const s = newSubject('', nextColor());
  state.subjects.push(s);
  save();
  openSubject(s.id, true);
}
function openSubject(id, focusName = false) {
  const s = subjectById(id);
  if (!s || !topIs('materias')) return;
  ui.subjectId = id;
  ui.subjectPrevName = s.name;
  fillSubject();
  subjBody.scrollTop = 0;
  subjSheet.open();
  navOpen('subject', closeSubject);
  if (focusName) setTimeout(() => subjName.focus(), 420);
}
function closeSubject() {
  subjSheet.close();
  navClosed('subject');
  const s = subjectById(ui.subjectId);
  if (s && !s.name.trim()) {
    if (subjectHasData(s)) s.name = ui.subjectPrevName || 'Materia sin nombre';
    else state.subjects = state.subjects.filter((x) => x !== s);
  }
  subjectsChanged();
}

function remindLabel(v) {
  return (REMIND_OPTS.find(([val]) => val === v) || REMIND_OPTS[0])[1];
}
function fillSubject() {
  const s = subjectById(ui.subjectId);
  if (!s) return;
  subjHero.style.setProperty('--c', s.color);
  subjName.value = s.name;
  subjColors.innerHTML = PASTELS.map((c) => `<button type="button" class="swatch${c === s.color ? ' active' : ''}" data-color="${c}" style="--c:${c}" aria-label="Color"></button>`).join('');
  const avg = average(s.grades);
  const exams = [...s.exams].sort((a, b) => (dayDiff(a.date) < 0) - (dayDiff(b.date) < 0) || byDate(a, b));
  const rems = [...s.reminders].sort((a, b) => (dayDiff(a.date) < 0) - (dayDiff(b.date) < 0) || byDate(a, b));
  subjBody.innerHTML = `
    <p class="sec-label">Calificaciones</p>
    <div class="grades">
      ${PARTIALS.map((label, i) => `<label class="grade"><span>${label}</span><input class="input grade-in" data-i="${i}" inputmode="decimal" maxlength="5" value="${s.grades[i] ?? ''}" placeholder="—"></label>`).join('')}
      <div class="grade avg-box"><span>Promedio</span><b id="subjAvg" class="${avg != null ? gradeClass(avg, s.grades) : ''}">${avg != null ? fmtGrade(avg) : '—'}</b></div>
    </div>
    <p class="sec-label">Exámenes</p>
    ${exams.map((e) => `
    <button class="row-item${dayDiff(e.date) < 0 ? ' past' : ''}" type="button" data-exam="${e.id}">
      <span class="row-ico">📚</span>
      <span class="row-txt"><b>${esc(e.title || 'Examen')}</b><small>${longDate(e.date)}${e.time ? ` · ${fmtTime(e.time)}` : ''}${e.remind >= 0 ? ` · 🔔 ${remindLabel(e.remind).toLowerCase()}` : ''}</small></span>
      <span class="d-tag">${dueRelative(e.date)}</span>
    </button>`).join('') || '<p class="row-empty">Sin exámenes registrados</p>'}
    <button class="ghost-btn" type="button" data-act="add-exam">+ Agregar examen</button>
    <p class="sec-label">Recordatorios</p>
    ${rems.map((r) => `
    <button class="row-item${dayDiff(r.date) < 0 ? ' past' : ''}" type="button" data-rem="${r.id}">
      <span class="row-ico">🔔</span>
      <span class="row-txt"><b>${esc(r.text)}</b><small>${longDate(r.date)}${r.time ? ` · ${fmtTime(r.time)}` : ''}</small></span>
      <span class="d-tag">${dueRelative(r.date)}</span>
    </button>`).join('') || '<p class="row-empty">Sin recordatorios</p>'}
    <button class="ghost-btn" type="button" data-act="add-rem">+ Agregar recordatorio</button>`;
}

subjName.addEventListener('input', () => {
  const s = subjectById(ui.subjectId);
  if (!s) return;
  s.name = subjName.value;
  subjectsChanged();
});
subjName.addEventListener('keydown', (e) => { if (e.key === 'Enter') subjName.blur(); });
subjColors.addEventListener('click', (e) => {
  const sw = e.target.closest('.swatch');
  const s = subjectById(ui.subjectId);
  if (!sw || !s) return;
  s.color = sw.dataset.color;
  subjHero.style.setProperty('--c', s.color);
  for (const b of subjColors.children) b.classList.toggle('active', b === sw);
  haptic(6);
  subjectsChanged();
});
subjBody.addEventListener('input', (e) => {
  const input = e.target.closest('.grade-in');
  const s = subjectById(ui.subjectId);
  if (!input || !s) return;
  const n = parseNum(input.value);
  s.grades[Number(input.dataset.i)] = n == null ? null : clamp(n, 0, 100);
  const avg = average(s.grades), out = $('#subjAvg');
  out.textContent = avg != null ? fmtGrade(avg) : '—';
  out.className = avg != null ? gradeClass(avg, s.grades) : '';
  save();
  renderMaterias();
});
subjBody.addEventListener('click', (e) => {
  const s = subjectById(ui.subjectId);
  if (!s) return;
  if (e.target.closest('[data-act="add-exam"]')) return openExamForm(null);
  if (e.target.closest('[data-act="add-rem"]')) return openReminderForm(null);
  const exam = e.target.closest('[data-exam]');
  if (exam) return openExamForm(s.exams.find((x) => x.id === exam.dataset.exam));
  const rem = e.target.closest('[data-rem]');
  if (rem) openReminderForm(s.reminders.find((x) => x.id === rem.dataset.rem));
});
$('#subjClose').addEventListener('click', closeSubject);
$('#subjDelete').addEventListener('click', () => {
  const id = ui.subjectId;
  closeSubject();
  setTimeout(() => removeSubject(id), 220);
});
sheetDrag(subjSheet, subjHero, closeSubject);

// Enlace para crear el evento en Google Calendar (ahí sí suena una alarma en el teléfono)
function gcalUrl(title, date, time, details) {
  const d = date.replace(/-/g, '');
  let dates;
  if (time) {
    const start = toMin(time), end = Math.min(start + 60, 23 * 60 + 59);
    dates = `${d}T${time.replace(':', '')}00/${d}T${fromMin(end).replace(':', '')}00`;
  } else dates = `${d}/${addDaysISO(date, 1).replace(/-/g, '')}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}&details=${encodeURIComponent(details)}`;
}

function openExamForm(exam) {
  const s = subjectById(ui.subjectId);
  if (!s) return;
  const e = exam || { title: 'Examen', date: addDaysISO(todayISO(), 7), time: '', remind: 1 };
  let remind = e.remind;
  miniTitle.textContent = exam ? 'Editar examen' : 'Nuevo examen';
  miniBody.innerHTML = `
    <label class="mini-field"><span>Nombre</span><input class="input" name="title" value="${esc(e.title)}" maxlength="40" enterkeyhint="done"></label>
    <div class="time-row">
      <label><span>Fecha</span><input class="input" type="date" name="date" value="${e.date}"></label>
      <label><span>Hora</span><input class="input" type="time" name="time" value="${e.time || ''}"></label>
    </div>
    <p class="opt-label">Avisarme en la app</p>
    <div class="opt-row">${REMIND_OPTS.map(([v, l]) => `<button type="button" class="opt${v === remind ? ' active' : ''}" data-val="${v}">${l}</button>`).join('')}</div>
    <button type="button" class="link-btn" data-act="gcal">${ICON.cal}Agregar a Google Calendar</button>
    <div class="d-actions">
      ${exam ? `<button class="btn-soft danger" type="button" data-act="del">${ICON.trash}Quitar</button>` : ''}
      <button class="btn-primary" type="button" data-act="ok">Guardar</button>
    </div>`;
  const field = (n) => miniBody.querySelector(`[name="${n}"]`);
  miniBody.onclick = (ev) => {
    const opt = ev.target.closest('.opt');
    if (opt) {
      remind = Number(opt.dataset.val);
      for (const o of opt.parentElement.children) o.classList.toggle('active', o === opt);
      haptic(6);
      return;
    }
    const act = ev.target.closest('[data-act]')?.dataset.act;
    if (act === 'gcal') {
      const title = `${field('title').value.trim() || 'Examen'} · ${s.name}`;
      window.open(gcalUrl(title, field('date').value || todayISO(), field('time').value, 'Desde Tareitas 🌸'), '_blank', 'noopener');
    } else if (act === 'ok') {
      if (!field('date').value) return shake(field('date'));
      const data = { title: field('title').value.trim() || 'Examen', date: field('date').value, time: field('time').value, remind };
      if (exam) Object.assign(exam, data);
      else s.exams.push({ id: uid(), ...data });
      haptic(10);
      closeMini();
      afterSubjectDetail();
    } else if (act === 'del') {
      const idx = s.exams.indexOf(exam);
      s.exams.splice(idx, 1);
      closeMini();
      afterSubjectDetail();
      toast('Examen quitado', 'Deshacer', () => { s.exams.splice(idx, 0, exam); afterSubjectDetail(); });
    }
  };
  openMini();
}

function openReminderForm(rem) {
  const s = subjectById(ui.subjectId);
  if (!s) return;
  const r = rem || { text: '', date: addDaysISO(todayISO(), 1), time: '' };
  miniTitle.textContent = rem ? 'Editar recordatorio' : 'Nuevo recordatorio';
  miniBody.innerHTML = `
    <label class="mini-field"><span>¿Qué hay que recordar?</span><input class="input" name="text" value="${esc(r.text)}" placeholder="Ej. llevar la bata" maxlength="60" enterkeyhint="done"></label>
    <div class="time-row">
      <label><span>Fecha</span><input class="input" type="date" name="date" value="${r.date}"></label>
      <label><span>Hora</span><input class="input" type="time" name="time" value="${r.time || ''}"></label>
    </div>
    <p class="mini-hint">Aparece en la pantalla principal desde un día antes.</p>
    <div class="d-actions">
      ${rem ? `<button class="btn-soft danger" type="button" data-act="del">${ICON.trash}Quitar</button>` : ''}
      <button class="btn-primary" type="button" data-act="ok">Guardar</button>
    </div>`;
  const field = (n) => miniBody.querySelector(`[name="${n}"]`);
  miniBody.onclick = (ev) => {
    const act = ev.target.closest('[data-act]')?.dataset.act;
    if (act === 'ok') {
      const text = field('text').value.trim();
      if (!text) return shake(field('text'));
      if (!field('date').value) return shake(field('date'));
      const data = { text, date: field('date').value, time: field('time').value };
      if (rem) Object.assign(rem, data);
      else s.reminders.push({ id: uid(), ...data });
      haptic(10);
      closeMini();
      afterSubjectDetail();
    } else if (act === 'del') {
      const idx = s.reminders.indexOf(rem);
      s.reminders.splice(idx, 1);
      closeMini();
      afterSubjectDetail();
      toast('Recordatorio quitado', 'Deshacer', () => { s.reminders.splice(idx, 0, rem); afterSubjectDetail(); });
    }
  };
  openMini();
}

function afterSubjectDetail() {
  save();
  if (subjSheet.isOpen) fillSubject();
  renderMaterias();
  renderHeroNote();
}

/* ───────────── Hoja pequeña: filtros, elegir materia, editar hora, exámenes ───────────── */

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
      ${state.subjects.filter((s) => s.name.trim()).map((s) => `<button type="button" class="pick${s.id === current ? ' active' : ''}" data-id="${s.id}" style="--c:${s.color}">${esc(s.name)}</button>`).join('')}
      <button type="button" class="pick pick-free${current ? '' : ' active'}" data-id="">Libre</button>
    </div>
    <form class="pick-new" autocomplete="off">
      <input class="input" name="name" placeholder="Nueva materia" maxlength="40" enterkeyhint="done">
      <button class="round-btn" type="submit" aria-label="Agregar materia">${ICON.plus}</button>
    </form>`;
  miniBody.onclick = (e) => {
    const pick = e.target.closest('.pick');
    if (!pick) return;
    closeMini();
    assignCell(key, pick.dataset.id || null);
  };
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
  miniBody.onclick = (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'ok') {
      if (!startIn.value || !endIn.value || toMin(endIn.value) <= toMin(startIn.value)) return shake(endIn);
      slot.start = startIn.value;
      slot.end = endIn.value;
      save();
      closeMini();
      renderGrid();
      updateSchSub();
    } else if (act === 'del') {
      closeMini();
      removeSlot(slotId);
    }
  };
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
  if (e.key === 'm') openMaterias();
});

/* ───────────── Inicio ───────────── */

function intro() {
  if (reduceMotion) return;
  const items = [...$('#hero').children, $('.tabs-row'), ...[...taskList.children].slice(0, 8)];
  items.forEach((el, i) => {
    el.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 750, delay: 80 + i * 55, easing: EASE, fill: 'backwards' });
  });
}

function init() {
  setSeg(tabsEl, ui.tab);
  updateFilterBtn();
  updateHeader(); // también deja dibujado el horario y los avisos
  renderDayToggles();
  renderSubjects();
  renderMaterias();
  renderList();
  intro();
  setInterval(updateHeader, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateHeader(); });

  navigator.storage?.persist?.().catch(() => {});
  const secure = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator && secure) navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
