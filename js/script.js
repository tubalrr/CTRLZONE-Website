
function toggleMenu(){document.querySelector('.sidebar').classList.toggle('show')}
function pickWinner(){
 const raw=document.getElementById('names').value;
 const names=raw.split(',').map(x=>x.trim()).filter(Boolean);
 const out=document.getElementById('winner');
 if(!names.length){out.textContent='Add at least one name!';return}
 out.textContent='🎲 Picking...';
 setTimeout(()=>{out.textContent='🏆 '+names[Math.floor(Math.random()*names.length)]},700);
}
function demoSubmit(e,msg){e.preventDefault();alert(msg);e.target.reset()}
function demoLogin(e){e.preventDefault();localStorage.setItem('ctrlzoneDemoUser',document.getElementById('email').value);location.href='dashboard.html'}
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('.sidebar nav a').forEach(a=>{if(a.href===location.href)a.style.color='#28d7ff'});
});
