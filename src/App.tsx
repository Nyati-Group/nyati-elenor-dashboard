import { Suspense, lazy, useMemo, useState } from 'react';
import {
  FloorProgressMap,
  FloorStatus,
  PackageOverridesMap,
  ProjectEditableFields,
  SiteReportItem,
  WeeklyReportSnapshot,
  WorkPackageEditableFields,
  getMergedProjectInfo,
  getMergedWorkPackages,
  loadFloorProgress,
  loadPackageOverrides,
  loadProjectOverrides,
  loadResolvedRiskIds,
  loadSiteReports,
  loadWeeklyReports,
  saveFloorProgress,
  savePackageOverrides,
  saveProjectOverrides,
  saveResolvedRiskIds,
  saveSiteReports,
  saveWeeklyReports,
} from './data/evaniaData';
import { NavItemId, PROJECTS, ProjectId, getNavItems } from './types/navigation';
import { ELENOR_DATA } from './data/elenorData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { EditPackageModal } from './components/EditPackageModal';
import { EditProjectModal } from './components/EditProjectModal';
import { ChatbotWidget } from './components/ChatbotWidget';

// Pages are code-split so each one loads on demand (smaller initial bundle).
const ExecutiveDashboardPage = lazy(() =>
  import('./components/pages/ExecutiveDashboardPage').then((m) => ({ default: m.ExecutiveDashboardPage }))
);
const WorkPackagesPage = lazy(() =>
  import('./components/pages/WorkPackagesPage').then((m) => ({ default: m.WorkPackagesPage }))
);
const BudgetBoqPage = lazy(() =>
  import('./components/pages/BudgetBoqPage').then((m) => ({ default: m.BudgetBoqPage }))
);
const AiRiskCenterPage = lazy(() =>
  import('./components/pages/AiRiskCenterPage').then((m) => ({ default: m.AiRiskCenterPage }))
);
const ProgressMonitoringPage = lazy(() =>
  import('./components/pages/ProgressMonitoringPage').then((m) => ({ default: m.ProgressMonitoringPage }))
);
const SiteReportsPage = lazy(() =>
  import('./components/pages/SiteReportsPage').then((m) => ({ default: m.SiteReportsPage }))
);
const elenorPages = () => import('./components/pages/ElenorPage');
const ElenorDashboardPage = lazy(() => elenorPages().then((m) => ({ default: m.ElenorDashboardPage })));
const ElenorWorkPackagesPage = lazy(() => elenorPages().then((m) => ({ default: m.ElenorWorkPackagesPage })));
const ElenorBudgetPage = lazy(() => elenorPages().then((m) => ({ default: m.ElenorBudgetPage })));
const ElenorRiskPage = lazy(() => elenorPages().then((m) => ({ default: m.ElenorRiskPage })));
const ElenorProgressPage = lazy(() => elenorPages().then((m) => ({ default: m.ElenorProgressPage })));
const ElenorProcurementPage = lazy(() => elenorPages().then((m) => ({ default: m.ElenorProcurementPage })));

function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-slate-500" role="status">
      Loading…
    </div>
  );
}

const SELECTED_PROJECT_KEY = 'nyati-selected-project';

