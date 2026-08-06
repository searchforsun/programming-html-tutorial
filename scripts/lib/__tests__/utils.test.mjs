import { describe, it } from 'node:test';
import assert from 'node:assert';
import { stripHtml, fuzzyTitleMatch, fixMotionTags, INVALID_TAG_RE } from '../utils.mjs';

describe('stripHtml', () => {
  it('removes script tags and their content', () => {
    const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>';
    const result = stripHtml(input);
    assert.ok(!result.includes('script'));
    assert.ok(!result.includes('alert'));
  });

  it('removes style tags and their content', () => {
    const input = '<style>.foo{color:red}</style><p>text</p>';
    const result = stripHtml(input);
    assert.ok(!result.includes('style'));
    assert.ok(!result.includes('.foo'));
    assert.ok(result.includes('text'));
  });

  it('removes all HTML tags', () => {
    const input = '<div class="x"><h3>标题</h3><p>段落</p></div>';
    const result = stripHtml(input);
    assert.ok(!result.includes('<'));
    assert.ok(!result.includes('>'));
    assert.ok(result.includes('标题'));
    assert.ok(result.includes('段落'));
  });

  it('compresses whitespace', () => {
    const input = '  hello   world  ';
    assert.strictEqual(stripHtml(input), 'helloworld');
  });

  it('preserves Chinese characters', () => {
    const input = '<p>你好世界</p>';
    assert.strictEqual(stripHtml(input), '你好世界');
  });

  it('handles empty string', () => {
    assert.strictEqual(stripHtml(''), '');
  });
});

describe('fuzzyTitleMatch', () => {
  it('returns true for exact match', () => {
    assert.ok(fuzzyTitleMatch('<h3>环境准备</h3>', '环境准备'));
  });

  it('returns true when a includes b', () => {
    assert.ok(fuzzyTitleMatch('<h3>Spring Boot 环境准备与配置</h3>', '环境准备'));
  });

  it('returns true when b includes a', () => {
    assert.ok(fuzzyTitleMatch('环境准备', '<h3>Spring Boot 环境准备与配置</h3>'));
  });

  it('returns false for unrelated strings', () => {
    assert.ok(!fuzzyTitleMatch('<h3>环境准备</h3>', '性能调优'));
  });

  it('handles whitespace differences', () => {
    assert.ok(fuzzyTitleMatch('<h3>环 境 准 备</h3>', '环境准备'));
  });

  it('returns false when both stripped to empty', () => {
    assert.ok(!fuzzyTitleMatch('<script>x</script>', '<style>y</style>'));
  });
});

describe('fixMotionTags', () => {
  it('replaces <motion> with <div>', () => {
    const input = '<motion class="fade-in"><p>Hello</p></motion>';
    const result = fixMotionTags(input);
    assert.ok(result.includes('<div class="fade-in">'));
    assert.ok(result.includes('</div>'));
    assert.ok(!result.includes('<motion'));
    assert.ok(!result.includes('</motion>'));
  });

  it('leaves non-motion content unchanged', () => {
    const input = '<div class="normal"><p>text</p></div>';
    assert.strictEqual(fixMotionTags(input), input);
  });
});

describe('INVALID_TAG_RE', () => {
  it('matches <motion> tag', () => {
    assert.ok(INVALID_TAG_RE.test('<motion class="x">'));
  });

  it('matches </motion> tag', () => {
    assert.ok(INVALID_TAG_RE.test('</motion>'));
  });

  it('matches <TAGDIV> tag', () => {
    assert.ok(INVALID_TAG_RE.test('<TAGDIV>'));
  });

  it('does not match regular div', () => {
    assert.ok(!INVALID_TAG_RE.test('<div class="x">'));
  });
});
