---
title: 线程池提交任务时，处理流程是什么样的？什么时候进入阻塞队列？
category:
  - Java
order: 1
---



Java 线程池提交任务后，会按照 **核心线程数 → 阻塞队列 → 最大线程数 → 拒绝策略** 的顺序处理。

也就是说：

**任务不会一提交就进入阻塞队列，而是优先尝试创建核心线程执行。**

---

## 1. ThreadPoolExecutor执行流程

调用：

```java
executor.execute(task);
```

内部处理流程如下：

```
提交任务

   |

当前运行线程数 < corePoolSize ?

   |

   是

创建核心线程执行任务


   |

   否

尝试加入阻塞队列


   |

   队列是否成功加入？

   |

   是

等待线程执行


   |

   否

当前线程数 < maximumPoolSize ?

   |

   是

创建非核心线程执行任务


   |

   否

执行拒绝策略
```

---

## 2. 第一阶段：核心线程未满，直接创建线程执行

假设：

```java
corePoolSize = 3
maximumPoolSize = 5
queue = ArrayBlockingQueue(100)
```

提交任务：

```
task1
task2
task3
```

执行：

```
线程数 < corePoolSize

创建线程：

worker-1 执行 task1

worker-2 执行 task2

worker-3 执行 task3
```

此时：

```
核心线程：3

队列：0
```

任务不会进入队列。

---

## 3. 第二阶段：核心线程满，任务进入阻塞队列

继续提交：

```
task4
```

此时：

```
当前线程数 = corePoolSize

3 = 3
```

核心线程已经全部工作。

线程池不会马上创建新线程。

而是：

```
task4

↓

BlockingQueue
```

状态：

```
线程：

worker1 task1

worker2 task2

worker3 task3


队列：

task4
```

这就是面试重点：

> **当核心线程全部被占用后，新提交的任务才会进入阻塞队列。**

---

## 4. 第三阶段：队列满，创建非核心线程

假设：

```java
queue = new ArrayBlockingQueue<>(2)
```

当前：

```
corePoolSize = 3

maximumPoolSize = 5
```

已经有：

```
worker1 task1

worker2 task2

worker3 task3
```

队列：

```
task4

task5
```

此时队列满。

继续提交：

```
task6
```

流程：

```
加入队列失败

↓

判断当前线程数 < maximumPoolSize

↓

创建非核心线程

↓

worker4执行task6
```

状态：

```
核心线程：3

非核心线程：1

队列：2
```

---

## 5. 第四阶段：达到最大线程数，执行拒绝策略

继续提交：

```
task7
task8
```

现在：

```
线程数：

5 = maximumPoolSize


队列：

已满
```

线程池无法处理。

执行：

```java
RejectedExecutionHandler
```

例如默认：

```java
AbortPolicy
```

抛异常：

```
RejectedExecutionException
```

---

## 6. 一个完整例子

配置：

```java
ThreadPoolExecutor executor =
new ThreadPoolExecutor(
    2,
    4,
    60,
    TimeUnit.SECONDS,
    new ArrayBlockingQueue<>(2)
);
```

参数：

```
核心线程：2

最大线程：4

队列容量：2
```

连续提交8个任务：

**task1**

```
创建worker1
执行
```

线程：

```
1
```

---

**task2**

```
创建worker2
执行
```

线程：

```
2
```

---

**task3**

核心线程满：

进入队列。

队列：

```
task3
```

---

**task4**

继续进入队列。

队列：

```
task3
task4
```

---

**task5**

队列满：

创建worker3。

线程：

```
worker1

worker2

worker3(task5)
```

---

**task6**

继续创建worker4。

线程：

```
worker1

worker2

worker3

worker4
```

---

**task7**

线程达到最大：

```
线程池满

队列满

拒绝
```

---

## 7. 为什么设计成这个顺序？

面试可以补充：

线程池设计这个顺序主要是为了：

### （1）减少线程创建开销

线程创建成本比较高。

优先复用核心线程：

```
已有线程
    |
执行任务
```

而不是不断创建线程。

---

### （2）利用队列削峰

任务突增时：

```
瞬间大量请求

↓

任务队列缓存

↓

慢慢消费
```

避免瞬间创建大量线程。

---

### （3）保护系统资源

如果：

核心线程满

队列无限增长

最大线程无限增长

可能：

* CPU打满
* 内存耗尽
* 系统崩溃

---

## 8. 一个常见面试陷阱：为什么队列满了才创建非核心线程？

面试官可能问：

> 为什么不是核心线程和最大线程一起创建？

回答：

因为线程池希望：

1. 优先保证核心线程稳定处理任务
2. 利用队列缓冲流量
3. 只有压力持续增加时才扩容线程

类似：

```
正常流量：

核心线程处理


突发流量：

队列缓冲


极端流量：

临时线程扩容


超载：

拒绝
```

---

## 9. AI Agent项目中的线程池应用

例如 AI 助手：

```
用户请求

    |

Agent线程池

    |

---------------------

LLM调用

RAG检索

Tool执行
```

提交任务流程：

正常：

```
核心线程

↓

执行LLM调用
```

高峰：

```
核心线程满

↓

任务进入队列
```

极端：

```
队列满

↓

创建额外线程

↓

超过限制

↓

拒绝或者降级
```

实际生产中通常还会增加：

* 有界队列
* 超时时间
* 限流
* 熔断
* 降级策略

避免 Agent 请求堆积导致整个系统雪崩。

---

## 10. 面试30秒总结版

ThreadPoolExecutor 提交任务时有固定流程：

首先判断当前线程数是否小于 corePoolSize，如果小于则创建核心线程执行任务；

如果核心线程已满，则尝试把任务放入 BlockingQueue；

如果队列满了，再判断当前线程数是否小于 maximumPoolSize，如果小于则创建非核心线程；

如果线程数已经达到 maximumPoolSize，同时队列也满，则执行拒绝策略.

所以任务进入阻塞队列的条件是：

**核心线程数已经达到 corePoolSize，并且任务还没有空闲线程立即执行。**
