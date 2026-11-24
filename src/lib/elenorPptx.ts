// Builds the Nyati Elenor "Progress Review Presentation" (PLN/407) as a .pptx,
// following the layout and styling of the source deck slide-for-slide.
// All figures come from ELENOR_DATA — nothing is added or estimated.
import PptxGenJS from 'pptxgenjs';
import { ELENOR_DATA, ElenorCostRow, ElenorTargetRow, TargetStatus } from '../data/elenorData';

type Slide = PptxGenJS.Slide;
type Cell = PptxGenJS.TableCell;
// pptxgenjs supports these on table cells at runtime, but its typings omit them.
type CellOpts = PptxGenJS.TableCellProps & { superscript?: boolean; vert?: 'vert270' };

export type DeckImages = Partial<Record<'cover' | 'agenda1' | 'agenda2' | 'thanks' | 'iconOpen' | 'iconClosed', string>>;

const D = ELENOR_DATA;
const W = 13.333;
const H = 7.5;

const FONT = 'Book Antiqua';
const DECO = 'Algerian';
const NAVY = '0B1F33';
const BLUE = '0070C0';
const RED = 'FF0000';
const GREEN = '00B050';
const LINK_BLUE = '0000FF';
const DECOR_LINE = 'D9C3C8';
const BORDER = { type: 'solid' as const, pt: 0.75, color: '000000' };

/* -------------------------------- helpers -------------------------------- */

/** A straight line between two points (pptxgenjs needs a box + flip). */
function line(slide: Slide, x1: number, y1: number, x2: number, y2: number, color = DECOR_LINE, width = 0.75, extra: Partial<PptxGenJS.ShapeLineProps> = {}) {
  slide.addShape('line', {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    w: Math.max(0.001, Math.abs(x2 - x1)),
    h: Math.max(0.001, Math.abs(y2 - y1)),
    flipV: (x2 - x1) * (y2 - y1) < 0,
    line: { color, width, ...extra },
  });
}

/** The thin pink diagonal lines that run across every content slide. */
function decor(slide: Slide) {
  line(slide, 0, 0.95, 3.4, 0);
  line(slide, 1.0, 0, 0.15, 7.5);
  line(slide, 11.8, 0, W, 4.2);
  line(slide, 9.6, 0, W, 1.0);
  line(slide, 0, 6.35, 6.8, H);
  line(slide, 9.3, H, W, 6.4);
}

/** Splits "12th & 13th Floor" into text runs with superscript ordinals. */
function ordRuns(text: string, base: CellOpts = {}): Cell[] {
  const runs: Cell[] = [];
  const re = /(\d+)(st|nd|rd|th)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index), options: base });
    runs.push({ text: m[1], options: base });
    runs.push({ text: m[2], options: { ...base, superscript: true } as CellOpts });
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), options: base });
  return runs.length ? runs : [{ text, options: base }];
}

function cell(text: string, opts: CellOpts = {}): Cell {
  return { text, options: opts };
}

function ordCell(text: string, opts: CellOpts = {}): Cell {
  const { fill, align, valign, rowspan, colspan, margin, ...run } = opts;
  return { text: ordRuns(text, run), options: { fill, align, valign, rowspan, colspan, margin } as CellOpts };
}

function title(slide: Slide, parts: Array<{ text: string; color?: string; italic?: boolean; superscript?: boolean; underline?: boolean; breakLine?: boolean }>, opts: Partial<PptxGenJS.TextPropsOptions> = {}) {
  slide.addText(
    parts.map((p) => ({
      text: p.text,
      options: {
        color: p.color ?? NAVY,
        italic: p.italic ?? true,
        superscript: p.superscript,
        underline: p.underline ? { style: 'sng' as const } : undefined,
        breakLine: p.breakLine,
      },
    })),
    {
      x: 0.1,
      y: 0.05,
      w: W - 0.2,
      h: 0.8,
      align: 'center',
      valign: 'middle',
      fontFace: FONT,
      fontSize: 34,
      bold: true,
      shadow: { type: 'outer', color: '7F7F7F', blur: 2, offset: 2, angle: 45, opacity: 0.45 },
      ...opts,
    }
  );
}

function decoTitle(slide: Slide, black: string, red: string, opts: Partial<PptxGenJS.TextPropsOptions> = {}) {
  slide.addText(
    [
      { text: black, options: { color: '000000' } },
      { text: red, options: { color: 'E00000' } },
    ],
    { x: 0.1, y: 0.05, w: W - 0.2, h: 0.65, align: 'center', fontFace: DECO, fontSize: 30, ...opts }
  );
}

const STATUS_FILL: Record<Exclude<TargetStatus, null>, string> = {
  Achieved: '92D050',
  'Partly Done': 'FFFFCC',
  Failed: 'FF8080',
};

function legend(slide: Slide, y = 7.12) {
  const items: Array<[string, string]> = [
    ['ACHIEVED', STATUS_FILL.Achieved],
    ['PARTLY DONE', STATUS_FILL['Partly Done']],
    ['FAILED', STATUS_FILL.Failed],
  ];
  items.forEach(([label, fill], i) => {
    slide.addText(label, {
      x: 0.1 + i * 1.45,
      y,
      w: 1.35,
      h: 0.27,
      fontFace: FONT,
      fontSize: 10,
      bold: true,
      align: 'center',
      valign: 'middle',
      fill: { color: fill },
      line: { color: '000000', width: 0.75 },
    });
  });
}

/* --------------------------------- slides --------------------------------- */

