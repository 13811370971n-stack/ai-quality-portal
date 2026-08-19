import Head from 'next/head';
import dynamic from 'next/dynamic';
import QTLayout from '@/components/quality-toolbox/QTLayout';

const Tool = dynamic(() => import('@/components/quality-toolbox/workshop/ParetoTool'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-mckinsey-light h-96 rounded-2xl m-8" />,
});

export default function ParetoToolPage() {
  return (
    <>
      <Head><title>ParetoTool - 质量工具箱</title></Head>
      <QTLayout>
        <Tool />
      </QTLayout>
    </>
  );
}
