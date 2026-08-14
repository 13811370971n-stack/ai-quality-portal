# AI Quality Portal - Project Knowledge Base

## 服务器资源

| 名称 | IP | 用途 | 凭证条目 |
|------|-----|------|----------|
| aliyun_server | 120.26.250.214 | spc-tool-web（独立 Dash 应用） | `aliyun_server` |
| aliyun_server_2 | 8.146.227.10 | AI Quality Portal（主站） | `aliyun_server_2` |

两台服务器均配置了 SSH 密钥免密登录（`~/.ssh/id_ed25519`）。

---

## 凭证管理

- 加密凭证文件：`~/.credentials/vault.enc`（Fernet/AES 加密）
- 管理工具：`~/.credentials/credential_manager.py`
- 远程执行：`~/.credentials/remote.py`（SSH 密钥优先，paramiko 密码回退）
- 密钥派生：机器名 + 用户名，只能在本机解密

---

## 架构

### AI Quality Portal（8.146.227.10）

```
Nginx (:8080 对外)
├── /              → Next.js (:3000)  — Portal 前端
├── /tools/ai-spc/app/ → Dash (:8050) — SPC 工具（iframe 嵌入）
├── /api/          → FastAPI (:8000)  — 后端 API
└── /docs          → FastAPI Swagger
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 + React 18 + Tailwind CSS + Framer Motion |
| 后端 | FastAPI + Uvicorn |
| SPC 工具 | Python Dash 4.x + Plotly + dash-bootstrap-components |
| 设计风格 | Glassmorphism（渐变 mesh 背景 + 毛玻璃卡片 + 浮动光晕） |
| 部署 | Nginx 反向代理 + nohup 进程 |

---

## 代码仓库

| 项目 | GitHub | 服务器路径 |
|------|--------|-----------|
| AI Quality Portal | https://github.com/13811370971n-stack/ai-quality-portal | `/root/Projects/ai-quality-portal/` |
| SPC Tool Web | https://github.com/13811370971n-stack/spc-tool-web | `/root/Projects/spc-tool-web/` |

### Git 配置

- GitHub 用户：`13811370971n-stack`
- 认证方式：SSH 密钥（`~/.ssh/id_github`，ed25519）
- 提交者：Jamin Li / jamin.li@ericsson.com
- 两台服务器均已配置 GitHub SSH 访问

---

## 已完成页面

| 路由 | 功能 | 状态 |
|------|------|------|
| `/` | 首页 — Hero + 价值主张 + 模块导航 | ✅ |
| `/tools` | AI 工具集 — 可点击卡片 | ✅ |
| `/tools/ai-spc` | AI-SPC — iframe 嵌入 Dash 应用 | ✅ |
| `/coach` | AI 教练 — 六西格玛对话界面 | ✅ |
| `/methodology` | DMAIC 方法论 — 5 阶段展示 | ✅ |
| `/about` | 关于平台 | ✅ |
| `/404` | 404 错误页 | ✅ |

---

## SPC Tool Web

### 功能

- 9 种控制图：Xbar-R、Xbar-S、I-MR、P、NP、C、U、EWMA、Z-MR
- 过程能力分析（Cpk/Ppk）
- 正态性检验
- AI 设置（OpenAI/Ollama/DeepSeek 多后端）

### 部署模式

| 模式 | 地址 | 说明 |
|------|------|------|
| 独立运行 | 120.26.250.214:8050 | 旧服务器，`run.py` |
| 嵌入模式 | 8.146.227.10 `/tools/ai-spc/app/` | `run_embedded.py`，`url_base_pathname` 配置 |

---

## 域名 & 网络

| 项目 | 状态 |
|------|------|
| 域名 | `aidmaic.top` |
| DNS | 当前指向 120.26.250.214（待改为 8.146.227.10） |
| ICP 备案 | 进行中 |
| 当前访问 | http://8.146.227.10:8080 |
| 安全组 | 8080 已开放（server 2）、8050 已开放（server 1） |

> ICP 备案通过前只能通过 IP + 非标端口访问，域名访问会被阿里云拦截。

---

## 设计风格

- **配色方案**
  - 深蓝 (Navy): `#051C2C`
  - 青色 (Teal): `#00A0AF`
  - 金色 (Gold): `#C5A572`
  - 浅灰 (Light): `#F5F7FA`
  - 文字灰 (Muted): `#8B9DAF`

- **设计特征**
  - Glassmorphism 毛玻璃效果
  - Mesh 渐变背景 + 浮动光晕动画
  - 渐变文字标题
  - 导航栏：透明 → 滚动后毛玻璃
  - 卡片 hover 位移 + 阴影变化
  - 按钮渐变 + 发光 hover

- **字体**：Inter

---

## 本地开发路径

| 项目 | 路径 |
|------|------|
| SPC 桌面版 | `C:\Users\elizimi\Projects\spc-tool` |
| SPC 网页版 | `C:\Users\elizimi\Projects\spc-tool-web` |
| MSA Tool | `C:\Users\elizimi\Projects\msa-tool` |
| 凭证工具 | `C:\Users\elizimi\.credentials\` |
| Kiro Skills | `C:\Users\elizimi\.kiro\skills\` |

---

## 运维命令

### 启动服务（server 2: 8.146.227.10）

```bash
# 后端 FastAPI
cd /root/Projects/ai-quality-portal/backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &

# 前端 Next.js
cd /root/Projects/ai-quality-portal/frontend
nohup npx next start -p 3000 > /tmp/frontend.log 2>&1 &

# SPC Tool (嵌入模式)
cd /root/Projects/spc-tool-web
source venv/bin/activate
nohup python run_embedded.py > /tmp/spc-embedded.log 2>&1 &
```

### 重新构建前端

```bash
cd /root/Projects/ai-quality-portal/frontend
npm run build
pkill -f 'next-server'
nohup npx next start -p 3000 > /tmp/frontend.log 2>&1 &
```

### 检查服务状态

```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000   # Frontend
curl -s -o /dev/null -w '%{http_code}' http://localhost:8000   # Backend
curl -s -o /dev/null -w '%{http_code}' http://localhost:8050/tools/ai-spc/app/  # SPC
```

---

## Roadmap

### Phase 1 MVP（当前）

- [x] Portal 首页 + Glassmorphism 设计
- [x] AI-SPC 工具集成（iframe 嵌入）
- [x] 工具卡片导航
- [ ] 质量工具百科 `/toolkit`（30+ 工具）
- [ ] 知识图谱 `/toolkit/graph`（D3.js / React Flow）
- [ ] 交互式模板 `/toolkit/templates`（在线鱼骨图等）
- [ ] 学习路径 `/learning`（GB/BB 培训路线）

### Phase 2 全栈迭代

- [ ] 用户系统 + 数据库
- [ ] 智能推荐（输入问题 → 推荐工具）
- [ ] AI-MSA 工具集成
- [ ] HTTPS（Let's Encrypt）
- [ ] 域名正式启用

### 功能优先级

1. 知识图谱 — 工具间关联关系可视化
2. 交互式模板 — 在线使用工具
3. 智能推荐 — 问题描述 → 工具推荐

---

## 目标用户

- 六西格玛绿带/黑带培训学员
- 质量从业者（开放参考平台）
