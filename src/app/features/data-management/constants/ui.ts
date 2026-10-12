// Ported from the React app: constants/buttonClasses.ts + components/asccKpi/fieldStyles.ts.
// Tailwind class strings shared by every Data Management page so the wizards look identical.

export const PRIMARY_BUTTON_CLASS =
  'inline-flex h-11 items-center gap-2 rounded-lg bg-[#0063AF] px-5 text-sm font-bold whitespace-nowrap text-white transition-colors hover:bg-[#004d87] disabled:cursor-not-allowed disabled:opacity-50';
export const SECONDARY_BUTTON_CLASS =
  'inline-flex h-11 items-center gap-2 rounded-lg border border-[#D4D4D4] bg-white px-5 text-sm font-bold whitespace-nowrap text-[#344054] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50';
export const GHOST_BUTTON_CLASS =
  'inline-flex h-11 items-center gap-2 rounded-lg border border-[#D4D4D4] bg-white px-5 text-sm font-bold whitespace-nowrap text-[#344054] transition-colors hover:bg-[#F9FAFB]';
export const DANGER_BUTTON_CLASS =
  'inline-flex h-11 items-center gap-2 rounded-lg border border-[#D4D4D4] bg-white px-5 text-sm font-semibold whitespace-nowrap text-[#D92D20] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50';

export const INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[#D4D4D4] bg-white px-3.5 text-sm text-[#101828] outline-none focus:border-[#0063AF]';
export const SELECT_CLASS = `${INPUT_CLASS} cursor-pointer`;
export const TEXTAREA_CLASS =
  'min-h-[80px] w-full resize-y rounded-lg border border-[#D4D4D4] bg-white px-3.5 py-3 text-sm text-[#101828] outline-none focus:border-[#0063AF]';
export const CELL_INPUT_CLASS =
  'w-full rounded-md border border-[#D4D4D4] bg-white px-2.5 py-1.5 text-[13px] text-[#101828] outline-none focus:border-[#0063AF]';
export const LABEL_CLASS = 'mb-1.5 block text-[13px] font-medium text-[#344054]';
export const ERROR_CLASS = 'mt-1 text-xs text-[#D92D20]';
export const SECTION_HEADING_CLASS = 'mb-5 text-base font-bold text-[#101828]';
export const EYEBROW_CLASS = 'text-xs font-bold tracking-[0.05em] text-[#667085] uppercase';
export const OUTLINE_BUTTON_CLASS =
  'h-9 rounded-lg border border-[#0063AF] bg-white px-3.5 text-[13px] font-bold text-[#0063AF] transition-colors hover:bg-[#F0F5FF] disabled:cursor-not-allowed disabled:border-[#EAECF0] disabled:text-[#D0D5DD] disabled:hover:bg-white';
export const DANGER_OUTLINE_BUTTON_CLASS =
  'h-9 rounded-lg border border-[#D4D4D4] bg-white px-3.5 text-[13px] font-bold text-[#D92D20] transition-colors hover:bg-[#FEF3F2] disabled:cursor-not-allowed disabled:border-[#EAECF0] disabled:text-[#D0D5DD] disabled:hover:bg-white';
export const EMPTY_HINT_CLASS =
  'rounded-lg border border-dashed border-[#D4D4D4] bg-[#F9FAFB] px-4 py-5 text-center text-[13px] text-[#667085]';
export const TH_CLASS =
  'border-b border-[#EAECF0] bg-[#F9FAFB] px-4 py-3 text-left whitespace-nowrap text-[11px] font-bold tracking-[0.04em] text-[#667085] uppercase';
export const TD_CLASS = 'border-b border-[#F2F4F7] px-4 py-2.5';
export const PAGE_CLASS = 'block px-10 pt-10 pb-16';
