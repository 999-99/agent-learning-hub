# MCP 协议详解

> Model Context Protocol — 2025 年最重要的 Agent 协议标准

## 概述

MCP（Model Context Protocol）是 Anthropic 在 2024 年 11 月发布的开放协议，旨在标准化 AI 模型与外部数据源和工具之间的连接方式。

```
MCP 的价值：
  之前：每个 AI 应用 × 每个工具 = M × N 个集成
  之后：每个应用实现 Client + 每个工具实现 Server = M + N 个集成
```

---

## 架构详解

```
┌──────────────────────────────────────────────────────────────┐
│                      MCP 架构                                │
│                                                              │
│   ┌─────────────────┐        ┌─────────────────┐            │
│   │   MCP Host      │        │   MCP Server    │            │
│   │   (AI 应用)     │        │   (工具/数据)    │            │
│   │                 │        │                 │            │
│   │  ┌───────────┐  │  MCP   │  ┌───────────┐  │            │
│   │  │MCP Client│←─┼────────┼─→│  Tools    │  │            │
│   │  └───────────┘  │        │  │ Resources │  │            │
│   │                 │        │  │ Prompts   │  │            │
│   └─────────────────┘        │  └───────────┘  │            │
│                              └─────────────────┘            │
│                                                              │
│   Host 示例:                     Server 示例:               │
│   • Claude Desktop               • 文件系统                  │
│   • Cursor IDE                   • GitHub                   │
│   • 自定义 Agent                 • 数据库                   │
│   • LangChain                    • Slack/飞书               │
└──────────────────────────────────────────────────────────────┘
```

### 通信协议

MCP 支持两种传输方式：

| 传输方式 | 说明 | 适用场景 |
|---------|------|---------|
| **stdio** | 标准输入输出 | 本地进程 |
| **SSE** | Server-Sent Events | 远程服务 |

---

## 三大原语详解

### 1. Tools（工具）

工具是模型可以调用的函数，是 MCP 最核心的能力。

```typescript
// 定义工具
server.tool(
  "read_file",           // 工具名
  "读取文件内容",         // 描述
  {                      // 参数 Schema
    path: z.string().describe("文件路径")
  },
  async ({ path }) => {  // 处理函数
    const content = await fs.readFile(path, "utf-8");
    return {
      content: [{ type: "text", text: content }]
    };
  }
);
```

**工具设计原则：**

```typescript
// ❌ 差的设计
server.tool("do", "做事情", {}, async () => {});

// ✅ 好的设计
server.tool(
  "search_documents",
  "在知识库中搜索文档。支持关键词搜索和语义搜索。返回最相关的文档列表。",
  {
    query: z.string().describe("搜索关键词"),
    limit: z.number().default(5).describe("返回结果数量"),
    search_type: z.enum(["keyword", "semantic"]).default("semantic")
  },
  async ({ query, limit, search_type }) => {
    // 实现...
  }
);
```

### 2. Resources（资源）

资源提供上下文数据给模型。

```typescript
// 静态资源
server.resource(
  "config",
  "config://app",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify({ appName: "MyApp", version: "1.0" }),
      mimeType: "application/json"
    }]
  })
);

// 动态资源
server.resource(
  "file",
  "file://{path}",
  async (uri, { path }) => {
    const content = await fs.readFile(path, "utf-8");
    return {
      contents: [{
        uri: uri.href,
        text: content,
        mimeType: "text/plain"
      }]
    };
  }
);
```

### 3. Prompts（提示模板）

```typescript
server.prompt(
  "code_review",
  "代码审查提示词",
  {
    code: z.string().describe("要审查的代码"),
    language: z.string().optional().describe("编程语言")
  },
  ({ code, language }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `请审查以下${language || ""}代码：\n\n\`\`\`\n${code}\n\`\`\``
      }
    }]
  })
);
```

---

## 完整 MCP Server 示例

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "knowledge-base",
  version: "1.0.0",
});

// 工具：搜索知识库
server.tool(
  "search",
  "搜索知识库",
  { query: z.string() },
  async ({ query }) => {
    const results = await searchKnowledgeBase(query);
    return {
      content: [{ type: "text", text: JSON.stringify(results) }]
    };
  }
);

// 工具：添加文档
server.tool(
  "add_document",
  "添加文档到知识库",
  {
    title: z.string(),
    content: z.string(),
    category: z.string().optional()
  },
  async ({ title, content, category }) => {
    await addDocument({ title, content, category });
    return {
      content: [{ type: "text", text: `文档 "${title}" 已添加` }]
    };
  }
);

// 资源：知识库统计
server.resource(
  "stats",
  "stats://knowledge-base",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(await getStats()),
      mimeType: "application/json"
    }]
  })
);

// 启动
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Python MCP Server

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

server = Server("knowledge-base")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="search",
            description="搜索知识库",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "搜索关键词"}
                },
                "required": ["query"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search":
        results = await search_db(arguments["query"])
        return [TextContent(type="text", text=str(results))]

async def main():
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())

import asyncio
asyncio.run(main())
```

---

## MCP Client 使用

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        
        # 列出工具
        tools = await session.list_tools()
        
        # 调用工具
        result = await session.call_tool("search", {"query": "AI Agent"})
        
        # 读取资源
        resource = await session.read_resource("stats://knowledge-base")
```

---

## 官方 MCP Server 列表

| Server | 功能 | npm 包 |
|--------|------|--------|
| Filesystem | 文件系统 | `@modelcontextprotocol/server-filesystem` |
| GitHub | GitHub API | `@modelcontextprotocol/server-github` |
| GitLab | GitLab API | `@modelcontextprotocol/server-gitlab` |
| Google Drive | Google Drive | `@modelcontextprotocol/server-gdrive` |
| Slack | Slack API | `@modelcontextprotocol/server-slack` |
| Brave Search | 网页搜索 | `@modelcontextprotocol/server-brave-search` |
| Memory | 知识图谱 | `@modelcontextprotocol/server-memory` |
| PostgreSQL | 数据库 | `@modelcontextprotocol/server-postgres` |
| Puppeteer | 浏览器 | `@modelcontextprotocol/server-puppeteer` |
| Google Maps | 地图 | `@modelcontextprotocol/server-google-maps` |

---

## 学习资源

| 资源 | 链接 |
|------|------|
| 官方文档 | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| GitHub | [github.com/modelcontextprotocol](https://github.com/modelcontextprotocol) |
| Python SDK | [github.com/modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk) |
| TypeScript SDK | [github.com/modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) |
