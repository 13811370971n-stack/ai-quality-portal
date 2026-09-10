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
## 15. Backlog：Case Memory 详细规划

> 2026-09-10 完成设计，**暂不实施**。下次开工可直接照此执行，无需重新设计。
> 规划依据：当日实测 `quality_cases=4`（无 closed）、`case_root_causes`/`case_actions`/
> `case_investigations`/`case_evidences` 全 **0 行**、可用内存 886MB。

### 15.0 为什么先不做

相似案例推荐需要语料，而库里没有任何已闭环案例。更要紧的是 **P1 的根因→措施→验证链路从未被真实数据走通过**——当时只验证了 API 返回 200，四张表至今 0 行。所以阶段 0 是硬前置。

### 15.1 前置技术债（开工前先清）

| 债务 | 问题 | 处理 |
|---|---|---|
| 字段名 | 实际列名是 `case_type`，文档/代码中曾误写 `problem_type` | 统一以 `case_type` 为准 |
| 双写字段 | `quality_cases.root_cause`、`measures`（TEXT）与 `case_root_causes`、`case_actions` 表并存 | 确定规范化表为唯一真源，旧 TEXT 字段标记废弃 |

### 15.2 核心设计前提：相似度不是文本相似度

两个都写「尺寸超差」的案例，若一个是模具磨损、一个是量具校准失效，互相参考价值很低。质量案例的相似性是结构化的，按重要性排序：

1. **失效模式**（最重要）
2. **问题类型** `case_type`（已有字段）
3. **工序 / 产品**（目前无此字段，需新增）
4. **根因类别**（6M）

因此检索前必须有一步**结构化抽取**。

### 15.3 受控失效模式枚举（11 项，需业务确认）

```
尺寸超差 / 外观缺陷 / 功能失效 / 装配不良 / 来料异常
焊接连接不良 / 电气性能异常 / 泄漏 / 强度耐久失效 / 标识包装错误 / 其他
```

⚠ **必须受控，不可让 LLM 自由生成**。否则会出现「尺寸超差 / 尺寸不良 / 尺寸偏差」三个标签，检索直接失效。这与质量体系里缺陷代码必须标准化是同一个道理。抽取结果不在白名单则落 `其他` 并记 log。

### 15.4 五阶段总览

| 阶段 | 内容 | 前提 | 是否依赖真实数据 |
|---|---|---|---|
| **0** | 让 P1 链路跑出真实数据 | 真实案例或用户测试 | 是（硬前置） |
| 1 | 案例卡片 + 标签抽取 | 阶段 0 | 是 |
| 2 | 复发检测（intake） | 阶段 1 | 少量即可（2 个案例就生效） |
| 3 | 相似案例推荐（RCA / 措施） | 约 20+ 闭环案例 | 是 |
| 4 | 内置行业案例库 | 内容撰写 | **否** |
| 5 | 向量检索 | 案例 >500 或实测漏召 | 是 |

阶段 1 有独立价值——案例库可浏览可搜索，不依赖推荐效果。阶段 4 是纯内容工作，随时可做。

---

### 15.5 阶段 1：案例卡片 + 标签抽取

**Input**

- 触发：case 状态进入 `closing`，或用户手动点「归档入库」
- **入库门槛**（不满足不入库，避免垃圾语料）：≥1 个 `status='confirmed'` 根因 且 ≥1 个 `action_type='corrective'` 措施
- 数据来源：

| 表 | 字段 |
|---|---|
| `quality_cases` | title, case_type, problem_statement |
| `case_root_causes` | category, description, cause_chain（仅 confirmed） |
| `case_actions` | action_type, description, effectiveness_check |
| `case_investigations` | question, conclusion |

**Process**

```
1. 结构化装配上下文（按字段拼，不丢原文）
2. DeepSeek 单次调用，JSON 模式输出：
     failure_mode   <- 必须从 15.3 枚举中选
     product_line   <- 从原文摘取，禁止编造
     process_step   <- 同上
     summary_card   <- 固定 5 段：现象/根因/措施/验证结果/教训，<=200 字
     keywords       <- 5-10 个
3. 枚举校验：不在白名单 -> '其他' + 记 log
4. outcome 由效果验证数据判定，**不让 LLM 猜**：
     验证通过   -> verified_effective
     验证未通过 -> ineffective
     无验证数据 -> unknown
5. jieba 分词生成 keywords 检索索引
6. 写入 case_memory
```

**Output**

