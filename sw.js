const PREFIX='villa-traitors:'+new URL('./',self.location).pathname+':';
const CACHE=PREFIX+'2.0.0';
const FILES=['./','./index.html','./styles.css','./app.mjs','./engine.mjs','./storage.mjs','./alerts.mjs','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>{
    const requests=FILES.map(file=>new Request(file,{cache:'reload'}));
    return cache.addAll(requests);
  }));
});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);}await self.clients.claim();})());});
// A waiting update deliberately does not replace an active game.
self.addEventListener('message',event=>{
  if(event.data?.type!=='ACTIVATE_UPDATE')return;
  event.waitUntil((async()=>{
    const url=new URL('./',self.location).href;
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const other=windows.filter(client=>client.id!==event.source?.id&&client.url.startsWith(url));
    if(other.length){event.source?.postMessage({type:'UPDATE_BLOCKED'});return;}
    await self.skipWaiting();
  })());
});
self.addEventListener('fetch',event=>{
  const u=new URL(event.request.url);
  if(event.request.method!=='GET'||u.origin!==self.location.origin)return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request,{ignoreSearch:true});
    if(cached)return cached;
    try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return cache.match('./index.html');throw error;}
  }));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=new URL('./',self.location).href;
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=windows.find(client=>client.url.startsWith(url));
    if(existing)return existing.focus();
    return self.clients.openWindow(url);
  })());
});
