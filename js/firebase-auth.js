import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
let currentUser = null;
let authChecked = false;

function message(id, text, error=false){
  const el=document.getElementById(id);
  if(el){el.textContent=text; el.style.color=error?"#ff8a8a":"#5eead4";}
}

function updateUserUI(user){
  const displayName=user?.displayName||user?.email?.split("@")[0]||"CTRLZONE Gamer";
  const email=user?.email||"";
  const photo=user?.photoURL||"";
  document.querySelectorAll("[data-user-name]").forEach(el=>el.textContent=displayName);
  document.querySelectorAll("[data-user-email]").forEach(el=>el.textContent=email);
  document.querySelectorAll("[data-user-avatar]").forEach(el=>{
    if(photo){el.innerHTML=`<img src="${photo}" alt="Profile">`;}
    else {el.textContent=displayName.charAt(0).toUpperCase();}
  });
  document.querySelectorAll("[data-auth-login]").forEach(el=>el.style.display=user?"none":"");
  document.querySelectorAll("[data-auth-user]").forEach(el=>el.style.display=user?"":"none");
  
  // Community form logic - this is the fix
  const postForm=document.getElementById("communityPostForm");
  const loginHint=document.querySelector(".login-hint");
  const postContent=document.getElementById("postContent");
  if(postForm){
    if(user){
      postForm.style.display="block";
      if(loginHint) loginHint.style.display="none";
      if(postContent) postContent.placeholder=`What's on your mind, ${displayName}?`;
    } else {
      // Show form disabled state if auth checked and no user
      if(authChecked){
        postForm.style.display="none";
        if(loginHint){
          loginHint.style.display="block";
          loginHint.innerHTML=`You need to <a href="login.html">log in</a> to post. <small>Pero pwede mo pa rin makita posts kahit di naka-login.</small>`;
        }
      } else {
        // Still checking auth, show loading
        postForm.style.display="none";
        if(loginHint){
          loginHint.style.display="block";
          loginHint.textContent="Checking login... ⏳";
        }
      }
    }
  }
}

