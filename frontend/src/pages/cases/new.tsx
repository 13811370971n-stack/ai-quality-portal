import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

const caseTypes = [
  { id: 'complaint', label: '客户投诉', desc: '客户发现质量问题，需要处理投诉', icon: '🔴' },
  { id: 'incoming', label: '来料异常', desc: '供应商来料出现质量问题', icon: '📦' },
  { id: 'process', label: '制程异常', desc: '生产过程中发现异常', icon: '⚙️' },
  { id: 'failure', label: '产品失效', desc: '产品出现功能或可靠性问题', icon: '💥' },
  { id: 'supplier', label: '供应商问题', desc: '供应商发生重复性质量问题', icon: '🏭' },
  { id: 'internal', label: '内部质量问题', desc: '内部审核、检验发现问题', icon: '🔍' },
];

export default function NewCasePage() {
  const [step, setStep] = useState(1);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('/api/v1/subscription/check-limit?action=case', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (!data.allowed) setLimitReached(true); })
        .catch(() => {});
    }
  }, [token]);
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const router = useRouter();

  async function handleSubmit() {
    if (!selectedType || !description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/cases/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          case_type: selectedType,
          description: description.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/cases/${data.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>新建质量案例 - AI Quality Portal</title></Head>
      <div className="pt-16">
        <AuthGuard>
          <div className="max-w-4xl mx-auto px-6 lg:px-16 py-12">
            {limitReached && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                <p className="text-sm text-amber-800 font-medium mb-2">本月免费额度已用完</p>
                <p className="text-xs text-amber-700 mb-3">免费版每月可创建3个质量案例，升级Pro解锁无限使用</p>
                <a href="/pricing" className="text-xs font-medium text-mckinsey-teal hover:underline">查看升级方案 →</a>
              </div>
            )}
            <div className="accent-bar mb-6" />
            <h1 className="text-3xl font-bold text-mckinsey-navy mb-2">解决一个质量问题</h1>
            <p className="text-mckinsey-muted mb-8">AI将陪你完成从问题定义到8D的完整流程</p>

            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold text-mckinsey-navy mb-4">这是什么类型的问题？</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {caseTypes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedType(t.id); setStep(2); }}
                      className={`card text-left hover:-translate-y-1 transition-all duration-200 ${
                        selectedType === t.id ? 'ring-2 ring-mckinsey-teal' : ''
                      }`}
                    >
                      <div className="text-2xl mb-3">{t.icon}</div>
                      <h3 className="font-semibold text-mckinsey-navy mb-1">{t.label}</h3>
                      <p className="text-sm text-mckinsey-muted">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <button onClick={() => setStep(1)} className="text-mckinsey-muted hover:text-mckinsey-navy text-sm">
                    &larr; 返回选择
                  </button>
                  <span className="text-mckinsey-muted text-sm">/</span>
                  <span className="text-sm font-medium text-mckinsey-teal">
                    {caseTypes.find(t => t.id === selectedType)?.label}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-mckinsey-navy mb-4">请告诉我发生了什么？</h2>
                <p className="text-sm text-mckinsey-muted mb-4">
                  用你自己的话描述问题，不需要专业术语。AI会帮你整理和追问。
                </p>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-40 px-4 py-3 rounded-xl border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/30 focus:border-mckinsey-teal transition-all resize-none"
                  placeholder="例如：客户反馈某型号产品装配后出现漏水，最近一个批次发生20件，客户要求3天内给出8D..."
                />

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={!description.trim() || loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? '创建中...' : '开始分析'}
                  </button>
                </div>
              </>
            )}
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
