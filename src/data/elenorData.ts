// Nyati Elenor — Progress Review Presentation (PLN/407), upto October 2026.
// All figures are transcribed exactly as they appear in the source PDF
// (NYATI_ELENOR_31.10.2026.pdf). Display values are kept as strings so that
// formatting and rounding match the presentation one-to-one.

export type TargetStatus = 'Achieved' | 'Partly Done' | 'Failed' | null;
export type HighriseTone = 'closed' | 'open';

export interface ElenorCostRow {
  name: string;
  /** Visual level: 'total' = building/project total, 'group' = sub-total, 'item' = task group */
  level: 'total' | 'group' | 'item';
  indent?: boolean;
  baseline: string;
  plannedPct: string | null;
  plannedCost: string | null;
  actualPct: string | null;
  actualCost: string | null;
  efficiency: string | null;
}

export interface ElenorTargetRow {
  activity: string;
  targetOct: string;
  statusOct: string;
  status: TargetStatus;
  targetNov: string;
  targetDec: string;
}

export interface ElenorCastingRow {
  floor: string;
  date: string | null;
  cycle: string | null;
}

export const ELENOR_DATA = {
  reportRef: 'PLN/407',
  reportPeriod: 'Upto October 2026',
  asOfDate: '31.10.2026',

  // Slide 3 — Project Information
  projectInfo: [
    { label: 'Name', value: 'NYATI ELENOR' },
    { label: 'Location', value: 'Lullanagar, Pune' },
    { label: 'Number of Buildings', value: '03 Nos. (A & B, Commercial Bldg.)' },
    { label: 'Project Start Date', value: '1st December 2024' },
    { label: 'Finish Date', value: '30th April 2029' },
    { label: 'Signed off Cost', value: '371.22 Cr.' },
    { label: 'Baseline Cost', value: '371.22 Cr.' },
  ],

  // Slide 4 — Project Timeline
  timeline: {
    start: 'DEC 2024',
    finish: 'APRIL 2029',
    current: 'OCTOBER 2026',
    currentProgress: '9.92%',
    elapsedMonths: 23,
    totalMonths: 53,
    milestones: [
      { date: 'JUNE 2025', event: 'A Bldg. – 1st Footing Casted' },
      { date: 'JULY 2025', event: 'B Bldg. – 1st Footing Casted' },
      { date: 'AUGUST 2025', event: 'A & B Bldg. – 1st Slab Pour 1 Casted' },
      { date: 'MARCH 2026', event: 'A Bldg. – 1st Aluform Casted' },
      { date: 'MAY 2026', event: 'B Bldg. – 1st Aluform Casted' },
    ],
  },

  // Slide 5 — Upto Date Status from Start of the Project (₹ Cr)
  uptoDateStatus: [
    {
      project: 'NYATI ELENOR',
      detail: null,
      isTotal: true,
      totalCost: '371.22',
      plannedPct: '15.64%',
      plannedCost: '58.06',
      actualPct: '9.92%',
      actualCost: '36.83',
      efficiency: '63%',
    },
    {
      project: 'A BLDG - (B2+B1+G+32)',
      detail: '(3.5 BHK-5T, 4.5 BHK-6T)',
      isTotal: false,
      totalCost: '139.47',
      plannedPct: '13.92%',
      plannedCost: '19.42',
      actualPct: '8.53%',
      actualCost: '11.90',
      efficiency: '61%',
    },
    {
      project: 'B BLDG - (B2+B1+G+32)',
      detail: '(3.5 BHK-5T, 4.5 BHK-6T, 5.5 BHK-7T)',
      isTotal: false,
      totalCost: '141.77',
      plannedPct: '14.48%',
      plannedCost: '20.53',
      actualPct: '9.14%',
      actualCost: '12.96',
      efficiency: '63%',
    },
    {
      project: 'DEVELOPMENT',
      detail: null,
      isTotal: false,
      totalCost: '56.34',
      plannedPct: '16.34%',
      plannedCost: '9.20',
      actualPct: '13.76%',
      actualCost: '7.75',
      efficiency: '84%',
    },
  ],

  // Slide 6 — Status / Cost / Efficiency
  statusSummary: [
    {
      period: 'Upto Date Progress',
      actualPct: '9.92%',
      actualCost: '36.83 Cr.',
      plannedPct: '15.64%',
      plannedCost: '58.06 Cr.',
      efficiency: '63%',
    },
    {
      period: 'Progress for FY 2026-27 Upto October 2026',
      actualPct: '3.90%',
      actualCost: '14.48 Cr.',
      plannedPct: '7.07%',
      plannedCost: '26.25 Cr.',
      efficiency: '55%',
    },
  ],

  // Slide 7 — Monthwise Progress (% of project)
  monthwise: [
    { month: 'Apr-26', planned: 0.61, actual: 0.37, efficiency: 61 },
    { month: 'May-26', planned: 0.71, actual: 0.34, efficiency: 48 },
    { month: 'Jun-26', planned: 1.05, actual: 0.48, efficiency: 46 },
    { month: 'Jul-26', planned: 1.34, actual: 0.5, efficiency: 37 },
    { month: 'Aug-26', planned: 1.04, actual: 0.72, efficiency: 69 },
    { month: 'Sep-26', planned: 1.11, actual: 0.67, efficiency: 60 },
    { month: 'Oct-26', planned: 1.25, actual: 0.74, efficiency: 59 },
  ],

  // Slide 8 — Monthly Progress, Building-wise (% per building)
  buildingWiseMonthly: [
    { month: 'Apr-26', aBldg: 0.32, bBldg: 0.42, dev: 0.26 },
    { month: 'May-26', aBldg: 0.35, bBldg: 0.37, dev: 0.2 },
    { month: 'Jun-26', aBldg: 0.59, bBldg: 0.47, dev: 0.26 },
    { month: 'Jul-26', aBldg: 0.43, bBldg: 0.76, dev: 0.07 },
    { month: 'Aug-26', aBldg: 0.75, bBldg: 0.94, dev: 0.13 },
    { month: 'Sep-26', aBldg: 0.69, bBldg: 0.58, dev: 0.13 },
    { month: 'Oct-26', aBldg: 0.56, bBldg: 0.97, dev: 0.13 },
  ],
  fyActualCostUptoOct: { aBldg: '5.31', bBldg: '6.50', development: '0.67' },

  // Slides 9–11 — Target vs Actual, 3rd Quarter (October – December 2026)
  targetVsActual: {
    A: [
      { activity: 'RCC - ALUFORM', targetOct: '12th & 13th Floor', statusOct: '7th Floor – 100% Complete', status: 'Failed', targetNov: '14th & 15th Floor', targetDec: '16th & 17th Floor' },
      { activity: 'MASONARY', targetOct: '10th & 11th Floor', statusOct: '4th Floor – 2/4 Flats Complete', status: 'Failed', targetNov: '12th & 13th Floor', targetDec: '14th & 15th Floor' },
      { activity: 'TAR PLASTER', targetOct: '8th & 9th Floor', statusOct: '3rd Floor – 100% Complete', status: 'Failed', targetNov: '10th & 11th Floor', targetDec: '12th & 13th Floor' },
      { activity: 'CONCEALED PLUMBING', targetOct: '8th & 9th Floor', statusOct: '1st Floor - 100% Complete', status: 'Failed', targetNov: '10th & 11th Floor', targetDec: '12th & 13th Floor' },
      { activity: 'WATERPROOFING', targetOct: '6th & 7th Floor', statusOct: '1st Floor - 100% Complete (Toilets)', status: 'Failed', targetNov: '8th & 9th Floor', targetDec: '10th & 11th Floor' },
      { activity: 'ELECTRICAL - WALL DROPPING', targetOct: '2nd & 3rd Floor', statusOct: '3rd Floor – 100% Complete', status: 'Achieved', targetNov: '4th & 5th Floor', targetDec: '6th & 7th Floor' },
      { activity: 'GYPSUM PLASTER', targetOct: '2nd & 3rd Floor', statusOct: '2nd Floor – 100% Complete', status: 'Partly Done', targetNov: '4th & 5th Floor', targetDec: '6th & 7th Floor' },
      { activity: 'SPRINKLER SYSTEM', targetOct: '3rd & 4th Floor', statusOct: '1st Floor – 1/4 Flats (Sample Flat) Complete', status: 'Failed', targetNov: '5th & 6th Floor', targetDec: '7th & 8th Floor' },
      { activity: 'FALSE CEILING - FRAMING', targetOct: '-', statusOct: '1st Floor – 1/4 Flats (Sample Flat) Complete', status: 'Achieved', targetNov: '1st Floor', targetDec: '2nd & 3rd Floor' },
      { activity: 'TILING', targetOct: '-', statusOct: '-', status: null, targetNov: '-', targetDec: '1st Floor' },
    ] as ElenorTargetRow[],
    B: [
      { activity: 'RCC - ALUFORM', targetOct: '11th & 12th Floor', statusOct: '7th Floor – 100% Complete', status: 'Failed', targetNov: '13th & 14th Floor', targetDec: '15th & 16th Floor' },
      { activity: 'MASONARY', targetOct: '8th & 9th Floor', statusOct: '3rd Floor – 100% Complete', status: 'Failed', targetNov: '10th & 11th Floor', targetDec: '12th & 13th Floor' },
      { activity: 'TAR PLASTER', targetOct: '6th & 7th Floor', statusOct: '3rd Floor – 2/4 Flats Complete', status: 'Failed', targetNov: '8th & 9th Floor', targetDec: '10th & 11th Floor' },
      { activity: 'CONCEALED PLUMBING', targetOct: '6th & 7th Floor', statusOct: '1st Floor – 2/4 Flats Complete', status: 'Failed', targetNov: '8th & 9th Floor', targetDec: '10th & 11th Floor' },
      { activity: 'WATERPROOFING', targetOct: '4th & 5th Floor', statusOct: '1st Floor – 100% Complete (Toilets)', status: 'Failed', targetNov: '6th & 7th Floor', targetDec: '8th & 9th Floor' },
      { activity: 'ELECTRICAL - WALL DROPPING', targetOct: '1st Floor', statusOct: '3rd Floor – 100% Complete', status: 'Achieved', targetNov: '2nd & 3rd Floor', targetDec: '4th & 5th Floor' },
      { activity: 'GYPSUM PLASTER', targetOct: '1st Floor', statusOct: '2nd Floor – 3/4 Flats', status: 'Achieved', targetNov: '2nd & 3rd Floor', targetDec: '4th & 5th Floor' },
      { activity: 'SPRINKLER SYSTEM', targetOct: '1st & 2nd Floor', statusOct: '1st Floor – 2/4 Flats (Sample Flat) Complete', status: 'Partly Done', targetNov: '3rd & 4th Floor', targetDec: '5th & 6th Floor' },
      { activity: 'FALSE CEILING - FRAMING', targetOct: '-', statusOct: '-', status: null, targetNov: '-', targetDec: '1st Floor' },
    ] as ElenorTargetRow[],
    Development: [
      { activity: 'UGWT', targetOct: 'Waterproofing – 50% Complete', statusOct: 'Waterproofing – 90% Complete', status: 'Achieved', targetNov: 'Waterproofing – 100% Complete', targetDec: '-' },
      { activity: 'STP', targetOct: '-', statusOct: 'Waterproofing – 40% Complete', status: 'Achieved', targetNov: '-', targetDec: 'Waterproofing – 50% Complete' },
      { activity: 'COMMERCIAL', targetOct: '-', statusOct: '-', status: null, targetNov: 'Excavation – 20%', targetDec: 'Excavation – 40%' },
    ] as ElenorTargetRow[],
  },

  // Slide 12 — Aluform Floor Casting Dates (floors 8th–32nd not yet cast)
  aluformCasting: {
    A: [
      { floor: '7th Floor', date: '31/10/2026', cycle: '30 days' },
      { floor: '6th Floor', date: '01/10/2026', cycle: '31 days' },
      { floor: '5th Floor', date: '31/08/2026', cycle: '23 days' },
      { floor: '4th Floor', date: '08/08/2026', cycle: '47 days' },
      { floor: '3rd Floor', date: '22/06/2026', cycle: '36 days' },
      { floor: '2nd Floor', date: '17/05/2026', cycle: '49 days' },
      { floor: '1st Floor', date: '29/03/2026', cycle: null },
    ] as ElenorCastingRow[],
    B: [
      { floor: '7th Floor', date: '22/10/2026', cycle: '21 days' },
      { floor: '6th Floor', date: '01/10/2026', cycle: '33 days' },
      { floor: '5th Floor', date: '29/08/2026', cycle: '20 days' },
      { floor: '4th Floor', date: '09/08/2026', cycle: '25 days' },
      { floor: '3rd Floor', date: '15/07/2026', cycle: '41 days' },
      { floor: '2nd Floor', date: '04/06/2026', cycle: '23 days' },
      { floor: '1st Floor', date: '12/05/2026', cycle: null },
    ] as ElenorCastingRow[],
    totalFloors: 32,
    note: 'Unavailability of Concrete due to RMC Strike across Pune from 16/04/26 to 08/05/26 (23 Days)',
    strike: { from: '16/04/2026', to: '08/05/2026', days: 23 },
  },

  // Slide 13 — Activity-wise Actual vs Highrise Work Status (upto 31.10.2026)
  highriseStatus: [
    { activity: 'ALUFORM – 3rd FLOOR', aActual: '100% Completed', aHighrise: 'Tasks Closed', aTone: 'closed', bActual: '100% Completed', bHighrise: 'Tasks Closed', bTone: 'closed' },
    { activity: 'ALUFORM – 4th FLOOR', aActual: '100% Completed', aHighrise: 'Tasks Closed', aTone: 'closed', bActual: '100% Completed', bHighrise: 'Tasks Closed', bTone: 'closed' },
    { activity: 'ALUFORM – 5th FLOOR', aActual: '100% Completed', aHighrise: 'Tasks Closed', aTone: 'closed', bActual: '100% Completed', bHighrise: 'Tasks Closed', bTone: 'closed' },
    { activity: 'ALUFORM – 6th FLOOR', aActual: '100% Completed', aHighrise: 'Tasks Closed', aTone: 'closed', bActual: '100% Completed', bHighrise: 'Tasks Closed', bTone: 'closed' },
    { activity: 'ALUFORM – 7th FLOOR', aActual: '100% Completed', aHighrise: 'Tasks Open', aTone: 'open', bActual: '100% Completed', bHighrise: 'Coupler & GP2 Tasks Open', bTone: 'open' },
    { activity: 'MASONARY', aActual: 'Upto 3rd Floor Complete', aHighrise: 'Tasks closed upto 3rd floor', aTone: 'closed', bActual: 'Upto 3rd Floor Complete', bHighrise: 'Tasks closed upto 3rd floor', bTone: 'closed' },
    { activity: 'TAR PLASTER', aActual: 'Upto 3rd Floor Complete', aHighrise: 'Tasks closed upto 1st floor', aTone: 'closed', bActual: 'Upto 2nd Floor Complete', bHighrise: 'Tasks closed upto 2nd floor', bTone: 'closed' },
    { activity: 'GYPSUM PLASTER', aActual: 'Upto 2nd Floor Complete', aHighrise: 'Tasks Open', aTone: 'open', bActual: 'Upto 2nd Floor – 75% Complete', bHighrise: 'Tasks Open', bTone: 'open' },
  ] as Array<{
    activity: string;
    aActual: string;
    aHighrise: string;
    aTone: HighriseTone;
    bActual: string;
    bHighrise: string;
    bTone: HighriseTone;
  }>,

  // Slides 14–17 — Building-wise Progress (₹ Lacs)
  buildingProgress: {
    A: [
      { name: 'A BLDG - (B2+B1+G+32) (3.5 BHK-5T, 4.5 BHK-6T)', level: 'total', baseline: '13947.04', plannedPct: '13.91%', plannedCost: '1940.03', actualPct: '8.53%', actualCost: '1189.70', efficiency: '61%' },
      { name: '(TG) A- Earthwork', level: 'item', baseline: '131.85', plannedPct: '69.47%', plannedCost: '91.60', actualPct: '67.14%', actualCost: '88.52', efficiency: '97%' },
      { name: '(TG) A- RCC', level: 'item', baseline: '3370.94', plannedPct: '44.52%', plannedCost: '1500.68', actualPct: '31.13%', actualCost: '1049.48', efficiency: '70%' },
      { name: '(TG) A- Masonry', level: 'item', baseline: '176.87', plannedPct: '27.56%', plannedCost: '48.74', actualPct: '9.28%', actualCost: '16.42', efficiency: '34%' },
      { name: '(TG) A- Plaster', level: 'item', baseline: '956.91', plannedPct: '3.06%', plannedCost: '29.29', actualPct: '1.47%', actualCost: '14.03', efficiency: '48%' },
      { name: '(TG) A-Waterproofing', level: 'item', baseline: '210.37', plannedPct: '10.60%', plannedCost: '22.29', actualPct: '1.24%', actualCost: '2.61', efficiency: '12%' },
      { name: '(TG) A-Tiling', level: 'item', baseline: '2389.65', plannedPct: '0.53%', plannedCost: '12.56', actualPct: '0.00%', actualCost: '0.00', efficiency: '0%' },
      { name: '(TG) A-Electrical work (M+L)', level: 'item', baseline: '652.61', plannedPct: '4.91%', plannedCost: '32.07', actualPct: '2.05%', actualCost: '13.39', efficiency: '42%' },
      { name: '(TG) A-Plumbing & Sanitation', level: 'item', baseline: '786.50', plannedPct: '2.30%', plannedCost: '18.13', actualPct: '0.27%', actualCost: '2.12', efficiency: '12%' },
      { name: '(TG) A-Fabrication (M+L)', level: 'item', baseline: '258.80', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) A-Aluminium Window (M+L)', level: 'item', baseline: '218.47', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) A-Doors', level: 'item', baseline: '818.23', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) A-Painting (M+L)', level: 'item', baseline: '263.99', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) A-Elevational Treatment', level: 'item', baseline: '423.86', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) A-Flat Amenities', level: 'item', baseline: '1867.36', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) A-Home Automation', level: 'item', baseline: '332.64', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) A-Dept. Labour', level: 'item', baseline: '274.96', plannedPct: '1.02%', plannedCost: '2.79', actualPct: '1.13%', actualCost: '3.11', efficiency: '112%' },
      { name: '(TG) A-Bldg. Misc.', level: 'item', baseline: '12.93', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) A-Building Services', level: 'item', baseline: '800.09', plannedPct: '0.17%', plannedCost: '1.39', actualPct: '0.00%', actualCost: '0.00', efficiency: '0%' },
    ] as ElenorCostRow[],
    B: [
      { name: 'B BLDG - (B2+B1+G+32) (3.5 BHK-5T, 4.5 BHK-6T, 5.5 BHK-7T)', level: 'total', baseline: '14177.11', plannedPct: '14.48%', plannedCost: '2052.85', actualPct: '9.14%', actualCost: '1296.41', efficiency: '63%' },
      { name: '(TG) B- Earthwork', level: 'item', baseline: '117.22', plannedPct: '68.67%', plannedCost: '80.50', actualPct: '65.40%', actualCost: '76.66', efficiency: '95%' },
      { name: '(TG) B- RCC', level: 'item', baseline: '3381.19', plannedPct: '48.34%', plannedCost: '1634.60', actualPct: '34.46%', actualCost: '1165.13', efficiency: '71%' },
      { name: '(TG) B- Masonry', level: 'item', baseline: '186.62', plannedPct: '26.52%', plannedCost: '49.48', actualPct: '8.61%', actualCost: '16.06', efficiency: '32%' },
      { name: '(TG) B- Plaster', level: 'item', baseline: '983.22', plannedPct: '2.88%', plannedCost: '28.33', actualPct: '1.36%', actualCost: '13.42', efficiency: '47%' },
      { name: '(TG) B-Waterproofing', level: 'item', baseline: '219.38', plannedPct: '10.97%', plannedCost: '24.06', actualPct: '1.74%', actualCost: '3.81', efficiency: '16%' },
      { name: '(TG) B-Tiling', level: 'item', baseline: '2413.03', plannedPct: '0.82%', plannedCost: '19.85', actualPct: '0.00%', actualCost: '0.00', efficiency: '0%' },
      { name: '(TG) B-Electrical work (M+L)', level: 'item', baseline: '689.72', plannedPct: '5.13%', plannedCost: '35.41', actualPct: '2.21%', actualCost: '15.27', efficiency: '43%' },
      { name: '(TG) B-Plumbing & Sanitation', level: 'item', baseline: '813.08', plannedPct: '3.48%', plannedCost: '28.33', actualPct: '0.34%', actualCost: '2.76', efficiency: '10%' },
      { name: '(TG) B-Fabrication (M+L)', level: 'item', baseline: '259.89', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) B-Aluminium Window (M+L)', level: 'item', baseline: '236.22', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) B-Doors (M+L)', level: 'item', baseline: '837.86', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) B-Painting (M+L)', level: 'item', baseline: '278.47', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) B-Elevational Treatment', level: 'item', baseline: '423.86', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) B-Flat Amenities', level: 'item', baseline: '1886.84', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) B-Home Automation', level: 'item', baseline: '338.01', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) B-Dept. Labour', level: 'item', baseline: '275.39', plannedPct: '1.03%', plannedCost: '2.84', actualPct: '1.20%', actualCost: '3.31', efficiency: '117%' },
      { name: '(TG) B-Bldg. Misc.', level: 'item', baseline: '37.29', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) B-Building Services', level: 'item', baseline: '799.83', plannedPct: '0.18%', plannedCost: '1.42', actualPct: '0.00%', actualCost: '0.00', efficiency: '0%' },
    ] as ElenorCostRow[],
    Development: [
      { name: '(TG) DEVELOPMENT', level: 'total', baseline: '5633.60', plannedPct: '16.33%', plannedCost: '919.97', actualPct: '13.76%', actualCost: '775.11', efficiency: '84%' },
      { name: '(TG) Podium', level: 'group', baseline: '1913.21', plannedPct: '38.93%', plannedCost: '744.78', actualPct: '32.98%', actualCost: '630.99', efficiency: '85%' },
      { name: '(TG) Podium- Earthwork', level: 'item', indent: true, baseline: '160.27', plannedPct: '79.95%', plannedCost: '128.14', actualPct: '44.21%', actualCost: '70.85', efficiency: '55%' },
      { name: '(TG) Podium-Civil', level: 'item', indent: true, baseline: '1359.78', plannedPct: '31.00%', plannedCost: '421.50', actualPct: '27.48%', actualCost: '373.61', efficiency: '89%' },
      { name: '(TG) Podium- MEP', level: 'item', indent: true, baseline: '190.07', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Podium-Retaining Wall', level: 'item', indent: true, baseline: '203.09', plannedPct: '95.95%', plannedCost: '194.87', actualPct: '91.84%', actualCost: '186.52', efficiency: '96%' },
      { name: 'Development', level: 'group', baseline: '3720.39', plannedPct: '4.72%', plannedCost: '175.77', actualPct: '3.87%', actualCost: '144.12', efficiency: '82%' },
      { name: '(TG) Boom Barrier', level: 'item', indent: true, baseline: '2.63', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Children Play Equipment', level: 'item', indent: true, baseline: '12.84', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Compound Wall', level: 'item', indent: true, baseline: '75.80', plannedPct: '0.00%', plannedCost: '0.00', actualPct: '0.31%', actualCost: '0.23', efficiency: null },
      { name: '(TG) Club House & Multi-Purpose Hall', level: 'item', indent: true, baseline: '82.45', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Development Elevational Treatment+ Facade Lighting', level: 'item', indent: true, baseline: '466.46', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Dept. Muster', level: 'item', indent: true, baseline: '66.01', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) External Plumbing Civil work (M+L)', level: 'item', indent: true, baseline: '15.28', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Electric Vehicle Charging Point', level: 'item', indent: true, baseline: '130.64', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) External Plumbing work (M+L)', level: 'item', indent: true, baseline: '53.07', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Hydro-Pneumatic system', level: 'item', indent: true, baseline: '30.40', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) IT Works', level: 'item', indent: true, baseline: '64.41', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Internal Road Work ( Excl. Podium Area)', level: 'item', indent: true, baseline: '83.81', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) LT Room MEP & Civil Work', level: 'item', indent: true, baseline: '685.31', plannedPct: '1.41%', plannedCost: '9.67', actualPct: '0.67%', actualCost: '4.59', efficiency: '47%' },
      { name: '(TG) Landscaping work at Stilt Podium & Top Terrace Area', level: 'item', indent: true, baseline: '59.00', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Main Gate & Watchman Cabin', level: 'item', indent: true, baseline: '75.79', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Machinery Hiring & Local Trips', level: 'item', indent: true, baseline: '12.75', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Misc. work for Development', level: 'item', indent: true, baseline: '0.00', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Mechanical Ventilation', level: 'item', indent: true, baseline: '105.38', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Other Pumping System', level: 'item', indent: true, baseline: '11.87', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) OWC', level: 'item', indent: true, baseline: '22.50', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Podium Amenities', level: 'item', indent: true, baseline: '173.36', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Rain Water Harvesting', level: 'item', indent: true, baseline: '17.20', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Sanitation & STP', level: 'item', indent: true, baseline: '180.04', plannedPct: '14.88%', plannedCost: '26.78', actualPct: '9.08%', actualCost: '16.34', efficiency: '61%' },
      { name: '(TG) Signages', level: 'item', indent: true, baseline: '10.96', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Society Office', level: 'item', indent: true, baseline: '4.72', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Stack Parking', level: 'item', indent: true, baseline: '852.38', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Street Lights', level: 'item', indent: true, baseline: '10.92', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Swimming Pool', level: 'item', indent: true, baseline: '134.45', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) Top Terrace Amenity Civil work', level: 'item', indent: true, baseline: '100.67', plannedPct: null, plannedCost: null, actualPct: null, actualCost: null, efficiency: null },
      { name: '(TG) UGWT + Pump Room', level: 'item', indent: true, baseline: '179.28', plannedPct: '77.59%', plannedCost: '139.11', actualPct: '68.58%', actualCost: '122.95', efficiency: '88%' },
    ] as ElenorCostRow[],
  },

  // Slide 18 — Summary of Task Closing
  taskClosing: {
    openTaskCount: '300 Nos.',
    openTaskAmount: '16.18 Cr.',
    closedInMonthLabel: 'October 2026',
    closedInMonth: '84 Nos',
  },

  // Slide 19 — Bulk Purchasing (PLN/409), 3rd Quarter Oct–Dec 2026
  bulkPurchasing: {
    ref: 'PLN/409',
    rows: [
      { sr: 1, item: 'Int. plumbing', poProcessing: 5, leadTime: 14, a: { planned: '18/09/2026', reqDate: '30/08/2026', reqStatus: 'Partly Given', poStatus: 'Partly Completed', delivery: 'Partly Done' }, b: { planned: '18/09/2026', reqDate: '30/08/2026', reqStatus: 'Partly Given', poStatus: 'Partly Completed', delivery: 'Partly Done' } },
      { sr: 2, item: 'Dado & Flooring', poProcessing: 5, leadTime: 30, a: { planned: '06/10/2026', reqDate: '01/09/2026', reqStatus: 'Given For Sample Flat', poStatus: 'Done For Sample Flat', delivery: 'Not Done' }, b: { planned: '06/10/2026', reqDate: '01/09/2026', reqStatus: 'Given For Sample Flat', poStatus: 'Done For Sample Flat', delivery: 'Not Done' } },
      { sr: 3, item: 'Door frames & shutters', poProcessing: 5, leadTime: 45, a: null, b: null },
      { sr: 4, item: 'Door fittings', poProcessing: 5, leadTime: 30, a: null, b: null },
      { sr: 5, item: 'Ext. plumbing', poProcessing: 5, leadTime: 14, a: null, b: null },
      { sr: 6, item: 'Staircase, Lobby, Lift - marble/tile', poProcessing: 5, leadTime: 30, a: null, b: null },
      { sr: 7, item: 'Sanitaryware', poProcessing: 5, leadTime: 30, a: null, b: null },
      { sr: 8, item: 'C.P. Fittings', poProcessing: 5, leadTime: 30, a: null, b: null },
    ] as Array<{
      sr: number;
      item: string;
      poProcessing: number;
      leadTime: number;
      a: { planned: string; reqDate: string; reqStatus: string; poStatus: string; delivery: string } | null;
      b: { planned: string; reqDate: string; reqStatus: string; poStatus: string; delivery: string } | null;
    }>,
  },

  // Slide 20 — Contractor Deployment (PLN/410), 3rd Quarter Oct–Dec 2026
  contractorDeployment: {
    ref: 'PLN/410',
    rows: [
      { sr: 1, contractor: 'Excavation', processing: 30, a: { planned: '02/12/2024', wo: '02/11/2024', labour: 'Given', woStatus: 'Completed' }, b: { planned: '02/12/2024', wo: '02/11/2024', labour: 'Given', woStatus: 'Completed' } },
      { sr: 2, contractor: 'RCC', processing: 30, a: { planned: '05/05/2025', wo: '05/04/2025', labour: 'Given', woStatus: 'Completed' }, b: { planned: '05/05/2025', wo: '05/04/2025', labour: 'Given', woStatus: 'Completed' } },
      { sr: 3, contractor: 'Anti Termite Treatment', processing: 8, a: { planned: '05/05/2025', wo: '26/04/2025', labour: 'Given', woStatus: 'Completed' }, b: { planned: '05/05/2025', wo: '26/04/2025', labour: 'Given', woStatus: 'Completed' } },
      { sr: 4, contractor: 'Masonary', processing: 30, a: { planned: '07/05/2026', wo: '07/04/2026', labour: 'Part Given', woStatus: 'Part Done' }, b: { planned: '20/05/2026', wo: '20/04/2026', labour: 'Part Given', woStatus: 'Part Done' } },
      { sr: 5, contractor: 'Gypsum Plaster', processing: 30, a: { planned: '29/08/2026', wo: '29/07/2026', labour: 'Part Given', woStatus: 'Part Done' }, b: { planned: '29/08/2026', wo: '29/07/2026', labour: 'Part Given', woStatus: 'Part Done' } },
      { sr: 6, contractor: 'Putty Plaster', processing: 30, a: null, b: null },
      { sr: 7, contractor: 'External Plaster', processing: 30, a: null, b: null },
      { sr: 8, contractor: 'Waterproofing', processing: 30, a: { planned: '01/08/2026', wo: '01/07/2026', labour: 'Part Given', woStatus: 'Part Done' }, b: { planned: '01/08/2026', wo: '01/07/2026', labour: 'Part Given', woStatus: 'Part Done' } },
      { sr: 9, contractor: 'Internal Plumbing', processing: 30, a: { planned: '18/09/2026', wo: '18/08/2026', labour: 'Part Given', woStatus: 'Part Done' }, b: { planned: '18/09/2026', wo: '18/08/2026', labour: 'Part Given', woStatus: 'Part Done' } },
      { sr: 10, contractor: 'External Plumbing', processing: 30, a: null, b: null },
      { sr: 11, contractor: 'Tiling', processing: 30, a: { planned: '06/10/2026', wo: '06/09/2026', labour: 'Part Given', woStatus: 'Part Done' }, b: { planned: '06/10/2026', wo: '06/09/2026', labour: 'Not Given', woStatus: '-' } },
      { sr: 12, contractor: 'Electrical', processing: 45, a: { planned: '12/09/2025', wo: '12/08/2025', labour: 'Part Given', woStatus: 'Part Done' }, b: { planned: '12/09/2025', wo: '12/08/2025', labour: 'Part Given', woStatus: 'Part Done' } },
      { sr: 13, contractor: 'Aluminium Windows', processing: 45, a: null, b: null },
      { sr: 14, contractor: 'Door Shutters', processing: 30, a: null, b: null },
      { sr: 15, contractor: 'Fabrication', processing: 45, a: null, b: null },
      { sr: 16, contractor: 'False Ceiling', processing: 45, a: { planned: '06/01/2027', wo: '22/11/2026', labour: 'Part Given', woStatus: 'Part Done' }, b: { planned: '06/01/2027', wo: '22/11/2026', labour: 'Part Given', woStatus: 'Part Done' } },
      { sr: 17, contractor: 'Internal Painting', processing: 30, a: null, b: null },
      { sr: 18, contractor: 'External Painting', processing: 30, a: null, b: null },
      { sr: 19, contractor: 'Modular Kitchen', processing: 30, a: null, b: null },
      { sr: 20, contractor: 'Aluminium Doors', processing: 45, a: null, b: null },
      { sr: 21, contractor: 'Lift', processing: 30, a: null, b: null },
      { sr: 23, contractor: 'Firefighting', processing: 30, a: { planned: '26/10/2026', wo: '26/09/2026', labour: 'Not Given', woStatus: '-' }, b: { planned: '26/10/2026', wo: '26/09/2026', labour: 'Not Given', woStatus: '-' } },
      { sr: 24, contractor: 'Solar', processing: 30, a: null, b: null },
    ] as Array<{
      sr: number;
      contractor: string;
      processing: number;
      a: { planned: string; wo: string; labour: string; woStatus: string } | null;
      b: { planned: string; wo: string; labour: string; woStatus: string } | null;
    }>,
  },

  presenter: {
    name: 'Gargi Amrujkar',
    email: 'gargi@nyatigroup.com',
  },
};

