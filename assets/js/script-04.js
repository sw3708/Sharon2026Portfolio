
const WORK_COVER_CLIP = 'assets/videos/113535dec7fdb90e.mp4';
/* Somnus Work cover — replay on every visit, without looping. */
(() => {
  const cover = document.querySelector('.slide[data-project="somnus"]');
  const background = cover.querySelector('.bg');
  const poster = background.querySelector('img');
  const video = document.createElement('video');
  video.className = 'work-cover-video';
  video.muted = true; video.defaultMuted = true; video.loop = false;
  video.playsInline = true; video.preload = 'none';
  video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.poster = poster.src;
  background.appendChild(video);
  background.classList.add('has-work-video');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, finished = false, failed = false, engaged = false;
  const clip = WORK_COVER_CLIP;
  function sync() {
    if(video.dataset.caseRippleLive==='true'){if(!document.hidden&&!motion.matches&&!video.ended){const play=video.play();if(play&&play.catch)play.catch(()=>{});}return;}
    const shouldPlay = visible && !cover.hidden && cover.classList.contains('active') &&
      !document.body.classList.contains('case-open') && !document.hidden && !motion.matches;
    if (!shouldPlay || failed) { video.pause(); engaged = false; return; }
    if (!video.hasAttribute('src')) { video.src = clip; video.load(); }
    if (!engaged) {
      engaged = true; finished = false;
      video.currentTime = 0;
    }
    if (finished) { video.pause(); return; }
    const promise = video.play();
    if (promise && promise.catch) promise.catch(() => {});
  }
  video.addEventListener('ended', () => { finished = true; video.pause(); });
  video.addEventListener('error', () => {
    failed = true; background.classList.remove('has-work-video'); video.remove();
  });
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .45;
    sync();
  }, {threshold:[0,.45,.75]});
  observer.observe(cover);
  const changes = new MutationObserver(sync);
  changes.observe(document.body, {attributes:true, attributeFilter:['class']});
  changes.observe(cover, {attributes:true, attributeFilter:['class','hidden']});
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('case-ripple-finished', sync);
  motion.addEventListener('change', sync);
})();


