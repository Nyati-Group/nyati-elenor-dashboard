import {
  LayoutDashboard,
  Layers,
  IndianRupee,
  ShieldAlert,
  TrendingUp,
  ClipboardList,
  PackageCheck,
  Table2,
  Sparkles,
  X,
} from 'lucide-react';
import { NavItemConfig, NavItemId, ProjectId } from '../types/navigation';

interface SidebarProps {
  activeNav: NavItemId;
  onSelectNav: (id: NavItemId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  estimateRef: string;
  scope: string;
  projectName: string;
  navItems: NavItemConfig[];
  activeProject?: ProjectId;
  onOpenChatbot?: (query?: string) => void;
}

const NAV_ICONS: Record<NavItemId, React.ComponentType<{ className?: string }>> = {
  'executive-dashboard': LayoutDashboard,
  'work-packages': Layers,
  'budget-boq': IndianRupee,
  'ai-risk-center': ShieldAlert,
  'progress-monitoring': TrendingUp,
  'site-reports': ClipboardList,
  procurement: PackageCheck,
  'data-tables': Table2,
};

export function Sidebar({
  activeNav,
  onSelectNav,
  mobileOpen,
  onCloseMobile,
  estimateRef,
  scope,
  projectName,
  navItems,
  onOpenChatbot,
}: SidebarProps) {
  const handleSelect = (id: NavItemId) => {
    onSelectNav(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex h-full flex-col bg-[#0F1E36] text-slate-100 select-none">
      {/* Brand Block */}
      <div className="flex items-center justify-between gap-3 px-5 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-white p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
            <img
              src="/assets/nyati-logo.jpg"
              alt="Nyati Group logo"
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold tracking-tight text-white truncate">
              {projectName}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 truncate">
              {scope} · Nyati Group
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Primary Navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.id];
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                isActive
                  ? 'bg-[#1D3557] text-white'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-sky-300' : 'text-slate-400'
                }`}
              />
              <span className="truncate whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}

        {/* AI Assistant Nav Link */}
        <button
          type="button"
          onClick={() => {
            onOpenChatbot?.();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-[13.5px] font-medium transition-all duration-150 text-slate-300 hover:bg-slate-800/70 hover:text-white group active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="h-4 w-4 shrink-0 text-sky-400 group-hover:text-sky-300 transition-colors" />
            <span className="truncate whitespace-nowrap">AI Assistant</span>
          </div>
          <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-300 border border-sky-500/30">
            Chat
          </span>
        </button>
      </nav>

      {/* Bottom Project Reference */}
      <div className="px-5 py-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
        <p className="text-slate-300 font-medium truncate">Project Intelligence</p>
        <p className="font-mono text-[11px] text-slate-400 truncate">{estimateRef}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="no-print hidden lg:block lg:w-64 lg:shrink-0 border-r border-slate-800">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 transition-opacity"
            aria-hidden="true"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] h-full shadow-xl z-10">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
