import Head from 'next/head';
import Link from 'next/link';
import SlidePlayer from '@/components/learn/SlidePlayer';
import { slides, checkpoints, deckMeta } from '@/components/learn/data/deck-six-sigma-value';

export default function SixSigmaValueDeck() {
  return (
    <>
      <Head>
        <title>{deckMeta.titleZh} · CSSBB 备考 | AI Quality Portal</title>
        <meta
          name="description"
          content={`CSSBB ${deckMeta.bokCode} ${deckMeta.titleZh} 讲义：1.5σ 偏移与 3.4 DPMO 的来源`}
        />
      </Head>

      <div className="min-h-screen bg-mckinsey-light">
        <div className="bg-mckinsey-navy text-white">
          <div className="max-w-5xl mx-auto px-6 py-7">
            <div className="flex flex-wrap items-center gap-2 text-sm text-mckinsey-muted mb-3">
              <Link href="/learn/cssbb" className="hover:text-mckinsey-teal transition">
                CSSBB 备考
              </Link>
              <span>/</span>
              <Link
                href="/learn/cssbb/enterprise-deployment"
                className="hover:text-mckinsey-teal transition"
              >
                {deckMeta.sectionTitleZh}
              </Link>
              <span>/</span>
              <span className="text-white">{deckMeta.titleZh}</span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold mb-1">{deckMeta.titleZh}</h1>
                <p className="text-sm text-mckinsey-muted">{deckMeta.titleEn}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Tag>{deckMeta.bokCode}</Tag>
                <Tag>
                  Primer p{deckMeta.primerPages[0]}–{deckMeta.primerPages[1]}
                </Tag>
                <Tag>{slides.length} 页讲义</Tag>
                <Tag>约 {deckMeta.estMinutes} 分钟</Tag>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="mb-6 flex gap-3 rounded-lg border border-mckinsey-gold/40 bg-mckinsey-gold/10 p-4">
            <span className="text-mckinsey-gold shrink-0">※</span>
            <p className="text-sm text-mckinsey-navy/80 leading-relaxed">{deckMeta.note}</p>
          </div>

          <SlidePlayer slides={slides} checkpoints={checkpoints} title={deckMeta.titleZh} />

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/learn/cssbb/enterprise-deployment"
              className="px-4 py-2.5 rounded-lg border border-mckinsey-border bg-white text-sm text-mckinsey-navy hover:border-mckinsey-teal transition"
            >
              ← 返回本章考点
            </Link>
            <Link
              href="/learn/cssbb/capability"
              className="px-4 py-2.5 rounded-lg border border-mckinsey-teal/40 bg-mckinsey-teal/5 text-sm text-mckinsey-teal hover:bg-mckinsey-teal hover:text-white transition"
            >
              本讲第 4、5 条的应用：过程能力 →
            </Link>
          </div>

          <p className="text-xs text-mckinsey-muted leading-relaxed border-t border-mckinsey-border pt-6 mt-8">
            讲解文字为原创撰写；知识点范围与页码对照 CSSBB Primer (2014) 与 ASQ CSSBB Body of Knowledge。
            图示按真实比例由正态密度函数生成，表中数值经 scipy 实算核对。
            本站与 ASQ 及任何认证机构无隶属关系。
          </p>
        </div>
      </div>
    </>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs px-2 py-1 rounded border border-white/20 bg-white/5 text-mckinsey-light font-mono whitespace-nowrap">
      {children}
    </span>
  );
}
