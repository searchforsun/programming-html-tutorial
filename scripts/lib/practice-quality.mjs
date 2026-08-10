/**
 * 动手练习（.chapter-practice）质量：条数与正文/大纲对齐，拦截套模板。
 * 新 DOM：steps-operate + steps-judgment-list + learn-practice-answer（details 参考答案）。
 * 兼容旧版 ol.steps + ol.steps.steps-judgment。
 */

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function fuzzyTitleMatch(a, b) {
  const na = stripHtml(a).replace(/\s/g, '');
  const nb = stripHtml(b).replace(/\s/g, '');
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na) || na === nb;
}

export function extractChapterPractice(html) {
  const m = html.match(/<div class="chapter-practice">([\s\S]*?)<\/div>\s*(?=<div class="resources|$)/i);
  return m ? m[1] : '';
}

export function extractOperateStepsOl(practiceHtml) {
  return (
    practiceHtml.match(/<ol class="steps steps-operate">([\s\S]*?)<\/ol>/i) ||
    practiceHtml.match(/<ol class="steps">([\s\S]*?)<\/ol>/i)
  );
}

export function extractJudgmentListOl(practiceHtml) {
  return (
    practiceHtml.match(/<ol class="steps-judgment-list">([\s\S]*?)<\/ol>/i) ||
    practiceHtml.match(/<ol class="steps steps-judgment">([\s\S]*?)<\/ol>/i)
  );
}

export function countPracticeSteps(practiceHtml) {
  const m = extractOperateStepsOl(practiceHtml);
  if (!m) return 0;
  return (m[1].match(/<li\b/gi) || []).length;
}

export function countJudgmentSteps(practiceHtml) {
  const m = extractJudgmentListOl(practiceHtml);
  if (!m) return 0;
  return (m[1].match(/<li\b/gi) || []).length;
}

/** 统计带折叠参考答案的判断题数 */
export function countJudgmentAnswers(practiceHtml, minAnswerChars = 8) {
  const m = extractJudgmentListOl(practiceHtml);
  if (!m) return { total: 0, withAnswer: 0 };
  const lis = [...m[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
  let withAnswer = 0;
  for (const li of lis) {
    if (!/learn-practice-answer/.test(li[1]) || !/<details[\s>]/i.test(li[1])) continue;
    const body = li[1].match(/learn-practice-answer-body[^>]*>([\s\S]*?)<\/div>/i);
    if (body && stripHtml(body[1]).length >= minAnswerChars) withAnswer++;
  }
  return { total: lis.length, withAnswer };
}

/** 根据大纲节数 + 阶段建议理解步骤条数 */
export function suggestStepCounts(outlineChapter, phaseId, config = {}) {
  const n = outlineChapter?.sections?.length || 0;
  const cfg = config.practice || {};
  const isPracticePhase = phaseId === 'practice';
  const minSteps = cfg.minSteps ?? 3;
  const maxSteps = cfg.maxSteps ?? 8;
  const ratio = isPracticePhase
    ? (cfg.stepsPerSectionRatioPractice ?? 0.6)
    : (cfg.stepsPerSectionRatio ?? 0.5);
  const ideal = Math.max(minSteps, Math.min(maxSteps, Math.ceil(n * ratio)));
  const judgmentIdeal = n >= 5 ? 2 : 1;
  return { ideal, min: minSteps, max: maxSteps, judgmentIdeal, sectionCount: n };
}

function isDemoOnlyStep(liHtml) {
  const plain = stripHtml(liHtml);
  return (
    /demos\//i.test(plain) &&
    plain.length < 80 &&
    !/对照|填写|画|curl|mvn|配置|yaml|表|Mermaid/i.test(plain)
  );
}

function judgmentPlainFromOl(judgmentOlMatch) {
  if (!judgmentOlMatch) return '';
  const lis = [...judgmentOlMatch[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
  return lis.map((li) => stripHtml(li[1])).join('');
}

/**
 * @returns {{ errors: string[], warnings: string[], suggestions: string[] }}
 */
export function reviewChapterPractice({ html, outlineChapter, phaseId, config = {} }) {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  if (!/<div class="chapter-practice"/.test(html)) {
    return { errors, warnings, suggestions };
  }

  const practiceHtml = extractChapterPractice(html);
  const cfg = config.practice || {};
  const introMatch = practiceHtml.match(/<p class="steps-intro">([\s\S]*?)<\/p>/i);
  const introPlain = introMatch ? stripHtml(introMatch[1]) : '';

  for (const pat of cfg.boilerplateIntroPatterns || []) {
    if (introPlain && new RegExp(pat, 'i').test(introPlain)) {
      warnings.push(
        `动手练习 steps-intro 疑似套模板（匹配「${pat}」），应写本章具体产出（配置/表/命令）`
      );
      break;
    }
  }

  if (introPlain && introPlain.length < (cfg.minIntroChars ?? 18)) {
    warnings.push('动手练习 steps-intro 过短，建议写明本章要完成的可验收产出');
  }

  const steps = countPracticeSteps(practiceHtml);
  const judgments = countJudgmentSteps(practiceHtml);
  const { ideal, min, max, sectionCount } = suggestStepCounts(outlineChapter, phaseId, config);
  const usesNewDom = /steps-operate/.test(practiceHtml) || /steps-judgment-list/.test(practiceHtml);
  const usesLegacyJudgment = /steps steps-judgment/.test(practiceHtml) && !/steps-judgment-list/.test(practiceHtml);

  if (steps > 0 && steps < min) {
    warnings.push(`动手操作步骤 ${steps} 条（建议 ≥${min}，本章 ${sectionCount} 节 ideal≈${ideal}）`);
  }
  if (steps > max) {
    warnings.push(`动手操作步骤 ${steps} 条偏多（建议 ≤${max}）`);
  } else if (sectionCount >= 3 && steps > 0 && steps < ideal - 1) {
    suggestions.push(
      `大纲 ${sectionCount} 节，操作步骤 ${steps} 条偏少；建议 ≥${ideal} 条并覆盖 ≥2 节正文（表/图/配置）`
    );
  }

  if (judgments === 0) {
    warnings.push('动手区缺少判断练习（ol.steps-judgment-list，或兼容 ol.steps.steps-judgment）');
  } else if (sectionCount >= 5 && judgments < 2) {
    suggestions.push(`大纲 ${sectionCount} 节，可考虑 2 道判断题（排障 + 找错/权衡各一）`);
  }

  if (usesNewDom && !/practice-section-title/.test(practiceHtml)) {
    warnings.push('动手练习缺少 h4.practice-section-title（操作步骤 / 判断练习）');
  }

  if (/steps-judgment-list/.test(practiceHtml)) {
    const { total, withAnswer } = countJudgmentAnswers(
      practiceHtml,
      cfg.minJudgmentAnswerChars ?? 8
    );
    if (total > 0 && withAnswer < total) {
      warnings.push(
        `判断练习 ${total} 题中仅 ${withAnswer} 题含完整折叠参考答案（.learn-practice-answer > details > .learn-practice-answer-body）`
      );
    }
  } else if (usesLegacyJudgment) {
    suggestions.push(
      '动手练习仍用旧版 ol.steps.steps-judgment；新章请改用 steps-judgment-list + learn-practice-answer 折叠参考答案'
    );
  }

  const stepsOl = extractOperateStepsOl(practiceHtml);
  if (stepsOl) {
    const lis = [...stepsOl[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
    let demoOnly = 0;
    for (const li of lis) {
      if (isDemoOnlyStep(li[1])) demoOnly++;
    }
    const maxDemo = cfg.maxDemoOnlySteps ?? 1;
    if (demoOnly > maxDemo) {
      warnings.push(
        `操作步骤中 ${demoOnly} 条仅指向 demos/（建议 ≤${maxDemo}），其余应点名正文表/图/配置`
      );
    }
  }

  const judgmentOl = extractJudgmentListOl(practiceHtml);
  if (judgmentOl) {
    const jPlain = judgmentPlainFromOl(judgmentOl);
    for (const pat of cfg.boilerplateJudgmentPatterns || []) {
      if (new RegExp(pat, 'i').test(jPlain)) {
        suggestions.push(
          '判断题疑似重复「方案 A/B 各写支持反对」模板；可改为排障顺序、找错配置、补全 yaml 等'
        );
        break;
      }
    }
  }

  if (outlineChapter?.sections?.length) {
    const bucket =
      introPlain +
      stripHtml(stepsOl?.[1] || '') +
      judgmentPlainFromOl(judgmentOl);
    let covered = 0;
    for (const sec of outlineChapter.sections) {
      const title = typeof sec === 'string' ? sec : sec.title || '';
      const keyword = title.replace(/[：:（()）\s]/g, '').slice(0, 8);
      if (
        keyword.length >= 2 &&
        (fuzzyTitleMatch(bucket, keyword) || bucket.includes(keyword.slice(0, 4)))
      ) {
        covered++;
      }
    }
    const minCover = Math.min(2, outlineChapter.sections.length);
    if (covered < minCover && steps > 0) {
      suggestions.push(
        `动手练习与大纲节关联偏弱（约 ${covered}/${outlineChapter.sections.length} 节）；步骤宜点名正文 h3/表/配置`
      );
    }
  }

  const demoBox = practiceHtml.match(/<div class="demo-box">([\s\S]*?)<\/div>/i);
  if (demoBox) {
    const demoPlain = stripHtml(demoBox[1]);
    if (/demos\//i.test(demoPlain) && !/验收|期望|curl|mvn|UP|成功|命令/i.test(demoPlain)) {
      warnings.push('demo-box 仅有目录路径，建议补充验收标准（命令 + 期望输出）');
    }
  }

  return { errors, warnings, suggestions };
}
