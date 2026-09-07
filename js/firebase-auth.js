/* =========================================
   CTRLZONE FIREBASE AUTH + COMMUNITY SYSTEM
   FULL UPDATED VERSION
========================================= */


/* =========================================
   FIREBASE IMPORTS
========================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";


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

} from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


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

} from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";



/* =========================================
   FIREBASE CONFIG
========================================= */

const firebaseConfig = {

  apiKey:
    "AIzaSyDZ9dqwfUbKGSNq9YK96voy-vUiC-dkg5c",

  authDomain:
    "ctrlzone-50db8.firebaseapp.com",

  projectId:
    "ctrlzone-50db8",

  storageBucket:
    "ctrlzone-50db8.firebasestorage.app",

  messagingSenderId:
    "961266035107",

  appId:
    "1:961266035107:web:03c628e259d317013b9216"

};



/* =========================================
   INITIALIZE FIREBASE
========================================= */

const app =
  initializeApp(firebaseConfig);


const auth =
  getAuth(app);


const db =
  getFirestore(app);


const provider =
  new GoogleAuthProvider();



/* =========================================
   GLOBAL VARIABLES
========================================= */

let currentUser = null;

let postsStarted = false;

let authListenerStarted = false;



/* =========================================
   MESSAGE FUNCTION
========================================= */

function message(
  id,
  text,
  error = false
) {

  const el =
    document.getElementById(id);


  if (!el) return;


  el.textContent = text;


  el.style.color =
    error
      ? "#ff8a8a"
      : "#5eead4";

}



/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(text) {

  return String(text || "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}



/* =========================================
   FORMAT DATE
========================================= */

function formatDate(timestamp) {

  if (!timestamp) {

    return "Just now";

  }


  if (
    typeof timestamp.toDate === "function"
  ) {

    return timestamp
      .toDate()
      .toLocaleString();

  }


  return "Just now";

}



/* =========================================
   UPDATE USER INTERFACE
========================================= */

function updateUserUI(user) {


  const displayName =

    user?.displayName ||

    user?.email
      ?.split("@")[0] ||

    "CTRLZONE Gamer";


  const email =
    user?.email || "";


  const photo =
    user?.photoURL || "";



  /* USER NAME */

  document
    .querySelectorAll(
      "[data-user-name]"
    )
    .forEach(el => {

      el.textContent =
        displayName;

    });



  /* USER EMAIL */

  document
    .querySelectorAll(
      "[data-user-email]"
    )
    .forEach(el => {

      el.textContent =
        email;

    });



  /* PROFILE AVATAR */

  document
    .querySelectorAll(
      "[data-user-avatar]"
    )
    .forEach(el => {


      if (photo) {


        el.innerHTML =

          `<img
            src="${photo}"
            alt="Profile picture"
          >`;


      } else {


        el.textContent =

          displayName
            .charAt(0)
            .toUpperCase();

      }


    });



  /* LOGIN BUTTON */

  document
    .querySelectorAll(
      "[data-auth-login]"
    )
    .forEach(el => {


      el.style.display =

        user
          ? "none"
          : "";


    });



  /* USER AREA */

  document
    .querySelectorAll(
      "[data-auth-user]"
    )
    .forEach(el => {


      el.style.display =

        user
          ? ""
          : "none";


    });



  /* COMMUNITY POST FORM */

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



/* =========================================
   LOGIN
========================================= */

window.ctrlzoneLogin =
async function(e) {


  e.preventDefault();



  const email =

    document
      .getElementById("email")
      ?.value
      .trim();


  const password =

    document
      .getElementById("password")
      ?.value;



  if (
    !email ||
    !password
  ) {


    message(

      "authMessage",

      "Please enter your email and password.",

      true

    );


    return;

  }



  try {


    await signInWithEmailAndPassword(

      auth,

      email,

      password

    );



    location.href =
      "dashboard.html";


  }


  catch (err) {


    console.error(err);


    message(

      "authMessage",

      err.message,

      true

    );


  }


};



/* =========================================
   REGISTER
========================================= */

window.ctrlzoneRegister =
async function(e) {


  e.preventDefault();



  const email =

    document
      .getElementById("email")
      ?.value
      .trim();


  const password =

    document
      .getElementById("password")
      ?.value;


  const nameField =

    document.getElementById(
      "displayName"
    );



  if (
    !email ||
    !password
  ) {


    message(

      "authMessage",

      "Please complete all required fields.",

      true

    );


    return;

  }



  try {


    const credential =

      await createUserWithEmailAndPassword(

        auth,

        email,

        password

      );



    if (
      nameField &&
      nameField.value.trim()
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


  }


  catch (err) {


    console.error(err);


    message(

      "authMessage",

      err.message,

      true

    );


  }


};




/* =========================================
   GOOGLE LOGIN
========================================= */

window.googleLogin =
async function() {


  try {


    await signInWithPopup(

      auth,

      provider

    );



    location.href =
      "dashboard.html";


  }


  catch (err) {


    console.error(err);


    message(

      "authMessage",

      err.message,

      true

    );


  }


};




/* =========================================
   LOGOUT
========================================= */

window.ctrlzoneLogout =
async function() {


  try {


    await signOut(auth);


    location.href =
      "index.html";


  }


  catch (error) {


    console.error(error);


  }


};




/* =========================================
   CREATE COMMUNITY POST
========================================= */

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

        "Please log in first.";


      status.style.color =
        "#ff8a8a";


    }


    return;

  }



  if (!input) return;



  const content =
    input.value.trim();



  if (!content) {


    if (status) {


      status.textContent =

        "Please write something first.";


      status.style.color =
        "#ff8a8a";


    }


    return;

  }



  if (button) {


    button.disabled = true;


    button.textContent =
      "POSTING...";


  }



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


        photoURL:
          user.photoURL || "",


        content:
          content,


        likes:
          0,


        createdAt:
          serverTimestamp()


      }

    );



    input.value = "";



    if (status) {


      status.textContent =
        "Posted successfully! 🔥";


      status.style.color =
        "#5eead4";


    }


  }


  catch (error) {


    console.error(
      "POST ERROR:",
      error
    );



    if (status) {


      status.textContent =
        error.message;


      status.style.color =
        "#ff8a8a";


    }


  }


  finally {


    if (button) {


      button.disabled = false;


      button.textContent =
        "POST";


    }


  }


};




