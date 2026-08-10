/**
 * Mermaid 全屏模块存根。
 *
 * shell.app.js 已内置完整的 Mermaid 渲染/全屏逻辑（含 P9 预渲染 SVG 支持、
 * 客户端回退、暗色主题切换重绘等），本文件不再覆盖任何函数。
 *
 * 仅在课程章节包含 .mermaid-wrap 时由 assemble 注入 ——
 * 作为可选模块注入标记点，保留为将来可能的扩展入口。
 */
(function () {
  if (typeof window === 'undefined') return;
  // shell.app.js 的 initCourse() 已执行：
  //   initMermaidFullscreen() + injectMermaidFullscreenUi() + bindMermaidFullscreen()
  //   + initMermaid() → highlightIn() → renderMermaidIn()
  // 无额外初始化逻辑。
})();
