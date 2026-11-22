// API application: Gemini helpers + /api routes. No static files, no listen().
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

// Load local overrides first (.env.local), then .env. Real environment variables always win.
dotenv.config({ path: ['.env.local', '.env'], quiet: true });

const PRIMARY_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-4-hydrogen';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL?.trim() || 'gemini-3.1-flash-lite';
const PRIMARY_COOLDOWN_MS = 5 * 60 * 1000;

let primaryUnhealthyUntil = 0;

function getGeminiClient(): GoogleGenAI | null {
  const candidates = [process.env.GEMINI_API_KEY_NEW, process.env.GEMINI_API_KEY];
  const apiKey = candidates
    .map((val) => val?.trim())
    .find((val) => val && val !== 'MY_GEMINI_API_KEY');
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function buildAssistantSystemInstruction(projectContext: unknown): string {
  const ctx = (projectContext ?? {}) as {
    evania?: unknown;
    elenor?: unknown;
    activeProject?: string;
    activePage?: string;
  };
  const activeProjectName = ctx.activeProject === 'elenor' ? 'Nyati Elenor' : 'Nyati Evania';
  return [
    'You are the Nyati Group Project Intelligence Assistant inside the "Nyati Project Intelligence" web application.',
    'You have the full data of TWO projects: Nyati Evania (Tower A / A Block) and Nyati Elenor (Lullanagar, Pune).',
    `The user is currently viewing project "${activeProjectName}" on the "${ctx.activePage ?? 'Executive Dashboard'}" page. If a question does not name a project, answer for ${activeProjectName}; if it compares or mentions both, cover both and label each clearly.`,
    '',
    'APPLICATION GUIDE (use it to give application-based answers — after answering, point the user to the page where they can see or act on the figures, e.g. "See: Nyati Elenor → Progress Monitoring → Aluform & Highrise"):',
    '- A project selector at the top right switches between Nyati Evania and Nyati Elenor. This assistant (bottom-right chat button) is available on every page.',
    '- Nyati Evania pages: Executive Dashboard (scope, R1 budget totals, project metadata — editable via Edit Project); Work Packages (Civil A–O and MEP packages, editable via the "Edit Package" button, saved in this browser); Budget & BOQ (R1 cost summary, flat mix, excavation R0→R1, Evoque benchmarks); AI Risk Center (package risk register, mark risks resolved); Progress Monitoring (Aluform floor tracker 1–32 — click floors to set status — and package progress); Site Reports (daily site logs with photos, weekly executive reports with AI narrative).',
    '- Nyati Elenor pages (read-only, from Progress Review PLN/407): Executive Dashboard (project information, timeline, progress vs time, status/cost/efficiency, task closing); Work Packages (A/B/Development task groups in ₹ Lacs with planned vs actual % chart); Budget & BOQ (upto date cost status, planned vs actual cost, baseline by task group, FY cost); AI Risk Center (risks derived from the review); Progress Monitoring (tabs: Monthly Progress, Target vs Actual, Aluform & Highrise); Purchasing & Contractors (bulk purchasing PLN/409, contractor deployment PLN/410).',
    '- Nyati Elenor figures cannot be edited in the app; they mirror the presentation. Nyati Evania package/project edits are stored locally in the browser.',
    '',
    '=== NYATI EVANIA RULES ===',
    'Ground every Nyati Evania answer in the live Nyati Evania project data JSON below, while adapting to the type of question asked:',
    '',
    '1. FACTUAL / DATA-LOOKUP QUESTIONS (dates, contractor names, exact budgets, quantities, logged progress/reports):',
    '   - Report exact facts and numbers from the JSON. Show all money in ₹ Crore (₹ Cr) or ₹/unit as recorded.',
    '   - Exact given budget totals: Civil ₹93.59 Cr, MEP ₹13.64 Cr, Grand Total ₹107.22 Cr, Total Flats 150. Do not recompute grand totals.',
    '   - Never invent unrecorded dates, contractor names, locations, progress percentages, or spend numbers. If a specific requested field is null or "Not yet updated", explicitly state that it is not yet recorded in the project data.',
    '',
    '2. CONTEXT-BASED, STRATEGIC, ADVISORY, OR "WHAT SHOULD I DO" QUESTIONS (e.g., CEO 5-month strategy, procurement priorities, cost optimization, risk mitigation, sequencing, executive decisions):',
    '   - NEVER refuse these with "This is not available in the current project data."',
    '   - Reason intelligently from the project context: synthesize actionable recommendations anchored directly in Tower A\'s real data signals — cost concentration (e.g. RCC ₹34.77 Cr / 32.4%, Tiling & Flooring ₹14.79 Cr, Flat Amenities ₹13.41 Cr, Internal Electrical ₹6.03 Cr, Plaster ₹5.87 Cr, Plumbing ₹5.80 Cr), Nyati Evoque benchmark rate premiums (RCC +32.7%, RMC M40/M50, Main Door), Excavation R1 overrun (₹6.80 Cr vs ₹6.45 Cr Present Budget), open review bottlenecks (3 Qty Crosscheck pending items, Garbage Chute ₹0.00 Cr / Not given by MEP Dept), tower specs (32 lift stops, 8th–32nd Aluform floors, 150 flats), and current operational readiness (entered vs unrecorded schedules, contractors, floor cast progress, and site logs).',
    '   - When baseline operational fields (start date, planned completion, contractors, package %) are still "Not yet updated", treat closing those data/governance gaps as concrete immediate action items in your plan rather than refusing to answer.',
    '   - Clearly separate observed project facts/figures from strategic recommendations/assumptions, without fabricating fake dates or fake progress numbers.',
    '',
    '=== NYATI ELENOR RULES ===',
    'Nyati Elenor is located at Lullanagar, Pune, with 03 buildings (A & B, Commercial Bldg.). Source: Progress Review Presentation PLN/407, upto October 2026 (as of 31.10.2026).',
    'Ground every Nyati Elenor answer in the Nyati Elenor project data JSON below, while adapting to the type of question asked:',
    '',
    '1. FACTUAL / DATA-LOOKUP QUESTIONS (dates, costs, percentages, efficiencies, floor casting dates, targets, purchasing or contractor status):',
    '   - Report exact figures exactly as recorded in the JSON. Do not recompute or round totals.',
    '   - Units: project-level tables (uptoDateStatus, statusSummary, fyActualCostUptoOct, taskClosing) are in ₹ Crore; buildingProgress task-group tables are in ₹ Lacs. Always state the unit.',
    '   - Key recorded figures: Signed off / Baseline cost ₹371.22 Cr; upto date actual 9.92% (₹36.83 Cr) vs planned 15.64% (₹58.06 Cr), efficiency 63%; FY 2026-27 upto October actual 3.90% (₹14.48 Cr) vs planned 7.07% (₹26.25 Cr), efficiency 55%.',
    '   - Never invent figures, dates, contractor names or statuses. If a field is empty/null or not in the data, say it is not recorded in the progress review.',
    '',
    '2. CONTEXT-BASED, STRATEGIC, ADVISORY, OR "WHAT SHOULD I DO" QUESTIONS (CEO strategy, recovery plans, procurement priorities, risk mitigation, sequencing):',
    '   - NEVER refuse these. Reason from the recorded signals: progress gap vs plan, low-efficiency task groups (e.g. Waterproofing, Plumbing & Sanitation, Masonry, Tiling at 0%), failed October targets (RCC Aluform, Masonry, Tar Plaster, Concealed Plumbing, Waterproofing, Sprinkler), Aluform floor cycle times (A Bldg. 23–49 days, B Bldg. 20–41 days; 7 of 32 floors cast in each), the RMC strike (16/04/26 to 08/05/26, 23 days), open Highrise tasks, 300 open tasks worth ₹16.18 Cr, Dado & Flooring delivery Not Done, and labour requisitions Not Given (Firefighting A & B, Tiling B).',
    '   - Clearly separate recorded facts/figures from your recommendations/assumptions, and do not fabricate dates or progress numbers.',
    '',
    '=== GENERAL ===',
    '- Never mix figures between projects. Prefix each project-specific number with the project name when both are discussed.',
    '- For "how do I…" questions about the app, explain the steps using the APPLICATION GUIDE above. Do not invent features that are not listed.',
    '- FORMAT: Be structured, practical, and concise (this is a compact chat panel). Use short headings and bullet points with bold key numbers. End with a one-line "See:" pointer to the relevant page when useful.',
    '',
    'FULL NYATI EVANIA PROJECT DATA:',
    JSON.stringify(ctx.evania ?? null),
    '',
    'FULL NYATI ELENOR PROJECT DATA:',
    JSON.stringify(ctx.elenor ?? null),
  ].join('\n');
}

function buildStrictSystemInstruction(projectContext: unknown): string {
  return [
    'You are the Nyati Evania Tower A (A Block) Project Intelligence assistant.',
    'Answer only from this Nyati Evania data. If a specific fact is not in the data, say "Not yet updated" or "None logged". Show money in ₹ Crore.',
    'Omitted/null work package fields mean "Not yet updated". Do not invent dates, percentages, contractors, locations, confidence scores, or numbers not present in the JSON below.',
    'Exact given budget totals: Civil ₹93.59 Cr, MEP ₹13.64 Cr, Grand Total ₹107.22 Cr, Total Flats 150. Do not recompute grand totals.',
    'Be concise and direct. Use short bullet points when listing multiple items.',
    '',
    'FULL NYATI EVANIA PROJECT DATA:',
    JSON.stringify(projectContext),
  ].join('\n');
}

interface ChatMessageInput {
  role: 'user' | 'model';
  text: string;
}

function parseGeminiErrorDetails(err: unknown): {
  status: number;
  message: string;
  retryable: boolean;
} {
  const rawMessage =
    err instanceof Error ? err.message : 'Unexpected error communicating with Gemini API.';

  let parsedCode: number | undefined;
  let parsedStatus: string | undefined;
  let parsedMsg: string | undefined;

  try {
    const jsonStart = rawMessage.indexOf('{');
    const jsonEnd = rawMessage.lastIndexOf('}');
    const jsonCandidate =
      jsonStart !== -1 && jsonEnd > jsonStart
        ? rawMessage.slice(jsonStart, jsonEnd + 1)
        : rawMessage;
    const parsed = JSON.parse(jsonCandidate) as {
      error?: { code?: number; status?: string; message?: string };
      code?: number;
      status?: string;
      message?: string;
    };
    const inner = parsed.error ?? parsed;
    parsedCode = inner.code;
    parsedStatus = inner.status;
    parsedMsg = inner.message;
  } catch {
    // rawMessage has no valid JSON; inspect string directly
  }

  const errObj = err as { status?: number; code?: number } | null;
  const code = parsedCode ?? errObj?.status ?? errObj?.code;
  const msg = parsedMsg || rawMessage;
  const upper = `${parsedStatus ?? ''} ${msg}`.toUpperCase();

  if (code === 400 || upper.includes('API_KEY_INVALID')) {
    return {
      status: 400,
      message: msg.includes('API')
        ? `${msg} Please check GEMINI_API_KEY in your .env file.`
        : msg,
      retryable: false,
    };
  }

  if (code === 403 || upper.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message: `${msg} Please check GEMINI_API_KEY in your .env file.`,
      retryable: false,
    };
  }

  if (code === 404 || upper.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: msg,
      retryable: false,
    };
  }

  if (code === 429 || upper.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'Rate limit or quota reached for the Gemini API. Please wait a moment and try again, or check the quota for GEMINI_API_KEY.',
      retryable: true,
    };
  }

  if (code === 503 || code === 500 || code === 502 || code === 504 || upper.includes('UNAVAILABLE')) {
    // Map upstream 5xx to 500 so reverse proxies/load balancers don't replace the JSON error with their own error page.
    return {
      status: 500,
      message:
        parsedMsg ||
        'The AI service is temporarily busy. Please try again in a few seconds.',
      retryable: true,
    };
  }

  return {
    status: 500,
    message: msg,
    retryable: false,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                JSON.stringify({
                  error: {
                    code: 503,
                    status: 'UNAVAILABLE',
                    message: 'Upstream AI request timed out.',
                  },
                })
              )
            ),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

