import Head from 'next/head';
import dynamic from 'next/dynamic';
import QTLayout from '@/components/quality-toolbox/QTLayout';

const PageContent = dynamic(() => import('@/components/quality-toolbox/LearnPage'), {
  ssr: false,
});

export default function QTLearnPage() {
  return (
    <>
      <Head><title>Learn - 质量工具箱</title></Head>
      <QTLayout>
        <PageContent />
      </QTLayout>
    </>
  );
}
