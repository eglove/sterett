#!/usr/bin/env node
import { login, get, post, fail } from './emdash-api.mjs';
login();

const existing = await get('/_emdash/api/widget-areas');
const areas = existing.data?.items ?? [];
console.log('existing areas:', areas.map(a => a.name).join(', ') || '(none)');
if (areas.some(a => a.name === 'footer')) {
  console.log('footer area already exists');
  process.exit(0);
}
const area = await post('/_emdash/api/widget-areas', {
  name: 'footer',
  label: 'Footer',
  description: 'Contact details shown in the site footer on every page.',
});
if (fail(area, 'create area')) process.exit(1);
console.log('area created:', area.data?.item?.name ?? area.data?.name);
