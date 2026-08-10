/**
 * Mermaid 构建时预渲染模块。
 *
 * 渐进增强：检测 mmdc 可用则预渲染为静态 SVG（首屏无闪烁），
 * 不可用时静默跳过（保留客户端渲染路径）。
 *
 * 预渲染的 SVG 带 .mermaid-prerendered 标记，shell.app.js 的
 * renderMermaidIn 检测到此标记后跳过 mermaid.run()，直接显示。
 * 主题切换时 rerenderActiveMermaid 移除预渲染 SVG 并从源码重绘。
 */

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';

// ─── 工具检测 ────────────────────────────────────────────────

let _mmdcChecked = false;
let _mmdcAvailable = false;

/**
 * 检测 mmdc (mermaid-cli) 在 PATH 中是否可用。
 * 结果缓存，只检测一次。
 * @returns {Promise<boolean>}
 */
export async function isMmdcAvailable() {
  if (_mmdcChecked) return _mmdcAvailable;
  _mmdcChecked = true;
  try {
    await execFilePromise('mmdc', ['--version'], { timeout: 5000 });
    _mmdcAvailable = true;
  } catch {
    _mmdcAvailable = false;
  }
  return _mmdcAvailable;
}

/**
 * 渲染单段 Mermaid 源码为 SVG 字符串。
 * @param {string} source - Mermaid 源码
 * @param {string} [theme='default'] - 主题：default | dark
 * @returns {Promise<string>} SVG 字符串
 */
export async function renderMermaidSvg(source, theme = 'default') {
  // mmdc 通过 stdin 读取、stdout 输出 SVG
  const { stdout } = await execFilePromise(
    'mmdc',
    ['-i', '-', '-o', '-', '-t', theme, '-b', 'transparent', '-s', '1'],
    {
      input: source,
      timeout: 30000,
      maxBuffer: 5 * 1024 * 1024, // 5MB，大图表
    }
  );
  return stdout;
}

/**
 * 对一段章节 HTML 中的所有 Mermaid 块进行预渲染。
 *
 * 处理流程：
 * 1. 正则匹配所有 <pre class="mermaid">…</pre> 块
 * 2. 对每块调用 mmdc 渲染为 SVG
 * 3. 将 SVG 包裹在 <div class="mermaid-diagram mermaid-prerendered"> 中
 * 4. 插入到 <pre> 之后，保持源码在 DOM 中（供主题切换重绘）
 *
 * @param {string} html - 章节 HTML 原文
 * @param {string} [theme='default'] - 构建时默认主题
 * @returns {Promise<string>} 注入 SVG 后的 HTML
 */
export async function prerenderChapterMermaids(html, theme = 'default') {
  if (!html || !/<pre\s[^>]*class="[^"]*mermaid[^"]*"/.test(html)) {
    return html;
  }

  // 匹配 <pre class="mermaid">…</pre>（支持多行源码）
  const re = /<pre\s[^>]*class="([^"]*mermaid[^"]*)"[^>]*>([\s\S]*?)<\/pre>/gi;

  const blocks = [];
  let match;
  while ((match = re.exec(html)) !== null) {
    const classAttr = match[1];
    const source = match[2].trim();
    if (!source) continue;
    blocks.push({
      fullMatch: match[0],
      classAttr,
      source,
      index: match.index,
    });
  }

  if (!blocks.length) return html;

  // 并行渲染所有图表
  const svgResults = await Promise.all(
    blocks.map((b) =>
      renderMermaidSvg(b.source, theme).catch((err) => {
        console.warn(`  ⚠ Mermaid 预渲染失败 (${hashSource(b.source)}): ${err.message}`);
        return null;
      })
    )
  );

  // 从后往前替换，保持 index 有效
  let result = html;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    const svg = svgResults[i];
    if (!svg) continue; // 渲染失败，保留原文供客户端回退

    // 提取 SVG 的 <svg> 标签部分（去掉可能的 XML 声明）
    const svgTag = svg.replace(/^<\?xml[^?]*\?>\s*/i, '').trim();

    const diagramDiv =
      `<div class="mermaid-diagram mermaid-prerendered" data-mermaid-hash="${hashSource(block.source)}">\n${svgTag}\n</div>`;

    // 在 </pre> 之后插入 diagram div
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

/**
 * 对全量章节 HTML（多章拼接）做批量预渲染。
 * 同时返回统计信息。
 *
 * @param {string} chaptersHtml - 所有章节 HTML 拼接
 * @param {string} [theme='default']
 * @returns {Promise<{html: string, stats: {total: number, success: number, failed: number}}>}
 */
export async function prerenderAllChapters(chaptersHtml, theme = 'default') {
  const total = (chaptersHtml.match(/<pre\s[^>]*class="[^"]*mermaid[^"]*"/gi) || []).length;
  if (!total) {
    return { html: chaptersHtml, stats: { total: 0, success: 0, failed: 0 } };
  }

  // 按章分割，避免大正则 backreference 溢出
  const chapterParts = chaptersHtml.split(/(<section\s[^>]*data-chapter=)/i);

  const renderedParts = await Promise.all(
    chapterParts.map(async (part, idx) => {
      // 第一部分是第一个 <section 之前的内容（prefix），跳过
      if (idx === 0 || part.startsWith('<section')) {
        // 重建 <section 前缀
        const fullPart = idx === 0 ? part : part;
        // 只对含 mermaid 的部分做预渲染
        if (/<pre\s[^>]*class="[^"]*mermaid[^"]*"/i.test(fullPart)) {
          return await prerenderChapterMermaids(fullPart, theme);
        }
        return fullPart;
      }
      return part;
    })
  );

  const html = renderedParts.join('');
  const success = (html.match(/mermaid-prerendered/g) || []).length;
  const failed = total - success;

  return { html, stats: { total, success, failed } };
}

// ─── 内部工具 ─────────────────────────────────────────────────

function execFilePromise(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, {
      timeout: opts.timeout || 15000,
      maxBuffer: opts.maxBuffer || 1024 * 1024,
    }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve({ stdout, stderr });
    });
    if (opts.input) {
      child.stdin.write(opts.input);
      child.stdin.end();
    }
  });
}

function hashSource(source) {
  return createHash('md5').update(source.trim()).digest('hex').slice(0, 8);
}
