import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
  const { isAuthenticated, token, user } = useAuth();
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    if (token) {
      fetch('/api/v1/subscription/usage', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setUsage).catch(() => {});
    }
  }, [token]);

  const plans = [
    {
      id: 'free', name: '免费版', price: '¥0', period: '/月', popular: false,
      features: ['基础问题分析', '基础5Why引导', '3个案例/月', '3次数据分析/月', '基础8D生成'],
      limitations: ['无历史案例库', '无Word导出', '无AI教练'],
      cta: '当前方案',
      ctaStyle: 'bg-mckinsey-light text-mckinsey-navy',
    },
    {
      id: 'pro', name: 'Pro 专业版', price: '¥99', period: '/月', popular: true,
      annual: '¥999/年 (省¥189)',
      features: ['无限质量案例', '无限数据分析', '深度根因验证', '完整8D + Word导出', '历史案例库',
                 'AI质量教练', '优先AI响应', 'FMEA辅助'],
      limitations: [],
      cta: '升级 Pro',
      ctaStyle: 'bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white hover:shadow-lg hover:shadow-mckinsey-teal/30',
    },
    {
      id: 'pro_plus', name: 'Pro+ 团队版', price: '¥299', period: '/月', popular: false,
      annual: '¥2,999/年 (省¥589)',
      features: ['Pro全部功能', '团队协作(5人)', '企业知识库', '批量数据分析',
                 '自定义报告模板', '优先技术支持', 'API访问'],
      limitations: [],
      cta: '联系我们',
      ctaStyle: 'bg-mckinsey-navy text-white hover:bg-mckinsey-blue',
    },
  ];

  return (
    <>
      <Head><title>定价 - AI Quality Portal</title></Head>
      <div className="pt-16 min-h-screen bg-gradient-to-b from-mckinsey-light/50 to-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-16 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="accent-bar mx-auto mb-5" />
            <h1 className="text-3xl lg:text-4xl font-bold text-mckinsey-navy mb-3">选择适合你的方案</h1>
            <p className="text-mckinsey-muted max-w-xl mx-auto">
              免费开始使用，随时升级解锁全部AI质量能力
            </p>
          </div>

          {/* Usage banner for logged-in users */}
          {usage && usage.plan === 'free' && (
            <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 text-center">
              <p className="text-sm text-amber-800">
                本月已使用 <strong>{usage.cases_used}/{usage.cases_limit}</strong> 个案例
                {usage.cases_remaining === 0 && ' — 已达上限，升级Pro继续使用'}
              </p>
            </div>
          )}

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.id} className={`card relative flex flex-col ${plan.popular ? 'ring-2 ring-mckinsey-teal shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-mckinsey-teal text-white text-xs font-semibold rounded-full">
                    最受欢迎
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-mckinsey-navy">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-mckinsey-navy">{plan.price}</span>
                    <span className="text-sm text-mckinsey-muted">{plan.period}</span>
                  </div>
                  {plan.annual && (
                    <p className="mt-1 text-xs text-mckinsey-teal font-medium">{plan.annual}</p>
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

                <button className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${plan.ctaStyle}`}>
                  {plan.id === 'free' && isAuthenticated && usage?.plan === 'free' ? '当前方案' : plan.cta}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-mckinsey-navy text-center mb-8">常见问题</h2>
            <div className="space-y-4">
              <div className="card p-5">
                <h4 className="font-semibold text-sm text-mckinsey-navy mb-1">免费版能做什么？</h4>
                <p className="text-sm text-mckinsey-muted">每月可创建3个质量案例，体验完整的AI问题解决流程（问题定义→原因分析→改善措施→8D生成）。</p>
              </div>
              <div className="card p-5">
                <h4 className="font-semibold text-sm text-mckinsey-navy mb-1">Pro版有什么额外能力？</h4>
                <p className="text-sm text-mckinsey-muted">无限案例、深度根因验证、完整Word报告导出、AI质量教练模式、历史案例库检索。</p>
              </div>
              <div className="card p-5">
                <h4 className="font-semibold text-sm text-mckinsey-navy mb-1">可以随时取消吗？</h4>
                <p className="text-sm text-mckinsey-muted">是的，按月订阅可随时取消，当月剩余时间仍可使用Pro功能。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