function getModelAttempts(): Array<{
  model: string;
  thinkingLevel: ThinkingLevel;
  timeoutMs: number;
}> {
  const primaryHealthy = Date.now() >= primaryUnhealthyUntil;
  if (!primaryHealthy) {
    return [
      { model: FALLBACK_MODEL, thinkingLevel: ThinkingLevel.LOW, timeoutMs: 30000 },
      { model: FALLBACK_MODEL, thinkingLevel: ThinkingLevel.LOW, timeoutMs: 60000 },
    ];
  }
  return [
    { model: PRIMARY_MODEL, thinkingLevel: ThinkingLevel.LOW, timeoutMs: 12000 },
    { model: FALLBACK_MODEL, thinkingLevel: ThinkingLevel.LOW, timeoutMs: 30000 },
    { model: FALLBACK_MODEL, thinkingLevel: ThinkingLevel.LOW, timeoutMs: 60000 },
  ];
}

async function generateWithFallback(
  ai: GoogleGenAI,
  contents: unknown,
  systemInstruction: string
) {
  const attempts = getModelAttempts();

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i += 1) {
    const { model, thinkingLevel, timeoutMs } = attempts[i];
    try {
      const requestPromise = ai.models.generateContent({
        model,
        contents: contents as Parameters<typeof ai.models.generateContent>[0]['contents'],
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel },
        },
      });

      return await withTimeout(requestPromise, timeoutMs);
    } catch (err: unknown) {
      lastError = err;
      const details = parseGeminiErrorDetails(err);
      if (model === PRIMARY_MODEL && details.retryable) {
        primaryUnhealthyUntil = Date.now() + PRIMARY_COOLDOWN_MS;
      }
      if (!details.retryable || i === attempts.length - 1) {
        throw err;
      }
    }
  }
  throw lastError;
}

