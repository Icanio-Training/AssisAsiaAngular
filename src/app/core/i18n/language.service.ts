import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'id', label: 'Bahasa Indonesia' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'adme-lang';

// CONCEPT: runtime i18n with ngx-translate | REACT: none (the React app is English-only; react-i18next would be the equivalent) | INTERVIEW: ngx-translate loads JSON files at RUNTIME, so the language switches instantly without a reload; Angular's built-in @angular/localize instead compiles one bundle PER language at BUILD time (faster, but switching = loading another app).
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  /** Signal of the active language (ngx-translate v18 exposes it as a signal). */
  readonly current = this.translate.currentLang;
  readonly languages = LANGUAGES;

  /** Called once at startup (provideAppInitializer). */
  init(): void {
    this.use(this.readSaved() ?? 'en');
  }

  use(code: LanguageCode): void {
    this.translate.use(code);
    this.document.documentElement.lang = code; // accessibility: screen readers pick the right voice
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // storage blocked — the choice just won't persist
    }
  }

  private readSaved(): LanguageCode | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return LANGUAGES.some((l) => l.code === saved) ? (saved as LanguageCode) : null;
    } catch {
      return null;
    }
  }
}
