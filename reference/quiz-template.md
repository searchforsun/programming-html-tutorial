# 测验 HTML 片段

插入 `#quiz-panel` 或主内容区末尾。`quizId` 与 `COURSE_DATA.quizzes` 键一致。

```html
<section id="quiz-{quizId}" class="quiz-section" data-quiz="{quizId}">
  <h2>章节测验：{title}</h2>

  <article class="quiz-item" data-qid="q1" data-answer="B">
    <p class="stem"><strong>1.</strong> （单选）Spring Boot 默认内嵌容器是？</p>
    <ul class="options">
      <li><label><input type="radio" name="q1" value="A"> Jetty</label></li>
      <li><label><input type="radio" name="q1" value="B"> Tomcat</label></li>
    </ul>
    <div class="quiz-actions">
      <button type="button" class="btn-hint" data-hint="查看 starter-web 默认依赖">提示</button>
      <button type="button" class="btn-answer">答案</button>
    </div>
    <p class="hint hidden">starter-web 默认引入 Tomcat</p>
    <p class="answer hidden"><strong>答案：</strong>B — Tomcat</p>
  </article>

  <article class="quiz-item" data-qid="q2" data-answer="IoC,DI">
    <p class="stem"><strong>2.</strong> （填空）Spring 核心思想缩写：____ 与 ____</p>
    <input type="text" class="fill-input" aria-label="填空答案" />
    <div class="quiz-actions">
      <button type="button" class="btn-hint" data-hint="控制反转与依赖注入">提示</button>
      <button type="button" class="btn-answer">答案</button>
    </div>
    <p class="hint hidden">控制反转、依赖注入</p>
    <p class="answer hidden"><strong>答案：</strong>IoC, DI</p>
  </article>

  <article class="quiz-item" data-qid="q3" data-answer="A,C">
    <p class="stem"><strong>3.</strong> （多选）属于 Spring Boot Actuator 端点的是？</p>
    <ul class="options">
      <li><label><input type="checkbox" name="q3" value="A"> /actuator/health</label></li>
      <li><label><input type="checkbox" name="q3" value="B"> /admin/users</label></li>
      <li><label><input type="checkbox" name="q3" value="C"> /actuator/metrics</label></li>
    </ul>
    <div class="quiz-actions">
      <button type="button" class="btn-hint" data-hint="actuator 前缀">提示</button>
      <button type="button" class="btn-answer">答案</button>
    </div>
    <p class="hint hidden">关注 /actuator 路径</p>
    <p class="answer hidden"><strong>答案：</strong>A, C</p>
  </article>
</section>
```

生成时 `quiz-actions` 外层为 `<div class="quiz-actions">`，不得保留 `motion` 标签。

## COURSE_DATA.quizzes 示例

```json
"basics-01-quiz": {
  "chapterId": "basics-01-env",
  "title": "环境搭建测验",
  "questions": [
    { "id": "q1", "type": "single", "answer": "B", "hint": "..." }
  ]
}
```

## JS 行为（内联在 shell）

- `.btn-hint` → 切换同题 `.hint.hidden`
- `.btn-answer` → 切换同题 `.answer.hidden`
- 可选：提交时对比 `data-answer` 显示对错（字符串相等或逗号分隔集合比较）
