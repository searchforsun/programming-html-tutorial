#!/usr/bin/env node
/**
 * 根据 course.json 与 chapterId 生成章节骨架 HTML。
 *
 * 用法:
 *   node scripts/generate-chapter-skeleton.mjs --dir courses/<slug> --chapter <chapterId>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as log from './lib/log.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..');

function parseArgs(argv) {
  const opts = { dir: null, chapter: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dir') opts.dir = argv[++i];
    else if (argv[i] === '--chapter') opts.chapter = argv[++i];
  }
  if (!opts.dir || !opts.chapter) {
    log.error('用法: node generate-chapter-skeleton.mjs --dir courses/<slug> --chapter <chapterId>');
    process.exit(1);
  }
  opts.dir = path.resolve(opts.dir);
  return opts;
}

function loadQualityConfig() {
  return JSON.parse(
    fs.readFileSync(path.join(SKILL_ROOT, 'config/chapter-quality.json'), 'utf8')
  );
}

function findChapter(course, chapterId) {
  for (const phase of course.outline || []) {
    for (const ch of phase.chapters || []) {
      if (ch.id === chapterId) return { chapter: ch, phase };
    }
  }
  return null;
}

function findNextChapterId(course, chapterId) {
  const ids = [];
  for (const phase of course.outline || []) {
    for (const ch of phase.chapters || []) {
      ids.push(ch.id);
    }
  }
  const idx = ids.indexOf(chapterId);
  return idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : null;
}

function findPrevChapterId(course, chapterId) {
  const ids = [];
  for (const phase of course.outline || []) {
    for (const ch of phase.chapters || []) {
      ids.push(ch.id);
    }
  }
  const idx = ids.indexOf(chapterId);
  return idx > 0 ? ids[idx - 1] : null;
}

function storageKey(slug, chapterId) {
  return `${slug}_${chapterId.replace(/-/g, '')}`;
}

function generate(opts) {
  const coursePath = path.join(opts.dir, 'course.json');
  if (!fs.existsSync(coursePath)) {
    log.error(`✗ 未找到 ${coursePath}`);
    process.exit(1);
  }
  const course = JSON.parse(fs.readFileSync(coursePath, 'utf8'));
  const slug = course.meta?.slug || path.basename(opts.dir);

  const found = findChapter(course, opts.chapter);
  if (!found) {
    log.error(`✗ chapterId "${opts.chapter}" 在 course.json 中不存在`);
    process.exit(1);
  }
  const { chapter, phase } = found;
  const sections = chapter.sections || [];

  const quality = loadQualityConfig();
  const minConclusionBullets = quality.pedagogy?.minConclusionBullets ?? 2;
  const minSteps = quality.practice?.minSteps ?? 3;

  const chaptersDir = path.join(opts.dir, 'chapters');
  const outPath = path.join(chaptersDir, `${opts.chapter}.html`);

  if (!fs.existsSync(chaptersDir)) {
    fs.mkdirSync(chaptersDir, { recursive: true });
  }
  if (fs.existsSync(outPath)) {
    log.warn(`✗ 文件已存在: ${outPath}`);
    log.info('  请删除后重试，或使用不同 chapterId');
    process.exit(1);
  }

  const nextId = findNextChapterId(course, opts.chapter);
  const prevId = findPrevChapterId(course, opts.chapter);
  const nextTitle = nextId ? (course.chapters?.[nextId]?.title || nextId) : null;
  const prevTitle = prevId ? (course.chapters?.[prevId]?.title || prevId) : null;

  // 生成 section-block 列表
  const sectionBlocks = sections.map((title, i) => {
    const num = i + 1;
    return `    <div class="section-block">
      <h3>${escapeHtml(title)}</h3>
      <!-- TODO: 填充本节正文内容（concept / code-block / mermaid-wrap / steps 等） -->
      <p>${escapeHtml(title)} 的核心概念与示例待填充。</p>
    </div>`;
  }).join('\n\n');

  // 结论块
  const conclusionItems = Array.from({ length: minConclusionBullets }, (_, i) =>
    `        <li><strong>{TODO: 结论 ${i + 1}}</strong>：请对应上方「${escapeHtml(sections[i] || `小节 ${i + 1}`)}」总结核心要点</li>`
  ).join('\n');

  // checklist
  const checklistItems = sections.map((title, i) =>
    `          <li><label><input type="checkbox" data-id="item${i + 1}" /> 能掌握「${escapeHtml(title)}」</label></li>`
  ).join('\n');
  const checklistCount = sections.length + 1;

  // 操作步骤
  const stepItems = Array.from({ length: minSteps }, (_, i) =>
    `      <li>{TODO: 操作步骤 ${i + 1}}</li>`
  ).join('\n');

  // 复习链接文案
  const reviewNext = nextTitle
    ? `下一步：勾选过关清单、完成右侧测验与下方 Demo；继续 <a href="#ch-${nextId}">${escapeHtml(nextTitle)}</a>。`
    : '下一步：勾选过关清单、完成右侧测验与下方 Demo。本阶段最后一章！';

  const nextChapterLink = nextTitle
    ? `<li><strong>下一章</strong>：<a href="#ch-${nextId}">${escapeHtml(nextTitle)}</a></li>`
    : '';

  const prevChapterLink = prevTitle
    ? `<li><strong>上一章</strong>：<a href="#ch-${prevId}">${escapeHtml(prevTitle)}</a></li>`
    : '';

  const html = `<section id="ch-${opts.chapter}" class="chapter" data-chapter="${opts.chapter}">
  <header class="chapter-header">
    <h2><span class="chapter-done-badge">已完成</span>${escapeHtml(chapter.title)}</h2>
    <button type="button" class="btn-mark-done" data-chapter="${opts.chapter}" aria-label="标记本章完成">标记完成</button>
  </header>

  <div class="concept">
    <div class="chapter-intro content-section">
      <p class="chapter-meta">约 <strong>XX 分钟</strong> · 阶段：<strong>${escapeHtml(phase.phaseTitle || phase.phaseId)}</strong> · 能力：{TODO: 一句话能力总结}</p>
      <div class="notice notice-why-learn">
        <strong>为什么要学本章</strong>
        <p>{TODO: 填充学习动机 —— 本章在课程中的位置、解决什么实际问题}</p>
      </div>
      <div class="notice notice-outcome">
        <strong>学完你能</strong>
        <ul>
          <li>{TODO: 学习目标 1}</li>
          <li>{TODO: 学习目标 2}</li>
          <li>{TODO: 学习目标 3}</li>
        </ul>
      </div>
      <div class="notice">
        <strong>本章先记住 ${Math.min(3, sections.length)} 件事</strong>
        <ul>
${sections.slice(0, 3).map((t, i) => `          <li><strong>${escapeHtml(t)}</strong> — {TODO: 一句话核心要点}</li>`).join('\n')}
        </ul>
      </div>
    </div>

${sectionBlocks}

    <div class="section-block chapter-conclusions-block notice">
      <h3>本章结论</h3>
      <p class="chapter-conclusions-lead">放在正文与复习之间，便于你先串起全章再做题。每条对应上文一个小节标题。</p>
      <ul class="chapter-conclusions-list">
${conclusionItems}
      </ul>
    </div>

    <div class="section-block learn-review-block">
      <h3>复习与自检</h3>
      <div class="learn-checklist" data-storage-key="${storageKey(slug, opts.chapter)}">
        <p class="learn-checklist-lead">过关清单（勾选会保存在本浏览器）</p>
        <p class="learn-checklist-progress" aria-live="polite">0 / ${checklistCount} 已勾选</p>
        <ul>
${checklistItems}
          <li><label><input type="checkbox" data-id="quiz-done" /> 已完成右侧「章节测验」</label></li>
        </ul>
      </div>
      <p class="chapter-review-next">${reviewNext}</p>
    </div>
  </div>

  <div class="official-links content-section">
    <h3>官方文档</h3>
    <ul>
      <li><a href="{TODO: 官方文档URL}" target="_blank" rel="noopener">{TODO: 文档标题}</a></li>
    </ul>
  </div>

  <div class="chapter-practice">
    <h3>动手练习</h3>
    <p class="steps-intro">{TODO: 练习引入，至少 18 字符 —— 说明练习目标与产出}</p>
    <h4 class="practice-section-title">操作步骤</h4>
    <ol class="steps steps-operate">
${stepItems}
    </ol>
    <h4 class="practice-section-title">判断练习</h4>
    <ol class="steps-judgment-list">
      <li>
        <p class="judgment-stem">{TODO: 判断情景描述}</p>
        <div class="learn-practice-answer">
          <details>
            <summary>参考答案</summary>
            <div class="learn-practice-answer-body"><p>{TODO: 答案}</p></div>
          </details>
        </div>
      </li>
      <li>
        <p class="judgment-stem">{TODO: 判断情景描述}</p>
        <div class="learn-practice-answer">
          <details>
            <summary>参考答案</summary>
            <div class="learn-practice-answer-body"><p>{TODO: 答案}</p></div>
          </details>
        </div>
      </li>
    </ol>
    <div class="demo-box">
      <h4 class="demo-box-title">Demo：${escapeHtml(chapter.title)} 实验室</h4>
      <p>目录：<code>demos/${opts.chapter}-lab/</code>。<strong>验收</strong>：{TODO: 验收标准}</p>
    </div>
  </div>

  <div class="resources content-section">
    <h3>延伸学习</h3>
    <ul>
${prevChapterLink ? `      ${prevChapterLink}\n` : ''}${nextChapterLink ? `      ${nextChapterLink}\n` : ''}    </ul>
  </div>
</section>
`;

  // ── 智能预填充 ──
  let finalHtml = html;
  const enriched = enrichSkeleton(finalHtml, course, chapter, phase);
  if (enriched !== finalHtml) {
    finalHtml = enriched;
    log.success('  已应用智能预填充：术语联动 / 阶段能力 / 官方文档');
  }

  fs.writeFileSync(outPath, finalHtml, { encoding: 'utf8' });
  log.success(`✓ 章节骨架已生成: ${outPath}`);
  log.info(`  章节: ${chapter.title}`);
  log.info(`  小节数: ${sections.length}`);
  log.info(`  阶段: ${phase.phaseTitle || phase.phaseId}`);
  log.info(`\n  TODO 清单:`);
  log.info(`  - 填充 chapter-meta 中的时间与能力描述`);
  log.info(`  - 填充 notice-why-learn 与 notice-outcome`);
  log.info(`  - 填充 ${sections.length} 个 section-block 正文`);
  log.info(`  - 填充 ${minConclusionBullets} 条结论`);
  log.info(`  - 填充 ${minSteps} 个操作步骤`);
  log.info(`  - 填充 2 条判断题`);
  log.info(`  - 填充 official-links 链接`);
  log.info(`  - 填充 steps-intro 与 demo-box 验收标准`);
  console.log(`  - 在 quiz.partial.html 中补充本章测验（至少 ${quality.quiz?.minQuestionsPerChapter ?? 4} 题）`);
}

/**
 * 智能预填充：根据 course.json 数据增强骨架 HTML
 *   1. 术语联动 — section title 匹配 term.label → 自动加 data-term-id
 *   2. 阶段能力总结 — phaseId 映射到一句话描述
 *   3. 官方文档 — domain 关键词推断技术栈文档 URL
 */
