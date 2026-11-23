import { Menu, PenSquare, CalendarClock, Building2, ChevronDown } from 'lucide-react';
import { formatRevisionDate } from '../data/evaniaData';
import { ELENOR_DATA } from '../data/elenorData';
import { ELENOR_BUILDINGS, ElenorBuilding, PROJECTS, ProjectId } from '../types/navigation';

interface HeaderProps {
  onOpenMobileNav: () => void;
  onOpenEditPackage: () => void;
  currentRevision: string;
  revisionDate: string;
  project: ProjectId;
  onChangeProject: (project: ProjectId) => void;
  building: ElenorBuilding;
  onChangeBuilding: (building: ElenorBuilding) => void;
}

export function Header({
  onOpenMobileNav,
  onOpenEditPackage,
  currentRevision,
  revisionDate,
  project,
  onChangeProject,
  building,
  onChangeBuilding,
}: HeaderProps) {
  const formattedDate = formatRevisionDate(revisionDate);
  const projectName = PROJECTS.find((p) => p.id === project)?.name ?? 'Nyati Evania';
  const isEvania = project === 'evania';

  return (
    <header className="no-print sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="lg:hidden rounded-xl border border-slate-200/80 p-2 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img
            src="/assets/nyati-logo.jpg"
            alt="Nyati Group logo"
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-lg border border-slate-200/80 bg-white object-contain p-0.5 shrink-0 shadow-2xs"
          />
          <h1 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-slate-900 truncate">
            {projectName} – Project Intelligence
          </h1>
        </div>

        {/* Right: Project selector + Revision Banner + Edit Package CTA + User Area */}
        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
          <label className="relative inline-flex items-center">
            <span className="sr-only">Select project</span>
            <Building2 className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
            <select
              value={project}
              onChange={(e) => onChangeProject(e.target.value as ProjectId)}
              aria-label="Select project"
              className="appearance-none rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-white pl-8 pr-8 py-1.5 text-xs font-semibold text-slate-900 hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none transition-all shadow-2xs cursor-pointer"
            >
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.subtitle}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-500" />
          </label>

          <div className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50/70 px-3 py-1.5 text-xs font-medium text-amber-900 sm:whitespace-nowrap shadow-2xs">
            <CalendarClock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <span>
              {isEvania
                ? `Estimate Revision ${currentRevision} · ${formattedDate}`
                : `Progress Review ${ELENOR_DATA.reportRef} · Upto ${ELENOR_DATA.asOfDate}`}
            </span>
          </div>

          {isEvania && (
            <button
              type="button"
              onClick={onOpenEditPackage}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F1E36] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#1D3557] active:scale-[0.98] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap shrink-0 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <PenSquare className="h-3.5 w-3.5" />
              <span>Edit Package</span>
            </button>
          )}

          <div className="hidden sm:block text-right border-l border-slate-200 pl-4 whitespace-nowrap shrink-0">
            <p className="text-xs font-medium text-slate-800">Project Office · Nyati Group</p>
          </div>
        </div>
      </div>

      {!isEvania && (
        <div className="border-t border-slate-100/90 px-4 sm:px-6 lg:px-8 py-2 bg-slate-50/40">
          <div role="tablist" aria-label="Building filter" className="flex items-center gap-2 overflow-x-auto">
            <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Building</span>
            <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-200/50 p-1 text-xs font-medium backdrop-blur-xs">
              {ELENOR_BUILDINGS.map((b) => {
                const isSelected = building === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => onChangeBuilding(b.id)}
                    className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-slate-900 ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
