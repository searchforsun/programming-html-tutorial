/**
 * log.mjs 单元测试
 *
 * 覆盖：debug/info/success/warn/error/plain 六种输出、LOG_LEVEL 过滤、时间戳格式、
 * 格式化占位符（%s/%d/%j）、流方向（stdout vs stderr）、silent 全屏蔽。
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { Writable } from 'node:stream';

// ── 测试辅助：捕获输出 ──

class CaptureStream extends Writable {
  constructor() { super(); this.buf = ''; }
  _write(chunk, _enc, cb) { this.buf += chunk.toString(); cb(); }
  get lines() { return this.buf.split('\n').filter(Boolean); }
  get text() { return this.buf; }
  reset() { this.buf = ''; }
}

function capture(fn) {
  return new Promise((resolve) => {
    const stdout = new CaptureStream();
    const stderr = new CaptureStream();

    // 替换 process.stdout / process.stderr 为捕获流
    const origStdoutWrite = process.stdout.write;
    const origStderrWrite = process.stderr.write;
    const origLogLevel = process.env.LOG_LEVEL;

    process.stdout.write = (chunk, enc, cb) => stdout.write(chunk, enc, cb);
    process.stderr.write = (chunk, enc, cb) => stderr.write(chunk, enc, cb);

    try {
      fn();
      // 微延迟让 write 完成
      setImmediate(() => {
        process.stdout.write = origStdoutWrite;
        process.stderr.write = origStderrWrite;
        process.env.LOG_LEVEL = origLogLevel;
        resolve({ stdout, stderr });
      });
    } catch (e) {
      process.stdout.write = origStdoutWrite;
      process.stderr.write = origStderrWrite;
      process.env.LOG_LEVEL = origLogLevel;
      resolve({ stdout, stderr, error: e });
    }
  });
}

// ── 为每个测试重新导入（绕过模块缓存中的闭包 LOG_LEVEL） ──
async function freshLog() {
  // 用动态 import + 时间戳 query 绕过缓存
  return await import('./log.mjs?' + Date.now());
}

describe('log.debug', () => {
  let log;

  beforeEach(async () => {
    process.env.LOG_LEVEL = 'debug';
    log = await freshLog();
  });

  it('LOG_LEVEL=debug 时输出到 stderr', async () => {
    const r = await capture(() => log.debug('test message'));
    assert.ok(r.stderr.text.includes('test message'));
    assert.ok(r.stdout.text === '');
  });

  it('包含 DEBUG 标记', async () => {
    const r = await capture(() => log.debug('msg'));
    assert.ok(r.stderr.text.includes('DEBUG'));
  });

  it('LOG_LEVEL=info 时不输出', async () => {
    process.env.LOG_LEVEL = 'info';
    const log2 = await freshLog();
    const r = await capture(() => log2.debug('should not appear'));
    assert.strictEqual(r.stderr.text, '');
  });
});

describe('log.info', () => {
  let log;

  beforeEach(async () => {
    process.env.LOG_LEVEL = 'info';
    log = await freshLog();
  });

  it('输出到 stdout', async () => {
    const r = await capture(() => log.info('hello world'));
    assert.ok(r.stdout.text.includes('hello world'));
  });

  it('%s 格式化字符串', async () => {
    const r = await capture(() => log.info('路径: %s', '/usr/local'));
    assert.ok(r.stdout.text.includes('路径: /usr/local'));
  });

  it('%d 格式化数字', async () => {
    const r = await capture(() => log.info('数量: %d', 42));
    assert.ok(r.stdout.text.includes('数量: 42'));
  });

  it('%j 格式化 JSON', async () => {
    const r = await capture(() => log.info('配置: %j', { key: 'val' }));
    assert.ok(r.stdout.text.includes('{"key":"val"}'));
  });

  it('Error 对象格式化', async () => {
    const r = await capture(() => log.info('错误: %s', new Error('boom')));
    assert.ok(r.stdout.text.includes('boom'));
  });

  it('无参数直接输出原文', async () => {
    const r = await capture(() => log.info('plain text'));
    assert.ok(r.stdout.text.includes('plain text'));
  });

  it('LOG_LEVEL=warn 时不输出', async () => {
    process.env.LOG_LEVEL = 'warn';
    const log2 = await freshLog();
    const r = await capture(() => log2.info('hidden'));
    assert.strictEqual(r.stdout.text, '');
  });
});

describe('log.success', () => {
  let log;

  beforeEach(async () => {
    process.env.LOG_LEVEL = 'info';
    log = await freshLog();
  });

  it('✓ 前缀出现在输出中', async () => {
    const r = await capture(() => log.success('构建完成'));
    assert.ok(r.stdout.text.includes('✓'));
    assert.ok(r.stdout.text.includes('构建完成'));
  });
});

describe('log.warn', () => {
  let log;

  beforeEach(async () => {
    process.env.LOG_LEVEL = 'warn';
    log = await freshLog();
  });

  it('⚠ 前缀出现在 stderr', async () => {
    const r = await capture(() => log.warn('缓存过期'));
    assert.ok(r.stderr.text.includes('⚠'));
    assert.ok(r.stderr.text.includes('缓存过期'));
  });

  it('LOG_LEVEL=error 时不输出', async () => {
    process.env.LOG_LEVEL = 'error';
    const log2 = await freshLog();
    const r = await capture(() => log2.warn('hidden'));
    assert.strictEqual(r.stderr.text, '');
  });
});

describe('log.error', () => {
  let log;

  beforeEach(async () => {
    process.env.LOG_LEVEL = 'error';
    log = await freshLog();
  });

  it('✗ 前缀出现在 stderr', async () => {
    const r = await capture(() => log.error('文件缺失'));
    assert.ok(r.stderr.text.includes('✗'));
    assert.ok(r.stderr.text.includes('文件缺失'));
  });

  it('LOG_LEVEL=silent 时不输出', async () => {
    process.env.LOG_LEVEL = 'silent';
    const log2 = await freshLog();
    const r = await capture(() => log2.error('hidden'));
    assert.strictEqual(r.stderr.text, '');
  });
});

describe('log.plain', () => {
  let log;

  beforeEach(async () => {
    process.env.LOG_LEVEL = 'info';
    log = await freshLog();
  });

  it('输出到 stdout，无时间戳', async () => {
    const r = await capture(() => log.plain('── 分隔线 ──'));
    // 不应包含时间戳方括号（plain 跳过 ts()）
    const lines = r.stdout.text.trim().split('\n');
    const sepLine = lines.find(l => l.includes('分隔线'));
    assert.ok(sepLine, '应包含分隔线文本');
    assert.ok(!sepLine.startsWith('['), `plain 不应有时间戳: ${sepLine}`);
  });

  it('FORMAT_LEVEL=silent 不输出', async () => {
    process.env.LOG_LEVEL = 'silent';
    const log2 = await freshLog();
    const r = await capture(() => log2.plain('hidden'));
    assert.strictEqual(r.stdout.text, '');
  });
});

describe('log — 时间戳格式', () => {
  let log;

  beforeEach(async () => {
    process.env.LOG_LEVEL = 'info';
    log = await freshLog();
  });

  it('以 [HH:MM:SS] 开头', async () => {
    const r = await capture(() => log.info('with timestamp'));
    const m = r.stdout.text.match(/^\[(\d{2}):(\d{2}):(\d{2})\]/);
    assert.ok(m, `预期时间戳格式 [HH:MM:SS]，实际: ${r.stdout.text.slice(0, 20)}`);
    const h = parseInt(m[1]), min = parseInt(m[2]), s = parseInt(m[3]);
    assert.ok(h >= 0 && h <= 23);
    assert.ok(min >= 0 && min <= 59);
    assert.ok(s >= 0 && s <= 59);
  });
});

describe('log — LOG_LEVEL 大小写', () => {
  it('大写 INFO 有效', async () => {
    process.env.LOG_LEVEL = 'INFO';
    const log = await freshLog();
    const r = await capture(() => log.info('upper'));
    assert.ok(r.stdout.text.includes('upper'));
  });

  it('混合大小写 WARN 有效', async () => {
    process.env.LOG_LEVEL = 'WARN';
    const log = await freshLog();
    const r = await capture(() => log.warn('mixed case'));
    assert.ok(r.stderr.text.includes('mixed case'));
  });
});

describe('log — 多参数', () => {
  it('多个 %s 依次替换', async () => {
    process.env.LOG_LEVEL = 'info';
    const log = await freshLog();
    const r = await capture(() => log.info('%s → %s', 'input', 'output'));
    assert.ok(r.stdout.text.includes('input → output'));
  });

  it('混合 %s 和普通参数', async () => {
    process.env.LOG_LEVEL = 'info';
    const log = await freshLog();
    const r = await capture(() => log.info('文件 %s (%d B)', 'test.js', 2048));
    assert.ok(r.stdout.text.includes('test.js (2048 B)'));
  });
});
