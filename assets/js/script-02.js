
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* =========================================================
     THEME SWITCH — binds FIRST, storage guarded.
  ========================================================= */
  (function () {
    const root = document.documentElement;
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) { /* storage unavailable */ }
    if (saved === 'dark') root.setAttribute('data-theme', 'dark');
    sync();

    btn.addEventListener('click', () => {
      const dark = root.getAttribute('data-theme') === 'dark';
      if (dark) root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', 'dark');
      try { localStorage.setItem('theme', dark ? 'light' : 'dark'); } catch (e) { /* ignore */ }
      sync();
    });

    function sync() {
      const dark = root.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-checked', String(dark));
      btn.setAttribute('aria-label', 'Sandbox mode');
      btn.setAttribute('title', dark ? 'Switch to Professional' : 'Switch to Sandbox');
      btn.dataset.mode = dark ? 'sandbox' : 'professional';
      const workLink=document.querySelector('[data-work-mode-link]');
      if(workLink){workLink.href=dark?'#sandboxWork':'#work';workLink.textContent=dark?'Sandbox':'Work';}
      const heroTitle=document.querySelector('h1.hero-title'),word=heroTitle&&heroTitle.querySelector('.line:last-child>span');
      if(word&&!word.querySelector('.hero-letter'))word.textContent=dark?'Sandbox':'Portfolio';
      window.dispatchEvent(new Event('portfolio-mode-change'));
    }
  })();

  /* ---------- scroll arrow ---------- */
  document.getElementById('scrollBtn').addEventListener('click', () => {
    document.getElementById(document.documentElement.getAttribute('data-theme')==='dark'?'sandboxWork':'work').scrollIntoView({ behavior: 'smooth' });
  });

  /* Category order, left to right, determines project order. Every project stays visible. */
  const slidesWrap=document.getElementById('slides');
  const slides=[...slidesWrap.querySelectorAll('.slide')];
  const PROJECT_CATALOG={"somnus": {"title": "Somnus", "categories": ["interactive", "ui-ux", "motion"], "study": true}, "nyid": {"title": "New York ID", "categories": ["ui-ux"], "study": true}, "buildscape": {"title": "Buildscape", "categories": ["vibe-coding", "interactive"], "study": true}, "puma-kiosk": {"title": "PUMA Kiosk", "categories": ["ui-ux"], "study": true, "description": "A guided footwear discovery concept for the NYC PUMA flagship."}, "fall-into-me": {"title": "Fall Into Me", "categories": ["vibe-coding", "motion", "interactive"], "sandbox": true, "description": "A playable experiment in attraction, using scroll resistance, cursor-driven gravity and sound."}, "logo-animations": {"title": "Logo Animations", "categories": ["motion"], "study": true, "description": "Six brand identities translated into motion."}};
  const WORK_TITLES=Object.fromEntries(Object.entries(PROJECT_CATALOG).map(([key,item])=>[key,item.title]));WORK_TITLES.gallery='Gallery';
  const WORK_FILTER_KEYS=['motion','ui-ux','interactive','3d','vibe-coding'];
  const PRIORITY_LABELS={motion:'Motion','ui-ux':'UI/UX',interactive:'Interactive','3d':'3D','vibe-coding':'Vibe Coding'};
  let featuredProjectKeys=['somnus','nyid','buildscape'],hasCustomPriority=false;
  const priorityRow=document.getElementById('workPriorityRow');
  const priorityButtons=[...priorityRow.querySelectorAll('[data-work-priority]')];
  let categoryOrder=[...WORK_FILTER_KEYS],cur=0,priorityDrag=null;
  function visibleWorkSlides(){return [...slidesWrap.querySelectorAll('.slide')].filter(slide=>!slide.hidden);}
  function setActive(i){if(i<0||i>=slides.length)return;cur=i;slides.forEach((slide,k)=>slide.classList.toggle('active',k===i));}
  function updateVisibleCover(){
    const ordered=visibleWorkSlides();if(!ordered.length)return;
    const center=window.innerHeight*.5;
    const nearest=ordered.reduce((best,slide)=>{const r=slide.getBoundingClientRect(),distance=r.top<=center&&r.bottom>=center?0:Math.min(Math.abs(r.top-center),Math.abs(r.bottom-center));return !best||distance<best.distance?{slide,distance}:best;},null);
    setActive(slides.indexOf(nearest.slide));
  }
  let coverRaf=false;
  window.addEventListener('scroll',()=>{if(coverRaf)return;coverRaf=true;requestAnimationFrame(()=>{coverRaf=false;updateVisibleCover();});},{passive:true});
  window.addEventListener('resize',updateVisibleCover);
  function normalizeWorkOrder(raw){return [...new Set([...raw.map(key=>key==='vibe-code'?'vibe-coding':key).filter(key=>WORK_FILTER_KEYS.includes(key)),...WORK_FILTER_KEYS])];}
  function restoreWorkFilters(){const params=new URL(window.location.href).searchParams;const raw=(params.get('order')||params.get('focus')||'').split(',');hasCustomPriority=raw.some(key=>WORK_FILTER_KEYS.includes(key)||key==='vibe-code');categoryOrder=normalizeWorkOrder(raw);}
  function workFilterURL(base){const url=new URL(base);url.searchParams.delete('focus');url.searchParams.delete('projects');url.searchParams.delete('order');if(hasCustomPriority)url.searchParams.set('order',categoryOrder.join(','));return url;}
  const CATEGORY_PROJECT_ORDER={motion:['logo-animations','somnus'],'ui-ux':['nyid','puma-kiosk','somnus'],interactive:['somnus','buildscape'],'vibe-coding':['buildscape'],'3d':[]};
  function rankedProjectKeys(){
    const keys=Object.keys(PROJECT_CATALOG).filter(key=>!PROJECT_CATALOG[key].sandbox);if(!hasCustomPriority)return keys;
    const rank=key=>{const category=categoryOrder.findIndex(tag=>PROJECT_CATALOG[key].categories.includes(tag));return [category<0?categoryOrder.length:category,category<0?99:CATEGORY_PROJECT_ORDER[categoryOrder[category]].indexOf(key)];};
    return keys.sort((a,b)=>{const ar=rank(a),br=rank(b);return ar[0]-br[0]||ar[1]-br[1];});
  }
  function syncPriorityPills(commit=false){
    categoryOrder.forEach((key,i)=>{const button=priorityButtons.find(button=>button.dataset.workPriority===key);button.style.order=String(i);button.setAttribute('aria-label',PRIORITY_LABELS[key]+', priority '+(i+1)+' of '+categoryOrder.length+'. Use arrow keys to reorder.');if(commit)priorityRow.appendChild(button);});
  }
  function applyWorkFilters(writeURL=true,announce=true){
    featuredProjectKeys=rankedProjectKeys().slice(0,3);
    const ordered=featuredProjectKeys.map(key=>slides.find(slide=>slide.dataset.project===key));
    slides.forEach(slide=>{slide.hidden=!ordered.includes(slide);slide.setAttribute('aria-hidden',String(slide.hidden));if(slide.hidden)slide.classList.remove('active');});
    ordered.forEach(slide=>slidesWrap.appendChild(slide));
    renderPortfolioGallery();
    syncPriorityPills(true);updateVisibleCover();
    if(announce)document.getElementById('workOrderStatus').textContent='Project priority: '+categoryOrder.map(key=>PRIORITY_LABELS[key]).join(', ')+'. Three featured projects; two additional projects and the artwork gallery follow.';
    if(writeURL){try{history.replaceState(null,'',workFilterURL(window.location.href).href);}catch(error){/* Local previews may restrict address-bar updates. */}}
  }
  function moveWorkPriority(key,index){const from=categoryOrder.indexOf(key);if(from<0)return;const to=Math.max(0,Math.min(categoryOrder.length-1,index));categoryOrder.splice(from,1);categoryOrder.splice(to,0,key);}
  function endPriorityDrag(cancel=false){
    const drag=priorityDrag;if(!drag)return;priorityDrag=null;
    if(cancel)categoryOrder=drag.original;
    drag.button.classList.remove('is-dragging');if(drag.ghost)drag.ghost.remove();
    if(drag.button.hasPointerCapture(drag.id))drag.button.releasePointerCapture(drag.id);
    if(drag.moved&&!cancel&&categoryOrder.join(',')!==drag.original.join(',')){hasCustomPriority=true;applyWorkFilters();}else syncPriorityPills(true);
    drag.button.focus({preventScroll:true});
  }
  priorityButtons.forEach(button=>{
    button.addEventListener('pointerdown',e=>{
      if(priorityDrag||(e.button!==undefined&&e.button!==0))return;
      e.preventDefault();button.focus({preventScroll:true});button.setPointerCapture(e.pointerId);
      priorityDrag={button,id:e.pointerId,key:button.dataset.workPriority,x:e.clientX,y:e.clientY,original:[...categoryOrder],moved:false,ghost:null};
    });
    button.addEventListener('pointermove',e=>{
      const drag=priorityDrag;if(!drag||drag.id!==e.pointerId)return;
      if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
      e.preventDefault();
      if(!drag.moved){drag.moved=true;button.classList.add('is-dragging');const rect=button.getBoundingClientRect();drag.dx=drag.x-rect.left;drag.dy=drag.y-rect.top;drag.ghost=button.cloneNode(true);drag.ghost.className='priority-pill priority-drag-ghost';drag.ghost.setAttribute('aria-hidden','true');drag.ghost.tabIndex=-1;drag.ghost.inert=true;drag.ghost.style.width=rect.width+'px';drag.ghost.style.height=rect.height+'px';document.body.appendChild(drag.ghost);}
      drag.ghost.style.left=(e.clientX-drag.dx)+'px';drag.ghost.style.top=(e.clientY-drag.dy)+'px';
      const bounds=priorityRow.getBoundingClientRect();if(e.clientX<bounds.left-30||e.clientX>bounds.right+30||e.clientY<bounds.top-30||e.clientY>bounds.bottom+30)return;
      const candidates=priorityButtons.filter(other=>other!==button).map(other=>{const r=other.getBoundingClientRect();return {other,hit:e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom,distance:Math.hypot(e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2)};}).filter(candidate=>candidate.hit).sort((a,b)=>a.distance-b.distance);
      if(candidates[0]){moveWorkPriority(drag.key,categoryOrder.indexOf(candidates[0].other.dataset.workPriority));syncPriorityPills();}
    });
    button.addEventListener('pointerup',e=>{if(priorityDrag&&priorityDrag.id===e.pointerId)endPriorityDrag();});
    button.addEventListener('pointercancel',e=>{if(priorityDrag&&priorityDrag.id===e.pointerId)endPriorityDrag(true);});
    button.addEventListener('lostpointercapture',()=>{if(priorityDrag&&priorityDrag.button===button)endPriorityDrag(true);});
    button.addEventListener('dragstart',e=>e.preventDefault());
    button.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&priorityDrag){e.preventDefault();endPriorityDrag(true);return;}
      const index=categoryOrder.indexOf(button.dataset.workPriority);let target=index;
      if(e.key==='ArrowLeft'||e.key==='ArrowUp')target=index-1;else if(e.key==='ArrowRight'||e.key==='ArrowDown')target=index+1;else if(e.key==='Home')target=0;else if(e.key==='End')target=categoryOrder.length-1;else return;
      e.preventDefault();if(Math.max(0,Math.min(categoryOrder.length-1,target))===index)return;moveWorkPriority(button.dataset.workPriority,target);hasCustomPriority=true;applyWorkFilters();button.focus({preventScroll:true});
    });
  });
  const gallerySection=document.getElementById('portfolioGallery');
  const galleryGrid=document.getElementById('portfolioGalleryGrid');
  const archive=document.getElementById('all-projects');
  const archiveGrid=document.getElementById('portfolioArchiveGrid');
  const projectDialog=document.getElementById('portfolioProject');
  let previewProject=null,previewSource=null,previewWantsGallery=false,portfolioReturnSource=null;
  const escapeProjectText=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function projectCategoryText(key){return PROJECT_CATALOG[key].categories.map(category=>PRIORITY_LABELS[category]).join(' · ');}
  const PROJECT_TAGLINES={somnus:'a descent into sleep',nyid:'identity, reimagined',buildscape:'built to be explored','puma-kiosk':'personalizing the purchase','fall-into-me':'a pull you can feel','logo-animations':'identities in motion'};
  function projectMotionSource(key){const id={'fall-into-me':'fallProjectVideo',buildscape:'buildscapeMediaSource','logo-animations':'logosMediaSource'}[key];return id?document.getElementById(id).src:'';}
  const GALLERY_ITEMS=[{"id":"garden","title":"Garden study","category":"3D","kind":"image","width":1920,"height":1920,"src":"assets/images/ec973d39dade4865.webp"},{"id":"vichy-render","title":"Vichy","category":"Product visualization","kind":"image","width":1920,"height":1080,"src":"assets/images/8089682772c286ce.webp"},{"id":"vichy-layout","title":"Vichy","category":"Campaign layout","kind":"image","width":1920,"height":1080,"src":"assets/images/9186308700e2ff39.webp"},{"id":"pacho","title":"K. Pacho","category":"Social design","kind":"image","width":1564,"height":1059,"src":"assets/images/d7fdcbd86bfee9ee.webp"},{"id":"pin","title":"New York pin","category":"Graphic design","kind":"image","width":1716,"height":1602,"src":"assets/images/126aff7628e0c7fb.webp"},{"id":"airline","title":"American Airlines","category":"App concept","kind":"image","width":1920,"height":1101,"src":"assets/images/5cf4dbf25e722e63.webp"},{"id":"comparison-1","title":"Black Mirror / 01","category":"Motion comparison","kind":"video","width":960,"height":1080,"src":"assets/videos/d3a3363ba59d1b8b.mp4","poster":"assets/images/b76101f793b3e3d6.webp"},{"id":"comparison-2","title":"Black Mirror / 02","category":"Motion comparison","kind":"video","width":960,"height":1080,"src":"assets/videos/2526e7ce98b2cef8.mp4","poster":"assets/images/4b10ffd047122f47.webp"}];
  let galleryCarouselCleanup=null,galleryLightbox=null;
  function galleryCarouselMarkup(){
    const arrow=direction=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M'+(direction==='prev'?'19 12H5m6-6-6 6 6 6':'5 12h14m-6-6 6 6-6 6')+'"/></svg>';
    const art=(item,index)=>'<button type="button" class="gc-art" data-gallery-art="'+index+'" aria-haspopup="dialog" aria-label="Enlarge '+escapeProjectText(item.title+' / '+item.category)+'"><img src="'+(item.poster||item.src)+'" alt="'+escapeProjectText(item.title+' / '+item.category)+'" width="'+item.width+'" height="'+item.height+'" loading="lazy" decoding="async" draggable="false">'+(item.kind==='video'?'<video data-gallery-clip="'+index+'" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>':'')+'<span class="gc-enlarge" aria-hidden="true">↗</span></button>';
    const columns=GALLERY_ITEMS.flatMap((item,index)=>{
      if(index===2)return [];
      const pair=index===1;
      return ['<figure class="gc-item'+(pair?' gc-pair':'')+'" data-gallery-index="'+index+'" role="group" aria-label="'+escapeProjectText(item.title)+'"><div class="gc-artworks">'+art(item,index)+(pair?art(GALLERY_ITEMS[2],2):'')+'</div><figcaption><span>'+escapeProjectText(item.title)+'</span><span>'+escapeProjectText(pair?'Product visualization / Campaign layout':item.category)+'</span></figcaption></figure>'];
    }).join('');
    return '<section class="work-carousel" id="galleryCarousel" aria-labelledby="galleryCarouselTitle" aria-roledescription="carousel"><header class="gc-heading"><div><p class="gc-kicker">Graphic · 3D · Motion · UI</p><h2 id="galleryCarouselTitle">Gallery.</h2><p class="gc-handwritten">a little bit of everything.</p></div><div class="gc-controls"><div class="gc-control-status"><button type="button" class="gc-motion" aria-pressed="false">Pause motion</button><span class="gc-count" aria-live="off">01 / 07</span></div><button type="button" class="gc-prev" aria-label="Previous artwork">'+arrow('prev')+'</button><button type="button" class="gc-next" aria-label="Next artwork">'+arrow('next')+'</button></div></header><div class="gc-track" tabindex="0" aria-label="Gallery artworks. Swipe or use left and right arrow keys."><div class="gc-row">'+columns+'</div></div></section>';
  }

  function setupGalleryCarousel(){
    if(galleryCarouselCleanup)galleryCarouselCleanup();
    const root=document.getElementById('galleryCarousel'),track=root.querySelector('.gc-track'),cards=[...root.querySelectorAll('.gc-item')],clips=[...root.querySelectorAll('[data-gallery-clip]')],motion=matchMedia('(prefers-reduced-motion: reduce)'),abort=new AbortController(),signal=abort.signal;
    let index=0,frame=0,drag=null,suppressUntil=0,paused=motion.matches,modalOpen=false,autoFrame=0,lastTime=0,position=0,direction=1,hovered=false,focused=false,inView=false,resumeAt=0;
    const motionButton=root.querySelector('.gc-motion'),prev=root.querySelector('.gc-prev'),next=root.querySelector('.gc-next'),visible=new Set();
    const playClips=()=>clips.forEach(video=>{const active=visible.has(video)&&!paused&&!modalOpen&&!document.hidden&&document.documentElement.dataset.theme!=='dark';if(active){if(!video.hasAttribute('src'))video.src=GALLERY_ITEMS[+video.dataset.galleryClip].src;video.play().catch(()=>{});}else video.pause();});
    const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);});playClips();},{threshold:.35});clips.forEach(video=>observer.observe(video));
    const syncMotion=()=>{motionButton.setAttribute('aria-pressed',String(paused));motionButton.textContent=paused?'Play motion':'Pause motion';playClips();};syncMotion();
    function update(){frame=0;const middle=track.getBoundingClientRect().left;let distance=Infinity;cards.forEach((card,i)=>{const r=card.getBoundingClientRect(),d=Math.abs(r.left-middle);if(d<distance){distance=d;index=i;}});if(track.scrollLeft>0&&track.scrollWidth-track.clientWidth-track.scrollLeft<2)index=cards.length-1;root.querySelector('.gc-count').textContent=String(index+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');prev.disabled=index===0;next.disabled=index===cards.length-1;}
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    function go(target){const card=cards[Math.max(0,Math.min(cards.length-1,target))];resumeAt=performance.now()+4000;track.scrollTo({left:card.offsetLeft,behavior:motion.matches?'auto':'smooth'});}
    prev.addEventListener('click',()=>go(index-1),{signal});next.addEventListener('click',()=>go(index+1),{signal});
    motionButton.addEventListener('click',()=>{paused=!paused;syncMotion();},{signal});
    track.addEventListener('scroll',()=>{schedule();},{passive:true,signal});
    track.addEventListener('keydown',event=>{let target;if(event.key==='ArrowLeft')target=index-1;else if(event.key==='ArrowRight')target=index+1;else if(event.key==='Home')target=0;else if(event.key==='End')target=cards.length-1;else return;event.preventDefault();go(target);},{signal});
    track.addEventListener('dragstart',event=>event.preventDefault(),{signal});
    track.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;drag={id:event.pointerId,x:event.clientX,left:track.scrollLeft,moved:false};},{signal});
    track.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x;if(!drag.moved&&Math.abs(dx)>7){drag.moved=true;track.setPointerCapture(event.pointerId);track.classList.add('is-dragging');}if(drag.moved){event.preventDefault();track.scrollLeft=drag.left-dx;}},{signal});
    track.addEventListener('wheel',()=>{resumeAt=performance.now()+4000;},{passive:true,signal});
    track.addEventListener('touchstart',()=>{resumeAt=performance.now()+6000;},{passive:true,signal});
    root.addEventListener('pointerenter',()=>{hovered=true;},{signal});root.addEventListener('pointerleave',()=>{hovered=false;},{signal});
    root.addEventListener('focusin',()=>{focused=true;},{signal});root.addEventListener('focusout',event=>{focused=root.contains(event.relatedTarget);},{signal});
    const sectionObserver=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;},{threshold:.15});sectionObserver.observe(root);
    function drift(now){const elapsed=lastTime?Math.min(now-lastTime,50):0;lastTime=now;const active=inView&&!paused&&!motion.matches&&!hovered&&!focused&&!drag&&!modalOpen&&!document.hidden&&now>resumeAt&&document.documentElement.dataset.theme!=='dark';if(active){const max=track.scrollWidth-track.clientWidth;if(max>1){position=Math.max(0,Math.min(max,position+direction*elapsed*.024));track.scrollLeft=position;if(position>=max){direction=-1;resumeAt=now+1300;}else if(position<=0){direction=1;resumeAt=now+1300;}}}else position=track.scrollLeft;autoFrame=requestAnimationFrame(drift);}
    autoFrame=requestAnimationFrame(drift);
    function endDrag(event){if(!drag||drag.id!==event.pointerId)return;const moved=drag.moved;drag=null;track.classList.remove('is-dragging');if(track.hasPointerCapture(event.pointerId))track.releasePointerCapture(event.pointerId);if(moved){suppressUntil=performance.now()+300;update();go(index);}}
    track.addEventListener('pointerup',endDrag,{signal});track.addEventListener('pointercancel',endDrag,{signal});track.addEventListener('lostpointercapture',()=>{drag=null;track.classList.remove('is-dragging');},{signal});
    track.addEventListener('click',event=>{if(performance.now()<suppressUntil){event.preventDefault();event.stopPropagation();return;}const button=event.target.closest('[data-gallery-art]');if(button)openGalleryArtwork(+button.dataset.galleryArt,button,()=>{modalOpen=false;playClips();});if(button){modalOpen=true;playClips();}},{signal});
    document.addEventListener('visibilitychange',playClips,{signal});window.addEventListener('portfolio-mode-change',playClips,{signal});window.addEventListener('resize',schedule,{signal});motion.addEventListener('change',()=>{paused=motion.matches;syncMotion();},{signal});
    galleryCarouselCleanup=()=>{abort.abort();observer.disconnect();sectionObserver.disconnect();cancelAnimationFrame(autoFrame);clips.forEach(v=>v.pause());if(frame)cancelAnimationFrame(frame);};requestAnimationFrame(update);
  }
  function openGalleryArtwork(first,source,onClose){
    if(galleryLightbox&&galleryLightbox.open)return;
    const dialog=document.createElement('dialog');galleryLightbox=dialog;dialog.className='gc-viewer';dialog.setAttribute('aria-labelledby','gcViewerTitle');dialog.innerHTML='<header><div><h2 id="gcViewerTitle"></h2><p class="gc-viewer-category"></p></div><button type="button" class="gc-viewer-close" aria-label="Close artwork">×</button></header><div class="gc-viewer-stage"></div><footer><button type="button" class="gc-viewer-prev" aria-label="Previous artwork">←</button><span class="gc-viewer-count" aria-live="polite"></span><button type="button" class="gc-viewer-next" aria-label="Next artwork">→</button></footer>';
    let active=first;const stage=dialog.querySelector('.gc-viewer-stage');
    function show(index){const old=stage.querySelector('video');if(old)old.pause();active=(index+GALLERY_ITEMS.length)%GALLERY_ITEMS.length;const item=GALLERY_ITEMS[active];dialog.querySelector('h2').textContent=item.title;dialog.querySelector('.gc-viewer-category').textContent=item.category;dialog.querySelector('.gc-viewer-count').textContent=(active+1)+' / '+GALLERY_ITEMS.length;stage.replaceChildren();const media=document.createElement(item.kind==='video'?'video':'img');media.src=item.src;if(item.kind==='video'){media.controls=true;media.loop=true;media.playsInline=true;media.muted=true;media.poster=item.poster;}else media.alt=item.title;stage.append(media);if(item.kind==='video'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)media.play().catch(()=>{});}
    dialog.querySelector('.gc-viewer-close').onclick=()=>dialog.close();dialog.querySelector('.gc-viewer-prev').onclick=()=>show(active-1);dialog.querySelector('.gc-viewer-next').onclick=()=>show(active+1);
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();if(event.target.tagName==='VIDEO')return;if(event.key==='ArrowLeft'){event.preventDefault();show(active-1);}if(event.key==='ArrowRight'){event.preventDefault();show(active+1);}});
    const pauseHidden=()=>{if(document.hidden){const video=stage.querySelector('video');if(video)video.pause();}};document.addEventListener('visibilitychange',pauseHidden);
    dialog.addEventListener('close',()=>{const video=stage.querySelector('video');if(video)video.pause();document.removeEventListener('visibilitychange',pauseHidden);['mouse-dot','mouse-waves'].forEach(id=>{const node=document.getElementById(id);if(node&&dialog.contains(node))document.body.appendChild(node);});dialog.remove();galleryLightbox=null;if(source.isConnected)source.focus({preventScroll:true});onClose();},{once:true});
    document.body.append(dialog);show(first);dialog.showModal();
  }

  function galleryProjectCard(key){
    const item=PROJECT_CATALOG[key],cover=slides.find(slide=>slide.dataset.project===key),src=cover.querySelector('.bg img').src;
    const motion=['fall-into-me','buildscape','logo-animations'].includes(key);
    return '<button type="button" class="gallery-card work-grid-tile" data-gallery-project="'+key+'" data-project="'+key+'"><span class="bg"><img src="'+src+'" alt="'+escapeProjectText(item.title)+'" loading="lazy">'+(motion?'<video class="project-motion-video" data-motion-project="'+key+'" muted playsinline preload="none" poster="'+src+'" aria-hidden="true"></video>':'')+'</span><span class="grid-copy"><span class="grid-category">'+escapeProjectText(projectCategoryText(key))+'</span><span class="grid-title">'+escapeProjectText(item.title)+'</span><span class="grid-tagline">'+escapeProjectText(PROJECT_TAGLINES[key])+'</span></span><span class="grid-action">View case study ↗</span></button>';
  }
  function renderPortfolioGallery(){
    if(galleryCarouselCleanup){galleryCarouselCleanup();galleryCarouselCleanup=null;}
    galleryGrid.querySelectorAll('video').forEach(video=>video.pause());
    const keys=rankedProjectKeys().filter(key=>!featuredProjectKeys.includes(key));
    galleryGrid.innerHTML=keys.map(galleryProjectCard).join('')+galleryCarouselMarkup();
    archiveGrid.innerHTML='';archive.hidden=true;
    galleryGrid.querySelectorAll('[data-gallery-project]').forEach(button=>button.addEventListener('click',()=>openPortfolioProject(button.dataset.galleryProject,button,true)));
    galleryGrid.querySelectorAll('[data-motion-project]').forEach(video=>{video.src=projectMotionSource(video.dataset.motionProject);});
    slides.forEach(slide=>{let tag=slide.querySelector('.slide-script');if(!tag){tag=document.createElement('p');tag.className='slide-script';slide.querySelector('.slide-title').after(tag);}tag.textContent=PROJECT_TAGLINES[slide.dataset.project];});
    setupGalleryCarousel();
    document.dispatchEvent(new Event('portfolio-media-update'));
  }
  function openPortfolioGallery(){document.getElementById('galleryCarousel').scrollIntoView({behavior:'smooth',block:'start'});}
  const CASE_OUTLINES={
    'puma-kiosk':[['Brief & objectives','Project context, audience, role and constraints.'],['Research & user flows','Research, key tasks and flow decisions.'],['Sketches & visual direction','Early sketches and interface explorations.'],['Interface & prototype','Screen designs and the interactive prototype.'],['Outcomes & reflection','Testing, final decisions and lessons learned.']],
    'fall-into-me':[['Concept & intent','The idea, audience and intended experience.'],['Interaction & flow','The visitor journey and interaction decisions.'],['Motion development','The pupil transition and animation explorations.'],['Development & iteration','Implementation, experiments and refinements.'],['Outcome & reflection','Final experience, testing and lessons learned.']],
    'logo-animations':[['Brief & identity','The identities, goals and project constraints.'],['Motion exploration','References and animation directions.'],['Storyboards & timing','Sequences, timing studies and key poses.'],['Animation development','Animation process and refinements.'],['Final animations & reflection','Final motion pieces and lessons learned.']]
  };
  function renderCaseOutline(key){
    const list=document.getElementById('projectCaseOutline'),sections=CASE_OUTLINES[key]||[];
    list.innerHTML='<nav class="outline-nav" aria-label="Case study sections">'+sections.map(([title],i)=>'<a href="#outline-section-'+i+'">'+escapeProjectText(title)+'</a>').join('')+'</nav>'+sections.map(([title,note],i)=>'<section class="outline-section" id="outline-section-'+i+'"><p class="gallery-eyebrow">Case study / '+String(i+1).padStart(2,'0')+'</p><h3>'+escapeProjectText(title)+'</h3><p>'+escapeProjectText(note)+'</p><div class="outline-media-slot"><span>Process documentation to follow</span></div></section>').join('');
    list.querySelectorAll('.outline-nav a').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();list.querySelector(link.getAttribute('href')).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}));
  }

  function openPortfolioProject(key,source,fromGallery=false){
    if(key==='gallery'){openPortfolioGallery();return;}
    if(caseOpen||caseAnimating||projectDialog.open||(window.caseStudyRipple&&window.caseStudyRipple.active))return;
    if(key==='fall-into-me'){window.openFallExperience(source);return;}
    if(window.caseStudyRipple){window.caseStudyRipple.open(source,()=>openPortfolioProjectNow(key,source,fromGallery));return;}
    openPortfolioProjectNow(key,source,fromGallery);
  }
  function openPortfolioProjectNow(key,source,fromGallery=false){
    if(key==='gallery'){openPortfolioGallery();return;}
    const item=PROJECT_CATALOG[key];if(!item)return;portfolioReturnSource=source;
    projectDialog.classList.toggle('sandbox-experiment',!!item.sandbox);
    if(item.study){const rect=fromGallery?source.querySelector('img').getBoundingClientRect():null;openCase(key,source,rect);return;}
    previewProject=key;previewSource=source;previewWantsGallery=false;
    if(!fromGallery)setActive(slides.indexOf(source));
    const cover=slides.find(slide=>slide.dataset.project===key).querySelector('.bg img');
    document.getElementById('portfolioProjectTitle').textContent=item.title;
    document.getElementById('portfolioProjectCategories').textContent=item.sandbox?'Sandbox / Interactive experiment':projectCategoryText(key);
    document.getElementById('portfolioProjectDescription').textContent=item.description;
    if(item.sandbox)document.getElementById('projectCaseOutline').innerHTML='';else renderCaseOutline(key);
    document.getElementById('projectBrowseGallery').textContent=item.sandbox?'Back to Sandbox ←':'Back to work ←';
    const image=document.getElementById('portfolioProjectCover');image.src=cover.src;image.alt=item.title+' title cover';
    const clip=document.getElementById('fallProjectVideo');image.hidden=key==='fall-into-me'||key==='logo-animations';clip.hidden=key!=='fall-into-me';clip.pause();if(!(window.caseStudyRipple&&window.caseStudyRipple.active))clip.currentTime=0;
    const motionVideo=document.getElementById('portfolioMotionVideo');motionVideo.pause();motionVideo.hidden=key!=='logo-animations';if(key==='logo-animations'){const motionSource=projectMotionSource(key);if(motionVideo.src!==motionSource)motionVideo.src=motionSource;motionVideo.poster=cover.src;if(!(window.caseStudyRipple&&window.caseStudyRipple.active))motionVideo.currentTime=0;}
    document.body.classList.add('portfolio-dialog-open');projectDialog.showModal();projectDialog.scrollTop=0;
    if(key==='fall-into-me'){clip.muted=true;clip.defaultPlaybackRate=.55;clip.playbackRate=.55;clip.play().catch(()=>{});}
    if(key==='logo-animations'){motionVideo.muted=true;motionVideo.play().catch(()=>{});}
  }
  document.getElementById('closePortfolioProject').addEventListener('click',()=>projectDialog.close());
  document.getElementById('projectBrowseGallery').addEventListener('click',()=>{previewWantsGallery=false;projectDialog.close();});
  archive.addEventListener('toggle',()=>{const button=document.getElementById('openInlineArchive');if(button)button.setAttribute('aria-expanded',String(archive.open));});
  projectDialog.addEventListener('close',()=>{
    document.body.classList.remove('portfolio-dialog-open');
    if(previewWantsGallery){previewWantsGallery=false;openPortfolioGallery();}
    else if(previewSource&&previewSource.isConnected)previewSource.focus({preventScroll:true});
  });

  document.getElementById('sandboxFall').addEventListener('click',event=>openPortfolioProject('fall-into-me',event.currentTarget,true));
  window.addEventListener('popstate',()=>{if(priorityDrag)endPriorityDrag(true);restoreWorkFilters();applyWorkFilters(false);});
  restoreWorkFilters();applyWorkFilters(false,false);
  function nextVisibleWorkSlide(key){const ordered=[...visibleWorkSlides(),...galleryGrid.querySelectorAll('[data-gallery-project]')];const index=ordered.findIndex(slide=>slide.dataset.project===key);return index>=0?ordered[index+1]||null:null;}
  function advanceVisibleProject(key){const next=nextVisibleWorkSlide(key);closeCase(()=>{if(next){if(slides.includes(next))setActive(slides.indexOf(next));next.scrollIntoView({behavior:'instant',block:'start'});openPortfolioProject(next.dataset.project,next,!slides.includes(next));}else openPortfolioGallery();});}

  /* =========================================================
     HEADER INVERSION — deterministic, scroll-position based.
  ========================================================= */
  const workEl = document.getElementById('work');
  let hdrRaf = false;

  function updateOnDark() {
    const r = workEl.getBoundingClientRect();
    const band = window.innerHeight * 0.12;
    const covers = visibleWorkSlides().length > 0 && r.top <= band && r.bottom >= band;
    const heroRect=document.getElementById('home').getBoundingClientRect();
    const heroCovers=heroRect.top<=band&&heroRect.bottom>=band;
    const galleryBand=document.getElementById('galleryCarousel'),galleryRect=galleryBand&&galleryBand.getBoundingClientRect();
    const galleryCovers=galleryRect&&galleryRect.top<=band&&galleryRect.bottom>=band;
    document.body.classList.toggle('on-dark', covers||heroCovers||!!galleryCovers);
  }
  window.addEventListener('scroll', () => {
    if (hdrRaf) return;
    hdrRaf = true;
    requestAnimationFrame(() => { updateOnDark(); hdrRaf = false; });
  }, { passive: true });
  window.addEventListener('resize', updateOnDark);
  updateOnDark();

  /* ---------- scroll spy ---------- */
  const navLinks = document.querySelectorAll('nav a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'work', 'sandboxWork', 'about'].forEach(id => spy.observe(document.getElementById(id)));

  navLinks.forEach(a => {
    a.addEventListener('click', e => {
      if (!caseOpen) return;
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      closeCase(() => { if (target) target.scrollIntoView({ behavior: 'smooth' }); });
    });
  });

  /* =============================================
     POLAROIDS: staggered entrance + drag + tap
  ============================================= */
  const aboutSec = document.getElementById('about');

  new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        aboutSec.classList.add('in');
        obs.disconnect();
      }
    });
  }, { threshold: 0.3 }).observe(aboutSec);

  const polaroidViewer = document.getElementById('polaroidViewer');
  const polaroidViewerImage = document.getElementById('polaroidViewerImage');
  const polaroidViewerCaption = document.getElementById('polaroidViewerCaption');
  let polaroidReturnFocus = null;
  function openPolaroidPhoto(el) {
    const image = el.querySelector('.ph img');
    if (!image) return;
    polaroidReturnFocus = el;
    polaroidViewerImage.src = image.currentSrc || image.src;
    polaroidViewerImage.alt = image.alt;
    const caption = el.querySelector('figcaption');
    polaroidViewerCaption.textContent = caption ? caption.textContent : image.alt;
    document.body.classList.add('photo-viewer-open');
    // Keep the custom cursor visible above the native dialog's top layer.
    ['mouse-waves', 'mouse-dot'].forEach(id => {
      const cursor = document.getElementById(id);
      if (cursor) polaroidViewer.appendChild(cursor);
    });
    polaroidViewer.showModal();
    polaroidViewer.querySelector('button').focus({preventScroll:true});
  }
  polaroidViewer.querySelector('button').addEventListener('click', () => polaroidViewer.close());
  polaroidViewer.addEventListener('click', e => {
    if (e.target !== polaroidViewer) return;
    const rect = polaroidViewer.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) polaroidViewer.close();
  });
  polaroidViewer.addEventListener('close', () => {
    document.body.classList.remove('photo-viewer-open');
    ['mouse-waves', 'mouse-dot'].forEach(id => {
      const cursor = document.getElementById(id);
      if (cursor) document.body.appendChild(cursor);
    });
    polaroidViewerImage.removeAttribute('src');
    if (polaroidReturnFocus) polaroidReturnFocus.focus({preventScroll:true});
  });
  document.querySelectorAll('.polaroid').forEach(el => {
    const caption = el.querySelector('figcaption');
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
    el.setAttribute('aria-haspopup','dialog');
    el.setAttribute('aria-controls','polaroidViewer');
    el.setAttribute('aria-label','View photo: ' + (caption ? caption.textContent : 'Polaroid'));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPolaroidPhoto(el); }
    });
  });

  (function polaroidDrag() {
    let topZ = 10;

    document.querySelectorAll('.polaroid').forEach(el => {
      let ox = 0, oy = 0;
      let px = 0, py = 0;
      let moved = 0;

      el.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        el.style.transition = 'none';
        el.classList.add('grab');
        el.style.zIndex = ++topZ;
        px = e.clientX; py = e.clientY;
        moved = 0;
      });

      el.addEventListener('pointermove', e => {
        if (!el.hasPointerCapture(e.pointerId)) return;
        const dx = e.clientX - px, dy = e.clientY - py;
        px = e.clientX; py = e.clientY;
        ox += dx; oy += dy;
        moved += Math.abs(dx) + Math.abs(dy);
        el.style.translate = ox + 'px ' + oy + 'px';
      });

      function up(e) {
        if (!el.hasPointerCapture(e.pointerId)) return;
        el.releasePointerCapture(e.pointerId);
        el.classList.remove('grab');
        el.style.transition = '';
        if (e.type === 'pointerup' && moved < 8) openPolaroidPhoto(el);
      }
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);

      el.addEventListener('dragstart', e => e.preventDefault());
    });
  })();

  /* =============================================
     PROJECT DATA
  ============================================= */
  const SN_ASSETS = {"home":"assets/images/393f6e1a135d1b0c.webp","drift":"assets/images/97267b747cf5b51a.webp","heart":"assets/images/2d1d4aaf1ef60f9a.webp","article":"assets/images/7abf55b230cb40d1.webp","chart":"assets/images/dbb320683856b976.webp","installation":"assets/images/f85639fd3952bb3d.webp","map":"assets/images/01dcd83cebfbbcb8.webp","sketch1":"assets/images/6ce5b0c861f188ea.webp","sketch2":"assets/images/33cf640ec56b9808.webp","sketch3":"assets/images/94f541c2a8c2b64d.webp","wire1":"assets/images/ea7f0ce2e209c918.webp","mood11":"assets/images/e853e48d20d44171.webp","mood12":"assets/images/eb269692d3cfb55f.webp","mood13":"assets/images/eb44e9699a0f6772.webp","mood14":"assets/images/c02034b05e392b27.webp","mood21":"assets/images/55438819196bb4ea.webp","mood22":"assets/images/e8085c74b943fd0f.webp","mood23":"assets/images/0ac53b9431707ff3.webp","mood24":"assets/images/27e4861d15214e12.webp","wire2":"assets/images/66fc1ec3c30926eb.webp","wire3":"assets/images/a9f00b18ca867bec.webp","wire4":"assets/images/905fb9e6e89cb38c.webp","style":"assets/images/1e88befad70248b3.svg","clip":"assets/videos/c54f82ea5dd45248.mp4","deck":"assets/documents/ee64410a68108fa6.pdf","v2awake":"assets/images/20adc977af0659a9.webp","v2drift":"assets/images/775b667fefbad31c.webp","v2detail":"assets/images/b31b5e6b6cb78981.webp","v2wake":"assets/images/c769103e249c2369.webp","moodone":"assets/images/e49cde5320b444b0.webp","moodtwo":"assets/images/f7292cb3a4fdf387.webp","compone":"assets/images/170c45087838de63.webp","comptwo":"assets/images/fe7b21b5e8c421ce.webp","finalpair":"assets/images/758143d91549a1b7.webp","finaldrift":"assets/images/e53caa959f02ad49.webp","finalhover":"assets/images/91e88ef8f2afeba1.webp"};

  const suppliedProjectPhotos = {
    nyid: document.querySelector('[data-project="nyid"] .bg img').src,
    buildscape: document.querySelector('[data-project="buildscape"] .bg img').src
  };
  const img = (key, i) => {
    if (key === 'somnus') {
      const somnusImages = [
        SN_ASSETS.home, SN_ASSETS.article, SN_ASSETS.drift, SN_ASSETS.installation,
        SN_ASSETS.map, SN_ASSETS.wire2, SN_ASSETS.mood11, SN_ASSETS.style,
        SN_ASSETS.home, SN_ASSETS.drift, SN_ASSETS.heart
      ];
      return somnusImages[i - 1] || 'assets/images/604ec42a30340165.webp';
    }
    if (suppliedProjectPhotos[key]) return suppliedProjectPhotos[key];
    return 'https://picsum.photos/seed/' + key + '-' + i + '/1600/1100';
  };

  const PROJECTS = {
    somnus: {
      title: 'somnus',
      tint: 'linear-gradient(145deg,#181833 0%,#262650 45%,#13132b 100%)',
      meta: {
        'Role': 'UI/UX Interactive Designer (Solo)',
        'Timeline': 'February &ndash; May 2026',
        'Deliverable': 'Interactive web prototype'
      },
      doc: 'Full process deck',
      docHref: 'somnus-case-study.pdf',
      sections: [
        { label:'Overview', h:'h1', title:'A descent<br>into sleep.',
          lead:'An interactive website that turns the sleep cycle into a scroll-based journey &mdash; users descend from Awake through NREM 1&ndash;3 to REM, feeling how sleep deepens at every stage.' },
        { label:'The Problem', h:'h2', title:'Sleep science,<br>badly told.',
          p:['Sleep education lives in charts, diagrams and walls of text &mdash; and wellness content online oversimplifies the science.'],
          list:['The dynamic, layered nature of sleep architecture fails to come through','Complex neurological processes stay abstract and hard to grasp','Physical changes are difficult to conceptualize spatially'] },
        { label:'The Opportunity', h:'h2', title:'Feel it<br>deepen.',
          p:['Transform sleep education into an interactive experience &mdash; motion, depth and exploration instead of static information.'],
          list:['Scroll to descend through the sleep cycle','Students, educators and curious learners','Classrooms, labs and at-home study on desktop'] },
        { label:'Research', h:'h2', title:'Between article<br>and installation.',
          p:['The landscape split three ways &mdash; none of it hit the middle:'],
          list:['<strong>Sleep-cycle sites</strong> &mdash; educational but simplified','<strong>Simulations</strong> &mdash; interactive but highly technical','<strong>VR installations</strong> &mdash; immersive but inaccessible','Borrowed instead: parallax depth, hotspot disclosure, cursor reactions'] },
        { label:'Planning', h:'h2', title:'Plan the<br>descent.',
          p:['No separate pages &mdash; a sitemap where every section is revealed through scrolling, then sketched and wireframed.'],
          list:['Awake screen: guiding question, parallax clouds, quiet menu','NREM screens: stage, feeling and duration up front','Force wake up reachable from any stage'] },
        { label:'Wireframes', h:'h2', title:'From sketch<br>to screen.',
          p:['Initial wireframes established the stage sequence; refined wireframes developed the navigation and detail views.'],
          list:['Progress dots track the stage and how much of it you&rsquo;ve explored','Hotspots stay hidden until the user finds them','Secondary screen zooms the model to the found detail','Wake-up copy changes with the stage you leave from'] },
        { label:'Visual Development', h:'h2', title:'Luminous<br>drift.',
          p:['Two moodboards set the atmosphere, then composition tests applied them to real screens.'],
          list:['<strong>Luminous Drift</strong> &mdash; B&amp;W flow with colored light','<strong>Geometric Surrealism</strong> &mdash; abstract, clean, digital','Cursor light follows the mouse through the clouds','Refined: logo, smaller progress nav, hotspot-only interaction'] },
        { label:'Design System', h:'h2', title:'Serif over<br>starlight.',
          p:['A crescent logo and a palette built for the dark.'],
          list:['<strong>Type</strong> &mdash; DM Serif Display + Inter','<strong>Palette</strong> &mdash; white, periwinkle, navy, midnight','<strong>Logo</strong> &mdash; a crescent moon cradling SOMNUS'] },
        { label:'Final Designs', h:'h2', title:'Awake, then<br>under.',
          p:['Three core screens carry the whole cycle:'],
          list:['<strong>Awake</strong> &mdash; the moon asks: what is the sleep cycle?','<strong>NREM I</strong> &mdash; Drift. Consciousness begins to dissolve','<strong>Secondary</strong> &mdash; heart, waves and hormones behind hotspots'] },
        { label:'Motion & Interaction', h:'h2', title:'Hidden until<br>found.',
          p:['The prototype leans on four interactions:'],
          list:['<strong>Parallax</strong> &mdash; mouse tracking and scroll depth','<strong>Hotspots</strong> &mdash; hover to reveal, tap for detail','<strong>Force wake up</strong> &mdash; hold to surface, harder the deeper you are','<strong>Progressive disclosure</strong> &mdash; information earned, not dumped'] },
        { label:'Takeaways', h:'h2', title:'Research first,<br>motion after.',
          p:['Strong research grounded the project and revealed room to differentiate through motion &mdash; and an animated prototype communicated the interactions without technical constraints.'],
          list:['Next: make the secondary data screens more interactive','Animate every stage transition, natural and forced'] }
      ]
    },
    nyid: { title:'nyid', sections:[] },
    buildscape: {title:'buildscape',sections:[]},
    'logo-animations': {title:'logo-animations',sections:[]},
    'puma-kiosk': {title:'puma-kiosk',sections:[]},

  };

  /* =============================================
     CASE STUDY: build, FLIP open/close, scroll
  ============================================= */
  const caseView   = document.getElementById('caseView');
  const caseStudyEl= document.getElementById('caseStudy');
  const caseField  = document.getElementById('caseField');
  const caseStack  = document.getElementById('caseStack');
  const caseText   = document.getElementById('caseText');
  const caseDotsEl = document.getElementById('caseDots');
  const caseFill   = document.getElementById('caseFill');
  const caseNext   = document.getElementById('caseNext');
  const caseClose  = document.getElementById('caseClose');

  let caseOpen = false, caseAnimating = false, built = false;
  let CS = null;
  let casePos = 0, caseRaf = false;
  let currentKey = null;

  const SN_CHAPTERS = [
    ['overview','Overview'],['concept','Concept'],['research','Research'],
    ['planning','Planning'],['wireframes','Wireframes'],['visual','Visual language'],
    ['system','Design system'],['awake','Awake'],['drift','NREM I'],
    ['detail','Physiological detail'],['prototype','Prototype'],['reflection','Reflection'],['more','Explore next']
  ];
  let snStory = null, snBlobURLs = {}, snObserver = null;
  const SN_IMAGE_SIZE = {"home":[1600,870],"drift":[1600,869],"heart":[1600,870],"article":[1380,1590],"chart":[1600,772],"installation":[1600,857],"map":[1166,1428],"sketch1":[470,698],"sketch2":[532,1378],"sketch3":[600,802],"wire1":[1280,720],"mood11":[640,896],"mood12":[736,1308],"mood13":[800,1200],"mood14":[736,736],"mood21":[600,600],"mood22":[564,317],"mood23":[590,443],"mood24":[750,842],"wire2":[864,488],"wire3":[866,488],"wire4":[864,488],"style":[1920,996],"v2awake":[584,331],"v2drift":[585,331],"v2detail":[584,329],"v2wake":[585,329],"moodone":[1067,1048],"moodtwo":[1094,1231],"compone":[1272,1068],"comptwo":[1272,1068],"finalpair":[2127,581],"finaldrift":[1231,668],"finalhover":[1229,668]};
  const snImage = (key,alt,eager=false) => '<img src="'+SN_ASSETS[key]+'" alt="'+alt+'" width="'+SN_IMAGE_SIZE[key][0]+'" height="'+SN_IMAGE_SIZE[key][1]+'" loading="'+(eager?'eager':'lazy')+'" decoding="async">';
  const snScreen = (key,alt,title,eager=false) => '<figure class="sn-screen"><div class="sn-screen-top"><span>Somnus</span><span>'+title+'</span></div>'+snImage(key,alt,eager)+'</figure>';
  const snCaption = (left,right='') => '<div class="sn-caption"><span>'+left+'</span><span>'+right+'</span></div>';
  const snHeading = (tag,title,copy) => '<div class="sn-slide-heading"><div><span class="sn-kicker">'+tag+'</span><h2>'+title+'</h2></div><p>'+copy+'</p></div>';
  const snPanel = (i,content,extra='') => '<section class="sn-panel '+extra+'" id="sn-'+SN_CHAPTERS[i][0]+'" style="--slide:'+i+'" aria-label="'+SN_CHAPTERS[i][1]+'"><div class="sn-panel-body">'+content+'</div></section>';
  function snFileURL(key,type) {
    const source=key==='pumaclip'?PK_MEDIA.clip.src:key.startsWith('logo-')?LOGO_MEDIA[key.slice(5)].src:key==='nydeck'?NY_ASSETS.deck:key==='nyclip'?NY_MEDIA.clip.src:SN_ASSETS[key];
    return new URL(source,document.baseURI).href;
  }
  function snLoadVideo() {
    const video=snStory&&snStory.querySelector('video');
    if(video&&!video.hasAttribute('src')){video.src=snFileURL('clip','video/mp4');video.load();}
  }
  function snNextProject() { advanceVisibleProject(currentKey); }
  const NY_ASSETS = {"final":"assets/images/629d4dbea6f49497.webp","scan":"assets/images/b0dd6e6d33b1550a.webp","age":"assets/images/da0788d1532a169c.webp","full":"assets/images/e3b2cfbb5eddbc8e.webp","research":"assets/images/9fdbc49775e9ab67.webp","competitor":"assets/images/886f924875c8acbe.webp","playful":"assets/images/eb3bab0755aafda9.webp","modular":"assets/images/c2b0643de8760abf.webp","iteration":"assets/images/8383a7ee9dafd55d.webp","logos":"assets/images/2e12820b9fedd373.webp","style":"assets/images/fec46a4ca5aba22f.webp","deck":"assets/documents/b5641722be44c339.pdf","concept1v1":"assets/images/7384c340dc941f5c.webp","concept1v2":"assets/images/cb1258160a186a6d.webp","concept1v3":"assets/images/d49159ed5685d7ec.webp"};
  const NY_IMAGE_SIZE = {"final":[1320,870],"scan":[1320,870],"age":[426,840],"full":[426,840],"research":[912,900],"competitor":[1068,804],"playful":[804,576],"modular":[816,684],"iteration":[1368,936],"logos":[1368,840],"style":[1968,690],"concept1v1":[1368,960],"concept1v2":[1440,648],"concept1v3":[1368,930]};
