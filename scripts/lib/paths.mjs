/**
 * 公共路径工具：导出 SKILL_ROOT（项目根）与 readIf（安全读取文件）。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SKILL_ROOT = path.join(__dirname, '../..');

/**
 * 文件存在则读取并 trim，否则返回空字符串。
 */
export function readIf(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : '';
}
