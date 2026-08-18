import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const STEPS = [
  { id: 'describe', label: '问题描述' },
  { id: 'define', label: '问题定义' },
  { id: 'rca', label: '原因分析' },
  { id: 'measures', label: '改善措施' },
  { id: '8d', label: '8D报告' },
];

const typeLabels: Record<string, string> = {
  complaint: '客户投诉', incoming: '来料异常', process: '制程异常',
  failure: '产品失效', supplier: '供应商问题', internal: '内部质量问题',
};

const stepIndex: Record<string, number> = { describe: 0, define: 1, rca: 2, measures: 3, '8d': 4 };

interface Message { id?: number; role: string; content: string; step?: string; }
interface Evidence { id: number; title: string; evidence_type: string; source: string; confidence: number | null; verification_status: string; }
interface TimelineEvent { id: number; event_type: string; description: string; actor: string; created_at: string; }

export default function CaseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showPanel, setShowPanel] = useState<'chat' | 'evidence' | 'timeline'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (id && token) loadCase(); }, [id, token]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamingContent]);

  async function loadCase() {
    const res = await fetch(`/api/v1/cases/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setCaseData(data);
      setMessages(data.messages || []);
      setEvidences(data.evidences || []);
      setTimeline(data.timeline || []);
      if (data.messages?.length === 1 && data.messages[0].role === 'user') {
        triggerAI(data.messages[0].content);
      }
    }
  }

  async function triggerAI(userMessage: string) {
    setStreaming(true); setStreamingContent('');
    try {
      const res = await fetch(`/api/v1/cases/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (line.startsWith('data: ')) {
              const d = line.slice(6);
              if (d === '[DONE]') break;
              try { const p = JSON.parse(d); if (p.content) { fullContent += p.content; setStreamingContent(fullContent); } } catch {}
            }
          }
        }
      }
      if (fullContent) setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);
    } catch (err) { console.error(err); }
    finally { setStreaming(false); setStreamingContent(''); }
  }

  async function handleSend() {
    if (!input.trim() || streaming) return;
    const msg = input.trim(); setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    await triggerAI(msg);
  }

  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }

  async function handleConfirm(field: string) {
    const lastAI = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAI) return;
    const res = await fetch(`/api/v1/cases/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ field, value: lastAI.content.slice(0, 3000) }),
    });
    if (res.ok) { loadCase(); }
  }

  async function handleGenerate8D() {
    const res = await fetch(`/api/v1/cases/${id}/generate-8d`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const reportText = Object.entries(data.report).map(([k, v]) => `**${k}**\n${v || '(待完善)'}`).join('\n\n');
      setMessages(prev => [...prev, { role: 'system', content: `📋 8D报告已生成:\n\n${reportText}` }]);
    }
  }

  async function handleExport8D() {
    try {
      const res = await fetch(`/api/v1/cases/${id}/export-8d`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `8D_Report_${id}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) { console.error(err); }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const formData = new FormData(); formData.append('file', file); formData.append('description', '');
    try {
      const res = await fetch(`/api/v1/cases/${id}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (res.ok) { const data = await res.json(); setMessages(prev => [...prev, { role: 'system', content: `📎 已上传: ${data.title}` }]); loadCase(); }
    } catch (err) { console.error(err); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  const currentStepIdx = stepIndex[caseData?.current_step] ?? 0;

  // Determine available confirm actions
  const getConfirmButton = () => {
    if (!caseData) return null;
    const step = caseData.current_step;
    const hasAIResponse = messages.filter(m => m.role === 'assistant').length >= 1;
    if (!hasAIResponse) return null;

    if (step === 'describe') return { field: 'problem_statement', label: '确认问题定义', desc: '确认后进入原因分析' };
    if (step === 'rca') return { field: 'root_cause', label: '确认根因', desc: '确认后进入措施制定' };
    if (step === 'measures') return { field: 'measures', label: '确认措施', desc: '确认后生成8D报告' };
    return null;
  };

  const confirmBtn = getConfirmButton();

  if (!caseData) return <div className="pt-16 min-h-screen flex items-center justify-center text-mckinsey-muted">加载中...</div>;

  return (
    <>
      <Head><title>{caseData.title} - AI Quality Portal</title></Head>
      <div className="pt-16">
        <AuthGuard>
          <div className="flex h-[calc(100vh-64px)]">
            {/* Left panel */}
            <div className="w-72 border-r border-mckinsey-border bg-mckinsey-light/30 p-5 overflow-y-auto flex-shrink-0 flex flex-col">
              <div className="mb-5">
                <span className="text-xs text-mckinsey-teal font-medium uppercase tracking-wide">{typeLabels[caseData.case_type]}</span>
                <h2 className="text-sm font-semibold text-mckinsey-navy mt-1 leading-tight">{caseData.title}</h2>
              </div>

              {/* Steps */}
              <div className="space-y-0.5 mb-5">
                {STEPS.map((step, i) => {
                  const isCurrent = i === currentStepIdx;
                  const isDone = i < currentStepIdx;
                  return (
                    <div key={step.id} className={`flex items-center gap-2.5 py-2 px-2.5 rounded-lg ${isCurrent ? 'bg-white shadow-sm' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isDone ? 'bg-mckinsey-teal text-white' : isCurrent ? 'bg-mckinsey-navy text-white' : 'bg-mckinsey-border/60 text-mckinsey-muted'
                      }`}>{isDone ? '✓' : i + 1}</div>
                      <span className={`text-xs ${isCurrent ? 'font-semibold text-mckinsey-navy' : isDone ? 'text-mckinsey-teal' : 'text-mckinsey-muted'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Confirmed info */}
              {caseData.problem_statement && (
                <div className="mb-3 p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/50">
                  <h4 className="text-[10px] font-semibold text-emerald-700 uppercase mb-1">✓ 问题定义</h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed line-clamp-3">{caseData.problem_statement.slice(0, 150)}</p>
                </div>
              )}
              {caseData.root_cause && (
                <div className="mb-3 p-3 bg-amber-50/50 rounded-lg border border-amber-200/50">
                  <h4 className="text-[10px] font-semibold text-amber-700 uppercase mb-1">✓ 根因</h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed line-clamp-3">{caseData.root_cause.slice(0, 150)}</p>
                </div>
              )}

              {/* Evidence count */}
              {evidences.length > 0 && (
                <button onClick={() => setShowPanel('evidence')}
                  className="mb-3 w-full p-2.5 bg-blue-50/50 rounded-lg border border-blue-200/50 text-left hover:bg-blue-50 transition-colors">
                  <span className="text-[10px] font-semibold text-blue-700 uppercase">📎 证据 ({evidences.length})</span>
                </button>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Action buttons */}
              <div className="space-y-2 pt-3 border-t border-mckinsey-border">
                {confirmBtn && (
                  <button onClick={() => handleConfirm(confirmBtn.field)}
                    className="w-full px-3 py-2.5 bg-mckinsey-teal text-white text-xs font-medium rounded-lg hover:bg-mckinsey-teal/90 transition-colors">
                    ✓ {confirmBtn.label}
                  </button>
                )}
                {caseData.current_step === '8d' && (
                  <div className="space-y-2">
                    <button onClick={handleGenerate8D}
                      className="w-full px-3 py-2.5 bg-mckinsey-navy text-white text-xs font-medium rounded-lg hover:bg-mckinsey-blue transition-colors">
                      📋 生成8D报告
                    </button>
                    <button onClick={handleExport8D}
                      className="w-full px-3 py-2.5 bg-white border border-mckinsey-border text-mckinsey-navy text-xs font-medium rounded-lg hover:bg-mckinsey-light transition-colors text-center">
                      📥 导出 Word
                    </button>
                  </div>
                )}
                {confirmBtn && (
                  <p className="text-[10px] text-mckinsey-muted text-center">{confirmBtn.desc}</p>
                )}
              </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col bg-gray-50/30">
              {/* Tab bar */}
              <div className="flex border-b border-mckinsey-border bg-white px-4">
                {(['chat', 'evidence', 'timeline'] as const).map(tab => (
                  <button key={tab} onClick={() => setShowPanel(tab)}
                    className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                      showPanel === tab ? 'border-mckinsey-teal text-mckinsey-navy' : 'border-transparent text-mckinsey-muted hover:text-mckinsey-navy'
                    }`}>
                    {tab === 'chat' ? '💬 AI对话' : tab === 'evidence' ? `📎 证据 (${evidences.length})` : `📅 时间线 (${timeline.length})`}
                  </button>
                ))}
              </div>

              {/* Chat panel */}
              {showPanel === 'chat' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'system' ? (
                          <div className="w-full max-w-2xl mx-auto">
                            <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-2.5 text-xs text-amber-800 text-center">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                        ) : (
                          <div className={`max-w-[78%]`}>
                            {msg.role === 'assistant' && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-4 h-4 rounded-full bg-mckinsey-teal/20 flex items-center justify-center">
                                  <span className="text-[8px] text-mckinsey-teal font-bold">AI</span>
                                </div>
                                <span className="text-[10px] text-mckinsey-muted">AI质量工程师</span>
                              </div>
                            )}
                            <div className={`rounded-2xl px-4 py-3 ${
                              msg.role === 'user' ? 'bg-mckinsey-navy text-white' : 'bg-white border border-mckinsey-border/60 shadow-sm'
                            }`}>
                              {msg.role === 'user' ? (
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                              ) : (
                                <div className="prose prose-sm prose-slate max-w-none
                                  prose-headings:text-mckinsey-navy prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:text-sm
                                  prose-p:my-1 prose-p:text-mckinsey-navy prose-p:text-sm prose-p:leading-relaxed
                                  prose-strong:text-mckinsey-navy
                                  prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-li:text-sm
                                  prose-table:text-xs prose-th:px-2 prose-th:py-1 prose-th:bg-mckinsey-light prose-td:px-2 prose-td:py-1 prose-td:border-mckinsey-border
                                  prose-hr:my-2">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {streaming && streamingContent && (
                      <div className="flex justify-start">
                        <div className="max-w-[78%]">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-4 h-4 rounded-full bg-mckinsey-teal/20 flex items-center justify-center">
                              <span className="text-[8px] text-mckinsey-teal font-bold">AI</span>
                            </div>
                            <span className="text-[10px] text-mckinsey-muted">AI质量工程师</span>
                          </div>
                          <div className="bg-white border border-mckinsey-border/60 rounded-2xl px-4 py-3 shadow-sm">
                            <div className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-p:text-sm">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {streaming && !streamingContent && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-mckinsey-border/60 rounded-2xl px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2 text-xs text-mckinsey-muted">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                              <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                              <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                            </div>
                            AI正在分析...
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  {/* Input */}
                  <div className="border-t border-mckinsey-border p-3 bg-white">
                    <div className="flex gap-2 max-w-4xl mx-auto items-end">
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.ppt,.pptx" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                        className="p-2.5 rounded-lg border border-mckinsey-border hover:bg-mckinsey-light transition-colors text-mckinsey-muted hover:text-mckinsey-navy disabled:opacity-50" title="上传文件">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                        </svg>
                      </button>
                      <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={streaming}
                        className="flex-1 px-3 py-2.5 rounded-lg border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/20 focus:border-mckinsey-teal transition-all resize-none text-sm" placeholder="输入信息..." rows={1} />
                      <button onClick={handleSend} disabled={!input.trim() || streaming}
                        className="p-2.5 bg-mckinsey-teal text-white rounded-lg hover:bg-mckinsey-teal/90 disabled:opacity-50 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Evidence panel */}
              {showPanel === 'evidence' && (
                <div className="flex-1 overflow-y-auto p-5">
                  <h3 className="text-sm font-semibold text-mckinsey-navy mb-4">证据池</h3>
                  {evidences.length === 0 ? (
                    <p className="text-sm text-mckinsey-muted">暂无证据，上传文件后将自动添加</p>
                  ) : (
                    <div className="space-y-3">
                      {evidences.map(ev => (
                        <div key={ev.id} className="bg-white border border-mckinsey-border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-mckinsey-navy">{ev.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{ev.evidence_type}</span>
                                <span className="text-[10px] text-mckinsey-muted">{ev.source}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              ev.verification_status === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                              ev.verification_status === 'conflicting' ? 'bg-red-50 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>{ev.verification_status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Timeline panel */}
              {showPanel === 'timeline' && (
                <div className="flex-1 overflow-y-auto p-5">
                  <h3 className="text-sm font-semibold text-mckinsey-navy mb-4">案例时间线</h3>
                  {timeline.length === 0 ? (
                    <p className="text-sm text-mckinsey-muted">暂无事件</p>
                  ) : (
                    <div className="relative pl-6">
                      <div className="absolute left-2 top-2 bottom-2 w-px bg-mckinsey-border"></div>
                      {timeline.map(ev => (
                        <div key={ev.id} className="relative mb-4">
                          <div className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                            ev.event_type === 'confirmed' ? 'bg-mckinsey-teal' :
                            ev.event_type === 'created' ? 'bg-mckinsey-navy' :
                            'bg-mckinsey-muted'
                          }`}></div>
                          <div className="ml-2">
                            <p className="text-sm text-mckinsey-navy">{ev.description}</p>
                            <p className="text-[10px] text-mckinsey-muted mt-0.5">
                              {ev.created_at ? new Date(ev.created_at).toLocaleString('zh-CN') : ''} · {ev.actor}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
