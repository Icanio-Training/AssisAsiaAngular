import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** "View All" card under the sector chart — opens the unfiltered Monitoring Matrix. */
@Component({
  selector: 'app-declarations-monitor-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-[0_1px_3px_rgba(15,23,42,.06),0_6px_16px_-8px_rgba(15,23,42,.08)] transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(15,23,42,.08),0_12px_32px_-12px_rgba(15,23,42,.12)]"
    >
      <div>
        <div class="mb-1.5 flex items-center text-[15px] font-bold text-[#1A3A6B]">
          <span class="material-symbols-outlined mr-2 text-[16px] text-[#2C59A7]" aria-hidden="true"
            >grid_on</span
          >
          Monitoring Matrix of the Follow-up Actions to ASCC
        </div>
        <div class="text-[13px] text-[#64748B]">
          View the complete Monitoring Matrix with filters, search, and export —
          <strong>{{ totalRecords() }}</strong> declarations available.
        </div>
      </div>

      <button
        type="button"
        (click)="viewAll.emit()"
        class="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#2C59A7] px-7 py-2 text-sm font-bold whitespace-nowrap text-white transition-colors hover:bg-[#1A3A6B]"
      >
        <span class="material-symbols-outlined text-[16px]" aria-hidden="true">table_rows</span>
        View All
      </button>
    </section>
  `,
})
export class DeclarationsMonitorCta {
  readonly totalRecords = input(0);
  readonly viewAll = output();
}
