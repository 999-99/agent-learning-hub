# 08 - Agent 框架概览

> 🎯 本章目标：了解主流 Agent 框架的特点和适用场景，为框架选型提供参考

## 2025-2026 主流框架全景

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent 框架生态                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  通用框架                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ LangChain    │  │ OpenAI       │  │ LlamaIndex   │          │
│  │ LangGraph    │  │ Agents SDK   │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  多 Agent 框架                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ CrewAI       │  │ AutoGen      │  │ Google ADK   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  低代码平台                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Dify         │  │ Coze         │  │ 百度千帆      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  协议标准                                                        │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ MCP          │  │ A2A          │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 框架对比总表

| 框架 | 开发商 | 语言 | 多Agent | RAG | 工具调用 | 学习曲线 | 适合场景 |
|------|--------|------|---------|-----|---------|---------|---------|
| **LangChain/LangGraph** | LangChain | Python/JS | ✅ | ✅ | ✅ | 中等 | 复杂 Agent 应用 |
| **OpenAI Agents SDK** | OpenAI | Python | ✅ | ❌ | ✅ | 低 | 快速原型 |
| **CrewAI** | CrewAI | Python | ✅ | ✅ | ✅ | 低 | 多角色协作 |
| **AutoGen** | 微软 | Python | ✅ | ✅ | ✅ | 中等 | 研究实验 |
| **Google ADK** | Google | Python | ✅ | ✅ | ✅ | 中等 | Google 生态 |
| **LlamaIndex** | LlamaIndex | Python | ✅ | ✅ | ✅ | 中等 | 数据密集型 |
| **Dify** | 开源 | Python | ✅ | ✅ | ✅ | 低 | 低代码平台 |
| **Coze** | 字节跳动 | - | ✅ | ✅ | ✅ | 极低 | 快速搭建 |

---

## 选型指南

### 按场景选择

```
需要什么？
│
├── 快速原型开发
│   ├── 使用 OpenAI API → OpenAI Agents SDK
│   └── 低代码 → Dify / Coze
│
├── 复杂 Agent 应用
│   ├── 需要精细控制 → LangGraph
│   └── 需要状态管理 → LangGraph
│
├── 多 Agent 协作
│   ├── 角色扮演模式 → CrewAI
│   ├── 对话驱动模式 → AutoGen
│   └── 层级管理模式 → LangGraph
│
├── 数据密集型
│   └── RAG 为主 → LlamaIndex
│
├── 企业级部署
│   ├── 私有化部署 → Dify（开源）
│   └── Google 云 → Google ADK
│
└── 学习研究
    └── 理解原理 → 手写 ReAct Agent
```

### 按团队规模选择

| 团队规模 | 推荐框架 | 理由 |
|---------|---------|------|
| **个人/小团队** | OpenAI Agents SDK / Dify | 上手快，文档好 |
| **中型团队** | LangGraph / CrewAI | 功能完善，社区活跃 |
| **大型团队** | LangGraph + Dify | 灵活性 + 可视化 |
| **研究团队** | AutoGen | 灵活，适合实验 |

---

## 核心概念对比

### Agent 定义方式

```python
# LangChain
from langchain.agents import AgentExecutor, create_tool_calling_agent

agent = create_tool_calling_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools)

# OpenAI Agents SDK
from agents import Agent, Runner

agent = Agent(
    name="Assistant",
    instructions="你是一个有帮助的助手",
    tools=[search, calculate]
)
result = Runner.run_sync(agent, "你好")

# CrewAI
from crewai import Agent, Task, Crew

researcher = Agent(
    role="研究员",
    goal="搜索最新信息",
    backstory="你是一个资深研究员",
    tools=[search_tool]
)

# AutoGen
from autogen import AssistantAgent, UserProxyAgent

assistant = AssistantAgent("assistant", llm_config=config)
user_proxy = UserProxyAgent("user", code_execution_config={"work_dir": "coding"})
```

### 工具定义方式

```python
# LangChain - 装饰器
@tool
def search(query: str) -> str:
    """搜索信息"""
    return "结果"

# OpenAI - 函数定义
def search(query: str) -> str:
    """搜索信息"""
    return "结果"

agent = Agent(tools=[search])

# CrewAI - Tool 类
from crewai_tools import SerperDevTool
search_tool = SerperDevTool()
```

---

## 框架发展趋势

### 2025-2026 关键趋势

1. **协议标准化** — MCP 和 A2A 成为行业标准
2. **多模态 Agent** — 支持图像、音频、视频处理
3. **低代码普及** — Dify、Coze 等平台降低门槛
4. **生产级成熟** — 可观测性、安全性、可靠性提升
5. **模型无关性** — 框架支持多种 LLM 后端

### 学习建议

::: tip 💡 框架学习策略
1. **先学原理**：理解 ReAct、Tool Use 等核心概念
2. **精学一个**：选择一个框架深入学习（推荐 LangGraph）
3. **横向扩展**：了解其他框架的特点和优势
4. **关注协议**：MCP 和 A2A 是未来趋势
:::

---

## ➡️ 深入学习

选择你感兴趣的框架，进入详细学习：

- [LangChain / LangGraph](/frameworks/langchain) — 生态最完善
- [OpenAI Agents SDK](/frameworks/openai-agents) — 最易上手
- [CrewAI](/frameworks/crewai) — 多 Agent 协作
- [AutoGen](/frameworks/autogen) — 研究实验
- [Google ADK](/frameworks/google-adk) — Google 生态
- [Dify / Coze](/frameworks/dify-coze) — 低代码平台
