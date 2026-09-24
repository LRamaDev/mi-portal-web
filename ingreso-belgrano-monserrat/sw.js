const CACHE='ingreso-bm-v6-14-banco-videos';

const VERSION='6.14';
const VERSIONED=[
  './styles.css?v=6.14',
  './styles-v6.css?v=6.14',
  './badges-v6-9.css?v=6.14',
  './config.js?v=6.14',
  './seguridad.js?v=6.14',
  './banco-v4.js?v=6.14',
  './banco-v5.js?v=6.14',
  './banco-v6.js?v=6.14',
  './banco-v6-10.js?v=6.14',
  './banco-v6-11.js?v=6.14',
  './app.js?v=6.14',
  './simulacros.js?v=6.14',
  './testeo.js?v=6.14',
  './ui-v6.js?v=6.14',
  './ui-v6-4.js?v=6.14',
  './adaptive-v6-8.js?v=6.14',
  './choice-order-v6-8-2.js?v=6.14',
  './badges-v6-9.js?v=6.14'
];

const STATIC=[
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icon.svg',
  './data/habilidades.json',
  './data/ejercicios.json'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...STATIC,...VERSIONED])));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response && response.ok) await cache.put(request,response.clone());
    return response;
  }catch(error){
    const cached=await cache.match(request);
    if(cached) return cached;
    if(request.mode==='navigate'){
      const fallback=await cache.match('./index.html');
      if(fallback) return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE);
  const cached=await cache.match(request);
  if(cached) return cached;
  const response=await fetch(request);
  if(response && response.ok) await cache.put(request,response.clone());
  return response;
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==location.origin) return;

  const freshType =
    request.mode==='navigate' ||
    request.destination==='document' ||
    request.destination==='script' ||
    request.destination==='style' ||
    url.pathname.endsWith('/data/habilidades.json') ||
    /\.(?:html|js|css)$/.test(url.pathname);

  event.respondWith(freshType ? networkFirst(request) : cacheFirst(request));
});
