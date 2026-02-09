const CACHE_NAME = 'bolajon-med-v2.2';
const STATIC_CACHE = 'bolajon-static-v2.2';
const DYNAMIC_CACHE = 'bolajon-dynamic-v2.2';
const IMAGE_CACHE = 'bolajon-images-v2.2';

// Static files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/image.jpg',
  '/manifest.json',
  '/admin.html',
  '/admin-styles.css',
  '/admin-script.js'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2.2...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Cache failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2.2...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== IMAGE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service Worker activated');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event - advanced caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strategy 1: Cache First for static assets
  if (STATIC_FILES.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy 2: Cache First for images
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Strategy 3: Network First for HTML pages
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Strategy 4: Stale While Revalidate for CSS/JS
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // Default: Network First
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    return offlineFallback(request);
  }
}

// Network First Strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return offlineFallback(request);
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached || fetchPromise;
}

// Offline Fallback
function offlineFallback(request) {
  if (request.destination === 'document') {
    return new Response(
      `<!DOCTYPE html>
      <html lang="uz">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Bolajon Med</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 20px;
          }
          .offline-container {
            max-width: 500px;
          }
          .offline-icon {
            font-size: 80px;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          h1 {
            font-size: 32px;
            margin-bottom: 16px;
          }
          p {
            font-size: 18px;
            margin-bottom: 30px;
            opacity: 0.9;
          }
          .btn {
            display: inline-block;
            padding: 12px 30px;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: transform 0.2s;
          }
          .btn:hover {
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📡</div>
          <h1>Internet aloqasi yo'q</h1>
          <p>Iltimos, internet aloqangizni tekshiring va qaytadan urinib ko'ring.</p>
          <a href="/" class="btn" onclick="window.location.reload(); return false;">
            🔄 Qayta urinish
          </a>
        </div>
      </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }

  return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
}

// Background Sync (for future use)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
});

async function syncAppointments() {
  // Placeholder for syncing offline appointments
  console.log('[SW] Syncing appointments...');
}

// Push Notification (for future use)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Bolajon Med';
  const options = {
    body: data.body || 'Yangi xabar',
    icon: '/image.jpg',
    badge: '/image.jpg',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Ochish' },
      { action: 'close', title: 'Yopish' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});

// Message from client
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
