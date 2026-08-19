import Head from 'next/head';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>关于 - AI Quality Portal | 面向制造业质量工程师的AI平台</title>
        <meta name="description" content="AI Quality Portal是面向制造业质量工程师的AI工作与能力提升平台。AI主动分析质量问题，帮助你从问题发生推进到闭环。" />
        <meta name="keywords" content="质量管理,AI,8D,FMEA,SPC,六西格玛,质量工程师,根因分析,5Why,制造业" />
      </Head>
      <div className="pt-16">
        {/* Hero */}
        <section className="bg-mckinsey-navy text-white py-20 px-6 lg:px-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="accent-bar mx-auto mb-6" />
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">面向制造业质量工程师的<br/>AI工作与能力提升平台</h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              不只是AI聊天，是你的AI质量工程师。把质量问题从发生推进到闭环。
            </p>
          </div>
        </section>

        {/* What we do */}
        <section className="py-16 px-6 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-mckinsey-navy mb-8">我们解决什么问题？</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-semibold text-mckinsey-navy mb-2">传统方式</h3>
                <ul className="space-y-2 text-sm text-mckinsey-muted">
                  <li>❌ 8D报告靠人工经验填写，质量参差</li>
                  <li>❌ 根因分析依赖个人能力，缺乏证据链</li>
                  <li>❌ 质量数据散落在Excel中无法利用</li>
                  <li>❌ 知识不能沉淀，重复问题反复发生</li>
                  <li>❌ 新人上手慢，缺乏系统培训</li>
                </ul>
              </div>
              <div className="card bg-mckinsey-teal/5 border-mckinsey-teal/20">
                <h3 className="font-semibold text-mckinsey-teal mb-2">AI Quality Portal</h3>
                <ul className="space-y-2 text-sm text-mckinsey-navy">
                  <li>✅ AI主动引导问题分析，自动生成8D</li>
                  <li>✅ 基于证据的根因分析，置信度可追溯</li>
                  <li>✅ 上传数据即时获得统计分析+AI解读</li>
                  <li>✅ 每个案例自动沉淀为企业知识</li>
                  <li>✅ AI教练模式，边做边学</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Target users */}
        <section className="py-16 px-6 lg:px-16 bg-mckinsey-light/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-mckinsey-navy mb-8">谁在使用？</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="card text-center p-6">
                <div className="text-3xl mb-3">🔧</div>
                <h3 className="font-semibold text-mckinsey-navy mb-1">质量工程师</h3>
                <p className="text-xs text-mckinsey-muted">QE / CQE / SQE / DQE</p>
              </div>
              <div className="card text-center p-6">
                <div className="text-3xl mb-3">🏭</div>
                <h3 className="font-semibold text-mckinsey-navy mb-1">制造业行业</h3>
                <p className="text-xs text-mckinsey-muted">汽车 / 新能源 / 电子 / 机械</p>
              </div>
              <div className="card text-center p-6">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="font-semibold text-mckinsey-navy mb-1">2-8年经验</h3>
                <p className="text-xs text-mckinsey-muted">懂质量工具，需要提高效率</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 lg:px-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-mckinsey-navy mb-4">开始使用AI解决质量问题</h2>
            <p className="text-mckinsey-muted mb-8">免费注册，立即体验完整的AI质量问题解决流程</p>
            <div className="flex gap-4 justify-center">
              <Link href="/register" className="btn-primary">免费注册</Link>
              <Link href="/pricing" className="px-6 py-3 border border-mckinsey-border text-mckinsey-navy font-medium rounded-xl hover:bg-mckinsey-light transition-colors text-sm">
                查看定价
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
