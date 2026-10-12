import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';

import type { Capability } from './capabilities';
import { RbacService } from './rbac.service';

// CONCEPT: custom STRUCTURAL directive (adds/removes DOM) | REACT: <RequireCapability capability="x">…</RequireCapability> | INTERVIEW: a structural directive gets a TemplateRef (the "what") and a ViewContainerRef (the "where") and decides whether to stamp the template.
// Usage:  <button *appCan="'initiatives:edit-any'">Edit</button>
//         <a *appCan="'data-management:review'; else noAccess">Review</a>
// (`@if (rbac.can('x'))` works too — the directive just reads nicer and is reusable.)
@Directive({ selector: '[appCan]' })
export class CanDirective {
  private readonly rbac = inject(RbacService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly appCan = input.required<Capability>();
  readonly appCanElse = input<TemplateRef<unknown> | null>(null);

  constructor() {
    // effect(): re-render whenever the capability input OR the user's role changes.
    effect(() => {
      // can() reads the role signal internally, so this effect also re-runs on role changes.
      const allowed = this.rbac.can(this.appCan());
      this.viewContainer.clear();
      if (allowed) {
        this.viewContainer.createEmbeddedView(this.template);
      } else {
        const fallback = this.appCanElse();
        if (fallback) this.viewContainer.createEmbeddedView(fallback);
      }
    });
  }
}
