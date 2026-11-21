/*
 * Page-side half of the service-worker retirement. See public/sw.js for the
 * worker half.
 *
 * The previous site on this domain installed a Vite PWA worker at /sw.js with
 * scope "/", so returning visitors were still being served its precached HTML,
 * JS and CSS. The worker at /sw.js now deletes itself and its caches, but this
 * runs on every page as well, so a visitor whose HTML happens to be fresh still
 * gets the origin's caches emptied and the registration removed.
 *
 * Delete this file along with public/sw.js once the old worker's traffic drains.
 */

const RETIRED_KEY = "sw-retirement-reloaded";

async function retireServiceWorker(): Promise<void> {
	if (!("serviceWorker" in navigator)) return;

	const registrations = await navigator.serviceWorker.getRegistrations();
	const ours = registrations.filter((registration) => {
		const script =
			registration.active?.scriptURL ??
			registration.installing?.scriptURL ??
			registration.waiting?.scriptURL;
		return script ? new URL(script).pathname === "/sw.js" : false;
	});
	if (ours.length === 0) return;

	await Promise.all(
		ours.map((registration) => registration.unregister().catch(() => false)),
	);

	if ("caches" in window) {
		const names = await caches.keys();
		await Promise.all(names.map((name) => caches.delete(name)));
	}

	// The page on screen was built from the old worker's cached copy. Reload it
	// once, from the network, so the visitor sees the current site. The guard
	// keeps a browser that cannot shed the worker from reloading in a loop.
	if (sessionStorage.getItem(RETIRED_KEY)) return;
	sessionStorage.setItem(RETIRED_KEY, "1");
	location.reload();
}

retireServiceWorker().catch(() => {
	// Nothing here is worth breaking a page over. The worker at /sw.js is the
	// mechanism that matters; this is the fallback.
});
