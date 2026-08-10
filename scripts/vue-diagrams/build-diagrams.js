/**
 * Diagram generator for the Vue Interview Kit.
 *
 * Writes every SVG referenced by a {{fig:…}} marker in scripts/vue-content/
 * into ../../vue-diagrams/. Diagrams are GENERATED rather than hand-authored so
 * that 42 of them share one visual language — same palette, same type scale,
 * same box geometry — instead of drifting apart as they were written.
 *
 * Six archetypes cover every diagram in the kit:
 *   pipeline  — ordered stages with arrows between them
 *   compare   — two (or three) panels set against each other
 *   stack     — layers, top-to-bottom, optionally a pyramid
 *   anatomy   — one labelled subject with callouts
 *   grid      — cards in rows/columns
 *   tree      — parent/child boxes joined by connectors
 *
 * Usage:
 *   node scripts/vue-diagrams/build-diagrams.js            # write the SVGs
 *   node scripts/vue-diagrams/build-diagrams.js --check    # verify every
 *                                                          # {{fig:…}} marker
 *                                                          # has a spec, and
 *                                                          # every spec is used
 *
 * After generating, upload and write the manifest the seed script reads:
 *   node scripts/upload-images.js ./vue-diagrams --apply
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', '..', 'vue-diagrams');
const CONTENT_DIR = path.join(__dirname, '..', 'vue-content');

/* ── Palette ──────────────────────────────────────────────────────────
 * Vue green is the accent; slate carries structure. Amber marks a caveat,
 * rose marks something wrong, blue marks a neutral contrast panel.
 * Keep additions here so no diagram invents its own colour.
 * ─────────────────────────────────────────────────────────────────── */
const C = {
  ink: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  page: '#f8fafc',
  edge: '#e2e8f0',
  white: '#ffffff',

  greenBg: '#ecfdf5', greenLine: '#10b981', greenInk: '#065f46',
  blueBg: '#eff6ff', blueLine: '#3b82f6', blueInk: '#1e3a8a',
  amberBg: '#fffbeb', amberLine: '#f59e0b', amberInk: '#92400e',
  roseBg: '#fff1f2', roseLine: '#f43f5e', roseInk: '#9f1239',
  violetBg: '#f5f3ff', violetLine: '#8b5cf6', violetInk: '#5b21b6',
  slateBg: '#f1f5f9', slateLine: '#94a3b8', slateInk: '#334155',
};

const TONES = {
  green: [C.greenBg, C.greenLine, C.greenInk],
  blue: [C.blueBg, C.blueLine, C.blueInk],
  amber: [C.amberBg, C.amberLine, C.amberInk],
  rose: [C.roseBg, C.roseLine, C.roseInk],
  violet: [C.violetBg, C.violetLine, C.violetInk],
  slate: [C.slateBg, C.slateLine, C.slateInk],
  white: [C.white, C.faint, C.body],
};

/* ── Primitives ─────────────────────────────────────────────────────── */

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function text(x, y, s, { size = 13, weight = 400, fill = C.body, anchor = 'middle', mono = false } = {}) {
  const family = mono ? ' font-family="ui-monospace,SFMono-Regular,Menlo,monospace"' : '';
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}"${family}>${esc(s)}</text>`;
}

/** Wrap a string to `max` chars per line, returning stacked <text> elements. */
function wrap(x, y, s, { max = 34, lh = 16, ...opts } = {}) {
  const words = String(s).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.map((l, i) => text(x, y + i * lh, l, opts)).join('\n    ');
}

function box({ x, y, w, h, tone = 'white', r = 12, dashed = false, width = 1.5 }) {
  const [bg, line] = TONES[tone];
  const dash = dashed ? ' stroke-dasharray="6 4"' : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${bg}" stroke="${line}" stroke-width="${width}"${dash}/>`;
}

/**
 * Largest font size at which `s` fits in `avail` px.
 *
 * Bold sans averages ~0.60em per character, mono ~0.62em. Long labels are
 * common in this kit ("onActivated / onDeactivated"), and a fixed size
 * overflowed the card silently — SVG does not clip or wrap, it just draws
 * past the edge. Shrinking to fit is the only way to keep it inside.
 */
function fitSize(s, avail, base, mono = false) {
  const per = mono ? 0.62 : 0.6;
  return Math.max(9, Math.min(base, Math.floor(avail / (String(s).length * per))));
}

/**
 * A titled card. `lines` are rendered small under the title; a `tag` renders
 * as a pill along the BOTTOM edge — it used to sit top-right, where it
 * collided with any title wide enough to reach it.
 */
function card({ x, y, w, h, tone = 'white', title, lines = [], tag, mono = false, titleSize = 14 }) {
  const [, line, ink] = TONES[tone];
  const parts = [box({ x, y, w, h, tone })];
  let ty = y + 26;
  if (title) {
    const size = fitSize(title, w - 20, titleSize, mono);
    parts.push(text(x + w / 2, ty, title, { size, weight: 700, fill: ink, mono }));
    ty += 20;
  }
  const maxChars = Math.floor((w - 16) / 6.4);
  for (const l of lines) {
    parts.push(wrap(x + w / 2, ty, l, { max: maxChars, size: 12, fill: C.body }));
    ty += 16 * Math.ceil(String(l).length / maxChars);
  }
  if (tag) {
    const tw = tag.length * 6.6 + 16;
    const ty2 = y + h - 22;
    parts.push(`<rect x="${x + w / 2 - tw / 2}" y="${ty2}" width="${tw}" height="17" rx="8" fill="${line}" opacity="0.18"/>`);
    parts.push(text(x + w / 2, ty2 + 12.5, tag, { size: 10, weight: 700, fill: ink }));
  }
  return parts.join('\n    ');
}

function arrow(x1, y1, x2, y2, { label, dashed = false, color = C.faint, curve = 0 } = {}) {
  const dash = dashed ? ' stroke-dasharray="5 4"' : '';
  const d = curve
    ? `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + curve} ${x2} ${y2}`
    : `M ${x1} ${y1} L ${x2} ${y2}`;
  const parts = [`<path d="${d}" fill="none" stroke="${color}" stroke-width="2"${dash} marker-end="url(#arrowhead)"/>`];
  if (label) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 + (curve ? curve / 2 : 0);
    const bw = label.length * 6.2 + 12;
    parts.push(`<rect x="${mx - bw / 2}" y="${my - 18}" width="${bw}" height="17" rx="8" fill="${C.page}"/>`);
    parts.push(text(mx, my - 6, label, { size: 11, fill: C.muted, weight: 600 }));
  }
  return parts.join('\n    ');
}

/** A crossed-out marker, for "this path does not happen". */
function cross(x, y, size = 14) {
  const s = size / 2;
  return `<g stroke="${C.roseLine}" stroke-width="3" stroke-linecap="round">
      <line x1="${x - s}" y1="${y - s}" x2="${x + s}" y2="${y + s}"/>
      <line x1="${x + s}" y1="${y - s}" x2="${x - s}" y2="${y + s}"/>
    </g>`;
}

