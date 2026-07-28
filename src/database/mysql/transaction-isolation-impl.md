---
title: MySQL事务隔离等级是如何实现的？
category:
  - MYSQL
order: 1
---


MySQL InnoDB 的事务隔离主要是通过：

* **MVCC（多版本并发控制）**
* **ReadView（读视图）**
* **Undo Log（版本链）**
* **行锁**
* **间隙锁（Gap Lock）**
* **临键锁（Next-Key Lock）**

这些机制共同实现的。

其中：

* **MVCC主要解决普通查询的一致性读问题**
* **锁机制主要解决当前读和并发修改问题**

MySQL 默认隔离级别：

> Repeatable Read（可重复读）

就是通过 MVCC + Next-Key Lock 实现的。

---

## 1. 先理解事务读取数据的两种方式

MySQL中读取数据分两种：

### （1）快照读（Snapshot Read）

普通查询：

```sql
select * 
from user
where id=1;
```

特点：

* 不加锁
* 读取历史版本
* 依赖MVCC

例如：

```sql
select name from user where id=1;
```

使用：

```text
ReadView
+
Undo Log版本链
```

找到当前事务应该看到的数据。

---

### （2）当前读（Current Read）

加锁查询：

```sql
select *
from user
where id=1
for update;
```

或者：

```sql
update user
set name='Tom'
where id=1;
```

特点：

读取最新数据，并且加锁。

依赖：

* 行锁
* 间隙锁
* 临键锁

---

## 2. MVCC是什么？

MVCC：

Multi-Version Concurrency Control

多版本并发控制。

核心思想：

> 数据不是只有一个版本，而是保存多个历史版本，让不同事务看到自己应该看到的版本。

例如：

用户表：

| id | name |
| -- | ---- |
| 1  | Jack |

事务A修改：

```sql
update user
set name='Tom'
where id=1;
```

提交前：

数据库不会直接覆盖原数据。

而是形成版本链：

```
当前记录：

name=Tom

      |
      ↓

Undo Log:

name=Jack
```

---

## 3. Undo Log版本链

InnoDB每条记录都有隐藏字段：

主要包括：

### （1）trx_id

最后修改该记录的事务ID。

例如：

```
trx_id=100
```

表示：

事务100修改过。

---

### （2）roll_pointer

指向上一个版本。

形成链：

```
当前版本

name=Tom
trx_id=100

     |
     ↓

Undo Log

name=Jack
trx_id=80

     |
     ↓

Undo Log

name=Lucy
trx_id=50
```

这就是版本链。

---

## 4. ReadView是什么？

ReadView 可以理解为：

> 一个事务执行查询时创建的“可见性规则”。

它决定：

当前事务应该看到哪个版本。

ReadView主要包含：

### （1）m_ids

当前活跃事务ID列表。

例如：

当前：

```
事务A id=100

事务B id=101
```

那么：

```
m_ids=[100,101]
```

---

### （2）min_trx_id

最小活跃事务ID。

例如：

```
100
```

---

### （3）max_trx_id

下一个要分配的事务ID。

例如：

```
105
```

---

### （4）creator_trx_id

当前事务自己的ID。

---

## 5. ReadView如何判断版本是否可见？

假设：

当前事务：

```
trx_id=102
```

读取数据：

版本链：

```
name=Tom

trx_id=101

     |

name=Jack

trx_id=90
```

判断：

---

### 情况1：

版本trx_id < min_trx_id

说明：

事务已经提交。

可见。

---

### 情况2：

版本trx_id > max_trx_id

说明：

这个版本来自未来事务。

不可见。

---

### 情况3：

trx_id 在 m_ids中

说明：

修改该版本的事务还没有提交。

不可见。

继续找Undo Log。

---

最终找到：

当前事务应该看到的版本。

---

## 6. 不同隔离级别和MVCC关系

重点来了。

### Read Committed（读已提交）

特点：

每次查询都会生成新的ReadView。

例如：

事务A：

第一次查询：

```
ReadView1
```

事务B提交修改。

事务A：

第二次查询：

```
ReadView2
```

新的ReadView可以看到最新提交数据。

所以：

可能出现：

不可重复读。

---

### Repeatable Read（可重复读）

