# 09 - MCP 协议

> 🎯 本章目标：理解 Model Context Protocol（MCP），这是 2025 年最重要的 Agent 协议标准

## 什么是 MCP？

MCP（Model Context Protocol）是 Anthropic 在 2024 年 11 月发布的开放协议，旨在标准化 AI 模型与外部数据源和工具之间的连接方式。

```
┌─────────────────────────────────────────────────────────┐
│                    MCP 架构                              │
│                                                         │
│  ┌──────────────┐                ┌──────────────┐      │
│  │  MCP Client  │  ←──── MCP ───→│  MCP Server  │      │
│  │  (AI 应用)   │                │  (工具/数据)  │      │
│  └──────────────┘                └──────────────┘      │
│                                                         │
│  Client 示例:                    Server 示例:           │
│  • Claude Desktop                • 文件系统              │
│  • Cursor IDE                    • GitHub API           │
│  • 自定义 Agent                  • 数据库               │
│  • LangChain                     • Slack                │
└─────────────────────────────────────────────────────────┘
```

### 为什么 MCP 很重要？

```
没有 MCP：
  每个 AI 应用 × 每个工具 = M × N 个集成

有了 MCP：
  每个 AI 应用实现 MCP Client + 每个工具实现 MCP Server = M + N 个集成
```

---

## MCP 三大原语

### 1. Tools（工具）

模型可以调用的函数。

```json
{
  "name": "read_file",
  "description": "读取文件内容",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "文件路径"
      }
    },
    "required": ["path"]
  }
}
```

### 2. Resources（资源）

提供上下文数据给模型。

```json
{
  "uri": "file:///project/README.md",
  "name": "项目说明",
  "description": "项目的 README 文件",
  "mimeType": "text/markdown"
}
```

### 3. Prompts（提示模板）

预定义的提示词模板。

```json
{
  "name": "code_review",
  "description": "代码审查提示词",
  "arguments": [
    {
      "name": "code",
      "description": "要审查的代码",
      "required": true
    }
  ]
}
```

---

## 实现 MCP Server

### TypeScript MCP Server

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 创建 MCP Server
const server = new McpServer({
  name: "my-knowledge-base",
  version: "1.0.0",
});

// 定义 Tool
server.tool(
  "search_knowledge",
  "搜索知识库",
  { query: z.string().describe("搜索关键词") },
  async ({ query }) => {
    // 实现搜索逻辑
    const results = await searchDatabase(query);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }
);

// 定义 Resource
server.resource(
  "config",
  "config://app",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: JSON.stringify({ appName: "MyApp", version: "1.0" }),
      },
    ],
  })
);

// 定义 Prompt
server.prompt(
  "summarize",
  "总结文档",
  { text: z.string() },
  ({ text }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `请总结以下内容:\n\n${text}`,
        },
      },
    ],
  })
);

// 启动 Server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Python MCP Server

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# 创建 Server
server = Server("my-knowledge-base")

@server.list_tools()
async def list_tools():
    """列出可用工具"""
    return [
        Tool(
            name="search_knowledge",
            description="搜索知识库",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词"
                    }
                },
                "required": ["query"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    """处理工具调用"""
    if name == "search_knowledge":
        query = arguments["query"]
        results = await search_database(query)
        return [TextContent(type="text", text=str(results))]

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())

import asyncio
asyncio.run(main())
```

---

## 在 Claude Desktop 中使用 MCP

### 配置文件

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/username/Documents"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

---

## 在代码中使用 MCP Client

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# 连接到 MCP Server
server_params = StdioServerParameters(
    command="npx",
    args=["-y", "@modelcontextprotocol/server-filesystem", "."],
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        # 初始化
        await session.initialize()
        
        # 列出工具
        tools = await session.list_tools()
        print(f"可用工具: {[t.name for t in tools.tools]}")
        
        # 调用工具
        result = await session.call_tool(
            "read_file",
            arguments={"path": "README.md"}
        )
        print(f"结果: {result.content[0].text}")
```

---

## MCP 生态

### 官方 MCP Server

| Server | 功能 | 安装 |
|--------|------|------|
| **Filesystem** | 文件系统访问 | `@modelcontextprotocol/server-filesystem` |
| **GitHub** | GitHub API | `@modelcontextprotocol/server-github` |
| **GitLab** | GitLab API | `@modelcontextprotocol/server-gitlab` |
| **Google Drive** | Google Drive | `@modelcontextprotocol/server-gdrive` |
| **Slack** | Slack API | `@modelcontextprotocol/server-slack` |
| **Brave Search** | 网页搜索 | `@modelcontextprotocol/server-brave-search` |
| **Memory** | 知识图谱 | `@modelcontextprotocol/server-memory` |
| **PostgreSQL** | 数据库 | `@modelcontextprotocol/server-postgres` |
| **Puppeteer** | 浏览器自动化 | `@modelcontextprotocol/server-puppeteer` |

### 社区 MCP Server

MCP 生态正在快速发展，社区贡献了大量 Server：
- 搜索引擎集成
- 云服务（AWS、GCP、Azure）
- 开发工具（Docker、Kubernetes）
- 办公工具（Notion、Jira）
- 数据分析工具

---

## ✅ 本章检查清单

- [ ] 理解 MCP 的设计理念和架构
- [ ] 掌握三大原语：Tools、Resources、Prompts
- [ ] 能够实现一个 MCP Server
- [ ] 能够在 Claude Desktop 中配置 MCP
- [ ] 了解 MCP 生态和可用的 Server

::: tip ➡️ 下一步
接下来学习 [Multi-Agent 系统](/guide/10-multi-agent)。
:::
