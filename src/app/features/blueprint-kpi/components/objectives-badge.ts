import {
  type ConnectedPosition,
  createCloseScrollStrategy,
  OverlayModule,
} from '@angular/cdk/overlay';
import { Component, computed, inject, Injector, input, signal } from '@angular/core';

import { ARIAL_MEDIUM } from '../constants/strategic-goal-cards';

/* Below the badge by default; beside it (right, then left) when there's no room
   below — never above, so the card title is never covered. */
const TOOLTIP_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
  { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 8 },
  { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -8 },
];

// Ported from React: the ObjectivesBadge inside components/StrategicGoalCard.tsx.
// CONCEPT: CDK Overlay (cdkConnectedOverlay) | REACT: createPortal(tooltip, document.body) + getBoundingClientRect maths + scroll/resize listeners | INTERVIEW: the CDK renders the template in a body-level container, positions it against the origin with fallback positions, keeps it inside the viewport, and a scroll strategy decides what happens on scroll (here: close).
@Component({
  selector: 'app-objectives-badge',
  imports: [OverlayModule],
  template: `
    <div
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      tabindex="0"
      [attr.aria-describedby]="hasTooltip() ? tooltipId() : null"
      (mouseenter)="open()"
      (mouseleave)="close()"
      (focus)="open()"
      (blur)="close()"
      (click)="onClick($event)"
      (keydown.escape)="close()"
      class="relative inline-flex cursor-default items-center gap-1.5 rounded-full bg-black/[0.34] py-[3px] pr-2.5 pl-[3px] text-[11px] leading-[normal] font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      <span
        class="inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-[#079455] text-[10px] font-bold text-white"
      >
        {{ count() }}
      </span>
      {{ label() }}
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="isOpen() && hasTooltip()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayScrollStrategy]="scrollStrategy"
      [cdkConnectedOverlayViewportMargin]="12"
      (detach)="close()"
    >
      <div
        [id]="tooltipId()"
        role="tooltip"
        class="max-h-[210px] max-w-[232px] min-w-[188px] overflow-y-auto rounded-xl border border-[#ECEFF7] bg-white px-3 py-2.5 shadow-scd-sm"
      >
        <div
          class="mb-1.5 text-[10px] leading-[normal] font-bold tracking-[0.07em] text-[#94A0B8] uppercase"
        >
          {{ label() }}
        </div>
        <ul class="flex flex-col gap-1.5">
          @for (name of names(); track name) {
            <li class="flex items-start gap-1.5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                class="mt-[3px] h-[11px] w-[11px] shrink-0 text-[#079455]"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span class="text-[11.5px] leading-[1.4] text-[#10192B]" [class]="arialMedium">{{
                name
              }}</span>
            </li>
          }
        </ul>
      </div>
    </ng-template>
  `,
})
export class ObjectivesBadge {
  readonly tooltipId = input.required<string>();
  readonly count = input.required<number>();
  readonly names = input<readonly string[]>([]);

  protected readonly isOpen = signal(false);
  protected readonly label = computed(() => (this.count() === 1 ? 'Objective' : 'Objectives'));
  protected readonly hasTooltip = computed(() => this.names().length > 0);
  protected readonly positions = TOOLTIP_POSITIONS;
  protected readonly arialMedium = ARIAL_MEDIUM;
  // The tooltip doesn't follow the page — close it on scroll (React: window 'scroll' listener).
  protected readonly scrollStrategy = createCloseScrollStrategy(inject(Injector));

  protected open(): void {
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  /** Never a trigger for the card link. Opening on click gives touch devices a way in. */
  protected onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.open();
  }
}
