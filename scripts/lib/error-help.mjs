/**
 * 错误信息友好化：将技术性错误消息映射为「问题-重要性-修复」三要素。
 *
 * 用法：
 *   import { friendlyError, friendlyWarning, printFriendlyErrors } from './error-help.mjs';
 *   const e = friendlyError('chapters/basics-01.html missing blocks: notice-why-learn');
 *   // → { label, problem, importance, fix }
 *   printFriendlyErrors(errors, warnings);  // 终端友好输出
 */

const RULES = [
  // ── 文件缺失 ──
  {
    re: /^chapters\/(.+?)\.html missing blocks \(domainType \w+\): (.+)$/,
    problem: (m) => `第 ${m[1]} 章缺少教学法块：${m[2]}`,
    importance: '缺失教学法块会导致学习者不清楚本章「为什么学」和「学完能做什么」，降低学习动机与效果。',
    fix: (m) =>
      `在 chapters/${m[1]}.html 中添加缺失的块（见参考文档 reference/chapter-authoring.md）。常用块：\n` +
      `  · notice-why-learn —— 一段话说明为什么要学\n` +
      `  · notice-outcome —— 列表说明学完能做什么\n` +
      `  · chapter-conclusions-block —— 本章核心结论\n` +
      `  也可用 generate-chapter-skeleton.mjs 生成完整骨架。`,
  },
  {
    re: /^missing chapters\/(.+?\.html)$/,
    problem: (m) => `缺少章节文件：${m[1]}`,
    importance: '课程大纲引用了该章节但文件不存在，组装和预览会失败。',
    fix: (m) =>
      `确认 course.json → outline 中章节 id 与 chapters/ 目录内文件名一致。\n` +
      `  若需新建：node scripts/generate-chapter-skeleton.mjs --dir courses/<slug> --chapter <id>`,
  },
  {
    re: /^Missing course\.json$/,
    problem: () => '缺少课程定义文件 course.json',
    importance: '所有构建、校验、组装流程均依赖 course.json 作为数据源。',
    fix: () =>
      '在课程目录下创建 course.json，至少包含 meta（title/slug/domain/version）、outline、chapters、terms 字段。\n' +
      '  可参考 config/course.schema.json 了解完整结构。',
  },
  {
    re: /^missing welcome\.partial\.html/,
    problem: () => '缺少欢迎页 welcome.partial.html',
    importance: 'Shell 必须通过欢迎页渲染大纲摘要（#outline-summary-body），否则首页空白。',
    fix: () =>
      '在课程目录下创建 welcome.partial.html，至少包含：\n' +
      '  · <div id="outline-summary-body"> — 大纲摘要容器\n' +
      '  · welcome 区域的课程简介内容',
  },
  {
    re: /^missing theme\.css/,
    problem: () => '缺少主题样式 theme.css',
    importance: '课程无主题配色，全部使用默认灰色调。',
    fix: () =>
      '在课程目录下创建 theme.css，定义 :root 下的 --primary / --accent 等变量。\n' +
      '  最少只需 CSS 变量声明块。',
  },

  // ── 术语相关 ──
  {
    re: /^chapters\/(.+?)\.html: unknown data-term-id="(.+)"$/,
    problem: (m) => `第 ${m[1]} 章引用了未定义的术语「${m[2]}」`,
    importance: '术语弹窗无法显示内容，学习者点击后只能看到空白提示。',
    fix: (m) =>
      `在 course.json → terms 中添加：\n` +
      `  "${m[2]}": {\n` +
      `    "label": "中文名",\n` +
      `    "prompt": "我在学习 XXX 时遇到「${m[2]}」。请用概念 + 示例 + 易错点解释，140–200 字。"\n` +
      `  }`,
  },

  // ── 术语密度不足 ──
  {
    re: /^术语 \.term 仅 (\d+) 处（(.+?)章建议 ≥(\d+)，见.+）$/,
    problem: (m) => `术语链接仅 ${m[1]} 处 —— 密度不足`,
    importance: '术语链接稀疏意味着正文中术语首次出现时未标记，学习者无法弹出解释。',
    fix: (m) =>
      `在章节 HTML 中为关键术语的首次出现添加 <span class="term" data-term-id="xxx">术语名</span>。\n` +
      `  目标：${m[3]} 处以上（${m[2]}章标准）。如术语较少，可能章节内容偏短或领域覆盖不足。`,
  },
  {
    re: /^术语不同 data-term-id 仅 (\d+) 个（建议 ≥(\d+)）$/,
    problem: (m) => `仅覆盖 ${m[1]} 个不同术语 —— 种类不足`,
    importance: '术语种类少意味着章节涉及的概念面窄，可能缺少对核心概念的体系化标记。',
    fix: (m) =>
      `确保章节正文中标记了至少 ${m[2]} 个不同术语。回顾本章大纲，检查是否有重要概念未被标记。\n` +
      `  一个常见的遗漏场景：只标记了「名词」，忽略了「动词/方法/模式」。`,
  },

  // ── 教学法块缺失 ──
  { re: /^缺少 \.notice-why-learn（/, detail: true },
  {
    re: /^缺少 \.notice-why-learn/,
    problem: () => '缺少 .notice-why-learn 块',
    importance: '没有「为什么要学」的引导，学习者缺乏动机，容易跳过本章。',
    fix: () =>
      '在章节开头（chapter-meta 之后、第一个 section-block 之前）添加：\n' +
      '  <div class="notice notice-why-learn">\n' +
      '    <strong>为什么要学这一章</strong>\n' +
      '    <p>一段话：本章解决什么问题，在真实工作中何时遇到。</p>\n' +
      '  </div>',
  },
  {
    re: /^缺少 \.notice-outcome/,
    problem: () => '缺少 .notice-outcome 块',
    importance: '学习者不知道学完本章后能具体做到什么，缺乏验收标准。',
    fix: () =>
      '在 notice-why-learn 之后添加：\n' +
      '  <div class="notice notice-outcome">\n' +
      '    <strong>学完本章你能</strong>\n' +
      '    <ul>\n' +
      '      <li>用一句话描述一个可验收的能力</li>\n' +
      '      <li>…</li>\n' +
      '    </ul>\n' +
      '  </div>',
  },
  {
    re: /^缺少 \.chapter-conclusions-block/,
    problem: () => '缺少 .chapter-conclusions-block 结论块',
    importance: '没有结论的章节如同没有收尾的故事，学习者无法回顾本章核心要点。',
    fix: () =>
      '在章节末尾（resources 之前）添加：\n' +
      '  <div class="chapter-conclusions-block">\n' +
      '    <h3>本章结论</h3>\n' +
      '    <ul class="chapter-conclusions-list">\n' +
      '      <li>结论应与大纲各节一一对应</li>\n' +
      '    </ul>\n' +
      '  </div>',
  },

  // ── 测验相关 ──
  {
    re: /^章节测验题目不足（(\d+)，至少 (\d+)）$/,
    problem: (m) => `章节测验只有 ${m[1]} 题（至少 ${m[2]} 题）`,
    importance: '测验题量不足，无法有效检验本章学习效果。',
    fix: () =>
      '在 quiz.partial.html 的对应 quiz-section 中补充题目。建议覆盖三种题型：\n' +
      '  · 单选题（type="radio"）—— 知识记忆\n' +
      '  · 多选题（type="checkbox"）—— 辨析理解\n' +
      '  · 填空题（class="fill-input"）—— 应用能力',
  },
  {
    re: /^章节测验须含题型：(.+)$/,
    problem: (m) => `测验缺少题型：${m[1]}`,
    importance: '单一题型无法全面评估学习效果，选择题侧重「识别」而填空题侧重「回忆」。',
    fix: (m) =>
      `quiz.partial.html 中该章 quiz-section 需补充 ${m[1]} 题。\n` +
      '  参考 reference/quiz-authoring.md 了解如何编写高质量测验题。',
  },
  {
    re: /^缺少章节测验：quiz\.partial\.html 中无匹配的 quiz-section$/,
    problem: () => '缺少本章对应的测验区',
    importance: '无测验意味着无法评估本章学习效果，学习者也无法获得即时反馈。',
    fix: () =>
      '在 quiz.partial.html 中添加：\n' +
      '  <section class="quiz-section" data-chapter="章节id">\n' +
      '    <!-- 至少 4 道题，覆盖三种题型 -->\n' +
      '  </section>',
  },

  // ── 动手练习 ──
  {
    re: /^动手操作步骤 (\d+) 条（建议 ≥(\d+)，本章 (\d+) 节 ideal≈(\d+)）$/,
    problem: (m) => `动手操作步骤仅 ${m[1]} 条，建议 ≥${m[2]}（${m[3]} 节理想 ${m[4]} 条）`,
    importance: '步骤太少意味着动手练习过于简单或空洞，未覆盖足够多的正文知识点。',
    fix: (m) =>
      `在 .chapter-practice → ol.steps-operate 中补充步骤。每节至少对应 1 条可操作指令。\n` +
      `  好的步骤特征：命名要产出什么（文件/配置/表/图），而非「阅读 demos/」。`,
  },
  {
    re: /^动手区缺少判断练习/,
    problem: () => '动手练习区缺少判断练习（判断题）',
    importance: '没有判断题意味着学习者缺少「排错/权衡/对比」类型的练习，这是工程能力的核心。',
    fix: () =>
      '在 .chapter-practice 中添加：\n' +
      '  <h4 class="practice-section-title">判断练习</h4>\n' +
      '  <ol class="steps-judgment-list">\n' +
      '    <li>… <details class="learn-practice-answer">…</details></li>\n' +
      '  </ol>',
  },

  // ── 非法标签 ──
  {
    re: /^存在非法 HTML 标签/,
    problem: () => '章节 HTML 中含有非法标签（如 <motion> 等非标准标签）',
    importance: '非法标签会导致浏览器 DOM 解析异常，页面布局错乱甚至脚本崩溃。',
    fix: () =>
      '用标准 HTML 替换非法标签。如 <motion> 应换成带 CSS 动画的 <div>。\n' +
      '  node scripts/fix-invalid-html-tags.mjs --dir courses/<slug> 可尝试自动修复。',
  },

  // ── h5 误用 ──
  {
    re: /^存在 \.mermaid-wrap 外的 h5/,
    problem: () => '在 Mermaid 包裹块外使用了 h5 标签',
    importance: 'h5 在壳中保留给对比列表标题（.learn-compare-heading），误用会破坏页面信息层级。',
    fix: () =>
      '将正文中的 h5 替换为 h4 或 strong 标签。对比列请使用：\n' +
      '  <p class="learn-compare-heading">对比标题</p>',
  },

  // ── 大纲结构 ──
  {
    re: /^outline missing phaseId: (.+)$/,
    problem: (m) => `course.json → outline 缺少阶段：${m[1]}`,
    importance: '课程需覆盖「基础→实践→进阶」三阶段以形成完整学习路径。',
    fix: () =>
      '在 course.json → outline 数组中补全缺失的阶段。每个阶段结构：\n' +
      '  { "phaseId": "basics|practice|advanced", "phaseTitle": "阶段标题", "chapters": [...] }',
  },
  {
    re: /^duplicate chapter id: (.+)$/,
    problem: (m) => `章节 id 重复：${m[1]}`,
    importance: '重复的章节 id 会导致大纲渲染、导航链接、进度追踪全部混乱。',
    fix: (m) =>
      `在 course.json → outline 中修改所有重复出现的「${m[1]}」为唯一 id。\n` +
      '  命名建议：{阶段缩写}{序号}-{英文短名}，如 basics-01-intro',
  },
  {
    re: /^缺少与大纲对应的 h3：「(.+)」$/,
    problem: (m) => `章节缺少 h3 标题与大纲节对应：「${m[1]}」`,
    importance: '大纲定义了章节应有的节标题，但正文中找不到对应的 h3，会导致导航断链。',
    fix: (m) =>
      `在章节 HTML 中添加 <h3>${m[1]}</h3>（可在此标题下用 .section-block 包裹）。\n` +
      `  确保 h3 文本与 course.json → outline → sections 中的标题匹配。`,
  },

  // ── 编码问题 ──
  {
    re: /^(.+?) \| encoding: (.+)$/,
    problem: (m) => `${m[1]} 编码异常：${m[2]}`,
    importance: '编码损坏会导致中文字符在浏览器中显示为乱码，严重影响学习体验。',
    fix: (m) =>
      `node scripts/fix-encoding.mjs --dir courses/<slug> 可自动修复 UTF-8 编码和 BOM。\n` +
      `  若仍有问题，请用 VS Code 以 UTF-8（无 BOM）重新保存 ${m[1]}。`,
  },

  // ── shell 相关 ──
  {
    re: /^shellVersion is (.+), expected (.+)/,
    problem: (m) => `壳版本不匹配：当前 ${m[1]}，期望 ${m[2]}`,
    importance: '壳版本不一致可能导致模板注入逻辑与预期不符，UI 出现异常。',
    fix: () =>
      '重新运行 node scripts/assemble-index.mjs --dir courses/<slug> 触发最新壳版本组装。',
  },
  {
    re: /^index\.html still contains THEME_KEYWORDS/,
    problem: () => 'index.html 中残留过时的 THEME_KEYWORDS 占位符',
    importance: '旧壳版本的残留占位符会导致页面显示原始模板变量而非实际内容。',
    fix: () =>
      '重新组装：node scripts/assemble-index.mjs --dir courses/<slug>',
  },
  {
    re: /^embedded course-data JSON invalid$/,
    problem: () => 'index.html 中内嵌的课程数据 JSON 损坏',
    importance: '前端 JS 依赖 course-data 初始化导航和进度，损坏则整个页面交互失效。',
    fix: () =>
      '检查 course.json 是否为合法 JSON（可用 JSONLint 验证），然后重新运行 assemble。',
  },

  // ── 综合质量 ──
  {
    re: /^动手步骤仅 (\d+) 条（建议 ≥(\d+)）$/,
    problem: (m) => `动手步骤仅 ${m[1]} 条，建议 ≥${m[2]}`,
    importance: '步骤太少意味着学习者的实践机会不足，理论与实践脱节。',
    fix: () =>
      '扩展 .chapter-practice → ol.steps 中的步骤。每条步骤应包含：\n' +
      '  1. 明确的操作指令（不依赖外部上下文即可执行）\n' +
      '  2. 期望的产出（文件/配置/输出）',
  },

  // ── 测验元数据 ──
  {
    re: /^course\.json\.quizzes 缺少该章元数据$/,
    problem: () => 'course.json → quizzes 中缺少该章的测验元数据',
    importance: '前端无法正确关联测验题与章节，测验面板将无法显示。',
    fix: () =>
      '在 course.json 中添加：\n' +
      '  "quizzes": {\n' +
      '    "章节id-quiz": { "chapterId": "章节id", "title": "测验名称" }\n' +
      '  }',
  },

  // ── 编码索引同步 ──
  {
    re: /^(.+) index<->chapter sync: (.+)$/,
    problem: (m) => `${m[1]} index.html 与源文件不一致：${m[2]}`,
    importance: '组装后的 index.html 内容与源 chapters/*.html 不同步，可能是忘记重新组装。',
    fix: () =>
      '重新运行 node scripts/assemble-index.mjs --dir courses/<slug> 同步源文件到 index.html。\n' +
      '  若仍有问题，运行 fix-encoding.mjs 修复编码后再组装。',
  },

  // ── demo-box ──
  {
    re: /demo-box 内建议使用 h4\.demo-box-title/,
    problem: () => 'demo-box 内使用了 h3 而非 h4.demo-box-title',
    importance: 'h3 是章节主节标题层级；demo-box 内用 h3 会打乱大纲导航的层级结构。',
    fix: () =>
      '将 demo-box 内的 <h3> 改为 <h4 class="demo-box-title">。例如：\n' +
      '  <h4 class="demo-box-title">预期效果</h4>',
  },

  // ── 动手练习与大纲关联 ──
  {
    re: /^动手练习与大纲节关联偏弱（约 (\d+)\/(\d+) 节）/,
    problem: (m) => `动手练习仅覆盖 ${m[1]}/${m[2]} 节正文内容`,
    importance: '动手练习若与正文脱节，学习者无法将理论转化为实践，练习变成独立任务而非巩固手段。',
    fix: () =>
      '在 .steps-intro 或操作步骤中明确点名正文中的 h3 标题、表格编号或配置文件名。\n' +
      '  例如：「打开刚才在『3.2 一致性模型』一节中分析的 tradeoffs 表……」',
  },
];