function frame({ w, h, title, subtitle, body }) {
  // The XML declaration is not strictly required (XML defaults to UTF-8), but
  // these are served from a CDN that may omit a charset on the response, and
  // the diagrams contain →, ✓, ✕ and em dashes. Be explicit.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <defs>
    <marker id="arrowhead" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
      <polygon points="0 0, 9 3.5, 0 7" fill="${C.faint}"/>
    </marker>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" rx="20" fill="${C.page}" stroke="${C.edge}" stroke-width="2"/>
  ${text(w / 2, 42, title, { size: 22, weight: 700, fill: C.ink })}
  ${subtitle ? text(w / 2, 66, subtitle, { size: 13, fill: C.muted }) : ''}
  <g>
    ${body}
  </g>
</svg>
`;
}

/* ── Archetypes ─────────────────────────────────────────────────────── */

/** Ordered stages, left to right (wrapping to rows of `perRow`). */
function pipeline({ title, subtitle, stages, note, perRow = 4, w = 860 }) {
  const rows = [];
  for (let i = 0; i < stages.length; i += perRow) rows.push(stages.slice(i, i + perRow));

  const gap = 26;
  const cw = Math.floor((w - 60 - gap * (perRow - 1)) / perRow);
  const ch = 92;
  const top = 100;
  const rowGap = 44;

  const body = rows.map((row, ri) => {
    const y = top + ri * (ch + rowGap);
    return row.map((s, i) => {
      const x = 30 + i * (cw + gap);
      const parts = [card({
        x, y, w: cw, h: ch, tone: s.tone || 'white',
        title: s.title, lines: s.lines || [], tag: s.tag, mono: s.mono,
      })];
      if (i < row.length - 1) {
        parts.push(arrow(x + cw + 4, y + ch / 2, x + cw + gap - 4, y + ch / 2, { label: s.edge }));
      } else if (ri < rows.length - 1) {
        // wrap arrow down to the next row
        parts.push(arrow(x + cw / 2, y + ch + 4, 30 + cw / 2, y + ch + rowGap - 4, { curve: 30, label: s.edge }));
      }
      return parts.join('\n    ');
    }).join('\n    ');
  }).join('\n    ');

  const h = top + rows.length * ch + (rows.length - 1) * rowGap + (note ? 70 : 34);
  const noteEl = note
    ? `${box({ x: 30, y: h - 56, w: w - 60, h: 40, tone: 'amber', r: 10 })}
    ${text(w / 2, h - 31, note, { size: 12.5, fill: C.amberInk, weight: 600 })}`
    : '';

  return frame({ w, h, title, subtitle, body: body + '\n    ' + noteEl });
}

/** Two or three panels side by side. */
function compare({ title, subtitle, panels, note, w = 860 }) {
  const n = panels.length;
  const gap = 24;
  const pw = Math.floor((w - 60 - gap * (n - 1)) / n);
  const top = 96;

  const maxItems = Math.max(...panels.map(p => p.items.length));
  const ph = 78 + maxItems * 34;

  const body = panels.map((p, i) => {
    const x = 30 + i * (pw + gap);
    const [, line, ink] = TONES[p.tone || 'slate'];
    const parts = [
      box({ x, y: top, w: pw, h: ph, tone: p.tone || 'slate', r: 16, width: 2 }),
      text(x + pw / 2, top + 30, p.title, { size: 16, weight: 700, fill: ink }),
    ];
    if (p.subtitle) parts.push(text(x + pw / 2, top + 52, p.subtitle, { size: 12, fill: C.muted }));

    p.items.forEach((it, j) => {
      const iy = top + 68 + j * 34;
      const label = typeof it === 'string' ? it : it.label;
      const bad = typeof it === 'object' && it.bad;
      const good = typeof it === 'object' && it.good;
      parts.push(box({ x: x + 16, y: iy, w: pw - 32, h: 27, tone: 'white', r: 8, width: 1 }));
      const mark = bad ? '✕  ' : good ? '✓  ' : '';
      parts.push(text(x + pw / 2, iy + 18, mark + label, {
        size: 11.5, fill: bad ? C.roseInk : good ? C.greenInk : C.body,
        weight: bad || good ? 600 : 400,
      }));
    });
    if (p.verdict) {
      parts.push(text(x + pw / 2, top + ph - 12, p.verdict, { size: 11.5, weight: 700, fill: line }));
    }
    return parts.join('\n    ');
  }).join('\n    ');

  const h = top + ph + (note ? 74 : 32);
  const noteEl = note
    ? `${box({ x: 30, y: h - 58, w: w - 60, h: 42, tone: 'amber', r: 10 })}
    ${wrap(w / 2, h - 38, note, { max: 108, size: 12.5, fill: C.amberInk, weight: 600, lh: 15 })}`
    : '';

  return frame({ w, h, title, subtitle, body: body + '\n    ' + noteEl });
}

/** Layers stacked vertically; `pyramid: true` tapers the widths. */
function stack({ title, subtitle, layers, note, pyramid = false, w = 860 }) {
  const top = 96;
  const lh = 62;
  const gap = 12;

  const body = layers.map((l, i) => {
    const shrink = pyramid ? i * 62 : 0;
    const lw = w - 120 - shrink * 2;
    const x = (w - lw) / 2;
    const y = top + i * (lh + gap);
    const [, , ink] = TONES[l.tone || 'slate'];
    return [
      box({ x, y, w: lw, h: lh, tone: l.tone || 'slate', r: 12, width: 2 }),
      text(x + lw / 2, y + 26, l.title, { size: 14.5, weight: 700, fill: ink }),
      l.note ? text(x + lw / 2, y + 45, l.note, { size: 11.5, fill: C.muted }) : '',
      l.tag ? text(x + lw - 14, y + 26, l.tag, { size: 11, weight: 700, fill: ink, anchor: 'end' }) : '',
    ].join('\n    ');
  }).join('\n    ');

  const h = top + layers.length * (lh + gap) + (note ? 66 : 24);
  const noteEl = note
    ? `${box({ x: 30, y: h - 56, w: w - 60, h: 40, tone: 'green', r: 10 })}
    ${text(w / 2, h - 31, note, { size: 12.5, fill: C.greenInk, weight: 600 })}`
    : '';

  return frame({ w, h, title, subtitle, body: body + '\n    ' + noteEl });
}

/** One central subject with labelled callouts around it. */
function anatomy({ title, subtitle, subject, parts: callouts, note, w = 860 }) {
  const top = 100;
  const sw = w - 120;
  const sx = 60;
  const sh = 64;

  const el = [
    box({ x: sx, y: top, w: sw, h: sh, tone: 'slate', r: 12, width: 2 }),
    text(w / 2, top + 40, subject, { size: 18, weight: 700, fill: C.ink, mono: true }),
  ];

  const n = callouts.length;
  const cw = Math.floor((sw - (n - 1) * 16) / n);
  callouts.forEach((c, i) => {
    const x = sx + i * (cw + 16);
    const y = top + sh + 52;
    const [, , ink] = TONES[c.tone || 'blue'];
    el.push(arrow(x + cw / 2, top + sh + 6, x + cw / 2, y - 6, {}));
    el.push(card({ x, y, w: cw, h: 96, tone: c.tone || 'blue', title: c.title, lines: c.lines || [], mono: c.mono }));
    el.push(text(x + cw / 2, y + 90, c.foot || '', { size: 10.5, fill: ink, weight: 600 }));
  });

  const h = top + sh + 52 + 96 + (note ? 70 : 34);
  const noteEl = note
    ? `${box({ x: 30, y: h - 56, w: w - 60, h: 40, tone: 'amber', r: 10 })}
    ${text(w / 2, h - 31, note, { size: 12.5, fill: C.amberInk, weight: 600 })}`
    : '';

  return frame({ w, h, title, subtitle, body: el.join('\n    ') + '\n    ' + noteEl });
}

/** Cards in a grid. */
function grid({ title, subtitle, cards, cols = 3, note, w = 860, cardH = 118 }) {
  const gap = 20;
  const cw = Math.floor((w - 60 - gap * (cols - 1)) / cols);
  const top = 96;
  const rows = Math.ceil(cards.length / cols);

  const body = cards.map((c, i) => {
    const x = 30 + (i % cols) * (cw + gap);
    const y = top + Math.floor(i / cols) * (cardH + gap);
    return card({ x, y, w: cw, h: cardH, tone: c.tone || 'white', title: c.title, lines: c.lines || [], tag: c.tag, mono: c.mono });
  }).join('\n    ');

  const h = top + rows * cardH + (rows - 1) * gap + (note ? 70 : 30);
  const noteEl = note
    ? `${box({ x: 30, y: h - 56, w: w - 60, h: 40, tone: 'amber', r: 10 })}
    ${text(w / 2, h - 31, note, { size: 12.5, fill: C.amberInk, weight: 600 })}`
    : '';

  return frame({ w, h, title, subtitle, body: body + '\n    ' + noteEl });
}

/** A root box with a row of children, optionally with grandchildren. */
function tree({ title, subtitle, root, children, aside, note, w = 860 }) {
  const top = 98;
  const rootW = 300;
  const rootX = (w - rootW) / 2;
  const el = [card({ x: rootX, y: top, w: rootW, h: 64, tone: root.tone || 'green', title: root.title, lines: root.lines || [], mono: root.mono })];

  const n = children.length;
  const gap = 18;
  const cw = Math.floor((w - 60 - gap * (n - 1)) / n);
  const cy = top + 64 + 56;

  children.forEach((c, i) => {
    const x = 30 + i * (cw + gap);
    el.push(arrow(w / 2, top + 68, x + cw / 2, cy - 6, { curve: 0, label: c.edge }));
    el.push(card({ x, y: cy, w: cw, h: 92, tone: c.tone || 'white', title: c.title, lines: c.lines || [], tag: c.tag, mono: c.mono }));
  });

  let h = cy + 92 + 30;
  if (aside) {
    el.push(box({ x: 30, y: h - 6, w: w - 60, h: 44, tone: aside.tone || 'slate', r: 10 }));
    el.push(text(w / 2, h + 22, aside.text, { size: 12.5, fill: TONES[aside.tone || 'slate'][2], weight: 600 }));
    h += 56;
  }
  if (note) {
    el.push(box({ x: 30, y: h - 6, w: w - 60, h: 40, tone: 'amber', r: 10 }));
    el.push(text(w / 2, h + 19, note, { size: 12.5, fill: C.amberInk, weight: 600 }));
    h += 52;
  }

  return frame({ w, h, title, subtitle, body: el.join('\n    ') });
}

/* ── Specs: one entry per {{fig:…}} marker ──────────────────────────── */

const D = {

  /* ── Chapter 1 ── */
  'ch1-progressive-layers.svg': () => stack({
    title: 'Vue is adopted in layers',
    subtitle: 'Each ring is optional until the application needs it',
    pyramid: true,
    layers: [
      { title: 'Core runtime — a <script> tag on an existing page', note: 'No build step, no toolchain', tone: 'green' },
      { title: 'Components & Single-File Components', note: 'Reusable units; needs a build step', tone: 'green' },
      { title: 'Vue Router + Pinia', note: 'Client routing and shared state — official, still optional', tone: 'blue' },
      { title: 'Vite build pipeline', note: 'Bundling, TypeScript, code splitting', tone: 'blue' },
      { title: 'SSR / SSG (Nuxt)', note: 'Server rendering and hydration', tone: 'violet' },
    ],
    note: 'The same component model at every layer — nothing is rewritten as you climb.',
  }),

  'ch1-app-instance.svg': () => pipeline({
    title: 'createApp → configure → mount',
    subtitle: 'Configuration after mount() is silently ignored',
    perRow: 3,
    stages: [
      { title: 'createApp(App)', tone: 'green', mono: true, lines: ['Isolated instance', 'Nothing rendered yet'], edge: 'returns app' },
      { title: 'Configure', tone: 'blue', lines: ['use() · component()', 'directive() · provide()', 'config.errorHandler'], edge: 'then' },
      { title: 'mount("#app")', tone: 'violet', mono: true, lines: ['Renders into the DOM', 'Returns the ROOT COMPONENT'] },
    ],
    note: 'mount() returns the root component instance, not the app — never chain .use() after it.',
  }),

  'ch1-ref-vs-reactive.svg': () => compare({
    title: 'ref vs reactive',
    subtitle: 'Only objects can be proxied — which is the whole reason refs exist',
    panels: [
      {
        title: 'ref(value)', tone: 'green', subtitle: 'Boxes ANY value behind .value',
        items: [
          { label: 'Works with primitives and objects', good: true },
          { label: 'Survives destructuring', good: true },
          { label: 'Can be reassigned wholesale', good: true },
          '.value in script, auto-unwrapped in template',
          'Intercepts the value getter/setter',
        ],
        verdict: 'Default to this',
      },
      {
        title: 'reactive(object)', tone: 'blue', subtitle: 'Proxies an existing object',
        items: [
          { label: 'Objects only — reactive(0) does nothing', bad: true },
          { label: 'Destructuring kills reactivity', bad: true },
          { label: 'Cannot be reassigned', bad: true },
          'No .value anywhere',
          'Proxy traps every property access',
        ],
        verdict: 'For a cohesive group of fields',
      },
    ],
    note: 'A Proxy cannot wrap the number 0, so primitives need a container with a property to intercept — that container is the ref, and .value is the property.',
  }),

  'ch1-template-compilation.svg': () => pipeline({
    title: 'Templates are compiled, not interpreted',
    subtitle: 'The browser never sees your template',
    perRow: 4,
    stages: [
      { title: 'Template', tone: 'slate', lines: ['Valid HTML +', 'directives'], edge: 'parse' },
      { title: 'AST', tone: 'blue', lines: ['Tree of nodes,', 'statically analysable'], edge: 'transform' },
      { title: 'Optimise', tone: 'green', lines: ['Static hoisting', 'Patch flags', 'Block trees'], edge: 'generate' },
      { title: 'Render function', tone: 'violet', lines: ['Returns a vnode tree', 'Runs in an effect'] },
    ],
    note: 'This is why {{ }} works in text but not in attributes — they are different node structures in the AST.',
  }),

  'ch1-sfc-anatomy.svg': () => anatomy({
    title: 'Anatomy of a Single-File Component',
    subtitle: 'One file, three blocks, one concern',
    subject: 'UserCard.vue',
    parts: [
      { title: '<script setup>', tone: 'green', mono: true, lines: ['State, computeds,', 'functions, imports'], foot: '→ setup() + auto return' },
      { title: '<template>', tone: 'blue', mono: true, lines: ['Markup.', 'One per file.'], foot: '→ render function' },
      { title: '<style scoped>', tone: 'violet', mono: true, lines: ['CSS confined to', 'this component'], foot: '→ [data-v-hash] selectors' },
    ],
    note: 'Separation of concerns by COMPONENT, not by file type — what changes together stays together.',
  }),

  /* ── Chapter 2 ── */
  'ch2-one-way-data-flow.svg': () => tree({
    title: 'Props down, events up',
    subtitle: 'One owner per piece of state',
    root: { title: 'Parent — owns the state', tone: 'green', lines: ['const user = ref(…)'] , mono: false },
    children: [
      { title: 'props', tone: 'blue', lines: ['Read-only in the child', 'Reactive', 'Must be declared'], edge: 'down' },
      { title: 'emit', tone: 'violet', lines: ['Child reports what happened', 'Parent decides what it means'], edge: 'up' },
      { title: 'direct write', tone: 'rose', lines: ['Child assigns to parent state', 'Untraceable — forbidden'], tag: 'NEVER' },
    ],
    aside: { text: 'Assigning to a prop warns. Mutating a prop OBJECT does not warn — and is the same mistake.', tone: 'rose' },
  }),

  'ch2-emit-flow.svg': () => pipeline({
    title: 'emit() is a direct call, not an event',
    subtitle: 'No bubbling, no propagation, no event bus',
    perRow: 4,
    stages: [
      { title: 'Child', tone: 'blue', mono: true, lines: ["emit('select', 42)"], edge: 'resolves' },
      { title: 'onSelect prop', tone: 'slate', lines: ['The listener the parent', 'passed down'], edge: 'calls' },
      { title: 'Parent handler', tone: 'green', lines: ['Updates its own state'], edge: 're-renders' },
      { title: 'Props flow back', tone: 'violet', lines: ['Child sees the new value'] },
    ],
    note: 'A grandparent cannot hear a grandchild — every layer must re-emit, or use provide/inject or Pinia.',
  }),

  'ch2-slots.svg': () => grid({
    title: 'Slots project markup into a child',
    subtitle: 'Props configure with data; slots supply structure',
    cols: 3,
    cardH: 128,
    cards: [
      { title: 'Default slot', tone: 'green', lines: ['<slot />', 'Everything between the tags', 'Fallback if unfilled'], mono: false },
      { title: 'Named slots', tone: 'blue', lines: ['<slot name="header" />', 'Parent: #header', 'Guard with v-if="$slots.x"'] },
      { title: 'Scoped slots', tone: 'violet', lines: ['<slot :row="row" />', 'Parent: #default="{ row }"', 'Child data → parent markup'] },
    ],
    note: 'Slot content compiles in the PARENT’s scope — a scoped slot is that function being called with arguments.',
  }),

  'ch2-provide-inject.svg': () => compare({
    title: 'Prop drilling vs provide / inject',
    subtitle: 'Both move data down; only one skips the middle',
    panels: [
      {
        title: 'Prop drilling', tone: 'rose', subtitle: 'Every layer forwards',
        items: [
          'App  →  declares + passes theme',
          'Layout  →  declares + passes theme',
          'Sidebar  →  declares + passes theme',
          'Menu  →  declares + passes theme',
          { label: 'Button — finally uses it', good: true },
        ],
        verdict: '3 components carry data they never use',
      },
      {
        title: 'provide / inject', tone: 'green', subtitle: 'Ancestor to any descendant',
        items: [
          'App  →  provide(themeKey, ctx)',
          'Layout  —  knows nothing',
          'Sidebar  —  knows nothing',
          'Menu  —  knows nothing',
          { label: 'Button  →  inject(themeKey)', good: true },
        ],
        verdict: 'Nearest provider wins',
      },
    ],
    note: 'NOT reactive by itself — provide a ref, reactive or computed, and pair readonly() state with explicit mutators.',
  }),

  'ch2-dynamic-components.svg': () => compare({
    title: '<component :is> with and without <KeepAlive>',
    subtitle: 'What happens when you switch tabs',
    panels: [
      {
        title: 'Without KeepAlive', tone: 'rose', subtitle: 'Instance destroyed each switch',
        items: [
          'Tab A unmounts — onUnmounted fires',
          'State is thrown away',
          'Tab B mounts fresh — onMounted fires',
          { label: 'Half-filled form is lost', bad: true },
          { label: 'Scroll position is lost', bad: true },
        ],
      },
      {
        title: 'With KeepAlive', tone: 'green', subtitle: 'Instance cached, not destroyed',
        items: [
          'Tab A deactivates — onDeactivated fires',
          'State is retained in the cache',
          'Tab B activates — onActivated fires',
          { label: 'Form state survives', good: true },
          { label: 'Bound the cache with :max', good: true },
        ],
      },
    ],
    note: 'Cleanup written in onUnmounted NEVER RUNS under KeepAlive — timers and subscriptions must move to onDeactivated.',
  }),

  /* ── Chapter 3 ── */
  'ch3-options-vs-composition.svg': () => compare({
    title: 'The fragmentation problem',
    subtitle: 'Where one feature’s code lives',
    panels: [
      {
        title: 'Options API', tone: 'blue', subtitle: 'Grouped by option type',
        items: [
          'data()      → search, results',
          'computed    → filtered',
          'watch       → search',
          'methods     → runSearch()',
          'mounted()   → runSearch()',
          { label: 'One feature, five places', bad: true },
        ],
      },
      {
        title: 'Composition API', tone: 'green', subtitle: 'Grouped by feature',
        items: [
          '── search ──────────────',
          'const search = ref("")',
          'const filtered = computed(…)',
          'function runSearch() {…}',
          'watch(search, runSearch)',
          { label: 'One feature, one block', good: true },
        ],
      },
    ],
    note: 'Because there is no `this`, that block can be lifted into a composable unchanged. That is the whole payoff.',
  }),

  'ch3-script-setup-compilation.svg': () => pipeline({
    title: 'What <script setup> compiles to',
    subtitle: 'A build-time transform, not a runtime feature',
    perRow: 3,
    stages: [
      { title: '<script setup>', tone: 'green', mono: true, lines: ['Your code', 'Macros at top level'], edge: 'compile' },
      { title: 'setup() { … }', tone: 'blue', lines: ['Block becomes the body', 'Return generated for you'], edge: 'lift' },
      { title: 'Component options', tone: 'violet', lines: ['defineProps → props', 'defineEmits → emits', 'Macros disappear'] },
    ],
    note: 'Macros are statically analysed ⇒ top level only, and they cannot reference variables from the same block.',
  }),

  'ch3-composable-instances.svg': () => compare({
    title: 'Composable vs store',
    subtitle: 'The question is whether state should be shared',
    panels: [
      {
        title: 'useCounter()', tone: 'green', subtitle: 'State created INSIDE the function',
        items: [
          'Component A  →  count = 0',
          'Component B  →  count = 0',
          'Component C  →  count = 0',
          { label: 'A increments → only A changes', good: true },
          'Fresh state per call',
        ],
        verdict: 'Per-component concerns',
      },
      {
        title: 'useCounterStore()', tone: 'violet', subtitle: 'One instance for the app',
        items: [
          'Component A  ┐',
          'Component B  ├→  the same count',
          'Component C  ┘',
          { label: 'A increments → all three see it', good: true },
          'One shared instance',
        ],
        verdict: 'Auth, cart, notifications',
      },
    ],
    note: 'Module-scope state in a composable fakes a store — but loses devtools, HMR, and leaks across requests under SSR.',
  }),

  'ch3-lifecycle.svg': () => pipeline({
    title: 'Component lifecycle',
    subtitle: 'Parents start first; children finish first',
    perRow: 4,
    stages: [
      { title: 'setup()', tone: 'green', lines: ['≙ created', 'Reactivity live, NO DOM'], edge: 'then' },
      { title: 'onBeforeMount', tone: 'blue', lines: ['About to insert'], edge: 'render' },
      { title: 'onMounted', tone: 'violet', lines: ['DOM exists, refs populated', 'Timers, listeners, libraries'], tag: 'CLIENT ONLY', edge: 'on change' },
      { title: 'onBeforeUpdate / onUpdated', tone: 'amber', lines: ['Brackets a re-render', 'Never set state here'], edge: 'teardown' },
      { title: 'onBeforeUnmount', tone: 'slate', lines: ['Still fully usable', 'Persist state here'], edge: 'then' },
      { title: 'onUnmounted', tone: 'rose', lines: ['Release EVERYTHING', 'claimed in onMounted'] },
      { title: 'onErrorCaptured', tone: 'amber', lines: ['A descendant threw', 'return false to stop it'] },
      { title: 'onActivated / onDeactivated', tone: 'green', lines: ['Replace mount/unmount', 'under <KeepAlive>'] },
    ],
    note: 'Mount order: child mounted → parent mounted. Unmount reverses. onMounted never runs on the server.',
  }),

  /* ── Chapter 4 ── */
  'ch4-track-trigger.svg': () => pipeline({
    title: 'The reactivity loop',
    subtitle: 'Reads record dependencies; writes re-run what depends on them',
    perRow: 4,
    stages: [
      { title: 'Effect runs', tone: 'green', lines: ['activeEffect = this', 'render / computed / watcher'], edge: 'reads' },
      { title: 'Proxy get trap', tone: 'blue', lines: ['track(target, key)'], mono: false, edge: 'records' },
      { title: 'targetMap', tone: 'violet', lines: ['WeakMap<target,', 'Map<key, Set<effect>>>'], edge: 'on write' },
      { title: 'Proxy set trap', tone: 'amber', lines: ['trigger(target, key)'], edge: 'queues' },
      { title: 'Job queue', tone: 'slate', lines: ['De-duplicated', 'Parent before child'], edge: 'microtask' },
      { title: 'Flush', tone: 'green', lines: ['Effects re-run', 'DOM patched'], tag: 'nextTick()' },
    ],
    note: 'Reads OUTSIDE an effect track nothing — activeEffect is null, so track() returns early.',
  }),

  'ch4-computed-cache.svg': () => pipeline({
    title: 'A computed is lazy and cached',
    subtitle: 'A dependency change marks it dirty; the work happens on the next read',
    perRow: 4,
    stages: [
      { title: 'Created', tone: 'slate', lines: ['Getter does NOT run', 'dirty = true'], edge: 'first read' },
      { title: 'Evaluate', tone: 'green', lines: ['Runs in an effect', 'Dependencies tracked', 'Result cached'], edge: 'read again' },
      { title: 'Cache hit', tone: 'blue', lines: ['Returns instantly', 'Getter never runs'], edge: 'dep changes' },
      { title: 'Marked dirty', tone: 'amber', lines: ['NOT recomputed yet', 'Recomputes on next access'] },
    ],
    note: 'Getters must be pure — they may run at unpredictable times, or never at all.',
  }),

  'ch4-watch-flush.svg': () => pipeline({
    title: 'Watcher flush timing',
    subtitle: 'Whether your callback sees the old DOM or the new one',
    perRow: 4,
    stages: [
      { title: 'State changes', tone: 'slate', lines: ['Effects queued'], edge: 'microtask' },
      { title: "flush: 'pre'", tone: 'blue', lines: ['DEFAULT', 'DOM still shows OLD state'], tag: 'default', edge: 'then' },
      { title: 'Render + patch', tone: 'green', lines: ['Parent before child', 'DOM updated'], edge: 'then' },
      { title: "flush: 'post'", tone: 'violet', lines: ['DOM shows NEW state', 'Measure / scroll here'] },
    ],
    note: "flush: 'sync' runs immediately and unbatched — it defeats the queue and is almost never right.",
  }),

  'ch4-reactivity-utilities.svg': () => grid({
    title: 'Reactivity utilities, by the problem they solve',
    subtitle: 'Reach for these when the defaults are not what you want',
    cols: 2,
    cardH: 122,
    cards: [
      { title: 'Keep the connection', tone: 'green', lines: ['toRef(obj, "key") · toRefs(obj)', 'toValue(x) · unref(x)', 'Destructure without losing reactivity'] },
      { title: 'Control the depth', tone: 'blue', lines: ['shallowRef · shallowReactive', 'triggerRef() to notify manually', 'For large payloads replaced wholesale'] },
      { title: 'Escape entirely', tone: 'amber', lines: ['markRaw(o) — never proxied', 'toRaw(p) — the original object', 'Library instances, component defs'] },
      { title: 'Restrict writes', tone: 'violet', lines: ['readonly(o) · shallowReadonly(o)', 'Deep, live, DEV-ONLY guard', 'Pair with explicit mutators'] },
    ],
    note: 'readonly() is not security — the warning is stripped in production and toRaw() bypasses it.',
  }),

  'ch4-update-queue.svg': () => pipeline({
    title: 'The async update queue',
    subtitle: 'One microtask, three phases',
    perRow: 4,
    stages: [
      { title: 'Sync mutations', tone: 'slate', lines: ['count.value++ ×3', 'State updated immediately'], edge: 'queue' },
      { title: '1. Pre-flush', tone: 'blue', lines: ['watch (default)', 'Can change more state'], edge: 'then' },
      { title: '2. Render effects', tone: 'green', lines: ['Sorted by component id', 'PARENT before child'], edge: 'then' },
      { title: '3. Post-flush', tone: 'violet', lines: ["watch flush:'post'", 'onUpdated · nextTick()'] },
    ],
    note: 'Scheduled with Promise.then — a MICROTASK, so it lands before paint. setTimeout(…,0) is the wrong ordering.',
  }),

  /* ── Chapter 5 ── */
  'ch5-vfor-key-diffing.svg': () => compare({
    title: 'Prepending an item to a keyed vs unkeyed list',
    subtitle: 'The rendered text is right either way — the DOM state is not',
    panels: [
      {
        title: 'No key (or :key="index")', tone: 'rose', subtitle: 'Patched by POSITION',
        items: [
          'Position 0: node reused, text rewritten',
          'Position 1: node reused, text rewritten',
          'Position 2: new node appended',
          { label: 'Checkbox stays on position, not row', bad: true },
          { label: 'Input value follows the wrong item', bad: true },
        ],
      },
      {
        title: ':key="item.id"', tone: 'green', subtitle: 'Matched by IDENTITY',
        items: [
          'New node created for the new id',
          'Existing nodes MOVED, not rewritten',
          'LIS computes the minimum moves',
          { label: 'Checkbox travels with its row', good: true },
          { label: 'Focus and scroll stay correct', good: true },
        ],
      },
    ],
    note: 'The index IS the position — keying by it gives Vue exactly the information it had with no key at all.',
  }),

  'ch5-vmodel.svg': () => anatomy({
    title: 'v-model is a binding plus a listener',
    subtitle: 'Which property and which event depends on the element',
    subject: 'v-model="message"',
    parts: [
      { title: 'text / textarea', tone: 'green', mono: false, lines: [':value', '@input'], foot: 'v-model.trim / .lazy' },
      { title: 'checkbox / radio', tone: 'blue', lines: [':checked', '@change'], foot: 'array binding for groups' },
      { title: 'select', tone: 'violet', lines: [':value', '@change'], foot: ':value for object options' },
      { title: 'component', tone: 'amber', lines: [':model-value', '@update:model-value'], foot: 'defineModel() in 3.4+' },
    ],
    note: '<input type="number"> still yields a STRING — always use v-model.number.',
  }),

  'ch5-custom-directive.svg': () => anatomy({
    title: 'Anatomy of a directive usage',
    subtitle: 'Every part maps onto the binding object your hooks receive',
    subject: 'v-tooltip:top.fast="message"',
    parts: [
      { title: 'name', tone: 'green', mono: true, lines: ['v-tooltip', 'const vTooltip = {…}'], foot: 'local, or app.directive()' },
      { title: 'arg', tone: 'blue', mono: true, lines: [':top', 'binding.arg'], foot: '"top"' },
      { title: 'modifiers', tone: 'violet', mono: true, lines: ['.fast', 'binding.modifiers'], foot: '{ fast: true }' },
      { title: 'value', tone: 'amber', mono: true, lines: ['="message"', 'binding.value'], foot: 'and binding.oldValue' },
    ],
    note: 'Always pair mounted with unmounted — an unremoved listener leaks for every element the directive touched.',
  }),

  /* ── Chapter 6 ── */
  'ch6-render-pipeline.svg': () => pipeline({
    title: 'From template to DOM',
    subtitle: 'Stages 2–4 re-run whenever a dependency changes',
    perRow: 4,
    stages: [
      { title: '1. Compile', tone: 'slate', lines: ['Build time', 'Hoisting + patch flags'], edge: 'emits' },
      { title: '2. Render', tone: 'green', lines: ['Runs in a reactive effect', 'Returns a vnode tree'], edge: 'compare' },
      { title: '3. Diff', tone: 'blue', lines: ['Old tree vs new tree', 'Keyed children → LIS'], edge: 'apply' },
      { title: '4. Patch', tone: 'violet', lines: ['Minimum DOM operations'] },
    ],
    note: 'The virtual DOM is a COST paid for declarativeness — the compiler’s job is to make that cost small.',
  }),

  'ch6-teleport.svg': () => compare({
    title: 'Teleport separates DOM position from component position',
    subtitle: 'The modal moves; the relationship does not',
    panels: [
      {
        title: 'DOM position', tone: 'blue', subtitle: 'Moved to the target',
        items: [
          'body',
          '  └ div#app  (overflow: hidden)',
          '  └ div#modals  ← rendered HERE',
          { label: 'Escapes overflow, z-index, transform', good: true },
        ],
      },
      {
        title: 'Component position', tone: 'green', subtitle: 'Completely unchanged',
        items: [
          'App → Page → Card → Modal',
          'props and emits work normally',
          'provide / inject resolves normally',
          { label: 'Scoped-style hash still applied', good: true },
        ],
      },
    ],
    note: 'A high z-index cannot fix this: z-index only orders WITHIN a stacking context, and transform breaks position:fixed.',
  }),

  'ch6-transition-classes.svg': () => pipeline({
    title: 'The six transition classes',
    subtitle: 'Vue delays the DOM removal until the leave transition finishes',
    perRow: 3,
    stages: [
      { title: 'v-enter-from', tone: 'green', lines: ['Applied before insert', 'Removed after ONE frame', 'The starting style'], edge: 'next frame' },
      { title: 'v-enter-active', tone: 'green', lines: ['Whole entering phase', 'Holds the transition property'], edge: 'swap' },
      { title: 'v-enter-to', tone: 'green', lines: ['The ending style', 'Removed on transitionend'] },
      { title: 'v-leave-from', tone: 'violet', lines: ['Applied immediately', 'The starting style'], edge: 'next frame' },
      { title: 'v-leave-active', tone: 'violet', lines: ['Whole leaving phase', 'ELEMENT STILL IN THE DOM'], edge: 'swap' },
      { title: 'v-leave-to', tone: 'violet', lines: ['The ending style', 'THEN the node is removed'] },
    ],
    note: 'Animate transform and opacity only — they are composited. height/top/margin reflow on every frame.',
  }),

  'ch6-async-suspense-keepalive.svg': () => grid({
    title: 'Three built-ins, three different jobs',
    subtitle: 'Split the bundle · centralise loading · preserve instances',
    cols: 3,
    cardH: 138,
    cards: [
      { title: 'defineAsyncComponent', tone: 'green', lines: ['() => import("./X.vue")', 'Separate chunk, loaded on first render', 'loadingComponent + delay: 200', 'errorComponent + onError retry'] },
      { title: '<Suspense>', tone: 'blue', lines: ['#default + #fallback', 'Waits for ALL async deps', 'Top-level await needs it', 'Still EXPERIMENTAL'] },
      { title: '<KeepAlive>', tone: 'violet', lines: ['Caches instead of destroying', 'onActivated / onDeactivated', 'Bound with :max', 'include/exclude match name'] },
    ],
    note: 'Never async-load a component on the first paint — that just adds a round trip to the critical path.',
  }),

  /* ── Chapter 7 ── */
  'ch7-url-anatomy.svg': () => anatomy({
    title: 'What lives in a URL',
    subtitle: 'If removing it should 404 it is a param; if it should show defaults it is a query',
    subject: '/users/42?sort=name&page=2#bio',
    parts: [
      { title: 'Route param', tone: 'green', mono: false, lines: ['/users/:id', 'route.params.id'], foot: 'WHICH resource · required' },
      { title: 'Query params', tone: 'blue', lines: ['?sort=name&page=2', 'route.query.sort'], foot: 'HOW to view · optional' },
      { title: 'Hash', tone: 'violet', lines: ['#bio', 'route.hash'], foot: 'scrollBehavior target' },
    ],
    note: 'Every param value is a STRING — route.params.id === 42 is always false.',
  }),

  'ch7-nested-routes.svg': () => tree({
    title: 'Nested routes mirror the component tree',
    subtitle: '<RouterView> is recursive',
    root: { title: 'App.vue → <RouterView>', tone: 'slate', lines: ['The top-level outlet'] },
    children: [
      { title: 'DashboardLayout', tone: 'green', lines: ['Sidebar + header', 'Its OWN <RouterView>', 'Mounted once'], tag: 'parent', edge: 'renders' },
      { title: "path: '' → Overview", tone: 'blue', lines: ['Default child', 'Renders when parent matches'], edge: 'child' },
      { title: "'analytics' → Analytics", tone: 'blue', lines: ['Relative — appended', '/dashboard/analytics'], edge: 'child' },
    ],
    aside: { text: 'route.matched is the array of records, outermost first — the basis for auth checks and breadcrumbs.', tone: 'green' },
    note: 'A LEADING SLASH on a child path makes it absolute and ignores the parent entirely.',
  }),

  'ch7-guard-order.svg': () => pipeline({
    title: 'Navigation guard order',
    subtitle: 'Everything before confirmation can redirect or cancel',
    perRow: 4,
    stages: [
      { title: 'beforeRouteLeave', tone: 'slate', lines: ['On components being left', 'Unsaved-changes prompt'], edge: 'then' },
      { title: 'beforeEach', tone: 'green', lines: ['GLOBAL', 'Auth and roles'], edge: 'then' },
      { title: 'beforeRouteUpdate', tone: 'blue', lines: ['On reused components', 'Param changed'], edge: 'then' },
      { title: 'beforeEnter', tone: 'blue', lines: ['On the route record', 'Per-route checks'], edge: 'then' },
      { title: 'Async components', tone: 'violet', lines: ['Lazy chunks resolve here'], edge: 'then' },
      { title: 'beforeResolve', tone: 'green', lines: ['GLOBAL', 'Confirmed, nothing rendered'], edge: 'confirm' },
      { title: 'afterEach', tone: 'amber', lines: ['CANNOT cancel', 'Titles, analytics'], edge: 'then' },
      { title: 'DOM + onMounted', tone: 'slate', lines: ['The page appears'] },
    ],
    note: 'Return value controls it: nothing = allow · a location = redirect · false = cancel. next() is legacy.',
  }),

  'ch7-code-splitting.svg': () => compare({
    title: 'Route-level code splitting',
    subtitle: 'The highest-value performance change in most apps',
    panels: [
      {
        title: 'Static imports', tone: 'rose', subtitle: 'One bundle',
        items: [
          'main.js — 780 kB',
          '  includes Login',
          '  includes Dashboard',
          '  includes Admin + charts + editor',
          { label: 'Login page downloads all of it', bad: true },
        ],
      },
      {
        title: 'Dynamic imports', tone: 'green', subtitle: 'Chunk per feature',
        items: [
          'index.js — 90 kB (+ vendor)',
          'login.js — 12 kB   ← fetched now',
          'dashboard.js — 140 kB  ← on visit',
          'admin.js — 320 kB  ← maybe never',
          { label: 'Prefetch on hover to hide the latency', good: true },
        ],
      },
    ],
    note: 'Never split the first route. After a deploy, old hashed chunks 404 — handle router.onError with one guarded reload.',
  }),

  /* ── Chapter 8 ── */
  'ch8-state-ladder.svg': () => stack({
    title: 'Climb only as far as the scope requires',
    subtitle: 'Most state stops well below the top rung',
    layers: [
      { title: 'ref / reactive in setup', note: 'One component — is this dropdown open?', tone: 'green', tag: 'local' },
      { title: 'props / emits', note: 'Parent → child — the item a row renders', tone: 'green', tag: 'adjacent' },
      { title: 'provide / inject', note: 'A subtree — compound components, theme, form context', tone: 'blue', tag: 'subtree' },
      { title: 'composables', note: 'Reused logic with ISOLATED state per call', tone: 'blue', tag: 'reuse' },
      { title: 'Pinia', note: 'The whole app — auth, cart, notifications', tone: 'violet', tag: 'global' },
      { title: 'Query library / the URL', note: 'Server data is a cache; filters and pagination belong in the query string', tone: 'amber', tag: 'outside' },
    ],
    note: 'A store is needed when state is shared NON-HIERARCHICALLY or must outlive a route.',
  }),

  'ch8-pinia-store.svg': () => anatomy({
    title: 'A Pinia store is a component script, hoisted out of the tree',
    subtitle: "defineStore returns a FUNCTION — call it in setup to get the shared instance",
    subject: "defineStore('cart', () => { … })",
    parts: [
      { title: 'state', tone: 'green', mono: false, lines: ['refs', 'const items = ref([])'], foot: '≙ data()' },
      { title: 'getters', tone: 'blue', lines: ['computeds', 'const total = computed(…)'], foot: '≙ computed' },
      { title: 'actions', tone: 'violet', lines: ['functions, may be async', 'MUTATE STATE DIRECTLY'], foot: 'no mutations layer' },
    ],
    note: 'Destructuring the store kills reactivity — use storeToRefs(). Actions are plain functions and destructure fine.',
  }),

  'ch8-pinia-ecosystem.svg': () => grid({
    title: 'What surrounds a store in production',
    subtitle: 'Plugins · persistence · tests · SSR',
    cols: 2,
    cardH: 122,
    cards: [
      { title: 'Plugins', tone: 'green', lines: ['pinia.use(({ store, options }) => …)', 'Runs for every store on creation', 'Returned object merges onto it'] },
      { title: 'Persistence', tone: 'blue', lines: ['$patch on restore · $subscribe to write', 'Debounce; whitelist paths; version it', 'NEVER persist tokens'] },
      { title: 'Testing', tone: 'violet', lines: ['createTestingPinia({ initialState })', 'Actions are STUBBED by default', 'setActivePinia() in beforeEach'] },
      { title: 'SSR', tone: 'amber', lines: ['Fresh Pinia PER REQUEST', 'Serialise with devalue, not JSON', 'Assign state BEFORE mount()'] },
    ],
    note: 'Module-scope state on the server is shared across every request — a genuine cross-user data leak.',
  }),

  'ch8-vuex-to-pinia.svg': () => compare({
    title: 'Vuex module → Pinia store',
    subtitle: 'Mostly one-to-one, with one concept deleted',
    panels: [
      {
        title: 'Vuex', tone: 'blue', subtitle: 'namespaced: true',
        items: [
          'state: () => ({ items: [] })',
          'getters: (state, _, rootState) => …',
          { label: 'mutations: ADD_ITEM, SET_LOADING', bad: true },
          "actions: ({ commit, dispatch }) => …",
          "dispatch('cart/checkout')",
        ],
      },
      {
        title: 'Pinia', tone: 'green', subtitle: 'flat, one store per domain',
        items: [
          'const items = ref([])',
          'const total = computed(…)',
          { label: 'mutations — GONE', good: true },
          'async function checkout() { … }',
          'useCartStore().checkout()',
        ],
      },
    ],
    note: 'Mutations existed for devtools replay; Pinia gets that by tracking reactive state directly. Both libraries can run side by side — migrate one store per PR.',
  }),

  /* ── Chapter 9 ── */
  'ch9-performance-costs.svg': () => grid({
    title: 'Three costs, three sets of remedies',
    subtitle: 'Diagnose which one you are paying before choosing a fix',
    cols: 3,
    cardH: 152,
    cards: [
      { title: 'Load cost', tone: 'rose', lines: ['Slow first paint, blank screen', '— route code splitting', '— dependency audit', '— Brotli / gzip', 'Measure: Lighthouse, visualizer'] },
      { title: 'Render cost', tone: 'amber', lines: ['Slow to display a page or list', '— virtual scrolling', '— pagination', '— fewer components', 'Measure: DevTools timeline'] },
      { title: 'Update cost', tone: 'blue', lines: ['Laggy typing, janky interaction', '— shallowRef, markRaw', '— computed not method', '— debounce, split components', 'Measure: onRenderTriggered'] },
    ],
    note: 'v-once and v-memo are LAST resorts — a missing v-memo dependency is a silently stale UI.',
  }),

  'ch9-render-functions.svg': () => compare({
    title: 'Three routes to the same vnode tree',
    subtitle: 'They differ in what the compiler can prove',
    panels: [
      {
        title: 'Template', tone: 'green', subtitle: 'The default',
        items: [
          'Statically analysable',
          { label: 'Static hoisting', good: true },
          { label: 'Patch flags', good: true },
          { label: 'Block trees', good: true },
          'Usually the FASTEST',
        ],
      },
      {
        title: 'Render function', tone: 'blue', subtitle: 'h(type, props, children)',
        items: [
          'Full power of JavaScript',
          { label: 'No compiler optimisations', bad: true },
          'Diffed in full',
          'Dynamic tags, slot transforms',
          'setup() must return a FUNCTION',
        ],
      },
      {
        title: 'JSX', tone: 'violet', subtitle: '@vitejs/plugin-vue-jsx',
        items: [
          'Compiles to the same h() calls',
          { label: 'No compiler optimisations', bad: true },
          'More readable than raw h()',
          'class stays class, not className',
          'Not the Vue idiom',
        ],
      },
    ],
    note: 'People assume render functions are the faster low-level option. It is the other way round.',
  }),

  'ch9-security.svg': () => grid({
    title: 'Where Vue’s safe defaults end',
    subtitle: 'Every hole is somewhere you deliberately stepped outside them',
    cols: 3,
    cardH: 132,
    cards: [
      { title: '{{ }} — safe', tone: 'green', lines: ['HTML-escaped', 'Attribute bindings escaped too', 'Safe with any input'] },
      { title: 'v-html — XSS', tone: 'rose', lines: ['Sets innerHTML', 'Sanitise with DOMPurify', 'Allow-list, at RENDER time'] },
      { title: ':href / :src', tone: 'rose', lines: ['javascript: executes on click', 'Vue does NOT filter schemes', 'Validate the protocol'] },
      { title: 'Token storage', tone: 'amber', lines: ['localStorage is script-readable', 'httpOnly + Secure + SameSite', 'Then add CSRF tokens'] },
      { title: 'Route guards', tone: 'amber', lines: ['Control RENDERING only', 'The user controls the browser', 'Authorise on the server'] },
      { title: 'VITE_ vars', tone: 'rose', lines: ['Inlined into the bundle', 'Completely public', 'Publishable keys only'] },
    ],
    note: 'Do not send data the user may not see and then hide it in the UI — it is in the network tab either way.',
  }),

  /* ── Chapter 10 ── */
  'ch10-vite-vs-webpack.svg': () => compare({
    title: 'Why the Vite dev server starts instantly',
    subtitle: 'An architectural difference, not an optimisation',
    panels: [
      {
        title: 'Bundler-first (Webpack)', tone: 'blue', subtitle: 'Build, then serve',
        items: [
          'Crawl the whole dependency graph',
          'Bundle everything',
          'THEN serve the first byte',
          { label: 'Startup scales with project size', bad: true },
          { label: 'HMR rebuilds part of the bundle', bad: true },
        ],
      },
      {
        title: 'Vite', tone: 'green', subtitle: 'Serve, then transform on demand',
        items: [
          'Serve index.html immediately',
          'Browser requests each module',
          'Transform only what is opened',
          { label: 'Startup is near-constant', good: true },
          { label: 'HMR invalidates ONE module', good: true },
        ],
      },
    ],
    note: 'Production still uses a Rollup bundle. Dependencies are pre-bundled once with esbuild (CJS→ESM, fewer requests).',
  }),

  'ch10-testing-pyramid.svg': () => stack({
    title: 'What to test, and how much',
    subtitle: 'Test behaviour, not implementation',
    pyramid: true,
    layers: [
      { title: 'Unit — composables, stores, pure functions', note: 'Fast, many, run on every save', tone: 'green' },
      { title: 'Component — rendered output and interactions', note: 'Vue Test Utils / Testing Library · await every interaction', tone: 'blue' },
      { title: 'End-to-end — critical journeys only', note: 'Playwright · signup, login, checkout', tone: 'violet' },
    ],
    note: 'Never assert on wrapper.vm — internal state couples the test to implementation and breaks on refactors.',
  }),

  'ch10-ssr-hydration.svg': () => compare({
    title: 'SPA vs SSR + hydration',
    subtitle: 'What the user sees, and when',
    panels: [
      {
        title: 'SPA', tone: 'blue', subtitle: 'Render in the browser',
        items: [
          'Server sends near-empty HTML',
          'Blank screen',
          'JS downloads and executes',
          'First render happens',
          { label: 'Crawlers and slow devices suffer', bad: true },
        ],
      },
      {
        title: 'SSR', tone: 'green', subtitle: 'Render on the server, then hydrate',
        items: [
          'Server runs the app, sends real HTML',
          { label: 'Content visible immediately', good: true },
          'JS downloads',
          'App attaches to EXISTING markup',
          'createSSRApp, not createApp',
        ],
      },
    ],
    note: 'Root cause of every SSR bug: Node has no window/document. onMounted never runs there — that is the client boundary.',
  }),

  'ch10-vue2-to-vue3.svg': () => tree({
    title: 'Almost every breaking change has one of three causes',
    subtitle: 'Knowing the cause makes the change obvious',
    root: { title: 'Vue 2 → Vue 3', tone: 'slate', lines: ['@vue/compat runs both'] },
    children: [
      { title: 'Proxy reactivity', tone: 'green', lines: ['Vue.set / Vue.delete gone', 'Array index + Map/Set work', 'IE11 dropped'], edge: 'causes' },
      { title: 'Per-app globals', tone: 'blue', lines: ['new Vue() → createApp()', 'Vue.use → app.use', 'Multiple apps per page'], edge: 'causes' },
      { title: 'Tree-shaking', tone: 'violet', lines: ['Filters removed', 'Event bus removed', 'Smaller runtime'], edge: 'causes' },
    ],
    aside: { text: 'Also: fragments · Teleport · Suspense · v-model → modelValue · v-if now beats v-for.', tone: 'blue' },
    note: 'Do NOT rewrite working Options API components as part of the migration — that is a separate, optional change.',
  }),

  'ch10-debugging-map.svg': () => grid({
    title: 'Symptom → usual cause → first check',
    subtitle: 'Most Vue bugs fall into a handful of families',
    cols: 2,
    cardH: 116,
    cards: [
      { title: 'UI does not update', tone: 'rose', lines: ['Broken reactivity', 'Destructured? reassigned?', 'mutated the raw object?'] },
      { title: 'Wrong row after a sort', tone: 'rose', lines: ['Missing or index :key', 'Check the v-for key'] },
      { title: 'DOM value is stale', tone: 'amber', lines: ['Async update queue', 'Missing await nextTick()'] },
      { title: 'Re-renders too often', tone: 'amber', lines: ['Over-broad dependencies', 'onRenderTriggered names the key'] },
      { title: 'Template ref is null', tone: 'blue', lines: ['Read before mount', 'Move it into onMounted'] },
      { title: 'Hydration mismatch', tone: 'violet', lines: ['Server and client rendered differently', 'Non-determinism · untransferred state'] },
    ],
    note: 'Log toRaw(state), not the proxy — the console shows getters and evaluates them lazily.',
  }),
};

/* ── Runner ─────────────────────────────────────────────────────────── */

/** Every {{fig:…}} filename referenced by the content modules. */
function referencedFigures() {
  const figs = new Set();
  for (const f of fs.readdirSync(CONTENT_DIR).filter((n) => /^ch\d+.*\.js$/.test(n))) {
    const chapter = require(path.join(CONTENT_DIR, f));
    for (const topic of chapter.topics) {
      for (const m of topic.content.matchAll(/\{\{fig:([^|}]+)\|/g)) figs.add(m[1].trim());
    }
  }
  return figs;
}

function main() {
  const check = process.argv.includes('--check');
  const referenced = referencedFigures();
  const defined = new Set(Object.keys(D));

  const missing = [...referenced].filter((f) => !defined.has(f));
  const unused = [...defined].filter((f) => !referenced.has(f));

  if (missing.length) {
    console.error(`❌ ${missing.length} figure(s) referenced in content with no spec:`);
    missing.forEach((f) => console.error('   - ' + f));
  }
  if (unused.length) {
    console.warn(`⚠️  ${unused.length} spec(s) not referenced by any topic:`);
    unused.forEach((f) => console.warn('   - ' + f));
  }

  if (check) {
    if (missing.length) process.exit(1);
    console.log(`✅ ${referenced.size} figures referenced, all have specs.`);
    return;
  }
  if (missing.length) process.exit(1);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let written = 0;
  for (const [name, build] of Object.entries(D)) {
    fs.writeFileSync(path.join(OUT_DIR, name), build());
    written++;
  }
  console.log(`✅ Wrote ${written} SVG(s) to ${path.relative(process.cwd(), OUT_DIR)}/`);
  console.log('   Next:  node scripts/upload-images.js ./vue-diagrams --apply');
}

main();
