import type { HttpRequest } from '@angular/common/http';

import {
  fail,
  type MockRoute,
  newId,
  ok,
  paginate,
  query,
  queryAll,
  withUser,
} from '@core/mock-api/mock-utils';

import {
  type Course,
  COURSES,
  type Student,
  type StudentInput,
  type StudentStatus,
  type SubjectGrade,
} from '../models/student.model';

// In-memory "database" for the Students practice feature: a small REST API.
//   GET    /students                     ?search, course[], sort, dir, page, per_page
//   GET    /students/courses
//   GET    /students/email-available     ?email=
//   GET    /students/{id}
//   POST   /students                     201 | 422
//   PUT    /students/{id}                200 | 404 | 422
//   PATCH  /students/{id}                200 | 404   (partial update, e.g. { status })
//   DELETE /students/{id}                200 | 404
// Try it: save a student whose first name is "Test" to see a server 422 mapped onto the form.

const FIRST_NAMES = [
  'Aisha',
  'Ben',
  'Chloe',
  'Daniel',
  'Elena',
  'Farah',
  'George',
  'Hana',
  'Ivan',
  'Julia',
  'Kofi',
  'Lena',
  'Marco',
  'Nadia',
  'Omar',
  'Priya',
  'Quinn',
  'Rosa',
  'Sam',
  'Tara',
];
const LAST_NAMES = [
  'Rahman',
  'Okafor',
  'Smith',
  'Garcia',
  'Nguyen',
  'Kowalski',
  'Haddad',
  'Lee',
  'Silva',
  'Brown',
  'Ivanova',
  'Patel',
];
const SUBJECTS_BY_COURSE: Record<Course, string[]> = {
  'Computer Science': ['Algorithms', 'Databases', 'Networks', 'Web Development'],
  Business: ['Accounting', 'Marketing', 'Economics', 'Statistics'],
  Engineering: ['Mechanics', 'Thermodynamics', 'Circuits', 'Materials'],
  Design: ['Typography', 'Colour Theory', 'UX Research', 'Illustration'],
};

/** Deterministic pseudo-random numbers, so the seed data is the same on every reload. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function seedStudents(count: number): Student[] {
  const rand = seeded(42);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)] as T;
  const pad = (n: number) => String(n).padStart(2, '0');

  return Array.from({ length: count }, (_, index): Student => {
    const id = index + 1;
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const course = pick(COURSES);
    const birthYear = 1995 + Math.floor(rand() * 10);
    const enrolledYear = birthYear + 18 + Math.floor(rand() * 4);
    const subjects: SubjectGrade[] = SUBJECTS_BY_COURSE[course]
      .slice(0, 2 + Math.floor(rand() * 3))
      .map((name) => ({ name, grade: 40 + Math.floor(rand() * 61) }));
    return {
      id,
      firstName,
      lastName,
      email: `${firstName}.${lastName}${id}@uni.test`.toLowerCase(),
      course,
      dateOfBirth: `${birthYear}-${pad(1 + Math.floor(rand() * 12))}-${pad(1 + Math.floor(rand() * 28))}`,
      enrolledOn: `${enrolledYear}-09-${pad(1 + Math.floor(rand() * 20))}`,
      status: rand() > 0.2 ? 'active' : 'inactive',
      subjects,
      notes:
        id === 1
          ? // Deliberately unsafe HTML — the detail page shows Angular stripping the onerror handler.
            '<b>bold</b> notes with an <img src=x onerror=alert(1)> image that tries to run a script.'
          : `<p>${firstName} is studying <i>${course}</i>.</p>`,
    };
  });
}

let students: Student[] = seedStudents(60);

const SORTABLE = ['lastName', 'firstName', 'email', 'course', 'enrolledOn'] as const;
type SortableKey = (typeof SORTABLE)[number];

function isSortable(key: string | null): key is SortableKey {
  return SORTABLE.some((k) => k === key);
}

function findIndex(id: string | undefined): number {
  return students.findIndex((s) => s.id === Number(id));
}

/** Server-side validation → Laravel-style `{ field: ['message'] }` (empty object = valid). */
function validate(body: Partial<StudentInput>, ignoreId?: number): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (!body.firstName?.trim()) errors['firstName'] = ['The first name field is required.'];
  else if (body.firstName.trim().toLowerCase() === 'test')
    errors['firstName'] = ['The first name "Test" is reserved by the server.'];
  if (!body.lastName?.trim()) errors['lastName'] = ['The last name field is required.'];
  if (!body.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email))
    errors['email'] = ['The email must be a valid email address.'];
  else if (students.some((s) => s.email === body.email?.toLowerCase() && s.id !== ignoreId))
    errors['email'] = ['The email has already been taken.'];
  if (!body.course || !COURSES.includes(body.course))
    errors['course'] = ['The selected course is invalid.'];
  if (!body.enrolledOn) errors['enrolledOn'] = ['The enrolled on field is required.'];
  if (!body.dateOfBirth) errors['dateOfBirth'] = ['The date of birth field is required.'];
  return errors;
}

