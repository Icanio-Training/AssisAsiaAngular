import { FormControl, FormGroup } from '@angular/forms';
import { firstValueFrom, type Observable, of } from 'rxjs';

import {
  type EmailAvailabilityChecker,
  emailAvailableValidator,
  enrolmentAgeValidator,
  noDigitsValidator,
} from './student.validators';

describe('noDigitsValidator (custom)', () => {
  it('passes plain names', () => {
    expect(noDigitsValidator(new FormControl('Aisha'))).toBeNull();
  });

  it('fails when the value contains a digit', () => {
    expect(noDigitsValidator(new FormControl('R2D2'))).toEqual({ hasDigits: true });
  });
});

describe('enrolmentAgeValidator (cross-field)', () => {
  function group(dob: Date | null, enrolled: Date | null) {
    return new FormGroup(
      { dateOfBirth: new FormControl(dob), enrolledOn: new FormControl(enrolled) },
      { validators: enrolmentAgeValidator(16) },
    );
  }

  it('is valid when the student was 16+ at enrolment', () => {
    expect(group(new Date(2000, 0, 1), new Date(2018, 8, 1)).errors).toBeNull();
  });

  it('flags enrolment before birth', () => {
    expect(group(new Date(2000, 0, 1), new Date(1999, 0, 1)).errors).toEqual({
      enrolledBeforeBirth: true,
    });
  });

  it('flags students younger than 16', () => {
    expect(group(new Date(2010, 5, 1), new Date(2024, 8, 1)).errors).toEqual({
      tooYoung: { minAge: 16, actualAge: 14 },
    });
  });

  it('leaves empty dates to the required validator', () => {
    expect(group(null, new Date(2024, 0, 1)).errors).toBeNull();
  });
});

describe('emailAvailableValidator (async)', () => {
  // A fake service — no HttpClient needed. vi.fn records the calls.
  function fakeChecker(available: boolean) {
    const isEmailAvailable = vi.fn((email: string): Observable<boolean> =>
      of(available && !!email),
    );
    const checker: EmailAvailabilityChecker = { isEmailAvailable };
    return { checker, isEmailAvailable };
  }

  function run(validate: ReturnType<typeof emailAvailableValidator>, value: string) {
    return firstValueFrom(validate(new FormControl(value)) as Observable<unknown>);
  }

  it('returns { emailTaken } when the server says the email exists', async () => {
    const { checker } = fakeChecker(false);
    expect(
      await run(
        emailAvailableValidator(checker, () => null, 0),
        'taken@uni.test',
      ),
    ).toEqual({
      emailTaken: true,
    });
  });

  it('returns null when the email is free', async () => {
    const { checker } = fakeChecker(true);
    expect(
      await run(
        emailAvailableValidator(checker, () => null, 0),
        'new@uni.test',
      ),
    ).toBeNull();
  });

  it('skips the request for the current email when editing', async () => {
    const { checker, isEmailAvailable } = fakeChecker(false);
    const validate = emailAvailableValidator(checker, () => 'Me@Uni.test', 0);
    expect(await run(validate, 'me@uni.test')).toBeNull();
    expect(isEmailAvailable).not.toHaveBeenCalled();
  });

  it('debounces: waits for the timer before calling the server', () => {
    vi.useFakeTimers();
    try {
      const { checker, isEmailAvailable } = fakeChecker(true);
      const validate = emailAvailableValidator(checker, () => null, 400);
      (validate(new FormControl('a@uni.test')) as Observable<unknown>).subscribe();

      vi.advanceTimersByTime(399);
      expect(isEmailAvailable).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(isEmailAvailable).toHaveBeenCalledWith('a@uni.test');
    } finally {
      vi.useRealTimers();
    }
  });
});
