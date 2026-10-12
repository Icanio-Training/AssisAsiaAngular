import { inject } from '@angular/core';
import type { CanDeactivateFn } from '@angular/router';

import { ConfirmService } from '@shared/ui/confirm-dialog';

/** Implemented by any page with a form that can be left half-filled. */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

// CONCEPT: canDeactivate guard | REACT: none in the React app (Tool 3 asked "Discard changes?" only on its own Back button) | INTERVIEW: canDeactivate runs when LEAVING a route — perfect for "you have unsaved changes"; it covers back button, links and typed URLs, not just one button.
// Usage in routes: { path: 'upload/:tool', component: EnterDataWizardPage, canDeactivate: [unsavedChangesGuard] }
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) return true;
  return inject(ConfirmService).ask({
    title: 'Discard changes?',
    message: 'You have unsaved changes. If you leave this page they will be lost.',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
    destructive: true,
  });
};
