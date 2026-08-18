import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  
  // Hide footer on full-screen pages (case detail, ai-spc)
  const hideFooter = router.pathname.startsWith('/cases/[') || router.pathname.includes('/ai-spc');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
