import {
  afterRenderEffect,
  Component,
  type ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import type { StrategicGoalObjective } from '../models/blueprint-kpi.models';
import { StrategicMeasureCard } from './strategic-measure-card';

// Ported from React: ObjectiveGroup in components/StrategicGoalPanel.tsx
@Component({
  selector: 'app-objective-group',
  imports: [StrategicMeasureCard],
  template: `
    <div
      #group
      [attr.data-objective-id]="objective().id"
      class="rounded-xl border border-[#ECEFF7] p-[18px] transition-[box-shadow,background-color] duration-[250ms] ease-out hover:shadow-scd-xs"
      [class]="isHighlighted() ? 'bg-[#EEF3FC]' : 'bg-[#F6F8FC]'"
    >
      <div
        class="mb-3.5 px-0.5 text-[11px] leading-[normal] font-bold tracking-[0.03em] text-[#2C59A7] uppercase"
      >
        {{ objective().code }} — {{ objective().description }}
      </div>
      <div class="flex flex-col gap-2.5">
        @for (measure of objective().strategicMeasures; track measure.id) {
          <app-strategic-measure-card
            [measure]="measure"
            [selectedKpiId]="selectedKpiId()"
            (selectKpi)="selectKpi.emit($event)"
          />
        }
      </div>
    </div>
  `,
})
export class ObjectiveGroup {
  readonly objective = input.required<StrategicGoalObjective>();
  readonly isHighlighted = input(false);
  readonly selectedKpiId = input<number | null>(null);
  readonly selectKpi = output<number>();

  // CONCEPT: viewChild() signal query | REACT: useRef<HTMLDivElement>() | INTERVIEW: a typed handle to a template element — no document.querySelector.
  // OLD: @ViewChild('group') group!: ElementRef<HTMLElement>;
  private readonly group = viewChild.required<ElementRef<HTMLElement>>('group');

  constructor() {
    // CONCEPT: afterRenderEffect (DOM work after Angular rendered) | REACT: useEffect(() => ref.current?.scrollIntoView(), [isHighlighted]) | INTERVIEW: a plain effect() may run before the view exists; afterRenderEffect runs once the DOM is up to date — the right place for measuring/scrolling.
    // Blueprint closeDetailView(): centre the objective the user came back to.
    afterRenderEffect(() => {
      if (this.isHighlighted()) {
        this.group().nativeElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    });
  }
}
