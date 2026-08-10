/**
 * 增量构建缓存：基于源文件 mtime 跳过未变更部分的构建。
 *
 * 三级缓存粒度：
 *  1. 壳层（templates/config）→ 变更必须重建 CSS + 全部 HTML
 *  2. 课程数据（course.json/theme.css/welcome/quiz）→ 重建 HTML，跳过 CSS
 *  3. 章节（chapters/*.html）→ 仅重建 HTML，跳过 CSS
 *  若全部未变 → 完全跳过构建
 *
 * 用法：
 *   import { BuildCache } from './build-cache.mjs';
 *   const cache = new BuildCache(dir, skillRoot);
 *   if (cache.shouldSkipAll()) return;          // 无变更，跳过全部
 *   if (cache.shouldSkipStyleBuild()) { ... }   // 壳层未变，跳过 CSS 构建
 *   // ... 执行构建后：
 *   cache.save();
 */

import fs from 'fs';
import path from 'path';

export class BuildCache {
  /**
   * @param {string} courseDir  课程目录（含 course.json）
   * @param {string} skillRoot  SKILL.md 所在根目录
   */
  constructor(courseDir, skillRoot) {
    this.courseDir = courseDir;
    this.skillRoot = skillRoot;
    this.cacheDir = path.join(courseDir, '.cache');
    this.manifestPath = path.join(this.cacheDir, 'build-manifest.json');
    this.manifest = this._load();
    this.current = this._snapshot();
  }

  /** 所有源文件均未变更 → 完全跳过构建 */
  shouldSkipAll() {
    const prev = this.manifest;
    if (!prev || !prev.shellHash || !prev.courseHash || !prev.chaptersHash) return false;
    return (
      this.current.shellHash === prev.shellHash &&
      this.current.courseHash === prev.courseHash &&
      this.current.chaptersHash === prev.chaptersHash
    );
  }

  /** 壳层模板/config 未变更 → 可跳过 build-style-sheets */
  shouldSkipStyleBuild() {
    const prev = this.manifest;
    if (!prev || !prev.shellHash) return false;
    return this.current.shellHash === prev.shellHash;
  }

  /** 课程数据（course.json/theme/welcome/quiz）未变 → 仅章节变更时才有意义 */
  shouldSkipDataReRead() {
    const prev = this.manifest;
    if (!prev || !prev.courseHash) return false;
    return this.current.courseHash === prev.courseHash;
  }

  /** 章节省略：只有章节未变时才跳过重读 chapters/ */
  shouldSkipChaptersReRead() {
    const prev = this.manifest;
    if (!prev || !prev.chaptersHash) return false;
    return this.current.chaptersHash === prev.chaptersHash;
  }

  /** 更新缓存（构建成功后调用） */
  save() {
    fs.mkdirSync(this.cacheDir, { recursive: true });
    fs.writeFileSync(this.manifestPath, JSON.stringify(this.current, null, 2), 'utf8');
  }

  /** 输出变更摘要供调试 */
  diffSummary() {
    const prev = this.manifest;
    if (!prev) return '首次构建，无缓存';
    const parts = [];
    if (this.current.shellHash !== prev.shellHash) parts.push('壳层模板/config');
    if (this.current.courseHash !== prev.courseHash) parts.push('课程数据 (course.json/theme/welcome/quiz)');
    if (this.current.chaptersHash !== prev.chaptersHash) parts.push('章节');
    return parts.length ? `变更：${parts.join('、')}` : '无变更';
  }

  // ── private ──

  _load() {
    try {
      const raw = fs.readFileSync(this.manifestPath, 'utf8');
      const m = JSON.parse(raw);
      if (m && typeof m.shellHash === 'string') return m;
    } catch (_) { /* 缓存不存在或损坏 */ }
    return null;
  }

  _snapshot() {
    const templatesDir = path.join(this.skillRoot, 'templates');
    const configDir = path.join(this.skillRoot, 'config');

    // 壳层：所有模板 + 配置文件
    const shellFiles = [
      path.join(templatesDir, 'index.shell.html'),
      path.join(templatesDir, 'shell.shared.css'),
      path.join(templatesDir, 'shell.base.css'),
      path.join(templatesDir, 'shell.surfaces.css'),
      path.join(templatesDir, 'shell.print.css'),
      path.join(templatesDir, 'shell.style-presets.css'),
      path.join(templatesDir, 'shell.style-pages.css'),
      path.join(templatesDir, 'shell.app.js'),
      path.join(templatesDir, 'shell.mermaid-fullscreen.js'),
      path.join(templatesDir, 'shell.selection-prompt.js'),
      path.join(templatesDir, 'chapter-enrichment.js'),
      path.join(templatesDir, 'enrichment.base.css'),
      path.join(configDir, 'defaults.json'),
      path.join(configDir, 'term-platforms.json'),
      path.join(configDir, 'chapter-quality.json'),
    ];

    // 课程数据
    const courseFiles = [
      path.join(this.courseDir, 'course.json'),
      path.join(this.courseDir, 'theme.css'),
      path.join(this.courseDir, 'welcome.partial.html'),
      path.join(this.courseDir, 'quiz.partial.html'),
    ];

    // 章节
    const chaptersDir = path.join(this.courseDir, 'chapters');
    let chapterFiles = [];
    if (fs.existsSync(chaptersDir)) {
      chapterFiles = fs
        .readdirSync(chaptersDir)
        .filter((f) => f.endsWith('.html'))
        .sort()
        .map((f) => path.join(chaptersDir, f));
    }

    return {
      builtAt: new Date().toISOString(),
      shellHash: this._hashFiles(shellFiles),
      courseHash: this._hashFiles(courseFiles),
      chaptersHash: this._hashFiles(chapterFiles),
      shellFileCount: shellFiles.length,
      courseFileCount: courseFiles.length,
      chapterFileCount: chapterFiles.length,
    };
  }

  /** 将文件 mtime 拼接为稳定 hash（非加密级，仅用于变更检测） */
  _hashFiles(files) {
    const parts = [];
    let count = 0;
    for (const f of files) {
      try {
        const stat = fs.statSync(f);
        parts.push(`${f}:${stat.mtimeMs.toFixed(0)}:${stat.size}`);
        count++;
      } catch (_) {
        parts.push(`${f}:MISSING`);
      }
    }
    // 使用简单 djb2 hash 避免极端大小的 manifest
    let h = 5381;
    const s = `${count}:${parts.join('|')}`;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(16);
  }
}
