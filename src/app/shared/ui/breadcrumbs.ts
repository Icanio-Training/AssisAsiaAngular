import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  readonly label: string;
  /** Router link; omitted (or ignored) for the last item. */
  readonly path?: string | readonly (string | number)[];
  /** Ellipsis for long last labels (e.g. an activity title). */
  readonly truncate?: boolean;
}

// CONCEPT: reusable presentational component with input() | REACT: components/navigation/Breadcrumbs.tsx | INTERVIEW: "dumb" component — data in via inputs, no services; easy to reuse and test.
@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      aria-label="Breadcrumb"
      class="flex w-full min-w-0 flex-nowrap items-center gap-2 overflow-hidden text-[13px]"
    >
      @for (item of items(); track $index; let last = $last) {
        <span
          class="flex items-center gap-2"
          [class]="last && item.truncate ? 'min-w-0 flex-1 overflow-hidden' : 'shrink-0'"
        >
          @if (item.path && !last) {
            <a
              [routerLink]="item.path"
              class="font-bold text-primary-600 hover:text-primary-700 hover:underline"
            >
              {{ item.label }}
            </a>
          } @else {
            <span
              [class]="
                last
                  ? item.truncate
                    ? 'block min-w-0 truncate text-[#6B7280]'
                    : 'font-bold text-[#1A3A6B]'
                  : 'text-[#5A6B85]'
              "
              [attr.title]="last && item.truncate ? item.label : null"
              [attr.aria-current]="last ? 'page' : null"
            >
              {{ item.label }}
            </span>
          }
          @if (!last) {
            <span aria-hidden="true" class="shrink-0 text-[#B9C3D6]">›</span>
          }
        </span>
      }
    </nav>
  `,
})
export class Breadcrumbs {
  readonly items = input.required<readonly BreadcrumbItem[]>();
}

/** The sticky 44px bar under the header that holds the breadcrumbs (every feature layout uses it). */
@Component({
  selector: 'app-breadcrumb-bar',
  imports: [Breadcrumbs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sticky top-[76px] z-[600] w-full border-b border-[#E2E9F3] bg-white">
      <div
        class="mx-auto flex h-11 max-w-[1320px] min-w-0 items-center gap-[14px] px-8 text-[13px] text-[#5A6B85]"
      >
        <ng-content />
        <app-breadcrumbs class="min-w-0 flex-1" [items]="items()" />
      </div>
    </div>
  `,
})
export class BreadcrumbBar {
  readonly items = input.required<readonly BreadcrumbItem[]>();
}
