import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Purely presentational — no inputs, no state. The simplest kind of
    component: a class with an empty body and an inline template.
    Note `[style.background]` instead of React's `style={{ background }}`,
    and `class` instead of `className`. Images live in /public, so they're
    referenced by URL instead of `import admeLogo from '…svg'`. */
@Component({
  selector: 'app-login-brand-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative hidden w-1/2 flex-col overflow-hidden bg-[#1E1235] px-11 py-9 min-[1081px]:flex"
    >
      <div
        class="pointer-events-none absolute -top-[150px] -right-[160px] h-[520px] w-[520px] rounded-full"
        [style.background]="'radial-gradient(circle, rgba(108,54,148,.32), transparent 68%)'"
      ></div>

      <div class="relative z-10 flex items-center gap-[11px]">
        <div class="inline-block rounded-xl bg-white px-3.5 py-2.5">
          <img
            src="assets/adme-logo.svg"
            alt="ADME — ASCC Database for Monitoring and Evaluation System"
            class="h-10 w-auto"
          />
        </div>
      </div>

      <div class="relative z-10 flex flex-1 items-center justify-center py-3.5">
        <img
          src="assets/asean-pillars-diagram.svg"
          alt=""
          aria-hidden="true"
          class="w-full max-w-[520px]"
        />
      </div>

      <div class="relative z-10 text-center">
        <h2 class="mb-3 text-[19px] leading-[1.36] font-bold text-white">
          Welcome to the ASCC Database for Monitoring
          <br />
          and Evaluation (ADME) System
        </h2>
        <p class="mx-auto max-w-[520px] text-xs leading-[1.7] text-white/72">
          The ADME System is a web-based database and dashboard that enhances evidence-based,
          informed policy, and decision-making. It ensures the availability and accessibility of
          accurate, timely, and reliable data, further promoting transparency and accountability
          within the ASCC.
        </p>
      </div>
    </div>
  `,
})
export class LoginBrandPanel {}
