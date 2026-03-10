console.log("main.js loaded");

// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap';

// If you have custom global styles, import them as well:
// import '../styles/style.css';
import {auth} from "./firebaseConfig.js"
import {collection, query, where, getDocs} from "firebase/firestore";

document.getElementById("getstarted").addEventListener("click", function() {
    window.location.href = "landing.html";
});

document.getElementById("loginbtn").addEventListener("click", function() {
    window.location.href = "login.html";
});



const user = auth.currentUser;

//checks if they are a user and if user has an active post
//for profile button
async function goToProfile() {
    try {
        if (user) {
             
            const restaurantRef = collection(db, "Restaurant");
             const q = query(restaurantRef, where("userId", "==", user.uid));

            const querySnapshot = await getDocs(q)
            if (!querySnapshot.empty) {
                window.location.href = "owner-profile.html";
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




// document.addEventListener('DOMContentLoaded', sayHello);

