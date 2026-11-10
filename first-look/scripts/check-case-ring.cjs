// Run the production ring controller with a simulated layout and animation clock.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(root+'/dist/cases.js','utf8'),projects=JSON.parse(fs.readFileSync(root+'/content/case-studies.json','utf8'));
class Element{
 constructor(classes=[]){this.classes=new Set(classes);this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x),replace:(a,b)=>{this.classes.delete(a);this.classes.add(b)},toggle:(x,b)=>b?this.classes.add(x):this.classes.delete(x)};this.style={setProperty(k,v){this[k]=v}};this.dataset={};this.listeners={};this.children=[];this.attrs={};this.textContent='';}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f)}
 emit(k,e={}){for(const f of this.listeners[k]||[])f(e)}
 setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}getAttribute(k){return this.attrs[k]}
 append(node){this.children.push(node)}
 querySelector(s){return this.querySelectorAll(s)[0]}
 querySelectorAll(s){if(s==='a')return this.children.filter(x=>x.classes.has('case-front')||x.classes.has('case-back'));return[]}
 cloneNode(){const copy=new Element([...this.classes]);copy.dataset={...this.dataset};copy.attrs={...this.attrs};copy.children=this.children.map(x=>x.cloneNode());return copy}
 contains(node){return this===node||this.children.some(x=>x.contains(node))}
 focus(){this.focused=true}setPointerCapture(id){this.captured=id}hasPointerCapture(id){return this.captured===id}releasePointerCapture(){this.captured=null}
}
function create(width,reduced=false){
 let now=0,frameID=0,opened='',reads=0;const frames=new Map(),observers=[];
 const ring=new Element(),windowEl=new Element(),intro=new Element(),tiles=new Element(),pause=new Element(),status=new Element(),dialog=new Element(),section=new Element();
 for(const item of projects){const orbit=new Element(),link=new Element(['case-front']);orbit.dataset={slug:item.slug,brand:item.brand,line:item.line};link.attrs.href='case-studies/'+item.slug+'.html';link.dataset.caseOpen=item.slug;orbit.append(link);ring.append(orbit)}
 windowEl.append(ring);section.append(windowEl);
 const close=new Element(),content=new Element(),brand=new Element();content.replaceChildren=()=>{};
 dialog.querySelector=s=>s==='.case-modal-content'?content:s==='[data-case-modal-brand]'?brand:close;dialog.showModal=()=>opened=dialog.attrs['aria-labelledby'];dialog.close=()=>dialog.emit('close');
 section.querySelector=s=>({'.case-window':windowEl,'.case-ring':ring,'.case-intro':intro,'.case-thumbnails':tiles,'[data-case-pause]':pause,'[data-case-status]':status}[s]);tiles.querySelectorAll=()=>[];
 intro.getBoundingClientRect=()=>{reads++;return{top:0,height:800*1.85}};
 const media={matches:reduced,addEventListener(k,f){this.change=f}},document=new Element();document.body=new Element();document.documentElement=new Element();document.getElementById=id=>id==='case-studies'?section:id==='case-detail-dialog'?dialog:{content:{cloneNode:()=>({})}};
 const context={document,window:null,innerWidth:width,innerHeight:800,scrollY:0,matchMedia:()=>media,performance:{now:()=>now},requestAnimationFrame:fn=>{frames.set(++frameID,fn);return frameID},cancelAnimationFrame:id=>frames.delete(id),addEventListener(){},IntersectionObserver:class{constructor(fn,options){this.fn=fn;this.options=options;observers.push(this)}observe(){}unobserve(){}},ResizeObserver:class{observe(){}},console};context.window=context;
 vm.createContext(context);vm.runInContext(source,context);
 function frame(dt=16.67){now+=dt;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(f=>f(now))}
 function framesFor(count){for(let i=0;i<count;i++)frame()}
 return{context,media,ring,windowEl,intro,section,pause,status,dialog,observers,frame,framesFor,get reads(){return reads},get opened(){return opened},get pending(){return frames.size}};
}
for(const width of [412,1470]){
 const app=create(width);assert.equal(app.ring.children.length,10,'The circular gallery needs a complete ring with front and back faces');
 app.observers.find(x=>x.options.rootMargin==='100px').fn([{isIntersecting:true}]);app.frame();app.frame();const first=app.ring.style.transform,reads=app.reads;
 app.framesFor(90);assert.notEqual(app.ring.style.transform,first,'The gallery must spin automatically without pointer movement');assert.equal(app.reads,reads,'Animation frames must not remeasure layout');
 app.pause.onclick();app.framesFor(180);const paused=app.ring.style.transform;app.framesFor(30);assert.equal(app.ring.style.transform,paused,'Paused rotation should settle and stop');
 app.windowEl.emit('focusin');app.pause.onclick();app.framesFor(30);assert.notEqual(app.ring.style.transform,paused,'Explicit Resume must work even while a control retains focus');
 app.windowEl.emit('keydown',{key:'ArrowRight',preventDefault(){}});const selected=projects.find(p=>app.status.textContent.startsWith(p.brand+'.'));assert.ok(selected,'Keyboard navigation should announce the selected project');
 app.windowEl.emit('keydown',{key:'Enter',preventDefault(){}});assert.equal(app.opened,'case-title-'+selected.slug,'Enter must open the selected story on-page');
 app.dialog.close();app.context.scrollY=450;app.framesFor(3);assert.ok(!/NaN|Infinity/.test(app.ring.style.transform));
 app.observers.find(x=>x.options.rootMargin==='100px').fn([{isIntersecting:false}]);app.frame();assert.equal(app.pending,0,'Off-screen rotation must stop');
 app.media.matches=true;app.media.change();assert.equal(app.section.classes.has('is-enhanced'),false,'Reduced motion must show the static project gallery');
}
console.log('PASS: desktop/mobile automatic rotation, pause/resume with focus, keyboard story selection, cached geometry, off-screen stop and reduced-motion fallback.');

