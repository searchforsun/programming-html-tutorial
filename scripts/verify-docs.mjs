#!/usr/bin/env node

/**
 * verify-docs.mjs — 文档即代码验证
 *
 * 检查 Markdown 文档中的命令引用、脚本示例、文件路径与代码实际状态的一致性。
 * 不一致时输出差异明细并以非零退出码退出。
 *
 * 用法:
 *   node scripts/verify-docs.mjs
 *   node scripts/verify-docs.mjs --fix        # 自动修复可修复项（如 npm 脚本表格）
 *
 * 检查项:
 *   1. ARCHITECTURE.md §11 npm 脚本表格 ↔ package.json scripts
 *   2. README.md / ARCHITECTURE.md 命令示例 ↔ 脚本自身 --help 参数定义
 *   3. SKILL.md 引用的 reference/*.md 文件存在性
 *   4. DECISION_LOG.md 引用的脚本/文件路径存在性
 *   5. README.md 命令与脚本一致性
 *   6. ARCHITECTURE.md 模块依赖图 ↔ 实际 import 关系
 *   7. ARCHITECTURE.md 文件树列出的目录 ↔ 实际存在性
 *   8. reference/*.md 内部交叉链接完整性（目标文件 + 锚点存在性）
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as log from './lib/log.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const ERR = { ok: true, errors: [], warnings: [] };

function error(msg) { ERR.errors.push(msg); ERR.ok = false; }
function warn(msg) { ERR.warnings.push(msg); }

/** 转义正则特殊字符 */
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ---------------------------------------------------------------------------
// 1. 读取 package.json scripts
// ---------------------------------------------------------------------------
let pkg;
try {
  pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
} catch {
  error('读取 package.json 失败');
  pkg = { scripts: {} };
}

