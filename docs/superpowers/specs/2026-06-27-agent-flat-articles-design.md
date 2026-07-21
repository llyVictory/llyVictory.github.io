# Agent 扁平文章目录设计

## 目标

移除 Agent 下“基础必备”和“场景实战”分类。每篇主题文章直接位于 `src/ai/agent/`，并直接显示在左侧 Agent 目录下。

## 结构

```text
src/ai/agent/
├── README.md
└── ai-assistant-protocol.md
```

删除 `src/ai/agent/basics/` 与 `src/ai/agent/practice/`。

## 左侧目录

保留全站自动目录树。Agent 是可点击目录项，下面仅显示文章：

```text
Agent
└── AI 助手项目的接入层协议选型是什么？HTTP 还是 gRPC？为什么？
```

## 文章

新文章使用题目作为 frontmatter `title` 和一级标题，先保留最小占位正文。后续主题直接在 `src/ai/agent/` 新增 Markdown 文件，不再创建分类目录。

## 验证

按项目指令，不执行构建、测试或其他验证命令。
