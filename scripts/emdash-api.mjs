#!/usr/bin/env node
/**
 * Thin authenticated client for the EmDash admin API.
 *
 * The dev server authenticates with the dev-bypass cookie. Request bodies are
 * written to a UTF-8 file and sent with --data-binary @file: passing JSON as a
 * command-line argument mangles non-ASCII characters on Windows.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const jar = join(here, ".cookies.txt");
const base = process.env.EMDASH_URL ?? "http://localhost:4321";

export function login() {
	execFileSync("curl", ["-s", "-c", jar, `${base}/_emdash/api/auth/dev-bypass`], {
		encoding: "utf8",
	});
}

export function request(method, path, body) {
	const args = ["-s", "-b", jar, "-X", method, "-H", "X-EmDash-Request: 1"];
	let scratch;
	if (body !== undefined) {
		scratch = mkdtempSync(join(tmpdir(), "emdash-"));
		const file = join(scratch, "body.json");
		writeFileSync(file, JSON.stringify(body), "utf8");
		args.push("-H", "Content-Type: application/json", "--data-binary", `@${file}`);
	}
	args.push(`${base}${path}`);
	try {
		const raw = execFileSync("curl", args, { encoding: "utf8" });
		try {
			return JSON.parse(raw);
		} catch {
			return { raw };
		}
	} finally {
		if (scratch) rmSync(scratch, { recursive: true, force: true });
	}
}

export const get = (path) => request("GET", path);
export const post = (path, body) => request("POST", path, body);
export const put = (path, body) => request("PUT", path, body);

export function fail(result, label) {
	if (result && result.success === false) {
		console.error(`${label} failed:`, JSON.stringify(result, null, 2));
		process.exitCode = 1;
		return true;
	}
	return false;
}
