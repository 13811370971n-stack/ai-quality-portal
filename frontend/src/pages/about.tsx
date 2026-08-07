import Head from 'next/head';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>关于 - AI Quality Portal</title>
      </Head>

      <section className="bg-mckinsey-navy text-white py-16 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="accent-bar bg-mckinsey-gold mb-6" />
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">关于平台</h1>
          <p className="text-white/70 text-lg max-w-2xl">
            AI Quality Portal 的愿景、团队与技术架构。
          </p>
        </div>
      </section>

      <section className="section">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Vision */}
            <div>
              <h2 className="text-2xl font-bold text-mckinsey-navy mb-4">愿景</h2>
              <div className="accent-bar mb-6" />
              <p className="text-mckinsey-muted leading-relaxed mb-4">
                我们相信，AI不是替代质量工程师，而是赋能他们。通过将机器学习与
                经典六西格玛方法论结合，我们正在构建下一代质量管理工具生态。
              </p>
              <p className="text-mckinsey-muted leading-relaxed">
                从SPC实时监控到智能根因分析，从自动化MSA到AI教练辅助决策——
                每一个工具都让质量工程师的工作更高效、更精准。
              </p>
            </div>

            {/* Tech Architecture */}
            <div>
              <h2 className="text-2xl font-bold text-mckinsey-navy mb-4">技术架构</h2>
              <div className="accent-bar mb-6" />
              <div className="space-y-4">
                <div className="card p-4">
                  <div className="text-sm font-medium text-mckinsey-navy">前端</div>
                  <div className="text-sm text-mckinsey-muted mt-1">React + Next.js + Tailwind CSS + Framer Motion</div>
                </div>
                <div className="card p-4">
                  <div className="text-sm font-medium text-mckinsey-navy">后端</div>
                  <div className="text-sm text-mckinsey-muted mt-1">Python FastAPI + WebSocket + RESTful API</div>
                </div>
                <div className="card p-4">
                  <div className="text-sm font-medium text-mckinsey-navy">AI引擎</div>
                  <div className="text-sm text-mckinsey-muted mt-1">LLM Integration + Statistical Computing (SciPy/NumPy)</div>
                </div>
                <div className="card p-4">
                  <div className="text-sm font-medium text-mckinsey-navy">设计语言</div>
                  <div className="text-sm text-mckinsey-muted mt-1">McKinsey-inspired · 深蓝+白+金 · 大量留白 · 数据驱动</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
