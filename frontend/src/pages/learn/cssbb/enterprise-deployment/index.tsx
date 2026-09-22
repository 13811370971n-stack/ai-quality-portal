import Head from 'next/head';
import Link from 'next/link';

/** II. 企业级部署 的 6 个考点（页码来自 Primer 书签目录） */
const TOPICS = [
  {
    bokCode: 'I.A.1',
    titleZh: '六西格玛与精益基础',
    titleEn: 'Six Sigma and Lean Fundamentals',
    pages: [15, 59] as [number, number],
    parts: [
      { slug: 'six-sigma-value', titleZh: '六西格玛的价值与基础', pages: [15, 24] as [number, number], ready: true },
      { slug: 'quality-gurus', titleZh: '质量大师与贡献', pages: [25, 43] as [number, number], ready: false },
      { slug: 'lean-pioneers', titleZh: '精益与精益先驱', pages: [44, 59] as [number, number], ready: false },
    ],
  },
  {
    bokCode: 'I.A.2',
    titleZh: '持续改进方法论',
    titleEn: 'Continuous Improvement Methodologies',
    pages: [60, 71] as [number, number],
    parts: [],
  },
  {
    bokCode: 'I.A.3',
    titleZh: '业务系统与流程',
    titleEn: 'Business Systems and Processes',
    pages: [72, 77] as [number, number],
    parts: [],
  },
  {
    bokCode: 'I.A.4',
    titleZh: '战略规划与部署',
    titleEn: 'Strategic Planning and Deployment',
    pages: [78, 91] as [number, number],
    parts: [],
  },
  {
    bokCode: 'I.B.1',
    titleZh: '角色与职责',
    titleEn: 'Roles and Responsibilities',
    pages: [92, 104] as [number, number],
    parts: [],
  },
  {
    bokCode: 'I.B.2',
    titleZh: '组织障碍',
    titleEn: 'Organizational Roadblocks',
    pages: [105, 116] as [number, number],
    parts: [],
  },
];

export default function EnterpriseDeploymentPage() {
  const readyCount = TOPICS.reduce((n, t) => n + t.parts.filter((p) => p.ready).length, 0);

  return (
    <>
      <Head>
        <title>企业级部署 · CSSBB 备考 | AI Quality Portal</title>
        <meta name="description" content="CSSBB 第二章 企业级部署 考点与讲义" />
      </Head>

      <div className="min-h-screen bg-mckinsey-light">
        <div className="bg-mckinsey-navy text-white">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex items-center gap-2 text-sm text-mckinsey-muted mb-3">
              <Link href="/learn/cssbb" className="hover:text-mckinsey-teal transition">
                CSSBB 备考
              </Link>
              <span>/</span>
              <span className="text-white">企业级部署</span>
            </div>
            <h1 className="text-3xl font-semibold mb-1">II. 企业级部署</h1>
            <p className="text-mckinsey-muted mb-6">
              Enterprise-Wide Deployment · ASQ BoK I · Primer p14–120
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="考试权重" value="8.0%" sub="12 题" />
              <Stat label="篇幅" value="107 页" sub="投入产出 0.77" />
              <Stat label="考点" value={`${TOPICS.length} 个`} />
              <Stat label="讲义" value={`${readyCount} 份`} sub="其余建设中" />
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-white rounded-xl border border-mckinsey-border p-5 mb-6">
            <h2 className="font-semibold text-mckinsey-navy mb-1">本章性质</h2>
            <p className="text-sm text-mckinsey-muted leading-relaxed">
              本章以概念与记忆为主，几乎没有计算。学习重点是理清六西格玛的由来与组织含义、
              分清各质量大师的主张、记住角色职责的划分。
              第一份讲义「六西格玛的价值与基础」是全部内容的逻辑起点 ——
              1.5σ 偏移与 3.4 DPMO 的来源在这里讲清，后面「测量 · 统计」的过程能力会直接用到。
            </p>
          </div>

          <div className="space-y-4">
            {TOPICS.map((t) => (
              <div key={t.bokCode} className="bg-white rounded-xl border border-mckinsey-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-mckinsey-navy text-white">
                        {t.bokCode}
                      </span>
                      <span className="font-mono text-xs text-mckinsey-muted">
                        p{t.pages[0]}–{t.pages[1]} · {t.pages[1] - t.pages[0] + 1} 页
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-mckinsey-navy">{t.titleZh}</h3>
                    <p className="text-xs text-mckinsey-muted">{t.titleEn}</p>
                  </div>
                </div>

                {t.parts.length > 0 ? (
                  <div className="space-y-2">
                    {t.parts.map((p) =>
                      p.ready ? (
                        <Link
                          key={p.slug}
                          href={`/learn/cssbb/enterprise-deployment/${p.slug}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-mckinsey-teal/30 bg-mckinsey-teal/5 hover:bg-mckinsey-teal hover:text-white group transition"
                        >
                          <span className="text-sm font-medium text-mckinsey-navy group-hover:text-white">
                            {p.titleZh}
                          </span>
                          <span className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-xs text-mckinsey-muted group-hover:text-white/70">
                              p{p.pages[0]}–{p.pages[1]}
                            </span>
                            <span className="text-sm text-mckinsey-teal group-hover:text-white">
                              开始学习 →
                            </span>
                          </span>
                        </Link>
                      ) : (
                        <div
                          key={p.slug}
                          className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-mckinsey-border bg-mckinsey-light"
                        >
                          <span className="text-sm text-mckinsey-muted">{p.titleZh}</span>
                          <span className="flex items-center gap-3 shrink-0">
                            <span className="font-mono text-xs text-mckinsey-muted">
                              p{p.pages[0]}–{p.pages[1]}
                            </span>
                            <span className="text-xs text-mckinsey-muted">建设中</span>
                          </span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-3 rounded-lg border border-mckinsey-border bg-mckinsey-light">
                    <span className="text-xs text-mckinsey-muted">讲义建设中</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-mckinsey-muted leading-relaxed border-t border-mckinsey-border pt-6 mt-8">
            考点清单与页码为对照 ASQ CSSBB Body of Knowledge 与 CSSBB Primer (2014) 整理的索引，
            讲解内容为原创撰写。本站与 ASQ 及任何认证机构无隶属关系。
          </p>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="text-xs text-mckinsey-muted mb-1">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-mckinsey-muted mt-0.5">{sub}</div>}
    </div>
  );
}
