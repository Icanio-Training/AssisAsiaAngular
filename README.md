# ADME Portal — Angular

Angular 22 migration of the ADME Portal React app (`C:\ADME\ADME-Portal-frontend`), built milestone by milestone as interview preparation.
Standalone components · signals · new control flow (`@if` / `@for`) · strict TypeScript · zoneless · Tailwind 4.

**Scope:** Login/Logout · Initiatives (Tool 1) · Outcome Documents (Tool 2) · Strategic Plan KPIs (Tool 3) · Data Management.

## Run it

Requires Node 24+ (`node -v`). From this folder:

```bash
npm install          # first time only
npm start            # dev server → http://localhost:4200
```

No backend is needed: in development, `environment.useMocks = true` and API calls are answered by the
mock backend in `src/app/core/mock-api/`. Test accounts (one per role) are listed in
`src/app/core/mock-api/mock-users.ts`. To use the real Laravel API on `http://localhost:8000` instead, set
`useMocks: false` in `src/environments/environment.development.ts` — `proxy.conf.json` forwards `/api` to it.

| Command                     | What it does                                       |
| --------------------------- | -------------------------------------------------- |
| `npm start`                 | dev server with live reload                        |
| `npx ng build`              | production build → `dist/`                         |
| `npx ng test --watch=false` | unit tests (Vitest) once                           |
| `npx ng lint`               | ESLint (TypeScript + template accessibility rules) |

> If Windows reports _"An Application Control policy has blocked this file"_ on the first build, run it again —
> Smart App Control blocks a new native binary until its reputation check passes.

### M1 practice pages (plain HTML/CSS/JS)

```bash
npx http-server . -p 5500 -c-1
```

Open http://localhost:5500/practice/m1-web-fundamentals/login.html (ES modules and `fetch` need a server, not `file://`).
Type-check the TypeScript lesson: `npx tsc -p practice/m1-web-fundamentals/ts`.

## Folder structure

```
src/
├─ environments/                 environment.ts (prod) / environment.development.ts (ng serve)
├─ styles.css                    Tailwind theme + global styles
└─ app/
   ├─ app.config.ts              providers: router, HttpClient + interceptors
   ├─ app.routes.ts              the route tree
   ├─ core/                      app-wide singletons
   │  ├─ auth/                   AuthStore (signals), AuthService, guards, models
   │  ├─ http/                   interceptors (base URL, token, 401, envelope)
   │  ├─ mock-api/               dev-only mock backend
   │  ├─ config/  constants/     APP_CONFIG, ROUTES, nav config
   ├─ layout/                    AppLayout, Header, SiteFooter
   └─ features/                  one folder per feature
      ├─ auth/                   login + SSO callback pages
      ├─ welcome/                temporary landing page (until Initiatives is migrated)
      ├─ initiatives/  outcome-documents/  blueprint-kpi/  data-management/
      │                          models/ now; pages, components, services as they are migrated
practice/m1-web-fundamentals/    M1 HTML/CSS/JS/TS practice (not part of the Angular build)
```

## Learning docs

| File                 | Purpose                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `MIGRATION_MAP.md`   | every React file → its Angular file and the concept used                                   |
| `INTERVIEW_GUIDE.md` | per topic: what/why, React comparison, where in this project, 30-second answer, follow-ups |
| `CHEATSHEETS.md`     | quick-reference tables                                                                     |
| `WEAK_TOPICS.md`     | topics to revisit after each milestone quiz                                                |

Code comments that teach a concept use this format:
`// CONCEPT: <name> | REACT: <equivalent> | INTERVIEW: <one line>`
