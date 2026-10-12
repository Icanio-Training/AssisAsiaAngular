import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { EXPLORE_DESCRIPTION, EXPLORE_TITLE, hasValue } from '../constants/strategic-goal-cards';
import { BlueprintKpiService } from '../services/blueprint-kpi.service';

/* Ported from React: components/BlueprintKpiExploreSection.tsx.
   The description comes from GET /dashboard/banner?group=kpi (cached — the hero shares the
   same request); the default copy stands in while it loads or while it is empty. */
@Component({
  selector: 'app-blueprint-kpi-explore-section',
  template: `
    <div class="w-full shrink-0 bg-white">
      <div class="flex w-full flex-col gap-5 px-4 py-8 text-left md:px-16">
        <div class="flex max-w-none flex-col gap-2.5 md:max-w-[640px]">
          <h2 class="text-[23px] leading-[1.3] font-bold tracking-[-0.01em] text-[#0F172A]">
            {{ title }}
          </h2>
          <p class="text-[16px] leading-[1.5] text-[#64748B]">{{ description() }}</p>
        </div>
      </div>
    </div>
  `,
})
export class BlueprintKpiExploreSection {
  private readonly service = inject(BlueprintKpiService);
  private readonly banner = rxResource({ stream: () => this.service.banner$ });

  protected readonly title = EXPLORE_TITLE;
  protected readonly description = computed(() => {
    const text = this.banner.hasValue() ? this.banner.value().description : undefined;
    return hasValue(text) ? text : EXPLORE_DESCRIPTION;
  });
}
