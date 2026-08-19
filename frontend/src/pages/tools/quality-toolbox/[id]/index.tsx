import dynamic from 'next/dynamic';
import Head from 'next/head';
import QTLayout from '@/components/quality-toolbox/QTLayout';

const ToolDetail = dynamic(() => import('@/components/quality-toolbox/ToolDetailPage'), { ssr: false });

export default function ToolDetailPageWrapper() {
  return (
    <>
      <Head><title>工具详情 - 质量工具箱</title></Head>
      <QTLayout>
        <ToolDetail />
      </QTLayout>
    </>
  );
}
