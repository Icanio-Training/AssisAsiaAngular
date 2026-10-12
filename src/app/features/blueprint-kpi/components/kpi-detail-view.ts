import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, exhaustMap, finalize, Subject, tap } from 'rxjs';

import { NotificationService } from '@core/notify/notification.service';
import { CanDirective } from '@core/rbac/can.directive';
import { apiErrorMessage, blobErrorMessage, saveBlob } from '@shared/utils/download';

import {
  ARIAL_MEDIUM,
  goalAccentStyle,
  hasValue,
  NO_DATA,
} from '../constants/strategic-goal-cards';
import { BlueprintKpiService } from '../services/blueprint-kpi.service';
import {
  buildUpdateBody,
  type Draft,
  draftFrom,
  EMPTY_DRAFT,
  EMPTY_ENTRIES,
  META_FIELDS,
  type MetaField,
  type NewEntries,
} from '../utils/deep-analysis';
import { KpiDocumentation } from './kpi-documentation';

const BUTTON =
  'inline-flex h-9 cursor-pointer items-center gap-[7px] rounded-lg px-[22px] text-[13.5px] leading-[normal] font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform,filter] duration-[120ms] hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0';

// Ported from React: components/KpiDetailView.tsx
@Component({
  selector: 'app-kpi-detail-view',
  imports: [CanDirective, KpiDocumentation],
  // CONCEPT: host listener in the `host` object | REACT: useEffect(() => document.addEventListener('keydown', …)) + cleanup | INTERVIEW: Angular adds and removes the document listener with the component — no manual cleanup.
  // OLD: @HostListener('document:keydown.escape') onEscape() { … }
  host: { class: 'block min-w-0', '(document:keydown.escape)': 'onEscape()' },
  template: `
    <div [style]="accentStyle()" class="min-w-0">
      <div class="mb-[22px] flex items-center justify-between gap-3">
        <button
          type="button"
          (click)="closed.emit()"
          aria-label="Close KPI details"
          class="inline-flex cursor-pointer items-center gap-[7px] rounded-[10px] border border-transparent py-2.5 pr-3.5 pl-2.5 text-[13px] leading-[normal] font-semibold text-[#51607A] transition-colors hover:border-[#E3E8F2] hover:bg-[#F6F8FC] hover:text-[#10192B]"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
            class="h-[13px] w-[13px]"
          >
            <path d="M4 4l8 8M12 4l-8 8" stroke-linecap="round" />
          </svg>
          Close
        </button>
        @if (record()) {
          <div class="flex items-center gap-3">
            <ng-container *appCan="'blueprint-kpi:edit'">
              @if (isEditing()) {
                <button
                  type="button"
                  (click)="save$.next()"
                  [disabled]="isSaving()"
                  [class]="
                    buttonClass +
                    ' border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-on-fill)]'
                  "
                >
                  {{ isSaving() ? 'Saving…' : 'Save' }}
                </button>
              } @else {
                <button
                  type="button"
                  (click)="startEditing()"
                  [disabled]="isRefetching()"
                  [class]="
                    buttonClass +
                    ' border border-[#E3E8F2] bg-white text-[#10192B] hover:border-[var(--accent)]'
                  "
                >
                  {{ isRefetching() ? 'Loading…' : 'Edit' }}
                </button>
              }
            </ng-container>
            <button
              type="button"
              (click)="download()"
              [disabled]="isDownloading()"
              [class]="
                buttonClass +
                ' border border-transparent bg-[var(--accent)] text-[var(--accent-on-fill)] shadow-scd-xs hover:brightness-[1.08]'
              "
            >
              {{ isDownloading() ? 'Downloading…' : 'Download' }}
            </button>
          </div>
        }
      </div>

      @if (record(); as record) {
        <div class="mb-7">
          <div
            class="mb-1.5 text-[11px] leading-[normal] font-bold tracking-[0.07em] text-[#2C59A7] uppercase"
          >
            SM KPI Code
          </div>
          <div class="text-[28px] leading-[normal] font-bold tracking-[-0.01em] text-[#10192B]">
            {{ record.kpiCode ?? noData }}
          </div>
          <div
            class="mt-3.5 mb-1.5 text-[11px] leading-[normal] font-bold tracking-[0.07em] text-[#2C59A7] uppercase"
          >
            SM KPI Name
          </div>
          <p
            class="mt-1 max-w-[560px] text-[14px] leading-[1.7] text-[#51607A]"
            [class]="arialMedium"
          >
            {{ record.kpiName ?? noData }}
          </p>
        </div>

        <div
          class="rounded-xl border border-[#ECEFF7] bg-white px-5 py-6 shadow-scd-sm transition-shadow duration-200 hover:shadow-scd-md md:px-8 md:py-[30px]"
        >
          <div class="mb-6">
            <div class="mb-4">
              <h3 class="text-[17px] leading-[normal] font-bold tracking-[-0.008em] text-[#10192B]">
                Key Metadata
              </h3>
              <p class="mt-0.5 text-[11.5px] leading-[normal] text-[#94A0B8]">
                Executive summary of this indicator's reporting profile
              </p>
            </div>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
              @for (meta of metaFields; track meta.field) {
                <div
                  class="rounded-xl border border-l-[3px] border-[#ECEFF7] border-l-[var(--accent)] bg-[#F6F8FC] p-5 transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#E3E8F2] hover:border-l-[var(--accent)] hover:shadow-scd-sm"
                >
                  <div
                    class="mb-1.5 text-[11px] leading-[normal] font-bold tracking-[0.06em] text-[#94A0B8] uppercase"
                  >
                    {{ meta.label }}
                  </div>
                  @if (isEditing()) {
                    <textarea
                      #box
                      [attr.aria-label]="meta.label"
                      [value]="draft()[meta.field]"
                      (input)="setMeta(meta.field, box.value)"
                      class="block w-full resize-y rounded-lg border border-dashed border-[var(--accent)] bg-white px-2.5 py-1.5 text-[15px] leading-[1.5] font-bold text-[#10192B] [field-sizing:content] focus:border-solid focus:outline-none"
                    ></textarea>
                  } @else if (hasText(record[meta.field])) {
                    <div
                      class="text-[15px] leading-[1.5] font-bold whitespace-pre-line text-[#10192B]"
                    >
                      {{ record[meta.field] }}
                    </div>
                  } @else {
                    <div class="text-[15px] leading-[1.5] font-medium text-[#94A0B8] italic">
                      {{ noData }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div>
            <div class="mb-4">
              <h3 class="text-[17px] leading-[normal] font-bold tracking-[-0.008em] text-[#10192B]">
                Documentation
              </h3>
              <p class="mt-0.5 text-[11.5px] leading-[normal] text-[#94A0B8]">
                Click a panel to expand the full text
              </p>
            </div>
            <app-kpi-documentation
              [record]="record"
              [isEditing]="isEditing()"
              [(draft)]="draft"
              [(newEntries)]="newEntries"
            />
          </div>
        </div>
      } @else {
        <div
          class="rounded-xl border border-[#ECEFF7] bg-white px-8 py-16 text-center text-[14px] text-[#5A6B85] shadow-scd-sm"
          role="status"
        >
          {{
            resource.isLoading()
              ? 'Loading SM KPI…'
              : resource.error()
                ? 'SM KPI details not found.'
                : ''
          }}
        </div>
      }
    </div>
  `,
})
export class KpiDetailView {
  private readonly service = inject(BlueprintKpiService);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly deepAnalysisId = input.required<number>();
  readonly goalCode = input.required<string>();
  readonly closed = output<void>();

