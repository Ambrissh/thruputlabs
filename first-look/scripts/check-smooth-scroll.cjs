// Native input must remain browser-owned; navigation and modal locking share this adapter.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const events={},media={matches:false,addEventListener(){}},style={overflow:'clip',overscrollBehavior:'contain'};let frames=0,intercepted=0;
const context={document:{documentElement:{style},addEventListener(){}},Lenis:class{constructor(){intercepted++}start(){}stop(){}destroy(){}},matchMedia:()=>media,requestAnimationFrame(){frames++},addEventListener:(name,fn)=>events[name]=fn,scrollY:340,scrollX:0,scrollTo(options){this.cancelled=options},console};context.window=context;
vm.createContext(context);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../dist/smooth-scroll.js'),'utf8'),context);
assert.equal(intercepted,0,'Wheel/trackpad input must not enter another JavaScript easing engine');assert.equal(frames,0,'Native scroll needs no perpetual animation callback');assert.ok(!events.wheel&&!events.touchmove,'Never cancel native wheel or touch input');
const target={scrollIntoView(options){this.options=options}};context.thruputScroll.to(target);assert.equal(target.options.behavior,'smooth');assert.equal(target.options.block,'start');
context.thruputScroll.pause();assert.equal(style.overflow,'hidden');context.thruputScroll.pause();context.thruputScroll.resume();assert.equal(style.overflow,'clip');assert.equal(style.overscrollBehavior,'contain');
media.matches=true;context.thruputScroll.to(target);assert.equal(target.options.behavior,'instant');context.thruputScroll.to(null);
context.thruputScroll.pause();events.pagehide();assert.equal(style.overflow,'clip','Page restoration must not inherit a lock');
console.log('PASS: browser-owned wheel/touch, no scroll RAF loop, native section offsets, reduced motion, idempotent modal locking and page restoration.');

for(const file of fs.readdirSync(path.resolve(__dirname,'../dist'),{recursive:true}).filter(name=>name.endsWith('.html'))){const html=fs.readFileSync(path.resolve(__dirname,'../dist',file),'utf8');assert.ok(!/<(?:script|link)[^>]+(?:src|href)="[^"]*vendor\/lenis/.test(html),`Obsolete wheel engine loaded by ${file}`);}
console.log('PASS: no page loads the old wheel engine.');
