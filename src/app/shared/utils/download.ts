import { HttpErrorResponse, type HttpResponse } from '@angular/common/http';

// Ported from the React app: features/initiatives/utils/downloadBlob.ts + data-management/utils/apiErrorMessage.ts.

/** Save a Blob as a file (object URL + temporary <a download>). */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Free the memory once the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Save a data URL (e.g. a chart PNG from canvas.toDataURL). */
export function saveDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

/** Filename from `Content-Disposition: attachment; filename="report.pdf"`, or the fallback. */
export function filenameFromResponse(response: HttpResponse<Blob>, fallback: string): string {
  const header = response.headers.get('Content-Disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

/**
 * When a request uses responseType: 'blob', even the ERROR body arrives as a Blob.
 * This reads it back as JSON to get Laravel's `{ message }`.
 */
export async function blobErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
    try {
      const parsed = JSON.parse(await error.error.text()) as { message?: unknown };
      if (typeof parsed.message === 'string' && parsed.message) return parsed.message;
    } catch {
      // not JSON — fall through
    }
  }
  return apiErrorMessage(error, fallback);
}

/** Laravel validation / error message from an HttpErrorResponse, or the fallback text. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: unknown; errors?: Record<string, string[]> } | null;
    const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
    if (firstFieldError) return firstFieldError;
    if (typeof body?.message === 'string' && body.message) return body.message;
  }
  return fallback;
}
