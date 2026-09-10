# AI Quality Portal — Knowledge Base

> 面向多会话协作的项目状态文档。**修改代码前请先读「协作规则」一节。**
> 最后核实：2026-09-10（内容由服务器实际状态导出，非凭记忆撰写）

---

## 1. 产品定位

面向制造业质量工程师的 **AI 工作与能力提升平台**。

三条核心原则（贯穿所有设计决策）：

- **AI 主动分析，人做关键判断** — AI 推进流程，但问题定义、根因、措施三处必须用户确认
- **把质量问题从发生推进到闭环** — 不是生成报告工具
- **8D 是结果，不是起点** — 先解决问题，最后才生成报告

目标用户：2–8 年经验的制造业质量工程师（QE/CQE/SQE），优先汽车及零部件行业。

---

## 2. 线上环境

| 项 | 值 |
|---|---|
| 主域名 | **https://aidmaic.top** （HTTP 自动 301 到 HTTPS） |
| 备用入口 | http://8.146.227.10:8080 （纯 HTTP，测试用） |
| 证书 | Let's Encrypt，覆盖 `aidmaic.top` + `www.aidmaic.top`，到期 2026-12-09，certbot.timer 自动续期 |
| ICP 备案 | 已通过 |
| 管理员 | admin@aidmaic.top / admin123 |

### 服务器

| 名称 | IP | 用途 | 凭证条目 |
|---|---|---|---|
| aliyun_server_2 | 8.146.227.10 | **主生产环境**（全部服务） | `aliyun_server_2` |
| aliyun_server | 120.26.250.214 | 旧 spc-tool-web 独立部署，现已不用 | `aliyun_server` |

规格：1.6GB 内存 + 2GB swap，40GB 磁盘。**内存是主要约束**，见「已知陷阱」。

凭证读取：
```python
import sys, os
sys.path.insert(0, os.path.expanduser("~/.credentials"))
from credential_manager import CredentialManager
creds = CredentialManager().get("aliyun_server_2")
```

---

## 3. 架构

```
浏览器
  │
  ├─ :443 HTTPS ──┐
  ├─ :80  → 301 ──┤  Nginx
  └─ :8080 ───────┘    │
                       ├─ /                    → Next.js  :3000  [aiqp-frontend]
                       ├─ /api/                → FastAPI  :8000  [aiqp-backend]
                       ├─ /tools/ai-spc/app/   → Dash     :8050  [aiqp-spc]
                       └─ /ai-msa/             → Dash     :8052  [aiqp-msa]
                                                              │
                                              DeepSeek API ───┘
                                              SQLite (data/portal.db)
```

**Nginx 关键配置**：`/api/` 必须 `proxy_buffering off` + `proxy_cache off`，否则 SSE 流式输出会被缓冲，AI 回答变成一次性吐出。

配置已归档在仓库：`deploy/nginx-ai-quality-portal.conf`、`deploy/systemd/*.service`

### 四个 systemd 服务（全部 enabled，重启自动恢复）

| 服务 | 端口 | 工作目录 |
|---|---|---|
| aiqp-backend | 8000 | `/root/Projects/ai-quality-portal/backend` |
| aiqp-frontend | 3000 | `/root/Projects/ai-quality-portal/frontend` |
| aiqp-spc | 8050 | `/root/Projects/spc-tool-web`（`run_embedded.py`） |
| aiqp-msa | 8052 | `/root/Projects/msa-tool-web`（`run.py`） |

---

## 4. 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14.2.5 · React 18 · TypeScript · Tailwind CSS · framer-motion · react-markdown + remark-gfm · @tailwindcss/typography |
| 后端 | FastAPI · SQLAlchemy 2.x · SQLite · python-jose(JWT) · bcrypt · pandas/numpy · python-docx · pypdf · httpx |
| AI | DeepSeek（`deepseek-chat`），SSE 流式 |
| 独立工具 | Dash 4.x + Plotly（SPC、MSA） |
| 设计 | Navy `#051C2C` · Teal `#00A0AF` · Gold `#C5A572` · Light `#F5F7FA` · Muted `#8B9DAF`，字体 Inter |

