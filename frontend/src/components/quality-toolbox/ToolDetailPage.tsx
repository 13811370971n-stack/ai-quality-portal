import Link from 'next/link';
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { useToolById, useDmaicPhases } from '@/components/quality-toolbox/hooks/useTools'
import { tools } from '@/components/quality-toolbox/data/tools'

export default function ToolDetailPage() {
  const router = useRouter();
  const id = router.query.id as string
  const tool = useToolById(id || '')
  const phases = useDmaicPhases()

  if (!tool) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">工具未找到</h1>
        <Link href="/tools/quality-toolbox" className="text-mckinsey-teal hover:underline">
          ← 返回工具库
        </Link>
      </div>
    )
  }

  const relatedToolObjects = tool.relatedTools
    .map((rid) => tools.find((t) => t.id === rid))
    .filter(Boolean)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-mckinsey-muted mb-6">
        <Link href="/tools/quality-toolbox" className="hover:text-mckinsey-teal">工具库</Link>
        <span>/</span>
        <span className="text-mckinsey-navy">{tool.nameZh}</span>
      </nav>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{tool.nameZh}</h1>
          <p className="text-mckinsey-muted font-mono text-sm mb-4">
            {tool.name}
          </p>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {tool.dmaic.map((phase) => {
              const phaseInfo = phases.find((p) => p.id === phase)
              return (
                <span
                  key={phase}
                  className="text-xs px-2.5 py-1 rounded font-medium"
                  style={{
                    backgroundColor: (phaseInfo?.color || '#666') + '20',
                    color: phaseInfo?.color || '#666',
                  }}
                >
                  {phase} · {phaseInfo?.nameZh}
                </span>
              )
            })}
            <span className="text-xs px-2.5 py-1 rounded bg-mckinsey-light text-mckinsey-navy">
              {tool.categoryZh}
            </span>
          </div>
          {tool.hasInteractive && (
            <Link
              href={`/tools/quality-toolbox/workshop/${tool.interactivePath?.split("/").pop()}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-mckinsey-teal hover:bg-mckinsey-teal text-white font-medium transition-colors shadow-lg shadow-mckinsey-teal/25"
            >
              ⚒️ 打开交互式工具
            </Link>
          )}
        </div>

        {/* Description */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">📖 简介</h2>
          <p className="text-mckinsey-navy leading-relaxed">
            {tool.descriptionZh}
          </p>
        </section>

        {/* When to Use */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">🎯 何时使用</h2>
          <ul className="space-y-2">
            {tool.whenToUse.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-mckinsey-navy">
                <span className="text-mckinsey-teal mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Procedure */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">📋 操作步骤</h2>
          <ol className="space-y-3">
            {tool.procedure.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-mckinsey-navy">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mckinsey-teal/10 text-mckinsey-teal flex items-center justify-center text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Example */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">💡 示例</h2>
          <div className="p-4 rounded-lg bg-mckinsey-light border border-mckinsey-border">
            <p className="text-mckinsey-navy">{tool.example}</p>
          </div>
        </section>

        {/* Related Tools */}
        {relatedToolObjects.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">🔗 相关工具</h2>
            <div className="flex flex-wrap gap-2">
              {relatedToolObjects.map((rt) => (
                <Link
                  key={rt!.id}
                  href={`/tools/quality-toolbox/${rt!.id}`}
                  className="px-3 py-1.5 rounded-lg border border-mckinsey-border hover:border-mckinsey-teal/30 text-sm transition-colors"
                >
                  {rt!.nameZh}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        <section>
          <h2 className="text-xl font-semibold mb-3">🏷️ 标签</h2>
          <div className="flex flex-wrap gap-2">
            {tool.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-mckinsey-light text-xs text-mckinsey-navy"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      </motion.div>
    </div>
  )
}
