import Head from 'next/head';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

// 8D Phase definitions (from your coach.js)
const PHASES: Record<string, Phase> = {
  D0: { name: '准备 Planning', tools: ['COPQ Analysis', 'Project Charter', 'Stakeholder Map', 'Project Selection Matrix'], action: '量化问题、确定 Business Case' },
  D1: { name: '团队 Team Formation', tools: ['RACI Matrix', 'Stakeholder Analysis', 'Team Charter'], action: '组建跨职能团队、明确角色' },
  D2: { name: '问题 Problem Statement', tools: ['5W2H', 'Is/Is-Not', 'SIPOC', 'CTQ Tree', 'VOC Analysis'], action: '精确定义问题、建立Y指标基线' },
  D3: { name: '临时措施 Interim Containment', tools: ['Risk Assessment', 'Containment Matrix', 'Check Sheet'], action: '保护客户/过程，实施围堵措施' },
  D4: { name: '根本原因 Root Cause Analysis', tools: ['Fishbone Diagram', '5-Why', 'C&E Matrix', 'Hypothesis Testing', 'Regression', 'Multi-Vari', 'Pareto'], action: '识别并验证根本原因' },
  D5: { name: '纠正措施 Corrective Action', tools: ['DOE', 'Pugh Matrix', 'FMEA', 'Pilot Plan', 'TRIZ'], action: '选择并验证最佳解决方案' },
  D6: { name: '实施验证 Implementation', tools: ['Before/After Test', 'Cpk/Ppk', 'Gantt Chart', 'Run Chart'], action: '实施方案，用数据验证效果' },
  D7: { name: '预防再发 Prevention', tools: ['Control Plan', 'SPC Charts', 'Poka-Yoke', 'SOP', 'Skills Matrix'], action: '建立控制系统，防止问题再发' },
  D8: { name: '关闭 Closure', tools: ['A3 Report', 'COPQ Before/After', 'Lessons Learned'], action: '总结成果，关闭项目' },
};

interface Phase {
  name: string;
  tools: string[];
  action: string;
}

interface Message {
  role: 'user' | 'coach';
  content: string;
  phase: string;
  timestamp: string;
}

interface Project {
  project_id: string;
  project_name: string;
  current_phase: string;
  status: string;
  updated_at: string;
}

const MODELS = [
  { id: 'GPT_4_1_MS', name: 'GPT-4.1' },
  { id: 'CLAUDE_4_6_SONNET_MS', name: 'Claude Sonnet 4.6' },
  { id: 'GPT_5_4_MS', name: 'GPT-5.4' },
  { id: 'GEMINI_2_5_PRO_MS', name: 'Gemini 2.5 Pro' },
  { id: 'GPT_4_1_MINI_MS', name: 'GPT-4.1 mini (fast)' },
];

