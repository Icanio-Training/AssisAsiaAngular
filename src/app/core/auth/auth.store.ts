import { computed, effect, Injectable, signal } from '@angular/core';

import type { Role, User } from './auth.models';

const STORAGE_KEY = 'auth-storage';

interface PersistedAuth {
  accessToken: string | null;
  user: User | null;
}

function readPersisted(): PersistedAuth {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedAuth;
  } catch {
    // Corrupt or blocked storage — start signed out.
  }
  return { accessToken: null, user: null };
}

// CONCEPT: root-provided service holding state in signals | REACT: Zustand `useAuthStore` (create + persist) | INTERVIEW: one instance app-wide via DI; private writable signals, public read-only views, computed selectors.
// OLD (pre-signals): private user$ = new BehaviorSubject<User | null>(null); readonly user = this.user$.asObservable();
//
//   Zustand create()                 → @Injectable({ providedIn: 'root' })
//   selectors useAuthStore(s => s.x) → computed()
//   persist middleware               → effect() writing to localStorage
//
// TOKEN STORAGE (security trade-off, see M6 in INTERVIEW_GUIDE.md):
//   access token → localStorage (survives reload; readable by XSS — short-lived limits the damage)
//   refresh token → memory only (never persisted; a reload ends the session once the access token expires)
//   Best practice when the backend supports it: refresh token in an HttpOnly, Secure, SameSite cookie.
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly persisted = readPersisted();

  private readonly _accessToken = signal<string | null>(this.persisted.accessToken);
  private readonly _refreshToken = signal<string | null>(null);
  private readonly _user = signal<User | null>(this.persisted.user);

  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly user = this._user.asReadonly();

  readonly isLoggedIn = computed(() => Boolean(this._user() && this._accessToken()));
  readonly role = computed<Role>(() => this._user()?.role ?? 'public');

  constructor() {
    // Re-runs whenever a signal it reads changes — the `persist` middleware.
    effect(() => {
      const snapshot: PersistedAuth = { accessToken: this._accessToken(), user: this._user() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Storage full or blocked — the session still works in memory.
      }
    });
  }

  setSession(tokens: { accessToken: string; refreshToken: string }, user?: User): void {
    this._accessToken.set(tokens.accessToken);
    this._refreshToken.set(tokens.refreshToken);
    if (user) this._user.set(user);
  }

  setUser(user: User): void {
    this._user.set(user);
  }

  clear(): void {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
  }
}
