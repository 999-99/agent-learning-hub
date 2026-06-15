# AutoGen

> 微软出品的对话驱动 Multi-Agent 框架

## 简介

**AutoGen** 是微软开源的 Multi-Agent 框架，采用对话驱动的方式让多个 Agent 协作完成任务。

```
核心特点：
✅ 对话驱动的协作模式
✅ 灵活的 Agent 编排
✅ 支持代码执行
✅ 人机协作（Human-in-the-loop）
✅ 研究导向，灵活度高
```

---

## 安装

```bash
pip install autogen-agentchat autogen-ext[openai]
```

::: warning 版本说明
AutoGen 在 2024 年底进行了重大重构（v0.4+），API 有较大变化。以下示例基于新版本。
:::

---

## 核心概念

### Agent（智能体）

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.models.openai import OpenAIChatCompletionClient

# 创建模型客户端
model = OpenAIChatCompletionClient(model="gpt-4o")

# 创建 Agent
assistant = AssistantAgent(
    name="assistant",
    model_client=model,
    system_message="你是一个有帮助的助手，使用中文回答问题"
)

# 运行
from autogen_agentchat import TaskResult

async def run_agent():
    result = await assistant.run(task="什么是 AI Agent？")
    print(result.messages[-1].content)
```

### Multi-Agent 对话

```python
from autogen_agentchat.agents import AssistantAgent, UserProxyAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import TextMentionTermination

# 创建 Agent
researcher = AssistantAgent(
    name="researcher",
    model_client=model,
    system_message="你是研究员，负责搜集信息"
)

writer = AssistantAgent(
    name="writer",
    model_client=model,
    system_message="你是作家，负责撰写文章"
)

# 创建团队
team = RoundRobinGroupChat(
    [researcher, writer],
    termination_condition=TextMentionTermination("TERMINATE")
)

# 运行
async def run_team():
    result = await team.run(task="写一篇关于 AI Agent 的文章")
    for message in result.messages:
        print(f"{message.source}: {message.content}")
```

---

## 实战示例

### 代码生成与执行

```python
from autogen_agentchat.agents import AssistantAgent, CodeExecutorAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.code_executors.docker import DockerCommandLineCodeExecutor

# 代码执行器
code_executor = DockerCommandLineCodeExecutor(
    image="python:3.11-slim",
    timeout=60
)

# 代码生成 Agent
coder = AssistantAgent(
    name="coder",
    model_client=model,
    system_message="""你是一个 Python 专家，负责编写代码。
请生成完整的、可执行的 Python 代码。"""
)

# 代码执行 Agent
executor = CodeExecutorAgent(
    name="executor",
    code_executor=code_executor
)

# 团队
team = RoundRobinGroupChat(
    [coder, executor],
    max_turns=4
)

# 运行
async def run_coding_team():
    async with code_executor:
        result = await team.run(task="计算斐波那契数列的前 20 项")
        for message in result.messages:
            print(f"{message.source}: {message.content}")
```

### 研究团队

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.conditions import TextMentionTermination

# 研究员
researcher = AssistantAgent(
    name="researcher",
    model_client=model,
    system_message="你是研究员，负责搜集和整理信息"
)

# 分析师
analyst = AssistantAgent(
    name="analyst",
    model_client=model,
    system_message="你是分析师，负责分析数据和发现趋势"
)

# 报告撰写者
reporter = AssistantAgent(
    name="reporter",
    model_client=model,
    system_message="你是报告撰写者，负责将分析结果写成报告"
)

# 选择器团队 - 根据任务自动选择合适的 Agent
team = SelectorGroupChat(
    [researcher, analyst, reporter],
    model_client=model,
    termination_condition=TextMentionTermination("完成")
)

# 运行
async def run_research_team():
    result = await team.run(task="分析 AI Agent 市场的发展趋势")
    print(result.messages[-1].content)
```

---

## Human-in-the-loop

```python
from autogen_agentchat.agents import AssistantAgent, UserProxyAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import TextMentionTermination

# 人类代理
user_proxy = UserProxyAgent(
    name="user",
    input_func=lambda: input("请输入您的反馈（输入 'approve' 批准）: ")
)

# 助手
assistant = AssistantAgent(
    name="assistant",
    model_client=model,
    system_message="你是一个助手，根据用户反馈修改内容"
)

# 团队
team = RoundRobinGroupChat(
    [assistant, user_proxy],
    termination_condition=TextMentionTermination("approve")
)

# 运行 - 人类可以在每轮对话中提供反馈
async def run_with_human():
    result = await team.run(task="写一首关于 AI 的诗")
    print(result.messages[-1].content)
```

---

## 学习资源

| 资源 | 链接 |
|------|------|
| 官方文档 | [microsoft.github.io/autogen](https://microsoft.github.io/autogen/) |
| GitHub | [github.com/microsoft/autogen](https://github.com/microsoft/autogen) |
| 示例 | [github.com/microsoft/autogen/tree/main/samples](https://github.com/microsoft/autogen/tree/main/samples) |

---

## 适用场景

✅ **推荐使用：**
- 研究和实验
- 需要灵活编排的场景
- 代码生成和执行
- 人机协作场景
- 对话驱动的工作流

⚠️ **不太适合：**
- 生产环境（相对不够稳定）
- 需要简单 API 的场景
- 对性能要求极高
