// Types shared by the whole Students practice feature (service, mock API, pages, tests).

export const COURSES = ['Computer Science', 'Business', 'Engineering', 'Design'] as const;

/** 'Computer Science' | 'Business' | 'Engineering' | 'Design' — derived from the array above. */
export type Course = (typeof COURSES)[number];

export type StudentStatus = 'active' | 'inactive';

export interface SubjectGrade {
  name: string;
  /** 0 – 100 */
  grade: number;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  course: Course;
  /** ISO date, e.g. "2024-09-01" */
  enrolledOn: string;
  /** ISO date, e.g. "2004-02-17" */
  dateOfBirth: string;
  status: StudentStatus;
  subjects: SubjectGrade[];
  /** May contain HTML — rendered with [innerHTML] on the detail page (sanitized by Angular). */
  notes: string;
}

/** Body for POST / PUT — everything except the server-generated id. */
export type StudentInput = Omit<Student, 'id'>;

export type StudentSortKey = 'lastName' | 'email' | 'course' | 'enrolledOn';
export type SortDirection = 'asc' | 'desc' | '';

/** Query string for GET /students. A `type`, not an `interface`: only type aliases are
    assignable to toHttpParams' `Record<string, …>` parameter (interfaces lack an index signature). */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type StudentQuery = {
  search: string;
  course: readonly Course[];
  sort: StudentSortKey | '';
  dir: SortDirection;
  page: number;
  per_page: number;
};

/** Laravel-style paginated response. */
export interface Page<T> {
  items: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/** Laravel 422 body: `{ message, errors: { field: ['msg'] } }`. */
export interface ValidationErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}

// ---- Date helpers (the API uses "YYYY-MM-DD" strings; mat-datepicker uses Date objects) ----

/** Date → "YYYY-MM-DD" using LOCAL time (toISOString() would shift by the timezone). */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" → local Date (or null for empty / invalid strings). */
export function fromIsoDate(value: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Whole years between two dates (birthday-aware). */
export function yearsBetween(from: Date, to: Date): number {
  let years = to.getFullYear() - from.getFullYear();
  const beforeBirthday =
    to.getMonth() < from.getMonth() ||
    (to.getMonth() === from.getMonth() && to.getDate() < from.getDate());
  if (beforeBirthday) years -= 1;
  return years;
}
