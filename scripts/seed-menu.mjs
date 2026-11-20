#!/usr/bin/env node
import { login, get, post, fail } from './emdash-api.mjs';
login();
const menu = await get('/_emdash/api/menus/primary');
if (fail(menu, 'read menu')) process.exit(1);
const existing = menu.data.items ?? [];
console.log('existing items:', existing.length);
if (existing.length > 0) { console.log('menu already populated, skipping'); process.exit(0); }
const items = [
  { type: 'custom', label: 'Home', customUrl: '/', sortOrder: 0 },
  { type: 'custom', label: 'Trustees', customUrl: '/trustees', sortOrder: 1 },
  { type: 'custom', label: 'Covenants', customUrl: '/covenants', sortOrder: 2 },
];
for (const item of items) {
  const r = await post('/_emdash/api/menus/primary/items', item);
  if (fail(r, 'create item ' + item.label)) process.exit(1);
  console.log('created:', item.label);
}
const after = await get('/_emdash/api/menus/primary');
console.log('items now:', (after.data.items ?? []).length);
