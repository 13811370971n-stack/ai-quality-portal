import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

const roleLabels: Record<string, string> = { user: '普通用户', vip: 'VIP 会员', admin: '管理员' };
const roleStyles: Record<string, string> = {
  user: 'bg-blue-50 text-blue-700',
  vip: 'bg-gradient-to-r from-mckinsey-gold/20 to-amber-100 text-mckinsey-gold',
  admin: 'bg-red-50 text-red-700',
};

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const [sub, setSub] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  // Phone binding
  const [showBind, setShowBind] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [bindMsg, setBindMsg] = useState('');
  const [bindErr, setBindErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    fetch('/api/v1/billing/my-subscription', { headers: h }).then(r => r.json()).then(setSub).catch(() => {});
    fetch('/api/v1/subscription/usage', { headers: h }).then(r => r.json()).then(setUsage).catch(() => {});
    fetch('/api/v1/billing/orders', { headers: h }).then(r => r.json()).then(d => Array.isArray(d) && setOrders(d)).catch(() => {});
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode() {
    if (!/^1[3-9]\d{9}$/.test(phone)) { setBindErr('请输入正确的手机号'); return; }
    setBindErr(''); setBindMsg(''); setBusy(true);
    try {
      const res = await fetch('/api/v1/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'bind' }),
      });
      const d = await res.json();
      if (!res.ok) { setBindErr(d.detail || '发送失败'); return; }
      setCooldown(d.cooldown || 60);
      if (d.mock_code) { setBindMsg(`测试模式验证码：${d.mock_code}`); setCode(d.mock_code); }
      else setBindMsg('验证码已发送');
    } finally { setBusy(false); }
  }

  async function bind() {
    setBindErr(''); setBusy(true);
    try {
      const res = await fetch('/api/v1/auth/sms/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone, code }),
      });
      const d = await res.json();
      if (!res.ok) { setBindErr(d.detail || '绑定失败'); return; }
      setBindMsg('✓ 手机号绑定成功');
      setShowBind(false);
      await refreshUser();
    } finally { setBusy(false); }
  }

  return (
    <>
      <Head><title>个人中心 - AI Quality Portal</title></Head>
      <div className="pt-16">
        <AuthGuard>
          <div className="max-w-4xl mx-auto px-6 lg:px-16 py-12">
            <div className="accent-bar mb-6" />
            <h1 className="text-3xl font-bold text-mckinsey-navy mb-8">个人中心</h1>

            {/* Identity card */}
            <div className="card mb-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mckinsey-teal to-cyan-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {(user?.nickname || user?.email || user?.phone || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-mckinsey-navy">{user?.nickname || '未设置昵称'}</h2>
                  <p className="text-mckinsey-muted text-sm">{user?.email || user?.phone}</p>
                  <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${roleStyles[user?.role || 'user'] || ''}`}>
                    {roleLabels[user?.role || 'user'] || user?.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Account info */}
              <div className="card">
                <h3 className="text-lg font-semibold text-mckinsey-navy mb-4">账户信息</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <dt className="text-mckinsey-muted">邮箱</dt>
                    <dd className="text-mckinsey-navy">{user?.email || '未绑定'}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-mckinsey-muted">手机</dt>
                    <dd className="flex items-center gap-2">
                      <span className="text-mckinsey-navy">{user?.phone || '未绑定'}</span>
                      {!user?.phone && (
                        <button onClick={() => setShowBind(!showBind)}
                          className="text-xs text-mckinsey-teal hover:underline">绑定</button>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-mckinsey-muted">账户状态</dt>
                    <dd className="text-emerald-600">正常</dd>
                  </div>
                </dl>

                {showBind && (
                  <div className="mt-4 pt-4 border-t border-mckinsey-border space-y-2">
                    {bindErr && <p className="text-xs text-red-600">{bindErr}</p>}
                    {bindMsg && <p className="text-xs text-blue-600">{bindMsg}</p>}
                    <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      className="w-full px-3 py-2 rounded-lg border border-mckinsey-border text-sm" placeholder="手机号" />
                    <div className="flex gap-2">
                      <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="flex-1 px-3 py-2 rounded-lg border border-mckinsey-border text-sm" placeholder="验证码" />
                      <button onClick={sendCode} disabled={busy || cooldown > 0 || phone.length !== 11}
                        className="px-3 py-2 bg-mckinsey-light text-mckinsey-navy text-xs font-medium rounded-lg disabled:opacity-40 whitespace-nowrap">
                        {cooldown > 0 ? `${cooldown}s` : '获取验证码'}
                      </button>
                    </div>
                    <button onClick={bind} disabled={busy || code.length !== 6}
                      className="w-full py-2 bg-mckinsey-teal text-white text-sm font-medium rounded-lg disabled:opacity-40">
                      确认绑定
                    </button>
                  </div>
                )}
              </div>

              {/* Subscription */}
              <div className="card">
                <h3 className="text-lg font-semibold text-mckinsey-navy mb-4">订阅状态</h3>
                {sub?.has_subscription ? (
                  <>
                    <div className="mb-4 p-3 bg-gradient-to-r from-mckinsey-gold/10 to-amber-50 rounded-lg border border-mckinsey-gold/20">
                      <p className="text-sm font-semibold text-mckinsey-navy">{sub.plan_name}</p>
                      <p className="text-xs text-mckinsey-muted mt-1">
                        {sub.billing_cycle === 'annual' ? '年付' : '月付'} · 剩余 {sub.days_left} 天
                      </p>
                      <p className="text-[11px] text-mckinsey-muted mt-0.5">
                        到期日 {sub.expires_at?.slice(0, 10)}
                      </p>
                    </div>
                    <Link href="/pricing" className="text-xs text-mckinsey-teal hover:underline">管理订阅 →</Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-mckinsey-muted mb-3">当前使用免费版</p>
                    {usage && (
                      <div className="mb-4 p-3 bg-mckinsey-light rounded-lg">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-mckinsey-muted">本月案例</span>
                          <span className="text-mckinsey-navy font-medium">
                            {usage.cases_used} / {usage.cases_limit === -1 ? '无限' : usage.cases_limit}
                          </span>
                        </div>
                        {usage.cases_limit > 0 && (
                          <div className="h-1.5 bg-mckinsey-border rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${usage.cases_used >= usage.cases_limit ? 'bg-red-500' : 'bg-mckinsey-teal'}`}
                              style={{ width: `${Math.min(100, usage.cases_used / usage.cases_limit * 100)}%` }} />
                          </div>
                        )}
                      </div>
                    )}
                    <Link href="/pricing" className="btn-primary text-xs py-2 px-4 inline-block">升级 Pro</Link>
                  </>
                )}
              </div>
            </div>

            {/* Orders */}
            {orders.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-mckinsey-navy mb-4">订单记录</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-mckinsey-light">
                      <tr>
                        <th className="px-3 py-2 text-left">订单号</th>
                        <th className="px-3 py-2 text-left">方案</th>
                        <th className="px-3 py-2 text-right">金额</th>
                        <th className="px-3 py-2 text-center">状态</th>
                        <th className="px-3 py-2 text-left">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mckinsey-border">
                      {orders.map(o => (
                        <tr key={o.order_no}>
                          <td className="px-3 py-2 font-mono text-[10px]">{o.order_no}</td>
                          <td className="px-3 py-2">{o.plan_id} / {o.billing_cycle === 'annual' ? '年' : '月'}</td>
                          <td className="px-3 py-2 text-right">¥{o.amount}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                              o.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                              o.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {o.status === 'paid' ? '已支付' : o.status === 'pending' ? '待支付' : o.status === 'cancelled' ? '已取消' : o.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-mckinsey-muted">
                            {o.created_at ? new Date(o.created_at).toLocaleDateString('zh-CN') : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
