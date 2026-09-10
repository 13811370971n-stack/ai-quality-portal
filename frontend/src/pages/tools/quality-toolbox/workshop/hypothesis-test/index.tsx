import dynamic from 'next/dynamic';
import Head from 'next/head';
import QTLayout from '@/components/quality-toolbox/QTLayout';

const Tool = dynamic(() => import('@/components/quality-toolbox/workshop/HypothesisTestTool'), {
  ssr: false,
});

export default function HypothesisTestToolPage() {
  return (
    <>
      <Head><title>HypothesisTestTool - 质量工具箱</title></Head>
      <QTLayout>
        <Tool />
      </QTLayout>
    </>
  );
}
