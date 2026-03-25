import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

document.addEventListener("DOMContentLoaded", () => {
    loadRestaurantProfile();
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
            const q = query(restaurantRef, where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log("This user does not have a restaurant");
                return;
            }

            const restaurantDoc = querySnapshot.docs[0];
            const restaurantData = restaurantDoc.data();

            console.log("Restaurant data:", restaurantData);

            populateRestaurantPage(restaurantData, restaurantDoc.id);

        } catch (error) {
            console.error("Error loading restaurant profile:", error);
        }
    });
}

function populateRestaurantPage(restaurant) {
    const nameEl = document.getElementById("restaurant-name");
    const descEl = document.getElementById("restaurant-description");
    const emailEl = document.getElementById("restaurant-email");
    const photoEl = document.getElementById("restaurant-photo");

    if (nameEl) {
        nameEl.textContent = restaurant.basicInfo.restaurantName || "No name set";
    }

    if (descEl) {
        descEl.textContent = restaurant.basicInfo.description || "No description set";
    }

    if (emailEl) {
        emailEl.textContent = restaurant.ownerAccount?.email || "No email set";
    }

    if (photoEl) {
        const firstPhoto = restaurant.uploads?.photos?.[0];

        if (firstPhoto?.base64Data && firstPhoto?.contentType) {
            photoEl.src = `data:${firstPhoto.contentType};base64,${firstPhoto.base64Data}`;
        }
    }
}
