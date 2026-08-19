import Head from 'next/head';
import dynamic from 'next/dynamic';
import QTLayout from '@/components/quality-toolbox/QTLayout';

const PageContent = dynamic(() => import('@/components/quality-toolbox/GraphPage'), {
  ssr: false,
});

export default function QTGraphPage() {
  return (
    <>
      <Head><title>Graph - 质量工具箱</title></Head>
      <QTLayout>
        <PageContent />
      </QTLayout>
    </>
  );
}
