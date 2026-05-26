# 限界上下文与 API 契约实验室

本章配套**纸面 / YAML 片段练习**，无需启动 Spring 工程。对应章节「动手练习」第 3 步。

## 目标

- 识别 ShopFlow 三大限界上下文的职责与数据所有权
- 编写最小 OpenAPI 片段（预留库存 + 幂等头）
- 设计统一错误码并判断「跨上下文直接改表」是否可接受

## 练习 1：上下文职责填空

| 上下文 | 核心聚合 | 是否应直接读写 order 表 | 对外集成方式 |
|--------|----------|-------------------------|--------------|
| Order | | | |
| Inventory | | | |
| Payment | | | |

参考答案要点：仅 Order 拥有 order 表；Inventory 通过 API 暴露 reserve；Payment 通过事件通知 Order。

## 练习 2：OpenAPI 片段

在本地新建 `inventory-reservation.yaml`，至少包含：

- `POST /api/v1/reservations`
- Header `Idempotency-Key`（required）
- 响应 `201` 与 `409`
- requestBody 字段：`orderId`、`skuId`、`quantity`

对照章节正文 YAML 示例自检。

## 练习 3：错误码设计

为下列场景各设计一个 `code` 字符串（建议带上下文前缀）：

1. 库存不足
2. 重复幂等请求（返回同一预留结果）
3. 订单不存在

## 练习 4：边界审查（判断）

阅读场景：「payment-service 在收到渠道回调后，直接用 JDBC 更新 order 库的 status 字段。」

- 列出 2 个违反本章原则的理由
- 写出推荐替代方案（API 或事件）

## 下一章

完成站点右侧 **basics-04 章节测验** 后，继续 [通信模式：同步、异步与事件驱动](../../index.html#ch-basics-05-communication-patterns)。
