#!/usr/bin/env node
/**
 * Pull production's content types into the local dev database.
 *
 * `emdash export-seed` only opens a local SQLite file, and production lives in
 * D1. So the pull dumps D1 to SQL, loads that into a scratch database, exports
 * a seed from the scratch copy, and applies the seed to the local dev database.
 *
 * The dump is split into four files because one `wrangler d1 export` cannot be
 * restored: `--remote` refuses a database holding FTS5 virtual tables (EmDash
 * keeps its search index there), and media folders must load before the rows
 * that reference them. Indexes and triggers are created last so they do not
 * fire while the rows import.
 *
 * The seed lands in `.pull-prod/` by default, which is ignored by git and is
 * not one of the paths the build embeds. Pass `--out` to write it somewhere
 * else, such as `seed/seed.json`, when you mean to commit production's model.
 *
 * Usage:
 *   pnpm pull:prod                 content types only, applied to the dev database
 *   pnpm pull:prod --with-content  include production's entries as well
 *   pnpm pull:prod --no-apply      write the seed file and stop
 *   pnpm pull:prod --out <path>    write the seed somewhere else
 */

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const wrangler = join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const emdash = join(root, "node_modules", "emdash", "dist", "cli", "index.mjs");
const binding = "DB";

const argv = process.argv.slice(2);
const withContent = argv.includes("--with-content");
const apply = !argv.includes("--no-apply");
const outIndex = argv.indexOf("--out");
const seedPath = outIndex === -1 ? join(root, ".pull-prod", "seed.json") : resolve(argv[outIndex + 1]);
const port = Number(new URL(process.env.EMDASH_URL ?? "http://localhost:4321").port || 4321);

const FINGERPRINT =
	"SELECT (SELECT COUNT(*) FROM users)||'|'||(SELECT COUNT(*) FROM options)||'|'||(SELECT COUNT(*) FROM sqlite_master) AS fp";

function run(script, args) {
	const result = spawnSync(process.execPath, [script, ...args], {
		cwd: root,
		encoding: "utf8",
		maxBuffer: 64 * 1024 * 1024,
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		const detail = (result.stderr || result.stdout || "").trim();
		const label = script === wrangler ? "wrangler" : "emdash";
		throw new Error(label + " " + args.join(" ") + " failed (exit " + result.status + ")\n" + detail);
	}
	return result.stdout;
}

function rows(raw) {
	const parsed = JSON.parse(raw);
	return (Array.isArray(parsed) ? parsed : [parsed]).flatMap((entry) => entry.results ?? []);
}

function portOpen() {
	return new Promise((done) => {
		const socket = connect({ host: "127.0.0.1", port });
		const finish = (open) => {
			socket.destroy();
			done(open);
		};
		socket.setTimeout(600);
		socket.once("connect", () => finish(true));
		socket.once("error", () => finish(false));
		socket.once("timeout", () => finish(false));
	});
}

function findLocalDatabase() {
	const target = rows(run(wrangler, ["d1", "execute", binding, "--local", "--json", "--command", FINGERPRINT]))[0]?.fp;
	if (target === undefined) throw new Error("wrangler d1 execute --local returned no fingerprint row");

	const dir = join(root, ".wrangler", "state", "v3", "d1", "miniflare-D1DatabaseObject");
	if (!existsSync(dir)) throw new Error("No local D1 state at " + dir + ". Run pnpm dev once first.");

	const matches = [];
	for (const name of readdirSync(dir)) {
		if (!name.endsWith(".sqlite") || name === "metadata.sqlite") continue;
		const file = join(dir, name);
		const db = new DatabaseSync(file, { readOnly: true });
		try {
			if (db.prepare(FINGERPRINT).get()?.fp === target) matches.push(file);
		} catch {
			// Not an EmDash database; skip it.
		} finally {
			db.close();
		}
	}

	if (matches.length === 1) return matches[0];
	if (matches.length === 0) throw new Error("No local D1 database matched the configured binding (fingerprint " + target + ").");
	throw new Error(matches.length + " local D1 databases matched the fingerprint; cannot tell which one the dev server uses.");
}

if (await portOpen()) {
	console.error("The dev server is running on port " + port + ". Stop it first: this writes to the local database and a running server holds it open.");
	process.exit(1);
}

const scratch = mkdtempSync(join(tmpdir(), "pull-prod-"));
try {
	const tables = rows(
		run(wrangler, [
			"d1", "execute", binding, "--remote", "--json", "--command",
			"SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT GLOB '_emdash_fts_*' AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_cf_*' AND name != 'media_folders'",
		]),
	).map((row) => row.name);
	if (tables.length === 0) throw new Error("Production reported no tables; is the D1 database deployed?");

	const tableArgs = tables.map((name) => "--table=" + name);
	const schemaSql = join(scratch, "backup-schema.sql");
	const foldersSql = join(scratch, "backup-folders.sql");
	const dataSql = join(scratch, "backup-data.sql");
	const indexesSql = join(scratch, "backup-indexes.sql");

	run(wrangler, ["d1", "export", binding, "--remote", "--no-data", "--output=" + schemaSql, "--table=media_folders", ...tableArgs]);
	run(wrangler, ["d1", "export", binding, "--remote", "--no-schema", "--output=" + foldersSql, "--table=media_folders"]);
	run(wrangler, ["d1", "export", binding, "--remote", "--no-schema", "--output=" + dataSql, ...tableArgs]);

	const indexes = rows(
		run(wrangler, [
			"d1", "execute", binding, "--remote", "--json", "--command",
			"SELECT sql FROM sqlite_master WHERE type IN ('index', 'trigger') AND sql IS NOT NULL AND name NOT GLOB '_emdash_fts_*' AND tbl_name NOT GLOB '_emdash_fts_*' AND tbl_name NOT GLOB '_cf_*'",
		]),
	).map((row) => row.sql + ";");
	writeFileSync(indexesSql, indexes.join("\n"), "utf8");

	const prodDb = join(scratch, "prod.db");
	const db = new DatabaseSync(prodDb);
	for (const file of [schemaSql, foldersSql, dataSql, indexesSql]) db.exec(readFileSync(file, "utf8"));
	db.close();

	const seedArgs = ["export-seed", "--database", prodDb];
	if (withContent) seedArgs.push("--with-content=all");
	const seed = run(emdash, seedArgs);

	mkdirSync(dirname(seedPath), { recursive: true });
	writeFileSync(seedPath, seed, "utf8");
	console.log("Pulled " + tables.length + " tables from production.");
	console.log("Wrote " + seedPath + (withContent ? " (content types and entries)." : " (content types only)."));

	if (apply) {
		const localDb = findLocalDatabase();
		const backup = localDb + ".pull-prod-backup";
		for (const suffix of ["", "-wal", "-shm"]) {
			if (existsSync(localDb + suffix)) copyFileSync(localDb + suffix, backup + suffix);
		}
		console.log("Backed up the dev database to " + backup);
		console.log(run(emdash, ["seed", seedPath, "--database", localDb, "--on-conflict", "update"]).trim());
	} else {
		console.log("Skipped applying to the dev database (--no-apply).");
	}
} finally {
	rmSync(scratch, { recursive: true, force: true });
}