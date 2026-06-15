# 05 - Function Calling / Tool Use

> 🎯 本章目标：掌握让 LLM 调用外部工具的技术，这是 Agent 的核心能力

## 什么是 Function Calling？

Function Calling 是让 LLM 能够调用外部函数/工具的技术。它是 Agent 能够"行动"的关键。

```
没有 Function Calling：LLM 只能生成文本
有了 Function Calling：LLM 可以查询数据库、调用 API、执行计算...
```

### 工作流程

```
用户: "北京今天天气怎么样？"
         ↓
LLM 分析 → 需要调用 get_weather 工具
         ↓
生成工具调用: get_weather(city="北京")
         ↓
系统执行工具 → 返回结果: {"temp": "25°C", "condition": "晴"}
         ↓
LLM 基于结果生成回答: "北京今天天气晴朗，温度 25°C。"
```

---

## OpenAI Function Calling

### 定义工具

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_products",
            "description": "搜索商品信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["electronics", "clothing", "food"],
                        "description": "商品类别"
                    },
                    "max_price": {
                        "type": "number",
                        "description": "最高价格"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_order_status",
            "description": "查询订单状态",
            "parameters": {
                "type": "object",
                "properties": {
                    "order_id": {
                        "type": "string",
                        "description": "订单编号"
                    }
                },
                "required": ["order_id"]
            }
        }
    }
]
```

### 完整调用示例

```python
import json
from openai import OpenAI

client = OpenAI()

# 工具实现
def search_products(query: str, category: str = None, max_price: float = None) -> dict:
    """模拟商品搜索"""
    return {
        "products": [
            {"name": "iPhone 15", "price": 7999, "category": "electronics"},
            {"name": "MacBook Pro", "price": 14999, "category": "electronics"},
        ],
        "total": 2
    }

def get_order_status(order_id: str) -> dict:
    """模拟订单查询"""
    return {
        "order_id": order_id,
        "status": "已发货",
        "tracking_number": "SF1234567890"
    }

# 工具映射
available_functions = {
    "search_products": search_products,
    "get_order_status": get_order_status,
}

# 对话
messages = [
    {"role": "system", "content": "你是一个电商客服助手，可以帮用户搜索商品和查询订单。"},
    {"role": "user", "content": "帮我搜一下电子产品，预算 10000 以内"}
]

# 第一次调用
response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
    tool_choice="auto"
)

message = response.choices[0].message

# 处理工具调用
if message.tool_calls:
    # 添加 assistant 消息
    messages.append(message)
    
    # 执行每个工具调用
    for tool_call in message.tool_calls:
        function_name = tool_call.function.name
        function_args = json.loads(tool_call.function.arguments)
        
        print(f"调用工具: {function_name}")
        print(f"参数: {function_args}")
        
        # 执行工具
        function_to_call = available_functions[function_name]
        result = function_to_call(**function_args)
        
        # 添加工具结果
        messages.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": json.dumps(result, ensure_ascii=False)
        })
    
    # 第二次调用，让 LLM 基于工具结果生成回答
    second_response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    print(second_response.choices[0].message.content)
```

---

## Anthropic Tool Use

### 定义工具

```python
tools = [
    {
        "name": "calculate",
        "description": "执行数学计算",
        "input_schema": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "数学表达式"
                }
            },
            "required": ["expression"]
        }
    }
]
```

### 完整调用示例

```python
import anthropic
import json

client = anthropic.Anthropic()

# 工具实现
def calculate(expression: str) -> str:
    try:
        result = eval(expression)
        return str(result)
    except Exception as e:
        return f"计算错误: {e}"

# 对话
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=tools,
    messages=[
        {"role": "user", "content": "计算 (15 + 27) * 3 等于多少？"}
    ]
)

# 处理工具调用
if response.stop_reason == "tool_use":
    # 获取工具调用信息
    tool_use = next(block for block in response.content if block.type == "tool_use")
    
    print(f"工具: {tool_use.name}")
    print(f"参数: {tool_use.input}")
    
    # 执行工具
    result = calculate(tool_use.input["expression"])
    
    # 返回结果
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        tools=tools,
        messages=[
            {"role": "user", "content": "计算 (15 + 27) * 3 等于多少？"},
            {"role": "assistant", "content": response.content},
            {
                "role": "user",
                "content": [{
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": result
                }]
            }
        ]
    )
    print(response.content[0].text)
