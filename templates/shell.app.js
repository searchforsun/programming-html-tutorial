(function () {
  const courseDataEl = document.getElementById('course-data');
  window.COURSE_DATA = JSON.parse(courseDataEl.textContent);
  const slug = COURSE_DATA.meta.slug;
  const KEY_DONE = slug + '_completed';
  const KEY_THEME = slug + '_theme';
  const KEY_SCROLL = slug + '_scroll';

  function storageGet(key) {
    try {
      var v = localStorage.getItem(key);
      if (v !== null) return v;
    } catch (e) { /* file:// 等环境可能禁用 localStorage */ }
    try {
      return sessionStorage.getItem(key);
    } catch (e2) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      try {
        sessionStorage.setItem(key, value);
      } catch (e2) { /* ignore */ }
      return true;
    } catch (e) {
      try {
        sessionStorage.setItem(key, value);
        return true;
      } catch (e3) {
        return false;
      }
    }
  }

  function applyThemePreset() {
    var id = COURSE_DATA.meta.themePreset || COURSE_DATA.meta.slug || 'default';
    id = String(id).toLowerCase().replace(/[^a-z0-9-]/g, '');
    document.documentElement.setAttribute('data-theme-preset', id);
  }

  function getCompleted() {
    try {
      var raw = storageGet(KEY_DONE);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }
  function setCompleted(ids) {
    storageSet(KEY_DONE, JSON.stringify(ids));
  }

  function syncChapterDoneState() {
    var done = new Set(getCompleted());
    document.querySelectorAll('section[data-chapter]').forEach(function (sec) {
      var id = sec.getAttribute('data-chapter');
      if (id) sec.classList.toggle('done', done.has(id));
    });
  }

  function syncAllProgressUI() {
    updateProgressBar();
    syncSidebarDone();
    syncMarkDoneButtons();
    syncChapterDoneState();
  }

  function toggleComplete(chapterId) {
    const set = new Set(getCompleted());
    if (set.has(chapterId)) set.delete(chapterId);
    else set.add(chapterId);
    setCompleted([...set]);
    syncAllProgressUI();
  }

  function syncMarkDoneButtons() {
    var done = new Set(getCompleted());
    document.querySelectorAll('.btn-mark-done').forEach(function (btn) {
      var id = btn.getAttribute('data-chapter');
      if (!id) return;
      var completed = done.has(id);
      btn.textContent = completed ? '取消标记' : '标记完成';
      btn.setAttribute('aria-label', completed ? '取消本章完成标记' : '标记本章完成');
      btn.classList.toggle('is-done', completed);
    });
  }

  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) { /* ignore */ }
    try {
      sessionStorage.removeItem(key);
    } catch (e2) { /* ignore */ }
  }

  function showWelcome() {
    document.getElementById('welcome').style.display = '';
    document.querySelectorAll('section[data-chapter]').forEach(function (s) {
      s.classList.remove('active');
    });
    document.querySelectorAll('#sidebar li').forEach(function (li) {
      li.classList.remove('active-ch');
    });
    var homeLi = document.getElementById('sidebar-home');
    if (homeLi) homeLi.classList.add('active-ch');
    storageRemove(KEY_SCROLL);
    syncQuizVisibility(null);
    document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' });
  }

  function showChapter(id) {
    var section = document.getElementById('ch-' + id);
    if (!section) return;
    document.getElementById('welcome').style.display = 'none';
    document.querySelectorAll('section[data-chapter]').forEach(function (s) {
      s.classList.remove('active');
    });
    section.classList.add('active');
    storageSet(KEY_SCROLL, id);
    var homeLi = document.getElementById('sidebar-home');
    if (homeLi) homeLi.classList.remove('active-ch');
    document.querySelectorAll('#sidebar li').forEach(function (li) {
      li.classList.remove('active-ch');
      var a = li.querySelector('a');
      if (a && a.getAttribute('href') === '#ch-' + id) li.classList.add('active-ch');
    });
    renderMermaidIn(section);
    syncQuizVisibility(id);
    section.scrollIntoView({ behavior: 'smooth' });
  }

  function syncQuizVisibility(chapterId) {
    var panel = document.getElementById('quiz-panel');
    if (!panel) return;
    var sections = panel.querySelectorAll('.quiz-section');
    if (!sections.length) {
      panel.style.display = 'none';
      return;
    }
    var matched = false;
    sections.forEach(function (s) {
      var on = chapterId && s.getAttribute('data-chapter') === chapterId;
      s.classList.toggle('active', on);
      if (on) matched = true;
    });
    panel.style.display = matched ? '' : 'none';
    var title = panel.querySelector('.quiz-panel-title');
    var lead = panel.querySelector('.quiz-panel-lead');
    if (title) title.style.display = matched ? '' : 'none';
    if (lead) lead.style.display = matched ? '' : 'none';
  }

  function normalizeQuizText(s) {
    return (s || '').trim().toLowerCase().replace(/^@/, '');
  }

  function collectQuizAnswer(item) {
    if (item.querySelector('input[type="radio"]')) {
      var checked = item.querySelector('input[type="radio"]:checked');
      return checked ? checked.value : '';
    }
    if (item.querySelector('input[type="checkbox"]')) {
      return Array.from(item.querySelectorAll('input[type="checkbox"]:checked'))
        .map(function (c) { return c.value; })
        .sort()
        .join(',');
    }
    var fill = item.querySelector('.fill-input');
    return fill ? fill.value : '';
  }

  function compareQuizAnswers(expected, user) {
    var exp = normalizeQuizText(expected);
    var got = normalizeQuizText(user);
    if (exp.indexOf(',') >= 0) {
      var expSet = exp.split(',').map(function (s) { return s.trim(); }).filter(Boolean).sort().join(',');
      var gotSet = got.split(',').map(function (s) { return s.trim(); }).filter(Boolean).sort().join(',');
      return expSet === gotSet;
    }
    if (got === exp) return true;
    return got.indexOf(exp) >= 0 || exp.indexOf(got) >= 0;
  }

  function checkQuizAnswer(item) {
    var expected = item.getAttribute('data-answer') || '';
    var user = collectQuizAnswer(item);
    var feedback = item.querySelector('.feedback');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.className = 'feedback';
      item.appendChild(feedback);
    }
    if (!user) {
      feedback.className = 'feedback feedback-fail';
      feedback.textContent = '请先选择或填写答案';
      return;
    }
    var ok = compareQuizAnswers(expected, user);
    feedback.className = 'feedback ' + (ok ? 'feedback-ok' : 'feedback-fail');
    feedback.textContent = ok ? '✓ 回答正确' : '✗ 再试一次（可点「答案」查看）';
  }

  function initQuiz() {
    var panel = document.getElementById('quiz-panel');
    if (!panel) return;
    panel.addEventListener('click', function (e) {
      var item = e.target.closest('.quiz-item');
      if (!item) return;
      if (e.target.closest('.btn-hint')) {
        var hint = item.querySelector('.hint');
        if (hint) hint.classList.toggle('hidden');
        return;
      }
      if (e.target.closest('.btn-answer')) {
        var answer = item.querySelector('.answer');
        if (answer) answer.classList.toggle('hidden');
        return;
      }
      if (e.target.closest('.btn-check')) {
        checkQuizAnswer(item);
      }
    });
    syncQuizVisibility(null);
  }
  function totalChapters() {
    return COURSE_DATA.outline.flatMap(function (p) { return p.chapters; }).length;
  }
  function updateProgressBar() {
    const n = getCompleted().length;
    const t = totalChapters();
    const pct = t ? Math.round((n / t) * 100) : 0;
    document.getElementById('progress-bar').style.width = pct + '%';
    document.getElementById('progress-text').textContent = n + '/' + t + ' (' + pct + '%)';
    const track = document.querySelector('.progress-track');
    if (track) track.setAttribute('aria-valuenow', String(pct));
  }
  function syncSidebarDone() {
    const done = new Set(getCompleted());
    document.querySelectorAll('#sidebar li').forEach(function (li) {
      const a = li.querySelector('a');
      if (!a) return;
      const id =
        a.getAttribute('data-ch-id') ||
        (a.getAttribute('href') || '').replace(/^#ch-/, '');
      if (!id) return;
      const isDone = done.has(id);
      li.classList.toggle('done', isDone);
      li.classList.toggle('pending', !isDone);
      var icon = a.querySelector('.ch-done-icon');
      if (isDone && !icon) {
        icon = document.createElement('span');
        icon.className = 'ch-done-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '✓';
        a.insertBefore(icon, a.firstChild);
      } else if (!isDone && icon) {
        icon.remove();
      }
    });
  }

  function renderSidebar() {
    const nav = document.getElementById('sidebar');
    const done = new Set(getCompleted());
    var homeNav =
      '<ul class="sidebar-home-nav">' +
      '<li id="sidebar-home" class="active-ch">' +
      '<a href="#" id="nav-home" data-nav="home"><span class="ch-link-title">课程首页</span></a>' +
      '</li></ul>';
    nav.innerHTML = homeNav + COURSE_DATA.outline.map(function (phase) {
      return '<details class="phase" open>' +
        '<summary>' + phase.phaseTitle + '（' + phase.chapters.length + ' 章）</summary>' +
        '<ul>' + phase.chapters.map(function (ch) {
          const cls = done.has(ch.id) ? 'done' : 'pending';
          const badge = done.has(ch.id) ? '<span class="ch-done-icon" aria-hidden="true">✓</span>' : '';
          return '<li class="' + cls + '"><a href="#ch-' + ch.id + '" data-ch-id="' + ch.id + '">' + badge + '<span class="ch-link-title">' + ch.title + '</span></a></li>';
        }).join('') + '</ul></details>';
    }).join('');
    var homeLink = document.getElementById('nav-home');
    if (homeLink) {
      homeLink.addEventListener('click', function (e) {
        e.preventDefault();
        showWelcome();
      });
    }
    nav.querySelectorAll('a[data-ch-id]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('data-ch-id');
        if (document.getElementById('ch-' + id)) {
          e.preventDefault();
          showChapter(id);
        }
      });
    });
  }

  function renderOutlineSummary() {
    const tbody = document.getElementById('outline-summary-body');
    const phaseClass = { basics: 'basics', practice: 'practice', advanced: 'advanced' };
    tbody.innerHTML = COURSE_DATA.outline.map(function (phase) {
      return phase.chapters.map(function (ch, i) {
        const tag = i === 0 ? '<span class="phase-tag ' + (phaseClass[phase.phaseId] || '') + '">' + phase.phaseTitle + '</span>' : '';
        const sections = ch.sections.join('、');
        return '<tr><td>' + tag + '</td><td><strong>' + ch.title + '</strong></td><td>' + sections + '</td></tr>';
      }).join('');
    }).join('');
  }

  function initMermaid() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: isDark ? 'dark' : 'default',
      flowchart: { useMaxWidth: true, htmlLabels: true },
      themeVariables: isDark ? {
        background: '#151b24',
        primaryColor: '#1e2733',
        primaryTextColor: '#e8edf4',
        primaryBorderColor: '#6db33f',
        lineColor: '#9aa8b8',
        secondaryColor: '#222c3a',
        tertiaryColor: '#2d3a4d'
      } : {
        background: '#f8fafc',
        primaryColor: '#eef2f6',
        primaryTextColor: '#1a2332',
        primaryBorderColor: '#2d7a3e',
        lineColor: '#5c6b7a',
        secondaryColor: '#ffffff',
        tertiaryColor: '#dce3eb'
      }
    });
  }

  function saveMermaidSource(el) {
    if (!el.getAttribute('data-mermaid-src')) {
      var src = (el.textContent || '').trim();
      if (src) el.setAttribute('data-mermaid-src', src);
    }
  }

  function resetMermaidNode(el) {
    saveMermaidSource(el);
    var src = el.getAttribute('data-mermaid-src');
    if (!src) return false;
    el.removeAttribute('data-processed');
    el.querySelectorAll('svg, .mermaidContainer, [id^="dmermaid"]').forEach(function (n) { n.remove(); });
    el.textContent = src;
    if (!el.classList.contains('mermaid')) el.classList.add('mermaid');
    return true;
  }

  function renderMermaidIn(root) {
    if (typeof mermaid === 'undefined' || !root || !root.querySelectorAll) return Promise.resolve();
    var nodes = root.querySelectorAll('pre.mermaid, div.mermaid');
    if (!nodes.length) return Promise.resolve();
    var list = [];
    nodes.forEach(function (el) {
      if (resetMermaidNode(el)) list.push(el);
    });
    if (!list.length) return Promise.resolve();
    return mermaid.run({ nodes: list }).catch(function (err) {
      console.warn('Mermaid render failed:', err);
    });
  }

  function rerenderActiveMermaid() {
    var active = document.querySelector('section[data-chapter].active');
    if (active) return renderMermaidIn(active);
    return Promise.resolve();
  }

  function highlightIn(root) {
    root.querySelectorAll('pre:not(.mermaid) > code').forEach(function (el) {
      hljs.highlightElement(el);
    });
  }

  var copyResetTimer = null;

  function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'show' + (type === 'error' ? ' toast-error' : type === 'success' ? ' toast-success' : '');
    clearTimeout(showToast._hideTimer);
    showToast._hideTimer = setTimeout(function () {
      toast.classList.remove('show', 'toast-error', 'toast-success');
    }, 2400);
  }

  function flashCopyButton(btn, state) {
    if (!btn.getAttribute('data-label')) btn.setAttribute('data-label', btn.textContent.trim());
    btn.classList.remove('copied', 'copy-fail');
    if (state === 'ok') {
      btn.classList.add('copied');
      btn.textContent = '已复制 ✓';
    } else {
      btn.classList.add('copy-fail');
      btn.textContent = '复制失败';
    }
    clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(function () {
      btn.classList.remove('copied', 'copy-fail');
      btn.textContent = btn.getAttribute('data-label');
    }, 2000);
  }

  function copyText(text, btn, toastMsg, failMsg) {
    function onOk() {
      if (btn) flashCopyButton(btn, 'ok');
      showToast(toastMsg || '已复制到剪贴板', 'success');
    }
    function onFail() {
      if (btn) flashCopyButton(btn, 'fail');
      showToast(failMsg || '复制失败，请手动选择文本', 'error');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(onOk).catch(function () {
        if (fallbackCopy(text)) onOk(); else onFail();
      });
    } else if (fallbackCopy(text)) {
      onOk();
    } else {
      onFail();
    }
  }

  function copyFromButton(btn) {
    var block = btn.closest('.code-block');
    var code = block && block.querySelector('code');
    if (!code) return;
    copyText(code.textContent, btn, '代码已复制到剪贴板', '复制失败，请手动选择代码');
  }

  function resetCopyPromptButton() {
    var btn = document.getElementById('btn-copy-prompt');
    if (!btn) return;
    if (!btn.getAttribute('data-label')) btn.setAttribute('data-label', '复制提示词');
    btn.textContent = btn.getAttribute('data-label');
    btn.classList.remove('copied', 'copy-fail');
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (err) {
      return false;
    }
  }

  function bindCopyButtons() {
    document.body.addEventListener('click', function (e) {
      if (e.target.classList.contains('btn-copy')) {
        copyFromButton(e.target);
      }
      if (e.target.classList.contains('btn-mark-done')) {
        var id = e.target.getAttribute('data-chapter');
        if (id) {
          toggleComplete(id);
          showToast(getCompleted().includes(id) ? '已标记本章完成' : '已取消完成标记', 'success');
        }
      }
    });
  }

  function applyHljsTheme(theme) {
    var light = document.getElementById('hljs-light');
    var dark = document.getElementById('hljs-dark');
    if (!light || !dark) return;
    var isDark = theme === 'dark';
    light.disabled = isDark;
    dark.disabled = !isDark;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    storageSet(KEY_THEME, theme);
    applyHljsTheme(theme);
    initMermaid();
    rerenderActiveMermaid();
  }

  function exportProgress() {
    const data = {
      courseId: slug,
      exportedAt: new Date().toISOString(),
      completedChapters: getCompleted(),
      theme: document.documentElement.getAttribute('data-theme')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'progress.json';
    a.click();
  }

  function importProgress(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(reader.result);
        if (data.completedChapters) setCompleted(data.completedChapters);
        if (data.theme) applyTheme(data.theme);
        syncAllProgressUI();
        alert('进度已导入');
      } catch (err) {
        alert('导入失败：JSON 格式无效');
      }
    };
    reader.readAsText(file);
  }

  function closeTermModal() {
    document.getElementById('term-modal').close();
    resetCopyPromptButton();
  }

  function initTermModal() {
    var modal = document.getElementById('term-modal');
    document.body.addEventListener('click', function (e) {
      var term = e.target.closest('.term');
      if (!term) return;
      var id = term.getAttribute('data-term-id');
      var t = COURSE_DATA.terms[id];
      if (!t) return;
      document.getElementById('term-title').textContent = t.label;
      document.getElementById('term-prompt').textContent = t.prompt;
      resetCopyPromptButton();
      modal.showModal();
    });
    document.getElementById('btn-close-term').addEventListener('click', closeTermModal);
    document.getElementById('btn-close-term-x').addEventListener('click', closeTermModal);
    modal.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeTermModal();
    });
    modal.addEventListener('close', resetCopyPromptButton);
    document.getElementById('btn-copy-prompt').addEventListener('click', function () {
      var text = document.getElementById('term-prompt').textContent;
      copyText(text, this, '提示词已复制到剪贴板', '复制失败，请手动选择提示词');
    });
  }

  function initCourse() {
    applyThemePreset();
    var titleEl = document.querySelector('.course-title');
    titleEl.textContent = COURSE_DATA.meta.title;
    titleEl.setAttribute('role', 'button');
    titleEl.setAttribute('tabindex', '0');
    titleEl.setAttribute('title', '返回课程首页');
    titleEl.addEventListener('click', showWelcome);
    titleEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showWelcome();
      }
    });
    document.title = COURSE_DATA.meta.title;
    const savedTheme = storageGet(KEY_THEME) || 'light';
    applyTheme(savedTheme);
    renderSidebar();
    renderOutlineSummary();
    bindCopyButtons();
    initTermModal();
    initQuiz();
    initMermaid();
    highlightIn(document);
    syncAllProgressUI();
    var lastScroll = storageGet(KEY_SCROLL);
    if (lastScroll && document.getElementById('ch-' + lastScroll)) {
      showChapter(lastScroll);
    } else {
      showWelcome();
    }
  }

  document.getElementById('btn-theme').addEventListener('click', function () {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
  document.getElementById('btn-export-progress').addEventListener('click', exportProgress);
  document.getElementById('import-progress').addEventListener('change', function (e) {
    if (e.target.files[0]) importProgress(e.target.files[0]);
  });

  window.toggleComplete = toggleComplete;
  window.afterChapterInserted = function (sectionEl) {
    highlightIn(sectionEl);
    if (sectionEl.classList.contains('active')) renderMermaidIn(sectionEl);
    syncAllProgressUI();
  };

  initCourse();
})();
