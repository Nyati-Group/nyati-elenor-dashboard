import { Fragment, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
  ReferenceArea,
  ReferenceLine,
  Cell as CellFill,
} from 'recharts';
import { Building2, CalendarDays, CheckCircle2, ListTodo, MapPin } from 'lucide-react';
import {
  ELENOR_DATA,
  ElenorCastingRow,
  ElenorCostRow,
  ElenorRiskSeverity,
  ElenorTargetRow,
  TargetStatus,
  computeElenorRisks,
} from '../../data/elenorData';

/* --------------------------------- Chart theme -------------------------------- */
// Categorical slots 1–3 (validated: CVD & normal-vision separation pass, all pairs).
// Slot 3 (aqua) is below 3:1 contrast on white, so charts using it always carry
// direct labels or a table view.
const SERIES = {
  s1: '#2a78d6', // blue   — Planned / A Bldg.
  s2: '#eb6834', // orange — Actual / B Bldg.
  s3: '#1baf7a', // aqua   — Development
};
const GRID = '#E2E8F0';
const AXIS_TICK = { fontSize: 11, fill: '#475569' };
const LABEL_TEXT = { fontSize: 10, fill: '#334155', fontWeight: 600 };

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #E2E8F0',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
};

type ProgressTabId = 'monthly' | 'targets' | 'aluform';

const PROGRESS_TABS: Array<{ id: ProgressTabId; label: string }> = [
  { id: 'monthly', label: 'Monthly Progress' },
  { id: 'targets', label: 'Target vs Actual' },
  { id: 'aluform', label: 'Aluform & Highrise' },
];

const TARGET_STATUS_CLASS: Record<Exclude<TargetStatus, null>, string> = {
  Achieved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Partly Done': 'bg-amber-50 text-amber-800 border-amber-200',
  Failed: 'bg-red-50 text-red-800 border-red-200',
};

const TARGET_STATUS_FILL: Record<Exclude<TargetStatus, null>, string> = {
  Achieved: '#16A34A',
  'Partly Done': '#D97706',
  Failed: '#DC2626',
};

function pctNum(v: string | null): number {
  return v ? parseFloat(v) : 0;
}

function efficiencyClass(eff: string | null): string {
  if (!eff) return 'text-slate-400';
  const n = parseFloat(eff);
  if (n >= 85) return 'text-emerald-700';
  if (n >= 60) return 'text-amber-700';
  return 'text-red-700';
}

function statusTextClass(text: string): string {
  const t = text.toLowerCase();
  if (t.startsWith('not given') || t.startsWith('not done')) return 'text-red-700 font-semibold';
  if (t === 'given' || t === 'completed') return 'text-emerald-700 font-semibold';
  if (t.startsWith('part')) return 'text-sky-700 font-medium';
  if (t.includes('done') || t.includes('given')) return 'text-emerald-700 font-medium';
  return 'text-slate-700';
}

/** Parses dd/mm/yyyy into a timestamp. */
function parseDmy(d: string): number {
  const [dd, mm, yyyy] = d.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd).getTime();
}

function formatShortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

/** Label renderer that only labels the last point of a line (selective direct labels). */
function lastPointLabel(lastIndex: number, color: string, suffix = '%') {
  return (props: { x?: number | string; y?: number | string; index?: number; value?: unknown }) => {
    if (props.index !== lastIndex || props.x === undefined || props.y === undefined) return null;
    return (
      <text x={Number(props.x) + 8} y={Number(props.y) + 4} fontSize={11} fontWeight={600} fill="#0F172A">
        <tspan fill={color}>●</tspan> {Number(props.value).toFixed(2)}
        {suffix}
      </text>
    );
  };
}

/* ------------------------------- Shared building blocks ------------------------------- */

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="pb-3 border-b border-slate-200 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

function Dash() {
  return <span className="text-slate-300">—</span>;
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'warn' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p
        className={`mt-1 font-mono text-xl sm:text-2xl font-semibold tabular-nums ${
          tone === 'warn' ? 'text-red-700' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">{sub}</p>}
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1" role="group">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            value === o.id ? 'bg-[#0F1E36] text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

type BldgKey = 'A' | 'B' | 'Development';
const BLDG_OPTIONS: Array<{ id: BldgKey; label: string }> = [
  { id: 'A', label: 'A Building' },
  { id: 'B', label: 'B Building' },
  { id: 'Development', label: 'Development' },
];

/** Bullet meter: actual bar against a planned marker on a 0–max track. */
function BulletMeter({
  label,
  actual,
  planned,
  max,
  actualLabel,
  plannedLabel,
  right,
}: {
  label: string;
  actual: number;
  planned: number;
  max: number;
  actualLabel: string;
  plannedLabel: string;
  right?: React.ReactNode;
}) {
  const a = Math.min(100, (actual / max) * 100);
  const p = Math.min(100, (planned / max) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 font-mono tabular-nums">
          Actual <span className="font-semibold text-slate-900">{actualLabel}</span> · Planned{' '}
          <span className="font-semibold text-slate-900">{plannedLabel}</span>
          {right}
        </p>
      </div>
      <div
        className="relative h-3 rounded-full bg-slate-100"
        role="img"
        aria-label={`${label}: actual ${actualLabel}, planned ${plannedLabel}`}
      >
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${a}%`, backgroundColor: SERIES.s2 }} />
        <div
          className="absolute -top-1 -bottom-1 w-[3px] rounded-full"
          style={{ left: `calc(${p}% - 1.5px)`, backgroundColor: SERIES.s1 }}
          title={`Planned ${plannedLabel}`}
        />
      </div>
    </div>
  );
}

/* ------------------------------------- Overview ------------------------------------- */

