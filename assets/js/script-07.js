
/* Fit the actual loaded typeface rather than clipping it to a line box. */
(() => {
  const title=document.querySelector('h1.hero-title'),bottom=document.querySelector('.hero-bottom');
  if(!title||!bottom)return;
  function fitTitle(){
    title.style.fontSize='';
    const base=parseFloat(getComputedStyle(title).fontSize),style=getComputedStyle(bottom);
    const stacked=style.flexDirection==='column';
    const button=bottom.querySelector('.scroll-btn');
    const room=bottom.clientWidth-(stacked?0:(button?button.getBoundingClientRect().width:0)+(parseFloat(style.columnGap)||0));
    const width=Math.max(...[...title.querySelectorAll('.line>span')].map(span=>span.getBoundingClientRect().width));
    if(width>room-8&&room>0)title.style.fontSize=(base*(room-8)/width).toFixed(2)+'px';
  }
  fitTitle();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fitTitle);
  window.addEventListener('resize',fitTitle,{passive:true});
  window.addEventListener('portfolio-mode-change',()=>requestAnimationFrame(fitTitle));
})();

