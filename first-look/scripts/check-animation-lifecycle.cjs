// Check the real ASCII animation stops scheduling frames when it cannot be seen.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
function setup(reduced=false){
 const frames=new Map(),intersections=[],resizes=[],listeners={},canvasEvents={};let id=0,draws=0,shaped=0,copied=0;
 const media={matches:reduced,addEventListener(name,callback){this.change=callback}};
 const ctx={setTransform(){},clearRect(){draws++;},fillText(){},drawImage(){copied++;}},canvas={getContext:()=>ctx,getBoundingClientRect:()=>({width:700,height:460}),setAttribute(){},addEventListener:(name,callback)=>canvasEvents[name]=callback};
 const document={hidden:false,getElementById:()=>canvas,createElement:()=>({getContext:()=>({setTransform(){},fillText(){shaped++;}})}),addEventListener:(name,callback)=>listeners[name]=callback};
 const context={document,window:null,devicePixelRatio:2,matchMedia:()=>media,requestAnimationFrame:callback=>{frames.set(++id,callback);return id},cancelAnimationFrame:key=>frames.delete(key),addEventListener:(name,callback)=>listeners[name]=callback,IntersectionObserver:class{constructor(callback){intersections.push(callback)}observe(){}},ResizeObserver:class{constructor(callback){resizes.push(callback)}observe(){}},console};context.window=context;
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../dist/ascii.js'),'utf8'),context);
 return{frames,canvas,intersections,listeners,media,document,resizes,get draws(){return draws;},get shaped(){return shaped;},get copied(){return copied;}};
}
const app=setup();app.intersections[0]([{isIntersecting:false}]);
assert.equal(app.frames.size,0,'The off-screen ASCII worker must not keep an animation callback alive');
app.intersections[0]([{isIntersecting:true}]);assert.equal(app.frames.size,1,'Visible ASCII motion should resume with exactly one loop');
app.canvas.onclick();assert.equal(app.frames.size,0,'Pausing should release the frame loop');app.canvas.onclick();assert.equal(app.frames.size,1);
app.document.hidden=true;app.listeners.visibilitychange();assert.equal(app.frames.size,0,'A background tab should stop animation callbacks');
app.document.hidden=false;app.listeners.visibilitychange();assert.equal(app.frames.size,1);app.listeners.pagehide();assert.equal(app.frames.size,0);
const reduced=setup(true);assert.equal(reduced.frames.size,0,'Reduced motion should not start a perpetual frame loop');
console.log('PASS: the ASCII worker stops off-screen, paused, reduced-motion and hidden-tab loops, and resumes only one loop.');

for(const hz of [60,120]){
 const hero=setup();hero.resizes[0]();const before=hero.draws,shaped=hero.shaped;
 for(let n=1;n<=hz;n++){const callbacks=[...hero.frames.values()];hero.frames.clear();callbacks.forEach(callback=>callback(n*1000/hz));}
 assert.ok(hero.draws-before>=hz-2,`Hero motion must follow a ${hz} Hz display, rather than stepping at 30 Hz (${hero.draws-before} updates)`);
 assert.ok(shaped>0&&hero.copied>1000,'Actual hero frames should copy cached glyphs');assert.equal(hero.shaped,shaped,'Animating should not reshape the glyph sheet');
}
console.log('PASS: hero motion follows 60 Hz and 120 Hz displays.');

const sectionsSource=fs.readFileSync(path.resolve(__dirname,'../dist/sections.js'),'utf8');
const sceneStart=sectionsSource.includes('// Scene animation lifecycle')?sectionsSource.indexOf('// Scene animation lifecycle'):sectionsSource.indexOf('let last=0;function tick(now)');
const sceneEnd=sectionsSource.indexOf("media.addEventListener('change'",sceneStart);
const sceneFrames=new Map(),sceneEvents={};let sceneID=0;
const scenes={document:{hidden:false,addEventListener:(name,callback)=>sceneEvents[name]=callback},relayVisible:false,botVisible:false,paused:false,botPaused:false,reviewTime:0,reviewIndex:0,reviews:[{}],CYCLE:2.35,botTime:0,morphPosition:0,morphGoal:0,lerp:(a,b,t)=>a+(b-a)*t,showReviews(){},drawRelay(){},drawBot(){},requestAnimationFrame:callback=>{sceneFrames.set(++sceneID,callback);return sceneID},cancelAnimationFrame:id=>sceneFrames.delete(id),addEventListener:(name,callback)=>sceneEvents[name]=callback};
vm.createContext(scenes);vm.runInContext(sectionsSource.slice(sceneStart,sceneEnd),scenes);
assert.equal(sceneFrames.size,0,'Robot and service-bot motion must not schedule frames when both are off-screen');
scenes.relayVisible=true;scenes.syncMotion();assert.equal(sceneFrames.size,1);scenes.paused=true;scenes.syncMotion();assert.equal(sceneFrames.size,0);
scenes.botVisible=true;scenes.syncMotion();assert.equal(sceneFrames.size,1);scenes.document.hidden=true;sceneEvents.visibilitychange();assert.equal(sceneFrames.size,0);
console.log('PASS: robot relay and service-bot animation release idle and background loops.');

// A visible relay should advance on each display frame rather than every other one.
scenes.document.hidden=false;scenes.paused=false;scenes.botVisible=false;scenes.relayVisible=true;
let relayUpdates=0;scenes.drawRelay=()=>relayUpdates++;scenes.syncMotion();
for(let n=1;n<=60;n++){const callbacks=[...sceneFrames.values()];sceneFrames.clear();callbacks.forEach(callback=>callback(n*1000/60));}
assert.ok(relayUpdates>=55,'The robot relay should update at display cadence, instead of being capped near 30 updates per second');
console.log('PASS: the visible robot relay advances at display-frame cadence.');

for(const hz of [60,120]){
 scenes.stopScenes();scenes.relayVisible=false;scenes.botVisible=true;scenes.botPaused=false;
 let updates=0;scenes.drawBot=()=>updates++;scenes.syncMotion();
 for(let n=1;n<=hz;n++){const callbacks=[...sceneFrames.values()];sceneFrames.clear();callbacks.forEach(callback=>callback(n*1000/hz));}
 assert.ok(updates>=hz-2,`Service character must follow a ${hz} Hz display (${updates} updates)`);
}
console.log('PASS: service character morphs follow 60 Hz and 120 Hz displays.');
