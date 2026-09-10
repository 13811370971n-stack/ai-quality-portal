import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

const CAT_LABELS: Record<string, string> = {
  bug: '🐛 问题', usability: '🤔 体验', feature: '💡 建议', content: '📖 内容', other: '💬 其他',
};
const FB_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: '待处理', cls: 'bg-blue-50 text-blue-700' },
  reviewing: { label: '处理中', cls: 'bg-amber-50 text-amber-700' },
  resolved: { label: '已解决', cls: 'bg-emerald-50 text-emerald-700' },
  wontfix: { label: '不处理', cls: 'bg-gray-100 text-gray-600' },
};

export default function AdminPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<'users' | 'feedback'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [fbStats, setFbStats] = useState<any>(null);
  const [fbFilter, setFbFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/v1/users/', { headers: h }).then(r => r.ok ? r.json() : []),
      fetch('/api/v1/billing/feedback', { headers: h }).then(r => r.ok ? r.json() : []),
      fetch('/api/v1/billing/feedback/stats', { headers: h }).then(r => r.ok ? r.json() : null),
    ]).then(([u, f, s]) => {
      if (Array.isArray(u)) setUsers(u);
      if (Array.isArray(f)) setFeedback(f);
      setFbStats(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function changeRole(userId: number, role: string) {
    const res = await fetch(`/api/v1/users/${userId}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
  }

  async function updateFb(id: number, patch: any) {
    const res = await fetch(`/api/v1/billing/feedback/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) load();
  }

  const visibleFb = fbFilter ? feedback.filter(f => f.status === fbFilter) : feedback;

  return (
    <>
      <Head><title>管理后台 - AI Quality Portal</title></Head>
      <div className="pt-16">
        <AuthGuard requiredRole="admin">
          <div className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
            <div className="accent-bar mb-6" />
            <h1 className="text-3xl font-bold text-mckinsey-navy mb-2">管理后台</h1>
            <p className="text-mckinsey-muted mb-8">用户、角色与反馈管理</p>

            <div className="flex gap-2 mb-6">
              <button onClick={() => setTab('users')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'users' ? 'bg-mckinsey-navy text-white' : 'bg-mckinsey-light text-mckinsey-muted hover:text-mckinsey-navy'
                }`}>用户 ({users.length})</button>
              <button onClick={() => setTab('feedback')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === 'feedback' ? 'bg-mckinsey-navy text-white' : 'bg-mckinsey-light text-mckinsey-muted hover:text-mckinsey-navy'
                }`}>
                反馈 ({feedback.filter(f => f.status === 'new').length} 待处理 / {feedback.length})
              </button>
            </div>

            {tab === 'users' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {[
                    ['总用户数', users.length, 'text-mckinsey-navy'],
                    ['活跃用户', users.filter(u => u.is_active).length, 'text-mckinsey-teal'],
                    ['VIP 用户', users.filter(u => u.role === 'vip').length, 'text-mckinsey-gold'],
                    ['管理员', users.filter(u => u.role === 'admin').length, 'text-red-600'],
                  ].map(([label, val, cls]) => (
                    <div key={String(label)} className="card p-5">
                      <div className={`text-2xl font-bold ${cls}`}>{val}</div>
                      <div className="text-sm text-mckinsey-muted">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="card overflow-hidden p-0">
                  <div className="px-6 py-4 border-b border-mckinsey-border">
                    <h2 className="text-lg font-semibold text-mckinsey-navy">用户列表</h2>
                  </div>
                  {loading ? (
                    <div className="p-8 text-center text-mckinsey-muted">加载中...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-mckinsey-light">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-mckinsey-muted uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-mckinsey-muted uppercase">用户</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-mckinsey-muted uppercase">角色</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-mckinsey-muted uppercase">状态</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-mckinsey-muted uppercase">注册</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-mckinsey-muted uppercase">最近登录</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-mckinsey-border">
                          {users.map(u => (
                            <tr key={u.id} className="hover:bg-mckinsey-light/50">
                              <td className="px-6 py-4 text-mckinsey-navy">{u.id}</td>
                              <td className="px-6 py-4">
                                <div className="text-mckinsey-navy font-medium">{u.nickname || '-'}</div>
                                <div className="text-mckinsey-muted text-xs">{u.email || u.phone}</div>
                              </td>
                              <td className="px-6 py-4">
                                <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                                  className="text-xs border border-mckinsey-border rounded px-2 py-1">
                                  <option value="user">普通用户</option>
                                  <option value="vip">VIP</option>
                                  <option value="admin">管理员</option>
                                </select>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs ${u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                  {u.is_active ? '正常' : '已禁用'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-mckinsey-muted text-xs">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString('zh-CN') : '-'}
                              </td>
                              <td className="px-6 py-4 text-mckinsey-muted text-xs">
                                {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('zh-CN') : '未登录'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === 'feedback' && (
              <>
                {fbStats && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="card p-4">
                      <div className="text-2xl font-bold text-mckinsey-navy">{fbStats.total}</div>
                      <div className="text-xs text-mckinsey-muted">总反馈</div>
                    </div>
                    <div className="card p-4">
                      <div className="text-2xl font-bold text-mckinsey-gold">{fbStats.avg_rating ?? '—'}</div>
                      <div className="text-xs text-mckinsey-muted">平均评分</div>
                    </div>
                    {['bug', 'usability', 'feature'].map(c => (
                      <div key={c} className="card p-4">
                        <div className="text-2xl font-bold text-mckinsey-navy">{fbStats.by_category?.[c] || 0}</div>
                        <div className="text-xs text-mckinsey-muted">{CAT_LABELS[c]}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <button onClick={() => setFbFilter('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${!fbFilter ? 'bg-mckinsey-navy text-white' : 'bg-mckinsey-light text-mckinsey-muted'}`}>
                    全部
                  </button>
                  {Object.entries(FB_STATUS).map(([k, v]) => (
                    <button key={k} onClick={() => setFbFilter(k)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${fbFilter === k ? 'bg-mckinsey-navy text-white' : 'bg-mckinsey-light text-mckinsey-muted'}`}>
                      {v.label} ({feedback.filter(f => f.status === k).length})
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="card p-8 text-center text-mckinsey-muted">加载中...</div>
                ) : visibleFb.length === 0 ? (
                  <div className="card p-8 text-center text-mckinsey-muted">暂无反馈</div>
                ) : (
                  <div className="space-y-3">
                    {visibleFb.map(f => {
                      const st = FB_STATUS[f.status] || FB_STATUS.new;
                      return (
                        <div key={f.id} className="card p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-mckinsey-navy">{CAT_LABELS[f.category] || f.category}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>{st.label}</span>
                              {f.rating && (
                                <span className="text-[10px] text-mckinsey-gold">{'★'.repeat(f.rating)}</span>
                              )}
                              {f.page_url && (
                                <span className="text-[10px] text-mckinsey-muted font-mono">{f.page_url}</span>
                              )}
                              <span className="text-[10px] text-mckinsey-muted">
                                {f.user_id ? `用户#${f.user_id}` : '匿名'}
                              </span>
                              <span className="text-[10px] text-mckinsey-muted">
                                {f.created_at ? new Date(f.created_at).toLocaleString('zh-CN') : ''}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-mckinsey-navy whitespace-pre-wrap mb-3">{f.content}</p>

                          {f.contact && (
                            <p className="text-xs text-mckinsey-muted mb-3">联系方式：{f.contact}</p>
                          )}

                          {f.admin_note && (
                            <div className="mb-3 p-2.5 bg-mckinsey-light rounded-lg">
                              <p className="text-[10px] font-semibold text-mckinsey-muted uppercase mb-1">处理备注</p>
                              <p className="text-xs text-mckinsey-navy">{f.admin_note}</p>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-3 border-t border-mckinsey-border flex-wrap">
                            {Object.entries(FB_STATUS).filter(([k]) => k !== f.status).map(([k, v]) => (
                              <button key={k} onClick={() => updateFb(f.id, { status: k })}
                                className="px-2.5 py-1 text-[10px] font-medium rounded border border-mckinsey-border text-mckinsey-muted hover:text-mckinsey-navy hover:border-mckinsey-teal">
                                标为{v.label}
                              </button>
                            ))}
                            <button onClick={() => {
                              const note = prompt('处理备注：', f.admin_note || '');
                              if (note !== null) updateFb(f.id, { admin_note: note });
                            }} className="px-2.5 py-1 text-[10px] font-medium rounded border border-mckinsey-border text-mckinsey-muted hover:text-mckinsey-navy">
                              编辑备注
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
