
/* A quiet, stippled field that responds to the visitor's movement. */
(() => {
  const hero=document.getElementById('home'), film=document.getElementById('heroBackgroundVideo');
  const canvas=document.getElementById('heroGrain'),ctx=canvas.getContext('2d');
  if(!ctx)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let w=1,h=1,visible=true,frame=0,last=0,clock=0,active=false;
  let px=.5,py=.5,tx=.5,ty=.5,strength=0,pulse=null,hoverPulses=[],lastHoverPulse=-10;
  const grains=Array.from({length:18000},()=>({x:Math.random(),y:Math.random(),s:.7+Math.random()*1.6,a:.25+Math.random()*.75,phase:Math.random()*Math.PI*2}));
  function resize(){
    const rect=hero.getBoundingClientRect();w=rect.width;h=rect.height;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    if(motion.matches)draw(0);
  }
  function draw(dt){
    clock+=dt;hoverPulses=hoverPulses.filter(wave=>clock-wave.at<2.8);if(pulse&&clock-pulse.at>1.7)pulse=null;px+=(tx-px)*.055;py+=(ty-py)*.055;strength+=((active?1:0)-strength)*.045;
    film.style.setProperty('--film-x',((px-.5)*44*strength).toFixed(2)+'px');
    film.style.setProperty('--film-y',((py-.5)*30*strength).toFixed(2)+'px');
    ctx.clearRect(0,0,w,h);
    const radius=Math.min(w*.35,280),cx=px*w,cy=py*h;
    for(const p of grains){
      let x=p.x*w,y=p.y*h;
      const band=h*(.6+.1*Math.sin(p.x*5+clock*.15));
      const haze=Math.exp(-Math.pow((y-band)/(h*.105),2));
      const dx=cx-x,dy=cy-y,d=Math.hypot(dx,dy),near=Math.max(0,1-d/radius)*strength;
      const pull=near*near*.2;
      x+=dx*pull;y+=dy*pull+Math.sin(p.phase+clock*.35)*5;
      let ring=0;
      if(pulse){
        const age=clock-pulse.at,rx=x-pulse.x,ry=y-pulse.y,rd=Math.hypot(rx,ry);
        ring=Math.exp(-Math.pow((rd-age*230)/32,2))*Math.max(0,1-age/1.7);
        if(rd>0){x+=rx/rd*ring*24;y+=ry/rd*ring*24;}
      }
      // Mouse movement uses the same expanding grain ripple, at a slower speed.
      for(const wave of hoverPulses){
        const age=clock-wave.at,rx=x-wave.x,ry=y-wave.y,rd=Math.hypot(rx,ry);
        const slowRing=Math.exp(-Math.pow((rd-age*90)/32,2))*Math.max(0,1-age/2.8)*.6;
        ring=Math.min(1,ring+slowRing);
        if(rd>0){x+=rx/rd*slowRing*24;y+=ry/rd*slowRing*24;}
      }
      const alpha=(haze*.34+near*near*.55+ring*.42)*p.a;
      if(alpha<.008)continue;
      ctx.fillStyle='rgba(190,194,204,'+alpha.toFixed(3)+')';ctx.fillRect(x,y,p.s,p.s);
    }
  }
  function tick(now){
    frame=0;if(!visible||document.hidden||motion.matches)return;
    if(now-last>=32){draw(Math.min((now-last)/1000,.05));last=now;}
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    if(frame){cancelAnimationFrame(frame);frame=0;}
    if(motion.matches){active=false;strength=0;pulse=null;hoverPulses=[];film.style.setProperty('--film-x','0px');film.style.setProperty('--film-y','0px');draw(0);}
    else if(visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}
  }
  hero.addEventListener('pointermove',e=>{
    if(motion.matches||e.pointerType==='touch')return;
    const r=hero.getBoundingClientRect();tx=Math.max(0,Math.min(1,(e.clientX-r.left)/w));ty=Math.max(0,Math.min(1,(e.clientY-r.top)/h));active=true;
    if(!e.buttons&&clock-lastHoverPulse>=.7){
      hoverPulses.push({x:e.clientX-r.left,y:e.clientY-r.top,at:clock});
      if(hoverPulses.length>4)hoverPulses.shift();lastHoverPulse=clock;
    }
  },{passive:true});
  hero.addEventListener('pointerdown',e=>{
    if(motion.matches||e.target.closest('a,button,input,select,textarea,[draggable="true"]'))return;
    const r=hero.getBoundingClientRect();pulse={x:e.clientX-r.left,y:e.clientY-r.top,at:clock};
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{active=false;tx=.5;ty=.5;});
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(hero);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(hero);else window.addEventListener('resize',resize);
  resize();sync();
})();

