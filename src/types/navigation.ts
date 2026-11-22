export type ProjectId = 'evania' | 'elenor';

export interface ProjectOption {
  id: ProjectId;
  name: string;
  subtitle: string;
}

export const PROJECTS: ProjectOption[] = [
  { id: 'evania', name: 'Nyati Evania', subtitle: 'Tower A (A Block)' },
  { id: 'elenor', name: 'Nyati Elenor', subtitle: 'Lullanagar, Pune' },
];

export type NavItemId =
  | 'executive-dashboard'
  | 'work-packages'
  | 'budget-boq'
  | 'ai-risk-center'
  | 'progress-monitoring'
  | 'site-reports'
  | 'procurement';

export interface NavItemConfig {
  id: NavItemId;
  label: string;
  description: string;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'executive-dashboard',
    label: 'Executive Dashboard',
    description: 'Project scope, R1 budget totals, and project-level records for Tower A.',
  },
  {
    id: 'work-packages',
    label: 'Work Packages',
    description: 'Civil (A–O) and MEP work packages with editable tracking fields stored locally.',
  },
  {
    id: 'budget-boq',
    label: 'Budget & BOQ',
    description: 'Tower A R1 cost summary, plaster/lift breakups, excavation revisions, and Evoque benchmarks.',
  },
  {
    id: 'ai-risk-center',
    label: 'AI Risk Center',
    description: 'Package risk monitoring and line-item review tracking based strictly on verified project inputs.',
  },
  {
    id: 'progress-monitoring',
    label: 'Progress Monitoring',
    description: 'Aluform floor progress (8th to 32nd), flat mix tracking (150 units), and milestone dates.',
  },
  {
    id: 'site-reports',
    label: 'Site Reports',
    description: 'Daily site logs and one-page weekly management summaries generated from Tower A data.',
  },
];

export const ELENOR_NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'executive-dashboard',
    label: 'Executive Dashboard',
    description: 'Project information, timeline, status/cost/efficiency and task closing for Nyati Elenor.',
  },
  {
    id: 'work-packages',
    label: 'Work Packages',
    description: 'Building-wise task groups (A, B, Development) with baseline, planned and actual cost.',
  },
  {
    id: 'budget-boq',
    label: 'Budget & BOQ',
    description: 'Upto date cost status by building, planned vs actual cost and FY actual cost.',
  },
  {
    id: 'ai-risk-center',
    label: 'AI Risk Center',
    description: 'Risks derived from failed targets, low-efficiency task groups, procurement and contractor gaps.',
  },
  {
    id: 'progress-monitoring',
    label: 'Progress Monitoring',
    description: 'Monthly progress, Q3 target vs actual, Aluform casting cycles and Highrise status.',
  },
  {
    id: 'procurement',
    label: 'Purchasing & Contractors',
    description: 'Bulk purchasing (PLN/409) and contractor deployment (PLN/410) for Q3 2026.',
  },
];

export function getNavItems(project: ProjectId): NavItemConfig[] {
  return project === 'elenor' ? ELENOR_NAV_ITEMS : NAV_ITEMS;
}
