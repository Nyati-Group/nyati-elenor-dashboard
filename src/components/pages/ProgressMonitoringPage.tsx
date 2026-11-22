import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Calendar,
  RotateCcw,
  PenSquare,
  ChevronDown,
  ChevronUp,
  Table2,
} from 'lucide-react';
import {
  EVANIA_DATA,
  FloorProgressMap,
  FloorStatus,
  PackageStatus,
  WorkPackage,
  WorkPackageEditableFields,
  formatCr,
} from '../../data/evaniaData';

interface ProgressMonitoringPageProps {
  packages: WorkPackage[];
  floorProgress: FloorProgressMap;
  onUpdateFloor: (floor: number, status: FloorStatus) => void;
  onResetFloors: () => void;
  onInlineUpdatePackage: (
    packageId: string,
    fields: Partial<WorkPackageEditableFields>
  ) => void;
  onEditPackage: (packageId: string) => void;
}

const STATUS_OPTIONS: PackageStatus[] = [
  'On Track',
  'At Watch',
  'At Risk',
  'Not Started',
];

const STATUS_COLORS: Record<PackageStatus, string> = {
  'On Track': '#16A34A',
  'At Watch': '#D97706',
  'At Risk': '#DC2626',
  'Not Started': '#94A3B8',
};

const FLOOR_CYCLE: Record<FloorStatus, FloorStatus> = {
  'Not Started': 'In Progress',
  'In Progress': 'Slab Cast',
  'Slab Cast': 'Not Started',
};

function getFloorCellClasses(status: FloorStatus): string {
  switch (status) {
    case 'Slab Cast':
      return 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100';
    case 'In Progress':
      return 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100';
    default:
      return 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
  }
}

function getEffectiveStatus(pkg: WorkPackage): PackageStatus {
  return pkg.status ?? 'Not Started';
}

function shortPkgName(pkg: WorkPackage): string {
  const base = pkg.code ? `${pkg.code}. ${pkg.name}` : pkg.name;
  return base.length > 26 ? `${base.slice(0, 24)}…` : base;
}

