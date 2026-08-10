# ShopFlow 脚手架起步实验室

本章配套 Demo：在本地搭建 ShopFlow **最小可运行** order-service，验证 BOM、多模块与 Actuator。完整源码可在后续 practice 章逐步补齐；此处给出关键片段与验收命令。

## 前置条件

- JDK **21**（`java -version`）
- Maven **3.9+**
- 可选：curl 或浏览器

## 目标

- 创建父 POM 并 import Spring Cloud 2025.0.x BOM
- 建立 `common` + `order-api` + `order-service` 三模块
- 本地启动 order-service，health 返回 UP

## 步骤 1：创建父工程

在空目录 `shopflow/` 创建 `pom.xml`（见章节「JDK 21、Maven BOM」代码块），并添加 modules：

```xml
<modules>
  <module>shopflow-common</module>
  <module>shopflow-order-api</module>
  <module>shopflow-order-service</module>
</modules>
```

## 步骤 2：order-service 主类

```java
package com.shopflow.order;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class OrderServiceApplication {
  public static void main(String[] args) {
    SpringApplication.run(OrderServiceApplication.class, args);
  }
}
```

`application.yml` 设置 `spring.application.name: order-service`；`application-local.yml` 设置 `server.port: 8081`。

## 步骤 3：编译与启动

```bash
cd shopflow
mvn -q -DskipTests install
cd shopflow-order-service
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

## 步骤 4：验收

```bash
curl -s http://localhost:8081/actuator/health
```

期望输出含 `"status":"UP"`。

修改 `application-local.yml` 端口为 8082 后重启，确认新端口 health 仍 UP。

## 练习对照

- **理解练习 1～3**：对应上述步骤
- **判断练习**：单模块 vs 多模块 — 参考答案见章节「判断练习」

## 下一章

完成站点右侧 **practice-01 章节测验** 后，继续 [服务注册发现与 API 网关](../../index.html#ch-practice-02-discovery-gateway)。
