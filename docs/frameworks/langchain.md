# LangChain / LangGraph

> 生态最完善、功能最强大的 Agent 开发框架

## 简介

**LangChain** 是目前最流行的 LLM 应用开发框架，提供了丰富的组件和工具。

**LangGraph** 是 LangChain 团队开发的状态图编排框架，专门用于构建复杂的 Agent 工作流。

```
┌─────────────────────────────────────────┐
│            LangChain 生态                │
│                                         │
│  LangChain Core  ← 基础组件             │
│       ↓                                 │
│  LangChain       ← 链和 Agent           │
│       ↓                                 │
│  LangGraph       ← 状态图编排           │
│       ↓                                 │
│  LangSmith       ← 可观测性             │
│       ↓                                 │
│  LangServe       ← API 部署             │
└─────────────────────────────────────────┘
```

---

## 安装

```bash
pip install langchain langchain-openai langgraph
```

---

## 核心概念

### 1. Chain（链）

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 创建链
prompt = ChatPromptTemplate.from_template(
    "请用一句话解释什么是{concept}"
)
llm = ChatOpenAI(model="gpt-4o")
output_parser = StrOutputParser()

chain = prompt | llm | output_parser

# 调用
result = chain.invoke({"concept": "AI Agent"})
print(result)
```

### 2. Agent（智能体）

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate

# 定义工具
@tool
def search(query: str) -> str:
    """搜索信息"""
    return f"搜索结果: {query}"

@tool
def calculator(expression: str) -> str:
    """数学计算"""
    try:
        return str(eval(expression))
    except:
        return "计算错误"

# 创建 Agent
llm = ChatOpenAI(model="gpt-4o")
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个有帮助的助手"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
])

agent = create_tool_calling_agent(llm, [search, calculator], prompt)
executor = AgentExecutor(agent=agent, tools=[search, calculator], verbose=True)

# 运行
result = executor.invoke({"input": "帮我计算 15 * 23"})
print(result["output"])
```

### 3. RAG（检索增强生成）

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# 创建向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_texts(
    ["AI Agent 是智能系统", "RAG 增强生成能力", "MCP 标准化工具接口"],
    embeddings
)
retriever = vectorstore.as_retriever()

# 创建 RAG 链
prompt = ChatPromptTemplate.from_template("""
基于以下上下文回答问题:
{context}

问题: {question}
""")

llm = ChatOpenAI(model="gpt-4o")

rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

result = rag_chain.invoke("什么是 RAG？")
print(result)
```

---

## LangGraph 详解

LangGraph 使用状态图来编排 Agent 工作流，适合构建复杂的多步骤 Agent。

### 基础示例

```python
from langgraph.graph import StateGraph, MessagesState, START, END
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o")

# 定义节点
def agent(state: MessagesState):
    messages = state["messages"]
    response = model.invoke(messages)
    return {"messages": [response]}

def tool_node(state: MessagesState):
    # 执行工具调用
    last_message = state["messages"][-1]
    results = []
    for tool_call in last_message.tool_calls:
        result = execute_tool(tool_call)
        results.append(result)
    return {"messages": results}

# 构建图
graph = StateGraph(MessagesState)
graph.add_node("agent", agent)
graph.add_node("tools", tool_node)

# 定义边
graph.add_edge(START, "agent")
graph.add_conditional_edges(
    "agent",
    should_continue,  # 判断是否需要调用工具
    {
        "continue": "tools",
        "end": END
    }
)
graph.add_edge("tools", "agent")

# 编译
app = graph.compile()

# 运行
result = app.invoke({"messages": [{"role": "user", "content": "你好"}]})
```

### Multi-Agent 示例

```python
from langgraph.prebuilt import create_react_agent
from langgraph_supervisor import create_supervisor

# 创建专业 Agent
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

# 创建 Supervisor
supervisor = create_supervisor(
    agents=[researcher, writer],
    model=model,
    prompt="你是主管，协调研究员和作家完成任务"
)

app = supervisor.compile()
result = app.invoke({"messages": [{"role": "user", "content": "写一篇关于AI的文章"}]})
```

---

## 常用组件

### Prompt 模板

```python
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# 基础模板
prompt = ChatPromptTemplate.from_template("请解释{topic}")

# 多消息模板
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}"),
    MessagesPlaceholder("history"),
    ("human", "{input}")
])
```

### 输出解析器

```python
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from pydantic import BaseModel

class Answer(BaseModel):
    answer: str
    confidence: float

parser = JsonOutputParser(pydantic_object=Answer)
```

### 工具定义

```python
from langchain_core.tools import tool

@tool
def my_tool(query: str, max_results: int = 5) -> str:
    """工具描述"""
    return "结果"

# 从函数创建工具
from langchain_core.tools import StructuredTool

tool = StructuredTool.from_function(
    func=my_function,
    name="my_tool",
    description="工具描述"
)
```

---

## 学习资源

| 资源 | 链接 |
|------|------|
| 官方文档 | [python.langchain.com](https://python.langchain.com) |
| LangGraph 文档 | [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph/) |
| GitHub | [github.com/langchain-ai/langchain](https://github.com/langchain-ai/langchain) |
| LangSmith | [smith.langchain.com](https://smith.langchain.com) |
| Academy | [academy.langchain.com](https://academy.langchain.com) |

---

## 适用场景

✅ **推荐使用：**
- 复杂的 Agent 工作流
- 需要精细控制的场景
- 多 Agent 协作系统
- 需要 RAG + Agent 结合
- 企业级生产应用

⚠️ **不太适合：**
- 极简的简单任务（杀鸡用牛刀）
- 对启动速度要求极高
- 非 Python 环境
