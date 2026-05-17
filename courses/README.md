# 课程目录

在此目录下为每门课创建一个子目录（kebab-case 简称），例如 `courses/spring-boot/`。

## 目录结构

```text
courses/<slug>/
├── course.json
├── theme.css
├── welcome.partial.html
├── chapters/
│   └── <chapter-id>.html
├── quiz.partial.html     # 可选
├── README.md
├── index.html            # assemble 生成
├── demos/                # 可选
└── assets/               # 可选
```

## 组装与校验

在仓库根目录执行：

```bash
node scripts/assemble-index.mjs --dir courses/<slug>
node scripts/validate-tutorial.mjs --dir courses/<slug>
```

最小可运行参考见 [examples/minimal-course/](../examples/minimal-course/)。