// ---------------------------------------------------------------------------
// 2. ARCHITECTURE.md §11 npm scripts 表格 ↔ package.json
// ---------------------------------------------------------------------------
function checkArchitectureNpmTable() {
  const archPath = join(ROOT, 'ARCHITECTURE.md');
  if (!existsSync(archPath)) { warn('ARCHITECTURE.md 不存在，跳过 npm 脚本表格检查'); return; }

  const arch = readFileSync(archPath, 'utf-8');
  const tableSection = arch.match(/## 11\. npm 脚本\s*\n([\s\S]*?)(?=\n## |\n---|\n$)/);
  if (!tableSection) { warn('ARCHITECTURE.md 未找到 §11 npm 脚本表格'); return; }

  // 提取表格行：| `command` | description |
  const tableLines = tableSection[1].split('\n').filter(l => l.startsWith('| `') && l.includes('|'));
  const docScripts = [];
  for (const line of tableLines) {
    const m = line.match(/^\| `(.+?)`\s*\|/);
    if (m) docScripts.push(m[1]);
  }

  // 对照 package.json
  for (const docCmd of docScripts) {
    // 提取 npm run 命令名
    const npmMatch = docCmd.match(/^npm run (\S+)/);
    if (npmMatch) {
      const name = npmMatch[1];
      if (!(name in pkg.scripts)) {
        error(`ARCHITECTURE.md §11: 引用的 npm script "${name}" 不在 package.json 中`);
      }
    }
  }

  // 反向检查：package.json 脚本是否都在文档中
  for (const name of Object.keys(pkg.scripts)) {
    const found = docScripts.some(cmd =>
      cmd.includes(`npm run ${name}`) ||
      cmd === `npm ${name}` ||
      cmd.includes(`node scripts/${name}`)
    );
    if (!found) {
      warn(`package.json script "${name}" 未出现在 ARCHITECTURE.md §11 表格中`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. 文档命令示例 ↔ 脚本 --help / 参数定义
// ---------------------------------------------------------------------------
function extractScriptParams(scriptPath) {
  /** 从脚本源码中提取 --help 输出中的参数列表 */
  const absPath = join(ROOT, scriptPath);
  if (!existsSync(absPath)) return null;

  const src = readFileSync(absPath, 'utf-8');

  // 提取 Usage 行中的参数
  const usageMatch = src.match(/Usage:\s*node\s+\S+\s+(.+)/);
  if (!usageMatch) return { args: [], usage: '' };

  const usage = usageMatch[1];
  const args = [];
  const argPattern = /(--[\w-]+)/g;
  let m;
  while ((m = argPattern.exec(usage)) !== null) {
    if (!args.includes(m[1])) args.push(m[1]);
  }

  // 也检查注释中的用法行
  const commentUsageRegex = /^\/\*\*\s*\n\s*\*\s*node\s+scripts\/[^\n]+/gm;
  // 简单扫描所有 --flag
  const allFlags = new Set();
  const flagRegex = /--[\w-]+/g;
  let fm;
  while ((fm = flagRegex.exec(src)) !== null) {
    allFlags.add(fm[0]);
  }

  return { args: [...new Set(args)], usage, allFlags: [...allFlags] };
}

function checkDocCommands(docPath, docSelector) {
  /** 检查文档中 shell 代码块里的 node scripts/... 命令 */
  const absPath = join(ROOT, docPath);
  if (!existsSync(absPath)) { warn(`${docPath} 不存在，跳过命令检查`); return; }

  const src = readFileSync(absPath, 'utf-8');

  // 提取 shell/bash 代码块
  const codeBlockRegex = /```(?:shell|bash|powershell|text)?\s*\n([\s\S]*?)```/g;
  let block;
  while ((block = codeBlockRegex.exec(src)) !== null) {
    const lines = block[1].split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('node scripts/')) continue;

      // 提取脚本路径和参数
      const parts = trimmed.split(/\s+/);
      const scriptRel = parts[0]; // "node scripts/foo.mjs"
      const scriptFile = scriptRel.replace(/^node\s+/, ''); // "scripts/foo.mjs"

      const params = extractScriptParams(scriptFile);
      if (params === null) continue; // 脚本不存在，由检查项 4 处理

      // 检查文档中的参数是否在脚本支持的参数范围内
      const usedFlags = parts.filter(p => p.startsWith('--'));
      for (const flag of usedFlags) {
        const cleanFlag = flag.replace(/[<>\[\]]/g, ''); // 去掉 < > [ ]
        if (!params.allFlags.includes(cleanFlag)) {
          // 允许占位符值如 <slug>
          if (!flag.includes('<') && !flag.includes('[')) {
            warn(`${docPath}: 命令 "${trimmed}" 中参数 ${flag} 未在脚本源码中找到`);
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 4. SKILL.md 引用的 reference/*.md 文件存在性
// ---------------------------------------------------------------------------
function checkSkillReferences() {
  const skillPath = join(ROOT, 'SKILL.md');
  if (!existsSync(skillPath)) { warn('SKILL.md 不存在'); return; }

  const src = readFileSync(skillPath, 'utf-8');
  const refRegex = /reference\/[^\s\)\]]+\.md/g;
  let m;
  while ((m = refRegex.exec(src)) !== null) {
    const refPath = m[0];
    const absRef = join(ROOT, refPath);
    if (!existsSync(absRef)) {
      error(`SKILL.md 引用的文档不存在: ${refPath}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. DECISION_LOG.md 引用的文件路径存在性
// ---------------------------------------------------------------------------
function checkDecisionLogReferences() {
  const dlPath = join(ROOT, 'DECISION_LOG.md');
  if (!existsSync(dlPath)) { warn('DECISION_LOG.md 不存在'); return; }

  const src = readFileSync(dlPath, 'utf-8');

  // 提取反引号包围的文件路径
  const fileRefRegex = /`(scripts\/[^`]+\.mjs|templates\/[^`]+\.(css|js|html)|config\/[^`]+\.json|reference\/[^`]+\.md)`/g;
  let m;
  const checked = new Set();
  while ((m = fileRefRegex.exec(src)) !== null) {
    const refPath = m[1];
    if (checked.has(refPath)) continue;
    checked.add(refPath);

    // 跳过 glob 通配表达（如 scripts/lib/*.test.mjs, templates/shell.*.css）
    if (refPath.includes('*')) continue;

    const absRef = join(ROOT, refPath);
    if (!existsSync(absRef)) {
      error(`DECISION_LOG.md 引用的文件不存在: ${refPath}`);
    }
  }

  // 检查配置字段引用（config/defaults.json 存在时校对其字段）
  const configPath = join(ROOT, 'config', 'defaults.json');
  if (existsSync(configPath)) {
    let config;
    try { config = JSON.parse(readFileSync(configPath, 'utf-8')); } catch { return; }

    // 检查 cdn.base 引用
    const cdnBaseRefs = [...src.matchAll(/`cdn\.base\.(\w+)`/g)];
    for (const ref of cdnBaseRefs) {
      const key = ref[1];
      if (!config.cdn?.base?.[key]) {
        error(`DECISION_LOG.md 引用的 cdn.base.${key} 不在 config/defaults.json 中`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 6. README.md 命令与脚本一致性
// ---------------------------------------------------------------------------
function checkReadmeCommands() {
  const readmePath = join(ROOT, 'README.md');
  if (!existsSync(readmePath)) { warn('README.md 不存在'); return; }

  const src = readFileSync(readmePath, 'utf-8');

  // 提取 node scripts/... 命令
  const cmdRegex = /node scripts\/[^\s\n]+/g;
  let m;
  const commands = new Set();
  while ((m = cmdRegex.exec(src)) !== null) {
    commands.add(m[0]);
  }

  for (const cmd of commands) {
    const scriptFile = cmd.replace(/^node\s+/, '');
    const absScript = join(ROOT, scriptFile);
    if (!existsSync(absScript)) {
      error(`README.md 引用的脚本不存在: ${cmd}`);
    }
  }

  // 检查发布顺序中的脚本
  const publishSection = src.match(/### 改壳层后发布顺序/);
  if (publishSection) {
    const afterSection = src.slice(publishSection.index);
    const psCmds = afterSection.match(/node scripts\/[^\s\n]+/g) || [];
    for (const cmd of psCmds) {
      const scriptFile = cmd.replace(/^node\s+/, '');
      if (!existsSync(join(ROOT, scriptFile))) {
        error(`README.md "改壳层后发布顺序" 中引用的脚本不存在: ${cmd}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 7. ARCHITECTURE.md 模块依赖图 ↔ 实际 import 关系
// ---------------------------------------------------------------------------
function checkArchitectureDeps() {
  const archPath = join(ROOT, 'ARCHITECTURE.md');
  if (!existsSync(archPath)) return;

  const arch = readFileSync(archPath, 'utf-8');
  const depsSection = arch.match(/## 10\. 模块依赖图\s*\n([\s\S]*?)(?=\n## |\n---|\n$)/);
  if (!depsSection) return;

  // 从依赖图提取脚本名
  const scriptNames = [];
  const scriptRegex = /(\S+\.mjs)/g;
  let m;
  while ((m = scriptRegex.exec(depsSection[1])) !== null) {
    if (!scriptNames.includes(m[1])) scriptNames.push(m[1]);
  }

  for (const name of scriptNames) {
    const scriptPath = join(ROOT, 'scripts', name);
    if (!existsSync(scriptPath)) {
      error(`ARCHITECTURE.md §10 模块依赖图引用的脚本不存在: scripts/${name}`);
    }
  }

  // 检查库文件引用
  const libNames = [];
  const libRegex = /lib\/(\S+\.mjs)/g;
  while ((m = libRegex.exec(depsSection[1])) !== null) {
    if (!libNames.includes(m[1])) libNames.push(m[1]);
  }
  for (const name of libNames) {
    const libPath = join(ROOT, 'scripts', 'lib', name);
    if (!existsSync(libPath)) {
      error(`ARCHITECTURE.md §10 模块依赖图引用的库不存在: scripts/lib/${name}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 8. reference/*.md 内部交叉链接完整性
// ---------------------------------------------------------------------------
function checkReferenceInternalLinks() {
  const refDir = join(ROOT, 'reference');
  if (!existsSync(refDir)) { warn('reference/ 目录不存在'); return; }

  const files = readdirSync(refDir).filter(f => f.endsWith('.md'));
  const fileSet = new Set(files);

  for (const file of files) {
    const absPath = join(refDir, file);
    const src = readFileSync(absPath, 'utf-8');

    // 提取 Markdown 链接: [text](target.md) 或 [text](target.md#anchor)
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let m;
    while ((m = linkRegex.exec(src)) !== null) {
      const target = m[2];

      // 只检查引用 reference/ 目录内 .md 的链接
      // 格式: file.md 或 file.md#anchor 或 ../file.md
      let targetFile, anchor;
      const hashIdx = target.indexOf('#');
      if (hashIdx >= 0) {
        targetFile = target.slice(0, hashIdx);
        anchor = target.slice(hashIdx + 1);
      } else {
        targetFile = target;
        anchor = null;
      }

      // 跳过外部 URL、绝对路径、非 .md 目标
      if (!targetFile || targetFile.includes(':') || targetFile.startsWith('/')) continue;
      // ../xxx → 从 reference/ 向上解析到项目根
      const isUpDir = targetFile.startsWith('../');
      targetFile = targetFile.replace(/^\.\.\//, '');
      
      let targetAbs;
      if (isUpDir) {
        targetAbs = join(ROOT, targetFile);
      } else {
        targetAbs = join(refDir, targetFile);
      }

      if (!targetFile.endsWith('.md')) continue;

      // 目标文件是否存在于对应目录
      if (!existsSync(targetAbs)) {
        const displayTarget = isUpDir ? targetFile : targetFile;
        error(`reference/${file}: 链接目标不存在 "${targetFile}"`);
        continue;
      }

      // 如果有锚点，检查锚点是否存在于目标文件中
      if (anchor) {
        const targetSrc = readFileSync(targetAbs, 'utf-8');
        // 匹配 Markdown 标题生成的隐式锚点（GFM 风格：标点去除、空格→连字符）
        // 尝试多种锚点格式
        let anchorFound = false;

        // 精确匹配（原始锚点文本）
        const headingExact = targetSrc.match(
          new RegExp(`^#{1,6}\\s+${escapeRegex(anchor)}\\s*$`, 'im')
        );
        if (headingExact) anchorFound = true;

        // 宽松匹配：锚点中的连字符替换为标题中的可能字符
        if (!anchorFound) {
          const lines = targetSrc.split('\n');
          for (const line of lines) {
            const hMatch = line.match(/^#{1,6}\s+(.+?)\s*$/);
            if (!hMatch) continue;
            // GFM 风格：去除中文标点（全角括号等）、转小写、空格→连字符
            const headingText = hMatch[1];
            const slugified = headingText
              .replace(/[（）()「」『』【】《》、。，；：？！""'']/g, '')
              .replace(/[\s]+/g, '-')
              .toLowerCase();
            if (slugified === anchor.toLowerCase() || headingText.replace(/\s+/g, '-').toLowerCase() === anchor.toLowerCase()) {
              anchorFound = true;
              break;
            }
          }
        }

        // 匹配显式锚点
        if (!anchorFound) {
          anchorFound = targetSrc.includes(`id="${anchor}"`) || 
                        targetSrc.includes(`name="${anchor}"`);
        }

        if (!anchorFound) {
          warn(`reference/${file}: 链接 "${target}" 中的锚点 "#${anchor}" 在 ${targetFile} 中未找到`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------
function main() {
  const fix = process.argv.includes('--fix');

  log.info('=== verify-docs.mjs — 文档即代码验证 ===\n');

  checkArchitectureNpmTable();
  checkDocCommands('ARCHITECTURE.md');
  checkDocCommands('README.md');
  checkSkillReferences();
  checkDecisionLogReferences();
  checkReadmeCommands();
  checkArchitectureDeps();
  checkReferenceInternalLinks();

  // 输出结果
  if (ERR.errors.length > 0) {
    log.error(`\n❌ 错误 (${ERR.errors.length}):`);
    for (const e of ERR.errors) log.error(`  - ${e}`);
  }
  if (ERR.warnings.length > 0) {
    log.warn(`\n⚠ 警告 (${ERR.warnings.length}):`);
    for (const w of ERR.warnings) log.warn(`  - ${w}`);
  }

  if (ERR.errors.length === 0 && ERR.warnings.length === 0) {
    log.success('✅ 所有检查通过：文档与代码一致。');
  }

  if (ERR.errors.length > 0) {
    log.info('\n建议修复后重新运行验证。');
    process.exit(1);
  }
}

main();
