import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, nickname || undefined);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>注册 - AI Quality Portal</title>
      </Head>

      <div className="pt-16 min-h-screen bg-gradient-to-b from-mckinsey-light to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="accent-bar mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-mckinsey-navy">注册</h1>
              <p className="text-mckinsey-muted text-sm mt-2">创建账号，开始使用AI质量工具</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-mckinsey-navy mb-1.5">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/30 focus:border-mckinsey-teal transition-all"
                  placeholder="你的昵称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-mckinsey-navy mb-1.5">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/30 focus:border-mckinsey-teal transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-mckinsey-navy mb-1.5">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/30 focus:border-mckinsey-teal transition-all"
                  placeholder="至少6位"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-mckinsey-navy mb-1.5">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/30 focus:border-mckinsey-teal transition-all"
                  placeholder="再次输入密码"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-center disabled:opacity-50"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-mckinsey-muted">
              已有账号？{' '}
              <Link href="/login" className="text-mckinsey-teal hover:underline font-medium">
                登录
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
