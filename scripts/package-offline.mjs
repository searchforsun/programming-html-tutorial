#!/usr/bin/env node
/**
 * 离线包一键生成：下载课程用到的所有 CDN 资源到本地 assets/，
 * 替换 index.html 中的 CDN URL 为相对路径，打包为 ZIP。
 *
 * 用法：
 *   node scripts/package-offline.mjs --dir courses/<slug>
 *   node scripts/package-offline.mjs --dir courses/<slug> --out dist/
 *   node scripts/package-offline.mjs --dir courses/<slug> --no-zip  （仅下载+替换，不打包）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import * as log from './lib/log.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.join(__dirname, '..');

const defaults = JSON.parse(
  fs.readFileSync(path.join(SKILL_ROOT, 'config/defaults.json'), 'utf8')
);

function parseArgs(argv) {
  const opts = { dir: null, out: null, noZip: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dir') opts.dir = argv[++i];
    else if (argv[i] === '--out') opts.out = argv[++i];
    else if (argv[i] === '--no-zip') opts.noZip = true;
  }
  if (!opts.dir) {
    log.error('用法: node scripts/package-offline.mjs --dir <tutorial-dir> [--out dist/] [--no-zip]');
    process.exit(1);
  }
  opts.dir = path.resolve(opts.dir);
  opts.out = opts.out ? path.resolve(opts.out) : path.join(opts.dir, 'dist');
  return opts;
}

/**
 * 从 index.html 中提取所有 CDN 资源 URL。
 * 返回 Map：URL → { relativePath, type, filename }
 */
function extractCdnUrls(html) {
  const urls = new Map();

  // <script src="...">
  for (const m of html.matchAll(/<script\s+src="(https?:\/\/[^"]+)"/g)) {
    const url = m[1];
    const filename = url.split('/').pop().split('?')[0];
    urls.set(url, { type: 'js', filename, relativePath: `assets/${filename}` });
  }

  // <link href="..." rel="stylesheet"> (only CDN ones)
  for (const m of html.matchAll(/<link[^>]*href="(https?:\/\/[^"]+)"[^>]*>/g)) {
    const url = m[1];
    // 跳过裸域名（如 preconnect 中的 https://fonts.googleapis.com）
    if (!url.includes('/', 9)) continue;
    // Filter: only CDN CSS (fonts/cdnjs/jsdelivr)
    const isCdn = /cdnjs|jsdelivr|fonts\.googleapis|fonts\.gstatic/.test(url);
    if (isCdn) {
      const parts = url.split('/');
      const rawFilename = parts[parts.length - 1].split('?')[0];
      // Google Fonts CSS 路径如 /css2?family=...，filename 为空字符串
      const filename = rawFilename || `font-${Buffer.from(url.slice(url.lastIndexOf('/', url.length - 20)))}.css`.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 60);
      urls.set(url, { type: 'css', filename, relativePath: `assets/${filename}` });
    }
  }
  return urls;
}

/**
 * 从 Google Fonts CSS 内容中提取 @font-face src 中的字体文件 URL。
 */
function extractFontUrls(css) {
  const fonts = new Map();
  for (const m of css.matchAll(/url\((https?:\/\/[^)]+\.(?:woff2?|ttf|otf))\)/gi)) {
    const url = m[1];
    const filename = url.split('/').pop();
    fonts.set(url, { type: 'font', filename, relativePath: `assets/${filename}` });
  }
  return fonts;
}

/**
 * 使用 fetch 下载 URL 内容，写入 assets/ 目录。
 */
