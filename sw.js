const CACHE_NAME = 'cache_v1';
let urlsToCache = [
  '/',
  '/css/styles.css',
  '/restaurant.html'
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) =>{
  event.respondWith(
    caches.match(event.request)
      .then((response) =>{
        if (response) {
          return response;
        }

        //A request is a stream and needs to be consumed once. So, the clone
        let fetchRequest = event.request.clone();
        return fetch(fetchRequest).then((response) => {
            //Checking if there's a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            //Also, a response is a stream and needs to be consumed once. So, the clone
            let responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) =>{
                cache.put(event.request, responseToCache);
            });
            return response;
          }
        );
      })
    );
});


self.addEventListener('activate', (event) => {
  let cacheWhitelist = ['cache_v1'];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});



