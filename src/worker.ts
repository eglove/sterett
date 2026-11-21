import handler, {
	createScheduledHandler,
	EmDashRoom,
	EmDashRoomSite,
	PluginBridge,
} from "@emdash-cms/cloudflare/worker";

export { EmDashRoom, EmDashRoomSite, PluginBridge };

/** The canonical host the site is served from. */
const CANONICAL_HOST = "sterettcreekvillagetrustee.com";

/** The host that redirects to the canonical one. */
const REDIRECT_HOST = "www.sterettcreekvillagetrustee.com";

/**
 * Send www requests to the same path and query on the apex host. Returns null
 * for every other host, so workers.dev previews and local dev keep working.
 */
function canonicalRedirect(request: Request): Response | null {
	const url = new URL(request.url);
	if (url.hostname !== REDIRECT_HOST) return null;
	url.hostname = CANONICAL_HOST;
	url.protocol = "https:";
	url.port = "";
	return Response.redirect(url.toString(), 301);
}

export default {
	...handler,
	fetch(request, env, ctx) {
		const redirect = canonicalRedirect(request);
		if (redirect) return redirect;
		return handler.fetch(request, env, ctx);
	},
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
