import { db } from "../src/firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

// ---------------------------
// DOM references
// ---------------------------
const restaurantNameEl = document.getElementById("restaurantName");
const restaurantDescriptionEl = document.getElementById(
  "restaurantDescription",
);
const restaurantImageEl = document.getElementById("restaurantImage");
const restaurantWaitEl = document.getElementById("restaurantWait");
const restaurantRatingEl = document.getElementById("restaurantRating");
const writeReviewBtn = document.getElementById("writeReviewBtn");

function getPhotoSrc(photo) {
  if (!photo?.base64Data || !photo?.contentType) {
    return "./images/default.png";
  }

  return `data:${photo.contentType};base64,${photo.base64Data}`;
}

// ---------------------------
// Get restaurant ID from URL
// ---------------------------
function getDocIdFromUrl() {
  const params = new URL(window.location.href).searchParams;
  return params.get("docID");
}

// ---------------------------
// Wait time color helper
// ---------------------------
function getWaitColor(waitTime) {
  const time = Number(waitTime);
  if (time <= 10) return "success"; // green
  if (time <= 30) return "warning"; // yellow
  if (time <= 60) return "orange"; // orange (custom CSS class)
  return "danger"; // red
}

// ---------------------------
// Load restaurant info
// ---------------------------
async function loadRestaurant() {
  const id = getDocIdFromUrl();
  if (!id) {
    restaurantNameEl.textContent = "Restaurant not found.";
    return;
  }

  try {
    const restaurantRef = doc(db, "Restaurant", id);
    const restaurantSnap = await getDoc(restaurantRef);

    if (!restaurantSnap.exists()) {
      restaurantNameEl.textContent = "Restaurant not found.";
      return;
    }

    const restaurant = restaurantSnap.data();

    // ---------------------------
    // Set basic info
    // ---------------------------
    const name = restaurant.basicInfo?.restaurantName || "Unnamed";
    const description = restaurant.basicInfo?.description || "No description";
    const waitTime = restaurant.waitTime || 0;
    const rating = restaurant.rating || 0;
    const photoURL = getPhotoSrc(restaurant.uploads?.photos?.[0]);

    restaurantNameEl.textContent = name;
    restaurantDescriptionEl.textContent = description;
    restaurantImageEl.src = photoURL;
    restaurantImageEl.alt = name;

    // Wait time with color
    const waitColor = getWaitColor(waitTime);
    restaurantWaitEl.textContent = `Wait: ${waitTime} min`;
    restaurantWaitEl.className = `badge mb-2 bg-${waitColor}`;

    // Show existing rating
    const stars = document.querySelectorAll("#restaurantRating .star");
    stars.forEach((star, index) => {
      star.textContent = index < rating ? "star" : "star_outline";
    });
  } catch (error) {
    console.error("Error loading restaurant:", error);
    restaurantNameEl.textContent = "Error loading restaurant.";
  }
}

// ---------------------------
// clickable stars
// ---------------------------
let userRating = 0;
function setupStars() {
  const stars = document.querySelectorAll("#restaurantRating .star");
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      stars.forEach((s, i) => {
        s.textContent = i <= index ? "star" : "star_outline";
      });
      userRating = index + 1;
      console.log("User rating selected:", userRating);
    });
  });
}

// ---------------------------
// Write Review button
// ---------------------------
function setupWriteReviewButton() {
  writeReviewBtn.addEventListener("click", () => {
    const id = getDocIdFromUrl();
    if (!id) {
      console.warn("No restaurant ID found in URL.");
      return;
    }
    localStorage.setItem("restaurantDocID", id);
    window.location.href = "review.html";
  });
}

// ---------------------------
// Initialize
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
  loadRestaurant();
  setupStars();
  setupWriteReviewButton();
});
