import { db } from "../src/firebaseConfig.js";
import { doc, getDoc } from "firebase/firestore";

// Get the document ID from the URL
function getDocIdFromUrl() {
  const params = new URL(window.location.href).searchParams;
  return params.get("docID");
}

// Fetch the restaurant and display its info
async function displayRestaurantInfo() {
  const id = getDocIdFromUrl();

  try {
    const restaurantRef = doc(db, "restaurants", id);
    const restaurantSnap = await getDoc(restaurantRef);

    if (!restaurantSnap.exists()) {
      document.getElementById("restaurantName").textContent =
        "Restaurant not found.";
      return;
    }

    const restaurant = restaurantSnap.data();

    // Update page elements
    document.getElementById("restaurantName").textContent = restaurant.name;
    document.getElementById("restaurantDescription").textContent =
      restaurant.description;
    document.getElementById("restaurantWait").textContent =
      `Wait Time: ${restaurant.wait} mins`;

    const img = document.getElementById("restaurantImage");
    img.src = `./images/${restaurant.code}.jpg`;
    img.alt = restaurant.name;
  } catch (error) {
    console.error("Error loading restaurant:", error);
    document.getElementById("restaurantName").textContent =
      "Error loading restaurant.";
  }
}

displayRestaurantInfo();
