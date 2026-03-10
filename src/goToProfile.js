// import { auth, db } from "./firebaseConfig.js";
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
// import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const profileLink = document.getElementById("profile-link");

if(profileLink) {
    onAuthStateChanged(auth, async (user) => {
        if(!user){
            profileLink.href = "login.html";
            return;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if(userSnap.exists()){
                const data = userSnap.data();

                if(data.hasRestaurant === true){
                    profileLink.href = "owner-profile.html";
                } 
                else {
                    profileLink.href = "user-profile.html";
                }

                console.log("hasRestaurant:", data.hasRestaurant);
                console.log("profile href set to:", profileLink.href);
            }
            else{
                profileLink.href = "user-profile.html";
            }
        } catch (error){
            console.error("error", error);
            profileLink.href = "user-profile.html";

        }
    });
}