| 类型 | 内容 |
|---|---|
| 数据 | `case_memory` 一行 |
| 用户可感知 | 闭环后看到案例卡片，**可编辑纠正**（纠正记录本身就是评估数据）；新增 `/cases/library` 案例库页，按失效模式筛选 |
| 验收 | 10 个案例抽取，`failure_mode` 准确率 ≥80%；卡片人工核对无编造内容；越过入库门槛的脏案例 0 条 |

---

### 15.6 阶段 2：复发检测（intake）

**Input**

- 触发：intake 阶段 AI 完成问题定义抽取后、用户确认前
- 输入：problem_statement + case_type + 草稿 failure_mode
- **检索范围：仅 `user_id = 当前用户` 且 `source='user'`**
- 时间窗：默认 12 个月

**Process**

```
1. SQL 召回：failure_mode 相同 OR (case_type 相同 AND keywords 有交集)
2. BM25 打分 —— **不调 LLM**（这里是提醒不是分析，省成本省延迟）
3. 复发等级：
     强复发  failure_mode 同 + product_line 同 + 间隔 <6 月
     疑似    failure_mode 同
4. 仅强复发时调一次 LLM 生成质询语句
```

**Output**

| 类型 | 内容 |
|---|---|
| 数据 | `case_timeline` 记录复发判定 + 用户回答 |
| 用户可感知 | intake 页橙色告警条：「疑似复发 — 案例#23（2026-06），当时措施：更换定位销，效果验证：通过」<br>**强制三选一才能进下一步**：措施未落实 / 措施无效 / 新原因，并填说明 |
| 验收 | 构造 5 组复发案例，检出率 ≥80%，误报 ≤1/5 |

**为什么设计成强制回答**：复发是质量体系最严重的问题，只弹提示用户会直接划过。而这个回答本身就是 8D 的 D0 内容（问题是否重复发生），会自动填入报告——不是额外负担，是把该做的事做了。

这个功能 **2 个案例就能生效**，是最早能见效的部分。

---

### 15.7 阶段 3：相似案例推荐（RCA / 措施）

**Input —— 触发时机是设计核心**

| 触发点 | 时机 | 理由 |
|---|---|---|
| A. RCA Tab | 用户**已确认 ≥1 个根因之后** | 提前展示会让工程师抄答案、跳过调查 |
| B. 措施 Tab | 用户**已录入 ≥1 条措施之后** | 同上 |

检索范围：`user_id = 当前用户的 user 案例` + `全部 builtin 案例`

**Process：三段式**

```
Stage 1  SQL 召回  -> 50 条
  WHERE (user_id = :me OR source='builtin')
    AND (failure_mode = :fm OR case_type = :ct)
    AND case_id != :current

Stage 2  BM25 打分（Python + numpy）  -> Top 10
  查询词 = failure_mode + 已确认根因描述分词
  权重：user 案例            x 1.5   （自己的比通用的相关）
        outcome=ineffective  x 1.3   （失败经验信息量更大）

Stage 3  LLM 重排（DeepSeek 单次）  -> Top 3
  输入：当前案例摘要 + 10 张候选卡片
  输出 JSON：[{memory_id, relevance:1-5, reason, what_to_check}]
  约束：只返回 relevance>=4
        reason 必须指明「哪一点相似」
        what_to_check 必须是一个可执行的核查动作
```

**为什么暂不用向量检索（三个理由）**

1. 可用内存 886MB，已跑 4 个服务；本地 embedding 模型连带 torch 约 1GB，装不下
2. DeepSeek 无 embedding 接口，要用就得引入第二家供应商（多一套凭证和故障点）
3. 案例数 <1000 时，BM25 + LLM 重排与向量检索效果基本持平，且零基础设施

**升级触发条件**：案例数 >500，或实测出现可量化的同义词漏召（「毛刺」vs「披锋」、「混料」vs「错料」）。

**Output**

| 类型 | 内容 |
|---|---|
| 数据 | 推荐记录 + 用户反馈（复用 `feedback` 表） |
| 用户可感知 | **RCA Tab**「历史参考」区块 3 张卡片：案例标题 / 根因 / 为什么相关 / **建议核查什么**<br>**措施 Tab**「类似根因用过的措施」，**红色标注验证无效的措施**<br>每张卡片有「有帮助 / 无帮助」 |
| 验收 | 人工标注 20 组，precision@3 ≥60%；「无帮助」率 <30% |

措施 Tab 的红色标注是整个功能最难被复制的部分——它依赖效果验证数据，而这是现有功能已在产生、竞品拿不到的资产。**失败的措施比成功的措施信息量大得多。**

---

