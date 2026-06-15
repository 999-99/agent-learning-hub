# Multi-Agent 协作深入

> 多智能体系统的高级模式和最佳实践

## 协作模式详解

### 1. 顺序流水线（Sequential Pipeline）

最简单的多 Agent 模式，适合有明确先后顺序的任务。

```python
async def sequential_pipeline(task: str) -> str:
    # Agent 1: 分析任务
    analysis = await analyst.run(f"分析任务: {task}")
    
    # Agent 2: 执行任务（基于分析结果）
    execution = await executor.run(f"基于分析执行: {analysis}")
    
    # Agent 3: 验证结果（基于执行结果）
    verification = await verifier.run(f"验证结果: {execution}")
    
    return verification
```

**适用场景：**
- 内容创作（研究→写作→审核）
- 数据处理（收集→清洗→分析）
- 代码开发（设计→编码→测试）

### 2. 并行扇出（Parallel Fan-out）

同时执行多个独立任务，然后汇总结果。

```python
import asyncio

async def parallel_fanout(task: str) -> str:
    # 并行执行多个任务
    results = await asyncio.gather(
        researcher.run(f"研究背景: {task}"),
        data_collector.run(f"收集数据: {task}"),
        expert_consultant.run(f"专家意见: {task}")
    )
    
    # 汇总结果
    synthesis = await synthesizer.run(
        f"综合以下信息:\n" + "\n---\n".join(results)
    )
    return synthesis
```

**适用场景：**
- 多维度分析
- 多源数据收集
- 并行验证

### 3. 层级管理（Hierarchical Supervisor）

Supervisor 管理多个 Worker Agent，负责任务分配和结果整合。

```python
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor

# Worker Agents
researcher = create_react_agent(
    model=model,
    tools=[search_tool],
    name="researcher",
    prompt="你是研究员"
)

writer = create_react_agent(
    model=model,
    tools=[write_tool],
    name="writer",
    prompt="你是作家"
)

reviewer = create_react_agent(
    model=model,
    tools=[],
    name="reviewer",
    prompt="你是审核员"
)

# Supervisor
supervisor = create_supervisor(
    agents=[researcher, writer, reviewer],
    model=model,
    prompt="""你是主管，负责协调团队完成任务：
1. 先让研究员搜集信息
2. 然后让作家撰写文章
3. 最后让审核员审核"""
)

app = supervisor.compile()
```

### 4. 动态路由（Dynamic Routing）

根据任务内容动态选择合适的 Agent。

```python
from agents import Agent, Runner

# 专业 Agent
billing_agent = Agent(
    name="Billing",
    instructions="处理账单问题"
)

technical_agent = Agent(
    name="Technical",
    instructions="处理技术问题"
)

sales_agent = Agent(
    name="Sales",
    instructions="处理销售咨询"
)

# 路由 Agent
router = Agent(
    name="Router",
    instructions="""根据用户问题分配：
- 账单/支付 → Billing
- 技术/故障 → Technical
- 购买/价格 → Sales""",
    handoffs=[billing_agent, technical_agent, sales_agent]
)

# 运行
result = Runner.run_sync(router, user_message)
```

### 5. 辩论模式（Debate）

多个 Agent 从不同角度辩论，得出更全面的结论。

```python
async def debate(topic: str, rounds: int = 3) -> str:
    # 正方
    pro = await pro_agent.run(f"支持观点: {topic}")
    # 反方
    con = await con_agent.run(f"反对观点: {topic}")
    
    for _ in range(rounds):
        # 正方反驳
        pro = await pro_agent.run(f"反驳对方: {con}")
        # 反方反驳
        con = await con_agent.run(f"反驳对方: {pro}")
    
    # 裁判总结
    verdict = await judge.run(
        f"正方观点: {pro}\n反方观点: {con}\n请给出综合结论"
    )
    return verdict
```

---

## 状态管理

### 共享状态

