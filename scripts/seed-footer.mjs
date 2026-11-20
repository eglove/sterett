#!/usr/bin/env node
import { login, get, post, fail } from './emdash-api.mjs';
login();

const area = await get('/_emdash/api/widget-areas/footer');
if (fail(area, 'read footer area')) process.exit(1);
const widgets = area.data?.widgets ?? [];
console.log('existing widgets:', widgets.length);
if (widgets.length > 0) { console.log('already populated'); process.exit(0); }

const paragraph = (key, text) => ({
  _type: 'block', _key: key, style: 'normal', markDefs: [],
  children: [{ _type: 'span', _key: key + '-s', text, marks: [] }],
});

const w = await post('/_emdash/api/widget-areas/footer/widgets', {
  type: 'content',
  title: 'Village office',
  content: [
    paragraph('f1', 'Village Office'),
    paragraph('f2', '18597 Sterett Creek Village Dr'),
    paragraph('f3', 'Warsaw, MO 65355'),
    paragraph('f4', '(660) 438-2251'),
  ],
});
if (fail(w, 'create widget')) process.exit(1);
console.log('widget created');
