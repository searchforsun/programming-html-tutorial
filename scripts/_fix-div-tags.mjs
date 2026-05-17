import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../courses/apache-flink/chapters');
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.html')) continue;
  const p = path.join(dir, f);
  let s = fs.readFileSync(p, 'utf8');
  if (!s.includes('motion')) continue;
  s = s.replaceAll('<motion ', '<div ').replaceAll('</motion>', '</div>');
  fs.writeFileSync(p, s, 'utf8');
  console.log('fixed', f);
}
