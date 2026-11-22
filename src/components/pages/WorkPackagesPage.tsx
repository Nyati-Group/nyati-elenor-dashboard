import { useMemo, useState } from 'react';
import { Search, Pencil, X, ChevronRight } from 'lucide-react';
import {
  EVANIA_DATA,
  PackageCategory,
  PackageStatus,
  WorkPackage,
  formatCr,
} from '../../data/evaniaData';

interface WorkPackagesPageProps {
  packages: WorkPackage[];
  onEditPackage: (packageId: string) => void;
}

type StatusFilter = 'ALL' | 'UNSET' | PackageStatus;

function getStatusClasses(status: PackageStatus | null): string {
  switch (status) {
    case 'On Track':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'At Watch':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'At Risk':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'Not Started':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200 italic';
  }
}

export function WorkPackagesPage({
  packages,
  onEditPackage,
}: WorkPackagesPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | PackageCategory>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerPackageId, setDrawerPackageId] = useState<string | null>(null);

  const grandTotalCr = EVANIA_DATA.budgetTotals.grandTotal.totalCr;

  const filteredPackages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return packages.filter((pkg) => {
      if (categoryFilter !== 'ALL' && pkg.category !== categoryFilter) {
        return false;
      }
      if (statusFilter === 'UNSET' && pkg.status !== null) {
        return false;
      }
      if (
        statusFilter !== 'ALL' &&
        statusFilter !== 'UNSET' &&
        pkg.status !== statusFilter
      ) {
        return false;
      }
      if (q) {
        const haystack = [
          pkg.code ?? '',
          pkg.name,
          pkg.category,
          pkg.owner ?? '',
          pkg.remarks ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [packages, categoryFilter, statusFilter, searchQuery]);

  const activeDrawerPackage = useMemo(
    () => packages.find((p) => p.id === drawerPackageId) ?? null,
    [packages, drawerPackageId]
  );

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Work Packages
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {packages.length} packages (16 Civil · 9 MEP) against Tower A R1 Grand Total{' '}
            {formatCr(grandTotalCr)}. Select a card for full details and sub-breakdowns.
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Segmented Filter */}
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(['ALL', 'Civil', 'MEP'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Status Select */}
          <div className="flex items-center gap-2">
            <label htmlFor="wp-status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="wp-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNSET">Not yet updated</option>
              <option value="On Track">On Track</option>
              <option value="At Watch">At Watch</option>
              <option value="At Risk">At Risk</option>
              <option value="Not Started">Not Started</option>
            </select>
          </div>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, package, or owner..."
            aria-label="Search work packages"
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </div>
      </section>

      {/* Card Grid */}
      {filteredPackages.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-800">
            No work packages match your current filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-3 rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => {
            const pctOfTotal = (pkg.budgetCr / grandTotalCr) * 100;
            const progressWidth =
              pkg.percentComplete !== null
                ? Math.max(0, Math.min(100, pkg.percentComplete))
                : 0;

            return (
              <article
                key={pkg.id}
                className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  {/* Top Row: Code + Category & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono text-slate-500">
                      {pkg.code ? `${pkg.code} · ${pkg.category}` : pkg.category}
                    </span>
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${getStatusClasses(
                        pkg.status
                      )}`}
                    >
                      {pkg.status ?? 'Not yet updated'}
                    </span>
                  </div>

                  {/* Package Name */}
                  <h3 className="mt-2 font-display text-sm font-semibold text-slate-900 leading-snug">
                    {pkg.name}
                  </h3>
                  {pkg.estimateNote && (
                    <p className="mt-1 text-[11px] font-medium text-amber-700">
                      {pkg.estimateNote}
                    </p>
                  )}

                  {/* Budget & % of Total */}
                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <div>
                      <p className="text-[11px] text-slate-500">R1 Budget</p>
                      <p className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                        {formatCr(pkg.budgetCr)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500">% of Grand Total</p>
                      <p className="font-mono text-sm font-medium text-slate-700 tabular-nums">
                        {pctOfTotal.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Completion Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">Completion</span>
                      {pkg.percentComplete !== null ? (
                        <span className="font-mono font-medium text-slate-900 tabular-nums">
                          {pkg.percentComplete}%
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not yet updated</span>
                      )}
                    </div>
                    <div className="h-1.5 w-full rounded-sm bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#0284C7] transition-all duration-200"
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer: Owner + Drawer / Edit */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 truncate">
                    <span className="text-slate-500">Owner: </span>
                    {pkg.owner ? (
                      <span className="font-medium text-slate-800">{pkg.owner}</span>
                    ) : (
                      <span className="text-slate-400 italic">Not yet updated</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditPackage(pkg.id)}
                      className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerPackageId(pkg.id)}
                      className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-200"
                    >
                      <span>Details</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {activeDrawerPackage && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-package-title"
        >
          <div
            className="fixed inset-0"
            aria-hidden="true"
            onClick={() => setDrawerPackageId(null)}
          />
          <aside className="relative z-10 w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200 bg-slate-50">
              <div>
                <p className="text-xs font-mono text-slate-500">
                  {activeDrawerPackage.code
                    ? `Code ${activeDrawerPackage.code} · ${activeDrawerPackage.category}`
                    : activeDrawerPackage.category}
                </p>
                <h3
                  id="drawer-package-title"
                  className="mt-1 font-display text-lg font-semibold text-slate-900"
                >
                  {activeDrawerPackage.name}
                </h3>
                {activeDrawerPackage.estimateNote && (
                  <p className="mt-1 text-xs font-medium text-amber-700">
                    {activeDrawerPackage.estimateNote}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDrawerPackageId(null)}
                aria-label="Close package details"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Budget & Status Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 p-3.5">
                  <p className="text-[11px] text-slate-500">R1 Budget</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                    {formatCr(activeDrawerPackage.budgetCr)}
                  </p>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {((activeDrawerPackage.budgetCr / grandTotalCr) * 100).toFixed(2)}% of{' '}
                    {formatCr(grandTotalCr)}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 p-3.5">
                  <p className="text-[11px] text-slate-500">Amount Spent</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                    {activeDrawerPackage.amountSpentCr !== null ? (
                      formatCr(activeDrawerPackage.amountSpentCr)
                    ) : (
                      <span className="font-sans text-xs font-medium text-amber-700 italic">
                        Not yet updated
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* All Tracking Fields */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="font-display text-xs font-semibold text-slate-900">
                    Tracking &amp; Schedule Fields
                  </h4>
                  <button
                    type="button"
                    onClick={() => onEditPackage(activeDrawerPackage.id)}
                    className="inline-flex items-center gap-1 rounded border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit Fields</span>
                  </button>
                </div>

                <dl className="divide-y divide-slate-100 text-xs">
                  {[
                    ['Status', activeDrawerPackage.status],
                    ['Planned Start', activeDrawerPackage.plannedStart],
                    ['Planned End', activeDrawerPackage.plannedEnd],
                    ['Actual Start', activeDrawerPackage.actualStart],
                    [
                      'Planned %',
                      activeDrawerPackage.plannedPercent !== null
                        ? `${activeDrawerPackage.plannedPercent}%`
                        : null,
                    ],
                    [
                      'Actual % Complete',
                      activeDrawerPackage.percentComplete !== null
                        ? `${activeDrawerPackage.percentComplete}%`
                        : null,
                    ],
                    [
                      'Schedule Variance',
                      activeDrawerPackage.scheduleVarianceDays !== null
                        ? `${activeDrawerPackage.scheduleVarianceDays} days`
                        : null,
                    ],
                    [
                      'Risk Score (0–100)',
                      activeDrawerPackage.riskScore !== null
                        ? `${activeDrawerPackage.riskScore} / 100`
                        : null,
                    ],
                    ['Owner', activeDrawerPackage.owner],
                    ['Remarks', activeDrawerPackage.remarks],
                  ].map(([label, val]) => (
                    <div
                      key={String(label)}
                      className="py-2.5 flex items-start justify-between gap-4"
                    >
                      <dt className="text-slate-500 shrink-0">{label}</dt>
                      <dd className="text-right font-medium text-slate-900 break-words max-w-[60%]">
                        {val ? (
                          val
                        ) : (
                          <span className="text-amber-700 italic font-normal">
                            Not yet updated
                          </span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Sub-breakdowns where data exists in evaniaData.ts */}
              {activeDrawerPackage.id === 'civil-D' && (
                <div>
                  <h4 className="font-display text-xs font-semibold text-slate-900 pb-2 border-b border-slate-200">
                    Plaster Sub-Breakdown (₹ Cr)
                  </h4>
                  <table className="w-full text-xs mt-2">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-100">
                        <th className="py-1.5 text-left font-medium">Component</th>
                        <th className="py-1.5 text-right font-medium">Budget ₹ Cr</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {EVANIA_DATA.plasterBreakdown.map((item) => (
                        <tr key={item.item}>
                          <td className="py-2 text-slate-800">{item.item}</td>
                          <td className="py-2 text-right font-mono text-slate-900 tabular-nums">
                            {formatCr(item.budgetCr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeDrawerPackage.id === 'mep-lifts' && (
                <div>
                  <h4 className="font-display text-xs font-semibold text-slate-900 pb-2 border-b border-slate-200">
                    Lifts Configuration Breakdown (4 nos)
                  </h4>
                  <table className="w-full text-xs mt-2">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-100">
                        <th className="py-1.5 text-left font-medium">Specification</th>
                        <th className="py-1.5 text-right font-medium">Budget ₹ Cr</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {EVANIA_DATA.lifts.map((lift) => (
                        <tr key={lift.label}>
                          <td className="py-2 text-slate-800">{lift.label}</td>
                          <td className="py-2 text-right font-mono text-slate-900 tabular-nums">
                            {formatCr(lift.budgetCr)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeDrawerPackage.id === 'civil-A' && (
                <div>
                  <h4 className="font-display text-xs font-semibold text-slate-900 pb-2 border-b border-slate-200">
                    Excavation Budget by Part (₹ Cr)
                  </h4>
                  <table className="w-full text-xs mt-2">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-100">
                        <th className="py-1.5 text-left font-medium">Part</th>
                        <th className="py-1.5 text-right font-medium">Present</th>
                        <th className="py-1.5 text-right font-medium">R0</th>
                        <th className="py-1.5 text-right font-medium">R1</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {EVANIA_DATA.excavationBudgetByPart.map((row) => (
                        <tr
                          key={row.part}
                          className={row.part === 'Total' ? 'font-semibold bg-slate-50' : ''}
                        >
                          <td className="py-2 text-slate-800">{row.part}</td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {row.presentBudgetCr.toFixed(2)}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {row.r0Cr.toFixed(2)}
                          </td>
                          <td className="py-2 text-right font-mono tabular-nums">
                            {row.r1Cr.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
