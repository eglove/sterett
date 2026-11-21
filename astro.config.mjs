import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";
import { google } from "emdash/auth/providers/google";
import { emdashSmtp } from "emdash-smtp";

export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		emdash({
			database: d1({ binding: "DB", session: "auto", coalesce: true }),
			storage: r2({ binding: "MEDIA" }),
			// Cloudflare's edge accepts 100 MB request bodies on the free plan, so
			// that is the ceiling for anything uploaded through the Worker.
			maxUploadSize: 100 * 1024 * 1024,
			authProviders: [google()],
			plugins: [emdashSmtp()]
		}),
	],
	devToolbar: { enabled: false },
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Newsreader",
			cssVariable: "--font-display",
			weights: [400, 500, 600],
			styles: ["normal", "italic"],
			subsets: ["latin"],
		},
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-body",
			weights: [400, 500, 600],
			subsets: ["latin"],
		},
	],
});
