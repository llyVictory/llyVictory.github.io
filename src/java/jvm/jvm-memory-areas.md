---
title: JVM内存区域如何划分的？
category:
  - Java
order: 1
---


JVM 内存区域主要分为 **运行时数据区域（Runtime Data Area）** 和 **非运行时数据区域**。

其中面试重点关注 JVM 运行时数据区域：

* 程序计数器（Program Counter Register）
* Java虚拟机栈（Java Virtual Machine Stack）
* 本地方法栈（Native Method Stack）
* Java堆（Heap）
* 方法区（Method Area）

另外 HotSpot 中还有：

* 元空间（Metaspace）
* 直接内存（Direct Memory）

整体结构：

```
JVM运行时内存

        JVM
         |
 --------------------------------
 |              |               |
线程私有区域     线程共享区域
 |              |
 |              |
程序计数器      Java堆
虚拟机栈        方法区
本地方法栈
```

---

## 1. 程序计数器（Program Counter Register）

### 作用

记录当前线程正在执行的字节码指令地址。

例如：

Java代码：

```java
int a = 1;
int b = 2;
int c = a + b;
```

编译后：

```
指令1
指令2
指令3
```

程序计数器保存：

```
当前执行到哪条指令
```

---

### 特点

#### （1）线程私有

每个线程都有自己的程序计数器。

例如：

```
Thread-A

PC = 指令10


Thread-B

PC = 指令20
```

互不影响。

---

#### （2）不会发生OOM

因为它只是保存一个地址。

---

### 为什么需要程序计数器？

因为 CPU 同一时间只能执行一个线程。

线程切换：

```
线程A执行

↓

保存A当前指令位置

↓

切换线程B

↓

恢复B执行位置
```

这个位置就是程序计数器保存的。

---

## 2. Java虚拟机栈（JVM Stack）

### 作用

存储 Java 方法执行过程中的：

* 局部变量
* 方法参数
* 返回地址
* 操作数栈

每调用一个方法，就会创建一个栈帧。

例如：

```java
public void test(){

    int a = 10;

}
```

执行：

```
线程栈

 |
 |
栈帧(test)

 |
 |-- 局部变量 a=10
 |
 |-- 操作数栈
 |
 |-- 返回地址
```

---

### 栈的生命周期

方法调用：

```
main()

  |

 test()

  |

 calculate()
```

对应：

```
栈

calculate栈帧

test栈帧

main栈帧
```

方法结束：

```
calculate销毁

test销毁
```

---

### 常见异常

#### StackOverflowError

栈空间不足。

例如：

```java
public void test(){

    test();

}
```

无限递归：

```
test()
 |
test()
 |
test()
 |
...
```

最终：

```
StackOverflowError
```

---

#### OutOfMemoryError

线程创建太多，栈无法分配。

---

## 3. 本地方法栈（Native Method Stack）

### 作用

和 JVM Stack 类似。

区别：

JVM Stack：

执行 Java 方法。

Native Method Stack：

执行 Native 方法。

例如：

```java
public native void start();
```

底层可能调用：

* C
* C++

例如：

```
Java

 |

JNI

 |

C/C++代码
```

---

## 4. Java堆（Heap）⭐⭐重点

### 作用

存放对象实例。

例如：

```java
User user = new User();
```

对象：

```
User对象

{

 id

 name

}
```

存放在：

```
Java Heap
```

变量：

```
user引用
```

存放在：

```
栈
```

关系：

```
Stack

user变量

    |
    |
    v

Heap

User对象
```

---

### 堆的特点

#### （1）线程共享

所有线程访问同一个堆。

例如：

```
Thread-A

       \
        User对象
       /
Thread-B
```

所以：

堆里面的数据需要考虑线程安全。

---

#### （2）垃圾回收主要发生在堆

GC主要回收：

* 不再使用的对象
* 老年代对象

---

### 堆内存分代

经典：

```
Java Heap

-----------------

Young Generation

 Eden

 Survivor S0

 Survivor S1


-----------------

Old Generation
```

---

### 新生代流程

