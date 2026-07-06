// Service worker do Florisbela Catering
// Faz cache apenas do "shell" do app (HTML/ícones/manifest) para abrir mais rápido
// e funcionar minimamente offline. As chamadas ao Supabase (dados) sempre
// passam direto pela rede — nunca são interceptadas aqui, pois os dados
// precisam estar sempre atualizados.

const CACHE_NAME = "florisbela-shell-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Só cuida de requisições GET, do mesmo domínio do app.
  // Tudo que for para outro domínio (ex: Supabase, fontes, CDN) passa direto pela rede.
  if (req.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      // Cache-first para abrir instantâneo; atualiza em segundo plano.
      return cached || network;
    })
  );
});
