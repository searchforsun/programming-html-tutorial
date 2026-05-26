(function () {
  const courseDataEl = document.getElementById('course-data');
  window.COURSE_DATA = JSON.parse(courseDataEl.textContent);
  const slug = COURSE_DATA.meta.slug;
  const KEY_DONE = slug + '_completed';
  const KEY_VISITED = slug + '_visited';
  const KEY_THEME = slug + '_theme';
  const GLOBAL_THEME_KEY = '{{GLOBAL_THEME_KEY}}';
  const GLOBAL_UI_STYLE_KEY = '{{GLOBAL_UI_STYLE_KEY}}';
  const UI_STYLE_IDS = {{UI_STYLE_IDS_JSON}};
  const KEY_SCROLL = slug + '_scroll';
  const KEY_CHAPTER_TOC_OPEN = slug + '_chapter_toc_open';
  var PROGRESS_STORAGE_RESERVED = [KEY_DONE, KEY_VISITED, KEY_SCROLL, KEY_CHAPTER_TOC_OPEN];
  var markCompleteHintShown = {};
  var chapterTocObserver = null;
  var chapterTocTopObserver = null;

  function getScrollRoot() {
    return document.querySelector('.layout');
  }

  function scrollRootToTop(behavior) {
    var root = getScrollRoot();
    if (root) {
      root.scrollTo({ top: 0, behavior: behavior || 'auto' });
    } else {
      window.scrollTo({ top: 0, behavior: behavior || 'auto' });
    }
  }

  function scrollRootToElement(el, behavior) {
    if (!el) return;
    var root = getScrollRoot();
    if (!root) {
      el.scrollIntoView({ behavior: behavior || 'auto', block: 'start' });
      return;
    }
    var rootRect = root.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    var top = elRect.top - rootRect.top + root.scrollTop - 8;
    root.scrollTo({ top: Math.max(0, top), behavior: behavior || 'auto' });
  }

  function isChapterContentAtTop(section, root) {
    if (!section) return false;
    var header = section.querySelector('.chapter-header');
    if (!header) return false;
    var rootRect = root ? root.getBoundingClientRect() : { top: 0 };
    var headerRect = header.getBoundingClientRect();
    return headerRect.top >= rootRect.top - 8 && headerRect.top <= rootRect.top + 72;
  }

  function resetChapterTocNavScrollIfAtTop(section) {
    var nav = document.getElementById('chapter-toc-nav');
    if (!nav) return;
    var root = getScrollRoot();
    if (!isChapterContentAtTop(section, root)) return;
    nav.scrollTop = 0;
  }

  function ensureChapterTocLinkVisible(link) {
    if (!link) return;
    var nav = document.getElementById('chapter-toc-nav');
    if (!nav) return;
    var firstLink = nav.querySelector('a[href^="#"]');
    var section = document.querySelector('section[data-chapter].active');
    var root = getScrollRoot();
    if (firstLink && link === firstLink && isChapterContentAtTop(section, root)) {
      nav.scrollTop = 0;
      return;
    }
    var navRect = nav.getBoundingClientRect();
    var linkRect = link.getBoundingClientRect();
    if (linkRect.top < navRect.top + 4 || linkRect.bottom > navRect.bottom - 4) {
      link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  function syncUiStyleMenu(style) {
    document.querySelectorAll('.ui-style-option').forEach(function (btn) {
      var on = btn.getAttribute('data-style') === style;
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  function closeUiStylePopover() {
    var pop = document.getElementById('ui-style-popover');
    var trigger = document.getElementById('btn-ui-style');
    if (pop) pop.hidden = true;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function applyUiStyle(style) {
    if (UI_STYLE_IDS.indexOf(style) === -1) style = '{{DEFAULT_UI_STYLE}}';
    document.documentElement.setAttribute('data-ui-style', style);
    document.querySelectorAll('[data-ui-style-sheet]').forEach(function (el) {
      el.disabled = el.getAttribute('data-ui-style-sheet') !== style;
    });
    storageSet(GLOBAL_UI_STYLE_KEY, style);
    syncUiStyleMenu(style);
  }

  function initUiStyleMenu(onChange) {
    var saved = storageGet(GLOBAL_UI_STYLE_KEY) || '{{DEFAULT_UI_STYLE}}';
    applyUiStyle(saved);
    var trigger = document.getElementById('btn-ui-style');
    var pop = document.getElementById('ui-style-popover');
    if (!trigger || !pop) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = pop.hidden;
      if (open) {
        pop.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
      } else {
        closeUiStylePopover();
      }
    });

    pop.querySelectorAll('.ui-style-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyUiStyle(btn.getAttribute('data-style'));
        closeUiStylePopover();
        if (typeof onChange === 'function') onChange();
      });
    });

    document.addEventListener('click', function (e) {
      if (pop.hidden) return;
      if (!pop.contains(e.target) && e.target !== trigger && !trigger.contains(e.target)) {
        closeUiStylePopover();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeUiStylePopover();
    });
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

  function getVisited() {
    try {
      var raw = storageGet(KEY_VISITED);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function setVisited(ids) {
    storageSet(KEY_VISITED, JSON.stringify(ids));
  }

  function markVisited(chapterId) {
    if (!chapterId) return;
    var set = new Set(getVisited());
    if (set.has(chapterId)) return;
    set.add(chapterId);
    setVisited([...set]);
  }

  function collectExtraStorage() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf(slug + '_') !== 0) continue;
        if (PROGRESS_STORAGE_RESERVED.indexOf(key) >= 0) continue;
        var val = storageGet(key);
        if (val !== null) out[key] = val;
      }
    } catch (e) { /* ignore */ }
    return out;
  }

  function applyExtraStorage(map) {
    if (!map || typeof map !== 'object') return;
    Object.keys(map).forEach(function (key) {
      if (key.indexOf(slug + '_') !== 0) return;
      if (PROGRESS_STORAGE_RESERVED.indexOf(key) >= 0) return;
      storageSet(key, map[key]);
    });
    if (window.initChapterEnrichment) {
      window.initChapterEnrichment(document);
    }
  }

  function syncChapterDoneState() {
    var done = new Set(getCompleted());
    var visited = new Set(getVisited());
    document.querySelectorAll('section[data-chapter]').forEach(function (sec) {
      var id = sec.getAttribute('data-chapter');
      if (!id) return;
      sec.classList.toggle('done', done.has(id));
      sec.classList.toggle('in-progress', !done.has(id) && visited.has(id));
    });
  }

  function syncAllProgressUI() {
    updateProgressBar();
    syncSidebarProgress();
    syncMarkDoneButtons();
    syncChapterDoneState();
    syncOutlineSummaryProgress();
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

  function ensureChapterHeadingIds(section) {
    var chId = section.getAttribute('data-chapter') || 'ch';
    var counts = { h3: 0, h4: 0 };
    section.querySelectorAll('h3, h4').forEach(function (heading) {
      if (heading.closest('.chapter-header')) return;
      if (heading.closest('.code-toolbar')) return;
      if (heading.id) return;
      var tag = heading.tagName.toLowerCase();
      counts[tag] += 1;
      var prefix = tag === 'h3' ? 'sec' : 'sub';
      heading.id = chId + '-' + prefix + '-' + counts[tag];
    });
  }

  function isChapterTocOpenPref() {
    return storageGet(KEY_CHAPTER_TOC_OPEN) !== '0';
  }

  function setChapterTocOpenPref(open) {
    storageSet(KEY_CHAPTER_TOC_OPEN, open ? '1' : '0');
  }

  function applyChapterTocVisibility() {
    var toc = document.getElementById('chapter-toc');
    var fab = document.getElementById('chapter-toc-fab');
    var toggle = document.getElementById('btn-chapter-toc-toggle');
    if (!toc || toc.hidden) {
      document.documentElement.classList.remove('chapter-toc-open');
      if (fab) {
        fab.classList.remove('is-shown');
        fab.hidden = true;
      }
      return;
    }
    var open = isChapterTocOpenPref();
    toc.classList.toggle('is-collapsed', !open);
    document.documentElement.classList.toggle('chapter-toc-open', open);
    if (fab) {
      if (open) {
        fab.classList.remove('is-shown');
        fab.hidden = true;
      } else {
        fab.hidden = false;
        requestAnimationFrame(function () {
          fab.classList.add('is-shown');
        });
      }
    }
    if (toggle) {
      toggle.textContent = open ? '隐藏' : '显示';
      toggle.setAttribute('aria-label', open ? '隐藏大纲' : '显示大纲');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }

  function toggleChapterTocPanel() {
    setChapterTocOpenPref(!isChapterTocOpenPref());
    applyChapterTocVisibility();
  }

  function hideChapterToc() {
    var toc = document.getElementById('chapter-toc');
    var fab = document.getElementById('chapter-toc-fab');
    document.documentElement.classList.remove('chapter-toc-open');
    if (toc) {
      toc.hidden = true;
      toc.classList.remove('is-collapsed');
    }
    if (fab) {
      fab.classList.remove('is-shown');
      fab.hidden = true;
    }
    disconnectChapterTocObservers();
  }

  function disconnectChapterTocObservers() {
    if (chapterTocObserver) {
      chapterTocObserver.disconnect();
      chapterTocObserver = null;
    }
    if (chapterTocTopObserver) {
      chapterTocTopObserver.disconnect();
      chapterTocTopObserver = null;
    }
  }

  function scrollChapterToTop(section) {
    var anchor = section.querySelector('.chapter-header') || section;
    scrollRootToElement(anchor, 'auto');
  }

  function getChapterQuizSection(chapterId) {
    var panel = document.getElementById('quiz-panel');
    if (!panel || !chapterId) return null;
    return panel.querySelector('.quiz-section[data-chapter="' + chapterId + '"]');
  }

  function ensureQuizTocHeading(chapterId) {
    var quiz = getChapterQuizSection(chapterId);
    if (!quiz) return null;
    var h = quiz.querySelector('h3');
    if (!h) {
      h = document.createElement('h3');
      h.textContent = '章节测验';
      quiz.insertBefore(h, quiz.firstChild);
    }
    if (!h.id) h.id = 'toc-' + chapterId + '-quiz';
    return h;
  }

  function isQuizTocTarget(section, target) {
    if (!section || !target) return false;
    var quiz = getChapterQuizSection(section.getAttribute('data-chapter'));
    return !!(quiz && quiz.contains(target));
  }

  function buildChapterTocGroups(items) {
    var groups = [];
    var current = null;
    items.forEach(function (it) {
      if (it.level === 'h3') {
        current = { h3: it, children: [] };
        groups.push(current);
      } else if (it.level === 'h4') {
        if (!current) {
          groups.push({ h3: null, children: [it] });
        } else {
          current.children.push(it);
        }
      }
    });
    return groups;
  }

  function renderChapterTocNavHtml(groups) {
    var html = '<ul class="chapter-toc-root">';
    groups.forEach(function (g) {
      if (g.h3 && g.children.length) {
        html +=
          '<li class="toc-block"><a class="toc-l1" href="#' +
          escapeHtml(g.h3.id) +
          '">' +
          escapeHtml(g.h3.text) +
          '</a><ul>';
        g.children.forEach(function (c) {
          html +=
            '<li><a class="toc-l2" href="#' +
            escapeHtml(c.id) +
            '">' +
            escapeHtml(c.text) +
            '</a></li>';
        });
        html += '</ul></li>';
      } else if (g.h3) {
        html +=
          '<li><a class="toc-l1" href="#' +
          escapeHtml(g.h3.id) +
          '">' +
          escapeHtml(g.h3.text) +
          '</a></li>';
      } else {
        g.children.forEach(function (c) {
          html +=
            '<li><a class="toc-l2" href="#' +
            escapeHtml(c.id) +
            '">' +
            escapeHtml(c.text) +
            '</a></li>';
        });
      }
    });
    html += '</ul>';
    return html;
  }

  function bindChapterTocNav(section) {
    var nav = document.getElementById('chapter-toc-nav');
    if (!nav) return;
    var firstTocLink = nav.querySelector('a[href^="#"]');
    nav.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        if (firstTocLink && link === firstTocLink) {
          scrollChapterToTop(section);
          nav.querySelectorAll('a.is-active').forEach(function (a) {
            a.classList.remove('is-active');
          });
          link.classList.add('is-active');
          return;
        }
        var id = link.getAttribute('href').slice(1);
        var target = id ? document.getElementById(id) : null;
        if (!target || (!section.contains(target) && !isQuizTocTarget(section, target))) return;
        scrollRootToElement(target, 'auto');
        nav.querySelectorAll('a.is-active').forEach(function (a) {
          a.classList.remove('is-active');
        });
        link.classList.add('is-active');
      });
    });
  }

  function setChapterTocActiveLink(nav, activeLink) {
    nav.querySelectorAll('a.is-active').forEach(function (a) {
      a.classList.remove('is-active');
    });
    if (activeLink) {
      activeLink.classList.add('is-active');
      ensureChapterTocLinkVisible(activeLink);
    }
  }

  function initChapterTocSpy(section) {
    disconnectChapterTocObservers();
    var nav = document.getElementById('chapter-toc-nav');
    if (!nav || typeof IntersectionObserver === 'undefined') return;
    var links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    if (!links.length) return;
    var firstTocLink = nav.querySelector('a[href^="#"]');
    var headings = links
      .map(function (a) {
        return document.getElementById(a.getAttribute('href').slice(1));
      })
      .filter(Boolean);
    var spyRaf = 0;
    var scrollRoot = getScrollRoot();
    chapterTocObserver = new IntersectionObserver(
      function (entries) {
        if (spyRaf) cancelAnimationFrame(spyRaf);
        spyRaf = requestAnimationFrame(function () {
          spyRaf = 0;
          var visible = entries
            .filter(function (en) { return en.isIntersecting; })
            .sort(function (a, b) { return a.target.offsetTop - b.target.offsetTop; });
          if (!visible.length) return;
          var id = visible[0].target.id;
          var activeLink = null;
          links.forEach(function (link) {
            var on = link.getAttribute('href') === '#' + id;
            if (on) {
              link.classList.add('is-active');
              activeLink = link;
            } else {
              link.classList.remove('is-active');
            }
          });
          ensureChapterTocLinkVisible(activeLink);
        });
      },
      { root: scrollRoot, rootMargin: '-12% 0px -58% 0px', threshold: [0, 0.01, 1] }
    );
    headings.forEach(function (h) { chapterTocObserver.observe(h); });

    var header = section.querySelector('.chapter-header');
    if (firstTocLink && header) {
      chapterTocTopObserver = new IntersectionObserver(
        function (entries) {
          if (!entries.some(function (en) { return en.isIntersecting; })) return;
          var firstHeading = document.getElementById(firstTocLink.getAttribute('href').slice(1));
          var rootRect = scrollRoot ? scrollRoot.getBoundingClientRect() : { top: 0 };
          if (firstHeading && firstHeading.getBoundingClientRect().top <= rootRect.top + 96) {
            resetChapterTocNavScrollIfAtTop(section);
            return;
          }
          setChapterTocActiveLink(nav, firstTocLink);
        },
        { root: scrollRoot, rootMargin: '-8% 0px -72% 0px', threshold: 0 }
      );
      chapterTocTopObserver.observe(header);
    }
  }

  function renderChapterToc(section) {
    var toc = document.getElementById('chapter-toc');
    var nav = document.getElementById('chapter-toc-nav');
    if (!toc || !nav || !section) return;
    ensureChapterHeadingIds(section);
    var items = [];
    section.querySelectorAll('h3, h4').forEach(function (heading) {
      if (heading.closest('.chapter-header')) return;
      if (heading.closest('.code-toolbar')) return;
      if (!heading.id) return;
      items.push({
        id: heading.id,
        text: heading.textContent.trim(),
        level: heading.tagName.toLowerCase()
      });
    });
    var chapterId = section.getAttribute('data-chapter');
    var quizHeading = ensureQuizTocHeading(chapterId);
    if (quizHeading) {
      items.push({
        id: quizHeading.id,
        text: '章节测验',
        level: 'h3'
      });
    }
    if (!items.length) {
      hideChapterToc();
      return;
    }
    var groups = buildChapterTocGroups(items);
    nav.innerHTML = renderChapterTocNavHtml(groups);
    nav.scrollTop = 0;
    toc.hidden = false;
    applyChapterTocVisibility();
    bindChapterTocNav(section);
    initChapterTocSpy(section);
  }

  function initChapterTocControls() {
    var toggle = document.getElementById('btn-chapter-toc-toggle');
    var fab = document.getElementById('chapter-toc-fab');
    if (toggle) {
      toggle.addEventListener('click', toggleChapterTocPanel);
    }
    if (fab) {
      fab.addEventListener('click', function () {
        setChapterTocOpenPref(true);
        applyChapterTocVisibility();
      });
    }
  }

  function syncPageViewClass() {
    if (!document.body.classList.contains('page-course')) return;
    document.body.classList.remove('page-welcome', 'page-chapter');
    var activeChapter = document.querySelector('section[data-chapter].active');
    if (activeChapter) document.body.classList.add('page-chapter');
    else document.body.classList.add('page-welcome');
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
    hideChapterToc();
    scrollRootToTop('smooth');
    syncPageViewClass();
  }

  function chapterIdFromHash(hash) {
    if (!hash || hash.charAt(0) !== '#') return null;
    if (hash.indexOf('#ch-') === 0) return hash.slice(4);
    return null;
  }

  function getChapterTitle(id) {
    for (var pi = 0; pi < COURSE_DATA.outline.length; pi++) {
      var chapters = COURSE_DATA.outline[pi].chapters || [];
      for (var ci = 0; ci < chapters.length; ci++) {
        if (chapters[ci].id === id) return chapters[ci].title;
      }
    }
    return id;
  }

  /** 未生成章节 Toast 文案（真源；与 chapter-authoring.md §跨章引用 一致） */
  function toastChapterNotPublished(id) {
    return '「' + getChapterTitle(id) + '」尚未生成，请从左侧目录打开已发布章节';
  }

  /** 切换章节；正文/侧栏 #ch- 链接均应走此函数（非浏览器默认锚点滚动）。 */
  function navigateToChapter(id, options) {
    var opts = options || {};
    var section = document.getElementById('ch-' + id);
    if (!section) {
      showToast(toastChapterNotPublished(id));
      return false;
    }
    showChapter(id);
    if (opts.updateHash !== false) {
      var target = '#ch-' + id;
      if (location.hash !== target) {
        history.pushState(null, '', target);
      }
    }
    return true;
  }

  function showChapter(id) {
    var section = document.getElementById('ch-' + id);
    if (!section) return;
    markVisited(id);
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
    renderChapterToc(section);
    syncSidebarProgress();
    syncChapterDoneState();
    scrollRootToTop('smooth');
    syncPageViewClass();
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
  function sidebarChapterBadge(id, doneSet, visitedSet) {
    if (doneSet.has(id)) {
      return '<span class="ch-done-icon" aria-hidden="true">✓</span>';
    }
    if (visitedSet.has(id)) {
      return '<span class="ch-progress-icon" aria-hidden="true" title="进行中"></span>';
    }
    return '';
  }

  function sidebarChapterLiClass(id, doneSet, visitedSet) {
    if (doneSet.has(id)) return 'done';
    if (visitedSet.has(id)) return 'in-progress';
    return 'pending';
  }

  function syncSidebarProgress() {
    const done = new Set(getCompleted());
    const visited = new Set(getVisited());
    document.querySelectorAll('#sidebar li').forEach(function (li) {
      const a = li.querySelector('a');
      if (!a) return;
      const id =
        a.getAttribute('data-ch-id') ||
        (a.getAttribute('href') || '').replace(/^#ch-/, '');
      if (!id) return;
      li.classList.remove('done', 'in-progress', 'pending');
      li.classList.add(sidebarChapterLiClass(id, done, visited));
      a.querySelectorAll('.ch-done-icon, .ch-progress-icon').forEach(function (el) {
        el.remove();
      });
      var badgeHtml = sidebarChapterBadge(id, done, visited);
      if (badgeHtml) {
        a.insertAdjacentHTML('beforeend', badgeHtml);
      }
    });
  }

  function getPortalHref() {
    var meta = COURSE_DATA.meta || {};
    return meta.portalHref || '../index.html';
  }

  function initPortalNav() {
    var portalHref = getPortalHref();
    var btnPortal = document.getElementById('btn-portal');
    if (btnPortal) btnPortal.setAttribute('href', portalHref);
  }

  function renderSidebar() {
    const nav = document.getElementById('sidebar');
    const done = new Set(getCompleted());
    const visited = new Set(getVisited());
    var homeNav =
      '<ul class="sidebar-home-nav">' +
      '<li id="sidebar-home" class="active-ch">' +
      '<a href="#" id="nav-home" data-nav="home"><span class="ch-link-title">课程首页</span></a>' +
      '</li></ul>';
    nav.innerHTML = homeNav + COURSE_DATA.outline.map(function (phase) {
      return '<details class="phase" open>' +
        '<summary>' + escapeHtml(phase.phaseTitle) + '</summary>' +
        '<ul>' + phase.chapters.map(function (ch) {
          const cls = sidebarChapterLiClass(ch.id, done, visited);
          const badge = sidebarChapterBadge(ch.id, done, visited);
          return '<li class="' + cls + '"><a href="#ch-' + ch.id + '" data-ch-id="' + ch.id + '"><span class="ch-link-title">' + escapeHtml(ch.title) + '</span>' + badge + '</a></li>';
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
        e.preventDefault();
        navigateToChapter(a.getAttribute('data-ch-id'));
      });
    });
  }

  function bindInContentChapterLinks() {
    var root = document.getElementById('main-content');
    if (!root) return;
    root.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#ch-"]');
      if (!a || a.closest('#sidebar')) return;
      var id = chapterIdFromHash(a.getAttribute('href'));
      if (!id) return;
      e.preventDefault();
      navigateToChapter(id);
    });
  }

  function outlineChapterStatusBadge(chId, doneSet, visitedSet) {
    if (doneSet.has(chId)) {
      return '<span class="outline-ch-status done" aria-label="已完成">✓</span>';
    }
    if (visitedSet.has(chId)) {
      return '<span class="outline-ch-status in-progress" aria-label="进行中"></span>';
    }
    return '';
  }

  function syncOutlineSummaryProgress() {
    var tbody = document.getElementById('outline-summary-body');
    if (!tbody) return;
    var done = new Set(getCompleted());
    var visited = new Set(getVisited());
    tbody.querySelectorAll('tr[data-chapter-id]').forEach(function (row) {
      var chId = row.getAttribute('data-chapter-id');
      var cell = row.querySelector('.outline-chapter-cell');
      if (!cell || !chId) return;
      var old = cell.querySelector('.outline-ch-status');
      if (old) old.remove();
      var badge = outlineChapterStatusBadge(chId, done, visited);
      if (badge) {
        cell.insertAdjacentHTML('afterbegin', badge);
      }
    });
  }

  function renderOutlineSummary() {
    const tbody = document.getElementById('outline-summary-body');
    if (!tbody) return;
    const done = new Set(getCompleted());
    const visited = new Set(getVisited());
    const phaseClass = { basics: 'basics', practice: 'practice', advanced: 'advanced' };
    const rows = [];
    COURSE_DATA.outline.forEach(function (phase) {
      const chapterCount = phase.chapters.length;
      const phaseId = phase.phaseId || '';
      phase.chapters.forEach(function (ch, i) {
        let cells = '';
        if (i === 0) {
          const goalHtml = phase.phaseGoal
            ? '<p class="outline-phase-goal">' + escapeHtml(phase.phaseGoal) + '</p>'
            : '';
          cells +=
            '<td class="outline-phase" rowspan="' + chapterCount + '">' +
            '<div class="outline-phase-inner">' +
            '<span class="phase-tag ' + (phaseClass[phaseId] || '') + '">' +
            escapeHtml(phase.phaseTitle) +
            '</span>' +
            goalHtml +
            '</div></td>';
        }
        const sectionsHtml =
          '<ul class="outline-section-list">' +
          ch.sections
            .map(function (section) {
              return '<li>' + escapeHtml(section) + '</li>';
            })
            .join('') +
          '</ul>';
        const chIndex = String(i + 1).padStart(2, '0');
        const statusBadge = outlineChapterStatusBadge(ch.id, done, visited);
        cells +=
          '<td class="outline-chapter">' +
          '<div class="outline-chapter-cell">' +
          statusBadge +
          '<span class="outline-ch-index" aria-hidden="true">' + chIndex + '</span>' +
          '<span class="outline-chapter-title">' + escapeHtml(ch.title) + '</span>' +
          '</div></td>' +
          '<td class="outline-sections">' + sectionsHtml + '</td>';
        const rowClasses = ['outline-row'];
        if (i === chapterCount - 1) rowClasses.push('outline-row-phase-end');
        const rowAttr =
          ' class="' + rowClasses.join(' ') + '"' +
          ' data-chapter-id="' + escapeHtml(ch.id) + '"' +
          (phaseId ? ' data-phase="' + escapeHtml(phaseId) + '"' : '');
        rows.push('<tr' + rowAttr + '>' + cells + '</tr>');
      });
    });
    tbody.innerHTML = rows.join('');
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
    return mermaid.run({ nodes: list }).then(function () {
      injectMermaidFullscreenUi(root);
      bindMermaidFullscreen(root);
    }).catch(function (err) {
      console.warn('Mermaid render failed:', err);
    });
  }

  function getMermaidDiagramHost(wrap) {
    var pre = wrap.querySelector(':scope > pre.mermaid, :scope > div.mermaid');
    if (!pre) {
      pre = wrap.querySelector('pre.mermaid, div.mermaid');
    }
    if (!pre) return null;
    var diagram = wrap.querySelector('.mermaid-diagram');
    if (!diagram) {
      diagram = document.createElement('div');
      diagram.className = 'mermaid-diagram';
      wrap.insertBefore(diagram, pre);
      diagram.appendChild(pre);
    }
    var bar = wrap.querySelector(':scope > .mermaid-toolbar');
    if (bar) diagram.appendChild(bar);
    return diagram;
  }

  function injectMermaidFullscreenUi(root) {
    var scope = root || document;
    if (!scope.querySelectorAll) return;
    scope.querySelectorAll('.mermaid-wrap').forEach(function (wrap) {
      var diagram = getMermaidDiagramHost(wrap);
      if (!diagram) return;
      if (diagram.querySelector('.mermaid-toolbar')) return;
      var bar = document.createElement('div');
      bar.className = 'mermaid-toolbar';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mermaid-fs-btn';
      btn.textContent = '全屏';
      btn.setAttribute('aria-label', '图表全屏');
      btn.setAttribute('aria-expanded', 'false');
      bar.appendChild(btn);
      diagram.appendChild(bar);
    });
  }

  function isPseudoFs(diagram) {
    return diagram.classList.contains('is-pseudo-fullscreen');
  }

  function closePseudoFs(diagram) {
    diagram.classList.remove('is-pseudo-fullscreen');
    if (!document.querySelector('.mermaid-diagram.is-pseudo-fullscreen')) {
      document.body.style.overflow = '';
    }
  }

  function openPseudoFs(diagram) {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    }
    document.querySelectorAll('.mermaid-diagram.is-pseudo-fullscreen').forEach(function (d) {
      if (d !== diagram) closePseudoFs(d);
    });
    diagram.classList.add('is-pseudo-fullscreen');
    document.body.style.overflow = 'hidden';
  }

  function syncFsButton(diagram, btn) {
    var native = document.fullscreenElement === diagram;
    var pseudo = isPseudoFs(diagram);
    var on = native || pseudo;
    btn.textContent = on ? '退出全屏' : '全屏';
    btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? '退出图表全屏' : '图表全屏');
  }

  function closeAllMermaidFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
    }
    document.querySelectorAll('.mermaid-diagram.is-pseudo-fullscreen').forEach(function (diagram) {
      closePseudoFs(diagram);
      var btn = diagram.querySelector('.mermaid-fs-btn');
      if (btn) syncFsButton(diagram, btn);
    });
  }

  function bindMermaidFullscreen(root) {
    var scope = root || document;
    if (!scope.querySelectorAll) return;
    scope.querySelectorAll('.mermaid-wrap').forEach(function (wrap) {
      var diagram = getMermaidDiagramHost(wrap);
      if (!diagram) return;
      var btn = diagram.querySelector('.mermaid-fs-btn');
      if (!btn || diagram.dataset.fsBound) return;
      diagram.dataset.fsBound = '1';
      btn.addEventListener('click', function () {
        var pre = diagram.querySelector('pre.mermaid, div.mermaid');
        if (!pre || !pre.querySelector('svg')) {
          showToast('图表尚未渲染完成，请稍候再试');
          return;
        }
        var native = document.fullscreenElement === diagram;
        var pseudo = isPseudoFs(diagram);
        if (native || pseudo) {
          if (native) document.exitFullscreen().catch(function () {});
          if (pseudo) closePseudoFs(diagram);
          syncFsButton(diagram, btn);
          return;
        }
        document.querySelectorAll('.mermaid-diagram.is-pseudo-fullscreen').forEach(function (d) {
          closePseudoFs(d);
          var b = d.querySelector('.mermaid-fs-btn');
          if (b) syncFsButton(d, b);
        });
        var req = diagram.requestFullscreen || diagram.webkitRequestFullscreen;
        if (typeof req === 'function') {
          Promise.resolve(req.call(diagram)).then(function () {
            syncFsButton(diagram, btn);
          }).catch(function () {
            openPseudoFs(diagram);
            syncFsButton(diagram, btn);
          });
        } else {
          openPseudoFs(diagram);
          syncFsButton(diagram, btn);
        }
      });
    });
  }

  function syncAllMermaidFsButtons() {
    document.querySelectorAll('.mermaid-wrap').forEach(function (wrap) {
      var diagram = wrap.querySelector('.mermaid-diagram');
      if (!diagram) return;
      var btn = diagram.querySelector('.mermaid-fs-btn');
      if (btn) syncFsButton(diagram, btn);
    });
  }

  function initMermaidFullscreen() {
    document.addEventListener('fullscreenchange', function () {
      syncAllMermaidFsButtons();
      if (!document.fullscreenElement) {
        document.body.style.overflow = document.querySelector('.mermaid-diagram.is-pseudo-fullscreen') ? 'hidden' : '';
      }
    });
    document.addEventListener('webkitfullscreenchange', syncAllMermaidFsButtons);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('.mermaid-diagram.is-pseudo-fullscreen').forEach(function (diagram) {
        closePseudoFs(diagram);
        var btn = diagram.querySelector('.mermaid-fs-btn');
        if (btn) syncFsButton(diagram, btn);
      });
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

  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'show';
    clearTimeout(showToast._hideTimer);
    showToast._hideTimer = setTimeout(function () {
      toast.classList.remove('show');
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
      showToast(toastMsg || '已复制到剪贴板');
    }
    function onFail() {
      if (btn) flashCopyButton(btn, 'fail');
      showToast(failMsg || '复制失败，请手动选择文本');
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
          showToast(getCompleted().includes(id) ? '已标记本章完成' : '已取消完成标记');
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
    closeAllMermaidFullscreen();
    document.documentElement.setAttribute('data-theme', theme);
    storageSet(GLOBAL_THEME_KEY, theme);
    applyHljsTheme(theme);
    initMermaid();
    rerenderActiveMermaid();
  }

  function exportProgress() {
    const data = {
      courseId: slug,
      exportedAt: new Date().toISOString(),
      completedChapters: getCompleted(),
      visitedChapters: getVisited(),
      storage: collectExtraStorage(),
      theme: document.documentElement.getAttribute('data-theme'),
      uiStyle: document.documentElement.getAttribute('data-ui-style')
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
        if (data.visitedChapters) setVisited(data.visitedChapters);
        if (data.storage) applyExtraStorage(data.storage);
        if (data.theme) applyTheme(data.theme);
        if (data.uiStyle) applyUiStyle(data.uiStyle);
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

  function openTermModal(title, prompt) {
    var modal = document.getElementById('term-modal');
    document.getElementById('term-title').textContent = title;
    document.getElementById('term-prompt').textContent = prompt;
    resetCopyPromptButton();
    modal.showModal();
  }

  var SELECTION_PROMPT_MIN = 2;
  var SELECTION_PROMPT_MAX = 120;
  var DEFAULT_SELECTION_PROMPT_TEMPLATE =
    '我在学习{domain}，请解释一下「{selection}」，并结合示例说明常见用法与误区。';

  function isSelectionPromptEnabled() {
    var meta = COURSE_DATA.meta || {};
    return meta.selectionPromptEnabled !== false;
  }

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

  function buildSelectionPrompt(selection) {
    var meta = COURSE_DATA.meta || {};
    var tpl = meta.selectionPromptTemplate || DEFAULT_SELECTION_PROMPT_TEMPLATE;
    var domain = meta.domain || meta.title || '本课程';
    return tpl
      .replace(/\{domain\}/g, domain)
      .replace(/\{selection\}/g, selection)
      .replace(/\{title\}/g, meta.title || domain);
  }

  function initSelectionPrompt() {
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
  }

  function initTermModal() {
    var modal = document.getElementById('term-modal');
    document.body.addEventListener('click', function (e) {
      var term = e.target.closest('.term');
      if (!term) return;
      var id = term.getAttribute('data-term-id');
      var t = COURSE_DATA.terms[id];
      if (!t) return;
      openTermModal(t.label, t.prompt);
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

  function initChapterScrollHint() {
    var ticking = false;
    var scrollTarget = getScrollRoot() || window;
    scrollTarget.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          var section = document.querySelector('section[data-chapter].active');
          if (!section) return;
          var id = section.getAttribute('data-chapter');
          if (!id || getCompleted().includes(id) || markCompleteHintShown[id]) return;
          var root = getScrollRoot();
          var viewportBottom = root
            ? root.getBoundingClientRect().bottom
            : window.innerHeight;
          var sectionTop = section.getBoundingClientRect().top;
          var height = section.offsetHeight;
          if (height <= 0) return;
          var viewed = viewportBottom - sectionTop;
          if (viewed / height >= 0.82) {
            markCompleteHintShown[id] = true;
            showToast('读到这里了？做完测验后可点章首「标记完成」');
          }
        });
      },
      { passive: true }
    );
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
    initPortalNav();
    initUiStyleMenu();
    syncPageViewClass();
    var savedTheme = storageGet(GLOBAL_THEME_KEY) || storageGet(KEY_THEME) || 'light';
    if (!storageGet(GLOBAL_THEME_KEY) && storageGet(KEY_THEME)) {
      storageSet(GLOBAL_THEME_KEY, storageGet(KEY_THEME));
    }
    applyTheme(savedTheme);
    renderSidebar();
    bindInContentChapterLinks();
    renderOutlineSummary();
    bindCopyButtons();
    initTermModal();
    initSelectionPrompt();
    initMermaidFullscreen();
    injectMermaidFullscreenUi(document);
    bindMermaidFullscreen(document);
    initQuiz();
    initChapterTocControls();
    initChapterScrollHint();
    initMermaid();
    highlightIn(document);
    syncAllProgressUI();
    var hashId = chapterIdFromHash(location.hash);
    var lastScroll = storageGet(KEY_SCROLL);
    if (hashId && document.getElementById('ch-' + hashId)) {
      navigateToChapter(hashId, { updateHash: false });
    } else if (lastScroll && document.getElementById('ch-' + lastScroll)) {
      showChapter(lastScroll);
    } else {
      showWelcome();
    }
    window.addEventListener('hashchange', function () {
      var id = chapterIdFromHash(location.hash);
      if (id) navigateToChapter(id, { updateHash: false });
    });
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