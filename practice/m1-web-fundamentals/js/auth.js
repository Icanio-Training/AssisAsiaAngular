// =============================================================================
// auth.js — a tiny "service" module shared by both pages.
// In Angular this becomes AuthService + AuthStore (src/app/core/auth/).
// =============================================================================

// ES MODULES: `export` makes a value importable from other files (`import { … } from './auth.js'`).
// Each module has its own scope — nothing leaks onto `window` unless you put it there.

// const = cannot be reassigned (use by default). let = can be reassigned. var = old,
// function-scoped and hoisted — avoid it. See the demo at the bottom of this file.
const SESSION_KEY = 'adme-practice-session';
const FAKE_LATENCY_MS = 600;

/**
 * AJAX with fetch(): loads data/users.json over HTTP, like calling a real API.
 * fetch() returns a PROMISE — a placeholder for a value that arrives later.
 * `async` functions always return a Promise; `await` pauses this function
 * (not the whole page) until the Promise settles.
 */
async function loadUsers() {
  const response = await fetch('./data/users.json');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json(); // JSON text → JavaScript array of objects
}

/** Wraps setTimeout in a Promise so it can be awaited — simulates network delay. */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * "Login API". Resolves with the user (without the password) or REJECTS with an Error.
 * Angular equivalent: AuthService.login() returning an Observable.
 */
export async function login(email, password) {
  const [users] = await Promise.all([loadUsers(), wait(FAKE_LATENCY_MS)]); // run both in parallel

  // ARRAY METHODS: find() returns the first match or undefined.
  const user = users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
  if (!user) throw new Error('Invalid email or password.');

  // Destructuring + rest: copy every field EXCEPT password into `safeUser` (immutable — `user` is untouched).
  const { password: _omit, ...safeUser } = user;
  return safeUser;
}

/**
 * Storage trade-off (a common interview question):
 *   sessionStorage — cleared when the tab closes
 *   localStorage   — survives browser restarts
 * Both are readable by any script on the page, so XSS can steal what's in them (more in M6).
 */
export function saveSession(user, remember) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(user)); // object → JSON string
}

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null; // JSON string → object
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

// ---------------------------------------------------------------------------
// CLOSURE: the inner function "remembers" `attempts` even after createAttemptCounter
// has returned. `attempts` is private — nothing outside can change it directly.
// (Angular services use private class fields for the same purpose.)
// ---------------------------------------------------------------------------
export function createAttemptCounter(max) {
  let attempts = 0;
  return {
    record() {
      attempts += 1;
      return attempts;
    },
    isLocked() {
      return attempts >= max;
    },
  };
}

// ---------------------------------------------------------------------------
// var vs let — run this file and look at the console.
// ---------------------------------------------------------------------------
export function scopeDemo() {
  for (var i = 0; i < 3; i++) setTimeout(() => console.log('var i =', i)); // 3, 3, 3 (one shared i)
  for (let j = 0; j < 3; j++) setTimeout(() => console.log('let j =', j)); // 0, 1, 2 (new j per loop)
}
