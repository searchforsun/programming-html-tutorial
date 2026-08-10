/**
 * chapter-blocks.mjs 单元测试（Node 内置 node:test）
 * 运行: node --test scripts/lib/chapter-blocks.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  BLOCK_SELECTORS,
  getRequiredBlocks,
  checkChapterHtml,
} from './chapter-blocks.mjs';

describe('BLOCK_SELECTORS', () => {
  it('所有七种必填块均有选择器映射', () => {
    const keys = ['concept', 'official-links', 'code-block', 'mermaid-wrap', 'steps', 'demo-box', 'resources'];
    for (const k of keys) {
      assert.ok(k in BLOCK_SELECTORS, `缺少 ${k}`);
      assert.equal(typeof BLOCK_SELECTORS[k], 'string');
      assert.ok(BLOCK_SELECTORS[k].startsWith('.'), `${k} 应是类选择器`);
    }
  });

  it('选择器值唯一不冲突', () => {
    const vals = Object.values(BLOCK_SELECTORS);
    assert.equal(new Set(vals).size, vals.length);
  });
});

describe('getRequiredBlocks', () => {
  const defaults = {
    chapterBlocks: ['concept', 'official-links', 'code-block', 'mermaid-wrap', 'steps', 'demo-box', 'resources'],
    chapterBlocksOptionalByDomainType: {
      E: ['mermaid-wrap', 'demo-box'],
      F: ['demo-box'],
    },
  };

  it('E 类领域可选 mermaid-wrap 和 demo-box', () => {
    const required = getRequiredBlocks(defaults, 'E');
    assert.ok(!required.includes('mermaid-wrap'));
    assert.ok(!required.includes('demo-box'));
    assert.ok(required.includes('concept'));
    assert.ok(required.includes('steps'));
    assert.equal(required.length, 5);
  });

  it('F 类领域可选 demo-box', () => {
    const required = getRequiredBlocks(defaults, 'F');
    assert.ok(!required.includes('demo-box'));
    assert.ok(required.includes('mermaid-wrap'));
    assert.equal(required.length, 6);
  });

  it('未配置领域类型返回全部必填块', () => {
    const required = getRequiredBlocks(defaults, 'A');
    assert.equal(required.length, 7);
  });

  it('空 chapterBlocks 返回空数组', () => {
    const required = getRequiredBlocks({ chapterBlocks: [] }, 'A');
    assert.deepEqual(required, []);
  });

  it('无 chapterBlocksOptionalByDomainType 返回全部', () => {
    const required = getRequiredBlocks({ chapterBlocks: ['concept', 'steps'] }, 'A');
    assert.deepEqual(required, ['concept', 'steps']);
  });
});

describe('checkChapterHtml', () => {
  it('检测缺失的必填块', () => {
    const html = '<div class="concept"><p>内容</p></div>';
    const missing = checkChapterHtml(html, ['concept', 'steps', 'resources']);
    assert.deepEqual(missing, ['steps', 'resources']);
  });

  it('所有块都存在时返回空数组', () => {
    const html = '<div class="concept"></div><div class="steps"></div>';
    const missing = checkChapterHtml(html, ['concept', 'steps']);
    assert.deepEqual(missing, []);
  });

  it('空 HTML 返回全部缺失', () => {
    const missing = checkChapterHtml('', ['concept', 'steps']);
    assert.equal(missing.length, 2);
  });

  it('不检查不在 BLOCK_SELECTORS 中的块', () => {
    const missing = checkChapterHtml('<div></div>', ['unknown-block']);
    assert.deepEqual(missing, []);
  });
});