---

## 5. 代码仓库

| 仓库 | 服务器路径 |
|---|---|
| [ai-quality-portal](https://github.com/13811370971n-stack/ai-quality-portal) | `/root/Projects/ai-quality-portal` |
| [spc-tool-web](https://github.com/13811370971n-stack/spc-tool-web) | `/root/Projects/spc-tool-web` |
| [msa-tool-web](https://github.com/13811370971n-stack/msa-tool-web) | `/root/Projects/msa-tool-web` |
| [quality-toolbox](https://github.com/13811370971n-stack/quality-toolbox) | 原始 SPA + 文档（参考用，不部署） |

GitHub 认证：SSH key `~/.ssh/id_github`（服务器已配置）。提交者 Jamin Li / jamin.li@ericsson.com。

---

## 6. 后端模块（`backend/app/`）

```
api/v1/
  __init__.py       ⚠ 所有路由的注册中心，改动前必读（见协作规则）
  auth.py           邮箱登录/注册 + 短信验证码（send/verify/bind/status）
  users.py          用户管理、进度、收藏
  cases.py          Quality Case CRUD、AI 对话、确认节点、删除/归档、8D 生成
  case_analysis.py  多根因、措施+覆盖度校验、效果验证
  files.py          文件上传 + 文本提取（PDF/Word/Excel/CSV）
  export.py         Case 的 8D Word 导出
  data_analysis.py  Excel 统计分析 + AI 解读
  paywall.py        用量统计、套餐、限额检查
  billing.py        订单、订阅、支付回调、用户反馈
  coach.py          AI 教练（双模式）
  eightd.py         独立 8D 工具（分节 AI 辅助、审核、Word 导出）
  doe.py            DOE 设计生成、效应分析、AI 解读
  ai.py             鱼骨图 / 5Why / 帕累托（另一会话开发）
  fmea.py           FMEA AP/标准/失效分析（另一会话开发）
  tools.py, methodology.py

core/
  ai_engine.py      DeepSeek 客户端（流式 + 非流式）
  quality_agent.py  Quality Case 的 System Prompt、步骤路由、证据注入
  security.py       JWT、bcrypt、角色校验（require_user / require_role）
  state_machine.py  Case 状态机定义

services/
  sms.py            阿里云短信（自实现 RPC 签名，无凭证时 mock）
  payment.py        支付 provider 抽象（无凭证时 mock）
  deepseek.py       另一会话的 DeepSeek 封装（含 JSON 模式）
  fallback_knowledge.py  AI 失败时的本地知识库兜底
  fmea_logic.py     FMEA 规则计算

models/
  user.py       User, UserProgress, UserFavorite, SMSCode, UserRole
  quality_case.py  QualityCase, CaseMessage
  evidence.py   CaseEvidence, CaseInvestigation, CaseRootCause, CaseAction, CaseTimeline
  billing.py    Order, Subscription, Feedback
```

**API 路由总数：75**（`GET /openapi.json` 可查全量）

---

## 7. 前端页面（`frontend/src/pages/`）

| 路由 | 说明 |
|---|---|
| `/` | 工作台首页（已登录显示进行中案例，未登录显示价值主张） |
| `/login` `/register` | 邮箱 + 手机双 Tab 登录 |
| `/profile` | 个人中心：订阅状态、手机绑定、订单记录 |
| `/admin` | 管理后台：用户 Tab + 反馈 Tab |
| `/pricing` | 定价 + 下单 + 支付弹窗 |
| `/cases` | 案例列表（进行中/已归档切换、删除、归档） |
| `/cases/new` | 新建案例（6 类问题 → 自然语言描述） |
| `/cases/[id]` | **核心页面**，6 个 Tab：AI对话 / 根因 / 措施 / 验证 / 证据 / 时间线 |
| `/analysis` | Excel 上传 → 统计分析 → AI 解读 |
| `/coach` | AI 教练（帮我做 / 教我做 双模式） |
| `/tools` | 工具集总览（智能推荐搜索栏 + 分类筛选） |
| `/tools/8d` | 独立 8D 工具（D0-D8 分节 + AI 辅助 + AI 审核 + Word 导出） |
| `/tools/ai-doe` | DOE 三步流程（设计 → 录入 → 分析） |
| `/tools/ai-spc` `/tools/ai-msa` | iframe 嵌入 Dash 应用 |
| `/tools/ai-dfmea` `/tools/ai-pfmea` | FMEA 向导 |
| `/tools/quality-toolbox` | 质量工具箱（37 个工具定义） |
| `/tools/quality-toolbox/workshop/*` | 18 个交互工具 |
| `/tools/quality-toolbox/graph` `/learn` `/recommend` | 知识图谱 / 学习路径 / 智能推荐 |
| `/methodology` `/about` `/404` | |

反馈浮窗 `FeedbackWidget` 挂在 `Layout` 上，全站可用（`/ai-spc`、`/ai-msa` 页除外，避免遮挡 iframe）。
`Layout` 在 `/cases/[id]`、`/ai-spc`、`/ai-msa` 隐藏 Footer（全屏布局）。

### 18 个交互工具组件

`components/quality-toolbox/workshop/`：Fishbone, FiveWhys, Pareto, CheckSheet, ControlChart, Histogram, Scatter, Flowchart, Sipoc, Fmea, DfmeaWizard, PfmeaWizard, ProcessCapability, NormalPlot, HypothesisTest, Regression, Anova, BoxPlot, RunChart, MultiVari

---

## 8. Quality Case 核心流程

```
新建案例 → 问题类型（客诉/来料/制程/失效/供应商/内部）
  → 自然语言描述 → AI 信息抽取 + 追问
  → 上传文件（自动提取文本注入 AI 上下文）
  → 【用户确认】问题定义 ────────┐
  → 多根因录入（6M 分类 + 5Why） │ 三处强制确认
  → 【用户确认】根因 ────────────┤ 状态机推进
  → 措施（遏制/纠正/预防）+ 覆盖度校验
  → 【用户确认】措施 ────────────┘
  → 效果验证（前后数据统计对比）
  → 生成 8D → Word 导出
```

状态机：`intake → investigation → rca → rca_verification → action_planning → effectiveness_verification → closing → closed`（`core/state_machine.py`）

### 数据库表（14 张）

```
users, user_progress, user_favorites, sms_codes
quality_cases (含 archived 字段), case_messages
case_evidences, case_investigations, case_root_causes, case_actions, case_timeline
orders, subscriptions, feedback
```

### 三个有区分度的业务规则

1. **措施覆盖度校验**（`case_analysis.py`）：已确认根因必须有对应纠正措施，否则报「缺口」；纠正措施未关联根因则报「孤立措施」
2. **措施有效性 AI 检查**：核心判据是区分「消除原因」和「仅提高发现概率」——"增加末检"会被判为只能发现不能消除
3. **效果验证 AI 解读**：区分「均值改善」和「波动改善」，均值达标但标准差变大意味着过程更不稳定

---

## 9. 会员与限额

| 方案 | 月付 | 年付 | 案例上限 |
|---|---|---|---|
| Free | ¥0 | — | 3/月 |
| Pro | ¥99 | ¥999 | 无限 |
| Pro+ | ¥299 | ¥2999 | 无限 |

角色：`guest` < `user` < `vip` < `admin`。支付成功后 `user → vip`，订阅到期自动降回。

⚠ **手动在后台改角色为 vip 不会有到期时间**，且到期降级逻辑只在存在 subscription 记录时触发。给测试用户发限期权限要走下单流程。

---

## 10. 环境变量（`backend/.env`，不入 git）

```
DEEPSEEK_API_KEY              已配置
JWT_SECRET_KEY                已配置
DATABASE_URL                  sqlite:///./data/portal.db

ALIYUN_SMS_ACCESS_KEY_ID      待填 ─┐
ALIYUN_SMS_ACCESS_KEY_SECRET  待填  │ 全空 = mock 模式
ALIYUN_SMS_SIGN_NAME          待填  │ 验证码通过 API 返回而非发送
ALIYUN_SMS_TEMPLATE_CODE      待填 ─┘

ALIPAY_APP_ID / PRIVATE_KEY / PUBLIC_KEY / NOTIFY_URL    待填 ─┐ 全空 = mock 支付
WECHAT_APP_ID / MCH_ID / API_V3_KEY / CERT_SERIAL_NO / ...  待填 ─┘ 可走完流程不扣款
```

**降级设计**：短信和支付在凭证缺失时自动进入 mock 模式，填入凭证即生效，无需改代码。

---

## 11. ⚠ 协作规则（多会话必读）

多个 Kiro 会话同时改同一台服务器，已经造成过 **3 次代码覆盖事故**。

### 规则 1：改 `api/v1/__init__.py` 前必须先读

这是最高频的事故点。它注册全部 14 个 router，任何直接覆盖都会导致路由丢失（曾两次让登录返回 404）。

```python
# 正确做法
stdin, stdout, stderr = client.exec_command("cat .../__init__.py")
current = stdout.read().decode()
if "app.api.v1.newmodule" not in current:
    current = current.replace("锚点行", "锚点行
新增import")
# 写回
```

当前应注册的 router：`tools, coach, methodology, auth, users, cases, files, export, data_analysis, paywall, ai, fmea, doe, eightd, case_analysis, billing`

### 规则 2：任何文件都先读后写，不要凭本地副本覆盖服务器

本地 `C:\Users\elizimi\Projects\ai-quality-portal` 可能落后于服务器。以服务器为准，或先 `git pull`。

### 规则 3：改完必须构建 + 重启前端

前端页面文件写完不构建等于没生效，曾导致误判「代码丢失」。

### 规则 4：改共享文件前在此文档留记录

`tools/index.tsx`、`Layout.tsx`、`AuthContext.tsx`、`__init__.py` 是高冲突文件。

---

## 12. ⚠ 已知陷阱（都踩过）

### 构建会打爆内存

服务器仅 1.6GB 内存。`npm run build` 曾把 load 推到 32 并导致 SSH 失联。

**正确做法**：
```bash
cd frontend && rm -rf .next &&   NODE_OPTIONS='--max-old-space-size=1024' nohup npm run build > /tmp/build.log 2>&1 &
# 后台跑 + 轮询，不要在前台等（SSH 断开会杀掉构建）
```
已加 2GB swap（写入 `/etc/fstab`）。正常构建约 80–100 秒、峰值 load 5。

### 端口被孤儿进程占用 → systemd 无限重启

**2026-09-10 发现**：`aiqp-spc` 重启了 **290947 次**。原因是 systemd 化之前 nohup 启动的进程还在占着 8050/8052，systemd 启动失败就重启，无限循环。HTTP 却是 200（孤儿进程在服务），所以从表面看不出问题。代价：约 350MB 内存 + 1.7GB journal 日志。

**排查方法**：
```bash
systemctl show aiqp-spc -p NRestarts --value   # 数字很大 = 有问题
ps -eo pid,ppid,cmd | grep run_embedded         # PPID 不是 1 或有 bash -c 包装 = 孤儿
```
**修复**：`systemctl stop` → `fuser -k 8050/tcp` → `systemctl reset-failed` → `systemctl start`

同类问题也出现在前端：重启太快导致旧进程未退出，`.next` 缓存不一致 → CSS 404 全站变纯文本。**重启前端要 stop → 等 3 秒 → pkill → 等 2 秒 → start**。

### Python 源码里的中文用转义序列写入时改不动

通过 paramiko 写 `.py` 时如果用了 `\uXXXX`，文件里存的是 ASCII 转义串而非汉字。想改错字必须替换**转义序列**（`\u9051` → `\u904f`），按字面汉字替换会找不到目标。改了三次才发现。

写 `.tsx` 用字面中文没问题（SFTP UTF-8 正常）。

### `grep -c ... || echo 0` 会输出两个 0

```bash
grep -c 'Failed' log   # 无匹配时输出 "0" 且退出码 1
                       # 于是 || echo 0 又追加一个 "0" → "0\n0" != "0" → 误判
```
正确写法：`grep -q 'Failed' log; echo $?`。这个 bug 让一次构建白等 10 分钟。

### PowerShell 会吃掉 shell 语法

`$(date)`、`$host`、`&&`、`||`、`awk '{print $1}'` 在 PowerShell 里都会被改写或报错。**复杂命令一律用 paramiko 执行，不要用 `ssh "..."`。**

### 其他

- `authHeaders()` 返回联合类型时展开进 headers 会触发 TS 报错，需显式标注 `(): Record<string, string>`
- Python 3.14 + passlib 的 bcrypt 后端不兼容，直接用 `bcrypt` 库
- Python 3.14 装不上 pydantic-core 预编译包时，放宽版本约束让 pip 找兼容版本
- 图片不做 OCR，AI 读不到图中文字；扫描版 PDF 无文字层也提取不到

---

## 13. 测试

```bash
cd /root/Projects/ai-quality-portal && source backend/venv/bin/activate
python3 tests/test_quality_tools_v2.py   # 全站回归（含链接爬取），~220 项
python3 tests/test_p1_api.py             # 根因/措施/验证/归档/删除
python3 tests/test_p3_api.py             # 短信/支付/反馈
```

`test_quality_tools_v2.py` 会爬取页面内所有内部链接并逐个验证——曾靠它发现 `/ai-msa` 死链。

最近结果：219 通过 / 2 失败（失败为测试脚本参数不全，非产品缺陷）。

文档：`docs/USER_TESTING_GUIDE.md`（用户测试脚本）、`docs/design-system.md`

---

## 14. 常用运维

```bash
# 服务
systemctl restart aiqp-backend
systemctl is-active aiqp-backend aiqp-frontend aiqp-spc aiqp-msa
systemctl show aiqp-spc -p NRestarts --value    # 检查重启循环

# 前端改动后（顺序很重要）
cd frontend && rm -rf .next && NODE_OPTIONS='--max-old-space-size=1024' nohup npm run build > /tmp/build.log 2>&1 &
# 等 BUILD_ID 出现后：
systemctl stop aiqp-frontend && sleep 3 && pkill -f next-server; sleep 2; systemctl start aiqp-frontend

# 健康检查
curl -s -o /dev/null -w '%{http_code}' https://aidmaic.top/
curl -s https://aidmaic.top/api/v1/auth/sms/status
curl -s https://aidmaic.top/api/v1/billing/payment-status

# 证书
certbot certificates
certbot renew --dry-run

# 磁盘/内存告急时
journalctl --vacuum-size=200M
```

---

## 15. 待办

### 需要外部资源（阻塞中）

| 任务 | 需要什么 |
|---|---|
| 短信上线 | 阿里云 AccessKey + 签名 + 模板 CODE（审核通过后填 `.env` 即生效） |
| 支付上线 | 支付宝/微信商户号 + 密钥，另需补 SDK 调用（`services/payment.py` 已留接口） |
| 用户测试 | 联系 2–3 位质量工程师，脚本见 `docs/USER_TESTING_GUIDE.md` |

### 可直接做

| 优先级 | 任务 |
|---|---|
| 中 | RAG 知识库（FAISS + 质量方法论文档索引） |
| 中 | 多 Agent 架构（Case/RCA/8D Agent + Orchestrator） |
| 中 | Case Memory（相似历史案例推荐） |
| 中 | 数据分析引擎集成（SPC 计算结果写回 Evidence） |
| 低 | PostgreSQL 迁移（当前 SQLite 够用） |
| 低 | 三份需求讨论稿整理为正式 PRD |
| 低 | 图片 OCR（补上 AI 读图能力） |

---

## 16. 本地路径

| 项 | 路径 |
|---|---|
| 主项目 | `C:\Users\elizimi\Projects\ai-quality-portal` |
| SPC | `C:\Users\elizimi\Projects\spc-tool-web` |
| MSA | `C:\Users\elizimi\Projects\msa-tool-web` |
| 工具箱原始 SPA | `C:\Users\elizimi\Projects\quality-toolbox` |
| 加密凭证 | `C:\Users\elizimi\.credentials\` |
| 需求文档 | `C:\Users\elizimi\Projects\ai-quality-portal\docs\` |
