#!/usr/bin/env node
/**
 * 将 chapters/*.html 中的非法 motion 标签替换为 div（历史误写修复）。
 *   node scripts/fix-invalid-html-tags.mjs --dir <courseDir>
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
const dirIdx = args.indexOf('--dir');
const courseDir =
  dirIdx >= 0 && args[dirIdx + 1]
    ? path.resolve(args[dirIdx + 1])
    : null;
if (!courseDir) {
  console.error('Usage: node fix-invalid-html-tags.mjs --dir <courseDir>');
  process.exit(1);
}

const chDir = path.join(courseDir, 'chapters');
if (!fs.existsSync(chDir)) {
  console.error('chapters/ not found:', chDir);
  process.exit(1);
}

let fixed = 0;
for (const f of fs.readdirSync(chDir)) {
  if (!f.endsWith('.html')) continue;
  const p = path.join(chDir, f);
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('motion')) continue;
  s = s.replaceAll('<motion ', '<div ').replaceAll('</motion>', '</div>');
  fs.writeFileSync(p, s, 'utf8');
  console.log('fixed', f);
  fixed += 1;
}
if (!fixed) console.log('no motion tags found');