function startCommunityPosts(){
  const postsContainer=document.getElementById("communityPosts");
  if(!postsContainer) return;
  postsContainer.innerHTML='<div class="card empty-posts"><h3>Loading posts... ⏳</h3></div>';
  try{
    const postsQuery=query(collection(db,"posts"), orderBy("createdAt","desc"), limit(50));
    onSnapshot(postsQuery, (snapshot)=>{
      if(snapshot.empty){
        postsContainer.innerHTML='<div class="card empty-posts"><h3>No posts yet</h3><p>Be the first gamer to post! 🎮</p></div>';
        return;
      }
      postsContainer.innerHTML=snapshot.docs.map(doc=>{
        const post=doc.data();
        const name=post.name||"CTRLZONE Gamer";
        const initial=name.charAt(0).toUpperCase();
        const date=post.createdAt?.toDate?post.createdAt.toDate().toLocaleString():"Just now";
        const content=String(post.content||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll("\n","<br>");
        return `<article class="community-post"><div class="post-user"><div class="post-avatar">${initial}</div><div><h3>${name}</h3><span>${date}</span></div></div><div class="post-content">${content}</div></article>`;
      }).join("");
    }, (error)=>{
      console.error("Firestore error:", error);
      postsContainer.innerHTML=`<div class="card"><h3>Firestore error ⚠️</h3><p>${error.message}</p><p style="font-size:13px;color:#94a3b8">Fix: Pumunta ka sa Firebase Console > Firestore > Rules at gawing:<br><code>allow read: if true;<br>allow create: if request.auth != null;</code></p></div>`;
    });
  }catch(e){
    postsContainer.innerHTML=`<div class="card"><h3>Error</h3><p>${e.message}</p></div>`;
  }
}

window.ctrlzoneLogin=async function(e){
  e.preventDefault();
  const btn=e.target.querySelector('button');
  const orig=btn.textContent;
  btn.textContent="LOGGING IN..."; btn.disabled=true;
  try{
    await signInWithEmailAndPassword(auth, document.getElementById("email").value.trim(), document.getElementById("password").value);
    message("authMessage","Login success! Redirecting... 🔥");
    setTimeout(()=>location.href="dashboard.html", 600);
  }catch(err){
    message("authMessage",err.message,true);
    btn.textContent=orig; btn.disabled=false;
  }
};

window.ctrlzoneRegister=async function(e){
  e.preventDefault();
  const btn=e.target.querySelector('button');
  const orig=btn.textContent;
  btn.textContent="CREATING..."; btn.disabled=true;
  try{
    const cred=await createUserWithEmailAndPassword(auth, document.getElementById("email").value.trim(), document.getElementById("password").value);
    const nameField=document.getElementById("displayName");
    if(nameField?.value.trim()) await updateProfile(cred.user,{displayName:nameField.value.trim()});
    message("authMessage","Account created! Redirecting... 🎮");
    setTimeout(()=>location.href="dashboard.html", 600);
  }catch(err){
    message("authMessage",err.message,true);
    btn.textContent=orig; btn.disabled=false;
  }
};

window.googleLogin=async function(){
  try{await signInWithPopup(auth,provider); location.href="dashboard.html";}
  catch(err){message("authMessage",err.message,true);}
};

window.ctrlzoneLogout=async function(){await signOut(auth); location.href="index.html";};

window.createCommunityPost=async function(e){
  e.preventDefault();
  const status=document.getElementById("postStatus");
  const input=document.getElementById("postContent");
  const button=document.getElementById("postButton");
  const user=currentUser||auth.currentUser;
  
  if(!authChecked){
    status.textContent="Wait lang, chine-check pa login... ⏳";
    status.style.color="#fbbf24";
    return;
  }
  if(!user){
    status.textContent="Kailangan naka-login para mag-post! 👉 Login muna";
    status.style.color="#ff8a8a";
    setTimeout(()=>location.href="login.html", 1500);
    return;
  }
  const content=input.value.trim();
  if(!content){
    status.textContent="Lagyan mo muna ng laman! 😅";
    status.style.color="#ff8a8a";
    return;
  }
  button.disabled=true; button.textContent="POSTING...";
  status.textContent="";
  try{
    await addDoc(collection(db,"posts"),{
      uid:user.uid,
      name:user.displayName||user.email?.split("@")[0]||"CTRLZONE Gamer",
      email:user.email||"",
      content,
      createdAt:serverTimestamp()
    });
    input.value="";
    status.textContent="Posted! 🔥";
    status.style.color="#5eead4";
    setTimeout(()=>status.textContent="",3000);
  }catch(error){
    console.error(error);
    if(error.message.includes("permission")||error.message.includes("Missing or insufficient")){
      status.innerHTML=`Firestore Rules error! Ayusin mo sa Firebase Console:<br><small>allow read: if true; allow create: if request.auth != null;</small>`;
    } else {
      status.textContent=error.message;
    }
    status.style.color="#ff8a8a";
  }finally{
    button.disabled=false; button.textContent="POST";
  }
};

async function boot(){
  try{await setPersistence(auth,browserLocalPersistence);}catch(e){console.warn("Persistence:",e);}
  
  // Always start loading posts immediately - public viewing
  startCommunityPosts();

  onAuthStateChanged(auth, (user)=>{
    currentUser=user;
    authChecked=true;
    console.log("Auth state:", user ? "Logged in as "+user.email : "Not logged in");
    updateUserUI(user);

    // Only redirect if page is truly protected (dashboard) and user is definitely not logged in
    if(document.body.dataset.protected==="true" && !user){
      console.log("Protected page, no user, redirecting to login");
      // Small delay to avoid flicker
      setTimeout(()=>{
        if(!auth.currentUser) location.href="login.html";
      }, 500);
      return;
    }
    if(user && document.body.dataset.authPage==="true"){
      location.href="dashboard.html";
      return;
    }
  });
}
boot();
