// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap';

// If you have custom global styles, import them as well:
// import '../styles/style.css';
import {getAuth} from "firebase/auth";
import {collection, query, where, getDocs} from "firebase/firestore";
import { db } from "./firebaseConfig.js";

import { checkAuthState } from "./authentication.js";
checkAuthState();

function sayHello() {

}
document.getElementById("getstarted").addEventListener("click", function() {
    window.location.href = "landing.html";
});

document.getElementById("loginbtn").addEventListener("click", function() {
    window.location.href = "login.html";
});

function updateWaitTime() {
    let newTime = prompt("Enter new wait time:");
    //only update if they didnt hit cancel or enter nothing
    if (newTime !== null && newTime.trim() !== "") {
        let numericValue = Number(newTime);

        // Check if it is a valid integer and not a negative number
        if (Number.isInteger(numericValue) && numericValue >= 0) {
            let finalWait = numericValue + " min";
            
            document.getElementById("wait-time-value").innerText = finalWait;
        }
}
}
// goes to add.html
function goToAdd() {
    window.location.href = "add.html";
}

const auth = getAuth();


//checks if they are a user and if user has an active post
//for profile button
async function goToProfile() {
    const user = auth.currentUser;
    try {
        if (user) {
             //change this one to be resturant post collection name!!!!!!!!!!!!!!
            const restaurantRef = collection(db, "Restaurant");
             const q = query(restaurantRef, where("userId", "==", user.uid));

            const querySnapshot = await getDocs(q)
            if (!querySnapshot.empty) {
                window.location.href = "profile.html";
            } else {
                window.location.href = "user-profile.html";
            }
        } else {
                window.location.href = "login.html";
    } 
    }catch (error) {
        console.error("Error loading profile:", error);
    }
}

//if login/sign up feature breaks it was probably this -zach was not here
//for either login or sign up
const btn = document.getElementById("loginForm") || document.getElementById("signinForm");
//directs to profile page after login/sign up
btn.addEventListener("submit", function(e) {
    e.preventDefault(); // stops page refresh

    // runs validation / login logic
    goToProfile();
});
// document.addEventListener('DOMContentLoaded', sayHello);
