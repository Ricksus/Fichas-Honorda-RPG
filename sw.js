const CACHE_NAME = 'honorda-rpg-v1';

// Arquivos essenciais para funcionar offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
  // Adicione aqui as imagens de ícone quando as criar:
  // './icon-192.png',
  // './icon-512.png'
];

// Instalação do Service Worker e cacheamento inicial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Fazendo cache dos arquivos...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Não forçamos o skipWaiting aqui para evitar quebrar a página que já está aberta,
  // isso é controlado pelo seu HTML.
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Apagando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Escuta a mensagem enviada pelo HTML para atualizar a versão imediatamente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Estratégia de Fetch (Cache First com Stale-While-Revalidate para recursos estáticos)
self.addEventListener('fetch', (event) => {
  // Ignora requisições para a API do GitHub (não queremos colocar o Gist Sync em cache)
  if (event.request.url.includes('api.github.com')) {
    return; // Deixa o navegador lidar normalmente pela rede
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Faz a busca na rede em segundo plano para manter o cache atualizado
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Se a resposta for válida, atualiza o cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Ignora erros de rede se estiver offline
      });

      // Retorna o que estiver no cache imediatamente. Se não houver, espera a rede.
      return cachedResponse || fetchPromise;
    })
  );
});