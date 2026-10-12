// Ported from the React chart components (components/charts/*.tsx): the Chart.js data/options
// each <Bar>/<Doughnut> received, as pure builder functions. The Angular components only bind
// the result to the shared <app-chart>.
import type {
  ActiveElement,
  Chart,
  ChartData,
  ChartEvent,
  ChartOptions,
  LegendItem,
  Plugin,
  ScriptableContext,
  TooltipItem,
} from 'chart.js';

import * as S from '../../constants/chart-styles';
import type {
  PeriodCount,
  PeriodRates,
  SectoralBodyCount,
  SectoralBodyRate,
  SectoralBodyStatusItem,
  StrategicGoalBodyItem,
  StrategicGoalCounts,
} from '../../models/initiatives.models';
import { goalLabel, statusBreakdownKey } from '../../utils/initiatives-utils';

export interface ChartConfig {
  data: ChartData;
  options: ChartOptions;
  plugins: Plugin[];
}

/** Pointer cursor over clickable bars/slices. */
function pointerOnHover(event: ChartEvent, elements: ActiveElement[]): void {
  const target = event.native?.target;
  if (target instanceof HTMLElement) target.style.cursor = elements.length ? 'pointer' : 'default';
}

/** Always-visible value above each bar (React registered this globally; here it's per chart). */
function valueLabelsPlugin(opts: {
  color: string;
  font: string;
  offsetY: number;
  suffix?: string;
}): Plugin {
  return {
    id: 'valueLabels',
    afterDatasetsDraw(chart: Chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;
        meta.data.forEach((element, index) => {
          const value = dataset.data[index];
          if (value === null || value === undefined) return;
          const point = element.tooltipPosition(true);
          if (point.x === null || point.y === null) return;
          ctx.save();
          ctx.fillStyle = opts.color;
          ctx.font = opts.font;
          ctx.textAlign = 'center';
          ctx.fillText(`${String(value)}${opts.suffix ?? ''}`, point.x, point.y - opts.offsetY);
          ctx.restore();
        });
      });
    },
  };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const zebraRowBands: Plugin = {
  id: 'zebraRowBands',
  beforeDatasetsDraw(chart: Chart) {
    const { ctx, chartArea } = chart;
    const yScale = chart.scales['y'];
    const rowCount = chart.data.labels?.length ?? 0;
    if (!chartArea || !yScale || rowCount === 0) return;
    const rowHeight = chartArea.height / rowCount;
    ctx.save();
    for (let i = 0; i < rowCount; i += 2) {
      ctx.fillStyle = S.BODY_ZEBRA_ROW_COLOR;
      ctx.fillRect(
        chartArea.left,
        yScale.getPixelForValue(i) - rowHeight / 2,
        chartArea.width,
        rowHeight,
      );
    }
    ctx.restore();
  },
};

function barShadowPlugin(shadow: { color: string; blur: number; offsetY: number }): Plugin {
  return {
    id: 'barShadow',
    beforeDatasetsDraw(chart: Chart) {
      chart.ctx.save();
      chart.ctx.shadowColor = shadow.color;
      chart.ctx.shadowBlur = shadow.blur;
      chart.ctx.shadowOffsetX = 0;
      chart.ctx.shadowOffsetY = shadow.offsetY;
    },
    afterDatasetsDraw(chart: Chart) {
      chart.ctx.restore();
    },
  };
}

/** Rounded pill with the bar's (or stack's) total, drawn just past its end. */
function valueBadgePlugin(valueAt: (chart: Chart, index: number) => number): Plugin {
  return {
    id: 'valueBadge',
    afterDatasetsDraw(chart: Chart) {
      const { ctx } = chart;
      const xScale = chart.scales['x'];
      if (!xScale) return;
      ctx.save();
      ctx.shadowColor = 'transparent';
      chart.getDatasetMeta(0).data.forEach((bar, i) => {
        const value = valueAt(chart, i);
        const x = xScale.getPixelForValue(value) + 9;
        const text = String(value);
        ctx.font = S.BODY_VALUE_BADGE.font;
        const width = ctx.measureText(text).width + 16;
        ctx.fillStyle = S.BODY_VALUE_BADGE.background;
        roundRectPath(ctx, x, bar.y - 9.5, width, 19, 9.5);
        ctx.fill();
        ctx.fillStyle = S.BODY_VALUE_BADGE.textColor;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(text, x + 8, bar.y + 0.5);
      });
      ctx.restore();
    },
  };
}

