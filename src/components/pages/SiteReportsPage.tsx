import { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  ClipboardList,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import {
  FloorProgressMap,
  ProjectInfo,
  SiteReportItem,
  WeeklyReportSnapshot,
  WorkPackage,
} from '../../data/evaniaData';
import { WeeklyExecutiveReportsPage } from './WeeklyExecutiveReportsPage';

interface SiteReportsPageProps {
  projectInfo: ProjectInfo;
  packages: WorkPackage[];
  floorProgress: FloorProgressMap;
  resolvedRiskIds: string[];
  reports: SiteReportItem[];
  weeklyReports: WeeklyReportSnapshot[];
  onAddReport: (report: SiteReportItem) => void;
  onDeleteReport: (reportId: string) => void;
  onSaveWeeklyReport: (report: WeeklyReportSnapshot) => void;
  onUpdateWeeklyReportNarrative: (reportId: string, narrative: string) => void;
  onDeleteWeeklyReport: (reportId: string) => void;
}

type SiteReportsTab = 'daily-logs' | 'weekly-summary';

async function fileToCompressedBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const maxW = 900;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function SiteReportsPage({
  projectInfo,
  packages,
  floorProgress,
  resolvedRiskIds,
  reports,
  weeklyReports,
  onAddReport,
  onDeleteReport,
  onSaveWeeklyReport,
  onUpdateWeeklyReportNarrative,
  onDeleteWeeklyReport,
}: SiteReportsPageProps) {
  const [activeTab, setActiveTab] = useState<SiteReportsTab>('daily-logs');

  // Form State (starts empty; no invented defaults)
  const [date, setDate] = useState('');
  const [packageId, setPackageId] = useState(packages[0]?.id ?? '');
  const [workDone, setWorkDone] = useState('');
  const [manpowerCount, setManpowerCount] = useState('');
  const [issues, setIssues] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter State
  const [filterPackageId, setFilterPackageId] = useState('ALL');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoDataUrl(null);
      setPhotoFileName(null);
      return;
    }
    try {
      const base64 = await fileToCompressedBase64(file);
      setPhotoDataUrl(base64);
      setPhotoFileName(file.name);
      setFormError(null);
    } catch {
      setFormError('Could not process uploaded image.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!date) {
      setFormError('Please select a report date.');
      return;
    }
    if (!packageId) {
      setFormError('Please select a work package.');
      return;
    }
    if (!workDone.trim()) {
      setFormError('Please describe the work done.');
      return;
    }
    const manpowerNum = Number(manpowerCount);
    if (manpowerCount.trim() === '' || Number.isNaN(manpowerNum) || manpowerNum < 0) {
      setFormError('Please enter a valid manpower count (0 or more).');
      return;
    }
    if (!submittedBy.trim()) {
      setFormError('Please enter who submitted this report.');
      return;
    }

    const pkg = packages.find((p) => p.id === packageId);
    const packageLabel = pkg
      ? pkg.code
        ? `${pkg.code} · ${pkg.name}`
        : `${pkg.category} · ${pkg.name}`
      : packageId;

    const newReport: SiteReportItem = {
      id: `sr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date,
      packageId,
      packageLabel,
      workDone: workDone.trim(),
      manpowerCount: Math.round(manpowerNum),
      issues: issues.trim() ? issues.trim() : null,
      photoDataUrl,
      submittedBy: submittedBy.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddReport(newReport);

    // Reset form
    setDate('');
    setWorkDone('');
    setManpowerCount('');
    setIssues('');
    setSubmittedBy('');
    setPhotoDataUrl(null);
    setPhotoFileName(null);
  };

  const filteredReports = useMemo(() => {
    return [...reports]
      .filter((r) => {
        if (filterPackageId !== 'ALL' && r.packageId !== filterPackageId) {
          return false;
        }
        if (filterFromDate && r.date < filterFromDate) return false;
        if (filterToDate && r.date > filterToDate) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [reports, filterPackageId, filterFromDate, filterToDate]);

  return (
    <div className="space-y-6">
      {/* Unified Header (hidden in print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Site Reports
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Daily site logs and weekly management summaries for Nyati Evania Tower A.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('daily-logs')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'daily-logs'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>Daily Site Logs ({reports.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weekly-summary')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'weekly-summary'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Weekly Executive Summaries ({weeklyReports.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'weekly-summary' ? (
        <WeeklyExecutiveReportsPage
          projectInfo={projectInfo}
          workPackages={packages}
          floorProgress={floorProgress}
          resolvedRiskIds={resolvedRiskIds}
          siteReports={reports}
          weeklyReports={weeklyReports}
          onSaveWeeklyReport={onSaveWeeklyReport}
          onUpdateWeeklyReportNarrative={onUpdateWeeklyReportNarrative}
          onDeleteWeeklyReport={onDeleteWeeklyReport}
          embedded
        />
      ) : (
        <div className="space-y-6">
          {/* Daily Site Logs subheader + Weekly Executive Summary option right underneath */}
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Daily Site Logs
              </h3>
              <p className="text-xs text-slate-600">
                Daily site logs for Nyati Evania Tower A. Reports and uploaded photos are stored in localStorage.
              </p>
              <p className="text-xs text-slate-700 pt-0.5">
                - One-page management summaries generated strictly from verified Tower A data and localStorage records.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('weekly-summary')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#0284C7]" />
              <span>Generate Weekly Executive Summary</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left: Add Daily Site Report Form */}
            <section className="xl:col-span-5 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-display text-sm font-semibold text-slate-900 pb-3 border-b border-slate-200">
                Add Daily Site Report
              </h3>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {formError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-800"
                  >
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="sr-date"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Date
                    </label>
                    <input
                      id="sr-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sr-manpower"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Manpower Count
                    </label>
                    <input
                      id="sr-manpower"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Enter count"
                      value={manpowerCount}
                      onChange={(e) => setManpowerCount(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="sr-package"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Work Package
                  </label>
                  <select
                    id="sr-package"
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <optgroup label="Civil Work Packages">
                      {packages
                        .filter((p) => p.category === 'Civil')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} · {p.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="MEP Packages">
                      {packages
                        .filter((p) => p.category === 'MEP')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            MEP · {p.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sr-work-done"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Work Done
                  </label>
                  <textarea
                    id="sr-work-done"
                    rows={3}
                    placeholder="Describe completed activities, locations, or pours..."
                    value={workDone}
                    onChange={(e) => setWorkDone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sr-issues"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Issues / Blockers (Optional)
                  </label>
                  <textarea
                    id="sr-issues"
                    rows={2}
                    placeholder="Any material, drawing, or safety blockers..."
                    value={issues}
                    onChange={(e) => setIssues(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sr-submitted-by"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Submitted By
                  </label>
                  <input
                    id="sr-submitted-by"
                    type="text"
                    placeholder="Engineer / Supervisor name"
                    value={submittedBy}
                    onChange={(e) => setSubmittedBy(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sr-photo"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Site Photo Upload (Optional, stored as base64)
                  </label>
                  <input
                    id="sr-photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-slate-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100"
                  />
                  {photoDataUrl && (
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 p-2">
                      <img
                        src={photoDataUrl}
                        alt="Site preview"
                        className="h-12 w-12 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-slate-800 truncate">
                          {photoFileName ?? 'Attached photo'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoDataUrl(null);
                            setPhotoFileName(null);
                          }}
                          className="text-[11px] text-red-700 hover:underline"
                        >
                          Remove photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F1E36] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#1D3557]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Site Report</span>
                </button>
              </form>
            </section>

            {/* Right: Filters + List View */}
            <section className="xl:col-span-7 space-y-4">
              {/* Filter Bar */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="filter-sr-pkg"
                    className="block text-[11px] font-medium text-slate-500 mb-1"
                  >
                    Filter by Package
                  </label>
                  <select
                    id="filter-sr-pkg"
                    value={filterPackageId}
                    onChange={(e) => setFilterPackageId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="ALL">All Packages</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code ? `${p.code} · ${p.name}` : p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="filter-sr-from"
                    className="block text-[11px] font-medium text-slate-500 mb-1"
                  >
                    From Date
                  </label>
                  <input
                    id="filter-sr-from"
                    type="date"
                    value={filterFromDate}
                    onChange={(e) => setFilterFromDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-sr-to"
                    className="block text-[11px] font-medium text-slate-500 mb-1"
                  >
                    To Date
                  </label>
                  <input
                    id="filter-sr-to"
                    type="date"
                    value={filterToDate}
                    onChange={(e) => setFilterToDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Empty State or Report Cards */}
              {filteredReports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <ClipboardList className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-800">
                    {reports.length === 0
                      ? 'No site reports logged yet'
                      : 'No site reports match the current filters'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {reports.length === 0
                      ? 'Use the form on the left to add the first daily site report.'
                      : 'Adjust the package or date range filters above.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <article
                      key={report.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-slate-500 font-mono tabular-nums">
                            {report.date}
                            <span aria-hidden="true"> · </span>
                            <span className="font-sans font-medium text-slate-700">
                              {report.packageLabel}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            Submitted by <strong className="text-slate-900">{report.submittedBy}</strong>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono tabular-nums">
                              Manpower: {report.manpowerCount}
                            </span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteReport(report.id)}
                          aria-label={`Delete report from ${report.date}`}
                          className="rounded-md border border-slate-200 p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                        {report.workDone}
                      </div>

                      {report.issues && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          <span className="font-semibold">Issues: </span>
                          {report.issues}
                        </div>
                      )}

                      {report.photoDataUrl ? (
                        <div className="pt-1">
                          <img
                            src={report.photoDataUrl}
                            alt={`Site report on ${report.date}`}
                            className="max-h-64 w-auto rounded-lg border border-slate-200 object-contain"
                          />
                        </div>
                      ) : (
                        <p className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>No photo attached</span>
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
