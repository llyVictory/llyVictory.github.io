---
title: Java线程池有哪些参数？
category:
  - Java
order: 1
---


Java 线程池主要通过 `ThreadPoolExecutor` 实现，它有 **7个核心参数**：

1. corePoolSize（核心线程数）
2. maximumPoolSize（最大线程数）
3. keepAliveTime（线程存活时间）
4. TimeUnit（时间单位）
5. BlockingQueue（任务队列）
6. ThreadFactory（线程工厂）
7. RejectedExecutionHandler（拒绝策略）

构造方法：

```java
public ThreadPoolExecutor(
    int corePoolSize,
    int maximumPoolSize,
    long keepAliveTime,
    TimeUnit unit,
    BlockingQueue<Runnable> workQueue,
    ThreadFactory threadFactory,
    RejectedExecutionHandler handler
)
```

---

## 1. corePoolSize（核心线程数）

表示线程池中长期保留的核心线程数量。

特点：

* 默认情况下核心线程不会被销毁
* 即使没有任务，也会一直存在

例如：

```java
corePoolSize = 5
```

表示：

线程池至少保持5个工作线程。

---

## 2. maximumPoolSize（最大线程数）

表示线程池允许创建的最大线程数量。

例如：

```java
maximumPoolSize = 20
```

当任务量增加时：

```
核心线程不足

↓

创建临时线程

↓

最多达到20个线程
```

---

## 3. keepAliveTime（线程存活时间）

表示非核心线程空闲多久会被销毁。

例如：

```java
keepAliveTime = 60
TimeUnit.SECONDS
```

含义：

超过60秒没有任务的非核心线程会被回收。

注意：

默认只作用于非核心线程。

如果调用：

```java
allowCoreThreadTimeOut(true)
```

核心线程也会被回收。

---

## 4. TimeUnit（时间单位）

表示 keepAliveTime 的时间单位。

常见：

```java
SECONDS
MILLISECONDS
MINUTES
```

例如：

```java
60, TimeUnit.SECONDS
```

表示：

60秒。

---

## 5. BlockingQueue（阻塞队列）

用于保存等待执行的任务。

线程池执行流程：

```
提交任务

   |

核心线程是否满？

   |

否 --> 创建核心线程执行

   |

是

   |

任务进入队列

   |

队列满

   |

创建非核心线程

   |

达到最大线程数

   |

执行拒绝策略
```

常见队列：

### （1）ArrayBlockingQueue

有界队列。

例如：

```java
new ArrayBlockingQueue<>(1000)
```

特点：

* 容量固定
* 可以防止任务无限堆积

适合生产环境。

---

### （2）LinkedBlockingQueue

链表阻塞队列。

特点：

默认容量接近：

```
Integer.MAX_VALUE
```

风险：

任务过多可能导致：

* 内存占用过高
* OOM

---

### （3）SynchronousQueue

不存储任务。

特点：

提交一个任务必须立即找到线程执行。

常用于：

```java
CachedThreadPool
```

---

### （4）PriorityBlockingQueue

优先级队列。

可以按照任务优先级执行。

---

## 6. ThreadFactory（线程工厂）

用于创建线程。

默认：

```java
Executors.defaultThreadFactory()
```

生产环境一般自定义。

例如：

```java
ThreadFactory factory = r -> {
    Thread t = new Thread(r);
    t.setName("agent-worker-" + count++);
    return t;
};
```

作用：

* 设置线程名称
* 设置优先级
* 设置是否守护线程

方便：

日志排查。

例如：

```
agent-worker-12
agent-worker-13
```

比：

```
pool-1-thread-2
```

更容易定位问题。

---

## 7. RejectedExecutionHandler（拒绝策略）

当：

```
线程数达到 maximumPoolSize

+

队列已满
```

新任务如何处理。

Java提供4种策略：

---

### （1）AbortPolicy（默认）

直接抛异常：

```java
RejectedExecutionException
```

适合：

希望快速发现系统过载。

---

### （2）CallerRunsPolicy

由提交任务的线程执行。

例如：

```
业务线程

    |

执行任务
```

作用：

降低提交速度，形成反压。

---

### （3）DiscardPolicy

直接丢弃任务。

不抛异常。

适合：

允许少量任务丢失场景。

---

### （4）DiscardOldestPolicy

丢弃队列中最老任务。

然后提交新任务。

---

## 8. 线程池执行流程（高频面试）

面试经常问：

> 提交一个任务后，线程池如何处理？

流程：

```
提交任务

    |

当前线程数 < corePoolSize ?

    |

是

创建核心线程执行


    |

否

任务进入 BlockingQueue


    |

队列满？

    |

否

等待执行


    |

是

当前线程数 < maximumPoolSize ?

    |

是

创建非核心线程


    |

否

执行拒绝策略
```

---

## 9. Java线程池参数如何设置？

实际项目不会随便设置。

### CPU密集型任务

例如：

* 计算
* 加密
* 数据处理

推荐：

```
线程数 ≈ CPU核心数 + 1
```

原因：

减少线程切换。

---

### IO密集型任务

例如：

* RPC调用
* 数据库访问
* 网络请求

推荐：

```
线程数 ≈ CPU核心数 × (1 + IO等待时间/CPU计算时间)
```

通常：

```
2~4倍CPU核心数
```

---

## 10. AI Agent项目中的线程池设计

AI助手场景通常存在：

* LLM调用
* RAG检索
* Tool调用
* 文档解析

例如：

```
用户请求

    |

Agent线程池

    |

-------------------

LLM调用

知识检索

工具执行

```

建议：

不同任务使用不同线程池。

例如：

### LLM调用线程池

特点：

* IO等待时间长
* 请求耗时较高

配置：

```
较大线程数

有界队列

超时控制
```

---

### Tool执行线程池

例如：

* 查询数据库
* 调第三方API

需要：

* 隔离线程池
* 防止慢任务拖垮主流程

---

## 11. 面试30秒总结版

Java线程池 ThreadPoolExecutor 有7个核心参数：

corePoolSize 控制核心线程数量；

maximumPoolSize 控制最大线程数量；

keepAliveTime 和 TimeUnit 控制非核心线程空闲回收时间；

BlockingQueue 保存等待执行任务；

ThreadFactory 负责创建线程，可以自定义线程名称；

RejectedExecutionHandler 用于线程池满载时的拒绝处理。

线程池执行流程是：先创建核心线程，核心线程满后进入队列，队列满后创建非核心线程，达到最大线程数后执行拒绝策略。

在 AI Agent 项目中，会针对 LLM调用、RAG检索、Tool执行等不同任务做线程池隔离，避免某一类慢任务影响整体系统稳定性。
