import Head from 'next/head';
import dynamic from 'next/dynamic';
import QTLayout from '@/components/quality-toolbox/QTLayout';

const PageContent = dynamic(() => import('@/components/quality-toolbox/RecommendPage'), {
  ssr: false,
});

export default function QTRecommendPage() {
  return (
    <>
      <Head><title>Recommend - 质量工具箱</title></Head>
      <QTLayout>
        <PageContent />
      </QTLayout>
    </>
  );
}
