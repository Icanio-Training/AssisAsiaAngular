import { TestBed } from '@angular/core/testing';

import type { DeepAnalysisChart } from '../models/blueprint-kpi.models';
import { KpiProgressChart } from './kpi-progress-chart';

const chart: DeepAnalysisChart = {
  id: 1,
  chartType: 'line',
  chartTitle: 'Broadband access (%)',
  yAxis: null,
  years: null,
  identifiedDataSource: null,
  memberStateData: {
    baseline: {
      year: 2025,
      rows: [
        { country_code: 'KH', country_name: 'Cambodia', value: 40 },
        { country_code: 'ID', country_name: 'Indonesia', value: 60 },
      ],
    },
    midterms: [{ year: 2028, rows: [{ country_code: 'KH', country_name: 'Cambodia', value: 55 }] }],
    endterm: null,
  },
};

function render(input: DeepAnalysisChart) {
  const fixture = TestBed.createComponent(KpiProgressChart);
  fixture.componentRef.setInput('chart', input);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('KpiProgressChart', () => {
  it('renders one legend button and one line per member state', () => {
    const { el } = render(chart);
    const legend = el.querySelectorAll('button[aria-pressed]');
    expect(legend).toHaveLength(2);
    expect(el.querySelectorAll('svg g[data-series]')).toHaveLength(2);
    // Indonesia has no 2028 value → "—" in the table.
    expect(el.querySelector('tr[data-series="ID"]')?.textContent).toContain('—');
  });

  it('toggles a series off and on from the legend', () => {
    const { fixture, el } = render(chart);
    const button = el.querySelector<HTMLButtonElement>('button[aria-pressed]');
    expect(button?.getAttribute('aria-pressed')).toBe('true');

    button?.click();
    fixture.detectChanges();
    expect(button?.getAttribute('aria-pressed')).toBe('false');
    expect(el.querySelector('svg g[data-series="KH"]')?.getAttribute('class')).toContain(
      'opacity-0',
    );

    button?.click();
    fixture.detectChanges();
    expect(button?.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows "No Data Available" when no period has numbers', () => {
    const { el } = render({ ...chart, memberStateData: null });
    expect(el.textContent).toContain('No Data Available');
  });
});
