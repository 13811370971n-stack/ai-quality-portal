import Head from 'next/head';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AiSpcPage() {
  return (
    <>
      <Head>
        <title>AI-SPC - AI Quality Portal</title>
      </Head>

      {/* Breadcrumb header */}
      <div className="pt-16">
        <div className="bg-mckinsey-light border-b border-mckinsey-border px-6 lg:px-16 py-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
            <Link href="/tools" className="text-mckinsey-muted hover:text-mckinsey-navy transition-colors">
              AI工具集
            </Link>
            <span className="text-mckinsey-muted">/</span>
            <span className="text-mckinsey-navy font-medium">AI-SPC 统计过程控制</span>
          </div>
        </div>
      </div>

      {/* Protected content */}
      <AuthGuard requiredRole="user">
        <div className="w-full" style={{ height: 'calc(100vh - 120px)' }}>
          <iframe
            src="/tools/ai-spc/app/"
            className="w-full h-full border-0"
            title="AI-SPC Tool"
            allow="clipboard-write"
          />
        </div>
      </AuthGuard>
    </>
  );
}
