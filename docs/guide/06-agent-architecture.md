# 06 - Agent 架构设计

> 🎯 本章目标：理解主流的 Agent 架构模式，掌握构建智能体的设计思路

## 什么是 Agent？

Agent = LLM + 工具 + 记忆 + 决策循环

```
┌─────────────────────────────────────────────────────┐
│                    Agent 核心循环                     │
│                                                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│   │  感知     │ →  │  推理     │ →  │  行动     │     │
│   │ Perceive │    │ Reason   │    │ Act      │     │
│   └──────────┘    └──────────┘    └──────────┘     │
│        ↑                                 │          │
│        └─────────── 观察结果 ─────────────┘          │
│                                                     │
│   LLM 决定 → 调用工具 → 获取结果 → 继续推理或输出    │
└─────────────────────────────────────────────────────┘
```

---

## ReAct 架构

ReAct（Reasoning + Acting）是最经典、最常用的 Agent 架构。

### 核心思想

```
Thought: 分析当前情况，决定下一步
Action: 选择并调用工具
Observation: 获取工具返回的结果
... (循环直到得到最终答案)
Final Answer: 输出最终回答
```

### 实现示例

```python
from openai import OpenAI
import json

client = OpenAI()

# 工具定义
tools_def = [
    {
        "type": "function",
        "function": {
            "name": "search",
            "description": "搜索信息",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "数学计算",
            "parameters": {
                "type": "object",
                "properties": {"expression": {"type": "string"}},
                "required": ["expression"]
            }
        }
    }
]

def search(query: str) -> str:
    return f"搜索结果: {query} 的相关信息..."

def calculator(expression: str) -> str:
    try:
        return str(eval(expression))
    except:
        return "计算错误"

available_tools = {"search": search, "calculator": calculator}

# ReAct Agent
def react_agent(question: str, max_steps: int = 5) -> str:
    system_prompt = """你是一个能使用工具的智能助手。
请根据需要调用工具来回答问题。
如果已经有足够信息，直接给出最终回答。"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": question}
    ]
    
    for step in range(max_steps):
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            tools=tools_def,
            tool_choice="auto"
        )
        
        message = response.choices[0].message
        messages.append(message)
        
        # 如果没有工具调用，说明得到了最终回答
        if not message.tool_calls:
            return message.content
        
        # 执行工具调用
        for tool_call in message.tool_calls:
            func_name = tool_call.function.name
            func_args = json.loads(tool_call.function.arguments)
            
            result = available_tools[func_name](**func_args)
            
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result
            })
    
    return "达到最大步骤数，未能得出结论"

# 使用
answer = react_agent("帮我查一下 2025 年 AI Agent 的市场规模，然后计算比 2024 年增长了多少")
print(answer)
```

---

## Plan-and-Execute 架构

先规划再执行，适合复杂任务。

### 核心思想

```
用户任务 → Planner 生成计划 → Executor 逐步执行 → 汇总结果
```

### 实现示例

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Plan:
    steps: list[str]
    current_step: int = 0

def plan_and_execute(task: str) -> str:
    # 1. 规划阶段
    plan_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": """你是一个任务规划专家。
请将用户的任务分解为可执行的步骤，以 JSON 格式返回：
{"steps": ["步骤1", "步骤2", ...]}"""},
            {"role": "user", "content": task}
        ],
        response_format={"type": "json_object"}
    )
    
    plan = json.loads(plan_response.choices[0].message.content)
    print(f"计划: {plan['steps']}")
    
    # 2. 执行阶段
    results = []
    for i, step in enumerate(plan['steps']):
        print(f"\n执行步骤 {i+1}: {step}")
        
        exec_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"""你正在执行任务计划的第 {i+1} 步。
