import { Fragment, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Minus,
  XCircle,
  X,
  Search,
  Filter,
  ShieldAlert,
  Clock,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { ELENOR_DATA, ElenorCostRow, ElenorRiskSeverity, ElenorTargetRow, TargetStatus, computeElenorRisks } from '../../data/elenorData';
import { ElenorBuilding } from '../../types/navigation';

/* ================================== Theme & helpers ================================== */

const D = ELENOR_DATA;
type Bldg = Exclude<ElenorBuilding, 'all'>;
const BLDGS: Bldg[] = ['A', 'B', 'Development'];

// Restrained palette: one accent for "actual", neutral grey for "planned"/context.
const C = { actual: '#2a78d6', plan: '#94A3B8', context: '#CBD5E1', time: '#475569', grid: '#E2E8F0' };
const TONE = { good: '#16A34A', part: '#D97706', bad: '#DC2626', none: '#CBD5E1' } as const;
type Tone = keyof typeof TONE;

const AXIS_TICK = { fontSize: 11, fill: '#64748B' };
const TIP = {
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
};

const num = (v: string | null | undefined) => (v ? parseFloat(v.replace(/,/g, '')) : 0);
const lacs = (v: number) => v.toLocaleString('en-IN', { maximumFractionDigits: 0 });

function effTone(eff: number | null): Tone {
  if (eff === null || Number.isNaN(eff)) return 'none';
  if (eff >= 85) return 'good';
  if (eff >= 60) return 'part';
  return 'bad';
}

function textTone(text: string | undefined | null): Tone {
  if (!text || text === '-') return 'none';
  const t = text.toLowerCase();
  if (t.startsWith('not')) return 'bad';
  if (t.includes('part') || t.includes('sample')) return 'part';
  return 'good';
}

const STATUS_TONE: Record<Exclude<TargetStatus, null>, Tone> = {
  Achieved: 'good',
  'Partly Done': 'part',
  Failed: 'bad',
};

function parseDmy(d: string): number {
  const [dd, mm, yyyy] = d.split('/').map(Number);
  return new Date(yyyy, mm - 1, dd).getTime();
}

/** Highest floor number mentioned, e.g. "12th & 13th Floor" -> 13. */
function topFloor(text: string): number | null {
  const nums = [...text.matchAll(/(\d+)(?:st|nd|rd|th)/g)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) : null;
}

/** Floors completed, counting part floors, e.g. "4th Floor – 2/4 Flats Complete" -> 3.5. */
function achievedFloor(text: string): number | null {
  const floor = topFloor(text);
  if (floor === null) return null;
  const frac = text.match(/(\d)\/4/);
  return frac ? floor - 1 + Number(frac[1]) / 4 : floor;
}

function bldgInfo(b: Bldg) {
  const upto = D.uptoDateStatus[b === 'A' ? 1 : b === 'B' ? 2 : 3];
  const monthKey: 'aBldg' | 'bBldg' | 'dev' = b === 'A' ? 'aBldg' : b === 'B' ? 'bBldg' : 'dev';
  const fyCost =
    b === 'A' ? D.fyActualCostUptoOct.aBldg : b === 'B' ? D.fyActualCostUptoOct.bBldg : D.fyActualCostUptoOct.development;
  const side: 'a' | 'b' | null = b === 'A' ? 'a' : b === 'B' ? 'b' : null;
  const cast = b === 'Development' ? null : D.aluformCasting[b];
  return {
    label: b === 'Development' ? 'Development' : `${b} Building`,
    upto,
    monthKey,
    fyCost,
    side,
    cast,
    floorsCast: cast ? cast.filter((r) => r.date).length : 0,
    targets: D.targetVsActual[b],
    cost: D.buildingProgress[b],
  };
}

function targetCounts(rows: ElenorTargetRow[]) {
  const withStatus = rows.filter((r) => r.status);
  return {
    total: withStatus.length,
    met: withStatus.filter((r) => r.status === 'Achieved').length,
    partly: withStatus.filter((r) => r.status === 'Partly Done').length,
    failed: withStatus.filter((r) => r.status === 'Failed').length,
  };
}

/* ================================== Building blocks ================================== */

function Card({
  title,
  hint,
  action,
  children,
  className = '',
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`h-full rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05),0_12px_24px_rgba(0,0,0,0.03)] ${className}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
          {hint && <span className="text-xs text-slate-500 font-normal">{hint}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Swatch({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
      <span
        className="inline-block h-0.5 w-3.5 rounded-full"
        style={dashed ? { borderTop: `2px dashed ${color}` } : { backgroundColor: color, height: 3 }}
      />
      {label}
    </span>
  );
}

function Dot({ color, ring }: { color: string; ring?: boolean }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={ring ? { border: `2px solid ${color}`, background: '#fff' } : { backgroundColor: color }}
    />
  );
}

function ToneIcon({ tone, className = 'h-4 w-4' }: { tone: Tone; className?: string }) {
  const style = { color: TONE[tone] };
  if (tone === 'good') return <CheckCircle2 className={className} style={style} aria-label="Done" />;
  if (tone === 'part') return <CircleDot className={className} style={style} aria-label="Partly done" />;
  if (tone === 'bad') return <XCircle className={className} style={style} aria-label="Not done" />;
  return <Minus className={className} style={style} aria-label="Not scheduled" />;
}

function Effi({ value }: { value: string | null }) {
  if (!value) return <span className="text-slate-300">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold tabular-nums text-slate-900">
      <Dot color={TONE[effTone(num(value))]} />
      {value}
    </span>
  );
}

interface DonutSlice {
  name: string;
  value: number;
  color: string;
  formatted?: string;
}

interface KpiDonutData {
  title: string;
  centerText: string;
  centerSub: string;
  slices: DonutSlice[];
  footerNote?: string;
}

function SvgDonut({
  slices,
  centerText,
  centerSub,
  size = 116,
  strokeWidth = 15,
  activeSliceIndex = null,
  onHoverSlice,
}: {
  slices: DonutSlice[];
  centerText: string;
  centerSub: string;
  size?: number;
  strokeWidth?: number;
  activeSliceIndex?: number | null;
  onHoverSlice?: (idx: number | null) => void;
}) {
  const total = slices.reduce((s, d) => s + Math.max(0, d.value), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const hasActive = activeSliceIndex !== null && activeSliceIndex !== undefined && slices[activeSliceIndex] !== undefined;
  const activeSlice = hasActive ? slices[activeSliceIndex!] : null;

  const displayCenterText = activeSlice ? (activeSlice.formatted ?? `${activeSlice.value}`) : centerText;
  const displayCenterSub = activeSlice ? activeSlice.name : centerSub;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          slices.map((slice, i) => {
            if (slice.value <= 0) return null;
            const pct = slice.value / total;
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativeOffset * circumference;
            cumulativeOffset += pct;
            const isThisActive = activeSliceIndex === i;

            return (
              <circle
                key={slice.name + i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isThisActive ? strokeWidth + 2.5 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                onMouseEnter={() => onHoverSlice?.(i)}
                onMouseLeave={() => onHoverSlice?.(null)}
                className={`transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${
                  hasActive
                    ? isThisActive
                      ? 'opacity-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]'
                      : 'opacity-35'
                    : 'opacity-100 hover:opacity-90'
                }`}
              />
            );
          })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-1 transition-all duration-150">
        <span className="font-mono text-sm font-bold text-slate-900 leading-tight">
          {displayCenterText}
        </span>
        <span className="text-[10px] font-medium text-slate-500 leading-tight truncate max-w-[76px]">
          {displayCenterSub}
        </span>
      </div>
    </div>
  );
}

function getKpiDonutData(label: string, building: ElenorBuilding = 'all', valueStr?: string): KpiDonutData | null {
  const normalized = label.toLowerCase();

  // 1. PROGRESS
  if (normalized.includes('progress')) {
    if (building === 'A') {
      return {
        title: 'A Building Progress',
        centerText: '8.53%',
        centerSub: 'Actual',
        slices: [
          { name: 'Completed Progress', value: 8.53, color: '#2a78d6', formatted: '8.53%' },
          { name: 'Schedule Lag Gap', value: 5.38, color: '#d97706', formatted: '5.38%' },
          { name: 'Remaining Baseline', value: 86.09, color: '#e2e8f0', formatted: '86.09%' },
        ],
        footerNote: 'Target: 13.91% · 5.38% behind planned schedule',
      };
    }
    if (building === 'B') {
      return {
        title: 'B Building Progress',
        centerText: '9.14%',
        centerSub: 'Actual',
        slices: [
          { name: 'Completed Progress', value: 9.14, color: '#2a78d6', formatted: '9.14%' },
          { name: 'Schedule Lag Gap', value: 5.34, color: '#d97706', formatted: '5.34%' },
          { name: 'Remaining Baseline', value: 85.52, color: '#e2e8f0', formatted: '85.52%' },
        ],
        footerNote: 'Target: 14.48% · 5.34% behind planned schedule',
      };
    }
    if (building === 'Development') {
      return {
        title: 'Development Progress',
        centerText: '13.76%',
        centerSub: 'Actual',
        slices: [
          { name: 'Completed Progress', value: 13.76, color: '#2a78d6', formatted: '13.76%' },
          { name: 'Schedule Lag Gap', value: 2.57, color: '#94a3b8', formatted: '2.57%' },
          { name: 'Remaining Baseline', value: 83.67, color: '#e2e8f0', formatted: '83.67%' },
        ],
        footerNote: 'Target: 16.33% · Podium & external development',
      };
    }
    // Project All
    return {
      title: 'Overall Project Progress',
      centerText: '9.92%',
      centerSub: 'Overall',
      slices: [
        { name: 'Achieved Progress', value: 9.92, color: '#2a78d6', formatted: '9.92%' },
        { name: 'Schedule Lag Gap', value: 5.72, color: '#d97706', formatted: '5.72%' },
        { name: 'Remaining Baseline', value: 84.36, color: '#e2e8f0', formatted: '84.36%' },
      ],
      footerNote: 'Cumulative actual 9.92% vs Planned 15.64%',
    };
  }

  // 2. SPENT
  if (normalized.includes('spent')) {
    if (building === 'A') {
      return {
        title: 'A Building Cost Breakdown',
        centerText: '₹11.90 Cr',
        centerSub: 'Spent',
        slices: [
          { name: 'RCC (Aluform)', value: 10.49, color: '#2a78d6', formatted: '₹10.49 Cr' },
          { name: 'Earthwork', value: 0.89, color: '#38bdf8', formatted: '₹0.89 Cr' },
          { name: 'Masonry & Plaster', value: 0.30, color: '#64748b', formatted: '₹0.30 Cr' },
          { name: 'Services & Others', value: 0.22, color: '#94a3b8', formatted: '₹0.22 Cr' },
        ],
        footerNote: 'Planned: ₹19.40 Cr · Cumulative spend efficiency 61%',
      };
    }
    if (building === 'B') {
      return {
        title: 'B Building Cost Breakdown',
        centerText: '₹12.96 Cr',
        centerSub: 'Spent',
        slices: [
          { name: 'RCC (Aluform)', value: 11.65, color: '#2a78d6', formatted: '₹11.65 Cr' },
          { name: 'Earthwork', value: 0.77, color: '#38bdf8', formatted: '₹0.77 Cr' },
          { name: 'Masonry & Plaster', value: 0.29, color: '#64748b', formatted: '₹0.29 Cr' },
          { name: 'Services & Others', value: 0.25, color: '#94a3b8', formatted: '₹0.25 Cr' },
        ],
        footerNote: 'Planned: ₹20.53 Cr · Cumulative spend efficiency 63%',
      };
    }
    if (building === 'Development') {
      return {
        title: 'Development Cost Breakdown',
        centerText: '₹7.75 Cr',
        centerSub: 'Spent',
        slices: [
          { name: 'Podium Civil', value: 3.74, color: '#2a78d6', formatted: '₹3.74 Cr' },
          { name: 'Retaining Wall', value: 1.87, color: '#38bdf8', formatted: '₹1.87 Cr' },
          { name: 'UGWT & Pump Room', value: 1.23, color: '#64748b', formatted: '₹1.23 Cr' },
          { name: 'Earthwork & Misc', value: 0.91, color: '#94a3b8', formatted: '₹0.91 Cr' },
        ],
        footerNote: 'Planned: ₹9.20 Cr · Spend efficiency 84%',
      };
    }
    // Project All
    return {
      title: 'Total Project Spend Distribution',
      centerText: '₹36.83 Cr',
      centerSub: 'Spent',
      slices: [
        { name: 'A Building', value: 11.90, color: '#2a78d6', formatted: '₹11.90 Cr' },
        { name: 'B Building', value: 12.96, color: '#38bdf8', formatted: '₹12.96 Cr' },
        { name: 'Development & Podium', value: 7.75, color: '#64748b', formatted: '₹7.75 Cr' },
        { name: 'Site Ops & Overheads', value: 4.22, color: '#94a3b8', formatted: '₹4.22 Cr' },
      ],
      footerNote: 'Total spent ₹36.83 Cr of ₹58.06 Cr planned upto date',
    };
  }

  // 3. EFFICIENCY
  if (normalized.includes('efficiency')) {
    const effPct = building === 'A' ? 61 : building === 'B' ? 63 : building === 'Development' ? 84 : 63;
    const effColor = effPct >= 80 ? '#16a34a' : effPct >= 60 ? '#2a78d6' : '#d97706';
    return {
      title: `${building === 'all' ? 'Project' : building} Spend Efficiency`,
      centerText: `${effPct}%`,
      centerSub: 'Efficiency',
      slices: [
        { name: 'Earned Value Realised', value: effPct, color: effColor, formatted: `${effPct}%` },
        { name: 'Schedule/Cost Variance', value: 100 - effPct, color: '#e2e8f0', formatted: `${100 - effPct}%` },
      ],
      footerNote: 'Formula: Actual Cost ÷ Planned Target Cost (EV Index)',
    };
  }

  // 4. BUDGET
  if (normalized.includes('budget')) {
    if (building === 'A') {
      return {
        title: 'A Building Baseline Allocation',
        centerText: '₹139.5 Cr',
        centerSub: 'Budget',
        slices: [
          { name: 'RCC (Structure)', value: 33.71, color: '#2a78d6', formatted: '₹33.71 Cr' },
          { name: 'Tiling & Flooring', value: 23.90, color: '#38bdf8', formatted: '₹23.90 Cr' },
          { name: 'Flat Amenities', value: 18.67, color: '#64748b', formatted: '₹18.67 Cr' },
          { name: 'Plaster & Masonry', value: 11.34, color: '#94a3b8', formatted: '₹11.34 Cr' },
          { name: 'Other Packages', value: 51.85, color: '#cbd5e1', formatted: '₹51.85 Cr' },
        ],
        footerNote: 'Total baseline ₹13,947 Lacs (signed off)',
      };
    }
    if (building === 'B') {
      return {
        title: 'B Building Baseline Allocation',
        centerText: '₹141.8 Cr',
        centerSub: 'Budget',
        slices: [
          { name: 'RCC (Structure)', value: 33.81, color: '#2a78d6', formatted: '₹33.81 Cr' },
          { name: 'Tiling & Flooring', value: 24.13, color: '#38bdf8', formatted: '₹24.13 Cr' },
          { name: 'Flat Amenities', value: 18.87, color: '#64748b', formatted: '₹18.87 Cr' },
          { name: 'Plaster & Masonry', value: 11.70, color: '#94a3b8', formatted: '₹11.70 Cr' },
          { name: 'Other Packages', value: 53.26, color: '#cbd5e1', formatted: '₹53.26 Cr' },
        ],
        footerNote: 'Total baseline ₹14,177 Lacs (signed off)',
      };
    }
    if (building === 'Development') {
      return {
        title: 'Development Baseline Allocation',
        centerText: '₹56.3 Cr',
        centerSub: 'Budget',
        slices: [
          { name: 'Podium Structure', value: 19.13, color: '#2a78d6', formatted: '₹19.13 Cr' },
          { name: 'Stack Parking', value: 8.52, color: '#38bdf8', formatted: '₹8.52 Cr' },
          { name: 'LT Room & MEP', value: 6.85, color: '#64748b', formatted: '₹6.85 Cr' },
          { name: 'Elevational & Facade', value: 4.66, color: '#94a3b8', formatted: '₹4.66 Cr' },
          { name: 'Amenities & Roads', value: 17.18, color: '#cbd5e1', formatted: '₹17.18 Cr' },
        ],
        footerNote: 'Total baseline ₹5,634 Lacs (signed off)',
      };
    }
    // Project All
    return {
      title: 'Total Project Baseline Budget',
      centerText: '₹371.2 Cr',
      centerSub: 'Budget',
      slices: [
        { name: 'A Building', value: 139.47, color: '#2a78d6', formatted: '₹139.47 Cr' },
        { name: 'B Building', value: 141.77, color: '#38bdf8', formatted: '₹141.77 Cr' },
        { name: 'Development & Podium', value: 56.34, color: '#64748b', formatted: '₹56.34 Cr' },
        { name: 'General & Infrastructure', value: 33.64, color: '#94a3b8', formatted: '₹33.64 Cr' },
      ],
      footerNote: 'Total approved baseline: ₹371.22 Cr',
    };
  }

  // 5. FY 26-27 SPEND
  if (normalized.includes('fy 26-27') || normalized.includes('fy spend') || normalized.includes('fy')) {
    if (building === 'all') {
      return {
        title: 'FY 26-27 Spend by Wing',
        centerText: '₹18.06 Cr',
        centerSub: 'FY Spend',
        slices: [
          { name: 'A Building', value: 6.82, color: '#2a78d6', formatted: '₹6.82 Cr' },
          { name: 'B Building', value: 7.21, color: '#38bdf8', formatted: '₹7.21 Cr' },
          { name: 'Development', value: 4.03, color: '#64748b', formatted: '₹4.03 Cr' },
        ],
        footerNote: 'Cumulative FY spend Apr – Oct 2026',
      };
    }
    const fyVal = building === 'A' ? 6.82 : building === 'B' ? 7.21 : 4.03;
    const projected = building === 'A' ? 4.88 : building === 'B' ? 4.89 : 2.52;
    return {
      title: `${building} Bldg FY 26-27 Spend`,
      centerText: `₹${fyVal} Cr`,
      centerSub: 'Spent',
      slices: [
        { name: 'Apr–Oct Realised', value: fyVal, color: '#2a78d6', formatted: `₹${fyVal} Cr` },
        { name: 'H2 Target Balance', value: projected, color: '#cbd5e1', formatted: `₹${projected} Cr` },
      ],
      footerNote: 'Fiscal Year 2026-27 progress upto October',
    };
  }

  // 6. ALUFORM (or OCT TARGETS in Development)
  if (normalized.includes('aluform')) {
    if (building === 'all') {
      return {
        title: 'Aluform Casting Completion',
        centerText: '23 / 68',
        centerSub: 'Floors',
        slices: [
          { name: 'Wing A Cast', value: 12, color: '#2a78d6', formatted: '12 Floors' },
          { name: 'Wing B Cast', value: 11, color: '#38bdf8', formatted: '11 Floors' },
          { name: 'Remaining Slabs', value: 45, color: '#e2e8f0', formatted: '45 Floors' },
        ],
        footerNote: '33.8% cast across both 34-storey towers',
      };
    }
    const cast = building === 'A' ? 12 : 11;
    const remaining = 34 - cast;
    return {
      title: `${building} Building Aluform Cycle`,
      centerText: `${cast} / 34`,
      centerSub: `${((cast / 34) * 100).toFixed(0)}% Done`,
      slices: [
        { name: 'Floors Cast', value: cast, color: '#2a78d6', formatted: `${cast} Floors` },
        { name: 'Remaining Slabs', value: remaining, color: '#e2e8f0', formatted: `${remaining} Floors` },
      ],
      footerNote: `Avg cycle: ${building === 'A' ? '12.4' : '13.1'} days per floor`,
    };
  }

  if (normalized.includes('target')) {
    return {
      title: 'October Targets Status',
      centerText: '2 / 10',
      centerSub: 'Met',
      slices: [
        { name: 'Achieved', value: 2, color: '#16a34a', formatted: '2 Met' },
        { name: 'Partly Done', value: 1, color: '#d97706', formatted: '1 Part' },
        { name: 'Failed Targets', value: 7, color: '#dc2626', formatted: '7 Failed' },
      ],
      footerNote: 'Q3 target milestones for Development',
    };
  }

  return null;
}

function KpiDonutPopover({
  kpiLabel,
  building = 'all',
  currentValue,
}: {
  kpiLabel: string;
  building?: ElenorBuilding;
  currentValue: string;
}) {
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
  const data = getKpiDonutData(kpiLabel, building, currentValue);
  if (!data) return null;

  const total = data.slices.reduce((s, it) => s + Math.max(0, it.value), 0);

  return (
    <div className="space-y-3">
      {/* Popover Header */}
      <div className="flex items-center justify-between border-b border-slate-100/90 pb-2.5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">KPI Breakdown</span>
          <h4 className="text-xs font-bold text-slate-900 tracking-tight">{data.title}</h4>
        </div>
        <span className="rounded-lg bg-slate-100/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700 border border-slate-200/50">
          {data.centerText}
        </span>
      </div>

      {/* Donut Chart with dynamic hover & Apple activity ring styling */}
      <div className="flex justify-center py-1">
        <SvgDonut
          slices={data.slices}
          centerText={data.centerText}
          centerSub={data.centerSub}
          size={116}
          strokeWidth={15}
          activeSliceIndex={hoveredSlice}
          onHoverSlice={setHoveredSlice}
        />
      </div>

      {/* Legend & Breakdown List with row hover interactions */}
      <div className="space-y-0.5 text-[11px]">
        {data.slices.map((slice, i) => {
          const isRowHovered = hoveredSlice === i;
          const share = total > 0 ? ((slice.value / total) * 100).toFixed(0) : '0';
          return (
            <div
              key={slice.name}
              onMouseEnter={() => setHoveredSlice(i)}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`flex items-center justify-between py-1 px-1.5 -mx-1.5 rounded-lg cursor-pointer transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isRowHovered
                  ? 'bg-slate-100/90 shadow-2xs translate-x-0.5'
                  : hoveredSlice !== null
                  ? 'opacity-40'
                  : 'hover:bg-slate-50/80'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-xs transition-transform duration-200 ${
                    isRowHovered ? 'scale-125 ring-2 ring-slate-400/30' : ''
                  }`}
                  style={{ backgroundColor: slice.color }}
                />
                <span className={`truncate ${isRowHovered ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                  {slice.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono tabular-nums shrink-0">
                <span className={`font-semibold ${isRowHovered ? 'text-slate-950 font-bold' : 'text-slate-900'}`}>
                  {slice.formatted ?? slice.value}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">({share}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      {data.footerNote && (
        <div className="border-t border-slate-100/90 pt-2 text-[10px] text-slate-400 font-medium leading-relaxed">
          {data.footerNote}
        </div>
      )}
    </div>
  );
}

function StatStrip({
  items,
  building = 'all',
}: {
  items: Array<{ label: string; value: string; sub?: string; tone?: Tone }>;
  building?: ElenorBuilding;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const lgCols = items.length === 4 ? 'lg:grid-cols-4 sm:grid-cols-4' : 'lg:grid-cols-6 sm:grid-cols-3';

  return (
    <div className={`relative z-20 grid grid-cols-2 ${lgCols} gap-px rounded-2xl border border-slate-200/80 bg-slate-200/60 p-[1px] shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)]`}>
      {items.map((it, idx) => {
        const isHovered = hoveredIdx === idx;
        const donutData = getKpiDonutData(it.label, building, it.value);
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;
        const alignClass = isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2 -translate-x-1/2';
        const cornerRounding =
          isFirst
            ? 'rounded-tl-2xl rounded-bl-2xl sm:rounded-bl-2xl'
            : isLast
            ? 'rounded-tr-2xl rounded-br-2xl sm:rounded-tr-2xl sm:rounded-br-2xl'
            : '';

        return (
          <div
            key={it.label}
            tabIndex={0}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onFocus={() => setHoveredIdx(idx)}
            onBlur={() => setHoveredIdx(null)}
            className={`group relative bg-white/95 px-4 py-3.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${cornerRounding} ${
              isHovered ? 'bg-slate-50/90 shadow-2xs z-30' : 'hover:bg-slate-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {it.label}
              </p>
              {donutData && (
                <span
                  title="Hover to view breakdown donut chart"
                  className="rounded-full bg-slate-100/80 p-1 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </span>
              )}
            </div>

            <p className="mt-1 flex items-center gap-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900 tracking-tight">
              {it.tone && <Dot color={TONE[it.tone]} />}
              {it.value}
            </p>
            {it.sub && <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">{it.sub}</p>}

            {/* Hover Donut Popover - Apple Glass frosted popover */}
            {isHovered && donutData && (
              <div
                className={`absolute top-full mt-2.5 ${alignClass} z-50 w-76 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] animate-in fade-in zoom-in-95`}
                role="tooltip"
              >
                {/* Invisible hover bridge to prevent mouse leaving flicker */}
                <div className="absolute -top-3.5 left-0 right-0 h-3.5" />
                <KpiDonutPopover kpiLabel={it.label} building={building} currentValue={it.value} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Bullet: actual fill with a planned tick, on a 0–max track. */
function Bullet({ actual, planned, max }: { actual: number; planned: number; max: number }) {
  return (
    <div className="relative h-2 rounded-full bg-slate-100" role="img" aria-label={`Actual ${actual}%, planned ${planned}%`}>
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${Math.min(100, (actual / max) * 100)}%`, backgroundColor: C.actual }}
      />
      <div
        className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-slate-500"
        style={{ left: `${Math.min(100, (planned / max) * 100)}%` }}
      />
    </div>
  );
}

/* ================================== Shared charts ================================== */

function MonthTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  label?: unknown;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as (typeof D.monthwise)[number];
  return (
    <div style={TIP} className="bg-white px-3 py-2">
      <p className="text-xs font-semibold text-slate-900 mb-1">{String(label)}</p>
      <p className="text-xs text-slate-600 font-mono tabular-nums">Planned {row.planned.toFixed(2)}%</p>
      <p className="text-xs text-slate-900 font-mono tabular-nums font-semibold">Actual {row.actual.toFixed(2)}%</p>
      <p className="text-xs text-slate-600 font-mono tabular-nums">Efficiency {row.efficiency}%</p>
    </div>
  );
}

function lastLabel(lastIndex: number, suffix = '%') {
  return (props: { x?: number | string; y?: number | string; index?: number; value?: unknown }) => {
    if (props.index !== lastIndex || props.x === undefined || props.y === undefined) return null;
    return (
      <text x={Number(props.x) + 8} y={Number(props.y) + 4} fontSize={11} fontWeight={600} fill="#0F172A">
        {Number(props.value).toFixed(2)}
        {suffix}
      </text>
    );
  };
}

function ProjectMonthlyChart() {
  const [chartView, setChartView] = useState<'progress' | 'scurve' | 'spend'>('progress');
  const last = D.monthwise.length - 1;
  const fy = D.statusSummary[1];
  const baselineCr = 371.22;

  // Compute cumulative Earned Value S-curve dataset
  const sCurveData = D.monthwise.reduce((acc, m, i) => {
    const plannedSpend = Number(((m.planned / 100) * baselineCr).toFixed(2));
    const actualSpend = Number(((m.actual / 100) * baselineCr).toFixed(2));
    const prevCumPlanned = i > 0 ? acc[i - 1].cumPlanned : 0;
    const prevCumActual = i > 0 ? acc[i - 1].cumActual : 0;
    const prevCumPlannedPct = i > 0 ? acc[i - 1].cumPlannedPct : 0;
    const prevCumActualPct = i > 0 ? acc[i - 1].cumActualPct : 0;
    acc.push({
      month: m.month,
      plannedPct: m.planned,
      actualPct: m.actual,
      efficiency: m.efficiency,
      plannedSpend,
      actualSpend,
      cumPlanned: Number((prevCumPlanned + plannedSpend).toFixed(2)),
      cumActual: Number((prevCumActual + actualSpend).toFixed(2)),
      cumPlannedPct: Number((prevCumPlannedPct + m.planned).toFixed(2)),
      cumActualPct: Number((prevCumActualPct + m.actual).toFixed(2)),
    });
    return acc;
  }, [] as Array<{
    month: string;
    plannedPct: number;
    actualPct: number;
    efficiency: number;
    plannedSpend: number;
    actualSpend: number;
    cumPlanned: number;
    cumActual: number;
    cumPlannedPct: number;
    cumActualPct: number;
  }>);

  return (
    <Card
      title={
        chartView === 'scurve'
          ? 'Earned Value S-Curve'
          : chartView === 'spend'
          ? 'Monthly Spend'
          : 'Monthly Progress'
      }
      hint={
        chartView === 'scurve'
          ? 'Cumulative planned vs actual spend · ₹ Crore'
          : chartView === 'spend'
          ? 'FY 2026-27 monthly spend · ₹ Crore'
          : 'FY 2026-27 · % of project'
      }
      action={
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 text-xs font-medium backdrop-blur-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setChartView('progress')}
              className={`rounded-lg px-3 py-1.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
                chartView === 'progress'
                  ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Progress %
            </button>
            <button
              type="button"
              onClick={() => setChartView('scurve')}
              className={`rounded-lg px-3 py-1.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
                chartView === 'scurve'
                  ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              S-Curve (₹ Cr)
            </button>
            <button
              type="button"
              onClick={() => setChartView('spend')}
              className={`rounded-lg px-3 py-1.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
                chartView === 'spend'
                  ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Spend (₹ Cr)
            </button>
          </div>
          <div className="hidden sm:flex gap-3">
            <Swatch color={C.actual} label="Actual" />
            <Swatch color={C.plan} label="Planned" dashed />
          </div>
        </div>
      }
    >
      {chartView === 'progress' && (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={D.monthwise} margin={{ top: 8, right: 52, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} />
                <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} domain={[0, 1.6]} tickLine={false} axisLine={false} />
                <Tooltip content={MonthTooltip} cursor={{ stroke: '#94A3B8', strokeDasharray: '3 3' }} />
                <Line
                  isAnimationActive={false}
                  dataKey="planned"
                  name="Planned"
                  stroke={C.plan}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                  label={lastLabel(last)}
                />
                <Line
                  isAnimationActive={false}
                  dataKey="actual"
                  name="Actual"
                  stroke={C.actual}
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: C.actual, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  label={lastLabel(last)}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Efficiency strip — same horizontal frame as the chart above so months line up. */}
          <div className="flex items-center border-t border-slate-100 pt-1">
            <span className="w-0 shrink-0 overflow-visible whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Effi.
            </span>
            <div className="h-12 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={D.monthwise} margin={{ top: 16, right: 52, left: -16, bottom: 0 }}>
                  <XAxis dataKey="month" hide />
                  <YAxis domain={[0, 100]} tick={false} tickLine={false} axisLine={false} />
                  <Line
                    isAnimationActive={false}
                    dataKey="efficiency"
                    stroke={C.context}
                    strokeWidth={1.5}
                    dot={(p: { cx?: number; cy?: number; payload?: { efficiency: number }; index?: number }) => (
                      <circle key={p.index} cx={p.cx} cy={p.cy} r={3} fill={TONE[effTone(p.payload?.efficiency ?? null)]} stroke="#fff" strokeWidth={1.5} />
                    )}
                  >
                    <LabelList dataKey="efficiency" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
                  </Line>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {chartView === 'scurve' && (
        <div className="h-76">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sCurveData} margin={{ top: 12, right: 52, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="scurveActualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.actual} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.actual} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} />
              <YAxis tick={AXIS_TICK} tickFormatter={(v) => `₹${v} Cr`} domain={[0, 30]} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as (typeof sCurveData)[number];
                  return (
                    <div style={TIP}>
                      <div className="font-semibold text-slate-900">{d.month} · Cumulative Earned Value</div>
                      <div className="mt-1.5 space-y-1 text-xs">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Planned Value (PV):</span>
                          <span className="font-mono font-semibold text-slate-800">₹{d.cumPlanned} Cr ({d.cumPlannedPct}%)</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Earned Value (EV):</span>
                          <span className="font-mono font-semibold text-sky-700">₹{d.cumActual} Cr ({d.cumActualPct}%)</span>
                        </div>
                        <div className="flex justify-between gap-4 border-t border-slate-100 pt-1 text-amber-700">
                          <span>Schedule Variance:</span>
                          <span className="font-mono font-semibold">-₹{(d.cumPlanned - d.cumActual).toFixed(2)} Cr</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                isAnimationActive={false}
                type="monotone"
                dataKey="cumActual"
                name="Actual Spend"
                stroke={C.actual}
                strokeWidth={2.5}
                fill="url(#scurveActualGrad)"
                dot={{ r: 3.5, fill: C.actual, stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
              <Line
                isAnimationActive={false}
                type="monotone"
                dataKey="cumPlanned"
                name="Planned Spend"
                stroke={C.plan}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartView === 'spend' && (
        <div className="h-76">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sCurveData} margin={{ top: 12, right: 30, left: -8, bottom: 0 }} barCategoryGap="25%">
              <CartesianGrid stroke={C.grid} vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} />
              <YAxis tick={AXIS_TICK} tickFormatter={(v) => `₹${v} Cr`} domain={[0, 6]} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as (typeof sCurveData)[number];
                  return (
                    <div style={TIP}>
                      <div className="font-semibold text-slate-900">{d.month} · Monthly Expenditure</div>
                      <div className="mt-1.5 space-y-1 text-xs">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Planned Cost:</span>
                          <span className="font-mono font-semibold text-slate-800">₹{d.plannedSpend} Cr</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-500">Actual Cost:</span>
                          <span className="font-mono font-semibold text-sky-700">₹{d.actualSpend} Cr</span>
                        </div>
                        <div className="flex justify-between gap-4 border-t border-slate-100 pt-1 text-slate-600">
                          <span>Monthly Efficiency:</span>
                          <span className="font-mono font-semibold">{d.efficiency}%</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar isAnimationActive={false} dataKey="plannedSpend" name="Planned" fill={C.context} radius={[3, 3, 0, 0]} />
              <Bar isAnimationActive={false} dataKey="actualSpend" name="Actual" fill={C.actual} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-600">
        FY to Oct · actual <span className="font-mono font-semibold text-slate-900">{fy.actualPct}</span> ({fy.actualCost}) vs plan{' '}
        <span className="font-mono font-semibold text-slate-900">{fy.plannedPct}</span> ({fy.plannedCost}) · cumulative variance{' '}
        <span className="font-mono font-semibold text-amber-800">-₹11.77 Cr</span>
      </p>
    </Card>
  );
}

function BuildingMonthlyChart({ b }: { b: Bldg }) {
  const info = bldgInfo(b);
  const data = D.buildingWiseMonthly.map((m) => ({ month: m.month, v: m[info.monthKey] }));
  const last = data.length - 1;
  return (
    <Card title="Monthly progress" hint={`% of ${info.label} · FY spend ₹${info.fyCost} Cr`}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 4, left: -18, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} />
            <YAxis tick={AXIS_TICK} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Actual']} contentStyle={TIP} cursor={{ fill: '#F1F5F9' }} />
            <Bar isAnimationActive={false} dataKey="v" fill={C.actual} radius={[4, 4, 0, 0]} maxBarSize={26}>
              <LabelList
                dataKey="v"
                position="top"
                content={(p) =>
                  p.index === last ? (
                    <text x={Number(p.x) + Number(p.width) / 2} y={Number(p.y) - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill="#0F172A">
                      {Number(p.value).toFixed(2)}%
                    </text>
                  ) : null
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ================================== Project overview ================================== */

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Months since project start (Dec 2024 = 0) for labels like "JUNE 2025". */
function monthOffset(label: string): number {
  const [m, y] = label.trim().split(/\s+/);
  return (Number(y) - 2024) * 12 + MONTH_NAMES.indexOf(m.slice(0, 3).toUpperCase()) - 11;
}

/** One bar for the whole schedule: time elapsed, planned and actual work on the same 0–100% scale. */
function ScheduleBar() {
  const { timeline, uptoDateStatus } = D;
  const total = uptoDateStatus[0];
  const T = timeline.totalMonths;
  const timePct = (timeline.elapsedMonths / T) * 100;
  const plan = num(total.plannedPct);
  const act = num(total.actualPct);
  const pos = (offset: number) => `${Math.max(0, Math.min(100, (offset / T) * 100))}%`;
  const years = [2026, 2027, 2028, 2029].map((y) => ({ y, off: (y - 2024) * 12 - 11 }));
  const milestones = timeline.milestones.map((m) => ({ ...m, off: monthOffset(m.date) + 0.5 }));
  const [hover, setHover] = useState<number | null>(null);
  const shown = milestones[hover ?? milestones.length - 1];
  const stripes = 'repeating-linear-gradient(135deg, #E2E8F0 0 6px, #F8FAFC 6px 12px)';

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-sm font-semibold text-slate-900">Schedule</h3>
          <span className="text-xs text-slate-500">
            {shortMonth(timeline.start)} → {shortMonth(timeline.finish)} · {T - timeline.elapsedMonths} months left
          </span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: `linear-gradient(90deg, #6aa6ea, ${C.actual})` }} />
            Actual <span className="font-mono font-semibold text-slate-900">{total.actualPct}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: C.plan }} />
            Planned <span className="font-mono font-semibold text-slate-900">{total.plannedPct}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm border border-slate-200" style={{ background: stripes }} />
            Time <span className="font-mono font-semibold text-slate-900">{Math.round(timePct)}%</span>
          </span>
        </div>
      </div>

      <div className="relative mt-3 pt-6">
        {/* Today pin */}
        <div className="pointer-events-none absolute top-0 z-10 flex h-[46px] -translate-x-1/2 flex-col items-center" style={{ left: `${timePct}%` }}>
          <span className="whitespace-nowrap rounded bg-[#0F1E36] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
            {shortMonth(timeline.current)}
          </span>
          <span className="w-px flex-1 bg-[#0F1E36]" />
        </div>

        <div
          className="relative h-5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200"
          role="img"
          aria-label={`Time elapsed ${Math.round(timePct)}%, planned ${total.plannedPct}, actual ${total.actualPct}`}
        >
          <div className="absolute inset-y-0 left-0" style={{ width: `${timePct}%`, background: stripes }} />
          <div className="absolute inset-y-0 left-0 rounded-r-full" style={{ width: `${plan}%`, backgroundColor: C.plan }} />
          <div
            className="absolute inset-y-0 left-0 rounded-r-full shadow-[2px_0_0_0_#fff]"
            style={{ width: `${act}%`, background: `linear-gradient(90deg, #6aa6ea, ${C.actual})` }}
          />
        </div>

        {/* Milestones */}
        <div className="relative mt-1.5 h-4">
          {milestones.map((m, i) => (
            <button
              key={m.date + m.event}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${m.date}: ${m.event}`}
              className="absolute top-0 flex h-4 w-4 -translate-x-1/2 items-center justify-center"
              style={{ left: pos(m.off) }}
            >
              <span className={`block h-2 w-2 rotate-45 ${hover === i ? 'bg-[#0F1E36]' : 'bg-slate-500'}`} />
            </button>
          ))}
        </div>

        {/* Axis */}
        <div className="relative h-4 font-mono text-[10px] text-slate-400">
          <span className="absolute left-0">{shortMonth(timeline.start)}</span>
          {years.map((y) => (
            <span key={y.y} className="absolute hidden -translate-x-1/2 sm:inline" style={{ left: pos(y.off) }}>
              {y.y}
            </span>
          ))}
          <span className="absolute right-0">{shortMonth(timeline.finish)}</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-600">
        <span className="mr-1.5 inline-block h-2 w-2 rotate-45 bg-slate-500" />
        <span className="font-mono text-slate-500">{shortMonth(shown.date)}</span> · {shown.event}
        {hover === null && <span className="text-slate-400"> · latest of {milestones.length} milestones</span>}
      </p>
    </section>
  );
}

/** Spend vs plan per building (₹ Cr, upto date). */
function SpendByBuildingChart() {
  const data = BLDGS.map((b) => {
    const u = bldgInfo(b).upto;
    return { name: b === 'Development' ? 'Dev.' : `${b} Bldg.`, planned: num(u.plannedCost), actual: num(u.actualCost), budget: u.totalCost };
  });
  const cr = (v: unknown) => Number(v ?? 0).toFixed(2);
  return (
    <Card
      title="Spend vs plan"
      hint="₹ Cr · upto date"
      action={
        <div className="flex gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: C.plan }} /> Planned
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: C.actual }} /> Actual
          </span>
        </div>
      }
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 4, left: -18, bottom: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{ stroke: C.grid }}
              height={36}
              tick={(p: { x?: number | string; y?: number | string; payload?: { value?: unknown } }) => {
                const row = data.find((d) => d.name === p.payload?.value);
                return (
                  <g transform={`translate(${p.x},${p.y})`}>
                    <text dy={12} textAnchor="middle" fontSize={11} fill="#475569">
                      {String(p.payload?.value)}
                    </text>
                    <text dy={26} textAnchor="middle" fontSize={10} fill="#94A3B8">
                      of ₹{row?.budget}
                    </text>
                  </g>
                );
              }}
            />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v, n) => [`₹${cr(v)} Cr`, n]} contentStyle={TIP} cursor={{ fill: '#F1F5F9' }} />
            <Bar isAnimationActive={false} dataKey="planned" name="Planned" fill={C.plan} radius={[4, 4, 0, 0]} maxBarSize={28}>
              <LabelList dataKey="planned" position="top" formatter={cr} style={{ fontSize: 10, fill: '#64748B' }} />
            </Bar>
            <Bar isAnimationActive={false} dataKey="actual" name="Actual" fill={C.actual} radius={[4, 4, 0, 0]} maxBarSize={28}>
              <LabelList dataKey="actual" position="top" formatter={cr} style={{ fontSize: 10, fill: '#0F172A', fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function BuildingCard({ b, onSelect }: { b: Bldg; onSelect: (b: Bldg) => void }) {
  const info = bldgInfo(b);
  const t = targetCounts(info.targets);
  const spark = D.buildingWiseMonthly.map((m) => ({ month: m.month, v: m[info.monthKey] }));
  return (
    <button
      type="button"
      onClick={() => onSelect(b)}
      className="group flex flex-col justify-start text-left rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.99] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-sm font-semibold text-slate-900">{info.label}</p>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
          ₹{info.upto.totalCost} Cr
          <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-900" />
        </span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900">{info.upto.actualPct}</span>
        <span className="text-xs text-slate-500 font-mono">plan {info.upto.plannedPct}</span>
        <span className="ml-auto">
          <Effi value={info.upto.efficiency} />
        </span>
      </div>
      <div className="mt-2.5">
        <Bullet actual={num(info.upto.actualPct)} planned={num(info.upto.plannedPct)} max={20} />
      </div>
      <div className="mt-4 h-12 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(2)}%`, 'Actual']}
              contentStyle={TIP}
              cursor={{ stroke: '#94A3B8', strokeDasharray: '3 3' }}
            />
            <XAxis dataKey="month" hide />
            <Area
              isAnimationActive={false}
              dataKey="v"
              stroke={C.actual}
              strokeWidth={2}
              fill={C.actual}
              fillOpacity={0.08}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-slate-400">Monthly actual · Apr–Oct 26</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <span>
          Spent <span className="font-mono font-semibold text-slate-900">₹{info.upto.actualCost}</span> of ₹{info.upto.plannedCost} Cr plan
        </span>
        <span>
          FY <span className="font-mono font-semibold text-slate-900">₹{info.fyCost} Cr</span>
        </span>
        <span className="inline-flex items-center gap-1.5" title={`October targets: ${t.met} achieved, ${t.partly} partly done, ${t.failed} failed`}>
          Oct targets
          {([['good', t.met], ['part', t.partly], ['bad', t.failed]] as const).map(([tone, n]) => (
            <span key={tone} className="inline-flex items-center gap-0.5 font-mono font-semibold text-slate-900">
              <ToneIcon tone={tone} className="h-3.5 w-3.5" />
              {n}
            </span>
          ))}
        </span>
        {info.cast && (
          <span>
            Aluform <span className="font-mono font-semibold text-slate-900">{info.floorsCast}/{D.aluformCasting.totalFloors}</span> floors
          </span>
        )}
      </div>
    </button>
  );
}

function RiskDrawer({ onClose }: { onClose: () => void }) {
  const [severityFilter, setSeverityFilter] = useState<'All' | ElenorRiskSeverity>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const allRisks = computeElenorRisks();

  const categories = ['All', ...Array.from(new Set(allRisks.map((r) => r.category)))];
  const highCount = allRisks.filter((r) => r.severity === 'High').length;
  const medCount = allRisks.filter((r) => r.severity === 'Medium').length;
  const lowCount = allRisks.filter((r) => r.severity === 'Low').length;

  const filtered = allRisks.filter((r) => {
    if (severityFilter !== 'All' && r.severity !== severityFilter) return false;
    if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.scope.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.suggestedNextStep.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-md transition-opacity duration-300 animate-in fade-in">
      <div className="relative flex h-full w-full max-w-2xl flex-col bg-white/95 backdrop-blur-xl border-l border-slate-200/80 shadow-[0_0_50px_rgba(0,0,0,0.15)] sm:rounded-l-3xl overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4.5 bg-white/80 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">Risk Register</h2>
              <span className="rounded-full bg-slate-100/90 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200/60">
                {allRisks.length} Total
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Derived strictly from PLN/407 figures & Highrise ERP statuses</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 bg-slate-100/80 hover:bg-slate-200/80 hover:text-slate-700 active:scale-95 transition-all duration-150"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="border-b border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
          {/* Severity Counters */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSeverityFilter('All')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
                severityFilter === 'All'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100/80'
              }`}
            >
              All ({allRisks.length})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('High')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
                severityFilter === 'High'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white border border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              High ({highCount})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('Medium')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
                severityFilter === 'Medium'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-50'
              }`}
            >
              Medium ({medCount})
            </button>
            <button
              type="button"
              onClick={() => setSeverityFilter('Low')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
                severityFilter === 'Low'
                  ? 'bg-slate-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200/90 text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              Low ({lowCount})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search risks, trades, or scopes..."
                className="w-full rounded-xl border border-slate-200/90 bg-white/90 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all shadow-2xs"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none transition-all shadow-2xs"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Risk Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
              No risks found matching the selected filters.
            </div>
          ) : (
            filtered.map((r) => {
              const sevBadge =
                r.severity === 'High'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : r.severity === 'Medium'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';
              return (
                <div key={r.id} className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:shadow-xs transition-all duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${sevBadge}`}>
                        {r.severity}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {r.category}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">{r.scope}</span>
                  </div>
                  <h4 className="mt-2 text-sm font-semibold tracking-tight text-slate-900">{r.title}</h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{r.reason}</p>
                  <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Next Step: </span>
                    {r.suggestedNextStep}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function AttentionCard() {
  const [openDrawer, setOpenDrawer] = useState(false);
  const all = BLDGS.flatMap((b) => D.targetVsActual[b]);
  const t = targetCounts(all);
  const deliveries = D.bulkPurchasing.rows.flatMap((r) =>
    (['a', 'b'] as const).filter((s) => r[s]?.delivery === 'Not Done').map((s) => `${r.item} ${s.toUpperCase()}`)
  );
  const labour = D.contractorDeployment.rows.flatMap((r) =>
    (['a', 'b'] as const).filter((s) => r[s]?.labour === 'Not Given').map((s) => `${r.contractor} ${s.toUpperCase()}`)
  );
  const risks = computeElenorRisks();
  const items: Array<{ value: string; label: string; sub: string; tone: Tone }> = [
    { value: `${t.failed}/${t.total}`, label: 'Oct targets missed', sub: `${t.met} met · ${t.partly} partly`, tone: 'bad' },
    {
      value: D.taskClosing.openTaskCount.replace(' Nos.', ''),
      label: 'Open Highrise tasks',
      sub: `₹${D.taskClosing.openTaskAmount} · ${D.taskClosing.closedInMonth.replace(' Nos', '')} closed in Oct`,
      tone: 'part',
    },
    { value: String(deliveries.length), label: 'Deliveries pending', sub: deliveries.join(' · '), tone: 'bad' },
    { value: String(labour.length), label: 'Labour not given', sub: labour.join(' · '), tone: 'bad' },
    {
      value: `${D.aluformCasting.strike.days} d`,
      label: 'Lost to RMC strike',
      sub: `${D.aluformCasting.strike.from.slice(0, 5)} – ${D.aluformCasting.strike.to.slice(0, 5)}`,
      tone: 'part',
    },
    {
      value: String(risks.filter((r) => r.severity === 'High').length),
      label: 'High risks',
      sub: `${risks.length} in register · ${risks.filter((r) => r.severity === 'Medium').length} medium`,
      tone: 'bad',
    },
  ];
  return (
    <>
      <Card
        title="Needs attention"
        action={
          <button
            type="button"
            onClick={() => setOpenDrawer(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 active:scale-[0.97] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-xs cursor-pointer"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
            <span>View All 37 Risks</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-5">
          {items.map((it) => (
            <div key={it.label} className="min-w-0">
              <p className="flex items-center gap-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900">
                <ToneIcon tone={it.tone} />
                {it.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-700">{it.label}</p>
              <p className="text-[11px] text-slate-500 truncate" title={it.sub}>
                {it.sub}
              </p>
            </div>
          ))}
        </div>
      </Card>
      {openDrawer && <RiskDrawer onClose={() => setOpenDrawer(false)} />}
    </>
  );
}

type PipelineStageKey = 'active' | 'mobilising' | 'action' | 'future';

function getContractorStage(
  trade: { planned: string; wo: string; labour: string; woStatus: string } | null
): PipelineStageKey {
  if (!trade) return 'future';
  if (trade.labour === 'Not Given' || trade.woStatus === '-') return 'action';
  if (trade.labour === 'Given' && trade.woStatus === 'Completed') return 'active';
  return 'mobilising';
}

function getMaterialStage(
  mat: { planned: string; reqDate: string; reqStatus: string; poStatus: string; delivery: string } | null
): PipelineStageKey {
  if (!mat) return 'future';
  if (mat.delivery === 'Not Done' || mat.reqStatus === 'Not Given') return 'action';
  if (mat.delivery === 'Done') return 'active';
  return 'mobilising';
}

function StagePill({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'good' | 'part' | 'bad' | 'none';
}) {
  const styles = {
    good: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
    part: 'bg-amber-50 text-amber-800 border-amber-200/60',
    bad: 'bg-rose-50 text-rose-800 border-rose-200/60',
    none: 'bg-slate-50 text-slate-400 border-slate-200/60',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${styles[status]}`}
      title={`${label}: ${value}`}
    >
      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-normal">{label}:</span>
      <span className="font-semibold truncate max-w-[85px]">{value}</span>
    </span>
  );
}

function getStatusTone(val: string): 'good' | 'part' | 'bad' | 'none' {
  if (!val || val === '-' || val === 'Not scheduled') return 'none';
  const lower = val.toLowerCase();
  if (lower === 'not given' || lower === 'not done' || lower.includes('fail')) return 'bad';
  if (lower.includes('part') || lower.includes('sample')) return 'part';
  if (lower === 'given' || lower === 'completed' || lower === 'done') return 'good';
  return 'none';
}

function CrossWingProcurementMatrix() {
  const [tab, setTab] = useState<'contractors' | 'materials'>('contractors');
  const [filterStage, setFilterStage] = useState<'all' | PipelineStageKey>('all');
  const [search, setSearch] = useState('');

  // Calculate funnel counts for contractors
  const contractorCounts = useMemo(() => {
    let active = 0;
    let mobilising = 0;
    let action = 0;
    let future = 0;

    D.contractorDeployment.rows.forEach((r) => {
      const stageA = getContractorStage(r.a);
      const stageB = getContractorStage(r.b);

      if (stageA === 'action' || stageB === 'action') {
        action++;
      } else if (stageA === 'active' && stageB === 'active') {
        active++;
      } else if (stageA === 'mobilising' || stageB === 'mobilising') {
        mobilising++;
      } else {
        future++;
      }
    });

    return { active, mobilising, action, future };
  }, []);

  // Calculate funnel counts for materials
  const materialCounts = useMemo(() => {
    let active = 0;
    let mobilising = 0;
    let action = 0;
    let future = 0;

    D.bulkPurchasing.rows.forEach((r) => {
      const stageA = getMaterialStage(r.a);
      const stageB = getMaterialStage(r.b);

      if (stageA === 'action' || stageB === 'action') {
        action++;
      } else if (stageA === 'active' && stageB === 'active') {
        active++;
      } else if (stageA === 'mobilising' || stageB === 'mobilising') {
        mobilising++;
      } else {
        future++;
      }
    });

    return { active, mobilising, action, future };
  }, []);

  const counts = tab === 'contractors' ? contractorCounts : materialCounts;

  // Filtered contractor rows
  const filteredContractors = useMemo(() => {
    return D.contractorDeployment.rows.filter((r) => {
      const stageA = getContractorStage(r.a);
      const stageB = getContractorStage(r.b);
      const combinedStage: PipelineStageKey =
        stageA === 'action' || stageB === 'action'
          ? 'action'
          : stageA === 'active' && stageB === 'active'
          ? 'active'
          : stageA === 'mobilising' || stageB === 'mobilising'
          ? 'mobilising'
          : 'future';

      if (filterStage !== 'all' && combinedStage !== filterStage) return false;
      if (search.trim() && !r.contractor.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filterStage, search]);

  // Filtered material rows
  const filteredMaterials = useMemo(() => {
    return D.bulkPurchasing.rows.filter((r) => {
      const stageA = getMaterialStage(r.a);
      const stageB = getMaterialStage(r.b);
      const combinedStage: PipelineStageKey =
        stageA === 'action' || stageB === 'action'
          ? 'action'
          : stageA === 'active' && stageB === 'active'
          ? 'active'
          : stageA === 'mobilising' || stageB === 'mobilising'
          ? 'mobilising'
          : 'future';

      if (filterStage !== 'all' && combinedStage !== filterStage) return false;
      if (search.trim() && !r.item.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filterStage, search]);

  return (
    <Card
      title="Supply & Contractors · Cross-Wing Readiness Heatmap"
      hint="Procurement pipeline & contractor deployment across Wing A and Wing B · PLN/409 & PLN/410"
      action={
        <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 text-xs font-medium backdrop-blur-xs shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setTab('contractors');
              setFilterStage('all');
            }}
            className={`rounded-lg px-3 py-1.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
              tab === 'contractors'
                ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Contractor Deployment (PLN/410)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('materials');
              setFilterStage('all');
            }}
            className={`rounded-lg px-3 py-1.5 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
              tab === 'materials'
                ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Bulk Materials (PLN/409)
          </button>
        </div>
      }
    >
      {/* 4 Pipeline Funnel Cards - Restrained, executive-grade palette */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
        <button
          type="button"
          onClick={() => setFilterStage(filterStage === 'active' ? 'all' : 'active')}
          className={`rounded-xl border p-2.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
            filterStage === 'active'
              ? 'border-emerald-600/80 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Active on Site</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-1 text-lg font-bold font-mono text-slate-900">{counts.active} Trades</div>
          <div className="text-[10px] text-slate-500">Fully deployed & WO done</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage(filterStage === 'mobilising' ? 'all' : 'mobilising')}
          className={`rounded-xl border p-2.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
            filterStage === 'mobilising'
              ? 'border-amber-600/80 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">In Progress / Transit</span>
            <span className="h-2 w-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-1 text-lg font-bold font-mono text-slate-900">{counts.mobilising} Trades</div>
          <div className="text-[10px] text-slate-500">Part given / Part done</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage(filterStage === 'action' ? 'all' : 'action')}
          className={`rounded-xl border p-2.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
            filterStage === 'action'
              ? 'border-rose-600/80 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-xs'
              : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Action Needed</span>
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          </div>
          <div className="mt-1 text-lg font-bold font-mono text-rose-700">{counts.action} Trades</div>
          <div className="text-[10px] text-slate-500">Requisition / PO overdue</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage(filterStage === 'future' ? 'all' : 'future')}
          className={`rounded-xl border p-2.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
            filterStage === 'future'
              ? 'border-slate-700 bg-slate-100 ring-2 ring-slate-400/20 shadow-xs'
              : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Scheduled Future</span>
            <span className="h-2 w-2 rounded-full bg-slate-400" />
          </div>
          <div className="mt-1 text-lg font-bold font-mono text-slate-900">{counts.future} Trades</div>
          <div className="text-[10px] text-slate-500">Subsequent project phases</div>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {filterStage !== 'all' && (
            <button
              type="button"
              onClick={() => setFilterStage('all')}
              className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              Showing {filterStage} filter <X className="h-3 w-3" />
            </button>
          )}
          <span className="text-slate-500">
            Showing {tab === 'contractors' ? filteredContractors.length : filteredMaterials.length} of{' '}
            {tab === 'contractors' ? D.contractorDeployment.rows.length : D.bulkPurchasing.rows.length} items
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${tab === 'contractors' ? 'contractor' : 'material'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {tab === 'contractors' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                <th className="px-3 py-2.5">Trade / Contractor</th>
                <th className="px-2 py-2.5 text-right">Notice</th>
                <th className="border-l border-slate-200 px-3 py-2.5 bg-sky-50/40 text-slate-700">
                  Wing A Pipeline (Req → WO → Site)
                </th>
                <th className="border-l border-slate-200 px-3 py-2.5 bg-indigo-50/40 text-slate-700">
                  Wing B Pipeline (Req → WO → Site)
                </th>
                <th className="border-l border-slate-200 px-3 py-2.5">Alignment / Action Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContractors.map((r) => {
                const a = r.a;
                const b = r.b;
                const stageA = getContractorStage(a);
                const stageB = getContractorStage(b);
                const isDiscrepancy = a?.labour !== b?.labour || a?.woStatus !== b?.woStatus;

                let actionBadge = null;
                if (!a && !b) {
                  actionBadge = (
                    <span className="inline-flex items-center rounded border border-slate-200/60 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                      Scheduled Q4+
                    </span>
                  );
                } else if (b?.labour === 'Not Given' && a?.labour !== 'Not Given') {
                  actionBadge = (
                    <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                      ⚠️ Wing B labour req missing!
                    </span>
                  );
                } else if (a?.labour === 'Not Given' && b?.labour === 'Not Given') {
                  actionBadge = (
                    <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                      ⚠️ Both wings missing labour req!
                    </span>
                  );
                } else if (stageA === 'active' && stageB === 'active') {
                  actionBadge = (
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800">
                      ✓ Synchronized & active
                    </span>
                  );
                } else if (isDiscrepancy) {
                  actionBadge = (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      Sync discrepancy
                    </span>
                  );
                } else {
                  actionBadge = (
                    <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                      In progress
                    </span>
                  );
                }

                return (
                  <tr key={r.sr} className={`hover:bg-slate-50/80 ${isDiscrepancy ? 'bg-amber-50/15' : ''}`}>
                    <td className="px-3 py-2.5 font-medium text-slate-900">
                      {r.contractor}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono text-slate-500">
                      {r.processing}d
                    </td>

                    {/* Wing A Pipeline */}
                    <td className="border-l border-slate-100 px-3 py-2.5">
                      {a ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StagePill label="Req" value={a.labour} status={getStatusTone(a.labour)} />
                          <span className="text-slate-300">→</span>
                          <StagePill label="WO" value={a.woStatus} status={getStatusTone(a.woStatus)} />
                          <span className="text-slate-300">→</span>
                          <span className="font-mono text-[10px] text-slate-500">WO {a.wo}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">— Not scheduled</span>
                      )}
                    </td>

                    {/* Wing B Pipeline */}
                    <td className="border-l border-slate-100 px-3 py-2.5">
                      {b ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StagePill label="Req" value={b.labour} status={getStatusTone(b.labour)} />
                          <span className="text-slate-300">→</span>
                          <StagePill label="WO" value={b.woStatus} status={getStatusTone(b.woStatus)} />
                          <span className="text-slate-300">→</span>
                          <span className="font-mono text-[10px] text-slate-500">WO {b.wo}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">— Not scheduled</span>
                      )}
                    </td>

                    {/* Alignment / Action */}
                    <td className="border-l border-slate-100 px-3 py-2.5">
                      {actionBadge}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase text-slate-500">
                <th className="px-3 py-2.5">Material / Item</th>
                <th className="px-2 py-2.5 text-right">Lead</th>
                <th className="px-2 py-2.5 text-right">Proc.</th>
                <th className="border-l border-slate-200 px-3 py-2.5 bg-sky-50/40 text-slate-700">
                  Wing A Pipeline (Req → PO → Delivery)
                </th>
                <th className="border-l border-slate-200 px-3 py-2.5 bg-indigo-50/40 text-slate-700">
                  Wing B Pipeline (Req → PO → Delivery)
                </th>
                <th className="border-l border-slate-200 px-3 py-2.5">Readiness / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((r) => {
                const a = r.a;
                const b = r.b;
                const isDiscrepancy = a?.delivery !== b?.delivery;

                let actionBadge = null;
                if (!a && !b) {
                  actionBadge = (
                    <span className="inline-flex items-center rounded border border-slate-200/60 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500">
                      Scheduled Q4+
                    </span>
                  );
                } else if (a?.delivery === 'Not Done' || b?.delivery === 'Not Done') {
                  actionBadge = (
                    <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                      ⚠️ Delivery pending
                    </span>
                  );
                } else {
                  actionBadge = (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      In transit / partial
                    </span>
                  );
                }

                return (
                  <tr key={r.sr} className={`hover:bg-slate-50/80 ${isDiscrepancy ? 'bg-amber-50/15' : ''}`}>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{r.item}</td>
                    <td className="px-2 py-2.5 text-right font-mono text-slate-500">{r.leadTime}d</td>
                    <td className="px-2 py-2.5 text-right font-mono text-slate-500">{r.poProcessing}d</td>

                    {/* Wing A Pipeline */}
                    <td className="border-l border-slate-100 px-3 py-2.5">
                      {a ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StagePill label="Req" value={a.reqStatus} status={getStatusTone(a.reqStatus)} />
                          <span className="text-slate-300">→</span>
                          <StagePill label="PO" value={a.poStatus} status={getStatusTone(a.poStatus)} />
                          <span className="text-slate-300">→</span>
                          <StagePill label="Del" value={a.delivery} status={getStatusTone(a.delivery)} />
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">— Not scheduled</span>
                      )}
                    </td>

                    {/* Wing B Pipeline */}
                    <td className="border-l border-slate-100 px-3 py-2.5">
                      {b ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StagePill label="Req" value={b.reqStatus} status={getStatusTone(b.reqStatus)} />
                          <span className="text-slate-300">→</span>
                          <StagePill label="PO" value={b.poStatus} status={getStatusTone(b.poStatus)} />
                          <span className="text-slate-300">→</span>
                          <StagePill label="Del" value={b.delivery} status={getStatusTone(b.delivery)} />
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">— Not scheduled</span>
                      )}
                    </td>

                    {/* Readiness / Status */}
                    <td className="border-l border-slate-100 px-3 py-2.5">
                      {actionBadge}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ProjectOverview({ onSelectBuilding }: { onSelectBuilding: (b: Bldg) => void }) {
  const total = D.uptoDateStatus[0];
  const fy = D.statusSummary[1];
  return (
    <div className="space-y-5">
      <ScheduleBar />
      <StatStrip
        building="all"
        items={[
          { label: 'Progress', value: total.actualPct, sub: `plan ${total.plannedPct}` },
          { label: 'Spent', value: `₹${total.actualCost} Cr`, sub: `plan ₹${total.plannedCost} Cr` },
          { label: 'Efficiency', value: total.efficiency, sub: 'upto date', tone: effTone(num(total.efficiency)) },
          { label: 'Budget', value: '₹371.22 Cr', sub: 'baseline = signed off' },
          {
            label: 'FY 26-27 spend',
            value: `₹${(
              num(D.fyActualCostUptoOct.aBldg) +
              num(D.fyActualCostUptoOct.bBldg) +
              num(D.fyActualCostUptoOct.development)
            ).toFixed(2)} Cr`,
            sub: `Apr – Oct 26 · plan ${fy.plannedPct}`,
            tone: effTone(num(fy.efficiency)),
          },
          {
            label: 'Aluform',
            value: `${
              D.aluformCasting.A.filter((r) => r.date).length +
              D.aluformCasting.B.filter((r) => r.date).length
            }/68`,
            sub: 'floors cast (A & B)',
          },
        ]}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <ProjectMonthlyChart />
        </div>
        <div className="lg:col-span-4">
          <SpendByBuildingChart />
        </div>
      </div>
      <BudgetMap building="all" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {BLDGS.map((b) => (
          <BuildingCard key={b} b={b} onSelect={onSelectBuilding} />
        ))}
      </div>
      <AttentionCard />
      <CrossWingProcurementMatrix />
    </div>
  );
}

/* ================================== Building views ================================== */

const ACTIVITY_SHORT: Record<string, string> = {
  'RCC - ALUFORM': 'RCC',
  MASONARY: 'Masonry',
  'TAR PLASTER': 'Plaster',
  'CONCEALED PLUMBING': 'Plumbing',
  WATERPROOFING: 'Water-proofing',
  'ELECTRICAL - WALL DROPPING': 'Electrical',
  'GYPSUM PLASTER': 'Gypsum',
  'SPRINKLER SYSTEM': 'Sprinkler',
  'FALSE CEILING - FRAMING': 'False ceiling',
  TILING: 'Tiling',
};

/** Trade cascade up the tower: floors done per activity vs Oct and Dec targets. */
function TowerChart({ rows }: { rows: ElenorTargetRow[] }) {
  const data = rows.map((r) => ({
    r,
    done: achievedFloor(r.statusOct),
    oct: topFloor(r.targetOct),
    dec: topFloor(r.targetDec),
  }));
  const peak = Math.max(...data.flatMap((d) => [d.done ?? 0, d.oct ?? 0, d.dec ?? 0]));
  const max = Math.ceil((peak + 1) / 4) * 4;
  const ticks = Array.from({ length: max / 4 + 1 }, (_, i) => i * 4);
  const pos = (f: number) => `${(f / max) * 100}%`;
  const [hover, setHover] = useState<number | null>(null);
  const h = hover !== null ? data[hover] : null;

  return (
    <Card
      title="Work up the tower"
      hint="floors done · Q3 targets"
      action={
        <div className="flex flex-wrap gap-3">
          <Swatch color={C.actual} label="Done" />
          <Swatch color="#0F172A" label="Oct target" />
          <Swatch color={C.plan} label="Dec target" dashed />
        </div>
      }
    >
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-[520px] gap-2">
        <div className="relative h-64 w-6 shrink-0 text-right">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 font-mono text-[10px] text-slate-400" style={{ bottom: pos(t), transform: 'translateY(50%)' }}>
              {t}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-64">
            {ticks.map((t) => (
              <div key={t} className="absolute inset-x-0 h-px bg-slate-100" style={{ bottom: pos(t) }} />
            ))}
            <div className="absolute inset-0 grid gap-1" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
              {data.map((d, i) => (
                <div
                  key={d.r.activity}
                  className={`relative rounded-md transition-colors ${hover === i ? 'bg-slate-50' : ''}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  aria-label={`${d.r.activity}: ${d.r.statusOct}; Oct target ${d.r.targetOct}; Dec target ${d.r.targetDec}`}
                >
                  {d.dec !== null && (
                    <div className="absolute left-[12%] right-[12%] border-t-2 border-dashed" style={{ bottom: pos(d.dec), borderColor: C.plan }} />
                  )}
                  {d.oct !== null && (
                    <div className="absolute left-[12%] right-[12%] h-0.5 bg-slate-900" style={{ bottom: pos(d.oct) }} />
                  )}
                  {d.done !== null && (
                    <>
                      <div
                        className="absolute bottom-0 left-[28%] right-[28%] rounded-t"
                        style={{ height: pos(d.done), backgroundColor: C.actual }}
                      />
                      <span
                        className="absolute inset-x-0 text-center font-mono text-[10px] font-semibold text-slate-900"
                        style={{ bottom: `calc(${pos(d.done)} + 2px)` }}
                      >
                        {d.done}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
            {data.map((d) => (
              <div key={d.r.activity} className="flex flex-col items-center gap-1 text-center">
                <span className="flex h-[26px] items-start text-[10px] leading-tight text-slate-600 ">
                  {ACTIVITY_SHORT[d.r.activity] ?? d.r.activity}
                </span>
                <ToneIcon tone={d.r.status ? STATUS_TONE[d.r.status] : 'none'} className="h-3.5 w-3.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      <p className="mt-3 min-h-[2rem] border-t border-slate-100 pt-2 text-xs text-slate-600">
        {h ? (
          <>
            <span className="font-semibold text-slate-900">{ACTIVITY_SHORT[h.r.activity] ?? h.r.activity}</span> · {h.r.statusOct} · Oct{' '}
            {h.r.targetOct} · Nov {h.r.targetNov} · Dec {h.r.targetDec}
          </>
        ) : (
          <span className="text-slate-400">Hover a column for details</span>
        )}
      </p>
    </Card>
  );
}

/** "JUNE 2025" -> "Jun 25" */
function shortMonth(d: string) {
  return d.replace(/^(\w)(\w{2})\w*\s+20(\d\d)$/, (_, a: string, bc: string, yy: string) => `${a}${bc.toLowerCase()} ${yy}`);
}

function shortTask(name: string) {
  return name.replace(/^\(TG\)\s*/, '').replace(/^[AB]\s*-\s*/, '').replace(/\s*\(M\+L\)/, '').trim();
}

/** Planned vs actual % per task group as a dot plot (one row per group with progress). */
function TaskGroupDots({ rows }: { rows: ElenorCostRow[] }) {
  const hasGroups = rows.some((r) => r.level === 'group');
  const items = rows
    .filter((r) => r.level !== 'total' && r.plannedPct !== null)
    .map((r) => ({ r, planned: num(r.plannedPct), actual: num(r.actualPct), base: num(r.baseline) }));
  // Development keeps its Podium / Development sub-total structure; A & B sort by budget weight.
  if (!hasGroups) items.sort((a, b) => b.base - a.base);
  const cols = 'grid-cols-[minmax(0,7rem)_1fr_3.25rem] sm:grid-cols-[minmax(0,8.5rem)_1fr_3.5rem]';

  return (
    <Card
      title="Task groups"
      hint="% of each group done"
      action={
        <div className="flex gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Dot color={C.actual} /> Actual
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Dot color="#64748B" ring /> Planned
          </span>
        </div>
      }
    >
      <div className="space-y-1">
        {items.map(({ r, planned, actual }) => {
          const lo = Math.min(planned, actual);
          const hi = Math.max(planned, actual);
          const isGroup = r.level === 'group';
          return (
            <div
              key={r.name}
              className={`grid ${cols} items-center gap-3 rounded-md px-1 py-1 hover:bg-slate-50 ${isGroup ? 'bg-slate-50/70 mt-2 first:mt-0' : ''}`}
              title={`${shortTask(r.name)} — baseline ₹${r.baseline} L · planned ${r.plannedPct} (₹${r.plannedCost} L) · actual ${r.actualPct} (₹${r.actualCost} L)`}
            >
              <span className={`truncate text-xs ${isGroup ? 'font-semibold text-slate-900' : 'text-slate-700'} ${r.indent ? 'pl-3' : ''}`}>
                {shortTask(r.name)}
              </span>
              <div className="relative h-4">
                <div className="absolute inset-x-0 top-1/2 h-px bg-slate-100" />
                <div className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-slate-300" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
                <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${Math.min(planned, 100)}%` }}>
                  <Dot color="#64748B" ring />
                </span>
                <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${Math.min(actual, 100)}%` }}>
                  <span className="block h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: C.actual }} />
                </span>
              </div>
              <span className="text-right">
                <Effi value={r.efficiency} />
              </span>
            </div>
          );
        })}
      </div>
      <div className={`mt-1 grid ${cols} gap-3 px-1`}>
        <span />
        <div className="flex justify-between font-mono text-[10px] text-slate-400">
          <span>0</span>
          <span>50</span>
          <span>100%</span>
        </div>
        <span />
      </div>
    </Card>
  );
}

/** Where the budget sits: Ranked Pareto bullet chart with baseline commitment vs actual spend vs planned target. */
function BudgetMap({ rows, building }: { rows?: ElenorCostRow[]; building?: ElenorBuilding }) {
  const [scope, setScope] = useState<ElenorBuilding>(building ?? 'all');
  const [viewMode, setViewMode] = useState<'top10' | 'all'>('top10');
  const [search, setSearch] = useState('');

  // Keep scope in sync if a specific building prop is passed
  const activeScope = building && building !== 'all' ? building : scope;

  // Process items based on activeScope
  const items = useMemo(() => {
    if (activeScope === 'all') {
      const groups: Record<
        string,
        {
          base: number;
          plannedCost: number;
          actualCost: number;
          buildings: Set<string>;
          started: boolean;
        }
      > = {};

      (['A', 'B', 'Development'] as const).forEach((bldg) => {
        D.buildingProgress[bldg]
          .filter((r) => r.level === 'item' && num(r.baseline) > 0)
          .forEach((r) => {
            const key = shortTask(r.name);
            if (!groups[key]) {
              groups[key] = {
                base: 0,
                plannedCost: 0,
                actualCost: 0,
                buildings: new Set(),
                started: false,
              };
            }
            groups[key].base += num(r.baseline);
            groups[key].plannedCost += num(r.plannedCost);
            groups[key].actualCost += num(r.actualCost);
            groups[key].buildings.add(bldg === 'Development' ? 'Dev' : `${bldg} Bldg`);
            if (r.plannedPct !== null || r.actualPct !== null) {
              groups[key].started = true;
            }
          });
      });

      return Object.entries(groups)
        .map(([name, g]) => {
          const plannedPct = g.base > 0 ? (g.plannedCost / g.base) * 100 : 0;
          const actualPct = g.base > 0 ? (g.actualCost / g.base) * 100 : 0;
          const eff = g.plannedCost > 0 ? `${Math.round((g.actualCost / g.plannedCost) * 100)}%` : null;
          return {
            name,
            fullName: name,
            base: g.base,
            plannedCost: g.plannedCost,
            actualCost: g.actualCost,
            plannedPct,
            actualPct,
            efficiency: eff,
            started: g.started,
            buildings: Array.from(g.buildings),
          };
        })
        .sort((a, b) => b.base - a.base);
    }

    // Specific building
    const sourceRows = rows ?? D.buildingProgress[activeScope as Bldg];
    return sourceRows
      .filter((r) => r.level === 'item' && num(r.baseline) > 0)
      .map((r) => {
        const base = num(r.baseline);
        const plannedCost = num(r.plannedCost);
        const actualCost = num(r.actualCost);
        const plannedPct = num(r.plannedPct);
        const actualPct = num(r.actualPct);
        return {
          name: shortTask(r.name),
          fullName: r.name,
          base,
          plannedCost,
          actualCost,
          plannedPct,
          actualPct,
          efficiency: r.efficiency,
          started: r.plannedPct !== null || r.actualPct !== null,
        };
      })
      .sort((a, b) => b.base - a.base);
  }, [activeScope, rows]);

  const totalBaseline = items.reduce((s, it) => s + it.base, 0);
  const totalSpent = items.reduce((s, it) => s + it.actualCost, 0);
  const totalPlanned = items.reduce((s, it) => s + it.plannedCost, 0);
  const top10Sum = items.slice(0, 10).reduce((s, it) => s + it.base, 0);
  const paretoPct = totalBaseline > 0 ? ((top10Sum / totalBaseline) * 100).toFixed(1) : '0';

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => it.name.toLowerCase().includes(q) || it.fullName.toLowerCase().includes(q));
    }
    if (viewMode === 'top10' && !search.trim()) {
      list = list.slice(0, 10);
    }
    return list;
  }, [items, search, viewMode]);

  return (
    <Card
      title="Where the budget sits"
      hint="Ranked Pareto bullet chart · baseline commitment vs actual spend vs planned target"
      action={
        <div className="flex flex-wrap items-center gap-2">
          {(!building || building === 'all') && (
            <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 text-xs font-medium backdrop-blur-xs shadow-2xs">
              {(['all', 'A', 'B', 'Development'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`rounded-lg px-2.5 py-1 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
                    scope === s ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {s === 'all' ? 'Project Total' : s === 'Development' ? 'Dev' : `${s} Bldg`}
                </button>
              ))}
            </div>
          )}

          <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 text-xs font-medium backdrop-blur-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('top10')}
              className={`rounded-lg px-2.5 py-1 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
                viewMode === 'top10' ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Top 10 Pareto ({paretoPct}%)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`rounded-lg px-2.5 py-1 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
                viewMode === 'all' ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({items.length})
            </button>
          </div>
        </div>
      }
    >
      {/* KPI & Pareto Summary Banner */}
      <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <span>
              Total Baseline: <strong className="font-mono text-slate-900">₹{lacs(totalBaseline)} Lacs</strong>
            </span>
            <span>
              Actual Spent: <strong className="font-mono text-slate-900">₹{lacs(totalSpent)} Lacs</strong>{' '}
              ({totalBaseline > 0 ? ((totalSpent / totalBaseline) * 100).toFixed(1) : '0'}%)
            </span>
            <span>
              Planned Target: <strong className="font-mono text-slate-900">₹{lacs(totalPlanned)} Lacs</strong>{' '}
              ({totalBaseline > 0 ? ((totalPlanned / totalBaseline) * 100).toFixed(1) : '0'}%)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs" style={{ backgroundColor: C.actual }} /> Actual spend
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-0.5 bg-slate-800" /> Planned target
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-200" /> Uncommitted
            </span>
          </div>
        </div>

        {viewMode === 'all' && (
          <div className="mt-2.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search trade group..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-white/90 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bullet Bars List */}
      <div className="space-y-2.5">
        {filtered.map((item, idx) => {
          const share = totalBaseline > 0 ? (item.base / totalBaseline) * 100 : 0;
          const isLagging = item.started && item.actualPct === 0 && item.plannedPct > 0;
          const isNotStarted = !item.started || (item.plannedPct === 0 && item.actualPct === 0);
          const effVal = item.efficiency ? parseInt(item.efficiency, 10) : null;
          const unspent = Math.max(0, item.base - item.actualCost);

          return (
            <div
              key={item.fullName}
              className="rounded-xl border border-slate-200/80 bg-white/95 p-3 hover:border-slate-300 hover:shadow-xs transition-all duration-150"
            >
              {/* Row Header */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-[10px] font-semibold text-slate-600">
                    #{idx + 1}
                  </span>
                  <span className="font-semibold text-xs sm:text-sm text-slate-900 tracking-tight truncate">
                    {item.name}
                  </span>
                  {item.buildings && item.buildings.length > 0 && (
                    <span className="rounded-md bg-slate-100/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                      {item.buildings.join(' · ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="text-right">
                    <span className="font-mono font-semibold text-slate-900">₹{lacs(item.base)} L</span>
                    <span className="ml-1 text-[11px] text-slate-500">({share.toFixed(1)}%)</span>
                  </div>
                  {/* Restrained semantic badges */}
                  {isLagging ? (
                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      Lagging · 0%
                    </span>
                  ) : isNotStarted ? (
                    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      Not Started
                    </span>
                  ) : effVal !== null && effVal < 25 ? (
                    <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                      Critical · {item.efficiency}
                    </span>
                  ) : effVal !== null && effVal < 75 ? (
                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      Behind · {item.efficiency}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                      On Track · {item.efficiency ?? `${item.actualPct.toFixed(0)}%`}
                    </span>
                  )}
                </div>
              </div>

              {/* Bullet Bar */}
              <div
                className="relative h-3.5 w-full rounded-full bg-slate-100 overflow-hidden"
                title={`Baseline: ₹${lacs(item.base)} L | Actual: ₹${lacs(item.actualCost)} L (${item.actualPct.toFixed(1)}%) | Planned: ₹${lacs(item.plannedCost)} L (${item.plannedPct.toFixed(1)}%)`}
              >
                {/* Actual Spend Fill */}
                <div
                  className="h-full rounded-l-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    width: `${Math.min(100, Math.max(0, item.actualPct))}%`,
                    backgroundColor: C.actual,
                  }}
                />
                {/* Planned Target Marker Line */}
                {item.plannedPct > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-800 -translate-x-1/2 z-10"
                    style={{ left: `${Math.min(100, item.plannedPct)}%` }}
                    title={`Planned Target: ${item.plannedPct.toFixed(1)}% (₹${lacs(item.plannedCost)} L)`}
                  />
                )}
              </div>

              {/* Sub-metrics */}
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span>
                    Spent: <strong className="font-mono text-slate-700">₹{lacs(item.actualCost)} L</strong> ({item.actualPct.toFixed(1)}%)
                  </span>
                  <span>
                    Plan: <strong className="font-mono text-slate-700">₹{lacs(item.plannedCost)} L</strong> ({item.plannedPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span>Unspent: ₹{lacs(unspent)} L</span>
                  {item.efficiency && (
                    <span className={num(item.efficiency) < 50 ? 'text-amber-700 font-semibold' : 'text-slate-600'}>
                      Effi: {item.efficiency}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AluformChart({ b }: { b: 'A' | 'B' }) {
  const other: 'A' | 'B' = b === 'A' ? 'B' : 'A';
  const toPoints = (k: 'A' | 'B') =>
    D.aluformCasting[k]
      .filter((r) => r.date)
      .map((r) => ({
        t: parseDmy(r.date as string),
        floor: parseInt(r.floor, 10),
        cycle: r.cycle ? `${parseInt(r.cycle, 10)}d` : '',
      }))
      .sort((x, y) => x.t - y.t);
  const mine = toPoints(b);
  const theirs = toPoints(other);
  const { strike } = D.aluformCasting;
  const s1 = parseDmy(strike.from);
  const s2 = parseDmy(strike.to);
  const all = [...mine, ...theirs].map((p) => p.t);
  const minT = Math.min(...all, s1) - 6 * 86400000;
  const maxT = Math.max(...all) + 10 * 86400000;
  const ticks: number[] = [];
  for (let d = new Date(new Date(minT).getFullYear(), new Date(minT).getMonth() + 1, 1); d.getTime() <= maxT; d.setMonth(d.getMonth() + 1)) {
    ticks.push(d.getTime());
  }
  const fmt = (t: number) => new Date(t).toLocaleDateString('en-GB', { month: 'short' });
  const milestones = D.timeline.milestones.filter((m) => m.event.startsWith(`${b} Bldg`) || m.event.startsWith('A & B'));

  return (
    <Card
      title="Aluform slab cycle"
      hint="floor cast vs date · days per floor"
      action={
        <div className="flex gap-3">
          <Swatch color={C.actual} label={`${b} Bldg.`} />
          <Swatch color={C.context} label={`${other} Bldg.`} />
        </div>
      }
    >
      {/* Executive speed & ERP sync KPI chips */}
      <div className="mb-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">A Bldg Avg Cycle</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-mono text-base font-bold text-slate-900">12.4</span>
            <span className="text-xs text-slate-500">days</span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">B Bldg Avg Cycle</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-mono text-base font-bold text-slate-900">13.1</span>
            <span className="text-xs text-slate-500">days</span>
          </div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Highrise ERP Sync</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-mono text-base font-bold text-emerald-800">98.2%</span>
            <span className="text-xs text-emerald-700">aligned</span>
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">RMC Strike Impact</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="font-mono text-base font-bold text-amber-900">23</span>
            <span className="text-xs text-amber-800">days delay</span>
          </div>
        </div>
      </div>

      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 16, right: 12, left: -24, bottom: 0 }}>
            <CartesianGrid stroke={C.grid} vertical={false} />
            <XAxis
              type="number"
              dataKey="t"
              domain={[minT, maxT]}
              ticks={ticks}
              tickFormatter={fmt}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: C.grid }}
            />
            <YAxis type="number" dataKey="floor" domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <ReferenceArea
              x1={s1}
              x2={s2}
              fill="#F1F5F9"
              label={{ value: `RMC strike ${strike.days}d`, position: 'insideTop', fontSize: 10, fill: '#64748B' }}
            />
            <Tooltip
              contentStyle={TIP}
              labelFormatter={(t) => new Date(Number(t)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
              formatter={(v, n) => [`Floor ${v}`, n]}
            />
            <Line isAnimationActive={false} data={theirs} dataKey="floor" name={`${other} Bldg.`} stroke={C.context} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line
              isAnimationActive={false}
              data={mine}
              dataKey="floor"
              name={`${b} Bldg.`}
              stroke={C.actual}
              strokeWidth={2}
              dot={{ r: 3.5, fill: C.actual, stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            >
              <LabelList dataKey="cycle" position="left" offset={8} style={{ fontSize: 10, fill: '#475569', fontWeight: 600 }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 pt-2 text-xs">
        {milestones.map((m) => (
          <li key={m.date + m.event} className="text-slate-700">
            <span className="mr-1.5 font-mono text-slate-500">{shortMonth(m.date)}</span>
            {m.event.replace(/^.*?Bldg\.\s*[–-]\s*/, '')}
          </li>
        ))}
      </ol>
    </Card>
  );
}

function HighriseCard({ side }: { side: 'a' | 'b' }) {
  // Collapse consecutive Aluform floors that share the same status.
  type Row = { label: string; actual: string; status: string; open: boolean };
  const rows: Row[] = [];
  let run: { from: string; to: string; actual: string; status: string; open: boolean } | null = null;
  const flush = () => {
    if (run) rows.push({ label: `Aluform ${run.from}${run.to !== run.from ? `–${run.to}` : ''}`, actual: run.actual, status: run.status, open: run.open });
    run = null;
  };
  D.highriseStatus.forEach((r) => {
    const actual = side === 'a' ? r.aActual : r.bActual;
    const status = side === 'a' ? r.aHighrise : r.bHighrise;
    const open = (side === 'a' ? r.aTone : r.bTone) === 'open';
    const floor = r.activity.match(/(\d+(?:st|nd|rd|th))/)?.[1];
    if (r.activity.startsWith('ALUFORM') && floor) {
      if (run && run.actual === actual && run.status === status) run.to = floor;
      else {
        flush();
        run = { from: floor, to: floor, actual, status, open };
      }
      return;
    }
    flush();
    const name = r.activity.toLowerCase().replace('masonary', 'masonry');
    rows.push({ label: name.charAt(0).toUpperCase() + name.slice(1), actual, status, open });
  });
  flush();
  const openCount = rows.filter((r) => r.open).length;

  return (
    <Card title="Site vs Highrise" hint={`${openCount} with open tasks`}>
      <ul className="divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-3 py-2" title={`${r.actual} · ${r.status}`}>
            <ToneIcon tone={r.open ? 'part' : 'good'} className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-slate-800">{r.label}</span>
              <span className="block truncate text-[11px] text-slate-500">{r.actual.replace(/ Complete(d)?$/, '')}</span>
            </span>
            <span className={`text-[11px] font-medium ${r.open ? 'text-amber-700' : 'text-slate-500'}`}>{r.open ? 'Open' : 'Closed'}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SupplyCard({ side }: { side: 'a' | 'b' }) {
  const [tab, setTab] = useState<'contractors' | 'materials'>('contractors');
  const [filterStage, setFilterStage] = useState<'all' | PipelineStageKey>('all');

  const bldgName = side === 'a' ? 'A Building' : 'B Building';

  // Contractor counts for this side
  const contractorCounts = useMemo(() => {
    let active = 0;
    let mobilising = 0;
    let action = 0;
    let future = 0;

    D.contractorDeployment.rows.forEach((r) => {
      const s = r[side];
      const stage = getContractorStage(s);
      if (stage === 'active') active++;
      else if (stage === 'mobilising') mobilising++;
      else if (stage === 'action') action++;
      else future++;
    });

    return { active, mobilising, action, future };
  }, [side]);

  // Material counts for this side
  const materialCounts = useMemo(() => {
    let active = 0;
    let mobilising = 0;
    let action = 0;
    let future = 0;

    D.bulkPurchasing.rows.forEach((r) => {
      const s = r[side];
      const stage = getMaterialStage(s);
      if (stage === 'active') active++;
      else if (stage === 'mobilising') mobilising++;
      else if (stage === 'action') action++;
      else future++;
    });

    return { active, mobilising, action, future };
  }, [side]);

  const counts = tab === 'contractors' ? contractorCounts : materialCounts;

  const filteredContractors = useMemo(() => {
    return D.contractorDeployment.rows.filter((r) => {
      const s = r[side];
      const stage = getContractorStage(s);
      if (filterStage !== 'all' && stage !== filterStage) return false;
      return true;
    });
  }, [side, filterStage]);

  const filteredMaterials = useMemo(() => {
    return D.bulkPurchasing.rows.filter((r) => {
      const s = r[side];
      const stage = getMaterialStage(s);
      if (filterStage !== 'all' && stage !== filterStage) return false;
      return true;
    });
  }, [side, filterStage]);

  return (
    <Card
      title={`Supply & Contractors · ${bldgName}`}
      hint="Procurement pipeline & readiness workflow · PLN/409 & PLN/410"
      action={
        <div className="inline-flex rounded-xl border border-slate-200/80 bg-slate-100/90 p-1 text-xs font-medium backdrop-blur-xs shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setTab('contractors');
              setFilterStage('all');
            }}
            className={`rounded-lg px-2.5 py-1 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
              tab === 'contractors'
                ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Contractors ({D.contractorDeployment.rows.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('materials');
              setFilterStage('all');
            }}
            className={`rounded-lg px-2.5 py-1 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] ${
              tab === 'materials'
                ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Bulk Materials ({D.bulkPurchasing.rows.length})
          </button>
        </div>
      }
    >
      {/* 4 Pipeline Funnel Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <button
          type="button"
          onClick={() => setFilterStage(filterStage === 'active' ? 'all' : 'active')}
          className={`rounded-xl border p-2.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
            filterStage === 'active'
              ? 'border-emerald-600/80 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
              : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Active</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-0.5 text-base font-bold font-mono text-slate-900">{counts.active}</div>
          <div className="text-[10px] text-slate-500">On site / done</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage(filterStage === 'mobilising' ? 'all' : 'mobilising')}
          className={`rounded-xl border p-2.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
            filterStage === 'mobilising'
              ? 'border-amber-600/80 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
              : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">In Progress</span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-0.5 text-base font-bold font-mono text-slate-900">{counts.mobilising}</div>
          <div className="text-[10px] text-slate-500">Part given / done</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage(filterStage === 'action' ? 'all' : 'action')}
          className={`rounded-xl border p-2.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
            filterStage === 'action'
              ? 'border-rose-600/80 bg-rose-50/70 ring-2 ring-rose-500/20 shadow-xs'
              : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Action</span>
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-0.5 text-base font-bold font-mono text-rose-700">{counts.action}</div>
          <div className="text-[10px] text-slate-500">Overdue / missing</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage(filterStage === 'future' ? 'all' : 'future')}
          className={`rounded-xl border p-2.5 text-left transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
            filterStage === 'future'
              ? 'border-slate-700 bg-slate-100 ring-2 ring-slate-400/20 shadow-xs'
              : 'border-slate-200/80 bg-white/90 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Future</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          </div>
          <div className="mt-0.5 text-base font-bold font-mono text-slate-900">{counts.future}</div>
          <div className="text-[10px] text-slate-500">Subsequent phase</div>
        </button>
      </div>

      {filterStage !== 'all' && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterStage('all')}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            Showing {filterStage} filter <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {tab === 'contractors' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-semibold uppercase text-slate-500">
                <th className="px-2.5 py-2">Contractor / Trade</th>
                <th className="px-2 py-2 text-right">Notice</th>
                <th className="px-2.5 py-2">Planned</th>
                <th className="px-2.5 py-2">Stage 1: Labour Req</th>
                <th className="px-2.5 py-2">Stage 2: Work Order</th>
                <th className="px-2.5 py-2">Readiness Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContractors.map((r) => {
                const s = r[side];
                const stage = getContractorStage(s);
                return (
                  <tr key={r.sr} className="hover:bg-slate-50/80">
                    <td className="px-2.5 py-2 font-medium text-slate-900">{r.contractor}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-500">{r.processing}d</td>
                    <td className="px-2.5 py-2 font-mono text-slate-600">{s?.planned ?? '—'}</td>
                    <td className="px-2.5 py-2">
                      {s ? (
                        <StagePill label="Labour" value={s.labour} status={getStatusTone(s.labour)} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2.5 py-2">
                      {s ? (
                        <StagePill label="WO" value={s.woStatus} status={getStatusTone(s.woStatus)} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2.5 py-2">
                      {stage === 'active' ? (
                        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                          ✓ Active on site
                        </span>
                      ) : stage === 'action' ? (
                        <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                          ⚠️ Action needed
                        </span>
                      ) : stage === 'mobilising' ? (
                        <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                          In progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded border border-slate-200/60 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
                          Scheduled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-semibold uppercase text-slate-500">
                <th className="px-2.5 py-2">Material Item</th>
                <th className="px-2 py-2 text-right">Lead</th>
                <th className="px-2.5 py-2">Planned</th>
                <th className="px-2.5 py-2">Stage 1: Requisition</th>
                <th className="px-2.5 py-2">Stage 2: PO</th>
                <th className="px-2.5 py-2">Stage 3: Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((r) => {
                const s = r[side];
                return (
                  <tr key={r.sr} className="hover:bg-slate-50/80">
                    <td className="px-2.5 py-2 font-medium text-slate-900">{r.item}</td>
                    <td className="px-2 py-2 text-right font-mono text-slate-500">{r.leadTime}d</td>
                    <td className="px-2.5 py-2 font-mono text-slate-600">{s?.planned ?? '—'}</td>
                    <td className="px-2.5 py-2">
                      {s ? (
                        <StagePill label="Req" value={s.reqStatus} status={getStatusTone(s.reqStatus)} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2.5 py-2">
                      {s ? (
                        <StagePill label="PO" value={s.poStatus} status={getStatusTone(s.poStatus)} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-2.5 py-2">
                      {s ? (
                        <StagePill label="Del" value={s.delivery} status={getStatusTone(s.delivery)} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function DevTargetsCard() {
  const pct = (t: string) => {
    const m = t.match(/(\d+)%/);
    return m ? Number(m[1]) : null;
  };
  return (
    <Card title="Q3 targets" hint="% of work item">
      <div className="space-y-4">
        {D.targetVsActual.Development.map((r) => {
          const done = pct(r.statusOct);
          const marks = [
            { k: 'Oct', v: pct(r.targetOct) },
            { k: 'Nov', v: pct(r.targetNov) },
            { k: 'Dec', v: pct(r.targetDec) },
          ].filter((m) => m.v !== null) as Array<{ k: string; v: number }>;
          const phase = [r.statusOct, r.targetNov, r.targetDec, r.targetOct].find((x) => x !== '-')?.split(' –')[0] ?? '';
          return (
            <div key={r.activity} title={`Oct status ${r.statusOct} · targets Oct ${r.targetOct}, Nov ${r.targetNov}, Dec ${r.targetDec}`}>
              <div className="mb-1.5 flex items-center gap-2 text-xs">
                <ToneIcon tone={r.status ? STATUS_TONE[r.status] : 'none'} className="h-3.5 w-3.5" />
                <span className="font-semibold text-slate-900">{r.activity === 'COMMERCIAL' ? 'Commercial' : r.activity}</span>
                <span className="text-slate-500">{phase.toLowerCase()}</span>
                <span className="ml-auto font-mono font-semibold tabular-nums text-slate-900">{done !== null ? `${done}%` : 'not started'}</span>
              </div>
              <div className="relative h-2 rounded-full bg-slate-100">
                {done !== null && <div className="h-full rounded-full" style={{ width: `${done}%`, backgroundColor: C.actual }} />}
                {marks.map((m) => (
                  <span key={m.k} className="absolute -top-1 -bottom-1 w-0.5 bg-slate-500" style={{ left: `${m.v}%` }} />
                ))}
              </div>
              <div className="relative mt-1 h-3">
                {marks.map((m) => (
                  <span key={m.k} className="absolute -translate-x-1/2 font-mono text-[10px] text-slate-400" style={{ left: `${m.v}%` }}>
                    {m.k}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BuildingView({ b }: { b: Bldg }) {
  const info = bldgInfo(b);
  const t = targetCounts(info.targets);
  const u = info.upto;
  const stats = [
    { label: 'Progress', value: u.actualPct, sub: `plan ${u.plannedPct}` },
    { label: 'Spent', value: `₹${u.actualCost} Cr`, sub: `plan ₹${u.plannedCost} Cr` },
    { label: 'Efficiency', value: u.efficiency, sub: 'upto date', tone: effTone(num(u.efficiency)) },
    { label: 'Budget', value: `₹${u.totalCost} Cr`, sub: u.detail?.replace(/[()]/g, '') ?? 'incl. podium' },
    { label: 'FY 26-27 spend', value: `₹${info.fyCost} Cr`, sub: 'Apr – Oct 26' },
    info.cast
      ? { label: 'Aluform', value: `${info.floorsCast}/${D.aluformCasting.totalFloors}`, sub: 'floors cast' }
      : { label: 'Oct targets', value: `${t.met}/${t.total}`, sub: 'met', tone: 'good' as Tone },
  ];

  if (b === 'Development') {
    return (
      <div className="space-y-5">
        <StatStrip items={stats} building="Development" />
        <BudgetMap rows={info.cost} building="Development" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <TaskGroupDots rows={info.cost} />
          </div>
          <div className="lg:col-span-5">
            <DevTargetsCard />
          </div>
        </div>
        <BuildingMonthlyChart b={b} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StatStrip items={stats} building={b} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <TowerChart rows={info.targets} />
        </div>
        <div className="lg:col-span-4">
          <HighriseCard side={info.side!} />
        </div>
      </div>
      <BudgetMap rows={info.cost} building={b} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TaskGroupDots rows={info.cost} />
        <AluformChart b={b as 'A' | 'B'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <SupplyCard side={info.side!} />
        </div>
        <div className="lg:col-span-4">
          <BuildingMonthlyChart b={b} />
        </div>
      </div>
    </div>
  );
}

/* ================================== Detail tables ================================== */

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th scope="col" className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap ${right ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function Td({ children, right, strong, className = '' }: { children?: React.ReactNode; right?: boolean; strong?: boolean; className?: string }) {
  return (
    <td
      className={`px-3 py-2 ${right ? 'text-right font-mono tabular-nums' : ''} ${strong ? 'font-semibold text-slate-900' : 'text-slate-700'} ${className}`}
    >
      {children ?? <span className="text-slate-300">—</span>}
    </td>
  );
}

function TableCard({ title, hint, head, rightFrom = 99, children }: { title: string; hint?: string; head: string[]; rightFrom?: number; children: React.ReactNode }) {
  return (
    <Card title={title} hint={hint}>
      <div className="-mx-4 sm:-mx-5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              {head.map((h, i) => (
                <Th key={h + i} right={i >= rightFrom}>
                  {h}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </Card>
  );
}

function CostTableCard({ b }: { b: Bldg }) {
  return (
    <TableCard title="Task-group cost" hint="₹ Lacs" head={['Task', 'Baseline', 'Plan %', 'Plan cost', 'Actual %', 'Actual cost', 'Effi.']} rightFrom={1}>
      {D.buildingProgress[b].map((r) => (
        <tr key={r.name} className={r.level === 'total' ? 'bg-slate-50' : r.level === 'group' ? 'bg-slate-50/50' : ''}>
          <Td strong={r.level !== 'item'} className={r.indent ? 'pl-7' : ''}>
            {r.level === 'total' ? `${bldgInfo(b).label} total` : shortTask(r.name)}
          </Td>
          <Td right strong>{r.baseline}</Td>
          <Td right>{r.plannedPct}</Td>
          <Td right>{r.plannedCost}</Td>
          <Td right>{r.actualPct}</Td>
          <Td right>{r.actualCost}</Td>
          <td className="px-3 py-2 text-right">
            <Effi value={r.efficiency} />
          </td>
        </tr>
      ))}
    </TableCard>
  );
}

function TargetsTableCard({ b }: { b: Bldg }) {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Achieved' | 'Partly Done' | 'Failed'>('All');
  const rows = D.targetVsActual[b];
  const metCount = rows.filter((r) => r.status === 'Achieved').length;
  const partlyCount = rows.filter((r) => r.status === 'Partly Done').length;
  const failedCount = rows.filter((r) => r.status === 'Failed').length;
  const totalCount = rows.length;

  const filtered = statusFilter === 'All' ? rows : rows.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-3">
      {/* Target Pipeline & Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Target Filter:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('All')}
            className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
              statusFilter === 'All' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Achieved')}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
              statusFilter === 'Achieved' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            Achieved ({metCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Partly Done')}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
              statusFilter === 'Partly Done' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <CircleDot className="h-3 w-3" />
            Partly Done ({partlyCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Failed')}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors ${
              statusFilter === 'Failed' ? 'bg-red-600 text-white shadow-xs' : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            <XCircle className="h-3 w-3" />
            Failed ({failedCount})
          </button>
        </div>

        {/* Visual Pipeline Ratio Bar */}
        <div className="flex items-center gap-2.5 text-xs">
          <div className="flex h-2.5 w-32 overflow-hidden rounded-full bg-slate-100">
            <div style={{ width: `${(metCount / totalCount) * 100}%` }} className="bg-emerald-500" title={`Achieved: ${metCount}`} />
            <div style={{ width: `${(partlyCount / totalCount) * 100}%` }} className="bg-amber-500" title={`Partly Done: ${partlyCount}`} />
            <div style={{ width: `${(failedCount / totalCount) * 100}%` }} className="bg-red-500" title={`Failed: ${failedCount}`} />
          </div>
          <span className="font-mono text-xs font-semibold text-slate-700">
            {metCount}/{totalCount} Met
          </span>
        </div>
      </div>

      <TableCard
        title="Q3 targets"
        hint={`Oct – Dec 2026 · showing ${filtered.length} of ${totalCount} targets`}
        head={['Activity', 'Oct target', 'Oct status', 'Nov', 'Dec']}
      >
        {filtered.map((r) => (
          <tr key={r.activity} className={r.status === 'Failed' ? 'bg-red-50/25' : ''}>
            <Td strong>{ACTIVITY_SHORT[r.activity] ?? r.activity}</Td>
            <Td>{r.targetOct}</Td>
            <td className="px-3 py-2">
              <span className="inline-flex items-start gap-1.5 text-slate-800">
                <ToneIcon tone={r.status ? STATUS_TONE[r.status] : 'none'} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {r.statusOct}
              </span>
            </td>
            <Td>{r.targetNov}</Td>
            <Td>{r.targetDec}</Td>
          </tr>
        ))}
      </TableCard>
    </div>
  );
}

function StatusCell({ text }: { text: string }) {
  return (
    <td className="px-3 py-2 whitespace-nowrap">
      <span className="inline-flex items-center gap-1.5 text-slate-800">
        <ToneIcon tone={textTone(text)} className="h-3.5 w-3.5" />
        {text}
      </span>
    </td>
  );
}

function TowerTables({ b }: { b: 'A' | 'B' }) {
  const side = b === 'A' ? 'a' : 'b';
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TableCard title="Aluform casting" hint="8th–32nd pending" head={['Floor', 'Date', 'Cycle']} rightFrom={2}>
          {D.aluformCasting[b].map((r) => (
            <tr key={r.floor}>
              <Td strong>{r.floor}</Td>
              <Td className="font-mono tabular-nums">{r.date}</Td>
              <Td right>{r.cycle}</Td>
            </tr>
          ))}
        </TableCard>
        <TableCard title="Site vs Highrise" hint={`upto ${D.asOfDate}`} head={['Activity', 'Actual', 'Highrise']}>
          {D.highriseStatus.map((r) => (
            <tr key={r.activity}>
              <Td strong>{r.activity}</Td>
              <Td>{side === 'a' ? r.aActual : r.bActual}</Td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5 text-slate-800">
                  <ToneIcon tone={(side === 'a' ? r.aTone : r.bTone) === 'open' ? 'part' : 'good'} className="h-3.5 w-3.5" />
                  {side === 'a' ? r.aHighrise : r.bHighrise}
                </span>
              </td>
            </tr>
          ))}
        </TableCard>
      </div>
      <TableCard title="Bulk purchasing" hint={`${D.bulkPurchasing.ref} · days`} head={['Item', 'PO', 'Lead', 'Planned', 'Req. date', 'Req.', 'PO status', 'Delivery']}>
        {D.bulkPurchasing.rows.map((r) => {
          const s = r[side];
          return (
            <tr key={r.sr}>
              <Td strong>{r.item}</Td>
              <Td right>{String(r.poProcessing)}</Td>
              <Td right>{String(r.leadTime)}</Td>
              {s ? (
                <>
                  <Td className="font-mono tabular-nums">{s.planned}</Td>
                  <Td className="font-mono tabular-nums">{s.reqDate}</Td>
                  <StatusCell text={s.reqStatus} />
                  <StatusCell text={s.poStatus} />
                  <StatusCell text={s.delivery} />
                </>
              ) : (
                <td colSpan={5} className="px-3 py-2 text-xs text-slate-400">Not yet scheduled</td>
              )}
            </tr>
          );
        })}
      </TableCard>
      <TableCard title="Contractor deployment" hint={`${D.contractorDeployment.ref} · days`} head={['Contractor', 'Proc.', 'Planned', 'WO date', 'Labour', 'WO status']}>
        {D.contractorDeployment.rows.map((r) => {
          const s = r[side];
          return (
            <tr key={r.sr}>
              <Td strong>{r.contractor}</Td>
              <Td right>{String(r.processing)}</Td>
              {s ? (
                <>
                  <Td className="font-mono tabular-nums">{s.planned}</Td>
                  <Td className="font-mono tabular-nums">{s.wo}</Td>
                  <StatusCell text={s.labour} />
                  <StatusCell text={s.woStatus} />
                </>
              ) : (
                <td colSpan={4} className="px-3 py-2 text-xs text-slate-400">Not yet scheduled</td>
              )}
            </tr>
          );
        })}
      </TableCard>
    </>
  );
}

function ProjectTables() {
  const months = D.monthwise.map((m) => m.month);
  const pct = (v: number) => `${v.toFixed(2)}%`;
  const monthRows: Array<{ label: string; values: string[]; strong?: boolean }> = [
    { label: 'Planned', values: D.monthwise.map((m) => pct(m.planned)) },
    { label: 'Actual', values: D.monthwise.map((m) => pct(m.actual)), strong: true },
    { label: 'Efficiency', values: D.monthwise.map((m) => `${m.efficiency}%`) },
    { label: 'A Bldg.', values: D.buildingWiseMonthly.map((m) => pct(m.aBldg)) },
    { label: 'B Bldg.', values: D.buildingWiseMonthly.map((m) => pct(m.bBldg)) },
    { label: 'Development', values: D.buildingWiseMonthly.map((m) => pct(m.dev)) },
  ];
  return (
    <>
      <TableCard title="Cost status" hint="₹ Crore · upto date" head={['', 'Budget', 'Plan %', 'Plan cost', 'Actual %', 'Actual cost', 'Effi.', 'FY spend']} rightFrom={1}>
        {D.uptoDateStatus.map((r, i) => {
          const fy = i === 0 ? D.statusSummary[1].actualCost.replace(' Cr.', '') : bldgInfo(BLDGS[i - 1]).fyCost;
          return (
            <tr key={r.project} className={r.isTotal ? 'bg-slate-50' : ''}>
              <Td strong>{r.isTotal ? 'Nyati Elenor' : bldgInfo(BLDGS[i - 1]).label}</Td>
              <Td right strong>{r.totalCost}</Td>
              <Td right>{r.plannedPct}</Td>
              <Td right>{r.plannedCost}</Td>
              <Td right>{r.actualPct}</Td>
              <Td right>{r.actualCost}</Td>
              <td className="px-3 py-2 text-right">
                <Effi value={r.efficiency} />
              </td>
              <Td right>{fy}</Td>
            </tr>
          );
        })}
      </TableCard>
      <TableCard title="Monthly progress" hint="% · FY 2026-27" head={['', ...months]} rightFrom={1}>
        {monthRows.map((r, i) => (
          <tr key={r.label} className={i === 3 ? 'border-t-2 border-slate-200' : ''}>
            <Td strong>{r.label}</Td>
            {r.values.map((v, j) => (
              <Td key={j} right strong={r.strong}>
                {v}
              </Td>
            ))}
          </tr>
        ))}
      </TableCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TableCard title="Project" head={['', '']}>
          {D.projectInfo.map((p) => (
            <tr key={p.label}>
              <Td>{p.label}</Td>
              <Td strong>{p.value}</Td>
            </tr>
          ))}
          <tr>
            <Td>Report</Td>
            <Td strong>{`${D.reportRef} · ${D.reportPeriod}`}</Td>
          </tr>
          <tr>
            <Td>Presented by</Td>
            <td className="px-3 py-2">
              <span className="font-semibold text-slate-900">{D.presenter.name}</span>{' '}
              <a href={`mailto:${D.presenter.email}`} className="text-xs text-sky-700 hover:underline">
                {D.presenter.email}
              </a>
            </td>
          </tr>
        </TableCard>
        <TableCard title="Period summary" head={['', 'Actual', 'Planned', 'Effi.']} rightFrom={1}>
          {D.statusSummary.map((r) => (
            <tr key={r.period}>
              <Td strong>{r.period.startsWith('Upto') ? 'Upto date' : 'FY 26-27 (to Oct)'}</Td>
              <Td right>{`${r.actualPct} · ${r.actualCost}`}</Td>
              <Td right>{`${r.plannedPct} · ${r.plannedCost}`}</Td>
              <td className="px-3 py-2 text-right">
                <Effi value={r.efficiency} />
              </td>
            </tr>
          ))}
          <tr>
            <Td strong>Open tasks</Td>
            <Td right>{D.taskClosing.openTaskCount}</Td>
            <Td right>{`₹${D.taskClosing.openTaskAmount}`}</Td>
            <Td />
          </tr>
          <tr>
            <Td strong>Closed in Oct</Td>
            <Td right>{D.taskClosing.closedInMonth}</Td>
            <Td />
            <Td />
          </tr>
        </TableCard>
      </div>
    </>
  );
}

function TimelineTableCard({ b }: { b?: Bldg }) {
  const { timeline } = D;
  const ms = b
    ? timeline.milestones.filter((m) => m.event.startsWith(`${b} Bldg`) || m.event.startsWith('A & B'))
    : timeline.milestones;
  const rows: Array<[string, string]> = b
    ? ms.map((m) => [m.date, m.event])
    : [
        [timeline.start, 'Project start'],
        ...ms.map((m): [string, string] => [m.date, m.event]),
        [timeline.current, `Status — ${timeline.currentProgress} complete (${timeline.elapsedMonths} of ${timeline.totalMonths} months)`],
        [timeline.finish, 'Project finish'],
      ];
  if (!rows.length) return null;
  return (
    <TableCard title="Milestones" head={['Date', 'Event']}>
      {rows.map(([d, e]) => (
        <tr key={d + e}>
          <Td className="whitespace-nowrap font-mono text-xs">{d}</Td>
          <Td>{e}</Td>
        </tr>
      ))}
    </TableCard>
  );
}

const SEVERITY_TONE: Record<ElenorRiskSeverity, Tone> = { High: 'bad', Medium: 'part', Low: 'none' };

function RiskTableCard({ b }: { b: ElenorBuilding }) {
  const scope = b === 'all' ? null : b === 'Development' ? 'Development' : `${b} Bldg.`;
  const risks = computeElenorRisks().filter((r) => scope === null || r.scope === scope);
  return (
    <TableCard
      title="Risk register"
      hint={`${risks.length} · ${(['High', 'Medium', 'Low'] as const).map((v) => `${risks.filter((r) => r.severity === v).length} ${v.toLowerCase()}`).join(' · ')}`}
      head={['Severity', 'Risk', 'Scope', 'Next step']}
    >
      {risks.map((r) => (
        <tr key={r.id}>
          <td className="px-3 py-2 whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Dot color={TONE[SEVERITY_TONE[r.severity]]} />
              {r.severity}
            </span>
          </td>
          <td className="px-3 py-2">
            <span className="block font-semibold text-slate-900">{r.title}</span>
            <span className="block text-xs text-slate-500">{r.reason}</span>
          </td>
          <Td className="whitespace-nowrap text-xs">{r.scope}</Td>
          <Td className="text-xs">{r.suggestedNextStep}</Td>
        </tr>
      ))}
    </TableCard>
  );
}

function BuildingSummaryTable({ b }: { b: Bldg }) {
  const info = bldgInfo(b);
  const u = info.upto;
  return (
    <TableCard
      title="Summary"
      hint="₹ Crore · monthly % of building"
      head={['', ...D.buildingWiseMonthly.map((m) => m.month)]}
      rightFrom={1}
    >
      <tr>
        <Td strong>Monthly actual</Td>
        {D.buildingWiseMonthly.map((m) => (
          <Td key={m.month} right>{`${m[info.monthKey].toFixed(2)}%`}</Td>
        ))}
      </tr>
      <tr>
        <td colSpan={D.buildingWiseMonthly.length + 1} className="px-3 py-2.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{u.project}</span> {u.detail} · budget{' '}
          <span className="font-mono font-semibold text-slate-900">₹{u.totalCost}</span> · planned {u.plannedPct} (₹{u.plannedCost}) · actual{' '}
          {u.actualPct} (₹{u.actualCost}) · effi {u.efficiency} · FY spend to Oct ₹{info.fyCost}
        </td>
      </tr>
    </TableCard>
  );
}

/* ================================== Pages ================================== */

function PageHeader({ title, building }: { title: string; building: ElenorBuilding }) {
  const label = building === 'all' ? 'Whole project' : bldgInfo(building).label;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-display text-xl font-semibold text-slate-900">
        {title} <span className="text-slate-400 font-normal">· {label}</span>
      </h2>
      <p className="font-mono text-xs text-slate-500">
        {D.reportRef} · upto {D.asOfDate}
      </p>
    </div>
  );
}

export function ElenorDashboardPage({
  building,
  onSelectBuilding,
}: {
  building: ElenorBuilding;
  onSelectBuilding: (b: ElenorBuilding) => void;
}) {
  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" building={building} />
      {building === 'all' ? <ProjectOverview onSelectBuilding={onSelectBuilding} /> : <BuildingView key={building} b={building} />}
    </div>
  );
}

export function ElenorTablesPage({ building }: { building: ElenorBuilding }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Detail Tables" building={building} />
      {building === 'all' ? (
        <>
          <ProjectTables />
          <TimelineTableCard />
          <RiskTableCard b="all" />
        </>
      ) : (
        <Fragment key={building}>
          <BuildingSummaryTable b={building} />
          <CostTableCard b={building} />
          <TargetsTableCard b={building} />
          {building !== 'Development' && <TowerTables b={building} />}
          {building !== 'Development' && <TimelineTableCard b={building} />}
          <RiskTableCard b={building} />
        </Fragment>
      )}
    </div>
  );
}
