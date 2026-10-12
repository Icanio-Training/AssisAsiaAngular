// Ported from the React app: utils/listPagination.ts.
// The two list endpoints page DIFFERENTLY — a classic migration trap:
//   activities/details   → request `limit`,    response { pagination: { page, limit, total, totalPages, showingFrom, showingTo } }
//   declarations/filter  → request `pageSize`, response { page, pageSize, totalRecords, totalPages, items } (flat)
// Both are normalised into one MyDataPagination so the table/paginator code is shared.
import type { MyDataPagination, SubmittedListPagination } from '../models/my-data-list-item.models';

export function mapSubmittedListPagination(raw: SubmittedListPagination): MyDataPagination {
  return {
    currentPage: raw.page,
    perPage: raw.limit,
    total: raw.total,
    lastPage: raw.totalPages,
    from: raw.showingFrom,
    to: raw.showingTo,
  };
}

export interface DeclarationFilterPagination {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export function mapDeclarationFilterPagination(raw: DeclarationFilterPagination): MyDataPagination {
  return {
    currentPage: raw.page,
    perPage: raw.pageSize,
    total: raw.totalRecords,
    lastPage: raw.totalPages,
    from: raw.totalRecords === 0 ? 0 : (raw.page - 1) * raw.pageSize + 1,
    to: Math.min(raw.page * raw.pageSize, raw.totalRecords),
  };
}
