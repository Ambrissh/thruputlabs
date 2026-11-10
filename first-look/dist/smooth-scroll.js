/* Safari and Chrome own wheel/touch scrolling on the compositor thread.
   This adapter only handles section navigation and modal scroll locks. */
(()=>{
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),root=document.documentElement;
 let locked=false,previousOverflow='',previousOverscroll='';
 function resume(){if(!locked)return;root.style.overflow=previousOverflow;root.style.overscrollBehavior=previousOverscroll;locked=false;}
 window.thruputScroll={
  pause(){if(locked)return;window.scrollTo({top:window.scrollY,left:window.scrollX,behavior:'instant'});previousOverflow=root.style.overflow;previousOverscroll=root.style.overscrollBehavior;root.style.overflow='hidden';root.style.overscrollBehavior='none';locked=true;},
  resume,
  to(target){if(!target||locked)return;target.scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});}
 };
 addEventListener('pagehide',resume);
})();
