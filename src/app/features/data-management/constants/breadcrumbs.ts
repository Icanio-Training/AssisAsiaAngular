// Ported from the React app: constants/breadcrumbs.ts.
// Trails mirror the sidebar: Data Management › section › item › [record].
import { ROUTES } from '@core/constants/routes';
import type { BreadcrumbItem } from '@shared/ui/breadcrumbs';

const ROOT: BreadcrumbItem = { label: 'Data Management', path: ROUTES.DATA_MANAGEMENT };

/** Data Management › Add Data › Upload Data [› …rest] */
export function uploadDataTrail(...rest: BreadcrumbItem[]): BreadcrumbItem[] {
  return [
    ROOT,
    { label: 'Add Data' },
    { label: 'Upload Data', path: ROUTES.DATA_MANAGEMENT },
    ...rest,
  ];
}

/** Data Management › My Data › {tool} [› …rest] */
export function myDataTrail(
  tool: { id: string; title: string },
  ...rest: BreadcrumbItem[]
): BreadcrumbItem[] {
  return [
    ROOT,
    { label: 'My Data' },
    { label: tool.title, path: `${ROUTES.DATA_MANAGEMENT}/my-data/${tool.id}` },
    ...rest,
  ];
}

/** Data Management › Submitted Data › {tool} [› …rest] */
export function submittedDataTrail(
  tool: { id: string; title: string },
  ...rest: BreadcrumbItem[]
): BreadcrumbItem[] {
  return [
    ROOT,
    { label: 'Submitted Data' },
    { label: tool.title, path: `${ROUTES.DATA_MANAGEMENT}/submitted/${tool.id}` },
    ...rest,
  ];
}

/** Long record titles are shortened when they're not the last crumb. */
export function truncateLabel(label: string, max = 40): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}