  protected readonly resource = rxResource({
    params: () => this.deepAnalysisId(),
    stream: ({ params: id }) => this.service.getDeepAnalysis(id),
  });
  protected readonly record = computed(() =>
    this.resource.hasValue() ? this.resource.value() : undefined,
  );

  // Edit state belongs to ONE KPI: switching KPI resets it (React remounted with key={id}).
  protected readonly isEditing = linkedSignal(() => {
    this.deepAnalysisId();
    return false;
  });
  protected readonly draft = signal<Draft>(EMPTY_DRAFT);
  protected readonly newEntries = signal<NewEntries>(EMPTY_ENTRIES);
  protected readonly isRefetching = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isDownloading = signal(false);

  protected readonly accentStyle = computed(() => goalAccentStyle(this.goalCode()));
  protected readonly buttonClass = BUTTON;
  protected readonly arialMedium = ARIAL_MEDIUM;
  protected readonly noData = NO_DATA;
  protected readonly metaFields = META_FIELDS;
  protected readonly hasText = hasValue;

  /** Save clicks. */
  protected readonly save$ = new Subject<void>();

  constructor() {
    // CONCEPT: exhaustMap | REACT: useMutation + disabled={isPending} | INTERVIEW: while a save is in flight, extra clicks are IGNORED (switchMap would cancel the running PUT, concatMap would queue duplicates, mergeMap would run them in parallel).
    this.save$
      .pipe(
        exhaustMap(() => {
          const record = this.record();
          if (!record || !this.isEditing()) return EMPTY;
          this.isSaving.set(true);
          const body = buildUpdateBody(record, this.draft(), this.newEntries());
          // PUT by the STRATEGIC MEASURE id (the GET used the deep-analysis id).
          return this.service.updateDeepAnalysis(record.strategicMeasure.id, body).pipe(
            tap((updated) => {
              this.resource.set(updated); // immutable replace — the service cache was updated too
              this.isEditing.set(false);
              this.newEntries.set(EMPTY_ENTRIES);
              this.notify.success('SM KPI saved.');
            }),
            // catchError INSIDE exhaustMap: an error must not kill the outer save$ stream.
            catchError((error: unknown) => {
              this.notify.error(apiErrorMessage(error, 'Could not save this SM KPI.'));
              return EMPTY;
            }),
            finalize(() => this.isSaving.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  /** Escape closes the view — except mid-edit, where it would silently drop changes. */
  protected onEscape(): void {
    if (!this.isEditing()) this.closed.emit();
  }

  /** Edit re-runs the GET so the form starts from the latest server copy. */
  protected startEditing(): void {
    this.isRefetching.set(true);
    this.service
      .getDeepAnalysis(this.deepAnalysisId(), { refresh: true })
      .pipe(
        finalize(() => this.isRefetching.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (fresh) => {
          this.resource.set(fresh);
          this.draft.set(draftFrom(fresh));
          this.newEntries.set(EMPTY_ENTRIES);
          this.isEditing.set(true);
        },
        error: () => this.notify.error('Could not load the latest version of this SM KPI.'),
      });
  }

  protected setMeta(field: MetaField, value: string): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  protected download(): void {
    const record = this.record();
    if (!record) return;
    this.isDownloading.set(true);
    this.service
      .downloadStrategicMeasurePdf(record.strategicMeasure.id, record.strategicMeasure.code)
      .pipe(
        // CONCEPT: finalize | REACT: try { … } finally { setIsDownloading(false) } | INTERVIEW: runs on success, error AND unsubscribe.
        finalize(() => this.isDownloading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ blob, filename }) => saveBlob(blob, filename),
        // A blob request's JSON error ("No deep analysis recorded …") arrives as a Blob.
        error: (error: unknown) =>
          void blobErrorMessage(error, 'Could not download the PDF.').then((message) =>
            this.notify.error(message),
          ),
      });
  }
}
