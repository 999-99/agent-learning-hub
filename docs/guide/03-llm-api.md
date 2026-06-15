# 03 - LLM API 调用

> 🎯 本章目标：掌握主流 LLM API 的调用方式，为 Agent 开发打下基础

## LLM API 全景

| API 提供商 | 代表模型 | 特点 | 适用场景 |
|-----------|---------|------|---------|
| **OpenAI** | GPT-4o, GPT-4.1 | 生态最完善，兼容性最广 | 通用 Agent 开发 |
| **Anthropic** | Claude Opus/Sonnet | Tool Use 能力强，长上下文 | 复杂 Agent、长文档 |
| **Google** | Gemini 2.5 | 多模态，长上下文 | 多模态 Agent |
| **DeepSeek** | DeepSeek-V3 | 开源，性价比高 | 成本敏感场景 |
| **阿里云** | Qwen-Max | 中文能力强 | 中文 Agent |
| **智谱** | GLM-4 | 中文理解好 | 中文对话 Agent |

---

## OpenAI API

### 基础调用

```python
from openai import OpenAI

client = OpenAI()  # 自动读取 OPENAI_API_KEY 环境变量

# 基础对话
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "你是一个有帮助的助手"},
        {"role": "user", "content": "什么是 AI Agent？"}
    ],
    temperature=0.7,
    max_tokens=1000
)

print(response.choices[0].message.content)
```

### 流式输出

```python
# 流式输出 - 提升用户体验
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "讲一个关于AI的故事"}],
    stream=True
)

for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end="", flush=True)
```

### Function Calling（工具调用）

```python
import json

# 定义工具
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称，如'北京'"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "温度单位"
                    }
                },
                "required": ["city"]
            }
        }
    }
]

# 调用带工具的对话
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "北京今天天气怎么样？"}],
    tools=tools,
    tool_choice="auto"
)

message = response.choices[0].message

# 检查是否需要调用工具
if message.tool_calls:
    tool_call = message.tool_calls[0]
    function_name = tool_call.function.name
    arguments = json.loads(tool_call.function.arguments)
    
    print(f"调用工具: {function_name}")
    print(f"参数: {arguments}")
    
    # 执行工具（实际场景中需要实现真实的工具逻辑）
    weather_result = {"city": arguments["city"], "temp": "25°C", "condition": "晴"}
    
    # 将工具结果返回给 LLM
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": "北京今天天气怎么样？"},
            message,
            {
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": json.dumps(weather_result, ensure_ascii=False)
            }
        ]
    )
    print(response.choices[0].message.content)
```

### 结构化输出（Structured Outputs）

```python
from pydantic import BaseModel

# 定义输出结构
class AnalysisResult(BaseModel):
    summary: str
    key_points: list[str]
    sentiment: str
    confidence: float

# 使用 structured output
completion = client.beta.chat.completions.parse(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "分析用户评论并提取关键信息"},
        {"role": "user", "content": "这个产品真的很棒，物流很快，就是价格有点贵"}
    ],
    response_format=AnalysisResult
)

result = completion.choices[0].message.parsed
print(f"摘要: {result.summary}")
print(f"情感: {result.sentiment}")
print(f"置信度: {result.confidence}")
```

---

## Anthropic Claude API

### 基础调用

```python
import anthropic

client = anthropic.Anthropic()  # 自动读取 ANTHROPIC_API_KEY

# 基础对话
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system="你是一个专业的技术顾问",
    messages=[
        {"role": "user", "content": "什么是 MCP 协议？"}
    ]
)

print(message.content[0].text)
```

### Tool Use（工具使用）

```python
# 定义工具
tools = [
    {
        "name": "calculate",
        "description": "执行数学计算",
        "input_schema": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "数学表达式，如 '2 + 3 * 4'"
                }
            },
            "required": ["expression"]
        }
    }
]

# 调用带工具的对话
message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    tools=tools,
    messages=[
        {"role": "user", "content": "计算 (15 + 27) * 3 的结果"}
    ]
)

# 处理工具调用
for block in message.content:
    if block.type == "tool_use":
        print(f"调用工具: {block.name}")
        print(f"参数: {block.input}")
        
        # 执行计算
        result = eval(block.input["expression"])
        
        # 返回结果
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            tools=tools,
            messages=[
                {"role": "user", "content": "计算 (15 + 27) * 3 的结果"},
                {"role": "assistant", "content": message.content},
                {
                    "role": "user",
                    "content": [{
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result)
                    }]
                }
            ]
        )
        print(message.content[0].text)
```

---

## 国产大模型 API

### DeepSeek API

