/*
 * Service worker retirement.
 *
 * The previous site on this domain registered a Vite PWA service worker at this
 * exact URL, with scope "/". A browser that still has it installed keeps serving
 * its precached HTML, JS and CSS for every page on the domain, and a 404 here
 * does not remove it: the only way a browser ever updates a worker is by fetching
 * this URL and finding different bytes. So this URL keeps answering, and what it
 * answers is "delete yourself".
 *
 * This worker installs over the old one, empties every cache the origin owns,
 * reloads the pages it was controlling so they come from the network, and then
 * removes its own registration. It deliberately has no fetch handler and never
 * calls clients.claim(), so it cannot itself become the stale copy.
 *
 * Delete this file once the old worker's traffic has drained.
 */

self.addEventListener('install', (event) => {
	// Replace the old worker now instead of waiting for every tab to close.
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// 1. Empty every cache the origin owns. The old worker's precache and
			//    its runtime caches all live here.
			const names = await caches.keys();
			await Promise.all(names.map((name) => caches.delete(name)));

			// 2. Reload the pages this worker was controlling. The page already on
			//    screen was built from the old worker's cached copy, so a reload is
			//    the only way it comes from the network.
			const clients = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true,
			});
			await Promise.all(
				clients.map((client) =>
					client.navigate(client.url).catch(() => undefined),
				),
			);

			// 3. Remove the registration. Nothing re-registers this worker, so the
			//    next page load runs with no service worker at all.
			try {
				await self.registration.unregister();
			} catch {
				// A browser that refuses this still has the reload above and the
				// page-side cleanup in the layout.
			}
		})(),
	);
});
