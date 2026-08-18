import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

const STEPS = [
  { id: 'describe', label: '问题描述', state: 'intake' },
  { id: 'define', label: '问题定义', state: 'investigation' },
  { id: 'rca', label: '原因分析', state: 'rca' },
  { id: 'measures', label: '改善措施', state: 'action_planning' },
  { id: 'verify', label: '效果验证', state: 'effectiveness_verification' },
  { id: '8d', label: '8D报告', state: 'closing' },
];

const typeLabels: Record<string, string> = {
  complaint: '客户投诉', incoming: '来料异常', process: '制程异常',
  failure: '产品失效', supplier: '供应商问题', internal: '内部质量问题',
};

const stepMapping: Record<string, number> = {
  describe: 0, define: 1, rca: 2, measures: 3, verify: 4, '8d': 5,
};

interface Message {
  id?: number;
  role: string;
  content: string;
  step?: string;
}

export default function CaseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id && token) loadCase();
  }, [id, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  async function loadCase() {
    const res = await fetch(`/api/v1/cases/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCaseData(data);
      setMessages(data.messages || []);
      if (data.messages?.length === 1 && data.messages[0].role === 'user') {
        triggerAI(data.messages[0].content);
      }
    }
  }

  async function triggerAI(userMessage: string) {
    setStreaming(true);
    setStreamingContent('');
    try {
      const res = await fetch(`/api/v1/cases/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMessage }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          for (const line of text.split('\n')) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch {}
            }
          }
        }
      }
      if (fullContent) {
        setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);
      }
    } catch (err) { console.error(err); }
    finally { setStreaming(false); setStreamingContent(''); }
  }

  async function handleSend() {
    if (!input.trim() || streaming) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    await triggerAI(msg);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  async function handleConfirm(field: string) {
    const lastAI = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAI) return;
    const res = await fetch(`/api/v1/cases/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ field, value: lastAI.content.slice(0, 2000) }),
    });
    if (res.ok) {
      setMessages(prev => [...prev, { role: 'system', content: `✅ ${field === 'problem_statement' ? '问题定义' : '根因'}已确认，进入下一阶段` }]);
      loadCase();
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', '');
    try {
      const res = await fetch(`/api/v1/cases/${id}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'system', content: `📎 已上传文件: ${data.title}` }]);
      }
    } catch (err) { console.error(err); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  const currentStepIndex = stepMapping[caseData?.current_step] ?? 0;

  // Determine what confirm button to show
  const showProblemConfirm = caseData?.current_step === 'describe' && messages.filter(m => m.role === 'assistant').length >= 2;
  const showRcaConfirm = caseData?.current_step === 'rca' && messages.filter(m => m.role === 'assistant').length >= 1;

  if (!caseData) {
    return <div className="pt-16 min-h-screen flex items-center justify-center text-mckinsey-muted">加载中...</div>;
  }

  return (
    <>
      <Head><title>{caseData.title} - AI Quality Portal</title></Head>
      <div className="pt-16">
        <AuthGuard>
          <div className="flex h-[calc(100vh-64px)]">
            {/* Left panel */}
            <div className="w-72 border-r border-mckinsey-border bg-mckinsey-light/30 p-6 overflow-y-auto flex-shrink-0">
              <div className="mb-6">
                <span className="text-xs text-mckinsey-teal font-medium uppercase tracking-wide">{typeLabels[caseData.case_type]}</span>
                <h2 className="text-base font-semibold text-mckinsey-navy mt-1 leading-tight">{caseData.title}</h2>
                <p className="text-xs text-mckinsey-muted mt-2">
                  {caseData.created_at ? new Date(caseData.created_at).toLocaleDateString('zh-CN') : ''}
                </p>
              </div>

              {/* Progress steps */}
              <div className="space-y-0.5">
                {STEPS.map((step, i) => {
                  const isCurrent = i === currentStepIndex;
                  const isDone = i < currentStepIndex;
                  return (
                    <div key={step.id} className={`flex items-center gap-3 py-2.5 px-3 rounded-lg ${isCurrent ? 'bg-white shadow-sm' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                        isDone ? 'bg-mckinsey-teal text-white' :
                        isCurrent ? 'bg-mckinsey-navy text-white ring-4 ring-mckinsey-teal/10' :
                        'bg-mckinsey-border/60 text-mckinsey-muted'
                      }`}>
                        {isDone ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : i + 1}
                      </div>
                      <span className={`text-sm ${isCurrent ? 'font-semibold text-mckinsey-navy' : isDone ? 'text-mckinsey-teal' : 'text-mckinsey-muted'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Confirmed info */}
              {caseData.problem_statement && (
                <div className="mt-6 pt-4 border-t border-mckinsey-border">
                  <h4 className="text-xs font-semibold text-mckinsey-navy uppercase mb-2">已确认问题定义</h4>
                  <p className="text-xs text-mckinsey-muted leading-relaxed line-clamp-4">{caseData.problem_statement.slice(0, 200)}</p>
                </div>
              )}

              {caseData.root_cause && (
                <div className="mt-4 pt-4 border-t border-mckinsey-border">
                  <h4 className="text-xs font-semibold text-mckinsey-navy uppercase mb-2">已确认根因</h4>
                  <p className="text-xs text-mckinsey-muted leading-relaxed line-clamp-4">{caseData.root_cause.slice(0, 200)}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-6 pt-4 border-t border-mckinsey-border space-y-2">
                {showProblemConfirm && (
                  <button onClick={() => handleConfirm('problem_statement')}
                    className="w-full px-4 py-2.5 bg-mckinsey-teal text-white text-sm font-medium rounded-lg hover:bg-mckinsey-teal/90 transition-colors">
                    ✓ 确认问题定义
                  </button>
                )}
                {showRcaConfirm && (
                  <button onClick={() => handleConfirm('root_cause')}
                    className="w-full px-4 py-2.5 bg-mckinsey-teal text-white text-sm font-medium rounded-lg hover:bg-mckinsey-teal/90 transition-colors">
                    ✓ 确认根因
                  </button>
                )}
              </div>
            </div>

            {/* Right panel - Chat */}
            <div className="flex-1 flex flex-col bg-gray-50/50">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'system' ? (
                      <div className="w-full max-w-2xl mx-auto">
                        <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl px-4 py-3 text-sm text-amber-800 text-center">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-[78%] ${msg.role === 'user' ? '' : ''}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-5 h-5 rounded-full bg-mckinsey-teal/20 flex items-center justify-center">
                              <span className="text-[10px] text-mckinsey-teal font-bold">AI</span>
                            </div>
                            <span className="text-xs text-mckinsey-muted">AI质量工程师</span>
                          </div>
                        )}
                        <div className={`rounded-2xl px-5 py-3.5 ${
                          msg.role === 'user'
                            ? 'bg-mckinsey-navy text-white'
                            : 'bg-white border border-mckinsey-border/60 text-mckinsey-navy shadow-sm'
                        }`}>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {streaming && streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[78%]">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full bg-mckinsey-teal/20 flex items-center justify-center">
                          <span className="text-[10px] text-mckinsey-teal font-bold">AI</span>
                        </div>
                        <span className="text-xs text-mckinsey-muted">AI质量工程师</span>
                      </div>
                      <div className="bg-white border border-mckinsey-border/60 rounded-2xl px-5 py-3.5 shadow-sm">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-mckinsey-navy">{streamingContent}</div>
                      </div>
                    </div>
                  </div>
                )}

                {streaming && !streamingContent && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-mckinsey-border/60 rounded-2xl px-5 py-4 shadow-sm">
                      <div className="flex items-center gap-2 text-sm text-mckinsey-muted">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                          <span className="w-2 h-2 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                          <span className="w-2 h-2 bg-mckinsey-teal rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                        </div>
                        AI正在分析...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-mckinsey-border p-4 bg-white">
                <div className="flex gap-3 max-w-4xl mx-auto items-end">
                  {/* File upload button */}
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.ppt,.pptx" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-3 rounded-xl border border-mckinsey-border hover:bg-mckinsey-light transition-colors text-mckinsey-muted hover:text-mckinsey-navy disabled:opacity-50"
                    title="上传文件"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                  </button>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={streaming}
                    className="flex-1 px-4 py-3 rounded-xl border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/20 focus:border-mckinsey-teal transition-all resize-none text-sm"
                    placeholder="输入信息或回答AI的问题..."
                    rows={2}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || streaming}
                    className="p-3 bg-mckinsey-teal text-white rounded-xl hover:bg-mckinsey-teal/90 disabled:opacity-50 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AuthGuard>
      </div>
    </>
  );
}