MySQL默认。

特点：

一个事务第一次查询时创建ReadView。

后续查询：

复用同一个ReadView。

例如：

事务A：

第一次查询：

```
ReadView
```

事务B修改并提交。

事务A再次查询：

仍使用旧ReadView。

所以：

看到的数据一致。

解决：

不可重复读。

---

## 7. 行锁如何实现隔离？

MVCC解决：

普通查询。

但是修改数据：

需要锁。

例如：

事务A：

```sql
update account
set money=500
where id=1;
```

会加：

排他锁（X Lock）

结构：

```
事务A

获取X锁

     |

修改数据
```

事务B：

```sql
update account
set money=300
where id=1;
```

需要等待：

```
事务A释放锁
```

---

## 8. 为什么需要间隙锁（Gap Lock）？

解决：

幻读。

例如：

表：

```
id

10

20

30
```

事务A：

```sql
select *
from user
where id > 10
and id < 20
for update;
```

如果没有间隙锁：

事务B：

```sql
insert into user(id)
values(15);
```

成功。

事务A再次查询：

多了一条数据。

产生幻读。

---

## 9. 间隙锁是什么？

间隙锁锁住：

数据之间的空隙。

例如：

已有：

```
10
20
30
```

间隙：

```
(10,20)

(20,30)
```

加锁：

```
锁住(10,20)

禁止插入15
```

---

## 10. 什么是临键锁（Next-Key Lock）？

Next-Key Lock：

= 行锁 + 间隙锁

例如：

查询：

```sql
select *
from user
where id >=10
and id <=20
for update;
```

锁：

不仅锁：

```
10
20
```

还锁：

```
(10,20)
```

目的：

防止：

其他事务插入满足条件的新数据。

---

## 11. MySQL RR级别如何解决幻读？

这是面试重点。

很多人回答：

> MVCC解决幻读。

不完全准确。

正确回答：

MySQL RR：

### 快照读

使用：

```
MVCC + ReadView
```

解决幻读。

例如：

```sql
select *
from user
where age>20;
```

多次查询：

看到同一个快照。

---

### 当前读

使用：

```
Next-Key Lock
```

解决幻读。

例如：

```sql
select *
from user
where age>20
for update;
```

通过：

* 行锁
* 间隙锁

阻止新增满足条件的数据。

---

## 12. 一个完整案例

假设：

账户表：

```
id=1
money=1000
```

---

### 事务A

开启：

```
trx_id=100
```

查询：

```sql
select money
from account
where id=1;
```

创建：

```
ReadView
```

看到：

```
money=1000
```

---

### 事务B

修改：

```sql
update account
set money=500
where id=1;
```

生成版本：

```
当前：

money=500
trx_id=101


Undo:

money=1000
```

提交。

---

### 事务A再次查询

因为：

RR隔离级别。

使用原来的：

ReadView。

发现：

trx_id=101

不在可见范围。

继续找Undo。

返回：

```
money=1000
```

所以：

可重复读实现。

---

## 13. Java业务中的实际应用

例如订单扣库存：

```java
@Transactional
public void createOrder(){

    checkStock();

    reduceStock();

    createOrder();

}
```

并发：

两个用户同时购买。

如果：

只查询：

```sql
select stock
from product
where id=1;
```

可能超卖。

通常：

使用当前读：

```sql
select stock
from product
where id=1
for update;
```

加行锁。

流程：

```
事务A

获取库存行锁

↓

扣库存


事务B

等待锁释放
```

保证库存一致。

---

## 14. 面试30秒总结版

MySQL InnoDB 的事务隔离主要通过 **MVCC 和锁机制**实现。

普通查询属于快照读，通过 ReadView 判断数据版本是否可见，并结合 Undo Log 保存的版本链实现一致性读取。

修改操作和加锁查询属于当前读，通过行锁、间隙锁以及 Next-Key Lock 保证数据修改的一致性，防止幻读。

其中 RC 隔离级别每次查询生成新的 ReadView，而 RR 隔离级别第一次查询生成 ReadView，后续复用，因此实现可重复读。

MySQL 默认 RR，就是通过 MVCC 解决快照读问题，通过 Next-Key Lock 解决当前读场景下的幻读问题。
