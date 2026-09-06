
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
