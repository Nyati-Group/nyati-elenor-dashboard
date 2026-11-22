import {
  EVANIA_DATA,
  FloorProgressMap,
  ProjectInfo,
  SiteReportItem,
  WorkPackage,
  computeProjectRisks,
} from '../data/evaniaData';
import { ELENOR_DATA, computeElenorRisks } from '../data/elenorData';

export interface EvaniaContextInput {
  projectInfo: ProjectInfo;
  workPackages: WorkPackage[];
  floorProgress: FloorProgressMap;
  resolvedRiskIds: string[];
  siteReports: SiteReportItem[];
}

/** Full Nyati Evania context (static data + localStorage edits + derived analytics). */
export function buildEvaniaContext({
  projectInfo,
  workPackages,
  floorProgress,
  resolvedRiskIds,
  siteReports,
}: EvaniaContextInput) {
  const compactPackages = workPackages.map((pkg) => {
    const entry: Record<string, unknown> = {
      id: pkg.id,
      category: pkg.category,
      name: pkg.name,
      budgetCr: pkg.budgetCr,
    };
    if (pkg.code) entry.code = pkg.code;
    if (pkg.estimateNote) entry.estimateNote = pkg.estimateNote;
    if (pkg.plannedStart !== null) entry.plannedStart = pkg.plannedStart;
    if (pkg.plannedEnd !== null) entry.plannedEnd = pkg.plannedEnd;
    if (pkg.actualStart !== null) entry.actualStart = pkg.actualStart;
    if (pkg.plannedPercent !== null) entry.plannedPercent = pkg.plannedPercent;
    if (pkg.percentComplete !== null) entry.percentComplete = pkg.percentComplete;
    if (pkg.scheduleVarianceDays !== null) {
      entry.scheduleVarianceDays = pkg.scheduleVarianceDays;
    }
    if (pkg.status !== null) entry.status = pkg.status;
    if (pkg.riskScore !== null) entry.riskScore = pkg.riskScore;
    if (pkg.owner !== null) entry.owner = pkg.owner;
    if (pkg.remarks !== null) entry.remarks = pkg.remarks;
    if (pkg.amountSpentCr !== null) entry.amountSpentCr = pkg.amountSpentCr;
    return entry;
  });

  const slabCastFloors: number[] = [];
  const inProgressFloors: number[] = [];
  let notStartedFloorsCount = 0;
  for (let floor = 1; floor <= 32; floor += 1) {
    const status = floorProgress[floor] ?? 'Not Started';
    if (status === 'Slab Cast') slabCastFloors.push(floor);
    else if (status === 'In Progress') inProgressFloors.push(floor);
    else notStartedFloorsCount += 1;
  }

  const grandTotalCr = EVANIA_DATA.budgetTotals.grandTotal.totalCr;
  const topCostDrivers = [...workPackages]
    .sort((a, b) => b.budgetCr - a.budgetCr)
    .slice(0, 6)
    .map((pkg) => ({
      name: pkg.code ? `${pkg.code} · ${pkg.name}` : pkg.name,
      category: pkg.category,
      budgetCr: pkg.budgetCr,
      sharePct: Number(((pkg.budgetCr / grandTotalCr) * 100).toFixed(2)),
      status: pkg.status ?? 'Not yet updated',
      percentComplete: pkg.percentComplete ?? 'Not yet updated',
    }));

  const { rccRatePerSqm, ratesInclGst } = EVANIA_DATA.benchmark;
  const benchmarkVariancesVsEvoque = [
    {
      item: 'RCC per sqm',
      evaniaInr: rccRatePerSqm.evaniaInr,
      evoqueInr: rccRatePerSqm.evoqueInr,
      variancePct: Number(
        (
          ((rccRatePerSqm.evaniaInr - rccRatePerSqm.evoqueInr) / rccRatePerSqm.evoqueInr) *
          100
        ).toFixed(2)
      ),
    },
    ...ratesInclGst.map((r) => ({
      item: r.item,
      unit: r.unitLabel,
      evaniaInr: r.evaniaRateInr,
      evoqueInr: r.evoqueRateInr,
      variancePct: Number(
        (((r.evaniaRateInr - r.evoqueRateInr) / r.evoqueRateInr) * 100).toFixed(2)
      ),
    })),
  ];

  const risks = computeProjectRisks(workPackages).map((risk) => ({
    id: risk.id,
    severity: risk.severity,
    category: risk.category,
    title: risk.title,
    packageName: risk.packageName,
    reason: risk.reason,
    suggestedNextStep: risk.suggestedNextStep,
    resolved: resolvedRiskIds.includes(risk.id),
  }));

  const updatedPackagesCount = workPackages.filter(
    (p) =>
      p.percentComplete !== null ||
      p.status !== null ||
      p.plannedStart !== null ||
      p.amountSpentCr !== null
  ).length;

  const spentPackages = workPackages.filter((p) => p.amountSpentCr !== null);
  const totalAmountSpentCr =
    spentPackages.length > 0
      ? Number(spentPackages.reduce((sum, p) => sum + (p.amountSpentCr ?? 0), 0).toFixed(2))
      : 'Not yet updated';

  const missingMetadataFields = [
    !projectInfo.location ? 'location' : null,
    !projectInfo.startDate ? 'startDate' : null,
    !projectInfo.plannedCompletion ? 'plannedCompletion' : null,
    !projectInfo.contractorNames ? 'contractorNames' : null,
  ].filter((field): field is string => field !== null);

  return {
    evaniaData: {
      ...EVANIA_DATA,
      project: projectInfo,
      workPackages: compactPackages,
    },
    derivedAnalytics: {
      topCostDrivers,
      benchmarkVariancesVsEvoque,
      riskRegister: risks,
      operationalReadiness: {
        updatedPackagesCount,
        totalPackagesCount: workPackages.length,
        totalAmountSpentCr,
        siteReportsLoggedCount: siteReports.length,
        missingMetadataFields,
      },
    },
    localStorageOverrides: {
      projectMetadata: {
        location: projectInfo.location ?? 'Not yet updated',
        startDate: projectInfo.startDate ?? 'Not yet updated',
        plannedCompletion: projectInfo.plannedCompletion ?? 'Not yet updated',
        contractorNames: projectInfo.contractorNames ?? 'Not yet updated',
      },
      towerARccFloorProgress: {
        totalFloors: 32,
        slabCastFloors,
        inProgressFloors,
        notStartedFloorsCount,
      },
      resolvedRiskIds,
      siteReports: siteReports.map((r) => ({
        date: r.date,
        packageLabel: r.packageLabel,
        workDone: r.workDone,
        manpowerCount: r.manpowerCount,
        issues: r.issues ?? 'None reported',
        submittedBy: r.submittedBy,
        hasPhoto: Boolean(r.photoDataUrl),
      })),
    },
  };
}

/** Full Nyati Elenor context (Progress Review PLN/407) + derived risk register. */
export function buildElenorContext() {
  return {
    elenorData: ELENOR_DATA,
    derivedAnalytics: {
      riskRegister: computeElenorRisks().map((r) => ({
        severity: r.severity,
        category: r.category,
        title: r.title,
        scope: r.scope,
        reason: r.reason,
      })),
      units: {
        projectLevelTables:
          '₹ Crore (uptoDateStatus, statusSummary, fyActualCostUptoOct, taskClosing)',
        buildingProgressTables: '₹ Lacs (buildingProgress)',
        monthwiseAndBuildingWiseMonthly: 'percent of scope',
      },
    },
  };
}
