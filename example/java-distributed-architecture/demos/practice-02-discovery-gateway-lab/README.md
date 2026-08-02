# Eureka + Gateway 本地栈实验室

本章 Demo：在 practice-01 脚手架基础上，启动 **Eureka**、注册 **order / inventory**，并通过 **Spring Cloud Gateway** 统一入口访问。

## 前置条件

- 已完成 [practice-01 脚手架](../practice-01-spring-cloud-bootstrap-lab/README.md)（JDK 21、父 POM + BOM）
- Docker Desktop 或 Docker Engine（可选，用于 Eureka 容器）
- 端口空闲：`8761`（Eureka）、`8080`（Gateway）、`8081`（order）、`8082`（inventory）

## 目标

- Eureka 控制台可见两个 UP 实例
- 经 Gateway `8080` 转发到 order / inventory health
- 理解启动顺序：discovery → services → gateway

## 模块清单（在 shopflow 父工程新增）

| 模块 | 端口 | 依赖 |
|------|------|------|
| `shopflow-discovery-server` | 8761 | `spring-cloud-starter-netflix-eureka-server` |
| `shopflow-gateway` | 8080 | `gateway-server-webflux` + `eureka-client` |
| `shopflow-order-service` | 8081 | 已有 + `eureka-client` |
| `shopflow-inventory-service` | 8082 | 已有 + `eureka-client` |

## 步骤 1：启动 Eureka

**方式 A — 本地 Maven**

```bash
cd shopflow-discovery-server
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

**方式 B — Docker（需先 build discovery-server 镜像）**

```bash
docker compose -f docker-compose.yml up -d discovery-server
```

浏览器打开 http://localhost:8761 ，应看到 Eureka 控制台。

## 步骤 2：启动业务服务

终端 1：

```bash
cd shopflow-inventory-service
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

终端 2：

```bash
cd shopflow-order-service
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

刷新 Eureka，应出现 `INVENTORY-SERVICE`、`ORDER-SERVICE` 各至少 1 个 UP 实例。

## 步骤 3：启动 Gateway

```bash
cd shopflow-gateway
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

路由配置见章节 yaml（`Path=/api/orders/**` → `lb://order-service`）。

## 步骤 4：验收

```bash
curl -s http://localhost:8080/api/orders/actuator/health
curl -s http://localhost:8080/api/inventory/actuator/health
```

期望 JSON 含 `"status":"UP"`（若配置了 StripPrefix，路径以你本地 Controller 为准）。

停止 inventory 进程，等待约 30～90s，再 curl inventory 路由，观察失败或剔除行为。

## docker-compose.yml（最小示例）

本目录 `docker-compose.yml` 仅示意 Eureka 服务；完整 JAR 需自行 build 后挂载或使用多阶段 Dockerfile。

## 下一章

完成 **practice-02 章节测验** 后，继续 [OpenFeign 与服务间调用](../../index.html#ch-practice-03-sync-calls)。
