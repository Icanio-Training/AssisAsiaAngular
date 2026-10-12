import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LoginBrandPanel } from '../components/login-brand-panel';
import { LoginForm } from '../components/login-form';

// CONCEPT: standalone component composition | REACT: routes/login.tsx rendering <LoginBrandPanel/> + <LoginForm/> | INTERVIEW: child components are used by their selector and must be listed in `imports`.
// OLD (NgModule era): LoginBrandPanel/LoginForm would be in an NgModule's `declarations` instead of `imports` here.
// The React "×" close button is gone: it went to the public home page, which is out of scope.
@Component({
  selector: 'app-login-page',
  imports: [LoginBrandPanel, LoginForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="fixed inset-0 z-[9000] flex overflow-hidden bg-white">
      <app-login-brand-panel />
      <section
        aria-label="Sign in"
        class="flex w-full items-start justify-center px-14 py-9 max-[600px]:px-[22px] max-[600px]:py-[34px] min-[1081px]:w-1/2"
      >
        <app-login-form />
      </section>
    </main>
  `,
})
export class LoginPage {}
