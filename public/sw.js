self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', async () => {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  } catch(e) {}
  try { await self.registration.unregister(); } catch(e) {}
  try {
    const all = await clients.matchAll({ includeUncontrolled: true, type: 'window' });
    for (const c of all) {
      try { await c.navigate(c.url); } catch(e) {
        try { c.postMessage({ type: 'SW_RELOAD' }); } catch(e2) {}
      }
    }
  } catch(e) {}
});
