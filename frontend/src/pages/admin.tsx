import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

interface UserItem {
  id: number;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  role: string;
  is_active: boolean;
  created_at: string | null;
  last_login_at: string | null;
}

export default function AdminPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/v1/users/', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setUsers(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [token]);

  async function changeRole(userId: number, newRole: string) {
    const res = await fetch(`/api/v1/users/${userId}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    }
  }

  return (
    <>
      <Head>
        <title>管理后台 - AI Quality Portal</title>
      </Head>

      <div className="pt-16">
        <AuthGuard requiredRole="admin">
          <div className="max-w-7xl mx-auto px-6 lg:px-16 py-12">
            <div className="accent-bar mb-6" />
            <h1 className="text-3xl font-bold text-mckinsey-navy mb-2">管理后台</h1>
            <p className="text-mckinsey-muted mb-8">管理用户、角色和平台数据</p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="card p-5">
                <div className="text-2xl font-bold text-mckinsey-navy">{users.length}</div>
                <div className="text-sm text-mckinsey-muted">总用户数</div>
              </div>
              <div className="card p-5">
                <div className="text-2xl font-bold text-mckinsey-teal">{users.filter(u => u.is_active).length}</div>
                <div className="text-sm text-mckinsey-muted">活跃用户</div>
              </div>
              <div className="card p-5">
                <div className="text-2xl font-bold text-mckinsey-gold">{users.filter(u => u.role === 'vip').length}</div>
                <div className="text-sm text-mckinsey-muted">VIP用户</div>
              </div>
              <div className="card p-5">
                <div className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin').length}</div>
                <div className="text-sm text-mckinsey-muted">管理员</div>
              </div>
            </div>

            {/* User table */}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-mckinsey-muted uppercase">注册时间</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-mckinsey-muted uppercase">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mckinsey-border">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-mckinsey-light/50">
                          <td className="px-6 py-4 text-mckinsey-navy">{u.id}</td>
                          <td className="px-6 py-4">
                            <div className="text-mckinsey-navy font-medium">{u.nickname || '-'}</div>
                            <div className="text-mckinsey-muted text-xs">{u.email || u.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={u.role}
                              onChange={(e) => changeRole(u.id, e.target.value)}
                              className="text-xs border border-mckinsey-border rounded px-2 py-1"
                            >
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
                          <td className="px-6 py-4">
                            <button className="text-xs text-red-600 hover:underline">禁用</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
