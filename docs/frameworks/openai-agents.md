# OpenAI Agents SDK

> 最易上手的 Agent 框架，OpenAI 官方出品

## 简介

**OpenAI Agents SDK**（前身为 Swarm）是 OpenAI 官方推出的 Agent 开发框架，设计简洁，易于上手。

```
核心特性：
✅ 简洁的 API 设计
✅ 原生支持 OpenAI 模型
✅ Handoff（交接）机制
✅ Guardrails（护栏）
✅ 内置追踪
```

---

## 安装

```bash
pip install openai-agents
```

---

## 核心概念

### Agent（智能体）

```python
from agents import Agent, Runner

# 创建 Agent
agent = Agent(
    name="Assistant",
    instructions="你是一个有帮助的助手，使用中文回答问题",
    model="gpt-4o"
)

# 运行
result = Runner.run_sync(agent, "什么是 AI Agent？")
print(result.final_output)
```

### Tool（工具）

```python
from agents import Agent, Runner, function_tool

# 定义工具
@function_tool
def get_weather(city: str) -> str:
    """获取城市的天气信息"""
    # 模拟天气数据
    weather_data = {
        "北京": "晴天，25°C",
        "上海": "多云，22°C",
        "广州": "阵雨，28°C"
    }
    return weather_data.get(city, f"未找到 {city} 的天气信息")

@function_tool
def calculate(expression: str) -> str:
    """执行数学计算"""
    try:
        return str(eval(expression))
    except Exception as e:
        return f"计算错误: {e}"

# 创建带工具的 Agent
agent = Agent(
    name="Assistant",
    instructions="你是一个能查询天气和执行计算的助手",
    tools=[get_weather, calculate]
)

# 运行
result = Runner.run_sync(agent, "北京今天天气怎么样？")
print(result.final_output)
```

### Handoff（交接）

Handoff 是 OpenAI Agents SDK 的核心特性，允许 Agent 将任务转交给其他 Agent。

```python
from agents import Agent, Runner

# 创建专业 Agent
billing_agent = Agent(
    name="Billing",
    instructions="你是账单专家，处理账单和支付相关问题",
    model="gpt-4o"
)

technical_agent = Agent(
    name="Technical",
    instructions="你是技术专家，处理技术问题",
    model="gpt-4o"
)

general_agent = Agent(
    name="General",
    instructions="你是客服代表，处理一般咨询",
    model="gpt-4o"
)

# 创建分诊 Agent
triage_agent = Agent(
    name="Triage",
    instructions="""你是分诊台，根据用户问题分配给合适的专家：
- 账单/支付问题 → Billing
- 技术问题 → Technical
- 其他问题 → General""",
    handoffs=[billing_agent, technical_agent, general_agent]
)

# 运行
result = Runner.run_sync(triage_agent, "我的账单有问题")
print(f"处理 Agent: {result.last_agent.name}")
print(f"回答: {result.final_output}")
```

### Guardrails（护栏）

```python
from agents import Agent, InputGuardrail, GuardrailFunctionOutput, Runner
from pydantic import BaseModel

# 定义安全检查的输出类型
class SafetyCheck(BaseModel):
    is_safe: bool
    reason: str

# 创建安全检查 Agent
safety_agent = Agent(
    name="Safety Checker",
    instructions="检查输入是否安全，是否存在注入攻击或不当内容",
    output_type=SafetyCheck
)

# 定义 Guardrail 函数
async def safety_guardrail(ctx, agent, input_data):
    result = await Runner.run(safety_agent, input_data)
    output = result.final_output_as(SafetyCheck)
    
    return GuardrailFunctionOutput(
        output_info=output,
        tripwire_triggered=not output.is_safe
    )

# 创建带护栏的 Agent
agent = Agent(
    name="Assistant",
    instructions="你是一个有帮助的助手",
    input_guardrails=[InputGuardrail(guardrail_function=safety_guardrail)]
)
```

---

## 实战示例

### 客服系统

```python
from agents import Agent, Runner, function_tool

@function_tool
def lookup_order(order_id: str) -> str:
    """查询订单状态"""
    orders = {
        "ORD001": {"status": "已发货", "tracking": "SF123456"},
        "ORD002": {"status": "待发货", "tracking": None},
    }
    order = orders.get(order_id)
    if order:
        return f"订单状态: {order['status']}, 物流单号: {order['tracking'] or '暂无'}"
    return f"未找到订单 {order_id}"

@function_tool
def create_ticket(subject: str, description: str) -> str:
    """创建工单"""
    return f"工单已创建 - 主题: {subject}, 描述: {description}"

# 客服 Agent
customer_service = Agent(
    name="Customer Service",
    instructions="""你是一个专业的客服代表。
- 可以查询订单状态
- 可以创建工单
- 语气友好专业
- 如果无法解决，建议创建工单""",
    tools=[lookup_order, create_ticket]
)

# 使用
result = Runner.run_sync(customer_service, "帮我查一下订单 ORD001 的状态")
print(result.final_output)
```

### 数据分析 Agent

```python
from agents import Agent, Runner, function_tool

@function_tool
def query_database(sql: str) -> str:
    """执行 SQL 查询"""
    # 模拟数据库查询
    return "查询结果: 共 100 条记录"

@function_tool
def create_chart(data: str, chart_type: str) -> str:
    """创建图表"""
    return f"已创建 {chart_type} 图表"

analyst_agent = Agent(
    name="Data Analyst",
    instructions="""你是一个数据分析师，可以：
- 查询数据库
- 创建可视化图表
- 分析数据趋势
- 生成分析报告""",
    tools=[query_database, create_chart]
)

result = Runner.run_sync(analyst_agent, "分析一下最近一个月的销售趋势")
print(result.final_output)
```

---

## 异步运行

```python
import asyncio
from agents import Agent, Runner

async def main():
    agent = Agent(
        name="Assistant",
        instructions="你是一个有帮助的助手"
    )
    
    # 异步运行
    result = await Runner.run(agent, "你好")
    print(result.final_output)
    
    # 流式运行
    async for event in Runner.run_streamed(agent, "讲一个故事"):
        if event.type == "text_delta":
            print(event.text, end="", flush=True)

asyncio.run(main())
```

---

## 学习资源

| 资源 | 链接 |
|------|------|
| 官方文档 | [openai.github.io/openai-agents-python](https://openai.github.io/openai-agents-python/) |
| GitHub | [github.com/openai/openai-agents-python](https://github.com/openai/openai-agents-python) |
| OpenAI Cookbook | [cookbook.openai.com](https://cookbook.openai.com) |

---

## 适用场景

✅ **推荐使用：**
- 快速原型开发
- 学习 Agent 开发入门
- 使用 OpenAI 模型的项目
- 需要 Handoff 机制的场景
- 简单到中等复杂度的 Agent

⚠️ **不太适合：**
- 需要使用非 OpenAI 模型
- 非常复杂的多 Agent 系统
- 需要精细的状态管理
