import { db } from "../src/firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

// DOM references
const restaurantNameEl = document.getElementById("restaurantName");
const restaurantDescriptionEl = document.getElementById(
  "restaurantDescription",
);
const restaurantImageEl = document.getElementById("restaurantImage");
const restaurantWaitEl = document.getElementById("restaurantWait");
const restaurantRatingEl = document.getElementById("restaurantRating");
const writeReviewBtn = document.getElementById("writeReviewBtn");

const photoGallery = document.getElementById("photoGallery");
const menuGallery = document.getElementById("menuGallery");
const licenceGallery = document.getElementById("licenceGallery");

// Get restaurant ID from URL
function getDocIdFromUrl() {
  const params = new URL(window.location.href).searchParams;
  return params.get("docID");
}

// Wait time color helper
function getWaitColor(waitTime) {
  const time = Number(waitTime);
  if (time <= 10) return "success";
  if (time <= 30) return "warning";
  if (time <= 60) return "orange";
  return "danger";
}

// Reusable gallery logic
function createGallery(container, images, mainImgEl = null) {
  container.innerHTML = "";
  if (!images || !images.length) return;

  images.forEach((imgData) => {
    if (!imgData.base64Data) return;

    const img = document.createElement("img");
    const mimeType = imgData.contentType || "image/png";
    img.src = `data:${mimeType};base64,${imgData.base64Data.trim()}`;
    img.style.width = "80px";
    img.style.height = "80px";
    img.style.objectFit = "cover";
    img.style.cursor = "pointer";
    img.className = "rounded border";

    // If a main image element is passed, make the gallery images clickable
    if (mainImgEl) {
      img.addEventListener("click", () => {
        mainImgEl.src = img.src;
      });
    }

    container.appendChild(img);
  });
}

// Load restaurant data
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

    // Basic info
    restaurantNameEl.textContent =
      restaurant.basicInfo?.restaurantName || "Unnamed";
    restaurantDescriptionEl.textContent =
      restaurant.basicInfo?.description || "No description";
    const waitTime = restaurant.hoursAndServices?.waitTime || 0;
    const rating = restaurant.rating || 0;

    // Main photo
    const mainPhoto = restaurant.uploads?.photos?.[0];
    let photoURL = "./images/default.png";
    if (mainPhoto?.base64Data) {
      const mimeType = mainPhoto.contentType || "image/png";
      photoURL = `data:${mimeType};base64,${mainPhoto.base64Data.trim()}`;
    }
    restaurantImageEl.src = photoURL;

    // Galleries
    createGallery(photoGallery, restaurant.uploads?.photos);
    if (restaurant.uploads?.menu)
      createGallery(menuGallery, restaurant.uploads.menu);
    if (restaurant.uploads?.license)
      createGallery(licenceGallery, restaurant.uploads.license);

    // Wait time
    restaurantWaitEl.textContent = `Wait: ${waitTime} min`;
    restaurantWaitEl.className = `badge mb-2 bg-${getWaitColor(waitTime)}`;

    // Rating stars
    const stars = document.querySelectorAll("#restaurantRating .star");
    stars.forEach((star, index) => {
      star.textContent = index < rating ? "star" : "star_outline";
    });
  } catch (error) {
    console.error("Error loading restaurant:", error);
    restaurantNameEl.textContent = "Error loading restaurant.";
  }
}

// Clickable stars
let userRating = 0;
function setupStars() {
  const stars = document.querySelectorAll("#restaurantRating .star");
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      stars.forEach(
        (s, i) => (s.textContent = i <= index ? "star" : "star_outline"),
      );
      userRating = index + 1;
      console.log("User rating selected:", userRating);
    });
  });
}

// Write Review button
function setupWriteReviewButton() {
  writeReviewBtn.addEventListener("click", () => {
    const id = getDocIdFromUrl();
    if (!id) return;
    localStorage.setItem("restaurantDocID", id);
    window.location.href = "review.html";
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadRestaurant();
  setupStars();
  setupWriteReviewButton();
});
