/**
 * 章节加深理解组件（清单、参数滑块）— 技能模板，勿复制到课程目录。
 * 用法：将本文件函数体（去掉本注释块）内联到 welcome.partial.html 末尾 <script>…</script>；
 * 或由 assemble-index.mjs 在缺失时自动注入（useEnrichment !== false）。
 */
(function () {
  var SLUG =
    (window.COURSE_DATA && window.COURSE_DATA.meta && window.COURSE_DATA.meta.slug) || 'course';

  /**
   * 从 localStorage 读取值，失败时返回 null。
   * @param {string} key 存储键
   * @returns {string|null}
   */
  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /**
   * 写入 localStorage，失败时返回 false。
   * @param {string} key   存储键
   * @param {string} value 存储值
   * @returns {boolean} 写入成功返回 true
   */
  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 初始化「学习清单」组件：绑定 localStorage 持久化勾选状态，
   * 同步进度条显示。扫描根节点下所有 .learn-checklist。
   * @param {HTMLElement} root 搜索根节点（document 或章节 section）
   */
  function initChecklists(root) {
    root.querySelectorAll('.learn-checklist').forEach(function (box) {
      var baseKey = box.getAttribute('data-storage-key') || SLUG + '_checklist';
      var inputs = box.querySelectorAll('input[type="checkbox"][data-id]');
      inputs.forEach(function (input) {
        var key = baseKey + '_' + input.getAttribute('data-id');
        input.checked = storageGet(key) === '1';
        input.addEventListener('change', function () {
          storageSet(key, input.checked ? '1' : '0');
          updateChecklistProgress(box);
        });
      });
      updateChecklistProgress(box);
    });
  }

  /**
   * 更新单个清单容器的进度文字（done/total 已勾选）。
   * @param {HTMLElement} box .learn-checklist 容器元素
   */
  function updateChecklistProgress(box) {
    var inputs = box.querySelectorAll('input[type="checkbox"][data-id]');
    var done = 0;
    inputs.forEach(function (i) {
      if (i.checked) done += 1;
    });
    var el = box.querySelector('.learn-checklist-progress');
    if (el) {
      el.textContent = done + ' / ' + inputs.length + ' 已勾选';
    }
  }

  /**
   * 初始化「参数滑块」组件：绑定 range 输入、更新 output 显示、
   * 按值分三段显示提示文字，并通过 localStorage 持久化当前值。
   * 扫描根节点下所有 .learn-param-slider。
   * @param {HTMLElement} root 搜索根节点
   */
  function initParamSliders(root) {
    root.querySelectorAll('.learn-param-slider').forEach(function (box) {
      var range = box.querySelector('input[type="range"]');
      var output = box.querySelector('output');
      var hint = box.querySelector('.learn-param-hint');
      if (!range) return;

      var storageKey = box.getAttribute('data-storage-key');
      if (storageKey) {
        var saved = storageGet(storageKey);
        if (saved) range.value = saved;
      }

      var hintLow = box.getAttribute('data-hint-low') || '数值偏小：注意观察边界行为。';
      var hintMid = box.getAttribute('data-hint-mid') || '中间区间：结合正文理解典型配置。';
      var hintHigh = box.getAttribute('data-hint-high') || '数值偏大：注意延迟与资源占用。';
      var unit = box.getAttribute('data-value-unit') || '';

      function refresh() {
        var v = parseInt(range.value, 10);
        if (output) output.textContent = v + (unit ? ' ' + unit : '');
        if (hint) {
          var max = parseInt(range.max, 10) || 100;
          var third = max / 3;
          if (v <= third) hint.textContent = hintLow;
          else if (v <= third * 2) hint.textContent = hintMid;
          else hint.textContent = hintHigh;
        }
        if (storageKey) storageSet(storageKey, String(v));
      }

      range.addEventListener('input', refresh);
      refresh();
    });
  }

  /**
   * 初始化「学习标签页」组件：用隐藏 radio input 驱动的 CSS-only
   * 标签页切换，label 的 mousedown 事件选中对应 input。
   * 扫描根节点下所有 .learn-tabs。
   * @param {HTMLElement} root 搜索根节点
   */
  function initLearnTabs(root) {
    root.querySelectorAll('.learn-tabs').forEach(function (tabs) {
      tabs.querySelectorAll('label[for]').forEach(function (label) {
        var id = label.getAttribute('for');
        if (!id) return;
        var input = document.getElementById(id);
        if (!input || !tabs.contains(input) || !input.classList.contains('learn-tab-input')) return;
        label.addEventListener('mousedown', function (e) {
          e.preventDefault();
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          try {
            input.focus({ preventScroll: true });
          } catch (err) {
            input.focus();
          }
        });
      });
    });
  }

  /**
   * 总入口：在指定根节点内初始化所有加深理解组件
   *（清单、参数滑块、标签页）。
   * @param {HTMLElement} root 搜索根节点（如 document 或章节 section）
   */
  function initEnrichment(root) {
    initChecklists(root);
    initParamSliders(root);
    initLearnTabs(root);
  }

  function boot() {
    initEnrichment(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.initChapterEnrichment = initEnrichment;
})();
