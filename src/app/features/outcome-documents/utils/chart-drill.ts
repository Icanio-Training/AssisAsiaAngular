import type { DeclarationFilters } from '../models/outcome-documents.models';
import type { DeclarationDropdowns } from '../services/declaration-dropdowns.service';
import { normalizeAmsCode } from './ams-bar-chart';

/**
 * Dashboard charts link to the matrix with human-readable values (`?sector=Health`,
 * `?country=TH`); the filter API wants dropdown ids. Unknown values are ignored.
 * Country codes are normalized on both sides (charts say `CA`, the dropdown says `KH`).
 */
export function drillToFilterPatch(
  dropdowns: DeclarationDropdowns,
  sector: string | undefined,
  country: string | undefined,
): Partial<DeclarationFilters> {
  const patch: Partial<DeclarationFilters> = {};
  if (sector) {
    const match = dropdowns.sector.find((o) => String(o.name) === sector);
    if (match) patch.sector = [match.id];
  }
  if (country) {
    const wanted = normalizeAmsCode(country);
    const match = dropdowns.country.find((o) => o.code && normalizeAmsCode(o.code) === wanted);
    if (match) patch.country = [match.id];
  }
  return patch;
}