对象创建：

```
new User()

    |

 Eden
```

GC：

```
Eden满

↓

Minor GC

↓

存活对象进入Survivor

↓

多次GC后进入Old
```

---

## 5. 方法区（Method Area）

### 作用

存储类相关信息：

* 类元数据
* 方法信息
* 常量池
* 静态变量

例如：

```java
public class User{

    private static int count;

}
```

其中：

```
User类信息

count静态变量

方法信息

```

存储在方法区。

---

### JDK8之后变化

以前：

```
方法区

↓

永久代 PermGen
```

JDK8：

```
方法区

↓

元空间 Metaspace
```

区别：

永久代：

```
JVM堆内存
```

元空间：

```
本地内存
```

---

## 6. 元空间（Metaspace）

JDK8之后：

类信息存放：

```
Metaspace
```

例如：

加载：

```java
class User{}
```

存储：

```
User.class信息

方法描述

字段描述
```

---

### 元空间OOM

大量动态生成类：

例如：

* CGLIB代理
* 动态字节码生成

可能导致：

```
OutOfMemoryError: Metaspace
```

---

## 7. 直接内存（Direct Memory）

### 作用

不是 JVM 运行时数据区域，但是经常被提问。

例如：

Netty：

```java
ByteBuffer.allocateDirect()
```

直接使用：

```
操作系统内存
```

绕过 JVM Heap。

---

### 优点

减少：

```
Java堆

↓

Native内存

↓

系统调用
```

减少一次数据复制。

常用于：

* 网络通信
* 高性能IO

例如：

Netty大量使用直接内存。

---

## 8. 一个对象创建过程（高频）

面试：

> new 一个对象，JVM发生了什么？

例如：

```java
User user = new User();
```

流程：

```
1. 类加载检查

↓

2. 在堆中分配内存

↓

3. 初始化对象

↓

4. 执行构造方法

↓

5. 栈中保存对象引用
```

内存：

```
Stack

user引用

      |
      |
      v

Heap

User对象
```

---

## 9. AI Agent项目中的JVM内存关注点

AI Agent后端通常：

* Spring Boot
* 大量RPC调用
* RAG检索
* 文档解析
* JSON处理

重点关注：

### （1）堆内存

存储：

* 请求对象
* 对话上下文
* Embedding结果
* 缓存对象

问题：

对象过多：

```
Heap压力

↓

频繁GC

↓

接口延迟增加
```

---

### （2）线程栈

Agent调用链较深：

```
Controller

↓

Agent

↓

Planner

↓

Tool

↓

LLM Client
```

需要合理设置：

```
-Xss
```

避免栈溢出。

---

### （3）直接内存

如果使用：

* Netty
* WebFlux
* 高性能网络通信

需要关注：

```
Direct Memory
```

---

## 10.JVM内存区域总结表

| 区域    | 线程共享 | 主要存储          | 异常                 |
| ----- | ---- | ------------- | ------------------ |
| 程序计数器 | 否    | 当前指令地址        | 无                  |
| 虚拟机栈  | 否    | 方法栈帧          | StackOverflowError |
| 本地方法栈 | 否    | Native方法      | StackOverflowError |
| Java堆 | 是    | 对象实例          | OOM                |
| 方法区   | 是    | 类信息、常量        | OOM                |
| 元空间   | 是    | 类元数据          | Metaspace OOM      |
| 直接内存  | 是    | Native Buffer | OOM                |

---

## 11. 面试30秒总结版

JVM 内存区域主要分为**线程私有区域**和**线程共享区域**。

线程私有区域包括**程序计数器、虚拟机栈、本地方法栈**，主要保存线程执行过程中的上下文信息。

线程共享区域包括**Java 堆和方法区**。堆主要存放对象实例，也是 GC 主要管理区域；方法区主要存储类元数据、常量池、静态变量，JDK8之后由元空间 Metaspace 实现。

另外还有**直接内存**，常用于 Netty 等高性能 IO 场景。

实际项目中重点关注堆内存、GC情况、线程栈大小以及直接内存使用情况。
