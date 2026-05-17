# 架构实验室：观察 NameServer 与 Broker 注册

配合第 1 章「RocketMQ 定位与架构鸟瞰」，用最小集群验证架构图中的路由注册关系。

## 环境要求

- Docker Desktop 或 Docker Engine 20+
- 本机端口 `9876`（NameServer）、`10911`/`10909`（Broker）未被占用

## 启动

```bash
cd demos/basics-01-overview-arch-lab
docker compose up -d
```

等待约 15–30 秒，直到 Broker 完成向 NameServer 注册。

## 查看集群（对应架构图中的「Broker → NameServer 注册」）

```bash
docker exec rmq-broker sh mqadmin clusterList -n namesrv:9876
```

预期输出中包含 `DefaultCluster` 及 `broker-a`（或类似 Broker 名称），说明 Broker 已向 NameServer 上报路由。

## 可选：查看 Topic 路由

```bash
docker exec rmq-broker sh mqadmin topicRouteInfo -n namesrv:9876 -t TopicTest
```

若 Topic 尚未创建，可能提示不存在——第 2 章会创建 Topic 并收发消息。

## 停止与清理

```bash
docker compose down
```

## 与课程的关系

| 组件 | 本 Demo 中 |
|------|------------|
| NameServer | 容器 `rmq-namesrv`，端口 9876 |
| Broker | 容器 `rmq-broker`，存储消息并注册路由 |
| Producer/Consumer | 第 2、4 章用 Java 客户端连接 `127.0.0.1:9876` |
