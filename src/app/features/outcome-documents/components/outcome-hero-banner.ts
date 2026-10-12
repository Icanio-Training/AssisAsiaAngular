import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  HERO_FALLBACK_DESCRIPTION,
  HERO_FALLBACK_TITLE,
} from '../constants/outcome-documents.constants';
import type { OutcomeSummaryResponse } from '../models/outcome-documents.models';

/** Dashboard hero: title/description + 3 stats from `dashboard/banner?group=outcomes`. */
@Component({
  selector: 'app-outcome-hero-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 flex-col' },
  template: `
    <div
      class="relative isolate flex flex-1 flex-col items-start justify-center overflow-hidden bg-[linear-gradient(215deg,#F6A11E_0%,#E5391F_42%,#9E1C3F_78%,#5A1230_100%)]"
    >
      <!-- Decorative network illustration (simplified port of React's HeroIllustration) -->
      <svg
        viewBox="0 0 420 300"
        aria-hidden="true"
        focusable="false"
        class="pointer-events-none absolute top-1/2 right-[-60px] z-0 hidden w-[620px] max-w-[60vw] -translate-y-1/2 opacity-[.38] lg:block"
      >
        <circle
          cx="150"
          cy="150"
          r="122"
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          stroke-dasharray="1 7"
          stroke-linecap="round"
        />
        <circle cx="150" cy="150" r="95" fill="rgba(255,255,255,0.06)" />
        <g fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.4" stroke-linecap="round">
          <path d="M150,150 Q183.5,104.7 186.9,48.5" />
          <path d="M150,150 Q199,105.8 263,89.9" />
          <path d="M150,150 Q206.2,174.1 266.9,166.4" />
          <path d="M150,150 Q204,186.1 234.3,243.6" />
          <path d="M150,150 Q135.9,205.5 153.8,259.9" />
          <path d="M150,150 Q126.3,206.3 77.4,243" />
        </g>
        <g>
          <circle cx="186.9" cy="48.5" r="7" fill="#FFFFFF" />
          <circle cx="263" cy="89.9" r="5.5" fill="#F4C542" />
          <circle cx="266.9" cy="166.4" r="6.5" fill="#FFFFFF" />
          <circle cx="234.3" cy="243.6" r="5" fill="#FFFFFF" />
          <circle cx="153.8" cy="259.9" r="6" fill="#4FCFBB" />
          <circle cx="77.4" cy="243" r="5.5" fill="#FFFFFF" />
        </g>
        <circle
          cx="150"
          cy="150"
          r="27"
          fill="rgba(255,255,255,0.15)"
          stroke="rgba(255,255,255,0.55)"
          stroke-width="1.3"
        />
        <g transform="translate(150,150)" stroke="#FFFFFF" stroke-linecap="round">
          <rect
            x="-9.5"
            y="-12.5"
            width="19"
            height="25"
            rx="3"
            fill="rgba(255,255,255,0.10)"
            stroke-width="1.4"
          />
          <line x1="-4.7" y1="-5.5" x2="4.7" y2="-5.5" stroke-width="1.2" />
          <line x1="-4.7" y1="0.2" x2="4.7" y2="0.2" stroke-width="1.2" />
          <line x1="-4.7" y1="5.9" x2="1.2" y2="5.9" stroke-width="1.2" />
          <circle cx="8.5" cy="10.5" r="6.2" fill="#F4C542" stroke="#14284D" stroke-width="1.1" />
        </g>
      </svg>

      <div class="relative px-16 py-[30px]">
        <div class="max-w-[720px]">
          <h1
            class="relative z-[1] max-w-[720px] text-left text-[46px] leading-[1.15] font-bold tracking-[-0.02em] text-white"
          >
            {{ summary()?.title ?? fallbackTitle }}
          </h1>
          <p class="mt-[18px] max-w-[620px] text-[15.5px] leading-[1.75] text-white/[0.72]">
            {{ summary()?.description ?? fallbackDescription }}
          </p>
          <div class="mt-8 flex flex-wrap items-start gap-7 lg:flex-nowrap lg:gap-[48px]">
            @for (stat of stats(); track stat.label) {
              <div class="flex flex-col">
                <span class="text-[30px] leading-none font-bold tracking-[-0.02em] text-white">
                  {{ stat.value ?? '—' }}
                </span>
                <span
                  class="mt-[6px] text-[11.5px] font-medium tracking-[0.06em] text-white/55 uppercase"
                >
                  {{ stat.label }}
                </span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class OutcomeHeroBanner {
  /** undefined while loading (or on error) → fallback copy and "—" stats. */
  readonly summary = input<OutcomeSummaryResponse | undefined>();

  protected readonly fallbackTitle = HERO_FALLBACK_TITLE;
  protected readonly fallbackDescription = HERO_FALLBACK_DESCRIPTION;

  protected readonly stats = computed(() => {
    const s = this.summary();
    return [
      { label: 'Total follow-up actions', value: s?.followUpCount },
      { label: 'Regional follow-up actions', value: s?.regionalCount },
      { label: 'National follow-up actions', value: s?.nationalCount },
    ];
  });
}
