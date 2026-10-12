import { computed, Injectable, signal } from '@angular/core';

// CONCEPT: shared service with signals (component communication without an event bus) | REACT: a Zustand store / Context read by a <TopProgressBar/> | INTERVIEW: the loading interceptor writes, the header's progress bar reads — neither knows about the other.
@Injectable({ providedIn: 'root' })
export class LoadingService {
  /** A counter, not a boolean: two parallel requests must both finish before the bar hides. */
  private readonly inFlight = signal(0);

  readonly isLoading = computed(() => this.inFlight() > 0);

  start(): void {
    this.inFlight.update((n) => n + 1);
  }

  stop(): void {
    this.inFlight.update((n) => Math.max(0, n - 1));
  }
}
