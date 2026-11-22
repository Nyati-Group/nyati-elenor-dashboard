export type PackageCategory = 'Civil' | 'MEP';

export type PackageStatus = 'On Track' | 'At Watch' | 'At Risk' | 'Not Started';

export interface ProjectInfo {
  name: string;
  developer: string;
  scope: string;
  estimateRef: string;
  currentRevision: string;
  revisionDate: string;
  saleableAreaSqm: number;
  saleableAreaSftApprox: number;
  builtUpAreaSqm: number;
  builtUpAreaSftApprox: number;
  totalFlats: number;
  aluformFloors: string;
  liftStops: number;
  location: string | null;
  startDate: string | null;
  plannedCompletion: string | null;
  contractorNames: string | null;
}

export interface ProjectEditableFields {
  location: string | null;
  startDate: string | null;
  plannedCompletion: string | null;
  contractorNames: string | null;
}

export interface FlatMixUnit {
  unitLabel: string;
  count: number;
  group: '4 BHK' | '3 BHK' | '2 BHK';
}

export interface FlatMixGroup {
  group: '4 BHK' | '3 BHK' | '2 BHK';
  count: number;
  note?: string;
}

export interface BudgetSummaryRow {
  category: 'Civil' | 'MEP' | 'Grand Total';
  totalCr: number;
  ratePerSqmSaleable: number;
}

export interface WorkPackageEditableFields {
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  plannedPercent: number | null;
  percentComplete: number | null;
  scheduleVarianceDays: number | null;
  status: PackageStatus | null;
  riskScore: number | null;
  owner: string | null;
  remarks: string | null;
  amountSpentCr: number | null;
}

export interface WorkPackage extends WorkPackageEditableFields {
  id: string;
  category: PackageCategory;
  code: string | null;
  name: string;
  budgetCr: number;
  estimateNote?: string;
}

export interface PlasterBreakdownItem {
  item: string;
  budgetCr: number;
}

export interface LiftSpecItem {
  label: string;
  count: number;
  capacityPassengers: number;
  stops: number;
  budgetCr: number;
}

export interface ExcavationPartRow {
  part: string;
  presentBudgetCr: number;
  r0Cr: number;
  r1Cr: number;
}

export interface BenchmarkRateItem {
  item: string;
  unitLabel: string;
  evaniaRateInr: number;
  evoqueRateInr: number;
  inclGst: boolean;
}

export interface BenchmarkData {
  comparisonProject: string;
  evoqueSaleableAreaSqm: number;
  rccRatePerSqm: {
    evaniaInr: number;
    evoqueInr: number;
  };
  ratesInclGst: BenchmarkRateItem[];
}

export interface ReviewStatusCount {
  status: string;
  count: number;
}

export interface EvaniaProjectDataset {
  project: ProjectInfo;
  flatMixUnits: FlatMixUnit[];
  flatMixGrouped: FlatMixGroup[];
  budgetTotals: {
    scopeLabel: string;
    civil: BudgetSummaryRow;
    mep: BudgetSummaryRow;
    grandTotal: BudgetSummaryRow;
  };
  workPackages: WorkPackage[];
  plasterBreakdown: PlasterBreakdownItem[];
  lifts: LiftSpecItem[];
  excavationBudgetByPart: ExcavationPartRow[];
  benchmark: BenchmarkData;
  lineItemReviewStatusCounts: ReviewStatusCount[];
}

const DEFAULT_PACKAGE_NO_DATA: WorkPackageEditableFields = {
  plannedStart: null,
  plannedEnd: null,
  actualStart: null,
  plannedPercent: null,
  percentComplete: null,
  scheduleVarianceDays: null,
  status: null,
  riskScore: null,
  owner: null,
  remarks: null,
  amountSpentCr: null,
};

function makeCivilPackage(code: string, name: string, budgetCr: number): WorkPackage {
  return {
    id: `civil-${code}`,
    category: 'Civil',
    code,
    name,
    budgetCr,
    ...DEFAULT_PACKAGE_NO_DATA,
  };
}

