import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkChapterHtml, getRequiredBlocks, BLOCK_SELECTORS } from '../chapter-blocks.mjs';

describe('BLOCK_SELECTORS', () => {
  it('has expected block types', () => {
    const keys = Object.keys(BLOCK_SELECTORS);
    assert.ok(keys.includes('concept'));
    assert.ok(keys.includes('official-links'));
    assert.ok(keys.includes('code-block'));
    assert.ok(keys.includes('steps'));
    assert.ok(keys.includes('resources'));
  });
});

describe('checkChapterHtml', () => {
  const requiredBlocks = ['concept', 'official-links', 'code-block', 'steps'];

  it('returns empty array when all blocks present', () => {
    const html = '<div class="concept">x</div><div class="official-links">x</div><div class="code-block">x</div><ol class="steps">x</ol>';
    assert.deepStrictEqual(checkChapterHtml(html, requiredBlocks), []);
  });

  it('returns missing blocks', () => {
    const html = '<div class="concept">x</div><div class="code-block">x</div>';
    const missing = checkChapterHtml(html, requiredBlocks);
    assert.ok(missing.includes('official-links'));
    assert.ok(missing.includes('steps'));
    assert.strictEqual(missing.length, 2);
  });

  it('skips unknown block types', () => {
    const html = '<div class="concept">x</div>';
    assert.deepStrictEqual(checkChapterHtml(html, ['concept', 'unknown-block']), []);
  });
});

describe('getRequiredBlocks', () => {
  const defaults = {
    chapterBlocks: ['concept', 'official-links', 'code-block', 'mermaid-wrap', 'steps', 'demo-box'],
    chapterBlocksOptionalByDomainType: {
      backend: ['mermaid-wrap', 'demo-box'],
    },
  };

  it('returns all blocks when no domain override', () => {
    const result = getRequiredBlocks(defaults, undefined);
    assert.strictEqual(result.length, 6);
  });

  it('excludes optional blocks for matching domain type', () => {
    const result = getRequiredBlocks(defaults, 'backend');
    assert.ok(!result.includes('mermaid-wrap'));
    assert.ok(!result.includes('demo-box'));
    assert.ok(result.includes('concept'));
    assert.ok(result.includes('official-links'));
  });
});