function coverSlide(pptx: PptxGenJS, img: DeckImages) {
  const s = pptx.addSlide();
  s.background = { color: 'FFFFFF' };
  // Light-blue band with a diagonal edge over a warm grey panel.
  s.addShape('rect', { x: 0, y: 0, w: 5.45, h: H, fill: { color: 'BEE3F5' }, line: { color: 'BEE3F5', width: 0 } });
  s.addShape('rect', { x: 0, y: 0, w: 3.0, h: H, fill: { color: 'EFEBEB' }, line: { color: 'EFEBEB', width: 0 } });
  s.addShape('rtTriangle', { x: 3.0, y: 0, w: 1.9, h: H, flipV: true, fill: { color: 'EFEBEB' }, line: { color: 'EFEBEB', width: 0 } });
  line(s, 0, 0.85, 4.7, 0.3, 'C9A9AE');
  line(s, 4.35, 0, 3.95, 4.2, 'C9A9AE');
  line(s, 0, 6.65, 3.1, 7.0, 'C9A9AE');
  if (img.cover) s.addImage({ data: img.cover, x: 5.4, y: 0, w: W - 5.4, h: H, sizing: { type: 'cover', w: W - 5.4, h: H } });
  s.addText('PROGRESS\nREVIEW\nPRESENTATION', { x: 0.2, y: 1.6, w: 4.6, h: 2.0, align: 'center', fontFace: FONT, fontSize: 36, bold: true, color: NAVY });
  s.addText('NYATI ELENOR', { x: 0.2, y: 3.75, w: 4.6, h: 0.65, align: 'center', fontFace: FONT, fontSize: 32, bold: true, color: BLUE });
  s.addText(D.reportPeriod.toUpperCase(), { x: 0.2, y: 4.45, w: 4.6, h: 0.6, align: 'center', fontFace: FONT, fontSize: 24, bold: true, color: NAVY });
  s.addText(D.reportRef, { x: 11.6, y: 0.08, w: 1.65, h: 0.4, align: 'right', fontFace: FONT, fontSize: 16, bold: true, color: 'C00000' });
}

function agendaSlide(pptx: PptxGenJS, img: DeckImages) {
  const s = pptx.addSlide();
  s.addShape('rect', { x: 0, y: 0, w: 3.3, h: H, fill: { color: 'EFEBEB' }, line: { color: 'EFEBEB', width: 0 } });
  s.addShape('rtTriangle', { x: 3.3, y: 0, w: 2.25, h: H, flipV: true, fill: { color: 'EFEBEB' }, line: { color: 'EFEBEB', width: 0 } });
  line(s, 0, 5.8, 6.7, H, 'C9A9AE');
  if (img.agenda1) s.addImage({ data: img.agenda1, x: 10.43, y: 0, w: 2.9, h: 3.68, sizing: { type: 'cover', w: 2.9, h: 3.68 } });
  if (img.agenda2) s.addImage({ data: img.agenda2, x: 10.43, y: 3.7, w: 2.9, h: 3.8, sizing: { type: 'cover', w: 2.9, h: 3.8 } });
  s.addText('AGENDA', { x: 0.65, y: 0.35, w: 5, h: 0.85, fontFace: 'Arial', fontSize: 40, bold: true, italic: true, color: BLUE });
  const items = ['Project Information', 'Upto Date Status From Start of Project', 'Status for the Month', 'Details'];
  s.addText(
    items.map((t) => ({ text: t, options: { bullet: { code: '27A2' }, breakLine: true } })),
    { x: 0.65, y: 2.8, w: 9.5, h: 2.5, fontFace: FONT, fontSize: 28, bold: true, color: NAVY, paraSpaceAfter: 10, valign: 'top' }
  );
}

function projectInfoSlide(pptx: PptxGenJS) {
  const s = pptx.addSlide();
  decor(s);
  title(s, [{ text: 'PROJECT INFORMATION' }]);
  D.projectInfo.forEach((row, i) => {
    const y = 1.2 + i * 0.68;
    s.addText(
      [
        { text: '➢', options: { fontSize: 20 } },
        { text: `${row.label}:` },
      ],
      { x: 0.2, y, w: 5.0, h: 0.6, fontFace: FONT, fontSize: 28, bold: true, color: NAVY }
    );
    const v = row.value.replace(/^NYATI ELENOR$/, 'NYATI ELENOR');
    s.addText(ordRunsText(v), { x: 5.15, y, w: 8, h: 0.6, fontFace: FONT, fontSize: 28, bold: true, color: BLUE });
  });
}

