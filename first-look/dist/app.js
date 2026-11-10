(()=>{

const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const story=document.querySelector('.scroll-story'),words=[...document.querySelectorAll('.scroll-copy span')],support=document.querySelector('.support-copy'),bar=document.querySelector('.scroll-progress>span'),cue=document.querySelector('.scroll-cue');
let pending=false,storyTop=0,storyHeight=1,lastProgress=-1;
const clamp=value=>Math.max(0,Math.min(1,value)),wordAmounts=new Float32Array(words.length).fill(-1);
// Measure on layout changes, never in the scroll frame after visual writes.
function measureStory(){const rect=story.getBoundingClientRect();storyTop=rect.top+scrollY;storyHeight=rect.height;queueReveal();}
function reveal(){
  pending=false;
  const progress=Math.round(clamp((scrollY-storyTop)/Math.max(1,storyHeight-innerHeight))*10000)/10000;
  if(progress===lastProgress)return;
  lastProgress=progress;
  for(let i=0;i<words.length;i++){
    const amount=reduced?1:clamp((progress*1.1+.17-i/words.length)/.18);
    if(Math.abs(amount-wordAmounts[i])<.0001)continue;
    wordAmounts[i]=amount;
    words[i].style.opacity=String(.43+amount*.57);
    words[i].style.transform=`translateY(${(1-amount)*6}px)`;
    words[i].style.filter=`blur(${(1-amount)*.35}px)`;
  }
  support.style.opacity=String(reduced?1:.45+clamp((progress-.35)*2)*.55);
  support.style.transform=`translateY(${reduced?0:(1-clamp(progress*2))*4}px)`;
  bar.style.transform=`scaleX(${progress})`;if(cue)cue.style.opacity=String(1-clamp(progress*3));
}
function queueReveal(){if(!pending){pending=true;requestAnimationFrame(reveal);}}
addEventListener('scroll',queueReveal,{passive:true});addEventListener('resize',measureStory);
new ResizeObserver(measureStory).observe(story);measureStory();

const nav=document.querySelector('nav'),menu=document.querySelector('.menu');menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';};
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu';}
document.querySelectorAll('[data-page]').forEach(button=>button.onclick=event=>{
 event.preventDefault();
 const target={services:'about',contact:'contact'}[button.dataset.page],element=document.getElementById(target);if(!element)return;
 if(window.thruputScroll)window.thruputScroll.to(element);else element.scrollIntoView({behavior:reduced?'instant':'smooth'});
 history.replaceState(null,'','#'+target);if(target==='contact')window.dispatchEvent(new Event('contact:open'));closeMenu();
});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
})();
