import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

const typeLabels: Record<string, string> = {
  complaint: '客户投诉', incoming: '来料异常', process: '制程异常',
  failure: '产品失效', supplier: '供应商问题', internal: '内部质量问题',
};
const statusLabels: Record<string, string> = {
  draft: '草稿', analyzing: '分析中', defining: '问题定义', rca: '原因分析',
  measures: '制定措施', verification: '效果验证', closed: '已关闭',
};
const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600', analyzing: 'bg-blue-50 text-blue-700',
  defining: 'bg-cyan-50 text-cyan-700', rca: 'bg-amber-50 text-amber-700',
  measures: 'bg-purple-50 text-purple-700', verification: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-green-50 text-green-700',
};

export default function CasesPage() {
  const { token } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/v1/cases/', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setCases(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [token]);

  return (
    <>
      <Head><title>我的质量案例 - AI Quality Portal</title></Head>
      <div className="pt-16">
        <AuthGuard>
          <div className="max-w-5xl mx-auto px-6 lg:px-16 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="accent-bar mb-4" />
                <h1 className="text-3xl font-bold text-mckinsey-navy">我的质量案例</h1>
              </div>
              <Link href="/cases/new" className="btn-primary">
                + 新建案例
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-20 text-mckinsey-muted">加载中...</div>
            ) : cases.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-mckinsey-muted mb-4">暂无质量案例</p>
                <Link href="/cases/new" className="btn-primary">创建第一个案例</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cases.map((c) => (
                  <Link key={c.id} href={`/cases/${c.id}`} className="block">
                    <div className="card hover:-translate-y-0.5 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-mckinsey-navy">{c.title}</h3>
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="text-mckinsey-muted">{typeLabels[c.case_type] || c.case_type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] || ''}`}>
                              {statusLabels[c.status] || c.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-mckinsey-muted">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('zh-CN') : ''}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