/** Ordinal superscripts for plain text boxes ("1st December 2024"). */
function ordRunsText(text: string): PptxGenJS.TextProps[] {
  return ordRuns(text).map((r) => ({ text: String(r.text), options: { superscript: (r.options as CellOpts | undefined)?.superscript } }));
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function monthOffset(label: string) {
  const [m, y] = label.trim().split(/\s+/);
  return (Number(y) - 2024) * 12 + MONTHS.indexOf(m.slice(0, 3).toUpperCase()) - 11;
}

function timelineSlide(pptx: PptxGenJS) {
  const s = pptx.addSlide();
  const t = D.timeline;
  decor(s);
  title(s, [{ text: 'PROJECT TIMELINE', color: BLUE }], { y: 0, h: 0.6, fontSize: 36 });

  const x0 = 0.42;
  const x1 = 12.95;
  const axisY = 3.92;
  const xAt = (off: number) => x0 + (off / t.totalMonths) * (x1 - x0);

  // Axis
  line(s, x0, axisY, x1 + 0.1, axisY - 0.05, '000000', 3, { endArrowType: 'triangle' });
  // Start / finish
  s.addShape('ellipse', { x: x0 - 0.1, y: axisY - 0.1, w: 0.2, h: 0.2, fill: { color: '92D050' }, line: { color: '6A9A3A', width: 0.75 } });
  s.addShape('upArrow', { x: x0 - 0.08, y: 1.5, w: 0.18, h: 2.3, fill: { color: 'DDF0FA' }, line: { color: '4A90C2', width: 0.75 } });
  s.addText(
    [
      { text: t.start, options: { bold: true, breakLine: true } },
      { text: 'PROJECT', options: { underline: { style: 'sng' }, breakLine: true } },
      { text: 'START', options: { underline: { style: 'sng' } } },
    ],
    { x: 0, y: 0.85, w: 0.9, h: 0.65, fontFace: FONT, fontSize: 11, color: '000000', align: 'center', valign: 'top' }
  );
  s.addShape('upArrow', { x: x1 - 0.08, y: 3.15, w: 0.18, h: 0.7, fill: { color: 'DDF0FA' }, line: { color: '4A90C2', width: 0.75 } });
  s.addText(
    [
      { text: t.finish.replace(' ', '\n'), options: { bold: true, breakLine: true } },
      { text: 'PROJECT', options: { underline: { style: 'sng' }, breakLine: true } },
      { text: 'FINISH', options: { underline: { style: 'sng' } } },
    ],
    { x: x1 - 0.65, y: 2.0, w: 1.3, h: 1.15, fontFace: FONT, fontSize: 15, bold: true, color: '000000', align: 'center', valign: 'top' }
  );

  // Milestones
  const labelY = [1.02, 1.38, 1.73, 2.07, 2.53];
  t.milestones.forEach((m, i) => {
    const x = xAt(monthOffset(m.date) + 0.5);
    const ly = labelY[i] ?? 1.0 + i * 0.4;
    line(s, x, axisY, x, ly + 0.25, '000000', 0.75, { endArrowType: 'triangle' });
    s.addShape('diamond', { x: x - 0.12, y: axisY - 0.12, w: 0.24, h: 0.24, fill: { color: 'FFFF00' }, line: { color: '8A8A00', width: 0.75 } });
    const highlight = i >= 3;
    s.addText(
      [
        { text: m.date, options: { color: LINK_BLUE, underline: { style: 'sng' } } },
        ...ordRunsText(` ${m.event}`),
      ],
      {
        x: x - 0.05,
        y: ly,
        w: 4.4,
        h: 0.28,
        fontFace: FONT,
        fontSize: 11,
        bold: true,
        color: '000000',
        fill: highlight ? { color: 'FFFFCC' } : undefined,
      }
    );
  });

  // Current status
  const cx = xAt(t.elapsedMonths);
  s.addShape('ellipse', { x: cx - 0.15, y: axisY - 0.15, w: 0.3, h: 0.3, fill: { color: '92D050' }, line: { color: '6A9A3A', width: 0.75 } });
  s.addText(t.current, { x: cx - 1, y: axisY + 0.15, w: 2, h: 0.3, align: 'center', fontFace: FONT, fontSize: 13, bold: true, color: '000000' });
  s.addText(t.currentProgress, { x: cx - 1, y: axisY + 0.42, w: 2, h: 0.28, align: 'center', fontFace: FONT, fontSize: 13, bold: true, color: RED });

  // Elapsed / total spans
  line(s, x0 - 0.05, 5.37, cx + 0.05, 5.37, '1F5F6B', 3, { beginArrowType: 'triangle', endArrowType: 'triangle' });
  s.addText(`${t.elapsedMonths} MONTHS`, { x: (x0 + cx) / 2 - 0.7, y: 5.45, w: 1.4, h: 0.32, align: 'center', fontFace: FONT, fontSize: 13, bold: true, fill: { color: 'E6CFCB' } });
  line(s, x0, 6.5, x1, 6.5, '000000', 1.5, { dashType: 'lgDash' });
  line(s, x0, 6.35, x0, 6.5, '000000', 1.5);
  line(s, x1, 6.35, x1, 6.5, '000000', 1.5);
  s.addText(`${t.totalMonths} MONTHS`, { x: (x0 + x1) / 2 - 0.85, y: 6.78, w: 1.7, h: 0.36, align: 'center', fontFace: FONT, fontSize: 15, bold: true, fill: { color: '7FD0E6' } });
}

function uptoDateSlide(pptx: PptxGenJS) {
  const s = pptx.addSlide();
  decor(s);
  title(s, [{ text: 'UPTO DATE STATUS - FROM START OF THE PROJECT' }], { fontSize: 30 });
  const hdr = (t: string): Cell => cell(t, { fill: { color: 'CCE8F8' }, bold: true, align: 'center', fontSize: 20 });
  const rows: Cell[][] = [
    [cell('PROJECT', { fill: { color: 'CCE8F8' }, bold: true, fontSize: 28, align: 'center' }), hdr('TOTAL COST IN Cr'), hdr('PLANNED %'), hdr('PLANNED COST In Cr.'), hdr('ACTUAL %'), hdr('ACTUAL COST In Cr.'), hdr('EFFI. %')],
  ];
  D.uptoDateStatus.forEach((r) => {
    const tot = r.isTotal;
    const name = r.detail ? `${r.project}\n${r.detail}` : r.project;
    const base: CellOpts = { align: 'center', bold: true, fontSize: 20, fill: tot ? { color: 'E7E6E6' } : undefined };
    rows.push([
      cell(name, { ...base, align: 'left', fontSize: tot ? 20 : 15, color: tot ? RED : '000000' }),
      cell(r.totalCost, { ...base, color: RED }),
      cell(r.plannedPct, { ...base, color: tot ? RED : BLUE }),
      cell(r.plannedCost, { ...base, color: tot ? RED : BLUE }),
      cell(r.actualPct, { ...base, color: tot ? RED : GREEN }),
      cell(r.actualCost, { ...base, color: tot ? RED : GREEN }),
      cell(r.efficiency, { ...base, color: tot ? RED : '000000' }),
    ]);
  });
  s.addTable(rows, {
    x: 0.15,
    y: 0.9,
    w: 13.0,
    colW: [3.05, 1.42, 1.85, 1.8, 1.65, 1.65, 1.58],
    rowH: [1.35, 0.95, 1.05, 1.15, 0.95],
    fontFace: FONT,
    color: NAVY,
    valign: 'middle',
    border: BORDER,
  });
}

function statusSummarySlide(pptx: PptxGenJS) {
  const s = pptx.addSlide();
  decor(s);
  const black = { color: '000000' };
  const hdr = (t: string): Cell => cell(t, { fill: black, color: 'FFFFFF', bold: true, align: 'center', fontSize: t === 'EFFICIENCY' ? 20 : 26 });
  const sep: Cell[] = [cell('', { fill: black, colspan: 5 })];
  const rows: Cell[][] = [[hdr('NYATI ELENOR'), hdr('STATUS'), hdr('%'), hdr('COST'), hdr('EFFICIENCY')]];
  D.statusSummary.forEach((r, i) => {
    const label: Cell =
      i === 0
        ? cell('UPTO DATE PROGRESS', { rowspan: 2, bold: true, fontSize: 18, align: 'center' })
        : {
            text: [
              { text: 'PROGRESS FOR', options: { breakLine: true } },
              { text: 'FY 2026-27', options: { color: BLUE } },
              { text: ' Upto', options: { breakLine: true } },
              { text: 'October 2026' },
            ],
            options: { rowspan: 2, bold: true, fontSize: 18, align: 'center' },
          };
    const a: CellOpts = { fill: { color: 'BDEBC1' }, bold: true, fontSize: 18, align: 'center' };
    const p: CellOpts = { fill: { color: 'C5E6F6' }, bold: true, fontSize: 18, align: 'center' };
    rows.push([label, cell('ACTUAL', a), cell(r.actualPct, a), cell(r.actualCost, a), cell(r.efficiency, { rowspan: 2, color: RED, fontSize: 22, align: 'center' })]);
    rows.push([cell('PLANNED', p), cell(r.plannedPct, p), cell(r.plannedCost, p)]);
    rows.push(sep);
  });
  s.addTable(rows, {
    x: 0.1,
    y: 0.15,
    w: 13.05,
    colW: [4.25, 2.2, 2.1, 2.05, 2.45],
    rowH: [1.25, 0.8, 0.8, 0.25, 0.8, 0.8, 0.25],
    fontFace: FONT,
    color: '000000',
    valign: 'middle',
    border: { type: 'solid', pt: 1, color: 'FFFFFF' },
  });
}

function monthwiseSlide(pptx: PptxGenJS) {
  const s = pptx.addSlide();
  decor(s);
  title(s, [{ text: 'MONTHWISE PROGRESS - ', color: BLUE }, { text: 'NYATI ELENOR', color: '000000' }], { shadow: undefined, fontSize: 34 });
  const m = D.monthwise;
  const labels = m.map((x) => x.month);
  s.addChart(
    'line',
    [
      { name: 'PLANNED %', labels, values: m.map((x) => x.planned) },
      { name: 'ACTUAL %', labels, values: m.map((x) => x.actual) },
    ],
    {
      x: 1.2,
      y: 0.85,
      w: 12.1,
      h: 5.0,
      chartColors: ['1F6FE5', '92D050'],
      lineSize: 3,
      lineDataSymbol: 'circle',
      lineDataSymbolSize: 7,
      showLegend: true,
      legendPos: 't',
      legendFontFace: 'Arial',
      legendFontSize: 13,
      showValue: true,
      dataLabelFormatCode: '0.00"%"',
      dataLabelFontSize: 11,
      dataLabelFontBold: true,
      dataLabelPosition: 't',
      valAxisMinVal: 0,
      valAxisMaxVal: 1.6,
      valAxisMajorUnit: 0.8,
      valAxisLabelFormatCode: '0.00"%"',
      valAxisLabelFontSize: 11,
      valGridLine: { style: 'none' },
      catAxisLabelFontSize: 1,
      catAxisLabelColor: 'FFFFFF',
      catGridLine: { color: '7F7F7F', style: 'dash', size: 0.75 },
    }
  );
  const head: Cell[] = [cell(''), ...labels.map((l) => cell(l, { bold: true, align: 'center' }))];
  const row = (label: string, color: string, vals: string[]): Cell[] => [
    { text: [{ text: '━◆━ ', options: { color } }, { text: label, options: { color: '000000' } }], options: { align: 'left' } },
    ...vals.map((v) => cell(v, { align: 'center' })),
  ];
  s.addTable(
    [
      head,
      row('PLANNED %', '1F6FE5', m.map((x) => `${x.planned.toFixed(2)}%`)),
      row('ACTUAL %', '92D050', m.map((x) => `${x.actual.toFixed(2)}%`)),
      row('EFFICIENCY', '9C6B30', m.map((x) => `${x.efficiency}%`)),
    ],
    {
      x: 0.05,
      y: 5.9,
      w: 13.25,
      colW: [1.85, ...labels.map(() => (13.25 - 1.85) / labels.length)],
      rowH: 0.36,
      fontFace: 'Arial',
      fontSize: 11,
      margin: [0, 0.04, 0, 0.04],
      bold: true,
      color: '000000',
      valign: 'middle',
      border: { type: 'solid', pt: 0.5, color: 'D9D9D9' },
    }
  );
}

function buildingMonthlySlide(pptx: PptxGenJS) {
  const s = pptx.addSlide();
  decor(s);
  title(s, [{ text: 'MONTHLY PROGRESS – ', color: BLUE }, { text: 'BUILDING-WISE', color: '000000' }], { shadow: undefined, y: 0, h: 0.6, fontSize: 32 });
  const b = D.buildingWiseMonthly;
  const labels = b.map((x) => x.month);
  s.addChart(
    'bar',
    [
      { name: 'A BLDG.', labels, values: b.map((x) => x.aBldg) },
      { name: 'B BLDG.', labels, values: b.map((x) => x.bBldg) },
      { name: 'Dev.', labels, values: b.map((x) => x.dev) },
    ],
    {
      x: 0.1,
      y: 0.6,
      w: 13.1,
      h: 5.4,
      barDir: 'col',
      barGrouping: 'stacked',
      barGapWidthPct: 150,
      chartColors: ['FFFF00', '8497A0', 'FFC000'],
      border: { pt: 1, color: '000000' },
      showLegend: true,
      legendPos: 'l',
      legendFontFace: FONT,
      legendFontSize: 16,
      showValue: true,
      dataLabelFormatCode: '0.00"%"',
      dataLabelFontFace: FONT,
      dataLabelFontSize: 10,
      dataLabelFontBold: true,
      dataLabelColor: '1F2937',
      valAxisHidden: true,
      valGridLine: { style: 'none' },
      catAxisLabelFontFace: FONT,
      catAxisLabelFontSize: 11,
      catAxisLabelFontBold: true,
    }
  );
  const fy = D.fyActualCostUptoOct;
  s.addTable(
    [
      [
        cell('', { border: [{ type: 'none' }, { type: 'none' }, BORDER, { type: 'none' }] }),
        cell('A BLDG', { fill: { color: 'FFFF00' }, align: 'center' }),
        cell('B BLDG', { fill: { color: '8497A0' }, align: 'center' }),
        cell('DEVELOPMENT', { fill: { color: 'A9A1F5' }, align: 'center' }),
      ],
      [
        cell('ACTUAL COST (Cr.) FOR FY UPTO OCTOBER-26', { fill: { color: BLUE }, color: 'FFFFFF', fontSize: 14 }),
        cell(fy.aBldg, { align: 'center' }),
        cell(fy.bBldg, { align: 'center' }),
        cell(fy.development, { align: 'center' }),
      ],
    ],
    { x: 0.1, y: 6.1, w: 13.15, colW: [4.4, 2.92, 2.92, 2.91], rowH: [0.45, 0.8], fontFace: FONT, fontSize: 15, bold: true, color: '000000', valign: 'middle', border: { type: 'solid', pt: 1.5, color: '000000' } }
  );
}

function targetSlide(pptx: PptxGenJS, bldg: 'A' | 'B' | 'Development', rows: ElenorTargetRow[]) {
  const s = pptx.addSlide();
  decor(s);
  title(
    s,
    [{ text: 'TARGET VS ACTUAL FOR 3' }, { text: 'rd', superscript: true }, { text: ' QUARTER : OCTOBER – DECEMBER 2026' }],
    { shadow: undefined, fontSize: 26, y: 0, h: 0.6 }
  );
  const hdr = (t: string, fill: string): Cell => cell(t, { fill: { color: fill }, bold: true, align: 'center', fontSize: 15 });
  const table: Cell[][] = [
    [hdr('BLD\nG.', 'D9D9D9'), hdr('ACTIVITY', 'D9D9D9'), hdr('TARGET –\nOCTOBER 2026', 'CCE8F8'), hdr('STATUS –\nOCTOBER 2026', 'C6F7E2'), hdr('TARGET –\nNOVEMBER 2026', 'DCD6FA'), hdr('TARGET–\nDECEMBER 2026', 'FFD966')],
  ];
  const isDev = bldg === 'Development';
  rows.forEach((r, i) => {
    const row: Cell[] = [];
    if (i === 0) {
      // "DEVELOPMENT" is drawn as a rotated text box over this cell (table cells can't rotate text).
      row.push(cell(isDev ? '' : bldg, { rowspan: rows.length, color: RED, bold: true, fontSize: 26, align: 'center' }));
    }
    const fs = isDev ? 14 : 12;
    row.push(cell(r.activity, { bold: true, fontSize: fs }));
    row.push(ordCell(r.targetOct, { bold: true, fontSize: fs, align: 'center' }));
    row.push(ordCell(r.statusOct, { bold: true, fontSize: fs, align: 'center', fill: r.status ? { color: STATUS_FILL[r.status] } : undefined }));
    row.push(ordCell(r.targetNov, { bold: true, fontSize: fs, align: 'center' }));
    row.push(ordCell(r.targetDec, { bold: true, fontSize: fs, align: 'center' }));
    table.push(row);
  });
  const bodyH = isDev ? 4.7 : 5.55;
  const headH = 0.75;
  const top = 0.62;
  s.addTable(table, {
    x: 0.08,
    y: top,
    w: 13.17,
    colW: [0.55, 2.9, 2.35, 2.55, 2.4, 2.42],
    rowH: [headH, ...rows.map(() => bodyH / rows.length)],
    fontFace: FONT,
    color: '000000',
    valign: 'middle',
    border: BORDER,
    margin: [0, 0.05, 0, 0.05],
  });
  if (isDev) {
    const cx = 0.08 + 0.55 / 2;
    const cy = top + headH + bodyH / 2;
    s.addText('DEVELOPMENT', { x: cx - bodyH / 2, y: cy - 0.275, w: bodyH, h: 0.55, rotate: 270, align: 'center', valign: 'middle', fontFace: FONT, fontSize: 24, bold: true, color: RED });
  }
  legend(s);
}

function aluformSlide(pptx: PptxGenJS) {
  const s = pptx.addSlide();
  decor(s);
  s.addText('ALUFORM FLOOR\nCASTING DATES', { x: 4.2, y: 0.15, w: 4.9, h: 1.05, align: 'center', fontFace: FONT, fontSize: 30, bold: true, italic: true, color: '000000' });
  const { totalFloors } = D.aluformCasting;
  const side = (b: 'A' | 'B', x: number) => {
    const data = new Map(D.aluformCasting[b].map((r) => [parseInt(r.floor, 10), r]));
    const hdrFill = b === 'A' ? 'B4C6E7' : 'FFC000';
    const floorFill = b === 'A' ? 'DDEBF7' : 'FBE5D6';
    const rows: Cell[][] = [
      [
        cell(`${b} Bldg.`, { fill: { color: 'FFFF00' }, color: b === 'A' ? RED : '000000', bold: true, align: 'center' }),
        cell('Date', { fill: { color: hdrFill }, bold: true, align: 'center' }),
        cell('Cycle', { fill: { color: hdrFill }, bold: true, align: 'center' }),
      ],
    ];
    for (let f = totalFloors; f >= 1; f -= 1) {
      const r = data.get(f);
      const ord = f % 10 === 1 && f !== 11 ? 'st' : f % 10 === 2 && f !== 12 ? 'nd' : f % 10 === 3 && f !== 13 ? 'rd' : 'th';
      rows.push([
        ordCell(`${f}${ord} Floor`, { fill: { color: floorFill }, bold: true, align: 'center' }),
        cell(r?.date ?? '', { fill: r?.date ? { color: '92D050' } : undefined, align: 'center', bold: true }),
        cell(r?.cycle ?? '', { color: RED, bold: true, align: 'center' }),
      ]);
    }
    s.addTable(rows, { x, y: 0.02, w: 3.45, colW: [1.2, 1.25, 1.0], rowH: 0.22, fontFace: 'Calibri', fontSize: 10, color: '000000', valign: 'middle', border: { type: 'solid', pt: 0.5, color: '000000' }, margin: 0 });
  };
  side('A', 0.2);
  side('B', 9.65);
  s.addText(`Note: ${D.aluformCasting.note}`, { x: 3.7, y: 6.95, w: 5.8, h: 0.5, fontFace: 'Arial', fontSize: 11.5, bold: true, color: '1F6FB5' });
}

function highriseSlide(pptx: PptxGenJS) {
  const s = pptx.addSlide();
  decor(s);
  title(
    s,
    [
      { text: 'ACTIVITY WISE ' },
      { text: 'ACTUAL VS HIGHRISE', underline: true },
      { text: ' WORK STATUS', breakLine: true },
      { text: `UPTO ${D.asOfDate}`, color: BLUE },
    ],
    { y: 0, h: 1.0, fontSize: 30, shadow: undefined }
  );
  const g = (t: string, extra: CellOpts = {}): Cell => cell(t, { fill: { color: 'D9D9D9' }, bold: true, align: 'center', fontSize: 15, ...extra });
  const rows: Cell[][] = [
    [g('ACTIVITY', { rowspan: 2 }), g('A Building', { colspan: 2, fontSize: 18 }), g('B Building', { colspan: 2, fontSize: 18 })],
    [
      cell('ACTUAL', { fill: { color: 'A6F5D1' }, bold: true, align: 'center', fontSize: 15 }),
      cell('HIGHRISE STATUS', { fill: { color: 'E6CFCB' }, bold: true, align: 'center', fontSize: 15 }),
      cell('ACTUAL', { fill: { color: 'A6F5D1' }, bold: true, align: 'center', fontSize: 15 }),
      cell('HIGHRISE STATUS', { fill: { color: 'E6CFCB' }, bold: true, align: 'center', fontSize: 15 }),
    ],
  ];
  D.highriseStatus.forEach((r) => {
    const tone = (open: boolean): CellOpts => ({ color: open ? RED : LINK_BLUE, bold: true, align: 'center', fontSize: 14 });
    rows.push([
      ordCell(r.activity, { bold: true, fontSize: 13 }),
      ordCell(r.aActual, { bold: true, align: 'center', fontSize: 12 }),
      ordCell(r.aHighrise, tone(r.aTone === 'open')),
      ordCell(r.bActual, { bold: true, align: 'center', fontSize: 12 }),
      ordCell(r.bHighrise, tone(r.bTone === 'open')),
    ]);
  });
  s.addTable(rows, {
    x: 0.08,
    y: 1.0,
    w: 13.2,
    colW: [3.0, 2.45, 2.65, 2.45, 2.65],
    rowH: [0.45, 0.4, ...D.highriseStatus.map(() => 5.5 / D.highriseStatus.length)],
    margin: [0, 0.05, 0, 0.05],
    fontFace: FONT,
    color: '000000',
    valign: 'middle',
    border: BORDER,
  });
}

function costSlide(pptx: PptxGenJS, label: string, rows: ElenorCostRow[], sep = ': ') {
  const s = pptx.addSlide();
  decor(s);
  decoTitle(s, `BUILDING WISE PROGRESS${sep}`, label);
  const hdr = (t: string): Cell => cell(t, { fill: { color: 'D9CFCF' }, bold: true, align: 'center', fontFace: 'Times New Roman', fontSize: 13 });
  const table: Cell[][] = [
    [hdr('Task Name'), hdr('Baseline Cost\nIn Lacs.'), hdr('Planned %\nUp To Date'), hdr('Planned Cost\nUp To Date'), hdr('Actual %\nUp To Date'), hdr('Actual Cost\nUp To Date'), hdr('Efficiency%')],
  ];
  rows.forEach((r) => {
    const isTotal = r.level === 'total';
    const isGroup = r.level === 'group';
    const hasData = r.plannedPct !== null;
    const fill = isTotal ? 'BDE3F6' : isGroup ? 'F8D888' : hasData ? 'FFFFE0' : undefined;
    // The second Development slide has no total row and the longest names — set it smaller.
    const fs = isTotal ? 14 : rows.length > 15 && !rows.some((x) => x.level === 'total') ? 10 : rows.length > 15 ? 11 : 13;
    const o = (extra: CellOpts = {}): CellOpts => ({ fill: fill ? { color: fill } : undefined, bold: true, align: 'center', fontSize: fs, ...extra });
    table.push([
      cell(r.name, o({ align: 'left', color: isTotal ? RED : '000000', fontSize: isGroup ? 15 : r.indent ? fs - 1 : fs, margin: [0, 0.04, 0, r.indent ? 0.4 : 0.06] })),
      cell(r.baseline, o({ color: RED })),
      cell(r.plannedPct ?? '', o()),
      cell(r.plannedCost ?? '', o({ color: LINK_BLUE })),
      cell(r.actualPct ?? '', o()),
      cell(r.actualCost ?? '', o({ color: LINK_BLUE })),
      cell(r.efficiency ?? '', o()),
    ]);
  });
  const body = 6.75 - 0.6;
  s.addTable(table, {
    x: 0.08,
    y: 0.62,
    w: 13.2,
    colW: [4.45, 1.6, 1.3, 1.55, 1.3, 1.55, 1.45],
    rowH: [0.6, ...rows.map((r) => (r.level === 'total' ? 1.3 : 1) * (body / (rows.length + 0.3)))],
    fontFace: 'Times New Roman',
    color: '000000',
    valign: 'middle',
    border: BORDER,
  });
}

function taskClosingSlide(pptx: PptxGenJS, img: DeckImages) {
  const s = pptx.addSlide();
  decor(s);
  s.addText('PROJECT : NYATI ELENOR\nSUMMARY OF TASK CLOSING', { x: 2, y: 0.25, w: 9.33, h: 1.1, align: 'center', fontFace: DECO, fontSize: 28, color: '000000' });
  const box = (y: number, iconBg: string, icon: string | undefined, text: PptxGenJS.TextProps[]) => {
    s.addShape('rect', { x: 2.35, y: y + 0.08, w: 9.35, h: 1.6, fill: { color: '123F4A' }, line: { color: 'BFBFBF', width: 0.75 } });
    s.addShape('rect', { x: 2.38, y, w: 1.4, h: 1.15, fill: { color: iconBg }, line: { color: 'FFFFFF', width: 0.75 } });
    if (icon) s.addImage({ data: icon, x: 2.75, y: y + 0.17, w: 1.05, h: 1.0 });
    s.addText(text, { x: 4.2, y: y + 0.1, w: 7.3, h: 1.45, fontFace: FONT, bold: true, color: 'FFFFFF', valign: 'top' });
  };
  const tc = D.taskClosing;
  box(2.25, '9B6B70', img.iconOpen, [
    { text: 'Open Task', options: { color: '66F2A0', fontSize: 22 } },
    { text: ' (Count & Amount)', options: { fontSize: 22, breakLine: true } },
    { text: `•  ${tc.openTaskCount}`, options: { fontSize: 18, breakLine: true } },
    { text: `•  ${tc.openTaskAmount}`, options: { fontSize: 18 } },
  ]);
  box(4.55, '3B2A2A', img.iconClosed, [
    { text: 'No. of  ', options: { fontSize: 26 } },
    { text: 'Task Closed', options: { color: '66F2A0', fontSize: 26 } },
    { text: ' in ', options: { fontSize: 26 } },
    { text: tc.closedInMonthLabel, options: { color: 'FFFF00', fontSize: 26, breakLine: true } },
    { text: `•  ${tc.closedInMonth}`, options: { fontSize: 22 } },
  ]);
}

function sheetHeader(s: Slide, heading: string, ref: string, y = 0.05) {
  s.addTable(
    [
      [
        cell(heading, { align: 'center', fontFace: DECO, fontSize: 17, color: '000000', colspan: 1 }),
        cell(ref, { align: 'right', color: 'C00000', bold: true, fontSize: 11 }),
      ],
      [cell('PROJECT : NYATI ELENOR', { align: 'center', fontFace: DECO, fontSize: 15, colspan: 2 })],
    ],
    { x: 0.08, y, w: 13.17, colW: [11.9, 1.27], rowH: [0.45, 0.38], fontFace: FONT, valign: 'middle', border: BORDER }
  );
}

function statusColor(t: string): string {
  const l = t.toLowerCase();
  if (l.startsWith('not')) return RED;
  if (l.startsWith('part')) return LINK_BLUE;
  return GREEN;
}

function purchasingSlide(pptx: PptxGenJS) {
  const s = pptx.addSlide();
  decor(s);
  const bp = D.bulkPurchasing;
  sheetHeader(s, '(BULK PURCHASING) 3RD QUARTER (OCTOBER 2026 – DECEMBER 2026)', bp.ref);
  const h = (t: string, fill?: string, extra: CellOpts = {}): Cell => cell(t, { bold: true, align: 'center', fontSize: 11, fill: fill ? { color: fill } : undefined, ...extra });
  const rows: Cell[][] = [
    [h('Sr. No.', undefined, { rowspan: 2 }), h('Contractor', undefined, { rowspan: 2 }), h('PO\nProcessing\nTime', undefined, { rowspan: 2, fontSize: 9 }), h('Lead\nTime', undefined, { rowspan: 2 }), h('A BUILDING', undefined, { colspan: 5, fontSize: 13 }), h('B BUILDING', undefined, { colspan: 5, fontSize: 13 })],
    [h('Planned'), h('Req.\nDate'), h('Req.\nStatus', 'FFFFCC'), h('PO Status', 'FFFFCC'), h('Delivery', 'FFFFCC'), h('Planned'), h('Req.\nDate'), h('Req.\nStatus', 'FFFFCC'), h('PO Status', 'FFFFCC'), h('Delivery', 'FFFFCC')],
  ];
  bp.rows.forEach((r) => {
    const sideCells = (x: typeof r.a): Cell[] =>
      x
        ? [
            cell(x.planned, { align: 'center', bold: true, fontSize: 9 }),
            cell(x.reqDate, { align: 'center', bold: true, fontSize: 9 }),
            cell(x.reqStatus, { align: 'center', bold: true, fontSize: 11, color: statusColor(x.reqStatus) }),
            cell(x.poStatus, { align: 'center', bold: true, fontSize: 11, color: statusColor(x.poStatus) }),
            cell(x.delivery, { align: 'center', bold: true, fontSize: 11, color: statusColor(x.delivery) }),
          ]
        : [cell(''), cell(''), cell(''), cell(''), cell('')];
    rows.push([
      cell(String(r.sr), { align: 'center', bold: true, fontSize: 16 }),
      cell(r.item, { bold: true, fontSize: 16 }),
      cell(String(r.poProcessing), { align: 'center', bold: true, fontSize: 16 }),
      cell(String(r.leadTime), { align: 'center', bold: true, fontSize: 16 }),
      ...sideCells(r.a),
      ...sideCells(r.b),
    ]);
  });
  s.addTable(rows, {
    x: 0.08,
    y: 0.88,
    w: 13.17,
    colW: [0.55, 1.95, 0.75, 0.7, 0.82, 0.82, 1.0, 1.0, 1.0, 0.82, 0.82, 1.0, 1.0, 0.94],
    rowH: [0.45, 0.7, ...bp.rows.map(() => 5.4 / bp.rows.length)],
    fontFace: FONT,
    color: '000000',
    valign: 'middle',
    border: BORDER,
    margin: [0, 0.03, 0, 0.03],
  });
}

function contractorSlide(pptx: PptxGenJS) {
  const s = pptx.addSlide();
  decor(s);
  const cd = D.contractorDeployment;
  sheetHeader(s, '(CONTRACTOR DEPLOYMENT)  3RD QUARTER (OCTOBER 2026 – DECEMBER 2026)', cd.ref, 0.02);
  const h = (t: string, fill?: string, extra: CellOpts = {}): Cell => cell(t, { bold: true, align: 'center', fontSize: 10, fill: fill ? { color: fill } : undefined, ...extra });
  const rows: Cell[][] = [
    [h('Sr. No.', undefined, { rowspan: 2 }), h('Contractor', undefined, { rowspan: 2 }), h('Processing\nTime', undefined, { rowspan: 2 }), h('A Building', undefined, { colspan: 4, fontSize: 14 }), h('B Building', undefined, { colspan: 4, fontSize: 14 })],
    [h('Planned Date'), h('WO Date'), h('Labour\nRequisition', 'CCE8F8'), h('WO Status w.r.t\nHighrise', 'FFFFCC'), h('Planned Date'), h('WO Date'), h('Labour\nRequisition', 'CCE8F8'), h('WO Status w.r.t\nHighrise', 'FFFFCC')],
  ];
  const status = (t: string): Cell => {
    const done = t === 'Given' || t === 'Completed';
    return cell(t, { align: 'center', bold: true, fontSize: 10, color: done ? '000000' : statusColor(t), fill: done ? { color: 'B5E6A2' } : undefined });
  };
  cd.rows.forEach((r) => {
    const sideCells = (x: typeof r.a): Cell[] =>
      x
        ? [cell(x.planned, { align: 'center', bold: true, fontSize: 10 }), cell(x.wo, { align: 'center', bold: true, fontSize: 10 }), status(x.labour), x.woStatus === '-' ? cell('-', { align: 'center', bold: true, color: LINK_BLUE }) : status(x.woStatus)]
        : [cell(''), cell(''), cell(''), cell('')];
    rows.push([
      cell(String(r.sr), { align: 'center', bold: true, fontSize: 10 }),
      cell(r.contractor, { bold: true, fontSize: 10 }),
      cell(String(r.processing), { align: 'center', bold: true, fontSize: 10 }),
      ...sideCells(r.a),
      ...sideCells(r.b),
    ]);
  });
  s.addTable(rows, {
    x: 0.15,
    y: 0.85,
    w: 13.05,
    colW: [0.6, 2.2, 1.0, 1.15, 1.15, 1.15, 1.3, 1.15, 1.15, 1.15, 1.25],
    rowH: [0.3, 0.42, ...cd.rows.map(() => 5.9 / cd.rows.length)],
    fontFace: FONT,
    color: '000000',
    valign: 'middle',
    border: BORDER,
    margin: [0, 0.04, 0, 0.04],
  });
}

function thanksSlide(pptx: PptxGenJS, img: DeckImages) {
  const s = pptx.addSlide();
  line(s, 7.1, 0, 7.15, H);
  line(s, 11.8, 0, W, 4.0);
  line(s, 6.0, H, W, 6.4);
  if (img.thanks) s.addImage({ data: img.thanks, x: 0, y: 0, w: 5.4, h: H, sizing: { type: 'cover', w: 5.4, h: H } });
  s.addShape('rtTriangle', { x: 3.7, y: 0, w: 1.75, h: H, flipH: true, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF', width: 0 } });
  s.addText('THANK YOU', { x: 6.2, y: 2.85, w: 5.5, h: 1.0, fontFace: 'Arial', fontSize: 44, italic: true, color: NAVY, align: 'center' });
  s.addText(
    [
      { text: `Presenter Name: ${D.presenter.name.toUpperCase()}`, options: { breakLine: true } },
      { text: `Email Address: ${D.presenter.email}` },
    ],
    { x: 8.6, y: 6.8, w: 4.6, h: 0.6, fontFace: 'Arial', fontSize: 9, bold: true, color: NAVY, align: 'right', paraSpaceAfter: 6 }
  );
}

/* --------------------------------- public --------------------------------- */

export const ELENOR_DECK_FILENAME = `Nyati_Elenor_Progress_Review_${D.asOfDate}.pptx`;

/** Builds the full 21-slide deck. */
export function buildElenorDeck(img: DeckImages = {}): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = D.presenter.name;
  pptx.company = 'Nyati Group';
  pptx.title = `Nyati Elenor — Progress Review (${D.reportRef})`;
  pptx.subject = D.reportPeriod;

  coverSlide(pptx, img);
  agendaSlide(pptx, img);
  projectInfoSlide(pptx);
  timelineSlide(pptx);
  uptoDateSlide(pptx);
  statusSummarySlide(pptx);
  monthwiseSlide(pptx);
  buildingMonthlySlide(pptx);
  targetSlide(pptx, 'A', D.targetVsActual.A);
  targetSlide(pptx, 'B', D.targetVsActual.B);
  targetSlide(pptx, 'Development', D.targetVsActual.Development);
  aluformSlide(pptx);
  highriseSlide(pptx);
  costSlide(pptx, 'A BUILDING', D.buildingProgress.A);
  costSlide(pptx, 'B BUILDING', D.buildingProgress.B);
  // Development runs over two slides, split where the source deck splits it.
  const dev = D.buildingProgress.Development;
  const split = dev.findIndex((r) => r.name.startsWith('(TG) IT Works'));
  costSlide(pptx, 'DEVELOPMENT', dev.slice(0, split), ' : ');
  costSlide(pptx, 'DEVELOPMENT', dev.slice(split), ' : ');
  taskClosingSlide(pptx, img);
  purchasingSlide(pptx);
  contractorSlide(pptx);
  thanksSlide(pptx, img);
  return pptx;
}

async function toDataUrl(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => resolve(undefined);
      r.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

/** Browser entry point: loads the slide photos and downloads the .pptx. */
export async function exportElenorPptx(): Promise<void> {
  const base = '/assets/elenor/';
  const [cover, agenda1, agenda2, thanks, iconOpen, iconClosed] = await Promise.all(
    ['cover.jpg', 'agenda-1.jpg', 'agenda-2.jpg', 'thanks.jpg', 'icon-open.png', 'icon-closed.jpg'].map((f) => toDataUrl(base + f))
  );
  const pptx = buildElenorDeck({ cover, agenda1, agenda2, thanks, iconOpen, iconClosed });
  await pptx.writeFile({ fileName: ELENOR_DECK_FILENAME, compression: true });
}
