import dynamic from 'next/dynamic';
import Head from 'next/head';
import QTLayout from '@/components/quality-toolbox/QTLayout';

const Tool = dynamic(() => import('@/components/quality-toolbox/workshop/NormalPlotTool'), {
  ssr: false,
});

export default function NormalPlotToolPage() {
  return (
    <>
      <Head><title>NormalPlotTool - 质量工具箱</title></Head>
      <QTLayout>
        <Tool />
      </QTLayout>
    </>
  );
}