async function generateStreamWithFallback(
  ai: GoogleGenAI,
  contents: unknown,
  systemInstruction: string,
  onChunk: (text: string) => void
): Promise<void> {
  const attempts = getModelAttempts();

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i += 1) {
    const { model, thinkingLevel, timeoutMs } = attempts[i];
    let emittedAny = false;
    try {
      const deadline = Date.now() + timeoutMs;
      const stream = await withTimeout(
        ai.models.generateContentStream({
          model,
          contents: contents as Parameters<typeof ai.models.generateContentStream>[0]['contents'],
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel },
          },
        }),
        timeoutMs
      );

      const iterator = stream[Symbol.asyncIterator]();
      while (true) {
        const remaining = Math.max(1000, deadline - Date.now());
        const step = emittedAny
          ? await iterator.next()
          : await withTimeout(iterator.next(), remaining);
        if (step.done) break;
        const text = step.value.text ?? '';
        if (text) {
          emittedAny = true;
          onChunk(text);
        }
      }
      if (!emittedAny) {
        throw new Error('Empty response received from Gemini API.');
      }
      return;
    } catch (err: unknown) {
      lastError = err;
      const details = parseGeminiErrorDetails(err);
      if (model === PRIMARY_MODEL && details.retryable) {
        primaryUnhealthyUntil = Date.now() + PRIMARY_COOLDOWN_MS;
      }
      if (emittedAny || !details.retryable || i === attempts.length - 1) {
        throw err;
      }
    }
  }
  throw lastError;
}

