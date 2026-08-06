import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  extractChapterPractice,
  extractOperateStepsOl,
  extractJudgmentListOl,
  countPracticeSteps,
  countJudgmentSteps,
  countJudgmentAnswers,
  suggestStepCounts,
} from '../practice-quality.mjs';

describe('extractChapterPractice', () => {
  it('extracts practice div content', () => {
    const html = '<div class="chapter-practice"><p>练习内容</p></div><div class="resources">资源</div>';
    const result = extractChapterPractice(html);
    assert.ok(result.includes('练习内容'));
    assert.ok(!result.includes('资源'));
  });

  it('returns empty string when no practice div', () => {
    assert.strictEqual(extractChapterPractice('<p>no practice</p>'), '');
  });
});

describe('extractOperateStepsOl', () => {
  it('matches steps-operate first', () => {
    const html = '<ol class="steps steps-operate"><li>Step 1</li><li>Step 2</li></ol>';
    const m = extractOperateStepsOl(html);
    assert.ok(m);
    assert.ok(m[1].includes('Step 1'));
    assert.ok(m[1].includes('Step 2'));
  });

  it('falls back to plain steps', () => {
    const html = '<ol class="steps"><li>Step 1</li><li>Step 2</li></ol>';
    const m = extractOperateStepsOl(html);
    assert.ok(m);
    assert.strictEqual((m[1].match(/<li\b/gi) || []).length, 2);
  });

  it('returns null when no steps ol', () => {
    assert.strictEqual(extractOperateStepsOl('<p>none</p>'), null);
  });
});

describe('extractJudgmentListOl', () => {
  it('matches steps-judgment-list first', () => {
    const html = '<ol class="steps-judgment-list"><li>Judge 1</li><li>Judge 2</li></ol>';
    const m = extractJudgmentListOl(html);
    assert.ok(m);
    assert.strictEqual((m[1].match(/<li\b/gi) || []).length, 2);
  });

  it('falls back to steps steps-judgment', () => {
    const html = '<ol class="steps steps-judgment"><li>Judge 1</li><li>Judge 2</li></ol>';
    const m = extractJudgmentListOl(html);
    assert.ok(m);
    assert.strictEqual((m[1].match(/<li\b/gi) || []).length, 2);
  });

  it('returns null when no judgment list', () => {
    assert.strictEqual(extractJudgmentListOl('<p>none</p>'), null);
  });
});

describe('countPracticeSteps', () => {
  it('counts li in operate steps ol', () => {
    const html = '<ol class="steps steps-operate"><li>1</li><li>2</li><li>3</li></ol>';
    assert.strictEqual(countPracticeSteps(html), 3);
  });

  it('returns 0 when no steps', () => {
    assert.strictEqual(countPracticeSteps('<p>none</p>'), 0);
  });
});

describe('countJudgmentSteps', () => {
  it('counts li in judgment list', () => {
    const html = '<ol class="steps-judgment-list"><li>Q1</li><li>Q2</li></ol>';
    assert.strictEqual(countJudgmentSteps(html), 2);
  });

  it('returns 0 when no judgment list', () => {
    assert.strictEqual(countJudgmentSteps('<p>none</p>'), 0);
  });
});

describe('countJudgmentAnswers', () => {
  it('counts answers with details and sufficient body text', () => {
    const html = `<ol class="steps-judgment-list">
      <li>Q1<div class="learn-practice-answer"><details><div class="learn-practice-answer-body">这是参考答案内容A</div></details></div></li>
      <li>Q2<div class="learn-practice-answer"><details><div class="learn-practice-answer-body">简短</div></details></div></li>
    </ol>`;
    const result = countJudgmentAnswers(html, 8);
    assert.strictEqual(result.total, 2);
    assert.strictEqual(result.withAnswer, 1); // only Q1 body >= 8 chars
  });

  it('returns zeros for no judgment list', () => {
    const result = countJudgmentAnswers('<p>none</p>');
    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.withAnswer, 0);
  });
});

describe('suggestStepCounts', () => {
  it('suggests step counts proportional to section count', () => {
    const outline = { sections: [{ title: 'a' }, { title: 'b' }, { title: 'c' }, { title: 'd' }] };
    const result = suggestStepCounts(outline, 'basics');
    assert.strictEqual(result.sectionCount, 4);
    assert.strictEqual(result.ideal, 3); // ceil(4*0.5) = 2, but clamped to min 3
    assert.strictEqual(result.min, 3);
    assert.strictEqual(result.max, 8);
    assert.strictEqual(result.judgmentIdeal, 1);
  });

  it('suggests more judgment items for many sections', () => {
    const outline = { sections: Array.from({ length: 6 }, () => ({})) };
    const result = suggestStepCounts(outline, 'basics');
    assert.strictEqual(result.judgmentIdeal, 2);
  });

  it('uses practice phase ratio', () => {
    const outline = { sections: [{ title: 'a' }, { title: 'b' }, { title: 'c' }, { title: 'd' }, { title: 'e' }] };
    const result = suggestStepCounts(outline, 'practice');
    // 5 * 0.6 = 3 → clamped to min 3 → ideal=3
    assert.strictEqual(result.ideal, 3);
  });
});
