#!/usr/bin/env node
/**
 * 从已组装的 index.html 提取单章正文，写回 chapters/<id>.html（UTF-8）。
 * 用于章节源文件损坏但 index 仍完好时的恢复；恢复后应重新 assemble 校验。
 *
 *   node scripts/extract-chapter-from-index.mjs --dir <courseDir> --chapter <chapterId>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function arg(name, short) {
  const args = process.argv.slice(2);
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  const j = args.indexOf(short);
  if (j >= 0 && args[j + 1]) return args[j + 1];
  return null;
}

const dir = arg('--dir', '-d');
const chapterId = arg('--chapter', '-c');
if (!dir || !chapterId) {
  console.error(
    'Usage: node extract-chapter-from-index.mjs --dir <courseDir> --chapter <chapterId>'
  );
  process.exit(1);
}

const indexPath = path.join(dir, 'index.html');
const outPath = path.join(dir, 'chapters', `${chapterId}.html`);
if (!fs.existsSync(indexPath)) {
  console.error('index.html not found:', indexPath);
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const open = `<section id="ch-${chapterId}"`;
const start = html.indexOf(open);
if (start < 0) {
  console.error('chapter section not found in index:', chapterId);
  process.exit(1);
}

const slice = html.slice(start);
const endRe =
  /^[\s\S]*?<\/section>\s*(?=\r?\n\s*<\/div>\s*\r?\n\s*<div id="quiz-panel")/m;
const m = endRe.exec(slice);
if (!m) {
  console.error('could not find chapter section end before #quiz-panel');
  process.exit(1);
}

let extracted = m[0].trim();
if (extracted.includes('motion')) {
  extracted = extracted
    .replaceAll('<motion ', '<div ')
    .replaceAll('</motion>', '</div>');
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${extracted}\n`, 'utf8');
console.log('wrote', outPath);
