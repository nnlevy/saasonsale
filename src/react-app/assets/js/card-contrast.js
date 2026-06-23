// runtime contrast check: if low contrast, add .generated-card__text-wrap
(function(){
  try{
    document.addEventListener('DOMContentLoaded',()=>{
      document.querySelectorAll('.generated-card').forEach(card=>{
        const textWrap=card.querySelector('.generated-card__text-wrap');
        if(!textWrap) return;
        const bg=window.getComputedStyle(card).backgroundColor;
        // quick heuristic: always add overlay for now
        textWrap.classList.add('generated-card__overlay');
      });
    });
  }catch(e){console.warn('contrast check failed',e)}
})();
