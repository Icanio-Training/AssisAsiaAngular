// =============================================================================
// M1 — TypeScript fundamentals, using the REAL ADME models.
// Type-check:  npx tsc -p practice/m1-web-fundamentals/ts
// Every section says where the same idea appears in the Angular project.
// =============================================================================

import type { Role, User, UserProfileResponse } from '../../../src/app/core/auth/auth.models';

// -----------------------------------------------------------------------------
// 1. BASIC TYPES + INFERENCE
// -----------------------------------------------------------------------------
const appName = 'ADME';
const pageSize = 10; // inferred as `number` — no annotation needed
const isAdmin = false;
const years: number[] = [2024, 2025, 2026];
const pair: [string, number] = ['Tool', 1]; // tuple: fixed length, fixed types
const notYetKnown: unknown = JSON.parse('{"a":1}'); // `unknown` forces a check before use (safer than `any`)
if (typeof notYetKnown === 'object' && notYetKnown !== null) {
  console.log('narrowed keys:', Object.keys(notYetKnown));
}

// -----------------------------------------------------------------------------
// 2. INTERFACE vs TYPE
//    interface — object shapes; can be extended and merged. Used for models/DTOs.
//    type      — anything: unions, tuples, mapped types. Used for Role, status unions.
//    Project: core/auth/auth.models.ts (interfaces User, LoginResponse; type Role).
// -----------------------------------------------------------------------------
interface ToolCard {
  readonly id: string; // readonly: can't be reassigned after creation
  title: string;
  description?: string; // optional: may be missing
}

interface KpiToolCard extends ToolCard {
  adminOnly: true;
}

type ToolId = 'sectoral-work-plan' | 'follow-up-actions' | 'ascc-kpis';

// -----------------------------------------------------------------------------
// 3. UNION + LITERAL TYPES and NARROWING
//    Project: `Role` = 'public' | 'guest' | 'contributor' | 'content_manager' | 'admin'
// -----------------------------------------------------------------------------
function roleLabel(role: Role): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'content_manager':
      return 'Content Manager';
    case 'contributor':
      return 'Contributor';
    case 'guest':
      return 'Guest';
    case 'public':
      return 'Public';
    default: {
      // Exhaustiveness check: if a new Role is added and not handled above,
      // this line stops compiling. `never` = "this can't happen".
      const unreachable: never = role;
      return unreachable;
    }
  }
}

// Discriminated union — each variant has a `kind` tag TypeScript can switch on.
// Project (coming in M2): VideoSource / chart drill params use this pattern.
type LoadState<T> =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'loaded'; data: T };

function describe(state: LoadState<User[]>): string {
  if (state.kind === 'loaded') return `${state.data.length} users`; // `data` exists only here
  if (state.kind === 'error') return state.message;
  return 'Loading…';
}

// -----------------------------------------------------------------------------
// 4. ENUMS (and why the project prefers literal unions)
//    An enum is a real runtime object; a literal union disappears after compiling
//    and matches the JSON the API sends ('admin', not 0). Angular uses enums itself:
//    ChangeDetectionStrategy.OnPush, ViewEncapsulation.Emulated, HttpEventType.UploadProgress.
// -----------------------------------------------------------------------------
enum WizardStep {
  ChooseDatabase = 1,
  EnterData = 2,
  ReviewAndSubmit = 3,
}

enum WorkflowStatus {
  Draft = 'draft',
  PendingApproval = 'pending_for_approval',
  Published = 'published',
}

const step: WizardStep = WizardStep.EnterData;
const status: WorkflowStatus = WorkflowStatus.Draft;

// -----------------------------------------------------------------------------
// 5. OPTIONAL CHAINING (?.) and NULLISH COALESCING (??)
//    Project: header.ts → `this.user()?.name ?? ''`
// -----------------------------------------------------------------------------
function firstSectoralBody(user: User | null): string {
  return user?.sectoralBodies[0]?.name ?? 'No sectoral body';
  // ?? only falls back on null/undefined. `||` would ALSO replace '' and 0 — a classic bug.
}

// -----------------------------------------------------------------------------
// 6. GENERICS — one function/type that works for many types, still fully typed.
//    Project: http.get<LoginResponse>(...), signal<string | null>(null), input.required<HeroSection>()
// -----------------------------------------------------------------------------
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  return envelope.data;
}