```

---

## 使用 Pydantic 定义工具

使用 Pydantic 可以更优雅地定义工具的参数结构。

```python
from pydantic import BaseModel, Field
from typing import Optional

# 定义工具参数模型
class SearchQuery(BaseModel):
    """搜索知识库"""
    query: str = Field(description="搜索关键词")
    category: Optional[str] = Field(default=None, description="分类过滤")
    limit: int = Field(default=5, description="返回结果数量")

class Calculator(BaseModel):
    """执行数学计算"""
    expression: str = Field(description="数学表达式")

# 使用 LangChain 风格
from langchain_core.tools import tool

@tool
def search_knowledge(query: str, category: str = None, limit: int = 5) -> list[dict]:
    """搜索知识库获取相关信息"""
    # 模拟搜索
    return [
        {"title": "AI Agent 介绍", "content": "Agent 是...", "score": 0.95},
        {"title": "RAG 技术", "content": "RAG 是...", "score": 0.87}
    ]

@tool
def calculator(expression: str) -> str:
    """执行数学计算"""
    try:
        return str(eval(expression))
    except Exception as e:
        return f"错误: {e}"

# 查看工具信息
print(f"工具名: {search_knowledge.name}")
print(f"描述: {search_knowledge.description}")
print(f"参数: {search_knowledge.args_schema.model_json_schema()}")
```

---

## 并行工具调用

OpenAI 支持在一次响应中调用多个工具。

```python
# 用户问一个需要多个工具的问题
messages = [
    {"role": "user", "content": "帮我查一下北京和上海的天气，再算一下两地温差"}
]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=[
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "获取天气",
                "parameters": {
                    "type": "object",
                    "properties": {"city": {"type": "string"}},
                    "required": ["city"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "calculator",
                "description": "计算",
                "parameters": {
                    "type": "object",
                    "properties": {"expression": {"type": "string"}},
                    "required": ["expression"]
                }
            }
        }
    ],
    tool_choice="auto"
)

message = response.choices[0].message

# 可能返回多个 tool_calls
if message.tool_calls:
    print(f"调用了 {len(message.tool_calls)} 个工具:")
    for tc in message.tool_calls:
        print(f"  - {tc.function.name}({tc.function.arguments})")
```

---

## 工具设计最佳实践

### 1. 工具描述要清晰

```python
# ❌ 差的描述
{
    "name": "search",
    "description": "搜索",
}

# ✅ 好的描述
{
    "name": "search_products",
    "description": "在商品数据库中搜索商品。支持按关键词、类别、价格范围过滤。返回匹配的商品列表，包含名称、价格、评分等信息。",
}
```

### 2. 参数要有明确的描述和约束

```python
{
    "type": "object",
    "properties": {
        "date": {
            "type": "string",
            "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
            "description": "日期，格式为 YYYY-MM-DD，如 2025-01-15"
        },
        "limit": {
            "type": "integer",
            "minimum": 1,
            "maximum": 100,
            "default": 10,
            "description": "返回结果数量，范围 1-100"
        }
    },
    "required": ["date"]
}
```

### 3. 错误处理

```python
@tool
def database_query(sql: str) -> str:
    """执行数据库查询"""
    try:
        # 只允许 SELECT 查询
        if not sql.strip().upper().startswith("SELECT"):
            return json.dumps({"error": "只允许 SELECT 查询"})
        
        results = execute_query(sql)
        return json.dumps({"data": results, "count": len(results)})
    except Exception as e:
        return json.dumps({"error": str(e), "suggestion": "请检查 SQL 语法"})
```

---

## ✅ 本章检查清单

- [ ] 理解 Function Calling 的工作原理
- [ ] 掌握 OpenAI 和 Claude 的工具定义方式
- [ ] 能够实现完整的工具调用流程
- [ ] 理解并行工具调用
- [ ] 掌握工具设计的最佳实践

::: tip ➡️ 下一步
掌握了工具调用，接下来学习 [Agent 架构设计](/guide/06-agent-architecture)。
:::
