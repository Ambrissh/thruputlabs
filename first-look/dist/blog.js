(()=>{
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.06,rootMargin:'0px 0px -4% 0px'});
 document.querySelectorAll('.writing-title,.blog-card,.blog-intro h1,.blog-deck,.blog-copy h2').forEach(element=>{element.classList.add('blog-reveal');observer.observe(element);});
})();
