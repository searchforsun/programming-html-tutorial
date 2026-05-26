/** Chapter block rules from config/defaults.json */

export const BLOCK_SELECTORS = {
  concept: '.concept',
  'official-links': '.official-links',
  'code-block': '.code-block',
  'mermaid-wrap': '.mermaid-wrap',
  steps: '.steps',
  'demo-box': '.demo-box',
  resources: '.resources',
};

export function getRequiredBlocks(defaults, domainType) {
  const optional = defaults.chapterBlocksOptionalByDomainType?.[domainType] || [];
  return (defaults.chapterBlocks || []).filter((b) => !optional.includes(b));
}

export function checkChapterHtml(html, requiredBlocks) {
  const missing = [];
  for (const block of requiredBlocks) {
    const cls = BLOCK_SELECTORS[block]?.slice(1);
    if (!cls) continue;
    if (!html.includes(cls)) missing.push(block);
  }
  return missing;
}
