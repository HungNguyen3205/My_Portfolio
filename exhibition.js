// Enhancements are scoped below the hero; content never depends on motion.
const exhibitionGrid=document.getElementById('project-grid');
document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
 const isList=button.dataset.view==='list';exhibitionGrid.classList.toggle('list-view',isList);
 document.querySelectorAll('[data-view]').forEach(item=>{const selected=item===button;item.classList.toggle('selected',selected);item.setAttribute('aria-pressed',String(selected));});
}));
function syncGalleryLayout(){exhibitionGrid.classList.toggle('is-filtered',Array.from(exhibitionGrid.children).some(card=>card.hidden));}
new MutationObserver(syncGalleryLayout).observe(exhibitionGrid,{subtree:true,attributes:true,attributeFilter:['hidden']});
const cinema=document.getElementById('cinema'),cinemaVideo=document.getElementById('cinema-video');
document.querySelector('.cinema-trigger').addEventListener('click',()=>{document.getElementById('work-video').pause();cinema.showModal();document.body.style.overflow='hidden';cinemaVideo.play().catch(()=>{});});
document.getElementById('close-cinema').addEventListener('click',()=>cinema.close());
cinema.addEventListener('click',event=>{if(event.target===cinema){const bounds=cinema.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)cinema.close();}});
cinema.addEventListener('close',()=>{cinemaVideo.pause();document.body.style.overflow='';});
if(matchMedia('(hover: hover) and (pointer: fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 exhibitionGrid.querySelectorAll('.project').forEach(card=>{let frame=0,pointer=null;card.addEventListener('pointermove',event=>{pointer={x:event.clientX,y:event.clientY};if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(exhibitionGrid.classList.contains('list-view'))return;const bounds=card.getBoundingClientRect();const x=(pointer.x-bounds.left)/bounds.width-.5,y=(pointer.y-bounds.top)/bounds.height-.5;card.style.setProperty('--tilt-x',(-y*3).toFixed(2)+'deg');card.style.setProperty('--tilt-y',(x*3).toFixed(2)+'deg');});});card.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);frame=0;card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});});
}
