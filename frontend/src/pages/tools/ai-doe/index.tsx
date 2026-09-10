import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Factor { name: string; low: string; high: string; }

export default function DoePage() {
  const { token } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [factors, setFactors] = useState<Factor[]>([
    { name: '', low: '', high: '' },
    { name: '', low: '', high: '' },
  ]);
  const [designType, setDesignType] = useState<'full' | 'half'>('full');
  const [replicates, setReplicates] = useState(1);
  const [randomize, setRandomize] = useState(true);
  const [design, setDesign] = useState<any>(null);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [responseName, setResponseName] = useState('响应值');
  const [analysis, setAnalysis] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestOutput, setSuggestOutput] = useState('');
  const [problemDesc, setProblemDesc] = useState('');

  function addFactor() {
    if (factors.length < 7) setFactors([...factors, { name: '', low: '', high: '' }]);
  }
  function removeFactor(i: number) {
    if (factors.length > 2) setFactors(factors.filter((_, idx) => idx !== i));
  }
  function updateFactor(i: number, key: keyof Factor, val: string) {
    const next = [...factors];
    next[i][key] = val;
    setFactors(next);
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
            try { const p = JSON.parse(d); if (p.content) { full += p.content; onChunk(full); } } catch {}
          }
        }
      }
    }
    return full;
  }

  async function suggestFactors() {
    if (!problemDesc.trim()) return;
    setLoading(true); setSuggestOutput('');
    try {
      await streamRequest('/api/v1/ai/doe/suggest-factors', { problem: problemDesc }, setSuggestOutput);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function generateDesign() {
    const valid = factors.filter(f => f.name.trim());
    if (valid.length < 2) { alert('请至少填写2个因子'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai/doe/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ factors: valid, design_type: designType, replicates, randomize }),
      });
      if (res.ok) {
        const d = await res.json();
        setDesign(d);
        setResponses({});
        setAnalysis(null);
        setAiOutput('');
        setStep(2);
      } else {
        const e = await res.json();
        alert(e.detail || '生成失败');
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function analyzeResults() {
    if (!design) return;
    const labels = design.factors.map((f: any) => f.label);
    const runs = design.runs.map((r: any) => {
      const row: any = { response: responses[r.run] ? Number(responses[r.run]) : null };
      labels.forEach((l: string) => { row[l] = r[l]; });
      return row;
    }).filter((r: any) => r.response !== null && !isNaN(r.response));

    if (runs.length < 2) { alert('请至少填写2个试验的响应值'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai/doe/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ factors: labels, runs, response_name: responseName }),
      });
      if (res.ok) {
        setAnalysis(await res.json());
        setStep(3);
      } else {
        const e = await res.json();
        alert(e.detail || '分析失败');
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function interpretResults() {
    if (!analysis) return;
    setLoading(true); setAiOutput('');
    const factorNames: Record<string, string> = {};
    design?.factors?.forEach((f: any) => { factorNames[f.label] = f.name; });
    try {
      await streamRequest('/api/v1/ai/doe/interpret', {
        analysis, factor_names: factorNames, response_name: responseName, goal: 'maximize',
      }, setAiOutput);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function exportCsv() {
    if (!design) return;
    const labels = design.factors.map((f: any) => f.label);
    const header = ['Run', ...labels, ...labels.map((l: string) => l + '_value'), responseName].join(',');
    const rows = design.runs.map((r: any) =>
      [r.run_order, ...labels.map((l: string) => r[l]), ...labels.map((l: string) => r[l + '_value']), responses[r.run] || ''].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'doe_design.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  const maxEffect = analysis ? Math.max(...analysis.ranked_effects.map((e: any) => e.abs_effect), 0.0001) : 1;

  return (
    <>
      <Head><title>AI-DOE 实验设计 - AI Quality Portal</title></Head>
      <div className="pt-16">
        <div className="bg-mckinsey-light border-b border-mckinsey-border px-6 lg:px-16 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
            <Link href="/tools" className="text-mckinsey-muted hover:text-mckinsey-navy">AI工具集</Link>
            <span className="text-mckinsey-muted">/</span>
            <span className="text-mckinsey-navy font-medium">AI-DOE 实验设计</span>
          </div>
        </div>

        <AuthGuard requiredRole="user">
          <div className="max-w-6xl mx-auto px-6 lg:px-16 py-6">
            {/* Steps indicator */}
            <div className="flex items-center gap-2 mb-6">
              {[
                { n: 1, label: '设计实验' },
                { n: 2, label: '录入结果' },
                { n: 3, label: '分析解读' },
              ].map((s, i) => (
                <div key={s.n} className="flex items-center">
                  <button onClick={() => { if (s.n === 1 || (s.n === 2 && design) || (s.n === 3 && analysis)) setStep(s.n as any); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                      step === s.n ? 'bg-mckinsey-navy text-white' : 'text-mckinsey-muted hover:bg-mckinsey-light'
                    }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === s.n ? 'bg-white/20' : step > s.n ? 'bg-mckinsey-teal text-white' : 'bg-mckinsey-border'
                    }`}>{step > s.n ? '✓' : s.n}</span>
                    <span className="text-xs font-medium">{s.label}</span>
                  </button>
                  {i < 2 && <span className="mx-1 text-mckinsey-border">—</span>}
                </div>
              ))}
            </div>

            {/* STEP 1: Design */}
            {step === 1 && (
              <div className="space-y-5">
                {/* AI factor suggestion */}
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-mckinsey-navy mb-2">不确定选哪些因子？让 AI 建议</h3>
                  <div className="flex gap-2">
                    <input type="text" value={problemDesc} onChange={(e) => setProblemDesc(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-mckinsey-border text-sm focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/20"
                      placeholder="描述你要优化的问题。例如：注塑件表面缩水率高，想找出最佳工艺参数" />
                    <button onClick={suggestFactors} disabled={loading || !problemDesc.trim()}
                      className="px-4 py-2 bg-mckinsey-navy text-white text-xs font-medium rounded-lg hover:bg-mckinsey-blue disabled:opacity-40">
                      {loading ? '...' : '✨ AI建议'}
                    </button>
                  </div>
                  {suggestOutput && (
                    <div className="mt-4 pt-4 border-t border-mckinsey-border prose prose-sm max-w-none prose-p:text-sm prose-p:my-1 prose-table:text-xs prose-headings:text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{suggestOutput}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Factor input */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-mckinsey-navy">实验因子 ({factors.length}/7)</h3>
                    <button onClick={addFactor} disabled={factors.length >= 7}
                      className="px-3 py-1.5 bg-mckinsey-light text-mckinsey-navy text-xs font-medium rounded-lg hover:bg-mckinsey-border/50 disabled:opacity-40">
                      + 添加因子
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[11px] text-mckinsey-muted font-medium px-1">
                      <div className="col-span-1">代号</div>
                      <div className="col-span-4">因子名称</div>
                      <div className="col-span-3">低水平 (-1)</div>
                      <div className="col-span-3">高水平 (+1)</div>
                      <div className="col-span-1"></div>
                    </div>
                    {factors.map((f, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1 text-center">
                          <span className="inline-flex w-7 h-7 rounded-full bg-mckinsey-teal/10 text-mckinsey-teal items-center justify-center text-xs font-bold">
                            {String.fromCharCode(65 + i)}
                          </span>
                        </div>
                        <input className="col-span-4 px-3 py-2 rounded-lg border border-mckinsey-border text-sm"
                          value={f.name} onChange={(e) => updateFactor(i, 'name', e.target.value)} placeholder="如: 温度" />
                        <input className="col-span-3 px-3 py-2 rounded-lg border border-mckinsey-border text-sm"
                          value={f.low} onChange={(e) => updateFactor(i, 'low', e.target.value)} placeholder="如: 180" />
                        <input className="col-span-3 px-3 py-2 rounded-lg border border-mckinsey-border text-sm"
                          value={f.high} onChange={(e) => updateFactor(i, 'high', e.target.value)} placeholder="如: 220" />
                        <button onClick={() => removeFactor(i)} disabled={factors.length <= 2}
                          className="col-span-1 text-mckinsey-muted hover:text-red-600 disabled:opacity-30 text-lg">×</button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-mckinsey-border flex flex-wrap gap-5 items-end">
                    <div>
                      <label className="block text-[11px] text-mckinsey-muted mb-1">设计类型</label>
                      <select value={designType} onChange={(e) => setDesignType(e.target.value as any)}
                        className="px-3 py-2 rounded-lg border border-mckinsey-border text-sm">
                        <option value="full">全因子 (2^k)</option>
                        <option value="half">半因子 (2^(k-1))</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-mckinsey-muted mb-1">重复次数</label>
                      <input type="number" min={1} max={5} value={replicates}
                        onChange={(e) => setReplicates(Math.max(1, Math.min(5, Number(e.target.value))))}
                        className="w-20 px-3 py-2 rounded-lg border border-mckinsey-border text-sm" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-mckinsey-navy pb-2">
                      <input type="checkbox" checked={randomize} onChange={(e) => setRandomize(e.target.checked)} />
                      随机化试验顺序
                    </label>
                    <button onClick={generateDesign} disabled={loading}
                      className="ml-auto px-5 py-2 bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white font-medium rounded-lg hover:shadow-lg disabled:opacity-40 text-sm">
                      {loading ? '生成中...' : '生成设计矩阵 →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Enter responses */}
            {step === 2 && design && (
              <div className="space-y-5">
                <div className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-mckinsey-navy">{design.resolution}</h3>
                      <p className="text-xs text-mckinsey-muted mt-0.5">共 {design.total_runs} 次试验 · 按 Run 顺序执行</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="text" value={responseName} onChange={(e) => setResponseName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-mckinsey-border text-xs w-32" placeholder="响应变量名" />
                      <button onClick={exportCsv}
                        className="px-3 py-1.5 bg-mckinsey-light text-mckinsey-navy text-xs font-medium rounded-lg hover:bg-mckinsey-border/50">
                        📥 导出 CSV
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-mckinsey-light">
                        <tr>
                          <th className="px-3 py-2 text-left">Run</th>
                          {design.factors.map((f: any) => (
                            <th key={f.label} className="px-3 py-2 text-center">
                              {f.label}<br/><span className="text-[10px] font-normal text-mckinsey-muted">{f.name}</span>
                            </th>
                          ))}
                          <th className="px-3 py-2 text-center bg-mckinsey-teal/10">{responseName}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-mckinsey-border">
                        {design.runs.map((r: any) => (
                          <tr key={r.run} className="hover:bg-mckinsey-light/30">
                            <td className="px-3 py-1.5 font-medium">{r.run_order}</td>
                            {design.factors.map((f: any) => (
                              <td key={f.label} className="px-3 py-1.5 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                                  r[f.label] === 1 ? 'bg-mckinsey-teal/15 text-mckinsey-teal' :
                                  r[f.label] === -1 ? 'bg-mckinsey-navy/10 text-mckinsey-navy' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {r[f.label + '_value']}
                                </span>
                              </td>
                            ))}
                            <td className="px-2 py-1.5">
                              <input type="number" step="any" value={responses[r.run] || ''}
                                onChange={(e) => setResponses({ ...responses, [r.run]: e.target.value })}
                                className="w-full px-2 py-1 rounded border border-mckinsey-border text-xs text-center" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex justify-between">
                    <button onClick={() => setStep(1)} className="px-4 py-2 text-mckinsey-muted text-sm hover:text-mckinsey-navy">← 修改设计</button>
                    <button onClick={analyzeResults} disabled={loading}
                      className="px-5 py-2 bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white font-medium rounded-lg hover:shadow-lg disabled:opacity-40 text-sm">
                      {loading ? '分析中...' : '分析结果 →'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Analysis */}
            {step === 3 && analysis && (
              <div className="space-y-5">
                {/* Summary */}
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-mckinsey-navy mb-4">统计摘要</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      ['试验数', analysis.n_runs],
                      ['总平均', analysis.grand_mean],
                      ['标准差', analysis.std_dev],
                      ['最小值', analysis.min_response],
                      ['最大值', analysis.max_response],
                    ].map(([label, val]) => (
                      <div key={String(label)} className="bg-mckinsey-light rounded-lg p-3 text-center">
                        <div className="text-[10px] text-mckinsey-muted">{label}</div>
                        <div className="text-base font-bold text-mckinsey-navy">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pareto of effects */}
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-mckinsey-navy mb-1">效应帕累托图</h3>
                  <p className="text-[11px] text-mckinsey-muted mb-4">
                    显著性参考线: {analysis.significant_threshold}（超过此值的效应可能显著）
                  </p>
                  <div className="space-y-2">
                    {analysis.ranked_effects.map((e: any) => {
                      const pct = (e.abs_effect / maxEffect) * 100;
                      const significant = e.abs_effect > analysis.significant_threshold;
                      return (
                        <div key={e.term} className="flex items-center gap-3">
                          <span className="w-16 text-xs font-medium text-mckinsey-navy text-right">{e.term}</span>
                          <div className="flex-1 h-5 bg-mckinsey-light rounded overflow-hidden relative">
                            <div className={`h-full rounded transition-all ${
                              e.type === 'main'
                                ? significant ? 'bg-mckinsey-teal' : 'bg-mckinsey-teal/40'
                                : significant ? 'bg-mckinsey-gold' : 'bg-mckinsey-gold/40'
                            }`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`w-20 text-xs text-right ${significant ? 'font-semibold text-mckinsey-navy' : 'text-mckinsey-muted'}`}>
                            {e.effect > 0 ? '+' : ''}{e.effect}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex gap-4 text-[10px] text-mckinsey-muted">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-mckinsey-teal rounded" /> 主效应</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-mckinsey-gold rounded" /> 交互效应</span>
                  </div>
                </div>

                {/* Main effects table */}
                <div className="card p-0 overflow-hidden">
                  <div className="px-5 py-3 border-b border-mckinsey-border">
                    <h3 className="text-sm font-semibold text-mckinsey-navy">主效应明细</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-mckinsey-light">
                        <tr>
                          <th className="px-4 py-2 text-left">因子</th>
                          <th className="px-4 py-2 text-right">低水平均值</th>
                          <th className="px-4 py-2 text-right">高水平均值</th>
                          <th className="px-4 py-2 text-right">效应</th>
                          <th className="px-4 py-2 text-center">最优设置</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-mckinsey-border">
                        {analysis.main_effects.map((e: any) => {
                          const f = design?.factors?.find((x: any) => x.label === e.factor);
                          const opt = analysis.optimal_settings[e.factor];
                          return (
                            <tr key={e.factor} className="hover:bg-mckinsey-light/30">
                              <td className="px-4 py-2 font-medium text-mckinsey-navy">
                                {e.factor} {f?.name ? `(${f.name})` : ''}
                              </td>
                              <td className="px-4 py-2 text-right">{e.low_mean}</td>
                              <td className="px-4 py-2 text-right">{e.high_mean}</td>
                              <td className={`px-4 py-2 text-right font-semibold ${e.effect > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                {e.effect > 0 ? '+' : ''}{e.effect}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <span className="px-2 py-0.5 bg-mckinsey-teal/10 text-mckinsey-teal rounded text-[10px] font-medium">
                                  {opt === 'high' ? `${f?.high || '+1'}` : `${f?.low || '-1'}`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI interpretation */}
                <div className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-mckinsey-navy">🧠 AI 解读与建议</h3>
                    {!aiOutput && (
                      <button onClick={interpretResults} disabled={loading}
                        className="px-4 py-1.5 bg-mckinsey-navy text-white text-xs font-medium rounded-lg hover:bg-mckinsey-blue disabled:opacity-40">
                        {loading ? '分析中...' : '生成 AI 解读'}
                      </button>
                    )}
                  </div>
                  {aiOutput ? (
                    <div className="prose prose-sm max-w-none prose-p:text-sm prose-p:my-1 prose-headings:text-sm prose-headings:text-mckinsey-navy prose-li:text-sm prose-table:text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiOutput}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs text-mckinsey-muted">点击按钮让 AI 解读实验结果、判断显著因子、给出最优参数建议</p>
                  )}
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="px-4 py-2 text-mckinsey-muted text-sm hover:text-mckinsey-navy">← 修改数据</button>
                </div>
              </div>
            )}
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
