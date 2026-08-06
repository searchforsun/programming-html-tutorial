import fs from 'fs';
import path from 'path';
import { reviewChapterPractice } from './practice-quality.mjs';
import { stripHtml, fuzzyTitleMatch, INVALID_TAG_RE } from './utils.mjs';

export function loadQualityConfig(skillRoot) {
  const p = path.join(skillRoot, 'config/chapter-quality.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function getChapterOutlineEntry(course, chapterId) {
  for (const phase of course.outline || []) {
    for (const ch of phase.chapters || []) {
      if (ch.id === chapterId) return ch;
    }
  }
  return null;
}

export function getChapterPhaseId(course, chapterId) {
  for (const phase of course.outline || []) {
    for (const ch of phase.chapters || []) {
      if (ch.id === chapterId) return phase.phaseId;
    }
  }
  return null;
}

export function extractH3Texts(html) {
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    out.push(stripHtml(m[1]));
  }
  return out;
}

export function countTerms(html) {
  return (html.match(/class="term"/g) || []).length;
}

export function extractTermIds(html) {
  const re = /data-term-id="([^"]+)"/g;
  const ids = new Set();
  let m;
  while ((m = re.exec(html))) ids.add(m[1]);
  return ids;
}

export function isTheoryChapter(phaseId, chapterId, config) {
  const theoryPhases = config.terms?.theoryPhaseIds || ['basics', 'advanced'];
  if (phaseId && theoryPhases.includes(phaseId)) return true;
  return /^(basics|advanced)-/.test(chapterId || '');
}

export function hasIllegalTags(html) {
  return INVALID_TAG_RE.test(html);
}

export function fixH5Check(html) {
  const parts = html.split(/<div class="mermaid-wrap">/i);
  if (parts.length === 1) return /<h5\b/i.test(html);
  let rest = parts[0];
  for (let i = 1; i < parts.length; i++) {
    const closeIdx = parts[i].indexOf('</div>');
    const end = closeIdx >= 0 ? closeIdx + 6 : parts[i].length;
    rest += parts[i].slice(end);
  }
  return /<h5\b/i.test(rest);
}

export function getQuizSection(quizHtml, chapterId) {
  if (!quizHtml) return null;
  const re = new RegExp(
    `<section[^>]*class="quiz-section"[^>]*data-chapter="${chapterId}"[\\s\\S]*?<\\/section>`,
    'i'
  );
  const m = quizHtml.match(re);
  return m ? m[0] : null;
}

export function quizHasTypes(quizSectionHtml, types) {
  const has = { single: false, multi: false, fill: false };
  if (/type="radio"/i.test(quizSectionHtml)) has.single = true;
  if (/type="checkbox"/i.test(quizSectionHtml)) has.multi = true;
  if (/class="fill-input"/i.test(quizSectionHtml)) has.fill = true;
  return types.every((t) => has[t]);
}

export function findQuizMetaKey(quizzes, chapterId) {
  if (!quizzes) return null;
  if (quizzes[`${chapterId}-quiz`]) return `${chapterId}-quiz`;
  for (const key of Object.keys(quizzes)) {
    if (quizzes[key]?.chapterId === chapterId) return key;
  }
  return null;
}

export function countSteps(html) {
  const m = html.match(/<ol class="steps">([\s\S]*?)<\/ol>/i);
  if (!m) return 0;
  return (m[1].match(/<li\b/gi) || []).length;
}

