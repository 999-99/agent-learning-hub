# 04 - RAG 检索增强生成

> 🎯 本章目标：理解 RAG 的原理和实现，让 Agent 能够访问外部知识

## 什么是 RAG？

RAG（Retrieval-Augmented Generation）是让 LLM 能够访问外部知识的核心技术。

```
传统 LLM：只能基于训练数据回答
RAG：先检索相关知识，再生成回答 → 更准确、更及时、更专业
```

### RAG 工作流程

```
用户提问
    ↓
┌─────────────────┐
│  Query 处理      │  将问题转为向量
│  (Embedding)    │
└─────────────────┘
    ↓
┌─────────────────┐
│  向量检索        │  在知识库中搜索相似内容
│  (Vector Search) │
└─────────────────┘
    ↓
┌─────────────────┐
│  结果排序        │  Reranking 筛选最相关结果
│  (Reranking)    │
└─────────────────┘
    ↓
┌─────────────────┐
│  Prompt 增强     │  将检索结果注入 Prompt
│  (Augmentation) │
└─────────────────┘
    ↓
┌─────────────────┐
│  LLM 生成       │  基于增强上下文生成回答
│  (Generation)   │
└─────────────────┘
    ↓
最终回答
```

---

## 核心组件

### 1. Embedding 模型

将文本转换为向量表示，是 RAG 的基础。

```python
from openai import OpenAI

client = OpenAI()

# 文本向量化
def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """将文本转换为向量"""
    response = client.embeddings.create(
        model=model,
        input=text
    )
    return response.data[0].embedding

# 示例
vector = get_embedding("什么是 AI Agent？")
print(f"向量维度: {len(vector)}")  # 1536 维
print(f"前5个值: {vector[:5]}")
```

**常用 Embedding 模型：**

| 模型 | 维度 | 特点 |
|------|------|------|
| text-embedding-3-small | 1536 | 性价比高 |
| text-embedding-3-large | 3072 | 精度更高 |
| BGE-M3 | 1024 | 开源，多语言 |
| Jina-embeddings-v3 | 1024 | 开源，长文本 |

### 2. 向量数据库

存储和检索向量的专用数据库。

```python
# ChromaDB - 轻量级向量数据库
import chromadb

# 创建客户端
client = chromadb.Client()  # 内存模式
# client = chromadb.PersistentClient(path="./chroma_db")  # 持久化

# 创建集合
collection = client.create_collection(
    name="knowledge_base",
    metadata={"hnsw:space": "cosine"}  # 使用余弦相似度
)

# 添加文档
collection.add(
    documents=["AI Agent 是一种能够自主决策和执行任务的智能系统", 
               "RAG 通过检索外部知识来增强 LLM 的回答能力",
               "MCP 是 Anthropic 提出的模型上下文协议"],
    ids=["doc1", "doc2", "doc3"]
)

# 查询
results = collection.query(
    query_texts=["什么是 Agent？"],
    n_results=2
)

print("检索结果:")
for doc, distance in zip(results["documents"][0], results["distances"][0]):
    print(f"  相似度: {1-distance:.4f} | 内容: {doc}")
```

### 3. 文档分块策略

将长文档切分成合适大小的片段。

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 递归字符分块器
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,        # 每块最大字符数
    chunk_overlap=50,      # 块之间的重叠字符数
    separators=["\n\n", "\n", "。", "！", "？", "，", " ", ""]
)

text = """
AI Agent 是一种能够自主决策和执行任务的智能系统。
它结合了大语言模型的推理能力和工具调用能力。
RAG 技术让 Agent 能够访问外部知识库。
MCP 协议提供了标准化的工具接口。
"""

chunks = splitter.split_text(text)
for i, chunk in enumerate(chunks):
    print(f"块 {i+1}: {chunk}")
