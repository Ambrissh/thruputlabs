(()=>{
'use strict';
const media=matchMedia('(prefers-reduced-motion: reduce)'),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=(a,b,t)=>{const v=clamp((t-a)/(b-a));return v*v*(3-2*v);};
let reduced=media.matches,botEntry=0;
// Scroll reveals use the same restrained word treatment as the opening screen.
const headlines=[...document.querySelectorAll('.reveal-lines')];
for(const heading of headlines){const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const node of nodes){const fragment=document.createDocumentFragment();for(const part of node.textContent.split(/(\s+)/)){if(!part)continue;if(/^\s+$/.test(part))fragment.append(document.createTextNode(part));else{const word=document.createElement('span');word.className='reveal-word';word.textContent=part;fragment.append(word);}}node.replaceWith(fragment);}}
const reveals=[...document.querySelectorAll('[data-reveal]')],aboutRows=[...document.querySelectorAll('[data-about-mode]')];
const headingEntries=headlines.map(element=>({element,words:[...element.querySelectorAll('.reveal-word')],about:!!element.closest('#about'),progress:-1}));
const revealEntries=reveals.map(element=>({element,bot:element.classList.contains('bot-scene'),progress:-1}));
const measured=[...new Set([...headlines,...reveals,...aboutRows])],geometry=new Map(),serviceProgress=new Map();
let scheduled=false,aboutActive=-1,layoutDirty=true,pageHeight=0;
function layoutTop(element){let top=0;for(let node=element;node;node=node.offsetParent)top+=node.offsetTop;return top;}
function measureLayout(){
  // offsetTop excludes our reveal transforms, so animation cannot invalidate these positions.
  for(const element of measured)geometry.set(element,{top:layoutTop(element),height:element.offsetHeight});
  pageHeight=document.documentElement.scrollHeight;layoutDirty=false;
}
function updateAbout(){
  let closest=0,distance=Infinity;const anchor=scrollY+innerHeight*.48;
  aboutRows.forEach((row,index)=>{
    const r=geometry.get(row),top=r.top-scrollY,progress=clamp((innerHeight*.82-top)/(innerHeight*.5)),d=Math.abs(r.top+r.height*.5-anchor);
    if(progress!==serviceProgress.get(row)){serviceProgress.set(row,progress);row.style.setProperty('--service-progress',String(progress));}
    if(d<distance){distance=d;closest=index;}
  });
  if(closest!==aboutActive){aboutActive=closest;aboutRows.forEach((row,index)=>row.classList.toggle('is-active',index===closest));window.dispatchEvent(new CustomEvent('thruput:service',{detail:{index:closest}}));}
}
function reveal(){
  scheduled=false;if(layoutDirty)measureLayout();
  const atEnd=scrollY+innerHeight>=pageHeight-3;
  for(const entry of headingEntries){
    const top=geometry.get(entry.element).top-scrollY,p=reduced||atEnd&&top<innerHeight?1.5:clamp((innerHeight*.92-top)/(innerHeight*.42));
    if(p===entry.progress)continue;entry.progress=p;
    entry.words.forEach((word,i)=>{const n=clamp((p-i/entry.words.length*.5)/.5);word.style.setProperty('--word-opacity',String((entry.about?.16:.24)+n*(entry.about?.84:.76)));word.style.setProperty('--word-y',`${(1-n)*(entry.about?22:10)}px`);word.style.setProperty('--word-blur',`${(1-n)*(entry.about?2.5:0)}px`);});
  }
  for(const entry of revealEntries){
    const top=geometry.get(entry.element).top-scrollY,n=reduced||atEnd&&top<innerHeight?1:clamp((innerHeight*.96-top)/(innerHeight*.25));
    if(entry.bot)botEntry=n;
    if(n===entry.progress)continue;entry.progress=n;
    entry.element.style.setProperty('--reveal-opacity',String(.25+n*.75));entry.element.style.setProperty('--reveal-y',`${(1-n)*18}px`);
  }
  updateAbout();
}
function queueReveal(){if(!scheduled){scheduled=true;requestAnimationFrame(reveal);}}
function invalidateLayout(){layoutDirty=true;queueReveal();}
document.documentElement.classList.add('motion-ready');
addEventListener('scroll',queueReveal,{passive:true});addEventListener('resize',invalidateLayout);
const layoutObserver=new ResizeObserver(invalidateLayout);layoutObserver.observe(document.body);for(const element of measured)layoutObserver.observe(element);
document.fonts?.ready.then(invalidateLayout);reveal();
// All art is drawn as live ASCII on transparent canvas; no image assets or panels.
// Glyph pixels keep their original font and colour; animation only copies sprites.
function glyphAtlas(font,glyphs,colors,dpr){const sheet=document.createElement('canvas'),ink=sheet.getContext('2d'),pixels=Math.ceil((parseFloat(font)*1.8+4)*dpr),pitch=pixels/dpr;sheet.width=pixels*glyphs.length;sheet.height=pixels*colors.length;ink.setTransform(dpr,0,0,dpr,0,0);ink.font=font;ink.textAlign='center';ink.textBaseline='middle';colors.forEach((color,b)=>{ink.fillStyle=color;for(let g=0;g<glyphs.length;g++)ink.fillText(glyphs[g],(g+.5)*pitch,(b+.5)*pitch);});return{draw(ctx,g,b,x,y){ctx.drawImage(sheet,g*pixels,b*pixels,pixels,pixels,x-pitch/2,y-pitch/2,pitch,pitch);}};}
function surface(canvas,dotMode=false){const ctx=canvas.getContext('2d'),raw=document.createElement('canvas'),ink=raw.getContext('2d',{willReadFrequently:true});let w=1,h=1,cols=1,rows=1,cw=1,ch=1,atlas;const palette=['#4e5b40','#71835a','#96ab79','#b6c99c','#d6dfc3','#cc8b60'],glyphs=dotMode?' .·:oO@':' .,:;rsX235hMH#@';return{resize(){const r=canvas.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);cols=Math.max(65,Math.min(280,Math.round(w/(dotMode?5:4.6))));cw=w/cols;ch=cw*1.42;rows=Math.max(10,Math.round(h/ch));raw.width=cols;raw.height=rows;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);atlas=glyphAtlas(`${ch*1.08}px "Helvetica Neue",Helvetica,Arial,sans-serif`,glyphs,palette,dpr);},get width(){return w;},get height(){return h;},paint(draw){if(!atlas)return;ink.setTransform(1,0,0,1,0,0);ink.clearRect(0,0,cols,rows);ink.setTransform(cols/w,0,0,rows/h,0,0);draw(ink,w,h);const data=ink.getImageData(0,0,cols,rows).data;ctx.clearRect(0,0,w,h);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=(y*cols+x)*4;if(data[i+3]<25)continue;const bright=(data[i]*.25+data[i+1]*.65+data[i+2]*.1)/255,accent=data[i]>data[i+1]*1.13&&data[i]>110,bucket=accent?5:Math.min(4,Math.floor(bright*5));atlas.draw(ctx,Math.max(1,Math.floor(bright*(glyphs.length-1))),bucket,(x+.5)*cw,(y+.5)*ch);}}};}
function rect(c,x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();}function circle(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}function line(c,x,y,x2,y2,n,color){c.strokeStyle=color;c.lineWidth=n;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
const reviews=[{brand:'Ayini Boutique',place:'Tamil Nadu',quote:'Local service pages, search foundations and an AI-discovery roadmap.'},{brand:'PK TEX',place:'Tamil Nadu',quote:'A saree catalogue connected to product-specific WhatsApp enquiries.'},{brand:'PS4 Gaming Lounge',place:'Thanjavur, Tamil Nadu',quote:'Games, offers, pricing and booking information in one website.'},{brand:'Surprise Bro’s',place:'Tamil Nadu',quote:'Billing, events, attendance and salary records in one workspace.'},{brand:'Sigaram Physio',place:'Thanjavur, Tamil Nadu',quote:'Local search foundations and an English–Tamil clinic website.'}];
const relayCanvas=document.getElementById('robot-relay'),relay=surface(relayCanvas),stage=document.querySelector('.hand-relay'),pause=relayCanvas,cardTemplate=document.querySelector('.hand-review').cloneNode(true);
const PASS_START=1.55,PASS_END=2.20,CYCLE=2.35;
let reviewIndex=0,reviewTime=0,paused=reduced,relayVisible=false,cardWidth=340,count=3,cards=[],cardHeights=[];
const cardSizeObserver=new ResizeObserver(entries=>{for(const entry of entries){const index=cards.indexOf(entry.target);if(index<0)continue;const size=Array.isArray(entry.borderBoxSize)?entry.borderBoxSize[0]:entry.borderBoxSize;cardHeights[index]=size?.blockSize||entry.target.offsetHeight;}});
function makeCards(){cardSizeObserver.disconnect();stage.querySelectorAll('.hand-review').forEach(card=>card.remove());cards=[];for(let slot=-1;slot<count;slot++){const card=cardTemplate.cloneNode(true);card.setAttribute('aria-hidden',String(slot===-1));stage.append(card);cards.push(card);cardSizeObserver.observe(card);}showReviews();}
function showReviews(announce=false){cards.forEach((card,i)=>{const r=reviews[(reviewIndex+i-1+reviews.length)%reviews.length];card.querySelector('.review-brand').textContent=r.brand;card.querySelector('.review-quote').textContent=r.quote;card.querySelector('.review-location').textContent=r.place;});}
function sync(){pause.setAttribute('aria-label',`${paused?'Play':'Pause'} the simultaneous ASCII robot handoffs`);pause.setAttribute('aria-pressed',String(paused));}function toggleRelay(){paused=!paused;sync();syncMotion();}pause.onclick=toggleRelay;pause.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleRelay();}});sync();
function drawRobot(c,x,base,scale,time,grips,index){const y=base-166*scale;const p=(a,b)=>[x+a*scale,y+b*scale];
 // Solid, articulated machine with a square head and visible piston joints.
 for(const side of [-1,1]){let q=p(side*17,123);rect(c,q[0]-6*scale,q[1],12*scale,36*scale,'#82966b',2*scale);circle(c,q[0],q[1]+15*scale,8*scale,'#b9c59e');q=p(side*17,156);rect(c,q[0]-15*scale,q[1],31*scale,9*scale,'#a7bb8a',2*scale);}
 let q=p(-37,61);rect(c,q[0],q[1],74*scale,66*scale,'#899e71',8*scale);q=p(-30,65);rect(c,q[0],q[1],60*scale,50*scale,'#aabd91',5*scale);q=p(-22,74);rect(c,q[0],q[1],44*scale,18*scale,'#35482d',3*scale);for(let k=0;k<4;k++){q=p(-16+k*9,79);rect(c,q[0],q[1],5*scale,8*scale,k===0?'#cc8958':'#c0d0a4');}for(let k=0;k<3;k++){q=p(-19,103+k*5);line(c,q[0],q[1],q[0]+38*scale,q[1],2*scale,'#566d44');}
 q=p(-8,49);rect(c,q[0],q[1],16*scale,15*scale,'#7d9365');const tilt=Math.sin(time*1.8-index)*2; q=p(-30,7+tilt);rect(c,q[0],q[1],60*scale,45*scale,'#bdc9a7',6*scale);q=p(-24,15+tilt);rect(c,q[0],q[1],48*scale,23*scale,'#34472b',4*scale);const blink=Math.sin(time*2.8+index)>.985?2:7;for(const side of [-1,1]){q=p(side*12-4,26-blink/2+tilt);rect(c,q[0],q[1],8*scale,blink*scale,'#e4e8cd',2*scale);}q=p(-8,44+tilt);line(c,q[0],q[1],q[0]+16*scale,q[1],2*scale,'#546b3e');q=p(0,7);line(c,q[0],q[1],q[0]+4*scale,q[1]-12*scale,2*scale,'#a5b98a');circle(c,q[0]+4*scale,q[1]-14*scale,4*scale,'#c98658');
 // The fingertips terminate at the review's two bottom corners.
 for(const side of [-1,1]){const shoulder=p(side*39,71),rest=p(side*63,32),grip=grips[side===-1?0:1]||rest,ex=lerp(shoulder[0],grip[0],.5)+side*13*scale,ey=lerp(shoulder[1],grip[1],.5)+12*scale;line(c,shoulder[0],shoulder[1],ex,ey,13*scale,'#647e4e');line(c,shoulder[0]-2*scale,shoulder[1],ex-2*scale,ey,4*scale,'#c4d1ab');circle(c,shoulder[0],shoulder[1],10*scale,'#b6c59a');circle(c,ex,ey,8*scale,'#b4c49a');circle(c,ex,ey,3*scale,'#4d683a');line(c,ex,ey,grip[0],grip[1]+7*scale,10*scale,'#94ac77');line(c,ex-2*scale,ey,grip[0]-2*scale,grip[1]+7*scale,3*scale,'#d0d9b6');circle(c,grip[0],grip[1]+6*scale,6*scale,'#c2d0a6');line(c,grip[0]-6*scale,grip[1]+5*scale,grip[0]-6*scale,grip[1]-3*scale,3*scale,'#dce1c2');line(c,grip[0]+6*scale,grip[1]+5*scale,grip[0]+6*scale,grip[1]-3*scale,3*scale,'#dce1c2');}}