function enrichSkeleton(html, course, chapter, phase) {
  let result = html;

  // ── 1. 术语联动 ──
  const terms = course.terms || {};
  for (const [termId, term] of Object.entries(terms)) {
    const label = term.label || termId;
    // 在「本章先记住」区域中，如果 TODO 行包含与 term.label 匹配的 section title
    // 替换为带 data-term-id 的 span
    const todoPattern = new RegExp(
      `(<strong>${escapeRegex(label)}</strong> — )\\{TODO: 一句话核心要点\\}`,
      'g'
    );
    result = result.replace(todoPattern, `$1<span class="term" data-term-id="${termId}">${escapeHtml(term.label || termId)}</span>`);
  }

  // 对每个 section-block 中的 h3 标题，尝试匹配术语
  for (const [termId, term] of Object.entries(terms)) {
    const label = term.label || termId;
    // 如果 section-block 的 h3 文本与术语 label 匹配，在 TODO 正文中注入术语提示
    const sectionPattern = new RegExp(
      `(<h3>${escapeRegex(label)}</h3>\\s*<!-- TODO:[^>]*-->\\s*)<p>`,
      'g'
    );
    result = result.replace(sectionPattern, `$1<p>涉及术语 <span class="term" data-term-id="${termId}">${escapeHtml(label)}</span>。`);
  }

  // ── 2. 阶段能力总结 ──
  const phaseAbilityMap = {
    basics: `理解${escapeHtml(chapter.title)}的核心概念与基础用法，为后续深入学习打下坚实基础`,
    practice: `掌握${escapeHtml(chapter.title)}的实际开发模式与最佳实践，能独立完成相关功能实现`,
    advanced: `深入${escapeHtml(chapter.title)}的底层原理，具备独立排障与架构设计能力`,
  };
  const phaseId = phase.phaseId || '';
  const abilityText = phaseAbilityMap[phaseId]
    || `掌握${escapeHtml(chapter.title)}的核心知识点，能够应用到实际项目中`;
  result = result.replace(
    /\{TODO: 一句话能力总结\}/g,
    escapeHtml(abilityText)
  );

  // ── 3. 官方文档自动填充 ──
  const domain = (course.meta?.domain || '').toLowerCase();
  const slug = (course.meta?.slug || '').toLowerCase();
  const combined = `${domain} ${slug}`;

  const techDocMap = {
    java:       { url: 'https://docs.oracle.com/en/java/', title: 'Java 官方文档 (Oracle)' },
    spring:     { url: 'https://docs.spring.io/spring-framework/reference/', title: 'Spring Framework 官方文档' },
    mysql:      { url: 'https://dev.mysql.com/doc/refman/8.4/en/', title: 'MySQL 8.4 参考手册' },
    redis:      { url: 'https://redis.io/docs/latest/', title: 'Redis 官方文档' },
    kafka:      { url: 'https://kafka.apache.org/documentation/', title: 'Apache Kafka 官方文档' },
    docker:     { url: 'https://docs.docker.com/', title: 'Docker 官方文档' },
    kubernetes: { url: 'https://kubernetes.io/docs/home/', title: 'Kubernetes 官方文档' },
    python:     { url: 'https://docs.python.org/3/', title: 'Python 3 官方文档' },
    javascript: { url: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript', title: 'MDN JavaScript 指南' },
    golang:     { url: 'https://go.dev/doc/', title: 'Go 官方文档' },
    vue:        { url: 'https://cn.vuejs.org/guide/introduction.html', title: 'Vue.js 官方文档' },
    react:      { url: 'https://react.dev/', title: 'React 官方文档' },
    linux:      { url: 'https://docs.kernel.org/', title: 'Linux 内核文档' },
    nginx:      { url: 'https://nginx.org/en/docs/', title: 'Nginx 官方文档' },
  };

  let matchedDoc = null;
  for (const [keyword, doc] of Object.entries(techDocMap)) {
    if (combined.includes(keyword)) {
      matchedDoc = doc;
      break;
    }
  }

  if (matchedDoc) {
    result = result.replace(
      /<a href="\{TODO: 官方文档URL\}"[^>]*>\{TODO: 文档标题\}<\/a>/g,
      `<a href="${matchedDoc.url}" target="_blank" rel="noopener">${matchedDoc.title}</a>`
    );
  }

  return result;
}

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const opts = parseArgs(process.argv);
generate(opts);
