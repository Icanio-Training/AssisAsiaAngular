import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatPaginatorModule, type PageEvent } from '@angular/material/paginator';
import { MatSortModule, type Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

import { EmptyState } from '@shared/ui/empty-state';

import { PAGE_SIZE_OPTIONS } from '../constants/outcome-documents.constants';
import type {
  DeclarationListItem,
  DeclarationSortKey,
  SortOrder,
} from '../models/outcome-documents.models';
import { TypeBadge } from './badges';

const SORTABLE: readonly string[] = ['lastUpdateOn', 'title', 'sector', 'type'];

export interface MatrixPageChange {
  readonly page: number;
  readonly pageSize: number;
}

// CONCEPT: mat-table + MatSort + MatPaginator (server-side) | REACT: TanStack Table with manualSorting/manualPagination | INTERVIEW: the table just renders the current page; sort/page events go up to the store, which triggers a new HTTP request.
// Two header rows: row 1 = sortable columns + an "Implementation" cell spanning 3 columns,
// row 2 = the 3 implementation sub-headers. Header-only columns (implGroup, …) never appear in data rows.
@Component({
  selector: 'app-matrix-table',
  imports: [MatTableModule, MatSortModule, MatPaginatorModule, TypeBadge, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-h-[620px] overflow-auto" [class.opacity-60]="refreshing()">
      <table
        mat-table
        [dataSource]="items()"
        matSort
        [matSortActive]="sortBy() ?? ''"
        [matSortDirection]="sortOrder()"
        matSortDisableClear
        (matSortChange)="onSort($event)"
        class="matrix-table w-full min-w-[1100px] text-[13px]"
        aria-label="Monitoring Matrix table"
      >
        <ng-container matColumnDef="lastUpdateOn">
          <th mat-header-cell *matHeaderCellDef mat-sort-header class="w-[11%]">Last Update On</th>
          <td mat-cell *matCellDef="let row">{{ row.lastUpdateOn }}</td>
        </ng-container>

        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef mat-sort-header class="min-w-[260px]">
            Title of Document
          </th>
          <td mat-cell *matCellDef="let row">
            <span class="line-clamp-2 text-xs font-bold text-[#0D1926]" [title]="row.title">{{
              row.title
            }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="sector">
          <th mat-header-cell *matHeaderCellDef mat-sort-header class="w-[15%]">Sector</th>
          <td mat-cell *matCellDef="let row" class="text-xs text-[#374151]">{{ row.sector }}</td>
        </ng-container>

        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef mat-sort-header class="w-[15%]">
            Type of Document
          </th>
          <td mat-cell *matCellDef="let row"><app-type-badge [type]="row.type" /></td>
        </ng-container>

        <ng-container matColumnDef="regionalAseanLevel">
          <th mat-header-cell *matHeaderCellDef class="sub w-[13%]">Regional/ ASEAN Level</th>
          <td mat-cell *matCellDef="let row" class="text-center text-[#374151]">
            {{ row.regionalAseanLevel || '—' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="national">
          <th mat-header-cell *matHeaderCellDef class="sub w-[11%]">National</th>
          <td mat-cell *matCellDef="let row" class="text-center text-[#374151]">
            {{ row.national || '—' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef class="sub w-[11%]">Total</th>
          <td mat-cell *matCellDef="let row" class="text-center font-bold text-[#1A3A6B]">
            {{ row.total || '—' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="view">
          <th mat-header-cell *matHeaderCellDef class="sub w-[56px]"></th>
          <td mat-cell *matCellDef="let row" class="text-center">
            <span
              class="action-btn inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] transition-colors"
            >
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true"
                >arrow_forward</span
              >
            </span>
          </td>
        </ng-container>

        <!-- Header-only columns for the grouped two-row header -->
        <ng-container matColumnDef="implGroup">
          <th mat-header-cell *matHeaderCellDef colspan="3" class="text-center">Implementation</th>
        </ng-container>
        <ng-container matColumnDef="viewGroup">
          <th mat-header-cell *matHeaderCellDef></th>
        </ng-container>
        <ng-container matColumnDef="leadSpacer">
          <th mat-header-cell *matHeaderCellDef colspan="4" class="sub"></th>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="groupHeader; sticky: true"></tr>
        <tr mat-header-row *matHeaderRowDef="subHeader; sticky: true"></tr>
        <tr
          mat-row
          *matRowDef="let row; columns: columns"
          tabindex="0"
          class="matrix-row cursor-pointer"
          (click)="rowClick.emit(row.id)"
          (keydown.enter)="rowClick.emit(row.id)"
        ></tr>

        <tr class="mat-mdc-row" *matNoDataRow>
          <td [attr.colspan]="columns.length" class="px-6 py-12 text-center">
            @if (loading()) {
              <span class="text-[#64748B]">Loading…</span>
            } @else if (error()) {
              <span class="text-asean-red"
                >Could not load declarations. Please try again later.</span
              >
            } @else {
              <app-empty-state
                title="No declarations match current filters"
                description="Try adjusting or clearing your filters."
              />
            }
          </td>
        </tr>
      </table>
    </div>

    <mat-paginator
      class="border-t border-[#E2E8F0]"
      [length]="total()"
      [pageIndex]="page() - 1"
      [pageSize]="pageSize()"
      [pageSizeOptions]="pageSizeOptions"
      showFirstLastButtons
      (page)="onPage($event)"
      aria-label="Select page of declarations"
    />
  `,
  styles: `
    .matrix-table th.mat-mdc-header-cell {
      background: #f8fafc;
      border-bottom: 2px solid #e9ecf2;
      color: #6b7280;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      padding: 14px 16px;
    }
    .matrix-table th.sub {
      background: #f9fafb;
      text-align: center;
    }
    .matrix-table th.mat-sort-header-sorted {
      background: #eef4ff;
      color: #2c59a7;
    }
    .matrix-table td.mat-mdc-cell {
      padding: 16px 18px;
      border-bottom: 1px solid #f0f2f8;
    }
    .matrix-row:nth-child(even) td {
      background: #fafbfd;
    }
    .matrix-row:hover td,
    .matrix-row:focus-visible td {
      background: #eef4ff;
    }
    .matrix-row:hover .action-btn {
      border-color: #2c59a7;
      background: #2c59a7;
      color: #fff;
    }
  `,
})
export class MatrixTable {
  readonly items = input.required<readonly DeclarationListItem[]>();
  /** First load (no rows yet). */
  readonly loading = input(false);
  /** A refetch while the previous page stays visible (React: keepPreviousData). */
  readonly refreshing = input(false);
  readonly error = input(false);
  readonly sortBy = input<DeclarationSortKey | null>(null);
  readonly sortOrder = input<SortOrder>('asc');
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly total = input(0);

  readonly sortChange = output<{ sortBy: DeclarationSortKey; sortOrder: SortOrder }>();
  readonly pageChange = output<MatrixPageChange>();
  readonly rowClick = output<number>();

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly columns = [
    'lastUpdateOn',
    'title',
    'sector',
    'type',
    'regionalAseanLevel',
    'national',
    'total',
    'view',
  ];
  protected readonly groupHeader = [
    'lastUpdateOn',
    'title',
    'sector',
    'type',
    'implGroup',
    'viewGroup',
  ];
  protected readonly subHeader = ['leadSpacer', 'regionalAseanLevel', 'national', 'total', 'view'];

  protected onSort(sort: Sort): void {
    if (!SORTABLE.includes(sort.active) || !sort.direction) return;
    this.sortChange.emit({
      sortBy: sort.active as DeclarationSortKey,
      sortOrder: sort.direction,
    });
  }

  protected onPage(event: PageEvent): void {
    this.pageChange.emit({ page: event.pageIndex + 1, pageSize: event.pageSize });
  }
}
