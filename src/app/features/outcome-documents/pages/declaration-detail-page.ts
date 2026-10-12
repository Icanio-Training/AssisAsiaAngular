import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ROUTES } from '@core/constants/routes';
import { NotificationService } from '@core/notify/notification.service';
import { RbacService } from '@core/rbac/rbac.service';
import { BreadcrumbBar, type BreadcrumbItem } from '@shared/ui/breadcrumbs';
import { saveBlob } from '@shared/utils/download';

import { LevelBadge, TypeBadge } from '../components/badges';
import { CountryCoverageRow, DetailSection } from '../components/detail-section';
import {
  editDeclarationPath,
  HERO_GRADIENT,
  MATRIX_LABEL,
} from '../constants/outcome-documents.constants';
import type { DeclarationDetail } from '../models/outcome-documents.models';
import { OutcomeDocumentsService } from '../services/outcome-documents.service';
import { firstFilled, idLabel, sdgColor, yearLabel } from '../utils/declaration-labels';

interface InfoCell {
  readonly label: string;
  readonly value: string;
  readonly full?: boolean;
}

/** /outcome-documents/matrix/:id — the declaration's information, coverage sections, CSV export, Print. */
@Component({
  selector: 'app-declaration-detail-page',
  imports: [BreadcrumbBar, RouterLink, TypeBadge, LevelBadge, DetailSection, CountryCoverageRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-[calc(100vh-76px)] flex-col' },
  template: `
    <app-breadcrumb-bar [items]="breadcrumbs()" />

    @if (detail(); as d) {
      <div class="flex flex-1 flex-col">
        <div
          class="flex !h-auto !min-h-[320px] !flex-none flex-col px-[30px] pt-14"
          [style.background]="heroGradient"
        >
          <div class="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
            <a
              [routerLink]="matrixPath"
              class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-white/35 bg-white/15 px-4 text-[13.5px] font-semibold whitespace-nowrap text-white transition-colors hover:bg-white/25 print:hidden"
            >
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
                >arrow_back</span
              >
              Back to Overview Table
            </a>
            @if (d.position.total > 0) {
              <span class="ml-auto text-xs font-medium text-white/55">
                {{ d.position.current }} of {{ d.position.total }}
              </span>
            }
          </div>

          <div
            class="flex flex-wrap items-center justify-between gap-6 px-4 pt-[18px] pb-[22px] sm:px-8"
          >
            <div class="flex min-w-0 flex-1 flex-col gap-2.5">
              <div class="flex flex-wrap gap-2">
                <app-type-badge [type]="d.type" />
                <app-level-badge [level]="d.level" />
              </div>
              <h1
                class="m-0 text-[26px] leading-[1.3] font-extrabold tracking-[-0.02em] text-white"
              >
                {{ d.title }}
              </h1>
            </div>

            @if (canManage()) {
              <div class="flex flex-shrink-0 gap-2.5 print:hidden">
                <button
                  type="button"
                  (click)="exportCsv(d)"
                  [disabled]="exporting()"
                  class="inline-flex items-center gap-[7px] rounded-lg bg-[#C73935] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#a82e2b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
                    >download</span
                  >
                  {{ exporting() ? 'Exporting…' : 'Export' }}
                </button>
                <button
                  type="button"
                  (click)="print()"
                  class="inline-flex items-center gap-[7px] rounded-lg border border-white/35 bg-white/15 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/25"
                >
                  <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
                    >print</span
                  >
                  Print
                </button>
                @if (isAdmin()) {
                  <button
                    type="button"
                    (click)="edit(d.id)"
                    class="inline-flex items-center gap-[7px] rounded-lg border border-white/35 bg-white/15 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/25"
                  >
                    <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
                      >edit</span
                    >
                    Edit
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <div class="flex-1 bg-[#F1F5F9] px-16 pt-10 pb-[72px]">
          <div class="mx-auto grid max-w-[1440px] grid-cols-1 items-start gap-5 md:grid-cols-2">
            <app-detail-section title="Information" icon="description" class="md:col-span-2">
              <div class="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                @for (cell of infoCells(); track cell.label) {
                  <div
                    class="rounded-lg border border-[#E8EFF7] bg-[#F8FAFC] px-4 py-3.5"
                    [class.col-span-full]="cell.full"
                  >
                    <div
                      class="mb-[5px] text-[11px] font-bold tracking-[.06em] text-[#94A3B8] uppercase"
                    >
                      {{ cell.label }}
                    </div>
                    <div class="text-[13px] leading-[1.4] font-semibold text-[#1F2937]">
                      {{ cell.value }}
                    </div>
                  </div>
                }
                <div
                  class="col-span-full rounded-lg border border-[#E8EFF7] bg-[#F8FAFC] px-4 py-3.5"
                >
                  <div
                    class="mb-[5px] text-[11px] font-bold tracking-[.06em] text-[#94A3B8] uppercase"
                  >
                    Link for Declaration
                  </div>
                  <div class="text-[13px] leading-[1.4] font-semibold text-[#1F2937]">
                    @if (d.fileUrl) {
                      <a
                        [href]="d.fileUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1.5 text-[#2C59A7] hover:underline"
                      >
                        <span class="material-symbols-outlined text-[14px]" aria-hidden="true"
                          >open_in_new</span
                        >
                        View Document
                      </a>
                    } @else {
                      —
                    }
                  </div>
                </div>
                <div
                  class="col-span-full rounded-lg border border-[#E8EFF7] bg-[#F8FAFC] px-4 py-3.5"
                >
                  <div
                    class="mb-[5px] text-[11px] font-bold tracking-[.06em] text-[#94A3B8] uppercase"
                  >
                    Remark
                  </div>
                  <div class="text-[13px] leading-[1.4] font-semibold text-[#1F2937]">
                    {{ d.remark || '—' }}
                  </div>
                </div>
              </div>
            </app-detail-section>

            <app-detail-section title="ASEAN Member State Coverage" icon="public">
              @for (country of d.countries; track country.code) {
                <app-country-coverage-row [country]="country" [maxCount]="maxCount()" />
              } @empty {
                <p class="py-2 text-[12.5px] text-[#94A3B8] italic">
                  No country coverage recorded.
                </p>
              }
            </app-detail-section>

            <div class="flex flex-col gap-5">
              <app-detail-section title="Implementing Sectoral Body" icon="account_tree">
                @if (d.sectoralBodies.length === 0) {
                  <p class="py-2 text-[12.5px] text-[#94A3B8] italic">No sectoral body recorded.</p>
                } @else {
                  <div>
                    @for (body of d.sectoralBodies; track body.name) {
                      <span
                        class="mr-1 mb-1 inline-block rounded-full border border-[#C7D7FD] bg-[#EEF4FF] px-3.5 py-1.5 text-xs font-semibold text-[#2C59A7]"
                        >{{ body.name }}</span
                      >
                    }
                  </div>
                  <div class="mt-2 text-xs text-[#64748B]">
                    Sector: <strong class="text-[#1F2937]">{{ d.sector }}</strong>
                  </div>
                }
              </app-detail-section>

              <app-detail-section title="Sustainable Development Goals" icon="eco">
                @for (tag of d.sdgs; track tag) {
                  <span
                    class="mr-1 mb-1 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold text-white"
                    [style.background-color]="sdgColor(tag)"
                    >{{ tag }}</span
                  >
                } @empty {
                  <p class="py-2 text-[12.5px] text-[#94A3B8] italic">No SDGs recorded.</p>
                }
              </app-detail-section>

              <app-detail-section
                title="Regional / ASEAN Level Actions"
                icon="format_list_bulleted"
              >
                @for (action of d.regionalActions; track $index) {
                  <div
                    class="border-b border-[#F1F5F9] py-[9px] text-xs leading-[1.55] break-words text-[#374151] last:border-b-0"
                  >
                    {{ action }}
                  </div>
                } @empty {
                  <p class="py-2 text-[12.5px] text-[#94A3B8] italic">
                    No regional-level actions recorded.
                  </p>
                }
              </app-detail-section>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="flex-1 bg-[#F1F5F9] px-4 py-16 text-center" role="alert">
        <p class="font-semibold text-[#374151]">Could not load this declaration.</p>
        <a
          [routerLink]="matrixPath"
          class="mt-3 inline-block text-sm font-semibold text-primary-600 hover:underline"
          >← Back to Overview Table</a
        >
      </div>
    }
  `,
})
export class DeclarationDetailPage {
  private readonly api = inject(OutcomeDocumentsService);
  private readonly router = inject(Router);
  private readonly rbac = inject(RbacService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  /** Route param `:id` (bound by withComponentInputBinding; the resolver already loaded it). */
  readonly id = input.required<string>();
  /** Resolved by `declarationDetailResolver` (route `resolve: { declaration }`); null = failed. */
  readonly declaration = input<DeclarationDetail | null>();

  protected readonly detail = computed(() => this.declaration() ?? null);
  protected readonly matrixPath = ROUTES.OUTCOME_DOCUMENTS_MATRIX;
  protected readonly heroGradient = HERO_GRADIENT;
  protected readonly sdgColor = sdgColor;

  protected readonly canManage = computed(() =>
    ['contributor', 'content_manager', 'admin'].includes(this.rbac.role()),
  );
  /** Edit is admin-only — contributor/content_manager can view and export. */
  protected readonly isAdmin = computed(() => this.rbac.role() === 'admin');
  protected readonly exporting = signal(false);

  protected readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: 'Home', path: '/' },
    { label: 'ASCC Outcome Documents', path: ROUTES.OUTCOME_DOCUMENTS },
    { label: MATRIX_LABEL, path: ROUTES.OUTCOME_DOCUMENTS_MATRIX },
    { label: this.detail()?.title ?? 'Declaration Detail', truncate: true },
  ]);

  protected readonly infoCells = computed<InfoCell[]>(() => {
    const d = this.detail();
    if (!d) return [];
    return [
      { label: idLabel(d.type), value: `#${d.declarationNo}` },
      { label: yearLabel(d.type), value: String(d.year) },
      { label: 'Adoption', value: d.adoption || '—' },
      { label: 'Adopting Body Chair', value: d.chair || '—' },
      // The Tool 2 form's field first; `summit` is only a fallback.
      {
        label: 'Sectoral Bodies / Entity',
        value: firstFilled(d.sectoralBodyEntity, d.summit),
        full: true,
      },
      { label: 'Sector', value: d.sector },
      { label: 'Status', value: firstFilled(d.status) },
      { label: 'Type of Document', value: firstFilled(d.type, d.typeofDocument) },
      { label: 'Available to Public', value: d.availableToPublic ? 'Yes' : 'No' },
    ];
  });

  protected readonly maxCount = computed(() =>
    Math.max(...(this.detail()?.countries ?? []).map((c) => c.count), 1),
  );

  protected exportCsv(detail: DeclarationDetail): void {
    this.exporting.set(true);
    this.api
      .exportDeclaration(detail.id)
      .pipe(
        finalize(() => this.exporting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (blob) => saveBlob(blob, `Declaration_${detail.declarationNo}.csv`),
        error: () => this.notify.error('Could not export this declaration. Please try again.'),
      });
  }

  protected print(): void {
    window.print();
  }

  protected edit(id: number): void {
    void this.router.navigateByUrl(editDeclarationPath(id));
  }
}
