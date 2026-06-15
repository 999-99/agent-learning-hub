# 02 - 提示词工程（Prompt Engineering）

> 🎯 本章目标：掌握与 LLM 高效交互的提示词技巧，这是 Agent 开发的核心基础

## 为什么 Prompt Engineering 如此重要？

Prompt 是 Agent 的"灵魂"。一个好的 Prompt 能让 LLM：
- 准确理解任务意图
- 按照预期格式输出
- 具备特定的角色和行为模式
- 减少幻觉，提高可靠性

---

## 基础提示词技巧

### 1. 角色设定（System Prompt）

```markdown
# System Prompt 示例 - 代码助手
你是一位资深的 Python 开发专家，擅长代码审查和优化。

## 行为准则
- 始终提供可运行的代码示例
- 解释每段代码的作用
- 指出潜在的性能问题和安全隐患
- 使用中文回答

## 输出格式
- 先给出结论
- 再提供代码示例
- 最后补充注意事项
```

### 2. 指令明确化

```markdown
# ❌ 模糊指令
帮我分析一下这个数据

# ✅ 明确指令
请分析以下 CSV 销售数据，完成以下任务：
1. 计算每月的总销售额
2. 找出销售额最高和最低的月份
3. 计算月均增长率
4. 用表格形式呈现结果
```

### 3. 输出格式控制

```markdown
请以 JSON 格式返回分析结果，结构如下：
{
  "summary": "一句话总结",
  "monthly_sales": [
    {"month": "2025-01", "amount": 10000, "growth_rate": 0.05}
  ],
  "insights": ["洞察1", "洞察2"]
}
```

---

## 高级提示词技巧

### Chain-of-Thought（思维链）

让 LLM 展示推理过程，显著提高复杂任务的准确率。

```markdown
请一步一步思考这个问题：

问题：一家公司有 100 名员工，30% 是工程师，工程师中 40% 擅长 Python。
如果公司要组建一个 5 人的 Python 项目团队，有多少种组合方式？

请展示你的推理过程：
1. 首先计算工程师人数
2. 然后计算擅长 Python 的工程师人数
3. 最后计算组合数
```

### Few-shot Learning（少样本学习）

通过提供示例来引导 LLM 的输出模式。

```markdown
请将以下用户评价分类为"正面"、"负面"或"中性"。

示例：
评价："这个产品太棒了！" → 正面
评价："还行吧，一般般" → 中性
评价："质量太差了，退货！" → 负面

现在请分类：
评价："物流很快，包装也不错"
```

### Self-Consistency（自一致性）

让 LLM 从多个角度思考，取最一致的答案。

```markdown
请从三个不同的角度分析这个问题，然后给出你认为最可靠的结论：

角度1 - 经济角度：
角度2 - 技术角度：
角度3 - 用户体验角度：

综合分析，我的结论是：
```

---

## Agent System Prompt 设计

Agent 的 System Prompt 是最关键的部分，它决定了 Agent 的行为模式。

### 完整的 Agent System Prompt 模板

```markdown
# 角色定义
你是一个智能数据分析 Agent，能够帮助用户分析数据、生成报告。

# 核心能力
1. 数据查询：从数据库中检索数据
2. 数据分析：执行统计分析和趋势识别
3. 可视化：生成图表和报告
4. 问答：回答关于数据的问题

# 可用工具
- `query_database`: 执行 SQL 查询
- `create_chart`: 生成可视化图表
- `generate_report`: 生成分析报告

# 行为准则
- 在调用工具前，先说明你的意图
- 如果不确定，先询问用户而不是假设
- 每次分析都要给出明确的结论
- 使用中文回答，专业术语保留英文原文

# 输出格式
## 分析过程
[描述你的分析思路]

## 工具调用
[如果需要调用工具，说明原因]

## 结论
[清晰的分析结论]

## 建议
[基于分析的行动建议]

# 限制
- 不要编造数据
- 不要做出超出数据范围的推断
- 敏感数据需要脱敏处理
```

### ReAct 模式的 Prompt

ReAct（Reasoning + Acting）是 Agent 最常用的架构模式。

```markdown
你是一个能使用工具的智能助手。请按照以下格式回答问题：

Thought: [分析当前情况，决定下一步行动]
Action: [选择要使用的工具]
Action Input: [工具的输入参数]
Observation: [工具返回的结果]
... (可以重复 Thought/Action/Action Input/Observation)
Thought: [基于所有观察，得出最终结论]
Final Answer: [最终回答]

可用工具：
- search(query): 搜索网络信息
- calculate(expression): 执行数学计算
- lookup(term): 查询词典定义
```

---

## Prompt 优化策略

### 迭代优化流程

```
初始 Prompt → 测试 → 分析问题 → 优化 → 再测试 → ...
     ↑                                          |
     └──────────────────────────────────────────┘
```

### 常见问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 输出格式不稳定 | 缺少格式约束 | 添加明确的格式示例 |
| 回答过于冗长 | 没有长度限制 | 添加字数/条数限制 |
| 幻觉（编造信息） | 模型不确定时猜测 | 添加"如果不确定请说明" |
| 不按指令执行 | 指令不够明确 | 使用编号列表，逐条说明 |
| 语言混用 | 没有语言约束 | 明确指定输出语言 |

### 温度参数调节

```python
# 低温度 (0-0.3)：确定性高，适合事实性任务
response = client.chat.completions.create(
    model="gpt-4o",
    temperature=0.1,  # 几乎确定性输出
    messages=[{"role": "user", "content": "2+2=?"}]
)

# 中温度 (0.4-0.7)：平衡，适合大多数任务
response = client.chat.completions.create(
    model="gpt-4o",
    temperature=0.5,  # 适度创造性
    messages=[{"role": "user", "content": "写一封商务邮件"}]
)

# 高温度 (0.8-1.0)：创造性高，适合创意任务
response = client.chat.completions.create(
    model="gpt-4o",
    temperature=0.9,  # 高创造性
    messages=[{"role": "user", "content": "写一首诗"}]
)
```

---

## 实战练习

### 练习 1：设计一个客服 Agent 的 System Prompt

```markdown
# 你的任务
设计一个电商客服 Agent 的 System Prompt，要求：
1. 能处理退换货、物流查询、商品咨询
2. 语气友好专业
3. 遇到无法处理的问题要转人工
4. 输出格式统一
```

### 练习 2：优化一个模糊的 Prompt

```markdown
# 原始 Prompt（有问题）
帮我写个总结

# 你的任务
优化这个 Prompt，使其：
1. 明确总结的内容来源
2. 指定总结的长度和格式
3. 定义目标受众
4. 添加质量标准
```

---

## ✅ 本章检查清单

- [ ] 理解 System Prompt 的作用和设计原则
- [ ] 掌握 CoT、Few-shot、Self-consistency 等高级技巧
- [ ] 能够设计 Agent 的 System Prompt
- [ ] 理解 ReAct 模式的 Prompt 结构
- [ ] 掌握 Prompt 迭代优化方法

::: tip ➡️ 下一步
掌握了 Prompt Engineering，接下来学习 [LLM API 调用](/guide/03-llm-api)。
:::
