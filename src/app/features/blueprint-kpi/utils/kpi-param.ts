/** `?kpi=` must be a positive integer, otherwise it is ignored (React: validateSearch). */
export function parseKpiParam(value: string | undefined): number | null {
  if (value === undefined) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
