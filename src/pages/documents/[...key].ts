import type { APIRoute } from "astro";

export const prerender = false;

/**
 * Serve a Media Library document inline, so a visitor can read it in the
 * browser instead of downloading it first.
 *
 * EmDash's own media route sends `Content-Disposition: attachment` for every
 * type that is not an image, video, or audio file, so a covenant link always
 * downloads. This route streams the same bytes from storage with an inline
 * disposition for documents a browser can display, and keeps the attachment
 * behaviour for anything else, so the download link stays the only way to
 * save a file.
 *
 * The URL is `/documents/<storage key>?name=<filename>`. The whole path is
 * the storage key, so a key that contains slashes still resolves. The name is
 * only used to label the file in the browser's own viewer and "save as"
 * dialog; a request without it is served under the key's last segment.
 */

/** Storage prefixes the public media route refuses; this route refuses them too. */
const PRIVATE_PREFIXES = ["backups/", "transfers/"];

/** Types a browser renders without running script. */
const INLINE_TYPES = new Set(["application/pdf"]);

/** The sandbox policy EmDash's media route applies to uploaded content. */
const SANDBOX_CSP =
	"sandbox; default-src 'none'; img-src 'self'; style-src 'unsafe-inline'";

/** Longest filename carried into a header. */
const MAX_NAME_LENGTH = 200;

/**
 * Whether a storage key is one this route must refuse: a key that is not a
 * plain relative path, or one under a prefix the public media route keeps
 * private. Every decoding layer is checked, because storage backends differ
 * in whether they decode keys.
 */
function isRefusedKey(key: string): boolean {
	let candidate = key;
	for (let layer = 0; layer <= 3; layer++) {
		if (candidate.length === 0 || candidate.includes("\\")) return true;
		const segments = candidate.split("/");
		if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
			return true;
		}
		const lower = candidate.toLowerCase();
		if (PRIVATE_PREFIXES.some((prefix) => lower.startsWith(prefix))) return true;
		let decoded: string;
		try {
			decoded = decodeURIComponent(candidate);
		} catch {
			return true;
		}
		if (decoded === candidate) return false;
		candidate = decoded;
	}
	return true;
}

/**
 * The document name for the disposition header: the `name` query parameter
 * when it is a plain filename, otherwise the key's last segment. Control
 * characters are dropped so the header cannot be broken by a crafted URL.
 */
function documentName(url: URL, key: string): string {
	const requested = url.searchParams.get("name") ?? "";
	const cleaned = requested
		.replace(/[\u0000-\u001f\u007f]/g, "")
		.replace(/[\\/]/g, "-")
		.trim()
		.slice(0, MAX_NAME_LENGTH);
	if (cleaned.length > 0) return cleaned;
	const last = key.split("/").pop() ?? key;
	return last.slice(0, MAX_NAME_LENGTH);
}

/**
 * A disposition header naming the file, with an ASCII fallback for clients
 * that do not read the RFC 5987 form.
 */
function disposition(kind: "inline" | "attachment", filename: string): string {
	const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
	const encoded = encodeURIComponent(filename).replace(/['()]/g, (character) =>
		`%${character.charCodeAt(0).toString(16).toUpperCase()}`,
	);
	return `${kind}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function textError(message: string, status: number): Response {
	return new Response(message, {
		status,
		headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
	});
}

export const GET: APIRoute = async ({ params, locals, request, url }) => {
	const key = params.key ?? "";
	if (key.length === 0 || isRefusedKey(key)) return textError("Document not found.", 404);

	const storage = locals.emdash?.storage;
	if (!storage) return textError("Storage is not configured.", 500);

	/* A range request asks for part of the file. Browsers use one to page
	   through a PDF without downloading all of it. */
	const rangeHeader = request.headers.get("Range");
	const range = rangeHeader ? parseRange(rangeHeader) : null;

	let result;
	try {
		result = await storage.download(key, range ? { range } : undefined);
	} catch (error) {
		const code = (error as { code?: string } | null)?.code;
		if (code === "NOT_FOUND") return textError("Document not found.", 404);
		return textError("The document could not be read.", 500);
	}

	const served = result.range;
	const size = result.size;

	/* An adapter that cannot serve a range returns the whole file. A range
	   that starts past the end is answered as unsatisfiable. */
	if (range && !served && size > 0 && !rangeFits(range, size)) {
		const response = new Response(null, { status: 416 });
		response.headers.set("Content-Range", `bytes */${size}`);
		response.headers.set("Accept-Ranges", "bytes");
		response.headers.set("Cache-Control", "no-store");
		return response;
	}

	const contentType = result.contentType || "application/octet-stream";
	const inline = INLINE_TYPES.has(contentType);
	const filename = documentName(url, key);

	const headers: Record<string, string> = {
		"Content-Type": contentType,
		"Accept-Ranges": "bytes",
		"X-Content-Type-Options": "nosniff",
		"Content-Disposition": disposition(inline ? "inline" : "attachment", filename),
		/* Storage keys are never reused for different bytes, so a whole file
		   can be cached indefinitely. A partial response must not be, because
		   the cache keys on the URL alone and would serve the fragment to a
		   request for the whole document. */
		"Cache-Control": served ? "no-store" : "public, max-age=31536000, immutable",
	};
	/* Every response carries EmDash's sandbox policy. It blocks script
	   execution in uploaded content, and Chrome's PDF viewer still displays a
	   sandboxed PDF in the tab, so the inline view keeps the protection. */
	headers["Content-Security-Policy"] = SANDBOX_CSP;

	const body = request.method === "HEAD" ? null : result.body;

	if (served) {
		headers["Content-Range"] = `bytes ${served.offset}-${served.offset + served.length - 1}/${size}`;
		headers["Content-Length"] = String(served.length);
		return new Response(body, { status: 206, headers });
	}

	if (size) headers["Content-Length"] = String(size);
	return new Response(body, { status: 200, headers });
};

/**
 * A byte range from a `Range` header, or null when the header asks for
 * something this route does not serve. `{ suffix }` is the last N bytes.
 */
function parseRange(header: string): { offset: number; length?: number } | { suffix: number } | null {
	const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
	if (!match) return null;
	const [, start, end] = match;
	if (start === "" && end === "") return null;
	if (start === "") {
		const suffix = Number(end);
		return Number.isFinite(suffix) && suffix > 0 ? { suffix } : null;
	}
	const offset = Number(start);
	if (!Number.isFinite(offset)) return null;
	if (end === "") return { offset };
	const last = Number(end);
	if (!Number.isFinite(last) || last < offset) return null;
	return { offset, length: last - offset + 1 };
}

/** Whether a requested range overlaps a file of `size` bytes. */
function rangeFits(range: { offset: number; length?: number } | { suffix: number }, size: number): boolean {
	if ("suffix" in range) return range.suffix > 0;
	return range.offset < size;
}
