---
title: Kafka会丢失消息吗？如何保证消息不丢失？
category:
  - KAFKA
order: 1
---


Kafka **是可能丢失消息的**。

Kafka消息可靠性主要涉及三个阶段：

1. **Producer生产消息阶段**
2. **Broker存储消息阶段**
3. **Consumer消费消息阶段**

要保证消息不丢失，需要分别从这三个环节进行控制。

整体思路：

```text id="kafka-reliability"
Producer

  |

发送消息

  |

Kafka Broker

  |

持久化

  |

Consumer

  |

业务处理

```

---

## 1. Producer生产阶段消息丢失

### 可能原因

Producer发送消息：

```text id="producer-loss"
Producer

   |

   |

Broker
```

如果：

* 网络异常
* Broker没有收到消息
* Producer认为发送成功

可能导致消息丢失。

---

### 如何保证？

#### （1）设置acks参数

Kafka Producer核心参数：

```properties id="producer-acks"
acks=0
```

含义：

Producer发送后：

不等待Broker确认。

优点：

性能最高。

缺点：

消息可能丢失。

---

```properties id="producer-acks1"
acks=1
```

含义：

Leader Broker收到消息后返回成功。

问题：

Leader写入成功，但是还没同步给Follower：

Leader宕机。

可能丢消息。

---

推荐：

```properties id="producer-acks-all"
acks=all
```

也叫：

```text
acks=-1
```

含义：

Leader等待所有 ISR 副本同步完成后才返回成功。

流程：

```text id="acks-all-flow"
Producer

  |

发送消息

  |

Leader

  |

Follower同步

  |

返回成功

```

可靠性最高。

---

## 2. Broker存储阶段消息丢失

即：

消息已经到Kafka，但是Broker挂了。

Kafka默认：

一个Topic有多个Partition：

例如：

```text id="partition-replica"
Partition 0


Leader

   |

Follower1

   |

Follower2

```

---

### 可能的问题

如果：

只有一个副本：

```text id="single-replica"
Broker1

消息:

order-created

```

Broker挂掉：

消息丢失。

---

### 如何保证？

#### （1）增加副本数 replication.factor

例如：

```properties id="replication"
replication.factor=3
```

表示：

一个Partition：

保存3份。

例如：

```text id="replicas"
Partition 0


Broker1 Leader

Broker2 Follower

Broker3 Follower
```

---

#### （2）设置最小同步副本数

参数：

```
properties id="min.insync.replicas=2"

```

含义：

至少两个副本同步完成。

结合：

```properties
acks=all
```

效果：

Producer发送：

必须：

```text id="min-isr"
Leader写入

+

至少一个Follower同步

↓

才返回成功

```

---

## 3. Consumer消费阶段消息丢失

这是业务中最容易出现的问题。

例如：

Consumer：

```text id="consumer-flow"
拉取消息

↓

处理业务

↓

提交offset

```

如果顺序错误：

```text id="wrong-offset"
拉取消息

↓

提交offset

↓

业务处理失败

```

Kafka认为：

消息已经消费。

但是：

业务没有成功。

消息丢失。

---

### 如何保证？

#### （1）关闭自动提交

不要：

```properties
enable.auto.commit=true
```

改：

```properties
enable.auto.commit=false
```

自己控制offset。

---

#### （2）业务成功后再提交offset

正确流程：

```text id="correct-consume"
Consumer

 |

拉取消息

 |

执行业务

 |

数据库成功

 |

提交offset

```

例如：

订单消费：

```text id="consume-order"
收到订单消息

↓

扣库存成功

↓

更新数据库成功

↓

commit offset

```

---

## 4. 消费失败怎么办？

例如：

Consumer处理：

```text id="consume-error"
消息A

↓

数据库异常

↓

失败
```

不能直接提交offset。

常见方案：

---

### （1）重试机制

例如：

第一次失败：

```text id="retry"
Topic:

order-retry-1
```

等待：

5秒。

再次消费。

---

### （2）死信队列（DLQ）

