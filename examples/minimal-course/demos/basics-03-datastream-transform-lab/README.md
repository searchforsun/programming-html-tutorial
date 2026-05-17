# 转换与分区实验室

演示 **flatMap → map → filter → keyBy → print**，对应章节 `basics-03-datastream`。

## 环境要求

- JDK 17
- Maven 3.9+

## 运行

在 `courses/apache-flink` 下：

```bash
cd demos/basics-03-datastream-transform-lab
mvn -q exec:java
```

指定并行度（对比 print 输出中的 `subtask` 编号）：

```bash
mvn -q exec:java -Dexec.args=1
mvn -q exec:java -Dexec.args=4
```

## 观察要点

| 步骤 | 代码位置 | 预期 |
|------|----------|------|
| flatMap | 拆 `"user amount"` | `invalid-line` 被丢弃 |
| filter | `f1 >= 50` | `bob 10` 不出现 |
| keyBy | `t.f0` 用户名 | 同用户记录进同一 subtask 分区 |
| print | Sink | 行首含 `>` 与 subtask 索引 |

## 与章节的对应

- **Source**：`fromElements`
- **Transformation**：flatMap / map / filter / keyBy
- **Sink**：`print()`
- 修改 `env.setParallelism` 或通过 `-Dexec.args` 感受并行度变化

## 延伸

将作业 `mvn package` 后提交 Standalone，在 Web UI Task Graph 中查看 `keyBy` 后的 shuffle 边。