### 15.8 阶段 4：内置案例库（解决冷启动）

**Input**：30–50 个脱敏典型案例，汽车零部件优先，覆盖全部 11 个失效模式。每个含 5 段卡片内容 + failure_mode + 工序 + outcome。

**Process**：CSV/JSON 导入脚本 → `case_memory`，`source='builtin'`，`user_id=NULL`。

**Output**：新用户**第一个案例**就能拿到推荐，不再是空结果。验收：每个失效模式 ≥2 个案例；随机抽 5 个由质量工程师确认「是真实可信的案例」。

⚠ 这是**内容工作不是代码工作**，工作量在撰写质量上，建议业务方主导内容、开发只做导入与格式校验。

---

### 15.9 阶段 5：向量检索（条件触发）

**Input**：`case_memory.summary`；阿里云 `text-embedding-v3`（外部 API，**避开内存约束**，需新增凭证）。

**Process**：闭环时算 embedding 存 `case_memory.embedding` BLOB → 检索时 numpy 算余弦 → 与 BM25 分数用 RRF 融合。**不引入 FAISS 进程**（省内存）。

**Output**：同义词召回改善。验收：precision@3 相对阶段 3 提升 ≥10 个百分点，否则不值得维护。

---

### 15.10 数据模型改动

```sql
ALTER TABLE quality_cases ADD COLUMN failure_mode VARCHAR(50);
ALTER TABLE quality_cases ADD COLUMN product_line VARCHAR(100);
ALTER TABLE quality_cases ADD COLUMN process_step VARCHAR(100);

CREATE TABLE case_memory (
  id         INTEGER PRIMARY KEY,
  case_id    INTEGER,       -- builtin 案例为 NULL
  user_id    INTEGER,       -- 隔离用，builtin 为 NULL
  source     VARCHAR(20),   -- user | builtin
  summary    TEXT,          -- 5 段卡片，<=200 字
  tags       TEXT,          -- JSON: failure_mode / 6M / 工序
  keywords   TEXT,          -- 分词后的检索词
  outcome    VARCHAR(20),   -- verified_effective | ineffective | unknown
  embedding  BLOB,          -- 阶段 5 预留
  created_at DATETIME
);
CREATE INDEX idx_cm_lookup ON case_memory(user_id, source, case_id);
```

### 15.11 API 清单

```
POST   /api/v1/cases/{id}/memory      闭环时生成卡片
PATCH  /api/v1/memory/{id}            用户纠正标签
GET    /api/v1/memory/library         案例库浏览（分页 + 筛选）
POST   /api/v1/cases/{id}/recurrence  复发检测
POST   /api/v1/cases/{id}/similar     相似推荐（scope=rca|action）
POST   /api/v1/memory/{id}/feedback   有帮助 / 无帮助
POST   /api/v1/admin/memory/import    builtin 导入（admin only）
```

⚠ `user_id` 过滤必须在**服务层强制注入**，不做成可选参数——避免将来某个调用点漏传导致跨用户泄露。

### 15.12 隐私边界（必须一开始就定对）

- **用户 A 的案例默认不可推荐给用户 B**。质量案例含产品型号和缺陷信息，属敏感商业数据
- builtin 案例（已脱敏）全员可见
- 企业内共享需要 org 概念，现在没有，**不做**

这个如果做错，后面改不动，且会直接损害商业信任。

### 15.13 锚定偏差：为什么触发时机比算法更重要

若在用户调查之前展示「历史类似问题的根因是 X」，工程师会直接抄，跳过调查。这**直接违背两条产品原则**：「AI 主动分析，人做关键判断」和「8D 是结果不是起点」。

所以时机卡死在用户确认自己的假设**之后**，且文案定位为**挑战**而非答案：

> 「历史上类似问题还出现过这些根因：量具重复性不足（2 例）、来料批次波动（1 例）。你排除了吗？」

这个差别决定了产品是提升工程师能力，还是让工程师退化。

### 15.14 明确不做

- 跨用户 / 跨企业案例共享
- 自动填充根因或措施（只提示，**绝不代填**）
- 在用户提出自己假设之前展示历史根因

### 15.15 风险与应对

| 风险 | 应对 |
|---|---|
| 语料不足导致推荐为空 | 阶段 4 内置库兜底；结果 <2 条时**不显示区块**，而非显示空状态 |
| LLM 抽错 failure_mode | 枚举白名单 + 用户可纠正 |
| 锚定偏差 | 触发时机卡在用户确认后；文案定位为「挑战」 |
| LLM 成本与延迟 | 复发检测不调 LLM；重排候选限 10 条；结果缓存到 case 级 |
| 推荐不准反而干扰 | 反馈按钮 + precision@3 门槛，不达标就不上线该触发点 |

