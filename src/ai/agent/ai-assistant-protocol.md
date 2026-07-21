---
title: AI 助手项目的接入层协议选型是什么？HTTP 还是 gRPC？为什么？
category:
  - AI
order: 1
---

我们的 AI 助手项目采用 **HTTP + gRPC 混合架构**：

* 用户侧接入层：HTTP/HTTPS + SSE/WebSocket
* 内部服务通信：gRPC + Protobuf

这样可以兼顾用户体验、生态兼容性以及内部服务调用性能。

---

### 1. 用户侧接入：HTTP/HTTPS + SSE/WebSocket

AI 助手面向的调用方通常包括：

* Web 页面
* 移动 App
* 企业 IM
* 第三方业务系统

因此外部接入层选择 HTTP 协议。

---

#### （1）生态兼容性更好

HTTP 是互联网通用协议：

* 浏览器天然支持
* 网关支持成熟
* 方便接入 Nginx、API Gateway
* 支持 OAuth2、JWT 等认证方式
* 第三方系统接入成本低

典型架构：

```
Client
   |
 HTTPS
   |
API Gateway
   |
AI Assistant Service
```

---

#### （2）适合 AI 对话流式输出

传统业务接口通常：

```
Request → Response
```

但是 AI 对话场景通常是：

```
用户：
帮我分析订单异常

模型：
正在分析...

发现3个问题...

第一...
第二...
```

需要边生成边返回。

因此一般采用：

* SSE（Server Sent Events）
* WebSocket

例如：

```
Client
   |
 HTTP + SSE
   |
Agent Service
   |
LLM
```

优势：

* 首 token 快速返回
* 降低用户等待感
* 实现类似 ChatGPT 的流式体验

---

### 2. 服务内部通信：gRPC

随着 AI Agent 系统复杂度增加，通常会拆分多个服务：

```
                 Gateway
                    |
          AI Assistant Service
                    |
      --------------------------------
      |              |               |
   Planner        Tool Service    Memory
                    |
                  RAG
                    |
               LLM Gateway
```

内部服务之间采用 gRPC。

---

#### （1）性能更高

gRPC 基于：

* HTTP/2
* Protocol Buffers

相比 REST + JSON：

JSON：

```json
{
  "userId":123,
  "message":"hello"
}
```

protobuf：

二进制编码。

优势：

* 序列化速度更快
* 数据包更小
* 网络传输效率更高
* 延迟更低

AI Agent 一次请求可能涉及：

```
Planner
   |
Tool
   |
Memory
   |
RAG
```

多次内部调用时，gRPC 可以降低整体通信成本。

---

#### （2）接口强类型约束

REST：

```
POST /executeTool
```

主要依靠：

* 文档
* 约定

进行接口管理。

gRPC：

通过 proto 文件定义：

```protobuf
service ToolService {

 rpc Execute(ToolRequest)
 returns(ToolResponse);

}
```

可以自动生成：

* Java Client
* Java Server

优势：

* 参数类型明确
* 减少接口错误
* 避免接口定义漂移
* 提升开发效率

---

#### （3）更适合微服务治理

gRPC 天然适合微服务场景：

支持：

* 服务发现
* 负载均衡
* 超时控制
* Retry
* Deadline

例如：

```
Planner

  |
  | gRPC timeout 2s

  |

Search Service
```

避免某个 Agent Tool 长时间阻塞。

---

### 3. 为什么不用全部使用 gRPC？

面试官可能继续追问：

> 为什么用户请求不用 gRPC？

回答：

因为用户侧和内部服务侧的需求不同。

| 场景    | HTTP | gRPC   |
| ----- | ---- | ------ |
| 浏览器支持 | 优秀   | 较弱     |
| 第三方接入 | 简单   | 需要 SDK |
| 调试成本  | 低    | 较高     |
| 性能    | 一般   | 优秀     |
| 微服务调用 | 一般   | 优秀     |

因此更合理的设计：

```
外部接入：

HTTP + SSE/WebSocket


内部通信：

gRPC + Protobuf
```

---

### 4. 如果项目早期阶段，是否一定使用 gRPC？

不一定。

如果 AI Agent 处于 MVP 阶段：

特点：

* 服务数量少
* 业务快速变化
* 团队规模较小

可以优先 HTTP。

原因：

* 开发简单
* 调试方便
* 迭代速度快

随着系统发展：

例如拆分：

```
Planner Service

Tool Service

Memory Service

RAG Service

LLM Gateway
```

再逐步引入 gRPC。

体现架构演进：

```
早期：

单体 Agent Service
HTTP


后期：

微服务架构
HTTP + gRPC
```

---

### 5. 面试30秒总结版

我们的 AI 助手项目采用混合协议设计。

用户接入层使用 HTTPS + SSE，因为 AI 对话场景需要流式输出，同时 HTTP 对浏览器和第三方系统更加友好。

内部 Agent 服务之间采用 gRPC，因为 Agent 调用链通常比较长，包括 Planner、Tool、Memory、RAG 等多个模块，gRPC 基于 HTTP/2 和 protobuf，具有更低延迟、更小传输成本，同时接口强类型，方便微服务治理。

整体设计兼顾了用户体验、开发效率和系统性能。

