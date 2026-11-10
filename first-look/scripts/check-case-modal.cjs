// Exercise the actual on-page case-open/close handlers, without a browser renderer.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(root+'/content/case-studies.json','utf8')),source=fs.readFileSync(root+'/dist/cases.js','utf8');
const listeners={},dialogEvents={},rootClasses=new Set();let rendered=null,paused=0,resumed=0,stopped=0,running=0,observed=0;
const content={replaceChildren(value){rendered=value??null}},brand={textContent:''},closeButton={};
const dialog={open:false,attributes:{},querySelector(selector){return selector==='.case-modal-content'?content:selector==='[data-case-modal-brand]'?brand:closeButton},setAttribute(name,value){this.attributes[name]=value},addEventListener(name,callback){dialogEvents[name]=callback},showModal(){this.open=true},close(){this.open=false;dialogEvents.close()},getBoundingClientRect(){return{left:0,right:100,top:0,bottom:100}}};
const tiles=data.map(item=>({dataset:{caseOpen:item.slug},brand:item.brand,querySelector(){return{textContent:this.brand}},closest(selector){return selector==='.case-tile'?this:this},focus(options){this.focused=options.preventScroll}}));
const thumbnails={classList:{add(){}},querySelectorAll:()=>tiles};
const section={querySelector:selector=>selector==='.case-intro'?{}:thumbnails,contains:node=>tiles.includes(node)};
const document={documentElement:{classList:{add:name=>rootClasses.add(name),remove:name=>rootClasses.delete(name)}},getElementById(id){const slug=id.replace('case-template-','');return{content:{cloneNode:()=>({slug})}}},addEventListener:(type,callback)=>listeners[type]=callback};
const context={section,dialog,media:{matches:false},projects:data,document,window:{thruputScroll:{pause(){paused++},resume(){resumed++}}},stop(){stopped++},run(){running++},IntersectionObserver:class{observe(){observed++}unobserve(){}}};
// The handler obtains the dialog with getElementById, like the real page.
const getTemplate=document.getElementById.bind(document);document.getElementById=id=>id==='case-detail-dialog'?dialog:getTemplate(id);
vm.createContext(context);const handlers=source.slice(source.indexOf('  const intro='),source.indexOf('  const original='));vm.runInContext(handlers,context);
assert.equal(observed,5,'All thumbnail cards should receive reveal observation');
for(const tile of tiles){
 const event={target:{closest:()=>tile},preventDefault(){this.defaultPrevented=true}};listeners.click(event);
 assert.equal(event.defaultPrevented,true,'Case clicks must stay on the current page');assert.equal(dialog.open,true);assert.equal(rendered.slug,tile.dataset.caseOpen);assert.equal(brand.textContent,tile.brand);assert.equal(dialog.attributes['aria-labelledby'],'case-title-'+tile.dataset.caseOpen);assert.equal(rootClasses.has('case-detail-open'),true);
 closeButton.onclick();assert.equal(dialog.open,false);assert.equal(rendered,null);assert.equal(rootClasses.has('case-detail-open'),false);assert.equal(tile.focused,true,'Closing must restore focus without scrolling the page');
}
assert.equal(paused,5);assert.equal(resumed,5);assert.equal(stopped,5);assert.equal(running,5);
console.log('PASS: all five case stories open on-page, pause background momentum, close cleanly and restore focus.');