function UptoDateStatusTable() {
  const { uptoDateStatus } = ELENOR_DATA;
  return (
    <Section title="Upto Date Status — From Start of the Project" subtitle="Amounts in ₹ Crore">
      <div className="overflow-x-auto -mx-5">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <Th className="pl-5">Project</Th>
              <Th className="text-right">Total Cost (Cr)</Th>
              <Th className="text-right">Planned %</Th>
              <Th className="text-right">Planned Cost (Cr)</Th>
              <Th className="text-right">Actual %</Th>
              <Th className="text-right">Actual Cost (Cr)</Th>
              <Th className="text-right pr-5">Effi. %</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {uptoDateStatus.map((row) => (
              <tr key={row.project} className={row.isTotal ? 'bg-slate-50/70' : ''}>
                <td className="pl-5 pr-3 py-3">
                  <p className={`font-semibold ${row.isTotal ? 'text-red-700' : 'text-slate-900'}`}>{row.project}</p>
                  {row.detail && <p className="text-xs text-slate-500">{row.detail}</p>}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums font-semibold text-slate-900">{row.totalCost}</td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700">{row.plannedPct}</td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-700">{row.plannedCost}</td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-900 font-medium">{row.actualPct}</td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-slate-900 font-medium">{row.actualCost}</td>
                <td className={`pl-3 pr-5 py-3 text-right font-mono tabular-nums font-semibold ${efficiencyClass(row.efficiency)}`}>
                  {row.efficiency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function ProgressVsTime() {
  const { timeline, uptoDateStatus } = ELENOR_DATA;
  const total = uptoDateStatus[0];
  const timePct = (timeline.elapsedMonths / timeline.totalMonths) * 100;
  const rows = [
    { label: 'Time elapsed', value: timePct, text: `${timeline.elapsedMonths} of ${timeline.totalMonths} months`, color: '#94A3B8' },
    { label: 'Planned progress', value: pctNum(total.plannedPct), text: total.plannedPct, color: SERIES.s1 },
    { label: 'Actual progress', value: pctNum(total.actualPct), text: total.actualPct, color: SERIES.s2 },
  ];
  return (
    <Section
      title="Progress vs Time"
      subtitle={`Upto ${timeline.current} · time elapsed is derived from the 23 of 53 month timeline`}
    >
      <div className="space-y-3.5">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[120px_1fr_auto] sm:grid-cols-[140px_1fr_auto] items-center gap-3">
            <span className="text-xs font-medium text-slate-600">{r.label}</span>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${r.label} ${r.text}`}>
              <div className="h-full rounded-full" style={{ width: `${r.value}%`, backgroundColor: r.color }} />
            </div>
            <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums w-28 text-right">{r.text}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function BuildingProgressMeters() {
  const rows = ELENOR_DATA.uptoDateStatus.filter((r) => !r.isTotal);
  return (
    <Section
      title="Progress by Building — Upto Date"
      subtitle="Bar = actual %, marker = planned % (scale 0–20%)"
      action={
        <div className="flex gap-3">
          <LegendSwatch color={SERIES.s2} label="Actual" />
          <LegendSwatch color={SERIES.s1} label="Planned" />
        </div>
      }
    >
      <div className="space-y-5">
        {rows.map((r) => (
          <BulletMeter
            key={r.project}
            label={r.project.replace(' - (B2+B1+G+32)', '')}
            actual={pctNum(r.actualPct)}
            planned={pctNum(r.plannedPct)}
            max={20}
            actualLabel={r.actualPct}
            plannedLabel={r.plannedPct}
            right={
              <span className={`ml-2 font-semibold ${efficiencyClass(r.efficiency)}`}>Effi. {r.efficiency}</span>
            }
          />
        ))}
      </div>
    </Section>
  );
}

function OverviewTab() {
  const { projectInfo, timeline, uptoDateStatus, statusSummary, taskClosing } = ELENOR_DATA;
  const elapsedPct = (timeline.elapsedMonths / timeline.totalMonths) * 100;
  const total = uptoDateStatus[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Signed off / Baseline Cost" value="₹371.22 Cr" />
        <Kpi label="Actual Progress (Upto Date)" value={total.actualPct} sub={`Planned ${total.plannedPct}`} />
        <Kpi label="Actual Cost (Upto Date)" value={`₹${total.actualCost} Cr`} sub={`Planned ₹${total.plannedCost} Cr`} />
        <Kpi label="Efficiency (Upto Date)" value={total.efficiency} tone="warn" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressVsTime />
        <BuildingProgressMeters />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Section title="Project Information">
            <dl className="divide-y divide-slate-100">
              {projectInfo.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-xs font-medium text-slate-500">{row.label}</dt>
                  <dd className="text-sm font-semibold text-slate-900 text-right">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>

        <div className="lg:col-span-7">
          <Section
            title="Project Timeline"
            subtitle={`${timeline.elapsedMonths} of ${timeline.totalMonths} months elapsed · ${timeline.current} progress ${timeline.currentProgress}`}
          >
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                <span>{timeline.start} · Project Start</span>
                <span>{timeline.finish} · Project Finish</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="absolute inset-y-0 left-0 rounded-full bg-[#0F1E36]" style={{ width: `${elapsedPct}%` }} />
              </div>
            </div>
            <ol className="relative border-l border-slate-200 ml-1.5 space-y-3 pt-1">
              <TimelineItem date={timeline.start} text="Project Start" />
              {timeline.milestones.map((m) => (
                <TimelineItem key={m.date + m.event} date={m.date} text={m.event} highlight />
              ))}
              <TimelineItem date={timeline.current} text={`Current status — ${timeline.currentProgress} complete`} current />
              <TimelineItem date={timeline.finish} text="Project Finish" />
            </ol>
          </Section>
        </div>
      </div>

      <UptoDateStatusTable />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Section title="Status · Cost · Efficiency">
            <div className="overflow-x-auto -mx-5">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <Th className="pl-5">Period</Th>
                    <Th>Status</Th>
                    <Th className="text-right">%</Th>
                    <Th className="text-right">Cost</Th>
                    <Th className="text-right pr-5">Efficiency</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statusSummary.map((row) => (
                    <Fragment key={row.period}>
                      <tr>
                        <td rowSpan={2} className="pl-5 pr-3 py-3 font-semibold text-slate-900 align-middle max-w-[220px]">
                          {row.period}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="rounded-md bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-800">Actual</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold">{row.actualPct}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold">{row.actualCost}</td>
                        <td rowSpan={2} className="pl-3 pr-5 py-3 text-right font-mono text-lg tabular-nums font-semibold text-red-700 align-middle">
                          {row.efficiency}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2.5">
                          <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-800">Planned</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{row.plannedPct}</td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums">{row.plannedCost}</td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        <div className="lg:col-span-4">
          <Section title="Summary of Task Closing">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 flex items-start gap-3">
                <ListTodo className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Open Tasks (Count &amp; Amount)</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">{taskClosing.openTaskCount}</p>
                  <p className="font-mono text-sm font-medium text-slate-700 tabular-nums">₹{taskClosing.openTaskAmount}</p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-500">Tasks Closed in {taskClosing.closedInMonthLabel}</p>
                  <p className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">{taskClosing.closedInMonth}</p>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  date,
  text,
  highlight,
  current,
}: {
  date: string;
  text: string;
  highlight?: boolean;
  current?: boolean;
}) {
  const dot = current
    ? 'bg-emerald-500 ring-emerald-100'
    : highlight
    ? 'bg-amber-400 ring-amber-100'
    : 'bg-[#0F1E36] ring-slate-100';
  return (
    <li className="ml-4">
      <span className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ring-4 ${dot}`} />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{date}</p>
      <p className={`text-sm ${current ? 'font-semibold text-emerald-800' : 'text-slate-800'}`}>{text}</p>
    </li>
  );
}

/* ---------------------------------- Monthly progress ---------------------------------- */

function ProgressTab() {
  const { monthwise, buildingWiseMonthly } = ELENOR_DATA;
  const pct = (v: unknown) => `${Number(v ?? 0).toFixed(2)}%`;
  const last = monthwise.length - 1;

  return (
    <div className="space-y-6">
      <Section
        title="Monthwise Progress — Nyati Elenor"
        subtitle="Planned vs actual progress each month (% of project) · FY 2026-27"
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthwise} margin={{ top: 16, right: 72, left: -8, bottom: 4 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} domain={[0, 1.6]} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v, n) => [pct(v), n]} contentStyle={TOOLTIP_STYLE} cursor={{ stroke: '#94A3B8', strokeDasharray: '3 3' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Line isAnimationActive={false}
                type="monotone"
                dataKey="planned"
                name="Planned %"
                stroke={SERIES.s1}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: SERIES.s1 }}
                activeDot={{ r: 6 }}
                label={lastPointLabel(last, SERIES.s1)}
              />
              <Line isAnimationActive={false}
                type="monotone"
                dataKey="actual"
                name="Actual %"
                stroke={SERIES.s2}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: SERIES.s2 }}
                activeDot={{ r: 6 }}
                label={lastPointLabel(last, SERIES.s2)}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Section title="Monthly Efficiency" subtitle="Actual / planned progress each month · 100% = on plan">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthwise} margin={{ top: 18, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} />
                  <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} domain={[0, 100]} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Efficiency']} contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F1F5F9' }} />
                  <ReferenceLine y={100} stroke="#94A3B8" strokeDasharray="4 4" />
                  <Bar isAnimationActive={false} dataKey="efficiency" name="Efficiency" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="efficiency" position="top" formatter={(v) => `${v}%`} style={LABEL_TEXT} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>
        <div className="lg:col-span-7">
          <Section title="Monthwise Progress — Table">
            <div className="overflow-x-auto -mx-5">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-y border-slate-200">
                  <tr>
                    <Th className="pl-5">Metric</Th>
                    {monthwise.map((m) => (
                      <Th key={m.month} className="text-right">
                        {m.month}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  <tr>
                    <td className="pl-5 pr-3 py-2.5 font-sans font-semibold text-slate-800">
                      <LegendSwatch color={SERIES.s1} label="Planned %" />
                    </td>
                    {monthwise.map((m) => (
                      <td key={m.month} className="px-3 py-2.5 text-right">
                        {pct(m.planned)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="pl-5 pr-3 py-2.5 font-sans font-semibold text-slate-800">
                      <LegendSwatch color={SERIES.s2} label="Actual %" />
                    </td>
                    {monthwise.map((m) => (
                      <td key={m.month} className="px-3 py-2.5 text-right">
                        {pct(m.actual)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="pl-5 pr-3 py-2.5 font-sans font-semibold text-slate-700">Efficiency</td>
                    {monthwise.map((m) => (
                      <td key={m.month} className={`px-3 py-2.5 text-right font-semibold ${efficiencyClass(`${m.efficiency}%`)}`}>
                        {m.efficiency}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>
        </div>
      </div>

      <Section
        title="Monthly Progress — Building-wise"
        subtitle="Monthly actual progress (%) of each building's own scope — grouped, since each building has a different base"
      >
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buildingWiseMonthly} margin={{ top: 18, right: 8, left: -8, bottom: 4 }} barGap={2} barCategoryGap="22%">
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v, n) => [pct(v), n]} contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F1F5F9' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
              <Bar isAnimationActive={false} dataKey="aBldg" name="A Bldg." fill={SERIES.s1} radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar isAnimationActive={false} dataKey="bBldg" name="B Bldg." fill={SERIES.s2} radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar isAnimationActive={false} dataKey="dev" name="Dev." fill={SERIES.s3} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto -mx-5">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <Th className="pl-5">Building</Th>
                {buildingWiseMonthly.map((m) => (
                  <Th key={m.month} className="text-right">
                    {m.month}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {(
                [
                  ['aBldg', 'A Bldg.', SERIES.s1],
                  ['bBldg', 'B Bldg.', SERIES.s2],
                  ['dev', 'Dev.', SERIES.s3],
                ] as const
              ).map(([key, label, color]) => (
                <tr key={key}>
                  <td className="pl-5 pr-3 py-2.5 font-sans font-semibold">
                    <LegendSwatch color={color} label={label} />
                  </td>
                  {buildingWiseMonthly.map((m) => (
                    <td key={m.month} className="px-3 py-2.5 text-right">
                      {pct(m[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function FyActualCost() {
  const { fyActualCostUptoOct } = ELENOR_DATA;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-700 mb-2">Actual Cost (Cr.) for FY upto October-26</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'A Bldg', value: fyActualCostUptoOct.aBldg, swatch: SERIES.s1 },
          { label: 'B Bldg', value: fyActualCostUptoOct.bBldg, swatch: SERIES.s2 },
          { label: 'Development', value: fyActualCostUptoOct.development, swatch: SERIES.s3 },
        ].map((c) => (
          <div key={c.label} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
            <LegendSwatch color={c.swatch} label={c.label} />
            <p className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums whitespace-nowrap">₹{c.value} Cr</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- Target vs Actual ---------------------------------- */

function TargetTable({ title, rows }: { title: string; rows: ElenorTargetRow[] }) {
  return (
    <Section title={title} subtitle="3rd Quarter : October – December 2026">
      <div className="overflow-x-auto -mx-5">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <Th className="pl-5">Activity</Th>
              <Th>Target – Oct 2026</Th>
              <Th>Status – Oct 2026</Th>
              <Th>Target – Nov 2026</Th>
              <Th className="pr-5">Target – Dec 2026</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.activity}>
                <td className="pl-5 pr-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{r.activity}</td>
                <td className="px-3 py-2.5 text-slate-700">{r.targetOct}</td>
                <td className="px-3 py-2.5">
                  {r.status ? (
                    <div className={`inline-flex flex-col rounded-md border px-2.5 py-1 ${TARGET_STATUS_CLASS[r.status]}`}>
                      <span className="text-xs font-semibold">{r.statusOct}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">{r.status}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500">{r.statusOct}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-700">{r.targetNov}</td>
                <td className="pl-3 pr-5 py-2.5 text-slate-700">{r.targetDec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function TargetsTab() {
  const { targetVsActual } = ELENOR_DATA;
  const all = [...targetVsActual.A, ...targetVsActual.B, ...targetVsActual.Development];
  const count = (rows: ElenorTargetRow[], s: TargetStatus) => rows.filter((r) => r.status === s).length;
  const statuses = ['Achieved', 'Partly Done', 'Failed'] as const;
  const chartRows = (
    [
      ['A Bldg.', targetVsActual.A],
      ['B Bldg.', targetVsActual.B],
      ['Development', targetVsActual.Development],
    ] as const
  ).map(([name, rows]) => ({
    name,
    Achieved: count(rows, 'Achieved'),
    'Partly Done': count(rows, 'Partly Done'),
    Failed: count(rows, 'Failed'),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          {statuses.map((s) => (
            <div key={s} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">October 2026 activities</p>
                <p className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-sm font-semibold ${TARGET_STATUS_CLASS[s]}`}>{s}</p>
              </div>
              <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">{count(all, s)}</span>
            </div>
          ))}
        </div>
        <div className="lg:col-span-7">
          <Section title="October Status by Building" subtitle="Count of activities with an October status">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }} barCategoryGap="28%">
                  <CartesianGrid stroke={GRID} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={AXIS_TICK} width={86} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F1F5F9' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
                  {statuses.map((s, i) => (
                    <Bar isAnimationActive={false}
                      key={s}
                      dataKey={s}
                      stackId="status"
                      fill={TARGET_STATUS_FILL[s]}
                      stroke="#fff"
                      strokeWidth={2}
                      radius={i === statuses.length - 1 ? [0, 4, 4, 0] : 0}
                    >
                      <LabelList
                        dataKey={s}
                        position="center"
                        formatter={(v) => (Number(v) > 0 ? String(v) : '')}
                        style={{ fontSize: 11, fill: '#fff', fontWeight: 700 }}
                      />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>
      </div>
      <TargetTable title="A Building — Target vs Actual" rows={targetVsActual.A} />
      <TargetTable title="B Building — Target vs Actual" rows={targetVsActual.B} />
      <TargetTable title="Development — Target vs Actual" rows={targetVsActual.Development} />
    </div>
  );
}

/* ---------------------------------- Aluform & Highrise ---------------------------------- */

function CastingTable({ title, rows, color }: { title: string; rows: ElenorCastingRow[]; color: string }) {
  const { totalFloors } = ELENOR_DATA.aluformCasting;
  const cast = rows.length;
  return (
    <Section title={title} subtitle={`${cast} of ${totalFloors} Aluform floors cast · 8th–32nd floor pending`}>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${cast} of ${totalFloors} floors cast`}>
        <div className="h-full rounded-full" style={{ width: `${(cast / totalFloors) * 100}%`, backgroundColor: color }} />
      </div>
      <div className="overflow-x-auto -mx-5">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <Th className="pl-5">Floor</Th>
              <Th>Date</Th>
              <Th className="text-right pr-5">Cycle</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.floor}>
                <td className="pl-5 pr-3 py-2 font-semibold text-slate-900">{r.floor}</td>
                <td className="px-3 py-2 font-mono tabular-nums text-slate-800">{r.date ?? <Dash />}</td>
                <td className="pl-3 pr-5 py-2 text-right font-mono tabular-nums font-semibold text-slate-900">{r.cycle ?? <Dash />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function AluformTab() {
  const { aluformCasting, highriseStatus, asOfDate } = ELENOR_DATA;

  const toPoints = (rows: ElenorCastingRow[]) =>
    rows
      .filter((r) => r.date)
      .map((r) => ({ t: parseDmy(r.date as string), floor: parseInt(r.floor, 10), cycle: r.cycle }))
      .sort((a, b) => a.t - b.t);
  const aPoints = toPoints(aluformCasting.A);
  const bPoints = toPoints(aluformCasting.B);
  const strikeStart = new Date(2026, 3, 16).getTime();
  const strikeEnd = new Date(2026, 4, 8).getTime();
  const allT = [...aPoints, ...bPoints].map((p) => p.t);
  const minT = Math.min(...allT, strikeStart) - 7 * 86400000;
  const maxT = Math.max(...allT) + 7 * 86400000;
  const monthTicks: number[] = [];
  for (let d = new Date(new Date(minT).getFullYear(), new Date(minT).getMonth() + 1, 1); d.getTime() <= maxT; d.setMonth(d.getMonth() + 1)) {
    monthTicks.push(d.getTime());
  }

  const cycleData = aluformCasting.A.map((a, i) => ({
    floor: a.floor.replace(' Floor', ''),
    A: a.cycle ? parseInt(a.cycle, 10) : null,
    B: aluformCasting.B[i]?.cycle ? parseInt(aluformCasting.B[i].cycle as string, 10) : null,
  }))
    .filter((r) => r.A !== null || r.B !== null)
    .reverse();

  return (
    <div className="space-y-6">
      <Section
        title="Aluform Floor Casting — Floors vs Date"
        subtitle="Each point is a floor cast; a steeper line means a faster cycle. Shaded: RMC strike (16/04/26 – 08/05/26)."
      >
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart margin={{ top: 16, right: 24, left: -12, bottom: 4 }}>
              <CartesianGrid stroke={GRID} />
              <XAxis
                type="number"
                dataKey="t"
                domain={[minT, maxT]}
                ticks={monthTicks}
                tickFormatter={(t) => new Date(t).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: GRID }}
              />
              <YAxis
                type="number"
                dataKey="floor"
                domain={[0, 8]}
                allowDecimals={false}
                tickCount={9}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Floor', angle: -90, position: 'insideLeft', offset: 20, style: { fontSize: 11, fill: '#64748B' } }}
              />
              <ReferenceArea
                x1={strikeStart}
                x2={strikeEnd}
                fill="#FDE68A"
                fillOpacity={0.45}
                label={{ value: 'RMC strike', position: 'insideTop', fontSize: 10, fill: '#92400E' }}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(t) => formatShortDate(Number(t))}
                formatter={(v, n) => [`Floor ${v}`, n]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Line isAnimationActive={false} data={aPoints} dataKey="floor" name="A Bldg." stroke={SERIES.s1} strokeWidth={2} dot={{ r: 4, fill: SERIES.s1, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line isAnimationActive={false} data={bPoints} dataKey="floor" name="B Bldg." stroke={SERIES.s2} strokeWidth={2} dot={{ r: 4, fill: SERIES.s2, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <span className="font-semibold">Note:</span> {aluformCasting.note}
        </div>
      </Section>

      <Section title="Aluform Floor Cycle (days)" subtitle="Days between consecutive floor casts">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cycleData} margin={{ top: 18, right: 16, left: -12, bottom: 4 }} barGap={2} barCategoryGap="24%">
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="floor" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v, n) => [`${v} days`, n]} contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F1F5F9' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
              <Bar isAnimationActive={false} dataKey="A" name="A Bldg." fill={SERIES.s1} radius={[4, 4, 0, 0]} maxBarSize={24}>
                <LabelList dataKey="A" position="top" style={LABEL_TEXT} />
              </Bar>
              <Bar isAnimationActive={false} dataKey="B" name="B Bldg." fill={SERIES.s2} radius={[4, 4, 0, 0]} maxBarSize={24}>
                <LabelList dataKey="B" position="top" style={LABEL_TEXT} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CastingTable title="A Bldg. — Aluform Floor Casting Dates" rows={aluformCasting.A} color={SERIES.s1} />
        <CastingTable title="B Bldg. — Aluform Floor Casting Dates" rows={aluformCasting.B} color={SERIES.s2} />
      </div>

      <Section title={`Activity-wise Actual vs Highrise Work Status — upto ${asOfDate}`}>
        <div className="overflow-x-auto -mx-5">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <Th className="pl-5">Activity</Th>
                <Th>A Bldg. Actual</Th>
                <Th>A Bldg. Highrise Status</Th>
                <Th>B Bldg. Actual</Th>
                <Th className="pr-5">B Bldg. Highrise Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highriseStatus.map((r) => (
                <tr key={r.activity}>
                  <td className="pl-5 pr-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{r.activity}</td>
                  <td className="px-3 py-2.5 text-slate-800">{r.aActual}</td>
                  <td className={`px-3 py-2.5 font-semibold ${r.aTone === 'open' ? 'text-red-700' : 'text-sky-700'}`}>{r.aHighrise}</td>
                  <td className="px-3 py-2.5 text-slate-800">{r.bActual}</td>
                  <td className={`pl-3 pr-5 py-2.5 font-semibold ${r.bTone === 'open' ? 'text-red-700' : 'text-sky-700'}`}>{r.bHighrise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

/* --------------------------------- Building-wise cost --------------------------------- */

function CostTable({ title, rows }: { title: string; rows: ElenorCostRow[] }) {
  return (
    <Section title={title} subtitle="Amounts in ₹ Lacs · up to date">
      <div className="overflow-x-auto -mx-5">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <Th className="pl-5">Task Name</Th>
              <Th className="text-right">Baseline Cost (Lacs)</Th>
              <Th className="text-right">Planned %</Th>
              <Th className="text-right">Planned Cost</Th>
              <Th className="text-right">Actual %</Th>
              <Th className="text-right">Actual Cost</Th>
              <Th className="text-right pr-5">Efficiency %</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const rowClass = r.level === 'total' ? 'bg-sky-50/70' : r.level === 'group' ? 'bg-amber-50/70' : '';
              const nameClass =
                r.level === 'total' ? 'font-semibold text-red-700' : r.level === 'group' ? 'font-semibold text-slate-900' : 'text-slate-800';
              const cell = (v: string | null, extra = '') => (
                <td className={`px-3 py-2 text-right font-mono tabular-nums ${extra}`}>{v ?? <Dash />}</td>
              );
              return (
                <tr key={r.name} className={rowClass}>
                  <td className={`pl-5 pr-3 py-2 ${r.indent ? 'pl-9' : ''} ${nameClass}`}>{r.name}</td>
                  {cell(r.baseline, 'font-semibold text-slate-900')}
                  {cell(r.plannedPct, 'text-slate-700')}
                  {cell(r.plannedCost, 'text-slate-700')}
                  {cell(r.actualPct, 'text-slate-900')}
                  {cell(r.actualCost, 'text-slate-900')}
                  <td className={`pl-3 pr-5 py-2 text-right font-mono tabular-nums font-semibold ${efficiencyClass(r.efficiency)}`}>
                    {r.efficiency ?? <Dash />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function shortTaskName(name: string): string {
  return name.replace(/^\(TG\)\s*/, '').replace(/^[AB]\s*-\s*/, '').trim();
}

function TaskGroupProgressChart({ bldg }: { bldg: BldgKey }) {
  const rows = ELENOR_DATA.buildingProgress[bldg]
    .filter((r) => r.level === 'item' && r.plannedPct !== null && r.actualPct !== null)
    .map((r) => ({
      name: shortTaskName(r.name),
      planned: pctNum(r.plannedPct),
      actual: pctNum(r.actualPct),
      efficiency: r.efficiency,
    }))
    .sort((a, b) => b.planned - a.planned);
  const pct = (v: unknown) => `${Number(v ?? 0).toFixed(2)}%`;

  return (
    <Section
      title="Planned vs Actual % by Task Group"
      subtitle="Task groups with progress recorded · % of each task group's baseline"
    >
      <div className="w-full" style={{ height: Math.max(220, rows.length * 46 + 60) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }} barGap={2} barCategoryGap="24%">
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={AXIS_TICK} width={150} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(v, n) => [pct(v), n]}
              labelFormatter={(l) => {
                const row = rows.find((r) => r.name === l);
                return row?.efficiency ? `${l} · Efficiency ${row.efficiency}` : String(l);
              }}
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: '#F1F5F9' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
            <Bar isAnimationActive={false} dataKey="planned" name="Planned %" fill={SERIES.s1} radius={[0, 4, 4, 0]} maxBarSize={14}>
              <LabelList dataKey="planned" position="right" formatter={pct} style={{ fontSize: 10, fill: '#475569' }} />
            </Bar>
            <Bar isAnimationActive={false} dataKey="actual" name="Actual %" fill={SERIES.s2} radius={[0, 4, 4, 0]} maxBarSize={14}>
              <LabelList dataKey="actual" position="right" formatter={pct} style={{ fontSize: 10, fill: '#0F172A', fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}

function CostTab() {
  const [bldg, setBldg] = useState<BldgKey>('A');
  const titles: Record<BldgKey, string> = {
    A: 'Building-wise Progress: A Building',
    B: 'Building-wise Progress: B Building',
    Development: 'Building-wise Progress: Development',
  };
  return (
    <div className="space-y-6">
      <SegmentedToggle options={BLDG_OPTIONS} value={bldg} onChange={setBldg} />
      <TaskGroupProgressChart bldg={bldg} />
      <CostTable title={titles[bldg]} rows={ELENOR_DATA.buildingProgress[bldg]} />
    </div>
  );
}

function BaselineCompositionChart() {
  const [bldg, setBldg] = useState<BldgKey>('A');
  const rows = ELENOR_DATA.buildingProgress[bldg]
    .filter((r) => r.level === 'item' && parseFloat(r.baseline) > 0)
    .map((r) => ({
      name: shortTaskName(r.name),
      baseline: parseFloat(r.baseline),
      label: r.baseline,
      started: r.actualPct !== null && pctNum(r.actualPct) > 0,
    }))
    .sort((a, b) => b.baseline - a.baseline)
    .slice(0, 12);
  const totalRow = ELENOR_DATA.buildingProgress[bldg][0];

  return (
    <Section
      title="Where the Budget Sits — Baseline by Task Group"
      subtitle={`Top ${rows.length} task groups · ₹ Lacs · ${bldg === 'Development' ? 'Development' : `${bldg} Building`} total ₹${totalRow.baseline} Lacs`}
      action={<SegmentedToggle options={BLDG_OPTIONS} value={bldg} onChange={setBldg} />}
    >
      <div className="flex gap-4 -mt-1">
        <LegendSwatch color={SERIES.s1} label="Work started (actual > 0%)" />
        <LegendSwatch color="#CBD5E1" label="Not started / not recorded" />
      </div>
      <div className="w-full" style={{ height: rows.length * 30 + 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 72, left: 8, bottom: 4 }} barCategoryGap="22%">
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={AXIS_TICK} width={190} tickLine={false} axisLine={false} interval={0} />
            <Tooltip formatter={(v) => [`₹${Number(v).toFixed(2)} Lacs`, 'Baseline']} contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F1F5F9' }} />
            <Bar isAnimationActive={false} dataKey="baseline" name="Baseline (Lacs)" radius={[0, 4, 4, 0]} maxBarSize={16}>
              {rows.map((r) => (
                <CellFill key={r.name} fill={r.started ? SERIES.s1 : '#CBD5E1'} />
              ))}
              <LabelList dataKey="label" position="right" style={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Section>
  );
}

/* ----------------------------- Purchasing & contractors ----------------------------- */

function ProcurementTab() {
  const { bulkPurchasing, contractorDeployment } = ELENOR_DATA;
  return (
    <div className="space-y-6">
      <Section
        title={`Bulk Purchasing — 3rd Quarter (October 2026 – December 2026) · ${bulkPurchasing.ref}`}
        subtitle="PO processing and lead times in days"
      >
        <div className="overflow-x-auto -mx-5">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <Th className="pl-5" />
                <Th />
                <Th />
                <Th />
                <th colSpan={5} className="px-3 pt-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-700 border-l border-slate-200">
                  A Building
                </th>
                <th colSpan={5} className="px-3 pt-2.5 pr-5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-700 border-l border-slate-200">
                  B Building
                </th>
              </tr>
              <tr>
                <Th className="pl-5">Sr.</Th>
                <Th>Contractor</Th>
                <Th className="text-right">PO Proc.</Th>
                <Th className="text-right">Lead</Th>
                <Th className="border-l border-slate-200">Planned</Th>
                <Th>Req. Date</Th>
                <Th>Req. Status</Th>
                <Th>PO Status</Th>
                <Th>Delivery</Th>
                <Th className="border-l border-slate-200">Planned</Th>
                <Th>Req. Date</Th>
                <Th>Req. Status</Th>
                <Th>PO Status</Th>
                <Th className="pr-5">Delivery</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bulkPurchasing.rows.map((r) => (
                <tr key={r.sr}>
                  <td className="pl-5 pr-3 py-2.5 font-mono tabular-nums text-slate-500">{r.sr}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{r.item}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{r.poProcessing}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{r.leadTime}</td>
                  {[r.a, r.b].map((side, i) =>
                    side ? (
                      <PurchaseCells key={i} side={side} last={i === 1} />
                    ) : (
                      <td key={i} colSpan={5} className={`px-3 py-2.5 text-xs text-slate-400 border-l border-slate-100 ${i === 1 ? 'pr-5' : ''}`}>
                        Not yet scheduled
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title={`Contractor Deployment — 3rd Quarter (October 2026 – December 2026) · ${contractorDeployment.ref}`}
        subtitle="Processing time in days · WO status w.r.t. Highrise"
      >
        <div className="overflow-x-auto -mx-5">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <Th className="pl-5" />
                <Th />
                <Th />
                <th colSpan={4} className="px-3 pt-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-700 border-l border-slate-200">
                  A Building
                </th>
                <th colSpan={4} className="px-3 pt-2.5 pr-5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-700 border-l border-slate-200">
                  B Building
                </th>
              </tr>
              <tr>
                <Th className="pl-5">Sr.</Th>
                <Th>Contractor</Th>
                <Th className="text-right">Proc.</Th>
                <Th className="border-l border-slate-200">Planned Date</Th>
                <Th>WO Date</Th>
                <Th>Labour Req.</Th>
                <Th>WO Status</Th>
                <Th className="border-l border-slate-200">Planned Date</Th>
                <Th>WO Date</Th>
                <Th>Labour Req.</Th>
                <Th className="pr-5">WO Status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contractorDeployment.rows.map((r) => (
                <tr key={r.sr}>
                  <td className="pl-5 pr-3 py-2.5 font-mono tabular-nums text-slate-500">{r.sr}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-900 whitespace-nowrap">{r.contractor}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{r.processing}</td>
                  {[r.a, r.b].map((side, i) =>
                    side ? (
                      <Fragment key={i}>
                        <td className="px-3 py-2.5 font-mono tabular-nums whitespace-nowrap border-l border-slate-100">{side.planned}</td>
                        <td className="px-3 py-2.5 font-mono tabular-nums whitespace-nowrap">{side.wo}</td>
                        <td className={`px-3 py-2.5 whitespace-nowrap ${statusTextClass(side.labour)}`}>{side.labour}</td>
                        <td className={`px-3 py-2.5 whitespace-nowrap ${i === 1 ? 'pr-5' : ''} ${statusTextClass(side.woStatus)}`}>{side.woStatus}</td>
                      </Fragment>
                    ) : (
                      <td key={i} colSpan={4} className={`px-3 py-2.5 text-xs text-slate-400 border-l border-slate-100 ${i === 1 ? 'pr-5' : ''}`}>
                        Not yet scheduled
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function PurchaseCells({
  side,
  last,
}: {
  side: { planned: string; reqDate: string; reqStatus: string; poStatus: string; delivery: string };
  last: boolean;
}) {
  return (
    <>
      <td className="px-3 py-2.5 font-mono tabular-nums whitespace-nowrap border-l border-slate-100">{side.planned}</td>
      <td className="px-3 py-2.5 font-mono tabular-nums whitespace-nowrap">{side.reqDate}</td>
      <td className={`px-3 py-2.5 ${statusTextClass(side.reqStatus)}`}>{side.reqStatus}</td>
      <td className={`px-3 py-2.5 ${statusTextClass(side.poStatus)}`}>{side.poStatus}</td>
      <td className={`px-3 py-2.5 ${last ? 'pr-5' : ''} ${statusTextClass(side.delivery)}`}>{side.delivery}</td>
    </>
  );
}

/* ---------------------------------------- Pages ---------------------------------------- */

function PageTitle({ title, showPresenter }: { title: string; showPresenter?: boolean }) {
  const { reportRef, reportPeriod, presenter, projectInfo } = ELENOR_DATA;
  const location = projectInfo.find((p) => p.label === 'Location')?.value;
  const buildings = projectInfo.find((p) => p.label === 'Number of Buildings')?.value;
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" />
            Nyati Elenor
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </span>
          <span>{buildings}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {reportPeriod}
          </span>
        </p>
      </div>
      {showPresenter && (
        <div className="text-right text-xs text-slate-500">
          <p className="font-mono">{reportRef}</p>
          <p>
            Presented by {presenter.name} ·{' '}
            <a href={`mailto:${presenter.email}`} className="text-sky-700 hover:underline">
              {presenter.email}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export function ElenorDashboardPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="Executive Dashboard" showPresenter />
      <OverviewTab />
    </div>
  );
}

export function ElenorWorkPackagesPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="Work Packages" />
      <CostTab />
    </div>
  );
}

export function ElenorBudgetPage() {
  const { uptoDateStatus } = ELENOR_DATA;
  const chartRows = uptoDateStatus
    .filter((r) => !r.isTotal)
    .map((r) => ({
      name: r.project.replace(' - (B2+B1+G+32)', ''),
      planned: parseFloat(r.plannedCost),
      actual: parseFloat(r.actualCost),
    }));
  const cr = (v: unknown) => `₹${Number(v ?? 0).toFixed(2)} Cr`;

  return (
    <div className="space-y-6">
      <PageTitle title="Budget & BOQ" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {uptoDateStatus.map((r) => (
          <Kpi
            key={r.project}
            label={r.isTotal ? 'Total Cost — Nyati Elenor' : `Total Cost — ${r.project.replace(' - (B2+B1+G+32)', '')}`}
            value={`₹${r.totalCost} Cr`}
            sub={`Actual ₹${r.actualCost} Cr · Effi. ${r.efficiency}`}
          />
        ))}
      </div>
      <UptoDateStatusTable />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <Section title="Planned vs Actual Cost — Upto Date" subtitle="By building · ₹ Crore">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows} margin={{ top: 18, right: 8, left: -8, bottom: 4 }} barGap={2} barCategoryGap="26%">
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID }} />
                  <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v, n) => [cr(v), n]} contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F1F5F9' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="square" />
                  <Bar isAnimationActive={false} dataKey="planned" name="Planned Cost" fill={SERIES.s1} radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="planned" position="top" style={LABEL_TEXT} formatter={(v) => Number(v ?? 0).toFixed(2)} />
                  </Bar>
                  <Bar isAnimationActive={false} dataKey="actual" name="Actual Cost" fill={SERIES.s2} radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="actual" position="top" style={LABEL_TEXT} formatter={(v) => Number(v ?? 0).toFixed(2)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <FyActualCost />
          </Section>
        </div>
        <div className="lg:col-span-7">
          <BaselineCompositionChart />
        </div>
      </div>
    </div>
  );
}

export function ElenorProgressPage() {
  const [tab, setTab] = useState<ProgressTabId>(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get('tab');
      if (PROGRESS_TABS.some((t) => t.id === fromUrl)) return fromUrl as ProgressTabId;
    } catch {
      // ignore
    }
    return 'monthly';
  });
  return (
    <div className="space-y-6">
      <PageTitle title="Progress Monitoring" />
      <div role="tablist" aria-label="Progress sections" className="no-print flex gap-1 overflow-x-auto border-b border-slate-200">
        {PROGRESS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-[13px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-[#0F1E36] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'monthly' && <ProgressTab />}
      {tab === 'targets' && <TargetsTab />}
      {tab === 'aluform' && <AluformTab />}
    </div>
  );
}

export function ElenorProcurementPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="Purchasing & Contractors" />
      <ProcurementTab />
    </div>
  );
}

const SEVERITY_CLASS: Record<ElenorRiskSeverity, string> = {
  High: 'bg-red-50 text-red-800 border-red-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-200',
  Low: 'bg-sky-50 text-sky-800 border-sky-200',
};

export function ElenorRiskPage() {
  const risks = computeElenorRisks();
  const [filter, setFilter] = useState<ElenorRiskSeverity | 'All'>('All');
  const shown = filter === 'All' ? risks : risks.filter((r) => r.severity === filter);
  const count = (s: ElenorRiskSeverity) => risks.filter((r) => r.severity === s).length;

  return (
    <div className="space-y-6">
      <PageTitle title="AI Risk Center" />
      <p className="text-xs text-slate-500 -mt-3">
        Every risk below is derived only from the figures in the Progress Review Presentation (PLN/407) — no numbers are added or estimated.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['High', 'Medium', 'Low'] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filter === s}
            onClick={() => setFilter(filter === s ? 'All' : s)}
            className={`rounded-xl border bg-white p-5 flex items-center justify-between gap-4 text-left transition-colors ${
              filter === s ? 'border-slate-900' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <p className="text-xs font-medium text-slate-500">Severity</p>
              <p className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-sm font-semibold ${SEVERITY_CLASS[s]}`}>{s}</p>
            </div>
            <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">{count(s)}</span>
          </button>
        ))}
      </div>
      <Section
        title={`Risk Register (${shown.length}${filter === 'All' ? '' : ` ${filter}`})`}
        subtitle={filter === 'All' ? 'Sorted by severity · click a severity card to filter' : 'Click the card again to show all'}
      >
        <ul className="divide-y divide-slate-100 -mx-5">
          {shown.map((r) => (
            <li key={r.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-start gap-3">
              <span className={`shrink-0 inline-flex w-fit rounded-md border px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_CLASS[r.severity]}`}>
                {r.severity}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{r.title}</p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 mt-0.5">
                  {r.category} · {r.scope}
                </p>
                <p className="text-sm text-slate-700 mt-1.5">{r.reason}</p>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-600">Next step:</span> {r.suggestedNextStep}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
