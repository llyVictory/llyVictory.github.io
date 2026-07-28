---
title: MySQL事务隔离等级有了解吗？
category:
  - MYSQL
order: 1
---


MySQL 的事务隔离级别主要用于解决**多个事务并发执行时产生的数据一致性问题**。

SQL 标准定义了 4 种隔离级别：

1. Read Uncommitted（读未提交）
2. Read Committed（读已提交）
3. Repeatable Read（可重复读）
4. Serializable（串行化）

MySQL InnoDB 默认使用：

> **Repeatable Read（可重复读）**

---

## 1. 为什么需要事务隔离？

多个事务同时执行时，可能产生问题。

例如：

事务A：

```sql
select balance from account where id=1;
```

事务B：

```sql
update account 
set balance=500 
where id=1;
```

如果没有隔离控制，可能出现：

* 脏读
* 不可重复读
* 幻读

---

## 2. 三种常见并发问题

### （1）脏读 Dirty Read

定义：

一个事务读取到了另一个事务**未提交的数据**。

例如：

账户余额：

```
1000
```

事务A：

```sql
update account 
set balance=500
where id=1;
```

但是：

还没有 commit。

事务B：

```sql
select balance 
from account 
where id=1;
```

读取：

```
500
```

但是事务A：

```sql
rollback;
```

最终：

```
余额还是1000
```

事务B读到了不存在的数据。

这就是：

> 脏读

---

### （2）不可重复读 Non-Repeatable Read

定义：

同一个事务内，两次读取同一条数据，结果不一样。

例如：

事务A：

```sql
begin;

select balance 
from account
where id=1;
```

结果：

```
1000
```

此时事务B：

```sql
update account
set balance=500
where id=1;

commit;
```

事务A再次查询：

```sql
select balance 
from account
where id=1;
```

结果：

```
500
```

同一个事务：

第一次：

```
1000
```

第二次：

```
500
```

这就是：

> 不可重复读

---

### （3）幻读 Phantom Read

定义：

同一个事务中，两次查询返回的记录数量不同。

例如：

事务A：

```sql
begin;

select *
from user
where age > 20;
```

返回：

```
10条数据
```

事务B：

```sql
insert into user(age)
values(30);

commit;
```

事务A再次查询：

```sql
select *
from user
where age >20;
```

发现：

```
11条数据
```

多出来的数据像“幻觉”。

所以叫：

> 幻读

---

## 3. 四种隔离级别

### （1）Read Uncommitted（读未提交）

最低隔离级别。

特点：

可以读取其他事务未提交的数据。

可能出现：

| 问题    | 是否可能 |
| ----- | ---- |
| 脏读    | ✅    |
| 不可重复读 | ✅    |
| 幻读    | ✅    |

优点：

性能最高。

缺点：

数据一致性差。

实际生产：

很少使用。

---

### （2）Read Committed（读已提交）

特点：

只能读取已经提交的数据。

解决：

脏读。

例如：

事务A：

```sql
update balance=500;
```

未提交。

事务B：

查询：

看不到500。

只有：

```sql
commit;
```

之后才能看到。

问题：

仍可能：

不可重复读。

---

Oracle 默认：

Read Committed。

---

### （3）Repeatable Read（可重复读）

MySQL InnoDB默认。

特点：

同一个事务内：

多次读取结果一致。

解决：

* 脏读
* 不可重复读

例如：

事务A：

```sql
begin;

select * from user where id=1;
```

事务B修改：

```sql
update user set name='Tom';
commit;
```

事务A再次查询：

仍然看到原来的数据。

---

#### MySQL如何实现可重复读？

核心：

##### MVCC（多版本并发控制）

InnoDB保存：

历史版本。

例如：

数据：

```
id=1
name=Jack
```

修改：

```
name=Tom
```

数据库内部：

```
版本1:

Jack


版本2:

Tom
```

事务根据自己的 Read View：

选择对应版本。

---

### （4）Serializable（串行化）

最高隔离级别。

原理：

让事务串行执行。

类似：

```text
事务A执行

↓

事务B等待

↓

事务A提交

↓

事务B执行
```

优点：

数据一致性最高。

缺点：

性能最低。

因为：

大量锁竞争。

---

## 4. 四种隔离级别对比

| 隔离级别             | 脏读 | 不可重复读 | 幻读 | 性能 |
| ---------------- | -- | ----- | -- | -- |
| Read Uncommitted | 有  | 有     | 有  | 最高 |
| Read Committed   | 无  | 有     | 有  | 较高 |
| Repeatable Read  | 无  | 无     | 可能 | 较好 |
| Serializable     | 无  | 无     | 无  | 最低 |

---

## 5. MySQL为什么默认Repeatable Read？

面试重点。

原因：

MySQL InnoDB 通过：

* MVCC
* Next-Key Lock

解决大部分一致性问题。

既保证：

数据一致性。

又保证：

较高并发性能。

相比 Serializable：

不会让所有事务串行执行。

---

## 6. MySQL Repeatable Read如何解决幻读？

这是高级追问。

很多人回答：

> MVCC解决幻读

不完全正确。

实际上：

InnoDB：

普通查询：

```sql
select *
from user
where id>10;
```

使用：

MVCC快照读。

解决幻读。

但是：

当前读：

例如：

```sql
select *
from user
where id>10
for update;
```

需要：

锁机制。

使用：

Next-Key Lock。

---

## 7. 快照读和当前读

### 快照读

普通：

```sql
select *
from user;
```

读取：

历史版本。

依赖：

MVCC。

---

### 当前读

加锁查询：

```sql
select *
from user
for update;
```

读取：

最新数据。

使用：

锁。

---

## 8. 事务隔离和锁的关系

事务隔离级别背后：

主要靠：

### （1）MVCC

解决：

普通查询一致性。

---

### （2）锁机制

解决：

数据修改冲突。

例如：

更新：

```sql
update user
set name='Tom'
```

加：

排他锁 X Lock。

---

## 9. Java后端项目中的实际应用

例如：

订单系统：

用户支付：

```text
创建订单

↓

扣库存

↓

扣余额

↓

修改订单状态
```

需要事务：

```java
@Transactional
public void pay(){

    createOrder();

    reduceStock();

    updateAccount();

}
```

如果隔离级别太低：

可能：

库存超卖。

---

### 订单场景

通常：

使用：

```text
Repeatable Read
```

原因：

* 保证读取一致
* 支持高并发

配合：

* 行锁
* 乐观锁
* CAS

解决库存竞争。

---

## 10. AI Agent项目中的事务场景

例如：

AI助手生成任务：

流程：

```
创建任务

↓

扣除用户额度

↓

保存对话记录

↓

记录token消耗
```

需要保证：

要么全部成功：

```
任务创建
额度扣除
记录保存
```

要么全部失败。

使用：

```java
@Transactional
```

隔离级别：

一般：

```text
Repeatable Read
```

如果涉及：

账户余额、额度扣减：

可能提高隔离级别或者使用：

* 悲观锁
* 乐观锁
* 分布式锁

---

## 11. 面试30秒总结版

MySQL 有四种事务隔离级别：

**Read Uncommitted、Read Committed、Repeatable Read 和 Serializable。**

主要解决事务并发产生的脏读、不可重复读和幻读问题。

MySQL InnoDB 默认使用 Repeatable Read，通过 MVCC 保证事务读取一致性，同时结合 Next-Key Lock 解决当前读场景下的幻读问题。

实际业务中通常选择 Repeatable Read，在保证数据一致性的同时保持较好的并发性能。如果涉及库存、余额等强一致场景，会结合行锁、乐观锁或者分布式锁进一步保证一致性。
