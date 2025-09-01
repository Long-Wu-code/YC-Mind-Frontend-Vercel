# YC Mine - YC 创业公司职位匹配平台

一个基于 AI 的 YC 创业公司职位匹配平台，帮助求职者找到最适合的 YC 创业公司职位。

## 功能特性

- 🤖 智能 AI 助手，提供个性化职位推荐
- 💼 支持简历上传和 LinkedIn 档案分析
- 🎯 精准匹配 YC 创业公司职位
- 📱 响应式设计，支持移动端和桌面端
- 🔐 用户认证和会话管理
- ✨ 可自定义的欢迎消息

## 技术栈

- **前端**: React + TypeScript + Vite
- **样式**: Tailwind CSS
- **AI 集成**: Dify API
- **认证**: Supabase
- **部署**: Vercel

## 快速开始

### 本地开发

1. 克隆项目
```bash
git clone <repository-url>
cd YC-Mind-Frontend-Vercel
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
# 复制环境变量示例文件
cp .env.example .env.local

# 编辑 .env.local 文件，填入你的配置
```

4. 启动开发服务器
```bash
npm run dev
```

### 环境变量配置

创建 `.env.local` 文件并配置以下变量：

```env
# Dify API 配置
VITE_DIFY_BASE_URL=https://api.dify.ai
VITE_DIFY_API_KEY=your_dify_api_key

# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# 欢迎消息配置（可选）
VITE_WELCOME_MESSAGE="自定义的欢迎消息内容..."
```

## 部署到 Vercel

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署步骤

1. 连接 GitHub 仓库到 Vercel
2. 在 Vercel Dashboard 中配置环境变量
3. 部署应用

## 欢迎消息自定义

应用支持通过环境变量 `VITE_WELCOME_MESSAGE` 自定义 AI 助手的欢迎消息。

### 默认欢迎消息

如果未设置环境变量，将显示默认的求职指导消息，包含：
- 职位申请指南
- 信息收集要求（职位、地点、薪资、签证需求等）
- 具体示例

### 自定义消息

在环境变量中设置 `VITE_WELCOME_MESSAGE`，支持：
- 多行文本（使用 `\n` 表示换行）
- Markdown 格式
- 动态内容

## 项目结构

```
src/
├── components/          # React 组件
│   ├── ChatArea.tsx    # 聊天区域（包含欢迎消息）
│   ├── ChatInput.tsx   # 聊天输入
│   └── ...
├── config/             # 配置文件
│   ├── messages.ts     # 消息配置
│   ├── dify.ts        # Dify API 配置
│   └── supabase.ts    # Supabase 配置
├── hooks/              # 自定义 Hooks
├── services/           # API 服务
└── types/              # TypeScript 类型定义
```

## 开发指南

### 修改欢迎消息

1. **通过环境变量**（推荐）：
   - 在 Vercel 中设置 `VITE_WELCOME_MESSAGE`
   - 或在本地 `.env.local` 中设置

2. **修改默认消息**：
   - 编辑 `src/config/messages.ts` 文件
   - 修改 `getWelcomeMessage` 函数的默认返回值

### 添加新功能

1. 在 `src/components/` 中创建新组件
2. 在 `src/types/` 中定义相关类型
3. 在 `src/services/` 中添加 API 调用逻辑

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
