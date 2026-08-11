---
name: mckinsey-web-design-system
description: 麦肯锡风格网页设计系统 — 配色、字体、组件类、布局模式、动画。可复用于任何专业展示型网站项目。
---

# McKinsey-Style Web Design System

可复用的麦肯锡咨询风格设计规范，适用于 React + Tailwind CSS 项目。

---

## 配色方案

| Token | Hex | 用途 |
|-------|-----|------|
| `navy` | `#051C2C` | 主色调 — 标题、导航、Hero背景、CTA按钮 |
| `blue` | `#0C2E4E` | 深色悬停态 |
| `steel` | `#1E3A5F` | 次级深色 |
| `teal` | `#00A0AF` | 强调色 — 链接、高亮、AI相关标记 |
| `gold` | `#C5A572` | 装饰性点缀 — accent bar、数据高亮、标签 |
| `light` | `#F5F7FA` | 浅色背景区域 |
| `muted` | `#8B9DAF` | 次级文字、描述文本 |
| `border` | `#E2E8F0` | 边框、分割线 |
| `white` | `#FFFFFF` | 卡片背景、主内容区 |

### Tailwind 配置

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'mckinsey': {
        'navy': '#051C2C',
        'blue': '#0C2E4E',
        'steel': '#1E3A5F',
        'teal': '#00A0AF',
        'gold': '#C5A572',
        'light': '#F5F7FA',
        'muted': '#8B9DAF',
        'border': '#E2E8F0',
      },
    },
  },
}
```

---

## 字体

```javascript
fontFamily: {
  'sans': ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  'display': ['Inter', 'SF Pro Display', 'sans-serif'],
  'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
}
```

### 引入 (HTML head)

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
```

### 字重使用规则

| 场景 | 字重 | Class |
|------|------|-------|
| 大标题 (H1) | 700-800 | `font-bold` / `font-extrabold` |
| 小标题 (H2-H3) | 600 | `font-semibold` |
| 正文强调 | 500 | `font-medium` |
| 正文 | 400 | `font-normal` |
| 辅助文字 | 300-400 | `font-light` / `font-normal` |

---

## 全局样式 (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { scroll-behavior: smooth; }
  body { @apply bg-white text-mckinsey-navy antialiased; }
  h1, h2, h3, h4, h5, h6 { @apply font-display tracking-tight; }
}

@layer components {
  /* 区块间距 */
  .section { @apply py-20 px-6 lg:px-16; }

  /* 卡片 */
  .card {
    @apply bg-white rounded-xl border border-mckinsey-border 
           shadow-sm hover:shadow-md transition-shadow duration-300 p-8;
  }

  /* 金色装饰条 (用于标题上方) */
  .accent-bar { @apply w-12 h-1 bg-mckinsey-gold rounded-full; }

  /* 导航链接 */
  .nav-link {
    @apply text-sm font-medium text-mckinsey-muted 
           hover:text-mckinsey-navy transition-colors duration-200;
  }
  .nav-link-active {
    @apply text-mckinsey-navy border-b-2 border-mckinsey-gold pb-1;
  }

  /* 按钮 */
  .btn-primary {
    @apply px-6 py-3 bg-mckinsey-navy text-white font-medium 
           rounded-lg hover:bg-mckinsey-blue transition-colors duration-200 text-sm;
  }
  .btn-secondary {
    @apply px-6 py-3 border border-mckinsey-navy text-mckinsey-navy 
           font-medium rounded-lg hover:bg-mckinsey-light transition-colors duration-200 text-sm;
  }

  /* 状态标签 */
  .badge-active { @apply px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full; }
  .badge-coming-soon { @apply px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full; }
  .badge-beta { @apply px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full; }
}
```

---

## 布局模式

### 页面结构

```
┌──────────────────────────────────────────┐
│  Navbar (sticky, 白底, 毛玻璃效果)         │
├──────────────────────────────────────────┤
│  Hero Section (深蓝背景, 大标题)           │
├──────────────────────────────────────────┤
│  Content Sections (交替白/浅灰背景)        │
├──────────────────────────────────────────┤
│  Footer (深蓝背景)                        │
└──────────────────────────────────────────┘
```

### Navbar

```tsx
<header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-mckinsey-border">
  <nav className="max-w-7xl mx-auto px-6 lg:px-16 h-16 flex items-center justify-between">
    {/* Logo + Nav items */}
  </nav>
</header>
```

### Hero Section

```tsx
<section className="relative bg-mckinsey-navy text-white overflow-hidden">
  {/* 点阵背景 */}
  <div className="absolute inset-0 opacity-5">
    <div className="absolute inset-0" style={{
      backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
      backgroundSize: '40px 40px',
    }} />
  </div>
  
  <div className="relative max-w-7xl mx-auto px-6 lg:px-16 py-24 lg:py-32">
    <div className="accent-bar bg-mckinsey-gold mb-8" />
    <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
      主标题<br /><span className="text-mckinsey-teal">强调词</span>
    </h1>
    <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-2xl">描述文案</p>
    <div className="flex flex-wrap gap-4">
      <a className="btn-primary bg-mckinsey-teal">主按钮</a>
      <a className="btn-secondary border-white/30 text-white hover:bg-white/10">次按钮</a>
    </div>
  </div>
