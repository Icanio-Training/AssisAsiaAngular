import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DATABASE_LINKS } from '@core/constants/nav';

interface SocialLink {
  href: string;
  label: string;
  path: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://www.youtube.com/channel/UCOp9ttykdbVr6MEkLJ4ZaJQ',
    label: 'YouTube',
    path: 'M23 12s0-3.4-.4-5a2.6 2.6 0 0 0-1.8-1.8C19 4.8 12 4.8 12 4.8s-7 0-8.8.4A2.6 2.6 0 0 0 1.4 7C1 8.6 1 12 1 12s0 3.4.4 5a2.6 2.6 0 0 0 1.8 1.8c1.8.4 8.8.4 8.8.4s7 0 8.8-.4A2.6 2.6 0 0 0 22.6 17c.4-1.6.4-5 .4-5zM9.8 15.3V8.7l5.7 3.3z',
  },
  {
    href: 'https://www.instagram.com/asean/',
    label: 'Instagram',
    path: 'M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.1.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.1-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4a3.8 3.8 0 0 1-1.4-.9 3.8 3.8 0 0 1-.9-1.4c-.1-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.1 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1C2.6 9.9 2.6 10.3 2.6 12s0 2.1.1 3.3c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-3.3s0-2.1-.1-3.3c-.1-1.1-.2-1.7-.4-2.1a3.5 3.5 0 0 0-.8-1.3 3.5 3.5 0 0 0-1.3-.8c-.4-.2-1-.3-2.1-.4C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8zm0 8a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm6.3-8.2a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0z',
  },
  {
    href: 'https://www.facebook.com/aseansecretariat',
    label: 'Facebook',
    path: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z',
  },
  {
    href: 'https://x.com/ASEAN',
    label: 'X',
    path: 'M18.2 2H21l-6.6 7.6L22 22h-6.2l-4.8-6.3L5.5 22H2.7l7-8.1L2 2h6.3l4.4 5.8L18.2 2zm-1 18h1.5L7.1 3.6H5.5L17.2 20z',
  },
  {
    href: 'https://www.linkedin.com/company/the-asean-secretariat',
    label: 'LinkedIn',
    path: 'M20.4 3H3.6C3 3 2.5 3.5 2.5 4.1v15.8c0 .6.5 1.1 1.1 1.1h16.8c.6 0 1.1-.5 1.1-1.1V4.1c0-.6-.5-1.1-1.1-1.1zM8.3 18.3H5.5V9.7h2.8v8.6zM6.9 8.5a1.6 1.6 0 1 1 0-3.3 1.6 1.6 0 0 1 0 3.3zm11.4 9.8h-2.8v-4.2c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.3H9.7V9.7h2.7v1.2h.1c.4-.7 1.3-1.4 2.6-1.4 2.8 0 3.3 1.8 3.3 4.2v4.6z',
  },
];

/** Site-wide footer, rendered once from AppLayout (was SiteFooter.tsx). */
@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer
      role="contentinfo"
      aria-label="Site footer"
      class="bg-[#131A2B] pt-[30px] pb-[20px] text-[13px] text-[rgba(255,255,255,0.62)]"
    >
      <div class="mx-auto max-w-[1240px] px-8">
        <div
          class="grid grid-cols-1 gap-7 border-b border-white/10 pb-[34px] sm:grid-cols-[1.4fr_1fr_1.2fr] sm:gap-10"
        >
          <div>
            <div class="mb-[11px] inline-block rounded-[10px] bg-white px-3 py-2">
              <img
                src="assets/adme-logo.svg"
                alt="ADME — ASEAN Secretariat"
                class="block h-11 w-auto"
              />
            </div>
            <div class="mt-4 flex gap-2.5">
              @for (social of socialLinks; track social.label) {
                <a
                  [href]="social.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  [title]="social.label"
                  [attr.aria-label]="social.label"
                  class="mr-2 inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/[0.12] text-white transition-colors duration-200 hover:bg-white/[0.28]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path [attr.d]="social.path" />
                  </svg>
                </a>
              }
            </div>
          </div>

          <div>
            <h4 class="mb-4 text-sm font-bold text-white">Explore</h4>
            <div>
              @for (link of exploreLinks; track link.label) {
                <a
                  [routerLink]="link.path"
                  class="block py-[5px] text-[13.5px] text-white/60 transition-colors duration-150 hover:text-white"
                >
                  {{ link.label }}
                </a>
              }
            </div>
          </div>

          <div>
            <h4 class="mb-4 text-sm font-bold text-white">The ASEAN Secretariat</h4>
            <p class="text-[13px] leading-[1.85]">
              70A Jalan Sisingamangaraja
              <br />
              Jakarta 12110, Indonesia
              <br />
              P: (+6221) 7262991, 7243372
              <br />
              F: (+6221) 7398234, 7243504
              <br />
              M: <a href="mailto:adme@asean.org">adme&#64;asean.org</a>
            </p>
          </div>
        </div>

        <div class="mt-[14px] pt-[6px] text-right">
          <p
            class="mr-0 mb-[10px] ml-auto max-w-[430px] text-[12px] leading-[1.5] text-[rgba(255,255,255,0.62)]"
          >
            Supported by the Australian Government through the Australia for ASEAN Futures
            Initiative
          </p>
          <img
            src="assets/aus4asean-footer.svg"
            alt="Aus4ASEAN Futures"
            class="ml-auto h-9 w-auto"
          />
        </div>

        <p class="mt-[22px] border-t border-white/10 text-center text-[12px] text-white/40">
          © 2026 ADME · ASCC Database for Monitoring and Evaluation System
        </p>
      </div>
    </footer>
  `,
})
export class SiteFooter {
  protected readonly socialLinks = SOCIAL_LINKS;
  protected readonly exploreLinks = DATABASE_LINKS;
}
