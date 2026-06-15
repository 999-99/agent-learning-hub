# 13 - 部署与运维

> 🎯 本章目标：掌握 Agent 应用的部署和运维最佳实践

## 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                  生产环境架构                             │
│                                                         │
│  用户 → 负载均衡 → API 网关 → Agent 服务 → LLM API     │
│                              ↓                          │
│                         向量数据库                       │
│                         缓存层                          │
│                         消息队列                        │
│                              ↓                          │
│                         监控系统                        │
│                         日志系统                        │
└─────────────────────────────────────────────────────────┘
```

---

## API 服务化

### FastAPI 部署

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI(title="Agent API")

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    model: str = "gpt-4o"

class ChatResponse(BaseModel):
    response: str
    session_id: str
    tokens_used: int

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        agent = get_or_create_agent(request.session_id)
        result = await agent.run(request.message)
        
        return ChatResponse(
            response=result.content,
            session_id=request.session_id or new_session_id(),
            tokens_used=result.tokens_used
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 流式输出

```python
from fastapi.responses import StreamingResponse
import asyncio

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        agent = get_or_create_agent(request.session_id)
        async for chunk in agent.run_stream(request.message):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

---

## Docker 部署

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  agent-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - redis
      - chromadb
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  chromadb:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma

volumes:
  redis_data:
  chroma_data:
```

---

## 缓存策略

```python
import redis
import json
import hashlib

class AgentCache:
    """Agent 响应缓存"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
        self.ttl = 3600  # 1小时过期
    
    def _make_key(self, message: str, model: str) -> str:
        """生成缓存键"""
        content = f"{message}:{model}"
        return f"agent:cache:{hashlib.md5(content.encode()).hexdigest()}"
    
    def get(self, message: str, model: str) -> str | None:
        """获取缓存"""
        key = self._make_key(message, model)
        result = self.redis.get(key)
        return result.decode() if result else None
    
    def set(self, message: str, model: str, response: str):
        """设置缓存"""
        key = self._make_key(message, model)
        self.redis.setex(key, self.ttl, response)

# 使用
cache = AgentCache()

async def chat_with_cache(message: str, model: str = "gpt-4o"):
    # 检查缓存
    cached = cache.get(message, model)
    if cached:
        return cached
    
    # 调用 Agent
    response = await agent.run(message)
    
    # 缓存结果
    cache.set(message, model, response)
    
    return response
```

---

## 成本优化

### Token 管理

```python
class TokenManager:
    """Token 使用管理"""
    
    def __init__(self, daily_limit: int = 1000000):
        self.daily_limit = daily_limit
        self.usage = {}
    
    def check_budget(self, estimated_tokens: int) -> bool:
        """检查是否超出预算"""
        today = datetime.now().date().isoformat()
        used = self.usage.get(today, 0)
        return (used + estimated_tokens) <= self.daily_limit
    
    def record_usage(self, tokens: int):
        """记录使用量"""
        today = datetime.now().date().isoformat()
        self.usage[today] = self.usage.get(today, 0) + tokens
    
    def get_usage(self) -> dict:
        """获取使用统计"""
        today = datetime.now().date().isoformat()
        return {
            "today": self.usage.get(today, 0),
            "limit": self.daily_limit,
            "remaining": self.daily_limit - self.usage.get(today, 0)
        }

# 使用
token_mgr = TokenManager(daily_limit=500000)

async def chat_with_budget(message: str):
    estimated = estimate_tokens(message)
    
    if not token_mgr.check_budget(estimated):
        return "今日使用量已达上限，请明天再试"
    
    response = await agent.run(message)
    token_mgr.record_usage(response.tokens_used)
    
    return response.content
```

### 模型选择策略

```python
def select_model(task_complexity: str) -> str:
    """根据任务复杂度选择模型"""
    model_map = {
        "simple": "gpt-4o-mini",     # 简单任务用小模型
        "medium": "gpt-4o",           # 中等任务用标准模型
        "complex": "gpt-4o",          # 复杂任务用大模型
    }
    return model_map.get(task_complexity, "gpt-4o-mini")
```

---

## 监控与告警

```python
from dataclasses import dataclass
from datetime import datetime
import logging

@dataclass
class Metric:
    name: str
    value: float
    timestamp: datetime
    tags: dict = None

class AgentMonitor:
    """Agent 监控"""
    
    def __init__(self):
        self.metrics = []
        self.logger = logging.getLogger("agent")
    
    def record_response_time(self, duration_ms: float):
        self.metrics.append(Metric(
            name="response_time",
            value=duration_ms,
            timestamp=datetime.now()
        ))
        
        # 告警
        if duration_ms > 10000:  # 超过10秒
            self.logger.warning(f"响应时间过长: {duration_ms}ms")
    
    def record_error(self, error_type: str):
        self.metrics.append(Metric(
            name="error",
            value=1,
            timestamp=datetime.now(),
            tags={"type": error_type}
        ))
        
        self.logger.error(f"Agent 错误: {error_type}")
    
    def get_stats(self) -> dict:
        response_times = [m.value for m in self.metrics if m.name == "response_time"]
        errors = [m for m in self.metrics if m.name == "error"]
        
        return {
            "avg_response_time": sum(response_times) / len(response_times) if response_times else 0,
            "total_errors": len(errors),
            "total_requests": len(response_times)
        }
```

---

## ✅ 本章检查清单

- [ ] 能够将 Agent 部署为 API 服务
- [ ] 掌握 Docker 容器化部署
- [ ] 理解缓存策略和实现
- [ ] 掌握成本优化方法
- [ ] 了解监控和告警机制

::: tip 🎉 恭喜！
你已经完成了 Agent 学习路线的所有基础内容！接下来可以：
1. 选择一个 [框架](/frameworks/) 深入学习
2. 探索 [进阶专题](/advanced/mcp) 
3. 查看 [学习资源](/resources/) 继续提升
:::
