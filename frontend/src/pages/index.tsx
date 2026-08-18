import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const caseTypeIcons: Record<string, string> = {
  complaint: '🔴', incoming: '📦', process: '⚙️',
  failure: '💥', supplier: '🏭', internal: '🔍',
};
const statusLabels: Record<string, string> = {
  intake: '信息收集', investigation: '问题定义', rca: '原因分析',
  measures: '改善措施', closing: '生成报告', closed: '已关闭',
};

export default function HomePage() {
  const { isAuthenticated, user, token } = useAuth();
  const [recentCases, setRecentCases] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetch('/api/v1/cases/', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setRecentCases(data.slice(0, 5)); })
        .catch(() => {});
    }
  }, [token]);

  return (
    <>
      <Head>
        <title>AI Quality Portal - AI赋能质量管理</title>
        <meta name="description" content="AI赋能质量管理平台 - 面向制造业质量工程师的AI工作与能力提升平台" />
      </Head>

      {/* Hero - compact for logged-in users */}
      <section className="relative mesh-gradient text-white overflow-hidden">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className={`relative max-w-7xl mx-auto px-6 lg:px-16 ${isAuthenticated ? 'py-16 pt-24' : 'py-24 pt-32 lg:py-32 lg:pt-40'}`}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="max-w-3xl">
            <div className="h-1 w-12 bg-gradient-to-r from-mckinsey-gold to-mckinsey-teal rounded-full mb-6" />
            {isAuthenticated ? (
              <>
                <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
                  欢迎回来，<span className="text-mckinsey-teal">{user?.nickname || '质量工程师'}</span>
                </h1>
                <p className="text-base text-white/60 mb-6">今天要解决什么质量问题？</p>
              </>
            ) : (
              <>
                <h1 className="text-4xl lg:text-6xl font-bold leading-[1.1] mb-5">
                  AI赋能<br />
                  <span className="glow-text bg-gradient-to-r from-mckinsey-teal to-cyan-400 bg-clip-text text-transparent">质量管理</span>
                </h1>
                <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-2xl">
                  面向制造业质量工程师的AI工作与能力提升平台。把质量问题从发生推进到闭环。
                </p>
              </>
            )}
            <div className="flex flex-wrap gap-3">
              <Link href="/cases/new" className="btn-primary">
                {isAuthenticated ? '+ 新建质量案例' : '开始使用'}
              </Link>
              {!isAuthenticated && (
                <Link href="/register" className="btn-secondary">免费注册</Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Workbench for logged-in users */}
      {isAuthenticated && recentCases.length > 0 && (
        <section className="py-10 px-6 lg:px-16 bg-gradient-to-b from-mckinsey-light/50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-mckinsey-navy">进行中的案例</h2>
              <Link href="/cases" className="text-sm text-mckinsey-teal hover:underline">查看全部 →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentCases.filter(c => c.status !== 'closed').slice(0, 3).map(c => (
                <Link key={c.id} href={`/cases/${c.id}`} className="block">
                  <div className="card hover:-translate-y-0.5 transition-all duration-200 p-5">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{caseTypeIcons[c.case_type] || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-mckinsey-navy truncate">{c.title}</h3>
                        <p className="text-xs text-mckinsey-muted mt-1 line-clamp-1">{c.problem_statement || '进行中...'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                            {statusLabels[c.status] || c.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section className="py-12 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="accent-bar mx-auto mb-4" />
            <h2 className="text-2xl lg:text-3xl font-bold text-mckinsey-navy mb-2">
              {isAuthenticated ? '快捷入口' : '今天要解决什么？'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Link href="/cases/new" className="block">
              <div className="card hover:-translate-y-1 transition-all duration-200 text-center p-6 group">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="font-semibold text-mckinsey-navy group-hover:text-mckinsey-teal transition-colors">解决质量问题</h3>
                <p className="text-xs text-mckinsey-muted mt-1">AI陪你从问题到8D</p>
              </div>
            </Link>
            <Link href="/tools/ai-spc" className="block">
              <div className="card hover:-translate-y-1 transition-all duration-200 text-center p-6 group">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold text-mckinsey-navy group-hover:text-mckinsey-teal transition-colors">SPC分析</h3>
                <p className="text-xs text-mckinsey-muted mt-1">控制图 + 过程能力</p>
              </div>
            </Link>
            <Link href="/tools" className="block">
              <div className="card hover:-translate-y-1 transition-all duration-200 text-center p-6 group">
                <div className="text-3xl mb-3">🛠️</div>
                <h3 className="font-semibold text-mckinsey-navy group-hover:text-mckinsey-teal transition-colors">AI工具集</h3>
                <p className="text-xs text-mckinsey-muted mt-1">SPC / MSA / FMEA</p>
              </div>
            </Link>
            <Link href="/methodology" className="block">
              <div className="card hover:-translate-y-1 transition-all duration-200 text-center p-6 group">
                <div className="text-3xl mb-3">📚</div>
                <h3 className="font-semibold text-mckinsey-navy group-hover:text-mckinsey-teal transition-colors">DMAIC方法论</h3>
                <p className="text-xs text-mckinsey-muted mt-1">AI + 六西格玛</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Value props - only for non-authenticated */}
      {!isAuthenticated && (
        <section className="py-16 px-6 lg:px-16 bg-mckinsey-light/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-mckinsey-navy mb-3">不只是AI聊天，是你的AI质量工程师</h2>
              <p className="text-mckinsey-muted max-w-2xl mx-auto">AI主动分析、人做关键判断。把一个质量问题从发生推进到闭环。</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card text-center">
                <div className="text-3xl mb-3">🧠</div>
                <h3 className="font-semibold text-mckinsey-navy mb-2">AI主动分析</h3>
                <p className="text-sm text-mckinsey-muted">像资深质量工程师一样追问关键信息、建立证据链、引导5Why分析</p>
              </div>
              <div className="card text-center">
                <div className="text-3xl mb-3">📋</div>
                <h3 className="font-semibold text-mckinsey-navy mb-2">8D是结果不是起点</h3>
                <p className="text-sm text-mckinsey-muted">先解决问题，再自动生成报告。不是AI凭空写一份8D</p>
              </div>
              <div className="card text-center">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="font-semibold text-mckinsey-navy mb-2">证据驱动</h3>
                <p className="text-sm text-mckinsey-muted">每个结论有来源和置信度，区分事实、推测和待验证假设</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
