/**
 * 公共工具函数：HTML 清洗与模糊标题匹配。
 * 供 chapter-quality.mjs / practice-quality.mjs 等模块复用。
 */

/**
 * 去除 HTML 标签、script/style 内容，压缩空白后返回纯文本。
 */
export function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * 模糊匹配两个标题：去空白后做包含/反向包含/等值比较。
 */
export function fuzzyTitleMatch(a, b) {
  const na = stripHtml(a).replace(/\s/g, '');
  const nb = stripHtml(b).replace(/\s/g, '');
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na) || na === nb;
}

/**
 * 非法标签（motion / TAGDIV）检测正则。
 */
export const INVALID_TAG_RE = /<\/?(motion|TAGDIV)\b/i;

/**
 * 将 <motion> 替换为 <div>，避免 DOM 断裂。
 */
export function fixMotionTags(html) {
  return html.replaceAll('<motion ', '<div ').replaceAll('</motion>', '</div>');
}
