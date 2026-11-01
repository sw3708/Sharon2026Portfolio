/* Scroll depth for Work covers; independent of image zoom and project ordering. */
(() => {
  const work = document.getElementById('work');
  if (!work) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const style = document.createElement('style');
  style.textContent = `
    @media (prefers-reduced-motion: no-preference) {
      #work.work-parallax .slide > .bg {
        inset: -12% 0;
        translate: 0 var(--work-image-y, 0px);
      }
      #work.work-parallax .slide > .slide-content {
        translate: 0 var(--work-copy-y, 0px);
      }
    }
  `;
  document.head.appendChild(style);
  let frame = 0;
  function update() {
    frame = 0;
    const enabled = !reduced.matches;
    work.classList.toggle('work-parallax', enabled);
    if (!enabled || document.hidden) return;
    const viewport = window.innerHeight;
    const compact = window.innerWidth <= 700;
    work.querySelectorAll('.slide').forEach(slide => {
      if (slide.hidden) return;
      const rect = slide.getBoundingClientRect();
      if (!rect.height || rect.bottom < 0 || rect.top > viewport) return;
      const distance = rect.top + rect.height / 2 - viewport / 2;
      const limit = rect.height * (compact ? 0.055 : 0.09);
      const imageY = Math.max(-limit, Math.min(limit, -distance * (compact ? 0.11 : 0.18)));
      const copyY = Math.max(-18, Math.min(18, distance * 0.035));
      slide.style.setProperty('--work-image-y', imageY.toFixed(2) + 'px');
      slide.style.setProperty('--work-copy-y', copyY.toFixed(2) + 'px');
    });
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('portfolio-mode-change', schedule);
  reduced.addEventListener('change', schedule);
  new MutationObserver(schedule).observe(work, {
    childList: true, subtree: true, attributes: true, attributeFilter: ['hidden']
  });
  schedule();
})();
