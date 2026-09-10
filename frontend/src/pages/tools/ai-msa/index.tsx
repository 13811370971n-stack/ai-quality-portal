import Head from 'next/head';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AiMsaPage() {
  return (
    <>
      <Head>
        <title>AI-MSA - AI Quality Portal</title>
      </Head>

      <div className="pt-16">
        <div className="bg-mckinsey-light border-b border-mckinsey-border px-6 lg:px-16 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
            <Link href="/tools" className="text-mckinsey-muted hover:text-mckinsey-navy transition-colors">
              AI工具集
            </Link>
            <span className="text-mckinsey-muted">/</span>
            <span className="text-mckinsey-navy font-medium">AI-MSA 测量系统分析</span>
          </div>
        </div>
      </div>

      <AuthGuard requiredRole="user">
        <div className="w-full" style={{ height: 'calc(100vh - 120px)' }}>
          <iframe
            src="/ai-msa/"
            className="w-full h-full border-0"
            title="AI-MSA Tool"
            allow="clipboard-write"
          />
        </div>
      </AuthGuard>
    </>
  );
}