</section>
```

### Content Section (标准)

```tsx
<section className="section bg-mckinsey-light"> {/* 或 bg-white */}
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-16">
      <div className="accent-bar mx-auto mb-6" />
      <h2 className="text-3xl lg:text-4xl font-bold text-mckinsey-navy mb-4">标题</h2>
      <p className="text-mckinsey-muted max-w-2xl mx-auto">副标题描述</p>
    </div>
    {/* 内容: cards grid / list / etc */}
  </div>
</section>
```

### 卡片网格

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div className="card">
    <h3 className="text-lg font-semibold text-mckinsey-navy">标题</h3>
    <p className="text-mckinsey-muted text-sm mt-2">描述</p>
  </div>
</div>
```

### 列表卡片 (带左边框颜色)

```tsx
<div className="card border-l-4 border-l-mckinsey-teal hover:translate-x-1 transition-transform">
  <h3 className="text-xl font-semibold text-mckinsey-navy">标题</h3>
  <p className="text-sm text-mckinsey-teal font-medium mt-1">副标题</p>
  <p className="text-mckinsey-muted mt-2">描述</p>
</div>
```

---

## 动画

### Tailwind 配置

```javascript
animation: {
  'fade-in': 'fadeIn 0.6s ease-out',
  'slide-up': 'slideUp 0.6s ease-out',
  'slide-in-right': 'slideInRight 0.4s ease-out',
},
keyframes: {
  fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
  slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
  slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
},
```

### Framer Motion 常用模式

```tsx
// 单元素淡入上移
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
>

// 列表交错动画
const stagger = {
  initial: {},
  animate: { transition: { staggerChildren: 0.15 } },
};
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

<motion.div variants={stagger} initial="initial" whileInView="animate" viewport={{ once: true }}>
  {items.map(item => (
    <motion.div key={item.id} variants={fadeInUp}>...</motion.div>
  ))}
</motion.div>

// 滚动触发动画
<motion.div
  initial={{ opacity: 0, x: -20 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true }}
  transition={{ delay: i * 0.1 }}
>
```

---

## 组件模板

### Stats Bar (Hero底部数据条)

```tsx
<div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 pt-12 border-t border-white/10">
  {[
    { value: '5+', label: 'AI工具' },
    { value: '24/7', label: '在线服务' },
  ].map((stat) => (
    <div key={stat.label}>
      <div className="text-2xl lg:text-3xl font-bold text-mckinsey-gold">{stat.value}</div>
      <div className="text-sm text-white/50 mt-1">{stat.label}</div>
    </div>
  ))}
</div>
```

### 筛选标签组

```tsx
<div className="flex flex-wrap gap-3 mb-10">
  {categories.map((cat) => (
    <button
      key={cat}
      onClick={() => setFilter(cat)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        filter === cat
          ? 'bg-mckinsey-navy text-white'
          : 'bg-mckinsey-light text-mckinsey-muted hover:text-mckinsey-navy'
      }`}
    >
      {cat}
    </button>
  ))}
</div>
```

### 阶段切换器 (圆形按钮 + 连接线)

```tsx
<div className="flex items-center gap-2 lg:gap-4">
  {phases.map((phase, i) => (
    <div key={phase.id} className="flex items-center">
      <button
        onClick={() => setActive(phase.id)}
        className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center
                   font-bold text-lg transition-all duration-300
                   ${active === phase.id
                     ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white scale-110 shadow-lg'
                     : 'bg-mckinsey-light text-mckinsey-muted hover:bg-mckinsey-border'
                   }`}
      >
        {phase.icon}
      </button>
      {i < phases.length - 1 && <div className="w-6 lg:w-12 h-0.5 bg-mckinsey-border mx-1" />}
    </div>
  ))}
</div>
```

### Footer

```tsx
<footer className="bg-mckinsey-navy text-white/70 py-12 px-6 lg:px-16">
  <div className="max-w-7xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* 3列: 品牌介绍 | 快速链接 | 技术信息 */}
    </div>
    <div className="mt-12 pt-8 border-t border-white/10 text-center text-sm">
      <p>© 2026 Your Brand. Built with intelligence.</p>
    </div>
  </div>
</footer>
```

---

## 设计原则

1. **大量留白** — section 间距 `py-20`，内容区域 `max-w-7xl`
2. **层次分明** — 用 navy/muted/border 三级灰度区分信息层级
3. **克制用色** — 彩色只用于强调 (teal=AI相关, gold=装饰, emerald=成功)
4. **微交互** — hover 时 `shadow-md` + `translate-x-1`，不过度动画
5. **数据驱动** — 数字用 `text-mckinsey-gold font-bold text-3xl` 突出
6. **一致性** — 每个区块标题前都有 `accent-bar`，统一节奏感

---

## 快速复用步骤

1. 复制 `tailwind.config.js` 中的 colors + fontFamily + animation 配置
2. 复制 `globals.css` 中的 `@layer components` 部分
3. 引入 Inter 字体 (`_document.tsx` 或 HTML head)
4. 安装依赖: `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`
5. 按需使用上述组件模板