export function ProgressMonitoringPage({
  packages,
  floorProgress,
  onUpdateFloor,
  onResetFloors,
  onInlineUpdatePackage,
  onEditPackage,
}: ProgressMonitoringPageProps) {
  const [chartCategoryFilter, setChartCategoryFilter] = useState<'ALL' | 'Civil' | 'MEP'>('ALL');
  const [chartMode, setChartMode] = useState<'auto' | 'planned-vs-actual' | 'budget-readiness'>('auto');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'Civil' | 'MEP'>('ALL');
  const [tableSearch, setTableSearch] = useState('');
  const [showInlineMatrix, setShowInlineMatrix] = useState(false);
  const [showUnscheduled, setShowUnscheduled] = useState(false);

  // Executive KPIs for immediate conclusions
  const metrics = useMemo(() => {
    const totalBudget = packages.reduce((sum, p) => sum + p.budgetCr, 0);
    const updatedPctPackages = packages.filter((p) => p.percentComplete !== null);
    const weightedCompletionPct =
      updatedPctPackages.length > 0 && totalBudget > 0
        ? packages.reduce((sum, p) => sum + p.budgetCr * (p.percentComplete ?? 0), 0) /
          totalBudget
        : null;

    let onTrack = 0;
    let atWatch = 0;
    let atRisk = 0;
    let notStarted = 0;
    let behindSchedule = 0;

    packages.forEach((p) => {
      const s = getEffectiveStatus(p);
      if (s === 'On Track') onTrack += 1;
      else if (s === 'At Watch') atWatch += 1;
      else if (s === 'At Risk') atRisk += 1;
      else notStarted += 1;

      if (p.scheduleVarianceDays !== null && p.scheduleVarianceDays < 0) {
        behindSchedule += 1;
      }
    });

    return {
      updatedPctCount: updatedPctPackages.length,
      weightedCompletionPct,
      onTrack,
      atWatch,
      atRisk,
      notStarted,
      behindSchedule,
    };
  }, [packages]);

  // Packages with any progress % entered
  const progressPackages = useMemo(() => {
    return packages
      .filter((p) => chartCategoryFilter === 'ALL' || p.category === chartCategoryFilter)
      .filter((p) => p.percentComplete !== null || p.plannedPercent !== null)
      .map((p) => ({
        id: p.id,
        label: p.code ? `${p.code} · ${p.name}` : p.name,
        shortLabel: shortPkgName(p),
        plannedPct: p.plannedPercent ?? 0,
        actualPct: p.percentComplete ?? 0,
        budgetCr: p.budgetCr,
        varianceDays: p.scheduleVarianceDays,
        status: getEffectiveStatus(p),
      }));
  }, [packages, chartCategoryFilter]);

  const effectiveChartMode =
    chartMode === 'auto'
      ? progressPackages.length > 0
        ? 'planned-vs-actual'
        : 'budget-readiness'
      : chartMode;

  // Top 10 packages by R1 Budget with Status & Completion %
  const topBudgetStatusData = useMemo(() => {
    return [...packages]
      .filter((p) => chartCategoryFilter === 'ALL' || p.category === chartCategoryFilter)
      .sort((a, b) => b.budgetCr - a.budgetCr)
      .slice(0, 10)
      .map((p) => {
        const status = getEffectiveStatus(p);
        return {
          id: p.id,
          label: p.code ? `${p.code} · ${p.name}` : p.name,
          shortLabel: shortPkgName(p),
          budgetCr: p.budgetCr,
          status,
          color: STATUS_COLORS[status],
          percentComplete: p.percentComplete,
          varianceDays: p.scheduleVarianceDays,
        };
      });
  }, [packages, chartCategoryFilter]);

  // Status split weighted by Budget ₹ Cr for Donut Chart
  const statusSplitData = useMemo(() => {
    const groups: Record<PackageStatus, { count: number; budgetCr: number }> = {
      'On Track': { count: 0, budgetCr: 0 },
      'At Watch': { count: 0, budgetCr: 0 },
      'At Risk': { count: 0, budgetCr: 0 },
      'Not Started': { count: 0, budgetCr: 0 },
    };

    packages.forEach((p) => {
      const s = getEffectiveStatus(p);
      groups[s].count += 1;
      groups[s].budgetCr += p.budgetCr;
    });

    return (Object.keys(groups) as PackageStatus[])
      .map((status) => ({
        name: status,
        count: groups[status].count,
        budgetCr: Number(groups[status].budgetCr.toFixed(2)),
        color: STATUS_COLORS[status],
      }))
      .filter((item) => item.count > 0);
  }, [packages]);

  // Floor counts (32 floors total) + zone breakdown (1-7 Conventional vs 8-32 Aluform)
  const { floorSummary, floorZoneChartData } = useMemo(() => {
    let notStarted = 0;
    let inProgress = 0;
    let slabCast = 0;

    const lower = { zone: 'Floors 1–7 (Lower)', slabCast: 0, inProgress: 0, notStarted: 0 };
    const aluform = { zone: 'Floors 8–32 (Aluform)', slabCast: 0, inProgress: 0, notStarted: 0 };

    for (let f = 1; f <= 32; f += 1) {
      const s = floorProgress[f] ?? 'Not Started';
      const target = f >= 8 ? aluform : lower;
      if (s === 'Slab Cast') {
        slabCast += 1;
        target.slabCast += 1;
      } else if (s === 'In Progress') {
        inProgress += 1;
        target.inProgress += 1;
      } else {
        notStarted += 1;
        target.notStarted += 1;
      }
    }

    return {
      floorSummary: { notStarted, inProgress, slabCast },
      floorZoneChartData: [aluform, lower],
    };
  }, [floorProgress]);

  // Split packages into scheduled (both plannedStart & plannedEnd) vs unscheduled
  const { scheduledPackages, unscheduledPackages, timelineBounds } = useMemo(() => {
    const scheduled: Array<
      WorkPackage & { startMs: number; endMs: number; actualStartMs: number | null }
    > = [];
    const unscheduled: WorkPackage[] = [];

    packages.forEach((pkg) => {
      if (pkg.plannedStart && pkg.plannedEnd) {
        const s = Date.parse(pkg.plannedStart);
        const e = Date.parse(pkg.plannedEnd);
        if (!Number.isNaN(s) && !Number.isNaN(e) && e >= s) {
          const a = pkg.actualStart ? Date.parse(pkg.actualStart) : NaN;
          scheduled.push({
            ...pkg,
            startMs: s,
            endMs: e,
            actualStartMs: !Number.isNaN(a) ? a : null,
          });
          return;
        }
      }
      unscheduled.push(pkg);
    });

    if (scheduled.length === 0) {
      return {
        scheduledPackages: [],
        unscheduledPackages: unscheduled,
        timelineBounds: null,
      };
    }

    let minMs = Math.min(...scheduled.map((p) => p.startMs));
    let maxMs = Math.max(...scheduled.map((p) => p.endMs));
    scheduled.forEach((p) => {
      if (p.actualStartMs !== null) {
        if (p.actualStartMs < minMs) minMs = p.actualStartMs;
        if (p.actualStartMs > maxMs) maxMs = p.actualStartMs;
      }
    });

    if (maxMs === minMs) {
      maxMs = minMs + 86400000;
    }

    return {
      scheduledPackages: scheduled,
      unscheduledPackages: unscheduled,
      timelineBounds: {
        minMs,
        maxMs,
        spanMs: maxMs - minMs,
        minLabel: new Date(minMs).toISOString().slice(0, 10),
        maxLabel: new Date(maxMs).toISOString().slice(0, 10),
      },
    };
  }, [packages]);

  const filteredTablePackages = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    return packages.filter((p) => {
      if (tableFilter !== 'ALL' && p.category !== tableFilter) return false;
      if (q) {
        const label = `${p.code ?? ''} ${p.name} ${p.category}`.toLowerCase();
        if (!label.includes(q)) return false;
      }
      return true;
    });
  }, [packages, tableFilter, tableSearch]);

  const floorsDescending = useMemo(() => {
    const arr: number[] = [];
    for (let f = 32; f >= 1; f -= 1) {
      arr.push(f);
    }
    return arr;
  }, []);

  const handleNumericInlineChange = (
    pkgId: string,
    field: 'plannedPercent' | 'percentComplete' | 'scheduleVarianceDays',
    rawValue: string
  ) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      onInlineUpdatePackage(pkgId, { [field]: null });
      return;
    }
    const num = Number(trimmed);
    if (Number.isNaN(num)) return;

    if (field === 'plannedPercent' || field === 'percentComplete') {
      const clamped = Math.max(0, Math.min(100, num));
      onInlineUpdatePackage(pkgId, { [field]: clamped });
    } else {
      onInlineUpdatePackage(pkgId, { [field]: Math.round(num) });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Progress Monitoring
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {EVANIA_DATA.project.name} · {EVANIA_DATA.project.scope} · Aluform Floors{' '}
            {EVANIA_DATA.project.aluformFloors} ({EVANIA_DATA.project.totalFlats} Flats)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInlineMatrix((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
        >
          <Table2 className="h-3.5 w-3.5" />
          <span>{showInlineMatrix ? 'Hide Inline Table' : 'Edit Progress Table'}</span>
        </button>
      </div>

      {/* Executive Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Budget-Weighted Completion</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {metrics.weightedCompletionPct !== null
              ? `${metrics.weightedCompletionPct.toFixed(1)}%`
              : '0.0%'}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {metrics.updatedPctCount} of {packages.length} packages updated
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Execution Status Split</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {metrics.onTrack}{' '}
            <span className="font-sans text-xs font-medium text-emerald-700">On Track</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {metrics.atWatch} At Watch · {metrics.atRisk} At Risk · {metrics.notStarted} Not Started
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Schedule Delays Logged</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {metrics.behindSchedule}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.behindSchedule === 0
              ? 'No negative schedule variance logged'
              : 'Packages reporting negative days variance'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Tower A RCC Floors (1–32)</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {floorSummary.slabCast}{' '}
            <span className="font-sans text-xs font-medium text-slate-500">/ 32 Slab Cast</span>
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {floorSummary.inProgress} In Progress · {floorSummary.notStarted} Not Started
          </p>
        </div>
      </section>

      {/* 1 & 2. Visual Analytics Grid (2 Graphical Representations) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Graph 1: Planned vs Actual % OR Top Packages by R1 Budget & Status */}
        <section className="xl:col-span-7 rounded-xl border border-slate-200 bg-white p-5 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900">
                {effectiveChartMode === 'planned-vs-actual'
                  ? 'Planned vs Actual Completion (%)'
                  : 'Top 10 Work Packages by R1 Budget & Status'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {effectiveChartMode === 'planned-vs-actual'
                  ? 'Compares entered Planned % against Actual % across updated packages'
                  : 'Highlights highest-cost packages colored by current execution status (₹ Cr)'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setChartMode('budget-readiness')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    effectiveChartMode === 'budget-readiness'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Budget &amp; Status
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('planned-vs-actual')}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    effectiveChartMode === 'planned-vs-actual'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Planned vs Actual
                </button>
              </div>

              <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                {(['ALL', 'Civil', 'MEP'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setChartCategoryFilter(tab)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      chartCategoryFilter === tab
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'ALL' ? 'All' : tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {effectiveChartMode === 'planned-vs-actual' ? (
            progressPackages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-14 px-4">
                <p className="text-sm font-medium text-slate-800">
                  No Planned % or Actual % entered yet
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Enter completion percentages on any package to compare Planned vs Actual progress bars here.
                </p>
                <button
                  type="button"
                  onClick={() => setShowInlineMatrix(true)}
                  className="mt-4 rounded-lg bg-[#0F1E36] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D3557]"
                >
                  Open Inline Progress Editor
                </button>
              </div>
            ) : (
              <div className="mt-4 h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={progressPackages}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#475569' }}
                      unit="%"
                    />
                    <YAxis
                      type="category"
                      dataKey="shortLabel"
                      width={165}
                      tick={{ fontSize: 11, fill: '#1E293B' }}
                    />
                    <Tooltip
                      formatter={(val, name) => [`${Number(val ?? 0)}%`, String(name)]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="plannedPct"
                      name="Planned %"
                      fill="#94A3B8"
                      radius={[0, 3, 3, 0]}
                      barSize={10}
                    />
                    <Bar
                      dataKey="actualPct"
                      name="Actual %"
                      fill="#0284C7"
                      radius={[0, 3, 3, 0]}
                      barSize={10}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                {STATUS_OPTIONS.map((status) => (
                  <span key={status} className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-xs"
                      style={{ backgroundColor: STATUS_COLORS[status] }}
                    />
                    {status}
                  </span>
                ))}
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topBudgetStatusData}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      tickFormatter={(v) => `₹${v}`}
                      unit=" Cr"
                    />
                    <YAxis
                      type="category"
                      dataKey="shortLabel"
                      width={165}
                      tick={{ fontSize: 11, fill: '#1E293B' }}
                    />
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const pct = item?.payload?.percentComplete;
                        const status = item?.payload?.status ?? 'Not Started';
                        const pctLabel = pct !== null && pct !== undefined ? `${pct}% done` : 'Progress not entered';
                        return [`${formatCr(Number(value ?? 0))} · ${status} (${pctLabel})`, 'R1 Budget'];
                      }}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="budgetCr" radius={[0, 4, 4, 0]} barSize={16}>
                      {topBudgetStatusData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>

        {/* Graph 2: Portfolio Status Donut + Tower A RCC Floor Zone Stacked Progress */}
        <section className="xl:col-span-5 rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between gap-5">
          {/* Top Half: Package Status Breakdown by Budget ₹ Cr */}
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Execution Health by Budget Share
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                R1 budget distribution across package execution statuses
              </p>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 items-center gap-3">
              <div className="relative h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusSplitData}
                      dataKey="budgetCr"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={2}
                    >
                      {statusSplitData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCr(Number(value ?? 0))}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-500">Total Scope</span>
                  <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                    {formatCr(EVANIA_DATA.budgetTotals.grandTotal.totalCr)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {statusSplitData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-100 last:border-b-0"
                  >
                    <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                      <span
                        className="h-2.5 w-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>
                        {item.name} ({item.count})
                      </span>
                    </span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatCr(item.budgetCr)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Half: Tower A RCC Floor Progress by Zone */}
          <div className="pt-4 border-t border-slate-100">
            <div className="mb-3">
              <h4 className="font-display text-sm font-semibold text-slate-900">
                RCC Slab Progress by Zone (32 Floors)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Aluform (Floors 8–32) vs Conventional Lower Floors (1–7)
              </p>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={floorZoneChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} />
                  <YAxis
                    type="category"
                    dataKey="zone"
                    width={142}
                    tick={{ fontSize: 11, fill: '#1E293B' }}
                  />
                  <Tooltip
                    formatter={(value, name) => [`${Number(value ?? 0)} floors`, String(name)]}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="slabCast" name="Slab Cast" stackId="floors" fill="#16A34A" barSize={18} />
                  <Bar dataKey="inProgress" name="In Progress" stackId="floors" fill="#D97706" barSize={18} />
                  <Bar dataKey="notStarted" name="Not Started" stackId="floors" fill="#CBD5E1" barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      {/* Collapsible Inline-Editable Progress Matrix (hidden by default to reduce verbosity) */}
      {showInlineMatrix && (
        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Package Progress Matrix (Inline Editable)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit Planned %, Actual %, Variance (days), and Status directly below. Changes save immediately to localStorage.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="search"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search package..."
                aria-label="Search work packages"
                className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
              <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                {(['ALL', 'Civil', 'MEP'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTableFilter(tab)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      tableFilter === tab
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'ALL' ? 'All' : tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium">
                  <th className="py-3 px-4 min-w-[220px]">Package</th>
                  <th className="py-3 px-4 whitespace-nowrap">Planned %</th>
                  <th className="py-3 px-4 whitespace-nowrap">Actual %</th>
                  <th className="py-3 px-4 whitespace-nowrap">Variance (Days)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Dates / More</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTablePackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-slate-900">
                        {pkg.code ? `${pkg.code} · ${pkg.name}` : pkg.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{pkg.category}</p>
                    </td>

                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        aria-label={`Planned percentage for ${pkg.name}`}
                        placeholder="Not yet updated"
                        value={pkg.plannedPercent ?? ''}
                        onChange={(e) =>
                          handleNumericInlineChange(
                            pkg.id,
                            'plannedPercent',
                            e.target.value
                          )
                        }
                        className="w-32 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 tabular-nums placeholder:text-slate-400 placeholder:italic focus:border-slate-900 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        aria-label={`Actual percentage for ${pkg.name}`}
                        placeholder="Not yet updated"
                        value={pkg.percentComplete ?? ''}
                        onChange={(e) =>
                          handleNumericInlineChange(
                            pkg.id,
                            'percentComplete',
                            e.target.value
                          )
                        }
                        className="w-32 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 tabular-nums placeholder:text-slate-400 placeholder:italic focus:border-slate-900 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-4">
                      <input
                        type="number"
                        step={1}
                        aria-label={`Schedule variance in days for ${pkg.name}`}
                        placeholder="Not yet updated"
                        value={pkg.scheduleVarianceDays ?? ''}
                        onChange={(e) =>
                          handleNumericInlineChange(
                            pkg.id,
                            'scheduleVarianceDays',
                            e.target.value
                          )
                        }
                        className="w-32 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 tabular-nums placeholder:text-slate-400 placeholder:italic focus:border-slate-900 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-4">
                      <select
                        aria-label={`Status for ${pkg.name}`}
                        value={pkg.status ?? ''}
                        onChange={(e) =>
                          onInlineUpdatePackage(pkg.id, {
                            status: e.target.value
                              ? (e.target.value as PackageStatus)
                              : null,
                          })
                        }
                        className={`w-36 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-slate-900 focus:outline-none ${
                          pkg.status ? 'text-slate-900 font-medium' : 'text-slate-400 italic'
                        }`}
                      >
                        <option value="">Not yet updated</option>
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt} className="not-italic text-slate-900">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEditPackage(pkg.id)}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <PenSquare className="h-3 w-3" />
                        <span>Full Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 3. Gantt-Style Timeline (compact unscheduled toggle) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Package Schedule Timeline (Gantt View)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Driven strictly by entered Planned Start, Planned End, and Actual Start dates
            </p>
          </div>
          {timelineBounds && (
            <div className="flex items-center gap-4 text-xs text-slate-600 font-mono tabular-nums">
              <span>{timelineBounds.minLabel}</span>
              <span>→</span>
              <span>{timelineBounds.maxLabel}</span>
            </div>
          )}
        </div>

        {scheduledPackages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
            <Calendar className="h-7 w-7 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-800">
              No packages have planned start and end dates entered yet
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add planned dates to any package to plot its schedule bar here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pb-1">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-xs bg-slate-200 border border-slate-300" />
                Planned Span
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-4 rounded-xs bg-[#0284C7]" />
                Actual % Fill
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-0.5 bg-amber-600" />
                Actual Start Marker
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {scheduledPackages.map((pkg) => {
                const leftPct =
                  ((pkg.startMs - timelineBounds!.minMs) / timelineBounds!.spanMs) * 100;
                const widthPct = Math.max(
                  2,
                  ((pkg.endMs - pkg.startMs) / timelineBounds!.spanMs) * 100
                );
                const actualLeftPct =
                  pkg.actualStartMs !== null
                    ? ((pkg.actualStartMs - timelineBounds!.minMs) /
                        timelineBounds!.spanMs) *
                      100
                    : null;
                const fillPct =
                  pkg.percentComplete !== null
                    ? Math.max(0, Math.min(100, pkg.percentComplete))
                    : 0;

                return (
                  <div
                    key={pkg.id}
                    className="grid grid-cols-1 md:grid-cols-12 items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50/70"
                  >
                    <div className="md:col-span-4 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {pkg.code ? `${pkg.code} · ${pkg.name}` : pkg.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 tabular-nums mt-0.5">
                        {pkg.plannedStart} → {pkg.plannedEnd}
                        {pkg.actualStart ? ` · Act: ${pkg.actualStart}` : ''}
                      </p>
                    </div>

                    <div className="md:col-span-7">
                      <div className="relative h-6 w-full rounded bg-slate-100">
                        <div
                          className="absolute top-1 bottom-1 rounded bg-slate-200 border border-slate-300 overflow-hidden"
                          style={{
                            left: `${Math.max(0, Math.min(98, leftPct))}%`,
                            width: `${Math.min(100 - leftPct, widthPct)}%`,
                          }}
                          title={`${pkg.name}: ${pkg.plannedStart} to ${pkg.plannedEnd}`}
                        >
                          <div
                            className="h-full bg-[#0284C7]"
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>

                        {actualLeftPct !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-amber-600"
                            style={{
                              left: `${Math.max(0, Math.min(100, actualLeftPct))}%`,
                            }}
                            title={`Actual Start: ${pkg.actualStart}`}
                          />
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => onEditPackage(pkg.id)}
                        className="text-[11px] font-medium text-slate-600 underline hover:text-slate-900"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {unscheduledPackages.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowUnscheduled((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900"
            >
              {showUnscheduled ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              <span>
                {showUnscheduled ? 'Hide' : 'Show'} {unscheduledPackages.length} packages without dates
              </span>
            </button>

            {showUnscheduled && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {unscheduledPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs"
                  >
                    <span className="text-slate-800 truncate">
                      {pkg.code ? `${pkg.code} · ${pkg.name}` : pkg.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onEditPackage(pkg.id)}
                      className="shrink-0 rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Add Dates
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 4. Tower A RCC Floor-Progress Tracker (Floors 1 to 32) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Tower A RCC Floor-Progress Tracker (Floors 1 to 32)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any floor cell to cycle status (Not Started → In Progress → Slab Cast). Updates reflect live in the zone chart above.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 text-xs tabular-nums">
              <span className="text-slate-600">
                Not Started: <strong className="font-mono text-slate-900">{floorSummary.notStarted}</strong>
              </span>
              <span className="text-amber-700">
                In Progress: <strong className="font-mono">{floorSummary.inProgress}</strong>
              </span>
              <span className="text-emerald-700">
                Slab Cast: <strong className="font-mono">{floorSummary.slabCast}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={onResetFloors}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Floors</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {floorsDescending.map((floor) => {
            const status = floorProgress[floor] ?? 'Not Started';
            const isAluform = floor >= 8;

            return (
              <button
                key={floor}
                type="button"
                onClick={() => onUpdateFloor(floor, FLOOR_CYCLE[status])}
                className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${getFloorCellClasses(
                  status
                )}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-xs font-semibold tabular-nums">
                    Floor {floor}
                  </span>
                  {isAluform && (
                    <span className="text-[10px] font-medium text-sky-700">
                      Aluform
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] font-medium">{status}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
