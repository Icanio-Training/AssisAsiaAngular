// Ported from the React app: utils/detailToFormValues.ts — bridges a fetched detail record
// (display names) back into the form's id-based values for the edit pages.
import { AMS_COUNTRIES } from '../constants/countries';
import type { FollowUpActionValues } from '../forms/follow-up-action.form';
import type { SectoralWorkPlanValues } from '../forms/sectoral-work-plan.form';
import type { ActivitySubmissionDetail } from '../models/activity-detail.models';
import type { DeclarationSubmissionDetail } from '../models/declaration-detail.models';
import type { DropdownOption } from '../services/activities.service';
import type { DeclarationDropdowns, InitiativeDropdowns } from '../services/lookups.service';
import { formatSdg } from '../validators/form.validators';

function idByName(options: readonly DropdownOption[], name: string | undefined | null): string {
  if (!name) return '';
  const match = options.find((o) => String(o.name) === name);
  return match ? String(match.id) : '';
}

export function activityDetailToFormValues(
  detail: ActivitySubmissionDetail,
  dropdowns: InitiativeDropdowns,
): SectoralWorkPlanValues {
  return {
    sectoralBodyId: idByName(dropdowns.sectoralBodies, detail.sectoralBody),
    no: detail.no ?? '',
    workplanStart: detail.workplanStart ? String(detail.workplanStart) : '',
    workplanComplete: detail.workplanComplete ? String(detail.workplanComplete) : '',
    programme: detail.programme ?? '',
    activity: detail.activity,
    activityTypeId: idByName(dropdowns.activityTypes, detail.activityType),
    frequencyId: idByName(dropdowns.frequencies, detail.frequency),
    statusId: idByName(dropdowns.statuses, detail.status),
    strategicMeasureIds: detail.correspondingStrategicMeasures.map((m) => String(m.id)),
    indicator: detail.indicator ?? '',
    remarks: detail.remarks ?? '',
  };
}

export function declarationDetailToFormValues(
  detail: DeclarationSubmissionDetail,
  dropdowns: DeclarationDropdowns,
): FollowUpActionValues {
  return {
    title: detail.title,
    implementingSectoralBodyIds: detail.implementingSectoralBodies
      .map((name) => idByName(dropdowns.body, name))
      .filter((id) => id !== ''),
    sectorId: idByName(dropdowns.sector, detail.sector),
    followUpStatus: detail.followUpStatus ?? '',
    fileUrl: detail.fileUrl ?? '',
    typeId: idByName(dropdowns.type, detail.type),
    adoptionLevelId: idByName(dropdowns.level, detail.adoption),
    year: detail.year ? String(detail.year) : '',
    chairId: idByName(dropdowns.chair, detail.chair),
    sectoralBodyEntity: detail.sectoralBodyEntity,
    sdgs: [...new Set(detail.sdgs.map(formatSdg))],
    remarks: detail.remarks ?? '',
    isPublic: detail.isPublic,
    regionalImplementations: detail.regionalActions.map((text) => ({ text })),
    nationalImplementations: AMS_COUNTRIES.map((country) => {
      const match = detail.countries.find((c) => c.code === country.code);
      return {
        country: country.name,
        code: country.code,
        items: (match?.actions ?? []).map((text) => ({ text })),
      };
    }),
  };
}
