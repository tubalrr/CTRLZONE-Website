function toggleMenu(){document.querySelector('.sidebar').classList.toggle('show')}
function pickWinner(){
 const el=document.getElementById('names');
 const raw=el.value || el.placeholder || '';
 const names=raw.split(',').map(x=>x.trim()).filter(Boolean);
 const out=document.getElementById('winner');
 if(!names.length){out.textContent='Add at least one name!';return}
 out.textContent='🎲 Picking...';
 setTimeout(()=>{out.textContent='🏆 '+names[Math.floor(Math.random()*names.length)]},700);
}
function demoSubmit(e,msg){e.preventDefault();alert(msg);e.target.reset()}
document.addEventListener('click', (e)=>{
  const sidebar=document.querySelector('.sidebar');
  const btn=document.querySelector('.menu-btn');
  if(sidebar && btn && !sidebar.contains(e.target) && !btn.contains(e.target)){
    sidebar.classList.remove('show');
  }
});
document.addEventListener('DOMContentLoaded',()=>{
  const cur = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  document.querySelectorAll('.sidebar nav a').forEach(a=>{
    const href=a.getAttribute('href').split('?')[0];
    if(href===cur){a.classList.add('active')}
  });
});
