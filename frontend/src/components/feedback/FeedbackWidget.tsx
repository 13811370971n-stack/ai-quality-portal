import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

const CATEGORIES = [
  { id: 'bug', label: '🐛 问题反馈', hint: '功能不工作、报错、数据不对' },
  { id: 'usability', label: '🤔 体验问题', hint: '难找、难懂、操作繁琐' },
  { id: 'feature', label: '💡 功能建议', hint: '希望增加什么能力' },
  { id: 'content', label: '📖 内容纠错', hint: '质量方法论、术语、AI回答有误' },
  { id: 'other', label: '💬 其他', hint: '' },
];

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('usability');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const { token, isAuthenticated } = useAuth();

  // Hide on iframe-embedded tool pages to avoid overlapping their UI
  const hidden = router.pathname.includes('/ai-spc') || router.pathname.includes('/ai-msa');
  if (hidden) return null;

  async function submit() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/v1/billing/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          category, content: content.trim(),
          page_url: router.asPath,
          rating: rating || null,
          contact: contact.trim() || null,
        }),
      });
      if (res.ok) {
        setSent(true);
        setContent(''); setRating(0); setContact('');
        setTimeout(() => { setOpen(false); setSent(false); }, 2000);
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 px-4 py-2.5 bg-mckinsey-navy text-white rounded-full shadow-lg hover:bg-mckinsey-blue hover:shadow-xl transition-all flex items-center gap-2 text-sm font-medium"
          title="反馈问题或建议">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5h8m-8 3h5m-8.25 5.25a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6.75v12z" />
          </svg>
          反馈
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-mckinsey-border overflow-hidden">
          <div className="px-5 py-3.5 bg-mckinsey-navy text-white flex items-center justify-between">
            <h3 className="text-sm font-semibold">你的反馈很重要</h3>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white text-xl leading-none">×</button>
          </div>

          {sent ? (
            <div className="p-8 text-center">
              <div className="text-3xl mb-3">✓</div>
              <p className="text-sm font-medium text-mckinsey-navy">已收到，谢谢！</p>
              <p className="text-xs text-mckinsey-muted mt-1">我们会认真看每一条反馈</p>
            </div>
          ) : (
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-medium text-mckinsey-navy mb-2">反馈类型</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {CATEGORIES.map(c => (
                    <button key={c.id} onClick={() => setCategory(c.id)}
                      className={`text-left px-3 py-2 rounded-lg text-xs transition-all border ${
                        category === c.id
                          ? 'border-mckinsey-teal bg-mckinsey-teal/5 text-mckinsey-navy font-medium'
                          : 'border-mckinsey-border text-mckinsey-muted hover:border-mckinsey-teal/40'
                      }`}>
                      {c.label}
                      {c.hint && category === c.id && (
                        <span className="block text-[10px] text-mckinsey-muted mt-0.5 font-normal">{c.hint}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-mckinsey-navy mb-1.5">具体描述</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)}
                  className="w-full h-24 px-3 py-2 rounded-lg border border-mckinsey-border text-xs focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/20 resize-none"
                  placeholder="越具体越好。如果是问题，请说明你当时在做什么、期望什么结果、实际看到什么。" />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-mckinsey-navy mb-1.5">整体满意度（可选）</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setRating(rating === n ? 0 : n)}
                      className={`w-8 h-8 rounded-lg text-sm transition-all ${
                        rating >= n ? 'bg-mckinsey-gold text-white' : 'bg-mckinsey-light text-mckinsey-muted hover:bg-mckinsey-border/50'
                      }`}>★</button>
                  ))}
                </div>
              </div>

              {!isAuthenticated && (
                <div>
                  <label className="block text-[11px] font-medium text-mckinsey-navy mb-1.5">联系方式（可选）</label>
                  <input value={contact} onChange={(e) => setContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-mckinsey-border text-xs focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/20"
                    placeholder="邮箱或手机，方便我们回复你" />
                </div>
              )}

              <div className="text-[10px] text-mckinsey-muted">
                当前页面：{router.asPath}
              </div>

              <button onClick={submit} disabled={!content.trim() || sending}
                className="w-full py-2.5 bg-gradient-to-r from-mckinsey-teal to-cyan-500 text-white text-sm font-medium rounded-lg hover:shadow-lg disabled:opacity-40 transition-all">
                {sending ? '提交中...' : '提交反馈'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
