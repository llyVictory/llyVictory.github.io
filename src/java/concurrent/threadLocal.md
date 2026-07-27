---
title: ThreadLocal 了解吗？
category:
  - Java
order: 1
---


`ThreadLocal` 是 Java 中用于实现 **线程级别变量隔离** 的工具。

它提供了一种机制：

> 每个线程可以拥有自己独立的一份变量副本，线程之间互不影响。

典型应用场景：

* 用户上下文传递
* 数据库连接管理
* 分布式链路追踪 TraceId
* SimpleDateFormat 线程安全问题
* Spring 事务上下文

---

## 1. ThreadLocal解决什么问题？

正常情况下：

多个线程共享同一个变量：

```java
id="7t6b9m"
private User user;
```

多个线程：

```
Thread-A
   |
   | 修改user
   |
Thread-B
   |
   | 读取user
```

可能产生：

* 数据覆盖
* 线程安全问题

如果使用 ThreadLocal：

```
Thread-A

ThreadLocal
    |
    user=A


Thread-B

ThreadLocal
    |
    user=B
```

每个线程都有自己的变量副本。

---

## 2. ThreadLocal底层原理

面试重点：

> ThreadLocal的数据到底存在哪里？

很多人会回答：

“存在ThreadLocal里面”

这是错误的。

实际上：

**ThreadLocal的数据存储在线程对象 Thread 的 ThreadLocalMap 中。**

结构：

```
Thread

  |
  |
ThreadLocalMap

  |
  |
Entry[]

  |
  |
key = ThreadLocal对象

value = 保存的数据
```

关系：

```
Thread

 └── ThreadLocalMap

        ├── ThreadLocal1 : value1

        ├── ThreadLocal2 : value2

        └── ThreadLocal3 : value3
```

也就是说：

一个 Thread 对象内部维护了一个 Map。

---

## 3. ThreadLocal核心源码结构

Thread：

```java
public class Thread {

    ThreadLocal.ThreadLocalMap threadLocals;

}
```

ThreadLocalMap：

```java
static class ThreadLocalMap {

    Entry[] table;

}
```

Entry：

```java
static class Entry extends WeakReference<ThreadLocal<?>> {

    Object value;

}
```

所以：

* key 是 ThreadLocal
* value 是保存的数据

---

## 4. ThreadLocal执行流程

例如：

```java
ThreadLocal<User> threadLocal = new ThreadLocal<>();

threadLocal.set(user);
```

执行流程：

```
调用ThreadLocal.set()

        |

获取当前线程

        |

Thread.currentThread()

        |

获取ThreadLocalMap

        |

key=this(ThreadLocal对象)

value=user

        |

保存到Map
```

类似：

```java
thread.threadLocals.put(
    threadLocal,
    user
);
```

---

## 5. get()流程

调用：

```java
threadLocal.get();
```

流程：

```
ThreadLocal.get()

       |

获取当前线程

       |

获取当前线程的ThreadLocalMap

       |

使用当前ThreadLocal作为key

       |

返回value
```

例如：

线程A：

```
ThreadLocalMap

ThreadLocal:userA
```

线程B：

```
ThreadLocalMap

ThreadLocal:userB
```

互相访问不到。

---

## 6. ThreadLocal为什么线程安全？

原因：

不是因为 ThreadLocal 加锁。

而是：

**每个线程访问自己的数据副本，不存在共享竞争。**

例如：

普通变量：

```
Thread A
      \
       \
        user变量
       /
Thread B
```

存在竞争。

ThreadLocal：

```
Thread A

自己的Map

user=A


Thread B

自己的Map

user=B
```

没有共享。

---

## 7. ThreadLocal使用示例

### 用户上下文传递

例如：

登录后：

```java
ThreadLocal<UserContext> USER_CONTEXT =
        new ThreadLocal<>();
```

请求进入：

```java
USER_CONTEXT.set(user);
```

业务代码：

```java
UserContext context =
        USER_CONTEXT.get();
```

不用每层方法传递：

```java
queryOrder(
    userId,
    token,
    requestId
)
```

变成：

```java
queryOrder()
```

---

## 8. Spring中ThreadLocal应用

### （1）事务管理

Spring事务：

