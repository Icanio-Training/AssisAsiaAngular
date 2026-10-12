import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

// CONCEPT: custom ATTRIBUTE directive with @HostListener | REACT: a useClickOutside(ref, cb) hook with document.addEventListener | INTERVIEW: an attribute directive adds behaviour to an existing element; @HostListener subscribes to events (even on `document`) and Angular removes the listener automatically when the element is destroyed.
// Modern alternative to @HostListener: `host: { '(document:click)': 'onDocumentClick($event)' }` in the decorator.
//
// Usage: <div class="dropdown" (appClickOutside)="close()">…</div>
@Directive({ selector: '[appClickOutside]' })
export class ClickOutsideDirective {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly appClickOutside = output<MouseEvent>();

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.appClickOutside.emit(event);
    }
  }
}
