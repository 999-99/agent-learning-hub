import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Agent Learning Hub",
  description: "AI Agent 智能体从入门到精通 - 完整学习路线与实战指南",
  lang: 'zh-CN',
  base: '/agent-learning-hub/',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      {
        text: '学习路线',
        items: [
          { text: '🗺️ 路线总览', link: '/guide/' },
          { text: '🚀 快速开始', link: '/guide/01-foundations' },
        ]
      },
      {
        text: '框架',
        items: [
          { text: '框架概览', link: '/frameworks/' },
          { text: 'LangChain / LangGraph', link: '/frameworks/langchain' },
          { text: 'OpenAI Agents SDK', link: '/frameworks/openai-agents' },
          { text: 'CrewAI', link: '/frameworks/crewai' },
          { text: 'AutoGen', link: '/frameworks/autogen' },
          { text: 'Google ADK', link: '/frameworks/google-adk' },
          { text: 'Dify / Coze', link: '/frameworks/dify-coze' },
        ]
      },
      {
        text: '进阶',
        items: [
          { text: 'MCP 协议', link: '/advanced/mcp' },
          { text: 'A2A 协议', link: '/advanced/a2a' },
          { text: 'Multi-Agent', link: '/advanced/multi-agent' },
          { text: '安全与评估', link: '/advanced/safety' },
        ]
      },
      { text: '资源', link: '/resources/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '🗺️ 学习路线',
          items: [
            { text: '路线总览', link: '/guide/' },
          ]
        },
        {
          text: '🟢 第一阶段：基础入门',
          items: [
            { text: '01 - 编程与 AI 基础', link: '/guide/01-foundations' },
            { text: '02 - 提示词工程', link: '/guide/02-prompt-engineering' },
            { text: '03 - LLM API 调用', link: '/guide/03-llm-api' },
          ]
        },
        {
          text: '🟡 第二阶段：核心技能',
          items: [
            { text: '04 - RAG 检索增强生成', link: '/guide/04-rag' },
            { text: '05 - Function Calling', link: '/guide/05-function-calling' },
            { text: '06 - Agent 架构设计', link: '/guide/06-agent-architecture' },
            { text: '07 - 记忆机制', link: '/guide/07-memory' },
          ]
        },
        {
          text: '🟠 第三阶段：框架实战',
          items: [
            { text: '08 - Agent 框架概览', link: '/guide/08-frameworks' },
            { text: '09 - MCP 协议', link: '/guide/09-mcp' },
            { text: '10 - Multi-Agent 系统', link: '/guide/10-multi-agent' },
          ]
        },
        {
          text: '🔴 第四阶段：高级进阶',
          items: [
            { text: '11 - 安全与对齐', link: '/guide/11-safety' },
            { text: '12 - 评估与优化', link: '/guide/12-evaluation' },
            { text: '13 - 部署与运维', link: '/guide/13-deployment' },
          ]
        },
      ],
      '/frameworks/': [
        {
          text: '📦 Agent 框架',
          items: [
            { text: '框架概览与对比', link: '/frameworks/' },
            { text: 'LangChain / LangGraph', link: '/frameworks/langchain' },
            { text: 'OpenAI Agents SDK', link: '/frameworks/openai-agents' },
            { text: 'CrewAI', link: '/frameworks/crewai' },
            { text: 'AutoGen', link: '/frameworks/autogen' },
            { text: 'Google ADK', link: '/frameworks/google-adk' },
            { text: 'Dify / Coze 低代码', link: '/frameworks/dify-coze' },
          ]
        },
      ],
      '/advanced/': [
        {
          text: '🔬 进阶专题',
          items: [
            { text: 'MCP 协议详解', link: '/advanced/mcp' },
            { text: 'A2A 协议详解', link: '/advanced/a2a' },
            { text: 'Multi-Agent 协作', link: '/advanced/multi-agent' },
            { text: '安全与评估', link: '/advanced/safety' },
          ]
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/YOUR_USERNAME/agent-learning-hub' }
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除搜索',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },

    outline: {
      label: '页面导航',
      level: [2, 3]
    },

    lastUpdated: {
      text: '最后更新',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    editLink: {
      pattern: 'https://github.com/YOUR_USERNAME/agent-learning-hub/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页面'
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  }
})
