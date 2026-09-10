import dynamic from 'next/dynamic';
import Head from 'next/head';
import QTLayout from '@/components/quality-toolbox/QTLayout';

const Tool = dynamic(() => import('@/components/quality-toolbox/workshop/RegressionTool'), {
  ssr: false,
});

export default function RegressionToolPage() {
  return (
    <>
      <Head><title>RegressionTool - 质量工具箱</title></Head>
      <QTLayout>
        <Tool />
      </QTLayout>
    </>
  );
}
