import { HttpParams } from '@angular/common/http';

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | readonly QueryValue[]>;

// CONCEPT: query-string serialization | REACT: axios default paramsSerializer | INTERVIEW: a migration trap — axios sends arrays as `period[]=1&period[]=2`, Angular HttpParams would send `period=1&period=2`; Laravel only reads the first form as an array.
// Every service builds params through this helper so the backend receives exactly what React sent.
//   toHttpParams({ period: [2024, 2025], search: '', page: 1 })
//   → period[]=2024&period[]=2025&page=1          (empty / null / undefined values are dropped)
export function toHttpParams(query: QueryParams = {}): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isPresent(item)) params = params.append(`${key}[]`, String(item)); // HttpParams is immutable: append() returns a NEW object
      }
    } else if (isPresent(value as QueryValue)) {
      params = params.set(key, String(value));
    }
  }
  return params;
}

function isPresent(value: QueryValue): boolean {
  return value !== null && value !== undefined && value !== '';
}
