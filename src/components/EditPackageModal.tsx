import { useEffect, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import {
  PackageStatus,
  WorkPackage,
  WorkPackageEditableFields,
  formatCr,
} from '../data/evaniaData';

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packages: WorkPackage[];
  initialPackageId: string | null;
  onSave: (packageId: string, fields: Partial<WorkPackageEditableFields>) => void;
  onResetPackage: (packageId: string) => void;
}

const STATUS_OPTIONS: PackageStatus[] = [
  'On Track',
  'At Watch',
  'At Risk',
  'Not Started',
];

interface FormState {
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  plannedPercent: string;
  percentComplete: string;
  scheduleVarianceDays: string;
  status: string;
  riskScore: string;
  owner: string;
  amountSpentCr: string;
  remarks: string;
}

function toFormState(pkg: WorkPackage): FormState {
  return {
    plannedStart: pkg.plannedStart ?? '',
    plannedEnd: pkg.plannedEnd ?? '',
    actualStart: pkg.actualStart ?? '',
    plannedPercent: pkg.plannedPercent !== null ? String(pkg.plannedPercent) : '',
    percentComplete: pkg.percentComplete !== null ? String(pkg.percentComplete) : '',
    scheduleVarianceDays:
      pkg.scheduleVarianceDays !== null ? String(pkg.scheduleVarianceDays) : '',
    status: pkg.status ?? '',
    riskScore: pkg.riskScore !== null ? String(pkg.riskScore) : '',
    owner: pkg.owner ?? '',
    amountSpentCr: pkg.amountSpentCr !== null ? String(pkg.amountSpentCr) : '',
    remarks: pkg.remarks ?? '',
  };
}