// Project every card corner through the CSS camera, including yaw and tilt.
// The camera must stay clear of all card surfaces throughout the scroll.
function checkCameraClearance(app){
 const values=[...app.ring.style.transform.matchAll(/(?:translateZ|rotateX|rotateY)\(([-\d.]+)/g)].map(m=>Number(m[1]));
 assert.equal(values.length,3);const [z,tiltDeg,yawDeg]=values,tilt=tiltDeg*Math.PI/180,yaw=yawDeg*Math.PI/180;
 const width=parseFloat(app.ring.style['--case-width']),height=parseFloat(app.ring.style['--case-height']),perspective=parseFloat(app.windowEl.style.perspective);
 for(const card of app.ring.children){
  const theta=Number(card.style.transform.match(/rotateY\(([-\d.]+)/)[1])*Math.PI/180,radius=Number(card.style.transform.match(/translateZ\(([-\d.]+)/)[1]);
  for(const x of [-width/2,width/2])for(const y of [-height/2,height/2]){
   const localX=Math.cos(theta)*x+Math.sin(theta)*radius,localZ=-Math.sin(theta)*x+Math.cos(theta)*radius;
   const rotatedZ=-Math.sin(yaw)*localX+Math.cos(yaw)*localZ;
   const depth=z+Math.sin(tilt)*y+Math.cos(tilt)*rotatedZ;
   const magnification=perspective/(perspective-depth);
   assert.ok(Number.isFinite(magnification)&&magnification>0&&magnification<2,'Every card corner must stay readable and clear of the camera, including during scroll expansion');
  }
 }
}
for(const width of [412,1470]){
 const app=create(width);app.observers.find(x=>x.options.rootMargin==='100px').fn([{isIntersecting:true}]);app.framesFor(2);app.pause.onclick();
 for(const progress of [0,.25,.5,.75,1]){
  app.context.scrollY=680*progress;
  for(let turn=0;turn<10;turn++){
   app.windowEl.emit('keydown',{key:'ArrowRight',preventDefault(){}});app.framesFor(100);checkCameraClearance(app);
  }
 }
}
console.log('PASS: all card corners remain below 2× magnification throughout a full rotation at every scroll stage on desktop and mobile.');