function verticalGradient(context: ScriptableContext<'bar'>): CanvasGradient | string {
  const { ctx, chartArea } = context.chart;
  if (!chartArea) return S.ACTIVITIES_BAR_GRADIENT.top;
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, S.ACTIVITIES_BAR_GRADIENT.top);
  gradient.addColorStop(1, S.ACTIVITIES_BAR_GRADIENT.bottom);
  return gradient;
}

function horizontalGradient(
  context: ScriptableContext<'bar'>,
  start: string,
  end: string,
): CanvasGradient | string {
  const { ctx, chartArea } = context.chart;
  if (!chartArea) return start;
  const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  return gradient;
}

/** Lightens (pct>0) or darkens (pct<0) a hex colour. */
function shadeColor(hex: string, pct: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const t = pct < 0 ? 0 : 255;
  const p = Math.abs(pct);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(
    (c) => Math.round((t - c) * p) + c,
  );
  return `rgb(${r},${g},${b})`;
}

/** Chart.js option objects are deeply generic per chart type; the shared <app-chart> takes the
    widest type, so each builder states its own type and widens once here. */
function config(
  data: ChartData<'bar'>,
  options: ChartOptions<'bar'>,
  plugins: Plugin[] = [],
): ChartConfig {
  return { data: data as ChartData, options: options as ChartOptions, plugins };
}

// Chart 1 — Number of Activities per Period
export function activitiesPerPeriodConfig(items: readonly PeriodCount[]): ChartConfig {
  return config(
    {
      labels: items.map((i) => i.period),
      datasets: [
        {
          data: items.map((i) => i.count),
          backgroundColor: verticalGradient,
          borderWidth: 0,
          borderRadius: S.ACTIVITIES_BAR_RADIUS,
        },
      ],
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      onHover: pointerOnHover,
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: S.ACTIVITIES_X_TICK_FONT, color: S.ACTIVITIES_X_TICK_COLOR },
        },
        y: {
          beginAtZero: true,
          grid: { color: S.ACTIVITIES_Y_GRID_COLOR },
          border: { display: false },
          ticks: { font: S.ACTIVITIES_Y_TICK_FONT, color: S.ACTIVITIES_Y_TICK_COLOR, precision: 0 },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (item: TooltipItem<'bar'>) => ` ${item.parsed.y} activities` },
        },
      },
    },
    [valueLabelsPlugin(S.ACTIVITIES_VALUE_LABEL)],
  );
}

// Chart 3 — Implementation and Completion Rates per period
export function ratesPerPeriodConfig(items: readonly PeriodRates[]): ChartConfig {
  const dataset = (label: string, values: number[], color: { fill: string; border: string }) => ({
    label,
    data: values,
    backgroundColor: color.fill,
    borderColor: color.border,
    borderWidth: S.RATES_BAR_BORDER_WIDTH,
    borderRadius: S.RATES_BAR_RADIUS,
  });
  return config(
    {
      labels: items.map((i) => i.period),
      datasets: [
        dataset(
          'Completion Rate (%)',
          items.map((i) => i.completionRate),
          S.RATES_COMPLETION_COLOR,
        ),
        dataset(
          'Implementation Rate (%)',
          items.map((i) => i.implementationRate),
          S.RATES_IMPLEMENTATION_COLOR,
        ),
      ],
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      onHover: pointerOnHover,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: S.RATES_TICK_FONT, color: S.RATES_X_TICK_COLOR },
        },
        y: {
          min: 0,
          max: 100,
          grid: { color: S.RATES_Y_GRID_COLOR },
          ticks: {
            stepSize: S.RATES_Y_STEP_SIZE,
            callback: (v) => `${v}%`,
            font: S.RATES_TICK_FONT,
          },
        },
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: S.RATES_TICK_FONT, boxWidth: S.RATES_LEGEND_BOX_WIDTH },
          onClick: () => undefined, // non-interactive legend
        },
        tooltip: {
          callbacks: {
            label: (item: TooltipItem<'bar'>) => ` ${item.dataset.label}: ${item.parsed.y}%`,
          },
        },
      },
    },
    [valueLabelsPlugin({ ...S.RATES_VALUE_LABEL, suffix: '%' })],
  );
}

