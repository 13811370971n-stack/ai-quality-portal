import Link from 'next/link';
import { useRouter } from 'next/router';

const navItems = [
  { path: '/tools/quality-toolbox', label: '首页', exact: true },
  { path: '/tools/quality-toolbox/graph', label: '知识图谱' },
  { path: '/tools/quality-toolbox#tools', label: '工具库' },
  { path: '/tools/quality-toolbox/workshop', label: '交互工坊' },
  { path: '/tools/quality-toolbox/learn', label: '学习路径' },
  { path: '/tools/quality-toolbox/recommend', label: '智能推荐' },
];

export default function QTLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="pt-16">
        <div className="bg-mckinsey-light border-b border-mckinsey-border px-6 lg:px-16 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/tools" className="text-mckinsey-muted hover:text-mckinsey-navy transition-colors">
                AI工具集
              </Link>
              <span className="text-mckinsey-muted">/</span>
              <span className="text-mckinsey-navy font-medium">质量工具箱</span>
            </div>
            {/* Sub-navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = item.exact 
                  ? router.pathname === item.path
                  : router.asPath.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-mckinsey-teal/10 text-mckinsey-teal'
                        : 'text-mckinsey-muted hover:text-mckinsey-navy hover:bg-mckinsey-light'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
      {/* Content */}
      {children}
    </div>
  );
}
