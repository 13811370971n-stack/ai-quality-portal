import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { sections, examMeta, insights } from '@/components/learn/data/cssbb-sections';

type SortKey = 'density' | 'weight' | 'order';

export default function CSSBBOverviewPage() {
  const [sortKey, setSortKey] = useState<SortKey>('density');

  const sorted = (() => {
    if (sortKey === 'weight') return [...sections].sort((a, b) => b.examPct - a.examPct);
    if (sortKey === 'order') return [...sections];
    return [...sections].sort((a, b) => b.density - a.density);
  })();

  const maxPct = Math.max(...sections.map((s) => s.examPct));

  return (
    <>
      <Head>
        <title>CSSBB 备考 · 考点地图 | AI Quality Portal</title>
        <meta name="description" content="ASQ CSSBB 十大知识域考试权重与投入产出分析" />
      </Head>

      <div className="min-h-screen bg-mckinsey-light">
        {/* ---------- Header ---------- */}
        <div className="bg-mckinsey-navy text-white">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <h1 className="text-3xl font-semibold mb-2">CSSBB 备考 · 考点地图</h1>
            <p className="text-mckinsey-muted mb-8">
              ASQ 注册六西格玛黑带 · 按投入产出而非书本顺序组织
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="计分题数" value={`${examMeta.totalQ} 题`} />
              <Stat label="考试时长" value={`${examMeta.durationHours} 小时`} />
              <Stat
                label="平均每题"
                value={`${examMeta.secondsPerQuestion} 秒`}
                sub="时间压力大"
              />
              <Stat label="考试形式" value="开卷" sub="查得快比记得住重要" />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* ---------- 反直觉洞察 ---------- */}
          <div className="bg-white rounded-xl border border-mckinsey-border p-6 mb-8">
            <h2 className="font-semibold text-mckinsey-navy mb-4">先看一个反直觉的事实</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border border-mckinsey-gold/40 bg-mckinsey-gold/5 p-4">
                <div className="text-2xl font-semibold text-mckinsey-navy">
                  {insights.softPct}%
                  <span className="text-sm font-normal text-mckinsey-muted ml-2">
                    {insights.softQ} 题
                  </span>
                </div>
                <div className="text-sm text-mckinsey-navy/70 mt-1">{insights.softLabel}</div>
              </div>
              <div className="rounded-lg border border-mckinsey-teal/30 bg-mckinsey-teal/5 p-4">
                <div className="text-2xl font-semibold text-mckinsey-navy">
                  {insights.statPct}%
                  <span className="text-sm font-normal text-mckinsey-muted ml-2">
                    {insights.statQ} 题
                  </span>
                </div>
                <div className="text-sm text-mckinsey-navy/70 mt-1">{insights.statLabel}</div>
              </div>
            </div>
            <p className="text-sm text-mckinsey-muted leading-relaxed">
              软性内容的题数比统计内容更多。多数工程师备考时一头扎进统计，
              却在部署、流程管理、团队管理上失分 —— 这三块加起来是 40 道题。
            </p>
          </div>

          {/* ---------- 排序控制 ---------- */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-sm text-mckinsey-muted">排序：</span>
            {([
              ['density', '投入产出比（推荐）'],
              ['weight', '考试权重'],
              ['order', 'Primer 顺序'],
            ] as [SortKey, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSortKey(id)}
                className={`px-3 py-1.5 text-xs rounded-full border transition ${
                  sortKey === id
                    ? 'bg-mckinsey-navy text-white border-mckinsey-navy'
                    : 'bg-white text-mckinsey-muted border-mckinsey-border hover:border-mckinsey-teal'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="text-xs text-mckinsey-muted mb-5">
            投入产出比 = 考试权重占比 ÷ 篇幅占比。大于 1 表示这一章每页的考试价值高于平均，值得精读；
            小于 1 表示篇幅大但考点少，可以略读。
          </p>

          {/* ---------- 章节列表 ---------- */}
          <div className="space-y-3">
            {sorted.map((s) => {
              const verdict =
                s.density >= 1.3 ? 'high' : s.density <= 0.7 ? 'low' : 'mid';
              const verdictStyle = {
                high: { label: '高效 · 优先精读', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                mid: { label: '常规', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
                low: { label: '低效 · 可以略读', cls: 'bg-red-50 text-red-700 border-red-200' },
              }[verdict];

              return (
                <div
                  key={s.code}
                  className="bg-white rounded-xl border border-mckinsey-border p-5 hover:shadow-md transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-mckinsey-navy text-white">
                          {s.code}
                        </span>
                        <span className="font-mono text-xs text-mckinsey-muted">
                          BoK {s.bokCode}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${verdictStyle.cls}`}
                        >
                          {verdictStyle.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-mckinsey-navy">{s.titleZh}</h3>
                      <p className="text-xs text-mckinsey-muted mb-3">{s.titleEn}</p>

                      {/* weight bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-mckinsey-light rounded-full overflow-hidden max-w-xs">
                          <div
                            className="h-full bg-mckinsey-teal rounded-full"
                            style={{ width: `${(s.examPct / maxPct) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-mckinsey-navy">
                          {s.examPct}%
                        </span>
                        <span className="text-xs text-mckinsey-muted">{s.examQ} 题</span>
                      </div>
                    </div>

                    <div className="flex gap-6 text-center shrink-0">
                      <div>
                        <div className="text-xs text-mckinsey-muted mb-0.5">篇幅</div>
                        <div className="text-sm font-medium text-mckinsey-navy">{s.pages} 页</div>
                        <div className="text-xs text-mckinsey-muted font-mono">
                          p{s.primerPages[0]}–{s.primerPages[1]}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-mckinsey-muted mb-0.5">投入产出</div>
                        <div
                          className={`text-lg font-semibold ${
                            verdict === 'high'
                              ? 'text-emerald-600'
                              : verdict === 'low'
                              ? 'text-red-600'
                              : 'text-mckinsey-navy'
                          }`}
                        >
                          {s.density.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {s.implemented && s.implemented.length > 0 ? (
                    <div className="mt-4 pt-4 border-t border-mckinsey-border flex flex-wrap gap-2">
                      {s.implemented.map((c) => (
                        <Link
                          key={c.slug}
                          href={`/learn/cssbb/${c.slug}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-mckinsey-teal/10 border border-mckinsey-teal/30 text-sm text-mckinsey-teal hover:bg-mckinsey-teal hover:text-white transition"
                        >
                          {c.titleZh}
                          <span className="font-mono text-xs opacity-70">{c.bokRange}</span>
                          <span>→</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 pt-4 border-t border-mckinsey-border">
                      <span className="text-xs text-mckinsey-muted">内容建设中</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ---------- 建议学习梯队 ---------- */}
          <div className="mt-8 bg-mckinsey-navy text-white rounded-xl p-6">
            <h2 className="font-semibold mb-4">建议学习梯队</h2>
            <div className="space-y-3 text-sm">
              <Tier
                n={1}
                title="IX. 改进"
                note="权重 14% · 投入产出 1.37 —— 权重高且篇幅经济，最该先投入"
              />
              <Tier
                n={2}
                title="XI. DFSS · III. 流程管理"
                note="投入产出 1.57 / 1.39 —— 篇幅短，先拿下这两块建立信心"
              />
              <Tier
                n={3}
                title="VIII. 分析 · V. 定义 · X. 控制"
                note="合计 38% —— 权重最大的主体部分，常规投入"
              />
              <Tier
                n={4}
                title="IV. 团队管理 · II. 企业级部署"
                note="合计 20% —— 题多但分散，靠速查表应对"
              />
              <Tier
                n={5}
                title="VI. 测量·数据"
                note="投入产出 0.52 —— 144 页只考 11 题，通读即可，不必深钻"
                dim
              />
            </div>
          </div>

          <p className="text-xs text-mckinsey-muted leading-relaxed border-t border-mckinsey-border pt-6 mt-8">
            考试权重与题数来自 {examMeta.source} 载明的考试构成；篇幅与投入产出比由本站依据页码范围计算。
            考点清单为对照 ASQ CSSBB Body of Knowledge 整理的索引，讲解与练习题均为原创撰写。
            本站与 ASQ 及任何认证机构无隶属关系。考试形式与允许携带的参考资料请以最新 ASQ 报名简章为准。
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

function Tier({ n, title, note, dim }: { n: number; title: string; note: string; dim?: boolean }) {
  return (
    <div className={`flex gap-4 ${dim ? 'opacity-60' : ''}`}>
      <div className="w-7 h-7 shrink-0 rounded-full bg-mckinsey-teal/20 border border-mckinsey-teal/40 flex items-center justify-center text-xs font-semibold text-mckinsey-teal">
        {n}
      </div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-mckinsey-muted text-xs mt-0.5">{note}</div>
      </div>
    </div>
  );
}
