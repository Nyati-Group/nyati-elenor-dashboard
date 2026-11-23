import { Fragment } from "react";
import { ChevronDown } from "lucide-react";
import { ELENOR_DATA, ElenorCostRow, ElenorTargetRow, TargetStatus } from "../../data/elenorData";

// The presentation tables, one click away (collapsed) under the visual pages.

const STATUS_STYLE: Record<Exclude<TargetStatus, null>, { dot: string; pill: string; short: string }> = {
  Achieved: { dot: '#16A34A', pill: 'bg-emerald-50 text-emerald-800 border-emerald-200', short: 'Achieved' },
  'Partly Done': { dot: '#D97706', pill: 'bg-amber-50 text-amber-800 border-amber-200', short: 'Partly' },
  Failed: { dot: '#DC2626', pill: 'bg-red-50 text-red-800 border-red-200', short: 'Failed' },
};


function effTone(eff: string | number | null): string {
  if (eff === null || eff === '') return 'text-slate-400';
  const n = typeof eff === 'number' ? eff : parseFloat(eff);
  if (n >= 85) return 'text-emerald-700';
  if (n >= 60) return 'text-amber-700';
  return 'text-red-700';
}


function StatusPill({ status }: { status: TargetStatus }) {
  if (!status) return null;
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] font-semibold ${s.pill}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
      {s.short}
    </span>
  );
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

function Dash() {
  return <span className="text-slate-300">—</span>;
}

/** Collapsible "as presented" tables — keeps the slide data one click away without cluttering the page. */
function SourceTables({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white">
      <summary className="no-print flex cursor-pointer list-none items-center justify-between gap-3 px-5 sm:px-6 py-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-2xl">
        <span>
          {label}
          <span className="ml-2 font-normal text-slate-500">· exact figures as presented in {ELENOR_DATA.reportRef}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-8 px-5 sm:px-6 pb-6 pt-2">{children}</div>
    </details>
  );
}

function TableTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-2">
      <h4 className="text-sm font-semibold text-slate-900">{children}</h4>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function TargetTable({ title, rows }: { title: string; rows: ElenorTargetRow[] }) {
  return (
    <div>
      <TableTitle sub="3rd Quarter : October – December 2026">{title}</TableTitle>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <Th>Activity</Th>
              <Th>Target – Oct</Th>
              <Th>Status – Oct</Th>
              <Th>Target – Nov</Th>
              <Th>Target – Dec</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.activity}>
                <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">{r.activity}</td>
                <td className="px-3 py-2 text-slate-700">{r.targetOct}</td>
                <td className="px-3 py-2">
                  <span className="text-slate-800">{r.statusOct}</span> <StatusPill status={r.status} />
                </td>
                <td className="px-3 py-2 text-slate-700">{r.targetNov}</td>
                <td className="px-3 py-2 text-slate-700">{r.targetDec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function statusTextClass(text: string): string {
  const t = text.toLowerCase();
  if (t.startsWith('not given') || t.startsWith('not done')) return 'text-red-700 font-semibold';
  if (t === 'given' || t === 'completed') return 'text-emerald-700 font-semibold';
  if (t.startsWith('part')) return 'text-sky-700 font-medium';
  if (t.includes('done') || t.includes('given')) return 'text-emerald-700 font-medium';
  return 'text-slate-700';
}

export function ExecutionSourceTables() {
  const { targetVsActual, aluformCasting, highriseStatus, bulkPurchasing, contractorDeployment, asOfDate } = ELENOR_DATA;
  return (
    <SourceTables label="Source tables — targets, Aluform dates, Highrise, purchasing, contractors">
      <TargetTable title="A Building — Target vs Actual" rows={targetVsActual.A} />
      <TargetTable title="B Building — Target vs Actual" rows={targetVsActual.B} />
      <TargetTable title="Development — Target vs Actual" rows={targetVsActual.Development} />

      <div>
        <TableTitle sub={aluformCasting.note}>Aluform floor casting dates (8th–32nd floor not yet cast)</TableTitle>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <Th>Floor</Th>
                <Th>A Bldg. date</Th>
                <Th className="text-right">A cycle</Th>
                <Th>B Bldg. date</Th>
                <Th className="text-right">B cycle</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {aluformCasting.A.map((a, i) => {
                const b = aluformCasting.B[i];
                return (
                  <tr key={a.floor}>
                    <td className="px-3 py-2 font-sans font-semibold text-slate-900">{a.floor}</td>
                    <td className="px-3 py-2">{a.date ?? <Dash />}</td>
                    <td className="px-3 py-2 text-right">{a.cycle ?? <Dash />}</td>
                    <td className="px-3 py-2">{b?.date ?? <Dash />}</td>
                    <td className="px-3 py-2 text-right">{b?.cycle ?? <Dash />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <TableTitle>Activity-wise actual vs Highrise work status — upto {asOfDate}</TableTitle>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <Th>Activity</Th>
                <Th>A actual</Th>
                <Th>A Highrise</Th>
                <Th>B actual</Th>
                <Th>B Highrise</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {highriseStatus.map((r) => (
                <tr key={r.activity}>
                  <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">{r.activity}</td>
                  <td className="px-3 py-2 text-slate-800">{r.aActual}</td>
                  <td className={`px-3 py-2 font-semibold ${r.aTone === 'open' ? 'text-red-700' : 'text-sky-700'}`}>{r.aHighrise}</td>
                  <td className="px-3 py-2 text-slate-800">{r.bActual}</td>
                  <td className={`px-3 py-2 font-semibold ${r.bTone === 'open' ? 'text-red-700' : 'text-sky-700'}`}>{r.bHighrise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <TableTitle sub="PO processing and lead time in days">Bulk purchasing — {bulkPurchasing.ref}</TableTitle>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <Th>Item</Th>
                <Th className="text-right">PO</Th>
                <Th className="text-right">Lead</Th>
                <Th>Bldg.</Th>
                <Th>Planned</Th>
                <Th>Req. date</Th>
                <Th>Req. status</Th>
                <Th>PO status</Th>
                <Th>Delivery</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bulkPurchasing.rows.map((r) =>
                r.a || r.b ? (
                  (['a', 'b'] as const).map((k, i) => {
                    const s = r[k];
                    return (
                      <tr key={`${r.sr}-${k}`}>
                        {i === 0 && (
                          <>
                            <td rowSpan={2} className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap align-top">{r.item}</td>
                            <td rowSpan={2} className="px-3 py-2 text-right font-mono align-top">{r.poProcessing}</td>
                            <td rowSpan={2} className="px-3 py-2 text-right font-mono align-top">{r.leadTime}</td>
                          </>
                        )}
                        <td className="px-3 py-2 font-semibold text-slate-600">{k.toUpperCase()}</td>
                        {s ? (
                          <>
                            <td className="px-3 py-2 font-mono whitespace-nowrap">{s.planned}</td>
                            <td className="px-3 py-2 font-mono whitespace-nowrap">{s.reqDate}</td>
                            <td className={`px-3 py-2 ${statusTextClass(s.reqStatus)}`}>{s.reqStatus}</td>
                            <td className={`px-3 py-2 ${statusTextClass(s.poStatus)}`}>{s.poStatus}</td>
                            <td className={`px-3 py-2 ${statusTextClass(s.delivery)}`}>{s.delivery}</td>
                          </>
                        ) : (
                          <td colSpan={5} className="px-3 py-2 text-xs text-slate-400">Not yet scheduled</td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr key={r.sr}>
                    <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">{r.item}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.poProcessing}</td>
                    <td className="px-3 py-2 text-right font-mono">{r.leadTime}</td>
                    <td colSpan={6} className="px-3 py-2 text-xs text-slate-400">Not yet scheduled (A & B)</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <TableTitle sub="Processing time in days · WO status w.r.t. Highrise">Contractor deployment — {contractorDeployment.ref}</TableTitle>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <Th>Contractor</Th>
                <Th className="text-right">Proc.</Th>
                <Th>A planned</Th>
                <Th>A WO</Th>
                <Th>A labour</Th>
                <Th>A WO status</Th>
                <Th>B planned</Th>
                <Th>B WO</Th>
                <Th>B labour</Th>
                <Th>B WO status</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contractorDeployment.rows.map((r) => (
                <tr key={r.sr}>
                  <td className="px-3 py-2 font-semibold text-slate-900 whitespace-nowrap">{r.contractor}</td>
                  <td className="px-3 py-2 text-right font-mono">{r.processing}</td>
                  {[r.a, r.b].map((s, i) =>
                    s ? (
                      <Fragment key={i}>
                        <td className="px-3 py-2 font-mono whitespace-nowrap">{s.planned}</td>
                        <td className="px-3 py-2 font-mono whitespace-nowrap">{s.wo}</td>
                        <td className={`px-3 py-2 whitespace-nowrap ${statusTextClass(s.labour)}`}>{s.labour}</td>
                        <td className={`px-3 py-2 whitespace-nowrap ${statusTextClass(s.woStatus)}`}>{s.woStatus}</td>
                      </Fragment>
                    ) : (
                      <td key={i} colSpan={4} className="px-3 py-2 text-xs text-slate-400">
                        Not yet scheduled
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SourceTables>
  );
}


function CostTable({ title, rows }: { title: string; rows: ElenorCostRow[] }) {
  return (
    <div>
      <TableTitle sub="Amounts in ₹ Lacs · up to date">{title}</TableTitle>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-y border-slate-200">
            <tr>
              <Th>Task name</Th>
              <Th className="text-right">Baseline</Th>
              <Th className="text-right">Planned %</Th>
              <Th className="text-right">Planned cost</Th>
              <Th className="text-right">Actual %</Th>
              <Th className="text-right">Actual cost</Th>
              <Th className="text-right">Effi.</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const rowClass = r.level === 'total' ? 'bg-sky-50/70' : r.level === 'group' ? 'bg-amber-50/60' : '';
              const nameClass = r.level === 'total' ? 'font-semibold text-red-700' : r.level === 'group' ? 'font-semibold text-slate-900' : 'text-slate-800';
              const cell = (v: string | null, extra = '') => <td className={`px-3 py-1.5 text-right font-mono tabular-nums ${extra}`}>{v ?? <Dash />}</td>;
              return (
                <tr key={r.name} className={rowClass}>
                  <td className={`px-3 py-1.5 ${r.indent ? 'pl-7' : ''} ${nameClass}`}>{r.name}</td>
                  {cell(r.baseline, 'font-semibold text-slate-900')}
                  {cell(r.plannedPct, 'text-slate-700')}
                  {cell(r.plannedCost, 'text-slate-700')}
                  {cell(r.actualPct)}
                  {cell(r.actualCost)}
                  <td className={`px-3 py-1.5 text-right font-mono tabular-nums font-semibold ${effTone(r.efficiency)}`}>{r.efficiency ?? <Dash />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CostSourceTables() {
  const { uptoDateStatus, statusSummary, buildingProgress, fyActualCostUptoOct } = ELENOR_DATA;
  return (
    <SourceTables label="Source tables — upto date status, FY status, building-wise progress">
      <div>
        <TableTitle sub="Amounts in ₹ Crore">Upto date status — from start of the project</TableTitle>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <Th>Project</Th>
                <Th className="text-right">Total cost</Th>
                <Th className="text-right">Planned %</Th>
                <Th className="text-right">Planned cost</Th>
                <Th className="text-right">Actual %</Th>
                <Th className="text-right">Actual cost</Th>
                <Th className="text-right">Effi.</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {uptoDateStatus.map((r) => (
                <tr key={r.project} className={r.isTotal ? 'bg-slate-50' : ''}>
                  <td className="px-3 py-2 font-sans">
                    <span className={`font-semibold ${r.isTotal ? 'text-red-700' : 'text-slate-900'}`}>{r.project}</span>
                    {r.detail && <span className="block text-xs text-slate-500">{r.detail}</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">{r.totalCost}</td>
                  <td className="px-3 py-2 text-right">{r.plannedPct}</td>
                  <td className="px-3 py-2 text-right">{r.plannedCost}</td>
                  <td className="px-3 py-2 text-right">{r.actualPct}</td>
                  <td className="px-3 py-2 text-right">{r.actualCost}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${effTone(r.efficiency)}`}>{r.efficiency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <TableTitle>Status · cost · efficiency</TableTitle>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <Th>Period</Th>
                <Th className="text-right">Actual %</Th>
                <Th className="text-right">Actual cost</Th>
                <Th className="text-right">Planned %</Th>
                <Th className="text-right">Planned cost</Th>
                <Th className="text-right">Efficiency</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {statusSummary.map((r) => (
                <tr key={r.period}>
                  <td className="px-3 py-2 font-sans font-semibold text-slate-900">{r.period}</td>
                  <td className="px-3 py-2 text-right">{r.actualPct}</td>
                  <td className="px-3 py-2 text-right">{r.actualCost}</td>
                  <td className="px-3 py-2 text-right">{r.plannedPct}</td>
                  <td className="px-3 py-2 text-right">{r.plannedCost}</td>
                  <td className="px-3 py-2 text-right font-semibold text-red-700">{r.efficiency}</td>
                </tr>
              ))}
              <tr>
                <td className="px-3 py-2 font-sans text-slate-700" colSpan={6}>
                  Actual cost (Cr.) for FY upto October-26 — A Bldg <span className="font-mono font-semibold">{fyActualCostUptoOct.aBldg}</span> · B Bldg{' '}
                  <span className="font-mono font-semibold">{fyActualCostUptoOct.bBldg}</span> · Development{' '}
                  <span className="font-mono font-semibold">{fyActualCostUptoOct.development}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <CostTable title="Building-wise progress: A Building" rows={buildingProgress.A} />
      <CostTable title="Building-wise progress: B Building" rows={buildingProgress.B} />
      <CostTable title="Building-wise progress: Development" rows={buildingProgress.Development} />
    </SourceTables>
  );
}