```

**分块策略对比：**

| 策略 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| 固定大小 | 通用 | 简单高效 | 可能切断语义 |
| 递归分割 | 文档 | 保持语义完整 | 参数需调优 |
| 语义分块 | 高质量需求 | 语义最完整 | 计算成本高 |
| 按结构分块 | 代码/表格 | 保持结构 | 需要解析器 |

---

## 完整 RAG 实现

### 使用 LangChain 构建 RAG

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# 1. 准备文档
documents = [
    "AI Agent 是一种能够自主决策和执行任务的智能系统。",
    "RAG 通过检索外部知识来增强 LLM 的回答能力。",
    "MCP 是 Anthropic 提出的模型上下文协议，标准化了工具接口。",
    "LangGraph 是 LangChain 团队开发的 Agent 编排框架。",
]

# 2. 创建向量存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_texts(documents, embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# 3. 创建 Prompt
prompt = ChatPromptTemplate.from_template("""
基于以下上下文信息回答用户的问题。如果上下文中没有相关信息，请说明你不确定。

上下文：
{context}

问题：{question}

回答：
""")

# 4. 构建 RAG Chain
llm = ChatOpenAI(model="gpt-4o", temperature=0)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

# 5. 使用
answer = rag_chain.invoke("什么是 RAG？")
print(answer)
```

### 使用 LlamaIndex 构建 RAG

```python
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

# 1. 加载文档
documents = SimpleDirectoryReader("./data").load_data()

# 2. 创建索引
index = VectorStoreIndex.from_documents(documents)

# 3. 创建查询引擎
query_engine = index.as_query_engine()

# 4. 查询
response = query_engine.query("什么是 AI Agent？")
print(response)
```

---

## RAG 优化技巧

### 1. 混合检索（Hybrid Search）

结合关键词检索和语义检索的优势。

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# BM25 关键词检索
bm25_retriever = BM25Retriever.from_texts(documents, k=3)

# 向量语义检索
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# 混合检索
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.4, 0.6]  # BM25 权重 0.4，向量权重 0.6
)
```

### 2. Reranking（重排序）

对检索结果进行二次排序，提高相关性。

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank

# 使用 Cohere Rerank
reranker = CohereRerank(model="rerank-v3.5", top_n=3)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=vector_retriever
)

# 检索并重排序
results = compression_retriever.invoke("什么是 Agent？")
```

### 3. 查询改写（Query Rewriting）

优化用户查询，提高检索效果。

```python
from langchain.prompts import ChatPromptTemplate

# 查询改写 Prompt
rewrite_prompt = ChatPromptTemplate.from_template("""
你是一个查询优化专家。请将用户的原始问题改写为更适合检索的形式。

原始问题：{question}

改写后的查询（只输出改写后的查询，不要其他内容）：
""")

# 多查询生成
multi_query_prompt = ChatPromptTemplate.from_template("""
你是一个查询优化专家。请将用户的原始问题从3个不同角度重新表述，以提高检索覆盖率。

原始问题：{question}

请生成3个不同角度的查询：
1.
2.
3.
""")
```

---

## RAG 评估

### 评估指标

| 指标 | 说明 | 计算方式 |
|------|------|---------|
| **Recall@K** | 前K个结果中包含正确答案的比例 | 命中数 / 总相关文档数 |
| **MRR** | 平均倒数排名 | 1/第一个正确结果的排名 |
| **Faithfulness** | 回答与检索内容的一致性 | LLM 评估 |
| **Relevance** | 回答与问题的相关性 | LLM 评估 |

### 使用 RAGAS 评估

```python
# 安装: pip install ragas
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

# 准备评估数据
eval_data = {
    "question": ["什么是 RAG？"],
    "answer": ["RAG 是检索增强生成技术..."],
    "contexts": [["RAG 通过检索外部知识来增强 LLM 的回答能力"]],
    "ground_truth": ["RAG 是一种结合检索和生成的 AI 技术"]
}

# 评估
result = evaluate(eval_data, metrics=[faithfulness, answer_relevancy])
print(result)
```

---

## ✅ 本章检查清单

- [ ] 理解 RAG 的工作原理和流程
- [ ] 掌握 Embedding 模型的使用
- [ ] 能够使用向量数据库存储和检索文档
- [ ] 掌握文档分块策略
- [ ] 能够构建完整的 RAG 应用
- [ ] 了解 RAG 优化技巧（混合检索、Reranking、查询改写）

::: tip ➡️ 下一步
掌握了 RAG，接下来学习 [Function Calling / Tool Use](/guide/05-function-calling)。
:::
