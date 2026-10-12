import { computed, inject, Injectable, type Signal } from '@angular/core';

import { AuthStore } from '@core/auth/auth.store';

import { type Capability, ROLE_CAPABILITIES } from './capabilities';

// CONCEPT: derived permission state | REACT: useRole() + useCan(capability) hooks | INTERVIEW: permissions are computed from the role signal, so every `can()` check updates automatically when the user changes.
@Injectable({ providedIn: 'root' })
export class RbacService {
  private readonly auth = inject(AuthStore);

  readonly role = this.auth.role;
  private readonly capabilities = computed(() => new Set(ROLE_CAPABILITIES[this.auth.role()]));

  /** Snapshot check — for guards and event handlers. */
  can(capability: Capability): boolean {
    return this.capabilities().has(capability);
  }

  /** Reactive check — for templates / computed(). */
  canSignal(capability: Capability): Signal<boolean> {
    return computed(() => this.capabilities().has(capability));
  }
}
