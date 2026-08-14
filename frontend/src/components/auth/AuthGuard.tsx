'use client';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'vip' | 'admin';
  fallback?: 'login' | 'upgrade';
}

const roleLevel: Record<string, number> = {
  guest: 0,
  user: 1,
  vip: 2,
  admin: 3,
};

export default function AuthGuard({ children, requiredRole = 'user', fallback = 'login' }: AuthGuardProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-mckinsey-muted">加载中...</div>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  // Check role level
  const userLevel = roleLevel[user?.role || 'guest'] || 0;
  const requiredLevel = roleLevel[requiredRole] || 1;

  if (userLevel < requiredLevel) {
    if (fallback === 'upgrade') {
      return <UpgradePrompt requiredRole={requiredRole} />;
    }
    return <LoginPrompt />;
  }

  return <>{children}</>;
}

function LoginPrompt() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-mckinsey-light flex items-center justify-center">
          <svg className="w-10 h-10 text-mckinsey-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-mckinsey-navy mb-3">需要登录</h2>
        <p className="text-mckinsey-muted mb-8">登录后即可使用此功能</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login" className="btn-primary text-center">
            登录
          </Link>
          <Link href="/register" className="px-6 py-3 border border-mckinsey-border text-mckinsey-navy font-medium rounded-xl hover:bg-mckinsey-light transition-colors text-sm text-center">
            注册账号
          </Link>
        </div>
      </div>
    </div>
  );
}

function UpgradePrompt({ requiredRole }: { requiredRole: string }) {
  const roleLabel: Record<string, string> = {
    vip: 'VIP会员',
    admin: '管理员',
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-mckinsey-gold/20 to-amber-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-mckinsey-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-mckinsey-navy mb-3">需要升级</h2>
        <p className="text-mckinsey-muted mb-2">此功能需要 <span className="text-mckinsey-gold font-semibold">{roleLabel[requiredRole] || requiredRole}</span> 权限</p>
        <p className="text-mckinsey-muted text-sm mb-8">升级后解锁全部高级功能</p>
        <button className="btn-primary bg-gradient-to-r from-mckinsey-gold to-amber-500 hover:shadow-[0_8px_24px_rgba(197,165,114,0.4)]">
          升级 VIP
        </button>
      </div>
    </div>
  );
}
