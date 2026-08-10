#!/usr/bin/env node
/**
 * 术语提示质量检查：对 course.json 中每个 term 的 prompt 做深度审查。
 *
 * 用法：
 *   node scripts/check-term-prompts.mjs --dir courses/<slug>
 *   node scripts/check-term-prompts.mjs --dir courses/<slug> --json   （JSON 输出）
 *
 * 检查维度：
 *   1. 长度阈值（≥ quality.json 中 minPromptChars，默认 80）
 *   2. 关键词覆盖率：示例 / 场景 / 误区 / 对比 / 结合（业务名） / 风险 / 方案
 *   3. 课程上下文关联：是否提及 course.meta.domain 或课程 slug 对应业务场景
 *   4. 结构性：是否在开头声明学习上下文（"我在学习…"），是否在末尾包含示例/误区指令
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as log from './lib/log.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..');

const QUALITY_CONFIG_PATH = path.join(SKILL_ROOT, 'config', 'chapter-quality.json');

/** ── 关键词分组 ── */
const KEYWORD_GROUPS = {
  example: [/示例/, /例如/, /举个/, /案例/, /以\S{2,4}为例/, /场景/],
  pitfall: [/误区/, /陷阱/, /常见错/, /注意/, /风险/, /易忽略/],
  contrast: [/对比/, /区别/, /不同于/, /不同于/, /差异/, /VS\b/i, /相比/],
  context: [/结合/, /在\s*\S+/, /课/, /ShopFlow/i, /实战/],
  solution: [/方案/, /手段/, /方法/, /策略/, /应对/, /缓解/, /补偿/],
  why: [/为何/, /为什么/, /原因/, /必要性/],
};

const STRUCTURAL_CHECKS = {
  learningContext: /^我在学习/,
  askForExample: /示例|例子|举例|场景/,
  askForPitfall: /误区|陷阱|常见错误|风险|注意/,
};

function loadQualityConfig() {
  return JSON.parse(fs.readFileSync(QUALITY_CONFIG_PATH, 'utf8'));
}

function loadCourse(coursePath) {
  if (!fs.existsSync(coursePath)) {
    log.error(`Missing course.json: ${coursePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(coursePath, 'utf8'));
}

/**
 * 检查单个 prompt
 * @returns {{ termId, label, prompt, issues: string[], score: number, keywordHits: object }}
 */
function checkPrompt(termId, term, courseMeta, minChars) {
  const prompt = (term.prompt || '').trim();
  const issues = [];
  const hits = {};

  if (!prompt) {
    return { termId, label: term.label || termId, prompt, issues: ['prompt 为空'], score: 0, keywordHits: {} };
  }

  // 1. 长度
  if (prompt.length < minChars) {
    issues.push(`长度不足：${prompt.length} 字（建议 ≥${minChars}）`);
  }

  // 2. 关键词覆盖
  for (const [group, patterns] of Object.entries(KEYWORD_GROUPS)) {
    const matched = patterns.filter((re) => re.test(prompt));
    hits[group] = matched.length;
  }

  const coveredGroups = Object.values(hits).filter((n) => n > 0).length;
  if (coveredGroups < 3) {
    issues.push(`关键词维度覆盖不足：仅覆盖 ${coveredGroups}/6 组（示例/误区/对比/上下文/方案/原因），建议 ≥3`);
  }

  // 3. 课程上下文关联
  const domain = courseMeta.domain || courseMeta.slug || '';
  const domainPattern = new RegExp(domain.replace(/[.*+?^${}()|[\]\\]/g, ''), 'i');
  const slugPattern = new RegExp((courseMeta.slug || '').replace(/[-_]/g, '[-_]?'), 'i');
  if (domain && !domainPattern.test(prompt) && !slugPattern.test(prompt)) {
    issues.push(`prompt 未提及课程领域「${domain}」，建议关联课程上下文以提升术语解释的针对性`);
  }

  // 4. 结构性检查
  if (!STRUCTURAL_CHECKS.learningContext.test(prompt)) {
    issues.push('缺少学习上下文开头（建议以「我在学习…」起始）');
  }
  if (!STRUCTURAL_CHECKS.askForExample.test(prompt)) {
    issues.push('未要求 AI 给出示例/场景，建议要求「给出示例说明」');
  }
  if (!STRUCTURAL_CHECKS.askForPitfall.test(prompt)) {
    issues.push('未要求 AI 指出误区/常见错误，建议要求「列举常见误区」');
  }

  // 评分：满分 100
  let score = 100;
  if (prompt.length < minChars) score -= Math.min(25, Math.floor((minChars - prompt.length) / 5));
  if (coveredGroups < 3) score -= (3 - coveredGroups) * 10;
  if (!STRUCTURAL_CHECKS.learningContext.test(prompt)) score -= 10;
  if (!STRUCTURAL_CHECKS.askForExample.test(prompt)) score -= 10;
  if (!STRUCTURAL_CHECKS.askForPitfall.test(prompt)) score -= 10;
  score = Math.max(0, score);

  return { termId, label: term.label || termId, prompt, issues, score, keywordHits: hits };
}

function parseArgs(argv) {
  const opts = { dir: null, json: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dir') opts.dir = argv[++i];
    else if (argv[i] === '--json') opts.json = true;
  }
  if (!opts.dir) {
    log.error('用法: node check-term-prompts.mjs --dir courses/<slug> [--json]');
    process.exit(1);
  }
  opts.dir = path.resolve(opts.dir);
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  const qualityConfig = loadQualityConfig();
  const minChars = qualityConfig.terms?.minPromptChars ?? 80;
  const course = loadCourse(path.join(opts.dir, 'course.json'));
  const terms = course.terms || {};

  if (Object.keys(terms).length === 0) {
    log.info('该课程无术语定义（course.json.terms 为空）。');
    process.exit(0);
  }

  const results = [];
  for (const [id, term] of Object.entries(terms)) {
    results.push(checkPrompt(id, term, course.meta, minChars));
  }

  const passed = results.filter((r) => r.issues.length === 0).length;
  const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);

  if (opts.json) {
    log.info(JSON.stringify({ total: results.length, passed, avgScore, results }, null, 2));
  } else {
    log.info(`\n术语提示质量检查报告`);
    log.info(`课程：${course.meta.title || course.meta.slug}`);
    log.info(`术语总数：${results.length}  |  通过：${passed}  |  平均分：${avgScore}/100`);
    log.info(`最低字数要求：${minChars} 字`);
    log.plain('═'.repeat(72));

    for (const r of results) {
      const status = r.issues.length === 0 ? '✅' : '⚠️';
      log.plain(`\n${status} [${r.score}/100] ${r.label} (${r.termId})`);
      log.info(`  字数：${r.prompt.length}  |  维度：示例${r.keywordHits.example ? '✓' : '✗'} 误区${r.keywordHits.pitfall ? '✓' : '✗'} 对比${r.keywordHits.contrast ? '✓' : '✗'} 上下文${r.keywordHits.context ? '✓' : '✗'} 方案${r.keywordHits.solution ? '✓' : '✗'} 原因${r.keywordHits.why ? '✓' : '✗'}`);
      for (const issue of r.issues) {
        log.warn(`  ⮑ ${issue}`);
      }
    }

    log.plain(`\n${'═'.repeat(72)}`);
    if (passed === results.length) {
      log.success('✓ 全部术语通过质量检查。');
    } else {
      log.warn(`⚠️  ${results.length - passed} 个术语需改进（详见上方）。`);
      process.exitCode = 1;
    }
  }
}

main();