```python
from typing import TypedDict
from langgraph.graph import StateGraph

class AgentState(TypedDict):
    messages: list
    current_agent: str
    task_status: str
    intermediate_results: dict

def agent_a(state: AgentState) -> AgentState:
    # 读取状态
    task = state["messages"][-1]
    
    # 执行任务
    result = do_work(task)
    
    # 更新状态
    return {
        **state,
        "intermediate_results": {**state["intermediate_results"], "agent_a": result},
        "current_agent": "agent_b"
    }

def agent_b(state: AgentState) -> AgentState:
    # 读取其他 Agent 的结果
    prev_result = state["intermediate_results"].get("agent_a")
    
    # 基于前一个结果继续工作
    result = do_more_work(prev_result)
    
    return {
        **state,
        "intermediate_results": {**state["intermediate_results"], "agent_b": result},
        "task_status": "completed"
    }
```

### 状态图编排

```python
from langgraph.graph import StateGraph, START, END

# 构建状态图
graph = StateGraph(AgentState)

# 添加节点
graph.add_node("agent_a", agent_a)
graph.add_node("agent_b", agent_b)
graph.add_node("agent_c", agent_c)

# 定义边
graph.add_edge(START, "agent_a")
graph.add_conditional_edges(
    "agent_a",
    lambda state: "agent_b" if state["needs_more_work"] else "agent_c"
)
graph.add_edge("agent_b", "agent_c")
graph.add_edge("agent_c", END)

# 编译运行
app = graph.compile()
result = app.invoke(initial_state)
```

---

## 错误处理与容错

### 重试机制

```python
async def resilient_agent_call(agent, task, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = await agent.run(task)
            return result
        except Exception as e:
            if attempt == max_retries - 1:
                # 最后一次尝试失败，使用备选方案
                return await fallback_agent.run(task)
            await asyncio.sleep(2 ** attempt)  # 指数退避
```

### 超时控制

```python
import asyncio

async def run_with_timeout(agent, task, timeout_seconds=30):
    try:
        result = await asyncio.wait_for(
            agent.run(task),
            timeout=timeout_seconds
        )
        return result
    except asyncio.TimeoutError:
        return "任务超时，请稍后重试"
```

### 降级策略

```python
async def run_with_fallback(primary_agent, fallback_agent, task):
    try:
        result = await primary_agent.run(task)
        # 验证结果质量
        if is_valid_result(result):
            return result
    except Exception:
        pass
    
    # 降级到备选 Agent
    return await fallback_agent.run(task)
```

---

## 最佳实践

### 1. 明确角色定义

```python
# ❌ 角色模糊
agent1 = Agent(role="助手")
agent2 = Agent(role="助手")

# ✅ 角色明确
researcher = Agent(
    role="研究员",
    goal="搜集准确信息",
    backstory="资深研究员，擅长信息验证",
    tools=[search, database]
)
writer = Agent(
    role="作家",
    goal="撰写清晰文章",
    backstory="技术写作专家",
    tools=[write_file]
)
```

### 2. 清晰的通信协议

```python
@dataclass
class AgentMessage:
    sender: str
    receiver: str
    content: str
    message_type: Literal["request", "response", "feedback"]
    metadata: dict = None
```

### 3. 避免循环依赖

```python
# 使用有向无环图（DAG）定义依赖
dependencies = {
    "researcher": [],
    "writer": ["researcher"],
    "reviewer": ["writer"],
    "publisher": ["reviewer"]
}
```

### 4. 监控和日志

```python
class AgentMonitor:
    def log_execution(self, agent_name, task, result, duration):
        logger.info(f"Agent: {agent_name}, Task: {task[:50]}, Duration: {duration}ms")
```

---

## 学习资源

| 资源 | 链接 |
|------|------|
| LangGraph Multi-Agent | [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph/) |
| CrewAI Docs | [docs.crewai.com](https://docs.crewai.com) |
| AutoGen Docs | [microsoft.github.io/autogen](https://microsoft.github.io/autogen/) |
