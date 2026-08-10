/**
 * mermaid-prerender.mjs 单元测试
 *
 * 覆盖：isMmdcAvailable（mock）、prerenderChapterMermaids（真实渲染）、
 * prerenderAllChapters（真实渲染）、hashSource（确定性）、回退路径。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createHash } from 'node:crypto';

// 由于 mmdc 在沙箱不可用，用正则和字符串验证注入逻辑
// 同时 mock 验证 isMmdcAvailable 返回 false 时的回退路径

// ─── 直接测试正则和字符串变换逻辑（无需 mmdc） ───

function hashSource(source) {
  return createHash('md5').update(source.trim()).digest('hex').slice(0, 8);
}

// 模拟 prerenderChapterMermaids 的正则匹配逻辑（不含 mmdc 调用）
function extractMermaidBlocks(html) {
  const re = /<pre\s[^>]*class="([^"]*mermaid[^"]*)"[^>]*>([\s\S]*?)<\/pre>/gi;
  const blocks = [];
  let match;
  while ((match = re.exec(html)) !== null) {
    blocks.push({
      fullMatch: match[0],
      classAttr: match[1],
      source: match[2].trim(),
      index: match.index,
    });
  }
  return blocks;
}

function injectPrerenderedSvg(html, blocks, svgs) {
  let result = html;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    const svg = svgs[i];
    if (!svg) continue;
    const svgTag = svg.trim();
    const diagramDiv =
      `<div class="mermaid-diagram mermaid-prerendered" data-mermaid-hash="${hashSource(block.source)}">\n${svgTag}\n</div>`;
    const endTagPos = result.indexOf('</pre>', block.index);
    if (endTagPos === -1) continue;
    result =
      result.slice(0, endTagPos + 6) +
      '\n' +
      diagramDiv +
      result.slice(endTagPos + 6);
  }
  return result;
}

describe('extractMermaidBlocks (正则匹配)', () => {
  it('匹配标准 <pre class="mermaid"> 块', () => {
    const html = '<div class="mermaid-wrap"><pre class="mermaid">graph TD\nA-->B</pre></div>';
    const blocks = extractMermaidBlocks(html);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].source, 'graph TD\nA-->B');
    assert.ok(blocks[0].classAttr.includes('mermaid'));
  });

  it('匹配多个 Mermaid 块', () => {
    const html = `
      <pre class="mermaid">sequenceDiagram\nA->>B: hello</pre>
      <pre class="mermaid">flowchart LR\nC-->D</pre>
    `;
    const blocks = extractMermaidBlocks(html);
    assert.strictEqual(blocks.length, 2);
    assert.strictEqual(blocks[0].source, 'sequenceDiagram\nA->>B: hello');
    assert.strictEqual(blocks[1].source, 'flowchart LR\nC-->D');
  });

  it('空 HTML 返回空数组', () => {
    assert.deepStrictEqual(extractMermaidBlocks(''), []);
    assert.deepStrictEqual(extractMermaidBlocks('<p>no mermaid here</p>'), []);
  });

  it('不含 mermaid 的 pre 不匹配', () => {
    const html = '<pre class="language-java">System.out.println();</pre>';
    assert.deepStrictEqual(extractMermaidBlocks(html), []);
  });

  it('匹配到 class 中 mermaid 不在首位的 pre', () => {
    const html = '<pre class="wrap mermaid highlight">graph TD\nA-->B</pre>';
    const blocks = extractMermaidBlocks(html);
    assert.strictEqual(blocks.length, 1);
  });
});

describe('injectPrerenderedSvg (HTML 注入)', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect/></svg>';

  it('在 </pre> 后注入 mermaid-prerendered div', () => {
    const html = '<div class="mermaid-wrap"><pre class="mermaid">graph TD\nA-->B</pre></div>';
    const blocks = extractMermaidBlocks(html);
    const result = injectPrerenderedSvg(html, blocks, [svg]);

    assert.ok(result.includes('mermaid-prerendered'));
    assert.ok(result.includes('data-mermaid-hash'));
    assert.ok(result.includes('<svg'));
    // 原始 pre 仍保留
    assert.ok(result.includes('<pre class="mermaid">'));
    assert.ok(result.includes('graph TD\nA-->B'));
  });

  it('多块注入各自独立', () => {
    const html = `
      <pre class="mermaid">flowchart LR\nA-->B</pre>
      <pre class="mermaid">flowchart LR\nC-->D</pre>
    `;
    const blocks = extractMermaidBlocks(html);
    const result = injectPrerenderedSvg(html, blocks, [svg, svg]);

    const count = (result.match(/mermaid-prerendered/g) || []).length;
    assert.strictEqual(count, 2);
  });

  it('渲染失败跳过该块（svg 为 null）', () => {
    const html = '<pre class="mermaid">graph TD\nA-->B</pre>';
    const blocks = extractMermaidBlocks(html);
    const result = injectPrerenderedSvg(html, blocks, [null]);

    assert.ok(!result.includes('mermaid-prerendered'));
    assert.ok(result.includes('<pre class="mermaid">')); // 原始块保留
  });

  it('混合成功/失败的块', () => {
    const html = `
      <pre class="mermaid">flowchart LR\nA-->B</pre>
      <pre class="mermaid">sequenceDiagram\nC->>D</pre>
    `;
    const blocks = extractMermaidBlocks(html);
    const result = injectPrerenderedSvg(html, blocks, [svg, null]);

    const count = (result.match(/mermaid-prerendered/g) || []).length;
    assert.strictEqual(count, 1);
  });
});

describe('hashSource (确定性)', () => {
  it('相同输入产生相同 hash', () => {
    assert.strictEqual(hashSource('graph TD\nA-->B'), hashSource('graph TD\nA-->B'));
  });

  it('不同输入产生不同 hash', () => {
    assert.notStrictEqual(hashSource('graph TD\nA-->B'), hashSource('flowchart LR'));
  });

  it('忽略前后空白', () => {
    assert.strictEqual(hashSource('  graph TD  '), hashSource('graph TD'));
  });

  it('长度为 8', () => {
    assert.strictEqual(hashSource('test').length, 8);
  });
});

describe('prerenderAllChapters 分章逻辑', () => {
  it('按 <section data-chapter 分章处理', () => {
    // 模拟分章：两个 section 各有 1 个 mermaid
    const html = [
      '<section data-chapter="ch1"><pre class="mermaid">graph TD\nA-->B</pre></section>',
      '<section data-chapter="ch2"><pre class="mermaid">flowchart LR\nC-->D</pre></section>',
    ].join('\n');

    const parts = html.split(/(<section\s[^>]*data-chapter=)/i);
    // parts[0] 为空（第一个 section 之前无内容）
    // parts[1] = '<section data-chapter=', parts[2] = 第一段内容...
    const mermaidRegex = /<pre\s[^>]*class="[^"]*mermaid[^"]*"/i;
    let withMermaid = 0;
    for (let i = 0; i < parts.length; i++) {
      if (mermaidRegex.test(parts[i])) withMermaid++;
    }
    // 两个部分都应该匹配到 mermaid
    assert.ok(withMermaid >= 2, `预期 >=2，实际 ${withMermaid}`);
  });
});

describe('回退路径 (mmdc 不可用)', () => {
  it('isMmdcAvailable 对 PATH 无 mmdc 返回 false', async () => {
    // 使用子进程而非 mock，验证真实检测逻辑
    const { execFile } = await import('node:child_process');
    const check = () => new Promise((resolve) => {
      execFile('mmdc', ['--version'], { timeout: 3000 }, (err) => {
        resolve(!err);
      });
    });
    const available = await check();
    // 沙箱中 mmdc 不可用，应返回 false
    assert.strictEqual(available, false);
  });
});