/* =========================================
   START COMMUNITY POSTS
========================================= */

function startCommunityPosts() {


  if (postsStarted) return;



  const postsContainer =

    document.getElementById(
      "communityPosts"
    );



  if (!postsContainer) return;



  postsStarted = true;



  const postsQuery =

    query(

      collection(
        db,
        "posts"
      ),

      orderBy(
        "createdAt",
        "desc"
      ),

      limit(50)

    );



  onSnapshot(

    postsQuery,


    async snapshot => {


      if (snapshot.empty) {


        postsContainer.innerHTML = `

          <div class="card empty-posts">

            <h3>
              No posts yet
            </h3>

            <p>

              Be the first gamer to post in
              CTRLZONE Community! 🎮

            </p>

          </div>

        `;


        return;

      }



      const html =

        snapshot.docs.map(
          postDoc => {


            const post =
              postDoc.data();



            const postId =
              postDoc.id;



            const name =

              post.name ||

              "CTRLZONE Gamer";



            const initial =

              name
                .charAt(0)
                .toUpperCase();



            const date =

              formatDate(
                post.createdAt
              );



            const content =

              escapeHTML(
                post.content
              )

                .replaceAll(
                  "\n",
                  "<br>"
                );



            const likes =

              Number(
                post.likes || 0
              );



            let avatarHTML =
              initial;



            if (post.photoURL) {


              avatarHTML =

                `<img
                  src="${escapeHTML(post.photoURL)}"
                  alt="Profile picture"
                >`;


            }



            return `


<article
  class="community-post"
  data-post-id="${postId}"
>


  <!-- POST USER -->


  <div class="post-user">


    <div class="post-avatar">

      ${avatarHTML}

    </div>



    <div>


      <h3>

        ${escapeHTML(name)}

      </h3>



      <span>

        ${date}

      </span>


    </div>


  </div>




  <!-- POST CONTENT -->


  <div class="post-content">

    ${content}

  </div>




  <!-- POST ACTIONS -->


  <div class="post-actions">


    <button

      class="like-btn"

      type="button"

      data-like-post="${postId}"

    >

      👍

      <span>

        ${likes}

      </span>

      Like${likes === 1 ? "" : "s"}

    </button>




    <button

      class="comment-btn"

      type="button"

      data-comment-toggle="${postId}"

    >

      💬 Comment

    </button>


  </div>




  <!-- COMMENTS -->


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

      data-post-id="${postId}"

    >


      <input

        type="text"

        class="comment-input"

        id="comment-input-${postId}"

        placeholder="Write a comment..."

        autocomplete="off"

      >



      <button

        type="submit"

        class="comment-send-btn"

      >

        Send

      </button>


    </form>


  </div>


</article>


`;


          }

        ).join("");



      postsContainer.innerHTML =
        html;



      /* LOAD COMMENTS */

      snapshot.docs.forEach(
        postDoc => {


          loadComments(
            postDoc.id
          );


        }

      );



      /* CHECK LIKE STATUS */

      refreshLikeButtons(
        snapshot.docs
      );


    },


    error => {


      console.error(
        "POSTS ERROR:",
        error
      );


      postsContainer.innerHTML = `

        <div class="card">

          <h3>
            Firestore Error
          </h3>

          <p>

            ${escapeHTML(
              error.message
            )}

          </p>

        </div>

      `;


    }

  );


}




