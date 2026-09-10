import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const QUICK_TOPICS = [
  'DMAIC 各阶段应该做什么？',
  '我该用什么工具分析这个问题？',
  '怎么做 FMEA？',
  'Cpk 和 Ppk 的区别是什么？',
  '如何判断测量系统是否可接受？',
  '控制图出现什么信号需要行动？',
  'DOE 实验怎么设计？',
  '5Why 分析怎么避免流于表面？',
];

interface Msg { role: 'user' | 'assistant'; content: string; }

export default function CoachPage() {
  const { token } = useAuth();
  const [mode, setMode] = useState<'do' | 'teach'>('do');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamContent]);

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || streaming) return;
    setInput('');
    const newMessages: Msg[] = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setStreaming(true);
    setStreamContent('');

    try {
      const res = await fetch('/api/v1/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: msg, mode, history: messages }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (line.startsWith('data: ')) {
              const d = line.slice(6);
              if (d === '[DONE]') break;
              try { const p = JSON.parse(d); if (p.content) { full += p.content; setStreamContent(full); } } catch {}
            }
          }
        }
      }
      if (full) setMessages([...newMessages, { role: 'assistant', content: full }]);
    } catch (e) { console.error(e); }
    finally { setStreaming(false); setStreamContent(''); }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      <Head>
        <title>AI 六西格玛教练 - AI Quality Portal</title>
        <meta name="description" content="AI 六西格玛教练 - 帮你做 或 教你做，双模式质量能力提升" />
      </Head>

      <div className="pt-16 flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
        {/* Header */}
        <div className="bg-mckinsey-navy text-white px-6 lg:px-16 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="accent-bar mb-4" />
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">AI 六西格玛教练</h1>
            <p className="text-white/60 text-sm mb-5">黑带大师级 AI 顾问 · 随时可用</p>

            {/* Mode toggle */}
            <div className="inline-flex rounded-xl bg-white/10 p-1 backdrop-blur">
              <button onClick={() => setMode('do')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'do' ? 'bg-mckinsey-teal text-white shadow-lg' : 'text-white/60 hover:text-white'
                }`}>
                🚀 帮我做
              </button>
              <button onClick={() => setMode('teach')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'teach' ? 'bg-mckinsey-gold text-white shadow-lg' : 'text-white/60 hover:text-white'
                }`}>
                🎓 教我做
              </button>
            </div>
            <p className="text-white/50 text-xs mt-2">
              {mode === 'do'
                ? '直接给出完整可用的结果、模板和具体步骤'
                : '通过提问引导你自己推导，边做边学'}
            </p>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-gray-50/40">
          <div className="max-w-4xl mx-auto px-6 lg:px-16 py-6">
            {messages.length === 0 && !streaming && (
              <div className="py-8">
                <p className="text-sm text-mckinsey-muted mb-4">常见问题，点击直接提问：</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {QUICK_TOPICS.map(t => (
                    <button key={t} onClick={() => send(t)}
                      className="text-left px-4 py-3 bg-white border border-mckinsey-border rounded-xl text-sm text-mckinsey-navy hover:border-mckinsey-teal hover:shadow-sm transition-all">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    {m.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
                          mode === 'teach' ? 'bg-mckinsey-gold' : 'bg-mckinsey-teal'
                        }`}>AI</span>
                        <span className="text-[10px] text-mckinsey-muted">
                          {mode === 'teach' ? '教练模式' : '助手模式'}
                        </span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 ${
                      m.role === 'user' ? 'bg-mckinsey-navy text-white' : 'bg-white border border-mckinsey-border/60 shadow-sm'
                    }`}>
                      {m.role === 'user' ? (
                        <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-p:text-sm prose-p:my-1 prose-headings:text-sm prose-headings:text-mckinsey-navy prose-headings:mt-3 prose-headings:mb-1 prose-li:text-sm prose-li:my-0.5 prose-table:text-xs prose-strong:text-mckinsey-navy">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {streaming && (
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${
                        mode === 'teach' ? 'bg-mckinsey-gold' : 'bg-mckinsey-teal'
                      }`}>AI</span>
                      <span className="text-[10px] text-mckinsey-muted">
                        {mode === 'teach' ? '教练模式' : '助手模式'}
                      </span>
                    </div>
                    <div className="bg-white border border-mckinsey-border/60 rounded-2xl px-4 py-3 shadow-sm">
                      {streamContent ? (
                        <div className="prose prose-sm max-w-none prose-p:text-sm prose-p:my-1 prose-headings:text-sm prose-li:text-sm prose-table:text-xs">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-mckinsey-muted">
                          <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                          <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                          思考中...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-mckinsey-border bg-white py-4 px-6 lg:px-16 sticky bottom-0">
          <div className="max-w-4xl mx-auto flex gap-3 items-end">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown}
              disabled={streaming} rows={2}
              className="flex-1 px-4 py-3 rounded-xl border border-mckinsey-border text-sm focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/20 focus:border-mckinsey-teal resize-none"
              placeholder={mode === 'do' ? '描述你的任务，AI 直接帮你完成...' : '提出你想学的内容，AI 会引导你思考...'} />
            <button onClick={() => send()} disabled={!input.trim() || streaming}
              className={`p-3 rounded-xl text-white disabled:opacity-40 transition-colors ${
                mode === 'teach' ? 'bg-mckinsey-gold hover:bg-mckinsey-gold/90' : 'bg-mckinsey-teal hover:bg-mckinsey-teal/90'
              }`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setStreamContent(''); }}
                className="px-3 py-3 text-xs text-mckinsey-muted hover:text-red-600 transition-colors">
                清空
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
