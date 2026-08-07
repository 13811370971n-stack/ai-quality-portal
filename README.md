# AI Quality Portal

AI赋能质量管理平台 — 将人工智能与六西格玛方法论深度融合。

## 架构

```
ai-quality-portal/
├── frontend/          # React + Next.js (麦肯锡风格UI)
│   ├── src/pages/     # 页面路由
│   ├── src/components/# 组件
│   └── src/styles/    # 全局样式
├── backend/           # Python FastAPI
│   └── app/
│       ├── api/v1/    # REST API endpoints
│       ├── models/    # 数据模型
│       └── services/  # 业务逻辑
└── README.md
```

## 快速启动

### 后端

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:3000

## 页面

| 路由 | 功能 |
|------|------|
| `/` | 首页 - Hero + 价值主张 |
| `/tools` | AI工具集 - SPC/MSA等工具卡片 |
| `/coach` | AI教练 - 六西格玛对话界面 |
| `/methodology` | DMAIC方法论 - 5阶段 + AI增强 |
| `/about` | 关于平台 |

## API 接口

| 端点 | 功能 |
|------|------|
| `GET /api/v1/tools/` | 列出所有AI工具 |
| `GET /api/v1/tools/{id}` | 获取工具详情 |
| `POST /api/v1/coach/chat` | AI教练对话 |
| `GET /api/v1/coach/capabilities` | AI教练能力列表 |
| `GET /api/v1/methodology/dmaic` | DMAIC所有阶段 |
| `GET /api/v1/methodology/dmaic/{id}` | 单个阶段详情 |

## 设计风格

- 配色: 深蓝(#051C2C) + 白 + 金(#C5A572) + 青(#00A0AF)
- 字体: Inter
- 风格: 麦肯锡咨询风 — 大量留白、数据驱动、卡片化布局
