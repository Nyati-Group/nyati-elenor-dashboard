import { useEffect, useRef, useState } from 'react';
import { Send, Trash2, X } from 'lucide-react';

const NYATI_LOGO = '/assets/nyati-logo.jpg';
import { ProjectId, PROJECTS } from '../types/navigation';
import { EvaniaContextInput, buildElenorContext, buildEvaniaContext } from '../lib/aiContext';

interface ChatbotWidgetProps {
  activeProject: ProjectId;
  activePageLabel: string;
  evania: EvaniaContextInput;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  externalQuery?: string | null;
  onClearExternalQuery?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const SUGGESTIONS: Record<ProjectId, string[]> = {
  evania: [
    'What should be my strategy as CEO for the next 5 months?',
    'Where are our biggest cost optimization opportunities vs Evoque?',
    'Which package has the highest budget and key risks?',
    'Compare Nyati Evania and Nyati Elenor budgets',
  ],
  elenor: [
    'Why is Nyati Elenor behind plan and how do we recover?',
    'Which task groups have the lowest efficiency?',
    'How are Aluform floor cycles trending for A and B Bldg.?',
    'Which October targets failed and what is due in November?',
  ],
};

function renderInlineBold(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function renderFormattedMessage(text: string) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trimEnd();
        if (!line.trim()) return <div key={idx} className="h-1" />;
        const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
        if (headingMatch) {
          return (
            <p key={idx} className="pt-1.5 font-display text-xs font-semibold text-slate-900">
              {headingMatch[1].replace(/\*\*/g, '')}
            </p>
          );
        }
        const bulletMatch = line.match(/^(\s*)(?:[*-]|\d+\.)\s+(.+)$/);
        if (bulletMatch) {
          const indent = bulletMatch[1].length >= 2;
          return (
            <div key={idx} className={`flex items-start gap-2 ${indent ? 'pl-4' : 'pl-1'}`}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0284C7]" />
              <span className="flex-1">{renderInlineBold(bulletMatch[2])}</span>
            </div>
          );
        }
        if (/^see:/i.test(line.trim())) {
          return (
            <p key={idx} className="mt-1 rounded-md bg-sky-50 border border-sky-100 px-2 py-1 text-[11px] text-sky-900">
              {renderInlineBold(line)}
            </p>
          );
        }
        return <p key={idx}>{renderInlineBold(line)}</p>;
      })}
    </div>
  );
}

export function ChatbotWidget({
  activeProject,
  activePageLabel,
  evania,
  isOpen,
  onOpenChange,
  externalQuery,
  onClearExternalQuery,
}: ChatbotWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = (val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const projectName = PROJECTS.find((p) => p.id === activeProject)?.name ?? 'Nyati Evania';

  useEffect(() => {
    if (open) scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    setErrorMsg(null);
    const userMessage: ChatMessage = { id: `msg-${Date.now()}-u`, role: 'user', text: trimmed };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);
    const modelMessageId = `msg-${Date.now()}-m`;

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream: true,
          messages: nextHistory.map((m) => ({ role: m.role, text: m.text })),
          projectContext: {
            activeProject,
            activePage: activePageLabel,
            evania: buildEvaniaContext(evania),
            elenor: buildElenorContext(),
          },
        }),
      });

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';
        let hasCreatedBubble = false;

        const appendChunk = (chunkText: string) => {
          accumulated += chunkText;
          if (!hasCreatedBubble) {
            hasCreatedBubble = true;
            setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', text: accumulated }]);
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === modelMessageId ? { ...m, text: accumulated } : m))
            );
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';
          for (const evt of events) {
            for (const line of evt.split('\n')) {
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;
              const parsed = JSON.parse(payload) as { text?: string; error?: string };
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) appendChunk(parsed.text);
            }
          }
        }
        if (!accumulated.trim()) throw new Error('Empty response received from Gemini API.');
        return;
      }

      const rawText = await response.text();
      let data: { reply?: string; error?: string } = {};
      try {
        data = rawText ? (JSON.parse(rawText) as { reply?: string; error?: string }) : {};
      } catch {
        throw new Error(
          `Unexpected response from server (HTTP ${response.status}). Please try again in a moment.`
        );
      }
      if (!response.ok || !data.reply) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', text: data.reply as string }]);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach the AI assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      setOpen(true);
      void sendQuestion(externalQuery);
      onClearExternalQuery?.();
    }
  }, [externalQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendQuestion(input);
    }
  };

  return (
    <div className="no-print">
      {/* Launcher */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          title="AI Assistant"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white p-1 ring-2 ring-[#0F1E36] shadow-lg shadow-slate-900/25 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 transition-transform"
        >
          <img src={NYATI_LOGO} alt="" referrerPolicy="no-referrer" className="h-full w-full object-contain" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <section
          role="dialog"
          aria-label="Nyati AI Assistant"
          className="fixed z-50 inset-x-0 bottom-0 top-16 sm:inset-auto sm:bottom-5 sm:right-5 sm:top-auto sm:h-[min(640px,calc(100vh-6rem))] sm:w-[400px] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 bg-[#0F1E36] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5">
                <img src={NYATI_LOGO} alt="Nyati Group logo" referrerPolicy="no-referrer" className="h-full w-full object-contain" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold">Nyati AI Assistant</p>
                <p className="text-[11px] text-slate-300 truncate">
                  Knows Nyati Evania &amp; Nyati Elenor · viewing {projectName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setErrorMsg(null);
                  }}
                  aria-label="Clear conversation"
                  title="Clear conversation"
                  className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close AI assistant"
                className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/60">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-700 leading-relaxed">
                  Hi! Ask me about <strong>Nyati Evania</strong> or <strong>Nyati Elenor</strong> — exact figures,
                  comparisons, risks, strategy, or where to find something in this app.
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Try asking</p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS[activeProject].map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={isLoading}
                      onClick={() => void sendQuestion(q)}
                      className="text-left rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#0F1E36] text-white whitespace-pre-wrap'
                        : 'bg-white border border-slate-200 text-slate-800'
                    }`}
                  >
                    {msg.role === 'model' ? renderFormattedMessage(msg.text) : msg.text}
                  </div>
                </div>
              ))
            )}

            {isLoading && messages[messages.length - 1]?.role !== 'model' && (
              <div className="flex justify-start">
                <div className="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-xs text-slate-500 inline-flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" />
                  </span>
                  Analyzing project data…
                </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>

          {errorMsg && (
            <div role="alert" className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
              {errorMsg}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendQuestion(input);
            }}
            className="border-t border-slate-200 bg-white p-3 flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about ${projectName} or both projects…`}
              aria-label="Ask the AI assistant"
              disabled={isLoading}
              className="flex-1 resize-none max-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F1E36] text-white hover:bg-[#1D3557] disabled:opacity-50 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
