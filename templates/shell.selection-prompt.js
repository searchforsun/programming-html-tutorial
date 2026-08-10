/**
 * 划词 AI 解释模块（可选注入）。
 * 仅在 course.meta.selectionPromptEnabled !== false 时由 assemble 注入。
 */
(function () {
  if (typeof window === 'undefined') return;

  var SELECTION_PROMPT_MIN = 2;
  var SELECTION_PROMPT_MAX = 120;
  var DEFAULT_SELECTION_PROMPT_TEMPLATE =
    '我在学习{domain}，请解释一下「{selection}」，并结合示例说明常见用法与误区。';

  /**
   * 检查划词 AI 解释功能是否启用。
   * 读取 COURSE_DATA.meta.selectionPromptEnabled，默认开启。
   * @returns {boolean}
   */
  function isSelectionPromptEnabled() {
    var meta = COURSE_DATA.meta || {};
    return meta.selectionPromptEnabled !== false;
  }

  /**
   * 判断节点是否在排除区域内（代码块、测验、侧栏、工具栏等），
   * 在这些区域内不触发划词 AI 解释。
   * @param {Node} node DOM 节点
   * @returns {boolean}
   */
  function isNodeInExcludedSelectionRoot(node) {
    if (!node) return true;
    var el = node.nodeType === 1 ? node : node.parentElement;
    if (!el) return true;
    return !!el.closest(
      'pre, code, .code-block, .quiz-section, #quiz-panel, #sidebar, #term-modal, ' +
        '#selection-term-toolbar, button, input, textarea, select, label, ' +
        '.topbar, #chapter-toc, .chapter-toc-fab, .btn-copy, .quiz-actions'
    );
  }

  /**
   * 从当前选区中提取文本，限定在主内容区域且长度在 2–120 字符范围内。
   * @returns {{ text: string, range: Range }|null}
   */
  function getSelectionInMainContent() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
    var text = sel.toString().replace(/\s+/g, ' ').trim();
    if (text.length < SELECTION_PROMPT_MIN || text.length > SELECTION_PROMPT_MAX) return null;
    var range = sel.getRangeAt(0);
    if (isNodeInExcludedSelectionRoot(range.commonAncestorContainer)) return null;
    var main = document.getElementById('main-content');
    if (!main || !main.contains(range.commonAncestorContainer)) return null;
    return { text: text, range: range };
  }

  /**
   * 按配置模板构建 AI 解释的 prompt 文本。
   * 支持 {domain}/{selection}/{title} 占位符替换。
   * @param {string} selection 用户选中的文本
   * @returns {string} 构建完成的 prompt
   */
  function buildSelectionPrompt(selection) {
    var meta = COURSE_DATA.meta || {};
    var tpl = meta.selectionPromptTemplate || DEFAULT_SELECTION_PROMPT_TEMPLATE;
    var domain = meta.domain || meta.title || '本课程';
    return tpl
      .replace(/\{domain\}/g, domain)
      .replace(/\{selection\}/g, selection)
      .replace(/\{title\}/g, meta.title || domain);
  }

  /**
   * 初始化划词 AI 解释模块：创建浮动工具栏，绑定 mouseup/click 事件，
   * 在用户选中文本后显示 "AI 解释" 按钮，点击后打开术语弹窗发送 prompt。
   * 仅在 selectionPromptEnabled 不为 false 时激活。
   */
  window.initSelectionPrompt = function () {
    if (!isSelectionPromptEnabled()) return;

    var toolbar = document.getElementById('selection-term-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'selection-term-toolbar';
      toolbar.className = 'selection-term-toolbar';
      toolbar.hidden = true;
      toolbar.setAttribute('role', 'toolbar');
      toolbar.setAttribute('aria-label', '选中文本操作');
      var btnEl = document.createElement('button');
      btnEl.type = 'button';
      btnEl.className = 'btn-selection-term';
      btnEl.textContent = 'AI 解释';
      toolbar.appendChild(btnEl);
      document.body.appendChild(toolbar);
    }

    var btn = toolbar.querySelector('.btn-selection-term');
    var pendingSelection = null;

    function hideToolbar() {
      toolbar.hidden = true;
      pendingSelection = null;
    }

    function positionToolbar(range) {
      var rect = range.getBoundingClientRect();
      toolbar.hidden = false;
      var tw = toolbar.offsetWidth;
      var th = toolbar.offsetHeight;
      var left = rect.left + rect.width / 2 - tw / 2;
      var top = rect.top - th - 10;
      if (top < 8) top = rect.bottom + 10;
      left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
      top = Math.max(8, Math.min(top, window.innerHeight - th - 8));
      toolbar.style.left = left + 'px';
      toolbar.style.top = top + 'px';
    }

    document.addEventListener(
      'mouseup',
      function (e) {
        if (toolbar.contains(e.target)) return;
        window.setTimeout(function () {
          if (e.target.closest('.term')) {
            hideToolbar();
            return;
          }
          var hit = getSelectionInMainContent();
          if (!hit) {
            hideToolbar();
            return;
          }
          pendingSelection = hit.text;
          positionToolbar(hit.range);
        }, 12);
      },
      true
    );

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!pendingSelection) return;
      openTermModal(pendingSelection, buildSelectionPrompt(pendingSelection));
      hideToolbar();
      var sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideToolbar();
    });
    document.addEventListener(
      'scroll',
      function () {
        hideToolbar();
      },
      true
    );
    document.getElementById('term-modal').addEventListener('close', hideToolbar);
  };
})();
