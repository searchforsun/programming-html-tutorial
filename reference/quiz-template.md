# 测验 HTML 片段

写入 `<workspace>/courses/<slug>/quiz.partial.html`，由 assemble 注入 `#quiz-panel`。`data-quiz` 键与 `course.json` → `quizzes` 一致。

## 面板结构（每章一节）

- 每章一个 `section.quiz-section`，必填 `data-chapter="{chapterId}"`（与章节 `data-chapter` 一致）。
- 章内顺序：**`h3` 章节测验** → **`p.quiz-panel-lead` 说明** → 题目列表。

```html
<section id="quiz-{quizId}" class="quiz-section" data-quiz="{quizId}" data-chapter="{chapterId}">
  <h3>章节测验</h3>
  <p class="quiz-panel-lead">学完当前章节后作答；可先「检查」再看「提示」或「答案」。<span class="quiz-level-hint">热身+理解+场景</span></p>

  <article class="quiz-item" data-qid="q1" data-answer="B">
    <p class="stem"><strong>1.</strong> （单选）题干…</p>
    <ul class="options">
      <li><label><input type="radio" name="{unique}-q1" value="A"> …</label></li>
      <li><label><input type="radio" name="{unique}-q1" value="B"> …</label></li>
    </ul>
    <div class="quiz-actions">
      <button type="button" class="btn-check">检查</button>
      <button type="button" class="btn-hint">提示</button>
      <button type="button" class="btn-answer">答案</button>
    </div>
    <p class="hint hidden">…</p>
    <p class="answer hidden"><strong>答案：</strong>B — …</p>
  </article>
  <!-- 填空、多选各 ≥1；radio/checkbox 的 name 每题唯一 -->
</section>
```

生成时 `quiz-actions` 外层为 `<div class="quiz-actions">`（勿用其它标签名）。

## 壳层行为

| 能力 | 说明 |
|------|------|
| 切换章节 | `syncQuizVisibility` 只显示当前章 `data-chapter` 匹配的 section |
| 右侧大纲 | 自动追加「章节测验」锚点（指向该章 `h3`） |
| 检查 | `.btn-check` 对比 `data-answer`（多选为逗号排序集合） |

## COURSE_DATA.quizzes 示例

```json
"{chapterId}-quiz": {
  "chapterId": "{chapterId}",
  "title": "章节标题（元数据用）",
  "questions": [
    { "id": "q1", "type": "single", "answer": "B", "hint": "…" }
  ]
}
```
