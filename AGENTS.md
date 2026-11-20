This is an EmDash site -- a CMS built on Astro with a full admin UI.

## Commands

```bash
pnpm dev              # Start the Astro dev server
npx emdash types      # Regenerate TypeScript types from a running site
```

The admin UI is at `http://localhost:4321/_emdash/admin`.

## Key Files

| File                     | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `astro.config.mjs`       | Astro config with `emdash()` integration, database, and storage                    |
| `src/live.config.ts`     | EmDash loader registration (boilerplate -- don't modify)                           |
| `seed/seed.json`         | Schema definition + demo content (collections, fields, taxonomies, menus, widgets) |
| `emdash-env.d.ts`        | Generated types for collections (auto-regenerated on dev server start)             |
| `src/layouts/Base.astro` | Base layout with EmDash wiring (menus, search, page contributions)                 |
| `src/pages/`             | Astro pages -- all server-rendered                                                 |

## Skills

Agent skills are in `.agents/skills/`. Load them when working on specific tasks:

- **building-emdash-site** -- Querying content, rendering Portable Text, schema design, seed files, site features (menus, widgets, search, SEO, comments, bylines). Start here.
- **creating-plugins** -- Building EmDash plugins with hooks, storage, admin UI, API routes, and Portable Text block types.
- **emdash-cli** -- CLI commands for content management, seeding, type generation, and visual editing flow.

## Documentation

The EmDash docs are available as an MCP server at `https://docs.emdashcms.com/mcp`. When you need to verify an API, hook, config option, field type, or pattern, call `search_docs` against the live documentation rather than relying on training-data recall. The docs reflect current behaviour; assumptions may not.

This template ships with `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json` so Claude Code, Cursor, and VS Code auto-discover the docs server. Other tools (OpenCode, Windsurf, etc.) need a manual one-time setup -- see [docs.emdashcms.com/docs-mcp](https://docs.emdashcms.com/docs-mcp).

## Rules

- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are objects (`{ src, alt }`), not strings. Use `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- When Astro's cache is enabled, pass content-query hints to `Astro.cache.set(cacheHint)`. Use the `WithCacheHint` variants for site settings, menus, taxonomies, and widget areas rendered by cached routes.
- Taxonomy names in queries must match the seed's `"name"` field exactly (e.g., `"category"` not `"categories"`).

## This Template

A village site with covenants, pages, and trustees. The design lives in `src/styles/theme.css` (palette, type scale, spacing tokens) and in each page's `<style>` block. Fonts are Newsreader (display) and Inter (body), bound to `--font-display` and `--font-body` in `astro.config.mjs`.

## Pages

| Page      | Path          | What it shows                                        |
| --------- | ------------- | ---------------------------------------------------- |
| Home      | `/`           | The `pages` entry with slug `home`                   |
| Page      | `/[slug]`     | Any other `pages` entry                              |
| Trustees  | `/trustees`   | The `trustees` collection                            |
| Covenants | `/covenants`  | The `covenants` collection                           |
| Admin     | `/admin`      | Redirects to the EmDash admin UI at `/_emdash/admin` |
| Not found | `/404`        | Rendered for unknown routes                          |

## Schema

- `pages` collection: `title`, `content` (Portable Text).
- `trustees` collection: `name`, `title`, `phonenumber`, `image`.
- `covenants` collection: `file`.
- Single `primary` menu.

There is no `posts` collection and no page routes for posts, categories, or tags. The
`category` and `tag` taxonomy definitions still exist in `seed/seed.json` and in the live
database, but they point at the missing `posts` collection and are unused.

Site settings have `title` and `tagline`.

## Visual character

Lake water, limestone paper, Ozark clay. Tokens live in `src/styles/theme.css`:
`--paper`, `--ink`, `--water`, `--clay`, a fluid type scale (`--step--1` .. `--step-5`),
spacing (`--space-2xs` .. `--space-2xl`), and layout primitives (`.shell`, `.section`,
`.prose`, `.button`). Reuse those tokens; do not introduce new raw colours.

## Editing style

- Page-specific styles go in that page's `<style>` block and reference the tokens.
- Shared primitives belong in `theme.css`, not duplicated across pages.
- Content prose comes from the CMS; the page only sets rhythm and type size around it.

## What not to do

- Don't add component libraries (Tailwind UI, shadcn, etc.) without considering what they bring with them. The site is small on purpose.
- Don't hardcode colours or font stacks; use the CSS variables so a palette change is one edit.