function drawRelay(){if(!cards.length)return;const w=relay.width,h=relay.height,mobile=w<700,t=reviewTime,p=reduced?0:smooth(PASS_START,PASS_END,t),step=w/count,start=step*.5,top=mobile?27:30;
 const poses=[];cards.forEach((card,i)=>{const x=start+(i-1+p)*step,left=x-cardWidth/2,y=Math.sin(t*5+i*.5)*1.5;card.style.transform=`translate3d(${left}px,${y}px,0)`;card.style.opacity='1';poses.push({left,right:left+cardWidth,y:top+cardHeights[i]+y});});
 relay.paint(c=>{const scale=mobile?.76:Math.min(1.12,w/1100),base=h-16;for(let i=0;i<count;i++){const rx=start+i*step,own=poses[i+1],incoming=poses[i],restY=base-134*scale;
 let grips;if(p===0)grips=[[own.left+4,own.y],[own.right-4,own.y]];else{const catchLeft=smooth(.05,.35,p),settle=smooth(.62,1,p),outgoingGrip=lerp(own.right-4,own.left+4,smooth(0,.35,p)),incomingGrip=lerp(incoming.right-4,incoming.left+4,settle);grips=[[lerp(own.left+4,incomingGrip,catchLeft),lerp(own.y,incoming.y,catchLeft)],[lerp(outgoingGrip,incoming.right-4,smooth(.65,1,p)),lerp(own.y,incoming.y,smooth(.65,1,p))]];}
 drawRobot(c,rx,base,scale,t*2.1,grips,i);}line(c,w*.025,h-5,w*.975,h-5,1,'#6f7052');});}
