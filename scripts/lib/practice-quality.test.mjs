/**
 * practice-quality.mjs 单元测试（Node 内置 node:test）
 * 运行: node --test scripts/lib/practice-quality.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  extractChapterPractice,
  extractOperateStepsOl,
  extractJudgmentListOl,
  countPracticeSteps,
  countJudgmentSteps,
  countJudgmentAnswers,
  suggestStepCounts,
  reviewChapterPractice,
} from './practice-quality.mjs';

// ─── 辅助：构建标准动手练习 HTML ──────────────────────
function makeChapterPractice({
  intro = '完成以下操作，产出配置文件与 curl 验证结果。',
  steps = ['配置 application-local.yml 端口', '启动 order-service', 'curl health 验证 UP'],
  judgments = [
    { stem: '端口写死在 Java 代码中，应如何改？', answer: '移到 application-local.yml 外部化。' },
  ],
  demo = { title: '测试 Demo', accept: 'curl 返回 UP' },
} = {}) {
  const stepsHtml = steps.map((s) => `      <li>${s}</li>`).join('\n');
  const judgmentsHtml = judgments.map((j) => `    <li>
      <p class="judgment-stem">${j.stem}</p>
      <div class="learn-practice-answer">
        <details>
          <summary>参考答案</summary>
          <div class="learn-practice-answer-body"><p>${j.answer}</p></div>
        </details>
      </div>
    </li>`).join('\n');
  const demoHtml = demo
    ? `    <div class="demo-box">
      <h4 class="demo-box-title">${demo.title}</h4>
      <p><strong>验收</strong>：${demo.accept}</p>
    </div>`
    : '';

  return `<div class="chapter-practice">
    <h3>动手练习</h3>
    <p class="steps-intro">${intro}</p>
    <h4 class="practice-section-title">操作步骤</h4>
    <ol class="steps steps-operate">
${stepsHtml}
    </ol>
    <h4 class="practice-section-title">判断练习</h4>
    <ol class="steps-judgment-list">
${judgmentsHtml}
    </ol>
${demoHtml}
  </div>`;
}

describe('extractChapterPractice', () => {
  it('提取 chapter-practice 区内容', () => {
    const html = '<div>A</div><div class="chapter-practice"><h3>动手</h3></div><div class="resources">R</div>';
    const result = extractChapterPractice(html);
    assert.ok(result.includes('动手'));
    assert.ok(!result.includes('resources'));
  });

  it('无 chapter-practice 返回空字符串', () => {
    assert.equal(extractChapterPractice('<div>no</div>'), '');
  });
});

describe('extractOperateStepsOl', () => {
  it('提取 steps-operate', () => {
    const html = makeChapterPractice({ steps: ['步骤1', '步骤2'] });
    const m = extractOperateStepsOl(html);
    assert.ok(m !== null);
    assert.ok(m[1].includes('步骤1'));
    assert.ok(m[1].includes('步骤2'));
  });

  it('兼容旧版 ol.steps（无 steps-operate 后缀）', () => {
    const html = '<ol class="steps"><li>A</li><li>B</li></ol>';
    const m = extractOperateStepsOl(html);
    assert.ok(m !== null);
    assert.equal((m[1].match(/<li>/g) || []).length, 2);
  });

  it('无操作步骤返回 null', () => {
    assert.equal(extractOperateStepsOl('<div>no steps</div>'), null);
  });
});

describe('extractJudgmentListOl', () => {
  it('提取 steps-judgment-list', () => {
    const html = makeChapterPractice({ judgments: [{ stem: 'Q?', answer: 'A.' }] });
    const m = extractJudgmentListOl(html);
    assert.ok(m !== null);
    assert.ok(m[1].includes('judgment-stem'));
  });

  it('兼容旧版 steps-judgment', () => {
    const html = '<ol class="steps steps-judgment"><li>J1</li></ol>';
    const m = extractJudgmentListOl(html);
    assert.ok(m !== null);
  });
});

describe('countPracticeSteps / countJudgmentSteps', () => {
  it('统计操作步骤数', () => {
    const html = makeChapterPractice({ steps: ['A', 'B', 'C', 'D'] });
    assert.equal(countPracticeSteps(html), 4);
  });

  it('统计判断题数', () => {
    const html = makeChapterPractice({
      judgments: [
        { stem: 'Q1', answer: 'A1' },
        { stem: 'Q2', answer: 'A2' },
        { stem: 'Q3', answer: 'A3' },
      ],
    });
    assert.equal(countJudgmentSteps(html), 3);
  });

  it('无动手区返回 0', () => {
    assert.equal(countPracticeSteps('<div></div>'), 0);
    assert.equal(countJudgmentSteps('<div></div>'), 0);
  });
});

describe('countJudgmentAnswers', () => {
  it('统计含折叠参考答案的题数', () => {
    const html = makeChapterPractice({
      judgments: [
        { stem: 'Q1', answer: '足够长的参考答案正文内容' },
        { stem: 'Q2', answer: '短' },
      ],
    });
    const result = countJudgmentAnswers(html, 8);
    assert.equal(result.total, 2);
    assert.equal(result.withAnswer, 1); // 第二题答案仅 1 字 < 8
  });

  it('全部有答案时 withAnswer == total', () => {
    const html = makeChapterPractice({
      judgments: [{ stem: 'Q', answer: '完整参考答案正文' }],
    });
    const result = countJudgmentAnswers(html, 8);
    assert.equal(result.total, 1);
    assert.equal(result.withAnswer, 1);
  });
});

describe('suggestStepCounts', () => {
  const config = {
    practice: {
      minSteps: 3,
      maxSteps: 8,
      stepsPerSectionRatio: 0.5,
      stepsPerSectionRatioPractice: 0.6,
    },
  };

  it('5 节理论章建议 3 步', () => {
    const result = suggestStepCounts({ sections: Array(5) }, 'basics', config);
    assert.equal(result.ideal, 3); // ceil(5*0.5)=3
    assert.equal(result.min, 3);
    assert.equal(result.max, 8);
  });

  it('5 节实践章建议 3 步', () => {
    const result = suggestStepCounts({ sections: Array(5) }, 'practice', config);
    assert.equal(result.ideal, 3); // ceil(5*0.6)=3
  });

  it('2 节章 ideal 不低于 min', () => {
    const result = suggestStepCounts({ sections: Array(2) }, 'basics', config);
    assert.equal(result.ideal, 3); // ceil(2*0.5)=1 → clamped to min 3
  });

  it('20 节章 ideal 不超 max', () => {
    const result = suggestStepCounts({ sections: Array(20) }, 'basics', config);
    assert.equal(result.ideal, 8); // ceil(20*0.5)=10 → clamped to max 8
  });

  it('≥5 节建议 2 道判断题', () => {
    const result = suggestStepCounts({ sections: Array(5) }, 'basics', config);
    assert.equal(result.judgmentIdeal, 2);
  });

  it('<5 节建议 1 道判断题', () => {
    const result = suggestStepCounts({ sections: Array(4) }, 'basics', config);
    assert.equal(result.judgmentIdeal, 1);
  });
});

describe('reviewChapterPractice', () => {
  const outlineChapter = {
    sections: ['环境准备', '项目初始化', '配置外部化', '启动验证', '健康检查'],
  };

  it('合格练习返回空 errors', () => {
    const html = makeChapterPractice({
      intro: '完成 ShopFlow order-service 启动与配置验证',
      steps: ['配置 application-local.yml', '启动 order-service', 'curl /actuator/health 验证 UP'],
      judgments: [{ stem: '端口写死在代码里对吗？', answer: '不对，应外部化到 application-local.yml。' }],
      demo: { title: '脚手架起步', accept: 'curl 返回 UP' },
    });
    const chapterHtml = `<section id="ch-test" class="chapter">...${html}<div class="resources"></div></section>`;
    const result = reviewChapterPractice({
      html: chapterHtml,
      outlineChapter,
      phaseId: 'practice',
      config: {
        practice: { minIntroChars: 10, minSteps: 3, maxSteps: 8, stepsPerSectionRatioPractice: 0.6, minJudgmentAnswerChars: 8 },
      },
    });
    assert.deepEqual(result.errors, []);
  });

  it('检测 steps-intro 过短', () => {
    const html = makeChapterPractice({ intro: '短' });
    // extractChapterPractice 要求 practice 后紧跟 resources 或字符串结束
    const chapterHtml = `${html}<div class="resources"></div>`;
    const result = reviewChapterPractice({
      html: chapterHtml,
      outlineChapter,
      phaseId: 'basics',
      config: { practice: { minIntroChars: 18 } },
    });
    const hasShortWarning = result.warnings.some((w) => w.includes('过短'));
    assert.ok(hasShortWarning);
  });

  it('检测缺少判断练习', () => {
    const html = '<div class="chapter-practice"><h3>动手</h3><ol class="steps steps-operate"><li>A</li></ol></div>';
    const result = reviewChapterPractice({
      html,
      outlineChapter,
      phaseId: 'basics',
      config: { practice: { minSteps: 3 } },
    });
    const hasMissingJudgment = result.warnings.some((w) => w.includes('缺少判断练习'));
    assert.ok(hasMissingJudgment);
  });

  it('无 chapter-practice 时返回空结果', () => {
    const result = reviewChapterPractice({
      html: '<div>no practice</div>',
      outlineChapter,
      phaseId: 'basics',
      config: {},
    });
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.warnings, []);
    assert.deepEqual(result.suggestions, []);
  });

  it('检测 demo-box 缺少验收标准', () => {
    const html = `<div class="chapter-practice">
      <p class="steps-intro">完成以下操作</p>
      <ol class="steps steps-operate"><li>A</li><li>B</li><li>C</li></ol>
      <ol class="steps-judgment-list"><li><p class="judgment-stem">Q</p><div class="learn-practice-answer"><details><summary>答</summary><div class="learn-practice-answer-body"><p>参考答案文本</p></div></details></div></li></ol>
      <div class="demo-box"><h4>Demo</h4><p>目录：demos/test-lab/</p></div>
    </div>`;
    const result = reviewChapterPractice({
      html,
      outlineChapter,
      phaseId: 'basics',
      config: { practice: { minIntroChars: 5, minJudgmentAnswerChars: 4 } },
    });
    const hasDemoWarning = result.warnings.some((w) => w.includes('demo-box') && w.includes('验收'));
    assert.ok(hasDemoWarning);
  });
});