/* =========================================
   TOGGLE COMMENT SECTION
========================================= */

window.toggleComments =
function(postId) {


  const section =

    document.getElementById(
      "comment-section-" + postId
    );



  if (!section) return;



  if (
    section.style.display ===
    "none"
  ) {


    section.style.display =
      "block";


  }

  else {


    section.style.display =
      "none";


  }


};




/* =========================================
   EVENT DELEGATION
   COMMENT BUTTON
========================================= */

document.addEventListener(

  "click",

  async function(e) {


    const commentButton =

      e.target.closest(
        "[data-comment-toggle]"
      );



    if (commentButton) {


      const postId =

        commentButton.dataset
          .commentToggle;



      window.toggleComments(
        postId
      );


      return;

    }




    const likeButton =

      e.target.closest(
        "[data-like-post]"
      );



    if (likeButton) {


      const postId =

        likeButton.dataset
          .likePost;



      await window.toggleLike(
        postId
      );


    }


  }

);




/* =========================================
   EVENT DELEGATION
   COMMENT FORM
========================================= */

document.addEventListener(

  "submit",

  async function(e) {


    const form =

      e.target.closest(
        ".comment-form"
      );



    if (!form) return;



    e.preventDefault();



    const postId =

      form.dataset.postId;



    console.log(
      "COMMENT FORM SUBMITTED:",
      postId
    );



    await window.createComment(
      postId,
      form
    );


  }

);




/* =========================================
   CREATE COMMENT
========================================= */

window.createComment =
async function(
  postId,
  form
) {


  console.log(
    "STARTING COMMENT:",
    postId
  );



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

    form.querySelector(
      ".comment-input"
    );



  const button =

    form.querySelector(
      ".comment-send-btn"
    );



  if (!input) {


    console.error(
      "COMMENT INPUT NOT FOUND"
    );


    return;

  }



  const content =
    input.value.trim();



  if (!content) {


    alert(
      "Please write a comment."
    );


    return;

  }



  try {


    if (button) {


      button.disabled = true;


      button.textContent =
        "Sending...";


    }



    console.log(
      "SAVING COMMENT..."
    );



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


        photoURL:

          user.photoURL || "",


        content:
          content,


        createdAt:
          serverTimestamp()


      }

    );



    console.log(
      "COMMENT SAVED SUCCESSFULLY"
    );



    input.value = "";


  }


  catch (error) {


    console.error(

      "COMMENT ERROR:",

      error

    );



    alert(

      "Unable to post comment:\n\n" +

      error.message

    );


  }


  finally {


    if (button) {


      button.disabled = false;


      button.textContent =
        "Send";


    }


  }


};




/* =========================================
   LOAD COMMENTS
========================================= */