function resizeRelay(){relay.resize();const next=relay.width<700?2:3;sync();if(next!==count||!cards.length){count=next;makeCards();}cardWidth=relay.width/count*.88;for(const card of cards)card.style.width=`${cardWidth}px`;cardHeights=cards.map(card=>card.offsetHeight);drawRelay();}new ResizeObserver(resizeRelay).observe(relayCanvas);new IntersectionObserver(([e])=>{relayVisible=e.isIntersecting;syncMotion();}).observe(relayCanvas);
const botCanvas=document.getElementById('dot-bot'),botCtx=botCanvas.getContext('2d'),botPause=botCanvas;
let botVisible=false,botTime=0,botCaption=-1,botPaused=reduced,botWidth=1,botHeight=1,morphPosition=reduced?Math.max(0,aboutActive):0,morphGoal=Math.max(0,aboutActive),botAtlas=null;

// Equal-sized point clouds morph into one another, rather than swapping images.
function targetCloud(mode){const buffer=document.createElement('canvas');buffer.width=120;buffer.height=100;const c=buffer.getContext('2d',{willReadFrequently:true});
 if(mode===0){rect(c,34,23,52,43,'#9aab8b',15);rect(c,37,25,46,38,'#c7cdb7',13);rect(c,45,37,7,10,'#263423',3);rect(c,68,37,7,10,'#263423',3);line(c,43,32,53,31,1.7,'#67765c');line(c,67,31,77,34,1.7,'#67765c');c.strokeStyle='#354530';c.lineWidth=1.6;c.beginPath();c.moveTo(51,52);c.quadraticCurveTo(61,61,72,50);c.stroke();line(c,35,50,27,61,2,'#91a17e');circle(c,25,64,3,'#c2ccb0');line(c,85,46,94,38,2,'#bc885f');circle(c,96,35,3,'#d0c5aa');for(let i=0;i<3;i++)circle(c,78+i*7,18-i*4,1+i*.2,i===2?'#c58a60':'#a6b592');}
 if(mode===1){c.fillStyle='#8b9a7d';c.beginPath();c.moveTo(30,90);c.bezierCurveTo(31,68,40,61,52,59);c.lineTo(68,59);c.bezierCurveTo(82,62,88,72,90,90);c.closePath();c.fill();rect(c,53,48,14,18,'#b8c0a7',5);c.fillStyle='#cbd0bb';c.beginPath();c.ellipse(60,34,15,21,0,0,Math.PI*2);c.fill();c.fillStyle='#a9b59b';c.beginPath();c.ellipse(46,35,2.8,5,0,0,Math.PI*2);c.ellipse(74,35,2.8,5,0,0,Math.PI*2);c.fill();c.fillStyle='#697a5c';c.beginPath();c.moveTo(45,31);c.bezierCurveTo(41,15,51,9,64,12);c.bezierCurveTo(79,9,80,22,74,30);c.lineTo(69,21);c.quadraticCurveTo(59,26,48,23);c.closePath();c.fill();for(const x of [54,66]){line(c,x-3,30,x+3,29,1.3,'#4c5c42');rect(c,x-1.5,33,3,2.5,'#263623',1);}line(c,60,35,58,41,1.2,'#8a9979');c.strokeStyle='#57694b';c.lineWidth=1.2;c.beginPath();c.moveTo(55,46);c.quadraticCurveTo(61,50,67,44);c.stroke();c.strokeStyle='#b77e57';c.lineWidth=1.4;c.beginPath();c.moveTo(49,61);c.quadraticCurveTo(60,73,71,61);c.stroke();line(c,79,67,85,79,1.2,'#c38a60');}
 if(mode===2){for(let i=0;i<3;i++)circle(c,35+i*25,46,5.8,i===2?'#c38a60':'#c0c9af');}
 if(mode===3){c.strokeStyle='#bec8ad';c.lineWidth=4.5;c.beginPath();c.arc(56,39,23,0,Math.PI*2);c.stroke();line(c,73,56,91,76,6,'#bf885e');line(c,44,30,68,30,2,'#b8c5a4');line(c,44,39,65,39,2,'#b8c5a4');line(c,44,48,60,48,2,'#c38b60');}
 const d=c.getImageData(0,0,120,100).data,points=[];for(let y=0;y<100;y++)for(let x=0;x<120;x++){const i=(y*120+x)*4;if(d[i+3]<130)continue;points.push({x:x-60,y:y-48,l:(d[i]*.25+d[i+1]*.65+d[i+2]*.1)/255,w:d[i]>d[i+1]*1.13});}points.sort((a,b)=>Math.atan2(a.y,a.x)-Math.atan2(b.y,b.x)||Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y));return Array.from({length:2200},(_,i)=>points[Math.min(points.length-1,Math.floor((i+.5)/2200*points.length))]);}
