import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { NotificationService } from '@core/notify/notification.service';
import { RbacService } from '@core/rbac/rbac.service';
import { ConfirmService } from '@shared/ui/confirm-dialog';

import { StudentsService } from '../data/students.service';
import type { Page, Student } from '../models/student.model';
import { StudentListPage } from './student-list.page';

function student(id: number, firstName: string, lastName: string): Student {
  return {
    id,
    firstName,
    lastName,
    email: `${firstName}@uni.test`.toLowerCase(),
    course: 'Design',
    enrolledOn: '2024-09-01',
    dateOfBirth: '2004-01-01',
    status: 'active',
    subjects: [],
    notes: '',
  };
}

// CONCEPT: component test with a mocked service | REACT: render(<StudentList/>) with msw or a mocked hook | INTERVIEW: { provide: StudentsService, useValue: fake } swaps the real service in DI — the component never knows, and no HTTP happens.
describe('StudentListPage', () => {
  async function setup(canDelete: boolean) {
    const page: Page<Student> = {
      items: [student(1, 'Aisha', 'Rahman'), student(2, 'Ben', 'Okafor')],
      current_page: 1,
      per_page: 10,
      total: 2,
      last_page: 1,
    };
    const fakeStudents = {
      courses$: of(['Design', 'Business']),
      list: vi.fn(() => of(page)),
      remove: vi.fn(() => of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [StudentListPage],
      providers: [
        provideRouter([]),
        { provide: StudentsService, useValue: fakeStudents },
        { provide: RbacService, useValue: { can: () => canDelete } },
        { provide: ConfirmService, useValue: { ask: () => of(true) } },
        {
          provide: NotificationService,
          useValue: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(StudentListPage);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement, fakeStudents };
  }

  it('renders one table row per student returned by the service', async () => {
    const { el, fakeStudents } = await setup(true);

    const rows = el.querySelectorAll('[data-testid="student-row"]');
    expect(rows.length).toBe(2);
    expect(rows[0]?.textContent).toContain('Aisha Rahman');
    expect(rows[1]?.textContent).toContain('ben@uni.test');
    expect(fakeStudents.list).toHaveBeenCalledWith(
      expect.objectContaining({ search: '', sort: 'lastName', dir: 'asc', page: 1, per_page: 10 }),
    );
  });

  it('shows Delete only for users with users:manage (*appCan)', async () => {
    const admin = await setup(true);
    expect(admin.el.querySelectorAll('button[aria-label^="Delete"]').length).toBe(2);

    TestBed.resetTestingModule();
    const viewer = await setup(false);
    expect(viewer.el.querySelectorAll('button[aria-label^="Delete"]').length).toBe(0);
  });

  it('deletes after confirming and reloads the list', async () => {
    const { fixture, el, fakeStudents } = await setup(true);

    el.querySelector<HTMLButtonElement>('button[aria-label="Delete Aisha Rahman"]')?.click();
    await fixture.whenStable();

    expect(fakeStudents.remove).toHaveBeenCalledWith(1);
    expect(fakeStudents.list).toHaveBeenCalledTimes(2); // initial load + refresh
  });
});
