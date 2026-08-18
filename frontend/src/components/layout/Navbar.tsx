'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/cases', label: '工作台' },
  { href: '/tools', label: 'AI工具集' },
  { href: '/coach', label: 'AI教练' },
  { href: '/methodology', label: '方法论' },
  { href: '/about', label: '关于' },
];

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, isAdmin, logout, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const allNavItems = isAdmin
    ? [...navItems, { href: '/admin', label: '管理' }]
    : navItems;

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
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-8">
            {allNavItems.map((item) => (
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

          {/* Auth buttons */}
          {!loading && (
            <div className="flex items-center gap-3 ml-4">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/profile"
                    className={`text-sm font-medium transition-colors ${
                      scrolled ? 'text-mckinsey-navy' : 'text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-mckinsey-teal/20 flex items-center justify-center text-xs font-bold text-mckinsey-teal">
                        {(user?.nickname || user?.email || '?')[0].toUpperCase()}
                      </span>
                      <span className="hidden lg:inline">{user?.nickname || user?.email}</span>
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                      scrolled
                        ? 'text-mckinsey-muted hover:text-red-600 hover:bg-red-50'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    退出
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                      scrolled
                        ? 'text-mckinsey-navy hover:bg-mckinsey-light'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-medium px-4 py-2 rounded-lg bg-mckinsey-teal text-white hover:bg-mckinsey-teal/90 transition-colors"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

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
            {allNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="nav-link block"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {!loading && (
            <div className="mt-4 pt-4 border-t border-mckinsey-border">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-mckinsey-navy">{user?.nickname}</span>
                  <button onClick={logout} className="text-sm text-red-600">退出</button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link href="/login" className="text-sm text-mckinsey-navy" onClick={() => setMobileOpen(false)}>登录</Link>
                  <Link href="/register" className="text-sm text-mckinsey-teal font-medium" onClick={() => setMobileOpen(false)}>注册</Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
