import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

export default function ProfilePage() {
  const { user } = useAuth();

  const roleLabels: Record<string, string> = {
    user: '普通用户',
    vip: 'VIP会员',
    admin: '管理员',
  };

  const roleBadgeStyles: Record<string, string> = {
    user: 'bg-blue-50 text-blue-700',
    vip: 'bg-gradient-to-r from-mckinsey-gold/20 to-amber-100 text-mckinsey-gold',
    admin: 'bg-red-50 text-red-700',
  };

  return (
    <>
      <Head>
        <title>个人中心 - AI Quality Portal</title>
      </Head>

      <div className="pt-16">
        <AuthGuard>
          <div className="max-w-4xl mx-auto px-6 lg:px-16 py-12">
            <div className="accent-bar mb-6" />
            <h1 className="text-3xl font-bold text-mckinsey-navy mb-8">个人中心</h1>

            <div className="card mb-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mckinsey-teal to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                  {(user?.nickname || user?.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-mckinsey-navy">{user?.nickname || '未设置昵称'}</h2>
                  <p className="text-mckinsey-muted text-sm">{user?.email}</p>
                  <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${roleBadgeStyles[user?.role || 'user'] || ''}`}>
                    {roleLabels[user?.role || 'user'] || user?.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-mckinsey-navy mb-4">账户信息</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-mckinsey-muted">邮箱</dt>
                    <dd className="text-mckinsey-navy">{user?.email || '未绑定'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-mckinsey-muted">手机</dt>
                    <dd className="text-mckinsey-navy">{user?.phone || '未绑定'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-mckinsey-muted">账户状态</dt>
                    <dd className="text-emerald-600">正常</dd>
                  </div>
                </dl>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-mckinsey-navy mb-4">学习进度</h3>
                <p className="text-mckinsey-muted text-sm">暂无学习记录</p>
                <div className="mt-4 pt-4 border-t border-mckinsey-border">
                  <p className="text-xs text-mckinsey-muted">使用AI工具后，进度将自动记录</p>
                </div>
              </div>
            </div>
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
