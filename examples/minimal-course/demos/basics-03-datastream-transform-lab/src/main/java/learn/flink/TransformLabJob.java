package learn.flink;

import org.apache.flink.api.java.tuple.Tuple2;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.util.Collector;

/**
 * 演示 flatMap → map → filter → keyBy → print，对应 basics-03-datastream 章节。
 */
public class TransformLabJob {

    public static void main(String[] args) throws Exception {
        int parallelism = 2;
        if (args.length > 0) {
            parallelism = Integer.parseInt(args[0]);
        }

        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
        env.setParallelism(parallelism);
        System.out.println("[lab] default parallelism = " + parallelism);

        DataStream<String> lines = env.fromElements(
                "alice 100",
                "bob 50",
                "alice 30",
                "charlie 200",
                "invalid-line",
                "bob 10");

        DataStream<Tuple2<String, Integer>> pairs = lines
                .flatMap((String line, Collector<String[]> out) -> {
                    String[] parts = line.split(" ");
                    if (parts.length == 2) {
                        out.collect(parts);
                    }
                })
                .returns(String[].class)
                .map(parts -> Tuple2.of(parts[0], Integer.parseInt(parts[1])))
                .filter(t -> t.f1 >= 50);

        pairs.keyBy(t -> t.f0)
                .map(t -> Tuple2.of(t.f0, t.f1))
                .print();

        env.execute("transform-lab");
    }
}
