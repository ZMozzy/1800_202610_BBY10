// src/authentication.js
// ------------------------------------------------------------
// Part of the COMP1800 Projects 1 Course (BCIT).
// Starter code provided for students to use and adapt.
// Contains reusable Firebase Authentication functions
// (login, signup, logout, and auth state checks).
// -------------------------------------------------------------

// Import the initialized Firebase Authentication object
//import { auth } from "/src/firebaseConfig.js";
import { auth, db } from "/src/firebaseConfig.js";
import { doc, getDoc, setDoc } from "firebase/firestore";


//This is the imports for firstore database !!!!!!!!!!!!!!!!!!!!!!!!!
// import { db } from "/src/firebaseConfig.js";
// import { doc, setDoc } from "firebase/firestore";

// Import specific functions from the Firebase Auth SDK
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// -------------------------------------------------------------
// loginUser(email, password)
// -------------------------------------------------------------
// Logs an existing user into Firebase Authentication.
//
// Parameters:
//   email (string)    - user's email
//   password (string) - user's password
//
// Returns: Promise resolving to the user credential object.
// Usage:
//   await loginUser("user@example.com", "password123");
// -------------------------------------------------------------
export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// -------------------------------------------------------------
// signupUser(name, email, password)
// -------------------------------------------------------------
// Creates a new user account with Firebase Authentication,
// then updates the user's profile with a display name.
//
// Parameters:
//   name (string)     - user's display name
//   email (string)    - user's email
//   password (string) - user's password
//
// Returns: the created user object.
// Usage:
//   const user = await signupUser("Alice", "alice@email.com", "secret");
// -------------------------------------------------------------
// export async function signupUser(name, email, password) {
//   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//   await updateProfile(userCredential.user, { displayName: name });
//   return userCredential.user;
// }

//line 64-93 is updateded sign up to user database !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// export async function signupUser(name, email, password) {
//   const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//   await updateProfile(userCredential.user, { displayName: name });
//   return userCredential.user;
// }


//creates the user collection with the following fields
export async function signupUser(name, email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  // create Firestore user document
  await setDoc(doc(db, "users", user.uid), {
    name: name,
    email: email,
    hasRestaurant: false,
    restaurantId: null
  });

  return user;
}
// -------------------------------------------------------------
// logoutUser()
// -------------------------------------------------------------
// Signs out the currently logged-in user and redirects them
// back to the login page (index.html).
//
// Usage:
//   await logoutUser();
// -------------------------------------------------------------

export async function logoutUser() {
  await signOut(auth);
  window.location.href = "/restaurant_list/landing.html";
}
// -------------------------------------------------------------
// checkAuthState()
// -------------------------------------------------------------
// Observes changes in the user's authentication state (login/logout)
// and updates the UI or redirects accordingly.
//
// If the user is on "main.html":
//   - If logged in → displays "Hello, [Name]!"
//   - If not logged in → redirects to "index.html"
//
// This function should be called once when the page loads.
//
// Usage:
//   checkAuthState();
// -------------------------------------------------------------

//THE FOLLOW CODE WORKS, THIS FOLLOWING CHECKAUTHSTATE() IS THE OG
// export function checkAuthState() {
//   onAuthStateChanged(auth, (user) => {
//     if (window.location.pathname.endsWith("main.html")) {
//       if (user) {
//         const displayName = user.displayName || user.email;
//         $("#welcomeMessage").text(`Hello, ${displayName}!`);
//       } else {
//         window.location.href = "index.html";
//       }
//     }
//   });
// }

//IF THERES A MERGE CONFLICT WITH YOU
//PLEASE KEEP THIS VERSION ! ! ! ! 
//THIS VERSION WORKS ! ! ! ! ! ! ! ! ! ! ! ! 
export function checkAuthState() {
  onAuthStateChanged(auth, async (user) => {
    const page = window.location.pathname.split("/").pop();

    // only do this routing on main.html
    if (page !== "login.html") {
      return;
    }

    if (!user) {
      // window.location.href = "index.html";
      return;
    }

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (!userSnap.exists()) {
        console.log("No user document found.");
        return;
      }

      const userData = userSnap.data();

      if (userData.hasRestaurant === true) {
        window.location.href = "owner-profile.html";
      } else {
        window.location.href = "user-profile.html";
        
  }
    } catch (error) {
      console.error("Error checking user data:", error);
    }
  });
}

// export function checkAuthState() {
//   onAuthStateChanged(auth, async (user) => {
//     const currentPage = window.location.pathname;

//     // Only run this redirect logic on main.html
//     if (!currentPage.endsWith("main.html")) {
//       return;
//     }

//     if (!user) {
//       window.location.href = "index.html";
//       return;
//     }

//     try {
//       const userRef = doc(db, "users", user.uid);
//       const userSnap = await getDoc(userRef);

//       if (!userSnap.exists()) {
//         console.log("No user document found.");
//         return;
//       }

//       const userData = userSnap.data();

//       if (userData.hasRestaurant === true) {
//         window.location.href = "profile.html";
//       } else {
//         window.location.href = "user-profile.html";
//       }
//     } catch (error) {
//       console.error("Error checking user data:", error);
//     }
//   });
// }

// checks if the user is logged in.
// if logged in and they have a restaurant take them to restaurant owner page
// if logged in and they dont have a restaurant take them to normal user page
// export function checkAuthState() {
//   onAuthStateChanged(auth, async (user) => {

//     // if not logged in
//     if (!user) {
//       window.location.href = "index.html";
//       return;
//     }

//     try {
//       const userRef = doc(db, "users", user.uid);
//       const userSnap = await getDoc(userRef);

//       if (!userSnap.exists()) {
//         console.log("No user document found.");
//         return;
//       }

//       const userData = userSnap.data();

//       // redirect depending on restaurant ownership
//       if (userData.hasRestaurant === true) {
//         window.location.href = "profile.html"; // restaurant owner page
//       } else {
//         window.location.href = "user-profile.html"; // normal user page
//       }

//     } catch (error) {
//       console.error("Error checking user data:", error);
//     }

//   });
// }

// -------------------------------------------------------------
// onAuthReady(callback)
// -------------------------------------------------------------
// Wrapper for Firebase's onAuthStateChanged()
// Runs the given callback(user) when Firebase resolves or changes auth state.
// Useful for showing user info or redirecting after login/logout.
export function onAuthReady(callback) {
  return onAuthStateChanged(auth, callback);
}

// -------------------------------------------------------------
// authErrorMessage(error)
// -------------------------------------------------------------
// Maps Firebase Auth error codes to short, user-friendly messages.
// Helps display clean error alerts instead of raw Firebase codes.
export function authErrorMessage(error) {
  const code = (error?.code || "").toLowerCase();

  const map = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/email-already-in-use": "Email is already in use.",
    "auth/weak-password": "Password too weak (min 6 characters).",
    "auth/missing-password": "Password cannot be empty.",
    "auth/network-request-failed": "Network error. Try again.",
  };

  return map[code] || "Something went wrong. Please try again.";
}