已完成的步骤结果: {json.dumps(results, ensure_ascii=False)}
请执行当前步骤并返回结果。"""},
                {"role": "user", "content": step}
            ],
            tools=tools_def,
            tool_choice="auto"
        )
        
        result = exec_response.choices[0].message.content
        results.append({"step": step, "result": result})
        print(f"结果: {result}")
    
    # 3. 汇总阶段
    summary_response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "请根据所有步骤的结果，给出最终的总结回答。"},
            {"role": "user", "content": f"任务: {task}\n\n执行结果: {json.dumps(results, ensure_ascii=False)}"}
        ]
    )
    
    return summary_response.choices[0].message.content
```

---

## Reflexion 架构

自我反思和改进，适合需要高质量输出的场景。

### 核心思想

```
执行 → 评估 → 反思 → 改进 → 再执行
```

```python
def reflexion_agent(task: str, max_iterations: int = 3) -> str:
    best_result = None
    
    for iteration in range(max_iterations):
        # 1. 执行
        result = execute_task(task, best_result)
        
        # 2. 评估
        evaluation = evaluate_result(task, result)
        
        # 3. 检查是否满意
        if evaluation["score"] >= 0.8:
            return result
        
        # 4. 反思和改进
        reflection = reflect_on_failure(task, result, evaluation)
        best_result = reflection["improved_approach"]
    
    return best_result

def execute_task(task: str, feedback: str = None) -> str:
    messages = [
        {"role": "system", "content": "执行任务并返回结果"},
        {"role": "user", "content": task}
    ]
    if feedback:
        messages.append({"role": "assistant", "content": f"上次的改进建议: {feedback}"})
    
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    return response.choices[0].message.content

def evaluate_result(task: str, result: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": """评估结果质量，返回 JSON:
{"score": 0-1, "feedback": "具体反馈"}"""},
            {"role": "user", "content": f"任务: {task}\n结果: {result}"}
        ],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)

def reflect_on_failure(task: str, result: str, evaluation: dict) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": """分析失败原因并提出改进方案，返回 JSON:
{"improved_approach": "改进后的方法"}"""},
            {"role": "user", "content": f"任务: {task}\n结果: {result}\n评估: {evaluation}"}
        ],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)
```

---

## Tool-Use Agent 架构

纯工具调用模式，适合明确的工具链场景。

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool

@tool
def lookup_stock(symbol: str) -> str:
    """查询股票价格"""
    return f"{symbol} 当前价格: $150.25"

@tool
def analyze_trend(data: str) -> str:
    """分析趋势"""
    return f"分析结果: 上涨趋势"

llm = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个股票分析助手"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

agent = create_tool_calling_agent(llm, [lookup_stock, analyze_trend], prompt)
executor = AgentExecutor(agent=agent, tools=[lookup_stock, analyze_trend], verbose=True)

result = executor.invoke({"input": "苹果股票怎么样？"})
print(result["output"])
```

---

## 架构对比

| 架构 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **ReAct** | 通用 Agent | 简单灵活 | 可能循环 |
| **Plan-and-Execute** | 复杂任务 | 步骤清晰 | 规划可能不准 |
| **Reflexion** | 高质量输出 | 自我改进 | 多次调用成本高 |
| **Tool-Use** | 明确工具链 | 高效直接 | 不够灵活 |

::: tip 💡 如何选择架构？
- **新手入门**：从 ReAct 开始，理解 Agent 的基本工作原理
- **复杂任务**：使用 Plan-and-Execute，先规划再执行
- **质量要求高**：使用 Reflexion，让 Agent 自我反思改进
- **工具链明确**：使用 Tool-Use Agent，高效直接
:::

---

## ✅ 本章检查清单

- [ ] 理解 Agent 的核心循环（感知-推理-行动）
- [ ] 掌握 ReAct 架构的原理和实现
- [ ] 理解 Plan-and-Execute 的工作方式
- [ ] 了解 Reflexion 的自我改进机制
- [ ] 能够根据场景选择合适的架构

::: tip ➡️ 下一步
接下来学习 [记忆机制](/guide/07-memory)，让 Agent 具备上下文理解和长期记忆能力。
:::
