# CTRLZONE Website

A front-end, responsive gaming platform.

## Run
Open `index.html` in a browser.

## Included
Home, Games, Live, Videos, Community, Events, News, Gallery,
CTRL Spin, About, Contact, Login, Register and Dashboard.

## Important
This is a working FRONT-END website. Login, registration, posts,
real live-stream detection, database, and admin authentication require
a backend such as PHP/MySQL, Node.js, Firebase, or Supabase.


## Firebase Authentication
Includes Email/Password registration and login, Google sign-in, authenticated user profile display, logout, and dashboard route protection.


## Firestore Community
The Community page now uses the `posts` collection in Cloud Firestore.

Each post stores:
- uid
- name
- email
- content
- createdAt

For development, Firestore test mode can be used. Before public release, configure secure Firestore rules.
