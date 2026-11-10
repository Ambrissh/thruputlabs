// Run with: node scripts/check-scroll-performance.cjs
// Exercises the real scroll callbacks with a DOM that records synchronous
// style/geometry interleaving. Browser frame-rate QA is still required.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.argv[2]||require('node:path').resolve(__dirname,'..');
let dirty=false,flushes=0,reads=0,writes=0;const events={},frames=[];
const read=()=>{reads++;if(dirty){flushes++;dirty=false}};
const style=()=>{const props=new Map();return new Proxy({getPropertyValue:k=>props.get(k),setProperty(k,v){if(props.get(k)!==v){writes++;dirty=true;props.set(k,v)}}},{set(o,k,v){if(o[k]!==v){writes++;dirty=true;o[k]=v}return true}})};
class Element{
 constructor(top=0,height=80,classes=[]){this.top=top;this.height=height;this.style=style();this.words=[];this.dataset={};this.textContent='';this.offsetParent=null;this.classList={contains:n=>classes.includes(n),add:n=>{if(!classes.includes(n)){classes.push(n);dirty=true}},toggle(n,on){const had=classes.includes(n);if(on&&!had){classes.push(n);dirty=true}else if(!on&&had){classes.splice(classes.indexOf(n),1);dirty=true}}};}
 get offsetTop(){read();return this.top}get offsetHeight(){read();return this.height}
 getBoundingClientRect(){read();return{top:this.top-context.scrollY,height:this.height,bottom:this.top+this.height-context.scrollY,width:1400}}
 querySelectorAll(){return this.words}closest(){return this.top>2000?{}:null}setAttribute(){}
}
const hero=new Element(0,1700),support=new Element(),bar=new Element(),cue=new Element(),wordmark=new Element();
const heroWords=Array.from({length:16},()=>new Element());
const headlines=[new Element(1800),new Element(2400,230),...Array.from({length:4},(_,i)=>new Element(3000+i*430,100)),new Element(4800,150)];
headlines.forEach(h=>h.words=Array.from({length:6},()=>new Element()));
const reveals=Array.from({length:9},(_,i)=>new Element(1700+i*410,300,i===4?['bot-scene']:[]));
const rows=Array.from({length:4},(_,i)=>new Element(3000+i*430,430));
const documentElement=new Element();Object.defineProperty(documentElement,'scrollHeight',{get(){read();return 6200}});
const doc={documentElement,body:new Element(),querySelector:s=>s==='.scroll-story'?hero:s==='.support-copy'?support:s==='.scroll-progress>span'?bar:s==='.scroll-cue'?cue:wordmark,querySelectorAll:s=>s==='.scroll-copy span'?heroWords:s==='.reveal-lines'?headlines:s==='[data-about-mode]'?rows:reveals,createTreeWalker:()=>({nextNode:()=>false}),fonts:{ready:new Promise(()=>{})},};
const context={document:doc,window:null,innerHeight:800,scrollY:0,NodeFilter:{SHOW_TEXT:4},matchMedia:()=>({matches:false,addEventListener(){}}),requestAnimationFrame:f=>frames.push(f),addEventListener:(type,f)=>(events[type]??=[]).push(f),dispatchEvent(){},CustomEvent:class{},ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},console};context.window=context;
vm.createContext(context);
let app=fs.readFileSync(root+'/dist/app.js','utf8').split('const nav=')[0]+'})();';
let sections=fs.readFileSync(root+'/dist/sections.js','utf8').split('// All art is drawn')[0]+'})();';
vm.runInContext(app,context);vm.runInContext(sections,context);
for(const f of frames.splice(0))f();
assert.ok(Number(heroWords[0].style.opacity)>Number(heroWords.at(-1).style.opacity),'Hero words should reveal in sequence');
const reports=[];
for(const position of [180,900,1600,2600,3300,4300,5200]){context.scrollY=position;dirty=false;flushes=reads=writes=0;for(const cb of events.scroll||[])cb();for(const cb of frames.splice(0))cb();reports.push({position,flushes,reads,writes});}

const total=reports.reduce((sum,r)=>sum+r.flushes,0);console.log(`Scroll read-after-write style flushes: ${total}`);
assert.equal(total,0,'Scroll updates must not alternate style writes with synchronous geometry reads');

assert.equal(reports.reduce((sum,r)=>sum+r.reads,0),0,'Steady scroll frames should use cached geometry');
for(const heading of headlines)for(const word of heading.words){
 assert.equal(Number(word.style.getPropertyValue('--word-opacity')),1,'Completed headings remain readable');
 assert.equal(word.style.getPropertyValue('--word-y'),'0px','Completed headings finish at their original position');
}
context.scrollY=5200;dirty=false;writes=0;
for(const cb of events.scroll||[])cb();for(const cb of frames.splice(0))cb();
assert.equal(writes,0,'Unchanged progress must not rewrite visual styles');
// A viewport/layout change must invalidate the cache, then return to read-free scrolling.
rows[3].height=500;
for(const cb of events.resize||[])cb();for(const cb of frames.splice(0))cb();
context.scrollY=4200;dirty=false;reads=0;
for(const cb of events.scroll||[])cb();for(const cb of frames.splice(0))cb();
assert.equal(reads,0,'Geometry must remain cached after a resize');
const relaySource=fs.readFileSync(root+'/dist/sections.js','utf8');
let relayReads=0;
const cards=Array.from({length:4},()=>({style:{},get offsetHeight(){relayReads++;return 190}}));
const clamp=v=>Math.max(0,Math.min(1,v)),relayContext={relay:{width:1350,height:420,paint:draw=>draw({})},cards,cardHeights:[180,190,200,210],reviewTime:0,count:3,reduced:false,cardWidth:396,PASS_START:1.55,PASS_END:2.2,smooth:(a,b,t)=>{let v=clamp((t-a)/(b-a));return v*v*(3-2*v)},lerp:(a,b,t)=>a+(b-a)*t,line(){},drawRobot(){}};
vm.createContext(relayContext);vm.runInContext(relaySource.slice(relaySource.indexOf('function drawRelay()'),relaySource.indexOf('function resizeRelay()')),relayContext);
for(const time of [0,1.55,1.85,2.2]){relayContext.reviewTime=time;vm.runInContext('drawRelay()',relayContext);}
assert.equal(relayReads,0,'Robot handoffs must not measure cards during animation');
console.log('PASS: cached scroll geometry, reveal completion, resize refresh, unchanged-frame reuse, and robot handoffs.');

// Updating project text during a handoff must not force synchronous layout.
const handoffSource=fs.readFileSync(root+'/dist/sections.js','utf8');let handoffReads=0;
const handoffCards=Array.from({length:3},()=>({querySelector:()=>({textContent:''}),get offsetHeight(){handoffReads++;return 190}}));
const handoffContext={cards:handoffCards,reviews:[{brand:'Client',quote:'Project detail',place:'Location'}],reviewIndex:0,cardHeights:[190,190,190]};
vm.createContext(handoffContext);vm.runInContext(handoffSource.slice(handoffSource.indexOf('function showReviews('),handoffSource.indexOf('function sync(){',handoffSource.indexOf('function showReviews('))),handoffContext);
vm.runInContext('showReviews()',handoffContext);assert.equal(handoffReads,0,'Project-text handoffs must use asynchronously cached card heights');
console.log('PASS: changing robot project cards does not synchronously remeasure their layout.');
