// =============================================================================
// welcome.js — renders the welcome page from data.
// Angular equivalent: features/welcome/welcome-page.ts + layout/header.ts.
// =============================================================================
import { clearSession, getSession } from './auth.js';

const user = getSession();
// Not signed in? Back to login — the Angular `authGuard` does this before the page even loads.
if (!user) window.location.replace('./login.html');

const TOOLS = [
  {
    tag: 'Tool 1',
    title: 'ASCC Initiatives',
    accent: '#2C59A7',
    description: "Sectoral Bodies' work plan activities.",
  },
  {
    tag: 'Tool 2',
    title: 'ASCC Outcome Documents',
    accent: '#58946E',
    description: 'National follow-up actions to declarations.',
  },
  {
    tag: 'Tool 3',
    title: 'ASCC Strategic Plan KPIs',
    accent: '#C73535',
    description: 'Results framework baseline / mid / end targets.',
  },
  {
    tag: 'Admin',
    title: 'Data Management',
    accent: '#6C3694',
    description: 'Upload data, My Data, review and publish.',
    roles: ['contributor', 'content_manager', 'admin'],
  },
];

// ARRAY METHODS: filter() keeps matching items, map() transforms each one.
// Both return NEW arrays — the original TOOLS is never changed (immutability).
const visibleTools = TOOLS.filter((tool) => !tool.roles || tool.roles.includes(user?.role));

const initials = (user?.name ?? '')
  .split(' ')
  .map((part) => part[0])
  .slice(0, 2)
  .join('');

// `this` — in a regular method, `this` is the object before the dot.
const page = {
  greeting: 'Welcome back',
  title() {
    return `${this.greeting}, ${user?.name.split(' ')[0] ?? ''}`; // template literal
  },
};

document.getElementById('welcome-title').textContent = page.title();
document.getElementById('role').textContent = user?.role.replace('_', ' ') ?? '';
document.getElementById('avatar').textContent = initials;

// Build cards with DOM methods (createElement + textContent), NOT innerHTML string
// concatenation — that's how you stay XSS-safe without a framework.
// Angular: @for (tool of tools; track tool.title) { <li>…</li> }
const grid = document.getElementById('tool-grid');
visibleTools.forEach((tool) => {
  const li = document.createElement('li');
  li.className = 'tool-card';
  li.style.setProperty('--accent', tool.accent); // set a CSS variable from JS

  const tag = document.createElement('span');
  tag.className = 'tool-tag';
  tag.textContent = tool.tag;

  const h2 = document.createElement('h2');
  h2.textContent = tool.title;
  h2.title = tool.title; // full text on hover when the ellipsis cuts it off

  const p = document.createElement('p');
  p.className = 'muted';
  p.textContent = tool.description;

  li.append(tag, h2, p);
  grid.append(li);
});

document.getElementById('logout-btn').addEventListener('click', () => {
  clearSession();
  window.location.assign('./login.html');
});

// ---------------------------------------------------------------------------
// EVENT LOOP demo — predict the order, then check the Console:
//   1 sync → 4 sync → 3 microtask (Promise) → 2 macrotask (setTimeout)
// Synchronous code runs first, then ALL microtasks, then the next macrotask.
// ---------------------------------------------------------------------------
console.log('1 sync');
setTimeout(() => console.log('2 macrotask (setTimeout 0)'), 0);
Promise.resolve().then(() => console.log('3 microtask (Promise.then)'));
console.log('4 sync');
