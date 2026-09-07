/* =========================================
   CTRLZONE FIREBASE AUTH + COMMUNITY SYSTEM
   FIXED VERSION - COMMENTS + LIKES WORKING
========================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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
let postsStarted = false;
let authListenerStarted = false;

function message(id, text, error = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = error ? "#ff8a8a" : "#5eead4";
}

function escapeHTML(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(timestamp) {
  if (!timestamp) return "Just now";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleString();
  }
  return "Just now";
}

function updateUserUI(user) {
  const displayName = user?.displayName || user?.email?.split("@")[0] || "CTRLZONE Gamer";
  const email = user?.email || "";
  const photo = user?.photoURL || "";

  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = displayName);
  document.querySelectorAll("[data-user-email]").forEach(el => el.textContent = email);
  document.querySelectorAll("[data-user-avatar]").forEach(el => {
    if (photo) {
      el.innerHTML = `<img src="${photo}" alt="Profile">`;
    } else {
      el.textContent = displayName.charAt(0).toUpperCase();
    }
  });
  document.querySelectorAll("[data-auth-login]").forEach(el => el.style.display = user ? "none" : "");
  document.querySelectorAll("[data-auth-user]").forEach(el => el.style.display = user ? "" : "none");

  const postForm = document.getElementById("communityPostForm");
  const loginHint = document.querySelector(".login-hint");
  if (postForm) postForm.style.display = user ? "block" : "none";
  if (loginHint) loginHint.style.display = user ? "none" : "block";
}

/* AUTH */
window.ctrlzoneLogin = async function(e) {
  e.preventDefault();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;
  if (!email || !password) { message("authMessage", "Please enter email and password.", true); return; }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "dashboard.html";
  } catch (err) { message("authMessage", err.message, true); }
};

window.ctrlzoneRegister = async function(e) {
  e.preventDefault();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value;
  const nameField = document.getElementById("displayName");
  if (!email || !password) { message("authMessage", "Please complete all fields.", true); return; }
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (nameField && nameField.value.trim()) {
      await updateProfile(credential.user, { displayName: nameField.value.trim() });
    }
    location.href = "dashboard.html";
  } catch (err) { message("authMessage", err.message, true); }
};

window.googleLogin = async function() {
  try { await signInWithPopup(auth, provider); location.href = "dashboard.html"; }
  catch (err) { message("authMessage", err.message, true); }
};

window.ctrlzoneLogout = async function() {
  try { await signOut(auth); location.href = "index.html"; } catch (error) { console.error(error); }
};

/* CREATE POST */
window.createCommunityPost = async function(e) {
  e.preventDefault();
  const status = document.getElementById("postStatus");
  const input = document.getElementById("postContent");
  const button = document.getElementById("postButton");
  const user = currentUser || auth.currentUser;
  if (!user) { if (status) { status.textContent = "Please log in first."; status.style.color = "#ff8a8a"; } return; }
  if (!input) return;
  const content = input.value.trim();
  if (!content) { if (status) { status.textContent = "Write something first."; status.style.color = "#ff8a8a"; } return; }
  if (button) { button.disabled = true; button.textContent = "POSTING..."; }
  try {
    await addDoc(collection(db, "posts"), {
      uid: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "CTRLZONE Gamer",
      email: user.email || "",
      photoURL: user.photoURL || "",
      content: content,
      likes: 0,
      createdAt: serverTimestamp()
    });
    input.value = "";
    if (status) { status.textContent = "Posted! 🔥"; status.style.color = "#5eead4"; setTimeout(()=>{if(status)status.textContent="";},3000); }
  } catch (error) {
    console.error("POST ERROR:", error);
    if (status) { status.textContent = error.message; status.style.color = "#ff8a8a"; }
  } finally {
    if (button) { button.disabled = false; button.textContent = "POST →"; }
  }
};

