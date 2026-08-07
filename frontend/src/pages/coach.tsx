import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我是你的六西格玛AI教练。我可以帮助你：\n\n• 指导DMAIC项目各阶段\n• 推荐合适的统计工具\n• 解读分析结果\n• 评审项目交付物\n\n请告诉我你需要什么帮助？',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '[AI教练服务暂未连接，请确保后端已启动]',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    '帮我选择合适的控制图类型',
    '解释Cpk和Ppk的区别',
    '指导我完成Define阶段',
    '推荐假设检验方法',
  ];

  return (
    <>
      <Head>
        <title>AI教练 - AI Quality Portal</title>
      </Head>

      <div className="h-[calc(100vh-4rem)] flex">
        {/* Sidebar - capabilities */}
        <aside className="hidden lg:block w-72 border-r border-mckinsey-border bg-mckinsey-light p-6 overflow-y-auto">
          <h3 className="font-semibold text-mckinsey-navy mb-4">AI教练能力</h3>
          <ul className="space-y-3 text-sm text-mckinsey-muted">
            <li className="flex items-start gap-2">
              <span className="text-mckinsey-teal mt-0.5">●</span>
              <span>DMAIC全流程指导</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-mckinsey-teal mt-0.5">●</span>
              <span>统计工具选择与推荐</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-mckinsey-teal mt-0.5">●</span>
              <span>数据分析结果解读</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-mckinsey-teal mt-0.5">●</span>
              <span>项目交付物评审</span>
            </li>
          </ul>

          <div className="mt-8">
            <h4 className="text-sm font-medium text-mckinsey-navy mb-3">快速提问</h4>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => setInput(action)}
                  className="w-full text-left text-xs p-2 rounded-lg bg-white border border-mckinsey-border
                           hover:border-mckinsey-teal text-mckinsey-muted hover:text-mckinsey-navy
                           transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-xl px-5 py-3 ${
                    msg.role === 'user'
                      ? 'bg-mckinsey-navy text-white'
                      : 'bg-mckinsey-light text-mckinsey-navy border border-mckinsey-border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-mckinsey-light rounded-xl px-5 py-3 border border-mckinsey-border">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-mckinsey-muted rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-mckinsey-muted rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-mckinsey-muted rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-mckinsey-border p-4 bg-white">
            <div className="max-w-4xl mx-auto flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的问题... (Enter发送, Shift+Enter换行)"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-mckinsey-border px-4 py-3
                         text-sm focus:outline-none focus:border-mckinsey-teal
                         placeholder:text-mckinsey-muted/60"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="btn-primary px-5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
