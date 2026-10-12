import {
  type AfterContentInit,
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  type DoCheck,
  input,
  type OnChanges,
  type OnDestroy,
  type OnInit,
  type SimpleChanges,
} from '@angular/core';

// CONCEPT: lifecycle hooks | REACT: useEffect(() => { …mount…; return () => …unmount… }, [deps]) | INTERVIEW: order = constructor → ngOnChanges (only if it has inputs) → ngOnInit → ngDoCheck → ngAfterContentInit → ngAfterContentChecked → ngAfterViewInit → ngAfterViewChecked → (on every check: ngOnChanges? → ngDoCheck → …Checked) → ngOnDestroy.
//  - ngOnChanges: an @Input/input() value changed (gets SimpleChanges with previous/current).
//  - ngOnInit: inputs are set — start loading here, NOT in the constructor.
//  - ngDoCheck: runs on EVERY change-detection pass → never do heavy work here (it would slow the whole app).
//  - ngAfterViewInit: the component's own view (and viewChild()) is ready.
//  - ngOnDestroy: clean up (timers, manual subscriptions). Modern alternative: inject(DestroyRef).onDestroy().
// Open the browser console, then use the buttons on the detail page to change the input / destroy it.
@Component({
  selector: 'app-lifecycle-logger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-sm">
      Lifecycle logger for <strong>{{ label() }}</strong> (input changed
      {{ label().length }} chars). Hooks are logged to the browser console.
    </p>
  `,
})
export class LifecycleLogger
  implements OnChanges, OnInit, DoCheck, AfterContentInit, AfterViewInit, OnDestroy
{
  readonly label = input('');
  private checks = 0;

  constructor() {
    this.log('constructor (inputs are NOT set yet)');
  }

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['label'];
    this.log(
      `ngOnChanges label: "${String(change?.previousValue)}" → "${String(change?.currentValue)}"`,
    );
  }

  ngOnInit(): void {
    this.log(`ngOnInit (label = "${this.label()}")`);
  }

  ngDoCheck(): void {
    // Keep this CHEAP — it runs on every change detection pass.
    this.checks += 1;
    this.log(`ngDoCheck #${this.checks}`);
  }

  ngAfterContentInit(): void {
    this.log('ngAfterContentInit (projected <ng-content> is ready)');
  }

  ngAfterViewInit(): void {
    this.log('ngAfterViewInit (own template rendered)');
  }

  ngOnDestroy(): void {
    this.log('ngOnDestroy (clean up here)');
  }

  private log(message: string): void {
    console.info(`[LifecycleLogger] ${message}`);
  }
}
