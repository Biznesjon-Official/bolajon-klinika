const CACHE_NAME = 'bolajon-med-app-v1.1';
const STATIC_CACHE = 'bolajon-app-static-v1.1';
const DYNAMIC_CACHE = 'bolajon-app-dynamic-v1.1';
const API_CACHE = 'bolajon-app-api-v1.1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/image.jpg'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[App SW] Installing Service Worker v1.1...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[App SW] Caching app shell');
        return cache.addAll(urlsToCache).catch((error) => {
          console.error('[App SW] Cache failed:', error);
        });
      })
      .then(() => {
        console.log('[App SW] Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[App SW] Activating Service Worker v1.1...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[App SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[App SW] Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - Network first for API, Cache first for static
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

  // API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // Static assets - Cache first
  if (urlsToCache.includes(url.pathname) || 
      request.destination === 'image' ||
      request.destination === 'style' ||
      request.destination === 'script') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirst(request));
});

// Cache First Strategy
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[App SW] Cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[App SW] Fetch failed:', error);
    return offlineFallback(request);
  }
}

// Network First Strategy
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[App SW] Network failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return offlineFallback(request);
  }
}

// Network First for API with timeout
async function networkFirstAPI(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    
    const response = await Promise.race([
      fetch(request),
      timeoutPromise
    ]);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[App SW] API request failed, trying cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline response for API
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internet aloqasi yo\'q. Iltimos, qayta urinib ko\'ring.',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
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
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
            color: #10b981;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: transform 0.2s;
            border: none;
            cursor: pointer;
            font-size: 16px;
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
          <button class="btn" onclick="window.location.reload()">
            🔄 Qayta urinish
          </button>
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

// Message from client
self.addEventListener('message', (event) => {
  console.log('[App SW] Message received:', event.data);
  
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