const targets=[targetCloud(0),targetCloud(1),targetCloud(2),targetCloud(3)],metal=['#616e56','#89977b','#a9b69b','#c5cdb8','#e0e2ce'],morphGlyphs='·.:oO@';
function drawBot(){if(!botAtlas)return;const t=botTime,mobile=botWidth<450,slot=t/3.2,mode=mobile?Math.floor(slot)%4:Math.min(3,Math.floor(morphPosition)),next=mobile?(mode+1)%4:Math.min(3,mode+1),local=slot%1,p=reduced?0:mobile?smooth(.49,.87,local):smooth(0,1,morphPosition-mode),from=targets[mode],to=targets[next],unit=Math.min(botWidth/96,botHeight/88)*1.07,cx=botWidth*.5,cy=botHeight*.47,bob=Math.sin(t*2)*3,angle=Math.sin(t*.8)*.035,cos=Math.cos(angle),sin=Math.sin(angle),burst=Math.sin(Math.PI*p),entry=1-botEntry;
 botCtx.clearRect(0,0,botWidth,botHeight);
 for(let i=0;i<from.length;i++){const a=from[i],b=to[i],l=lerp(a.l,b.l,p),warm=(p<.5?a.w:b.w)||(i%19===0),bucket=warm?5:Math.min(4,Math.floor(l*5));let x=lerp(a.x,b.x,p),y=lerp(a.y,b.y,p);const scatter=burst*2.8+entry*11;x+=Math.sin(i*2.399+t*.3)*scatter;y+=Math.cos(i*1.618+t*.2)*scatter;if(mode===2&&p<.1){const cluster=Math.round((a.x+25)/25);y+=Math.sin(t*4-cluster*.85)*2;}const px=cx+(x*cos-y*sin)*unit,py=cy+(x*sin+y*cos)*unit+bob;botAtlas.draw(botCtx,Math.min(5,Math.max(0,Math.floor(l*5))),bucket,px,py);}
 }