const bodyTooltip = {
  backgroundColor: S.BODY_TOOLTIP.backgroundColor,
  padding: S.BODY_TOOLTIP.padding,
  cornerRadius: S.BODY_TOOLTIP.cornerRadius,
  titleFont: { ...S.BODY_TOOLTIP.titleFont },
  bodyFont: { ...S.BODY_TOOLTIP.bodyFont },
};

const bodyYScale = {
  grid: { display: false },
  border: { display: false },
  ticks: { font: S.BODY_Y_TICK_FONT, color: S.BODY_Y_TICK_COLOR, padding: 14 },
};

function bodyXScale(max: number) {
  return {
    beginAtZero: true,
    max: max + 1,
    grid: { color: S.BODY_X_GRID_COLOR },
    border: { display: false },
    ticks: {
      font: S.BODY_X_TICK_FONT,
      precision: 0,
      color: S.BODY_X_TICK_COLOR,
      stepSize: 1,
      padding: 6,
    },
  };
}

// Chart 5 — Distribution of Activities per Sectoral Body (rows sorted ascending: largest on top)
export function sectoralBodyConfig(sorted: readonly SectoralBodyCount[]): ChartConfig {
  const max = Math.max(...sorted.map((d) => d.count), 1);
  return config(
    {
      labels: sorted.map((d) => d.code),
      datasets: [
        {
          label: 'Total Activities',
          data: sorted.map((d) => d.count),
          backgroundColor: (c) =>
            horizontalGradient(c, S.BODY_BAR_GRADIENT.start, S.BODY_BAR_GRADIENT.end),
          hoverBackgroundColor: (c) =>
            horizontalGradient(c, S.BODY_BAR_HOVER_GRADIENT.start, S.BODY_BAR_HOVER_GRADIENT.end),
          borderWidth: 0,
          borderRadius: S.BODY_BAR_RADIUS,
          borderSkipped: false,
          barPercentage: S.BODY_BAR_PERCENTAGE,
          categoryPercentage: S.BODY_CATEGORY_PERCENTAGE,
        },
      ],
    },
    {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { ...S.BODY_LAYOUT_PADDING } },
      animation: { duration: 550, easing: 'easeOutQuart' },
      onHover: pointerOnHover,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...bodyTooltip,
          displayColors: false,
          callbacks: {
            title: (items: TooltipItem<'bar'>[]) => items[0]?.label ?? '',
            label: (item: TooltipItem<'bar'>) => {
              const value = Number(item.raw);
              return ` ${value} ${value === 1 ? 'activity' : 'activities'}`;
            },
          },
        },
      },
      scales: { x: bodyXScale(max), y: bodyYScale },
    },
    [
      zebraRowBands,
      barShadowPlugin(S.BODY_BAR_SHADOW),
      valueBadgePlugin((chart, i) => Number(chart.data.datasets[0]?.data[i] ?? 0)),
    ],
  );
}

