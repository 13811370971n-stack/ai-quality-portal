import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [smsMode, setSmsMode] = useState<string | null>(null);
  const { login, loginWithPhone } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/v1/auth/sms/status').then(r => r.json()).then(d => setSmsMode(d.mode)).catch(() => {});
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function sendCode() {
    if (!/^1[3-9]\d{9}$/.test(phone)) { setError('请输入正确的手机号'); return; }
    setError(''); setNotice(''); setSending(true);
    try {
      const res = await fetch('/api/v1/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'login' }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.detail || '发送失败'); return; }
      setCooldown(d.cooldown || 60);
      if (d.mock_code) {
        setNotice(`测试模式：验证码 ${d.mock_code}（短信服务未配置，未实际发送）`);
        setCode(d.mock_code);
      } else {
        setNotice('验证码已发送，5分钟内有效');
      }
    } catch { setError('发送失败，请重试'); }
    finally { setSending(false); }
  }

  async function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await loginWithPhone(phone, code);
      router.push('/');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <>
      <Head><title>登录 - AI Quality Portal</title></Head>
      <div className="pt-16 min-h-screen bg-gradient-to-b from-mckinsey-light to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-6">
              <div className="accent-bar mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-mckinsey-navy">登录</h1>
              <p className="text-mckinsey-muted text-sm mt-2">登录以使用 AI 质量工具</p>
            </div>

            {/* Mode tabs */}
            <div className="flex rounded-xl bg-mckinsey-light p-1 mb-6">
              <button onClick={() => { setMode('email'); setError(''); setNotice(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'email' ? 'bg-white text-mckinsey-navy shadow-sm' : 'text-mckinsey-muted'
                }`}>邮箱登录</button>
              <button onClick={() => { setMode('phone'); setError(''); setNotice(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'phone' ? 'bg-white text-mckinsey-navy shadow-sm' : 'text-mckinsey-muted'
                }`}>手机登录</button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
            )}
            {notice && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-xs">{notice}</div>
            )}

            {mode === 'email' ? (
              <form onSubmit={submitEmail} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-mckinsey-navy mb-1.5">邮箱</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full px-4 py-3 rounded-lg border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/30 focus:border-mckinsey-teal transition-all"
                    placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-mckinsey-navy mb-1.5">密码</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full px-4 py-3 rounded-lg border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/30 focus:border-mckinsey-teal transition-all"
                    placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-center disabled:opacity-50">
                  {loading ? '登录中...' : '登录'}
                </button>
              </form>
            ) : (
              <form onSubmit={submitPhone} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-mckinsey-navy mb-1.5">手机号</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    required maxLength={11}
                    className="w-full px-4 py-3 rounded-lg border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/30 focus:border-mckinsey-teal transition-all"
                    placeholder="11位手机号" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-mckinsey-navy mb-1.5">验证码</label>
                  <div className="flex gap-2">
                    <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required maxLength={6}
                      className="flex-1 px-4 py-3 rounded-lg border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/30 focus:border-mckinsey-teal transition-all"
                      placeholder="6位验证码" />
                    <button type="button" onClick={sendCode} disabled={sending || cooldown > 0 || phone.length !== 11}
                      className="px-4 py-3 bg-mckinsey-light text-mckinsey-navy text-sm font-medium rounded-lg hover:bg-mckinsey-border/50 disabled:opacity-40 whitespace-nowrap">
                      {cooldown > 0 ? `${cooldown}s` : sending ? '发送中' : '获取验证码'}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading || code.length !== 6}
                  className="w-full btn-primary py-3 text-center disabled:opacity-50">
                  {loading ? '验证中...' : '登录 / 注册'}
                </button>
                <p className="text-[11px] text-mckinsey-muted text-center">
                  未注册的手机号将自动创建账号
                  {smsMode === 'mock' && <><br/><span className="text-amber-600">短信服务尚未配置，当前为测试模式</span></>}
                </p>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-mckinsey-muted">
              还没有账号？{' '}
              <Link href="/register" className="text-mckinsey-teal hover:underline font-medium">邮箱注册</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
