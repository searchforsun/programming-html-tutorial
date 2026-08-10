#!/usr/bin/env node
/**
 * 一键修复源文件编码问题：去除 BOM、检测并报告乱码损坏。
 *
 * 用法：
 *   node scripts/fix-encoding.mjs --dir <project>/courses/<slug>
 *   node scripts/fix-encoding.mjs --dir <project>/courses/<slug> --dry-run
 *   node scripts/fix-encoding.mjs --all                          # 扫描所有课程目录
 *
 * 行为：
 *   1. 去除所有源文件的 UTF-8 BOM（写入修复）
 *   2. 检测 U+FFFD 替换符与连续问号（仅报告，不自动修改——已损坏无法自动恢复）
 *   3. --dry-run 只扫描不写入
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as log from './lib/log.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..');

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);

/**
 * 检测文件是否以 UTF-8 BOM 开头
 */
function hasBom(buf) {
  return buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
}

/**
 * 检测文本中是否存在编码损坏迹象
 * @returns {{ issues: string[], corrupt: boolean }}
 */
function detectCorruption(text, label) {
  const issues = [];
  if (!text) return { issues, corrupt: false };

  // U+FFFD 替换符：文件曾以错误编码读取后保存
  if (text.includes('\uFFFD')) {
    issues.push(`${label}: 含 UTF-8 替换符 (U+FFFD)，文件可能在错误编码下保存过，无法自动修复`);
  }

  // 连续 4 个以上问号：常见于 PowerShell 写坏中文
  const qm = text.match(/\?{4,}/g);
  if (qm) {
    issues.push(
      `${label}: 含 ${qm.length} 处连续问号（如「${qm[0].slice(0, 12)}…」），常见于 PowerShell / 错误编码写坏中文，无法自动修复`
    );
  }

  return { issues, corrupt: issues.length > 0 };
}

/**
 * 修复单个源文件的 BOM
 * @returns {{ fixed: boolean, error?: string }}
 */
function fixFile(filePath, dryRun) {
  if (!fs.existsSync(filePath)) return { fixed: false };

  let buf;
  try {
    buf = fs.readFileSync(filePath);
  } catch (e) {
    return { fixed: false, error: `读取失败: ${e.message}` };
  }

  if (!hasBom(buf)) return { fixed: false };

  if (!dryRun) {
    try {
      fs.writeFileSync(filePath, buf.slice(3), 'utf8');
    } catch (e) {
      return { fixed: false, error: `写入失败: ${e.message}` };
    }
  }

  return { fixed: true };
}

/**
 * 收集课程目录下所有需要修复的源文件
 */
function collectSourceFiles(courseDir) {
  const files = [];

  // course.json
  const coursePath = path.join(courseDir, 'course.json');
  if (fs.existsSync(coursePath)) files.push(coursePath);

  // theme.css
  const themePath = path.join(courseDir, 'theme.css');
  if (fs.existsSync(themePath)) files.push(themePath);

  // welcome.partial.html
  const welcomePath = path.join(courseDir, 'welcome.partial.html');
  if (fs.existsSync(welcomePath)) files.push(welcomePath);

  // quiz.partial.html
  const quizPath = path.join(courseDir, 'quiz.partial.html');
  if (fs.existsSync(quizPath)) files.push(quizPath);

  // chapters/*.html
  const chaptersDir = path.join(courseDir, 'chapters');
  if (fs.existsSync(chaptersDir)) {
    const chapterFiles = fs
      .readdirSync(chaptersDir)
      .filter((f) => f.endsWith('.html'))
      .sort()
      .map((f) => path.join(chaptersDir, f));
    files.push(...chapterFiles);
  }

  return files;
}

