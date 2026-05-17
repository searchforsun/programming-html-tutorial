# 领域主题色（按课程生成）

**每门课只生成一组主题 CSS**，绑定本课的 `meta.themePreset`（通常与 `meta.slug` 相同）。不要维护跨课程共用的预设表，也不要从其他教程复制色值。

## Agent 任务（生成 `index.html` 时执行）

结合 `meta.domain`、`meta.title` 与官方品牌色/社区共识，**自行判断**主色与背景渐变，并写入 `<style>`（接在 [shell-styles.md](shell-styles.md) 之后）：

1. 取 `themePreset = meta.themePreset || meta.slug`（kebab-case，如 `kotlin-coroutines`）。
2. 为 **亮色 / 暗色** 各写一组 CSS 变量，选择器：

```css
[data-theme-preset="{themePreset}"][data-theme="light"] { /* 变量 */ }
[data-theme-preset="{themePreset}"][data-theme="dark"] { /* 变量 */ }
```

3. **必须定义的变量**（与 shell-styles 一致）：

| 变量 | 用途 |
|------|------|
| `--accent` | 主色：链接、按钮、侧栏高亮 |
| `--accent-hover` | 悬停略深/略亮 |
| `--accent-soft` | 浅色背景块 |
| `--accent-glow` | 按钮阴影 rgba |
| `--accent-alt` | 进度条/渐变第二色（勿写死在组件里） |
| `--bg-accent` | `body` 背景径向渐变 |
| `--phase-basics` | 基础阶段标签色（可与 accent 相同或略调） |

4. **实践 / 进阶** 阶段色可在 `:root` / `[data-theme]` 层统一写（如紫、琥珀），与主色协调即可。
5. 保证亮/暗模式下文字与背景对比度可读；禁止在 `.btn-copy`、`.chapter-header` 等组件规则里写死某一技术的 hex。

## `COURSE_DATA.meta` 示例

```json
{
  "meta": {
    "title": "{领域} 入门到进阶",
    "slug": "{kebab-case}",
    "domain": "{领域显示名}",
    "themePreset": "{kebab-case}",
    "version": "{当前稳定版}",
    "officialDocs": "{官方文档 URL}"
  }
}
```

`themePreset` 可省略，运行时回退为 `slug`。

## 主色判断参考（仅供推理，非代码）

根据领域**自行选用**色值，下表仅为常见倾向，可偏离：

| 领域类型 | 主色倾向 |
|----------|----------|
| Spring / 企业 Java 生态 | 绿色系 |
| Java 语言本身 | 橙色 / 咖啡色系 |
| Python | 蓝 + 黄点缀 |
| JavaScript | 黄 |
| TypeScript | 蓝 |
| React / Vue 等前端框架 | 框架官方色 |
| Rust / Go / Kotlin 等 | 社区或 Logo 主色 |
| 数据库 / DevOps / 云原生 | 蓝、靛蓝、蓝紫 |
| 无明确品牌色 | 中性蓝（与 shell-styles 默认 :root 接近） |

## 运行时

```javascript
function applyThemePreset() {
  var id = (COURSE_DATA.meta.themePreset || COURSE_DATA.meta.slug || 'default')
    .replace(/[^a-z0-9-]/g, '');
  document.documentElement.setAttribute('data-theme-preset', id);
}
```

`initCourse()` 开头、在 `applyTheme(light|dark)` 之前调用。

## 检查项

- [ ] 本课 `<style>` 内存在与 `themePreset` 同名的 `[data-theme-preset="..."]` 亮/暗两套变量
- [ ] 未粘贴其他课程的 theme 块
- [ ] 组件样式仅使用 `var(--accent*)`，渐变使用 `var(--accent-alt)`
