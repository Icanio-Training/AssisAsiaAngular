import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { LoginForm } from './login-form';

// CONCEPT: component test with TestBed | REACT: render(<LoginForm/>) from React Testing Library | INTERVIEW: TestBed builds the component with real DI; providers swap dependencies (HttpClient → testing backend, translations → inline).
describe('LoginForm', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [LoginForm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'en' }),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      login: {
        errors: { email: 'Please enter a valid email address', password: 'Password is required' },
      },
    });
    translate.use('en');

    const fixture = TestBed.createComponent(LoginForm);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('shows the email error when submitted empty', async () => {
    const { fixture, el } = await setup();

    el.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Please enter a valid email address',
    );
  });

  it('shows the password error when only the email is filled', async () => {
    const { fixture, el } = await setup();

    const email = el.querySelector<HTMLInputElement>('#login-email');
    if (!email) throw new Error('email input missing');
    email.value = 'user@example.com';
    email.dispatchEvent(new Event('input'));
    el.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Password is required');
  });
});