export function EditPackageModal({
  isOpen,
  onClose,
  packages,
  initialPackageId,
  onSave,
  onResetPackage,
}: EditPackageModalProps) {
  const [selectedId, setSelectedId] = useState<string>(
    initialPackageId ?? packages[0]?.id ?? ''
  );
  const [form, setForm] = useState<FormState>(() => {
    const initial =
      packages.find((p) => p.id === (initialPackageId ?? packages[0]?.id)) ??
      packages[0];
    return initial ? toFormState(initial) : toFormState(packages[0]);
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const targetId = initialPackageId ?? packages[0]?.id ?? '';
    setSelectedId(targetId);
    const pkg = packages.find((p) => p.id === targetId);
    if (pkg) {
      setForm(toFormState(pkg));
    }
    setErrorMsg(null);
  }, [isOpen, initialPackageId, packages]);

  if (!isOpen) return null;

  const currentPackage = packages.find((p) => p.id === selectedId) ?? packages[0];

  const handleSelectChange = (newId: string) => {
    setSelectedId(newId);
    const pkg = packages.find((p) => p.id === newId);
    if (pkg) {
      setForm(toFormState(pkg));
    }
    setErrorMsg(null);
  };

  const parseOptionalNumber = (
    raw: string,
    label: string,
    min?: number,
    max?: number
  ): number | null | 'INVALID' => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    if (Number.isNaN(num)) {
      setErrorMsg(`${label} must be a valid number.`);
      return 'INVALID';
    }
    if (min !== undefined && num < min) {
      setErrorMsg(`${label} must be at least ${min}.`);
      return 'INVALID';
    }
    if (max !== undefined && num > max) {
      setErrorMsg(`${label} must be at most ${max}.`);
      return 'INVALID';
    }
    return num;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const plannedPercent = parseOptionalNumber(
      form.plannedPercent,
      'Planned %',
      0,
      100
    );
    if (plannedPercent === 'INVALID') return;

    const percentComplete = parseOptionalNumber(
      form.percentComplete,
      'Actual % Complete',
      0,
      100
    );
    if (percentComplete === 'INVALID') return;

    const scheduleVarianceDays = parseOptionalNumber(
      form.scheduleVarianceDays,
      'Schedule Variance (Days)'
    );
    if (scheduleVarianceDays === 'INVALID') return;

    const riskScore = parseOptionalNumber(form.riskScore, 'Risk Score', 0, 100);
    if (riskScore === 'INVALID') return;

    const amountSpentCr = parseOptionalNumber(
      form.amountSpentCr,
      'Amount Spent (₹ Cr)',
      0
    );
    if (amountSpentCr === 'INVALID') return;

    const updatedFields: Partial<WorkPackageEditableFields> = {
      plannedStart: form.plannedStart.trim() ? form.plannedStart.trim() : null,
      plannedEnd: form.plannedEnd.trim() ? form.plannedEnd.trim() : null,
      actualStart: form.actualStart.trim() ? form.actualStart.trim() : null,
      plannedPercent,
      percentComplete,
      scheduleVarianceDays:
        scheduleVarianceDays !== null ? Math.round(scheduleVarianceDays) : null,
      status: form.status ? (form.status as PackageStatus) : null,
      riskScore: riskScore !== null ? Math.round(riskScore) : null,
      owner: form.owner.trim() ? form.owner.trim() : null,
      amountSpentCr,
      remarks: form.remarks.trim() ? form.remarks.trim() : null,
    };

    onSave(currentPackage.id, updatedFields);
    onClose();
  };

  const handleReset = () => {
    onResetPackage(currentPackage.id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-package-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2
              id="edit-package-title"
              className="font-display text-lg font-semibold text-slate-900"
            >
              Edit Work Package Fields
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Empty fields remain recorded as &ldquo;Not yet updated&rdquo;. Changes are saved to browser localStorage.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Package Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pb-4 border-b border-slate-200">
            <div className="sm:col-span-2">
              <label
                htmlFor="pkg-select"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Work Package
              </label>
              <select
                id="pkg-select"
                value={selectedId}
                onChange={(e) => handleSelectChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <optgroup label="Civil Work Packages">
                  {packages
                    .filter((p) => p.category === 'Civil')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} · {p.name} ({formatCr(p.budgetCr)})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="MEP Packages">
                  {packages
                    .filter((p) => p.category === 'MEP')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        MEP · {p.name} ({formatCr(p.budgetCr)})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2">
              <p className="text-[11px] text-slate-500">R1 Estimate Budget</p>
              <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {formatCr(currentPackage.budgetCr)}
              </p>
              {currentPackage.estimateNote && (
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {currentPackage.estimateNote}
                </p>
              )}
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800"
            >
              {errorMsg}
            </div>
          )}

          {/* Schedule Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="planned-start"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Planned Start
              </label>
              <input
                id="planned-start"
                type="date"
                value={form.plannedStart}
                onChange={(e) => setForm({ ...form, plannedStart: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="planned-end"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Planned End
              </label>
              <input
                id="planned-end"
                type="date"
                value={form.plannedEnd}
                onChange={(e) => setForm({ ...form, plannedEnd: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="actual-start"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Actual Start
              </label>
              <input
                id="actual-start"
                type="date"
                value={form.actualStart}
                onChange={(e) => setForm({ ...form, actualStart: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Progress, Variance, Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="planned-percent"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Planned % (0–100)
              </label>
              <input
                id="planned-percent"
                type="number"
                min={0}
                max={100}
                step={0.1}
                placeholder="Not yet updated"
                value={form.plannedPercent}
                onChange={(e) =>
                  setForm({ ...form, plannedPercent: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="percent-complete"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Actual % Complete (0–100)
              </label>
              <input
                id="percent-complete"
                type="number"
                min={0}
                max={100}
                step={0.1}
                placeholder="Not yet updated"
                value={form.percentComplete}
                onChange={(e) =>
                  setForm({ ...form, percentComplete: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="schedule-variance"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Schedule Variance (Days)
              </label>
              <input
                id="schedule-variance"
                type="number"
                step={1}
                placeholder="Not yet updated"
                value={form.scheduleVarianceDays}
                onChange={(e) =>
                  setForm({ ...form, scheduleVarianceDays: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="amount-spent"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Amount Spent (₹ Cr)
              </label>
              <input
                id="amount-spent"
                type="number"
                min={0}
                step={0.01}
                placeholder="Not yet updated"
                value={form.amountSpentCr}
                onChange={(e) =>
                  setForm({ ...form, amountSpentCr: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Status, Risk Score, Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="pkg-status"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Package Status
              </label>
              <select
                id="pkg-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <option value="">Not yet updated</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="risk-score"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Risk Score (0–100)
              </label>
              <input
                id="risk-score"
                type="number"
                min={0}
                max={100}
                step={1}
                placeholder="Not yet updated"
                value={form.riskScore}
                onChange={(e) => setForm({ ...form, riskScore: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="pkg-owner"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Package Owner / Lead
              </label>
              <input
                id="pkg-owner"
                type="text"
                placeholder="Not yet updated"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label
              htmlFor="pkg-remarks"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Remarks
            </label>
            <textarea
              id="pkg-remarks"
              rows={3}
              placeholder="Not yet updated"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to Not Updated</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0F1E36] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D3557]"
              >
                Save Package
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