### 15.16 效果如何判断

不能只看「能返回结果」。

- **离线**：人工标注 20 组「A 对 B 有参考价值吗」，量 precision@3
- **在线**：推荐卡片展开率 + 「有帮助 / 无帮助」反馈（复用 `feedback` 表）

没有这一步，无法判断该不该升级到阶段 5 向量检索。

---

## 16. 待办

### 🔴 当前第一优先

| 任务 | 为什么最优先 |
|---|---|
| **用真实案例走通 P1 全流程** | `case_root_causes`/`case_actions`/`case_investigations`/`case_evidences` **全 0 行**，此前只验证了 API 返回 200，业务逻辑（覆盖度校验、Welch t 检验、AI 有效性判断）在真实场景下是否合理**完全未知**。它同时卡住三件事：Case Memory 阶段 0、用户测试可信度、P1 逻辑有效性 |

### 需要外部资源（阻塞中）

| 任务 | 需要什么 |
|---|---|
| 短信上线 | 阿里云 AccessKey + 签名 + 模板 CODE（审核通过后填 `.env` 即生效，零代码改动） |
| 支付上线 | 支付宝/微信商户号 + 密钥，另需补 SDK 调用（`services/payment.py` 已留接口） |
| 用户测试 | 联系 2–3 位质量工程师，脚本见 `docs/USER_TESTING_GUIDE.md` |

### 本次会话新发现（2026-09-10）

| # | 事项 | 严重度 |
|---|---|---|
| 1 | **P1 链路从未被真实数据走通** —— 4 张表 0 行（见上「第一优先」） | 高 |
| 2 | **本地仓库曾落后服务器 3 周** —— 已于本次同步；多会话协作下需定期 `git pull`，否则误覆盖风险累积 | 高 |
| 3 | `case_type` vs `problem_type` 字段名混用 —— 实际列名为 `case_type` | 中 |
| 4 | `quality_cases.root_cause`/`measures`（TEXT）与规范化表并存，存在双写不一致风险 | 中 |
| 5 | DeepSeek API key 是否轮换 —— 曾硬编码进 `services/deepseek.py` 并进入本地 git 历史（**从未公开推送**，已压缩历史清除）。当前代码从环境变量读取 | 中，待决定 |
| 6 | 8080 端口纯 HTTP 备用入口绕过 TLS，HTTPS 已稳定后可在安全组关闭 | 低，待决定 |
| 7 | 测试脚本 5Whys 调用缺 `current_depth` 参数（219 通过 / 2 失败中的 2 项，非产品缺陷） | 低 |
| 8 | 服务器未装 `sqlite3` CLI，查库须用 Python `sqlite3` 模块 | 低 |

### 可直接做

| 优先级 | 任务 | 备注 |
|---|---|---|
| 中 | **Case Memory（相似案例推荐）** | ✅ **已完成详细规划，见第 15 节**，可直接照做。阻塞于阶段 0 真实数据 |
| 中 | RAG 知识库 | ⚠ **原 FAISS 方案需重估** —— 可用内存仅 886MB，与 Case Memory 阶段 3 遇到的是同一约束。建议改为外部 embedding API（如阿里云 `text-embedding-v3`），不引入本地模型与 FAISS 进程 |
| 中 | 多 Agent 架构（Case/RCA/8D Agent + Orchestrator） | |
| 中 | 数据分析引擎集成（SPC 计算结果写回 Evidence） | 目前两侧断开 |
| 低 | PostgreSQL 迁移 | SQLite 当前够用 |
| 低 | 三份需求讨论稿整理为正式 PRD | |
| 低 | 图片 OCR | 现在 AI 读不到图中文字，扫描版 PDF 无文字层也提取不到 |
| 低 | API 文档中文化 | |

---

## 17. 本地路径

| 项 | 路径 |
|---|---|
| 主项目 | `C:\Users\elizimi\Projects\ai-quality-portal` |
| SPC | `C:\Users\elizimi\Projects\spc-tool-web` |
| MSA | `C:\Users\elizimi\Projects\msa-tool-web` |
| 工具箱原始 SPA | `C:\Users\elizimi\Projects\quality-toolbox` |
| 加密凭证 | `C:\Users\elizimi\.credentials\` |
| 需求文档 | `C:\Users\elizimi\Projects\ai-quality-portal\docs\` |
