import dynamic from 'next/dynamic';
import Head from 'next/head';

const DfmeaWizard = dynamic(() => import('@/components/quality-toolbox/workshop/DfmeaWizard'), { ssr: false });

export default function AiDfmeaPage() {
  return (
    <>
      <Head><title>AI-DFMEA - AI Quality Portal</title></Head>
      <div className="pt-16">
        <DfmeaWizard />
      </div>
    </>
  );
}
