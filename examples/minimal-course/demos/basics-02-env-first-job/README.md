# 第一个作业实验室

本章配套 Demo：**不依赖 archetype** 即可跑通最小 DataStream 作业；完整欺诈检测 Walkthrough 请按章节中的 `mvn archetype:generate` 生成。

## 环境要求

- JDK 17
- Maven 3.9+
- （可选）Docker 20+，用于 Web UI

## 方式 A：Maven 直接运行（推荐）

在课程根目录 `courses/apache-flink` 下执行：

```bash
cd demos/basics-02-env-first-job
mvn -q exec:java
```

预期：控制台持续打印大写单词（`PrintSink` 输出到 TaskManager 日志）。按 `Ctrl+C` 结束。

打包 fat JAR（用于 `flink run` 提交）：

```bash
mvn -q clean package
# 产物：target/basics-02-env-first-job-1.0-SNAPSHOT.jar
```

## 方式 B：官方欺诈检测 Walkthrough

按章节 `basics-02-env` 中的 archetype 命令生成 `frauddetection` 工程，在 IDE 运行 `spendreport.FraudDetectionJob`。

IntelliJ 若 `NoClassDefFoundError`：Run Configuration → Modify options → **include dependencies with "Provided" scope**。

## 方式 C：Docker Web UI（可选）

```bash
cd demos/basics-02-env-first-job
docker compose up -d
```

浏览器打开 **http://localhost:8081**。本 Demo 默认用方式 A 在**内置 MiniCluster** 运行，不会自动出现在 Jobs 列表；若已 `flink run` 提交 Walkthrough JAR，可在 Jobs 页观察 RUNNING 作业。

停止：

```bash
docker compose down
```

## 提交到 Standalone 集群（进阶）

1. 启动集群（Docker 或 `FLINK_HOME/bin/start-cluster.sh`）。
2. 对 Walkthrough 或本 Demo 打包后的 JAR 执行：

```bash
$FLINK_HOME/bin/flink run -c learn.flink.FirstFlinkJob \
  target/basics-02-env-first-job-1.0-SNAPSHOT.jar
```

## 学习建议

- 先跑通方式 A，再按章节生成官方 Walkthrough。
- 镜像版本见 `docker-compose.yml`；拉取失败请参考 [Flink Docker 文档](https://nightlies.apache.org/flink/flink-docs-stable/docs/deployment/resource-providers/standalone/docker/)。
