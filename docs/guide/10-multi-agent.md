# 10 - Multi-Agent 系统

> 🎯 本章目标：理解多智能体协作的原理和实现方式

## 什么是 Multi-Agent？

Multi-Agent 系统由多个具有不同角色和能力的 Agent 组成，通过协作完成复杂任务。

```
单 Agent：一个 Agent 做所有事
Multi-Agent：多个专精 Agent 分工协作

┌─────────────────────────────────────────────┐
│            Multi-Agent 协作                  │
│                                             │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│   │ 研究员   │  │ 编辑    │  │ 审核员   │   │
│   │ Agent   │→│ Agent   │→│ Agent   │   │
│   └─────────┘  └─────────┘  └─────────┘   │
│       ↓              ↓            ↓        │
│   搜集资料      撰写文章      审核修改      │
│                                             │
│   最终输出: 经过研究、撰写、审核的高质量文章  │
└─────────────────────────────────────────────┘
```

---

## 协作模式

### 1. 顺序执行（Pipeline）

```
Agent A → Agent B → Agent C → 最终结果
```

```python
# 顺序执行示例
async def pipeline(user_request: str):
    # Agent 1: 研究
    research = await researcher_agent.run(f"研究: {user_request}")
    
    # Agent 2: 写作（基于研究结果）
    article = await writer_agent.run(f"基于以下研究写文章:\n{research}")
    
    # Agent 3: 审核（基于文章）
    final = await reviewer_agent.run(f"审核并改进:\n{article}")
    
    return final
```

### 2. 并行执行（Parallel）

```
       ┌→ Agent A ─┐
任务 ──┤→ Agent B ─├→ 合并结果
       └→ Agent C ─┘
```

```python
import asyncio

async def parallel(user_request: str):
    # 同时执行多个任务
    results = await asyncio.gather(
        research_agent.run(f"研究背景: {user_request}"),
        data_agent.run(f"收集数据: {user_request}"),
        opinion_agent.run(f"收集观点: {user_request}")
    )
    
    # 合并结果
    combined = await synthesizer_agent.run(
        f"综合以下信息:\n" + "\n".join(results)
    )
    return combined
```

### 3. 层级管理（Supervisor）

```
              ┌──────────┐
              │ Supervisor│
              │  Agent    │
              └────┬─────┘
         ┌────────┼────────┐
         ↓        ↓        ↓
    ┌────────┐ ┌────────┐ ┌────────┐
    │Worker 1│ │Worker 2│ │Worker 3│
    └────────┘ └────────┘ └────────┘
```

```python
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor

# 创建 Worker Agent
researcher = create_react_agent(
    model=model,
    tools=[search_tool],
    name="researcher",
    prompt="你是研究员，负责搜索和整理信息"
)

writer = create_react_agent(
    model=model,
    tools=[write_tool],
    name="writer",
    prompt="你是作家，负责撰写文章"
)

# 创建 Supervisor
supervisor = create_supervisor(
    agents=[researcher, writer],
    model=model,
    prompt="你是主管，负责协调研究员和作家完成任务"
)

# 编译并运行
app = supervisor.compile()
result = app.invoke({"messages": [{"role": "user", "content": "写一篇关于AI Agent的文章"}]})
```

### 4. 动态路由（Handoff）

```
用户消息 → 路由 Agent → 选择合适的 Agent → 执行 → 返回或转交
```

```python
# OpenAI Agents SDK 的 Handoff 模式
from agents import Agent, Runner

triage_agent = Agent(
    name="分诊台",
    instructions="你是一个分诊台，根据用户问题分配给合适的专家",
    handoffs=[billing_agent, technical_agent, general_agent]
)

# 运行
result = Runner.run_sync(triage_agent, "我的账单有问题")
```

---

## 使用 CrewAI 实现 Multi-Agent