// Chart 6 — Status of Activities per Sectoral Body (stacked, sorted ascending by total)
export function bodyStatusConfig(sorted: readonly SectoralBodyStatusItem[]): ChartConfig {
  const max = Math.max(...sorted.map((d) => d.total), 1);
  /** Round only the true outer ends of each stacked row (pill look). */
  const edges = (rowIndex: number, statusIndex: number) => {
    const row = sorted[rowIndex];
    const nonZero = S.STATUS_ORDER.map((s, i) => ({
      i,
      count: row ? row.statuses[statusBreakdownKey(s)] : 0,
    })).filter((x) => x.count > 0);
    return {
      first: nonZero[0]?.i === statusIndex,
      last: nonZero[nonZero.length - 1]?.i === statusIndex,
    };
  };
  return config(
    {
      labels: sorted.map((d) => d.code),
      datasets: S.STATUS_ORDER.map((status, statusIndex) => {
        const base = S.STATUS_COLORS[status];
        return {
          label: status,
          data: sorted.map((d) => d.statuses[statusBreakdownKey(status)]),
          backgroundColor: (c: ScriptableContext<'bar'>) =>
            horizontalGradient(c, shadeColor(base, 0.16), shadeColor(base, -0.08)),
          hoverBackgroundColor: shadeColor(base, -0.16),
          borderColor: '#fff',
          borderWidth: 1.5,
          borderRadius: (c: ScriptableContext<'bar'>) => {
            const { first, last } = edges(c.dataIndex, statusIndex);
            const r = S.BODY_STATUS_BAR_RADIUS;
            return {
              topLeft: first ? r : 0,
              bottomLeft: first ? r : 0,
              topRight: last ? r : 0,
              bottomRight: last ? r : 0,
            };
          },
          borderSkipped: false,
          stack: 'total',
          barPercentage: S.BODY_STATUS_BAR_PERCENTAGE,
          categoryPercentage: S.BODY_STATUS_CATEGORY_PERCENTAGE,
        };
      }),
    },
    {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { ...S.BODY_STATUS_LAYOUT_PADDING } },
      animation: { duration: 550, easing: 'easeOutQuart' },
      onHover: pointerOnHover,
      plugins: {
        legend: {
          position: 'top',
          align: 'center',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 9,
            boxHeight: 9,
            font: { family: 'Inter,Arial', size: 12, weight: 600 },
            color: '#334155',
            padding: 20,
            generateLabels: (): LegendItem[] =>
              S.STATUS_ORDER.map((status, i) => ({
                text: `${status}  ${sorted.reduce((sum, d) => sum + d.statuses[statusBreakdownKey(status)], 0)}`,
                fillStyle: S.STATUS_COLORS[status],
                strokeStyle: S.STATUS_COLORS[status],
                fontColor: '#334155',
                pointStyle: 'circle',
                datasetIndex: i,
              })),
          },
        },
        tooltip: {
          ...bodyTooltip,
          callbacks: {
            title: (items: TooltipItem<'bar'>[]) => items[0]?.label ?? '',
            label: (item: TooltipItem<'bar'>) => {
              const row = sorted[item.dataIndex];
              const share = row?.total ? Math.round((Number(item.raw) / row.total) * 100) : 0;
              return ` ${item.dataset.label}: ${Number(item.raw)} (${share}%)`;
            },
          },
        },
      },
      scales: { x: { ...bodyXScale(max), stacked: true }, y: { ...bodyYScale, stacked: true } },
    },
    [
      zebraRowBands,
      barShadowPlugin(S.BODY_STATUS_BAR_SHADOW),
      valueBadgePlugin((chart, i) =>
        chart.data.datasets.reduce(
          (sum, ds) => sum + (typeof ds.data[i] === 'number' ? (ds.data[i] as number) : 0),
          0,
        ),
      ),
    ],
  );
}