function resizeBot(){const r=botCanvas.getBoundingClientRect();botWidth=Math.max(1,r.width);botHeight=Math.max(1,r.height);const dpr=Math.min(devicePixelRatio||1,2);botCanvas.width=Math.round(botWidth*dpr);botCanvas.height=Math.round(botHeight*dpr);botCtx.setTransform(dpr,0,0,dpr,0,0);const fontSize=Math.max(6.5,Math.min(botWidth/96,botHeight/88)*1.07*1.72);botAtlas=glyphAtlas(`${fontSize}px "Helvetica Neue",Helvetica,Arial,sans-serif`,morphGlyphs,[...metal,"#ca895e"],dpr);drawBot();}
function syncBot(){botPause.setAttribute('aria-pressed',String(botPaused));botPause.setAttribute('aria-label',`${botPaused?'Play':'Pause'} the ASCII character transformations`);}function toggleBot(){botPaused=!botPaused;syncBot();syncMotion();}botPause.onclick=toggleBot;botPause.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleBot();}});syncBot();
window.addEventListener('thruput:service',event=>{const index=Number(event.detail.index);if(!Number.isFinite(index))return;morphGoal=clamp(index,0,3);if(reduced){morphPosition=morphGoal;drawBot();}});
new ResizeObserver(resizeBot).observe(botCanvas);new IntersectionObserver(([e])=>{botVisible=e.isIntersecting;syncMotion();}).observe(botCanvas);
// Scene animation lifecycle: one loop only while a visible scene is playing.
let sceneFrame=0,last=0;
function wantsMotion(){return !document.hidden&&((relayVisible&&!paused)||(botVisible&&!botPaused));}
function runScenes(){if(!sceneFrame&&wantsMotion()){last=0;sceneFrame=requestAnimationFrame(tick);}}
function stopScenes(){cancelAnimationFrame(sceneFrame);sceneFrame=0;last=0;}
function syncMotion(){if(wantsMotion())runScenes();else stopScenes();}
function tick(now){sceneFrame=0;if(!wantsMotion())return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;
if(relayVisible&&!paused){reviewTime+=dt;if(reviewTime>=CYCLE){reviewTime-=CYCLE;reviewIndex=(reviewIndex-1+reviews.length)%reviews.length;showReviews();}drawRelay();}
if(botVisible&&!botPaused){botTime+=dt;morphPosition=lerp(morphPosition,morphGoal,1-Math.exp(-dt*7));if(Math.abs(morphGoal-morphPosition)<.002)morphPosition=morphGoal;drawBot();}
sceneFrame=requestAnimationFrame(tick);}
document.addEventListener('visibilitychange',syncMotion);addEventListener('pagehide',stopScenes);addEventListener('pageshow',syncMotion);syncMotion();
media.addEventListener('change',e=>{reduced=e.matches;if(reduced){paused=true;botPaused=true;}sync();syncBot();syncMotion();queueReveal();drawRelay();drawBot();});
})();
