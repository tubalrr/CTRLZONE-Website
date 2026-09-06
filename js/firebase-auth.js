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
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================
   FIREBASE CONFIG
========================= */

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


/* =========================
   MESSAGE
========================= */

function message(id, text, error = false) {

  const el = document.getElementById(id);

  if (el) {
    el.textContent = text;
    el.style.color = error ? "#ff8a8a" : "#5eead4";
  }

}


/* =========================
   UPDATE USER UI
========================= */

function updateUserUI(user) {

  const displayName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "CTRLZONE Gamer";


  const email =
    user?.email || "";


  const photo =
    user?.photoURL || "";


  document
    .querySelectorAll("[data-user-name]")
    .forEach(el => {

      el.textContent = displayName;

    });


  document
    .querySelectorAll("[data-user-email]")
    .forEach(el => {

      el.textContent = email;

    });


  /* PROFILE PICTURE */

  document
    .querySelectorAll("[data-user-avatar]")
    .forEach(el => {

      if (photo) {

        el.innerHTML = `
          <img
            src="${photo}"
            alt="Profile Picture"
            style="
              width:100%;
              height:100%;
              object-fit:cover;
              border-radius:50%;
              display:block;
            "
          >
        `;

      } else {

        el.textContent =
          displayName
            .charAt(0)
            .toUpperCase();

      }

    });


  document
    .querySelectorAll("[data-auth-login]")
    .forEach(el => {

      el.style.display =
        user ? "none" : "";

    });


  document
    .querySelectorAll("[data-auth-user]")
    .forEach(el => {

      el.style.display =
        user ? "" : "none";

    });


  const postForm =
    document.getElementById("communityPostForm");


  const loginHint =
    document.querySelector(".login-hint");


  if (postForm) {

    postForm.style.display =
      user ? "block" : "none";

  }


  if (loginHint) {

    loginHint.style.display =
      user ? "none" : "block";

  }

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(text) {

  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================
   LOAD COMMENTS
========================= */

function loadComments(postId) {

  const container =
    document.getElementById(
      `comments-${postId}`
    );


  if (!container) return;


  const commentsQuery = query(

    collection(
      db,
      "posts",
      postId,
      "comments"
    ),

    orderBy(
      "createdAt",
      "asc"
    ),

    limit(100)

  );


  onSnapshot(

    commentsQuery,


    snapshot => {

      if (snapshot.empty) {

        container.innerHTML =
          `<p class="no-comments">
            No comments yet.
          </p>`;

        return;

      }


      container.innerHTML =
        snapshot.docs.map(commentDoc => {

          const comment =
            commentDoc.data();


          const name =
            escapeHTML(
              comment.name ||
              "CTRLZONE Gamer"
            );


          const content =
            escapeHTML(
              comment.content
            );


          const date =
            comment.createdAt?.toDate

              ? comment.createdAt
                  .toDate()
                  .toLocaleString()

              : "Just now";


          return `

            <div class="comment-item">

              <strong>
                ${name}
              </strong>

              <div>
                ${content}
              </div>

              <small>
                ${date}
              </small>

            </div>

          `;

        }).join("");

    },


    error => {

      console.error(
        "Comments error:",
        error
      );

    }

  );

}


/* =========================
   LOAD POSTS
========================= */

function startCommunityPosts() {

  const postsContainer =
    document.getElementById(
      "communityPosts"
    );


  if (!postsContainer) return;


  const postsQuery = query(

    collection(db, "posts"),

    orderBy(
      "createdAt",
      "desc"
    ),

    limit(50)

  );


  onSnapshot(

    postsQuery,


    snapshot => {


      if (snapshot.empty) {

        postsContainer.innerHTML = `

          <div class="card">

            <h3>No posts yet</h3>

            <p>
              Be the first gamer to post! 🎮
            </p>

          </div>

        `;

        return;

      }


      const postsHTML =
        snapshot.docs.map(postDoc => {


          const post =
            postDoc.data();


          const postId =
            postDoc.id;


          const name =
            escapeHTML(
              post.name ||
              "CTRLZONE Gamer"
            );


          const initial =
            name.charAt(0).toUpperCase();


          const content =
            escapeHTML(
              post.content
            ).replaceAll(
              "\n",
              "<br>"
            );


          const date =
            post.createdAt?.toDate

              ? post.createdAt
                  .toDate()
                  .toLocaleString()

              : "Just now";


          const likes =
            Number(
              post.likes || 0
            );


          return `

            <article class="community-post">

              <div class="post-user">

                <div class="post-avatar">

                  ${initial}

                </div>


                <div>

                  <h3>
                    ${name}
                  </h3>

                  <span>
                    ${date}
                  </span>

                </div>

              </div>


              <div class="post-content">

                ${content}

              </div>


              <div class="post-actions">

                <button
                  class="like-btn"
                  type="button"
                  onclick="toggleLike('${postId}')"
                >

                  👍 Like (${likes})

                </button>


                <button
                  class="comment-btn"
                  type="button"
                  onclick="toggleComments('${postId}')"
                >

                  💬 Comments

                </button>

              </div>


              <div
                class="comments-section"
                id="comment-section-${postId}"
                style="display:none"
              >


                <div
                  id="comments-${postId}"
                  class="comments-list"
                >

                  Loading comments...

                </div>


                <form
                  onsubmit="createComment(event, '${postId}')"
                  class="comment-form"
                >

                  <input
                    type="text"
                    id="comment-input-${postId}"
                    placeholder="Write a comment..."
                    required
                  >


                  <button type="submit">

                    Send

                  </button>

                </form>


              </div>


            </article>

          `;


        }).join("");


      postsContainer.innerHTML =
        postsHTML;


    },


    error => {

      console.error(
        "Firestore error:",
        error
      );


      postsContainer.innerHTML = `

        <div class="card">

          <h3>
            Firestore Error
          </h3>

          <p>
            ${escapeHTML(error.message)}
          </p>

        </div>

      `;

    }

  );

}


/* =========================
   SHOW / HIDE COMMENTS
========================= */

window.toggleComments =
  function(postId) {

    const section =
      document.getElementById(
        `comment-section-${postId}`
      );


    if (!section) return;


    const isHidden =
      section.style.display === "none";


    if (isHidden) {

      section.style.display =
        "block";


      loadComments(postId);

    } else {

      section.style.display =
        "none";

    }

  };


/* =========================
   CREATE COMMENT
========================= */

window.createComment =
  async function(e, postId) {

    e.preventDefault();


    const user =
      currentUser ||
      auth.currentUser;


    if (!user) {

      alert(
        "Please log in first."
      );

      return;

    }


    const input =
      document.getElementById(
        `comment-input-${postId}`
      );


    const content =
      input.value.trim();


    if (!content) return;


    try {

      await addDoc(

        collection(
          db,
          "posts",
          postId,
          "comments"
        ),

        {

          uid:
            user.uid,


          name:

            user.displayName ||

            user.email
              ?.split("@")[0] ||

            "CTRLZONE Gamer",


          content:
            content,


          createdAt:
            serverTimestamp()

        }

      );


      input.value = "";


    } catch (error) {

      console.error(
        "Comment error:",
        error
      );


      alert(
        "Unable to post comment: " +
        error.message
      );

    }

  };


/* =========================
   LIKE / UNLIKE
========================= */

window.toggleLike =
  async function(postId) {

    const user =
      currentUser ||
      auth.currentUser;


    if (!user) {

      alert(
        "Please log in first."
      );

      return;

    }


    const postRef =
      doc(
        db,
        "posts",
        postId
      );


    const likeRef =
      doc(
        db,
        "posts",
        postId,
        "likes",
        user.uid
      );


    try {

      await runTransaction(

        db,


        async transaction => {


          const postSnapshot =
            await transaction.get(
              postRef
            );


          const likeSnapshot =
            await transaction.get(
              likeRef
            );


          if (
            !postSnapshot.exists()
          ) {

            throw new Error(
              "Post does not exist."
            );

          }


          const currentLikes =
            Number(
              postSnapshot
                .data()
                .likes || 0
            );


          if (
            likeSnapshot.exists()
          ) {

            /* UNLIKE */

            transaction.delete(
              likeRef
            );


            transaction.update(

              postRef,

              {

                likes:

                  Math.max(
                    0,
                    currentLikes - 1
                  )

              }

            );


          } else {

            /* LIKE */

            transaction.set(

              likeRef,

              {

                uid:
                  user.uid,

                createdAt:
                  new Date()

              }

            );


            transaction.update(

              postRef,

              {

                likes:
                  currentLikes + 1

              }

            );

          }

        }

      );


    } catch (error) {

      console.error(
        "Like error:",
        error
      );


      alert(
        "Unable to update Like: " +
        error.message
      );

    }

  };


/* =========================
   LOGIN
========================= */

window.ctrlzoneLogin =
  async function(e) {

    e.preventDefault();


    try {

      await signInWithEmailAndPassword(

        auth,

        document
          .getElementById("email")
          .value
          .trim(),

        document
          .getElementById("password")
          .value

      );


      location.href =
        "dashboard.html";


    } catch (error) {

      message(
        "authMessage",
        error.message,
        true
      );

    }

  };


/* =========================
   REGISTER
========================= */

window.ctrlzoneRegister =
  async function(e) {

    e.preventDefault();


    try {

      const credential =
        await createUserWithEmailAndPassword(

          auth,

          document
            .getElementById("email")
            .value
            .trim(),

          document
            .getElementById("password")
            .value

        );


      const nameField =
        document.getElementById(
          "displayName"
        );


      if (
        nameField?.value.trim()
      ) {

        await updateProfile(

          credential.user,

          {

            displayName:
              nameField.value.trim()

          }

        );

      }


      location.href =
        "dashboard.html";


    } catch (error) {

      message(
        "authMessage",
        error.message,
        true
      );

    }

  };


/* =========================
   GOOGLE LOGIN
========================= */

window.googleLogin =
  async function() {

    try {

      await signInWithPopup(
        auth,
        provider
      );


      location.href =
        "dashboard.html";


    } catch (error) {

      message(
        "authMessage",
        error.message,
        true
      );

    }

  };


/* =========================
   LOGOUT
========================= */

window.ctrlzoneLogout =
  async function() {

    await signOut(auth);

    location.href =
      "index.html";

  };


/* =========================
   CREATE POST
========================= */

window.createCommunityPost =
  async function(e) {

    e.preventDefault();


    const user =
      currentUser ||
      auth.currentUser;


    const status =
      document.getElementById(
        "postStatus"
      );


    const input =
      document.getElementById(
        "postContent"
      );


    const button =
      document.getElementById(
        "postButton"
      );


    if (!user) {

      status.textContent =
        "Please log in first.";

      status.style.color =
        "#ff8a8a";

      return;

    }


    const content =
      input.value.trim();


    if (!content) return;


    button.disabled = true;

    button.textContent =
      "POSTING...";


    try {

      await addDoc(

        collection(
          db,
          "posts"
        ),

        {

          uid:
            user.uid,


          name:

            user.displayName ||

            user.email
              ?.split("@")[0] ||

            "CTRLZONE Gamer",


          email:
            user.email || "",


          content:
            content,


          likes:
            0,


          createdAt:
            serverTimestamp()

        }

      );


      input.value = "";


      status.textContent =
        "Posted successfully! 🔥";


      status.style.color =
        "#5eead4";


    } catch (error) {

      status.textContent =
        error.message;


      status.style.color =
        "#ff8a8a";


      console.error(error);


    } finally {

      button.disabled =
        false;


      button.textContent =
        "POST";

    }

  };


/* =========================
   START FIREBASE
========================= */

async function boot() {

  try {

    await setPersistence(
      auth,
      browserLocalPersistence
    );

  } catch (error) {

    console.warn(
      "Persistence warning:",
      error
    );

  }


  onAuthStateChanged(

    auth,


    user => {


      currentUser = user;


      updateUserUI(user);


      if (

        document.body.dataset.protected ===
        "true"

        &&

        !user

      ) {

        location.href =
          "login.html";

        return;

      }


      if (

        user

        &&

        document.body.dataset.authPage ===
        "true"

      ) {

        location.href =
          "dashboard.html";

        return;

      }


      startCommunityPosts();

    }

  );

}


boot();
