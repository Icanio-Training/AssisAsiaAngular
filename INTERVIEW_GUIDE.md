# INTERVIEW_GUIDE

One entry per topic. Each has: **What & why** · **React comparison** · **In my project** · **30-second answer** (say it out loud) · **2 follow-ups** · **Common mistakes**.
Sections are added milestone by milestone.

- [M1 — HTML5](#m1--html5)
- [M1 — CSS3](#m1--css3)
- [M1 — JavaScript](#m1--javascript)
- [M1 — TypeScript](#m1--typescript)

---

## M1 — HTML5

### 1. Semantic HTML

- **What & why:** tags that describe _meaning_ — `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>` — instead of `<div>` everywhere. Screen readers use them as landmarks to jump around; search engines use them to understand the page.
- **React comparison:** identical — JSX is HTML. In React and Angular alike, semantics are your choice, not the framework's.
- **In my project:** `layout/header.ts` (`<header>`, `<nav aria-label="Main">`), `layout/app-layout.ts` (`<main>`), `features/auth/pages/login-page.ts` (`<main>`, `<section aria-label>`), `practice/m1-web-fundamentals/login.html` (`<aside>` brand panel).
- **30-second answer:**
  > "Semantic HTML means using elements that describe what the content is — header, nav, main, footer — rather than generic divs. It gives screen readers landmarks so users can jump straight to navigation or main content, it helps SEO, and it makes the markup self-documenting. In our ADME Angular app the header is a `<header>` with a labelled `<nav>`, and every page sits inside a single `<main>`."
- **Follow-ups:**
  - _Section vs div?_ — `<section>` is a themed group that normally has a heading; `<div>` has no meaning and is for styling only.
  - _How many `<main>` per page?_ — One visible `<main>`.
- **Common mistakes:** clickable `<div>` instead of `<button>`; skipping heading levels (h1 → h4); several `<main>`s.

### 2. Forms and input types

- **What & why:** `type="email|password|number|date|checkbox"`, `required`, `minlength`, `pattern`, `autocomplete`. The right type gives the right mobile keyboard, browser validation and password-manager support.
- **React comparison:** same attributes; React writes `htmlFor`/`autoComplete`, Angular templates use plain HTML (`for`, `autocomplete`).
- **In my project:** `features/auth/components/login-form.html` (`type="email"`, `autocomplete="username"` / `"current-password"`, `novalidate`), `practice/.../login.html` (`required`, `minlength`).
- **30-second answer:**
  > "HTML5 input types like email and password give the user the correct keyboard and let the browser and password managers help. Attributes like required and minlength describe the rules. In Angular I add `novalidate` and enforce the rules with Reactive Forms validators so error messages are consistent and testable — but I keep the HTML attributes because they still help accessibility and autofill."
- **Follow-ups:**
  - _Why `novalidate`?_ — It turns off the browser's own popups so the app shows its own messages; the validation itself still runs in our code.
  - _Is client-side validation enough?_ — Never. It's UX only; the server must validate again.
- **Common mistakes:** missing `name`/`autocomplete`; `type="text"` for emails; trusting front-end validation for security.

### 3. Accessibility (a11y)

- **What & why:** every input has a `<label for>`, images have meaningful `alt` (or `alt=""` if decorative), errors are announced (`role="alert"` / `aria-live`), everything works by keyboard, focus is visible.
- **React comparison:** same rules. Angular adds lint rules: `angular.configs.templateAccessibility` in `eslint.config.js` fails the build on missing alt / label issues.
- **In my project:** login error `<p role="alert">` (`login-form.html`), decorative avatar `aria-hidden="true"` (`header.ts`), `:focus-visible` styles (`practice/.../styles.css`), template a11y lint rules (`eslint.config.js`).
- **30-second answer:**
  > "Accessibility means people using screen readers or only a keyboard can use the app. The basics are labels on every input, alt text on images, real buttons for actions, visible focus, and announcing errors with role=alert or aria-live. In our project ESLint's Angular template-accessibility rules run on every lint, so issues like a missing alt are caught before review."
- **Follow-ups:**
  - _`alt=""` vs no alt?_ — `alt=""` says "decorative, skip it"; no alt makes screen readers read the file name.
  - _What is ARIA's first rule?_ — Don't use ARIA if a native element does the job (`<button>` over `<div role="button">`).
- **Common mistakes:** placeholder used as the label; removing focus outlines without a replacement; colour as the only signal of an error.

### 4. Meta tags

- **What & why:** `<meta charset>`, `<meta name="viewport">` (mobile scaling — without it responsive CSS doesn't work on phones), `description` (search snippet), `theme-color`, and `<title>`.
- **React comparison:** React apps edit `index.html` and use a library for per-page titles; Angular sets per-route titles with the `title` property in `app.routes.ts` (built in).
- **In my project:** `src/index.html`; per-route titles in `app.routes.ts` (`title: 'Sign In | ADME'`); `practice/.../login.html`.
- **30-second answer:**
  > "Meta tags describe the page to the browser and search engines. The viewport tag is essential for responsive design, charset avoids broken characters, and description is used in search results. In Angular, the document title changes per route using the `title` property on each route, so the browser tab always shows which page you're on."
- **Follow-ups:**
  - _How to set meta tags dynamically in Angular?_ — The `Meta` and `Title` services from `@angular/platform-browser` (or a custom `TitleStrategy`).
  - _Do SPAs have SEO problems?_ — Crawlers may see an empty shell; SSR/prerendering fixes that (M7).
- **Common mistakes:** missing viewport; one title for every page.

---

## M1 — CSS3

### 5. Box model

- **What & why:** every element is content → padding → border → margin. `box-sizing: border-box` makes `width` include padding and border, so sizes are predictable.
- **React comparison:** same CSS.
- **In my project:** `practice/.../styles.css` (`*, *::before, *::after { box-sizing: border-box }`); Tailwind applies border-box globally in `src/styles.css`.
- **30-second answer:**
  > "Every element is a box: content, then padding inside the border, then the border, then margin outside it. By default width only covers the content, so adding padding makes the box bigger. Setting box-sizing to border-box makes width include padding and border, which is why almost every project — including Tailwind, which we use — sets it globally."
- **Follow-ups:**
  - _Margin vs padding?_ — Padding is inside the border and gets the background; margin is outside and transparent.
  - _What is margin collapsing?_ — Vertical margins of adjacent blocks merge into the larger one (not in flex/grid).
- **Common mistakes:** fixed widths + padding overflowing; using margin for spacing inside a flex row instead of `gap`.

### 6. display and position

- **What & why:** `display` = how a box flows (`block`, `inline`, `inline-block`, `flex`, `grid`, `none`). `position`: `static` (default) · `relative` (offset from itself, becomes a reference for children) · `absolute` (placed against the nearest positioned ancestor) · `fixed` (against the viewport) · `sticky` (normal until scrolled past, then sticks).
- **React comparison:** same CSS.
- **In my project:** sticky header (`header.ts`: `sticky top-0`); login page overlay `fixed inset-0` (`login-page.ts`); avatar status dot `relative` + `absolute` (`practice/.../styles.css`).
- **30-second answer:**
  > "Display decides how a box flows — block, inline, flex, grid or none. Position decides how it's placed: relative offsets it and creates a reference box; absolute places it relative to the nearest positioned ancestor; fixed pins it to the viewport; sticky behaves normally until you scroll past and then sticks. Our ADME header is sticky, and the login screen is a fixed full-screen layer."
- **Follow-ups:**
  - _Why doesn't my absolute element go where I expect?_ — No positioned ancestor, so it uses the page; add `position: relative` to the parent.
  - _Why doesn't z-index work?_ — It only applies to positioned (or flex/grid) elements, and only within the same stacking context.
- **Common mistakes:** `sticky` inside a parent with `overflow: hidden`; using absolute for whole layouts.

### 7. Flexbox vs Grid

- **What & why:** Flexbox = one dimension (a row OR a column); great for nav bars, toolbars, centring. Grid = two dimensions (rows AND columns); great for card layouts and page structure.
- **React comparison:** same CSS.
- **In my project:** Flexbox — header (`flex items-center justify-between`), login layout (`practice/.../styles.css .login-layout`). Grid — welcome cards (`welcome-page.ts`: `grid sm:grid-cols-2 lg:grid-cols-4`; practice: `repeat(auto-fit, minmax(240px, 1fr))`).
- **30-second answer:**
  > "Flexbox lays items out along one axis, so I use it for headers, toolbars and centring. Grid controls rows and columns together, so I use it for card layouts and dashboards. In ADME the header is flex, and the tool cards on the welcome page are a grid that goes from one column on phones to four on desktops."
- **Follow-ups:**
  - _Centre something both ways?_ — `display:flex; justify-content:center; align-items:center` (or `display:grid; place-items:center`).
  - _What does `auto-fit, minmax(240px, 1fr)` do?_ — Fits as many ≥240px columns as possible and stretches them — responsive with no media query.
- **Common mistakes:** confusing `justify-*` (main axis) with `align-*` (cross axis); nesting many flex boxes where one grid would do.

### 8. Responsive design and media queries

- **What & why:** layouts that adapt to screen size. `@media (max-width: 600px) { … }` applies rules only on small screens. Mobile-first = base styles for phones, `min-width` queries add for larger screens (Tailwind's `sm:`, `lg:` prefixes work this way).
- **React comparison:** same CSS; Tailwind is used in both projects.
- **In my project:** header shows short labels below `xl` (`header.ts`: `xl:hidden` / `hidden xl:inline`); brand panel hidden under 1081px (`login-brand-panel.ts`: `min-[1081px]:flex`); practice media queries at 1080px and 600px.
- **30-second answer:**
  > "Responsive design means one codebase that adapts to any screen. I use media queries — usually mobile-first with min-width breakpoints, which is how Tailwind's sm/md/lg prefixes work. In ADME the login brand panel only appears on wide screens, and the header switches to short labels like 'KPIs' on narrower screens so nothing gets cut off."
- **Follow-ups:**
  - _Mobile-first vs desktop-first?_ — Mobile-first starts simple and adds with `min-width`; less CSS to override.
  - _Media query vs container query?_ — Container queries respond to the parent's size, not the viewport — better for reusable components.
- **Common mistakes:** forgetting the viewport meta tag; fixed pixel widths; testing only on desktop.

### 9. Text overflow (ellipsis), colours, borders, backgrounds

- **What & why:** single-line ellipsis needs **three** properties: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` (plus a width limit). Colours (`#hex`, `rgb()`, `color-mix()`), `border`, `border-radius`, and layered `background` gradients.
- **React comparison:** same CSS.
- **In my project:** `welcome-page.ts` `.tool-title` (ellipsis — visible on "ASCC Outcome Do…"), `.tool-tag` uses `color-mix()`; practice brand panel uses a layered `radial-gradient` background.
- **30-second answer:**
  > "For a one-line ellipsis you need white-space nowrap, overflow hidden and text-overflow ellipsis together, and the element needs a constrained width. I also add a title attribute so the full text shows on hover. For multi-line truncation I'd use line-clamp."
- **Follow-ups:**
  - _Ellipsis not working in a flex child?_ — Add `min-width: 0` to the flex item; flex items won't shrink below content size by default.
  - _Multi-line?_ — `line-clamp: 3` (Tailwind `line-clamp-3`).
- **Common mistakes:** only setting `text-overflow`; hiding important text without a tooltip.

### 10. CSS variables (custom properties)

- **What & why:** `--accent: #2c59a7;` defined once, used with `var(--accent)`. Unlike Sass variables they exist at **runtime**, inherit down the tree and can be changed by JS or Angular bindings.
- **React comparison:** React sets them with `style={{ '--accent': color }}`; Angular uses `[style.--accent]="tool.accent"`.
- **In my project:** `src/styles.css` `@theme` brand tokens; `welcome-page.ts` (`[style.--accent]` per card); practice `:root` tokens + `el.style.setProperty('--accent', …)`.
- **30-second answer:**
  > "CSS custom properties are runtime variables. I define design tokens like brand colours once on :root, and I can override a variable on one element so all its children pick it up. In ADME each tool card sets --accent from data, and the border and tag colours follow automatically — no extra classes."
- **Follow-ups:**
  - _CSS vs Sass variables?_ — Sass variables are replaced at build time; CSS variables live in the browser and can change at runtime (theming, dark mode).
  - _Fallback value?_ — `var(--accent, #2c59a7)`.
- **Common mistakes:** forgetting the `--` prefix; expecting them to work inside media query conditions.

### 11. Angular view encapsulation

- **What & why:** Angular scopes a component's `styles` to that component. **Emulated** (default) adds attributes like `_ngcontent-abc` to the elements and selectors; **None** makes styles global; **ShadowDom** uses the browser's real Shadow DOM.
- **React comparison:** React has no built-in scoping — you use CSS Modules, styled-components or Tailwind. Angular gives you CSS-Modules-like scoping for free.
- **In my project:** `features/welcome/welcome-page.ts` (`encapsulation: ViewEncapsulation.Emulated`, scoped `.tool-card` styles); global styles in `src/styles.css`.
- **30-second answer:**
  > "Angular scopes component styles automatically. With the default Emulated mode, it rewrites my selectors to include a unique attribute, so a `.tool-card` rule in one component can't affect another. None makes the styles global, which I'd only use for things like third-party overrides, and ShadowDom uses native Shadow DOM for full isolation. It's the Angular equivalent of CSS Modules in React."
- **Follow-ups:**
  - _How do you style a child component from a parent?_ — Prefer inputs or CSS variables; `::ng-deep` works but is deprecated and leaks styles globally.
  - _Where do global styles go?_ — `src/styles.css` (registered in `angular.json`).
- **Common mistakes:** reaching for `::ng-deep` or `ViewEncapsulation.None` first; putting component styles in the global file.

---

## M1 — JavaScript

### 12. var, let, const

- **What & why:** `const` — can't be reassigned (default choice); `let` — can be reassigned; both are **block-scoped**. `var` is function-scoped and hoisted, which causes bugs.
- **React comparison:** same JS.
- **In my project:** `practice/.../js/auth.js` `scopeDemo()` — `var` in a loop prints 3,3,3; `let` prints 0,1,2 (open DevTools → Console on the login page).
- **30-second answer:**
  > "I use const by default, let only when a variable must be reassigned, and never var. let and const are block-scoped, so a loop creates a fresh variable each iteration. var is function-scoped, so callbacks in a loop all share one variable — the classic bug where timeouts print the same number three times."
- **Follow-ups:**
  - _Can you change a `const` array?_ — Yes, you can mutate its contents; `const` only stops reassignment. Use `readonly`/`Object.freeze` for that.
  - _What is the temporal dead zone?_ — `let`/`const` exist from the start of the block but throw if used before the declaration line.
- **Common mistakes:** thinking `const` means immutable; using `var` in loops with callbacks.

### 13. Arrays, array methods and immutability

- **What & why:** `map` (transform), `filter` (keep some), `find`, `some`/`every`, `reduce`, `forEach`, `slice`. `map`/`filter`/`slice` return **new arrays** — the original is untouched. **Immutability** = create new objects/arrays instead of changing existing ones, so change detection (and humans) can tell something changed by comparing references.
- **React comparison:** React needs immutable updates to re-render (`setItems([...items, x])`). Angular signals are the same: `items.update(list => [...list, x])` — mutating the array in place wouldn't notify anyone.
- **In my project:** `practice/.../js/welcome.js` (`TOOLS.filter(...)`, `.map(...)`), `practice/.../js/auth.js` (`find`, rest destructuring to drop the password), `header.ts` initials (`split → filter → slice → map → join`).
- **30-second answer:**
  > "map transforms each item, filter keeps matching items, find returns the first match, and reduce folds everything into one value. map, filter and slice return new arrays, which supports immutability — I never mutate state in place; I create a new array or object. That matters in Angular with signals and OnPush, because Angular detects change by reference: a mutated array looks unchanged."
- **Follow-ups:**
  - _`map` vs `forEach`?_ — `map` returns a new array; `forEach` returns nothing (side effects only).
  - _How do you add to an array immutably?_ — `[...list, item]`; remove with `list.filter(x => x.id !== id)`; update with `list.map(x => x.id === id ? { ...x, done: true } : x)`.
- **Common mistakes:** `push`/`splice` on state; using `map` without returning a value.

### 14. JSON

- **What & why:** a text format for data. `JSON.stringify(obj)` → string (to store or send); `JSON.parse(str)` → object. Only strings, numbers, booleans, null, arrays and objects — no functions, `Date` becomes a string, `undefined` is dropped.
- **React comparison:** same.
- **In my project:** `auth.store.ts` persists `{ accessToken, user }` with `JSON.stringify` and reads it back with `JSON.parse` inside try/catch; practice `auth.js` `saveSession`/`getSession`; `practice/.../data/users.json`.
- **30-second answer:**
  > "JSON is the text format APIs and storage use. stringify turns an object into a string and parse turns it back. I always wrap parse in try/catch when the data comes from storage, because a corrupt value would otherwise crash the app — our AuthStore does exactly that and falls back to signed out."
- **Follow-ups:**
  - _Does HttpClient need `JSON.parse`?_ — No, it parses JSON responses automatically.
  - _Deep copy with JSON?_ — Works for plain data but loses dates/functions; prefer `structuredClone`.
- **Common mistakes:** parsing without try/catch; storing class instances and expecting methods back.

### 15. AJAX / fetch, Promises, async/await

- **What & why:** AJAX = load data without reloading the page. `fetch()` returns a **Promise** (a future value: pending → fulfilled or rejected). `async/await` writes promise code top-to-bottom; `try/catch/finally` handles errors.
- **React comparison:** React used axios (promises). Angular's `HttpClient` returns **Observables** instead — lazy, cancellable, can emit many values (M4). You can still use `firstValueFrom()` to await one.
- **In my project:** practice `auth.js` (`fetch('./data/users.json')`, `Promise.all`, a promise-wrapped `setTimeout`); `login.js` (`try / catch / finally`); Angular `mock-backend.interceptor.spec.ts` (`await firstValueFrom(...)`).
- **30-second answer:**
  > "A Promise represents a value that arrives later and settles once, as success or failure. async/await lets me write that code like normal sequential code, with try/catch for errors and finally for cleanup like hiding a spinner. In Angular, HttpClient returns Observables instead of Promises because they're lazy and cancellable — useful for search boxes — but I can convert with firstValueFrom when I need a single value."
- **Follow-ups:**
  - _`Promise.all` vs `Promise.allSettled`?_ — `all` rejects as soon as one fails; `allSettled` waits for all and reports each result.
  - _Does `fetch` reject on a 404?_ — No; it only rejects on network failure. Check `response.ok`.
- **Common mistakes:** forgetting `await`; not checking `response.ok`; sequential awaits for independent calls (use `Promise.all`).

### 16. DOM methods; innerHTML vs innerText vs textContent

- **What & why:** `getElementById`, `querySelector`, `createElement`, `append`, `addEventListener`, `classList`. `textContent` sets plain text (safe, fast); `innerText` is similar but layout-aware (slower); `innerHTML` **parses HTML** — dangerous with user/API data (XSS).
- **React comparison:** React and Angular both render text safely by default (`{value}` / `{{ value }}` escape HTML). In Angular, `[innerHTML]` is sanitized automatically; bypassing it needs `DomSanitizer` (M6).
- **In my project:** practice `welcome.js` builds cards with `createElement` + `textContent`; `login.js` shows errors with `textContent`. In the Angular app we never touch the DOM directly — templates bind instead (project rule: no `document.querySelector`).
- **30-second answer:**
  > "textContent sets plain text and is what I use for anything from a user or an API. innerHTML parses a string as HTML, so if it contains a script tag or an onerror attribute it can run code — that's XSS. In Angular I almost never touch the DOM: interpolation escapes text automatically, and [innerHTML] goes through Angular's sanitizer."
- **Follow-ups:**
  - _Why avoid `document.querySelector` in Angular?_ — It bypasses Angular's view, breaks with SSR and is hard to test; use bindings or `viewChild()`.
  - _innerText vs textContent?_ — innerText respects CSS (hidden text is skipped) and triggers layout; textContent is raw and faster.
- **Common mistakes:** building HTML strings with user data; using `innerHTML` to set plain text.

### 17. Closures

- **What & why:** a function "remembers" the variables of the scope it was created in, even after that scope has finished. Used for private state and factories.
- **React comparison:** every React hook relies on closures (and stale closures are a classic React bug). Angular classes use private fields instead, so closures matter less day to day — but RxJS callbacks and functional guards/interceptors are closures.
- **In my project:** practice `auth.js` `createAttemptCounter(max)` — `attempts` is private; Angular `interceptors.ts` — each `HttpInterceptorFn` closes over injected services.
- **30-second answer:**
  > "A closure is a function plus the variables it captured from where it was created. It's how JavaScript does private state: in our practice login, createAttemptCounter returns methods that share a private attempts variable nobody else can touch. In Angular, functional interceptors and guards are closures over the services they inject."
- **Follow-ups:**
  - _Classic closure bug?_ — `var` in a loop: all callbacks share one variable (see topic 12).
  - _Memory risk?_ — A closure keeps its captured variables alive; long-lived listeners can leak.
- **Common mistakes:** stale values captured in callbacks; accidental leaks via event listeners.

### 18. `this`

- **What & why:** in a regular function/method, `this` is the object **before the dot** at call time. Arrow functions don't have their own `this` — they use the surrounding one. Classes: `this` = the instance.
- **React comparison:** class components needed `.bind(this)`; hooks removed `this` entirely. Angular is class-based, so `this.authStore`, `this.form`, etc. are everywhere.
- **In my project:** practice `welcome.js` `page.title()` uses `this.greeting`; every Angular component/service (`this.isPending.set(true)` in `login-form.ts`).
- **30-second answer:**
  > "this is decided by how a function is called: obj.method() sets this to obj. Arrow functions don't bind their own this, they inherit it, which is why I use arrows for callbacks inside Angular classes — inside a subscribe or setTimeout callback, this still points to the component."
- **Follow-ups:**
  - _Why do callbacks lose `this`?_ — Passing `obj.method` detaches it from `obj`; use an arrow or `.bind(obj)`.
  - _`this` at the top of an ES module?_ — `undefined`.
- **Common mistakes:** passing `this.method` as a callback without an arrow.

### 19. The event loop

- **What & why:** JavaScript runs one thing at a time. Order: all **synchronous** code → all **microtasks** (Promise `.then`, `await` continuations) → one **macrotask** (`setTimeout`, events) → repeat.
- **React comparison:** same engine. Relevant to Angular because change detection runs after async work completes (with Zone.js it patched these APIs; our app is **zoneless** and relies on signals instead).
- **In my project:** practice `welcome.js` prints `1 sync → 4 sync → 3 microtask → 2 macrotask` (verified in the browser console).
- **30-second answer:**
  > "JavaScript is single-threaded. The event loop runs all synchronous code first, then empties the microtask queue — promise callbacks — and only then takes the next macrotask like a setTimeout. So a Promise.then always runs before a setTimeout of zero. Long synchronous work blocks everything, including clicks and rendering."
- **Follow-ups:**
  - _How to keep the UI responsive during heavy work?_ — Split it into chunks, use a Web Worker, or (for libs) `runOutsideAngular` (M7).
  - _What did Zone.js do?_ — It patched async APIs so Angular knew when to run change detection; zoneless apps use signals instead.
- **Common mistakes:** assuming `setTimeout(fn, 0)` runs immediately; heavy loops on the main thread.

### 20. ES modules

- **What & why:** each file is a module with its own scope; `export` shares, `import` uses. Enables tree-shaking (unused exports are dropped from the bundle) and lazy loading via dynamic `import()`.
- **React comparison:** identical.
- **In my project:** practice `<script type="module">` + `js/auth.js` exports; Angular lazy routes `loadComponent: () => import('./features/welcome/welcome-page')` — each becomes its own chunk (see `ng build` output: `welcome-page`, `login-page` chunks).
- **30-second answer:**
  > "ES modules give every file its own scope and explicit imports and exports. That lets bundlers tree-shake unused code, and dynamic import() lets us load code on demand. Angular's lazy routes use exactly that: each loadComponent creates a separate chunk that's only downloaded when you visit the page."
- **Follow-ups:**
  - _Named vs default export?_ — Named exports are explicit and refactor-safe; Angular style uses named exports.
  - _Why didn't `type="module"` work from `file://`?_ — Modules need an HTTP server (CORS); hence `npx http-server` for the practice pages.
- **Common mistakes:** circular imports; huge barrel files that defeat tree-shaking.

---

## M1 — TypeScript

### 21. Types, interfaces and type inference

- **What & why:** TypeScript adds compile-time types to JS; they disappear in the output. `interface` describes object shapes (extendable); `type` can name anything (unions, tuples). Inference means you rarely annotate local variables.
- **React comparison:** the React project was already TypeScript — that's why its models moved over unchanged.
- **In my project:** `core/auth/auth.models.ts` (`interface User`, `type Role`); all `features/*/models/*.models.ts` (ported from React); `practice/.../ts/typescript-fundamentals.ts` §1–2.
- **30-second answer:**
  > "TypeScript catches mistakes at compile time — wrong property names, missing fields, null access — and gives editor autocomplete. I use interfaces for data models like API responses and type aliases for unions like our Role type. When we migrated, all the React model files moved to Angular unchanged, because types have nothing to do with the framework."
- **Follow-ups:**
  - _interface vs type?_ — Interfaces can be extended/merged and are clearer for object shapes; types are needed for unions, tuples and mapped types.
  - _`any` vs `unknown`?_ — `any` disables checking; `unknown` forces you to narrow before use.
- **Common mistakes:** `any` everywhere; annotating what TS already infers.

### 22. Union / literal types, narrowing and enums

- **What & why:** `'admin' | 'guest'` restricts a value to exact options. Narrowing (`if`, `switch`, `typeof`, discriminant fields) lets TS know which option you have. Enums are named constants that exist at runtime.
- **React comparison:** same TS.
- **In my project:** `Role` union (`auth.models.ts`); `ROUTES ... as const` (`routes.ts`); exhaustive `switch` with `never`, discriminated union `LoadState<T>`, `enum WizardStep` / `WorkflowStatus` (`practice/.../ts/typescript-fundamentals.ts` §3–4). Angular's own enums: `ChangeDetectionStrategy.OnPush`, `ViewEncapsulation.Emulated`.
- **30-second answer:**
  > "A literal union like our Role type lists exactly which strings are allowed, so a typo is a compile error. With a switch and a never check, adding a new role forces me to handle it everywhere. I prefer unions over enums for API data because they match the JSON directly and vanish after compiling, but I use enums where they help readability — Angular itself uses them, like ChangeDetectionStrategy.OnPush."
- **Follow-ups:**
  - _What is a discriminated union?_ — Union members share a tag field (`kind`); checking it narrows to one member.
  - _`const enum`?_ — Inlined at compile time; problematic with `isolatedModules`, so avoid it.
- **Common mistakes:** numeric enums for API values; `default:` cases that hide unhandled options.

### 23. Generics

- **What & why:** type parameters (`<T>`) let one function/class/interface work with many types while staying type-safe.
- **React comparison:** `useState<string>()`, `useQuery<User>()`. Angular: `signal<string | null>(null)`, `http.get<LoginResponse>()`, `input.required<HeroSection>()`.
- **In my project:** `http.post<LoginResponse>` (`auth.service.ts`), `signal<'exchanging' | 'error'>` (`callback-page.ts`), `HttpContextToken<boolean>` (`http-context.ts`), `ApiEnvelope<T>`, `findById<T extends { id: string }>` (`practice/.../ts/typescript-fundamentals.ts` §6).
- **30-second answer:**
  > "Generics are type parameters. Instead of writing a getUsers and a getKpis function with the same logic, I write one generic function and the caller says which type flows through. Angular uses them everywhere — http.get<LoginResponse> types the response, and signal<string | null> types the state. Constraints like T extends { id: string } let me require certain fields."
- **Follow-ups:**
  - _Does `http.get<User>()` validate the response?_ — No! It's a compile-time promise only; the server could send anything. Validate at runtime (e.g. zod) if it matters.
  - _Default type parameter?_ — `interface Page<T = unknown>`.
- **Common mistakes:** believing generics check runtime data; `<any>` everywhere.

### 24. Optional chaining and nullish coalescing

- **What & why:** `a?.b?.c` stops and returns `undefined` if anything is null/undefined. `x ?? 'default'` falls back **only** for null/undefined (`||` also replaces `0`, `''`, `false`).
- **React comparison:** same TS.
- **In my project:** `this.user()?.name ?? ''` (`header.ts`, `welcome-page.ts`), `localStorage.getItem(...) ?? …` (practice `auth.js`).
- **30-second answer:**
  > "Optional chaining safely reads nested values that might be missing, and nullish coalescing provides a default only when a value is null or undefined. I prefer ?? over || because || would also replace legitimate values like 0 or an empty string — for example a page number of 0."
- **Follow-ups:**
  - _Can you assign with `?.`?_ — No; it's for reading. Use `??=` to assign only if nullish.
  - _Does `?.` hide bugs?_ — It can; use it only where the value can genuinely be missing.
- **Common mistakes:** `count || 10` turning a real 0 into 10; sprinkling `?.` on values that are never null.

### 25. Utility types

- **What & why:** built-in type transformers: `Partial<T>` (all optional), `Required<T>`, `Pick<T, K>`, `Omit<T, K>`, `Readonly<T>`, `Record<K, V>`, `ReturnType<F>`.
- **React comparison:** same TS (`Partial<Props>` for defaults is common in React).
- **In my project:** `Record<Role, string>` role labels (practice §7 — forgetting a role fails to compile); `Partial<User>` for PATCH bodies; `Omit<User, 'id' | 'status'>` for create payloads; `Pick<User, 'name' | 'email' | 'role'>` for a card.
- **30-second answer:**
  > "Utility types derive new types from existing ones so I don't duplicate interfaces. Partial makes everything optional — handy for PATCH requests; Pick and Omit select or drop fields — like a create payload without the id; and Record<Role, string> guarantees an entry for every role, so adding a role later breaks the build until the label exists."
- **Follow-ups:**
  - _Partial vs optional fields?_ — Partial derives from the full type, so it stays in sync when the model changes.
  - _Make a deep readonly?_ — Not built in; write a recursive mapped type or use `as const` for literals.
- **Common mistakes:** copy-pasting interfaces instead of deriving them.

### 26. Decorators

- **What & why:** functions prefixed with `@` that attach metadata or behaviour to a class/member. Angular uses them to turn plain classes into components and services: `@Component`, `@Injectable`, `@Directive`, `@Pipe` (older code also `@Input`, `@Output`, `@HostListener`, `@ViewChild`).
- **React comparison:** React has none (function components). This is one of the biggest visual differences.
- **In my project:** every component (`@Component` in `login-form.ts`), services (`@Injectable` in `auth.store.ts`); a custom `@Feature('login')` class decorator in `practice/.../ts/typescript-fundamentals.ts` §8. Enabled by `"experimentalDecorators": true` in `tsconfig.json`.
- **30-second answer:**
  > "A decorator is a function that receives a class or member and attaches metadata or behaviour to it. Angular's compiler reads @Component metadata — the selector, template and imports — to know how to render the class. Modern Angular moved many member decorators to functions, like input() instead of @Input(), but @Component and @Injectable are still decorators."
- **Follow-ups:**
  - _Why did Angular move to `input()`/`inject()`?_ — They're signal-based, type-infer better and work in functions (guards, interceptors).
  - _Do decorators run at runtime?_ — Yes, once when the class is defined; Angular's AOT compiler also processes the metadata at build time.
- **Common mistakes:** forgetting the decorator (a plain class can't be injected); mixing up `@Component` imports vs NgModule declarations.

### 27. Strict mode and tsconfig

- **What & why:** `tsconfig.json` configures the compiler. `"strict": true` enables `strictNullChecks`, `noImplicitAny`, `strictPropertyInitialization`, etc. We also use `noUncheckedIndexedAccess` (array indexing returns `T | undefined`), `exactOptionalPropertyTypes`, and Angular's `strictTemplates` (type-checks HTML templates too).
- **React comparison:** the React project had the same strict flags — we matched them. `strictTemplates` has no React equivalent (JSX is already TypeScript).
- **In my project:** `tsconfig.json` (`strict`, `noUnusedLocals`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `strictTemplates`, `strictStandalone`, `paths` aliases `@core/*`, `@features/*`); `practice/.../ts/tsconfig.json` with a comment per flag.
- **30-second answer:**
  > "tsconfig controls how strictly TypeScript checks the code. We run full strict mode, so null and undefined must be handled explicitly and nothing is implicitly any. We also enable noUncheckedIndexedAccess, so reading array[0] forces a check, and Angular's strictTemplates, so even the HTML templates are type-checked. When I turned strict mode on during the migration, all 1,400 lines of ported models compiled without changes."
- **Follow-ups:**
  - _Enabling strict on a legacy project?_ — Turn it on per flag (start with `strictNullChecks`), fix errors incrementally, or use `// @ts-expect-error` temporarily.
  - _What are `paths`?_ — Import aliases (`@core/auth/...`) instead of `../../../`.
- **Common mistakes:** `!` non-null assertions everywhere to silence errors; turning strict off "to get it compiling".
