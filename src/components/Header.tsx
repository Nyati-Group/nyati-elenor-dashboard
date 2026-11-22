import { Menu, PenSquare, CalendarClock, Building2, ChevronDown } from 'lucide-react';
import { formatRevisionDate } from '../data/evaniaData';
import { ELENOR_DATA } from '../data/elenorData';
import { PROJECTS, ProjectId } from '../types/navigation';

interface HeaderProps {
  onOpenMobileNav: () => void;
  onOpenEditPackage: () => void;
  currentRevision: string;
  revisionDate: string;
  project: ProjectId;
  onChangeProject: (project: ProjectId) => void;
}

export function Header({
  onOpenMobileNav,
  onOpenEditPackage,
  currentRevision,
  revisionDate,
  project,
  onChangeProject,
}: HeaderProps) {
  const formattedDate = formatRevisionDate(revisionDate);
  const projectName = PROJECTS.find((p) => p.id === project)?.name ?? 'Nyati Evania';
  const isEvania = project === 'evania';

  return (
    <header className="no-print sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="lg:hidden rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img
            src="/assets/nyati-logo.jpg"
            alt="Nyati Group logo"
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-md border border-slate-200 bg-white object-contain p-0.5 shrink-0"
          />
          <h1 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-slate-900 truncate">
            {projectName} – Project Intelligence
          </h1>
        </div>

        {/* Right: Project selector + Revision Banner + Edit Package CTA + User Area */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 shrink-0">
          <label className="relative inline-flex items-center">
            <span className="sr-only">Select project</span>
            <Building2 className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-500" />
            <select
              value={project}
              onChange={(e) => onChangeProject(e.target.value as ProjectId)}
              aria-label="Select project"
              className="appearance-none rounded-lg border border-slate-300 bg-white pl-8 pr-8 py-1.5 text-xs font-semibold text-slate-900 hover:border-slate-400 focus:border-slate-900 focus:outline-none cursor-pointer"
            >
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.subtitle}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-500" />
          </label>

          <div className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 whitespace-nowrap shrink-0">
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1E36] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#1D3557] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
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
    </header>
  );
}
