import dynamic from 'next/dynamic';
import Head from 'next/head';

const PfmeaWizard = dynamic(() => import('@/components/quality-toolbox/workshop/PfmeaWizard'), { ssr: false });

export default function AiPfmeaPage() {
  return (
    <>
      <Head><title>AI-PFMEA - AI Quality Portal</title></Head>
      <div className="pt-16">
        <PfmeaWizard />
      </div>
    </>
  );
}