/**
 * @param {string} raw 原始错误消息
 * @param {string} label 上下文标签（如文件路径）
 * @returns {{ label: string, problem: string, importance: string, fix: string }}
 */
export function friendlyError(raw, label) {
  for (const rule of RULES) {
    const m = raw.match(rule.re);
    if (m) {
      return {
        label: label || '',
        problem: typeof rule.problem === 'function' ? rule.problem(m) : raw,
        importance:
          typeof rule.importance === 'function' ? rule.importance(m) : rule.importance,
        fix: typeof rule.fix === 'function' ? rule.fix(m) : '',
      };
    }
  }
  // 未匹配：保留原文，给出通用说明
  return {
    label: label || '',
    problem: raw,
    importance: '此问题可能导致构建失败或页面异常。',
    fix: '请根据错误描述手动排查。若常见模式未被覆盖，可在 scripts/lib/error-help.mjs 中添加新的匹配规则。',
  };
}

/**
 * 将友好化错误组输出到终端。
 * @param {{ label: string, problem: string, importance: string, fix: string }[]} errors
 * @param {{ label: string, problem: string, importance: string, fix: string }[]} warnings
 * @param {object} [opts]
 * @param {boolean} [opts.compact] 紧凑模式——不显示修复建议
 */
export function printFriendlyErrors(errors, warnings, opts = {}) {
  if (warnings.length) {
    console.log('\n⚠ 建议修复 (Warnings)\n' + '─'.repeat(60));
    for (const w of warnings) {
      const prefix = w.label ? `[${w.label}] ` : '';
      console.log(`  ${prefix}${w.problem}`);
      if (!opts.compact) {
        console.log(`    原因：${w.importance}`);
        if (w.fix) console.log(`    修复：${w.fix.replace(/\n/g, '\n          ')}`);
      }
      console.log();
    }
  }

  if (errors.length) {
    console.log('\n✗ 必须修复 (Errors)\n' + '─'.repeat(60));
    for (const e of errors) {
      const prefix = e.label ? `[${e.label}] ` : '';
      console.log(`  ${prefix}${e.problem}`);
      if (!opts.compact) {
        console.log(`    原因：${e.importance}`);
        if (e.fix) console.log(`    修复：${e.fix.replace(/\n/g, '\n          ')}`);
      }
      console.log();
    }
  }
}
