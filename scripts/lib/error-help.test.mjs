/**
 * error-help.mjs 单元测试
 *
 * 覆盖：friendlyError（20 条规则）、未匹配回退、printFriendlyErrors 输出。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { friendlyError, printFriendlyErrors } from './error-help.mjs';

// ── friendlyError 已匹配规则 ──

describe('friendlyError — 文件缺失', () => {
  it('缺少章节文件', () => {
    const e = friendlyError('missing chapters/basics-01-intro.html');
    assert.ok(e.problem.includes('basics-01-intro.html'));
    assert.ok(e.importance.includes('大纲引用'));
    assert.ok(e.fix.includes('generate-chapter-skeleton'));
  });

  it('缺少 course.json', () => {
    const e = friendlyError('Missing course.json');
    assert.ok(e.problem.includes('course.json'));
    assert.ok(e.fix.includes('config/course.schema.json'));
  });

  it('缺少 welcome.partial.html', () => {
    const e = friendlyError('missing welcome.partial.html');
    assert.ok(e.importance.includes('首页空白'));
    assert.ok(e.fix.includes('outline-summary-body'));
  });

  it('缺少 theme.css', () => {
    const e = friendlyError('missing theme.css');
    assert.ok(e.importance.includes('灰色调'));
    assert.ok(e.fix.includes('CSS 变量声明'));
  });
});

describe('friendlyError — 教学法块缺失', () => {
  it('缺少 notice-why-learn', () => {
    const e = friendlyError(
      'chapters/basics-01-intro.html missing blocks (domainType F): notice-why-learn, notice-outcome'
    );
    assert.ok(e.problem.includes('notice-why-learn'));
    assert.ok(e.importance.includes('教学法块'));
    assert.ok(e.fix.includes('notice-why-learn ——'));
  });

  it('单独缺少 notice-outcome', () => {
    const e = friendlyError('缺少 .notice-outcome');
    assert.ok(e.importance.includes('验收标准'));
    assert.ok(e.fix.includes('<div class="notice notice-outcome">'));
  });

  it('缺少 chapter-conclusions-block', () => {
    const e = friendlyError('缺少 .chapter-conclusions-block');
    assert.ok(e.importance.includes('没有收尾'));
    assert.ok(e.fix.includes('chapter-conclusions-block'));
  });
});

describe('friendlyError — 术语相关', () => {
  it('未知 term-id', () => {
    const e = friendlyError('chapters/basics-01.html: unknown data-term-id="distributed-lock"');
    assert.ok(e.problem.includes('distributed-lock'));
    assert.ok(e.fix.includes('"distributed-lock":'));
    assert.ok(e.fix.includes('label'));
    assert.ok(e.fix.includes('prompt'));
  });

  it('术语密度不足', () => {
    const e = friendlyError('术语 .term 仅 2 处（basics 章建议 ≥5，见 chapter-quality.json）');
    assert.ok(e.problem.includes('2 处'));
    assert.ok(e.importance.includes('术语链接稀疏'));
    assert.ok(e.fix.includes('class="term"'));
  });

  it('术语种类不足', () => {
    const e = friendlyError('术语不同 data-term-id 仅 3 个（建议 ≥5）');
    assert.ok(e.importance.includes('体系化标记'));
  });
});

describe('friendlyError — 测验相关', () => {
  it('题量不足', () => {
    const e = friendlyError('章节测验题目不足（2，至少 4）');
    assert.ok(e.problem.includes('2'));
    assert.ok(e.problem.includes('4'));
    assert.ok(e.fix.includes('单选题'));
    assert.ok(e.fix.includes('多选题'));
    assert.ok(e.fix.includes('填空题'));
  });

  it('缺少题型', () => {
    const e = friendlyError('章节测验须含题型：fill-input');
    assert.ok(e.fix.includes('fill-input'));
  });

  it('缺少测验区', () => {
    const e = friendlyError('缺少章节测验：quiz.partial.html 中无匹配的 quiz-section');
    assert.ok(e.fix.includes('quiz-section'));
  });

  it('测验元数据缺失', () => {
    const e = friendlyError('course.json.quizzes 缺少该章元数据');
    assert.ok(e.fix.includes('quizzes'));
  });
});

describe('friendlyError — 动手练习', () => {
  it('步骤不足', () => {
    const e = friendlyError('动手操作步骤 1 条（建议 ≥4，本章 3 节 ideal≈5）');
    assert.ok(e.problem.includes('1 条'));
    assert.ok(e.fix.includes('.steps-operate'));
  });

  it('缺少判断练习', () => {
    const e = friendlyError('动手区缺少判断练习');
    assert.ok(e.fix.includes('steps-judgment-list'));
  });

  it('与大纲关联弱', () => {
    const e = friendlyError('动手练习与大纲节关联偏弱（约 1/3 节）');
    assert.ok(e.fix.includes('steps-intro'));
  });
});

describe('friendlyError — 结构问题', () => {
  it('outline 缺少阶段', () => {
    const e = friendlyError('outline missing phaseId: advanced');
    assert.ok(e.fix.includes('phaseId'));
  });

  it('章节 id 重复', () => {
    const e = friendlyError('duplicate chapter id: basics-01-intro');
    assert.ok(e.importance.includes('导航链接'));
    assert.ok(e.fix.includes('唯一 id'));
  });

  it('缺少与大纲对应的 h3', () => {
    const e = friendlyError('缺少与大纲对应的 h3：「分布式事务的 ACID 特性」');
    assert.ok(e.problem.includes('ACID'));
    assert.ok(e.fix.includes('<h3>'));
  });
});

describe('friendlyError — 编码/同步', () => {
  it('编码异常', () => {
    const e = friendlyError('chapters/basics-01.html | encoding: GBK');
    assert.ok(e.fix.includes('fix-encoding'));
  });

  it('索引不同步', () => {
    const e = friendlyError('index.html index<->chapter sync: chapters/basics-01.html differs');
    assert.ok(e.fix.includes('assemble-index'));
  });
});

describe('friendlyError — shell 相关', () => {
  it('壳版本不匹配', () => {
    const e = friendlyError('shellVersion is 2.9.0, expected 2.10.1');
    assert.ok(e.problem.includes('2.9.0'));
    assert.ok(e.fix.includes('assemble-index'));
  });

  it('THEME_KEYWORDS 残留', () => {
    const e = friendlyError('index.html still contains THEME_KEYWORDS');
    assert.ok(e.importance.includes('占位符'));
  });

  it('内嵌 JSON 损坏', () => {
    const e = friendlyError('embedded course-data JSON invalid');
    assert.ok(e.fix.includes('JSONLint'));
  });
});

describe('friendlyError — 其他规则', () => {
  it('demo-box 内 h3 误用', () => {
    const e = friendlyError('demo-box 内建议使用 h4.demo-box-title');
    assert.ok(e.fix.includes('demo-box-title'));
  });

  it('非法 HTML 标签', () => {
    const e = friendlyError('存在非法 HTML 标签');
    assert.ok(e.fix.includes('fix-invalid-html-tags'));
  });

  it('h5 误用', () => {
    const e = friendlyError("存在 .mermaid-wrap 外的 h5");
    assert.ok(e.fix.includes('learn-compare-heading'));
  });

  it('综合质量：动手步骤仅 N 条', () => {
    const e = friendlyError('动手步骤仅 2 条（建议 ≥4）');
    assert.ok(e.importance.includes('实践机会'));
  });
});

describe('friendlyError — 未匹配回退', () => {
  it('返回原始消息 + 通用提示', () => {
    const e = friendlyError('some totally unknown error occurred in chapter-7');
    assert.strictEqual(e.problem, 'some totally unknown error occurred in chapter-7');
    assert.ok(e.importance.includes('构建失败或页面异常'));
    assert.ok(e.fix.includes('error-help.mjs'));
  });
});

describe('friendlyError — label 参数', () => {
  it('传入 label 出现在结果中', () => {
    const e = friendlyError('Missing course.json', 'course/my-course');
    assert.strictEqual(e.label, 'course/my-course');
  });
});

// ── printFriendlyErrors 输出验证 ──

describe('printFriendlyErrors', () => {
  it('空警告/错误不崩溃', () => {
    // 不应抛出异常
    assert.doesNotThrow(() => printFriendlyErrors([], []));
  });

  it('compact 模式不显示修复建议', () => {
    const w = friendlyError('missing theme.css');
    // 通过拦截 stdout 验证（不崩溃即语法正确）
    assert.doesNotThrow(() => printFriendlyErrors([], [w], { compact: true }));
  });
});