function makeMepPackage(
  id: string,
  name: string,
  budgetCr: number,
  estimateNote?: string
): WorkPackage {
  return {
    id,
    category: 'MEP',
    code: null,
    name,
    budgetCr,
    ...(estimateNote ? { estimateNote } : {}),
    ...DEFAULT_PACKAGE_NO_DATA,
  };
}

export const EVANIA_DATA: EvaniaProjectDataset = {
  project: {
    name: 'Nyati Evania',
    developer: 'Nyati Group',
    scope: 'Tower A (A Block)',
    estimateRef: 'EST/403/EVANIA REV-0',
    currentRevision: 'R1',
    revisionDate: '2026-03-23',
    saleableAreaSqm: 27248.75,
    saleableAreaSftApprox: 293306,
    builtUpAreaSqm: 26620.16,
    builtUpAreaSftApprox: 286539,
    totalFlats: 150,
    aluformFloors: '8th to 32nd',
    liftStops: 32,
    location: null,
    startDate: null,
    plannedCompletion: null,
    contractorNames: null,
  },

  flatMixUnits: [
    { unitLabel: '4 BHK-101', count: 25, group: '4 BHK' },
    { unitLabel: '4 BHK-102', count: 18, group: '4 BHK' },
    { unitLabel: '3 BHK-104', count: 25, group: '3 BHK' },
    { unitLabel: '3 BHK-105', count: 25, group: '3 BHK' },
    { unitLabel: '2 BHK-103', count: 25, group: '2 BHK' },
    { unitLabel: '2 BHK-106', count: 25, group: '2 BHK' },
    { unitLabel: 'Refuge 3 BHK', count: 7, group: '3 BHK' },
  ],

  flatMixGrouped: [
    { group: '4 BHK', count: 43 },
    { group: '3 BHK', count: 57, note: 'incl. refuge' },
    { group: '2 BHK', count: 50 },
  ],

  budgetTotals: {
    scopeLabel: 'Tower A, R1',
    civil: {
      category: 'Civil',
      totalCr: 93.59,
      ratePerSqmSaleable: 34345.55,
    },
    mep: {
      category: 'MEP',
      totalCr: 13.64,
      ratePerSqmSaleable: 5004.60,
    },
    grandTotal: {
      category: 'Grand Total',
      totalCr: 107.22,
      ratePerSqmSaleable: 39350.15,
    },
  },

  workPackages: [
    makeCivilPackage('A', 'Earthwork', 2.11),
    makeCivilPackage('B', 'RCC', 34.77),
    makeCivilPackage('C', 'Masonry', 1.15),
    makeCivilPackage('D', 'Plaster', 5.87),
    makeCivilPackage('E', 'Doors (frame, shutter, fittings)', 2.22),
    makeCivilPackage('F1', 'Aluminium Doors', 3.23),
    makeCivilPackage('F2', 'Windows', 2.15),
    makeCivilPackage('G', 'Fabrication & Railings', 2.15),
    makeCivilPackage('H', 'Waterproofing', 1.23),
    makeCivilPackage('I', 'Tiling & Flooring', 14.79),
    makeCivilPackage('J', 'Painting', 2.52),
    makeCivilPackage('K', 'Plumbing & Sanitation', 5.80),
    makeCivilPackage('L', 'Elevation Treatment', 1.50),
    makeCivilPackage('M', 'Flat Amenities (kitchen, AC, light fittings etc.)', 13.41),
    makeCivilPackage('N', 'Department Labour', 0.49),
    makeCivilPackage('O', 'Miscellaneous', 0.20),
    makeMepPackage('mep-internal-electrical', 'Internal Electrical', 6.03),
    makeMepPackage('mep-lifts', 'Lifts (4 nos)', 3.53),
    makeMepPackage('mep-fire-fighting', 'Fire Fighting System', 2.16),
    makeMepPackage('mep-toilet-exhaust', 'Toilet Exhaust', 0.95),
    makeMepPackage('mep-solar-water', 'Solar Water Heating (15,000 LPD)', 0.45),
    makeMepPackage('mep-solar-pv', 'Solar PV 40 kW', 0.19),
    makeMepPackage('mep-hydro-pneumatic', 'Hydro-pneumatic System', 0.10),
    makeMepPackage('mep-piped-gas', 'Piped Gas (MNGL)', 0.08),
    makeMepPackage('mep-garbage-chute', 'Garbage Chute', 0.00, 'Not given by MEP Dept'),
  ],

  plasterBreakdown: [
    { item: 'Gypsum', budgetCr: 3.69 },
    { item: 'Texture', budgetCr: 1.05 },
    { item: 'Putty', budgetCr: 0.30 },
    { item: 'Internal Tar', budgetCr: 0.67 },
    { item: 'External', budgetCr: 0.09 },
    { item: 'Cement Ghotai', budgetCr: 0.07 },
  ],

  lifts: [
    {
      label: '1 × 13-passenger 32-stop',
      count: 1,
      capacityPassengers: 13,
      stops: 32,
      budgetCr: 0.87,
    },
    {
      label: '2 × 15-passenger 32-stop',
      count: 2,
      capacityPassengers: 15,
      stops: 32,
      budgetCr: 1.84,
    },
    {
      label: '1 × 10-passenger 30-stop',
      count: 1,
      capacityPassengers: 10,
      stops: 30,
      budgetCr: 0.83,
    },
  ],

  excavationBudgetByPart: [
    { part: 'Part A', presentBudgetCr: 1.87, r0Cr: 2.06, r1Cr: 2.11 },
    { part: 'Part B', presentBudgetCr: 1.58, r0Cr: 1.59, r1Cr: 1.47 },
    { part: 'Part C (Commercial)', presentBudgetCr: 3.00, r0Cr: 3.51, r1Cr: 3.22 },
    { part: 'Total', presentBudgetCr: 6.45, r0Cr: 7.16, r1Cr: 6.80 },
  ],

  benchmark: {
    comparisonProject: 'Nyati Evoque',
    evoqueSaleableAreaSqm: 24174.54,
    rccRatePerSqm: {
      evaniaInr: 12761,
      evoqueInr: 9618,
    },
    ratesInclGst: [
      { item: 'RMC M40', unitLabel: 'per cum', evaniaRateInr: 6330.70, evoqueRateInr: 5891.74, inclGst: true },
      { item: 'RMC M50', unitLabel: 'per cum', evaniaRateInr: 6726, evoqueRateInr: 6065.20, inclGst: true },
      { item: 'Main door', unitLabel: 'per unit', evaniaRateInr: 30090, evoqueRateInr: 23046.58, inclGst: true },
      { item: 'Bedroom door', unitLabel: 'per unit', evaniaRateInr: 15236.16, evoqueRateInr: 20190.98, inclGst: true },
      { item: 'Toilet door', unitLabel: 'per unit', evaniaRateInr: 6717.74, evoqueRateInr: 18054, inclGst: true },
      { item: 'Digital lock', unitLabel: 'per unit', evaniaRateInr: 8850, evoqueRateInr: 8850, inclGst: true },
      { item: 'TMT steel 8/32mm', unitLabel: 'per MT', evaniaRateInr: 60000, evoqueRateInr: 61000, inclGst: true },
      { item: 'TMT 10–25mm', unitLabel: 'per MT', evaniaRateInr: 59000, evoqueRateInr: 60000, inclGst: true },
    ],
  },

  lineItemReviewStatusCounts: [
    { status: 'Signoff Done', count: 5 },
    { status: 'Qty Crosscheck pending', count: 3 },
    { status: 'Not given by MEP Dept', count: 1 },
  ],
};

