# 🗺️ AI Agent 学习路线总览

## 路线全景

本学习路线分为 **四个阶段**，从零基础到高级进阶，覆盖 AI Agent 开发的完整技术栈。

```
🟢 第一阶段：基础入门（1-2周）
│   ├── 编程与 AI 基础
│   ├── 提示词工程（Prompt Engineering）
│   └── LLM API 调用
│
🟡 第二阶段：核心技能（2-4周）
│   ├── RAG 检索增强生成
│   ├── Function Calling / Tool Use
│   ├── Agent 架构设计（ReAct、Plan-and-Execute）
│   └── 记忆机制（Memory）
│
🟠 第三阶段：框架实战（3-4周）
│   ├── 主流 Agent 框架学习
│   ├── MCP 协议
│   └── Multi-Agent 多智能体系统
│
🔴 第四阶段：高级进阶（持续学习）
    ├── 安全与对齐
    ├── 评估与优化
    └── 部署与运维
```

---

## 🟢 第一阶段：基础入门

> 🎯 目标：掌握开发 Agent 所需的基础知识和技能

### 1.1 编程与 AI 基础

| 技能 | 重要程度 | 说明 |
|------|---------|------|
| **Python** | ⭐⭐⭐⭐⭐ | Agent 开发的首选语言，必须熟练掌握 |
| **JavaScript/TypeScript** | ⭐⭐⭐⭐ | 前端 Agent 应用、MCP Server 开发 |
| **AI/ML 基础概念** | ⭐⭐⭐⭐ | 理解 Transformer、GPT、Embedding 等核心概念 |
| **API 调用** | ⭐⭐⭐⭐⭐ | HTTP 请求、REST API、JSON 数据处理 |

👉 [开始学习：编程与 AI 基础](/guide/01-foundations)

### 1.2 提示词工程（Prompt Engineering）

| 技能 | 重要程度 | 说明 |
|------|---------|------|
| **基础提示词** | ⭐⭐⭐⭐⭐ | 角色设定、指令明确、格式控制 |
| **高级技巧** | ⭐⭐⭐⭐ | CoT、Few-shot、Self-consistency |
| **系统提示词** | ⭐⭐⭐⭐⭐ | Agent 的"灵魂"，决定行为模式 |

👉 [开始学习：提示词工程](/guide/02-prompt-engineering)

### 1.3 LLM API 调用

| 技能 | 重要程度 | 说明 |
|------|---------|------|
| **OpenAI API** | ⭐⭐⭐⭐⭐ | 行业标准，兼容性最广 |
| **Claude API** | ⭐⭐⭐⭐⭐ | Anthropic 出品，Tool Use 能力强 |
| **国产大模型 API** | ⭐⭐⭐⭐ | DeepSeek、Qwen、GLM 等 |

👉 [开始学习：LLM API 调用](/guide/03-llm-api)

---

## 🟡 第二阶段：核心技能

> 🎯 目标：掌握构建 Agent 的核心技术组件

### 2.1 RAG 检索增强生成

RAG 是 Agent 获取外部知识的关键技术，让 LLM 能够访问最新、私有的数据。

```
用户问题 → 向量检索 → 相关文档片段 → LLM 生成回答
```

**核心知识点：**
- Embedding 模型与向量化
- 向量数据库（Chroma、Milvus、Pinecone）
- 文档分块策略（Chunking）
- 检索优化（Reranking、Hybrid Search）

👉 [开始学习：RAG](/guide/04-rag)

### 2.2 Function Calling / Tool Use

让 LLM 能够调用外部工具和 API，是 Agent 的核心能力。

```
LLM 分析需求 → 选择工具 → 生成参数 → 执行调用 → 返回结果 → LLM 总结
```

**核心知识点：**
- 工具定义（JSON Schema）
- 函数调用流程
- 错误处理与重试
- 并行工具调用

👉 [开始学习：Function Calling](/guide/05-function-calling)

### 2.3 Agent 架构设计

Agent 的"大脑"——如何让 LLM 具备自主决策和执行能力。

**主要架构模式：**

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| **ReAct** | 推理-行动循环 | 通用 Agent |
| **Plan-and-Execute** | 先规划再执行 | 复杂任务 |
| **Reflexion** | 自我反思改进 | 需要高质量输出 |
| **Tool-Use Agent** | 纯工具调用 | 明确的工具链 |

👉 [开始学习：Agent 架构](/guide/06-agent-architecture)

### 2.4 记忆机制

让 Agent 具备上下文理解和长期记忆能力。

**记忆类型：**
- **短期记忆** — 对话上下文（Context Window）
- **长期记忆** — 向量存储的历史信息
- **工作记忆** — 当前任务的中间状态
- **情景记忆** — 过往交互的经验总结

👉 [开始学习：记忆机制](/guide/07-memory)

---

## 🟠 第三阶段：框架实战

> 🎯 目标：熟练使用主流 Agent 框架，理解协议标准

### 3.1 主流框架

| 框架 | 开发商 | 特点 | 适合场景 |
|------|--------|------|---------|
| **LangChain / LangGraph** | LangChain | 生态最完善，状态图工作流 | 复杂 Agent 应用 |
| **OpenAI Agents SDK** | OpenAI | 简洁易用，原生支持 | 快速原型开发 |
| **CrewAI** | CrewAI | 角色扮演，多 Agent 协作 | 团队协作场景 |
| **AutoGen** | 微软 | 对话驱动，灵活编排 | 研究与实验 |
| **Google ADK** | Google | Gemini 优化，开放标准 | Google 生态 |
| **Dify / Coze** | 开源/字节 | 低代码，可视化编排 | 快速搭建 |

👉 [查看框架对比详情](/frameworks/)

### 3.2 MCP 协议

Model Context Protocol — Anthropic 推出的标准化工具协议，正在成为行业标准。

**核心概念：**
- MCP Server（工具提供方）
- MCP Client（工具消费方）
- Tools / Resources / Prompts 三大原语

👉 [开始学习：MCP 协议](/guide/09-mcp)

### 3.3 Multi-Agent 系统

多个 Agent 协作完成复杂任务。

**协作模式：**
- **顺序执行** — Pipeline 模式
- **并行执行** — 同时处理多个子任务
- **层级管理** — Supervisor 管理 Worker Agent
- **动态路由** — 根据任务特性动态分配

👉 [开始学习：Multi-Agent](/guide/10-multi-agent)

---

## 🔴 第四阶段：高级进阶

> 🎯 目标：掌握生产级 Agent 系统的关键能力

### 4.1 安全与对齐

- 输入验证与 Guardrails
- 权限控制与沙箱执行
- 内容过滤与安全审查
- 防止 Prompt 注入攻击

### 4.2 评估与优化

- Agent 评测指标设计
- Benchmark 与基准测试
- 迭代优化策略
- A/B 测试与效果衡量

### 4.3 部署与运维

- 可观测性（LangSmith、LangFuse）
- 成本优化与 Token 管理
- 延迟优化
- 生产环境架构设计

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
- **关注社区动态**：AI Agent 领域变化极快，保持对新技术的敏感度
- **构建个人项目**：把学到的知识应用到实际项目中
:::

::: info 📅 技术更新说明
本路线基于 2025-2026 年最新技术动态整理。AI Agent 领域发展迅速，建议定期关注各框架官方文档和技术社区的最新进展。
:::
