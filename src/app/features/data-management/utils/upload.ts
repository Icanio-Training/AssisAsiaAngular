// Ported from the React app: utils/uploadErrors.ts + FileUploadPanel helpers.

/** Row errors arrive as strings, `{ message }`, `{ error }` or `{ field: [msgs] }` — flatten them. */
export function normalizeUploadErrors(errors: readonly unknown[] | null | undefined): string[] {
  return (errors ?? []).map((entry) => {
    if (typeof entry === 'string') return entry;
    if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;
      if (typeof obj['message'] === 'string') return obj['message'];
      if (typeof obj['error'] === 'string') return obj['error'];
      const values = Object.values(obj);
      if (values.length > 0 && values.every((v) => typeof v === 'string')) {
        return values.join(' ');
      }
      if (values.length > 0 && values.every((v) => Array.isArray(v))) {
        return values
          .flat()
          .filter((v) => typeof v === 'string')
          .join(' ');
      }
    }
    return JSON.stringify(entry);
  });
}

export const ALLOWED_UPLOAD_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Returns an error message, or null when the file is acceptable. */
export function validateUploadFile(file: { name: string; size: number }): string | null {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(extension)) {
    return `"${file.name}" isn't a supported file type. Use .csv, .xlsx, or .xls.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is too large. The limit is 10 MB.`;
  }
  return null;
}

export function fileExtensionLabel(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot === -1 ? '' : fileName.slice(dot + 1).toUpperCase();
}

export function formatFileSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface UploadResult {
  importedCount: number;
  skippedCount: number;
  duplicateCount: number;
  errors: string[];
}

/** "63 imported, 2 skipped, 1 duplicate skipped." — only non-zero counts. */
export function summarizeUploadResult(result: UploadResult): string {
  const parts = [`${result.importedCount} imported`];
  if (result.skippedCount > 0) parts.push(`${result.skippedCount} skipped`);
  if (result.duplicateCount > 0) {
    parts.push(
      `${result.duplicateCount} duplicate${result.duplicateCount === 1 ? '' : 's'} skipped`,
    );
  }
  return `${parts.join(', ')}.`;
}

const MAX_INLINE_ROW_ERRORS = 3;

export function summarizeRowErrors(errors: readonly string[]): string {
  if (errors.length <= MAX_INLINE_ROW_ERRORS) return errors.join(' ');
  const extra = errors.length - MAX_INLINE_ROW_ERRORS;
  return `${errors.slice(0, MAX_INLINE_ROW_ERRORS).join(' ')} (+${extra} more issue${extra === 1 ? '' : 's'} — check the file and re-upload.)`;
}