```java
@Transactional
public void save(){

}
```

底层会绑定：

```
当前线程

    |

Connection对象

    |

ThreadLocal
```

保证：

同一个事务中的数据库操作使用同一个 Connection。

---

### （2）RequestContextHolder

Spring MVC中：

```java
RequestContextHolder
```

底层也是：

ThreadLocal。

保存：

* Request对象
* 用户信息
* 请求上下文

---

## 9. ThreadLocal内存泄漏问题（高频）

面试经常问：

> ThreadLocal为什么会导致内存泄漏？

原因：

ThreadLocalMap中的Entry：

```java
static class Entry extends WeakReference<ThreadLocal<?>> {

    Object value;

}
```

key 是弱引用。

流程：

```
ThreadLocal对象

      |

没有强引用

      |

GC回收key


ThreadLocalMap:

key=null

value=Object
```

形成：

```
null ---> 大对象
```

但是：

线程还存活。

尤其在线程池：

```
线程池线程

长期存在

      |

ThreadLocal变量一直占用

      |

内存泄漏
```

---

## 10. 如何避免ThreadLocal内存泄漏？

使用完成后主动清理：

```java
try {

    threadLocal.set(value);

    business();

} finally {

    threadLocal.remove();

}
```

重点：

生产环境一定要：

```java
remove()
```

尤其：

* Tomcat线程
* Netty线程
* Java线程池

因为线程不会频繁销毁。

---

## 11. ThreadLocal和线程池结合的问题

这是后端面试高频。

例如：

线程池：

```
Thread-1

第一次请求：

ThreadLocal.user=A


任务结束


第二次请求：

Thread-1复用


ThreadLocal.user还是A
```

可能导致：

用户数据串线。

所以：

线程池场景：

必须：

```java
finally {

    threadLocal.remove();

}
```

---

## 12. InheritableThreadLocal了解吗？

普通 ThreadLocal：

父线程和子线程数据隔离。

例如：

```
父线程

user=A


子线程

获取不到
```

InheritableThreadLocal：

可以让子线程继承父线程变量。

例如：

```java
InheritableThreadLocal<String> context;
```

父线程：

```
user=A
```

创建子线程：

```
子线程自动获得user=A
```

---

## 13. AI Agent项目中的ThreadLocal应用

AI 助手场景：

一次用户请求可能经过：

```
Gateway

  |

Agent Service

  |

Planner

  |

Tool

  |

LLM
```

需要传递：

* userId
* sessionId
* traceId
* tenantId

可以使用：

```
ThreadLocal

保存请求上下文
```

例如：

```java
ContextHolder.set(
    userId,
    sessionId,
    traceId
);
```

后续：

```java
ContextHolder.getTraceId();
```

方便：

* 日志打印
* 链路追踪
* 用户隔离

但是：

如果 Agent 使用异步线程：

```java
CompletableFuture
线程池
```

ThreadLocal默认不会自动传递。

需要：

* TransmittableThreadLocal（TTL）
* 手动传递 Context

---

## 14. ThreadLocal vs synchronized

|      | ThreadLocal | synchronized |
| ---- | ----------- | ------------ |
| 目的   | 数据隔离        | 线程同步         |
| 方式   | 每个线程一份数据    | 多个线程共享       |
| 是否加锁 | 否           | 是            |
| 性能   | 较高          | 有锁竞争         |
| 适用   | 上下文传递       | 共享资源保护       |

---

## 15. 面试30秒总结版

ThreadLocal 是 Java 提供的线程本地变量机制，它可以让每个线程保存自己独立的数据副本，避免多线程共享变量导致的数据竞争。

它底层不是把数据存在线程变量里，而是每个 Thread 对象内部维护一个 ThreadLocalMap，ThreadLocal 作为 key，真正的数据作为 value。

常见应用包括 Spring 事务上下文、用户请求上下文、链路 TraceId 传递。

需要注意 ThreadLocal 在线程池环境中的内存泄漏问题，因为线程池线程长期存在，所以使用后一定要调用 remove 清理。

在 AI Agent 项目中，可以使用 ThreadLocal 保存 userId、sessionId、traceId 等请求上下文，但异步任务场景需要额外处理上下文传递。