function readUrlParam(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

function loadInitialNav(project: ProjectId): NavItemId {
  // Deep link support: ?page=progress-monitoring
  const page = readUrlParam('page');
  if (page && getNavItems(project).some((item) => item.id === page)) return page as NavItemId;
  return 'executive-dashboard';
}

function loadSelectedProject(): ProjectId {
  // Deep link support: ?project=elenor
  const fromUrl = readUrlParam('project');
  if (fromUrl === 'evania' || fromUrl === 'elenor') return fromUrl;
  try {
    const saved = window.localStorage.getItem(SELECTED_PROJECT_KEY);
    if (saved === 'evania' || saved === 'elenor') return saved;
  } catch {
    // storage unavailable — fall back to default project
  }
  return 'evania';
}

export default function App() {
  const [activeProject, setActiveProject] = useState<ProjectId>(() => loadSelectedProject());
  const [activeNav, setActiveNav] = useState<NavItemId>(() => loadInitialNav(activeProject));
  const navItems = getNavItems(activeProject);

  const handleChangeProject = (next: ProjectId) => {
    setActiveProject(next);
    try {
      window.localStorage.setItem(SELECTED_PROJECT_KEY, next);
    } catch {
      // ignore storage errors
    }
    if (!getNavItems(next).some((item) => item.id === activeNav)) {
      setActiveNav('executive-dashboard');
    }
  };
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [projectOverrides, setProjectOverrides] = useState<
    Partial<ProjectEditableFields>
  >(() => loadProjectOverrides());
  const [packageOverrides, setPackageOverrides] = useState<PackageOverridesMap>(
    () => loadPackageOverrides()
  );
  const [floorProgress, setFloorProgress] = useState<FloorProgressMap>(() =>
    loadFloorProgress()
  );
  const [resolvedRiskIds, setResolvedRiskIds] = useState<string[]>(() =>
    loadResolvedRiskIds()
  );
  const [siteReports, setSiteReports] = useState<SiteReportItem[]>(() =>
    loadSiteReports()
  );
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReportSnapshot[]>(
    () => loadWeeklyReports()
  );

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editPackageOpen, setEditPackageOpen] = useState(false);
  const [editPackageInitialId, setEditPackageInitialId] = useState<string | null>(
    null
  );

  const projectInfo = useMemo(
    () => getMergedProjectInfo(projectOverrides),
    [projectOverrides]
  );

  const workPackages = useMemo(
    () => getMergedWorkPackages(packageOverrides),
    [packageOverrides]
  );

  const handleSaveProject = (fields: Partial<ProjectEditableFields>) => {
    setProjectOverrides(fields);
    saveProjectOverrides(fields);
  };

  const handleResetProject = () => {
    setProjectOverrides({});
    saveProjectOverrides({});
  };

  const handleSavePackage = (
    packageId: string,
    fields: Partial<WorkPackageEditableFields>
  ) => {
    setPackageOverrides((prev) => {
      const next: PackageOverridesMap = {
        ...prev,
        [packageId]: {
          ...(prev[packageId] ?? {}),
          ...fields,
        },
      };
      savePackageOverrides(next);
      return next;
    });
  };

  const handleResetPackage = (packageId: string) => {
    setPackageOverrides((prev) => {
      const next = { ...prev };
      delete next[packageId];
      savePackageOverrides(next);
      return next;
    });
  };

  const handleUpdateFloor = (floor: number, status: FloorStatus) => {
    setFloorProgress((prev) => {
      const next: FloorProgressMap = {
        ...prev,
        [floor]: status,
      };
      saveFloorProgress(next);
      return next;
    });
  };

  const handleResetFloors = () => {
    const resetMap: FloorProgressMap = {};
    for (let f = 1; f <= 32; f += 1) {
      resetMap[f] = 'Not Started';
    }
    setFloorProgress(resetMap);
    saveFloorProgress(resetMap);
  };

  const handleToggleResolvedRisk = (riskId: string) => {
    setResolvedRiskIds((prev) => {
      const exists = prev.includes(riskId);
      const next = exists ? prev.filter((id) => id !== riskId) : [...prev, riskId];
      saveResolvedRiskIds(next);
      return next;
    });
  };

  const handleAddSiteReport = (report: SiteReportItem) => {
    setSiteReports((prev) => {
      const next = [report, ...prev];
      saveSiteReports(next);
      return next;
    });
  };

  const handleDeleteSiteReport = (reportId: string) => {
    setSiteReports((prev) => {
      const next = prev.filter((r) => r.id !== reportId);
      saveSiteReports(next);
      return next;
    });
  };

  const handleSaveWeeklyReport = (report: WeeklyReportSnapshot) => {
    setWeeklyReports((prev) => {
      const next = [report, ...prev];
      saveWeeklyReports(next);
      return next;
    });
  };

  const handleUpdateWeeklyNarrative = (reportId: string, narrative: string) => {
    setWeeklyReports((prev) => {
      const next = prev.map((r) =>
        r.id === reportId ? { ...r, aiNarrative: narrative } : r
      );
      saveWeeklyReports(next);
      return next;
    });
  };

  const handleDeleteWeeklyReport = (reportId: string) => {
    setWeeklyReports((prev) => {
      const next = prev.filter((r) => r.id !== reportId);
      saveWeeklyReports(next);
      return next;
    });
  };

  const openEditPackage = (packageId?: string) => {
    setEditPackageInitialId(packageId ?? workPackages[0]?.id ?? null);
    setEditPackageOpen(true);
  };

  const renderElenorPage = () => {
    switch (activeNav) {
      case 'work-packages':
        return <ElenorWorkPackagesPage />;
      case 'budget-boq':
        return <ElenorBudgetPage />;
      case 'ai-risk-center':
        return <ElenorRiskPage />;
      case 'progress-monitoring':
        return <ElenorProgressPage />;
      case 'procurement':
        return <ElenorProcurementPage />;
      default:
        return <ElenorDashboardPage />;
    }
  };

  const renderPage = () => {
    if (activeProject === 'elenor') {
      return renderElenorPage();
    }
    switch (activeNav) {
      case 'executive-dashboard':
        return (
          <ExecutiveDashboardPage
            project={projectInfo}
            packages={workPackages}
            onOpenEditProject={() => setEditProjectOpen(true)}
            onOpenEditPackage={openEditPackage}
          />
        );
      case 'work-packages':
        return (
          <WorkPackagesPage
            packages={workPackages}
            onEditPackage={openEditPackage}
          />
        );
      case 'budget-boq':
        return <BudgetBoqPage />;
      case 'ai-risk-center':
        return (
          <AiRiskCenterPage
            packages={workPackages}
            resolvedRiskIds={resolvedRiskIds}
            onToggleResolved={handleToggleResolvedRisk}
          />
        );
      case 'progress-monitoring':
        return (
          <ProgressMonitoringPage
            packages={workPackages}
            floorProgress={floorProgress}
            onUpdateFloor={handleUpdateFloor}
            onResetFloors={handleResetFloors}
            onInlineUpdatePackage={handleSavePackage}
            onEditPackage={openEditPackage}
          />
        );
      case 'site-reports':
        return (
          <SiteReportsPage
            projectInfo={projectInfo}
            packages={workPackages}
            floorProgress={floorProgress}
            resolvedRiskIds={resolvedRiskIds}
            reports={siteReports}
            weeklyReports={weeklyReports}
            onAddReport={handleAddSiteReport}
            onDeleteReport={handleDeleteSiteReport}
            onSaveWeeklyReport={handleSaveWeeklyReport}
            onUpdateWeeklyReportNarrative={handleUpdateWeeklyNarrative}
            onDeleteWeeklyReport={handleDeleteWeeklyReport}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900">
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
        estimateRef={
          activeProject === 'elenor'
            ? `${ELENOR_DATA.reportRef} · ${ELENOR_DATA.reportPeriod}`
            : projectInfo.estimateRef
        }
        scope={activeProject === 'elenor' ? 'Lullanagar, Pune' : projectInfo.scope}
        projectName={PROJECTS.find((p) => p.id === activeProject)?.name ?? 'Nyati Evania'}
        navItems={navItems}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onOpenEditPackage={() => openEditPackage()}
          currentRevision={projectInfo.currentRevision}
          revisionDate={projectInfo.revisionDate}
          project={activeProject}
          onChangeProject={handleChangeProject}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Suspense fallback={<PageLoading />}>{renderPage()}</Suspense>
        </main>
      </div>

      <ChatbotWidget
        activeProject={activeProject}
        activePageLabel={navItems.find((item) => item.id === activeNav)?.label ?? 'Executive Dashboard'}
        evania={{
          projectInfo,
          workPackages,
          floorProgress,
          resolvedRiskIds,
          siteReports,
        }}
      />

      <EditPackageModal
        isOpen={editPackageOpen}
        onClose={() => setEditPackageOpen(false)}
        packages={workPackages}
        initialPackageId={editPackageInitialId}
        onSave={handleSavePackage}
        onResetPackage={handleResetPackage}
      />

      <EditProjectModal
        isOpen={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        project={projectInfo}
        onSave={handleSaveProject}
        onReset={handleResetProject}
      />
    </div>
  );
}
