import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';

const STEPS = [
  { id: 'describe', label: '问题描述' },
  { id: 'define', label: '问题定义' },
  { id: 'rca', label: '原因分析' },
  { id: 'measures', label: '改善措施' },
  { id: 'verification', label: '效果验证' },
  { id: '8d', label: '8D报告' },
];

const typeLabels: Record<string, string> = {
  complaint: '客户投诉', incoming: '来料异常', process: '制程异常',
  failure: '产品失效', supplier: '供应商问题', internal: '内部质量问题',
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Auto-trigger AI if first message exists but no AI response yet
      if (data.messages?.length === 1 && data.messages[0].role === 'user') {
        triggerAI(data.messages[0].content, data.messages);
      }
    }
  }

  async function triggerAI(userMessage: string, currentMessages?: Message[]) {
    setStreaming(true);
    setStreamingContent('');

    try {
      const res = await fetch(`/api/v1/cases/${id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
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
          const lines = text.split('\n');
          for (const line of lines) {
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
    } catch (err) {
      console.error(err);
    } finally {
      setStreaming(false);
      setStreamingContent('');
    }
  }

  async function handleSend() {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    await triggerAI(userMsg);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleConfirmStep() {
    if (!caseData) return;
    const step = caseData.current_step;
    let field = '';
    let value = '';

    if (step === 'describe' || step === 'define') {
      field = 'problem_statement';
      // Extract from last AI message
      const lastAI = [...messages].reverse().find(m => m.role === 'assistant');
      value = lastAI?.content || '';
    }

    const res = await fetch(`/api/v1/cases/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ field, value: value.slice(0, 2000) }),
    });
    if (res.ok) {
      loadCase();
    }
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === caseData?.current_step);

  if (!caseData) {
    return <div className="pt-16 min-h-screen flex items-center justify-center text-mckinsey-muted">加载中...</div>;
  }

  return (
    <>
      <Head><title>{caseData.title} - AI Quality Portal</title></Head>
      <div className="pt-16">
        <AuthGuard>
          <div className="flex h-[calc(100vh-64px)]">
            {/* Left panel - Progress */}
            <div className="w-64 border-r border-mckinsey-border bg-mckinsey-light/50 p-6 overflow-y-auto flex-shrink-0">
              <div className="mb-6">
                <span className="text-xs text-mckinsey-teal font-medium uppercase">{typeLabels[caseData.case_type]}</span>
                <h2 className="text-lg font-semibold text-mckinsey-navy mt-1 leading-tight">{caseData.title}</h2>
              </div>

              {/* Steps */}
              <div className="space-y-1">
                {STEPS.map((step, i) => {
                  const isCurrent = step.id === caseData.current_step;
                  const isDone = i < currentStepIndex;
                  return (
                    <div key={step.id} className="flex items-center gap-3 py-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isDone ? 'bg-mckinsey-teal text-white' :
                        isCurrent ? 'bg-mckinsey-navy text-white ring-2 ring-mckinsey-teal/30' :
                        'bg-mckinsey-border text-mckinsey-muted'
                      }`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span className={`text-sm ${isCurrent ? 'font-semibold text-mckinsey-navy' : isDone ? 'text-mckinsey-teal' : 'text-mckinsey-muted'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Confirm button */}
              {(caseData.current_step === 'describe' || caseData.current_step === 'define') && messages.length > 1 && (
                <div className="mt-8 pt-6 border-t border-mckinsey-border">
                  <button
                    onClick={handleConfirmStep}
                    className="w-full px-4 py-2.5 bg-mckinsey-teal text-white text-sm font-medium rounded-lg hover:bg-mckinsey-teal/90 transition-colors"
                  >
                    确认问题定义
                  </button>
                  <p className="text-xs text-mckinsey-muted mt-2">确认后进入原因分析阶段</p>
                </div>
              )}
            </div>

            {/* Right panel - Chat */}
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                      msg.role === 'user'
                        ? 'bg-mckinsey-navy text-white'
                        : msg.role === 'system'
                        ? 'bg-amber-50 border border-amber-200 text-amber-800 text-sm'
                        : 'bg-white border border-mckinsey-border text-mckinsey-navy shadow-sm'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {/* Streaming message */}
                {streaming && streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-2xl px-5 py-3 bg-white border border-mckinsey-border text-mckinsey-navy shadow-sm">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{streamingContent}</div>
                    </div>
                  </div>
                )}

                {streaming && !streamingContent && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-mckinsey-border rounded-2xl px-5 py-3 shadow-sm">
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

              {/* Input */}
              <div className="border-t border-mckinsey-border p-4 bg-white">
                <div className="flex gap-3 max-w-4xl mx-auto">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={streaming}
                    className="flex-1 px-4 py-3 rounded-xl border border-mckinsey-border focus:outline-none focus:ring-2 focus:ring-mckinsey-teal/30 focus:border-mckinsey-teal transition-all resize-none text-sm"
                    placeholder="输入信息或回答AI的问题..."
                    rows={2}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || streaming}
                    className="px-5 py-3 bg-mckinsey-teal text-white rounded-xl hover:bg-mckinsey-teal/90 disabled:opacity-50 transition-colors self-end"
                  >
                    发送
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