interface Page<T> {
  items: T[];
  total: number;
  page: number;
}

function firstItem<T>(page: Page<T>): T | undefined {
  return page.items[0]; // `| undefined` because of noUncheckedIndexedAccess (tsconfig)
}

// Generic constraint: T must have an `id`. Project: @for (...; track item.id)
function findById<T extends { id: string }>(items: readonly T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

// -----------------------------------------------------------------------------
// 7. UTILITY TYPES
// -----------------------------------------------------------------------------
type UserPatch = Partial<User>; // every field optional — e.g. an "edit profile" PATCH body
type UserCard = Pick<User, 'name' | 'email' | 'role'>; // only these fields
type NewUser = Omit<User, 'id' | 'status'>; // everything except these
type RoleLabels = Record<Role, string>; // object with a key for EVERY role
type FrozenUser = Readonly<User>; // no field can be reassigned
type CompleteProfile = Required<UserProfileResponse>; // remove every `?`

const ROLE_LABELS: RoleLabels = {
  public: 'Public',
  guest: 'Guest',
  contributor: 'Contributor',
  content_manager: 'Content Manager',
  admin: 'Admin',
}; // forgetting a role here is a compile error — that's why Record<Role, …> is used

// -----------------------------------------------------------------------------
// 8. DECORATORS — functions that attach metadata/behaviour to a class.
//    Angular's @Component, @Injectable, @Directive, @Pipe are decorators.
//    (Enabled by "experimentalDecorators": true in tsconfig — Angular needs it.)
// -----------------------------------------------------------------------------
const registry = new Map<string, unknown>();

function Feature(name: string) {
  return function <T extends new (...args: never[]) => object>(target: T): T {
    registry.set(name, target); // like Angular registering a component's metadata
    return target;
  };
}

@Feature('login')
class LoginFeature {
  readonly route = '/login';
}

// -----------------------------------------------------------------------------
// 9. CLASSES with access modifiers — the shape of every Angular service/component.
//    Project: core/auth/auth.store.ts
// -----------------------------------------------------------------------------
class SessionStore {
  private token: string | null = null; // only this class can touch it
  protected readonly storageKey = 'session'; // this class + subclasses
  public isLoggedIn(): boolean {
    // public is the default
    return this.token !== null;
  }
  setToken(token: string): void {
    this.token = token;
  }
}

// -----------------------------------------------------------------------------
// 10. TYPING ASYNC CODE — the JS `login()` from js/auth.js, typed.
// -----------------------------------------------------------------------------
async function login(email: string, password: string): Promise<UserCard> {
  await new Promise<void>((resolve) => setTimeout(resolve, 10));
  if (!email.includes('@') || password.length < 6) throw new Error('Invalid email or password.');
  return { name: 'Aisha Rahman', email, role: 'admin' };
}

// -----------------------------------------------------------------------------
// Use everything once so the strict compiler flags (noUnusedLocals) are happy.
// -----------------------------------------------------------------------------
const store = new SessionStore();
store.setToken('demo');
const kpiCard: KpiToolCard = {
  id: 'ascc-kpis',
  title: 'ASCC Strategic Plan KPIs',
  adminOnly: true,
};
const tool: ToolId = 'ascc-kpis';
const patch: UserPatch = { name: 'New name' };
const newUser: NewUser = { name: 'A', email: 'a@b.c', role: 'guest', sectoralBodies: [], ams: [] };
const frozen: FrozenUser = { ...newUser, id: '9' }; // spread = immutable copy, original untouched

console.log(
  appName,
  pageSize,
  isAdmin,
  years,
  pair,
  roleLabel('admin'),
  describe({ kind: 'loading' }),
  step,
  status,
  firstSectoralBody(null),
  unwrap({ success: true, message: 'OK', data: 1 }),
  firstItem({ items: ['a'], total: 1, page: 1 }),
  findById([kpiCard], tool),
  patch,
  frozen,
  ROLE_LABELS.admin,
  new LoginFeature().route,
  registry.size,
  store.isLoggedIn(),
  void login('admin@adme.test', 'Adme@2026'),
);

export type { CompleteProfile };