export function reviewChapter({
  html,
  chapterId,
  outlineChapter,
  quizHtml,
  quizzes,
  config,
  terms = {},
  phaseId = null,
}) {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  if (hasIllegalTags(html)) {
    errors.push('存在非法 HTML 标签（如 motion），会导致 DOM 断裂');
  }

  if (fixH5Check(html)) {
    errors.push('存在 .mermaid-wrap 外的 h5（对比列请用 .learn-compare-heading）');
  }

  if ((html.match(/<h3[^>]*>\s*动手练习/gi) || []).length > 1) {
    errors.push('存在多个「动手练习」h3，请合并为 .chapter-practice 下一处');
  }
  if (/<div class="demo-box">[\s\S]*?<h3\b/i.test(html)) {
    warnings.push('demo-box 内建议使用 h4.demo-box-title，避免与动手练习 h3 同级');
  }

  const termsCfg = config.terms || {};
  const isTheory = isTheoryChapter(phaseId, chapterId, config);
  const minSpans = isTheory
    ? (termsCfg.minSpansConcept ?? 8)
    : (termsCfg.minSpansPractice ?? 5);
  const minUnique = isTheory
    ? (termsCfg.minUniqueIdsConcept ?? 5)
    : (termsCfg.minUniqueIdsPractice ?? 3);
  const termCount = countTerms(html);
  const termIds = extractTermIds(html);
  if (termCount < minSpans) {
    warnings.push(
      `术语 .term 仅 ${termCount} 处（${isTheory ? '理论' : '实践'}章建议 ≥${minSpans}，见 reference/terms-policy.md）`
    );
  }
  if (termIds.size < minUnique) {
    warnings.push(`术语不同 data-term-id 仅 ${termIds.size} 个（建议 ≥${minUnique}）`);
  }
  const minPrompt = termsCfg.minPromptChars ?? 80;
  for (const id of termIds) {
    if (!terms[id]) {
      errors.push(`未知 data-term-id="${id}"，请写入 course.json → terms`);
    } else if ((terms[id].prompt || '').length < minPrompt) {
      warnings.push(`术语「${terms[id].label || id}」prompt 偏短（建议 ≥${minPrompt} 字）`);
    }
  }

  if (outlineChapter?.sections?.length) {
    const h3s = extractH3Texts(html);
    const knowledgeH3 = h3s.filter(
      (t) => !/动手练习|复习与自检|官方文档|延伸学习|章节测验/.test(t)
    );
    for (const sec of outlineChapter.sections) {
      const title = typeof sec === 'string' ? sec : sec.title || '';
      if (!knowledgeH3.some((h) => fuzzyTitleMatch(h, title))) {
        errors.push(`缺少与大纲对应的 h3：「${title}」`);
      }
    }
  }

  if (config.quiz?.requiredByDefault) {
    const section = getQuizSection(quizHtml, chapterId);
    const metaKey = findQuizMetaKey(quizzes, chapterId);
    if (!section) {
      errors.push('缺少章节测验：quiz.partial.html 中无匹配的 quiz-section');
    } else {
      const types = config.quiz.requireQuestionTypes || ['single', 'multi', 'fill'];
      if (!quizHasTypes(section, types)) {
        errors.push(`章节测验须含题型：${types.join('、')}`);
      }
      const qCount = (section.match(/class="quiz-item"/g) || []).length;
      const minQ = config.quiz.minQuestionsPerChapter ?? 4;
      if (qCount < minQ) {
        errors.push(`章节测验题目不足（${qCount}，至少 ${minQ}）`);
      }
    }
    if (!metaKey) {
      errors.push('course.json.quizzes 缺少该章元数据');
    }
  }

  const steps = countSteps(html);
  const minSteps = config.steps?.minCount ?? 3;
  if (steps > 0 && steps < minSteps) {
    warnings.push(`动手步骤仅 ${steps} 条（建议 ≥${minSteps}）`);
  }

  const needsEnrichmentJs =
    /\.learn-checklist|\.learn-param-slider/.test(html) &&
    !/initChapterEnrichment/.test(quizHtml || '');
  if (needsEnrichmentJs) {
    warnings.push(
      '使用了 checklist/slider，请在 welcome.partial.html 末尾内联脚本（见技能 templates/chapter-enrichment.js）'
    );
  }

  if (!/class="section-block"/.test(html) && outlineChapter?.sections?.length > 1) {
    suggestions.push('建议使用 .section-block 分区，与 outline.sections 对齐');
  }

  const pedagogy = config.pedagogy || {};
  if (pedagogy.requiredForConceptChapters !== false) {
    if (!/notice-why-learn/.test(html)) {
      errors.push('缺少 .notice-why-learn（为什么要学本章，见 reference/chapter-authoring.md）');
    }
    if (!/notice-outcome/.test(html)) {
      errors.push('缺少 .notice-outcome（学完你能，见 reference/chapter-authoring.md）');
    }
    if (!/chapter-conclusions-block/.test(html)) {
      errors.push('缺少 .chapter-conclusions-block（本章结论，见 reference/chapter-authoring.md）');
    } else {
      const listMatch = html.match(/<ul class="chapter-conclusions-list">([\s\S]*?)<\/ul>/i);
      const bullets = listMatch ? (listMatch[1].match(/<li\b/gi) || []).length : 0;
      const minBullets = Math.max(
        pedagogy.minConclusionBullets ?? 2,
        outlineChapter?.sections?.length || 0
      );
      if (bullets > 0 && bullets < minBullets) {
        warnings.push(
          `本章结论仅 ${bullets} 条，建议与 outline sections（${outlineChapter?.sections?.length || '?'}）条数一致`
        );
      }
    }
    if (!/chapter-meta/.test(html)) {
      warnings.push('建议增加 .chapter-meta（时长/阶段/能力，见 reference/chapter-authoring.md）');
    }
    if (!/learn-micro-check/.test(html)) {
      warnings.push('建议至少 1 处 .learn-micro-check（先想 10 秒）');
    }
    if (
      !/steps-judgment-list|steps-judgment/.test(html) &&
      /<div class="chapter-practice"/.test(html)
    ) {
      warnings.push('动手区缺少判断练习（ol.steps-judgment-list，或兼容 ol.steps.steps-judgment）');
    }
    if (/steps-judgment-list/.test(html) && !/learn-practice-answer/.test(html)) {
      warnings.push('判断练习缺少 .learn-practice-answer（每题须 <details> 折叠参考答案）');
    }

    const practiceReview = reviewChapterPractice({
      html,
      outlineChapter,
      phaseId,
      config,
    });
    errors.push(...(practiceReview.errors || []));
    warnings.push(...(practiceReview.warnings || []));
    suggestions.push(...(practiceReview.suggestions || []));

    if (
      /<div class="notice">\s*<strong>本章小结<\/strong>/.test(html) &&
      !/chapter-review-next/.test(html)
    ) {
      warnings.push('复习区建议用 p.chapter-review-next，避免与「本章结论」重复');
    }
  }

  return {
    chapterId,
    passed: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}
