# A2A 协议详解

> Agent-to-Agent Protocol — Google 推出的 Agent 间通信协议

## 概述

**A2A**（Agent-to-Agent Protocol）是 Google 在 2025 年 4 月发布的开放协议，旨在标准化 AI Agent 之间的通信和协作方式。

```
MCP vs A2A：
  MCP = Agent 与 工具/数据 的连接
  A2A = Agent 与 Agent 的连接

  两者互补，共同构建完整的 Agent 生态
```

---

## 核心概念

### Agent Card

Agent Card 是描述 Agent 能力的元数据文件，类似于 API 的 OpenAPI 规范。

```json
{
  "name": "Research Agent",
  "description": "专业研究助手，擅长信息搜集和分析",
  "url": "https://research-agent.example.com",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "web_search",
      "name": "Web Search",
      "description": "搜索互联网信息"
    },
    {
      "id": "data_analysis",
      "name": "Data Analysis",
      "description": "分析数据并生成报告"
    }
  ],
  "authentication": {
    "schemes": ["bearer"]
  }
}
```

### Task（任务）

Task 是 Agent 间的工作单元。

```json
{
  "id": "task-001",
  "status": {
    "state": "working",
    "message": {
      "role": "agent",
      "parts": [{"type": "text", "text": "正在搜集信息..."}]
    }
  },
  "artifacts": [],
  "history": []
}
```

### Message（消息）

Message 是 Agent 间的通信内容。

```json
{
  "role": "user",
  "parts": [
    {
      "type": "text",
      "text": "帮我研究 AI Agent 的最新趋势"
    },
    {
      "type": "file",
      "file": {
        "mimeType": "application/pdf",
        "data": "base64..."
      }
    }
  ]
}
```

### Artifact（产出物）

Artifact 是任务执行过程中产生的输出。

```json
{
  "name": "research_report",
  "parts": [
    {
      "type": "text",
      "text": "研究报告内容..."
    }
  ]
}
```

---

## 协议流程

```
┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │
│  Agent   │                    │  Agent   │
└────┬─────┘                    └────┬─────┘
     │                               │
     │  1. 发现 Agent Card           │
     │  ─────────────────────────→   │
     │                               │
     │  2. 创建 Task                 │
     │  ─────────────────────────→   │
     │                               │
     │  3. 发送 Message              │
     │  ─────────────────────────→   │
     │                               │
     │  4. 接收状态更新              │
     │  ←─────────────────────────   │
     │                               │
     │  5. 接收 Artifact             │
     │  ←─────────────────────────   │
     │                               │
     │  6. 任务完成                  │
     │  ←─────────────────────────   │
     │                               │
```

---

## 实现示例

### Server 端

```python
from a2a.server import A2AServer
from a2a.types import Task, Message, Artifact

class ResearchAgent(A2AServer):
    def __init__(self):
        super().__init__(
            name="Research Agent",
            description="专业研究助手",
            url="http://localhost:8000"
        )
    
    async def handle_task(self, task: Task) -> Task:
        """处理任务"""
        # 获取用户消息
        message = task.messages[-1]
        query = message.parts[0].text
        
        # 执行研究
        result = await self.do_research(query)
        
        # 返回结果
        task.status.state = "completed"
        task.artifacts = [
            Artifact(
                name="research_result",
                parts=[{"type": "text", "text": result}]
            )
        ]
        return task
    
    async def do_research(self, query: str) -> str:
        # 实现研究逻辑
        return f"关于 '{query}' 的研究结果..."

# 启动服务器
agent = ResearchAgent()
agent.run(port=8000)
```

### Client 端

```python
from a2a.client import A2AClient
from a2a.types import Message

async def use_research_agent():
    # 连接到 Agent
    client = A2AClient("http://localhost:8000")
    
    # 创建任务
    task = await client.create_task()
    
    # 发送消息
    message = Message(
        role="user",
        parts=[{"type": "text", "text": "研究 AI Agent 趋势"}]
    )
    task = await client.send_message(task.id, message)
    
    # 等待完成
    while task.status.state != "completed":
        task = await client.get_task(task.id)
        await asyncio.sleep(1)
    
    # 获取结果
    result = task.artifacts[0].parts[0].text
    print(result)
```

---

## MCP 与 A2A 的关系

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ┌─────────┐    A2A     ┌─────────┐                   │
│   │ Agent A │ ←────────→ │ Agent B │                   │
│   └────┬────┘            └────┬────┘                   │
│        │                      │                        │
│       MCP                    MCP                       │
│        │                      │                        │
│   ┌────┴────┐            ┌────┴────┐                   │
│   │ Tools/  │            │ Tools/  │                   │
│   │ Data    │            │ Data    │                   │
│   └─────────┘            └─────────┘                   │
│                                                         │
│   MCP: Agent 连接工具和数据                             │
│   A2A: Agent 之间互相通信                               │
└─────────────────────────────────────────────────────────┘
```

---

## 支持 A2A 的框架

| 框架 | A2A 支持 |
|------|---------|
| Google ADK | ✅ 原生支持 |
| LangChain/LangGraph | 🔜 计划中 |
| CrewAI | 🔜 计划中 |
| AutoGen | 🔜 计划中 |

---

## 学习资源

| 资源 | 链接 |
|------|------|
| 官方规范 | [github.com/google/A2A](https://github.com/google/A2A) |
| 官方博客 | [blog.google](https://blog.google/technology/google-deepmind/agent-to-agent-a2a-protocol/) |
| 示例代码 | [github.com/google/A2A/tree/main/samples](https://github.com/google/A2A/tree/main/samples) |
