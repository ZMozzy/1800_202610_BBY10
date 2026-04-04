import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { logoutUser } from "./authentication.js";


document.getElementById("logout").addEventListener( "click", logoutUser);

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
            displayReviews(restaurantDoc.id)

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


async function displayReviews(restaurantId) {
    const postsContainer = document.querySelector('.posts-container');
    const template = document.getElementById('post-template');

    // 1. Reference the subcollection
    const reviewsRef = collection(db, "Restaurant", restaurantId, "reviews");
    
    // 2. Query the reviews (ordering by newest first)
    const q = query(reviewsRef, orderBy("timestamp", "desc"));

    try {
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // 3. Clone the template
            const clone = template.content.cloneNode(true);

            // 4. Map Firestore fields to HTML elements
            clone.querySelector('.post-user').textContent = data.authorName;
            clone.querySelector('.post-body').textContent = data.reviewText;
           // clone.querySelector(".post-rating").textContent = data.rating;
// Target your new template span for the stars
    const ratingSpan = clone.querySelector('.post-rating');
    const rating = data.rating || 0;

    // Generate 5 stars
    for (let i = 1; i <= 5; i++) {
        const starIcon = document.createElement('span');
        starIcon.className = 'material-icons';
        starIcon.style.fontSize = '1.25rem'; // Consistent sizing
        
        // Ternary to decide filled vs outlined
        starIcon.textContent = (i <= rating) ? 'star' : 'star_border';
        
        ratingSpan.appendChild(starIcon);
    }
            // Format the Firestore Timestamp
            if (data.timestamp) {
                const date = data.timestamp.toDate();
                clone.querySelector('.post-time').textContent = date.toLocaleDateString();
            }


            postsContainer.appendChild(clone);
        });
    } catch (error) {
        console.error("Error fetching reviews: ", error);
    }
}




