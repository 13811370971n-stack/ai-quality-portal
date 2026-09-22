import { useState, useEffect, useCallback } from 'react';
import { DIAGRAMS } from '@/components/learn/diagrams/NormalDiagrams';
import type { Slide, SlideBlock, Checkpoint } from '@/components/learn/data/deck-six-sigma-value';

interface Props {
  slides: Slide[];
  checkpoints?: Checkpoint[];
  title: string;
  onExit?: () => void;
}

export default function SlidePlayer({ slides, checkpoints = [], title }: Props) {
  /** index 0..slides.length-1 为讲义，最后一页为理解检查 */
  const lastIndex = slides.length + (checkpoints.length > 0 ? 1 : 0) - 1;
  const [i, setI] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [cpAnswers, setCpAnswers] = useState<Record<number, string>>({});
  const [cpRevealed, setCpRevealed] = useState<Record<number, boolean>>({});

  const go = useCallback(
    (next: number) => {
      setI(Math.max(0, Math.min(lastIndex, next)));
      setShowMap(false);
    },
    [lastIndex]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(i + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(i - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(lastIndex);
      else if (e.key === 'Escape') setShowMap(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [i, go, lastIndex]);

  const isCheckpoint = checkpoints.length > 0 && i === slides.length;
  const slide = isCheckpoint ? null : slides[i];
  const progress = ((i + 1) / (lastIndex + 1)) * 100;

  return (
    <div className="bg-white rounded-xl border border-mckinsey-border overflow-hidden">
      {/* ---------- top bar ---------- */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-mckinsey-border bg-mckinsey-light">
        <button
          onClick={() => setShowMap((v) => !v)}
          className="text-xs px-3 py-1.5 rounded border border-mckinsey-border bg-white text-mckinsey-navy hover:border-mckinsey-teal transition"
        >
          {showMap ? '收起目录' : '目录'}
        </button>
        <div className="flex-1">
          <div className="h-1.5 bg-mckinsey-border rounded-full overflow-hidden">
            <div
              className="h-full bg-mckinsey-teal rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-mckinsey-muted font-mono shrink-0">
          {i + 1} / {lastIndex + 1}
        </span>
      </div>

      {/* ---------- slide map ---------- */}
      {showMap && (
        <div className="px-5 py-4 border-b border-mckinsey-border bg-white max-h-64 overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.n}
                onClick={() => go(idx)}
                className={`text-left px-3 py-2 rounded text-sm transition ${
                  idx === i
                    ? 'bg-mckinsey-navy text-white'
                    : 'hover:bg-mckinsey-light text-mckinsey-navy'
                }`}
              >
                <span className="font-mono text-xs opacity-60 mr-2">{s.n}</span>
                {s.title}
              </button>
            ))}
            {checkpoints.length > 0 && (
              <button
                onClick={() => go(slides.length)}
                className={`text-left px-3 py-2 rounded text-sm transition ${
                  isCheckpoint ? 'bg-mckinsey-navy text-white' : 'hover:bg-mckinsey-light text-mckinsey-navy'
                }`}
              >
                <span className="font-mono text-xs opacity-60 mr-2">✓</span>
                理解检查
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------- slide body ---------- */}
      <div className="px-6 sm:px-10 py-8 min-h-[420px]">
        {slide && (
          <>
            <div className="flex items-start justify-between gap-4 mb-1">
              <h2 className="text-2xl font-semibold text-mckinsey-navy">{slide.title}</h2>
              {slide.primerPage && (
                <span className="shrink-0 text-xs font-mono text-mckinsey-muted border border-mckinsey-border rounded px-2 py-0.5">
                  Primer p{slide.primerPage}
                </span>
              )}
            </div>
            {slide.subtitle && (
              <p className="text-sm text-mckinsey-muted mb-6">{slide.subtitle}</p>
            )}

            <div className="space-y-5">
              {slide.blocks.map((b, idx) => (
                <Block key={idx} block={b} />
              ))}
            </div>

            {slide.takeaway && (
              <div className="mt-8 pt-5 border-t border-mckinsey-border">
                <div className="flex gap-3">
                  <span className="text-mckinsey-gold text-sm font-semibold shrink-0">本页结论</span>
                  <p className="text-sm text-mckinsey-navy font-medium">{slide.takeaway}</p>
                </div>
              </div>
            )}
          </>
        )}

        {isCheckpoint && (
          <>
            <h2 className="text-2xl font-semibold text-mckinsey-navy mb-1">理解检查</h2>
            <p className="text-sm text-mckinsey-muted mb-6">
              答完再看解析。做错不要紧，回上一页重看对应内容。
            </p>
            <div className="space-y-6">
              {checkpoints.map((c, ci) => {
                const picked = cpAnswers[ci];
                const shown = cpRevealed[ci];
                const ok = picked === c.answer;
                return (
                  <div key={ci} className="border border-mckinsey-border rounded-lg p-5">
                    <p className="text-mckinsey-navy mb-4">
                      <span className="font-semibold mr-2">{ci + 1}.</span>
                      {c.q}
                    </p>
                    <div className="space-y-2 mb-3">
                      {c.options.map((o) => {
                        let cls = 'border-mckinsey-border hover:border-mckinsey-teal bg-white';
                        if (shown) {
                          if (o.key === c.answer) cls = 'border-emerald-400 bg-emerald-50';
                          else if (o.key === picked) cls = 'border-red-300 bg-red-50';
                          else cls = 'border-mckinsey-border bg-white opacity-60';
                        } else if (picked === o.key) {
                          cls = 'border-mckinsey-teal bg-mckinsey-teal/5';
                        }
                        return (
                          <button
                            key={o.key}
                            disabled={shown}
                            onClick={() => setCpAnswers({ ...cpAnswers, [ci]: o.key })}
                            className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition ${cls}`}
                          >
                            <span className="font-semibold text-mckinsey-navy mr-2">{o.key}.</span>
                            <span className="text-mckinsey-navy/80">{o.text}</span>
                          </button>
                        );
                      })}
                    </div>
                    {!shown ? (
                      <button
                        disabled={!picked}
                        onClick={() => setCpRevealed({ ...cpRevealed, [ci]: true })}
                        className="px-4 py-2 rounded-lg bg-mckinsey-navy text-white text-sm disabled:opacity-40 hover:bg-mckinsey-blue transition"
                      >
                        查看解析
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className={`text-sm font-semibold ${ok ? 'text-emerald-700' : 'text-red-700'}`}>
                          {ok ? '正确' : `不正确 — 正确答案 ${c.answer}`}
                        </p>
                        <p className="text-sm text-mckinsey-navy/75 leading-relaxed border-l-2 border-mckinsey-gold pl-3">
                          {c.why}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ---------- nav ---------- */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-mckinsey-border bg-mckinsey-light">
        <button
          onClick={() => go(i - 1)}
          disabled={i === 0}
          className="px-4 py-2 rounded-lg border border-mckinsey-border bg-white text-sm text-mckinsey-navy disabled:opacity-40 hover:border-mckinsey-teal transition"
        >
          ← 上一页
        </button>
        <span className="hidden sm:block text-xs text-mckinsey-muted">
          方向键翻页 · Home / End 跳首尾
        </span>
        <button
          onClick={() => go(i + 1)}
          disabled={i === lastIndex}
          className="px-4 py-2 rounded-lg bg-mckinsey-navy text-white text-sm disabled:opacity-40 hover:bg-mckinsey-blue transition"
        >
          下一页 →
        </button>
      </div>
    </div>
  );
}

/* ============================================================ blocks */

function Block({ block: b }: { block: SlideBlock }) {
  if (b.kind === 'text') {
    return <p className="text-mckinsey-navy/85 leading-relaxed">{b.body}</p>;
  }

  if (b.kind === 'bullets') {
    return (
      <ul className="space-y-2">
        {b.items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-mckinsey-navy/85 leading-relaxed">
            <span className="text-mckinsey-teal mt-1 shrink-0">▪</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (b.kind === 'visual') {
    const Diagram = DIAGRAMS[b.id];
    return (
      <figure className="bg-mckinsey-light rounded-lg p-5 border border-mckinsey-border">
        {Diagram ? <Diagram /> : <p className="text-sm text-mckinsey-muted">（图示缺失：{b.id}）</p>}
        {b.caption && (
          <figcaption className="mt-3 text-xs text-mckinsey-muted text-center">{b.caption}</figcaption>
        )}
      </figure>
    );
  }

  if (b.kind === 'formula') {
    return (
      <pre className="font-mono text-sm bg-mckinsey-navy text-white rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {b.lines.join('\n')}
      </pre>
    );
  }

  if (b.kind === 'table') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-mckinsey-navy text-white">
              {b.head.map((h, i) => (
                <th key={i} className="text-left px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, ri) => (
              <tr
                key={ri}
                className={
                  b.highlightRow === ri
                    ? 'bg-mckinsey-gold/15 font-medium'
                    : ri % 2
                    ? 'bg-mckinsey-light'
                    : 'bg-white'
                }
              >
                {r.map((c, ci) => (
                  <td
                    key={ci}
                    className={`px-3 py-2 border-b border-mckinsey-border text-mckinsey-navy ${
                      ci > 0 ? 'font-mono text-xs' : ''
                    }`}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (b.kind === 'callout') {
    const style = {
      insight: { border: 'border-mckinsey-teal', bg: 'bg-mckinsey-teal/5', label: '关键' },
      warn: { border: 'border-red-400', bg: 'bg-red-50', label: '注意' },
      note: { border: 'border-mckinsey-gold', bg: 'bg-mckinsey-gold/10', label: '说明' },
    }[b.tone];
    return (
      <div className={`border-l-4 ${style.border} ${style.bg} rounded-r-lg px-4 py-3`}>
        <div className="text-xs font-semibold text-mckinsey-navy/60 mb-1">{style.label}</div>
        <p className="text-sm text-mckinsey-navy/85 leading-relaxed">{b.body}</p>
      </div>
    );
  }

  if (b.kind === 'steps') {
    return (
      <div className="space-y-3">
        {b.items.map((it, i) => (
          <div key={i} className="flex gap-3">
            <div className="shrink-0 min-w-[3.5rem] px-2 py-1 rounded bg-mckinsey-navy text-white text-xs font-mono text-center h-fit">
              {it.label}
            </div>
            <p className="text-sm text-mckinsey-navy/85 leading-relaxed pt-0.5">{it.body}</p>
          </div>
        ))}
      </div>
    );
  }

  if (b.kind === 'compare') {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { d: b.left, tone: 'muted' as const },
          { d: b.right, tone: 'teal' as const },
        ].map(({ d, tone }, i) => (
          <div
            key={i}
            className={`rounded-lg border p-4 ${
              tone === 'teal'
                ? 'border-mckinsey-teal/40 bg-mckinsey-teal/5'
                : 'border-mckinsey-border bg-mckinsey-light'
            }`}
          >
            <h4
              className={`text-sm font-semibold mb-3 ${
                tone === 'teal' ? 'text-mckinsey-teal' : 'text-mckinsey-muted'
              }`}
            >
              {d.title}
            </h4>
            <ul className="space-y-2">
              {d.items.map((it, j) => (
                <li key={j} className="text-sm text-mckinsey-navy/80 leading-snug flex gap-2">
                  <span className="opacity-40 shrink-0">·</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