如果：

多次失败。

发送：

```text id="dead-letter"
dead-letter-topic
```

人工处理。

例如：

```text
订单消息

↓

消费失败3次

↓

死信队列

↓

人工排查

```

---

## 5. Kafka消息重复是什么？

面试经常连问：

> 保证不丢消息，会不会导致重复消息？

答案：

会。

Kafka通常保证：

> 至少一次（At Least Once）

而不是：

> 恰好一次（Exactly Once）

例如：

流程：

```text id="duplicate"
Consumer处理成功

↓

还没提交offset

↓

Consumer宕机

↓

重新消费

```

导致：

业务执行两次。

---

## 6. 如何保证消费幂等？

核心：

让重复消费没有副作用。

方式：

### （1）业务唯一ID

例如订单：

消息：

```json id="order-id"
{
 "orderId":"10001"
}
```

数据库：

```sql
unique(order_id)
```

第一次：

成功。

第二次：

唯一约束拦截。

---

### （2）状态机控制

例如订单：

状态：

```text id="order-status"
CREATED

↓

PAID

↓

SHIPPED
```

如果已经：

```text
PAID
```

再次支付消息：

直接忽略。

---

### （3）去重表

例如：

消费记录表：

```sql
consumer_message
```

保存：

```text
message_id
```

消费前检查：

是否处理过。

---

## 7. Kafka Exactly Once了解吗？

高级回答可以补充。

Kafka支持：

Exactly Once Semantics（EOS）

通过：

* 幂等Producer
* Transaction
* offset事务提交

实现。

参数：

```properties
enable.idempotence=true
```

事务：

```text id="kafka-transaction"
生产消息

+

提交offset

+

数据库操作

```

保证原子性。

但是：

实际业务中：

更多使用：

> At Least Once + 幂等设计

因为更简单可靠。

---

## 8. AI Agent项目中的Kafka可靠性设计

结合Agent项目。

例如：

文档上传：

```text id="agent-document"
用户上传PDF

        |

Document Service

        |

Kafka

        |

Embedding Worker

        |

向量数据库
```

---

### Producer保证

配置：

```properties
acks=all
```

确保：

上传事件不丢。

---

### Broker保证

配置：

```properties
replication.factor=3

min.insync.replicas=2
```

避免：

机器故障导致消息丢失。

---

### Consumer保证

流程：

```text id="agent-consumer"
消费document-upload

        |

解析PDF成功

        |

切片成功

        |

Embedding成功

        |

提交offset

```

如果失败：

进入：

```text
retry-topic

或者

dead-letter-topic
```

---

## 9. Kafka和数据库一致性问题（高级）

例如商城：

订单创建：

```text id="order-db-kafka"
创建订单

+

发送Kafka消息
```

问题：

数据库成功：

Kafka失败。

或者：

Kafka成功：

数据库失败。

---

解决：

### 本地消息表

流程：

```text id="local-message"
开启事务

↓

写订单表

↓

写消息表

↓

commit

```

后台任务：

扫描消息表：

发送Kafka。

---

### Outbox模式

现代微服务常用。

流程：

```text id="outbox"
业务数据库

        |

Outbox表

        |

Kafka

```

保证：

业务数据和事件最终一致。

---

## 10. 面试30秒总结版

Kafka消息丢失主要发生在三个阶段：

Producer发送阶段、Broker存储阶段、Consumer消费阶段。

Producer侧通过 `acks=all` 保证消息写入多个副本后才确认；Broker侧通过增加副本数 `replication.factor` 和设置 `min.insync.replicas` 保证数据可靠；Consumer侧关闭自动提交，在业务处理成功后再提交offset，避免消费丢失。

同时Kafka通常保证的是至少一次投递，可能存在重复消费，所以业务侧需要通过唯一ID、幂等表、状态机等方式保证幂等。

在AI Agent项目中，例如文档解析、Embedding任务、Agent事件记录等异步流程，会采用 Kafka + 重试队列 + 死信队列保证任务可靠执行。
