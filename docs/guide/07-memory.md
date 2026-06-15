# 07 - 记忆机制（Memory）

> 🎯 本章目标：理解 Agent 的记忆系统，让智能体具备上下文理解和长期记忆能力

## 为什么 Agent 需要记忆？

```
没有记忆的 Agent：
用户: "我叫张三"
Agent: "你好张三！"
用户: "我叫什么？"
Agent: "抱歉，我不知道你叫什么。"  ← 失忆了

有记忆的 Agent：
用户: "我叫张三"
Agent: "你好张三！"
用户: "我叫什么？"
Agent: "你叫张三啊！"  ← 记住了
```

---

## 记忆类型

```
┌─────────────────────────────────────────────────────┐
│                  Agent 记忆系统                      │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │  短期记忆     │  │  长期记忆     │  │  工作记忆   ││
│  │ (上下文窗口)  │  │ (向量存储)    │  │ (当前任务)  ││
│  │              │  │              │  │            ││
│  │ 当前对话      │  │ 历史对话      │  │ 中间结果    ││
│  │ 最近N轮      │  │ 用户偏好      │  │ 计划步骤    ││
│  │              │  │ 知识积累      │  │ 工具结果    ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  情景记忆     │  │  语义记忆     │                │
│  │ (经历回放)    │  │ (知识图谱)    │                │
│  │              │  │              │                │
│  │ 过往交互      │  │ 概念关系      │                │
│  │ 成功/失败经验 │  │ 事实知识      │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
```

---

## 短期记忆实现

### 对话历史管理

```python
from dataclasses import dataclass, field
from typing import Literal

@dataclass
class Message:
    role: Literal["system", "user", "assistant", "tool"]
    content: str
    timestamp: float = 0.0

class ConversationMemory:
    """对话记忆管理"""
    
    def __init__(self, max_messages: int = 20, max_tokens: int = 4000):
        self.messages: list[Message] = []
        self.max_messages = max_messages
        self.max_tokens = max_tokens
    
    def add(self, role: str, content: str):
        self.messages.append(Message(role=role, content=content))
        self._trim()
    
    def _trim(self):
        """裁剪到限制范围内"""
        # 保留 system prompt
        system_msgs = [m for m in self.messages if m.role == "system"]
        other_msgs = [m for m in self.messages if m.role != "system"]
        
        # 只保留最近的消息
        if len(other_msgs) > self.max_messages:
            other_msgs = other_msgs[-self.max_messages:]
        
        self.messages = system_msgs + other_msgs
    
    def get_messages(self) -> list[dict]:
        return [{"role": m.role, "content": m.content} for m in self.messages]
    
    def clear(self):
        """保留 system prompt，清除其他"""
        self.messages = [m for m in self.messages if m.role == "system"]

# 使用示例
memory = ConversationMemory(max_messages=10)
memory.add("system", "你是一个有帮助的助手")
memory.add("user", "我叫张三")
memory.add("assistant", "你好张三！")
memory.add("user", "我叫什么？")

# 传给 LLM
messages = memory.get_messages()
```

### 滑动窗口 + 摘要

```python
class SummaryMemory:
    """带摘要的对话记忆"""
    
    def __init__(self, max_recent: int = 5):
        self.recent_messages: list[dict] = []
        self.summary: str = ""
        self.max_recent = max_recent
    
    def add(self, role: str, content: str):
        self.recent_messages.append({"role": role, "content": content})
        
        # 超过限制时生成摘要
        if len(self.recent_messages) > self.max_recent * 2:
            self._summarize()
    
    def _summarize(self):
        """将旧消息压缩为摘要"""
        old_messages = self.recent_messages[:-self.max_recent]
        
        # 调用 LLM 生成摘要
        summary_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "请将以下对话历史压缩为简洁的摘要，保留关键信息。"},
                {"role": "user", "content": str(old_messages)}
            ]
        )
        
        new_summary = summary_response.choices[0].message.content
        
        # 合并摘要
        if self.summary:
            self.summary = f"{self.summary}\n\n{new_summary}"
        else:
            self.summary = new_summary
        
        self.recent_messages = self.recent_messages[-self.max_recent:]
    
    def get_messages(self) -> list[dict]:
        result = []
        if self.summary:
            result.append({"role": "system", "content": f"之前的对话摘要:\n{self.summary}"})
        result.extend(self.recent_messages)
        return result
```

---

## 长期记忆实现

### 基于向量的长期记忆

