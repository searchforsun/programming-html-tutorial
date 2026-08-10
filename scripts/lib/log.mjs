/**
 * 结构化日志模块
 *
 * 为所有脚本提供统一的日志输出接口：
 * - 自动时间戳 `[HH:MM:SS]`
 * - 环境变量 LOG_LEVEL 控制输出粒度（debug|info|warn|error|silent）
 * - info/warn 写 stdout，error 写 stderr
 *
 * 用法：
 *   import { info, warn, error, success, debug } from './log.mjs';
 *   info('构建完成，产物大小 %d KB', 470);
 *   warn('跳过缓存已过期的条目');
 *   error('缺少必需文件: %s', path);
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

function currentLevel() {
  const env = (typeof process !== 'undefined' && process.env && process.env.LOG_LEVEL) || 'info';
  const l = env.toLowerCase();
  return LEVELS.hasOwnProperty(l) ? LEVELS[l] : LEVELS.info;
}

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
}

function format(msg, args) {
  if (!args.length) return msg;
  let idx = 0;
  return msg.replace(/%[sdj]/g, () => {
    const v = args[idx++];
    if (typeof v === 'string') return v;
    if (v instanceof Error) return v.message;
    return JSON.stringify(v);
  });
}

/**
 * 调试信息（LOG_LEVEL=debug 时输出）
 */
export function debug(msg, ...args) {
  if (currentLevel() > LEVELS.debug) return;
  process.stderr.write(`${ts()} DEBUG ${format(msg, args)}\n`);
}

/**
 * 一般信息（LOG_LEVEL <= info 时输出）
 */
export function info(msg, ...args) {
  if (currentLevel() > LEVELS.info) return;
  process.stdout.write(`${ts()} ${format(msg, args)}\n`);
}

/**
 * 成功信息，前缀 ✓
 */
export function success(msg, ...args) {
  if (currentLevel() > LEVELS.info) return;
  process.stdout.write(`${ts()} ✓ ${format(msg, args)}\n`);
}

/**
 * 警告信息（LOG_LEVEL <= warn 时输出）
 */
export function warn(msg, ...args) {
  if (currentLevel() > LEVELS.warn) return;
  process.stderr.write(`${ts()} ⚠ ${format(msg, args)}\n`);
}

/**
 * 错误信息（LOG_LEVEL <= error 时输出，始终写 stderr）
 */
export function error(msg, ...args) {
  if (currentLevel() > LEVELS.error) return;
  process.stderr.write(`${ts()} ✗ ${format(msg, args)}\n`);
}

/**
 * 纯消息（不带时间戳），用于表格/分隔线等格式化输出。
 * 不受 LOG_LEVEL 限制，始终输出（除非 silent）。
 */
export function plain(msg, ...args) {
  if (currentLevel() >= LEVELS.silent) return;
  process.stdout.write(`${format(msg, args)}\n`);
}
