
/* Dark opening → zoom out into the looping film → reveal the typography. */
(() => {
  const root=document.documentElement,hero=document.getElementById('home'),video=document.getElementById('heroBackgroundVideo');
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let started=false,visible=true,revealTimer=null,completeTimer=null;
  function finish(){root.classList.add('hero-film-revealed','hero-intro-complete');}
  function reveal(){
    if(started)return;started=true;
    if(window.__heroIntroFallback)clearTimeout(window.__heroIntroFallback);
    if(revealTimer!==null)clearTimeout(revealTimer);
    if(motion.matches){finish();return;}
    revealTimer=setTimeout(()=>{root.classList.add('hero-film-revealed');completeTimer=setTimeout(()=>{root.classList.add('hero-intro-complete');},1350);},250);
  }
  function syncPlayback(){
    const shouldPlay=visible&&!document.hidden&&!motion.matches&&!document.body.classList.contains('case-open');
    if(!shouldPlay){video.pause();return;}
    const play=video.play();if(play&&play.catch)play.catch(()=>reveal());
  }
  video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;
  video.addEventListener('loadeddata',reveal,{once:true});video.addEventListener('error',reveal,{once:true});
  if(video.readyState>=2||motion.matches)reveal();else revealTimer=setTimeout(reveal,2200);
  if(typeof IntersectionObserver!=='undefined'){
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncPlayback();},{threshold:0});observer.observe(hero);
  }
  document.addEventListener('visibilitychange',syncPlayback);
  motion.addEventListener('change',()=>{if(motion.matches){if(revealTimer!==null)clearTimeout(revealTimer);if(completeTimer!==null)clearTimeout(completeTimer);finish();}syncPlayback();});
  window.addEventListener('scroll',()=>{if(!root.classList.contains('hero-intro-complete')&&window.scrollY>40){if(revealTimer!==null)clearTimeout(revealTimer);if(completeTimer!==null)clearTimeout(completeTimer);finish();}},{passive:true});
  syncPlayback();
})();

