'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/tools', label: 'AI工具集' },
  { href: '/coach', label: 'AI教练' },
  { href: '/methodology', label: '方法论' },
  { href: '/about', label: '关于' },
];

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/80 backdrop-blur-xl border-b border-mckinsey-border/50 shadow-sm'
        : 'bg-transparent'
    }`}>
      <nav className="max-w-7xl mx-auto px-6 lg:px-16 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-mckinsey-teal to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-mckinsey-teal/20">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className={`font-display font-semibold text-lg transition-colors ${
            scrolled ? 'text-mckinsey-navy' : 'text-white'
          }`}>
            Quality Portal
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  router.pathname === item.href
                    ? scrolled ? 'text-mckinsey-navy border-b-2 border-mckinsey-gold pb-1' : 'text-white border-b-2 border-mckinsey-gold pb-1'
                    : scrolled ? 'text-mckinsey-muted hover:text-mckinsey-navy' : 'text-white/70 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg className={`w-6 h-6 ${scrolled ? 'text-mckinsey-navy' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-xl border-b border-mckinsey-border px-6 py-4">
          <ul className="space-y-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={
                    router.pathname === item.href
                      ? 'nav-link-active block'
                      : 'nav-link block'
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
