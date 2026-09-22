import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import {
  sliceMeta,
  topics,
  quickRefs,
  questions,
  studyOrder,
  type CognitiveLevel,
  type Priority,
} from '@/components/learn/data/cssbb-capability';

type Tab = 'tree' | 'quickref' | 'practice';
type RefKind = 'all' | 'formula' | 'criterion' | 'contrast' | 'decision';

const COGNITIVE_LABEL: Record<CognitiveLevel, string> = {
  remember: '记忆',
  understand: '理解',
  apply: '应用',
  analyze: '分析',
};

const PRIORITY_STYLE: Record<Priority, { label: string; cls: string }> = {
  must: { label: '必考精读', cls: 'bg-red-50 text-red-700 border-red-200' },
  should: { label: '需要掌握', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  skim: { label: '可以略读', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const KIND_LABEL: Record<string, string> = {
  formula: '公式',
  criterion: '判定准则',
  contrast: '易混辨析',
  decision: '决策树',
};

const KIND_CLS: Record<string, string> = {
  formula: 'bg-mckinsey-teal/10 text-mckinsey-teal border-mckinsey-teal/30',
  criterion: 'bg-mckinsey-gold/10 text-yellow-700 border-mckinsey-gold/40',
  contrast: 'bg-red-50 text-red-700 border-red-200',
  decision: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function CSSBBCapabilityPage() {
  const [tab, setTab] = useState<Tab>('tree');
  const [refKind, setRefKind] = useState<RefKind>('all');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [treeOrder, setTreeOrder] = useState<'study' | 'primer' | 'bok'>('study');

  const shownRefs = refKind === 'all' ? quickRefs : quickRefs.filter((r) => r.kind === refKind);

  const orderedTopics = (() => {
    if (treeOrder === 'primer') {
      return [...topics].sort((a, b) => a.primerPages[0] - b.primerPages[0]);
    }
    if (treeOrder === 'bok') {
      return [...topics].sort((a, b) => a.bokCode.localeCompare(b.bokCode, undefined, { numeric: true }));
    }
    const rank = new Map(studyOrder.map((s) => [s.bokCode, s.step]));
    return [...topics].sort((a, b) => (rank.get(a.bokCode) ?? 99) - (rank.get(b.bokCode) ?? 99));
  })();

  const answeredCount = Object.keys(revealed).length;
  const correctCount = questions.filter(
    (q) => revealed[q.id] && answers[q.id] === q.answer
  ).length;

  return (
    <>
      <Head>
        <title>过程能力 · CSSBB 备考 | AI Quality Portal</title>
        <meta
          name="description"
          content="ASQ CSSBB 过程能力考点（V.F.1–V.F.7）：知识树、开卷速查、计算练习"
        />
      </Head>

      <div className="min-h-screen bg-mckinsey-light">
        {/* ---------- Header ---------- */}
        <div className="bg-mckinsey-navy text-white">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-center gap-2 text-sm text-mckinsey-muted mb-3">
              <Link href="/learn/cssbb" className="hover:text-mckinsey-teal transition">
                CSSBB 备考
              </Link>
              <span>/</span>
              <span>{sliceMeta.section}</span>
              <span>/</span>
              <span className="text-white">过程能力</span>
            </div>

            <h1 className="text-3xl font-semibold mb-2">过程能力 Process Capability</h1>
            <p className="text-mckinsey-muted mb-6">
              ASQ BoK {sliceMeta.sectionBokCode} · 条目 V.F.1 – V.F.7
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="预估题数" value={`≈ ${sliceMeta.estExamQ} 题`} sub={`占全卷 ${((sliceMeta.estExamQ / 150) * 100).toFixed(1)}%`} />
              <Stat label="Primer 页码" value={`p${sliceMeta.primerPages[0]}–${sliceMeta.primerPages[1]}`} sub={`${sliceMeta.pages} 页`} />
              <Stat label="考点数" value={`${topics.length} 个`} sub={`${topics.filter((t) => t.priority === 'must').length} 个必考`} />
              <Stat label="考试形式" value="开卷" sub="平均 96 秒 / 题" />
            </div>

            <div className="mt-6 flex gap-3 rounded-lg border border-mckinsey-gold/30 bg-mckinsey-gold/10 p-4">
              <span className="text-mckinsey-gold text-lg leading-none">※</span>
              <p className="text-sm text-mckinsey-light/90">
                {sliceMeta.note}
                <span className="block mt-1 text-mckinsey-muted text-xs">
                  开卷政策依据 2014 版 Primer 表述，请按最新 ASQ 报名简章核实允许携带的参考资料。
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ---------- Tabs ---------- */}
        <div className="sticky top-0 z-10 bg-white border-b border-mckinsey-border shadow-sm">
          <div className="max-w-6xl mx-auto px-6 flex gap-1">
            {([
              ['tree', `知识树 · ${topics.length}`],
              ['quickref', `开卷速查 · ${quickRefs.length}`],
              ['practice', `计算练习 · ${questions.length}`],
            ] as [Tab, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-5 py-4 text-sm font-medium border-b-2 transition ${
                  tab === id
                    ? 'border-mckinsey-teal text-mckinsey-navy'
                    : 'border-transparent text-mckinsey-muted hover:text-mckinsey-navy'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* ================= 知识树 ================= */}
          {tab === 'tree' && (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="text-sm text-mckinsey-muted">排序：</span>
                {([
                  ['study', '学习顺序（推荐）'],
                  ['bok', 'ASQ BoK 编号'],
                  ['primer', 'Primer 页码'],
                ] as ['study' | 'bok' | 'primer', string][]).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setTreeOrder(id)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition ${
                      treeOrder === id
                        ? 'bg-mckinsey-navy text-white border-mckinsey-navy'
                        : 'bg-white text-mckinsey-muted border-mckinsey-border hover:border-mckinsey-teal'
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {treeOrder === 'study' && (
                  <span className="text-xs text-mckinsey-muted">
                    Primer 呈现顺序与 BoK 编号不一致，推荐按依赖关系学习
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {orderedTopics.map((t) => {
                  const order = studyOrder.find((s) => s.bokCode === t.bokCode);
                  return (
                    <div
                      key={t.bokCode}
                      className="bg-white rounded-xl border border-mckinsey-border p-6 hover:shadow-md transition"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-[240px]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-mckinsey-navy text-white">
                              {t.bokCode}
                            </span>
                            {treeOrder === 'study' && order && (
                              <span className="text-xs text-mckinsey-teal font-medium">
                                第 {order.step} 步
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-mckinsey-navy">{t.titleZh}</h3>
                          <p className="text-xs text-mckinsey-muted">{t.titleEn}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge className={PRIORITY_STYLE[t.priority].cls}>
                            {PRIORITY_STYLE[t.priority].label}
                          </Badge>
                          <Badge className="bg-slate-50 text-slate-600 border-slate-200">
                            {COGNITIVE_LABEL[t.cognitiveLevel]}
                          </Badge>
                          <Badge className="bg-white text-mckinsey-muted border-mckinsey-border font-mono">
                            p{t.primerPages[0]}–{t.primerPages[1]} · {t.pages}页
                          </Badge>
                          <Badge className="bg-mckinsey-teal/10 text-mckinsey-teal border-mckinsey-teal/30">
                            ≈{t.estExamQ} 题
                          </Badge>
                        </div>
                      </div>

                      {order && (
                        <p className="text-xs text-mckinsey-muted mb-3 italic">
                          为什么排这个顺序：{order.reason}
                        </p>
                      )}

                      <p className="text-sm text-mckinsey-navy/80 leading-relaxed mb-4">{t.summary}</p>

                      <ul className="space-y-1.5 mb-4">
                        {t.keyPoints.map((k, i) => (
                          <li key={i} className="flex gap-2 text-sm text-mckinsey-navy/70">
                            <span className="text-mckinsey-teal mt-0.5">▪</span>
                            <span>{k}</span>
                          </li>
                        ))}
                      </ul>

                      {t.toolPath ? (
                        <Link
                          href={t.toolPath}
                          className="inline-flex items-center gap-1.5 text-sm text-mckinsey-teal hover:text-mckinsey-navy font-medium transition"
                        >
                          去工具实操 →
                        </Link>
                      ) : (
                        <span className="text-xs text-mckinsey-muted">（本考点以概念理解为主，无需工具实操）</span>
                      )}

                      {t.cognitiveLevel === 'apply' && t.toolPath && (
                        <p className="mt-2 text-xs text-mckinsey-muted">
                          认知层级为「应用」，需在工具中实际操作过才计入掌握度
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ================= 速查 ================= */}
          {tab === 'quickref' && (
            <>
              <div className="bg-white rounded-xl border border-mckinsey-border p-5 mb-6">
                <h2 className="font-semibold text-mckinsey-navy mb-1">为什么需要速查表</h2>
                <p className="text-sm text-mckinsey-muted">
                  开卷考试下，记住公式的价值低于「快速定位」。每张卡片都标注 Primer 页码，
                  考场上可直接翻页核对。「易混辨析」类卡片针对的是最容易失分的概念混淆。
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {([
                  ['all', `全部 ${quickRefs.length}`],
                  ['formula', `公式 ${quickRefs.filter((r) => r.kind === 'formula').length}`],
                  ['criterion', `判定准则 ${quickRefs.filter((r) => r.kind === 'criterion').length}`],
                  ['contrast', `易混辨析 ${quickRefs.filter((r) => r.kind === 'contrast').length}`],
                  ['decision', `决策树 ${quickRefs.filter((r) => r.kind === 'decision').length}`],
                ] as [RefKind, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setRefKind(id)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition ${
                      refKind === id
                        ? 'bg-mckinsey-navy text-white border-mckinsey-navy'
                        : 'bg-white text-mckinsey-muted border-mckinsey-border hover:border-mckinsey-teal'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {shownRefs.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl border border-mckinsey-border p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-mckinsey-navy">{r.keyword}</h3>
                      <div className="flex gap-2 shrink-0">
                        <Badge className={KIND_CLS[r.kind]}>{KIND_LABEL[r.kind]}</Badge>
                        <Badge className="bg-white text-mckinsey-muted border-mckinsey-border font-mono">
                          p{r.primerPage}
                        </Badge>
                      </div>
                    </div>

                    <pre className="font-mono text-xs leading-relaxed bg-mckinsey-light rounded-lg p-4 overflow-x-auto text-mckinsey-navy whitespace-pre-wrap">
                      {r.lines.join('\n')}
                    </pre>

                    {r.why && (
                      <p className="mt-3 text-xs text-mckinsey-navy/70 border-l-2 border-mckinsey-gold pl-3">
                        {r.why}
                      </p>
                    )}

                    <div className="mt-3 text-xs text-mckinsey-muted font-mono">{r.bokCode}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ================= 练习 ================= */}
          {tab === 'practice' && (
            <>
              <div className="bg-white rounded-xl border border-mckinsey-border p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-mckinsey-navy mb-1">原创计算练习</h2>
                  <p className="text-sm text-mckinsey-muted">
                    题干取材制造业真实场景，所有答案与解析已用 Python 逐题验算。
                    每题标注了常见陷阱 —— 这些是实际最容易失分的地方。
                  </p>
                </div>
                {answeredCount > 0 && (
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-semibold text-mckinsey-navy">
                      {correctCount}/{answeredCount}
                    </div>
                    <div className="text-xs text-mckinsey-muted">已答正确率</div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {questions.map((q, idx) => {
                  const picked = answers[q.id];
                  const shown = revealed[q.id];
                  const ok = picked === q.answer;

                  return (
                    <div key={q.id} className="bg-white rounded-xl border border-mckinsey-border p-6">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-mckinsey-navy">第 {idx + 1} 题</span>
                        <Badge className="bg-mckinsey-navy text-white border-mckinsey-navy font-mono">
                          {q.bokCode}
                        </Badge>
                        <Badge className="bg-mckinsey-light text-mckinsey-muted border-mckinsey-border">
                          {q.scenario}
                        </Badge>
                        {q.calcVerified && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            已验算
                          </Badge>
                        )}
                      </div>

                      <p className="text-mckinsey-navy leading-relaxed mb-4">{q.stem}</p>

                      <div className="space-y-2 mb-4">
                        {q.options.map((o) => {
                          let cls = 'border-mckinsey-border hover:border-mckinsey-teal bg-white';
                          if (shown) {
                            if (o.key === q.answer) cls = 'border-emerald-400 bg-emerald-50';
                            else if (o.key === picked) cls = 'border-red-300 bg-red-50';
                            else cls = 'border-mckinsey-border bg-white opacity-60';
                          } else if (picked === o.key) {
                            cls = 'border-mckinsey-teal bg-mckinsey-teal/5';
                          }
                          return (
                            <button
                              key={o.key}
                              disabled={shown}
                              onClick={() => setAnswers({ ...answers, [q.id]: o.key })}
                              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${cls}`}
                            >
                              <span className="font-semibold text-mckinsey-navy mr-2">{o.key}.</span>
                              <span className="text-mckinsey-navy/80">{o.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      {!shown ? (
                        <button
                          disabled={!picked}
                          onClick={() => setRevealed({ ...revealed, [q.id]: true })}
                          className="px-5 py-2.5 rounded-lg bg-mckinsey-navy text-white text-sm font-medium disabled:opacity-40 hover:bg-mckinsey-blue transition"
                        >
                          提交查看解析
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div
                            className={`rounded-lg p-4 ${
                              ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
                            }`}
                          >
                            <p className={`text-sm font-semibold ${ok ? 'text-emerald-800' : 'text-red-800'}`}>
                              {ok ? '正确' : `不正确 — 正确答案是 ${q.answer}`}
                            </p>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-mckinsey-navy mb-2">计算过程</h4>
                            <pre className="font-mono text-xs leading-relaxed bg-mckinsey-light rounded-lg p-4 overflow-x-auto text-mckinsey-navy whitespace-pre-wrap">
                              {q.workings.join('\n')}
                            </pre>
                          </div>

                          <div className="border-l-2 border-mckinsey-gold pl-4">
                            <h4 className="text-sm font-semibold text-mckinsey-navy mb-1">陷阱在哪</h4>
                            <p className="text-sm text-mckinsey-navy/75 leading-relaxed">{q.trap}</p>
                          </div>

                          {q.toolPath && (
                            <Link
                              href={q.toolPath}
                              className="inline-flex items-center gap-1.5 text-sm text-mckinsey-teal hover:text-mckinsey-navy font-medium transition"
                            >
                              用工具把这道题算一遍 →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {answeredCount === questions.length && (
                <div className="mt-6 bg-mckinsey-navy text-white rounded-xl p-6">
                  <h3 className="font-semibold mb-2">本节练习完成</h3>
                  <p className="text-sm text-mckinsey-muted">
                    正确 {correctCount} / {questions.length}。
                    认知层级为「应用」的考点，建议再到工具中实际操作一遍 ——
                    开卷考试的区分点在算得快、算得对，不在记得住。
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ---------- Footer note ---------- */}
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <p className="text-xs text-mckinsey-muted leading-relaxed border-t border-mckinsey-border pt-6">
            考点清单、层级与页码为对照 ASQ CSSBB Body of Knowledge 与 CSSBB Primer (2014) 整理的索引。
            讲解、速查卡与练习题均为原创撰写，非教材原文。本站与 ASQ 及任何认证机构无隶属关系，
            所提供的评估报告不构成任何官方认证。
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

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}
