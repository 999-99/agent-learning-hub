# 01 - 编程与 AI 基础

> 🎯 本章目标：掌握开发 AI Agent 所需的编程基础和 AI 核心概念

## 为什么需要这些基础？

AI Agent 的开发本质上是 **编程 + AI + 工程化** 的结合。扎实的基础能让你：

- 理解 Agent 背后的 LLM 工作原理
- 高效调用各种 API
- 调试和优化 Agent 行为
- 构建生产级应用

---

## Python 编程基础

Python 是 AI Agent 开发的**首选语言**，原因：
- 几乎所有 AI 框架都提供 Python SDK
- 丰富的 AI/ML 生态系统
- 语法简洁，开发效率高

### 必须掌握的 Python 知识

```python
# 1. 基础语法与数据结构
name = "Agent"
skills = ["Python", "LLM", "RAG"]
config = {"model": "gpt-4o", "temperature": 0.7}

# 2. 函数定义（Agent 的工具就是函数）
def search_web(query: str, max_results: int = 5) -> list[dict]:
    """搜索网页并返回结果"""
    # 实现搜索逻辑
    return [{"title": "结果1", "url": "https://example.com"}]

# 3. 异步编程（Agent 调用 LLM 通常是异步的）
import asyncio

async def call_llm(prompt: str) -> str:
    """异步调用 LLM"""
    # 模拟 API 调用
    await asyncio.sleep(1)
    return "LLM 的回答"

# 4. 类与面向对象（理解 Agent 框架的源码）
class SimpleAgent:
    def __init__(self, name: str, tools: list):
        self.name = name
        self.tools = tools
        self.memory = []

    def think(self, observation: str) -> str:
        """Agent 的思考过程"""
        self.memory.append(observation)
        return f"基于 {len(self.memory)} 条记忆，我决定..."

    def act(self, action: str) -> str:
        """Agent 的行动"""
        return f"执行: {action}"

# 5. 类型提示（提高代码可读性）
from typing import Optional
from pydantic import BaseModel

class AgentConfig(BaseModel):
    model: str = "gpt-4o"
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    tools: list[str] = []
```

### Python 学习资源

| 资源 | 链接 | 说明 |
|------|------|------|
| Python 官方教程 | [python.org](https://docs.python.org/3/tutorial/) | 最权威的入门教程 |
| 廖雪峰 Python 教程 | [liaoxuefeng.com](https://www.liaoxuefeng.com/wiki/1016959663602400) | 中文经典教程 |
| Real Python | [realpython.com](https://realpython.com/) | 高质量英文教程 |

---

## JavaScript / TypeScript 基础

JavaScript/TypeScript 在 Agent 开发中同样重要：
- **前端 Agent 应用** — Web UI、Chat Interface
- **MCP Server 开发** — TypeScript SDK 是主流
- **Node.js 后端** — 高性能 API 服务

### 关键知识点

```typescript
// 1. TypeScript 类型定义（MCP 工具定义的核心）
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

// 2. 异步编程
async function callAgent(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content;
}

// 3. MCP Server 基本结构
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.tool(
  "search",
  "搜索知识库",
  { query: z.string() },
  async ({ query }) => {
    const results = await search(query);
    return { content: [{ type: "text", text: JSON.stringify(results) }] };
  }
);
```

---

## AI / ML 核心概念

### 理解大语言模型（LLM）

```
┌──────────────────────────────────────────────────┐
│              LLM 工作原理简图                      │
│                                                  │
│  输入文本 → [Tokenizer] → Token 序列              │
│             → [Transformer 模型] → 下一个 Token    │
│             → [Decoder] → 输出文本                 │
│                                                  │
│  关键概念：                                       │
│  • Token: 文本的最小单位（一个汉字≈1-2个token）     │
│  • Context Window: 模型能处理的最大 Token 数       │
│  • Temperature: 控制输出的随机性                    │
│  • Embedding: 将文本转换为向量表示                  │
└──────────────────────────────────────────────────┘
```

### 必须理解的 AI 概念

| 概念 | 说明 | Agent 中的作用 |
|------|------|---------------|
| **Transformer** | LLM 的基础架构 | 理解模型能力边界 |
| **Token** | 文本的最小处理单位 | 计算成本、控制上下文长度 |
| **Embedding** | 文本的向量表示 | RAG 检索、语义搜索 |
| **Temperature** | 输出随机性控制 | Agent 决策的确定性 vs 创造性 |
| **Context Window** | 模型上下文窗口大小 | 记忆管理、长文档处理 |
| **Fine-tuning** | 模型微调 | 定制化 Agent 能力 |
| **Hallucination** | 模型幻觉 | Agent 可靠性设计 |

### Transformer 架构简介

```
输入: "今天天气"
         ↓
┌─────────────────┐
│   Embedding      │  将文本转为向量
│   Layer          │  [0.12, -0.34, 0.56, ...]
└─────────────────┘
         ↓
┌─────────────────┐
│   Self-Attention │  理解词与词之间的关系
│   Layers (x N)   │  "天气" 关注 "今天"
└─────────────────┘
         ↓
┌─────────────────┐
│   Feed Forward   │  特征变换
│   Network        │
└─────────────────┘
         ↓
输出: "很好" (概率分布)
```

---

## API 调用基础

### HTTP 请求基础

```python
import requests

# GET 请求
response = requests.get("https://api.example.com/data")
data = response.json()

# POST 请求（调用 LLM API 的基本模式）
response = requests.post(
    "https://api.openai.com/v1/chat/completions",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "model": "gpt-4o",
        "messages": [{"role": "user", "content": "你好"}],
        "temperature": 0.7
    }
)
result = response.json()
print(result["choices"][0]["message"]["content"])
```

### Stream 流式调用

```python
# 流式输出（Agent 中常用，提升用户体验）
import openai

client = openai.OpenAI()
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "讲一个故事"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

---

## 开发环境搭建

### 推荐工具栈

| 工具 | 用途 | 推荐 |
|------|------|------|
| **Python 3.10+** | 运行环境 | 必装 |
| **Node.js 18+** | MCP Server / 前端 | 必装 |
| **VS Code / Cursor** | 代码编辑器 | 强烈推荐 |
| **uv / pip** | Python 包管理 | 推荐 uv |
| **Git** | 版本控制 | 必装 |
| **Docker** | 容器化部署 | 进阶推荐 |

### 快速环境搭建

```bash
# 1. 安装 Python（推荐使用 pyenv 或直接官网下载）
python --version  # 确保 >= 3.10

# 2. 创建虚拟环境
python -m venv agent-env
source agent-env/bin/activate  # Linux/Mac
# agent-env\Scripts\activate   # Windows

# 3. 安装核心依赖
pip install openai anthropic langchain langgraph

# 4. 安装 Node.js（用于 MCP Server 开发）
node --version  # 确保 >= 18

# 5. 设置 API Key
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

---

## ✅ 本章检查清单

完成本章学习后，你应该能够：

- [ ] 熟练使用 Python 编写函数、类、异步代码
- [ ] 理解 LLM 的基本工作原理（Token、Embedding、Attention）
- [ ] 能够调用 OpenAI / Claude API 进行对话
- [ ] 理解流式输出的原理和实现
- [ ] 搭建好 Agent 开发环境

::: tip ➡️ 下一步
基础打好后，进入 [提示词工程](/guide/02-prompt-engineering) 学习如何与 LLM 高效交互。
:::