```python
from crewai import Agent, Task, Crew

# 定义 Agent
researcher = Agent(
    role="资深研究员",
    goal="搜集和分析最新信息",
    backstory="""你是一位经验丰富的研究员，擅长从各种来源
    获取和整理信息，确保数据的准确性和时效性。""",
    tools=[search_tool],
    verbose=True
)

writer = Agent(
    role="技术作家",
    goal="撰写清晰易懂的技术文章",
    backstory="""你是一位技术写作专家，能够将复杂的概念
    用简单易懂的语言解释清楚。""",
    verbose=True
)

editor = Agent(
    role="编辑",
    goal="确保文章质量",
    backstory="""你是一位严格的编辑，关注文章的逻辑性、
    准确性和可读性。""",
    verbose=True
)

# 定义 Task
research_task = Task(
    description="研究 AI Agent 的最新发展趋势",
    expected_output="详细的研究报告，包含关键趋势和数据",
    agent=researcher
)

writing_task = Task(
    description="基于研究报告撰写一篇技术博客",
    expected_output="一篇 2000 字左右的技术博客文章",
    agent=writer,
    context=[research_task]
)

editing_task = Task(
    description="审核并改进文章质量",
    expected_output="最终版本的文章",
    agent=editor,
    context=[writing_task]
)

# 创建 Crew
crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research_task, writing_task, editing_task],
    verbose=True
)

# 执行
result = crew.kickoff()
print(result)
```

---

## 使用 LangGraph 实现 Multi-Agent

```python
from langgraph.graph import StateGraph, MessagesState, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

model = ChatOpenAI(model="gpt-4o")

# 定义节点函数
def researcher(state: MessagesState):
    messages = state["messages"]
    response = model.invoke([
        {"role": "system", "content": "你是研究员，负责搜索和整理信息"},
        *messages
    ])
    return {"messages": [response]}

def writer(state: MessagesState):
    messages = state["messages"]
    response = model.invoke([
        {"role": "system", "content": "你是作家，基于研究结果撰写文章"},
        *messages
    ])
    return {"messages": [response]}

def reviewer(state: MessagesState):
    messages = state["messages"]
    response = model.invoke([
        {"role": "system", "content": "你是审核员，审核并改进文章"},
        *messages
    ])
    return {"messages": [response]}

# 构建图
graph = StateGraph(MessagesState)
graph.add_node("researcher", researcher)
graph.add_node("writer", writer)
graph.add_node("reviewer", reviewer)

graph.add_edge(START, "researcher")
graph.add_edge("researcher", "writer")
graph.add_edge("writer", "reviewer")
graph.add_edge("reviewer", END)

# 编译并运行
app = graph.compile()
result = app.invoke({"messages": [HumanMessage(content="写一篇关于MCP协议的文章")]})
```

---

## Multi-Agent 设计原则

### 1. 明确角色分工

```python
# ❌ 角色模糊
agent1 = Agent(role="助手")
agent2 = Agent(role="助手")

# ✅ 角色明确
researcher = Agent(
    role="研究员",
    goal="搜集准确、全面的信息",
    tools=[search, database_query]
)
writer = Agent(
    role="作家",
    goal="将信息转化为易懂的文字",
    tools=[write_file]
)
```

### 2. 清晰的通信协议

```python
# 定义 Agent 间的消息格式
@dataclass
class AgentMessage:
    sender: str
    receiver: str
    content: str
    message_type: Literal["request", "response", "feedback"]
    metadata: dict = None
```

### 3. 错误处理和重试

```python
async def safe_agent_call(agent, task, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = await agent.run(task)
            return result
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            print(f"重试 {attempt + 1}/{max_retries}: {e}")
```

---

## ✅ 本章检查清单

- [ ] 理解 Multi-Agent 的协作模式
- [ ] 掌握顺序、并行、层级、路由四种模式
- [ ] 能够使用 CrewAI 实现多 Agent 协作
- [ ] 能够使用 LangGraph 构建 Agent 工作流
- [ ] 理解 Multi-Agent 的设计原则

::: tip ➡️ 下一步
接下来学习 [安全与对齐](/guide/11-safety)。
:::
