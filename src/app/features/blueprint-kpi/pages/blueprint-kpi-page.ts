import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { BlueprintKpiExploreSection } from '../components/blueprint-kpi-explore-section';
import { BlueprintKpiHeroBanner } from '../components/blueprint-kpi-hero-banner';
import { StrategicGoalGrid } from '../components/strategic-goal-grid';
import { BlueprintKpiService } from '../services/blueprint-kpi.service';

// Ported from React: components/BlueprintKpiPage.tsx (route /blueprint-kpi).
@Component({
  selector: 'app-blueprint-kpi-page',
  imports: [BlueprintKpiExploreSection, BlueprintKpiHeroBanner, StrategicGoalGrid],
  host: { class: 'flex flex-1 flex-col' },
  template: `
    <div class="blueprint-kpi-page flex flex-1 flex-col bg-[#F4F6FA] pb-14">
      <!-- Nav (76px) + breadcrumb (44px) + hero + explore fill exactly one viewport. -->
      <div class="flex min-h-[calc(100vh-120px)] flex-col">
        <app-blueprint-kpi-hero-banner />
        <div class="flex shrink-0 snap-end snap-always flex-col">
          <app-blueprint-kpi-explore-section />
        </div>
      </div>
      <app-strategic-goal-grid [goals]="goals()" />
    </div>
  `,
})
export class BlueprintKpiPage {
  private readonly service = inject(BlueprintKpiService);
  // Same cached request as the hero's goal count (shareReplay in the service).
  private readonly goalsResource = rxResource({ stream: () => this.service.strategicGoals$ });
  protected readonly goals = computed(() =>
    this.goalsResource.hasValue() ? this.goalsResource.value() : [],
  );
}
