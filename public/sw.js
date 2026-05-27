// IronGame SW — self-destruct. Unregisters itself and clears all caches.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  await self.registration.unregister();
  const all = await clients.matchAll({ type: 'window' });
  all.forEach(c => { try { c.navigate(c.url); } catch(e) {} });
});
