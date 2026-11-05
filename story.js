const projects=window.PORTFOLIO_PROJECTS;
const grid=document.getElementById('project-grid');
function node(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text)el.textContent=text;return el;}
projects.forEach((project,index)=>{
 const card=node('article','project');card.dataset.category=project.category;card.dataset.live=String(!!project.live);card.dataset.name=project.name;
 const link=node('a','project-link');link.href=project.url||'https://github.com/HungNguyen3205/'+project.repo;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',project.name+' — '+(project.live?'Mở website':'Xem mã nguồn'));
 const cover=node('div','project-cover');cover.style.background=project.color;
 if(project.cover){const img=node('img');img.src=project.cover;img.alt='Hình dự án '+project.name;img.loading='lazy';if(project.contain)img.className='contain';cover.append(img);}else{cover.classList.add('typographic');if(['#122f43','#233d74','#384e41'].includes(project.color))cover.classList.add('light-type');cover.append(node('span','cover-index',String(index+1).padStart(2,'0')),node('strong','cover-word',project.mark),node('span','cover-tagline',project.tagline),node('span','cover-note','BÌA ĐỒ HỌA DỰ ÁN'));}
 const badge=node('span','project-badge',project.live?'↗ WEBSITE':'↗ MÃ NGUỒN');cover.append(badge);link.append(cover);
 const details=node('div','project-details');details.append(node('p','project-label',project.label),node('h3','',project.name),node('p','project-desc',project.description));link.append(details);card.append(link);
 if(project.video){const watch=node('a','watch-link','▶ Xem video demo · 21 giây');watch.href='#review';card.append(watch);}
 grid.append(card);
});
let activeFilter='all';const search=document.getElementById('project-search');
const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
function filterProjects(){let count=0;const query=normalize(search.value.trim());document.querySelectorAll('.project').forEach(card=>{const matches=(activeFilter==='all'||(activeFilter==='live'?card.dataset.live==='true':card.dataset.category===activeFilter))&&normalize(card.textContent).includes(query);card.hidden=!matches;if(matches)count++;});document.getElementById('result-status').textContent=count+' / '+projects.length+' dự án';document.getElementById('empty-state').hidden=count!==0;}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});filterProjects();}));search.addEventListener('input',filterProjects);filterProjects();
document.getElementById('live-count').textContent=String(projects.filter(p=>p.live).length).padStart(2,'0');document.getElementById('year').textContent=new Date().getFullYear();
const video=document.getElementById('work-video');document.getElementById('play-review').addEventListener('click',()=>{video.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});video.play().catch(()=>{video.focus();});});
const progress=document.querySelector('.progress');let pending=false;function updateProgress(){const available=document.documentElement.scrollHeight-innerHeight;progress.style.transform='scaleX('+(available>0?scrollY/available:0)+')';pending=false;}window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(updateProgress)}},{passive:true});updateProgress();
// Content remains visible when animations or JavaScript are unavailable.
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('entered');observer.unobserve(entry.target);}});},{threshold:.08});document.querySelectorAll('.case,.story-grid,.milestone-grid,.section-heading').forEach(el=>{el.classList.add('animate-in');observer.observe(el);});}