// localStorage persistence keys for NO DATA overrides
const PROJECT_OVERRIDES_KEY = 'nyati_evania_project_overrides_v1';
const PACKAGE_OVERRIDES_KEY = 'nyati_evania_package_overrides_v1';
const FLOOR_PROGRESS_KEY = 'nyati_evania_floor_progress_v1';

export type FloorStatus = 'Not Started' | 'In Progress' | 'Slab Cast';
export type FloorProgressMap = Record<number, FloorStatus>;

export function loadFloorProgress(): FloorProgressMap {
  const defaults: FloorProgressMap = {};
  for (let floor = 1; floor <= 32; floor += 1) {
    defaults[floor] = 'Not Started';
  }
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(FLOOR_PROGRESS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, FloorStatus>;
    for (let floor = 1; floor <= 32; floor += 1) {
      const val = parsed[String(floor)];
      if (val === 'Not Started' || val === 'In Progress' || val === 'Slab Cast') {
        defaults[floor] = val;
      }
    }
    return defaults;
  } catch {
    return defaults;
  }
}

export function saveFloorProgress(progress: FloorProgressMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FLOOR_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}

export type PackageOverridesMap = Record<string, Partial<WorkPackageEditableFields>>;

export function loadProjectOverrides(): Partial<ProjectEditableFields> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROJECT_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<ProjectEditableFields>;
  } catch {
    return {};
  }
}

