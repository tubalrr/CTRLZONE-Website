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

    el.style.color =
      error
        ? "#ff8a8a"
        : "#5eead4";

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
   UPDATE USER INTERFACE
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


  document
    .querySelectorAll("[data-user-avatar]")
    .forEach(el => {

      if (photo) {

        el.innerHTML = `
          <img
            src="${photo}"
            alt="Profile picture"
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
        user
          ? "none"
          : "";

    });


  document
    .querySelectorAll("[data-auth-user]")
    .forEach(el => {

      el.style.display =
        user
          ? ""
          : "none";

    });


  const postForm =
    document.getElementById(
      "communityPostForm"
    );


  const loginHint =
    document.querySelector(
      ".login-hint"
    );


  if (postForm) {

    postForm.style.display =
      user
        ? "block"
        : "none";

  }


  if (loginHint) {

    loginHint.style.display =
      user
        ? "none"
        : "block";

  }

}


/* =========================
   LOAD COMMENTS
========================= */

function loadComments(postId) {

  const container =
    document.getElementById(
      "comments-" + postId
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


    (snapshot) => {


      if (snapshot.empty) {

        container.innerHTML = `
          <p class="no-comments">
            No comments yet.
          </p>
        `;

        return;

      }


      container.innerHTML =
        snapshot.docs.map((commentDoc) => {


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

              <p>
                ${content}
              </p>

              <small>
                ${date}
              </small>

            </div>

          `;


        }).join("");


    },


    (error) => {

      console.error(
        "Comments error:",
        error
      );


      container.innerHTML = `

        <p class="no-comments">
          Unable to load comments.
        </p>

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
        "comment-section-" + postId
      );


    if (!section) {

      console.error(
        "Comment section not found:",
        postId
      );

      return;

    }


    const isHidden =
      section.style.display === "none" ||
      section.style.display === "";


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
        "comment-input-" + postId
      );


    if (!input) return;


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
   LOAD COMMUNITY POSTS
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


    async (snapshot) => {


      if (snapshot.empty) {

        postsContainer.innerHTML = `

          <div class="card empty-posts">

            <h3>
              No posts yet
            </h3>

            <p>
              Be the first gamer to post
              in CTRLZONE Community! 🎮
            </p>

          </div>

        `;

        return;

      }


      const user =
        currentUser ||
        auth.currentUser;


      const postsHTML =
        await Promise.all(

          snapshot.docs.map(
            async (postDoc) => {


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
                name
                  .charAt(0)
                  .toUpperCase();


              const date =
                post.createdAt?.toDate

                  ? post.createdAt
                      .toDate()
                      .toLocaleString()

                  : "Just now";


              const content =
                escapeHTML(
                  post.content || ""
                )
                  .replaceAll(
                    "\n",
                    "<br>"
                  );


              const likes =
                Number(
                  post.likes || 0
                );


              let hasLiked =
                false;


              if (user) {

                try {

                  const likeRef = doc(

                    db,

                    "posts",

                    postId,

                    "likes",

                    user.uid

                  );


                  const likeSnapshot =
                    await getDoc(
                      likeRef
                    );


                  hasLiked =
                    likeSnapshot.exists();


                } catch (error) {

                  console.error(
                    "Like status error:",
                    error
                  );

                }

              }


              const likeText =
                hasLiked
                  ? "👍 Liked"
                  : "👍 Like";


              return `

                <article
                  class="community-post"
                >


                  <div
                    class="post-user"
                  >


                    <div
                      class="post-avatar"
                    >

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



                  <div
                    class="post-content"
                  >

                    ${content}

                  </div>



                  <div
                    class="post-actions"
                  >


                    <button

                      class="like-btn"

                      type="button"

                      onclick="toggleLike('${postId}')"

                    >

                      ${likeText}

                      <span>
                        ${likes}
                      </span>

                    </button>


                    <button

                      class="comment-btn"

                      type="button"

                      onclick="toggleComments('${postId}')"

                    >

                      💬 Comment

                    </button>


                  </div>



                  <div

                    class="comments-section"

                    id="comment-section-${postId}"

                    style="display:none;"

                  >


                    <div

                      class="comments-list"

                      id="comments-${postId}"

                    >

                      <p class="no-comments">
                        Loading comments...
                      </p>

                    </div>


                    <form

                      class="comment-form"

                      onsubmit="createComment(event, '${postId}')"

                    >


                      <input

                        type="text"

                        id="comment-input-${postId}"

                        placeholder="Write a comment..."

                        autocomplete="off"

                        required

                      >


                      <button
                        type="submit"
                      >

                        Send

                      </button>


                    </form>


                  </div>


                </article>

              `;


            }

          )

        );


      postsContainer.innerHTML =
        postsHTML.join("");


    },


    (error) => {


      console.error(
        "Firestore error:",
        error
      );


      postsContainer.innerHTML = `

        <div class="card">

          <h3>
            Firestore error
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


    } catch (err) {


      message(

        "authMessage",

        err.message,

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
              nameField
                .value
                .trim()

          }

        );


      }


      location.href =
        "dashboard.html";


    } catch (err) {


      message(

        "authMessage",

        err.message,

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


    } catch (err) {


      message(

        "authMessage",

        err.message,

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
   LIKE / UNLIKE SYSTEM
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


        async (transaction) => {


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


          const postData =
            postSnapshot.data();


          const currentLikes =
            Number(
              postData.likes || 0
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

        "Unable to update like: " +

        error.message

      );


    }

  };


/* =========================
   CREATE POST
========================= */

window.createCommunityPost =
  async function(e) {


    e.preventDefault();


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


    const user =
      currentUser ||
      auth.currentUser;


    if (!user) {


      if (status) {

        status.textContent =
          "Your login session is still loading. Please wait a moment.";

        status.style.color =
          "#ff8a8a";

      }


      return;

    }


    const content =
      input.value.trim();


    if (!content) return;


    button.disabled =
      true;


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


      input.value =
        "";


      if (status) {

        status.textContent =
          "Posted successfully! 🔥";

        status.style.color =
          "#5eead4";

      }


    } catch (error) {


      if (status) {

        status.textContent =
          error.message;

        status.style.color =
          "#ff8a8a";

      }


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

    (user) => {


      currentUser =
        user;


      updateUserUI(
        user
      );


      if (

        document.body
          .dataset
          .protected === "true"

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

        document.body
          .dataset
          .authPage === "true"

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
