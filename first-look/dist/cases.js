/* CSS 3D image ring. Geometry is measured only when the layout changes. */
(()=>{
  if(document.body.classList.contains('case-document')){
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    if(!preference.matches){document.body.classList.add('case-reading');const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.08,rootMargin:'0px 0px -6% 0px'});document.querySelectorAll('.case-chapter,.case-next').forEach(element=>observer.observe(element));}
    return;
  }
  const section=document.getElementById('case-studies');if(!section)return;
  const media=matchMedia('(prefers-reduced-motion: reduce)'),windowEl=section.querySelector('.case-window'),ring=section.querySelector('.case-ring');
  const intro=section.querySelector('.case-intro'),thumbnails=section.querySelector('.case-thumbnails'),dialog=document.getElementById('case-detail-dialog');
  let modalOpen=false,lastTrigger=null;
  function openCase(slug,trigger){
    const template=document.getElementById(`case-template-${slug}`);if(!template||!dialog)return;
    lastTrigger=trigger;dialog.querySelector('.case-modal-content').replaceChildren(template.content.cloneNode(true));
    dialog.querySelector('[data-case-modal-brand]').textContent=projects.find(project=>project.slug===slug)?.brand||'Case study';
    dialog.setAttribute('aria-labelledby',`case-title-${slug}`);modalOpen=true;stop();
    window.thruputScroll?.pause?.();document.documentElement.classList.add('case-detail-open');dialog.showModal();dialog.scrollTop=0;
  }
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const trigger=event.target.closest('[data-case-open]');if(!trigger||!section.contains(trigger))return;
    event.preventDefault();openCase(trigger.dataset.caseOpen,trigger);
  });
  dialog.querySelector('[data-case-close]').onclick=()=>dialog.close();
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{document.documentElement.classList.remove('case-detail-open');window.thruputScroll?.resume?.();modalOpen=false;dialog.querySelector('.case-modal-content').replaceChildren();lastTrigger?.focus({preventScroll:true});run();});
  if(!media.matches){
    thumbnails.classList.add('is-reveal-ready');
    const tileObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');tileObserver.unobserve(entry.target);}},{threshold:.1,rootMargin:'0px 0px -5% 0px'});
    thumbnails.querySelectorAll('.case-tile').forEach(tile=>tileObserver.observe(tile));
  }
  const original=[...ring.children],projects=original.map(card=>({slug:card.dataset.slug,brand:card.dataset.brand,line:card.dataset.line,href:card.querySelector('a').getAttribute('href')}));
  for(const card of original){const back=card.querySelector('a').cloneNode(true);back.classList.replace('case-front','case-back');card.append(back);}
  for(const card of original){const copy=card.cloneNode(true);copy.classList.add('is-copy');ring.append(copy);}
  const cards=[...ring.children],step=360/cards.length,pause=section.querySelector('[data-case-pause]'),status=section.querySelector('[data-case-status]');
  const clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t),wrap=(n,m)=>(n%m+m)%m;
  let radius=650,perspective=1070,start=0,span=1,angle=0,targetAngle=0,raf=0,last=0,visible=false,paused=false,focus=false,drag=null,cooldown=0,active=-1,lastPose='',ignoreClickUntil=0,measurePending=false;
  function measure(){
    measurePending=false;
    const width=innerWidth<700?Math.min(330,innerWidth*.58):Math.min(660,Math.max(380,innerWidth*.38)),height=width/1.5;
    radius=width/(2*Math.tan(Math.PI/cards.length))+20;perspective=radius*1.8;
    const rect=intro.getBoundingClientRect();start=rect.top+scrollY;span=Math.max(1,rect.height-innerHeight);
    ring.style.setProperty('--case-width',`${width}px`);ring.style.setProperty('--case-height',`${height}px`);windowEl.style.perspective=`${perspective}px`;
    cards.forEach((card,i)=>{card.style.transform=`rotateY(${i*step}deg) translateZ(${radius}px)`;});lastPose='';
  }
  function queueMeasure(){if(!measurePending){measurePending=true;requestAnimationFrame(measure);}}
  function syncPause(){pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',paused?'Play carousel motion':'Pause carousel motion');pause.textContent=paused?'Resume motion':'Pause motion';}
  function choose(index,announce=false){
    index=wrap(index,projects.length);if(index===active)return;active=index;const project=projects[index];
    if(announce)status.textContent=`${project.brand}. ${project.line}`;
  }
  function tick(now){
    raf=0;if(!visible||document.hidden||media.matches||modalOpen)return;
    const dt=last?Math.min((now-last)/1000,.05):0;last=now;
    if(!paused&&!focus&&!drag&&now>cooldown)targetAngle-=dt*12;
    angle=mix(angle,targetAngle,1-Math.exp(-dt*9));
    const progress=clamp((scrollY-start)/span),push=ease(clamp(progress/.85)),z=mix(-radius*.72,-radius*.36,push),tilt=mix(innerWidth<700?-24:-14,innerWidth<700?-7:-3,push);
    const pose=`translateZ(${z.toFixed(2)}px) rotateX(${tilt.toFixed(3)}deg) rotateY(${angle.toFixed(3)}deg)`;
    if(pose!==lastPose){
      ring.style.transform=pose;lastPose=pose;
      cards.forEach((card,i)=>{const theta=(i*step+angle)*Math.PI/180,depth=z+Math.cos(theta)*radius,opacity=clamp((perspective-70-depth)/130),value=opacity.toFixed(3);if(card.dataset.opacity!==value){card.style.opacity=value;card.style.pointerEvents=opacity>.4?'auto':'none';card.dataset.opacity=value;}});
      choose(Math.round(-angle/step));
    }
    raf=requestAnimationFrame(tick);
  }
  function run(){if(!raf&&visible&&!document.hidden&&!media.matches&&!modalOpen){last=0;raf=requestAnimationFrame(tick);}}
  function stop(){cancelAnimationFrame(raf);raf=0;last=0;}
  function configure(){
    section.classList.toggle('is-enhanced',!media.matches);
    cards.forEach((card,i)=>card.querySelectorAll('a').forEach(a=>{a.tabIndex=media.matches&&i<projects.length&&a.classList.contains('case-front')?0:-1;if(media.matches&&i<projects.length&&a.classList.contains('case-front'))a.removeAttribute('aria-hidden');else a.setAttribute('aria-hidden','true');}));
    if(media.matches){stop();windowEl.removeAttribute('tabindex');}else{windowEl.tabIndex=0;queueMeasure();run();}
  }
  function advance(direction){targetAngle=Math.round(targetAngle/step)*step-direction*step;cooldown=performance.now()+6500;choose(Math.round(-targetAngle/step),true);run();}
  pause.onclick=()=>{paused=!paused;if(!paused){focus=false;cooldown=0;}syncPause();run();};
  windowEl.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();advance(event.key==='ArrowRight'?1:-1);}else if(event.key==='Enter'){event.preventDefault();const link=original[active]?.querySelector('a');if(link)openCase(projects[active].slug,windowEl);}});
  windowEl.addEventListener('focusin',()=>{focus=true;});windowEl.addEventListener('focusout',event=>{focus=windowEl.contains(event.relatedTarget);});
  windowEl.addEventListener('pointerdown',event=>{if(event.button!==0||media.matches)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,angle:targetAngle,moved:false};});
  windowEl.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.moved&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){drag.moved=true;windowEl.setPointerCapture(event.pointerId);windowEl.classList.add('is-dragging');}if(drag.moved){event.preventDefault();targetAngle=drag.angle+dx*.13;cooldown=performance.now()+6500;}});
  function release(event){if(!drag||event.pointerId!==drag.id)return;if(drag.moved){ignoreClickUntil=performance.now()+300;if(windowEl.hasPointerCapture(event.pointerId))windowEl.releasePointerCapture(event.pointerId);}drag=null;windowEl.classList.remove('is-dragging');}
  windowEl.addEventListener('pointerup',release);windowEl.addEventListener('pointercancel',release);
  windowEl.addEventListener('click',event=>{if(performance.now()<ignoreClickUntil){event.preventDefault();event.stopPropagation();}},true);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)run();else stop();},{rootMargin:'100px'}).observe(intro);
  const observer=new ResizeObserver(queueMeasure);observer.observe(document.body);observer.observe(intro);
  addEventListener('resize',queueMeasure);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else run();});media.addEventListener('change',configure);
  syncPause();choose(0);configure();measure();
})();
