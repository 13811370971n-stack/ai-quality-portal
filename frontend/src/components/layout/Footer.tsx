export default function Footer() {
  return (
    <footer className="bg-mckinsey-navy text-white/70 py-12 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-mckinsey-gold rounded-lg flex items-center justify-center">
                <span className="text-mckinsey-navy font-bold text-sm">AI</span>
              </div>
              <span className="font-display font-semibold text-white text-lg">
                Quality Portal
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              AI赋能质量管理平台<br />
              将人工智能与六西格玛方法论深度融合，<br />
              驱动质量管理的数字化转型。
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-medium mb-4">快速链接</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/tools" className="hover:text-white transition-colors">AI工具集</a></li>
              <li><a href="/coach" className="hover:text-white transition-colors">AI教练</a></li>
              <li><a href="/methodology" className="hover:text-white transition-colors">DMAIC方法论</a></li>
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <h4 className="text-white font-medium mb-4">技术架构</h4>
            <ul className="space-y-2 text-sm">
              <li>Frontend: React + Next.js</li>
              <li>Backend: Python FastAPI</li>
              <li>AI Engine: LLM Integration</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm">
          <p>© 2026 AI Quality Portal. Built with intelligence.</p>
        </div>
      </div>
    </footer>
  );
}
