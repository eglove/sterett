# Sterett Creek Village

The village website for Sterett Creek Village (Warsaw, Missouri): the board of
trustees, the covenants, and the village's own pages. Content is edited in a CMS
rather than in code, so the board can update the site without a developer.

Built with [EmDash](https://github.com/emdash-cms/emdash) on Astro, deployed to
Cloudflare Workers with D1 for the database and R2 for media.

## Pages

| Route | What it shows |
|---|---|
| `/` | Home page, from the `pages` entry with slug `home` |
| `/[slug]` | Any other `pages` entry |
| `/trustees` | The board roster from the `trustees` collection |
| `/covenants` | The covenants documents from the `covenants` collection |
| `/contact` | Contact form |
| `/admin` | Redirects to the EmDash admin UI |
| `/404` | Not found |

All pages are server-rendered. There is no static generation for CMS content.

## Local development

```bash
pnpm install
pnpm dev
```

The site runs at http://localhost:4321 and the admin UI at
http://localhost:4321/_emdash/admin. On first run the setup wizard creates the
local database and applies the seed in `seed/seed.json`.

Regenerate TypeScript types from a running site with:

```bash
npx emdash types
```

## Content

Content lives in the CMS, not in the repository. The seed file `seed/seed.json`
holds the schema (collections, fields, taxonomies, menus, widgets) and the demo
content used to bootstrap a fresh database. Editing content in the admin UI does
not change the seed; the seed only takes effect when a database is created from
scratch.

Collections:

- `pages` — title and Portable Text content
- `trustees` — name, title, phone number, portrait
- `covenants` — document name and file

## Deployment

```bash
pnpm deploy
```

This builds the site and deploys it with Wrangler. The D1 database and R2 bucket
are provisioned from `wrangler.jsonc` on first deploy.

The site is served on `sterettcreekvillagetrustee.com`. `wrangler.jsonc` routes
both the apex and `www` to the Worker as custom domains; `src/worker.ts` sends
`www` requests to the apex with a 301 so there is one canonical origin.

## Configuration

Runtime secrets are not committed. Set them locally in `.env` and in production
with `wrangler secret put`. The site expects:

- `EMDASH_ENCRYPTION_KEY` — encrypts stored credentials
- `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS` — the
  contact form's outgoing mail
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — optional sign-in

## License

MIT. See `LICENSE`.
