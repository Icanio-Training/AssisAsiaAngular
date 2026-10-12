import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Placeholder page (React: data-management/components/ComingSoonPage.tsx — e.g. the Trash Bin).
 * Configure from the route: { path: 'trash', component: ComingSoon, data: { heading: 'Trash Bin' } }
 */
// GOTCHA (withComponentInputBinding): on a ROUTED component the router sets every input from
// route data / params / query params — and sets inputs with no matching key to `undefined`,
// which overrides an input's default value. So routed components read optional inputs and
// apply defaults in computed(), as below.
@Component({
  selector: 'app-coming-soon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-20 text-center">
      <span class="material-symbols-outlined text-[44px] text-primary-600" aria-hidden="true"
        >construction</span
      >
      <h1 class="text-2xl font-bold text-[#141A28]">{{ headingText() }}</h1>
      <p class="text-[#5A6B85]">{{ noteText() }}</p>
    </section>
  `,
})
export class ComingSoon {
  readonly heading = input<string>();
  readonly note = input<string>();

  protected readonly headingText = computed(() => this.heading() ?? 'Coming soon');
  protected readonly noteText = computed(() => this.note() ?? 'This page is being migrated.');
}
