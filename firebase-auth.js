
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
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
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit
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
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

function message(id, text, error = false) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
    el.style.color = error ? "#ff8a8a" : "#5eead4";
  }
}

function updateUserUI(user) {
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Gamer";
  const email = user?.email || "";
  const photo = user?.photoURL || "";

  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = displayName);
  document.querySelectorAll("[data-user-email]").forEach(el => el.textContent = email);

  document.querySelectorAll("[data-user-avatar]").forEach(el => {
    if (photo) {
      el.innerHTML = `<img src="${photo}" alt="Profile picture">`;
      el.classList.add("has-photo");
    } else {
      el.textContent = displayName.charAt(0).toUpperCase();
      el.classList.remove("has-photo");
    }
  });

  document.querySelectorAll("[data-auth-login]").forEach(el => {
    el.style.display = user ? "none" : "";
  });
  document.querySelectorAll("[data-auth-user]").forEach(el => {
    el.style.display = user ? "" : "none";
  });
}

window.ctrlzoneLogin = async function(e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "dashboard.html";
  } catch (err) {
    message("authMessage", err.message, true);
  }
};

window.ctrlzoneRegister = async function(e) {
  e.preventDefault();
  const name = document.getElementById("displayName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(credential.user, { displayName: name });
    location.href = "dashboard.html";
  } catch (err) {
    message("authMessage", err.message, true);
  }
};

window.googleLogin = async function() {
  try {
    await signInWithPopup(auth, provider);
    location.href = "dashboard.html";
  } catch (err) {
    message("authMessage", err.message, true);
  }
};

window.ctrlzoneLogout = async function() {
  try {
    await signOut(auth);
    location.href = "index.html";
  } catch (err) {
    alert("Logout failed: " + err.message);
  }
};

onAuthStateChanged(auth, (user) => {
  updateUserUI(user);

  if (document.body.dataset.protected === "true" && !user) {
    location.href = "login.html";
  }

  if (user && document.body.dataset.authPage === "true") {
    location.href = "dashboard.html";
  }
});


function formatPostDate(timestamp) {
  if (!timestamp?.toDate) return "Just now";
  return timestamp.toDate().toLocaleString();
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderPosts() {
  const postsContainer = document.getElementById("communityPosts");
  if (!postsContainer) return;

  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  onSnapshot(postsQuery, (snapshot) => {
    if (snapshot.empty) {
      postsContainer.innerHTML = '<div class="card empty-posts"><h3>No posts yet</h3><p>Be the first gamer to post in CTRLZONE Community! 🎮</p></div>';
      return;
    }

    postsContainer.innerHTML = snapshot.docs.map((doc) => {
      const post = doc.data();
      const name = post.name || "CTRLZONE Gamer";
      const initial = name.charAt(0).toUpperCase();
      const content = escapeHTML(post.content || "").replaceAll("\n", "<br>");
      return `
        <article class="community-post">
          <div class="post-user">
            <div class="post-avatar">${escapeHTML(initial)}</div>
            <div>
              <h3>${escapeHTML(name)}</h3>
              <span>${formatPostDate(post.createdAt)}</span>
            </div>
          </div>
          <div class="post-content">${content}</div>
        </article>
      `;
    }).join("");
  }, (error) => {
    postsContainer.innerHTML = `<div class="card"><h3>Unable to load posts</h3><p>${escapeHTML(error.message)}</p></div>`;
  });
}

window.createCommunityPost = async function(e) {
  e.preventDefault();

  const user = auth.currentUser;
  const input = document.getElementById("postContent");
  const status = document.getElementById("postStatus");

  if (!user) {
    location.href = "login.html";
    return;
  }

  const content = input.value.trim();
  if (!content) return;

  const button = document.getElementById("postButton");
  button.disabled = true;
  button.textContent = "POSTING...";
  status.textContent = "";

  try {
    await addDoc(collection(db, "posts"), {
      uid: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "CTRLZONE Gamer",
      email: user.email || "",
      content,
      createdAt: serverTimestamp()
    });

    input.value = "";
    status.textContent = "Posted successfully! 🔥";
    status.style.color = "#5eead4";
  } catch (error) {
    status.textContent = error.message;
    status.style.color = "#ff8a8a";
  } finally {
    button.disabled = false;
    button.textContent = "POST";
  }
};

renderPosts();
