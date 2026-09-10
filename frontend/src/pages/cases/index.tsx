import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

const typeLabels: Record<string, string> = {
  complaint: '客户投诉', incoming: '来料异常', process: '制程异常',
  failure: '产品失效', supplier: '供应商问题', internal: '内部质量问题',
};
const typeIcons: Record<string, string> = {
  complaint: '🔴', incoming: '📦', process: '⚙️',
  failure: '💥', supplier: '🏭', internal: '🔍',
};
const statusLabels: Record<string, string> = {
  draft: '草稿', intake: '信息收集', analyzing: '分析中', defining: '问题定义',
  investigation: '问题定义', rca: '原因分析', measures: '改善措施',
  verification: '效果验证', closing: '生成报告', closed: '已关闭',
};
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', intake: 'bg-blue-50 text-blue-700',
  analyzing: 'bg-blue-50 text-blue-700', defining: 'bg-cyan-50 text-cyan-700',
  investigation: 'bg-cyan-50 text-cyan-700', rca: 'bg-amber-50 text-amber-700',
  measures: 'bg-purple-50 text-purple-700', verification: 'bg-emerald-50 text-emerald-700',
  closing: 'bg-indigo-50 text-indigo-700', closed: 'bg-green-50 text-green-700',
};

export default function CasesPage() {
  const { token } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    fetch('/api/v1/cases/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCases(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function archive(id: number, archived: boolean) {
    setBusy(id);
    try {
      await fetch(`/api/v1/cases/${id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ archived }),
      });
      load();
    } finally { setBusy(null); }
  }

  async function remove(id: number, title: string) {
    if (!confirm(`确定永久删除案例「${title}」？\n\n所有对话、证据、根因、措施记录将一并删除，无法恢复。`)) return;
    setBusy(id);
    try {
      await fetch(`/api/v1/cases/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      load();
    } finally { setBusy(null); }
  }

  const visible = cases.filter(c => showArchived ? c.archived : !c.archived);
  const archivedCount = cases.filter(c => c.archived).length;

  return (
    <>
      <Head><title>我的质量案例 - AI Quality Portal</title></Head>
      <div className="pt-16">
        <AuthGuard>
          <div className="max-w-5xl mx-auto px-6 lg:px-16 py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="accent-bar mb-4" />
                <h1 className="text-3xl font-bold text-mckinsey-navy">我的质量案例</h1>
              </div>
              <Link href="/cases/new" className="btn-primary">+ 新建案例</Link>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setShowArchived(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  !showArchived ? 'bg-mckinsey-navy text-white' : 'bg-mckinsey-light text-mckinsey-muted hover:text-mckinsey-navy'
                }`}>
                进行中 ({cases.length - archivedCount})
              </button>
              <button onClick={() => setShowArchived(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  showArchived ? 'bg-mckinsey-navy text-white' : 'bg-mckinsey-light text-mckinsey-muted hover:text-mckinsey-navy'
                }`}>
                已归档 ({archivedCount})
              </button>
            </div>

            {loading ? (
              <div className="text-center py-20 text-mckinsey-muted">加载中...</div>
            ) : visible.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-mckinsey-muted mb-4">
                  {showArchived ? '暂无已归档案例' : '暂无进行中的质量案例'}
                </p>
                {!showArchived && <Link href="/cases/new" className="btn-primary">创建第一个案例</Link>}
              </div>
            ) : (
              <div className="space-y-3">
                {visible.map(c => (
                  <div key={c.id} className={`card group ${c.archived ? 'opacity-75' : ''} hover:-translate-y-0.5 transition-all duration-200`}>
                    <div className="flex items-start gap-4">
                      <Link href={`/cases/${c.id}`} className="flex-1 min-w-0 flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">{typeIcons[c.case_type] || '📋'}</span>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-mckinsey-navy group-hover:text-mckinsey-teal transition-colors truncate">
                            {c.title}
                          </h3>
                          {c.problem_statement && (
                            <p className="text-xs text-mckinsey-muted mt-1 line-clamp-1">{c.problem_statement}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-mckinsey-muted">{typeLabels[c.case_type] || c.case_type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>
                              {statusLabels[c.status] || c.status}
                            </span>
                            {c.archived && (
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full text-[10px]">已归档</span>
                            )}
                            <span className="text-[10px] text-mckinsey-muted">
                              {c.updated_at ? new Date(c.updated_at).toLocaleDateString('zh-CN') : ''}
                            </span>
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => archive(c.id, !c.archived)} disabled={busy === c.id}
                          title={c.archived ? '取消归档' : '归档'}
                          className="p-2 rounded-lg text-mckinsey-muted hover:text-mckinsey-navy hover:bg-mckinsey-light disabled:opacity-40">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                          </svg>
                        </button>
                        <button onClick={() => remove(c.id, c.title)} disabled={busy === c.id}
                          title="永久删除"
                          className="p-2 rounded-lg text-mckinsey-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-40">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
