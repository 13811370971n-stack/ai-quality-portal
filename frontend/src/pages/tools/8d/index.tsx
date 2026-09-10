import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SECTIONS = [
  { id: 'd0', label: 'D0 紧急响应措施', hint: '问题发生后立即采取的行动，防止影响客户' },
  { id: 'd1', label: 'D1 团队组建', hint: '团队成员、职责分工、团队长' },
  { id: 'd2', label: 'D2 问题描述', hint: '用5W2H描述：What/When/Where/Who/Which/How/How many' },
  { id: 'd3', label: 'D3 临时遏制措施', hint: '隔离、全检、返工等措施，包含有效性验证' },
  { id: 'd4', label: 'D4 根本原因分析', hint: '区分发生原因和流出原因，用5Why或鱼骨图验证' },
  { id: 'd5', label: 'D5 永久纠正措施', hint: '针对每个根因的消除措施' },
  { id: 'd6', label: 'D6 措施验证', hint: '改善前后数据对比，证明措施有效' },
  { id: 'd7', label: 'D7 预防再发生', hint: '更新FMEA、控制计划、SOP、培训，横向展开' },
  { id: 'd8', label: 'D8 团队认可', hint: '总结经验、关闭确认、团队表彰' },
];

const STORAGE_KEY = 'aiqp_8d_draft';

