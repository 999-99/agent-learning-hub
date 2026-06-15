# CrewAI

> 多 Agent 协作首选框架，角色扮演模式

## 简介

**CrewAI** 是一个专注于多 Agent 协作的框架，采用角色扮演模式，让多个 Agent 像团队一样协作完成任务。

```
核心理念：
🤖 Agent = 有角色、有目标、有背景故事的智能体
📋 Task = 具体的任务描述
👥 Crew = Agent 团队，协作完成任务
```

---

## 安装

```bash
pip install crewai crewai-tools
```

---

## 核心概念

### Agent（智能体）

```python
from crewai import Agent

researcher = Agent(
    role="Senior Researcher",
    goal="搜集和分析最新、最准确的信息",
    backstory="""你是一位经验丰富的研究员，擅长从各种来源
    获取和整理信息。你对数据的准确性和时效性有很高的要求。
    你总是从多个角度验证信息的可靠性。""",
    verbose=True,
    allow_delegation=False,
    tools=[search_tool]
)
```

### Task（任务）

```python
from crewai import Task

research_task = Task(
    description="""研究 AI Agent 的最新发展趋势，包括：
    1. 主流框架的最新进展
    2. 行业应用案例
    3. 技术挑战和未来方向""",
    expected_output="详细的研究报告，包含关键趋势、数据和案例",
    agent=researcher
)
```

### Crew（团队）

```python
from crewai import Crew

crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research_task, writing_task, editing_task],
    verbose=True,
    memory=True  # 启用记忆
)

# 执行
result = crew.kickoff()
print(result)
```

---

## 实战示例

### 内容创作团队

```python
from crewai import Agent, Task, Crew
from crewai_tools import SerperDevTool

# 工具
search_tool = SerperDevTool()

# Agent 定义
researcher = Agent(
    role="Content Researcher",
    goal="搜集热门话题和最新数据",
    backstory="""你是一位资深的内容研究员，擅长发现热门话题
    和搜集有价值的数据。你的研究总是全面而深入。""",
    tools=[search_tool],
    verbose=True
)

writer = Agent(
    role="Content Writer",
    goal="撰写引人入胜的文章",
    backstory="""你是一位才华横溢的作家，能够将复杂的信息
    转化为引人入胜的故事。你的文章清晰、有趣、易于理解。""",
    verbose=True
)

editor = Agent(
    role="Content Editor",
    goal="确保文章质量达到最高标准",
    backstory="""你是一位严格的编辑，对文章的逻辑性、准确性
    和可读性有极高的要求。你会仔细检查每一个细节。""",
    verbose=True
)

# Task 定义
research_task = Task(
    description="研究 2025 年 AI Agent 的最新发展趋势",
    expected_output="包含关键趋势、数据和案例的研究报告",
    agent=researcher
)

writing_task = Task(
    description="基于研究报告，撰写一篇 2000 字的技术博客文章",
    expected_output="一篇结构清晰、内容丰富的博客文章",
    agent=writer,
    context=[research_task]
)

editing_task = Task(
    description="审核文章，确保逻辑清晰、无语法错误、表达准确",
    expected_output="最终版本的高质量文章",
    agent=editor,
    context=[writing_task]
)

# 创建 Crew
content_crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research_task, writing_task, editing_task],
    verbose=True,
    memory=True
)

# 执行
result = content_crew.kickoff()
print(result)
```

### 研究分析团队

```python
# 数据收集 Agent
data_collector = Agent(
    role="Data Collector",
    goal="从各种来源收集相关数据",
    backstory="你擅长从网络、数据库和文档中收集数据",
    tools=[search_tool, database_tool],
    verbose=True
)

# 数据分析师
analyst = Agent(
    role="Data Analyst",
    goal="分析数据，发现趋势和洞察",
    backstory="你是一位经验丰富的数据分析师，擅长发现数据中的模式",
    tools=[analysis_tool],
    verbose=True
)

# 报告撰写者
reporter = Agent(
    role="Report Writer",
    goal="将分析结果转化为清晰的报告",
    backstory="你擅长将复杂的数据分析结果用简单的语言解释",
    verbose=True
)

# 任务
collect_task = Task(
    description="收集过去一年的销售数据",
    expected_output="完整的销售数据集",
    agent=data_collector
)

analyze_task = Task(
    description="分析销售数据，识别趋势和异常",
    expected_output="数据分析报告，包含关键发现",
    agent=analyst,
    context=[collect_task]
)

report_task = Task(
    description="撰写销售分析报告",
    expected_output="专业的销售分析报告",
    agent=reporter,
    context=[analyze_task]
)

# 执行
crew = Crew(
    agents=[data_collector, analyst, reporter],
    tasks=[collect_task, analyze_task, report_task],
    verbose=True
)

result = crew.kickoff()
```

---

## 高级特性

### 记忆系统

```python
crew = Crew(
    agents=[researcher, writer],
    tasks=[task1, task2],
    memory=True,  # 启用长期记忆
    embedder={
        "provider": "openai",
        "config": {"model": "text-embedding-3-small"}
    }
)
```

### 任务委派

```python
agent = Agent(
    role="Manager",
    goal="协调团队完成任务",
    backstory="你是一位优秀的项目经理",
    allow_delegation=True,  # 允许委派任务给其他 Agent
    verbose=True
)
```

### 自定义工具

```python
from crewai_tools import BaseTool
from pydantic import BaseModel, Field

class SearchInput(BaseModel):
    query: str = Field(description="搜索关键词")

class CustomSearchTool(BaseTool):
    name: str = "custom_search"
    description: str = "自定义搜索工具"
    args_schema: type[BaseModel] = SearchInput
    
    def _run(self, query: str) -> str:
        # 实现搜索逻辑
        return f"搜索结果: {query}"

# 使用
agent = Agent(
    role="Researcher",
    tools=[CustomSearchTool()],
    verbose=True
)
```

---

## 学习资源

| 资源 | 链接 |
|------|------|
| 官方文档 | [docs.crewai.com](https://docs.crewai.com) |
| GitHub | [github.com/crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) |
| 示例库 | [github.com/crewAIInc/crewAI-examples](https://github.com/crewAIInc/crewAI-examples) |

---

## 适用场景

✅ **推荐使用：**
- 多 Agent 协作场景
- 内容创作工作流
- 研究分析任务
- 需要角色扮演的场景
- 团队协作模拟

⚠️ **不太适合：**
- 简单的单 Agent 任务
- 需要精细流程控制
- 实时交互场景
