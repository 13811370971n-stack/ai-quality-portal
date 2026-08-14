import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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
        <title>登录 - AI Quality Portal</title>
      </Head>

      <div className="pt-16 min-h-screen bg-gradient-to-b from-mckinsey-light to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="accent-bar mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-mckinsey-navy">登录</h1>
              <p className="text-mckinsey-muted text-sm mt-2">登录以使用AI质量工具</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-center disabled:opacity-50"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-mckinsey-muted">
              还没有账号？{' '}
              <Link href="/register" className="text-mckinsey-teal hover:underline font-medium">
                注册
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
