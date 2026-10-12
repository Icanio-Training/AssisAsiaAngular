// =============================================================================
// login.js — DOM + events + async flow for login.html.
// Angular equivalent: features/auth/components/login-form.ts (+ .html).
// =============================================================================
import { createAttemptCounter, getSession, login, saveSession, scopeDemo } from './auth.js';

// Already signed in? Skip the form — the Angular `guestOnlyGuard` does this.
if (getSession()) window.location.replace('./welcome.html');

// DOM METHODS: grab elements once. (In Angular we never do this — the template
// binds to the class instead, e.g. formControlName / [disabled] / {{ error }}.)
const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberInput = document.getElementById('remember');
const errorEl = document.getElementById('form-error');
const submitBtn = document.getElementById('submit-btn');

const attempts = createAttemptCounter(5);

/** Returns the first validation message, or null. Angular: Validators.required / Validators.email. */
function validate() {
  if (!emailInput.validity.valid) return 'Please enter a valid email address';
  if (passwordInput.validity.valueMissing) return 'Password is required';
  if (passwordInput.validity.tooShort) return 'Password must be at least 6 characters';
  return null;
}

function showError(message) {
  // innerText vs textContent vs innerHTML:
  //   textContent — sets plain text (safe, fast)                 ← use this for user/server text
  //   innerText   — like textContent but layout-aware (slower)
  //   innerHTML   — parses HTML → XSS risk if the text came from a user or an API
  errorEl.textContent = message ?? '';
  emailInput.setAttribute('aria-invalid', String(message !== null && !emailInput.validity.valid));
}

function setPending(isPending) {
  submitBtn.disabled = isPending;
  submitBtn.textContent = isPending ? 'Signing In…' : 'Sign In';
}

// EVENTS: addEventListener(type, handler). Angular: (ngSubmit)="onSubmit()".
form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the browser's default full-page form POST

  const validationError = validate();
  showError(validationError);
  if (validationError) return;

  if (attempts.isLocked()) {
    showError('Too many attempts. Please try again later.');
    return;
  }

  setPending(true);
  try {
    const user = await login(emailInput.value, passwordInput.value);
    saveSession(user, rememberInput.checked);
    window.location.assign('./welcome.html'); // Angular: router.navigateByUrl('/initiatives')
  } catch (error) {
    attempts.record();
    showError(error instanceof Error ? error.message : 'Something went wrong.');
  } finally {
    setPending(false); // runs on success AND failure — like RxJS finalize()
  }
});

// Clear the message as soon as the user edits a field.
form.addEventListener('input', () => showError(null));

// Open DevTools → Console to see why `let` is preferred over `var`.
scopeDemo();
