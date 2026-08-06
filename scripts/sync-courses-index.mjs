import fs from 'fs';
import path from 'path';

import { SKILL_ROOT } from './lib/paths.mjs';

const portalPath = path.join(SKILL_ROOT, 'templates/portal.index.html');
const coursesIndex = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), 'courses/index.html');

const portal = fs.readFileSync(portalPath, 'utf8');
if (portal.includes('{{COURSES_JSON}}')) {
  throw new Error('portal.index.html still contains {{COURSES_JSON}}; remove embedded catalog first');
}
fs.writeFileSync(coursesIndex, portal, 'utf8');
console.log('Synced ' + coursesIndex + ' (catalog from courses.json only)');
