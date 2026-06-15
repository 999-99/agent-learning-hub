# Google ADK (Agent Development Kit)

> Google 出品的 Agent 开发框架，Gemini 优化

## 简介

**Google ADK**（Agent Development Kit）是 Google 在 2025 年推出的开源 Agent 框架，专门为 Gemini 模型优化，同时也支持其他模型。

```
核心特点：
✅ Google 官方支持
✅ Gemini 模型优化
✅ 支持 MCP 协议
✅ 支持 A2A 协议
✅ 多 Agent 编排
✅ 可部署到 Vertex AI
```

---

## 安装

```bash
pip install google-adk
```

---

## 核心概念

### Agent（智能体）

```python
from google.adk.agents import Agent

# 创建 Agent
agent = Agent(
    name="assistant",
    model="gemini-2.0-flash",
    description="你是一个有帮助的助手",
    instruction="使用中文回答问题，保持友好和专业"
)
```

### Tool（工具）

```python
from google.adk.agents import Agent
from google.adk.tools import FunctionTool

# 定义工具函数
def get_weather(city: str) -> dict:
    """获取城市的天气信息"""
    weather_data = {
        "北京": {"temp": 25, "condition": "晴"},
        "上海": {"temp": 22, "condition": "多云"},
    }
    return weather_data.get(city, {"error": "未找到"})

def calculator(expression: str) -> str:
    """执行数学计算"""
    try:
        return str(eval(expression))
    except Exception as e:
        return f"错误: {e}"

# 创建工具
weather_tool = FunctionTool(get_weather)
calc_tool = FunctionTool(calculator)

# 创建带工具的 Agent
agent = Agent(
    name="assistant",
    model="gemini-2.0-flash",
    description="能查询天气和执行计算的助手",
    tools=[weather_tool, calc_tool]
)
```

### Multi-Agent（多智能体）

```python
from google.adk.agents import Agent, SequentialAgent

# 创建专业 Agent
researcher = Agent(
    name="researcher",
    model="gemini-2.0-flash",
    description="研究员",
    instruction="搜集和整理信息",
    tools=[search_tool]
)

writer = Agent(
    name="writer",
    model="gemini-2.0-flash",
    description="作家",
    instruction="撰写文章"
)

# 顺序执行
pipeline = SequentialAgent(
    name="content_pipeline",
    description="研究-写作流程",
    sub_agents=[researcher, writer]
)
```

---

## 实战示例

### 客服 Agent

```python
from google.adk.agents import Agent
from google.adk.tools import FunctionTool

def lookup_order(order_id: str) -> dict:
    """查询订单"""
    return {"order_id": order_id, "status": "已发货"}

def create_refund(order_id: str, reason: str) -> dict:
    """创建退款"""
    return {"success": True, "message": f"退款已创建: {order_id}"}

# 客服 Agent
customer_service = Agent(
    name="customer_service",
    model="gemini-2.0-flash",
    description="客服助手",
    instruction="""你是一个专业的客服代表。
- 可以查询订单状态
- 可以处理退款
- 语气友好专业""",
    tools=[
        FunctionTool(lookup_order),
        FunctionTool(create_refund)
    ]
)
```

### 数据分析 Agent

```python
from google.adk.agents import Agent
from google.adk.tools import FunctionTool

def query_database(sql: str) -> str:
    """执行 SQL 查询"""
    return "查询结果: ..."

def create_visualization(data: str, chart_type: str) -> str:
    """创建可视化"""
    return f"已创建 {chart_type}"

analyst = Agent(
    name="data_analyst",
    model="gemini-2.0-flash",
    description="数据分析师",
    instruction="分析数据并创建可视化",
    tools=[
        FunctionTool(query_database),
        FunctionTool(create_visualization)
    ]
)
```

---

## MCP 集成

Google ADK 原生支持 MCP 协议：

```python
from google.adk.agents import Agent
from google.adk.tools.mcp_tool import McpTool

# 连接 MCP Server
mcp_tool = McpTool(
    command="npx",
    args=["-y", "@modelcontextprotocol/server-filesystem", "."]
)

# 创建 Agent
agent = Agent(
    name="file_assistant",
    model="gemini-2.0-flash",
    description="文件助手",
    tools=[mcp_tool]
)
```

---

## 部署到 Vertex AI

```python
from google.adk.agents import Agent
from google.adk.runners import Runner

# 创建 Agent
agent = Agent(
    name="my_agent",
    model="gemini-2.0-flash",
    description="我的 Agent"
)

# 本地运行
runner = Runner(agent=agent)
result = runner.run("你好")

# 部署到 Vertex AI
# 使用 gcloud 命令或 Vertex AI SDK
```

---

## 学习资源

| 资源 | 链接 |
|------|------|
| 官方文档 | [google.github.io/adk-docs](https://google.github.io/adk-docs/) |
| GitHub | [github.com/google/adk-python](https://github.com/google/adk-python) |
| Vertex AI | [cloud.google.com/vertex-ai](https://cloud.google.com/vertex-ai) |

---

## 适用场景

✅ **推荐使用：**
- 使用 Gemini 模型的项目
- Google Cloud 生态
- 需要 MCP/A2A 支持
- 企业级部署

⚠️ **不太适合：**
- 非 Google 模型（虽然支持但不是最优）
- 需要最成熟的社区支持
