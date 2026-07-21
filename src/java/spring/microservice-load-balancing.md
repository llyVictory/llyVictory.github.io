---
title: 微服务有了解哪些负载均衡的方式？
category:
  - Java
order: 1
---


微服务中的负载均衡主要分为两大类：

1. **客户端负载均衡（Client-side Load Balancing）**
2. **服务端负载均衡（Server-side Load Balancing）**

在实际项目中通常会结合使用，例如：

* 网关层使用服务端负载均衡
* 服务内部调用使用客户端负载均衡

---

## 1. 服务端负载均衡（Server-side Load Balancing）

### 基本原理

请求先发送到一个统一的负载均衡组件，由负载均衡组件选择具体服务实例。

架构：

```
Client

  |

Load Balancer

  |

-----------------

Service A

Service B

Service C
```

客户端不知道后端有哪些服务实例。

---

### 常见实现-Nginx负载均衡

最常见的七层负载均衡。

例如：

```
        Client

          |

        Nginx

     /     |      \

 Service1 Service2 Service3
```

支持：

* HTTP反向代理
* 动静分离
* 限流
* 健康检查

常见算法：

##### 轮询（Round Robin）

请求依次分发：

```
请求1 -> Service1

请求2 -> Service2

请求3 -> Service3
```

优点：

* 简单
* 实例压力比较均衡

缺点：

* 不考虑服务实际负载

---

##### 加权轮询（Weighted Round Robin）

根据机器能力分配。

例如：

```
Service A  权重5

Service B  权重2

Service C  权重1
```

适合：

* 不同机器配置不同
* 新老机器混合部署

---

##### IP Hash

根据客户端 IP 计算 hash。

例如：

```
用户A IP

    |

 hash

    |

固定访问 Service1
```

优点：

* 可以实现一定程度的会话保持

缺点：

* IP分布不均时容易造成负载不均

---

## 2. 客户端负载均衡（Client-side Load Balancing）

### 基本原理

客户端自己维护服务列表，并选择目标实例。

架构：

```
Service Consumer

        |

 Load Balancer SDK

        |

-------------------

Service A

Service B

Service C
```

例如：

Java 微服务调用：

```
Order Service

     |

LoadBalancer

     |

User Service实例列表
```

---

### Spring Cloud中的实现

以前：

* Ribbon

现在：

* Spring Cloud LoadBalancer

例如：

```java
@LoadBalanced
RestTemplate restTemplate;
```

调用：

```java
restTemplate.getForObject(
"http://user-service/user/1",
User.class
);
```

客户端会自动选择：

```
user-service实例1

或者

user-service实例2
```

---

## 3. 服务发现 + 负载均衡

微服务环境中，服务地址动态变化。

例如：

```
User Service

启动：

192.168.1.10

192.168.1.11

192.168.1.12
```

需要注册中心：

```
          Nacos/Eureka

              |

       服务实例列表

              |

Consumer选择实例
```

流程：

```
1. 服务启动

2. 注册到注册中心

3. Consumer获取服务列表

4. 本地负载均衡选择实例

5. 发起调用
```

---

## 4. 常见负载均衡算法

面试重点：

### （1）随机 Random

随机选择实例。

优点：

* 简单
* 分布比较均衡

适合：

实例数量较多。

---

### （2）轮询 Round Robin

依次选择。

例如：

```
A

B

C

A

B

C
```

优点：

简单稳定。

---

### （3）加权轮询 Weighted Round Robin

根据实例权重。

例如：

```
A 权重3

B 权重1
```

流量：

```
A A A B
```

适合：

机器性能不同。

---

### （4）最少连接 Least Connection

选择当前连接数最少的服务。

例如：

```
Service A
连接100个


Service B
连接20个
```

请求发送给：

```
Service B
```

适合：

长连接场景。

---

### （5）一致性哈希 Consistent Hash

通过 hash 环选择节点。

主要用于：

* 缓存系统
* 分布式存储

优势：

节点变化时减少数据迁移。

例如：

```
        Hash Ring


    Node A


Node B       Node C


    Node D
```

---

## 5. AI Agent项目中的负载均衡设计

结合 AI 助手项目，可以这样回答：

AI Agent 系统中，不同服务负载特点不同。

例如：

```
                 Gateway

                    |

              Agent Service

                    |

 --------------------------------

 Planner     RAG Service     Tool Service

                    |

              LLM Gateway
```

### Gateway层

使用：

* Nginx
* Gateway

负责：

* 用户请求分发
* 限流
* 熔断

---

### Agent内部服务

采用：

* 服务注册中心
* 客户端负载均衡

例如：

```
Planner Service

      |

Spring Cloud LoadBalancer

      |

RAG Service实例列表
```

---

### LLM Gateway特殊处理

大模型调用成本高，需要考虑：

* 实例负载
* GPU利用率
* token消耗
* 请求上下文长度

不能简单轮询。

可能采用：

* 加权负载均衡
* 最小负载算法
* 动态权重

例如：

```
LLM Instance A

GPU利用率 80%

权重低


LLM Instance B

GPU利用率 30%

权重高
```

---

## 6. 面试30秒总结版

微服务中的负载均衡主要分为客户端和服务端两种。

服务端负载均衡通常通过 Nginx、Gateway 实现，客户端无感知，适合用户入口流量。

客户端负载均衡由服务消费者自己选择实例，例如 Spring Cloud LoadBalancer，通过结合注册中心获取服务列表，实现服务调用时的负载分配。

常见算法包括轮询、随机、加权轮询、最少连接、一致性哈希。

在 AI Agent 项目中，通常 Gateway 层使用 Nginx 或网关负载均衡，内部 Planner、Tool、RAG 等服务使用服务发现 + 客户端负载均衡，而 LLM 服务会根据 GPU 利用率、token消耗等指标做动态权重调度。
