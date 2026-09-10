import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const STEPS = [
  { id: 'describe', label: '问题描述' },
  { id: 'define', label: '问题定义' },
  { id: 'rca', label: '原因分析' },
  { id: 'measures', label: '改善措施' },
  { id: 'verify', label: '效果验证' },
  { id: '8d', label: '8D报告' },
];
const stepIndex: Record<string, number> = { describe: 0, define: 1, rca: 2, measures: 3, verify: 4, '8d': 5 };

const typeLabels: Record<string, string> = {
  complaint: '客户投诉', incoming: '来料异常', process: '制程异常',
  failure: '产品失效', supplier: '供应商问题', internal: '内部质量问题',
};

const CATEGORIES = [
  { id: 'man', label: '人 Man' },
  { id: 'machine', label: '机 Machine' },
  { id: 'material', label: '料 Material' },
  { id: 'method', label: '法 Method' },
  { id: 'measurement', label: '测 Measurement' },
  { id: 'environment', label: '环 Environment' },
  { id: 'design', label: '设计 Design' },
  { id: 'system', label: '系统 System' },
];

const RC_STATUS = [
  { id: 'hypothesis', label: '待验证', cls: 'bg-gray-100 text-gray-700' },
  { id: 'high_probability', label: '高概率', cls: 'bg-amber-50 text-amber-700' },
  { id: 'confirmed', label: '已确认', cls: 'bg-emerald-50 text-emerald-700' },
  { id: 'rejected', label: '已排除', cls: 'bg-red-50 text-red-700' },
];

