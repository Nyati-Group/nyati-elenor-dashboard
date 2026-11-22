import { useEffect, useState } from 'react';
import { X, RotateCcw } from 'lucide-react';
import { ProjectEditableFields, ProjectInfo } from '../data/evaniaData';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  onSave: (fields: Partial<ProjectEditableFields>) => void;
  onReset: () => void;
}

export function EditProjectModal({
  isOpen,
  onClose,
  project,
  onSave,
  onReset,
}: EditProjectModalProps) {
  const [location, setLocation] = useState(project.location ?? '');
  const [startDate, setStartDate] = useState(project.startDate ?? '');
  const [plannedCompletion, setPlannedCompletion] = useState(
    project.plannedCompletion ?? ''
  );
  const [contractorNames, setContractorNames] = useState(
    project.contractorNames ?? ''
  );

  useEffect(() => {
    if (!isOpen) return;
    setLocation(project.location ?? '');
    setStartDate(project.startDate ?? '');
    setPlannedCompletion(project.plannedCompletion ?? '');
    setContractorNames(project.contractorNames ?? '');
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      location: location.trim() ? location.trim() : null,
      startDate: startDate.trim() ? startDate.trim() : null,
      plannedCompletion: plannedCompletion.trim()
        ? plannedCompletion.trim()
        : null,
      contractorNames: contractorNames.trim() ? contractorNames.trim() : null,
    });
    onClose();
  };

  const handleReset = () => {
    onReset();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
    >
      <div className="w-full max-w-lg rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2
              id="edit-project-title"
              className="font-display text-lg font-semibold text-slate-900"
            >
              Edit Project Details
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Update missing project metadata for {project.name} ({project.scope}). Saved in localStorage.
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

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label
              htmlFor="proj-location"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Site Location
            </label>
            <input
              id="proj-location"
              type="text"
              placeholder="Not yet updated"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="proj-start"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Project Start Date
              </label>
              <input
                id="proj-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="proj-completion"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Planned Completion
              </label>
              <input
                id="proj-completion"
                type="date"
                value={plannedCompletion}
                onChange={(e) => setPlannedCompletion(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="proj-contractors"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Contractor Names
            </label>
            <textarea
              id="proj-contractors"
              rows={2}
              placeholder="Not yet updated"
              value={contractorNames}
              onChange={(e) => setContractorNames(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

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
                Save Project Info
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
