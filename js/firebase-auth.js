import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDZ9dqwfUbKGSNq9YK96voy-vUiC-dkg5c",
  authDomain: "ctrlzone-50db8.firebaseapp.com",
  projectId: "ctrlzone-50db8",
  storageBucket: "ctrlzone-50db8.firebasestorage.app",
  messagingSenderId: "961266035107",
  appId: "1:961266035107:web:03c628e259d317013b9216"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

function message(id, text, error=false){const el=document.getElementById(id); if(el){el.textContent=text; el.style.color=error?'#ff8a8a':'#5eead4';}}

window.ctrlzoneLogin = async function(e){
 e.preventDefault(); const email=document.getElementById('email').value.trim(); const password=document.getElementById('password').value;
 try{await signInWithEmailAndPassword(auth,email,password); location.href='dashboard.html';}
 catch(err){message('authMessage',err.message,true);}
}
window.ctrlzoneRegister = async function(e){
 e.preventDefault(); const email=document.getElementById('email').value.trim(); const password=document.getElementById('password').value;
 try{await createUserWithEmailAndPassword(auth,email,password); location.href='dashboard.html';}
 catch(err){message('authMessage',err.message,true);}
}
window.googleLogin = async function(){try{await signInWithPopup(auth,provider); location.href='dashboard.html';}catch(err){message('authMessage',err.message,true);}}
window.ctrlzoneLogout = async function(){await signOut(auth); location.href='index.html';}

onAuthStateChanged(auth,(user)=>{
 const name=document.getElementById('userName');
 if(name && user) name.textContent=user.displayName || user.email;
 if(document.body.dataset.protected==='true' && !user) location.href='login.html';
});
