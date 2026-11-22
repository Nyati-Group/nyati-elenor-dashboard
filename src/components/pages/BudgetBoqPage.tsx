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
import { EVANIA_DATA, formatIndianNumber, formatInr } from '../../data/evaniaData';

const GROUPED_BHK_COLORS: Record<'4 BHK' | '3 BHK' | '2 BHK', string> = {
  '4 BHK': '#0F1E36',
  '3 BHK': '#0284C7',
  '2 BHK': '#64748B',
};

function formatSignedCr(val: number): string {
  const fixed = Math.abs(val).toFixed(2);
  if (val > 0.0001) return `+₹${fixed} Cr`;
  if (val < -0.0001) return `-₹${fixed} Cr`;
  return `₹0.00 Cr`;
}

function formatSignedInr(val: number): string {
  const absFormatted = formatIndianNumber(Math.abs(val), 2);
  if (val > 0.0001) return `+₹${absFormatted}`;
  if (val < -0.0001) return `-₹${absFormatted}`;
  return `₹0.00`;
}

function formatSignedPct(val: number): string {
  const absPct = Math.abs(val).toFixed(2);
  if (val > 0.0001) return `+${absPct}%`;
  if (val < -0.0001) return `-${absPct}%`;
  return `0.00%`;
}

export function BudgetBoqPage() {
  const {
    project,
    flatMixUnits,
    flatMixGrouped,
    excavationBudgetByPart,
    benchmark,
    lineItemReviewStatusCounts,
  } = EVANIA_DATA;

  const excavationChartRows = excavationBudgetByPart.filter(
    (row) => row.part !== 'Total'
  );

  const rccDiffInr =
    benchmark.rccRatePerSqm.evaniaInr - benchmark.rccRatePerSqm.evoqueInr;
  const rccDiffPct =
    (rccDiffInr / benchmark.rccRatePerSqm.evoqueInr) * 100;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-900">
          Budget &amp; BOQ
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">
          {project.name} · {project.scope} · {project.estimateRef} ({project.currentRevision})
        </p>
      </div>

      {/* Review Status Counters */}
      <section aria-label="Line-Item Review Status">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {lineItemReviewStatusCounts.map((item) => {
            const accentClass =
              item.status === 'Signoff Done'
                ? 'text-emerald-700'
                : item.status === 'Qty Crosscheck pending'
                ? 'text-amber-700'
                : 'text-red-700';
            return (
              <div
                key={item.status}
                className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Line-Item Review Status
                  </p>
                  <p className={`mt-1 text-sm font-semibold ${accentClass}`}>
                    {item.status}
                  </p>
                </div>
                <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Area Panel + Flat Mix Charts */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-6">
        <div className="pb-3 border-b border-slate-200">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Area &amp; Flat Mix Analysis ({formatIndianNumber(project.totalFlats)} Units)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Saleable vs built-up area and Tower A unit distribution across Aluform floors {project.aluformFloors}
          </p>
        </div>

        {/* Saleable vs Built-up Area Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Saleable Area</p>
              <p className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                {formatIndianNumber(project.saleableAreaSqm, 2)} sqm
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Approx. Sq. Ft.</p>
              <p className="mt-1 font-mono text-base font-medium text-slate-700 tabular-nums">
                ≈ {formatIndianNumber(project.saleableAreaSftApprox)} sft
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Built-up Area</p>
              <p className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
                {formatIndianNumber(project.builtUpAreaSqm, 2)} sqm
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Approx. Sq. Ft.</p>
              <p className="mt-1 font-mono text-base font-medium text-slate-700 tabular-nums">
                ≈ {formatIndianNumber(project.builtUpAreaSftApprox)} sft
              </p>
            </div>
          </div>
        </div>

        {/* Flat Mix Bar Chart (7 unit types) + Grouped Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <h4 className="text-xs font-semibold text-slate-700 mb-3">
              Flat Mix by Unit Label (7 Unit Types)
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={flatMixUnits}
                  margin={{ top: 8, right: 16, left: -12, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="unitLabel"
                    tick={{ fontSize: 11, fill: '#334155' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value) => [`${Number(value ?? 0)} units`, 'Count']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                    {flatMixUnits.map((unit) => (
                      <Cell
                        key={unit.unitLabel}
                        fill={GROUPED_BHK_COLORS[unit.group]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5">
            <h4 className="text-xs font-semibold text-slate-700 mb-3">
              Grouped Flat Mix (4 / 3 / 2 BHK)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 items-center gap-4">
              <div className="relative h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={flatMixGrouped}
                      dataKey="count"
                      nameKey="group"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={2}
                    >
                      {flatMixGrouped.map((entry) => (
                        <Cell
                          key={entry.group}
                          fill={GROUPED_BHK_COLORS[entry.group]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => `${Number(val ?? 0)} flats`}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-slate-500">Total Flats</span>
                  <span className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                    {project.totalFlats}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {flatMixGrouped.map((g) => (
                  <div
                    key={g.group}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: GROUPED_BHK_COLORS[g.group] }}
                      />
                      <div>
                        <span className="font-medium text-slate-900">{g.group}</span>
                        {g.note && (
                          <span className="ml-1 text-[11px] text-slate-500">
                            ({g.note})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {g.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Excavation Revisions: Grouped Bar Chart + Table with Differences */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="pb-3 border-b border-slate-200">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Excavation Budget Revisions (Present Budget vs R0 vs R1)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Values in ₹ Cr across Part A, Part B, and Part C (Commercial)
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={excavationChartRows}
                margin={{ top: 8, right: 16, left: -8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="part" tick={{ fontSize: 11, fill: '#334155' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  formatter={(value) => `₹${Number(value ?? 0).toFixed(2)} Cr`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="presentBudgetCr"
                  name="Present Budget"
                  fill="#94A3B8"
                  radius={[3, 3, 0, 0]}
                />
                <Bar dataKey="r0Cr" name="R0" fill="#0284C7" radius={[3, 3, 0, 0]} />
                <Bar dataKey="r1Cr" name="R1" fill="#0F1E36" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="xl:col-span-7 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium">
                  <th className="py-2.5 px-3">Part</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">
                    Present (₹ Cr)
                  </th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">
                    R0 (₹ Cr)
                  </th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">
                    R1 (₹ Cr)
                  </th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">
                    R1 − Present
                  </th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">
                    R1 − R0
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {excavationBudgetByPart.map((row) => {
                  const diffPresent = row.r1Cr - row.presentBudgetCr;
                  const diffR0 = row.r1Cr - row.r0Cr;
                  const isTotal = row.part === 'Total';
                  return (
                    <tr
                      key={row.part}
                      className={isTotal ? 'bg-slate-50 font-semibold' : ''}
                    >
                      <td className="py-2.5 px-3 text-slate-900">{row.part}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        {row.presentBudgetCr.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        {row.r0Cr.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">
                        {row.r1Cr.toFixed(2)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums ${
                          diffPresent > 0.0001
                            ? 'text-red-700'
                            : diffPresent < -0.0001
                            ? 'text-emerald-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {formatSignedCr(diffPresent)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums ${
                          diffR0 > 0.0001
                            ? 'text-red-700'
                            : diffR0 < -0.0001
                            ? 'text-emerald-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {formatSignedCr(diffR0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Benchmark vs Nyati Evoque */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Benchmark Comparison: Nyati Evania vs {benchmark.comparisonProject}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Evania Saleable Area: {formatIndianNumber(project.saleableAreaSqm, 2)} sqm ·{' '}
              {benchmark.comparisonProject} Saleable Area:{' '}
              {formatIndianNumber(benchmark.evoqueSaleableAreaSqm, 2)} sqm
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-red-700 font-medium">Red: Evania higher</span>
            <span className="text-emerald-700 font-medium">Green: Evania lower</span>
          </div>
        </div>

        {/* RCC per-sqm comparison card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              RCC Rate per sqm (Nyati Evania)
            </p>
            <p className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
              {formatInr(benchmark.rccRatePerSqm.evaniaInr, 0)} / sqm
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              RCC Rate per sqm ({benchmark.comparisonProject})
            </p>
            <p className="mt-1 font-mono text-xl font-semibold text-slate-700 tabular-nums">
              {formatInr(benchmark.rccRatePerSqm.evoqueInr, 0)} / sqm
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">
              RCC Rate Variance (Evania vs Evoque)
            </p>
            <p
              className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
                rccDiffInr > 0
                  ? 'text-red-700'
                  : rccDiffInr < 0
                  ? 'text-emerald-700'
                  : 'text-slate-700'
              }`}
            >
              +{formatInr(rccDiffInr, 0)} ({formatSignedPct(rccDiffPct)})
            </p>
          </div>
        </div>

        {/* 8 Rates Table (incl. GST) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-medium">
                <th className="py-3 px-4">Item (incl. GST)</th>
                <th className="py-3 px-4 whitespace-nowrap">Unit</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">
                  Evania Rate (₹)
                </th>
                <th className="py-3 px-4 text-right whitespace-nowrap">
                  Evoque Rate (₹)
                </th>
                <th className="py-3 px-4 text-right whitespace-nowrap">
                  Difference (₹)
                </th>
                <th className="py-3 px-4 text-right whitespace-nowrap">
                  Difference (%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {benchmark.ratesInclGst.map((row) => {
                const diffInr = row.evaniaRateInr - row.evoqueRateInr;
                const diffPct = (diffInr / row.evoqueRateInr) * 100;
                const isHigher = diffInr > 0.0001;
                const isLower = diffInr < -0.0001;
                const diffColorClass = isHigher
                  ? 'text-red-700 font-semibold'
                  : isLower
                  ? 'text-emerald-700 font-semibold'
                  : 'text-slate-600 font-medium';

                return (
                  <tr key={row.item} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {row.item}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {row.unitLabel}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-900 tabular-nums whitespace-nowrap">
                      {formatInr(row.evaniaRateInr, 2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums whitespace-nowrap">
                      {formatInr(row.evoqueRateInr, 2)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap ${diffColorClass}`}
                    >
                      {formatSignedInr(diffInr)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap ${diffColorClass}`}
                    >
                      {formatSignedPct(diffPct)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
