// Request rewriting for PDF uploads.
//
// EmDash records a pending media row's size when the upload is minted, then
// enforces that number three times: against Content-Length, against the bytes
// received, and against the size storage reports. Shrinking a PDF therefore
// requires moving the row's size in step with the bytes, or the upload is
// rejected as a mismatch. These helpers run before the route so the row is
// already correct when the route reads it.
import { compressPdf, isPdf } from "./compress";

export const UPLOAD_PATH = /\/_emdash\/api\/media\/[^/]+\/upload$/;
export const CONFIRM_PATH = /\/_emdash\/api\/media\/[^/]+\/confirm$/;

function mediaIdFrom(pathname: string): string | null {
	const parts = pathname.split("/").filter(Boolean);
	const i = parts.indexOf("media");
	if (i < 0 || i + 1 >= parts.length) return null;
	return parts[i + 1];
}

export interface CompressOutcome {
	request: Request;
	compressed: boolean;
	originalSize: number;
	finalSize: number;
}

export async function compressUpload(request: Request, env: any): Promise<CompressOutcome> {
	const contentType = request.headers.get("Content-Type") ?? "";
	if (!isPdf(contentType)) {
		return { request, compressed: false, originalSize: 0, finalSize: 0 };
	}

	const original = new Uint8Array(await request.arrayBuffer());
	let body: Uint8Array = original;

	try {
		const result = await compressPdf(original);
		if (result.compressedSize > 0 && result.compressedSize < result.originalSize) {
			body = result.bytes;
		}
	} catch (error) {
		console.error("[pdf-compress] compression failed, storing original:", error);
	}

	if (body !== original) {
		const id = mediaIdFrom(new URL(request.url).pathname);
		let kept = false;
		if (id && env?.DB) {
			try {
				await env.DB.prepare(
				`UPDATE media SET size = ? WHERE id = ? AND status = 'pending'`,
				).bind(body.byteLength, id).run();
				kept = true;
			} catch (error) {
				console.error("[pdf-compress] size update failed, storing original:", error);
		}
		}
		// If the row could not be moved in step, keep the original bytes so the
		// upload still succeeds at its declared size.
		if (!kept) body = original;
	}

	const headers = new Headers(request.headers);
	headers.delete("Content-Length");
	const rewritten = new Request(request.url, {
		method: request.method,
		headers,
		body: body as BodyInit,
	});

	return {
		request: rewritten,
		compressed: body !== original,
		originalSize: original.byteLength,
		finalSize: body.byteLength,
	};
}

// The admin echoes the size it was told at mint time. That number is stale for
// a compressed PDF, and the confirm route rejects a mismatch, so drop it and let
// the route read the size from storage.
export async function stripConfirmSize(request: Request): Promise<Request> {
	const contentType = request.headers.get("Content-Type") ?? "";
	if (!contentType.includes("json")) return request;

	const text = await request.text();
	let payload: any;
	try {
		payload = JSON.parse(text);
	} catch {
		return new Request(request.url, { method: request.method, headers: request.headers, body: text });
	}

	if (payload && typeof payload === "object" && "size" in payload) {
		delete payload.size;
		const headers = new Headers(request.headers);
		headers.delete("Content-Length");
		return new Request(request.url, { method: request.method, headers, body: JSON.stringify(payload) });
	}

	return new Request(request.url, { method: request.method, headers: request.headers, body: text });
}
