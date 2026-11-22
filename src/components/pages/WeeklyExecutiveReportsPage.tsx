import { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Sparkles,
  Printer,
  Trash2,
} from 'lucide-react';
import {
  EVANIA_DATA,
  FloorProgressMap,
  ProjectInfo,
  SiteReportItem,
  WeeklyReportSnapshot,
  WorkPackage,
  computeProjectRisks,
  formatCr,
  formatIndianNumber,
  formatInr,
  formatRevisionDate,
} from '../../data/evaniaData';

interface WeeklyExecutiveReportsPageProps {
  projectInfo: ProjectInfo;
  workPackages: WorkPackage[];
  floorProgress: FloorProgressMap;
  resolvedRiskIds: string[];
  siteReports: SiteReportItem[];
  weeklyReports: WeeklyReportSnapshot[];
  onSaveWeeklyReport: (report: WeeklyReportSnapshot) => void;
  onUpdateWeeklyReportNarrative: (reportId: string, narrative: string) => void;
  onDeleteWeeklyReport: (reportId: string) => void;
  embedded?: boolean;
}

export function WeeklyExecutiveReportsPage({
  projectInfo,
  workPackages,
  floorProgress,
  resolvedRiskIds,
  siteReports,
  weeklyReports,
  onSaveWeeklyReport,
  onUpdateWeeklyReportNarrative,
  onDeleteWeeklyReport,
  embedded = false,
}: WeeklyExecutiveReportsPageProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(
    weeklyReports[0]?.id ?? null
  );
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeReport = useMemo(() => {
    if (!selectedReportId) return weeklyReports[0] ?? null;
    return (
      weeklyReports.find((r) => r.id === selectedReportId) ??
      weeklyReports[0] ??
      null
    );
  }, [weeklyReports, selectedReportId]);

  const handleGenerateReport = () => {
    setAiError(null);
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const { budgetTotals } = EVANIA_DATA;
    const grandTotalCr = budgetTotals.grandTotal.totalCr;

    // Spent summary
    const spentPackages = workPackages.filter((p) => p.amountSpentCr !== null);
    const amountSpentCr =
      spentPackages.length > 0
        ? spentPackages.reduce((acc, p) => acc + (p.amountSpentCr ?? 0), 0)
        : null;

    // Top 5 packages by budget
    const topPackages = [...workPackages]
      .sort((a, b) => b.budgetCr - a.budgetCr)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        label: p.code ? `${p.code} · ${p.name}` : p.name,
        category: p.category,
        budgetCr: p.budgetCr,
        sharePct: Number(((p.budgetCr / grandTotalCr) * 100).toFixed(2)),
      }));

    // Open risks from Risk Center
    const resolvedSet = new Set(resolvedRiskIds);
    const openRisks = computeProjectRisks(workPackages)
      .filter((r) => !resolvedSet.has(r.id))
      .map((r) => ({
        id: r.id,
        category: r.category,
        title: r.title,
        packageName: r.packageName,
        severity: r.severity,
        reason: r.reason,
      }));

    // Progress summary
    const totalPkgBudget = workPackages.reduce((acc, p) => acc + p.budgetCr, 0);
    const updatedPctPackages = workPackages.filter(
      (p) => p.percentComplete !== null
    );
    const overallCompletionPct =
      updatedPctPackages.length > 0 && totalPkgBudget > 0
        ? Number(
            (
              workPackages.reduce(
                (acc, p) => acc + p.budgetCr * (p.percentComplete ?? 0),
                0
              ) / totalPkgBudget
            ).toFixed(2)
          )
        : null;

    let onTrack = 0;
    let atWatch = 0;
    let atRisk = 0;
    let notStarted = 0;
    workPackages.forEach((p) => {
      if (p.status === 'On Track') onTrack += 1;
      else if (p.status === 'At Watch') atWatch += 1;
      else if (p.status === 'At Risk') atRisk += 1;
      else notStarted += 1;
    });

    let slabCast = 0;
    let inProgress = 0;
    let floorsNotStarted = 0;
    for (let f = 1; f <= 32; f += 1) {
      const s = floorProgress[f] ?? 'Not Started';
      if (s === 'Slab Cast') slabCast += 1;
      else if (s === 'In Progress') inProgress += 1;
      else floorsNotStarted += 1;
    }

    const enteredPackages = workPackages
      .filter((p) => p.percentComplete !== null || p.status !== null)
      .map((p) => ({
        id: p.id,
        label: p.code ? `${p.code} · ${p.name}` : p.name,
        percentComplete: p.percentComplete,
        status: p.status,
      }));

    // Site reports from last 7 days
    const recentSiteReports = siteReports
      .filter((r) => r.date >= sevenDaysAgo && r.date <= todayIso)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((r) => ({
        id: r.id,
        date: r.date,
        packageLabel: r.packageLabel,
        workDone: r.workDone,
        manpowerCount: r.manpowerCount,
        issues: r.issues,
        submittedBy: r.submittedBy,
      }));

    const snapshot: WeeklyReportSnapshot = {
      id: `wr-${Date.now()}`,
      generatedAt: now.toISOString(),
      weekEndingDate: todayIso,
      budgetSummary: {
        grandTotalCr: budgetTotals.grandTotal.totalCr,
        civilCr: budgetTotals.civil.totalCr,
        mepCr: budgetTotals.mep.totalCr,
        costPerSqm: budgetTotals.grandTotal.ratePerSqmSaleable,
        totalFlats: projectInfo.totalFlats,
        amountSpentCr,
        spentPackagesCount: spentPackages.length,
      },
      topPackages,
      openRisks,
      progressSummary: {
        overallCompletionPct,
        updatedPackagesCount: updatedPctPackages.length,
        totalPackagesCount: workPackages.length,
        statusCounts: { onTrack, atWatch, atRisk, notStarted },
        floorsSummary: {
          slabCast,
          inProgress,
          notStarted: floorsNotStarted,
        },
        enteredPackages,
      },
      recentSiteReports,
      aiNarrative: null,
    };

    onSaveWeeklyReport(snapshot);
    setSelectedReportId(snapshot.id);
  };

  const handleWriteAiNarrative = async () => {
    if (!activeReport || isGeneratingAi) return;
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const response = await fetch('/api/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportFacts: activeReport,
          projectContext: {
            evaniaData: {
              ...EVANIA_DATA,
              project: projectInfo,
              workPackages,
            },
            floorProgress,
            resolvedRiskIds,
          },
        }),
      });

      const rawText = await response.text();
      let data: { narrative?: string; error?: string } = {};
      try {
        data = rawText
          ? (JSON.parse(rawText) as { narrative?: string; error?: string })
          : {};
      } catch {
        throw new Error(
          `Unexpected response from server (HTTP ${response.status}). Please try again in a moment.`
        );
      }

      if (!response.ok || !data.narrative) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      onUpdateWeeklyReportNarrative(activeReport.id, data.narrative);
    } catch (err: unknown) {
      setAiError(
        err instanceof Error
          ? err.message
          : 'Failed to generate narrative with Gemini.'
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions (hidden in print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        {embedded ? (
          <div>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Weekly Executive Summaries
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              One-page management summaries generated strictly from verified Tower A data and localStorage records.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              Weekly Executive Reports
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              One-page management summaries generated strictly from verified Tower A data and localStorage records.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleGenerateReport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1E36] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D3557] whitespace-nowrap"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Generate this week&apos;s report</span>
          </button>

          {activeReport && (
            <>
              <button
                type="button"
                disabled={isGeneratingAi}
                onClick={() => void handleWriteAiNarrative()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap"
              >
                <Sparkles className="h-3.5 w-3.5 text-sky-700" />
                <span>
                  {isGeneratingAi ? 'Writing summary…' : 'Write summary with Gemini'}
                </span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {aiError && (
        <div
          role="alert"
          className="no-print rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800"
        >
          {aiError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* History Sidebar (hidden in print) */}
        <aside className="no-print xl:col-span-3 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="font-display text-xs font-semibold text-slate-900">
              Report History ({weeklyReports.length})
            </h3>
          </div>

          {weeklyReports.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No reports generated yet. Click &ldquo;Generate this week&apos;s report&rdquo; to create the first snapshot.
            </p>
          ) : (
            <ul className="space-y-2">
              {weeklyReports.map((rep) => {
                const isSelected = activeReport?.id === rep.id;
                return (
                  <li
                    key={rep.id}
                    className={`rounded-lg border p-2.5 text-xs transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedReportId(rep.id)}
                      className="text-left min-w-0 flex-1"
                    >
                      <p className="font-mono font-medium text-slate-900 tabular-nums">
                        {rep.weekEndingDate}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {new Date(rep.generatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {rep.openRisks.length} open risks
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteWeeklyReport(rep.id)}
                      aria-label={`Delete report ${rep.weekEndingDate}`}
                      className="p-1 text-slate-400 hover:text-red-700 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Active One-Page Report Sheet */}
        <section className="xl:col-span-9">
          {!activeReport ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <FileSpreadsheet className="h-9 w-9 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-800">
                No Weekly Executive Report selected
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Click &ldquo;Generate this week&apos;s report&rdquo; to compile a real-data summary of budgets, top packages, open risks, progress, and site reports from the past 7 days.
              </p>
            </div>
          ) : (
            <article className="print-only-sheet rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
              {/* Report Banner Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-start gap-3.5">
                  <img
                    src="/assets/nyati-logo.jpg"
                    alt="Nyati Group logo"
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-md border border-slate-200 bg-white object-contain p-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      {projectInfo.developer} · Weekly Executive Report
                    </p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-slate-900">
                      {projectInfo.name} – {projectInfo.scope}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">
                      Estimate Ref: <span className="font-mono">{projectInfo.estimateRef}</span> · Revision{' '}
                      {projectInfo.currentRevision} ({formatRevisionDate(projectInfo.revisionDate)})
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-600 space-y-0.5 tabular-nums">
                  <p>
                    Report Date: <strong className="font-mono text-slate-900">{activeReport.weekEndingDate}</strong>
                  </p>
                  <p>Location: {projectInfo.location ?? 'Not yet updated'}</p>
                  <p>Contractors: {projectInfo.contractorNames ?? 'Not yet updated'}</p>
                </div>
              </div>

              {/* Optional Gemini Narrative */}
              {activeReport.aiNarrative && (
                <div className="rounded-lg border border-sky-200 bg-sky-50/50 p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-sky-900">
                    Executive Narrative (Generated from Project Data)
                  </p>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                    {activeReport.aiNarrative}
                  </p>
                </div>
              )}

              {/* 1. Budget Summary */}
              <div className="space-y-3">
                <h4 className="font-display text-sm font-semibold text-slate-900">
                  1. Budget Summary (Tower A, R1)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-slate-500">Grand Total</p>
                    <p className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                      {formatCr(activeReport.budgetSummary.grandTotalCr)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-slate-500">Civil</p>
                    <p className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                      {formatCr(activeReport.budgetSummary.civilCr)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-slate-500">MEP</p>
                    <p className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                      {formatCr(activeReport.budgetSummary.mepCr)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-slate-500">Total Flats</p>
                    <p className="mt-1 font-mono text-base font-semibold text-slate-900 tabular-nums">
                      {formatIndianNumber(activeReport.budgetSummary.totalFlats)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-slate-500">Amount Spent</p>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                      {activeReport.budgetSummary.amountSpentCr !== null
                        ? formatCr(activeReport.budgetSummary.amountSpentCr)
                        : 'Not yet updated'}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 tabular-nums">
                  Saleable rate: {formatInr(activeReport.budgetSummary.costPerSqm, 2)} / sqm across{' '}
                  {formatIndianNumber(projectInfo.saleableAreaSqm, 2)} sqm (≈{' '}
                  {formatIndianNumber(projectInfo.saleableAreaSftApprox)} sft).
                </p>
              </div>

              {/* 2. Top 5 Packages by Budget */}
              <div className="space-y-2.5">
                <h4 className="font-display text-sm font-semibold text-slate-900">
                  2. Top 5 Work Packages by R1 Budget
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="py-2 px-3">Package</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Budget</th>
                        <th className="py-2 px-3 text-right">Share of Grand Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeReport.topPackages.map((pkg) => (
                        <tr key={pkg.id}>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {pkg.label}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{pkg.category}</td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-900">
                            {formatCr(pkg.budgetCr)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">
                            {pkg.sharePct.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Open Risks from Risk Center */}
              <div className="space-y-2.5">
                <h4 className="font-display text-sm font-semibold text-slate-900">
                  3. Open Risks from Risk Center ({activeReport.openRisks.length})
                </h4>
                {activeReport.openRisks.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    All identified risks are currently marked resolved.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg text-xs">
                    {activeReport.openRisks.map((risk) => (
                      <li key={risk.id} className="px-3.5 py-2.5 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-900">
                            [{risk.severity}] {risk.title} — {risk.packageName}
                          </span>
                          <span className="text-[11px] text-slate-500 shrink-0">
                            {risk.category}
                          </span>
                        </div>
                        <p className="text-slate-600">{risk.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 4. Progress Summary (if entered) */}
              <div className="space-y-2.5">
                <h4 className="font-display text-sm font-semibold text-slate-900">
                  4. Execution Progress &amp; Tower A RCC Floors
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-slate-500">Overall Weighted Completion</p>
                    <p className="mt-1 font-mono font-semibold text-slate-900 tabular-nums">
                      {activeReport.progressSummary.overallCompletionPct !== null
                        ? `${activeReport.progressSummary.overallCompletionPct}% (${activeReport.progressSummary.updatedPackagesCount} of ${activeReport.progressSummary.totalPackagesCount} updated)`
                        : 'Not yet updated'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-slate-500">Package Statuses</p>
                    <p className="mt-1 font-mono text-slate-800 tabular-nums">
                      On Track {activeReport.progressSummary.statusCounts.onTrack} · Watch{' '}
                      {activeReport.progressSummary.statusCounts.atWatch} · Risk{' '}
                      {activeReport.progressSummary.statusCounts.atRisk} · Not Started{' '}
                      {activeReport.progressSummary.statusCounts.notStarted}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-slate-500">RCC Floors (1–32)</p>
                    <p className="mt-1 font-mono text-slate-800 tabular-nums">
                      Slab Cast {activeReport.progressSummary.floorsSummary.slabCast} · In Progress{' '}
                      {activeReport.progressSummary.floorsSummary.inProgress} · Not Started{' '}
                      {activeReport.progressSummary.floorsSummary.notStarted}
                    </p>
                  </div>
                </div>

                {activeReport.progressSummary.enteredPackages.length > 0 && (
                  <div className="text-xs text-slate-700 pt-1">
                    <span className="font-medium text-slate-900">Updated Packages: </span>
                    {activeReport.progressSummary.enteredPackages
                      .map(
                        (p) =>
                          `${p.label} (${
                            p.percentComplete !== null
                              ? `${p.percentComplete}%`
                              : 'Not yet updated'
                          }${p.status ? `, ${p.status}` : ''})`
                      )
                      .join(' · ')}
                  </div>
                )}
              </div>

              {/* 5. Site Reports from Last 7 Days */}
              <div className="space-y-2.5">
                <h4 className="font-display text-sm font-semibold text-slate-900">
                  5. Site Reports (Last 7 Days)
                </h4>
                {activeReport.recentSiteReports.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No site reports logged in the last 7 days.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Package</th>
                          <th className="py-2 px-3">Work Done</th>
                          <th className="py-2 px-3 text-right">Manpower</th>
                          <th className="py-2 px-3">Submitted By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeReport.recentSiteReports.map((sr) => (
                          <tr key={sr.id}>
                            <td className="py-2 px-3 font-mono tabular-nums whitespace-nowrap">
                              {sr.date}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {sr.packageLabel}
                            </td>
                            <td className="py-2 px-3">
                              <p className="text-slate-900">{sr.workDone}</p>
                              {sr.issues && (
                                <p className="text-[11px] text-amber-800 mt-0.5">
                                  Issue: {sr.issues}
                                </p>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">
                              {sr.manpowerCount}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {sr.submittedBy}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}
