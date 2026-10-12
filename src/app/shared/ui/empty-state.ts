import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

// CONCEPT: NgOptimizedImage ([ngSrc]) | REACT: plain <img> | INTERVIEW: requires width/height (prevents layout shift), lazy-loads by default, and warns about oversized images in dev.

/** Empty table / list (React: components/ui/EmptyTableState.tsx). */
@Component({
  selector: 'app-empty-state',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center rounded-lg bg-white py-8 text-center">
      <img
        ngSrc="assets/table-empty-state.svg"
        alt=""
        width="118"
        height="103"
        aria-hidden="true"
      />
      <p class="mt-4 text-[14px] leading-none font-bold text-[#101828]">{{ title() }}</p>
      <p class="mt-2 text-[12px] leading-none text-[#A0A0A0]">{{ description() }}</p>
    </div>
  `,
})
export class EmptyState {
  readonly title = input('No records found');
  readonly description = input('Try changing the filters or search.');
}

/** Empty chart (React: components/ui/ChartNoDataState.tsx). */
@Component({
  selector: 'app-chart-no-data',
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center pt-6 pb-8 text-center">
      <img ngSrc="assets/chart-no-data.png" alt="" width="118" height="110" aria-hidden="true" />
      <p class="mt-4 text-sm font-bold text-[#0F172A]">No Data Found !</p>
      <p class="mt-1 text-xs text-[#64748B]">Try changing the filters to see added data.</p>
    </div>
  `,
})
export class ChartNoData {}

/** Centered spinner for page-level loading states. */
@Component({
  selector: 'app-page-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <div
        class="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"
      ></div>
      <span class="sr-only">{{ label() }}</span>
    </div>
  `,
})
export class PageSpinner {
  readonly label = input('Loading…');
}

/** Inline error with a retry button — the "error" state of every data screen. */
@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-3 py-10 text-center" role="alert">
      <span class="material-symbols-outlined text-[40px] text-[#EF3E36]" aria-hidden="true"
        >error</span
      >
      <p class="text-sm font-semibold text-[#141A28]">{{ message() }}</p>
      <ng-content />
    </div>
  `,
})
export class ErrorState {
  readonly message = input("We couldn't load this data.");
}