export default function EightDPage() {
  const { token } = useAuth();
  const [meta, setMeta] = useState({ title: '', report_no: '', customer: '', part_number: '', owner: '' });
  const [sections, setSections] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState('d2');
  const [aiMode, setAiMode] = useState<'do' | 'teach'>('do');
  const [aiOutput, setAiOutput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [reviewOutput, setReviewOutput] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.meta) setMeta(d.meta);
        if (d.sections) setSections(d.sections);
      }
    } catch {}
  }, []);

  function saveDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta, sections, savedAt: new Date().toISOString() }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  }

  function updateSection(id: string, value: string) {
    setSections(prev => ({ ...prev, [id]: value }));
  }

  async function streamRequest(url: string, body: any, onChunk: (s: string) => void) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
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
            try {
              const p = JSON.parse(d);
              if (p.content) { full += p.content; onChunk(full); }
            } catch {}
          }
        }
      }
    }
    return full;
  }

  async function assistSection() {
    setAiLoading(true);
    setAiOutput('');
    try {
      await streamRequest('/api/v1/ai/8d/assist', {
        section: activeSection,
        problem_summary: sections['d2'] || meta.title || '未描述',
        current_content: sections[activeSection] || '',
        other_sections: sections,
        mode: aiMode,
      }, setAiOutput);
    } catch (e) { console.error(e); }
    finally { setAiLoading(false); }
  }

  async function reviewReport() {
    setReviewLoading(true);
    setReviewOutput('');
    try {
      await streamRequest('/api/v1/ai/8d/review', {
        sections,
        problem_summary: sections['d2'] || meta.title || '',
      }, setReviewOutput);
    } catch (e) { console.error(e); }
    finally { setReviewLoading(false); }
  }

  async function exportWord() {
    try {
      const res = await fetch('/api/v1/ai/8d/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...meta, sections }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `8D_${meta.report_no || 'Report'}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) { console.error(e); }
  }

  function applyAiToSection() {
    if (!aiOutput) return;
    updateSection(activeSection, (sections[activeSection] ? sections[activeSection] + '\n\n' : '') + aiOutput);
    setAiOutput('');
  }

  const completedCount = SECTIONS.filter(s => (sections[s.id] || '').trim().length > 20).length;
  const activeMeta = SECTIONS.find(s => s.id === activeSection);

  return (
    <>
      <Head><title>8D 报告工具 - AI Quality Portal</title></Head>
      <div className="pt-16">
        <div className="bg-mckinsey-light border-b border-mckinsey-border px-6 lg:px-16 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/tools" className="text-mckinsey-muted hover:text-mckinsey-navy">AI工具集</Link>
              <span className="text-mckinsey-muted">/</span>
              <span className="text-mckinsey-navy font-medium">8D 报告工具</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-mckinsey-muted">进度 {completedCount}/9</span>
              <div className="w-24 h-1.5 bg-mckinsey-border rounded-full overflow-hidden">
                <div className="h-full bg-mckinsey-teal rounded-full transition-all" style={{ width: `${completedCount/9*100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <AuthGuard requiredRole="user">
          <div className="max-w-7xl mx-auto px-6 lg:px-16 py-6">
            {/* Meta info */}
            <div className="card mb-5 p-5">
              <h3 className="text-sm font-semibold text-mckinsey-navy mb-3">报告信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { k: 'title', label: '标题' },
                  { k: 'report_no', label: '报告编号' },
                  { k: 'customer', label: '客户' },
                  { k: 'part_number', label: '零件号' },
                  { k: 'owner', label: '负责人' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="block text-[11px] text-mckinsey-muted mb-1">{f.label}</label>
                    <input type="text" value={(meta as any)[f.k]}
                      onChange={(e) => setMeta({ ...meta, [f.k]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-mckinsey-border text-sm focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/20" />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: section nav */}
              <div className="lg:col-span-3">
                <div className="card p-3 sticky top-20">
                  {SECTIONS.map(s => {
                    const filled = (sections[s.id] || '').trim().length > 20;
                    const active = s.id === activeSection;
                    return (
                      <button key={s.id} onClick={() => { setActiveSection(s.id); setAiOutput(''); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                          active ? 'bg-mckinsey-navy text-white' : 'hover:bg-mckinsey-light'
                        }`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                            filled ? 'bg-mckinsey-teal text-white' : active ? 'bg-white/20 text-white' : 'bg-mckinsey-border text-mckinsey-muted'
                          }`}>{filled ? '✓' : ''}</span>
                          <span className={`text-xs ${active ? 'font-semibold' : filled ? 'text-mckinsey-teal' : 'text-mckinsey-muted'}`}>
                            {s.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  <div className="mt-4 pt-3 border-t border-mckinsey-border space-y-2">
                    <button onClick={saveDraft}
                      className="w-full px-3 py-2 bg-mckinsey-light text-mckinsey-navy text-xs font-medium rounded-lg hover:bg-mckinsey-border/50 transition-colors">
                      {saved ? '✓ 已保存' : '💾 保存草稿'}
                    </button>
                    <button onClick={reviewReport} disabled={reviewLoading || completedCount < 3}
                      className="w-full px-3 py-2 bg-mckinsey-navy text-white text-xs font-medium rounded-lg hover:bg-mckinsey-blue disabled:opacity-40 transition-colors">
                      {reviewLoading ? 'AI审核中...' : '🔍 AI审核报告'}
                    </button>
                    <button onClick={exportWord}
                      className="w-full px-3 py-2 bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white text-xs font-medium rounded-lg hover:shadow-lg transition-all">
                      📥 导出 Word
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: editor + AI */}
              <div className="lg:col-span-9 space-y-5">
                <div className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-mckinsey-navy">{activeMeta?.label}</h3>
                      <p className="text-xs text-mckinsey-muted mt-0.5">{activeMeta?.hint}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex rounded-lg border border-mckinsey-border overflow-hidden">
                        <button onClick={() => setAiMode('do')}
                          className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                            aiMode === 'do' ? 'bg-mckinsey-teal text-white' : 'text-mckinsey-muted hover:bg-mckinsey-light'
                          }`}>帮我做</button>
                        <button onClick={() => setAiMode('teach')}
                          className={`px-3 py-1.5 text-[11px] font-medium transition-colors ${
                            aiMode === 'teach' ? 'bg-mckinsey-gold text-white' : 'text-mckinsey-muted hover:bg-mckinsey-light'
                          }`}>教我做</button>
                      </div>
                      <button onClick={assistSection} disabled={aiLoading}
                        className="px-3 py-1.5 bg-mckinsey-navy text-white text-[11px] font-medium rounded-lg hover:bg-mckinsey-blue disabled:opacity-40 transition-colors">
                        {aiLoading ? '...' : '✨ AI 辅助'}
                      </button>
                    </div>
                  </div>

                  <textarea value={sections[activeSection] || ''}
                    onChange={(e) => updateSection(activeSection, e.target.value)}
                    className="w-full h-56 px-3 py-2.5 rounded-lg border border-mckinsey-border text-sm focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/20 resize-y font-mono"
                    placeholder={`填写 ${activeMeta?.label} 内容...`} />
                </div>

                {/* AI output */}
                {(aiOutput || aiLoading) && (
                  <div className="card p-5 border-l-4 border-l-mckinsey-teal">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-mckinsey-navy">
                        ✨ AI {aiMode === 'do' ? '建议内容' : '教学引导'}
                      </h4>
                      {aiOutput && aiMode === 'do' && (
                        <button onClick={applyAiToSection}
                          className="px-3 py-1.5 bg-mckinsey-teal text-white text-[11px] font-medium rounded-lg hover:bg-mckinsey-teal/90">
                          ↓ 采纳到编辑区
                        </button>
                      )}
                    </div>
                    {aiLoading && !aiOutput ? (
                      <div className="flex items-center gap-2 text-xs text-mckinsey-muted">
                        <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                        <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                        AI 分析中...
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-p:text-sm prose-p:my-1 prose-headings:text-sm prose-headings:text-mckinsey-navy prose-li:text-sm prose-table:text-xs">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiOutput}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}

                {/* Review output */}
                {(reviewOutput || reviewLoading) && (
                  <div className="card p-5 border-l-4 border-l-mckinsey-gold">
                    <h4 className="text-sm font-semibold text-mckinsey-navy mb-3">🔍 AI 审核结果</h4>
                    {reviewLoading && !reviewOutput ? (
                      <div className="text-xs text-mckinsey-muted">审核中...</div>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-p:text-sm prose-p:my-1 prose-headings:text-sm prose-table:text-xs">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{reviewOutput}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