function scanCourse(courseDir, dryRun) {
  const rel = path.relative(SKILL_ROOT, courseDir);
  log.info(`\n${dryRun ? '[DRY-RUN] ' : ''}扫描: ${rel}`);

  const files = collectSourceFiles(courseDir);
  if (files.length === 0) {
    log.info('  无源文件');
    return { bomFixed: 0, corruptionFiles: [] };
  }

  let bomFixed = 0;
  const corruptionFiles = [];

  for (const file of files) {
    const label = path.relative(courseDir, file);

    // 1. BOM 修复
    const result = fixFile(file, dryRun);
    if (result.fixed) {
      log.info(`  ${dryRun ? '[将] 去除 BOM' : '已去除 BOM'}: ${label}`);
      bomFixed++;
    }
    if (result.error) {
      log.error(`  错误: ${label}: ${result.error}`);
    }

    // 2. 损坏检测（从文件读取文本，不含 BOM）
    let text;
    try {
      const buf = fs.readFileSync(file);
      text = buf.toString('utf8');
    } catch {
      continue;
    }
    const { issues } = detectCorruption(text, label);
    for (const issue of issues) {
      log.warn(`  ⚠ ${issue}`);
    }
    if (issues.length > 0) {
      corruptionFiles.push({ label, issues });
    }
  }

  return { bomFixed, corruptionFiles };
}

function collectAllCourseDirs(root) {
  const coursesRoot = path.join(root, 'courses');
  if (!fs.existsSync(coursesRoot)) {
    // 也可能是课程根目录本身
    if (fs.existsSync(path.join(root, 'course.json'))) {
      return [root];
    }
    return [];
  }

  const dirs = [];
  const entries = fs.readdirSync(coursesRoot, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      const sub = path.join(coursesRoot, e.name);
      if (fs.existsSync(path.join(sub, 'course.json'))) {
        dirs.push(sub);
      }
      // 也检查子目录（如 courses/sub/slug/）
      const subEntries = fs.readdirSync(sub, { withFileTypes: true });
      for (const se of subEntries) {
        if (se.isDirectory()) {
          const deep = path.join(sub, se.name);
          if (fs.existsSync(path.join(deep, 'course.json'))) {
            dirs.push(deep);
          }
        }
      }
    }
  }

  // 也可能直接是某个课程目录
  if (dirs.length === 0 && fs.existsSync(path.join(root, 'course.json'))) {
    dirs.push(root);
  }

  return dirs;
}

function parseArgs(argv) {
  const opts = { dir: null, dryRun: false, all: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dir') opts.dir = argv[++i];
    else if (argv[i] === '--dry-run') opts.dryRun = true;
    else if (argv[i] === '--all') opts.all = true;
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);

  if (!opts.dir && !opts.all) {
    log.error('用法: node scripts/fix-encoding.mjs --dir <课程目录> [--dry-run]');
    log.info('      node scripts/fix-encoding.mjs --all [--dry-run]');
    process.exit(1);
  }

  const dirs = opts.all ? collectAllCourseDirs(SKILL_ROOT) : [path.resolve(opts.dir)];
  if (dirs.length === 0) {
    log.error('未找到任何课程目录');
    process.exit(1);
  }

  let totalBomFixed = 0;
  let totalCorruptionFiles = 0;

  for (const dir of dirs) {
    const { bomFixed, corruptionFiles } = scanCourse(dir, opts.dryRun);
    totalBomFixed += bomFixed;
    totalCorruptionFiles += corruptionFiles.length;
  }

  log.plain(`\n${'═'.repeat(50)}`);
  log.info(`汇总: ${totalBomFixed} 个文件${opts.dryRun ? '需' : '已'}去除 BOM，${totalCorruptionFiles} 个文件有编码损坏迹象`);
  if (totalCorruptionFiles > 0) {
    log.warn('⚠ 编码损坏文件无法自动修复，需要使用正确的 UTF-8 源文件重新覆盖');
    process.exit(1);
  }
  if (opts.dryRun) {
    log.info('（--dry-run 模式，未实际修改任何文件）');
  }
  log.plain();
}

main();
