# 架构自测实验室

本章配套 Demo：**不写 Flink 代码**，用自测清单 +（可选）Web UI 巩固 JobManager / TaskManager 概念。

## 方式 A：纸质自测（零依赖）

1. 在纸上画出 Client → JobManager → TaskManager 三层，标出 Dispatcher、JobMaster、Slot。
2. 用 4 句话描述「提交作业 → 部署 Task → 持续运行 → Checkpoint」时序。
3. 完成 API 选型：场景「实时按小时统计订单金额」选 Table/SQL 还是 DataStream，写 2 条理由。

## 方式 B：Docker 预览 Web UI（可选）

**环境要求：** Docker Desktop 或 Docker Engine 20+

```bash
# 在课程根目录 courses/apache-flink 下执行
cd demos/basics-01-overview-arch-lab
docker compose up -d
```

浏览器打开 **http://localhost:8081**（Flink Web UI）。

### 观察清单

| Web UI 位置 | 对应本章概念 |
|-------------|--------------|
| Overview → Task Managers | TaskManager 进程与 Slot 数量 |
| Overview → Jobs | 当前无作业时为空；下一章提交后可见 JobMaster 管理的作业 |
| 配置中的 JobManager 地址 | Client 提交目标 |

停止环境：

```bash
docker compose down
```

## 学习建议

- 本章 Demo 为**概念验证**；完整动手跑作业见下一章 `basics-02-env`。
- 镜像标签以 `docker-compose.yml` 为准；若拉取失败，可改用 [Flink Docker 官方文档](https://nightlies.apache.org/flink/flink-docs-stable/docs/deployment/resource-providers/standalone/docker/) 推荐版本。
