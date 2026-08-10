#!/usr/bin/env node
/** Extract course.json, welcome, chapters, theme.css from monolithic index.html */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaults = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'config', 'defaults.json'), 'utf8')
);

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error('Usage: node extract-from-index.mjs <path/to/index.html>');
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf8');
const outDir = path.dirname(path.resolve(htmlPath));

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) throw new Error('no <style>');
const css = styleMatch[1];

const dataMatch = html.match(/<script id="course-data"[^>]*>([\s\S]*?)<\/script>/);
const course = JSON.parse(dataMatch[1].trim());

const welcomeBlock = html.match(
  /<div id="welcome" class="welcome">([\s\S]*?)<\/div>\s*<div id="content">/
);
if (!welcomeBlock) throw new Error('no welcome block');
fs.writeFileSync(path.join(outDir, 'welcome.partial.html'), welcomeBlock[1].trim() + '\n');

const contentBlock = html.match(/<div id="content">([\s\S]*?)<\/div>\s*<div id="quiz-panel">/);
if (!contentBlock) throw new Error('no #content');
const chaptersDir = path.join(outDir, 'chapters');
fs.mkdirSync(chaptersDir, { recursive: true });
const chapterRe = /<section id="ch-([^"]+)"[\s\S]*?<\/section>/g;
let m;
let count = 0;
while ((m = chapterRe.exec(contentBlock[1])) !== null) {
  fs.writeFileSync(path.join(chaptersDir, `${m[1]}.html`), m[0] + '\n');
  count++;
}

const oldPreset = course.meta.theme || course.meta.themePreset || 'spring';
const presetSlug = course.meta.slug || 'default';

// 按 preset 标记边界截取 CSS，而非靠脆弱正则匹配单条规则末尾的 }
const presetMarker = `[data-theme-preset="${oldPreset}"]`;
const startIdx = css.indexOf(presetMarker);
let themeCss = '';
if (startIdx !== -1) {
  // 找到下一个 preset 标记的位置作为当前块的右边界
  const nextPresetIdx = css.indexOf('[data-theme-preset="', startIdx + presetMarker.length);
  const blockEnd = nextPresetIdx !== -1 ? nextPresetIdx : css.length;
  themeCss = css.slice(startIdx, blockEnd).trim() + '\n';
}
if (!themeCss) {
  themeCss = `/* TODO: theme for ${presetSlug} */\n`;
}
// 将旧 preset 名替换为当前 slug
themeCss = themeCss.replaceAll(oldPreset, presetSlug);

course.meta.shellVersion = defaults.shellVersion;
course.meta.themePreset = presetSlug;
delete course.meta.theme;

fs.writeFileSync(path.join(outDir, 'course.json'), JSON.stringify(course, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'theme.css'), themeCss);
console.log(`OK: ${count} chapter(s) -> ${outDir}`);
