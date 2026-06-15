# 🤖 Agent Learning Hub

> **AI Agent 智能体从入门到精通 — 完整学习路线与实战指南**
>
> 覆盖 2025-2026 最新技术栈 · 27 个章节 · 理论 + 代码实战全覆盖

🌐 **在线阅读**：[https://999-99.github.io/agent-learning-hub/](https://999-99.github.io/agent-learning-hub/)

---

## 🗺️ 学习路线总览

```
🟢 第一阶段：基础入门（1-2 周）
│   ├── 01 编程与 AI 基础
│   ├── 02 提示词工程
│   └── 03 LLM API 调用
│
🟡 第二阶段：核心技能（2-4 周）
│   ├── 04 RAG 检索增强生成
│   ├── 05 Function Calling
│   ├── 06 Agent 架构设计
│   └── 07 记忆机制
│
🟠 第三阶段：框架实战（3-4 周）
│   ├── 08 Agent 框架概览
│   ├── 09 MCP 协议
│   └── 10 Multi-Agent 系统
│
🔴 第四阶段：高级进阶（持续学习）
    ├── 11 安全与对齐
    ├── 12 评估与优化
    └── 13 部署与运维
```

---

## 📖 全部内容导览

### 🟢 第一阶段：基础入门

> 目标：掌握开发 Agent 所需的基础知识和技能

| # | 章节 | 核心内容 | 直达链接 |
|---|------|---------|---------|
| 01 | 编程与 AI 基础 | Python、JS/TS、LLM 原理、API 调用基础 | [阅读 →](docs/guide/01-foundations.md) |
| 02 | 提示词工程 | System Prompt、CoT、Few-shot、ReAct 模式 | [阅读 →](docs/guide/02-prompt-engineering.md) |
| 03 | LLM API 调用 | OpenAI、Claude、DeepSeek、统一封装、Token 管理 | [阅读 →](docs/guide/03-llm-api.md) |

### 🟡 第二阶段：核心技能

> 目标：掌握构建 Agent 的核心技术组件

| # | 章节 | 核心内容 | 直达链接 |
|---|------|---------|---------|
| 04 | RAG 检索增强生成 | Embedding、向量数据库、分块策略、混合检索、Reranking | [阅读 →](docs/guide/04-rag.md) |
| 05 | Function Calling | 工具定义、调用流程、并行调用、Pydantic 工具 | [阅读 →](docs/guide/05-function-calling.md) |
| 06 | Agent 架构设计 | ReAct、Plan-and-Execute、Reflexion、Tool-Use | [阅读 →](docs/guide/06-agent-architecture.md) |
| 07 | 记忆机制 | 短期/长期/工作记忆、向量存储、摘要压缩 | [阅读 →](docs/guide/07-memory.md) |

### 🟠 第三阶段：框架实战

> 目标：熟练使用主流 Agent 框架，理解协议标准

| # | 章节 | 核心内容 | 直达链接 |
|---|------|---------|---------|
| 08 | Agent 框架概览 | 框架对比、选型指南、代码风格对比 | [阅读 →](docs/guide/08-frameworks.md) |
| 09 | MCP 协议 | Server/Client 实现、三大原语、Claude Desktop 集成 | [阅读 →](docs/guide/09-mcp.md) |
| 10 | Multi-Agent 系统 | 顺序/并行/层级/路由模式、CrewAI/LangGraph 实战 | [阅读 →](docs/guide/10-multi-agent.md) |

### 🔴 第四阶段：高级进阶

> 目标：掌握生产级 Agent 系统的关键能力

| # | 章节 | 核心内容 | 直达链接 |
|---|------|---------|---------|
| 11 | 安全与对齐 | Prompt 注入防护、Guardrails、沙箱执行、循环检测 | [阅读 →](docs/guide/11-safety.md) |
| 12 | 评估与优化 | 基准测试、LLM-as-Judge、A/B 测试、可观测性 | [阅读 →](docs/guide/12-evaluation.md) |
| 13 | 部署与运维 | FastAPI 部署、Docker、缓存策略、成本优化、监控 | [阅读 →](docs/guide/13-deployment.md) |

---

## 📦 主流框架详解

> 6 大主流 Agent 框架深度对比与实战

| 框架 | 开发商 | 特点 | 适合场景 | 直达链接 |
|------|--------|------|---------|---------|
| **LangChain / LangGraph** | LangChain | 生态最完善，状态图工作流 | 复杂 Agent 应用 | [阅读 →](docs/frameworks/langchain.md) |
| **OpenAI Agents SDK** | OpenAI | 简洁易用，Handoff 机制 | 快速原型开发 | [阅读 →](docs/frameworks/openai-agents.md) |
| **CrewAI** | CrewAI | 角色扮演，多 Agent 协作 | 团队协作场景 | [阅读 →](docs/frameworks/crewai.md) |
| **AutoGen** | 微软 | 对话驱动，灵活编排 | 研究与实验 | [阅读 →](docs/frameworks/autogen.md) |
| **Google ADK** | Google | Gemini 优化，MCP/A2A 支持 | Google 生态 | [阅读 →](docs/frameworks/google-adk.md) |
| **Dify / Coze** | 开源 / 字节 | 低代码，可视化编排 | 快速搭建 | [阅读 →](docs/frameworks/dify-coze.md) |

📊 框架对比总览：[阅读 →](docs/frameworks/index.md)

---

## 🔬 进阶专题

> 前沿协议与高级技术深入

| 专题 | 核心内容 | 直达链接 |
|------|---------|---------|
| **MCP 协议** | Model Context Protocol、Server 开发、三大原语、官方 Server 列表 | [阅读 →](docs/advanced/mcp.md) |
| **A2A 协议** | Agent-to-Agent Protocol、Agent Card、Task/Message/Artifact | [阅读 →](docs/advanced/a2a.md) |
| **Multi-Agent 协作** | 流水线/扇出/层级/路由/辩论模式、状态管理、错误处理 | [阅读 →](docs/advanced/multi-agent.md) |
| **安全与评估** | 威胁分类、Guardrails、权限控制、评估体系、可观测性 | [阅读 →](docs/advanced/safety.md) |

---

## 📚 学习资源

> 精选课程、文档、社区和工具

[查看完整资源汇总 →](docs/resources/index.md)

### 🔥 推荐免费课程（DeepLearning.AI）

| 课程 | 合作方 | 链接 |
|------|--------|------|
| AI Agents in LangGraph | LangChain | [deeplearning.ai](https://www.deeplearning.ai/short-courses/) |
| Multi-AI Agent Systems with crewAI | CrewAI | [deeplearning.ai](https://www.deeplearning.ai/short-courses/) |
| AI Agentic Design Patterns with AutoGen | 微软 | [deeplearning.ai](https://www.deeplearning.ai/short-courses/) |
| Building Agentic RAG with LlamaIndex | LlamaIndex | [deeplearning.ai](https://www.deeplearning.ai/short-courses/) |

### 📡 官方文档速查

| 文档 | 链接 |
|------|------|
| MCP 协议 | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| A2A 协议 | [github.com/google/A2A](https://github.com/google/A2A) |
| LangChain | [python.langchain.com](https://python.langchain.com) |
| OpenAI Agents SDK | [openai.github.io/openai-agents-python](https://openai.github.io/openai-agents-python/) |
| CrewAI | [docs.crewai.com](https://docs.crewai.com) |
| AutoGen | [microsoft.github.io/autogen](https://microsoft.github.io/autogen/) |
| Google ADK | [google.github.io/adk-docs](https://google.github.io/adk-docs/) |
| Dify | [docs.dify.ai](https://docs.dify.ai) |

---

## 💡 建议学习方式

```
方式一：GitHub 直接学习（推荐）
  点击上方链接，直接在 GitHub 上阅读 Markdown 文件
  遇到代码示例可以复制到本地运行

方式二：在线网站学习
  访问 https://999-99.github.io/agent-learning-hub/
  有更好的排版和搜索功能

方式三：本地运行
  git clone https://github.com/999-99/agent-learning-hub.git
  cd agent-learning-hub
  npm install
  npm run docs:dev
```

---

## ⏱️ 学习时间建议

| 阶段 | 建议时间 | 前置要求 |
|------|---------|---------|
| 🟢 基础入门 | 1-2 周 | 无（有编程基础更佳） |
| 🟡 核心技能 | 2-4 周 | 完成第一阶段 |
| 🟠 框架实战 | 3-4 周 | 完成第二阶段 |
| 🔴 高级进阶 | 持续学习 | 完成第三阶段 |

::: tip 💡 学习建议
- **边学边做**：每学一个知识点，立刻动手写代码实践
- **选一个框架深入**：先精通一个框架，再横向扩展
- **构建个人项目**：把学到的知识应用到实际项目中
:::

---

## 📝 License

MIT