const ACTION_TYPES = [
  { id: 'containment', label: '临时遏制', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'corrective', label: '纠正措施', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'preventive', label: '预防措施', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

interface Msg { id?: number; role: string; content: string; step?: string; }

export default function CaseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();

  const [caseData, setCaseData] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [evidences, setEvidences] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [rootCauses, setRootCauses] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);

  const [tab, setTab] = useState<'chat' | 'rc' | 'actions' | 'verify' | 'evidence' | 'timeline'>('chat');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const authHeaders = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const loadAll = useCallback(async () => {
    if (!id || !token) return;
    const h = { Authorization: `Bearer ${token}` };
    try {
      const [c, rc, ac, cov, ver] = await Promise.all([
        fetch(`/api/v1/cases/${id}`, { headers: h }).then(r => r.ok ? r.json() : null),
        fetch(`/api/v1/cases/${id}/root-causes`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`/api/v1/cases/${id}/actions`, { headers: h }).then(r => r.ok ? r.json() : []),
        fetch(`/api/v1/cases/${id}/action-coverage`, { headers: h }).then(r => r.ok ? r.json() : null),
        fetch(`/api/v1/cases/${id}/verifications`, { headers: h }).then(r => r.ok ? r.json() : []),
      ]);
      if (c) {
        setCaseData(c);
        setMessages(c.messages || []);
        setEvidences(c.evidences || []);
        setTimeline(c.timeline || []);
        if (c.messages?.length === 1 && c.messages[0].role === 'user') triggerAI(c.messages[0].content);
      }
      setRootCauses(Array.isArray(rc) ? rc : []);
      setActions(Array.isArray(ac) ? ac : []);
      setCoverage(cov);
      setVerifications(Array.isArray(ver) ? ver : []);
    } catch (e) { console.error(e); }
  }, [id, token]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { if (tab === 'chat') endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streamContent, tab]);

  async function streamPost(url: string, body: any, onChunk: (s: string) => void) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
    const reader = res.body?.getReader();
    const dec = new TextDecoder();
    let full = '';
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n')) {
          if (line.startsWith('data: ')) {
            const d = line.slice(6);
            if (d === '[DONE]') break;
            try { const p = JSON.parse(d); if (p.content) { full += p.content; onChunk(full); } } catch {}
          }
        }
      }
    }
    return full;
  }

  async function triggerAI(msg: string) {
    setStreaming(true); setStreamContent('');
    try {
      const full = await streamPost(`/api/v1/cases/${id}/chat`, { message: msg }, setStreamContent);
      if (full) setMessages(prev => [...prev, { role: 'assistant', content: full }]);
    } catch (e) { console.error(e); }
    finally { setStreaming(false); setStreamContent(''); }
  }

  async function send() {
    if (!input.trim() || streaming) return;
    const msg = input.trim(); setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    await triggerAI(msg);
  }

  async function confirmStep(field: string) {
    const lastAI = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAI) return;
    const res = await fetch(`/api/v1/cases/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ field, value: lastAI.content.slice(0, 3000) }),
    });
    if (res.ok) loadAll();
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', f); fd.append('description', '');
    try {
      const res = await fetch(`/api/v1/cases/${id}/upload`, { method: 'POST', headers: authHeaders(), body: fd });
      if (res.ok) {
        const d = await res.json();
        const note = d.extracted ? `已提取 ${d.extract_chars} 字符，AI 可直接分析内容` : `未提取文本 (${d.extract_note})`;
        setMessages(prev => [...prev, { role: 'system', content: `📎 已上传: ${d.title} — ${note}` }]);
        loadAll();
      }
    } catch (e) { console.error(e); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  const currentIdx = stepIndex[caseData?.current_step] ?? 0;
  const confirmBtn = (() => {
    if (!caseData || messages.filter(m => m.role === 'assistant').length < 1) return null;
    const s = caseData.current_step;
    if (s === 'describe') return { field: 'problem_statement', label: '确认问题定义', desc: '进入原因分析' };
    if (s === 'rca') return { field: 'root_cause', label: '确认根因', desc: '进入措施制定' };
    if (s === 'measures') return { field: 'measures', label: '确认措施', desc: '进入效果验证' };
    return null;
  })();

  if (!caseData) return <div className="pt-16 min-h-screen flex items-center justify-center text-mckinsey-muted">加载中...</div>;

  const confirmedRcCount = rootCauses.filter(r => r.status === 'confirmed').length;

  return (
    <>
      <Head><title>{caseData.title} - AI Quality Portal</title></Head>
      <div className="pt-16">
        <AuthGuard>
          <div className="flex h-[calc(100vh-64px)]">
            {/* LEFT PANEL */}
            <div className="w-64 border-r border-mckinsey-border bg-mckinsey-light/30 p-4 overflow-y-auto flex-shrink-0 flex flex-col">
              <div className="mb-4">
                <span className="text-[10px] text-mckinsey-teal font-medium uppercase tracking-wide">{typeLabels[caseData.case_type]}</span>
                <h2 className="text-sm font-semibold text-mckinsey-navy mt-1 leading-tight">{caseData.title}</h2>
                {caseData.archived && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] rounded-full">已归档</span>
                )}
              </div>

              <div className="space-y-0.5 mb-4">
                {STEPS.map((s, i) => {
                  const cur = i === currentIdx, done = i < currentIdx;
                  return (
                    <div key={s.id} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${cur ? 'bg-white shadow-sm' : ''}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                        done ? 'bg-mckinsey-teal text-white' : cur ? 'bg-mckinsey-navy text-white' : 'bg-mckinsey-border/60 text-mckinsey-muted'
                      }`}>{done ? '✓' : i + 1}</div>
                      <span className={`text-[11px] ${cur ? 'font-semibold text-mckinsey-navy' : done ? 'text-mckinsey-teal' : 'text-mckinsey-muted'}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => setTab('rc')} className="bg-white rounded-lg p-2 text-left hover:shadow-sm transition-shadow">
                  <div className="text-base font-bold text-mckinsey-navy">{confirmedRcCount}/{rootCauses.length}</div>
                  <div className="text-[9px] text-mckinsey-muted">根因确认</div>
                </button>
                <button onClick={() => setTab('actions')} className="bg-white rounded-lg p-2 text-left hover:shadow-sm transition-shadow">
                  <div className="text-base font-bold text-mckinsey-navy">{actions.length}</div>
                  <div className="text-[9px] text-mckinsey-muted">措施</div>
                </button>
              </div>

              {coverage && coverage.gaps?.length > 0 && (
                <button onClick={() => setTab('actions')}
                  className="mb-3 w-full p-2 bg-red-50 border border-red-200 rounded-lg text-left hover:bg-red-100 transition-colors">
                  <span className="text-[10px] font-semibold text-red-700">⚠ {coverage.gaps.length} 个根因无对应措施</span>
                </button>
              )}

              {caseData.problem_statement && (
                <div className="mb-2 p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200/50">
                  <h4 className="text-[9px] font-semibold text-emerald-700 uppercase mb-1">✓ 问题定义</h4>
                  <p className="text-[10px] text-emerald-800 leading-relaxed line-clamp-3">{caseData.problem_statement.slice(0, 120)}</p>
                </div>
              )}

              <div className="flex-1" />

              <div className="space-y-2 pt-3 border-t border-mckinsey-border">
                {confirmBtn && (
                  <>
                    <button onClick={() => confirmStep(confirmBtn.field)}
                      className="w-full px-3 py-2 bg-mckinsey-teal text-white text-[11px] font-medium rounded-lg hover:bg-mckinsey-teal/90">
                      ✓ {confirmBtn.label}
                    </button>
                    <p className="text-[9px] text-mckinsey-muted text-center">{confirmBtn.desc}</p>
                  </>
                )}
                {caseData.current_step === '8d' && (
                  <button onClick={async () => {
                    const res = await fetch(`/api/v1/cases/${id}/export-8d`, { headers: authHeaders() });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = `8D_${id}.docx`;
                      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
                    }
                  }} className="w-full px-3 py-2 bg-mckinsey-navy text-white text-[11px] font-medium rounded-lg hover:bg-mckinsey-blue">
                    📥 导出 8D Word
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 flex flex-col bg-gray-50/30 min-w-0">
              <div className="flex border-b border-mckinsey-border bg-white px-3 overflow-x-auto">
                {([
                  ['chat', '💬 AI对话'],
                  ['rc', `🔍 根因 (${rootCauses.length})`],
                  ['actions', `🛠 措施 (${actions.length})`],
                  ['verify', `📈 验证 (${verifications.length})`],
                  ['evidence', `📎 证据 (${evidences.length})`],
                  ['timeline', `📅 时间线`],
                ] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setTab(k as any)}
                    className={`px-3 py-2.5 text-[11px] font-medium border-b-2 whitespace-nowrap transition-colors ${
                      tab === k ? 'border-mckinsey-teal text-mckinsey-navy' : 'border-transparent text-mckinsey-muted hover:text-mckinsey-navy'
                    }`}>{label}</button>
                ))}
              </div>

              {/* CHAT */}
              {tab === 'chat' && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {messages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {m.role === 'system' ? (
                          <div className="w-full max-w-2xl mx-auto bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-2.5 text-xs text-amber-800 text-center">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="max-w-[80%]">
                            {m.role === 'assistant' && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-4 h-4 rounded-full bg-mckinsey-teal/20 flex items-center justify-center text-[8px] text-mckinsey-teal font-bold">AI</span>
                                <span className="text-[10px] text-mckinsey-muted">AI质量工程师</span>
                              </div>
                            )}
                            <div className={`rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-mckinsey-navy text-white' : 'bg-white border border-mckinsey-border/60 shadow-sm'}`}>
                              {m.role === 'user' ? (
                                <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                              ) : (
                                <div className="prose prose-sm max-w-none prose-p:text-sm prose-p:my-1 prose-headings:text-sm prose-headings:text-mckinsey-navy prose-li:text-sm prose-table:text-xs prose-strong:text-mckinsey-navy">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {streaming && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%]">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="w-4 h-4 rounded-full bg-mckinsey-teal/20 flex items-center justify-center text-[8px] text-mckinsey-teal font-bold">AI</span>
                            <span className="text-[10px] text-mckinsey-muted">AI质量工程师</span>
                          </div>
                          <div className="bg-white border border-mckinsey-border/60 rounded-2xl px-4 py-3 shadow-sm">
                            {streamContent ? (
                              <div className="prose prose-sm max-w-none prose-p:text-sm prose-p:my-1 prose-table:text-xs">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-mckinsey-muted">
                                <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                                <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                                AI正在分析...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>
                  <div className="border-t border-mckinsey-border p-3 bg-white">
                    <div className="flex gap-2 max-w-4xl mx-auto items-end">
                      <input type="file" ref={fileRef} className="hidden" onChange={upload}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.ppt,.pptx" />
                      <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        title="上传文件（PDF/Word/Excel 会自动提取文本供 AI 分析）"
                        className="p-2.5 rounded-lg border border-mckinsey-border hover:bg-mckinsey-light text-mckinsey-muted hover:text-mckinsey-navy disabled:opacity-50">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                        </svg>
                      </button>
                      <textarea value={input} onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                        disabled={streaming} rows={1}
                        className="flex-1 px-3 py-2.5 rounded-lg border border-mckinsey-border text-sm focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/20 resize-none"
                        placeholder="输入信息..." />
                      <button onClick={send} disabled={!input.trim() || streaming}
                        className="p-2.5 bg-mckinsey-teal text-white rounded-lg hover:bg-mckinsey-teal/90 disabled:opacity-50">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {tab === 'rc' && <RootCausePanel caseId={String(id)} authHeaders={authHeaders} rootCauses={rootCauses} reload={loadAll} />}
              {tab === 'actions' && <ActionsPanel caseId={String(id)} authHeaders={authHeaders} actions={actions} rootCauses={rootCauses} coverage={coverage} reload={loadAll} streamPost={streamPost} />}
              {tab === 'verify' && <VerifyPanel caseId={String(id)} authHeaders={authHeaders} verifications={verifications} reload={loadAll} streamPost={streamPost} />}

              {tab === 'evidence' && (
                <div className="flex-1 overflow-y-auto p-5">
                  <h3 className="text-sm font-semibold text-mckinsey-navy mb-4">证据池</h3>
                  {evidences.length === 0 ? (
                    <p className="text-sm text-mckinsey-muted">暂无证据。在 AI 对话中上传文件，PDF/Word/Excel 会自动提取文本供 AI 分析。</p>
                  ) : (
                    <div className="space-y-3">
                      {evidences.map(ev => (
                        <div key={ev.id} className="bg-white border border-mckinsey-border rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-medium text-mckinsey-navy truncate">{ev.title}</h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{ev.evidence_type}</span>
                                <span className="text-[10px] text-mckinsey-muted">{ev.source}</span>
                                {ev.has_extracted_text && (
                                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">✓ 已提取文本</span>
                                )}
                              </div>
                              {ev.content_preview && (
                                <p className="mt-2 text-[11px] text-mckinsey-muted leading-relaxed line-clamp-3 font-mono bg-mckinsey-light/50 p-2 rounded">
                                  {ev.content_preview}
                                </p>
                              )}
                            </div>
                            <button onClick={async () => {
                              if (!confirm('删除此证据？')) return;
                              await fetch(`/api/v1/cases/${id}/evidences/${ev.id}`, { method: 'DELETE', headers: authHeaders() });
                              loadAll();
                            }} className="text-mckinsey-muted hover:text-red-600 text-lg flex-shrink-0">×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'timeline' && (
                <div className="flex-1 overflow-y-auto p-5">
                  <h3 className="text-sm font-semibold text-mckinsey-navy mb-4">案例时间线</h3>
                  {timeline.length === 0 ? <p className="text-sm text-mckinsey-muted">暂无事件</p> : (
                    <div className="relative pl-6">
                      <div className="absolute left-2 top-2 bottom-2 w-px bg-mckinsey-border" />
                      {timeline.map(ev => (
                        <div key={ev.id} className="relative mb-4">
                          <div className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                            ev.event_type?.includes('confirm') ? 'bg-mckinsey-teal' :
                            ev.event_type === 'created' ? 'bg-mckinsey-navy' :
                            ev.event_type?.includes('root_cause') ? 'bg-amber-500' :
                            ev.event_type?.includes('action') ? 'bg-blue-500' :
                            ev.event_type?.includes('verification') ? 'bg-emerald-500' : 'bg-mckinsey-muted'
                          }`} />
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

/* ---------- Root Cause Panel ---------- */
function RootCausePanel({ caseId, authHeaders, rootCauses, reload }: any) {
  const [adding, setAdding] = useState(false);
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('machine');
  const [chain, setChain] = useState(['', '', '', '', '']);

  async function add() {
    if (!desc.trim()) return;
    await fetch(`/api/v1/cases/${caseId}/root-causes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        description: desc.trim(), category: cat, status: 'hypothesis',
        cause_chain: chain.filter(c => c.trim()),
      }),
    });
    setDesc(''); setChain(['', '', '', '', '']); setAdding(false); reload();
  }

  async function setStatus(rcId: number, status: string) {
    await fetch(`/api/v1/cases/${caseId}/root-causes/${rcId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ status }),
    });
    reload();
  }

  async function del(rcId: number) {
    if (!confirm('删除此根因？关联的措施会解除关联。')) return;
    await fetch(`/api/v1/cases/${caseId}/root-causes/${rcId}`, { method: 'DELETE', headers: authHeaders() });
    reload();
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-mckinsey-navy">候选根因</h3>
          <p className="text-[11px] text-mckinsey-muted mt-0.5">支持多根因。确认后措施必须与根因关联。</p>
        </div>
        <button onClick={() => setAdding(!adding)}
          className="px-3 py-1.5 bg-mckinsey-navy text-white text-[11px] font-medium rounded-lg hover:bg-mckinsey-blue">
          {adding ? '取消' : '+ 添加根因'}
        </button>
      </div>

      {adding && (
        <div className="card p-4 mb-4 border-l-4 border-l-mckinsey-teal">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div className="md:col-span-1">
              <label className="block text-[10px] text-mckinsey-muted mb-1">6M 分类</label>
              <select value={cat} onChange={(e) => setCat(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-mckinsey-border text-xs">
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] text-mckinsey-muted mb-1">根因描述</label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-mckinsey-border text-sm"
                placeholder="例如：夹具夹紧力不足导致工件位移" />
            </div>
          </div>
          <label className="block text-[10px] text-mckinsey-muted mb-1">5Why 链（可选）</label>
          <div className="space-y-1.5 mb-3">
            {chain.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-mckinsey-muted w-12">Why {i + 1}</span>
                <input value={c} onChange={(e) => { const n = [...chain]; n[i] = e.target.value; setChain(n); }}
                  className="flex-1 px-2 py-1.5 rounded border border-mckinsey-border text-xs" />
              </div>
            ))}
          </div>
          <button onClick={add} disabled={!desc.trim()}
            className="px-4 py-2 bg-mckinsey-teal text-white text-xs font-medium rounded-lg hover:bg-mckinsey-teal/90 disabled:opacity-40">
            保存根因
          </button>
        </div>
      )}

      {rootCauses.length === 0 ? (
        <p className="text-sm text-mckinsey-muted">暂无候选根因。可在 AI 对话中让 AI 提出候选原因，再逐条录入并验证。</p>
      ) : (
        <div className="space-y-3">
          {rootCauses.map((rc: any) => {
            const st = RC_STATUS.find(s => s.id === rc.status) || RC_STATUS[0];
            return (
              <div key={rc.id} className={`bg-white border rounded-lg p-4 ${rc.status === 'confirmed' ? 'border-emerald-300' : rc.status === 'rejected' ? 'border-red-200 opacity-60' : 'border-mckinsey-border'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                      {rc.category_label && (
                        <span className="text-[10px] px-2 py-0.5 bg-mckinsey-light text-mckinsey-navy rounded-full">{rc.category_label}</span>
                      )}
                      {rc.verified_by && (
                        <span className="text-[10px] text-mckinsey-muted">by {rc.verified_by}</span>
                      )}
                    </div>
                    <p className="text-sm text-mckinsey-navy">{rc.description}</p>
                    {rc.cause_chain?.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-mckinsey-border space-y-0.5">
                        {rc.cause_chain.map((c: string, i: number) => (
                          <p key={i} className="text-[11px] text-mckinsey-muted">Why {i + 1}: {c}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => del(rc.id)} className="text-mckinsey-muted hover:text-red-600 text-lg flex-shrink-0">×</button>
                </div>
                <div className="mt-3 pt-3 border-t border-mckinsey-border flex gap-2 flex-wrap">
                  {RC_STATUS.filter(s => s.id !== rc.status).map(s => (
                    <button key={s.id} onClick={() => setStatus(rc.id, s.id)}
                      className="px-2.5 py-1 text-[10px] font-medium rounded border border-mckinsey-border text-mckinsey-muted hover:text-mckinsey-navy hover:border-mckinsey-teal">
                      标为{s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Actions Panel ---------- */
function ActionsPanel({ caseId, authHeaders, actions, rootCauses, coverage, reload, streamPost }: any) {
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState('corrective');
  const [desc, setDesc] = useState('');
  const [rcId, setRcId] = useState('');
  const [owner, setOwner] = useState('');
  const [checkOut, setCheckOut] = useState<Record<number, string>>({});
  const [checking, setChecking] = useState<number | null>(null);

  async function add() {
    if (!desc.trim()) return;
    await fetch(`/api/v1/cases/${caseId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        action_type: type, description: desc.trim(),
        related_root_cause_id: rcId ? Number(rcId) : null,
        owner: owner || null,
      }),
    });
    setDesc(''); setRcId(''); setOwner(''); setAdding(false); reload();
  }

  async function del(aid: number) {
    if (!confirm('删除此措施？')) return;
    await fetch(`/api/v1/cases/${caseId}/actions/${aid}`, { method: 'DELETE', headers: authHeaders() });
    reload();
  }

  async function check(aid: number) {
    setChecking(aid);
    setCheckOut(prev => ({ ...prev, [aid]: '' }));
    try {
      await streamPost(`/api/v1/cases/${caseId}/actions/${aid}/check`, {},
        (s: string) => setCheckOut(prev => ({ ...prev, [aid]: s })));
    } catch (e) { console.error(e); }
    finally { setChecking(null); }
  }

  const confirmedRcs = rootCauses.filter((r: any) => r.status === 'confirmed');

  return (
    <div className="flex-1 overflow-y-auto p-5">
      {/* Coverage panel */}
      {coverage && (
        <div className={`card p-4 mb-4 border-l-4 ${coverage.is_complete ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-mckinsey-navy">措施覆盖度检查</h3>
            {coverage.coverage_rate !== null && (
              <span className={`text-lg font-bold ${coverage.coverage_rate === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {coverage.coverage_rate}%
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {[
              ['已确认根因', coverage.confirmed_root_causes],
              ['临时遏制', coverage.containment_actions],
              ['纠正措施', coverage.corrective_actions],
              ['预防措施', coverage.preventive_actions],
            ].map(([l, v]) => (
              <div key={String(l)} className="bg-mckinsey-light rounded p-2 text-center">
                <div className="text-sm font-bold text-mckinsey-navy">{v}</div>
                <div className="text-[9px] text-mckinsey-muted">{l}</div>
              </div>
            ))}
          </div>
          {coverage.gaps?.length > 0 && (
            <div className="mb-2 space-y-1">
              {coverage.gaps.map((g: any) => (
                <div key={g.root_cause_id} className="text-[11px] text-red-700 bg-red-50 rounded px-2 py-1.5">
                  ⚠ 根因「{g.description.slice(0, 40)}」缺少纠正措施
                </div>
              ))}
            </div>
          )}
          {coverage.orphan_actions?.length > 0 && (
            <div className="mb-2 space-y-1">
              {coverage.orphan_actions.map((o: any) => (
                <div key={o.action_id} className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1.5">
                  ⚠ 措施「{o.description.slice(0, 40)}」未关联任何根因
                </div>
              ))}
            </div>
          )}
          {coverage.warnings?.map((w: string, i: number) => (
            <div key={i} className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1.5 mb-1">⚠ {w}</div>
          ))}
          {coverage.is_complete && (
            <div className="text-[11px] text-emerald-700 bg-emerald-50 rounded px-2 py-1.5">✓ 所有已确认根因均有对应措施，三类措施齐备</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-mckinsey-navy">改善措施</h3>
        <button onClick={() => setAdding(!adding)}
          className="px-3 py-1.5 bg-mckinsey-navy text-white text-[11px] font-medium rounded-lg hover:bg-mckinsey-blue">
          {adding ? '取消' : '+ 添加措施'}
        </button>
      </div>

      {adding && (
        <div className="card p-4 mb-4 border-l-4 border-l-mckinsey-teal">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-[10px] text-mckinsey-muted mb-1">措施类型</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-mckinsey-border text-xs">
                {ACTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-mckinsey-muted mb-1">
                对应根因 {type === 'corrective' && <span className="text-red-600">*纠正措施必须关联</span>}
              </label>
              <select value={rcId} onChange={(e) => setRcId(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-mckinsey-border text-xs">
                <option value="">— 未关联 —</option>
                {rootCauses.map((rc: any) => (
                  <option key={rc.id} value={rc.id}>
                    [{rc.status === 'confirmed' ? '已确认' : '待验证'}] {rc.description.slice(0, 50)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div className="md:col-span-3">
              <label className="block text-[10px] text-mckinsey-muted mb-1">措施描述</label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-mckinsey-border text-sm"
                placeholder="例如：重新设计夹具，改为弹簧预压式夹紧" />
            </div>
            <div>
              <label className="block text-[10px] text-mckinsey-muted mb-1">责任人</label>
              <input value={owner} onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-mckinsey-border text-sm" placeholder="选填" />
            </div>
          </div>
          {type === 'corrective' && !rcId && (
            <p className="text-[11px] text-amber-700 mb-2">
              提示：纠正措施应对应具体根因，否则无法验证是否真正消除了问题
            </p>
          )}
          <button onClick={add} disabled={!desc.trim()}
            className="px-4 py-2 bg-mckinsey-teal text-white text-xs font-medium rounded-lg hover:bg-mckinsey-teal/90 disabled:opacity-40">
            保存措施
          </button>
        </div>
      )}

      {actions.length === 0 ? (
        <p className="text-sm text-mckinsey-muted">暂无措施。建议先在根因页确认根因，再针对每个根因制定纠正措施。</p>
      ) : (
        <div className="space-y-4">
          {ACTION_TYPES.map(t => {
            const group = actions.filter((a: any) => a.action_type === t.id);
            if (group.length === 0) return null;
            return (
              <div key={t.id}>
                <h4 className="text-[11px] font-semibold text-mckinsey-muted uppercase mb-2">{t.label} ({group.length})</h4>
                <div className="space-y-2">
                  {group.map((a: any) => (
                    <div key={a.id} className={`bg-white border rounded-lg p-3 ${t.cls.split(' ')[2] || 'border-mckinsey-border'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-mckinsey-navy">{a.description}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {a.related_root_cause ? (
                              <span className="text-[10px] px-2 py-0.5 bg-mckinsey-teal/10 text-mckinsey-teal rounded-full">
                                → {a.related_root_cause}
                              </span>
                            ) : a.action_type === 'corrective' ? (
                              <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">⚠ 未关联根因</span>
                            ) : null}
                            {a.owner && <span className="text-[10px] text-mckinsey-muted">负责人: {a.owner}</span>}
                            <span className="text-[10px] text-mckinsey-muted">{a.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => check(a.id)} disabled={checking === a.id}
                            title="AI 检查措施有效性"
                            className="px-2 py-1 text-[10px] font-medium rounded border border-mckinsey-border text-mckinsey-muted hover:text-mckinsey-navy hover:border-mckinsey-teal disabled:opacity-40">
                            {checking === a.id ? '...' : '✨ AI检查'}
                          </button>
                          <button onClick={() => del(a.id)} className="text-mckinsey-muted hover:text-red-600 text-lg">×</button>
                        </div>
                      </div>
                      {(checkOut[a.id] || a.effectiveness_check) && (
                        <div className="mt-3 pt-3 border-t border-mckinsey-border prose prose-sm max-w-none prose-p:text-[11px] prose-p:my-0.5 prose-headings:text-[11px] prose-strong:text-mckinsey-navy">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{checkOut[a.id] || a.effectiveness_check}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Verification Panel ---------- */
function VerifyPanel({ caseId, authHeaders, verifications, reload, streamPost }: any) {
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [metric, setMetric] = useState('');
  const [usl, setUsl] = useState('');
  const [lsl, setLsl] = useState('');
  const [lowerBetter, setLowerBetter] = useState(true);
  const [bDef, setBDef] = useState('');
  const [bTot, setBTot] = useState('');
  const [aDef, setADef] = useState('');
  const [aTot, setATot] = useState('');
  const [result, setResult] = useState<any>(null);
  const [aiOut, setAiOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  async function submit() {
    if (!before.trim() || !after.trim()) { alert('请填写改善前后数据'); return; }
    setLoading(true); setResult(null); setAiOut('');
    try {
      const res = await fetch(`/api/v1/cases/${caseId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          before_data: before, after_data: after,
          metric_name: metric || '指标',
          usl: usl ? Number(usl) : null,
          lsl: lsl ? Number(lsl) : null,
          lower_is_better: lowerBetter,
          before_defects: bDef ? Number(bDef) : null,
          before_total: bTot ? Number(bTot) : null,
          after_defects: aDef ? Number(aDef) : null,
          after_total: aTot ? Number(aTot) : null,
        }),
      });
      if (res.ok) { setResult(await res.json()); reload(); }
      else { const e = await res.json(); alert(e.detail || '提交失败'); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function interpret() {
    if (!result) return;
    setAiLoading(true); setAiOut('');
    try {
      await streamPost(`/api/v1/cases/${caseId}/verify/interpret`, { verification: result }, setAiOut);
    } catch (e) { console.error(e); }
    finally { setAiLoading(false); }
  }

  const verdictCls: Record<string, string> = {
    effective: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    partially_effective: 'bg-amber-50 border-amber-300 text-amber-800',
    ineffective: 'bg-red-50 border-red-300 text-red-800',
    insufficient_evidence: 'bg-gray-50 border-gray-300 text-gray-700',
  };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <h3 className="text-sm font-semibold text-mckinsey-navy mb-1">效果验证</h3>
      <p className="text-[11px] text-mckinsey-muted mb-4">输入改善前后数据，自动计算均值偏移、波动变化、Cpk 提升、显著性检验</p>

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-[11px] font-medium text-mckinsey-navy mb-1">改善前数据</label>
            <textarea value={before} onChange={(e) => setBefore(e.target.value)}
              className="w-full h-20 px-3 py-2 rounded-lg border border-mckinsey-border text-xs font-mono resize-none"
              placeholder="12.5, 13.1, 12.8, 13.4, 12.9..." />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-mckinsey-navy mb-1">改善后数据</label>
            <textarea value={after} onChange={(e) => setAfter(e.target.value)}
              className="w-full h-20 px-3 py-2 rounded-lg border border-mckinsey-border text-xs font-mono resize-none"
              placeholder="10.1, 10.3, 9.9, 10.2, 10.0..." />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          <div className="col-span-2 md:col-span-2">
            <label className="block text-[10px] text-mckinsey-muted mb-1">指标名称</label>
            <input value={metric} onChange={(e) => setMetric(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-mckinsey-border text-xs" placeholder="如: 尺寸偏差 (um)" />
          </div>
          <div>
            <label className="block text-[10px] text-mckinsey-muted mb-1">USL</label>
            <input value={usl} onChange={(e) => setUsl(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-mckinsey-border text-xs" placeholder="选填" />
          </div>
          <div>
            <label className="block text-[10px] text-mckinsey-muted mb-1">LSL</label>
            <input value={lsl} onChange={(e) => setLsl(e.target.value)}
              className="w-full px-2 py-1.5 rounded border border-mckinsey-border text-xs" placeholder="选填" />
          </div>
          <div>
            <label className="block text-[10px] text-mckinsey-muted mb-1">优化方向</label>
            <select value={lowerBetter ? 'lower' : 'higher'} onChange={(e) => setLowerBetter(e.target.value === 'lower')}
              className="w-full px-2 py-1.5 rounded border border-mckinsey-border text-xs">
              <option value="lower">越小越好</option>
              <option value="higher">越大越好</option>
            </select>
          </div>
        </div>

        <details className="mb-3">
          <summary className="text-[11px] text-mckinsey-teal cursor-pointer">+ 补充不良率数据（选填）</summary>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            <div>
              <label className="block text-[10px] text-mckinsey-muted mb-1">改善前不良数</label>
              <input value={bDef} onChange={(e) => setBDef(e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-mckinsey-border text-xs" />
            </div>
            <div>
              <label className="block text-[10px] text-mckinsey-muted mb-1">改善前总数</label>
              <input value={bTot} onChange={(e) => setBTot(e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-mckinsey-border text-xs" />
            </div>
            <div>
              <label className="block text-[10px] text-mckinsey-muted mb-1">改善后不良数</label>
              <input value={aDef} onChange={(e) => setADef(e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-mckinsey-border text-xs" />
            </div>
            <div>
              <label className="block text-[10px] text-mckinsey-muted mb-1">改善后总数</label>
              <input value={aTot} onChange={(e) => setATot(e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-mckinsey-border text-xs" />
            </div>
          </div>
        </details>

        <button onClick={submit} disabled={loading}
          className="px-5 py-2 bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white font-medium rounded-lg hover:shadow-lg disabled:opacity-40 text-sm">
          {loading ? '计算中...' : '提交验证'}
        </button>
      </div>

      {result && (
        <>
          <div className={`card p-4 mb-4 border-2 ${verdictCls[result.verdict] || ''}`}>
            <div className="text-center">
              <div className="text-lg font-bold">{result.verdict_label}</div>
              <div className="text-[11px] mt-1 opacity-80">{result.metric_name}</div>
            </div>
          </div>

          <div className="card p-4 mb-4">
            <h4 className="text-xs font-semibold text-mckinsey-navy mb-3">改善前后对比</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-mckinsey-light">
                  <tr>
                    <th className="px-3 py-2 text-left">指标</th>
                    <th className="px-3 py-2 text-right">改善前</th>
                    <th className="px-3 py-2 text-right">改善后</th>
                    <th className="px-3 py-2 text-right">变化</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mckinsey-border">
                  <tr>
                    <td className="px-3 py-2 font-medium">样本量</td>
                    <td className="px-3 py-2 text-right">{result.before.n}</td>
                    <td className="px-3 py-2 text-right">{result.after.n}</td>
                    <td className="px-3 py-2 text-right text-mckinsey-muted">—</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">均值</td>
                    <td className="px-3 py-2 text-right">{result.before.mean}</td>
                    <td className="px-3 py-2 text-right">{result.after.mean}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${
                      (result.lower_is_better ? result.mean_shift < 0 : result.mean_shift > 0) ? 'text-emerald-700' : 'text-red-700'
                    }`}>
                      {result.mean_shift > 0 ? '+' : ''}{result.mean_shift}
                      {result.mean_shift_pct !== null && ` (${result.mean_shift_pct}%)`}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">标准差</td>
                    <td className="px-3 py-2 text-right">{result.before.std}</td>
                    <td className="px-3 py-2 text-right">{result.after.std}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${result.std_change_pct < 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {result.std_change_pct !== null ? `${result.std_change_pct > 0 ? '+' : ''}${result.std_change_pct}%` : '—'}
                    </td>
                  </tr>
                  {result.cpk_before !== null && (
                    <tr>
                      <td className="px-3 py-2 font-medium">Cpk</td>
                      <td className={`px-3 py-2 text-right ${result.cpk_before < 1.33 ? 'text-red-700' : 'text-emerald-700'}`}>{result.cpk_before}</td>
                      <td className={`px-3 py-2 text-right ${result.cpk_after < 1.33 ? 'text-red-700' : 'text-emerald-700'}`}>{result.cpk_after}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                        {result.cpk_improvement > 0 ? '+' : ''}{result.cpk_improvement}
                      </td>
                    </tr>
                  )}
                  {result.defect && (
                    <tr>
                      <td className="px-3 py-2 font-medium">不良率</td>
                      <td className="px-3 py-2 text-right">{result.defect.before_rate}%</td>
                      <td className="px-3 py-2 text-right">{result.defect.after_rate}%</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                        {result.defect.reduction_pct !== null ? `↓${result.defect.reduction_pct}%` : '—'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-[11px] p-2.5 bg-blue-50 rounded">
              <span><strong>t 统计量:</strong> {result.t_stat}</span>
              <span><strong>p 值:</strong> {result.p_value}</span>
              <span className={result.significant ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                <strong>{result.significant ? '✓ 统计显著 (p<0.05)' : '⚠ 未达统计显著'}</strong>
              </span>
            </div>
          </div>

          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-mckinsey-navy">🧠 AI 验证解读</h4>
              {!aiOut && (
                <button onClick={interpret} disabled={aiLoading}
                  className="px-3 py-1.5 bg-mckinsey-navy text-white text-[11px] font-medium rounded-lg hover:bg-mckinsey-blue disabled:opacity-40">
                  {aiLoading ? '分析中...' : '生成解读'}
                </button>
              )}
            </div>
            {aiOut ? (
              <div className="prose prose-sm max-w-none prose-p:text-xs prose-p:my-1 prose-headings:text-xs prose-headings:text-mckinsey-navy prose-li:text-xs prose-strong:text-mckinsey-navy">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiOut}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-[11px] text-mckinsey-muted">AI 会区分「均值改善」和「波动改善」，提醒验证充分性，给出关闭建议</p>
            )}
          </div>
        </>
      )}

      {verifications.length > 0 && (
        <div className="card p-4">
          <h4 className="text-xs font-semibold text-mckinsey-navy mb-3">历史验证记录 ({verifications.length})</h4>
          <div className="space-y-2">
            {verifications.map((v: any) => (
              <div key={v.evidence_id} className="flex items-center justify-between p-2.5 bg-mckinsey-light/50 rounded-lg">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-mckinsey-navy truncate">{v.title}</p>
                  <p className="text-[10px] text-mckinsey-muted">
                    {v.created_at ? new Date(v.created_at).toLocaleString('zh-CN') : ''}
                  </p>
                </div>
                {v.data?.verdict_label && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                    v.data.verdict === 'effective' ? 'bg-emerald-50 text-emerald-700' :
                    v.data.verdict === 'ineffective' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }`}>{v.data.verdict_label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