function toStudent(id: number, body: Partial<StudentInput>): Student {
  return {
    id,
    firstName: body.firstName?.trim() ?? '',
    lastName: body.lastName?.trim() ?? '',
    email: body.email?.toLowerCase() ?? '',
    course: body.course ?? 'Computer Science',
    enrolledOn: body.enrolledOn ?? '',
    dateOfBirth: body.dateOfBirth ?? '',
    status: body.status ?? 'active',
    subjects: body.subjects ?? [],
    notes: body.notes ?? '',
  };
}

function bodyOf(req: HttpRequest<unknown>): Partial<StudentInput> {
  return (req.body ?? {}) as Partial<StudentInput>;
}

export const PRACTICE_STUDENTS_MOCK_ROUTES: MockRoute[] = [
  {
    method: 'GET',
    path: /^\/students$/,
    handle: (req) =>
      withUser(req, () => {
        const search = (query(req, 'search') ?? '').trim().toLowerCase();
        const courses = queryAll(req, 'course');
        const sort = query(req, 'sort');
        const dir = query(req, 'dir') === 'desc' ? -1 : 1;

        let rows = students.filter(
          (s) =>
            (!search || `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search)) &&
            (courses.length === 0 || courses.includes(s.course)),
        );
        if (isSortable(sort)) {
          rows = [...rows].sort((a, b) => a[sort].localeCompare(b[sort]) * dir);
        }
        const page = Number(query(req, 'page') ?? 1);
        const perPage = Number(query(req, 'per_page') ?? 10);
        return ok(paginate(rows, page, perPage));
      }),
  },
  {
    method: 'GET',
    path: /^\/students\/courses$/,
    handle: (req) => withUser(req, () => ok([...COURSES])),
  },
  {
    method: 'GET',
    path: /^\/students\/email-available$/,
    handle: (req) =>
      withUser(req, () => {
        const email = (query(req, 'email') ?? '').toLowerCase();
        return ok({ available: !students.some((s) => s.email === email) });
      }),
  },
  {
    method: 'GET',
    path: /^\/students\/(\d+)$/,
    handle: (req, params) =>
      withUser(req, () => {
        const student = students[findIndex(params[1])];
        return student ? ok(student) : fail(req, 404, 'Student not found.');
      }),
  },
  {
    method: 'POST',
    path: /^\/students$/,
    handle: (req) =>
      withUser(req, () => {
        const body = bodyOf(req);
        const errors = validate(body);
        if (Object.keys(errors).length)
          return fail(req, 422, 'The given data was invalid.', errors);
        const created = toStudent(newId(), body);
        students = [created, ...students];
        return ok(created, 201);
      }),
  },
  {
    method: 'PUT',
    path: /^\/students\/(\d+)$/,
    handle: (req, params) =>
      withUser(req, () => {
        const index = findIndex(params[1]);
        const existing = students[index];
        if (!existing) return fail(req, 404, 'Student not found.');
        const body = bodyOf(req);
        const errors = validate(body, existing.id);
        if (Object.keys(errors).length)
          return fail(req, 422, 'The given data was invalid.', errors);
        const updated = toStudent(existing.id, body);
        students = students.map((s) => (s.id === existing.id ? updated : s));
        return ok(updated);
      }),
  },
  {
    method: 'PATCH',
    path: /^\/students\/(\d+)$/,
    handle: (req, params) =>
      withUser(req, () => {
        const existing = students[findIndex(params[1])];
        if (!existing) return fail(req, 404, 'Student not found.');
        const body = bodyOf(req);
        const status: StudentStatus =
          body.status === 'active' || body.status === 'inactive' ? body.status : existing.status;
        const updated: Student = { ...existing, ...body, id: existing.id, status };
        students = students.map((s) => (s.id === existing.id ? updated : s));
        return ok(updated);
      }),
  },
  {
    method: 'DELETE',
    path: /^\/students\/(\d+)$/,
    handle: (req, params) =>
      withUser(req, () => {
        const existing = students[findIndex(params[1])];
        if (!existing) return fail(req, 404, 'Student not found.');
        students = students.filter((s) => s.id !== existing.id);
        return ok(null);
      }),
  },
];
