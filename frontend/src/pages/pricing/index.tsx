import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

const PLANS = [
  {
    id: 'free', name: '免费版', monthly: 0, annual: 0, popular: false,
    features: ['基础问题分析', '基础5Why引导', '3个案例/月', '3次数据分析/月', '基础8D生成'],
    limitations: ['无历史案例库', '无Word导出', '无AI教练'],
  },
  {
    id: 'pro', name: 'Pro 专业版', monthly: 99, annual: 999, popular: true,
    features: ['无限质量案例', '无限数据分析', '深度根因验证', '完整8D + Word导出',
               '历史案例库', 'AI质量教练双模式', '优先AI响应', 'FMEA / DOE 全功能'],
    limitations: [],
  },
  {
    id: 'pro_plus', name: 'Pro+ 团队版', monthly: 299, annual: 2999, popular: false,
    features: ['Pro全部功能', '团队协作(5人)', '企业知识库', '批量数据分析',
               '自定义报告模板', '优先技术支持', 'API访问'],
    limitations: [],
  },
];

export default function PricingPage() {
  const { isAuthenticated, token, refreshUser } = useAuth();
  const router = useRouter();
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly');
  const [usage, setUsage] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);
  const [payInfo, setPayInfo] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/v1/billing/payment-status').then(r => r.json()).then(setPayInfo).catch(() => {});
    if (token) {
      fetch('/api/v1/subscription/usage', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setUsage).catch(() => {});
      fetch('/api/v1/billing/my-subscription', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setSub).catch(() => {});
    }
  }, [token]);

  async function startOrder(planId: string) {
    if (!isAuthenticated) { router.push('/login'); return; }
    setBusy(true); setMsg(''); setOrder(null);
    try {
      const provider = payInfo?.available_providers?.[0]?.id || 'mock';
      const res = await fetch('/api/v1/billing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan_id: planId, billing_cycle: cycle, provider }),
      });
      const d = await res.json();
      if (!res.ok) { setMsg(d.detail || '创建订单失败'); return; }
      setOrder(d);
    } catch { setMsg('创建订单失败'); }
    finally { setBusy(false); }
  }

  async function confirmMock() {
    if (!order) return;
    setBusy(true);
    try {
      const res = await fetch('/api/v1/billing/orders/confirm-mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_no: order.order_no }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg(`✓ 开通成功，当前身份：${d.new_role}`);
        setOrder(null);
        await refreshUser();
        fetch('/api/v1/billing/my-subscription', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(setSub).catch(() => {});
      } else {
        setMsg(d.detail || '确认失败');
      }
    } finally { setBusy(false); }
  }

  const isMock = payInfo?.mode === 'mock';

  return (
    <>
      <Head><title>定价 - AI Quality Portal</title></Head>
      <div className="pt-16 min-h-screen bg-gradient-to-b from-mckinsey-light/50 to-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-16 py-14">
          <div className="text-center mb-8">
            <div className="accent-bar mx-auto mb-5" />
            <h1 className="text-3xl lg:text-4xl font-bold text-mckinsey-navy mb-3">选择适合你的方案</h1>
            <p className="text-mckinsey-muted max-w-xl mx-auto">免费开始使用，随时升级解锁全部 AI 质量能力</p>
          </div>

          {/* Cycle toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-xl bg-white border border-mckinsey-border p-1">
              <button onClick={() => setCycle('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  cycle === 'monthly' ? 'bg-mckinsey-navy text-white' : 'text-mckinsey-muted'
                }`}>月付</button>
              <button onClick={() => setCycle('annual')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  cycle === 'annual' ? 'bg-mckinsey-navy text-white' : 'text-mckinsey-muted'
                }`}>
                年付 <span className="text-mckinsey-teal">省16%</span>
              </button>
            </div>
          </div>

          {/* Current subscription */}
          {sub?.has_subscription && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4 text-center">
              <p className="text-sm text-emerald-800">
                当前方案：<strong>{sub.plan_name}</strong> · 剩余 {sub.days_left} 天
                （到期 {sub.expires_at?.slice(0, 10)}）
              </p>
            </div>
          )}

          {usage && usage.plan === 'free' && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 text-center">
              <p className="text-sm text-amber-800">
                本月已使用 <strong>{usage.cases_used}/{usage.cases_limit}</strong> 个案例
                {usage.cases_remaining === 0 && ' — 已达上限，升级 Pro 继续使用'}
              </p>
            </div>
          )}

          {msg && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-6 py-3 text-center text-sm text-blue-800">{msg}</div>
          )}

          {isMock && (
            <div className="mb-6 bg-gray-100 border border-gray-300 rounded-xl px-6 py-3 text-center text-xs text-gray-700">
              支付渠道尚未接入商户号，当前为测试模式：下单后可直接确认以体验开通流程，不会产生真实扣款
            </div>
          )}

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => {
              const price = cycle === 'annual' ? plan.annual : plan.monthly;
              const isCurrent = sub?.has_subscription ? sub.plan_id === plan.id : plan.id === 'free';
              return (
                <div key={plan.id} className={`card relative flex flex-col ${plan.popular ? 'ring-2 ring-mckinsey-teal shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-mckinsey-teal text-white text-xs font-semibold rounded-full">最受欢迎</div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-mckinsey-navy">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-mckinsey-navy">¥{price}</span>
                      <span className="text-sm text-mckinsey-muted">/{cycle === 'annual' ? '年' : '月'}</span>
                    </div>
                    {cycle === 'annual' && plan.monthly > 0 && (
                      <p className="mt-1 text-xs text-mckinsey-teal font-medium">
                        相当于 ¥{Math.round(plan.annual / 12)}/月，省 ¥{plan.monthly * 12 - plan.annual}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-mckinsey-navy">
                        <svg className="w-4 h-4 text-mckinsey-teal mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {f}
                      </li>
                    ))}
                    {plan.limitations.map((l, i) => (
                      <li key={`l-${i}`} className="flex items-start gap-2 text-sm text-mckinsey-muted">
                        <svg className="w-4 h-4 text-mckinsey-muted/50 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span className="line-through">{l}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id === 'free' ? (
                    <button disabled className="w-full py-3 rounded-xl font-medium text-sm bg-mckinsey-light text-mckinsey-muted">
                      {isCurrent ? '当前方案' : '免费使用'}
                    </button>
                  ) : isCurrent ? (
                    <button disabled className="w-full py-3 rounded-xl font-medium text-sm bg-emerald-50 text-emerald-700">
                      ✓ 当前方案
                    </button>
                  ) : (
                    <button onClick={() => startOrder(plan.id)} disabled={busy}
                      className={`w-full py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white hover:shadow-lg hover:shadow-mckinsey-teal/30'
                          : 'bg-mckinsey-navy text-white hover:bg-mckinsey-blue'
                      }`}>
                      {busy ? '处理中...' : isAuthenticated ? `升级 ${plan.name}` : '登录后升级'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Order / payment modal */}
          {order && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4" onClick={() => setOrder(null)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-mckinsey-navy mb-1">确认订单</h3>
                <p className="text-xs text-mckinsey-muted mb-5">订单号 {order.order_no}</p>

                <div className="bg-mckinsey-light rounded-xl p-4 mb-5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-mckinsey-navy">{order.subject}</span>
                    <span className="text-2xl font-bold text-mckinsey-navy">¥{order.amount}</span>
                  </div>
                </div>

                {order.is_mock ? (
                  <>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
                      测试模式：点击下方按钮模拟支付成功，不会产生真实扣款
                    </div>
                    <button onClick={confirmMock} disabled={busy}
                      className="w-full py-3 bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white font-medium rounded-xl hover:shadow-lg disabled:opacity-50">
                      {busy ? '处理中...' : '模拟支付成功'}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-mckinsey-navy mb-3">请使用 {order.provider === 'alipay' ? '支付宝' : '微信'} 扫码支付</p>
                    <div className="bg-white border-2 border-mckinsey-border rounded-xl p-4 mb-4 text-center">
                      <p className="text-[10px] text-mckinsey-muted break-all font-mono">{order.pay_url}</p>
                    </div>
                    <p className="text-xs text-mckinsey-muted text-center">支付完成后页面会自动更新</p>
                  </>
                )}

                <button onClick={() => setOrder(null)} className="w-full mt-3 py-2 text-sm text-mckinsey-muted hover:text-mckinsey-navy">
                  取消
                </button>
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-mckinsey-navy text-center mb-8">常见问题</h2>
            <div className="space-y-4">
              {[
                ['免费版能做什么？', '每月可创建3个质量案例，体验完整的 AI 问题解决流程（问题定义→原因分析→改善措施→8D生成）。'],
                ['Pro 版有什么额外能力？', '无限案例、多根因管理、措施覆盖度校验、效果验证统计分析、完整 Word 报告导出、AI 教练双模式、DOE 与 FMEA 全功能。'],
                ['可以随时取消吗？', '按月订阅可随时取消，当月剩余时间仍可使用 Pro 功能。'],
                ['上传的数据安全吗？', '文件存储在你专属的账号空间，仅用于当前案例的 AI 分析，不会用于训练模型，也不会被其他用户检索到。'],
              ].map(([q, a]) => (
                <div key={q} className="card p-5">
                  <h4 className="font-semibold text-sm text-mckinsey-navy mb-1">{q}</h4>
                  <p className="text-sm text-mckinsey-muted">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