export default function CoachPage() {
  // Auth state
  const [email, setEmail] = useState('');
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('D0');
  const [model, setModel] = useState('GPT_4_1_MS');
  const [gleanChatId, setGleanChatId] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // UI state
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check backend health on mount
  useEffect(() => {
    fetch('/coach-api/health')
      .then((r) => r.json())
      .then((data) => setBackendStatus(data.status === 'ok' ? 'online' : 'offline'))
      .catch(() => setBackendStatus('offline'));

    // Auto-login from localStorage
    const savedEmail = localStorage.getItem('coach_user_email');
    if (savedEmail) {
      loginWithEmail(savedEmail);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // === Auth ===
  const loginWithEmail = async (emailAddr: string) => {
    try {
      const res = await fetch('/coach-api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddr }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setEmail(emailAddr);
        localStorage.setItem('coach_user_email', emailAddr);
        loadProjects(emailAddr);
      }
    } catch {
      // Backend offline — allow demo mode
      setUser({ email: emailAddr, name: emailAddr.split('@')[0] });
      setEmail(emailAddr);
    }
  };

  const handleLogin = () => {
    if (!email.includes('@')) return;
    loginWithEmail(email);
  };

  const logout = () => {
    localStorage.removeItem('coach_user_email');
    setUser(null);
    setProjects([]);
    setCurrentProject(null);
    setMessages([]);
  };

  // === Projects ===
  const loadProjects = async (emailAddr: string) => {
    try {
      const res = await fetch('/coach-api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddr }),
      });
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      setProjects([]);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch('/coach-api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, project_name: newProjectName }),
      });
      const data = await res.json();
      if (data.project) {
        openProject(data.project);
      }
    } catch {}
    setShowNewProject(false);
    setNewProjectName('');
  };

  const openProject = async (project: Project) => {
    setCurrentProject(project);
    setCurrentPhase(project.current_phase || 'D0');
    // Load conversation
    try {
      const res = await fetch('/coach-api/projects/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.project_id, email }),
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(
          data.messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'coach',
            content: m.content,
            phase: m.phase || 'D0',
            timestamp: m.timestamp,
          }))
        );
      }
      if (data.project?.glean_chat_id) {
        setGleanChatId(data.project.glean_chat_id);
      }
    } catch {
      setMessages([]);
    }
  };

  // === Chat ===
  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      phase: currentPhase,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/coach-api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          chatId: gleanChatId,
          phase: currentPhase,
          model,
          project_id: currentProject?.project_id,
        }),
      });
      const data = await res.json();

      if (data.chatId) setGleanChatId(data.chatId);

      const coachMsg: Message = {
        role: 'coach',
        content: data.response || data.error || '[No response]',
        phase: currentPhase,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'coach',
          content: '⚠️ Coach服务未连接。请确保 `python server_glean.py` 在端口5000运行。',
          phase: currentPhase,
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

  // === Phase navigation ===
  const switchPhase = (phase: string) => {
    setCurrentPhase(phase);
    if (currentProject) {
      fetch('/coach-api/projects/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: currentProject.project_id, current_phase: phase }),
      }).catch(() => {});
    }
  };

  // === Generate Report ===
  const handleGenerateReport = async () => {
    if (!currentProject) return;
    try {
      const res = await fetch('/coach-api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_data: {
            project_name: currentProject.project_name,
            current_phase: currentPhase,
          },
        }),
      });
      const data = await res.json();
      if (data.download_url) {
        window.open(`/coach-api/../${data.download_url}`, '_blank');
      }
    } catch {}
  };

  // ============= RENDER =============

  // Login screen
  if (!user) {
    return (
      <>
        <Head><title>AI教练 - 登录</title></Head>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-mckinsey-light">
          <div className="card max-w-md w-full text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h1 className="text-2xl font-bold text-mckinsey-navy mb-2">Six Sigma AI Coach</h1>
            <p className="text-mckinsey-muted mb-6">AI-Powered Black Belt Mentor for Engineers</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-mckinsey-border rounded-lg text-sm mb-4
                       focus:outline-none focus:border-mckinsey-teal"
            />
            <button onClick={handleLogin} className="btn-primary w-full">
              Login
            </button>
            {backendStatus === 'offline' && (
              <p className="mt-4 text-xs text-amber-600">
                ⚠️ Coach后端未运行。请启动: <code>python server_glean.py</code> (端口5000)
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  // Project list
  if (!currentProject) {
    return (
      <>
        <Head><title>AI教练 - 项目列表</title></Head>
        <div className="min-h-[calc(100vh-4rem)] bg-mckinsey-light py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-mckinsey-navy">My Projects</h1>
                <p className="text-sm text-mckinsey-muted mt-1">
                  {user.name} ({user.email}) · <button onClick={logout} className="text-mckinsey-teal hover:underline">Logout</button>
                </p>
              </div>
              <button onClick={() => setShowNewProject(true)} className="btn-primary">
                + New Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-mckinsey-muted mb-4">No projects yet. Create your first 8D project!</p>
                <button onClick={() => setShowNewProject(true)} className="btn-secondary">
                  Create Project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p) => (
                  <div
                    key={p.project_id}
                    onClick={() => openProject(p)}
                    className="card cursor-pointer hover:translate-x-1 transition-transform flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-medium text-mckinsey-navy">{p.project_name}</h3>
                      <p className="text-xs text-mckinsey-muted mt-1">
                        Updated: {p.updated_at?.split('T')[0] || p.updated_at?.split(' ')[0]}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      p.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {p.status === 'completed' ? '✅ Completed' : p.current_phase}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* New project modal */}
            {showNewProject && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4">
                  <h3 className="text-lg font-semibold text-mckinsey-navy mb-4">Create New Project</h3>
                  <input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createProject()}
                    placeholder="Project name (e.g. BB6648 Return Rate)"
                    className="w-full px-4 py-3 border border-mckinsey-border rounded-lg text-sm mb-4
                             focus:outline-none focus:border-mckinsey-teal"
                    autoFocus
                  />
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setShowNewProject(false)} className="btn-secondary">Cancel</button>
                    <button onClick={createProject} className="btn-primary">Create</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // === Main coaching interface ===
  return (
    <>
      <Head><title>{currentProject.project_name} - AI教练</title></Head>

      <div className="h-[calc(100vh-4rem)] flex">
        {/* Left sidebar - Phase navigation */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-mckinsey-border bg-mckinsey-light overflow-y-auto">
          {/* Project info */}
          <div className="p-4 border-b border-mckinsey-border">
            <button onClick={() => setCurrentProject(null)} className="text-xs text-mckinsey-muted hover:text-mckinsey-teal mb-2">
              ← Back to Projects
            </button>
            <h3 className="font-medium text-mckinsey-navy text-sm truncate">{currentProject.project_name}</h3>
          </div>

          {/* Phase list */}
          <div className="p-4 flex-1">
            <h4 className="text-xs font-semibold text-mckinsey-muted uppercase tracking-wide mb-3">8D Phases</h4>
            <ul className="space-y-1">
              {Object.entries(PHASES).map(([id, phase]) => (
                <li key={id}>
                  <button
                    onClick={() => switchPhase(id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentPhase === id
                        ? 'bg-mckinsey-navy text-white'
                        : 'text-mckinsey-muted hover:bg-white hover:text-mckinsey-navy'
                    }`}
                  >
                    <span className="font-medium">{id}</span>
                    <span className="ml-2 text-xs opacity-80">{phase.name.split(' ')[0]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-mckinsey-border space-y-2">
            <button onClick={handleGenerateReport} className="w-full btn-secondary text-xs py-2">
              📄 Generate 8D Report
            </button>
          </div>
        </aside>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="h-12 border-b border-mckinsey-border flex items-center justify-between px-4 bg-white">
            <div className="flex items-center gap-3">
              <span className="font-medium text-mckinsey-navy text-sm">{currentPhase}</span>
              <span className="text-xs text-mckinsey-muted">— {PHASES[currentPhase]?.action}</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="text-xs border border-mckinsey-border rounded px-2 py-1"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500' : 'bg-red-400'}`} />
            </div>
          </div>

          {/* Tool chips */}
          <div className="px-4 py-2 border-b border-mckinsey-border bg-mckinsey-light/50 flex flex-wrap gap-2">
            {PHASES[currentPhase]?.tools.map((tool) => (
              <span key={tool} className="px-2 py-0.5 bg-white border border-mckinsey-border rounded text-xs text-mckinsey-muted">
                {tool}
              </span>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-mckinsey-navy mb-2">
                  Ready to coach — Phase {currentPhase}
                </h3>
                <p className="text-sm text-mckinsey-muted max-w-md mx-auto">
                  {PHASES[currentPhase]?.action}. 告诉我你的问题，我会引导你完成这个阶段。
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-mckinsey-navy text-white'
                      : 'bg-white border border-mckinsey-border text-mckinsey-navy'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed"
                       dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                  {msg.role === 'coach' && (
                    <div className="mt-2 text-xs text-mckinsey-muted opacity-60">{msg.phase}</div>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-mckinsey-border rounded-xl px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-mckinsey-teal rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-mckinsey-teal rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-mckinsey-teal rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="text-xs text-mckinsey-muted ml-2">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-mckinsey-border p-4 bg-white">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask your coach about ${currentPhase}... (Enter发送, Shift+Enter换行)`}
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

// Simple markdown to HTML (bold, italic, code, lists)
function formatMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-gray-100 rounded text-xs">$1</code>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/^(\d+)\. (.+)$/gm, '$1. $2')
    .replace(/\n/g, '<br>');
}