// Chart 7 — Implementation & Completion Rates per Sectoral Body (sorted by implementation desc)
export function bodyRatesConfig(rates: readonly SectoralBodyRate[]): ChartConfig {
  const dataset = (label: string, values: number[], color: { fill: string; border: string }) => ({
    label,
    data: values,
    backgroundColor: color.fill,
    borderColor: color.border,
    borderWidth: 1,
    borderRadius: 3,
  });
  const font = { family: 'Inter,Arial', size: 11 };
  return config(
    {
      labels: rates.map((r) => r.code),
      datasets: [
        dataset(
          'Implementation Rate (%)',
          rates.map((r) => r.implementationRate),
          S.BODY_RATE_IMPLEMENTATION_COLOR,
        ),
        dataset(
          'Completion Rate (%)',
          rates.map((r) => r.completionRate),
          S.BODY_RATE_COMPLETION_COLOR,
        ),
      ],
    },
    {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      onHover: pointerOnHover,
      plugins: {
        legend: { position: 'top', labels: { font, boxWidth: 12 }, onClick: () => undefined },
        tooltip: {
          callbacks: {
            title: (items: TooltipItem<'bar'>[]) => rates[items[0]?.dataIndex ?? -1]?.code ?? '',
            label: (item: TooltipItem<'bar'>) => ` ${item.dataset.label}: ${String(item.raw)}%`,
            afterLabel: (item: TooltipItem<'bar'>) => {
              const row = rates[item.dataIndex];
              if (!row) return '';
              return `Total: ${item.datasetIndex === 0 ? row.implementationActivity : row.completionActivity} activities`;
            },
          },
        },
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { callback: (v) => `${v}%`, font },
        },
        y: { grid: { display: false }, ticks: { font } },
      },
    },
  );
}

export const GOAL_IDS = Object.keys(S.GOAL_COLORS) as (keyof StrategicGoalCounts)[];

// Chart 8 — Distribution of Activities under each Strategic Goal (stacked, natural order)
export function goalBodyConfig(items: readonly StrategicGoalBodyItem[]): ChartConfig {
  return config(
    {
      labels: items.map((d) => d.code),
      datasets: GOAL_IDS.map((goalId) => ({
        label: goalLabel(goalId),
        data: items.map((d) => d.goals[goalId]),
        backgroundColor: `${S.goalColor(goalId)}${S.GOAL_BAR_FILL_ALPHA_HEX}`,
        borderColor: S.goalColor(goalId),
        borderWidth: 1,
        borderRadius: 2,
      })),
    },
    {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      onHover: pointerOnHover,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { family: 'Inter', size: 10 }, boxWidth: 12, padding: 5 },
          onClick: () => undefined,
        },
        tooltip: {
          callbacks: {
            title: (t: TooltipItem<'bar'>[]) => items[t[0]?.dataIndex ?? -1]?.code ?? '',
            label: (item: TooltipItem<'bar'>) => ` ${item.dataset.label}: ${String(item.raw)}`,
            footer: (t: TooltipItem<'bar'>[]) =>
              `Total: ${items[t[0]?.dataIndex ?? -1]?.total ?? 0} activities`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { family: 'Inter', size: 11 }, precision: 0 },
        },
        y: {
          stacked: true,
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 10 } },
        },
      },
    },
  );
}

// Donuts (charts 2, 4, 9) — legend is HTML (DonutLegend), the canvas only draws the ring.
export interface DonutSlice {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
  /** false = zero-count measure: listed (greyed) in the legend but not drawn. */
  active: boolean;
}

export function donutConfig(
  slices: readonly DonutSlice[],
  style: {
    cutout: string;
    borderColor: string;
    borderWidth: number;
    hoverOffset: number;
    hoverBorderWidth?: number;
  },
  tooltipLabel: (slice: DonutSlice) => string,
): ChartConfig {
  const drawn = slices.filter((s) => s.active);
  const data: ChartData<'doughnut'> = {
    labels: drawn.map((s) => s.label),
    datasets: [
      {
        data: drawn.map((s) => s.count),
        backgroundColor: drawn.map((s) => s.color),
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        hoverOffset: style.hoverOffset,
        ...(style.hoverBorderWidth ? { hoverBorderWidth: style.hoverBorderWidth } : {}),
      },
    ],
  };
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: style.cutout,
    onHover: pointerOnHover,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item: TooltipItem<'doughnut'>) => {
            const slice = drawn[item.dataIndex];
            return slice ? tooltipLabel(slice) : '';
          },
        },
      },
    },
  };
  return { data: data as ChartData, options: options as ChartOptions, plugins: [] };
}