const nyImage=(key,alt,eager=false)=>'<img src="'+NY_ASSETS[key]+'" alt="'+alt+'" width="'+NY_IMAGE_SIZE[key][0]+'" height="'+NY_IMAGE_SIZE[key][1]+'" loading="'+(eager?'eager':'lazy')+'" decoding="async">';
const nyScreen=(key,alt,title,eager=false)=>'<figure class="sn-screen"><div class="sn-screen-top"><span>New York ID</span><span>'+title+'</span></div>'+nyImage(key,alt,eager)+'</figure>';
  const NY_MEDIA={"page3":{"src":"assets/images/1b9bfca8267933cb.svg","width":1920,"height":965},"page4":{"src":"assets/images/798e064a47bcffff.svg","width":1920,"height":965},"page5":{"src":"assets/images/505c70ac864c8baf.svg","width":1920,"height":965},"page6":{"src":"assets/images/4473b61739b02d23.svg","width":1920,"height":965},"page9":{"src":"assets/images/c608fbe675a46ca9.svg","width":1920,"height":965},"page10":{"src":"assets/images/9ff39bc020cfddb4.svg","width":1920,"height":965},"page11":{"src":"assets/images/19543eb50d694929.svg","width":1920,"height":965},"page12":{"src":"assets/images/13decb27d7a4e79b.svg","width":1920,"height":965},"page13":{"src":"assets/images/9595ee57793abd63.svg","width":1920,"height":965},"page14":{"src":"assets/images/50ecfff50cfc9158.svg","width":1920,"height":965},"page15":{"src":"assets/images/ea0a897a176f4faf.svg","width":1920,"height":965},"page16":{"src":"assets/images/6c3eb189de566c33.svg","width":1920,"height":965},"page17":{"src":"assets/images/ccb59bf976dc95ff.svg","width":1920,"height":965},"page18":{"src":"assets/images/43b219d4d4994f7a.svg","width":1920,"height":965},"page19":{"src":"assets/images/61e0981be3d87845.svg","width":1920,"height":965},"page20":{"src":"assets/images/22e62e0ffdde6634.svg","width":1920,"height":965},"page21":{"src":"assets/images/a442baad05f58f18.svg","width":1920,"height":965},"page22":{"src":"assets/images/86a93683ced24dc6.svg","width":1920,"height":965},"page23":{"src":"assets/images/028d252213437a8b.svg","width":1920,"height":965},"page24":{"src":"assets/images/82cd780fefaa11e0.svg","width":1920,"height":965},"wire11":{"src":"assets/images/9f9c14a9148c5e52.webp","width":786,"height":1704},"wire12":{"src":"assets/images/f27440d43572cc58.webp","width":786,"height":1704},"wire13":{"src":"assets/images/b799c6635dbcb623.webp","width":786,"height":1704},"wire21":{"src":"assets/images/2507e0f1dc64c487.webp","width":786,"height":1704},"wire22":{"src":"assets/images/1236a0fd6c324b70.webp","width":786,"height":1704},"wire23":{"src":"assets/images/cdd2341015ec20b2.webp","width":786,"height":1704},"grid":{"src":"assets/images/2a27edc258ecc304.webp","width":1344,"height":942},"inspiration1":{"src":"assets/images/d47b7e6b6d1caa48.svg","width":3553,"height":1892},"inspiration2":{"src":"assets/images/0180d5bc863d339d.svg","width":3600,"height":1908},"concept1":{"src":"assets/images/7eeba268178b8b66.webp","width":1224,"height":828},"concept2":{"src":"assets/images/33bc54fa49608245.webp","width":1194,"height":828},"v2":{"src":"assets/images/a080f36edf742ccc.webp","width":1258,"height":523},"v3":{"src":"assets/images/4923c60eaa40c98e.webp","width":1272,"height":918},"logos":{"src":"assets/images/d9be1e0d6c7ec8bc.webp","width":1266,"height":774},"style":{"src":"assets/images/f2674f26e88a0981.webp","width":1992,"height":660},"research":{"src":"assets/images/02aec4fa3869787d.svg","width":3652,"height":1916},"competitor":{"src":"assets/images/46d9806557679df5.svg","width":1208,"height":814},"age":{"src":"assets/images/84811b33406d228c.webp","width":786,"height":1732},"full":{"src":"assets/images/b1480031d25dc50a.webp","width":786,"height":1732},"face":{"src":"assets/images/bd75f7723f35d401.webp","width":786,"height":1704},"splash":{"src":"assets/images/c19a989aa21f4c63.webp","width":786,"height":1704},"qr":{"src":"assets/images/4e2bbee2273a0759.webp","width":786,"height":1732},"wallet":{"src":"assets/images/54c37e43caa2d8b0.webp","width":786,"height":1704},"clip":{"src":"assets/videos/d0b1f275ca7dd5d4.mp4"}};
  const NY_PENCIL_DEFS="<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"0\" height=\"0\" aria-hidden=\"true\" style=\"position:absolute;pointer-events:none\"><defs><filter id=\"nyid-pencil\" x=\"-2%\" y=\"-2%\" width=\"104%\" height=\"104%\" color-interpolation-filters=\"sRGB\"><feColorMatrix type=\"saturate\" values=\"0\" result=\"gray\"/><feConvolveMatrix in=\"gray\" order=\"3\" kernelMatrix=\"-1 -1 -1 -1 8 -1 -1 -1 -1\" divisor=\"1\" bias=\"0\" preserveAlpha=\"true\" result=\"edges\"/><feComponentTransfer in=\"edges\" result=\"ink\"><feFuncR type=\"linear\" slope=\"-1.4\" intercept=\".98\"/><feFuncG type=\"linear\" slope=\"-1.4\" intercept=\".98\"/><feFuncB type=\"linear\" slope=\"-1.4\" intercept=\".98\"/></feComponentTransfer><feTurbulence type=\"fractalNoise\" baseFrequency=\".035\" numOctaves=\"2\" seed=\"7\" result=\"grain\"/><feDisplacementMap in=\"ink\" in2=\"grain\" scale=\".8\" xChannelSelector=\"R\" yChannelSelector=\"G\"/></filter></defs></svg>\n";
  const NY_CONDENSED_CHAPTERS=[['overview','Overview'],['problem','Problem'],['opportunity','Opportunity'],['wireframes','Wireframe studies'],['concept-one','Inspiration & initial design'],['v2','Visual refinement'],['v3','Credential wallet development'],['style','Style guide'],['screens','Final screens'],['prototype','Demo'],['more','Explore next']];
  const NY_CHAPTERS=[['overview','Overview'],['problem','Problem'],['opportunity','Opportunity'],['research','State research'],['competition','Competitive analysis'],['wireframes','Layout grid & initial wireframes'],['wire-two','Alternative wireframes'],['inspiration','Inspiration boards'],['concept-one','Playful Geometry / initial design'],['concept-two','Modular Geometry / initial design'],['v2','Visual refinement'],['v3','Credential wallet development'],['branding','Logo development'],['style','Style guide'],['identity','Final identity views'],['verification','Final access & verification'],['prototype','Demo'],['takeaways','Takeaways'],['resources','Resources'],['more','Explore next']];
  const NY_PAGE_GROUPS=[[],[3],[4],[5],[6],[9,10],[11],[12,13],[14],[15],[16],[17],[20],[21],[18],[19],[22],[23],[24],[]];
  function nyidExploreNext(){
    const choices=[['somnus','An interactive descent through the science of sleep.'],['buildscape','An interactive installation combining design and development.'],['logo-animations','A collection of identities explored through motion.']];
    return '<div class="se-explore-next"><div class="se-next-grid">'+choices.map(([key,description])=>{
      const cover=slides.find(slide=>slide.dataset.project===key);
      return '<button type="button" class="se-next-card" data-sn-project="'+key+'"><span class="se-next-image"><img src="'+cover.querySelector('.bg img').src+'" alt="'+escapeProjectText(WORK_TITLES[key])+' project preview" loading="lazy"></span><span class="se-next-category">'+escapeProjectText(projectCategoryText(key))+'</span><span class="se-next-title">'+escapeProjectText(WORK_TITLES[key])+'<span aria-hidden="true">↗</span></span><span class="se-next-description">'+description+'</span><span class="se-next-action">View project</span></button>';
    }).join('')+'</div><button type="button" class="sn-action" data-sn-all-work>Back to all work ↗</button></div>';
  }
  function nyidPanels(full){
    const chapters=full?NY_CHAPTERS:NY_CONDENSED_CHAPTERS;
    const image=(key,alt,sketch=false)=>{
      const item=NY_MEDIA[key];
      return '<button type="button" class="se-expand '+(sketch?'ni-wireframe':'')+'" data-se-expand aria-label="View full size: '+escapeProjectText(alt)+'"><img src="'+item.src+'" alt="'+escapeProjectText(alt)+'" width="'+item.width+'" height="'+item.height+'" loading="lazy" decoding="async"></button>';
    };
    const fig=(key,label,cls='',sketch=false)=>'<figure class="ni-figure '+cls+'">'+image(key,label,sketch)+'<figcaption>'+label+'</figcaption></figure>';
    const board=(key,label)=>fig(key,label,'ni-board');
    const phone=(key,label)=>fig(key,label,'ni-phone');
    const phones=(items)=>'<div class="ni-phones">'+items.map(([key,label])=>phone(key,label)).join('')+'</div>';
    const wire=(prefix,label)=>'<div class="ni-wire-set"><h3>'+label+'</h3><div class="ni-wire-grid">'+['Splash / entry','Age view','Full ID view'].map((name,i)=>fig(prefix+(i+1),name,'',true)).join('')+'</div></div>';
    const note=(title,text)=>'<div class="ni-note"><h3>'+title+'</h3><p>'+text+'</p></div>';
    const list=items=>'<ul class="ni-list">'+items.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
    const pair=(a,b)=>'<div class="ni-pair">'+a+b+'</div>';
    function originals(index){const pages=NY_PAGE_GROUPS[index];if(!full||!pages.length)return '';return '<details class="sf-originals"><summary>Supporting process pages · '+pages.join(', ')+'</summary><div class="sf-source-pages">'+pages.map(n=>'<figure data-ny-source-page="'+n+'">'+image('page'+n,'Process documentation / page '+n)+'<figcaption>Process page '+n+'</figcaption></figure>').join('')+'</div></details>';}
    const panel=(index,title,body,extra='')=>'<section class="sn-panel se-panel ni-panel '+extra+'" id="ni-'+chapters[index][0]+'" style="--slide:'+index+'" aria-label="'+chapters[index][1]+'"><div class="sn-panel-body"><header class="se-heading"><span class="sn-kicker">'+(full?'Full study':'Condensed')+' / '+String(index+1).padStart(2,'0')+'</span><h2>'+title+'</h2></header>'+body+originals(index)+'</div></section>';
    const intro='<p class="ni-lead">A mobile identification concept that brings everyday credentials into one place.</p><dl class="se-project-meta"><div><dt>My role</dt><dd>UI/UX, visual design & motion</dd></div><div><dt>Timeline</dt><dd>Spring 2026</dd></div><div><dt>Deliverable</dt><dd>Mobile app concept & animated prototype</dd></div></dl>'+phones([['splash','Splash'],['age','Age identification'],['full','Full identification']]);
    const problem=pair('<div class="ni-note"><h3>Physical limitations</h3>'+list(['Lost, stolen or damaged cards','Forgery and duplication','A card to carry everywhere'])+'</div>','<div class="ni-note"><h3>Verification & replacement</h3>'+list(['Checks that rely on visual inspection','Replacement costs','Identity-fraud concerns'])+'</div>');
    const opportunity='<p>A digital ID could make credentials easier to access and verify, with authentication and machine-readable views built into the experience.</p><div class="ni-benefits">'+note('Access','Credentials in the device people already carry.')+note('Verification','Prototype authentication and machine-readable credential views.')+note('Physical card reliance','Explore reduced reliance on carrying a physical card.')+'</div>';
    const inspiration=board('inspiration1','Inspiration / Playful Geometry')+'<p>Soft, vibrant colors and controlled organic shapes balance structure with a more approachable interface.</p>'+board('concept1','Playful Geometry / initial design — applying Playful Geometry');
    const v2='<p>I selected Playful Geometry and refined its visual system.</p>'+board('v2','Visual refinement — visual variations');
    const v3='<p>The home screen brings the credential wallet, age view and full identification into one flow.</p>'+board('v3','Credential wallet development — wallet, age and full ID');
    const style=board('style','Final style guide / typography, colors, logo and assets')+'<p class="se-decision"><strong>Color direction</strong> Teal references the Statue of Liberty, connecting the visual identity to New York.</p>';
    const identity=phones([['splash','Splash / introduces the identity'],['age','Age view / portrait and age first'],['full','Full ID / detailed license information']]);
    const verification=phones([['face','Authentication / Face ID concept'],['wallet','Wallet / choose a credential'],['qr','QR credential view']]);
    const demo='<p>A recorded walkthrough of authentication, the wallet and identification views.</p><div class="ni-demo"><video data-se-video data-study-video="nyclip" controls playsinline preload="none" poster="'+NY_MEDIA.splash.src+'" aria-label="New York ID animated prototype demonstration"></video></div>';
    if(!full)return [
      panel(0,'New York ID.',intro,'ni-intro'),
      panel(1,'The limitations of physical identification.',problem),
      panel(2,'Make credentials accessible on a phone.',opportunity),
      panel(3,'Early interface studies.','<p>New York motifs and an upward swipe connect the age and full ID views.</p>'+wire('wire1','Playful Geometry')+'<details class="ni-alternate"><summary>Alternative layout / Modular Geometry</summary><p>A grid-based direction inspired by physical IDs, with horizontal swipe navigation.</p>'+wire('wire2','Modular Geometry')+'</details>'),
      panel(4,'From visual references to initial screens.',inspiration),
      panel(5,'Visual refinement.',v2),
      panel(6,'Credential wallet development.',v3),
      panel(7,'The final visual system.',style),
      panel(8,'Final screens.','<p>Refined city graphics, bold gradients and analogous colors connect the views.</p>'+identity+'<div class="ni-subheading"><h3>Access & verification</h3><p>The prototype illustrates authentication and a QR credential view.</p></div>'+verification),
      panel(9,'Prototype walkthrough.',demo+'<div class="se-outcome">'+note('Key learning','Clear status, task-based organization and transitions support a consistent flow between credentials.')+'</div>'),
      panel(10,'Explore related projects.',nyidExploreNext())
    ];
    return [
      panel(0,'New York ID.',intro,'ni-intro'),
      panel(1,'The problem with physical IDs.',problem),
      panel(2,'A digital ID opportunity.',opportunity),
      panel(3,'An identity rooted in New York.','<p>State research grounded the visual identity: the Empire State, Albany, New York City, and a seal featuring the Hudson River, rising sun and the motto Excelsior.</p>'+list(['New York became the 11th state on July 26, 1788.','State bird: Eastern Bluebird','State flower: Wild Rose','State tree: Sugar Maple'])+board('research','New York state references')),
      panel(4,'A mobile-first design opportunity.','<p>My review of New York Mobile ID identified a direct translation of the physical license, with dense information, unclear interactions and a rigid flow.</p><p>The design response was clearer hierarchy and navigation designed around mobile use.</p>'+board('competitor','New York Mobile ID / reference reviewed')),
      panel(5,'Layout grid & initial wireframes.','<p>Designed for iOS on an iPhone 15 canvas: 393 × 866, with 24-point margins and 16-point gutters.</p>'+board('grid','Layout grid')+'<p>Playful Geometry explores illustrated New York motifs. An upward swipe connects the age view to full identification.</p>'+wire('wire1','Playful Geometry')),
      panel(6,'Alternative wireframes.','<p>A conference-badge and physical-ID direction uses grids and simple geometry. Navigation and horizontal swipes connect the views.</p>'+wire('wire2','Modular Geometry')),
      panel(7,'Two inspiration boards.',pair('<div>'+board('inspiration1','Playful Geometry')+note('Approachable · Organic · Vibrant','Monochromatic and analogous palettes, soft colors and controlled organic shapes balance structure and fluidity.')+'</div>','<div>'+board('inspiration2','Modular Geometry')+note('Structured · Contemporary · Bold','Saturated colors, repeating patterns and modular shapes create a confident, expressive identity.')+'</div>')),
      panel(8,'Playful Geometry / initial design.','<p>The initial screens translate the Playful Geometry references into the interface.</p>'+board('concept1','Playful Geometry / initial design')),
      panel(9,'Modular Geometry / initial design.','<p>The alternative screens explore Modular Geometry through structured layouts and repeated shapes.</p>'+board('concept2','Modular Geometry / initial design')),
      panel(10,'Visual refinement.',v2),
      panel(11,'Credential wallet development.',v3),
      panel(12,'Logo development.','<p>Teal references the Statue of Liberty, connecting the visual identity to New York. Logo explorations developed a recognizable, minimal mark.</p>'+board('logos','Logo explorations')),
      panel(13,'Style guide.',style+'<div class="ni-palette" aria-label="Primary palette"><span style="--swatch:#9EE1E9">#9EE1E9</span><span style="--swatch:#013549">#013549</span><span style="--swatch:#F3FDFC">#F3FDFC</span></div><p>Secondary accents: #C59558, #CCAF5A, #01687D and #01A8E8. The system also includes credential illustrations, navigation icons and the New York ID mark.</p>'),
      panel(14,'Final identity views.','<p>The final screens refine the city graphics while retaining gradients and an analogous color palette.</p>'+identity),
      panel(15,'Access & verification.','<p>The prototype considers both the credential owner and the person checking it, with an authentication flow and a QR credential view.</p>'+verification),
      panel(16,'Animated prototype.',demo+'<p><a href="https://vimeo.com/1189950139?share=copy&amp;fl=sv&amp;fe=ci" target="_blank" rel="noopener noreferrer">Watch on Vimeo ↗</a></p>'),
      panel(17,'Takeaways.','<div class="ni-benefits">'+note('Show status','Make it clear what the app is doing and which credential is active.')+note('Organize around tasks','Structure information around quick age checks, full identification and the wallet.')+note('Connect the screens','Consider interactions and animation between views as part of the interface.')+'</div>'),
      panel(18,'Resources.','<ul class="ni-list"><li><a href="https://www.pexels.com/" target="_blank" rel="noopener noreferrer">Pexels ↗</a> — portrait image</li><li>Iconify plugin — icon library</li></ul>'),
      panel(19,'Explore related projects.',nyidExploreNext())
    ];
  }

  const CD_CHAPTERS=[['overview','Overview'],['problem','Problem & research'],['direction','Design direction'],['experience','Final experience'],['reflection','Reflection']];
  function cdSummaries(key){
    const ny=key==='nyid',prefix=ny?'ny':'sn';
    const panel=(g,content)=>'<section class="sn-panel " id="'+(g===0?prefix+'-overview':prefix+'-summary-'+g)+'" style="--slide:0" aria-label="'+CD_CHAPTERS[g][1]+'"><div class="sn-panel-body">'+content+'</div></section>';
    const image=(k,alt,label,eager=false)=>ny?nyScreen(k,alt,label,eager):snScreen(k,alt,label,eager);
    const layout=(g,kicker,title,copy,visual)=>panel(g,'<div class="sn-layout"><div class="sn-copy"><span class="sn-kicker">'+kicker+'</span>'+title+copy+'</div><div class="sn-visual">'+visual+'</div></div>');
    const points=items=>'<div class="sn-points">'+items.map(([title,text],i)=>'<div><small>0'+(i+1)+'</small><div><h3>'+title+'</h3><p>'+text+'</p></div></div>').join('')+'</div>';
    const intro='<div class="cd-intro"><strong>Complete story · 5 sections</strong><span>Scroll down for the full summary.<br>Switch to Full study for the process.</span></div>';
    const actions='<div class="sn-actions"><button class="sn-action primary" type="button" data-sn-jump="prototype">Watch prototype ↗</button><button class="sn-action" type="button" data-sn-deck>Process documentation ↗</button></div>';
    if(!ny)return [
      layout(0,'Overview / Interactive experience','<h1>Somnus.<span>A descent<br>into sleep.</span></h1>','<p class="sn-lead">An interactive journey that makes the sleep cycle tangible.</p><p>I designed a desktop experience for students, educators, and curious learners. Scrolling carries visitors from Awake through NREM I–III and REM; exploration reveals what changes in the body.</p><dl class="sn-meta"><div><dt>Role</dt><dd>Solo · UI/UX & interaction design</dd></div><div><dt>Scope</dt><dd>Research, visual design & motion</dd></div><div><dt>Timeline</dt><dd>February – May 2026</dd></div><div><dt>Deliverable</dt><dd>Animated desktop prototype</dd></div></dl>'+intro,image('home','Final Somnus Awake screen','Final experience',true)),
      layout(1,'01 / Problem & research','<h2>Keep the science.<br>Change the experience.</h2>','<p>Sleep is a layered physiological process, but static diagrams struggle to convey how it deepens. Research compared educational websites, scientific simulations, and immersive installations.</p>'+points([['The research gap','Websites simplify the subject; simulations can be technically demanding; installations often depend on VR or a physical space.'],['The design opportunity','Bring accurate content and engaging interaction into an accessible desktop journey.'],['The interaction metaphor','Use scrolling as a descent through sleep, with progress indicators for orientation and hotspots for information on demand.']]),image('drift','Somnus NREM I screen demonstrating the descent metaphor','The interaction idea')),
      layout(2,'02 / Design direction','<h2>Map the journey.<br>Build the atmosphere.</h2>','<p>A sitemap, pencil sketches, and two wireframe rounds established the stage sequence, navigation, hotspots, and secondary detail views.</p><p>Two moodboards—Luminous Drift and Geometric Surrealism—explored flow, colored light, and constructed forms. Composition studies developed luminous clouds and depth that change through the descent.</p>'+points([['The visual system','DM Serif Display and Inter pair expressive headings with readable information. A crescent mark and white, periwinkle, navy, and midnight palette connect the interface to sleep.']]),image('style','Somnus typography, palette, logo, and asset guide','Final visual system')),
      layout(3,'03 / Final experience','<h2>A scene to enter.<br>A body to discover.</h2>','<p>Awake introduces the guiding question and crescent. NREM I presents the stage, feeling, and duration; hidden hotspots reveal more. A secondary view brings heart rate, blood pressure, and variability into focus.</p><p>The recorded prototype demonstrates parallax, scroll, hover states, and progressive disclosure. A forced wake-up interaction was planned to change with sleep depth.</p>'+actions,'<div class="sn-wire-grid">'+image('home','Awake entry screen','Awake')+image('drift','NREM I stage screen','Drift')+image('heart','Heart metrics detail screen','Physiological detail')+'</div>'+snCaption('Atmosphere → stage → focused information.')),
      layout(4,'04 / Reflection','<h2>Research grounded it.<br>Motion explained it.</h2>','<p>The process revealed an opportunity between simplified education and technically demanding simulations. An animated prototype communicated the intended experience without requiring a full technical implementation.</p>'+points([['Key learning','The descent, changing atmosphere, and discoverable detail work together to explain how sleep deepens.'],['Next steps','Make secondary information easier to digest, animate every sleep stage and the return to Awake, and develop distinct forced wake-up transitions.']])+'<div class="sn-actions"><button class="sn-action" type="button" data-sn-deck>Process documentation ↗</button><button class="sn-action primary" type="button" data-sn-next>Next project / New York ID →</button></div>',image('drift','Final Somnus Drift design','The resulting direction'))
    ];
    return [
      layout(0,'Overview / Mobile app concept','<h1>New York ID.<span>Identity,<br>made mobile.</span></h1>','<p class="sn-lead">Everyday credentials designed around the phone.</p><p>A digital ID app concept brings age verification, a driver’s license, and a credential wallet into one experience. This is an interface concept, rather than a state-issued credential.</p><dl class="sn-meta"><div><dt>Role</dt><dd>UI/UX & interaction design</dd></div><div><dt>Scope</dt><dd>Research, interface design & motion</dd></div><div><dt>Timeline</dt><dd>Spring 2026</dd></div><div><dt>Deliverable</dt><dd>Digital ID app & animated prototype</dd></div></dl>'+intro,image('final','Final splash, age identification, and full ID screens','Final interface',true)),
      layout(1,'01 / Problem & research','<h2>Beyond a digital<br>copy of the card.</h2>','<p>Physical IDs can be lost, stolen, damaged, or forged. They need to be carried, can be costly to replace, and rely on manual verification.</p><p>My critique of New York Mobile ID identified dense information, unclear interactions, and a rigid flow. The opportunity was a clearer mobile hierarchy with authentication and machine-readable verification.</p><p>State research—from the seal and Excelsior to the Eastern Bluebird, Wild Rose, and Sugar Maple—grounded the identity in New York. The goal was recognizable local character with intuitive access.</p>',image('competitor','New York Mobile ID reference reviewed in competitive research','Research reference')),
      layout(2,'02 / Design direction','<h2>Explore two concepts.<br>Refine one direction.</h2>','<p>The Playful Geometry direction used illustrated New York motifs and an upward swipe from age to full ID. The Modular Geometry direction explored physical badge grids and horizontal navigation.</p><p>I selected Playful Geometry after comparing the two visual directions. Visual refinement developed the selected direction; the next stage introduced a credential wallet and transitions between views.</p><p>The final system uses Statue of Liberty-inspired teal to establish a connection to New York, a minimal logo, clear typography, bold gradients, and analogous colors.</p>',image('concept1v3','Selected design with wallet and identification views','Selected direction / credential wallet')),
      layout(3,'03 / Final experience','<h2>Authenticate.<br>Choose. Verify.</h2>','<p>A prominent portrait and age serve quick age identification. The full ID organizes license details into a readable card, while the wallet brings different credentials together.</p><p>Face ID introduces authentication. A dedicated active QR view supports machine reading, considering both the owner and the person checking the ID.</p><p>The animated prototype connects authentication, the wallet, and identification screens through transitions.</p><div class="sn-actions"><a class="sn-action primary" href="https://vimeo.com/1189950139?share=copy&amp;fl=sv&amp;fe=ci" target="_blank" rel="noopener noreferrer">Watch prototype ↗</a><button class="sn-action" type="button" data-sn-deck>Process documentation ↗</button></div>',image('scan','Final Face ID, wallet, and active QR code views','Authenticate / choose / verify')+snCaption('Age and full-ID designs shown in the overview.')),
      layout(4,'04 / Reflection','<h2>Clear information.<br>Connected interactions.</h2>','<p>This project reinforced the importance of visibility of system status, intuitive organization, and the transitions between screens.</p>'+points([['Make status visible','People should understand what the app is doing and which credential they are viewing.'],['Organize around use','Quick age identification and a full license need different levels of detail.'],['Design between screens','Interactions and animation help separate screens feel like a coherent experience.']])+'<div class="sn-actions"><button class="sn-action" type="button" data-sn-deck>Process documentation ↗</button><button class="sn-action primary" type="button" data-sn-next>Next project / Buildscape →</button></div>',image('final','Final New York ID splash, age view, and full license','The resulting interface'))
    ];
  }
  /* Somnus condensed: visual chapters designed around their content. */
  const SN_EDIT_CHAPTERS=[['overview','Introduction'],['problem','The problem'],['idea','Opportunity & idea'],['audience','Audience & devices'],['comparison','Competitive analysis'],['sitemap','Site map'],['v2','Refined wireframes'],['moodboards','Moodboards'],['compositions','Visual compositions'],['style','Final style & assets'],['screens','Final screens'],['prototype','Animated prototype']];
  function somnusExploreNext(){
    const choices=[['nyid','A mobile ID concept with age verification and a credential wallet.'],['buildscape','An interactive installation combining design and development.'],['logo-animations','Six brand identities explored through motion.']];
    return '<section class="se-explore-next" aria-labelledby="somnus-explore-title"><header><span class="sn-kicker">More selected work</span><h2 id="somnus-explore-title">Explore related projects.</h2></header><div class="se-next-grid">'+choices.map(([key,description])=>{
      const cover=slides.find(slide=>slide.dataset.project===key),src=cover.querySelector('.bg img').src;
      return '<button type="button" class="se-next-card" data-sn-project="'+key+'"><span class="se-next-image"><img src="'+src+'" alt="'+escapeProjectText(WORK_TITLES[key])+' project preview" loading="lazy" decoding="async"></span><span class="se-next-category">'+escapeProjectText(projectCategoryText(key))+'</span><span class="se-next-title">'+escapeProjectText(WORK_TITLES[key])+'<span aria-hidden="true">↗</span></span><span class="se-next-description">'+escapeProjectText(description)+'</span><span class="se-next-action">View project</span></button>';
    }).join('')+'</div><button type="button" class="sn-action" data-sn-all-work>Back to all work ↗</button></section>';
  }
  function openChosenStudy(key){
    if(caseAnimating)return;
    const source=[...visibleWorkSlides(),...galleryGrid.querySelectorAll('[data-gallery-project]')].find(tile=>tile.dataset.project===key);
    if(!source)return;
    closeCase(()=>{
      const fromGallery=!slides.includes(source);
      if(!fromGallery)setActive(slides.indexOf(source));
      source.scrollIntoView({behavior:'instant',block:'start'});
      openPortfolioProject(key,source,fromGallery);
    });
  }

  function snEditorialPanels(){
    const image=(key,alt)=>'<button type="button" class="se-expand" data-se-expand aria-label="View full size: '+alt+'">'+snImage(key,alt)+'</button>';
    const heading=(n,title,note='')=>'<header class="se-heading"><span class="sn-kicker">'+n+'</span><h2>'+title+'</h2>'+(note?'<p>'+note+'</p>':'')+'</header>';
    const panel=(i,body,cls='')=>'<section class="sn-panel se-panel '+cls+'" id="se-'+SN_EDIT_CHAPTERS[i][0]+'" style="--slide:'+i+'" aria-label="'+SN_EDIT_CHAPTERS[i][1]+'"><div class="sn-panel-body">'+body+'</div></section>';
    const icon=(kind)=>'<svg class="se-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({chart:'<path d="M8 7v33h33M15 31V21m10 10V12m10 19V18"/>',text:'<path d="M9 12h30M9 20h30M9 28h24M9 36h18"/>',layers:'<path d="m24 7 18 10-18 10L6 17 24 7Zm-18 18 18 10 18-10M6 33l18 10 18-10"/>',student:'<path d="m3 16 21-10 21 10-21 10L3 16Zm9 5v14q12 10 24 0V21M44 17v18"/>',people:'<circle cx="19" cy="16" r="7"/><path d="M5 41v-5a14 14 0 0 1 28 0v5M33 9a7 7 0 0 1 0 14m5 5a13 13 0 0 1 6 12"/>',desktop:'<rect x="5" y="5" width="38" height="27" rx="2"/><path d="M24 32v10M15 43h18"/>',laptop:'<path d="M10 33V9h28v24M4 34h40l-3 6H7l-3-6Z"/>',scroll:'<rect x="16" y="4" width="16" height="26" rx="8"/><path d="M24 9v7m-7 22 7 7 7-7m-7-8v14"/>'})[kind]+'</svg>';
    const vid=(label)=>'<video data-se-video controls playsinline preload="none" poster="'+SN_ASSETS.home+'" aria-label="'+label+'"></video>';
    const fig=(key,label,cls='')=>'<figure class="se-figure '+cls+'">'+image(key,label)+'<figcaption>'+label+'</figcaption></figure>';
    return [
      panel(0,'<div class="se-intro-title"><div><span class="sn-kicker">Interactive · UI/UX · Motion</span><h1>Somnus<span>A descent into sleep.</span></h1></div><p>A desktop website concept that uses scrolling and interactive detail to explain sleep stages and changes in the body.</p></div><dl class="se-project-meta"><div><dt>My role</dt><dd>Solo · Research, UI/UX, visual design & motion</dd></div><div><dt>Timeline</dt><dd>February – May 2026</dd></div><div><dt>Deliverable</dt><dd>Recorded animated prototype</dd></div></dl><div class="se-film">'+vid('Somnus final experience video')+'</div><p class="se-scope"><strong>Prototype focus</strong> Awake, NREM I and a physiological detail view.</p>','se-intro'),
      panel(1,heading('01 / The problem','Sleep-stage changes are difficult to visualize.')+'<div class="se-problem-grid"><div>'+icon('chart')+'<h3>Static diagrams</h3></div><div>'+icon('text')+'<h3>Dense explanations</h3></div><div>'+icon('layers')+'<h3>Abstract body changes</h3></div></div><p class="se-statement">The references I reviewed left room to show how sleep deepens and how the body changes over time.</p>','se-problem'),
      panel(2,'<div class="se-idea"><div>'+heading('02 / Opportunity & idea','Make the progression<br>the interaction.','Use scrolling to move through sleep stages; reveal brain and body changes through contextual interactions.')+'</div><div class="se-descent"><span class="se-mini-label">Planned journey</span>'+['Awake','NREM I','NREM II','NREM III','REM'].map((x,i)=>'<div style="--depth:'+i+'"><small>'+String(i).padStart(2,'0')+'</small><span>'+x+'</span><span aria-hidden="true">↓</span></div>').join('')+'</div></div>'),
      panel(3,heading('03 / Audience & devices','Audience & learning context.')+'<div class="se-audience"><div>'+icon('student')+'<small>Primary</small><h3>High school &<br>college students</h3><p>Learning health sciences</p></div><div>'+icon('people')+'<small>Secondary</small><h3>Educators &<br>general learners</h3></div><div class="se-devices"><div>'+icon('desktop')+icon('laptop')+'</div><small>Primary devices</small><h3>Desktop & laptop</h3><p>Classroom · library · home</p></div></div>'),
      panel(4,heading('04 / Competitive analysis','Comparative research.')+'<div class="se-table-wrap"><table class="se-table se-reference-table"><caption>Qualitative observations from my reference review</caption><thead><tr><th scope="col">Reference</th><th scope="col">Approach</th><th scope="col">Observed trade-off</th></tr></thead><tbody><tr><th scope="row">Inter-Dream</th><td>Immersive sleep experience</td><td>Installation / VR access</td></tr><tr><th scope="row">Sleep Cycle App</th><td>Readable stage dashboards</td><td>Limited immersive storytelling</td></tr><tr><th scope="row">Web EEG Simulation</th><td>Interactive brain-wave exploration</td><td>Technical learning curve</td></tr></tbody></table></div><p class="se-decision"><strong>Design response</strong> Combine sleep-stage explanations with an exploratory desktop experience.</p>'),
      panel(5,'<div class="se-map-layout">'+heading('05 / Site map','The full concept.','Scroll-linked stages, detail views and planned wake-up routes. The prototype focuses on the highlighted sections.')+'<figure class="se-map">'+image('map','Somnus concept site map: planned sleep stages and interactions, with prototype sections highlighted')+'</figure></div>'),
      panel(6,heading('06 / Refined wireframes','Refined interface wireframes.','Stage and feeling appear first; physiological information opens in a secondary view.')+'<div class="se-wire-grid">'+fig('v2awake','Awake / entry')+fig('v2drift','NREM I / stage overview')+fig('v2detail','Secondary / brain-wave detail')+fig('v2wake','Planned / forced wake-up')+'</div>'),
      panel(7,heading('07 / Moodboards','Visual direction exploration.')+'<div class="se-board-pair">'+fig('moodone','01 / Luminous Drift — flowing imagery & colored light')+fig('moodtwo','02 / Geometric Surrealism — constructed forms & a restrained palette')+'</div>'),
      panel(8,heading('08 / Visual compositions','Comparing visual concepts.')+'<div class="se-board-pair se-comps">'+fig('compone','01 / Luminous Drift')+fig('comptwo','02 / Geometric Surrealism')+'</div><p class="se-decision"><strong>Final direction</strong> Atmospheric clouds and a restrained blue palette. I refined the logo, reduced the progress navigation and moved 3D exploration into hotspot interactions.</p>'),
      panel(9,heading('09 / Final style & assets','The final visual system.','DM Serif Display for expressive headings; Inter for supporting information.')+'<div class="se-style">'+image('style','Final Somnus style guide: DM Serif Display, Inter, color palette, crescent logo, clouds, heart, and atmospheric assets')+'</div>'),
      panel(10,heading('10 / Final screens','Final screen sequence.')+'<div class="se-final-grid">'+fig('home','Awake / introduces the descent')+'<div>'+fig('finaldrift','NREM I / stage overview')+fig('finalhover','NREM I / hotspot hover reveals detail')+'</div>'+fig('heart','Secondary view / heart rate, blood pressure & variability')+'</div>'),
      panel(11,heading('11 / Animated prototype','Recorded interaction walkthrough.','Demonstrates parallax, scrolling, hotspot hover and progressive disclosure.')+'<div class="se-film se-outro-film">'+vid('Somnus recorded animated prototype walkthrough')+'</div><div class="se-outcome"><div><h3>Key learning</h3><p>A recorded prototype communicated the intended interactions without requiring a fully implemented website.</p></div><div><h3>Next step</h3><p>Simplify the detail views, then animate the remaining stages and wake-up transitions.</p></div></div><div class="se-end"><button type="button" class="sn-action" data-sn-deck>Process documentation ↗</button></div>'+somnusExploreNext())
    ];
  }

  const SN_COMPLETE_MEDIA={"page1":{"src":"assets/images/410462cf2498fc93.svg","width":1920,"height":996},"page2":{"src":"assets/images/997eca845953f49c.svg","width":1920,"height":996},"page3":{"src":"assets/images/c3d034ec68eb4edc.svg","width":1920,"height":996},"page4":{"src":"assets/images/c7b585375d4e3255.svg","width":1920,"height":996},"page5":{"src":"assets/images/9bb2405224006a4b.svg","width":1920,"height":996},"page6":{"src":"assets/images/69fd87060f5c891f.svg","width":1920,"height":996},"page7":{"src":"assets/images/bda4a66f17f7f8ec.svg","width":1920,"height":996},"page8":{"src":"assets/images/cd8f09e15a036590.svg","width":1920,"height":996},"page9":{"src":"assets/images/bd89737dc5a2964a.svg","width":1920,"height":996},"page10":{"src":"assets/images/f6e30de67a77af83.svg","width":1920,"height":996},"page11":{"src":"assets/images/7fae4f86a033727e.svg","width":1920,"height":996},"page12":{"src":"assets/images/b0636ee107d2b1da.svg","width":1920,"height":996},"page13":{"src":"assets/images/676ce988c10025f5.svg","width":1920,"height":996},"page14":{"src":"assets/images/7107cd3fa46cc12c.svg","width":1920,"height":996},"page15":{"src":"assets/images/6713cd2b6c6b88a4.svg","width":1920,"height":996},"page16":{"src":"assets/images/e5274a2faa55e04a.svg","width":1920,"height":996},"page17":{"src":"assets/images/00c24894d594e1e3.svg","width":1920,"height":996},"page18":{"src":"assets/images/2ab1b357fa04a5a6.svg","width":1920,"height":996},"page19":{"src":"assets/images/f0a69a39136203ee.svg","width":1920,"height":996},"page20":{"src":"assets/images/640861f4b67fec74.svg","width":1920,"height":996},"page21":{"src":"assets/images/6896fe9dc4f73874.svg","width":1920,"height":996},"page22":{"src":"assets/images/ef2e0f532539688c.svg","width":1920,"height":996},"page23":{"src":"assets/images/6444de24ad332325.svg","width":1920,"height":996},"page24":{"src":"assets/images/3d0ed60573966dcd.svg","width":1920,"height":996},"page25":{"src":"assets/images/3637e190c16e5fb7.svg","width":1920,"height":996},"page26":{"src":"assets/images/0db92b11462e7cec.svg","width":1920,"height":996},"page27":{"src":"assets/images/afff5160ae7ed7e0.svg","width":1920,"height":996},"page28":{"src":"assets/images/1358e1e4c354a194.svg","width":1920,"height":996},"page29":{"src":"assets/images/e3e1a3cde9876790.svg","width":1920,"height":996},"page30":{"src":"assets/images/c33276220fd4be0a.svg","width":1920,"height":996},"page31":{"src":"assets/images/8b3d64b0aba4531f.svg","width":1920,"height":996},"page32":{"src":"assets/images/dd74033a70ddb787.svg","width":1920,"height":996},"page33":{"src":"assets/images/34e7413d37bf2b2d.svg","width":1920,"height":996},"page34":{"src":"assets/images/5dcc68bc0226addb.svg","width":1920,"height":996},"page35":{"src":"assets/images/1cfef05b3ce0e46f.svg","width":1920,"height":996},"page36":{"src":"assets/images/89233b309429b10c.svg","width":1920,"height":996},"page37":{"src":"assets/images/aac0d8c1d52798f5.svg","width":1920,"height":996},"page38":{"src":"assets/images/4627d7d57dc4f464.svg","width":1920,"height":996},"page39":{"src":"assets/images/f5e3fb0a8f005cd2.svg","width":1920,"height":996},"page40":{"src":"assets/images/ff8b2ed8c858f055.svg","width":1920,"height":996},"page41":{"src":"assets/images/4a8b683d27a20f8f.svg","width":1920,"height":996},"page42":{"src":"assets/images/69fdc8fd0fb92ce5.svg","width":1920,"height":996},"page43":{"src":"assets/images/c9abf175fd7029bc.svg","width":1920,"height":996},"page44":{"src":"assets/images/561f158022527f50.svg","width":1920,"height":996},"page45":{"src":"assets/images/46332e733a2487ae.svg","width":1920,"height":996},"page46":{"src":"assets/images/285c3fe5abfc09bf.svg","width":1920,"height":996},"page47":{"src":"assets/images/07ca4f4c79336d03.svg","width":1920,"height":996},"page48":{"src":"assets/images/9d1a683a2473022d.svg","width":1920,"height":996},"page49":{"src":"assets/images/e13e321894785f7a.svg","width":1920,"height":996},"page50":{"src":"assets/images/80837175f21e87a2.svg","width":1920,"height":996},"page51":{"src":"assets/images/7c6d641bc430b84b.svg","width":1920,"height":996},"page52":{"src":"assets/images/3e3a024a32e337c3.svg","width":1920,"height":996},"page53":{"src":"assets/images/2c801693e55719c3.svg","width":1920,"height":996},"page54":{"src":"assets/images/f6945d059e9c0a37.svg","width":1920,"height":996},"trend20":{"src":"assets/images/a525fb346a0b5b7f.webp","width":742,"height":882},"trend21":{"src":"assets/images/66fc58f6c2e3d6b3.webp","width":994,"height":952},"trend22":{"src":"assets/images/5a0fc847cf713f29.webp","width":784,"height":924},"v1overview":{"src":"assets/images/96ea0f51f9c2c3ea.webp","width":1794,"height":693},"wire27":{"src":"assets/images/086eeb6705e6a014.webp","width":1096,"height":623},"wire28":{"src":"assets/images/06bbc2e0d714d55d.webp","width":1096,"height":623},"wire29":{"src":"assets/images/0326218a9ff1751b.webp","width":1096,"height":623},"wire30":{"src":"assets/images/0326218a9ff1751b.webp","width":1096,"height":623},"wire31":{"src":"assets/images/dd3c5ad5e0763ecb.webp","width":1096,"height":623},"wire32":{"src":"assets/images/d2ec2fbd4742ab76.webp","width":1096,"height":623},"wire36":{"src":"assets/images/da196a241f2076af.webp","width":1096,"height":623},"wire37":{"src":"assets/images/be721c8f10355c29.webp","width":1096,"height":623},"wire38":{"src":"assets/images/90ef4a0ed1c56e04.webp","width":1096,"height":623},"wire34":{"src":"assets/images/48587498c09e686a.webp","width":1124,"height":693},"wire35":{"src":"assets/images/48587498c09e686a.webp","width":1124,"height":693},"refinement":{"src":"assets/images/d51a0ff17c66c081.webp","width":1920,"height":1080}};
  /* Full Somnus: every substantive topic in the 54-page process deck. */
  const SN_COMPLETE_CHAPTERS=[["overview","Overview"],["problem","Problem"],["idea","Project & goal"],["name","Why Somnus?"],["audience","Audience & environment"],["uses","Use cases"],["topics","Research topics"],["research","Competitive analysis"],["trends","Interaction references"],["map","Site map"],["sketches","Concept sketches"],["v1-entry","Initial wireframes / Landing"],["v1-awake","Initial wireframes / Awake"],["v1-stage","Initial wireframes / NREM I"],["v1-detail","Initial wireframes / Detail & waking"],["v2-awake","Entry & navigation refinements"],["v2-stage","Stage & detail refinements"],["moods","Moodboards"],["compositions","Visual compositions"],["refinement","Further development"],["system","Style & assets"],["awake","Final / Awake"],["drift","Final / NREM I"],["detail","Final / Physiological detail"],["prototype","Animated prototype"],["reflection","Takeaways & next steps"],["references","Citations"],["more","Explore next"]];
  const SN_COMPLETE_PAGE_GROUPS=[[1,2],[3,4,5,6],[7,8,9,10],[],[11,12,13],[14],[15,16],[17,18,19],[20,21,22],[23,24],[25],[26,27],[28],[29,30],[31,32],[33,34,35],[36,37,38],[39,40,41],[42,43],[44],[45,46],[47],[48],[49],[50],[51,52,53],[54],[]];
  function snCompletePanels(){
    const media=(key,alt)=>{
      const item=SN_COMPLETE_MEDIA[key];
      return '<button type="button" class="se-expand" data-se-expand aria-label="View full size: '+escapeProjectText(alt)+'"><img src="'+item.src+'" width="'+item.width+'" height="'+item.height+'" alt="'+escapeProjectText(alt)+'" loading="lazy" decoding="async"></button>';
    };
    const fig=(key,alt)=>'<figure class="sf-figure">'+media(key,alt)+'<figcaption>'+alt+'</figcaption></figure>';
    const asset=(key,alt)=>'<figure class="sf-figure"><button type="button" class="se-expand" data-se-expand aria-label="View full size: '+escapeProjectText(alt)+'">'+snImage(key,alt)+'</button><figcaption>'+alt+'</figcaption></figure>';
    const bullets=items=>'<ul class="sf-list">'+items.map(item=>'<li>'+item+'</li>').join('')+'</ul>';
    const note=(title,body)=>'<div class="sf-note"><h3>'+title+'</h3>'+body+'</div>';
    const pair=(a,b)=>'<div class="sf-pair">'+a+b+'</div>';
    function originals(i){const pages=SN_COMPLETE_PAGE_GROUPS[i];if(!pages.length)return '';return '<details class="sf-originals"><summary>Supporting process pages · '+pages.join(', ')+'</summary><div class="sf-source-pages">'+pages.map(n=>'<figure data-source-page="'+n+'">'+media('page'+n,'Process documentation / page '+n)+'<figcaption>Page '+n+' of 54</figcaption></figure>').join('')+'</div></details>';}
    const panel=(i,title,body)=>'<section class="sn-panel se-panel sf-panel" id="sf-'+SN_COMPLETE_CHAPTERS[i][0]+'" style="--slide:'+i+'" aria-label="'+SN_COMPLETE_CHAPTERS[i][1]+'"><div class="sn-panel-body"><header class="se-heading"><span class="sn-kicker">Full study / '+String(i+1).padStart(2,'0')+'</span><h2>'+title+'</h2></header>'+body+originals(i)+'</div></section>';
    const route='<div class="sf-route" aria-label="Planned sleep-stage sequence">'+['Awake','NREM I','NREM II','NREM III','REM'].map(x=>'<span>'+x+'</span>').join('<span class="sf-route-arrow" aria-hidden="true">→</span>')+'</div>';
    return [
      panel(0,'Somnus. A descent into sleep.','<p class="sf-lead">An interactive website concept that turns the sleep cycle into a scroll-based descent.</p><dl class="se-project-meta"><div><dt>My role</dt><dd>Solo · Research, UI/UX, visual design & motion</dd></div><div><dt>Timeline</dt><dd>February – May 2026</dd></div><div><dt>Deliverable</dt><dd>Recorded animated prototype</dd></div></dl>'+asset('home','Final Awake screen')+'<p>The concept spans the full sleep cycle. The recorded prototype demonstrates Awake, NREM I and a physiological detail view.</p><div class="sn-actions"><button class="sn-action primary" type="button" data-sn-jump="prototype">Watch prototype ↘</button><button class="sn-action" type="button" data-sn-deck>Complete process documentation ↗</button></div>'),
      panel(1,'The problem with static sleep education.','<p>The project began with how sleep education is presented: charts, diagrams and heavy text. Online wellness content can also oversimplify the science.</p>'+bullets(['Physical changes are difficult to conceptualize spatially.','Static explanations struggle to convey the dynamic, layered nature of sleep architecture.','Complex neurological and physiological processes remain abstract.'])),
      panel(2,'Explore how sleep deepens.','<p><strong>The opportunity:</strong> explain changes across sleep stages through a scroll-driven visual experience.</p><p><strong>The project:</strong> a website in which scrolling carries visitors from Awake through NREM I–III to REM.</p>'+route+pair(note('Goal','<p>Help learners understand complex neuroscience and visualize the four major sleep stages.</p>'),note('Approach','<p>Use motion, depth and exploration to communicate progression, with information revealed through interaction.</p>'))),
      panel(3,'Why Somnus?','<div class="sf-name-entry"><div><span class="sf-name-origin">Latin · noun</span><p class="sf-name-word" lang="la">somnus</p></div><div><p class="sf-name-meaning">sleep; slumber.</p><p class="sf-name-explanation">The project name is borrowed directly from Latin.</p></div></div><a class="sf-name-source" href="https://logeion.uchicago.edu/somnus" target="_blank" rel="noopener noreferrer">Latin definition ↗</a>'),
      panel(4,'Audience, environment & devices.',pair(note('Primary audience','<p>High school and college students learning health sciences.</p>'),note('Secondary audience','<p>Educators seeking engaging teaching tools, and general learners interested in sleep and brain science.</p>'))+pair(note('Learning environment','<p>Classrooms, computer labs, libraries and focused, self-paced learning at home.</p>'),note('Primary devices','<p>Desktop and laptop computers.</p>'))),
      panel(5,'Learning scenarios.',pair(note('Interactive demonstration','<p>A biology teacher introduces Somnus during a lesson. Students follow along on their desktops or laptops.</p>'),note('Self-guided learning','<p>A learner interested in sleep health explores the experience at home, using a personal desktop or laptop.</p>'))),
      panel(6,'Content framework.','<p>The planned content connects sleep stages to three types of changes in the brain and body.</p><div class="sf-three">'+note('Physiology',bullets(['Heart rate','Breathing changes']))+note('Brain waves',bullets(['Beta','Alpha','Theta','Delta frequency ranges']))+note('Hormones',bullets(['Melatonin','Cortisol','Growth hormone']))+'</div>'),
      panel(7,'Comparative research.','<p>My reference review compared educational websites, technical simulations and immersive experiences.</p><div class="se-table-wrap"><table class="se-table se-reference-table"><thead><tr><th scope="col">Reference</th><th scope="col">Observed strength</th><th scope="col">Observed limitation</th></tr></thead><tbody><tr><th scope="row">Sleep-cycle websites<br><small>e.g. Stages of Sleep</small></th><td>Educational explanations</td><td>Often simplified, with limited explanation of how each stage affects the body</td></tr><tr><th scope="row">Sleep-cycle simulations<br><small>e.g. Web EEG</small></th><td>Highly interactive and educational</td><td>Specialized technical interfaces and a high learning curve</td></tr><tr><th scope="row">Experiential projects<br><small>e.g. Inter-Dream</small></th><td>Immersive and engaging</td><td>Often installation- or VR-based; education is less central</td></tr></tbody></table></div><div class="sf-three">'+asset('article','Educational website reference')+asset('chart','Scientific simulation reference')+asset('installation','Experiential installation reference')+'</div><p class="se-decision"><strong>Design response</strong> Bring sleep-stage explanations and exploratory interaction into a desktop experience.</p>'),
      panel(8,'Interaction references.',pair(note('Parallax / layered environments','<p>Layers move at different speeds to create depth and immersion.</p>'),fig('trend20','Parallax / layered environment reference'))+pair(note('Hotspot-based disclosure','<p>Information appears when people interact with specific areas, keeping the initial layout open and encouraging exploration.</p>'),fig('trend21','Hotspot disclosure reference'))+pair(note('Cursor reactions','<p>Cursor movement provides immediate visual feedback.</p>'),fig('trend22','Cursor reaction reference'))+'<p><a href="https://app.spline.design/community/file/8cf76a7f-428e-4bf7-af91-720754f07596" target="_blank" rel="noopener noreferrer">Spline interaction reference ↗</a></p>'),
      panel(9,'Sleep-stage structure & navigation.','<p>The site map establishes sections revealed by scrolling, rather than separate pages. It includes routes into secondary information and planned forced wake-up interactions.</p><p>The highlighted parts indicate the prototype’s scope.</p><div class="sf-map">'+asset('map','Complete site map / highlighted prototype sections')+'</div>'),
      panel(10,'Early layout & interaction sketches.','<p>Three pencil studies explore the general website layout, abstract representations and progress indicators.</p><div class="sf-sketches">'+asset('sketch1','01 / General website layout')+asset('sketch2','02 / Abstract representations')+asset('sketch3','03 / Progress bars')+'</div>'),
      panel(11,'Initial wireframes / Landing.',fig('v1overview','Initial screen sequence')+pair(note('Landing screen',bullets(['A subtitle explains the Latin name and introduces the sleep-focused experience.','A downward icon signals the first scroll interaction.'])),fig('wire27','Initial wireframes / Landing screen'))),
      panel(12,'Initial wireframes / Awake.',pair(note('Entry into the sleep cycle',bullets(['A guiding question introduces the main topic.','The scroll-down icon represents the moon.','Parallax clouds support the transition from Awake into deeper sleep.','The menu remains available but quiet, supporting an experience led by exploration.'])),fig('wire28','Initial wireframes / Awake screen'))),
      panel(13,'Initial wireframes / NREM I.',pair(note('Content & exploration',bullets(['Show the sleep stage, a description of its feeling, a short explanation and duration.','Hide deeper information until a person interacts with the 3D model or selects a reveal control.','Keep Force Wake Up available from any stage.','Use the interactive 3D model as the main source of exploration and learning.'])),fig('wire29','Initial wireframes / NREM I — content, hidden information, wake-up control and model'))+pair(note('Orientation & discovery',bullets(['Subtle interaction dots encourage visitors to discover information.','An enlarged progress dot identifies the current stage.','The circle around the dot indicates the percentage of that stage explored.'])),fig('wire30','Initial wireframes / NREM I — hidden interactions and progress bar'))),
      panel(14,'Initial wireframes / Detail & forced wake-up.',pair(note('Secondary information',bullets(['A discovered interaction remains filled; its icon expands to reveal its name.','Selecting an interaction zooms the 3D model into the relevant area.','The detail view can contain text, a graph or a chart.'])),fig('wire31','Initial wireframes / Secondary screen'))+pair(note('Forced wake-up / planned',bullets(['Selecting Force Wake Up fills the button and starts the interaction.','The experience shows progress and information about waking from the current stage while the 3D model fades.','A stage-specific animation may return the visitor to the home screen.','An arrow or the Force Wake Up control lets the visitor cancel the interaction.'])),fig('wire32','Initial wireframes / Forced wake-up screen'))),
      panel(15,'Refined wireframes / Entry & navigation.', '<div class="se-wire-grid">'+asset('v2awake','Refined wireframes / Awake')+asset('v2drift','Refined wireframes / NREM I')+asset('v2detail','Refined wireframes / Secondary screen')+asset('v2wake','Refined wireframes / Wake up')+'</div>'+pair(note('Awake / title & descent',bullets(['Somnus and its subtitle establish the subject.','The guiding question introduces the sleep cycle.','The moon doubles as a scroll-down cue.','Parallax clouds support the transition from Awake into sleep.'])),fig('wire34','Refined wireframes / Awake — title, question, moon and clouds'))+pair(note('Awake / navigation',bullets(['The menu remains available without dominating the experience.','The enlarged progress dot identifies the current stage; the surrounding circle records the percentage explored.'])),fig('wire35','Refined wireframes / Awake — menu and progress navigation'))),
      panel(16,'Refined wireframes / Stage, detail & waking.',pair(note('NREM I',bullets(['Lead with the stage, feeling and short description.','Reveal information through hotspots on the 3D model or their controls.','Keep the planned Force Wake Up interaction accessible.'])),fig('wire36','Refined wireframes / NREM I screen'))+pair(note('Secondary screen',bullets(['Selecting an interaction zooms and focuses the 3D model.','The focused view presents a title, information and, where appropriate, a graph or chart.'])),fig('wire37','Refined wireframes / Secondary screen'))+pair(note('Wake-up screen / planned',bullets(['Describe what waking from the current stage feels like.','Move the 3D model to the side so the explanation takes priority.','A user-initiated transition returns to the home screen, with timing that reflects the difficulty of waking from that stage.','The experience then returns to the stage the visitor left.'])),fig('wire38','Refined wireframes / Wake-up screen'))),
      panel(17,'Visual direction exploration.',pair(note('01 / Luminous Drift','<p>Flowing black-and-white photography accented by colored light. Light rays and floating particles create depth and atmosphere.</p>')+asset('moodone','Luminous Drift / moodboard'),note('02 / Geometric Surrealism','<p>Surreal geometric forms in a mono- or duo-chromatic palette, with a clean, digitally constructed visual treatment.</p>')+asset('moodtwo','Geometric Surrealism / moodboard'))),
      panel(18,'Visual concept development.',pair(note('Luminous Drift / visual concept','<p>A black-and-white atmospheric scene, with colored light that follows the cursor.</p>')+asset('compone','Luminous Drift / visual concept'),note('Geometric Surrealism / visual concept','<p>An abstract, geometric surreal environment applied to the sleep journey.</p>')+asset('comptwo','Geometric Surrealism / visual concept'))),
      panel(19,'Design refinement.',pair(note('Refining the selected direction',bullets(['Refine the Somnus logo.','Reduce the size of the progress navigation.','Move 3D model exploration into hotspot interactions.'])),fig('refinement','Further visual development / revised logo, navigation and hotspot interaction'))),
      panel(20,'Final style & assets.','<p>DM Serif Display Regular provides the display type. Inter Semibold, Regular and Light support the interface hierarchy.</p>'+asset('style','Final style guide / typography, palette, logo and assets')+'<p>The final system includes a crescent logo, white and blue-to-midnight colors, cloud layers and physiological imagery.</p>'),
      panel(21,'Final / Awake.',asset('home','Final Awake screen / home')),
      panel(22,'Final / NREM Stage I.',pair(asset('finaldrift','Final NREM I / resting state'),asset('finalhover','Final NREM I / active hotspot state'))),
      panel(23,'Final / Physiological detail view.',asset('heart','Final physiological detail screen')),
      panel(24,'Animated prototype.','<p>The recorded walkthrough demonstrates parallax mouse tracking and scroll, interactive hotspot hover states and progressive disclosure.</p><div class="se-film"><video data-se-video controls playsinline preload="none" poster="'+SN_ASSETS.home+'" aria-label="Somnus complete animated prototype walkthrough"></video></div><p><a href="https://vimeo.com/1189649389?share=copy&amp;fl=sv&amp;fe=ci" target="_blank" rel="noopener noreferrer">Watch the original prototype on Vimeo ↗</a></p>'),
      panel(25,'Outcomes & next steps.',pair(note('Key learning',bullets(['Research grounded the project and revealed an opportunity to differentiate through motion and interaction.','A recorded prototype communicated the intended interactions without requiring a fully implemented website.'])),note('Future development',bullets(['Improve the clarity and interaction of physiological detail views.','Animate all sleep stages and the natural return to Awake.','Develop forced wake-up transitions that differ with the stage of sleep.'])))),
      panel(26,'Citations & references.','<p>Research and visual references:</p><ul class="sf-citations"><li><a href="https://www.sleepfoundation.org/stages-of-sleep" target="_blank" rel="noopener noreferrer">National Sleep Foundation — Stages of Sleep ↗</a></li><li><a href="https://exertiongameslab.org/projects/inter-dream-interactive-sleep" target="_blank" rel="noopener noreferrer">Inter-Dream ↗</a></li><li><a href="https://150years.audemarspiguet.com/en#/rooms/mechanical_secrets" target="_blank" rel="noopener noreferrer">Audemars Piguet ↗</a></li><li><a href="https://app.spline.design/community/file/8cf76a7f-428e-4bf7-af91-720754f07596" target="_blank" rel="noopener noreferrer">Parallax Interactive Scene ↗</a></li><li><a href="https://app.spline.design/community/file/3afbbf73-d552-4dcc-a0fb-73d369a63e71" target="_blank" rel="noopener noreferrer">Cursor Light Interaction ↗</a></li><li><a href="https://healthysleep.med.harvard.edu/healthy/matters/benefits/stages" target="_blank" rel="noopener noreferrer">Harvard Medical School Sleep Lab — Sleep Stages and Brain Activity ↗</a></li><li><a href="https://cornrevolution.resn.global/" target="_blank" rel="noopener noreferrer">Corn. Revolutionized. ↗</a></li></ul>'),
      panel(27,'Explore next.',somnusExploreNext())
    ];
  }


  const BS_MEDIA={"photo1":{"src":"assets/images/b26a0dbedb5fa35f.webp","width":1920,"height":1210},"photo2":{"src":"assets/images/e7d8964e9daa9bde.webp","width":1920,"height":1196},"photo3":{"src":"assets/images/89ad6fa88b2449f3.webp","width":1200,"height":1600},"photo4":{"src":"assets/images/f387ea60555168ed.webp","width":1200,"height":1600},"photo5":{"src":"assets/images/687454535b5def5e.webp","width":1200,"height":1600},"photo6":{"src":"assets/images/4a53d218648bd1c8.webp","width":1440,"height":1080}};
  const BS_CONDENSED_CHAPTERS=[['overview','Overview'],['interaction','How it works'],['development','My contribution'],['presets','Simplifying the interface'],['installation','Installation'],['outcome','Results & next steps'],['more','Explore next']];
  const BS_FULL_CHAPTERS=[['overview','Overview'],['concept','Concept & team'],['development','Development pipeline'],['tests','Early tests'],['presets','Interface refinement'],['materials','Physical fabrication'],['installation','Installation'],['outcome','Exhibit results'],['reflection','Constraints & next steps'],['more','Explore next']];
  function buildscapePanels(full){
    const chapters=full?BS_FULL_CHAPTERS:BS_CONDENSED_CHAPTERS;
    const icon=kind=>'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({blocks:'<path d="m16 3 11 6-11 6L5 9 16 3Zm-11 6v13l11 7 11-7V9M16 15v14M5 16l11 6 11-6"/>',camera:'<rect x="3" y="8" width="26" height="19" rx="2"/><path d="m10 8 2-4h8l2 4"/><circle cx="16" cy="17" r="6"/>',style:'<circle cx="9" cy="10" r="5"/><path d="m21 4 7 12H14z"/><rect x="4" y="21" width="11" height="8" rx="1"/><path d="m23 20 5 5-5 5-5-5z"/>',architecture:'<path d="M4 28V12l12-9 12 9v16H4Zm8 0V16h8v12M9 11h14M8 20h1m14 0h1"/>',castle:'<path d="M4 29V9h5v5h5V6h4v8h5V9h5v20H4Zm9 0V19h6v10M16 6V2h7l-2 3h-5"/>',organic:'<path d="M16 29c-9-3-13-9-10-15 2-4 7-4 8-8 1-4 8-4 11 1 6 10-4 21-9 22Z"/><path d="M16 29c-2-8 3-12 6-18"/>',house:'<path d="m3 15 13-11 13 11M7 13v15h18V13M13 28V18h6v10"/>',code:'<path d="m11 8-8 8 8 8m10-16 8 8-8 8M19 4l-6 24"/>',people:'<circle cx="11" cy="10" r="5"/><path d="M2 28v-5a9 9 0 0 1 18 0v5M22 5a5 5 0 0 1 0 10m3 4a8 8 0 0 1 5 8"/>',arrow:'<path d="M5 16h22M20 9l7 7-7 7"/>'})[kind]+'</svg>';
    const heading=(label,title,copy='')=>'<header class="bs-heading"><span class="sn-kicker">'+label+'</span><h2>'+title+'</h2>'+(copy?'<p>'+copy+'</p>':'')+'</header>';
    const panel=(i,body,extra='')=>'<section class="sn-panel se-panel bs-panel '+extra+'" id="bs-'+chapters[i][0]+'" style="--slide:'+i+'" aria-label="'+chapters[i][1]+'"><div class="sn-panel-body">'+body+'</div></section>';
    const image=(key,alt,caption='')=>{const a=BS_MEDIA[key];return '<figure class="bs-figure"><button type="button" class="se-expand" data-se-expand aria-label="View full size: '+escapeProjectText(alt)+'"><img src="'+a.src+'" width="'+a.width+'" height="'+a.height+'" alt="'+escapeProjectText(alt)+'" loading="lazy" decoding="async"></button>'+(caption?'<figcaption>'+caption+'</figcaption>':'')+'</figure>';};
    const video='<div class="bs-film"><video class="project-motion-video" data-motion-project="buildscape" data-manual="true" controls muted playsinline preload="none" poster="'+document.querySelector('[data-project="buildscape"] .bg img').src+'" src="'+projectMotionSource('buildscape')+'" aria-label="Buildscape installation demonstration"></video></div>';
    const flow='<ol class="bs-flow" aria-label="Buildscape interaction flow">'+[['blocks','Arrange','Stack physical objects.'],['camera','Capture','A live webcam frames the scene.'],['style','Choose','Select one of three styles.'],['architecture','Generate','AI reinterprets the composition.']].map(([kind,title,copy])=>'<li>'+icon(kind)+'<h3>'+title+'</h3><p>'+copy+'</p></li>').join('')+'</ol>';
    const tools='<ul class="bs-tools" aria-label="Project tools">'+['HTML / CSS / JavaScript','Sogni AI SDK','ChatGPT + Gemini','VS Code','Webcam','FigJam'].map(t=>'<li>'+t+'</li>').join('')+'</ul>';
    const intro='<div class="bs-intro"><div><span class="sn-kicker">Interactive installation · Development · AI</span><h1>Buildscape.</h1><p class="bs-handwritten">built to be explored.</p></div><p class="bs-lead">Stack everyday objects.<br>Turn them into AI-generated architecture.</p></div><dl class="bs-meta"><div><dt>My role</dt><dd>Developer · one of two</dd></div><div><dt>Timeline</dt><dd>3 days</dd></div><div><dt>Team</dt><dd>2 developers + 4 designers</dd></div><div><dt>Deliverable</dt><dd>Physical installation</dd></div></dl>'+video;
    const contribution='<div class="bs-split"><div>'+heading('My contribution','From webcam input<br>to generated image.','I focused on the image-to-image generation pipeline using the Sogni AI SDK. The other developer handled the external webcam and live capture.')+tools+'</div><div class="bs-responsibilities"><article>'+icon('code')+'<h3>My focus</h3><p>Image-generation pipeline, AI-assisted prototyping, integration and manual refinement.</p></article><article>'+icon('people')+'<h3>Shared delivery</h3><p>Two developers merged the camera and generation systems; four designers shaped the physical installation.</p></article></div></div>';
    const presets=heading('Interface decision','Preset styles simplify the interaction.','We replaced manual prompt entry and the similarity slider with three presets, each with a tuned strength.')+'<div class="bs-before-after"><div><span class="bs-mini">Early interface</span><p>Write a prompt + adjust image similarity</p></div><span class="bs-change-arrow" aria-hidden="true">'+icon('arrow')+'</span><div><span class="bs-mini">Final interface</span><p>Choose a style</p></div></div><div class="bs-presets">'+[['castle','Castle','Architectural forms.'],['organic','Organic Structure','Abstract, playful shapes.'],['house','House','House-like structures and household arrangements.']].map(([kind,title,copy])=>'<article>'+icon(kind)+'<h3>'+title+'</h3><p>'+copy+'</p></article>').join('')+'</div>';
    const metrics='<dl class="bs-metrics"><div><dt>Visitors</dt><dd>30+</dd></div><div><dt>Images generated</dt><dd>Hundreds</dd></div><div><dt>Exhibit</dt><dd>2 hours</dd></div></dl>';
    const limitations='<div class="bs-notes"><article><h3>Color stayed close to the input.</h3><p>Generations tended to inherit similar colors from the webcam image.</p></article><article><h3>Backgrounds stayed mostly black.</h3><p>The model struggled to generate environments behind the structures.</p></article><article><h3>Next: refine the presets.</h3><p>Explore themed prompts and environmental variations.</p></article></div>';
    const next=()=>'<section class="se-explore-next"><header><span class="sn-kicker">Keep exploring</span><h2>Explore related projects.</h2></header><div class="se-next-grid">'+[['somnus','An interactive descent through the science of sleep.'],['nyid','A mobile ID with age verification and a credential wallet.'],['logo-animations','Six brand identities explored through motion.']].map(([key,description])=>{const src=document.querySelector('[data-project="'+key+'"] .bg img').src;return '<button type="button" class="se-next-card" data-sn-project="'+key+'"><span class="se-next-image"><img src="'+src+'" alt="'+escapeProjectText(WORK_TITLES[key])+' project preview" loading="lazy" decoding="async"></span><span class="se-next-category">'+escapeProjectText(projectCategoryText(key))+'</span><span class="se-next-title">'+escapeProjectText(WORK_TITLES[key])+'<span aria-hidden="true">↗</span></span><span class="se-next-description">'+description+'</span><span class="se-next-action">View project</span></button>';}).join('')+'</div><button type="button" class="sn-action" data-sn-all-work>Back to all work ↗</button></section>';
    if(!full)return [
      panel(0,intro,'bs-overview'),
      panel(1,heading('The interaction','Physical play becomes the prompt.')+flow),
      panel(2,contribution+image('photo1','Early Buildscape interface showing webcam input beside an AI-generated castle','Early prototype / physical composition → generated architecture')),
      panel(3,presets),
      panel(4,heading('The installation','Objects, a camera<br>and a shared screen.','The design team built and painted geometric pieces. We added found objects to create more varied forms.')+image('photo6','Final Buildscape installation with physical objects, a ring light and generated images on the display','Final setup / physical arrangement and generated variations')),
      panel(5,heading('The exhibit','Built in three days.<br>Explored by 30+ visitors.')+metrics+limitations),
      panel(6,next(),'bs-next')
    ];
    return [
      panel(0,intro,'bs-overview'),
      panel(1,heading('Concept & team','Make physical play<br>an image-making tool.','Created during Creative Collisions, a three-day collaborative design challenge focused on AI.')+flow+'<div class="bs-context"><p>Visitors arrange physical objects, select an architectural style and generate imagery from a live webcam feed.</p><p>I was one of two developers on a six-person team, working alongside four designers.</p></div>'),
      panel(2,contribution+'<div class="bs-development-note"><h3>Rapid prototyping & manual integration.</h3><p>We used ChatGPT and Gemini to prototype with the Sogni AI SDK, then merged the camera and generation systems in Visual Studio Code and manually refined the implementation.</p></div>'),
      panel(3,heading('Early development','Testing the image-to-image pipeline.','We used readily available objects, manual prompts and adjustable image similarity strength to test how physical arrangements became architectural forms.')+'<div class="bs-pair">'+image('photo1','First early Buildscape test: webcam composition beside generated castle architecture','Early test / input and generated output')+image('photo2','Second early Buildscape test showing another generated architectural interpretation','Another architectural interpretation')+'</div>'),
      panel(4,presets+'<p class="bs-footnote">The presets paired a prepared prompt with a custom strength, keeping the interaction focused on choosing a direction rather than writing a prompt.</p>'),
      panel(5,heading('Physical development','Physical materials & fabrication.','The design team created graphics, built and painted blocks and 3D shapes. We expanded beyond those pieces to include found objects for more interesting generated forms.')+'<div class="bs-portraits">'+image('photo3','Preparing and painting the physical pieces for Buildscape','Preparing the physical pieces')+image('photo4','Geometric block arrangement being tested under a lamp','Testing forms and lighting')+'</div>'),
      panel(6,heading('Installation','Exhibit setup & final installation.')+'<div class="bs-installation"><div>'+image('photo5','Buildscape exhibit setup with backdrop, ring light, camera and display','Setting up the capture area and display')+'</div>'+image('photo6','Buildscape installation with mixed objects and AI-generated architectural variations on the display','Final installation / objects, live input and generated variations')+'</div>'),
      panel(7,heading('Exhibit results','Exhibit participation.')+metrics+'<p class="bs-result-copy">The two-hour exhibit drew 30+ visitors, who generated hundreds of images. Testing and feedback helped us assess how the installation was experienced and where it needed refinement.</p>'),
      panel(8,heading('Reflection','Limitations & further development.','The installation supports open-ended experimentation. Architectural ideation remains a potential application.')+limitations),
      panel(9,next(),'bs-next')
    ];
  }
  function buildBuildscape(){studyMode='condensed';studyFullPanels=[];renderStudy('buildscape');}

  const LOGO_MEDIA={"intel":{"src":"assets/videos/09124eba08b77c3a.mp4"},"intel-poster":{"src":"assets/images/462fdcbad9c079be.webp","width":1280,"height":720},"intel-mood":{"src":"assets/images/8373b94cdfb468d3.webp","width":1298,"height":1218},"intel-frame1":{"src":"assets/images/efc235c32f1f26e8.webp","width":1600,"height":893},"intel-frame2":{"src":"assets/images/5292e00449174cd8.webp","width":1600,"height":899},"intel-frame3":{"src":"assets/images/2293d9c2eca4a98d.webp","width":1600,"height":895},"intel-frame4":{"src":"assets/images/4f3a0378eb74b8fd.webp","width":1600,"height":893},"hot-wheels":{"src":"assets/videos/50fac51e996c4b2f.mp4"},"hot-wheels-poster":{"src":"assets/images/4fd9c8b6a4278f51.webp","width":1280,"height":720},"hot-wheels-mood":{"src":"assets/images/d544fbe6a375d816.webp","width":1298,"height":1218},"hot-wheels-frame1":{"src":"assets/images/86eedac4a7d08355.webp","width":1600,"height":897},"hot-wheels-frame2":{"src":"assets/images/aa18568f0936f217.webp","width":1600,"height":897},"hot-wheels-frame3":{"src":"assets/images/ed36be20e0e3fd7e.webp","width":1600,"height":897},"hot-wheels-frame4":{"src":"assets/images/95eb16c38831b02b.webp","width":1600,"height":897},"rolex":{"src":"assets/videos/82229fd1e7bd8a9f.mp4"},"rolex-poster":{"src":"assets/images/a978fb746c0e111b.webp","width":1280,"height":720},"rolex-mood":{"src":"assets/images/1add7b78d56d8246.webp","width":1298,"height":1218},"rolex-frame1":{"src":"assets/images/737074ab8c372a2f.webp","width":1600,"height":891},"rolex-frame2":{"src":"assets/images/d7e42132b0d9e43f.webp","width":1600,"height":890},"rolex-frame3":{"src":"assets/images/48921afff73dd916.webp","width":1600,"height":887},"rolex-frame4":{"src":"assets/images/4b3b184a4783ea34.webp","width":1600,"height":890},"google":{"src":"assets/videos/095f2439d979b39b.mp4"},"google-poster":{"src":"assets/images/660e826cf8f1a292.webp","width":1280,"height":720},"google-mood":{"src":"assets/images/edee66fb64d42bfe.webp","width":1298,"height":1218},"google-frame1":{"src":"assets/images/776e4ca4a0beeb5a.webp","width":1600,"height":895},"google-frame2":{"src":"assets/images/be92004037671444.webp","width":1600,"height":892},"google-frame3":{"src":"assets/images/aa2e4712b975a6c6.webp","width":1600,"height":899},"google-frame4":{"src":"assets/images/0060070eddf57f7c.webp","width":1600,"height":895},"pepsi":{"src":"assets/videos/83b39a0f948b2eec.mp4"},"pepsi-poster":{"src":"assets/images/dd925be71f5ae8f5.webp","width":1280,"height":720},"pepsi-mood":{"src":"assets/images/207cd3c5e2fd4e92.webp","width":1298,"height":1218},"pepsi-frame1":{"src":"assets/images/5acdeff05e61fa65.webp","width":1600,"height":894},"pepsi-frame2":{"src":"assets/images/f16d5ba51a90a577.webp","width":1600,"height":892},"pepsi-frame3":{"src":"assets/images/607edb6544a5c67b.webp","width":1600,"height":893},"pepsi-frame4":{"src":"assets/images/075b6aa75220e196.webp","width":1600,"height":890},"slack":{"src":"assets/videos/c229f63762f68841.mp4"},"slack-poster":{"src":"assets/images/0a7e7a2d4d8ccef1.webp","width":1280,"height":720},"slack-mood":{"src":"assets/images/d458c858bc3e0300.webp","width":1298,"height":1218},"slack-frame1":{"src":"assets/images/d2d9d0d0ce2e6773.webp","width":1600,"height":893},"slack-frame2":{"src":"assets/images/8eac0cc8282a44f3.webp","width":1600,"height":889},"slack-frame3":{"src":"assets/images/62f4dacf43217212.webp","width":1600,"height":893},"slack-frame4":{"src":"assets/images/01012456b27c3203.webp","width":1600,"height":894},"slack-early1":{"src":"assets/images/f7d6871d40060fcb.webp","width":1600,"height":900},"slack-early2":{"src":"assets/images/9d052d24da9a30a8.webp","width":1600,"height":900},"slack-early3":{"src":"assets/images/f239afa7527feb47.webp","width":1600,"height":900},"slack-early4":{"src":"assets/images/f61c8ff52a21b6cd.webp","width":1600,"height":900},"google-early1":{"src":"assets/images/34bbed066048f5ae.webp","width":1600,"height":900},"google-early2":{"src":"assets/images/7ae56b561915d15e.webp","width":1600,"height":900},"google-early3":{"src":"assets/images/2b4b9a983a8856c1.webp","width":1600,"height":900},"google-early4":{"src":"assets/images/9e218edcdcd4a827.webp","width":1600,"height":900},"cover":{"src":"assets/images/f6771da86588e55d.webp","width":1600,"height":1067},"intel-deckframes":{"src":"assets/images/74ad3728bd628669.webp","width":1920,"height":1101},"rolex-deckframes":{"src":"assets/images/f61512ad3cffe99c.webp","width":1920,"height":1101},"google-deckframes":{"src":"assets/images/9f722b214b4eed06.webp","width":1920,"height":1101},"pepsi-deckframes":{"src":"assets/images/cbfc9af5c9bb2aa6.webp","width":1920,"height":1101},"slack-deckframes":{"src":"assets/images/17334edf6e68b51a.webp","width":1920,"height":1101},"intel-identity":{"src":"assets/images/5450e3bbfaec8a2c.webp","width":958,"height":481},"rolex-identity":{"src":"assets/images/39ecbd657082947a.webp","width":1084,"height":662},"google-identity":{"src":"assets/images/a09a1ace22d0af36.webp","width":788,"height":765},"pepsi-identity":{"src":"assets/images/5daf1c67b058faa1.webp","width":758,"height":723},"slack-identity":{"src":"assets/images/7b55de2de9f3e24e.webp","width":1350,"height":470}};
  const LOGO_PDF_BRIEFS={"intel":{"copy":"Intel is a major American multinational technology company, primarily known for designing and manufacturing semiconductor chips. In the logo reveal, I wanted to reference what they are known for while representing Intel’s plan for advancing beyond just PC processors into areas like data centers and artificial intelligence.","date":"2020-NOW","keywords":["Innovative","Ingenious","Intelligent","Powerful","Purposeful","Reliable","Balanced","Simple"]},"rolex":{"copy":"Rolex is a Swiss luxury watch manufacturer based in Geneva, known for producing high-quality, precise, and durable timepieces. In the logo reveal, I want to emphasize the luxury and timeless elegance.","date":"2022-NOW","keywords":["Luxury","High-quality","Timeless","Precise","Prestige","Exclusive","Reliable"]},"google":{"copy":"Google is an American technology company famous for its widely used search engine and a vast array of internet services. Google's new logo aims to stay modern, flexible, and relevant which I intend to reflect in the animation.","date":"2025-NOW","keywords":["Modern","Flexible","Innovative","Simple","Creative","Playful","Reliable","User-friendly"]},"pepsi":{"copy":"Pepsi is a carbonated soft drink, manufactured by PepsiCo which serves as its flagship product. The new logo aimed to create a modern, energetic, and confident brand identity. In my logo reveal, I aim to create a simple, bold animation that references the soft drink.","date":"2023-NOW","keywords":["Bold","Dynamic","Refreshment","Youthful","Energetic","Excitement","Progressive","Enjoyment"]},"slack":{"copy":"Slack is a cloud-based messaging and productivity platform designed for workplace collaboration. For the logo reveal, I wanted to focus on communication and collaboration.","date":"2019-NOW","keywords":["Conversational","Human","Playful","Innovative","Friendly","Versatile","Simplicity"]},"hot-wheels":{"copy":"Hot Wheels is a toy brand centered on speed, exaggeration, and high-energy play, known for its flame iconography and association with motion, performance, and imagination. This animation interprets Hot Wheels’ core identity through physical, energetic motion.","date":"","keywords":["Speed","Exaggeration","Energy","Play"]}};
  const LOGO_CHAPTERS=[['overview','Overview'],['intel','Intel'],['hot-wheels','Hot Wheels'],['rolex','Rolex'],['google','Google'],['pepsi','Pepsi'],['slack','Slack'],['more','Explore next']];
  const LOGO_STUDIES=[
    {key:'intel',name:'Intel',idea:'From circuitry to identity.',copy:'A journey across a glowing chip connects Intel’s wordmark to the hardware behind it.',motion:'Circuit paths → processor → wordmark'},
    {key:'hot-wheels',name:'Hot Wheels',idea:'Speed takes shape.',copy:'A sweep of fire reveals the flame-shaped mark, translating the brand’s energy into a fast, physical reveal.',motion:'Flame sweep → burning silhouette → logo'},
    {key:'rolex',name:'Rolex',idea:'Precision, revealed in light.',copy:'Measured movement and gold highlights give the crown and lettering a restrained, luxurious reveal.',motion:'Lettering → crown → light sweep'},
    {key:'google',name:'Google',idea:'Color comes into focus.',copy:'Soft light and flowing color resolve into the familiar G, keeping the reveal light and adaptable.',motion:'Light → color → recognizable form'},
    {key:'pepsi',name:'Pepsi',idea:'A logo with a little fizz.',copy:'A rising wave fills the circular mark before a blue finish brings the soft-drink reference forward.',motion:'Liquid rise → wordmark → blue finish'},
    {key:'slack',name:'Slack',idea:'Separate parts. Shared identity.',copy:'A message bubble becomes a set of colored shapes that gather into Slack’s mark—communication becoming collaboration.',motion:'Message → moving shapes → shared mark'}
  ];
  function logoPanels(full){
    const heading=(label,title,copy='')=>'<header class="la-heading"><span class="sn-kicker">'+label+'</span><h2>'+title+'</h2>'+(copy?'<p>'+copy+'</p>':'')+'</header>';
    const panel=(i,body,extra='')=>'<section class="sn-panel se-panel la-panel '+extra+'" id="la-'+LOGO_CHAPTERS[i][0]+'" style="--slide:'+i+'" aria-label="'+LOGO_CHAPTERS[i][1]+'"><div class="sn-panel-body">'+body+'</div></section>';
    const image=(key,alt,caption='')=>{const a=LOGO_MEDIA[key];return '<figure class="la-figure"><button type="button" class="se-expand" data-se-expand aria-label="View full size: '+escapeProjectText(alt)+'"><img src="'+a.src+'" width="'+a.width+'" height="'+a.height+'" alt="'+escapeProjectText(alt)+'" loading="lazy" decoding="async"></button>'+(caption?'<figcaption>'+caption+'</figcaption>':'')+'</figure>';};
    const film=item=>'<figure class="la-film"><video data-se-video data-study-video="logo-'+item.key+'" controls playsinline preload="none" poster="'+LOGO_MEDIA[item.key+'-poster'].src+'" aria-label="'+item.name+' final logo animation"></video><figcaption><span>Final animation</span><span>'+(full?item.name:item.motion)+'</span></figcaption></figure>';
    const frames=(item,early=false)=>'<div class="la-frames '+(early?'la-early':'')+'">'+[1,2,3,4].map((n)=>image(item.key+(early?'-early':'-frame')+n,item.name+(early?' earlier style frame ':' style frame ')+n,String(n).padStart(2,'0'))).join('')+'</div>';
    const intro='<div class="la-intro"><div><span class="sn-kicker">Motion · Brand studies</span><h1>Logo<br>Animations.</h1><p class="la-handwritten">identities in motion.</p></div><p class="la-lead">Six identities.<br>Six ways to move.</p></div><p class="la-brief">A collection of short logo reveals translating each brand’s character into movement.</p><dl class="la-meta"><div><dt>My role</dt><dd>Motion designer · Solo</dd></div><div><dt>Timeline</dt><dd>2 weeks</dd></div><div><dt>Tools</dt><dd>After Effects · Illustrator</dd></div><div><dt>Deliverables</dt><dd>6 short animations</dd></div></dl><p class="la-scope">Independent motion studies of existing brand identities.</p>';
    const fullIntro=intro.replace('Six identities.<br>Six ways to move.','Six logo reveals.<br>Reference → frames → animation.').replace('A collection of short logo reveals translating each brand’s character into movement.','I developed the visual references, style frames and final animation for each reveal.');
    const panels=[panel(0,full?'<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" style="position:absolute;pointer-events:none"><defs><filter id="la-white-cutout" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -.333333 -.333333 -.333333 0 1"/><feComponentTransfer><feFuncA type="linear" slope="3" intercept="0"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter></defs></svg>'+fullIntro:intro,'la-overview')];
    LOGO_STUDIES.forEach((item,index)=>{
      const head='<div class="la-brand-heading"><div><span class="sn-kicker">'+item.name+' / Motion direction</span><h2>'+item.idea+'</h2></div><p>'+item.copy+'</p></div>';
      let body=head;
      if(full){
        const brief=LOGO_PDF_BRIEFS[item.key],identity=LOGO_MEDIA[item.key+'-identity']?item.key+'-identity':item.key+'-frame4';
        body='<h2 class="la-pdf-brand-title">'+item.name+'</h2><section class="la-subsection" aria-labelledby="la-'+item.key+'-brand-heading"><h3 class="la-subsection-title" id="la-'+item.key+'-brand-heading">Logo &amp; Brand</h3><div class="la-pdf-intro"><div class="la-pdf-identity '+(item.key==='hot-wheels'?'la-identity-dark':'')+'">'+image(identity,item.name+' original logo reference')+(brief.date?'<p class="la-pdf-date">'+brief.date+'</p>':'')+'</div><p class="la-pdf-description">'+escapeProjectText(brief.copy)+'</p></div></section>';
        body+='<section class="la-subsection" aria-labelledby="la-'+item.key+'-references-heading"><h3 class="la-subsection-title" id="la-'+item.key+'-references-heading">Moodboard &amp; Keywords</h3><div class="la-direction la-integrated-direction"><div>'+image(item.key+'-mood',item.name+' moodboard','Moodboard')+'</div><div class="la-keyword-block"><h4>Keywords</h4><ul class="la-keywords">'+brief.keywords.map(word=>'<li>'+word+'</li>').join('')+'</ul></div></div></section>';
        body+='<h3 class="la-section-title">Style frames</h3>'+frames(item);
        if(item.key==='google'||item.key==='slack')body+='<details class="la-earlier"><summary>Additional style frames <span aria-hidden="true">+</span></summary><div>'+frames(item,true)+'</div></details>';
        body+='<h3 class="la-section-title">Final animation</h3>'+film(item);
      }else{
        body+=film(item)+'<div class="la-sequence-label"><h3>Key frames</h3><span>'+item.motion+'</span></div>'+frames(item);
      }
      panels.push(panel(index+1,body,'la-brand la-'+item.key));
    });
    const next='<div class="se-explore-next">'+heading('Keep exploring',full?'More projects.':'More ways to interact.')+'<div class="se-next-grid">'+[['somnus','An interactive journey through the stages of sleep.'],['nyid','A mobile identity and credential wallet.'],['buildscape','Physical play translated into AI-generated architecture.']].map(([key,description])=>'<button type="button" class="se-next-card" data-sn-project="'+key+'"><span class="se-next-image"><img src="'+document.querySelector('[data-project="'+key+'"] .bg img').src+'" alt="'+escapeProjectText(WORK_TITLES[key])+' preview" loading="lazy"></span><span class="se-next-category">'+escapeProjectText(projectCategoryText(key))+'</span><span class="se-next-title">'+escapeProjectText(WORK_TITLES[key])+'<span aria-hidden="true">↗</span></span><span class="se-next-description">'+description+'</span><span class="se-next-action">View project</span></button>').join('')+'</div><button type="button" class="sn-action" data-sn-all-work>Back to all work ↗</button></div>';
    panels.push(panel(7,next,'la-next'));return panels;
  }
  function buildLogoAnimations(){studyMode='full';studyFullPanels=[];renderStudy('logo-animations');}


  const PK_MEDIA={"landing":{"src":"assets/images/8342925feda36c2a.webp","width":1152,"height":2048},"paths":{"src":"assets/images/ae668c1b7688f85e.webp","width":1152,"height":2048},"quiz":{"src":"assets/images/43584867373a718b.webp","width":1152,"height":2048},"recommendations":{"src":"assets/images/1dafa48cc67de81e.webp","width":1152,"height":2026},"product":{"src":"assets/images/6814110d1ddf2b40.webp","width":1152,"height":2048},"catalog":{"src":"assets/images/d8d9fc659c290fb9.webp","width":1152,"height":2048},"cart":{"src":"assets/images/6523258ffbfedfde.webp","width":1152,"height":2048},"associate":{"src":"assets/images/7c94fb3de86251d8.webp","width":1152,"height":2048},"waiting":{"src":"assets/images/36b3a9ea9673146d.webp","width":1152,"height":2048},"hardware":{"src":"assets/images/7519229f95653f90.webp","width":1486,"height":1044},"flow-overview":{"src":"assets/images/3afbaf988896e16d.webp","width":2200,"height":1017},"flow-quiz":{"src":"assets/images/7f62e78783bc7e1c.webp","width":2200,"height":830},"mockup":{"src":"assets/images/9b27c6098f1c04d4.webp","width":1600,"height":732},"reach":{"src":"assets/images/8329d81f2e639be4.webp","width":708,"height":1062},"grid":{"src":"assets/images/ae57c1de33ff9ee0.webp","width":960,"height":1080},"icons":{"src":"assets/images/6f0ccdfc1c46caa2.webp","width":1296,"height":1008},"wire-path":{"src":"assets/images/7649c74c953877f8.webp","width":900,"height":1600},"wire-quiz":{"src":"assets/images/8d2b2ffc6df09114.webp","width":900,"height":1600},"wire-rec":{"src":"assets/images/9b765e382c250e6a.webp","width":900,"height":1600},"wire-catalog":{"src":"assets/images/00c1120dac9b2590.webp","width":900,"height":1600},"wire-product":{"src":"assets/images/a5950968979cfac4.webp","width":900,"height":1600},"wire-cart":{"src":"assets/images/ff2d646a298a1694.webp","width":900,"height":1600},"wire-associate":{"src":"assets/images/ff2d646a298a1694.webp","width":900,"height":1600},"wire-wait":{"src":"assets/images/ff2d646a298a1694.webp","width":900,"height":1600},"clip":{"src":"assets/videos/d08338b2ba7809d3.mp4"}};
  const PK_CONDENSED_CHAPTERS=[['overview','Overview'],['problem','Problem & opportunity'],['journey','Two ways to discover'],['discover','Guided discovery'],['compare','Browse & compare'],['handoff','Try on or save'],['style','Visual system'],['walkthrough','Prototype walkthrough'],['scope','Scope & next steps'],['more','Explore next']];
  const PK_FULL_CHAPTERS=[['overview','Overview'],['problem','Problem & opportunity'],['brand','Brand & business case'],['audience','Audience & sessions'],['device','Hardware & retail setting'],['journey','Workflows'],['catalog','Catalog structure'],['personalization','Personalization & content'],['wireframes','Wireframes'],['discover','Guided discovery'],['compare','Browse & compare'],['handoff','Try on or save'],['style','Visual system'],['product-system','Product presentation'],['reach','Reach & layout'],['recovery','Errors & session recovery'],['operations','Store operations'],['walkthrough','Prototype walkthrough'],['scope','Scope & next steps'],['more','Explore next']];
  function pumaPanels(full){
    const chapters=full?PK_FULL_CHAPTERS:PK_CONDENSED_CHAPTERS;
    const heading=(label,title,copy='')=>'<header class="pk-heading"><span class="sn-kicker">'+label+'</span><h2>'+title+'</h2>'+(copy?'<p>'+copy+'</p>':'')+'</header>';
    const image=(key,caption)=>{const m=PK_MEDIA[key];return '<figure class="pk-figure"><button type="button" class="se-expand" data-se-expand aria-label="Enlarge '+escapeProjectText(caption)+'"><img src="'+m.src+'" width="'+m.width+'" height="'+m.height+'" alt="'+escapeProjectText(caption)+'" loading="lazy" decoding="async"></button><figcaption>'+caption+'</figcaption></figure>';};
    const screens=(items)=>'<div class="pk-screens">'+items.map(([key,title,copy])=>'<div>'+image(key,title)+(copy?'<p>'+copy+'</p>':'')+'</div>').join('')+'</div>';
    const notes=items=>'<div class="pk-notes">'+items.map(([title,copy])=>'<article><h3>'+title+'</h3><p>'+copy+'</p></article>').join('')+'</div>';
    const table=(heads,rows)=>'<div class="pk-table-wrap"><table class="pk-table"><thead><tr>'+heads.map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((x,i)=>i?'<td>'+x+'</td>':'<th scope="row">'+x+'</th>').join('')+'</tr>').join('')+'</tbody></table></div>';
    const credit='<p class="pk-credit">Interface design &amp; experience concept: Sharon Wang Liu. Product imagery, brand assets and source video: PUMA website. Associate portrait photography: Pexels.</p>';
    const flow='<div class="pk-flow" role="img" aria-label="Welcome branches to a quiz and recommendations, or catalog browsing. Both lead to product details, a saved selection, and either associate assistance or mobile handoff."><div class="pk-flow-node">Welcome</div><span class="pk-flow-line" aria-hidden="true"></span><div class="pk-flow-branches"><div><span>Guided</span><strong>Quiz → Recommendations</strong></div><div><span>Self-directed</span><strong>Browse catalog</strong></div></div><span class="pk-flow-line" aria-hidden="true"></span><div class="pk-flow-node">Product details → Saved selection</div><span class="pk-flow-line" aria-hidden="true"></span><div class="pk-flow-branches"><div><span>Try on now</span><strong>Select associate → Wait at kiosk</strong></div><div><span>Save for later</span><strong>SMS · Email · PUMA app</strong></div></div></div>';
    const body={
      overview:'<div class="pk-intro"><div><span class="sn-kicker">UI/UX · Retail kiosk concept</span><h1>PUMA<br>Kiosk.</h1><p class="pk-handwritten">find your perfect pair.</p><p class="pk-lead">A guided footwear discovery experience for the NYC PUMA flagship.</p><dl class="pk-meta"><div><dt>My focus</dt><dd>Experience strategy, flows &amp; interface design</dd></div><div><dt>Timeline</dt><dd>15-week design process</dd></div><div><dt>Format</dt><dd>43-inch portrait touchscreen</dd></div><div><dt>Status</dt><dd>Design concept &amp; prototype</dd></div></dl><p>Take a short quiz or browse the catalog, compare shoes, then connect with an associate for try-on or save a selection to mobile.</p></div>'+image('landing','Landing screen / branded entry point')+'</div>'+credit,
      problem:heading('Problem & opportunity','More choice.<br>Less certainty.','A large footwear assortment makes it difficult to choose a starting point and understand which shoes fit a specific activity.')+notes([['The shopper need','Narrow the options before asking for a fitting.'],['The opportunity','Translate activity and style preferences into a useful shortlist.'],['The business goal','Support confident try-ons and let staff focus on fit, service and checkout.']])+'<p class="pk-caption">These are design goals from the brief; conversion and operational impact have not been measured.</p>',
      brand:heading('Brand & business case','A discovery tool,<br>inside the store.','PUMA connects sport, culture and self-expression. The kiosk brings that positioning into footwear discovery through product imagery, technology stories and personalized guidance.')+table(['Goal','Design response'],[['Reduce discovery friction','Quiz entry plus direct browsing; neither requires login.'],['Build product confidence','Purpose, technology and availability alongside each product.'],['Support store staff','A shortlist and associate handoff before assisted checkout.'],['Extend the visit','Save selections to mobile for continued browsing.'],['Inform future retail tools','Proposed product-interest and interaction insights.']]),
      audience:heading('Audience & sessions','Built for an exploratory visit.')+notes([['Primary','Gen Z and Millennial shoppers comparing lifestyle and performance footwear.'],['Secondary','Tourists, brand fans, groups and visitors unfamiliar with PUMA technology.'],['Edge cases','Time-limited visitors, experienced sneaker shoppers and people with mobility, reach or vision needs.']])+table(['Activity','Planned session length'],[['Quiz','1–2 minutes'],['Browsing & decision-making','2–5 minutes'],['Try-on or mobile handoff','1–2 minutes']]),
      device:heading('Hardware & retail setting','A large screen.<br>A clear starting point.','Proposed placement: the entry to the flagship footwear zone, parallel to displays so the kiosk does not obstruct circulation.')+'<div class="pk-split">'+image('hardware','Proposed kiosk hardware / dimensions from the process deck')+'<div>'+notes([['43-inch portrait display','Commercial ReHisk touchscreen; Android-based internal compute.'],['Touch first','Simple touch interactions, with QR/NFC mobile transfer proposed. Optional audio is off by default.'],['Discovery, not payment','No kiosk payments or printing. Checkout remains with staff or the mobile app.']])+'</div></div>'+image('mockup','Retail context exploration / proposed kiosk placement'),
      journey:heading('Interaction architecture','Two entry paths.<br>One useful shortlist.','Guidance is optional. Shoppers can take the quiz or go directly to the full catalog, then choose between try-on assistance and saving for later.')+flow+(full?'<div class="pk-flow-docs">'+image('flow-overview','Original workflow / navigation and handoff')+image('flow-quiz','Original workflow / guided quiz')+'</div>':''),
      catalog:heading('Information architecture','Keep categories shallow.<br>Let filters do the work.','Women, Men and Kids form the top level. Products can appear in several subcategories; size, color, price and availability refine the selection.')+table(['Category','Planning inventory','Example subcategories'],[['Women','740','Lifestyle · Running · Training & Gym · Basketball · Motorsport'],['Men','757','Lifestyle · Running · Soccer Cleats · Motorsport · Boots & Mids'],['Kids','363','Babies & Toddlers · Little Kids · Big Kids · Easy On & Off']])+'<p class="pk-caption">The deck uses a planning catalog of approximately 1,860 products, with seasonal variation of ±10%. Counts are project inputs, not a live inventory feed.</p>'+notes([['Persistent within a category','Changing subcategories preserves filters; changing the top-level category resets them.'],['Availability stays visible','Show in-store and online-only status. Unavailable size/color combinations cannot be selected.'],['Pricing remains explicit','Show the original and sale price together. Apply promotions at external checkout.']]),
      personalization:heading('Personalization & content','Useful without an account.')+notes([['Session-based guidance','Quiz answers inform recommendations without requiring login. Optional loyalty personalization is a proposed extension.'],['A compact product card','Image, name, price, colors, category and try-on availability. Names are limited to two lines.'],['Details when needed','Product purpose, benefits, materials, technologies, size/color choices and availability.']])+table(['Content','Planning limit'],[['Product name','About 60 characters / two lines in grids'],['Short description','40–90 characters'],['Full description','120–300 characters'],['Key benefits','1–3 short bullets']]),
      wireframes:heading('Wireframes','The shopping journey,<br>before visual refinement.','A consistent product area carries shoppers from recommendations to selection. Cart, back and help controls remain available without restarting.')+'<div class="pk-wireframes">'+[['wire-path','Choose a path'],['wire-quiz','Quiz'],['wire-rec','Recommendations'],['wire-catalog','Catalog'],['wire-product','Product details'],['wire-cart','Saved selection'],['wire-associate','Associate handoff'],['wire-wait','Waiting state']].map(([key,title])=>image(key,title)).join('')+'</div>',
      discover:heading('Guided discovery','Start with what<br>the shopper needs.')+screens([['paths','Choose a path','A quick quiz for guidance, or immediate access to the catalog.'],['quiz','Activity & use','Short prompts, recognizable icons and visible progress.'],['recommendations','Curated recommendations','A primary recommendation explains the match; alternatives stay within reach.']]),
      compare:heading('Browse & compare','Find it. Inspect it.<br>Make it yours.')+screens([['catalog','Catalog','Refine by category, size, color and availability. Search and sort support a specific goal.'],['product','Product details','Review angles and product information, then choose color and size.'],['cart','Saved selection','Edit or remove items before choosing try-on assistance or saving for later.']])+'<p class="pk-caption">The interface uses a cart icon, but the list saves selections rather than completing a purchase.</p>',
      handoff:heading('Digital to physical','The next step<br>is a person—or a phone.')+screens([['associate','Choose an associate','Profiles surface languages, specialties and customer focus. Special accommodations remain available.'],['waiting','Confirm the handoff','A clear waiting state tells the shopper to remain by the kiosk.']])+notes([['Try on in-store','Share the selected styles with an associate for fitting and checkout.'],['Continue later','Proposed SMS, email, app and QR/NFC transfer keep the shortlist available after the session.']])+'<p class="pk-credit">Associate portraits are stock photography from Pexels; profiles are interface examples.</p>',
      style:heading('Visual system','PUMA’s contrast.<br>Color from the product.','Black and white establish the interface; restrained gradients draw from footwear colors. Sharp primary controls contrast with simple outline icons.')+'<div class="pk-style"><div class="pk-type"><span class="pk-small">Display / DIN Condensed Bold</span><strong>FOREVER.<br>FASTER.</strong><span class="pk-small">Body / Helvetica</span><p>Clear product information.<br>Direct actions. Familiar navigation.</p></div><div><div class="pk-swatches"><div style="--swatch:#242424">#242424</div><div style="--swatch:#fdfdfd">#FDFDFD</div><div class="pk-gradient">Product-led gradient</div></div>'+image('icons','Illustrative icons / primary and secondary controls')+'</div></div>',
      'product-system':heading('Product presentation','Make the shoe<br>the focal point.')+'<div class="pk-split">'+image('product','Product panel / imagery, size and color')+'<div>'+notes([['Four views','The planned recommendation and detail panels rotate among four product angles.'],['Color follows the shoe','The featured product sits over the PUMA mark and a matching gradient.'],['Quiet supporting tiles','Catalog and secondary recommendations use simpler backgrounds to keep the assortment scannable.'],['Information on demand','Benefits, materials and technical details expand without crowding the primary decision.']])+'</div></div>',
      reach:heading('Scale & reach','Design for the body,<br>not just the screen.','The top 520 px is reserved for branding and non-interactive content. Primary actions remain lower on the portrait display.')+'<div class="pk-split">'+image('reach','Planned interaction zone / non-interactive top area')+image('grid','Layout system / 16-column grid')+'</div>'+notes([['Reach considerations','Standing and seated use, approach clearance and generous touch targets. Physical reach requires validation.'],['Grid','16 stretched columns, 48 px gutters and a 4 px measurement system; custom content margins.'],['Global controls','Persistent help and language controls. English by default, with language changes that preserve the session.']]),
      recovery:heading('Recovery & privacy','Correct a choice.<br>Keep the context.')+table(['Situation','Planned response'],[['Wrong selection','Back navigation, editable quiz answers and removable saved items.'],['Unavailable size or color','Disable the option and explain availability beside the action.'],['Failed mobile transfer','Offer an immediate retry or QR alternative.'],['45 seconds inactive','Ask whether the shopper is still exploring.'],['60 seconds inactive','Clear local quiz answers, filters and saved selections; return to the welcome screen.']])+'<p class="pk-caption">Transferred mobile selections remain available after the kiosk session clears. These are specified behaviors, not a deployed integration.</p>',
      operations:heading('Store operations','Support staff.<br>Keep the kiosk focused.')+notes([['Staff','Move initial product discovery to the kiosk so associates can focus on fit, service and assisted checkout.'],['Merchandising','Allow seasonal and featured products without overriding the shopper’s preferences.'],['Systems','Proposed inventory, loyalty and mobile handoff connections require implementation and validation.'],['Future rollout','Use a flagship pilot to learn which discovery features are useful before adapting the experience to other stores.']]),
      walkthrough:heading('Prototype walkthrough','From discovery<br>to the next step.')+'<figure class="pk-demo"><video data-se-video data-study-video="pumaclip" controls playsinline muted preload="none" poster="'+PK_MEDIA.landing.src+'" aria-label="PUMA kiosk interface walkthrough"></video><figcaption>Interface walkthrough / source footage and product imagery from the PUMA website.</figcaption></figure>'+credit,
      scope:heading('Scope & next steps','A designed experience.<br>Ready for validation.')+notes([['Delivered','Interaction flows, hardware/context explorations, wireframes, a visual system, final screens and an animated walkthrough.'],['Validate next','Physical reach and legibility at full scale; quiz clarity; product comparison; recovery and associate handoff.'],['Proposed integrations','Live inventory, recommendations, mobile transfer and associate routing remain design specifications.']])+'<p class="pk-caption">Evaluate task completion, recommendation clarity and the transition from saved selections to try-on assistance.</p>'+credit,
      more:somnusExploreNext()
    };
    return chapters.map(([id,label],i)=>'<section class="sn-panel se-panel pk-panel" id="pk-'+id+'" style="--slide:'+i+'" aria-label="'+label+'"><div class="sn-panel-body">'+body[id]+'</div></section>');
  }
  function buildPuma(){studyMode='condensed';studyFullPanels=[];renderStudy('puma-kiosk');}

  let studyModeTipSeen=false;
  try{studyModeTipSeen=localStorage.getItem('sharon-study-reading-spotlight-v3')==='seen';}catch(e){}
  function showStudyModeTip(){
    if(studyModeTipSeen||!snStory)return;
    const toggle=snStory.querySelector('.study-mode-switch');if(!toggle)return;
    studyModeTipSeen=true;
    try{localStorage.setItem('sharon-study-reading-spotlight-v3','seen');}catch(e){}
    const layer=document.createElement('aside');layer.className='study-spotlight-layer';layer.setAttribute('role','note');layer.setAttribute('aria-label','Choose condensed for highlights or full study for the full process. Click anywhere to continue.');
    layer.innerHTML='<div class="study-spotlight-ring" aria-hidden="true"></div><div class="study-spotlight-labels" aria-hidden="true"><span>Condensed</span><span>Full study</span></div>';
    const ring=layer.querySelector('.study-spotlight-ring'),labels=layer.querySelector('.study-spotlight-labels');
    const place=()=>{const rect=toggle.getBoundingClientRect();Object.assign(ring.style,{left:(rect.left-8)+'px',top:(rect.top-8)+'px',width:(rect.width+16)+'px',height:(rect.height+16)+'px'});Object.assign(labels.style,{left:(rect.left+rect.width/2)+'px',top:(rect.bottom+20)+'px'});};
    snStory.append(layer);place();
    let timer;
    const dismiss=()=>{clearTimeout(timer);layer.remove();document.removeEventListener('pointerdown',dismiss,true);document.removeEventListener('keydown',dismiss,true);window.removeEventListener('resize',place);};
    document.addEventListener('pointerdown',dismiss,{capture:true,once:true});
    document.addEventListener('keydown',dismiss,{capture:true,once:true});
    window.addEventListener('resize',place);
    timer=setTimeout(dismiss,6000);
  }

  let studyMode='condensed',studyFullPanels=[];
  const STUDY_SUMMARY_TARGETS={'puma-kiosk':[0,1,5,9,10,11,12,17,18,19],somnus:[0,1,2,4,7,9,15,17,18,20,21,24],nyid:[0,1,2,5,7,10,11,13,14,16,19],buildscape:[0,1,2,4,6,7,9],'logo-animations':[0,1,2,3,4,5,6,7]};
  function studyGroupFor(key,index){
    if(key==='puma-kiosk')return [0,1,1,1,1,2,2,2,2,3,4,5,6,6,6,6,6,7,8,9][index]||0;
    if(key==='logo-animations')return index;
    if(key==='buildscape')return [0,1,2,2,3,4,4,5,5,6][index]||0;
    if(key==='nyid')return [0,1,2,2,2,3,3,4,4,4,5,6,7,7,8,8,9,9,9,10][index]||0;
    if(key==='somnus')return [0,1,2,2,3,3,4,4,4,5,6,6,6,6,6,6,6,7,8,8,9,10,10,10,11,11,11,11][index]||0;
    const groups=key==='nyid'?[[0],[1,2],[3,4,5,6,7,8,9],[10,11,12],[13]]:[[0],[1,2],[3,4,5,6],[7,8,9,10],[11]];
    return Math.max(0,groups.findIndex(group=>group.includes(index)));
  }
  function renderStudy(key,target=0,focusSwitch=false){
    if(snStory)snStory.querySelectorAll('video').forEach(video=>video.pause());
    if(snStory)snStory.remove();
    if(snObserver)snObserver.disconnect();
    const full=key==='logo-animations'||studyMode==='full',chapters=key==='puma-kiosk'?(full?PK_FULL_CHAPTERS:PK_CONDENSED_CHAPTERS):key==='logo-animations'?LOGO_CHAPTERS:key==='buildscape'?(full?BS_FULL_CHAPTERS:BS_CONDENSED_CHAPTERS):full?(key==='nyid'?NY_CHAPTERS:SN_COMPLETE_CHAPTERS):(key==='somnus'?SN_EDIT_CHAPTERS:NY_CONDENSED_CHAPTERS);
    if(full&&!studyFullPanels.length)studyFullPanels=key==='puma-kiosk'?pumaPanels(true):key==='logo-animations'?logoPanels(true):key==='buildscape'?buildscapePanels(true):key==='nyid'?nyidPanels(true):snCompletePanels();
    const panels=(full?studyFullPanels:(key==='puma-kiosk'?pumaPanels(false):key==='logo-animations'?logoPanels(false):key==='buildscape'?buildscapePanels(false):key==='somnus'?snEditorialPanels():nyidPanels(false))).map((panel,i)=>panel.replace(/style="--slide:\d+"/,'style="--slide:'+i+'"'));
    const n=panels.length,title=key==='puma-kiosk'?'PUMA Kiosk':key==='logo-animations'?'Logo Animations':key==='buildscape'?'Buildscape':key==='nyid'?'New York ID':'Somnus';
    caseView.classList.remove('condensed-case');caseView.classList.add('somnus-case','study-switch-case');caseView.classList.toggle('nyid-case',key==='nyid');caseView.classList.toggle('buildscape-case',key==='buildscape');caseView.classList.toggle('logo-case',key==='logo-animations');caseView.classList.toggle('puma-case',key==='puma-kiosk');
    caseStudyEl.style.height=(n*100)+'vh';caseStudyEl.style.setProperty('--sn-height',(n*100)+'vh');
    snStory=document.createElement('article');snStory.className='sn-slide-deck somnus-editorial'+(key==='puma-kiosk'?' puma-editorial'+(full?' pk-complete':''):key==='logo-animations'?' logo-editorial'+(full?' la-complete':''):key==='buildscape'?' buildscape-editorial'+(full?' bs-complete':''):key==='somnus'?(full?' somnus-complete':''):' nyid-editorial'+(full?' nyid-complete':''));snStory.setAttribute('aria-label',title+' '+(full?'full study':'condensed study'));
    snStory.innerHTML='<div class="sn-slide-chrome"><button type="button" data-sn-back>← Back to work</button><span>'+title+' / Case study</span></div><button type="button" class="study-mode-switch" role="switch" aria-checked="'+full+'" aria-label="Full study" title="'+(full?'Switch to condensed study':'Switch to full study')+'"><span class="study-mode-label '+(!full?'selected':'')+'" title="Condensed" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h12M4 18h8"/></svg></span><span class="study-mode-label '+(full?'selected':'')+'" title="Full study" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 7h8M8 11h8M8 15h8M8 18h5"/></svg></span></button><div class="sn-panel-stack">'+panels.join('')+'</div><nav class="cs-nav sn-slide-nav" aria-label="'+title+' sections"><div class="cs-line"></div><div class="cs-fill" id="sn-slide-fill"></div><div class="cs-dots">'+chapters.map(([id,label],i)=>'<button type="button" class="cs-dot" data-sn-index="'+i+'" data-label="'+label+'" aria-label="'+label+'"></button>').join('')+'</div></nav><span class="sn-slide-count" aria-live="off"></span><button class="cs-next sn-slide-next" type="button" aria-label="Next section"><svg viewBox="0 0 24 24"><path d="M12 4V20"/><path d="M6 14L12 20L18 14"/></svg><span class="cs-next-label">See next project</span></button>';
    if(key==='logo-animations')snStory.querySelector('.study-mode-switch').remove();
    caseStudyEl.appendChild(snStory);
    if(key==='nyid')snStory.insertAdjacentHTML('afterbegin',NY_PENCIL_DEFS);
    const curatedNext=nextVisibleWorkSlide(key);
    snStory.querySelectorAll('[data-sn-next]').forEach(button=>button.textContent=curatedNext?'Next project / '+WORK_TITLES[curatedNext.dataset.project]+' →':'Browse gallery');
    CS={somnus:true,editorial:true,nyid:key==='nyid',chapters,n,sections:[...snStory.querySelectorAll('.sn-panel')],imgs:[...snStory.querySelectorAll('img')],snBodies:[...snStory.querySelectorAll('.sn-panel-body')],snStack:snStory.querySelector('.sn-panel-stack'),snDots:[...snStory.querySelectorAll('.cs-dot')],snFill:snStory.querySelector('#sn-slide-fill'),snCount:snStory.querySelector('.sn-slide-count'),snNext:snStory.querySelector('.sn-slide-next'),snCurrent:0};
    snStory.querySelectorAll('[data-sn-index]').forEach(button=>button.addEventListener('click',()=>goToCaseSection(+button.dataset.snIndex)));
    snStory.querySelectorAll('[data-sn-jump]').forEach(button=>button.addEventListener('click',()=>{const index=(key==='logo-animations'?LOGO_CHAPTERS:key==='buildscape'?BS_FULL_CHAPTERS:key==='nyid'?NY_CHAPTERS:SN_COMPLETE_CHAPTERS).findIndex(chapter=>chapter[0]===button.dataset.snJump);if(index<0)return;if(studyMode!=='full'){studyMode='full';renderStudy(key,index);}else goToCaseSection(index);}));
    snStory.querySelector('[data-sn-back]').addEventListener('click',()=>closeCase());
    snStory.querySelectorAll('[data-sn-deck]').forEach(button=>button.addEventListener('click',()=>{const link=document.createElement('a');link.href=snFileURL(key==='nyid'?'nydeck':'deck','application/pdf');link.target='_blank';link.rel='noopener';document.body.appendChild(link);link.click();link.remove();}));
    snStory.querySelectorAll('[data-sn-next]').forEach(button=>button.addEventListener('click',snNextProject));
    snStory.querySelectorAll('[data-sn-project]').forEach(button=>button.addEventListener('click',()=>openChosenStudy(button.dataset.snProject)));
    snStory.querySelectorAll('[data-sn-all-work]').forEach(button=>button.addEventListener('click',()=>closeCase(()=>document.getElementById('work').scrollIntoView({behavior:'smooth',block:'start'}))));
    snStory.querySelector('.sn-slide-next').addEventListener('click',()=>{if(CS.snCurrent===CS.n-1)snNextProject();else goToCaseSection(CS.snCurrent+1);});
    const readingSwitch=snStory.querySelector('.study-mode-switch');
    if(readingSwitch)readingSwitch.addEventListener('click',()=>{
      const current=CS.snCurrent;
      const destination=studyMode==='condensed'?STUDY_SUMMARY_TARGETS[key][current]:studyGroupFor(key,current);
      studyMode=studyMode==='condensed'?'full':'condensed';renderStudy(key,destination,true);
    });
    if(full){
      const first=snStory.querySelector('.sn-panel-body');
      first.insertAdjacentHTML('afterbegin','<div class="sf-section-picker"><label for="somnus-full-jump">Jump to section</label><select class="sf-section-select" id="somnus-full-jump">'+chapters.map(([id,label],i)=>'<option value="'+i+'">'+String(i+1).padStart(2,'0')+' / '+label+'</option>').join('')+'</select></div>');
      snStory.querySelector('.sf-section-select').addEventListener('change',event=>goToCaseSection(+event.target.value));
      snStory.querySelectorAll('.sf-originals').forEach(details=>details.addEventListener('toggle',()=>requestAnimationFrame(updateSomnus)));
    }
    casePos=0;built=true;
    if(CS.editorial){
      setupSomnusEditorial();
      if(key==='buildscape'||key==='logo-animations')document.dispatchEvent(new Event('portfolio-media-update'));
      const section=CS.sections[clamp(target,0,n-1)];
      caseView.scrollTo({top:Math.max(0,section.getBoundingClientRect().top-caseView.getBoundingClientRect().top+caseView.scrollTop-175),behavior:'instant'});
      updateSomnus();
    }else{
      const max=Math.max(0,caseStudyEl.offsetHeight-window.innerHeight);caseView.scrollTo({top:clamp(target,0,n-1)/(n-1)*max,behavior:'instant'});updateSomnus();
    }
    if(key==='logo-animations')snStory.querySelectorAll('.la-earlier').forEach(details=>details.addEventListener('toggle',()=>requestAnimationFrame(updateSomnus)));
    if(key==='logo-animations')snStory.querySelectorAll('video').forEach(video=>{video.addEventListener('play',()=>snStory.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();}));});
    if(focusSwitch&&readingSwitch)readingSwitch.focus({preventScroll:true});
  }
  function buildNYID(){studyMode='condensed';studyFullPanels=[];renderStudy('nyid');}
  function buildSomnus(){studyMode='condensed';studyFullPanels=[];renderStudy('somnus');}
  function updateSomnusEditorial(){
    if(!CS||!CS.editorial)return;
    const threshold=window.innerHeight*.38;
    let active=0;
    CS.sections.forEach((section,i)=>{
      const rect=section.getBoundingClientRect();if(rect.top<=threshold)active=i;
      section.inert=false;section.setAttribute('aria-hidden','false');
      section.querySelectorAll('[data-se-video]').forEach(video=>{
        const visible=rect.bottom>165&&rect.top<window.innerHeight;
        if(visible&&!video.hasAttribute('src')){video.src=snFileURL(video.dataset.studyVideo||'clip','video/mp4');video.load();}
        if(!visible)video.pause();
      });
    });
    CS.snCurrent=active;
    const picker=snStory.querySelector('.sf-section-select');if(picker)picker.value=String(active);
    CS.snDots.forEach((dot,i)=>{dot.classList.toggle('active',i===active);dot.setAttribute('aria-current',i===active?'step':'false');});
    CS.snFill.style.height=(caseProgress()*100)+'%';
    CS.snCount.textContent=String(active+1).padStart(2,'0')+' / '+CS.n+' — '+CS.chapters[active][1];
    const last=active===CS.n-1;CS.snNext.classList.toggle('next-project',last);
    const label=last?(nextVisibleWorkSlide(currentKey)?'See next project':'Browse gallery'):'Next section';
    CS.snNext.setAttribute('aria-label',label);CS.snNext.querySelector('.cs-next-label').textContent=label;
  }
  /* Reveal individual reading blocks; content remains visible if motion is unavailable. */
  function observeSomnusEntrances(story,root){
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    if(!('IntersectionObserver' in window)||reduced.matches)return null;
    const targets=new Set(),animations=new Set();
    const groups='.se-heading,.se-intro-title,.se-intro-title>div,.se-project-meta,.se-problem-grid,.se-audience,.se-idea,.se-idea>div:not(.se-descent),.se-wire-grid,.se-board-pair,.se-final-grid,.se-final-grid>div,.se-outcome,.se-next-grid,.sf-pair,.sf-three,.sf-sketches,.ni-phones,.ni-pair,.ni-benefits,.ni-wire-grid,.ni-wire-set,.bs-intro,.bs-meta,.bs-split,.bs-pair,.bs-portraits,.bs-installation,.bs-flow,.bs-presets,.bs-metrics,.bs-notes,.la-intro,.la-brand-heading,.la-meta,.la-frames,.la-process,.la-brand-brief,.la-direction,.la-direct-heading,.la-pdf-intro,.la-pdf-references';
    function collect(node){
      if(node.matches('.sf-originals,.sf-section-picker'))return;
      if(node.matches(groups)){[...node.children].forEach(collect);return;}
      targets.add(node);
    }
    story.querySelectorAll('.sn-panel-body').forEach(body=>[...body.children].forEach(collect));
    story.querySelectorAll('.sf-source-pages figure,.ni-alternate .ni-figure').forEach(figure=>targets.add(figure));
    const observer=new IntersectionObserver(entries=>{
      if(reduced.matches)return;
      const entering=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      entering.forEach((entry,index)=>{
        observer.unobserve(entry.target);
        if(typeof entry.target.animate!=='function')return;
        const media=entry.target.matches('figure,.se-film,.bs-film,.se-map,.se-style,.sf-map,.se-next-card');
        const animation=entry.target.animate([
          {opacity:0,transform:media?'translate3d(0,22px,0) scale(.99)':'translate3d(0,16px,0)'},
          {opacity:1,transform:'none'}
        ],{duration:media?760:650,delay:Math.min(index,3)*60,easing:'cubic-bezier(.2,.65,.3,1)',fill:'backwards'});
        animations.add(animation);
        animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
      });
    },{root,rootMargin:'0px 0px -36px 0px',threshold:.06});
    targets.forEach(target=>observer.observe(target));
    function stop(){observer.disconnect();animations.forEach(animation=>animation.cancel());animations.clear();}
    function changed(){if(reduced.matches)stop();}
    reduced.addEventListener('change',changed);
    return {disconnect(){stop();reduced.removeEventListener('change',changed);}};
  }

  function setupSomnusEditorial(){
    snStory.querySelectorAll('[data-se-expand]').forEach(button=>button.addEventListener('click',()=>{
      const image=button.querySelector('img'),dialog=document.createElement('dialog');
      dialog.className='se-image-viewer';dialog.setAttribute('aria-label',image.alt);
      const close=document.createElement('button');close.type='button';close.className='se-viewer-close';close.textContent='Close ×';close.setAttribute('aria-label','Close full-size image');
      const full=document.createElement('img');full.src=image.currentSrc||image.src;full.alt=image.alt;if(image.closest('.ni-wireframe'))full.classList.add('nyid-pencil-image');if(image.closest('.la-pdf-identity:not(.la-identity-dark)'))full.classList.add('la-transparent-logo');
      dialog.append(close,full);document.body.append(dialog);
      close.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
      dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();});
      dialog.addEventListener('close',()=>{dialog.remove();button.focus({preventScroll:true});},{once:true});dialog.showModal();
    }));
    snObserver=observeSomnusEntrances(snStory,caseView);
  }

  function updateSomnus() {
    if(CS&&CS.editorial){updateSomnusEditorial();return;}
    if(!CS||!CS.somnus)return;
    const progress=caseProgress(),exact=progress*(CS.n-1),base=Math.min(Math.floor(exact),CS.n-1),local=exact-base;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const phase=clamp((local-.08)/.78,0,1),ease=phase*phase*(3-2*phase);
    const pos=reduced?Math.round(exact):Math.min(base+ease,CS.n-1),active=Math.min(Math.round(pos),CS.n-1);
    CS.snStack.style.transform='translate3d(0,'+(-pos*100).toFixed(3)+'%,0)';
    CS.snBodies.forEach((body,i)=>{const d=Math.abs(i-pos);body.style.opacity=String(Math.max(0,1-d*.32));body.style.transform='scale('+(1-.012*Math.min(d,1)).toFixed(4)+')';CS.sections[i].inert=d>.5;CS.sections[i].setAttribute('aria-hidden',String(d>.5));});
    CS.snDots.forEach((dot,i)=>{dot.classList.toggle('active',i===active);dot.setAttribute('aria-current',i===active?'step':'false');});
    CS.snFill.style.height=(progress*100)+'%';
    CS.snCount.textContent=String(active+1).padStart(2,'0')+' / '+String(CS.n).padStart(2,'0')+' — '+(CS.chapters||SN_CHAPTERS)[active][1];
    CS.snNext.classList.toggle('next-project',active===CS.n-1);CS.snNext.setAttribute('aria-label',active===CS.n-1?'See next project':'Next section');
    if(active===CS.n-1){const next=nextVisibleWorkSlide(currentKey);const label=next?'See next project':'Browse gallery';CS.snNext.setAttribute('aria-label',label);CS.snNext.querySelector('.cs-next-label').textContent=label;}
    CS.snCurrent=active;
    if(!CS.nyid&&studyMode==='condensed'){
      snStory.querySelectorAll('[data-se-video]').forEach(video=>{
        const panel=video.closest('.sn-panel'),index=CS.sections.indexOf(panel);
        if(Math.abs(pos-index)<1&&!video.hasAttribute('src')){video.src=snFileURL('clip','video/mp4');video.load();}
        if(Math.abs(pos-index)>.55)video.pause();
      });
      return;
    }
    const video=snStory.querySelector('video');
    if(!CS.nyid&&studyMode==='full'&&Math.abs(pos-10)<1)snLoadVideo();
    if(video&&(studyMode!=='full'||Math.abs(pos-10)>.55))video.pause();
  }
  function closeSomnus(after) {
    caseAnimating=true;caseView.classList.remove('ready');
    if(snObserver)snObserver.disconnect();
    if(snStory)snStory.querySelectorAll('video').forEach(video=>video.pause());
    setTimeout(()=>{caseView.classList.remove('open','somnus-case','nyid-case','buildscape-case','logo-case','puma-case','condensed-case','study-switch-case');caseView.setAttribute('aria-hidden','true');document.body.classList.remove('case-open');caseOpen=false;built=false;caseAnimating=false;currentKey=null;if(snStory){snStory.remove();snStory=null;}updateOnDark();(portfolioReturnSource&&portfolioReturnSource.isConnected?portfolioReturnSource:slides[cur]).focus({preventScroll:true});if(after)after();},350);
  }

  function buildCase(P) {
    if (P.title === 'somnus') { buildSomnus(); return; }
    if (P.title === 'nyid') { buildNYID(); return; }
    if (P.title === 'buildscape') { buildBuildscape(); return; }
    if (P.title === 'logo-animations') { buildLogoAnimations(); return; }
    if (P.title === 'puma-kiosk') { buildPuma(); return; }
    caseView.classList.remove('somnus-case','nyid-case','buildscape-case','logo-case','puma-case','condensed-case','study-switch-case');
    if (snObserver) snObserver.disconnect();
    if (snStory) { snStory.remove(); snStory = null; }

    const n = P.sections.length;

    caseStudyEl.style.height = (n * 100) + 'vh';
    caseField.style.background = P.tint;

    caseStack.innerHTML = P.sections.map((s, i) =>
      '<div class="image-layer" style="--i:' + i + '"><img src="' + img(P.title, i + 1) +
      '" alt="' + P.title + ' — image ' + (i + 1) + '"' + (i ? ' loading="lazy"' : '') + '></div>'
    ).join('');


    caseText.innerHTML = P.sections.map((s, i) => {
      let html = '<article class="text-layer"><div class="cs-num">' +
        String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0') + '</div>';
      html += '<' + s.h + ' class="cs-h">' + s.title + '</' + s.h + '>';
      if (s.lead) html += '<p class="cs-lead">' + s.lead + '</p>';
      (s.p || []).forEach(t => html += '<p class="cs-p">' + t + '</p>');
      if (s.list) html += '<ul class="cs-list">' + s.list.map(x => '<li>' + x + '</li>').join('') + '</ul>';
      if ((i === 0 || i === n - 1) && P.meta && P.doc) {
        if (i === 0) {
          html += '<div class="meta-grid">' + Object.entries(P.meta).map(([k, v]) =>
            '<div class="meta-item"><span>' + k + '</span><strong>' + v + '</strong></div>').join('') + '</div>';
        }
        html += '<a class="cs-button" href="' + (P.docHref || '#') + '" target="_blank" rel="noopener">' + P.doc + ' &nearr;</a>';
      }
      return html + '</article>';
    }).join('');

    caseDotsEl.innerHTML = P.sections.map((s, i) =>
      '<button class="cs-dot' + (i === 0 ? ' active' : '') + '" data-i="' + i +
      '" data-label="' + s.label + '" aria-label="' + s.label + '"></button>').join('');
    caseDotsEl.querySelectorAll('.cs-dot').forEach(d =>
      d.addEventListener('click', () => goToCaseSection(+d.dataset.i)));

    caseFill.style.height = '0%';
    caseNext.classList.remove('next-project');

    CS = {
      layers: [...caseText.querySelectorAll('.text-layer')],
      imgs: [...caseStack.querySelectorAll('img')],
      dots: [...caseDotsEl.querySelectorAll('.cs-dot')],
      n
    };
    built = true;
    updateCase(0);
  }

  function updateCase(progress) {
    if (CS && CS.somnus) { updateSomnus(); return; }
    const { layers, imgs, dots, n } = CS;

    const exact = progress * (n - 1);
    const curS = Math.min(Math.floor(exact), n - 1);
    const local = exact - curS;

    layers.forEach((layer, i) => {
      let o = 0, y = 26, s = .988;

      if (i === curS) {
        const f = 1 - Math.pow(clamp((local - .04) / .36, 0, 1), 1.5);
        const m = 1 - Math.pow(1 - clamp(local / .5, 0, 1), 2);
        o = f; y = -44 * m; s = 1 - .012 * m;
      } else if (i === curS + 1) {
        const f = 1 - Math.pow(1 - clamp((local - .40) / .32, 0, 1), 3);
        const m = 1 - Math.pow(1 - clamp((local - .40) / .34, 0, 1), 2.2);
        o = f; y = 26 * (1 - m); s = .988 + .012 * f;
      }

      layer.style.opacity = o;
      layer.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0) translateY(-50%) scale(' + s.toFixed(4) + ')';
      layer.style.pointerEvents = o > .6 ? 'auto' : 'none';
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === curS));

    const isEnd = exact >= n - 1.15;
    caseNext.classList.toggle('next-project', isEnd);
    if(isEnd){const label=nextVisibleWorkSlide(currentKey)?'See next project':'Browse gallery';caseNext.setAttribute('aria-label',label);caseNext.querySelector('.cs-next-label').textContent=label;}
    caseNext.setAttribute('aria-label', isEnd ? 'See next project' : 'Next section');

    const t = Math.min(local / .5, 1);
    const mv = 1 - Math.pow(1 - t, 2.4);
    const pos = (curS + mv) / (n - 1) * (imgs.length - 1);
    casePos = pos;
    caseStack.style.transform = 'translate3d(0,' + (-pos * 100) + '%,0)';

    imgs.forEach((im, i) => {
      const d = i - pos;
      const prox = clamp(1 - Math.abs(d), 0, 1);
      im.style.transform = 'translate3d(0,' + (d * 4 * prox).toFixed(2) + 'px,0) scale(' + (.99 + .01 * prox).toFixed(4) + ')';
    });

    caseFill.style.height = (progress * 100) + '%';
  }

  function caseProgress() {
    const max = caseStudyEl.offsetHeight - window.innerHeight;
    return max <= 0 ? 0 : clamp(caseView.scrollTop / max, 0, 1);
  }

  caseView.addEventListener('scroll', () => {
    if (!caseOpen || !built || caseRaf) return;
    caseRaf = true;
    requestAnimationFrame(() => { updateCase(caseProgress()); caseRaf = false; });
  }, { passive: true });

  function goToCaseSection(i) {
    if(CS&&CS.editorial){
      const section=CS.sections[clamp(i,0,CS.n-1)],top=section.getBoundingClientRect().top-caseView.getBoundingClientRect().top+caseView.scrollTop-175;
      caseView.scrollTo({top:Math.max(0,top),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return;
    }
    if (CS && CS.somnus) {
      const max = Math.max(0, caseStudyEl.offsetHeight - window.innerHeight);
      const top = (clamp(i, 0, CS.n - 1) / (CS.n - 1)) * max;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      caseView.scrollTo({top, behavior: reduced ? 'auto' : 'smooth'});
      return;
    }
    const max = caseStudyEl.offsetHeight - window.innerHeight;
    caseView.scrollTo({ top: (i / (CS.n - 1)) * max, behavior: 'smooth' });
  }

  caseNext.addEventListener('click', () => {
    if (caseNext.classList.contains('next-project')) {
      advanceVisibleProject(currentKey);
      return;
    }
    const next = clamp(Math.floor(caseProgress() * CS.n + 1), 0, CS.n - 1);
    goToCaseSection(next);
  });

  /* ---- FLIP open / close ---- */
  function innerFrameRect() {
    if (CS && CS.somnus && snStory) {
      const image = snStory.querySelector(CS.nyid?'#ny-overview .sn-screen img':'#sn-overview .sn-screen img');
      const f = image.getBoundingClientRect();
      return {left:f.left,top:f.top,width:f.width,height:f.height};
    }
    const f = caseField.getBoundingClientRect();
    return { left: f.left, top: f.top, width: f.width, height: f.height };
  }

  function makeGhost(src, rect, transform) {
    const g = document.createElement('div');
    g.className = 'ghost';
    g.style.left = rect.left + 'px';
    g.style.top = rect.top + 'px';
    g.style.width = rect.width + 'px';
    g.style.height = rect.height + 'px';
    g.style.backgroundImage = 'url("' + src + '")';
    if (transform) g.style.transform = transform;
    document.body.appendChild(g);
    return g;
  }

  function openCase(key, slideEl, sourceRect=null) {
    if (caseOpen || caseAnimating) return;
    const P = PROJECTS[key];
    if (!P || !slideEl || slideEl.hidden) return;
    setActive(slides.indexOf(slideEl));
    caseAnimating = true;
    currentKey = key;

    buildCase(P);

    caseView.classList.add('open');
    caseView.setAttribute('aria-hidden', 'false');
    caseView.scrollTop = 0;
    document.body.classList.add('case-open');
    caseOpen = true;
    if (CS && CS.somnus) updateSomnus();

    // The shared media ripple reveals this already prepared case study.
    requestAnimationFrame(() => {
      caseView.classList.add('ready');
      caseAnimating = false;
      caseClose.focus({ preventScroll: true });
      showStudyModeTip();
    });
  }

  function closeCase(after) {
    if (!caseOpen || caseAnimating) return;
    if (CS && CS.somnus) { closeSomnus(after); return; }
    caseAnimating = true;

    caseView.classList.remove('ready');

    setTimeout(() => {
      const activeImg = CS.imgs[Math.round(clamp(casePos, 0, CS.imgs.length - 1))];
      const src = activeImg.currentSrc || activeImg.src;
      const t = innerFrameRect();
      const returnSource=portfolioReturnSource&&portfolioReturnSource.isConnected?portfolioReturnSource:slides[cur];
      const slideImg = returnSource.querySelector('.bg img');
      const s = slideImg.getBoundingClientRect();

      const ghost = makeGhost(src, t, 'none');

      requestAnimationFrame(() => requestAnimationFrame(() => {
        ghost.style.transform =
          'translate(' + (s.left - t.left) + 'px,' + (s.top - t.top) + 'px)' +
          ' scale(' + (s.width / t.width) + ',' + (s.height / t.height) + ')';
      }));

      setTimeout(() => {
        ghost.remove();
        caseView.classList.remove('open');
        caseView.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('case-open');
        caseOpen = false; built = false; caseAnimating = false;
        currentKey = null;
        updateOnDark();
        (portfolioReturnSource&&portfolioReturnSource.isConnected?portfolioReturnSource:slides[cur]).focus({ preventScroll: true });
        if (after) after();
      }, 500);
    }, 180);
  }

  slides.forEach(slide => {
    slide.addEventListener('click', () => openPortfolioProject(slide.dataset.project, slide));
    slide.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openPortfolioProject(slide.dataset.project, slide);
      }
    });
  });

  caseClose.addEventListener('click', () => closeCase());
  document.getElementById('sandboxReturn').addEventListener('click',()=>{
    if(document.documentElement.getAttribute('data-theme')==='dark')document.getElementById('themeToggle').click();
    requestAnimationFrame(()=>document.getElementById('work').scrollIntoView({behavior:'smooth',block:'start'}));
  });
  window.addEventListener('portfolio-mode-change',()=>{
    if(document.documentElement.getAttribute('data-theme')!=='dark')return;
    if(projectDialog.open)projectDialog.close();
    const resetTop=()=>window.scrollTo({top:0,left:0,behavior:'instant'});
    if(caseOpen&&!caseAnimating)closeCase(resetTop);
    else requestAnimationFrame(resetTop);
  });

  document.addEventListener('keydown', e => {
    if (caseOpen && e.key === 'Escape') closeCase();
  });

  window.addEventListener('resize', () => {
    updateOnDark();
    if (caseOpen && built) updateCase(caseProgress());
  });

  /* =============================================
     ENVELOPE: content, build, 3D flip + drag
  ============================================= */
  (function () {
    "use strict";

    const CONFIG = {
      name: "Sharon",
      fullName: "Sharon Wang Liu"
    };

    document.querySelectorAll("[data-name]").forEach(el => el.textContent = CONFIG.name);
    document.querySelectorAll("[data-fullname]").forEach(el => el.textContent = CONFIG.fullName);

    function stampSVG(uid) {
      return (
        '<svg class="stamp" viewBox="0 0 120 150" aria-hidden="true">' +
          '<defs>' +
            '<mask id="perf-' + uid + '" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="150">' +
              '<rect width="120" height="150" fill="#fff"/>' +
              '<g data-perfs fill="#000"></g>' +
            '</mask>' +
          '</defs>' +
          '<g mask="url(#perf-' + uid + ')">' +
            '<rect class="st-cream" width="120" height="150"/>' +
            '<rect class="st-accent" x="10" y="10" width="100" height="130"/>' +
            '<circle class="st-cream" cx="60" cy="60" r="24"/>' +
            '<path class="st-blue2" d="M10,92 q10,-9 20,0 t20,0 t20,0 t20,0 t20,0 V140 H10Z"/>' +
            '<path class="st-blue" d="M10,106 q10,-9 20,0 t20,0 t20,0 t20,0 t20,0 V140 H10Z"/>' +
            '<text class="st-text" x="60" y="128" text-anchor="middle">FIRST CLASS</text>' +
          '</g>' +
        '</svg>'
      );
    }
    document.querySelectorAll(".stamp-slot").forEach((slot, i) => slot.innerHTML = stampSVG(i));

    let perforations = "";
    for (let x = 0; x <= 120; x += 10) {
      perforations += '<circle cx="' + x + '" cy="0" r="3.6"/>' +
                      '<circle cx="' + x + '" cy="150" r="3.6"/>';
    }
    for (let y = 10; y < 150; y += 10) {
      perforations += '<circle cx="0" cy="' + y + '" r="3.6"/>' +
                      '<circle cx="120" cy="' + y + '" r="3.6"/>';
    }
    document.querySelectorAll("[data-perfs]").forEach(g => g.innerHTML = perforations);

    const date = new Date();
    const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const day = String(date.getDate()).padStart(2, "0");
    const pmText = document.getElementById("pmText");
    if (pmText) {
      pmText.textContent = "ABOUT ME · " + month + " " + day + " " + date.getFullYear() + " · HELLO · ";
    }

    const bars = document.getElementById("bars");
    let barcode = "", seed = 7;
    for (let i = 0; i < 36; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      barcode += '<i style="height:' + ((seed / 233280) > 0.5 ? 100 : 55) + '%"></i>';
    }
    bars.innerHTML = barcode;

    const card   = document.getElementById("card");
    const lift   = document.getElementById("lift");
    const tiltEl = document.querySelector(".tilt");
    const faceFront = document.getElementById("faceFront");
    const faceBack  = document.getElementById("faceBack");

    const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const FLIP_MS = 720;
    const OVERSHOOT = 0.85;

    let rot = 0, flipped = false, dir = 1, raf = null;
    let dragging = false, pointerId = null;
    let startX = 0, startRot = 0, maxMove = 0;
    let lastDx = 0, lastT = 0, vel = 0;

    function applyRot() {
      card.style.transform = "rotateY(" + rot + "deg)";
      const rad = rot * Math.PI / 180;
      const c = Math.cos(rad), s = Math.sin(rad);
      let turn = 1 - Math.abs(c);
      turn = Math.max(0, Math.min(1, turn));
      tiltEl.style.setProperty("--turn", turn.toFixed(4));
      tiltEl.style.setProperty("--sin", s.toFixed(4));
      if (REDUCED) return;
      lift.style.transform =
        "translateZ(" + (turn * 40).toFixed(1) + "px)" +
        " rotateX(" + (turn * dir * 5).toFixed(2) + "deg)" +
        " scale(" + (1 + turn * 0.025).toFixed(4) + ")";
    }

    function stopAnim() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    function animateTo(target) {
      stopAnim();
      const from = rot, dist = target - from;
      if (Math.abs(dist) < 0.01) {
        rot = ((target % 360) + 360) % 360;
        applyRot();
        return;
      }
      const dur = REDUCED ? 1 : FLIP_MS;
      const t0 = performance.now();
      const c1 = OVERSHOOT, c3 = c1 + 1;
      function ease(t) { return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
      function frame(now) {
        const t = Math.min(1, (now - t0) / dur);
        rot = from + dist * ease(t);
        applyRot();
        if (t < 1) { raf = requestAnimationFrame(frame); }
        else {
          raf = null;
          rot = ((target % 360) + 360) % 360;
          applyRot();
          lift.style.transform = "";
        }
      }
      raf = requestAnimationFrame(frame);
    }

    function updateAria() {
      card.setAttribute("aria-pressed", String(flipped));
      card.setAttribute("aria-label", flipped ? "Flip back to the front" : "Flip the envelope over");
      faceFront.setAttribute("aria-hidden", String(flipped));
      faceBack.setAttribute("aria-hidden", String(!flipped));
    }

    function doFlip() {
      flipped = !flipped;
      dir = flipped ? 1 : -1;
      animateTo(flipped ? 180 : 0);
      updateAria();
    }

    function settle() {
      const delta = rot - startRot;
      const flick = Math.abs(vel) > 0.5 && Math.abs(lastDx) > 12 && Math.abs(delta) > 8;
      let target;
      if (flick) {
        dir = vel > 0 ? -1 : 1;
        target = dir > 0 ? Math.ceil(rot / 180) * 180 : Math.floor(rot / 180) * 180;
      } else {
        target = Math.round(rot / 180) * 180;
        dir = (target - rot) >= 0 ? 1 : -1;
      }
      const norm = ((Math.round(target) % 360) + 360) % 360;
      flipped = norm === 180;
      updateAria();
      animateTo(target);
    }

    card.addEventListener("pointerdown", function (e) {
      if (pointerId !== null) return;
      if (e.button !== undefined && e.button !== 0) return;
      stopAnim();
      pointerId = e.pointerId;
      dragging = true;
      startX = e.clientX;
      startRot = rot;
      maxMove = 0; lastDx = 0; vel = 0;
      lastT = performance.now();
      card.setPointerCapture(e.pointerId);
      document.body.classList.add("is-dragging");
    });

    card.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > maxMove) maxMove = Math.abs(dx);
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) {
        vel = 0.8 * vel + 0.2 * ((dx - lastDx) / dt);
        lastDx = dx;
        lastT = now;
      }
      if (Math.abs(dx) > 3) dir = dx < 0 ? 1 : -1;
      const w = card.offsetWidth || 470;
      let r = startRot - (dx / w) * 180;
      if (r > startRot + 178) r = startRot + 178;
      if (r < startRot - 178) r = startRot - 178;
      rot = r;
      applyRot();
    });

    function release(e) {
      if (!dragging) return;
      if (e.pointerId !== undefined && e.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      document.body.classList.remove("is-dragging");
      if (maxMove < 10) doFlip();
      else settle();
    }
    card.addEventListener("pointerup", release);
    card.addEventListener("pointercancel", release);

    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        doFlip();
      }
    });

    card.addEventListener("dragstart", e => e.preventDefault());

    applyRot();
    updateAria();
  })();