```python
from openai import OpenAI

# DeepSeek 兼容 OpenAI API 格式
client = OpenAI(
    api_key="your-deepseek-api-key",
    base_url="https://api.deepseek.com/v1"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "user", "content": "解释什么是 RAG"}
    ]
)
print(response.choices[0].message.content)
```

### 通义千问 API

```python
# 安装: pip install dashscope
import dashscope
from dashscope import Generation

dashscope.api_key = "your-api-key"

response = Generation.call(
    model="qwen-max",
    messages=[
        {"role": "system", "content": "你是一个有帮助的助手"},
        {"role": "user", "content": "什么是 Agent？"}
    ]
)
print(response.output.text)
```

### 智谱 GLM API

```python
# 安装: pip install zhipuai
from zhipuai import ZhipuAI

client = ZhipuAI(api_key="your-api-key")

response = client.chat.completions.create(
    model="glm-4",
    messages=[
        {"role": "user", "content": "什么是 AI Agent？"}
    ]
)
print(response.choices[0].message.content)
```

---

## API 统一封装

在实际 Agent 开发中，通常需要封装一个统一的 LLM 调用接口：

```python
from typing import Literal
from dataclasses import dataclass

@dataclass
class LLMResponse:
    content: str
    model: str
    usage: dict
    tool_calls: list | None = None

class LLMClient:
    """统一的 LLM 调用客户端"""
    
    def __init__(self):
        self._clients = {}
    
    def _get_client(self, provider: str):
        if provider not in self._clients:
            if provider == "openai":
                from openai import OpenAI
                self._clients[provider] = OpenAI()
            elif provider == "anthropic":
                import anthropic
                self._clients[provider] = anthropic.Anthropic()
            elif provider == "deepseek":
                from openai import OpenAI
                self._clients[provider] = OpenAI(
                    base_url="https://api.deepseek.com/v1"
                )
        return self._clients[provider]
    
    def chat(
        self,
        messages: list[dict],
        model: str = "gpt-4o",
        provider: Literal["openai", "anthropic", "deepseek"] = "openai",
        tools: list | None = None,
        **kwargs
    ) -> LLMResponse:
        """统一的对话接口"""
        client = self._get_client(provider)
        
        if provider == "openai" or provider == "deepseek":
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                tools=tools,
                **kwargs
            )
            return LLMResponse(
                content=response.choices[0].message.content,
                model=response.model,
                usage=response.usage.model_dump(),
                tool_calls=response.choices[0].message.tool_calls
            )
        elif provider == "anthropic":
            response = client.messages.create(
                model=model,
                messages=messages,
                max_tokens=kwargs.get("max_tokens", 1024),
                tools=tools or [],
            )
            return LLMResponse(
                content=response.content[0].text,
                model=response.model,
                usage={"input": response.usage.input_tokens, "output": response.usage.output_tokens},
                tool_calls=None
            )

# 使用示例
llm = LLMClient()
result = llm.chat(
    messages=[{"role": "user", "content": "你好"}],
    model="gpt-4o",
    provider="openai"
)
print(result.content)
```

---

## Token 计数与成本管理

```python
import tiktoken

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """计算文本的 Token 数量"""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

def estimate_cost(input_tokens: int, output_tokens: int, model: str) -> float:
    """估算 API 调用成本（美元）"""
    pricing = {
        "gpt-4o": {"input": 2.50 / 1_000_000, "output": 10.00 / 1_000_000},
        "gpt-4o-mini": {"input": 0.15 / 1_000_000, "output": 0.60 / 1_000_000},
        "claude-sonnet-4-20250514": {"input": 3.00 / 1_000_000, "output": 15.00 / 1_000_000},
    }
    
    if model not in pricing:
        return 0.0
    
    return (input_tokens * pricing[model]["input"] + 
            output_tokens * pricing[model]["output"])

# 使用示例
text = "什么是 AI Agent？请详细解释。"
tokens = count_tokens(text)
print(f"Token 数: {tokens}")
print(f"预估成本: ${estimate_cost(tokens, 500, 'gpt-4o'):.4f}")
```

---

## ✅ 本章检查清单

- [ ] 能够调用 OpenAI、Claude、DeepSeek 等主流 API
- [ ] 掌握流式输出的实现
- [ ] 理解 Function Calling / Tool Use 的工作流程
- [ ] 能够封装统一的 LLM 调用接口
- [ ] 了解 Token 计数和成本管理

::: tip ➡️ 下一步
掌握了 LLM API 调用，接下来进入 [RAG 检索增强生成](/guide/04-rag)。
:::