/* ------------------------------------------------------------------------- */
/* Risk register — derived strictly from the figures above (no new numbers).  */
/* ------------------------------------------------------------------------- */

export type ElenorRiskSeverity = 'High' | 'Medium' | 'Low';

export interface ElenorRisk {
  id: string;
  severity: ElenorRiskSeverity;
  category: 'Progress' | 'Target' | 'Cost Group' | 'Procurement' | 'Contractor' | 'Task Closing';
  title: string;
  scope: string;
  reason: string;
  suggestedNextStep: string;
}

export function computeElenorRisks(): ElenorRisk[] {
  const d = ELENOR_DATA;
  const risks: ElenorRisk[] = [];

  const upto = d.statusSummary[0];
  const fy = d.statusSummary[1];
  risks.push({
    id: 'elenor-overall-progress',
    severity: 'High',
    category: 'Progress',
    title: 'Overall progress behind plan',
    scope: 'Nyati Elenor (project)',
    reason: `Upto date actual ${upto.actualPct} (${upto.actualCost}) vs planned ${upto.plannedPct} (${upto.plannedCost}) — efficiency ${upto.efficiency}. FY 2026-27 upto October: actual ${fy.actualPct} vs planned ${fy.plannedPct} — efficiency ${fy.efficiency}.`,
    suggestedNextStep: 'Review the recovery plan for the lowest-efficiency task groups and re-baseline monthly targets.',
  });

  (['A', 'B', 'Development'] as const).forEach((bldg) => {
    d.targetVsActual[bldg]
      .filter((r) => r.status === 'Failed')
      .forEach((r) => {
        const isStructure = r.activity.startsWith('RCC');
        risks.push({
          id: `elenor-target-${bldg}-${r.activity}`,
          severity: isStructure ? 'High' : 'Medium',
          category: 'Target',
          title: `${r.activity} — October target failed`,
          scope: bldg === 'Development' ? 'Development' : `${bldg} Bldg.`,
          reason: `Target Oct 2026: ${r.targetOct}. Status: ${r.statusOct}. Next targets — Nov: ${r.targetNov}, Dec: ${r.targetDec}.`,
          suggestedNextStep: isStructure
            ? 'Critical path: review Aluform cycle time, concrete supply and manpower to close the floor gap.'
            : 'Confirm manpower and front availability for this activity before the November target.',
        });
      });
  });

  const lowEff = (['A', 'B', 'Development'] as const).flatMap((bldg) =>
    d.buildingProgress[bldg]
      .filter((r) => r.level === 'item' && r.efficiency !== null && parseFloat(r.efficiency) < 50)
      .map((r) => ({ bldg, r }))
  );
  lowEff.forEach(({ bldg, r }) => {
    const eff = parseFloat(r.efficiency as string);
    risks.push({
      id: `elenor-cost-${r.name}`,
      severity: eff < 20 ? 'High' : 'Medium',
      category: 'Cost Group',
      title: `${r.name} — efficiency ${r.efficiency}`,
      scope: bldg === 'Development' ? 'Development' : `${bldg} Bldg.`,
      reason: `Planned ${r.plannedPct} (₹${r.plannedCost} Lacs) vs actual ${r.actualPct} (₹${r.actualCost} Lacs) against baseline ₹${r.baseline} Lacs.`,
      suggestedNextStep: 'Check work-front readiness and contractor deployment for this task group.',
    });
  });

  d.bulkPurchasing.rows.forEach((row) => {
    (['a', 'b'] as const).forEach((side) => {
      const s = row[side];
      if (s && s.delivery === 'Not Done') {
        risks.push({
          id: `elenor-purchase-${row.item}-${side}`,
          severity: 'Medium',
          category: 'Procurement',
          title: `${row.item} — delivery not done`,
          scope: side === 'a' ? 'A Bldg.' : 'B Bldg.',
          reason: `Planned ${s.planned}, requisition ${s.reqDate} (${s.reqStatus}); PO ${s.poStatus}; delivery Not Done. Lead time ${row.leadTime} days.`,
          suggestedNextStep: 'Follow up with purchase on delivery dates ahead of the tiling start.',
        });
      }
    });
  });

  d.contractorDeployment.rows.forEach((row) => {
    (['a', 'b'] as const).forEach((side) => {
      const s = row[side];
      if (s && s.labour === 'Not Given') {
        risks.push({
          id: `elenor-contractor-${row.contractor}-${side}`,
          severity: 'Medium',
          category: 'Contractor',
          title: `${row.contractor} — labour requisition not given`,
          scope: side === 'a' ? 'A Bldg.' : 'B Bldg.',
          reason: `Planned date ${s.planned}, WO date ${s.wo}; labour requisition Not Given.`,
          suggestedNextStep: 'Raise the labour requisition and confirm the work order.',
        });
      }
    });
  });

  d.highriseStatus.forEach((r) => {
    (['a', 'b'] as const).forEach((side) => {
      const tone = side === 'a' ? r.aTone : r.bTone;
      if (tone === 'open') {
        risks.push({
          id: `elenor-highrise-${r.activity}-${side}`,
          severity: 'Low',
          category: 'Task Closing',
          title: `${r.activity} — Highrise tasks open`,
          scope: side === 'a' ? 'A Bldg.' : 'B Bldg.',
          reason: `Actual: ${side === 'a' ? r.aActual : r.bActual}. Highrise status: ${side === 'a' ? r.aHighrise : r.bHighrise}.`,
          suggestedNextStep: 'Close the completed work in Highrise so progress and billing reflect site status.',
        });
      }
    });
  });

  risks.push({
    id: 'elenor-open-tasks',
    severity: 'Medium',
    category: 'Task Closing',
    title: `Open tasks: ${d.taskClosing.openTaskCount} worth ₹${d.taskClosing.openTaskAmount}`,
    scope: 'Nyati Elenor (project)',
    reason: `${d.taskClosing.closedInMonth} tasks closed in ${d.taskClosing.closedInMonthLabel}; ${d.taskClosing.openTaskCount} (₹${d.taskClosing.openTaskAmount}) still open.`,
    suggestedNextStep: 'Prioritise closing tasks with completed site work.',
  });

  const order: Record<ElenorRiskSeverity, number> = { High: 0, Medium: 1, Low: 2 };
  return risks.sort((a, b) => order[a.severity] - order[b.severity]);
}