function loadComments(postId) {


  const container =

    document.getElementById(
      "comments-" + postId
    );



  if (!container) return;



  const commentsQuery =

    query(

      collection(

        db,

        "posts",

        postId,

        "comments"

      ),

      orderBy(

        "createdAt",

        "asc"

      )

    );



  onSnapshot(

    commentsQuery,


    snapshot => {


      if (snapshot.empty) {


        container.innerHTML = `

          <p class="no-comments">

            No comments yet.

          </p>

        `;


        return;

      }



      container.innerHTML =

        snapshot.docs.map(
          commentDoc => {


            const comment =

              commentDoc.data();



            const name =

              comment.name ||

              "CTRLZONE Gamer";



            const initial =

              name
                .charAt(0)
                .toUpperCase();



            const content =

              escapeHTML(
                comment.content
              );



            const date =

              formatDate(
                comment.createdAt
              );



            let avatarHTML =
              initial;



            if (comment.photoURL) {


              avatarHTML =

                `<img
                  src="${escapeHTML(comment.photoURL)}"
                  alt="Profile picture"
                >`;


            }



            return `


<div class="comment-item">


  <div
    class="comment-avatar"
  >

    ${avatarHTML}

  </div>



  <div
    class="comment-body"
  >


    <strong>

      ${escapeHTML(name)}

    </strong>



    <p>

      ${content}

    </p>



    <small>

      ${date}

    </small>


  </div>


</div>


`;


          }

        ).join("");


    },


    error => {


      console.error(

        "LOAD COMMENTS ERROR:",

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




/* =========================================
   LIKE SYSTEM
   ONE LIKE PER USER
========================================= */

window.toggleLike =
async function(postId) {


  const user =

    currentUser ||
    auth.currentUser;



  if (!user) {


    alert(
      "Please log in first to like a post."
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


        const likeSnapshot =

          await transaction.get(
            likeRef
          );



        if (
          likeSnapshot.exists()
        ) {


          transaction.delete(
            likeRef
          );



          transaction.update(

            postRef,

            {

              likes:

                increment(-1)

            }

          );


        }

        else {


          transaction.set(

            likeRef,

            {

              uid:
                user.uid,

              createdAt:
                serverTimestamp()

            }

          );



          transaction.update(

            postRef,

            {

              likes:

                increment(1)

            }

          );


        }


      }

    );


  }


  catch (error) {


    console.error(
      "LIKE ERROR:",
      error
    );


    alert(

      "Unable to update like:\n\n" +

      error.message

    );


  }


};




/* =========================================
   REFRESH LIKE BUTTONS
========================================= */

async function refreshLikeButtons(
  postDocs
) {


  const user =

    currentUser ||
    auth.currentUser;



  if (!user) return;



  for (

    const postDoc of postDocs

  ) {


    const likeRef =

      doc(

        db,

        "posts",

        postDoc.id,

        "likes",

        user.uid

      );



    try {


      const likeSnapshot =

        await getDoc(
          likeRef
        );



      const button =

        document.querySelector(

          `[data-like-post="${postDoc.id}"]`

        );



      if (!button) continue;



      if (
        likeSnapshot.exists()
      ) {


        button.classList.add(
          "liked"
        );


        button.title =
          "Click to unlike";


      }

      else {


        button.classList.remove(
          "liked"
        );


        button.title =
          "Click to like";


      }


    }


    catch (error) {


      console.warn(
        "LIKE STATUS ERROR:",
        error
      );


    }


  }


}




/* =========================================
   FIREBASE BOOT
========================================= */

async function boot() {


  try {


    await setPersistence(

      auth,

      browserLocalPersistence

    );


  }


  catch (error) {


    console.warn(

      "Persistence warning:",

      error

    );


  }



  if (
    authListenerStarted
  ) return;



  authListenerStarted =
    true;



  onAuthStateChanged(

    auth,


    user => {


      currentUser =
        user;



      updateUserUI(
        user
      );



      /* PROTECTED PAGE */

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



      /* AUTH PAGE */

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



      /* COMMUNITY */

      startCommunityPosts();


    }

  );


}



/* =========================================
   START APPLICATION
========================================= */

boot();