/** Creates the Express app with all /api routes. Shared by the Node server (server.ts) and the Vercel function (api/index.ts). */
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Behind a load balancer / reverse proxy (Cloud Run, Render, Nginx, etc.)
  app.set('trust proxy', true);
  app.use((_req: Request, res: Response, next: express.NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
  app.use(express.json({ limit: '4mb' }));

  // Simple in-memory rate limit for AI endpoints (protects the Gemini quota).
  const AI_WINDOW_MS = 5 * 60 * 1000;
  const AI_MAX_REQUESTS = Number(process.env.AI_RATE_LIMIT) || 40;
  const aiHits = new Map<string, number[]>();
  const aiRateLimit = (req: Request, res: Response, next: express.NextFunction) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const recent = (aiHits.get(key) ?? []).filter((t) => now - t < AI_WINDOW_MS);
    if (recent.length >= AI_MAX_REQUESTS) {
      res.status(429).json({ error: 'Too many AI requests. Please wait a few minutes and try again.' });
      return;
    }
    recent.push(now);
    aiHits.set(key, recent);
    if (aiHits.size > 5000) aiHits.clear();
    next();
  };
  app.use(['/api/assistant', '/api/weekly-summary'], aiRateLimit);

  // Liveness/readiness probe for hosting platforms
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', aiConfigured: getGeminiClient() !== null });
  });

  // AI Assistant (chatbot) endpoint — knows both projects; SSE streaming when body.stream === true
  app.post('/api/assistant', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Add it to the .env file (or the hosting platform\'s environment variables) and restart the server.',
      });
      return;
    }

    const { messages, projectContext, stream } = req.body as {
      messages?: ChatMessageInput[];
      projectContext?: unknown;
      stream?: boolean;
    };

    if (!Array.isArray(messages) || messages.length === 0 || !projectContext) {
      res.status(400).json({ error: 'Missing messages or projectContext.' });
      return;
    }

    // Keep the most recent turns only, and cap message length, to bound request size.
    const contents = messages
      .filter((m) => m && typeof m.text === 'string' && m.text.trim())
      .slice(-20)
      .map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text.slice(0, 8000) }],
      }));
    if (contents.length === 0) {
      res.status(400).json({ error: 'Missing messages or projectContext.' });
      return;
    }
    const systemInstruction = buildAssistantSystemInstruction(projectContext);

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      try {
        await generateStreamWithFallback(ai, contents, systemInstruction, (chunkText) => {
          res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        });
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (err: unknown) {
        const { message } = parseGeminiErrorDetails(err);
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.end();
      }
      return;
    }

    try {
      const response = await generateWithFallback(ai, contents, systemInstruction);

      const answer = (response.text ?? '').trim();
      if (!answer) {
        res.status(500).json({ error: 'Empty response received from Gemini API.' });
        return;
      }

      res.json({ reply: answer });
    } catch (err: unknown) {
      const { status, message } = parseGeminiErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  // Weekly Executive Report narrative endpoint
  app.post('/api/weekly-summary', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(500).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Add it to the .env file (or the hosting platform\'s environment variables) and restart the server.',
      });
      return;
    }

    const { reportFacts, projectContext } = req.body as {
      reportFacts?: unknown;
      projectContext?: unknown;
    };

    if (!reportFacts || !projectContext) {
      res.status(400).json({ error: 'Missing reportFacts or projectContext.' });
      return;
    }

    try {
      const prompt = [
        'Write a concise, factual Weekly Executive Summary narrative (3 short paragraphs or bullet sections: Budget & Scope, Risks & Data Gaps, Execution Progress & Site Activity) for Nyati Group leadership.',
        'Use ONLY the numbers, facts, and statuses in the weekly report snapshot and project data below.',
        'If progress, dates, location, contractors, or site reports are not updated or empty, state that explicitly as "Not yet updated" or "None logged" rather than assuming or inventing.',
        'Show all money in ₹ Crore (₹ Cr).',
        '',
        'WEEKLY REPORT SNAPSHOT:',
        JSON.stringify(reportFacts, null, 2),
      ].join('\n');

      const response = await generateWithFallback(
        ai,
        prompt,
        buildStrictSystemInstruction(projectContext)
      );

      const summary = (response.text ?? '').trim();
      if (!summary) {
        res.status(500).json({ error: 'Empty narrative received from Gemini API.' });
        return;
      }

      res.json({ narrative: summary });
    } catch (err: unknown) {
      const { status, message } = parseGeminiErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  // Ensure unknown /api routes and API middleware errors always return JSON instead of HTML
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  app.use(
    (
      err: { status?: number; message?: string },
      req: Request,
      res: Response,
      next: express.NextFunction
    ) => {
      if (req.path.startsWith('/api')) {
        const status = err?.status && err.status >= 400 && err.status < 500 ? err.status : 500;
        res.status(status).json({ error: err?.message || 'Internal server error.' });
        return;
      }
      next(err);
    }
  );


  return app;
}
