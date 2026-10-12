import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { HERO_FALLBACK_DESCRIPTION, HERO_FALLBACK_TITLE } from '../constants/initiatives.constants';
import type { InitiativesSummaryResponse } from '../models/initiatives.models';

function formatStat(value: number | undefined, suffix = ''): string {
  return value === undefined ? '—' : `${value}${suffix}`;
}

/** Dashboard hero: title, description and three headline numbers. */
@Component({
  selector: 'app-initiatives-hero-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-1 flex-col' },
  template: `
    <div
      class="relative isolate flex flex-1 flex-col items-start justify-center overflow-hidden bg-[linear-gradient(215deg,#F6A11E_0%,#E5391F_42%,#9E1C3F_78%,#5A1230_100%)]"
    >
      <div
        aria-hidden="true"
        class="absolute -top-10 right-[8%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]"
      ></div>
      <div
        aria-hidden="true"
        class="absolute -bottom-[60px] left-[5%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(99,172,219,0.18)_0%,transparent_70%)]"
      ></div>

      <!-- Decorative bars + trend line (hidden below lg). -->
      <svg
        viewBox="0 0 360 300"
        aria-hidden="true"
        focusable="false"
        class="absolute top-1/2 right-10 hidden h-[260px] w-[312px] -translate-y-1/2 lg:block xl:right-14"
      >
        <rect x="30" y="230" width="34" height="70" fill="#fff" opacity="0.1" />
        <rect x="80" y="190" width="34" height="110" fill="#fff" opacity="0.14" />
        <rect x="130" y="150" width="34" height="150" fill="#fff" opacity="0.18" />
        <rect x="180" y="110" width="34" height="190" fill="#fff" opacity="0.14" />
        <polyline
          points="47,230 97,175 147,215 197,110 260,145 320,90"
          fill="none"
          stroke="#fff"
          stroke-width="2"
          opacity="0.35"
        />
        @for (p of points; track $index) {
          <circle [attr.cx]="p[0]" [attr.cy]="p[1]" [attr.r]="p[2]" fill="#fff" opacity="0.85" />
        }
      </svg>

      <div class="relative px-16 py-[22px]">
        <div class="max-w-[720px]">
          <h1 class="max-w-[780px] text-left text-[46px] leading-[1.2] font-bold text-white">
            {{ title() }}
          </h1>
          <p class="mt-2.5 max-w-[620px] text-[15.5px] leading-[1.65] text-white/[0.82]">
            {{ description() }}
          </p>
          <div class="mt-4 flex flex-wrap items-start gap-12">
            @for (stat of stats(); track stat.label) {
              <div class="flex flex-col">
                <span class="text-[30px] font-bold text-white">{{ stat.value }}</span>
                <span class="text-[11.5px] font-medium tracking-[0.04em] text-white/65 uppercase">{{
                  stat.label
                }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class InitiativesHeroBanner {
  readonly summary = input<InitiativesSummaryResponse | undefined>();

  protected readonly points = [
    [47, 230, 6],
    [97, 175, 6],
    [147, 215, 6],
    [197, 110, 7],
    [260, 145, 6],
    [320, 90, 6],
  ] as const;

  protected readonly title = computed(() => this.summary()?.title ?? HERO_FALLBACK_TITLE);
  protected readonly description = computed(
    () => this.summary()?.description ?? HERO_FALLBACK_DESCRIPTION,
  );
  protected readonly stats = computed(() => {
    const s = this.summary();
    return [
      { label: 'Total Activities', value: formatStat(s?.totalActivities) },
      { label: 'Completion Rate', value: formatStat(s?.completionRate, '%') },
      { label: 'Implementation Rate', value: formatStat(s?.implementationRate, '%') },
    ];
  });
}

/** "Explore work plan progress" intro strip under the hero. */
@Component({
  selector: 'app-initiatives-explore-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full shrink-0 bg-white">
      <div class="flex flex-col gap-5 px-4 py-8 text-left md:px-16">
        <div class="flex max-w-none flex-col gap-2.5 md:max-w-[640px]">
          <h2 class="text-[23px] leading-[1.3] font-bold tracking-[-0.01em] text-[#0F172A]">
            Explore work plan progress
          </h2>
          <p class="text-[16px] leading-[1.5] text-[#64748B]">
            This section monitors the status of implementation of sectoral work plans, which
            includes its alignment with relevant strategic measures of the ASCC Strategic Plan.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class InitiativesExploreSection {}
