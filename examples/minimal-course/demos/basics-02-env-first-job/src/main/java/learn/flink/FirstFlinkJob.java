package learn.flink;

import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

/**
 * 课程 Demo：最小 DataStream 作业（对应本章「IDE 本地 Run」路径）。
 * 官方欺诈检测请用 archetype 生成完整 Walkthrough 工程。
 */
public class FirstFlinkJob {

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        env.fromElements("apache", "flink", "first-job")
                .map(String::toUpperCase)
                .print();

        env.execute("First Flink Job");
    }
}
