import { inject } from '@angular/core';
import { RedirectCommand, type ResolveFn, Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { SKIP_ERROR_TOAST, withFlags } from '@core/http/http-context';
import { NotificationService } from '@core/notify/notification.service';

import type { Student } from '../models/student.model';
import { StudentsService } from './students.service';

export const STUDENT_LIST_URL = '/practice/students/list';

// CONCEPT: functional route resolver (ResolveFn) | REACT: TanStack Router `loader` / React Router `loader` | INTERVIEW: the router waits for the resolver BEFORE activating the route, so the page always has its data; returning a RedirectCommand sends the user elsewhere instead.
// OLD (class-based): @Injectable() class StudentResolver implements Resolve<Student> { resolve(route) { … } }
// With withComponentInputBinding() the result arrives in the page as `student = input.required<Student>()`.
export const studentResolver: ResolveFn<Student> = (route) => {
  const router = inject(Router);
  const notify = inject(NotificationService);
  const id = Number(route.paramMap.get('id'));

  return inject(StudentsService)
    .get(id, withFlags(SKIP_ERROR_TOAST)) // we show our own message below
    .pipe(
      catchError(() => {
        notify.error(`Student #${route.paramMap.get('id')} was not found.`);
        return of(new RedirectCommand(router.parseUrl(STUDENT_LIST_URL)));
      }),
    );
};
