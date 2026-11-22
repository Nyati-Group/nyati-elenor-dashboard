import { useMemo } from 'react';
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
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Pencil, CalendarClock } from 'lucide-react';
import {
  EVANIA_DATA,
  ProjectInfo,
  WorkPackage,
  formatCr,
  formatIndianNumber,
  formatInr,
} from '../../data/evaniaData';

interface ExecutiveDashboardPageProps {
  project: ProjectInfo;
  packages: WorkPackage[];
  onOpenEditProject: () => void;
  onOpenEditPackage: (packageId?: string) => void;
}

const CIVIL_COLOR = '#0F1E36';
const MEP_COLOR = '#0284C7';

function computeScheduleElapsedPercent(
  plannedStart: string,
  plannedEnd: string
): number | null {
  const startMs = Date.parse(plannedStart);
  const endMs = Date.parse(plannedEnd);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    return null;
  }
  const nowMs = Date.now();
  if (nowMs <= startMs) return 0;
  if (nowMs >= endMs) return 100;
  return Number((((nowMs - startMs) / (endMs - startMs)) * 100).toFixed(1));
}

function formatScheduleVariance(days: number | null): string {
  if (days === null) return 'Not yet updated';
  if (days === 0) return 'On schedule (0d)';
  if (days > 0) return `${days}d ahead`;
  return `${Math.abs(days)}d behind`;
}

