import { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import {
  RiskCategory,
  RiskSeverity,
  WorkPackage,
  computeProjectRisks,
} from '../../data/evaniaData';

interface AiRiskCenterPageProps {
  packages: WorkPackage[];
  resolvedRiskIds: string[];
  onToggleResolved: (riskId: string) => void;
}

const CATEGORY_OPTIONS: Array<'ALL' | RiskCategory> = [
  'ALL',
  'Cost Risk',
  'Rate Risk',
  'Revision Risk',
  'Data Gap Risk',
  'Schedule Risk',
];

function getSeverityBadgeClasses(severity: RiskSeverity): string {
  switch (severity) {
    case 'High':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'Medium':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function AiRiskCenterPage({
  packages,
  resolvedRiskIds,
  onToggleResolved,
}: AiRiskCenterPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | RiskCategory>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | RiskSeverity>('ALL');
  const [resolutionFilter, setResolutionFilter] = useState<'OPEN' | 'RESOLVED' | 'ALL'>('OPEN');

  const allRisks = useMemo(() => computeProjectRisks(packages), [packages]);
  const resolvedSet = useMemo(() => new Set(resolvedRiskIds), [resolvedRiskIds]);

  const counts = useMemo(() => {
    let open = 0;
    let resolved = 0;
    let highOpen = 0;
    let mediumOpen = 0;

    allRisks.forEach((r) => {
      if (resolvedSet.has(r.id)) {
        resolved += 1;
      } else {
        open += 1;
        if (r.severity === 'High') highOpen += 1;
        else if (r.severity === 'Medium') mediumOpen += 1;
      }
    });
    return { open, resolved, highOpen, mediumOpen };
  }, [allRisks, resolvedSet]);

  const filteredRisks = useMemo(() => {
    return allRisks.filter((r) => {
      const isResolved = resolvedSet.has(r.id);
      if (resolutionFilter === 'OPEN' && isResolved) return false;
      if (resolutionFilter === 'RESOLVED' && !isResolved) return false;
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
      return true;
    });
  }, [allRisks, resolvedSet, resolutionFilter, categoryFilter, severityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-900">
          AI Risk Center
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Rule-driven risk register evaluated strictly from Tower A R1 data, Evoque benchmarks, excavation revisions, and entered package metrics.
        </p>
      </div>

      {/* Summary Counters */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Open Risks</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {counts.open}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">High Severity (Open)</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-red-700 tabular-nums">
            {counts.highOpen}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Medium Severity (Open)</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-amber-700 tabular-nums">
            {counts.mediumOpen}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Resolved</p>
          <p className="mt-1.5 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
            {counts.resolved}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                ['OPEN', `Open (${counts.open})`],
                ['RESOLVED', `Resolved (${counts.resolved})`],
                ['ALL', `All (${allRisks.length})`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setResolutionFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  resolutionFilter === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by risk category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | RiskCategory)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Rule Categories' : cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by severity"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'ALL' | RiskSeverity)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </section>

      {/* Risk Cards Grid */}
      {filteredRisks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-800">
            No risk cards match the selected filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRisks.map((risk) => {
            const isResolved = resolvedSet.has(risk.id);
            return (
              <article
                key={risk.id}
                className={`rounded-xl border bg-white p-5 flex flex-col justify-between transition-colors ${
                  isResolved ? 'border-slate-200 opacity-75' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top metadata row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{risk.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{risk.packageName}</span>
                    </div>
                    <span
                      className={`shrink-0 inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${getSeverityBadgeClasses(
                        risk.severity
                      )}`}
                    >
                      {risk.severity} Severity
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {risk.title}
                  </h3>

                  {/* Reason with actual numbers */}
                  <p className="text-xs text-slate-700 leading-relaxed">{risk.reason}</p>

                  {/* Suggested Next Step */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 text-xs">
                    <span className="font-semibold text-slate-800">Suggested next step: </span>
                    <span className="text-slate-600">{risk.suggestedNextStep}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    {isResolved ? 'Marked resolved (saved locally)' : 'Active risk'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onToggleResolved(risk.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isResolved
                        ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {isResolved ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reopen Risk</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark resolved</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
