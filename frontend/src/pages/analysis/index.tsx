import Head from 'next/head';
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DataAnalysisPage() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [usl, setUsl] = useState('');
  const [lsl, setLsl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true); setResult(null); setAiInterpretation('');
    const formData = new FormData();
    formData.append('file', file);
    if (usl) formData.append('usl', usl);
    if (lsl) formData.append('lsl', lsl);

    try {
      const res = await fetch('/api/v1/analysis/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const err = await res.json();
        alert(err.detail || 'Analysis failed');
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleInterpret() {
    if (!result) return;
    setInterpreting(true); setAiInterpretation('');
    const formData = new FormData();
    formData.append('analysis_result', JSON.stringify(result));

    try {
      const res = await fetch('/api/v1/analysis/interpret', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
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
              try { const p = JSON.parse(d); if (p.content) { full += p.content; setAiInterpretation(full); } } catch {}
            }
          }
        }
      }
    } catch (err) { console.error(err); }
    finally { setInterpreting(false); }
  }

  return (
    <>
      <Head><title>AI质量数据分析 - AI Quality Portal</title></Head>
      <div className="pt-16">
        <AuthGuard>
          <div className="max-w-6xl mx-auto px-6 lg:px-16 py-10">
            <div className="accent-bar mb-5" />
            <h1 className="text-2xl font-bold text-mckinsey-navy mb-2">AI质量数据分析</h1>
            <p className="text-mckinsey-muted text-sm mb-8">上传Excel/CSV数据，AI自动分析并给出质量解读</p>

            {/* Upload section */}
            <div className="card mb-6">
              <h3 className="text-sm font-semibold text-mckinsey-navy mb-4">上传数据</h3>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-mckinsey-muted mb-1">数据文件 (Excel/CSV)</label>
                  <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm border border-mckinsey-border rounded-lg px-3 py-2" />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-mckinsey-muted mb-1">USL</label>
                  <input type="text" value={usl} onChange={(e) => setUsl(e.target.value)}
                    className="w-full text-sm border border-mckinsey-border rounded-lg px-3 py-2" placeholder="上规格" />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-mckinsey-muted mb-1">LSL</label>
                  <input type="text" value={lsl} onChange={(e) => setLsl(e.target.value)}
                    className="w-full text-sm border border-mckinsey-border rounded-lg px-3 py-2" placeholder="下规格" />
                </div>
                <button onClick={handleUpload} disabled={!file || loading}
                  className="btn-primary disabled:opacity-50 text-sm">
                  {loading ? '分析中...' : '开始分析'}
                </button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-5">
                {/* Overview */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-mckinsey-navy mb-3">数据概览</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-mckinsey-light rounded-lg p-3">
                      <div className="text-lg font-bold text-mckinsey-navy">{result.rows}</div>
                      <div className="text-xs text-mckinsey-muted">数据行数</div>
                    </div>
                    <div className="bg-mckinsey-light rounded-lg p-3">
                      <div className="text-lg font-bold text-mckinsey-navy">{result.columns}</div>
                      <div className="text-xs text-mckinsey-muted">字段数</div>
                    </div>
                    <div className="bg-mckinsey-light rounded-lg p-3">
                      <div className="text-lg font-bold text-mckinsey-teal">{result.numeric_columns?.length || 0}</div>
                      <div className="text-xs text-mckinsey-muted">数值列</div>
                    </div>
                    <div className="bg-mckinsey-light rounded-lg p-3">
                      <div className="text-lg font-bold text-amber-600">{Object.keys(result.anomalies || {}).length}</div>
                      <div className="text-xs text-mckinsey-muted">异常检测列</div>
                    </div>
                  </div>
                </div>

                {/* Statistics table */}
                {Object.keys(result.statistics || {}).length > 0 && (
                  <div className="card overflow-hidden p-0">
                    <div className="px-5 py-3 border-b border-mckinsey-border">
                      <h3 className="text-sm font-semibold text-mckinsey-navy">统计分析</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-mckinsey-light">
                          <tr>
                            <th className="px-4 py-2 text-left">字段</th>
                            <th className="px-4 py-2 text-right">N</th>
                            <th className="px-4 py-2 text-right">均值</th>
                            <th className="px-4 py-2 text-right">标准差</th>
                            <th className="px-4 py-2 text-right">最小值</th>
                            <th className="px-4 py-2 text-right">最大值</th>
                            {usl && <th className="px-4 py-2 text-right text-mckinsey-teal">Cp</th>}
                            {usl && <th className="px-4 py-2 text-right text-mckinsey-teal">Cpk</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-mckinsey-border">
                          {Object.entries(result.statistics).map(([col, s]: [string, any]) => (
                            <tr key={col} className="hover:bg-mckinsey-light/30">
                              <td className="px-4 py-2 font-medium text-mckinsey-navy">{col}</td>
                              <td className="px-4 py-2 text-right">{s.count}</td>
                              <td className="px-4 py-2 text-right">{s.mean?.toFixed(4)}</td>
                              <td className="px-4 py-2 text-right">{s.std?.toFixed(4)}</td>
                              <td className="px-4 py-2 text-right">{s.min?.toFixed(4)}</td>
                              <td className="px-4 py-2 text-right">{s.max?.toFixed(4)}</td>
                              {usl && <td className="px-4 py-2 text-right font-semibold">{s.cp?.toFixed(3) || '-'}</td>}
                              {usl && <td className={`px-4 py-2 text-right font-semibold ${s.cpk && s.cpk < 1.33 ? 'text-red-600' : s.cpk >= 1.33 ? 'text-emerald-600' : ''}`}>{s.cpk?.toFixed(3) || '-'}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Anomalies */}
                {Object.keys(result.anomalies || {}).length > 0 && (
                  <div className="card">
                    <h3 className="text-sm font-semibold text-mckinsey-navy mb-3">异常检测 (IQR法)</h3>
                    <div className="space-y-2">
                      {Object.entries(result.anomalies).map(([col, a]: [string, any]) => (
                        <div key={col} className="flex items-center justify-between bg-red-50/50 rounded-lg px-4 py-2.5 border border-red-200/50">
                          <span className="text-sm font-medium text-mckinsey-navy">{col}</span>
                          <span className="text-xs text-red-700">
                            {a.count}个异常点 ({a.percentage}%) | 范围: [{a.lower_bound}, {a.upper_bound}]
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pareto */}
                {Object.keys(result.pareto || {}).length > 0 && (
                  <div className="card">
                    <h3 className="text-sm font-semibold text-mckinsey-navy mb-3">帕累托分析</h3>
                    {Object.entries(result.pareto).map(([col, items]: [string, any]) => (
                      <div key={col} className="mb-4">
                        <h4 className="text-xs font-medium text-mckinsey-muted mb-2">{col}</h4>
                        <div className="space-y-1">
                          {items.slice(0, 5).map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-xs text-mckinsey-navy w-32 truncate">{item.value}</span>
                              <div className="flex-1 h-4 bg-mckinsey-light rounded-full overflow-hidden">
                                <div className="h-full bg-mckinsey-teal/60 rounded-full" style={{width: `${item.percentage}%`}} />
                              </div>
                              <span className="text-xs text-mckinsey-muted w-16 text-right">{item.percentage}%</span>
                              <span className="text-xs text-mckinsey-muted w-16 text-right">cum {item.cumulative}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Interpretation */}
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-mckinsey-navy">🧠 AI质量解读</h3>
                    {!aiInterpretation && !interpreting && (
                      <button onClick={handleInterpret} className="btn-primary text-xs py-1.5 px-4">
                        生成AI解读
                      </button>
                    )}
                  </div>
                  {interpreting && !aiInterpretation && (
                    <div className="flex items-center gap-2 text-sm text-mckinsey-muted">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                        <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                        <span className="w-1.5 h-1.5 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                      </div>
                      AI正在分析...
                    </div>
                  )}
                  {aiInterpretation && (
                    <div className="prose prose-sm prose-slate max-w-none prose-headings:text-mckinsey-navy prose-headings:text-sm prose-p:my-1 prose-p:text-sm prose-strong:text-mckinsey-navy prose-ul:my-1 prose-li:my-0.5 prose-li:text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiInterpretation}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