```python
import chromadb
from datetime import datetime

class LongTermMemory:
    """基于向量数据库的长期记忆"""
    
    def __init__(self, collection_name: str = "agent_memory"):
        self.client = chromadb.Client()
        self.collection = self.client.create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def store(self, content: str, metadata: dict = None):
        """存储记忆"""
        doc_id = f"mem_{datetime.now().timestamp()}"
        
        meta = metadata or {}
        meta["timestamp"] = datetime.now().isoformat()
        
        self.collection.add(
            documents=[content],
            ids=[doc_id],
            metadatas=[meta]
        )
    
    def recall(self, query: str, n_results: int = 5) -> list[dict]:
        """检索相关记忆"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        
        memories = []
        for doc, meta, distance in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        ):
            memories.append({
                "content": doc,
                "metadata": meta,
                "relevance": 1 - distance
            })
        
        return memories
    
    def forget(self, query: str, threshold: float = 0.5):
        """删除相关记忆"""
        results = self.collection.query(
            query_texts=[query],
            n_results=10
        )
        
        to_delete = []
        for doc_id, distance in zip(results["ids"][0], results["distances"][0]):
            if distance < threshold:
                to_delete.append(doc_id)
        
        if to_delete:
            self.collection.delete(ids=to_delete)

# 使用示例
ltm = LongTermMemory()

# 存储
ltm.store("用户张三喜欢使用 Python 编程", {"type": "preference", "user": "张三"})
ltm.store("用户的项目使用 React + TypeScript", {"type": "project", "user": "张三"})

# 检索
memories = ltm.recall("张三的技术栈")
for mem in memories:
    print(f"相关度: {mem['relevance']:.2f} | {mem['content']}")
```

---

## 工作记忆实现

### Scratchpad（记事本）

```python
class Scratchpad:
    """工作记忆 - 记事本"""
    
    def __init__(self):
        self.notes: list[dict] = []
        self.plan: list[str] = []
        self.observations: list[str] = []
        self.current_context: dict = {}
    
    def add_note(self, category: str, content: str):
        self.notes.append({
            "category": category,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
    
    def set_plan(self, steps: list[str]):
        self.plan = steps
    
    def mark_step_done(self, step_index: int):
        if 0 <= step_index < len(self.plan):
            self.plan[step_index] = f"[✓] {self.plan[step_index]}"
    
    def add_observation(self, observation: str):
        self.observations.append(observation)
    
    def get_context(self) -> str:
        """获取当前工作上下文"""
        context = []
        
        if self.plan:
            context.append("## 当前计划")
            for i, step in enumerate(self.plan):
                context.append(f"{i+1}. {step}")
        
        if self.observations:
            context.append("\n## 已获取的观察")
            for obs in self.observations[-5:]:  # 只保留最近5条
                context.append(f"- {obs}")
        
        if self.notes:
            context.append("\n## 笔记")
            for note in self.notes[-3:]:
                context.append(f"- [{note['category']}] {note['content']}")
        
        return "\n".join(context)
```

---

## 完整的记忆 Agent

```python
class MemoryAgent:
    """带完整记忆系统的 Agent"""
    
    def __init__(self, name: str):
        self.name = name
        self.conversation = ConversationMemory(max_messages=20)
        self.long_term = LongTermMemory()
        self.scratchpad = Scratchpad()
    
    def chat(self, user_input: str) -> str:
        # 1. 检索相关长期记忆
        relevant_memories = self.long_term.recall(user_input)
        memory_context = "\n".join([m["content"] for m in relevant_memories])
        
        # 2. 构建完整的上下文
        system_prompt = f"""你是 {self.name}，一个有记忆的智能助手。

## 你的长期记忆
{memory_context}

## 当前工作状态
{self.scratchpad.get_context()}

请基于以上信息回答用户问题。如果有相关的长期记忆，请利用它。"""
        
        # 3. 添加到对话历史
        self.conversation.add("system", system_prompt)
        self.conversation.add("user", user_input)
        
        # 4. 调用 LLM
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=self.conversation.get_messages(),
            tools=tools_def,
            tool_choice="auto"
        )
        
        assistant_message = response.choices[0].message.content
        
        # 5. 保存到对话历史
        self.conversation.add("assistant", assistant_message)
        
        # 6. 提取并存储重要信息到长期记忆
        self._extract_and_store(user_input, assistant_message)
        
        return assistant_message
    
    def _extract_and_store(self, user_input: str, response: str):
        """提取重要信息存储到长期记忆"""
        # 简单实现：存储用户输入中的关键信息
        # 实际应用中可以使用 LLM 来提取关键信息
        if any(keyword in user_input for keyword in ["我是", "我喜欢", "我需要"]):
            self.long_term.store(user_input, {"type": "user_info"})
```

---

## ✅ 本章检查清单

- [ ] 理解 Agent 的记忆类型（短期、长期、工作、情景、语义）
- [ ] 掌握对话历史管理（滑动窗口、摘要压缩）
- [ ] 能够实现基于向量的长期记忆
- [ ] 理解工作记忆（Scratchpad）的作用
- [ ] 能够构建带完整记忆系统的 Agent

::: tip ➡️ 下一步
记忆机制掌握了，接下来进入 [Agent 框架概览](/guide/08-frameworks)，学习主流框架。
:::
