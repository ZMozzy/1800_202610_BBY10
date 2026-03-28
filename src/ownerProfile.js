import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

document.addEventListener("DOMContentLoaded", () => {
    loadRestaurantProfile();
    waitpill();
});

function loadRestaurantProfile() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            console.log("No user logged in");
            window.location.href = "login.html";
            return;
        }

        try {
            const restaurantRef = collection(db, "Restaurant");
            const q = query(
    restaurantRef, 
    where("userId", "==", user.uid),
    where("state", "==", "submitted") // This ignores the 'encoding' drafts
);
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log("This user does not have a restaurant");
                return;
            }

            const restaurantDoc = querySnapshot.docs[0];
            //const restaurantData = restaurantDoc.data();
            //const restaurantDoc = querySnapshot.docs[0];

            // INSTEAD OF: const restaurantData = restaurantDoc.data();
            // DO THIS to pick your fields:
            const data = restaurantDoc.data();
            const restaurantData = {
                basicInfo: data.basicInfo,
                waitTime: data.waitTime
            };

            console.log("Restaurant data:", restaurantData);

            populateRestaurantPage(restaurantData, restaurantDoc.id);

        } catch (error) {
            console.error("Error loading restaurant profile:", error);
        }
    });
}


function populateRestaurantPage(restaurant) {
    const info = restaurant.basicInfo || {}; 

    const nameEl = document.getElementById("restaurant-name");
    const descEl = document.getElementById("restaurant-description");

    if (nameEl) {
        nameEl.textContent = info.restaurantName || "No name set";
    }

    if (descEl) {
        descEl.textContent = info.description || "No description set";  
    }
    
    const waitEl = document.getElementById("wait-time-value");
    if (waitEl) {
        waitEl.innerText = restaurant.waitTime;
        console.log("Wait pill updated to:", restaurant.waitTime);
    }
}

