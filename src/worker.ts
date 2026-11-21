import workerDefault, {
	createScheduledHandler,
	EmDashRoom,
	EmDashRoomSite,
	PluginBridge,
} from "@emdash-cms/cloudflare/worker";
import { CONFIRM_PATH, UPLOAD_PATH, compressUpload, stripConfirmSize } from "./lib/pdf/upload-middleware";

export { EmDashRoom, EmDashRoomSite, PluginBridge };

// Lossless PDF compression. EmDash's media:beforeUpload hook only receives file
// metadata, and its upload routes enforce the size recorded when the upload was
// minted, so compression has to happen here: before the route runs, moving the
// pending row's size in step with the bytes. Non-PDFs pass through untouched.
export default {
	...workerDefault,
	async fetch(request: Request, env: any, ctx: any) {
		const url = new URL(request.url);
		if (request.method === "PUT" && UPLOAD_PATH.test(url.pathname)) {
			request = (await compressUpload(request, env)).request;
		} else if (request.method === "POST" && CONFIRM_PATH.test(url.pathname)) {
			request = await stripConfirmSize(request);
		}
		return workerDefault.fetch(request as any, env, ctx);
	},
	scheduled: createScheduledHandler(),
} satisfies ExportedHandler;