/* START POSTS - ULTRA DESIGN + COMMENTS FIXED - NEVER STUCK */
function startCommunityPosts() {
  if (postsStarted) return;
  const postsContainer = document.getElementById("communityPosts");
  if (!postsContainer) { console.error("communityPosts not found"); return; }
  postsStarted = true;

  console.log("Starting community posts...");

  const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));

  // Safety timeout - if Firestore doesn't respond in 8 seconds, show error
  const timeoutId = setTimeout(() => {
    const loadingEl = document.getElementById("loadingPost");
    if (loadingEl && postsContainer.contains(loadingEl)) {
      postsContainer.innerHTML = `
        <div class="ultra-post" style="border-color:#ff8a8a">
          <h3 style="margin:0 0 8px;color:#ff8a8a">⚠️ Firestore not responding</h3>
          <p style="font-size:13px;color:#c8d6ee;line-height:1.6">
            Loading post lang? 2 possible reasons:<br>
            1. <b>Firestore Rules</b> - need <code style="background:#0a0f1e;padding:2px 6px;border-radius:6px">allow read: if true;</code> for posts<br>
            2. <b>Internet / Adblock</b> - check Console (F12) for errors<br><br>
            Fix: Go to Firebase Console > Firestore > Rules > set to:<br>
            <code style="display:block;background:#080d1c;border:1px solid #1c2e4f;padding:12px;border-radius:10px;margin-top:8px;font-size:11px;white-space:pre-wrap">rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if true;
      match /comments/{commentId} { allow read: if true; allow create: if request.auth != null; }
      match /likes/{likeId} { allow read: if true; allow write: if request.auth != null; }
    }
  }
}</code>
          </p>
          <button onclick="location.reload()" style="margin-top:12px;background:var(--cyan);color:#000;border:0;padding:8px 16px;border-radius:10px;font-weight:700;cursor:pointer">Reload</button>
        </div>`;
    }
  }, 8000);

  onSnapshot(postsQuery, async snapshot => {
    clearTimeout(timeoutId);
    console.log("Posts snapshot:", snapshot.size, "docs");

    if (snapshot.empty) {
      postsContainer.innerHTML = `
        <div class="ultra-post" style="text-align:center">
          <h3 style="margin:0 0 6px">No posts yet</h3>
          <p style="color:#6b7fa0;font-size:13px">Be the first gamer to post in CTRLZONE Community! 🎮<br>Login ka muna tapos mag-post.</p>
        </div>`;
      return;
    }

    const html = snapshot.docs.map(postDoc => {
      const post = postDoc.data();
      const postId = postDoc.id;
      const name = post.name || "CTRLZONE Gamer";
      const initial = name.charAt(0).toUpperCase();
      const date = formatDate(post.createdAt);
      const content = escapeHTML(post.content).replaceAll("
", "<br>");
      const likes = Number(post.likes || 0);
      let avatarHTML = initial;
      if (post.photoURL) {
        avatarHTML = `<img src="${escapeHTML(post.photoURL)}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      }

      return `
<article class="ultra-post" data-post-id="${postId}">
  <div class="ultra-post-head">
    <div class="ultra-post-avatar">${avatarHTML}</div>
    <div>
      <div class="ultra-post-name">${escapeHTML(name)} <span class="ultra-verified">✓</span></div>
      <div class="ultra-post-meta">🕒 ${date} • <span style="color:#00e5ff">#MLBB</span></div>
    </div>
  </div>
  <div class="ultra-post-content">${content}</div>
  <div class="ultra-tags">
    <span class="ultra-tag cyan">#MLBB</span>
    <span class="ultra-tag green">🔥 Trending</span>
  </div>
  <div class="ultra-post-foot">
    <div class="ultra-actions">
      <button class="ultra-action like-btn" type="button" data-like-post="${postId}">👍 <span>${likes}</span> Like</button>
      <button class="ultra-action comment-btn" type="button" data-comment-toggle="${postId}">💬 Comment</button>
    </div>
    <span style="font-size:10px;color:#3a4a64">ID:${postId.slice(0,6)}</span>
  </div>
  <div class="comments-section" id="comment-section-${postId}" style="display:none; margin-top:12px;">
    <div class="comments-list" id="comments-${postId}">
      <p class="no-comments">Loading comments...</p>
    </div>
    <form class="comment-form" data-post-id="${postId}">
      <input type="text" class="comment-input" id="comment-input-${postId}" placeholder="Write a comment..." autocomplete="off" required>
      <button type="submit" class="comment-send-btn">Send</button>
    </form>
  </div>
</article>`;
    }).join("");

    postsContainer.innerHTML = html;

    snapshot.docs.forEach(postDoc => { loadComments(postDoc.id); });
    refreshLikeButtons(snapshot.docs);
  }, error => {
    clearTimeout(timeoutId);
    console.error("POSTS ERROR:", error);
    postsContainer.innerHTML = `
      <div class="ultra-post" style="border-color:#ff8a8a">
        <h3 style="color:#ff8a8a">Firestore Error: ${escapeHTML(error.code || "")}</h3>
        <p style="font-size:13px;color:#c8d6ee">${escapeHTML(error.message)}</p>
        <p style="font-size:11px;color:#6b7fa0;margin-top:8px">Fix: Firebase Console > Firestore > Rules > allow read: if true; for posts collection</p>
      </div>`;
  });
}

/* TOGGLE COMMENTS - FIXED */
window.toggleComments = function(postId) {
  const section = document.getElementById("comment-section-" + postId);
  if (!section) { console.error("Comment section not found", postId); return; }
  const isHidden = section.style.display === "none" || section.style.display === "";
  section.style.display = isHidden ? "block" : "none";
  if (isHidden) {
    // Focus input when opening
    setTimeout(() => {
      const input = document.getElementById("comment-input-" + postId);
      if (input) input.focus();
    }, 100);
  }
};

/* EVENT DELEGATION */
document.addEventListener("click", async function(e) {
  const commentButton = e.target.closest("[data-comment-toggle]");
  if (commentButton) {
    const postId = commentButton.dataset.commentToggle;
    window.toggleComments(postId);
    return;
  }
  const likeButton = e.target.closest("[data-like-post]");
  if (likeButton) {
    const postId = likeButton.dataset.likePost;
    await window.toggleLike(postId);
  }
});

document.addEventListener("submit", async function(e) {
  const form = e.target.closest(".comment-form");
  if (!form) return;
  e.preventDefault();
  const postId = form.dataset.postId;
  console.log("COMMENT FORM SUBMITTED:", postId);
  await window.createComment(postId, form);
});

/* CREATE COMMENT */
window.createComment = async function(postId, form) {
  console.log("STARTING COMMENT:", postId);
  const user = currentUser || auth.currentUser;
  if (!user) { alert("Please log in first."); return; }
  const input = form.querySelector(".comment-input");
  const button = form.querySelector(".comment-send-btn");
  if (!input) { console.error("COMMENT INPUT NOT FOUND"); return; }
  const content = input.value.trim();
  if (!content) { alert("Please write a comment."); return; }
  try {
    if (button) { button.disabled = true; button.textContent = "Sending..."; }
    console.log("SAVING COMMENT...");
    await addDoc(collection(db, "posts", postId, "comments"), {
      uid: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "CTRLZONE Gamer",
      photoURL: user.photoURL || "",
      content: content,
      createdAt: serverTimestamp()
    });
    console.log("COMMENT SAVED");
    input.value = "";
  } catch (error) {
    console.error("COMMENT ERROR:", error);
    alert("Unable to post comment:\n\n" + error.message + "\n\nCheck Firestore Rules!");
  } finally {
    if (button) { button.disabled = false; button.textContent = "Send"; }
  }
};

/* LOAD COMMENTS - FIXED */
function loadComments(postId) {
  const container = document.getElementById("comments-" + postId);
  if (!container) return;

  const commentsQuery = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));

  onSnapshot(commentsQuery, snapshot => {
    if (snapshot.empty) {
      container.innerHTML = `<p class="no-comments">No comments yet. Be the first! 💬</p>`;
      return;
    }
    container.innerHTML = snapshot.docs.map(commentDoc => {
      const comment = commentDoc.data();
      const name = comment.name || "CTRLZONE Gamer";
      const initial = name.charAt(0).toUpperCase();
      const content = escapeHTML(comment.content);
      const date = formatDate(comment.createdAt);
      let avatarHTML = initial;
      if (comment.photoURL) {
        avatarHTML = `<img src="${escapeHTML(comment.photoURL)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      }
      return `
<div class="comment-item" style="display:flex;gap:10px">
  <div class="ultra-post-avatar" style="width:28px;height:28px;flex-shrink:0;font-size:10px">${avatarHTML}</div>
  <div class="comment-body" style="flex:1">
    <strong style="font-size:12px;color:var(--cyan)">${escapeHTML(name)}</strong>
    <p style="margin:4px 0 2px;font-size:13px;color:#c8d6ee">${content}</p>
    <small style="color:#5a6f90;font-size:10px">${date}</small>
  </div>
</div>`;
    }).join("");
  }, error => {
    console.error("LOAD COMMENTS ERROR:", error);
    container.innerHTML = `<p class="no-comments">Unable to load comments: ${escapeHTML(error.message)}<br><small>Check Firestore Rules for comments subcollection</small></p>`;
  });
}

/* LIKE SYSTEM */
window.toggleLike = async function(postId) {
  const user = currentUser || auth.currentUser;
  if (!user) { alert("Please log in first to like a post."); return; }
  const postRef = doc(db, "posts", postId);
  const likeRef = doc(db, "posts", postId, "likes", user.uid);
  try {
    await runTransaction(db, async transaction => {
      const likeSnapshot = await transaction.get(likeRef);
      if (likeSnapshot.exists()) {
        transaction.delete(likeRef);
        transaction.update(postRef, { likes: increment(-1) });
      } else {
        transaction.set(likeRef, { uid: user.uid, createdAt: serverTimestamp() });
        transaction.update(postRef, { likes: increment(1) });
      }
    });
  } catch (error) {
    console.error("LIKE ERROR:", error);
    alert("Unable to update like:\n\n" + error.message);
  }
};

async function refreshLikeButtons(postDocs) {
  const user = currentUser || auth.currentUser;
  if (!user) return;
  for (const postDoc of postDocs) {
    const likeRef = doc(db, "posts", postDoc.id, "likes", user.uid);
    try {
      const likeSnapshot = await getDoc(likeRef);
      const button = document.querySelector(`[data-like-post="${postDoc.id}"]`);
      if (!button) continue;
      if (likeSnapshot.exists()) {
        button.classList.add("liked");
        button.style.color = "#ff2e93";
        button.title = "Click to unlike";
      } else {
        button.classList.remove("liked");
        button.style.color = "";
        button.title = "Click to like";
      }
    } catch (error) { console.warn("LIKE STATUS ERROR:", error); }
  }
}

/* BOOT */
async function boot() {
  try { await setPersistence(auth, browserLocalPersistence); } catch (error) { console.warn("Persistence warning:", error); }
  if (authListenerStarted) return;
  authListenerStarted = true;
  onAuthStateChanged(auth, user => {
    currentUser = user;
    updateUserUI(user);
    if (document.body.dataset.protected === "true" && !user) { location.href = "login.html"; return; }
    if (user && document.body.dataset.authPage === "true") { location.href = "dashboard.html"; return; }
    startCommunityPosts();
  });
}

boot();
