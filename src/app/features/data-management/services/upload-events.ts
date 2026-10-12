import { type HttpEvent, HttpEventType, type HttpResponse } from '@angular/common/http';
import { filter, map, type Observable, type OperatorFunction } from 'rxjs';

/** What an upload stream emits: progress ticks, then exactly one `done`. */
export type UploadEvent<T> = { kind: 'progress'; percent: number } | { kind: 'done'; result: T };

// CONCEPT: HttpClient upload progress | REACT: axios `onUploadProgress` callback | INTERVIEW: `{ reportProgress: true, observe: 'events' }` turns the response into a stream of HttpEvents — UploadProgress (loaded/total) … then Response.
/** Maps raw HttpEvents to UploadEvents, transforming the final body with `mapBody`. */
export function toUploadEvents<TRaw, T>(
  mapBody: (raw: TRaw) => T,
): OperatorFunction<HttpEvent<TRaw>, UploadEvent<T>> {
  return (source: Observable<HttpEvent<TRaw>>) =>
    source.pipe(
      // CONCEPT: filter | INTERVIEW: drop events we don't care about (Sent, DownloadProgress, ResponseHeader…).
      filter(
        (event) =>
          event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response,
      ),
      // CONCEPT: map | INTERVIEW: transform each value; here HttpEvent → our own small union.
      map((event): UploadEvent<T> => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? 0;
          return {
            kind: 'progress',
            percent: total ? Math.round((event.loaded / total) * 100) : 0,
          };
        }
        return { kind: 'done', result: mapBody((event as HttpResponse<TRaw>).body as TRaw) };
      }),
    );
}

/** Same guard as React's `assertBlobContentType`: a JSON/HTML error body under a 200 must not download as .xlsx. */
export async function assertSpreadsheet(response: HttpResponse<Blob>): Promise<Blob> {
  const blob = response.body ?? new Blob();
  const contentType = (response.headers.get('Content-Type') ?? blob.type ?? '').toLowerCase();
  if (contentType.includes('spreadsheetml')) return blob;
  const bodyText = await blob.text().catch(() => '');
  throw new Error(
    `Expected a XLSX response, received "${contentType || 'unknown'}"${bodyText ? `: ${bodyText}` : ''}`,
  );
}