export function ExecutiveDashboardPage({
  project,
  packages,
  onOpenEditProject,
  onOpenEditPackage,
}: ExecutiveDashboardPageProps) {
  const { budgetTotals, flatMixGrouped } = EVANIA_DATA;

  const kpis = useMemo(() => {
    const civilCount = packages.filter((p) => p.category === 'Civil').length;
    const mepCount = packages.filter((p) => p.category === 'MEP').length;

    let onTrack = 0;
    let atWatch = 0;
    let atRisk = 0;
    let notStarted = 0;

    packages.forEach((p) => {
      if (p.status === 'On Track') onTrack += 1;
      else if (p.status === 'At Watch') atWatch += 1;
      else if (p.status === 'At Risk') atRisk += 1;
      else notStarted += 1; // null or 'Not Started'
    });

    const packagesWithPct = packages.filter((p) => p.percentComplete !== null);
    const totalPackageBudget = packages.reduce((acc, p) => acc + p.budgetCr, 0);
    const overallCompletionPct =
      packagesWithPct.length > 0 && totalPackageBudget > 0
        ? packages.reduce(
            (acc, p) => acc + p.budgetCr * (p.percentComplete ?? 0),
            0
          ) / totalPackageBudget
        : null;

    const packagesWithSpent = packages.filter((p) => p.amountSpentCr !== null);
    const totalSpentCr =
      packagesWithSpent.length > 0
        ? packagesWithSpent.reduce((acc, p) => acc + (p.amountSpentCr ?? 0), 0)
        : null;

    const packagesWithRisk = packages.filter((p) => p.riskScore !== null);
    const healthScore =
      packagesWithRisk.length > 0
        ? Math.round(
            100 -
              packagesWithRisk.reduce((acc, p) => acc + (p.riskScore ?? 0), 0) /
                packagesWithRisk.length
          )
        : null;

    return {
      civilCount,
      mepCount,
      onTrack,
      atWatch,
      atRisk,
      notStarted,
      overallCompletionPct,
      enteredPctCount: packagesWithPct.length,
      totalSpentCr,
      enteredSpentCount: packagesWithSpent.length,
      healthScore,
      enteredRiskCount: packagesWithRisk.length,
    };
  }, [packages]);

  const budgetBarData = useMemo(() => {
    return [...packages]
      .sort((a, b) => b.budgetCr - a.budgetCr)
      .map((p) => ({
        id: p.id,
        label: p.code ? `${p.code} · ${p.name}` : p.name,
        shortLabel:
          (p.code ? `${p.code}. ${p.name}` : p.name).length > 26
            ? `${(p.code ? `${p.code}. ${p.name}` : p.name).slice(0, 24)}…`
            : p.code
            ? `${p.code}. ${p.name}`
            : p.name,
        budgetCr: p.budgetCr,
        category: p.category,
      }));
  }, [packages]);

  const civilMepSplitData = useMemo(
    () => [
      {
        name: 'Civil',
        value: budgetTotals.civil.totalCr,
        ratePerSqm: budgetTotals.civil.ratePerSqmSaleable,
        color: CIVIL_COLOR,
      },
      {
        name: 'MEP',
        value: budgetTotals.mep.totalCr,
        ratePerSqm: budgetTotals.mep.ratePerSqmSaleable,
        color: MEP_COLOR,
      },
    ],
    [budgetTotals]
  );

  const plannedVsActualData = useMemo(() => {
    return packages
      .filter(
        (p) =>
          p.plannedStart !== null &&
          p.plannedEnd !== null &&
          p.percentComplete !== null
      )
      .map((p) => {
        const computedPlanned =
          p.plannedPercent ??
          computeScheduleElapsedPercent(p.plannedStart!, p.plannedEnd!);
        return {
          name: p.code ? `${p.code}. ${p.name}` : p.name,
          plannedPct: computedPlanned ?? 0,
          actualPct: p.percentComplete ?? 0,
        };
      });
  }, [packages]);

  const noDataProjectRows: Array<{ label: string; value: string | null }> = [
    { label: 'Location', value: project.location },
    { label: 'Start Date', value: project.startDate },
    { label: 'Planned Completion', value: project.plannedCompletion },
    { label: 'Contractor Names', value: project.contractorNames },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Executive Dashboard
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {project.name} · {project.scope} · {project.estimateRef}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenEditProject}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span>Edit Project Info</span>
        </button>
      </div>

      {/* 8 KPI Cards (Top Row: 2x4 on desktop) */}
      <section
        aria-label="Key Performance Indicators"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {/* 1. Total Budget (R1) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Budget (R1)</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {formatCr(budgetTotals.grandTotal.totalCr)}
          </p>
          <p className="mt-1.5 text-xs text-slate-600 tabular-nums">
            Civil {formatCr(budgetTotals.civil.totalCr)} / MEP{' '}
            {formatCr(budgetTotals.mep.totalCr)}
          </p>
        </div>

        {/* 2. Cost per sqm (saleable) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Cost per sqm (saleable)
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {formatInr(Math.round(budgetTotals.grandTotal.ratePerSqmSaleable), 0)}
          </p>
          <p className="mt-1.5 text-xs text-slate-600 tabular-nums">
            {formatIndianNumber(project.saleableAreaSqm, 2)} sqm saleable
          </p>
        </div>

        {/* 3. Total Flats */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Flats</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {formatIndianNumber(project.totalFlats)}
          </p>
          <p className="mt-1.5 text-xs text-slate-600 tabular-nums">
            {flatMixGrouped.map((g) => `${g.group}: ${g.count}`).join(' · ')}
          </p>
        </div>

        {/* 4. Work Packages */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Work Packages</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {packages.length}
          </p>
          <p className="mt-1.5 text-xs text-slate-600 tabular-nums">
            {kpis.civilCount} Civil · {kpis.mepCount} MEP
          </p>
        </div>

        {/* 5. Status Counts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Package Status Split</p>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs tabular-nums">
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 font-medium">On Track</span>
              <span className="font-mono font-semibold text-slate-900">
                {kpis.onTrack}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-700 font-medium">At Watch</span>
              <span className="font-mono font-semibold text-slate-900">
                {kpis.atWatch}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-700 font-medium">At Risk</span>
              <span className="font-mono font-semibold text-slate-900">
                {kpis.atRisk}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Not Started</span>
              <span className="font-mono font-semibold text-slate-900">
                {kpis.notStarted}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Overall Completion % */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Overall Completion %
          </p>
          {kpis.overallCompletionPct !== null ? (
            <>
              <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {kpis.overallCompletionPct.toFixed(1)}%
              </p>
              <p className="mt-1.5 text-xs text-slate-600 tabular-nums">
                Budget-weighted ({kpis.enteredPctCount} of {packages.length} updated)
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-medium text-amber-700 italic">
                Not yet updated
              </p>
              <button
                type="button"
                onClick={() => onOpenEditPackage()}
                className="mt-1.5 text-xs font-medium text-slate-700 underline hover:text-slate-900"
              >
                Update package %
              </button>
            </>
          )}
        </div>

        {/* 7. Amount Spent vs Budget */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Amount Spent vs Budget
          </p>
          {kpis.totalSpentCr !== null ? (
            <>
              <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {formatCr(kpis.totalSpentCr)}
              </p>
              <p className="mt-1.5 text-xs text-slate-600 tabular-nums">
                of {formatCr(budgetTotals.grandTotal.totalCr)} ({kpis.enteredSpentCount}{' '}
                packages)
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-medium text-amber-700 italic">
                Not yet updated
              </p>
              <button
                type="button"
                onClick={() => onOpenEditPackage()}
                className="mt-1.5 text-xs font-medium text-slate-700 underline hover:text-slate-900"
              >
                Log amount spent
              </button>
            </>
          )}
        </div>

        {/* 8. Project Health Score (0-100) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">
            Project Health Score (0–100)
          </p>
          {kpis.healthScore !== null ? (
            <>
              <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                {kpis.healthScore} / 100
              </p>
              <p className="mt-1.5 text-xs text-slate-600 tabular-nums">
                100 − avg risk ({kpis.enteredRiskCount} packages scored)
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-medium text-amber-700 italic">
                Not yet assessed
              </p>
              <button
                type="button"
                onClick={() => onOpenEditPackage()}
                className="mt-1.5 text-xs font-medium text-slate-700 underline hover:text-slate-900"
              >
                Enter risk scores
              </button>
            </>
          )}
        </div>
      </section>

      {/* Project Execution Metadata (NO DATA fields with Edit buttons) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Project Execution Metadata
          </h3>
          <button
            type="button"
            onClick={onOpenEditProject}
            className="inline-flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Pencil className="h-3 w-3" />
            <span>Edit</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
          {noDataProjectRows.map((row) => (
            <div key={row.label} className="space-y-1">
              <p className="text-xs text-slate-500">{row.label}</p>
              <div className="flex items-center justify-between gap-2">
                <p
                  className={
                    row.value
                      ? 'text-sm font-medium text-slate-900 truncate'
                      : 'text-xs font-medium text-amber-700 italic'
                  }
                >
                  {row.value ?? 'Not yet updated'}
                </p>
                <button
                  type="button"
                  onClick={onOpenEditProject}
                  className="shrink-0 text-[11px] font-medium text-slate-600 underline hover:text-slate-900"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Budget by Work Package (horizontal bar chart, sorted high to low) */}
        <section className="xl:col-span-7 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Budget by Work Package
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All {packages.length} Civil &amp; MEP packages sorted high to low (₹ Cr)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#0F1E36]" />
                Civil
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-[#0284C7]" />
                MEP
              </span>
            </div>
          </div>

          <div className="mt-4 h-[640px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={budgetBarData}
                layout="vertical"
                margin={{ top: 4, right: 28, left: 8, bottom: 4 }}
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
                  width={175}
                  tick={{ fontSize: 11, fill: '#1E293B' }}
                />
                <Tooltip
                  formatter={(value) => [formatCr(Number(value ?? 0)), 'R1 Budget']}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.label ?? ''
                  }
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="budgetCr" radius={[0, 4, 4, 0]} barSize={16}>
                  {budgetBarData.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.category === 'Civil' ? CIVIL_COLOR : MEP_COLOR}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Right Column: Civil vs MEP Donut + Planned vs Actual Line Chart */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Civil vs MEP Split Donut */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Civil vs MEP Split
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tower A R1 exact totals (Grand Total {formatCr(budgetTotals.grandTotal.totalCr)})
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="relative h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={civilMepSplitData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {civilMepSplitData.map((entry) => (
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
                  <span className="text-[11px] text-slate-500">Grand Total</span>
                  <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {formatCr(budgetTotals.grandTotal.totalCr)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {civilMepSplitData.map((item) => (
                  <div
                    key={item.name}
                    className="rounded-lg border border-slate-200 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                        <span
                          className="h-2.5 w-2.5 rounded-xs"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.name}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCr(item.value)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {formatInr(item.ratePerSqm, 2)} / sqm saleable
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Planned vs Actual Progress Line Chart */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 flex-1 flex flex-col">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Planned vs Actual Progress
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Plots only packages with planned dates and actual % entered
              </p>
            </div>

            {plannedVsActualData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
                <CalendarClock className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-800">
                  No progress curve available yet
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Enter Planned Start, Planned End, and Actual % on at least one work package to plot Planned vs Actual progress.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenEditPackage()}
                  className="mt-4 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Update Package Dates &amp; %
                </button>
              </div>
            ) : (
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={plannedVsActualData}
                    margin={{ top: 8, right: 16, left: 0, bottom: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#475569' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={48}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#475569' }}
                      unit="%"
                    />
                    <Tooltip
                      formatter={(val) => `${Number(val ?? 0)}%`}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="plannedPct"
                      name="Planned %"
                      stroke="#64748B"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actualPct"
                      name="Actual %"
                      stroke="#0284C7"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Table: Package Roster */}
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Package Roster
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any package row to open its edit form and update tracking fields.
            </p>
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            {packages.length} total packages
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium">
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4 whitespace-nowrap">Category</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">
                  Budget ₹ Cr
                </th>
                <th className="py-3 px-4 whitespace-nowrap">Stage / Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">
                  Completion %
                </th>
                <th className="py-3 px-4 whitespace-nowrap">
                  Schedule (days ahead/behind)
                </th>
                <th className="py-3 px-4 text-right whitespace-nowrap">
                  Risk Score
                </th>
                <th className="py-3 px-4 whitespace-nowrap">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.map((pkg) => (
                <tr
                  key={pkg.id}
                  onClick={() => onOpenEditPackage(pkg.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenEditPackage(pkg.id);
                    }
                  }}
                  className="cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <span>{pkg.code ? `${pkg.code} · ${pkg.name}` : pkg.name}</span>
                    {pkg.estimateNote && (
                      <span className="block text-[11px] font-normal text-amber-700">
                        {pkg.estimateNote}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {pkg.category}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 tabular-nums whitespace-nowrap">
                    {formatCr(pkg.budgetCr)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {pkg.status ? (
                      <span
                        className={`font-medium ${
                          pkg.status === 'On Track'
                            ? 'text-emerald-700'
                            : pkg.status === 'At Watch'
                            ? 'text-amber-700'
                            : pkg.status === 'At Risk'
                            ? 'text-red-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {pkg.status}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not yet updated</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                    {pkg.percentComplete !== null ? (
                      <span className="text-slate-900">{pkg.percentComplete}%</span>
                    ) : (
                      <span className="font-sans text-slate-400 italic">
                        Not yet updated
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap tabular-nums">
                    {pkg.scheduleVarianceDays !== null ? (
                      <span
                        className={
                          pkg.scheduleVarianceDays > 0
                            ? 'text-emerald-700 font-medium'
                            : pkg.scheduleVarianceDays < 0
                            ? 'text-red-700 font-medium'
                            : 'text-slate-700'
                        }
                      >
                        {formatScheduleVariance(pkg.scheduleVarianceDays)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not yet updated</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                    {pkg.riskScore !== null ? (
                      <span className="text-slate-900">{pkg.riskScore}/100</span>
                    ) : (
                      <span className="font-sans text-slate-400 italic">
                        Not yet updated
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {pkg.owner ? (
                      <span className="text-slate-900">{pkg.owner}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not yet updated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