export function saveProjectOverrides(overrides: Partial<ProjectEditableFields>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROJECT_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadPackageOverrides(): PackageOverridesMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PACKAGE_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PackageOverridesMap;
  } catch {
    return {};
  }
}

export function savePackageOverrides(overrides: PackageOverridesMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PACKAGE_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // Ignore storage quota errors
  }
}

export function getMergedProjectInfo(overrides: Partial<ProjectEditableFields>): ProjectInfo {
  return {
    ...EVANIA_DATA.project,
    location: overrides.location ?? EVANIA_DATA.project.location,
    startDate: overrides.startDate ?? EVANIA_DATA.project.startDate,
    plannedCompletion: overrides.plannedCompletion ?? EVANIA_DATA.project.plannedCompletion,
    contractorNames: overrides.contractorNames ?? EVANIA_DATA.project.contractorNames,
  };
}

export function getMergedWorkPackages(overrides: PackageOverridesMap): WorkPackage[] {
  return EVANIA_DATA.workPackages.map((pkg) => {
    const pkgOverride = overrides[pkg.id];
    if (!pkgOverride) return pkg;
    return {
      ...pkg,
      ...pkgOverride,
    };
  });
}

// Strict Indian number and currency formatters (Rule 3)
export function formatIndianNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCr(value: number | null): string {
  if (value === null || Number.isNaN(value)) return 'Not yet updated';
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} Cr`;
}

export function formatInr(value: number | null, decimals = 2): string {
  if (value === null || Number.isNaN(value)) return 'Not yet updated';
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatRevisionDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = Number(parts[1]) - 1;
  const monthLabel = months[monthIdx] ?? parts[1];
  return `${parts[2]}-${monthLabel}-${parts[0]}`;
}

// ============================================================
// Part 3: Risk Rules, Site Reports, Weekly Executive Reports
// ============================================================

export type RiskSeverity = 'High' | 'Medium' | 'Low';
export type RiskCategory =
  | 'Cost Risk'
  | 'Rate Risk'
  | 'Revision Risk'
  | 'Data Gap Risk'
  | 'Schedule Risk';

export interface RiskCardItem {
  id: string;
  category: RiskCategory;
  title: string;
  packageName: string;
  reason: string;
  severity: RiskSeverity;
  suggestedNextStep: string;
}

export function computeProjectRisks(packages: WorkPackage[]): RiskCardItem[] {
  const risks: RiskCardItem[] = [];
  const grandTotalCr = EVANIA_DATA.budgetTotals.grandTotal.totalCr;

  // 1. Cost risk: any package > 10% of total budget
  packages.forEach((pkg) => {
    const sharePct = (pkg.budgetCr / grandTotalCr) * 100;
    if (sharePct > 10) {
      risks.push({
        id: `cost-${pkg.id}`,
        category: 'Cost Risk',
        title: 'High cost exposure',
        packageName: pkg.code ? `${pkg.code} · ${pkg.name}` : pkg.name,
        reason: `R1 budget is ${formatCr(pkg.budgetCr)}, representing ${sharePct.toFixed(
          2
        )}% of the ${formatCr(grandTotalCr)} grand total (exceeds 10% threshold).`,
        severity: 'High',
        suggestedNextStep:
          'Lock procurement terms early, validate BOQ quantities, and monitor billed commitments against R1 allowance.',
      });
    }
  });

  // 2. Rate risk: every Evoque benchmark item where Evania is > 5% higher
  const { rccRatePerSqm, ratesInclGst, comparisonProject } = EVANIA_DATA.benchmark;
  const rccGapPct =
    ((rccRatePerSqm.evaniaInr - rccRatePerSqm.evoqueInr) /
      rccRatePerSqm.evoqueInr) *
    100;
  if (rccGapPct > 5) {
    risks.push({
      id: 'rate-rcc-per-sqm',
      category: 'Rate Risk',
      title: 'RCC per-sqm rate above benchmark',
      packageName: 'B · RCC',
      reason: `Evania RCC rate is ${formatInr(
        rccRatePerSqm.evaniaInr,
        0
      )}/sqm vs ${comparisonProject} at ${formatInr(
        rccRatePerSqm.evoqueInr,
        0
      )}/sqm (+${rccGapPct.toFixed(2)}% higher).`,
      severity: rccGapPct > 15 ? 'High' : 'Medium',
      suggestedNextStep:
        'Review structural steel and concrete consumption ratios per sqm against Evoque structural design.',
    });
  }

  ratesInclGst.forEach((item) => {
    const gapPct =
      ((item.evaniaRateInr - item.evoqueRateInr) / item.evoqueRateInr) * 100;
    if (gapPct > 5) {
      const slug = item.item.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      risks.push({
        id: `rate-${slug}`,
        category: 'Rate Risk',
        title: `${item.item} rate above ${comparisonProject} benchmark`,
        packageName: `Benchmark · ${item.item}`,
        reason: `Evania rate incl. GST is ${formatInr(
          item.evaniaRateInr,
          2
        )} (${item.unitLabel}) vs ${comparisonProject} at ${formatInr(
          item.evoqueRateInr,
          2
        )} (+${gapPct.toFixed(2)}% higher).`,
        severity: gapPct > 15 ? 'High' : 'Medium',
        suggestedNextStep:
          'Negotiate vendor rate cards or validate specification upgrades driving the unit rate premium.',
      });
    }
  });

  // 3. Revision risk: excavation parts where R1 is above Present Budget
  EVANIA_DATA.excavationBudgetByPart
    .filter((row) => row.part !== 'Total')
    .forEach((row) => {
      const gapCr = row.r1Cr - row.presentBudgetCr;
      if (gapCr > 0.0001) {
        const slug = row.part.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        risks.push({
          id: `revision-excavation-${slug}`,
          category: 'Revision Risk',
          title: `Excavation ${row.part} R1 above Present Budget`,
          packageName: `A · Earthwork (${row.part})`,
          reason: `R1 budget is ${formatCr(row.r1Cr)} vs Present Budget of ${formatCr(
            row.presentBudgetCr
          )} (+${formatCr(gapCr)} increase).`,
          severity: 'Medium',
          suggestedNextStep:
            'Reconcile excavation depth/strata quantity revisions and confirm commercial vs residential cost allocation.',
        });
      }
    });

  // 4. Data gap risk: Garbage Chute (₹0, Not given by MEP Dept) and 3 Qty Crosscheck items
  const garbageChute = packages.find((p) => p.id === 'mep-garbage-chute');
  if (garbageChute) {
    risks.push({
      id: 'datagap-garbage-chute',
      category: 'Data Gap Risk',
      title: 'MEP cost estimate missing for Garbage Chute',
      packageName: `MEP · ${garbageChute.name}`,
      reason: `Budget is currently ${formatCr(garbageChute.budgetCr)} with review status "${
        garbageChute.estimateNote ?? 'Not given by MEP Dept'
      }".`,
      severity: 'High',
      suggestedNextStep:
        'Obtain formal BOQ & budgetary quote from the MEP department and update R1 contingency allocation.',
    });
  }

  const qtyCrosscheck = EVANIA_DATA.lineItemReviewStatusCounts.find((s) =>
    s.status.toLowerCase().includes('qty crosscheck')
  );
  if (qtyCrosscheck && qtyCrosscheck.count > 0) {
    risks.push({
      id: 'datagap-qty-crosscheck',
      category: 'Data Gap Risk',
      title: 'Line-item quantity crosscheck pending',
      packageName: 'Estimate Review · R1 Line Items',
      reason: `${qtyCrosscheck.count} line items remain marked "${qtyCrosscheck.status}" in the R1 estimate review.`,
      severity: 'Medium',
      suggestedNextStep:
        'Complete QS quantity reconciliation on the 3 pending items to finalize estimate signoff.',
    });
  }

  // 5. Schedule risk: any package with scheduleVarianceDays < -7 or riskScore > 70 (only once entered)
  packages.forEach((pkg) => {
    const behindDays =
      pkg.scheduleVarianceDays !== null && pkg.scheduleVarianceDays < -7;
    const highScore = pkg.riskScore !== null && pkg.riskScore > 70;
    if (behindDays || highScore) {
      const reasons: string[] = [];
      if (behindDays && pkg.scheduleVarianceDays !== null) {
        reasons.push(
          `Schedule variance is ${pkg.scheduleVarianceDays} days (${Math.abs(
            pkg.scheduleVarianceDays
          )} days behind, threshold < -7 days)`
        );
      }
      if (highScore && pkg.riskScore !== null) {
        reasons.push(`Risk score is ${pkg.riskScore}/100 (threshold > 70)`);
      }
      risks.push({
        id: `schedule-${pkg.id}`,
        category: 'Schedule Risk',
        title: 'Entered schedule or risk threshold breached',
        packageName: pkg.code ? `${pkg.code} · ${pkg.name}` : pkg.name,
        reason: `${reasons.join('; ')}.`,
        severity: 'High',
        suggestedNextStep:
          'Conduct package recovery review with package owner and align labour/material mobilization plan.',
      });
    }
  });

  return risks;
}

