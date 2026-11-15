// Sparar appen på telefonen så att den fungerar utan nät.
// Själva sidan hämtas alltid färsk från nätet när det går, så nya versioner syns direkt.
const CACHE="skattjakt-v25";
const AUDIO="skattjakt-audio";   // röstklippen, sparas av appen och ska ligga kvar mellan versioner;
const FILES=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{
  // cache:"reload" går förbi webbläsarens egen kopia, som annars kan vara en gammal version.
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(u=>new Request(u,{cache:"reload"})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==AUDIO).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  // Röstklippen sköter appen själv. Webbläsaren får hämta dem direkt.
  if(url.origin===location.origin&&url.pathname.includes("/audio/"))return;
  const isPage=url.origin===location.origin&&(url.pathname.endsWith("/")||url.pathname.endsWith("/index.html"));
  // Andra sidor, som röstverktyget, hämtas alltid direkt från nätet och sparas inte.
  if(req.mode==="navigate"&&!isPage)return;
  if(url.origin!==location.origin&&!/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname))return;
  if(isPage){
    // Nätet först: senaste versionen. Utan nät används den sparade kopian.
    e.respondWith(fetch(req.url,{cache:"no-store"}).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put("index.html",copy)).catch(()=>{})}
      return res;
    }).catch(()=>caches.match("index.html")));
    return;
  }
  // Ikoner, typsnitt och annat: sparad kopia först.
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
    const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});return res;
  }).catch(()=>caches.match("index.html"))));
});
