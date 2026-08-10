/**
 * build-cache.mjs 单元测试
 *
 * 覆盖：_hashFiles（确定性）、_snapshot（文件清单）、shouldSkip*（四级跳过判断）、
 * save/_load 往返、diffSummary（变更摘要）、空缓存/损坏缓存回退。
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { BuildCache } from './build-cache.mjs';

// ── 辅助：创建临时目录结构 ──
function createFixture(root) {
  // skillRoot 结构
  const skillRoot = path.join(root, 'skill');
  const templatesDir = path.join(skillRoot, 'templates');
  const configDir = path.join(skillRoot, 'config');

  fs.mkdirSync(templatesDir, { recursive: true });
  fs.mkdirSync(configDir, { recursive: true });

  const shellFiles = [
    'index.shell.html', 'shell.shared.css', 'shell.base.css', 'shell.surfaces.css',
    'shell.print.css', 'shell.style-presets.css', 'shell.style-pages.css',
    'shell.app.js', 'shell.mermaid-fullscreen.js', 'shell.selection-prompt.js',
    'chapter-enrichment.js', 'enrichment.base.css',
  ];
  for (const f of shellFiles) {
    fs.writeFileSync(path.join(templatesDir, f), `/* ${f} */`, 'utf8');
  }
  for (const f of ['defaults.json', 'term-platforms.json', 'chapter-quality.json']) {
    fs.writeFileSync(path.join(configDir, f), '{}', 'utf8');
  }

  // courseDir 结构
  const courseDir = path.join(root, 'course');
  fs.mkdirSync(path.join(courseDir, 'chapters'), { recursive: true });
  fs.writeFileSync(path.join(courseDir, 'course.json'), '{"meta":{}}', 'utf8');
  fs.writeFileSync(path.join(courseDir, 'theme.css'), ':root{--primary:#333}', 'utf8');
  fs.writeFileSync(path.join(courseDir, 'welcome.partial.html'), '<div>welcome</div>', 'utf8');
  fs.writeFileSync(path.join(courseDir, 'quiz.partial.html'), '<section></section>', 'utf8');
  fs.writeFileSync(path.join(courseDir, 'chapters', 'ch01.html'), '<p>ch1</p>', 'utf8');
  fs.writeFileSync(path.join(courseDir, 'chapters', 'ch02.html'), '<p>ch2</p>', 'utf8');

  return { skillRoot, courseDir };
}

describe('BuildCache', () => {
  let tmpDir, cache;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-test-'));
    const { skillRoot, courseDir } = createFixture(tmpDir);
    cache = new BuildCache(courseDir, skillRoot);
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('_snapshot', () => {
    it('生成三个 hash 字段', () => {
      const snap = cache.current;
      assert.ok(typeof snap.shellHash === 'string', 'shellHash 应为字符串');
      assert.ok(typeof snap.courseHash === 'string', 'courseHash 应为字符串');
      assert.ok(typeof snap.chaptersHash === 'string', 'chaptersHash 应为字符串');
    });

    it('记录各级文件数量', () => {
      const snap = cache.current;
      assert.strictEqual(snap.shellFileCount, 15, '壳层应有 15 个文件');
      assert.strictEqual(snap.courseFileCount, 4, '课程数据应有 4 个文件');
      assert.strictEqual(snap.chapterFileCount, 2, '章节应有 2 个文件');
    });

    it('包含 builtAt 时间戳', () => {
      assert.ok(new Date(cache.current.builtAt).getTime() > 0);
    });

    it('变更后 hash 变化', () => {
      const h1 = cache.current.chaptersHash;
      // 修改章节内容
      fs.writeFileSync(path.join(cache.courseDir, 'chapters', 'ch01.html'), '<p>modified</p>', 'utf8');
      const cache2 = new BuildCache(cache.courseDir, cache.skillRoot);
      const h2 = cache2.current.chaptersHash;
      assert.notStrictEqual(h1, h2, '修改章节后 chaptersHash 应变');
    });
  });

  describe('_hashFiles 确定性', () => {
    it('相同文件列表产生相同 hash', () => {
      const files = [
        path.join(cache.courseDir, 'chapters', 'ch01.html'),
        path.join(cache.courseDir, 'chapters', 'ch02.html'),
      ];
      const h1 = cache._hashFiles(files);
      const h2 = cache._hashFiles(files);
      assert.strictEqual(h1, h2);
    });

    it('不同顺序产生不同 hash（顺序敏感）', () => {
      const files = [
        path.join(cache.courseDir, 'chapters', 'ch01.html'),
        path.join(cache.courseDir, 'chapters', 'ch02.html'),
      ];
      const reversed = [...files].reverse();
      assert.notStrictEqual(cache._hashFiles(files), cache._hashFiles(reversed));
    });

    it('缺失文件标记为 MISSING 仍可 hash', () => {
      const files = ['/nonexistent/foo.html'];
      const h = cache._hashFiles(files);
      assert.ok(typeof h === 'string' && h.length > 0);
    });

    it('返回 16 进制字符串', () => {
      const h = cache._hashFiles([]);
      assert.ok(/^[0-9a-f]+$/.test(h));
    });
  });

  describe('首次构建（无缓存）', () => {
    it('shouldSkipAll 返回 false', () => {
      assert.strictEqual(cache.shouldSkipAll(), false);
    });

    it('shouldSkipStyleBuild 返回 false', () => {
      assert.strictEqual(cache.shouldSkipStyleBuild(), false);
    });

    it('diffSummary 返回 "首次构建"', () => {
      assert.ok(cache.diffSummary().includes('首次构建'));
    });
  });

  describe('save / _load 往返', () => {
    let fx2;
    before(() => {
      const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-save-'));
      fx2 = createFixture(d);
      const c = new BuildCache(fx2.courseDir, fx2.skillRoot);
      c.save();
    });
    it('save 后 shouldSkipAll 返回 true', () => {
      const c2 = new BuildCache(fx2.courseDir, fx2.skillRoot);
      assert.strictEqual(c2.shouldSkipAll(), true);
    });
    it('save 后所有四级跳过均返回 true', () => {
      const c2 = new BuildCache(fx2.courseDir, fx2.skillRoot);
      assert.strictEqual(c2.shouldSkipStyleBuild(), true);
      assert.strictEqual(c2.shouldSkipDataReRead(), true);
      assert.strictEqual(c2.shouldSkipChaptersReRead(), true);
    });
    it('diffSummary 返回 "无变更"', () => {
      const c2 = new BuildCache(fx2.courseDir, fx2.skillRoot);
      assert.ok(c2.diffSummary().includes('无变更'));
    });
  });

  describe('部分变更场景', () => {
    let courseDir, skillRoot;

    before(() => {
      const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-part-'));
      const f = createFixture(d);
      courseDir = f.courseDir;
      skillRoot = f.skillRoot;
      // 首次构建并保存
      const c = new BuildCache(courseDir, skillRoot);
      c.save();
    });

    it('仅修改章节 → shouldSkipStyleBuild 仍为 true', () => {
      fs.writeFileSync(path.join(courseDir, 'chapters', 'ch01.html'), '<p>v2</p>', 'utf8');
      const c = new BuildCache(courseDir, skillRoot);
      assert.strictEqual(c.shouldSkipStyleBuild(), true, '壳层未变，可跳过 CSS');
      assert.strictEqual(c.shouldSkipAll(), false, '章节变了，不能全跳');
    });

    it('仅修改 course.json → shouldSkipStyleBuild 仍为 true', () => {
      fs.writeFileSync(path.join(courseDir, 'course.json'), '{"meta":{"v":2}}', 'utf8');
      const c = new BuildCache(courseDir, skillRoot);
      assert.strictEqual(c.shouldSkipStyleBuild(), true);
    });

    it('修改壳层模板 → shouldSkipStyleBuild 返回 false', () => {
      fs.writeFileSync(path.join(skillRoot, 'templates', 'shell.app.js'), '// v2', 'utf8');
      const c = new BuildCache(courseDir, skillRoot);
      assert.strictEqual(c.shouldSkipStyleBuild(), false);
    });

    it('diffSummary 显示变更部分', () => {
      const c = new BuildCache(courseDir, skillRoot);
      const summary = c.diffSummary();
      assert.ok(summary.includes('壳层模板/config'));
    });
  });

  describe('损坏缓存回退', () => {
    it('manifest JSON 损坏时 shouldSkipAll 返回 false', () => {
      const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bc-bad-'));
      const f = createFixture(d);
      const c1 = new BuildCache(f.courseDir, f.skillRoot);
      c1.save();

      // 破坏缓存文件
      fs.writeFileSync(c1.manifestPath, 'this is not json', 'utf8');

      const c2 = new BuildCache(f.courseDir, f.skillRoot);
      assert.strictEqual(c2.shouldSkipAll(), false);
      assert.strictEqual(c2.shouldSkipStyleBuild(), false);

      fs.rmSync(d, { recursive: true, force: true });
    });
  });
});
