import dynamic from 'next/dynamic';
import Head from 'next/head';
import QTLayout from '@/components/quality-toolbox/QTLayout';

const Tool = dynamic(() => import('@/components/quality-toolbox/workshop/BoxPlotTool'), {
  ssr: false,
});

export default function BoxPlotToolPage() {
  return (
    <>
      <Head><title>BoxPlotTool - 质量工具箱</title></Head>
      <QTLayout>
        <Tool />
      </QTLayout>
    </>
  );
}
