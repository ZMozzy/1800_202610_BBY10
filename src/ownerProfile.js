import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { logoutUser } from "./authentication.js";


document.getElementById("logout").addEventListener( "click", logoutUser);

document.addEventListener("DOMContentLoaded", () => {
    loadRestaurantProfile();
    renderPosts(postsData);

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

/**
 * Renders post cards into the container.
 * @param {Array} posts - Array of post objects from your database
 */
function renderReviews(posts) {
    const postsContainer = document.querySelector('.posts-container');
    
    // Clear existing content to prevent duplicates if refreshing
    postsContainer.innerHTML = '';

    posts.forEach(reviews => {
        // --- DATABASE FIELD MAPPING ---
        // Replace 'post.restaurantName', 'post.time', etc., 
        // with the exact keys used in your DB/Firestore document.
        const name = reviews.authorName || "Anonymous";
        const postContent = reviews.reviewText || "";
        
        // If using Firestore, remember to convert the timestamp: 
        // const timeDisplay = post.timestamp?.toDate().toLocaleTimeString();
        const timeDisplay = reviews.timestamp?.toDate().toLocaleTimeString() || "Just now";

        // Create the HTML template
        const postHTML = `
            <div class="post-card">
              <div class="post-meta">
                <span class="post-user">${name}</span>
                <span class="post-time">${timeDisplay}</span>
              </div>
              <div class="post-body">
                ${postContent}
              </div>
            </div>
        `;

        // Inject the card into the container
        postsContainer.insertAdjacentHTML('beforeend', postHTML);
    });
}

// --- DATABASE LISTENER / FETCH ---
// This is where you call your database (Firestore, MariaDB/AJAX, etc.)

const restaurantId = restaurantDoc.id; 


db.collection("Restaurant")
  .doc(restaurantId)
  .collection("reviews")
  .onSnapshot((querySnapshot) => {
      const reviewsList = [];
      
      querySnapshot.forEach((doc) => {
          reviewsList.push({
              id: doc.id,
              ...doc.data()
          });
      });
      
      renderReviews(reviewsList);
  }, (error) => {
      console.error("Error fetching reviews: ", error);
  });