const RESOLVED_RISKS_KEY = 'nyati_evania_resolved_risks_v1';
const SITE_REPORTS_KEY = 'nyati_evania_site_reports_v1';
const WEEKLY_REPORTS_KEY = 'nyati_evania_weekly_reports_v1';

export function loadResolvedRiskIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RESOLVED_RISKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function saveResolvedRiskIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RESOLVED_RISKS_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
}

export interface SiteReportItem {
  id: string;
  date: string;
  packageId: string;
  packageLabel: string;
  workDone: string;
  manpowerCount: number;
  issues: string | null;
  photoDataUrl: string | null;
  submittedBy: string;
  createdAt: string;
}

export function loadSiteReports(): SiteReportItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SITE_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SiteReportItem[]) : [];
  } catch {
    return [];
  }
}

export function saveSiteReports(reports: SiteReportItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SITE_REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // Ignore storage quota errors
  }
}

export interface WeeklyReportSnapshot {
  id: string;
  generatedAt: string;
  weekEndingDate: string;
  budgetSummary: {
    grandTotalCr: number;
    civilCr: number;
    mepCr: number;
    costPerSqm: number;
    totalFlats: number;
    amountSpentCr: number | null;
    spentPackagesCount: number;
  };
  topPackages: Array<{
    id: string;
    label: string;
    category: PackageCategory;
    budgetCr: number;
    sharePct: number;
  }>;
  openRisks: Array<{
    id: string;
    category: RiskCategory;
    title: string;
    packageName: string;
    severity: RiskSeverity;
    reason: string;
  }>;
  progressSummary: {
    overallCompletionPct: number | null;
    updatedPackagesCount: number;
    totalPackagesCount: number;
    statusCounts: {
      onTrack: number;
      atWatch: number;
      atRisk: number;
      notStarted: number;
    };
    floorsSummary: {
      slabCast: number;
      inProgress: number;
      notStarted: number;
    };
    enteredPackages: Array<{
      id: string;
      label: string;
      percentComplete: number | null;
      status: PackageStatus | null;
    }>;
  };
  recentSiteReports: Array<{
    id: string;
    date: string;
    packageLabel: string;
    workDone: string;
    manpowerCount: number;
    issues: string | null;
    submittedBy: string;
  }>;
  aiNarrative: string | null;
}

export function loadWeeklyReports(): WeeklyReportSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WEEKLY_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WeeklyReportSnapshot[]) : [];
  } catch {
    return [];
  }
}

export function saveWeeklyReports(reports: WeeklyReportSnapshot[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WEEKLY_REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // Ignore storage quota errors
  }
}