async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath)) {
    log.info(`  ⏭  跳过（已存在）: ${path.basename(destPath)}`);
    return true;
  }
  try {
    const resp = await fetch(url, { redirect: 'follow' });
    if (!resp.ok) {
      log.error(`  ❌ HTTP ${resp.status}: ${url}`);
      return false;
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buf);
    log.success(`  ✓  ${path.basename(destPath)} (${(buf.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (e) {
    log.error(`  ❌ ${e.message}: ${url}`);
    return false;
  }
}

async function main() {
  const opts = parseArgs(process.argv);

  const indexPath = path.join(opts.dir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    log.error(`未找到 index.html：${indexPath}`);
    log.error('请先运行：node scripts/assemble-index.mjs --dir ' + opts.dir);
    process.exit(1);
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  const assetsDir = path.join(opts.dir, 'assets');

  // 清理旧的 assets
  if (fs.existsSync(assetsDir)) {
    fs.rmSync(assetsDir, { recursive: true });
  }
  fs.mkdirSync(assetsDir, { recursive: true });

  // ── 1. 提取所有 CDN 资源 ──
  const cdnUrls = extractCdnUrls(html);
  log.info(`\n📦 离线打包：${opts.dir}`);
  log.info(`\n📋 发现 ${cdnUrls.size} 个 CDN 资源：`);

  // ── 2. 下载所有 CDN 资源 ──
  let downloaded = 0;
  let failed = 0;

  for (const [url, info] of cdnUrls) {
    const destPath = path.join(assetsDir, info.filename);
    const ok = await downloadFile(url, destPath);
    if (ok) downloaded++;
    else failed++;

    // Google Fonts CSS：解析并下载其中引用的字体文件
    if (info.type === 'css' && url.includes('fonts.googleapis.com') && fs.existsSync(destPath)) {
      const cssContent = fs.readFileSync(destPath, 'utf8');
      const fontUrls = extractFontUrls(cssContent);
      for (const [fontUrl, finfo] of fontUrls) {
        const fontDest = path.join(assetsDir, finfo.filename);
        const fOk = await downloadFile(fontUrl, fontDest);
        if (fOk) downloaded++;
        else failed++;
      }
    }
  }

  log.info(`\n📊 下载完成: ${downloaded} 成功, ${failed} 失败`);

  if (failed > 0) {
    log.warn(`\n⚠️  部分资源下载失败，离线包可能不完整。`);
  }

  // ── 3. 替换 index.html 中的 CDN URL ──
  let patchedHtml = html;
  for (const [url, info] of cdnUrls) {
    patchedHtml = patchedHtml.split(url).join(info.relativePath);
  }

  // Google Fonts 特殊处理：将 CSS 中的远程字体 URL 替换为本地
  const fontsCssFile = path.join(assetsDir, 'css2');
  if (fs.existsSync(fontsCssFile)) {
    let fontsCss = fs.readFileSync(fontsCssFile, 'utf8');
    const fontUrls = extractFontUrls(fontsCss);
    for (const [fontUrl, finfo] of fontUrls) {
      fontsCss = fontsCss.split(fontUrl).join(finfo.relativePath);
    }
    fs.writeFileSync(fontsCssFile, fontsCss, 'utf8');
  }

  // 写入离线版 index.html
  const offlineIndexPath = path.join(opts.dir, 'index-offline.html');
  fs.writeFileSync(offlineIndexPath, patchedHtml, 'utf8');
  log.success(`\n✓ 离线版已生成: ${offlineIndexPath}`);

  // CDN URL 替换验证
  const remainingCdn = patchedHtml.match(/https?:\/\/(?:cdnjs|jsdelivr|fonts\.googleapis|fonts\.gstatic)\/[^"'\s>)]+/g) || [];
  if (remainingCdn.length > 0) {
    log.warn(`⚠️  仍有 ${remainingCdn.length} 处 CDN URL 未被替换`);
  } else {
    log.success('✓ 所有 CDN URL 已替换为本地相对路径');
  }

  // ── 4. 打包 ZIP ──
  if (!opts.noZip) {
    const slug = path.basename(opts.dir);
    const zipName = `${slug}-offline.zip`;
    const zipPath = path.join(opts.out, zipName);

    fs.mkdirSync(opts.out, { recursive: true });

    // 收集要打包的文件
    const filesToZip = [
      offlineIndexPath,
      ...walkAssets(assetsDir, opts.dir),
    ];
    // 同时打包 theme.css（如有）
    const themeCss = path.join(opts.dir, 'theme.css');
    if (fs.existsSync(themeCss)) filesToZip.push(themeCss);

    // 创建临时清单文件
    const manifestPath = path.join(opts.out, '.package-manifest.txt');
    fs.writeFileSync(manifestPath, filesToZip.join('\n'), 'utf8');

    try {
      // 使用系统 zip 命令
      const cwd = opts.dir;
      const relativeFiles = filesToZip
        .map((f) => path.relative(cwd, f))
        .filter((f) => fs.existsSync(path.join(cwd, f)));

      // 重命名 index-offline.html → index.html 在 ZIP 中
      // 先临时创建符号链接结构
      const tmpDir = path.join(opts.out, '.tmp-pkg');
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.mkdirSync(path.join(tmpDir, 'assets'), { recursive: true });

      // 复制文件到临时目录
      fs.copyFileSync(offlineIndexPath, path.join(tmpDir, 'index.html'));
      for (const f of fs.readdirSync(assetsDir)) {
        fs.copyFileSync(
          path.join(assetsDir, f),
          path.join(tmpDir, 'assets', f)
        );
      }
      if (fs.existsSync(themeCss)) {
        fs.copyFileSync(themeCss, path.join(tmpDir, 'theme.css'));
      }

      const cmd = `cd "${tmpDir}" && zip -r "${zipPath}" .`;
      execSync(cmd, { stdio: 'inherit' });

      // 清理
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
      if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);

      const zipStat = fs.statSync(zipPath);
      log.success(`\n✓ ZIP 已生成: ${zipPath} (${(zipStat.size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (e) {
      log.error(`❌ 打包失败: ${e.message}`);
      // 清理临时文件
      const tmpDir = path.join(opts.out, '.tmp-pkg');
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
      if (fs.existsSync(manifestPath)) fs.unlinkSync(manifestPath);
    }
  }

  log.success('\n✅ 离线打包完成！');
  if (!opts.noZip) {
    log.info(`\n使用方式：解压 ZIP 后直接用浏览器打开 index.html（无需网络）。`);
  }
}

function walkAssets(assetsDir, baseDir) {
  const result = [];
  for (const entry of fs.readdirSync(assetsDir, { withFileTypes: true })) {
    const full = path.join(assetsDir, entry.name);
    if (entry.isFile()) result.push(full);
    else if (entry.isDirectory()) result.push(...walkAssets(full, baseDir));
  }
  return result;
}

main().catch((e) => {
  log.error(e);
  process.exit(1);
});
