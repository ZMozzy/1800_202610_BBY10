// import { db } from "./firebaseConfig.js";
// import { collection, getDocs } from "firebase/firestore";

// document.addEventListener("DOMContentLoaded", () => {
//   const selectedFilters = {
//     cuisine: [],
//     wait: [],
//     location: [],
//   };

//   let allRestaurants = [];

//   const restaurantsContainer = document.getElementById("restaurants-go-here");
//   const clearBtn = document.getElementById("clearFilterBtn");

//   // Fetch restaurants from Firestore
//   async function fetchRestaurants() {
//     try {
//       const snapshot = await getDocs(collection(db, "restaurants"));
//       allRestaurants = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       displayFilters();
//       displayRestaurants();
//     } catch (error) {
//       console.error("Error fetching restaurants:", error);
//     }
//   }

//   // Create filter buttons
//   function displayFilters() {
//     const filterTypes = ["cuisine", "wait", "location"];

//     filterTypes.forEach((type) => {
//       const container = document.querySelector(
//         `.filter-group[data-filter="${type}"]`,
//       );
//       const uniqueValues = [...new Set(allRestaurants.map((r) => r[type]))];

//       uniqueValues.forEach((value) => {
//         const btn = document.createElement("button");
//         btn.className = "btn btn-outline-dark btn-sm me-1 mb-1 filter-btn";
//         btn.dataset.value = value;
//         btn.textContent = value.charAt(0).toUpperCase() + value.slice(1);

//         btn.addEventListener("click", () => {
//           btn.classList.toggle("active");
//           btn.classList.toggle("btn-dark");
//           btn.classList.toggle("btn-outline-dark");

//           if (selectedFilters[type].includes(value)) {
//             selectedFilters[type] = selectedFilters[type].filter(
//               (v) => v !== value,
//             );
//           } else {
//             selectedFilters[type].push(value);
//           }

//           displayRestaurants();
//         });

//         container.appendChild(btn);
//       });
//     });
//   }

//   //Display restaurant cards based on filters
//   function displayRestaurants() {
//     restaurantsContainer.innerHTML = "";

//     const filtered = allRestaurants.filter((r) => {
//       const cuisineMatch =
//         selectedFilters.cuisine.length === 0 ||
//         selectedFilters.cuisine.includes(r.cuisine);
//       const waitMatch =
//         selectedFilters.wait.length === 0 ||
//         selectedFilters.wait.includes(r.wait);
//       const locationMatch =
//         selectedFilters.location.length === 0 ||
//         selectedFilters.location.includes(r.location);
//       return cuisineMatch && waitMatch && locationMatch;
//     });

//     filtered.forEach((r) => {
//       const card = document.createElement("div");
//       card.className = "card mb-4 restaurant-card";
//       card.style.maxWidth = "480px";
//       card.style.width = "100%";

//       card.innerHTML = `
//         <img class="card-img-top" src="./images/${r.code}.jpg" alt="${r.name}">
//         <div class="card-body">
//           <h5 class="card-title">${r.name}</h5>
//           <p class="card-text">${r.description}</p>
//           <span class="badge bg-success mb-2">Wait Time: ${r.wait} mins</span>
//           <button class="btn btn-primary see-menu-btn" data-page="eachRestaurant.html?docID=${r.id}">See Menu</button>
//            <a href="eachRestaurant.html?docID=${restaurant.id}" class="btn btn-primary see-menu-btn">See Menu</a>
//         </div>
//       `;

//       restaurantsContainer.appendChild(card);
//     });

//     // Add See Menu click
//     const buttons = document.querySelectorAll(".see-menu-btn");
//     buttons.forEach((btn) => {
//       btn.addEventListener("click", () => {
//         const page = btn.dataset.page;
//         window.location.href = page;
//       });
//     });
//   }

//   // Clear filters
//   clearBtn.addEventListener("click", () => {
//     Object.keys(selectedFilters).forEach((k) => (selectedFilters[k] = []));
//     document.querySelectorAll(".filter-btn").forEach((btn) => {
//       btn.classList.remove("active", "btn-dark");
//       btn.classList.add("btn-outline-dark");
//     });
//     displayRestaurants();
//   });

//   // Initialize
//   fetchRestaurants();
// });
import { db } from "../src/firebaseConfig.js";
import { collection, getDocs } from "firebase/firestore";

const restaurantsContainer = document.getElementById("restaurants-go-here");
const filterButtons = document.querySelectorAll(".filter-btn");
const clearBtn = document.getElementById("clearFilterBtn");
const selectedFilters = { cuisine: [], wait: [], location: [] };

// Fetch restaurants from Firestore
async function loadRestaurants() {
  const querySnapshot = await getDocs(collection(db, "restaurants"));
  const restaurants = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  displayRestaurants(restaurants);
}

// Display cards dynamically
function displayRestaurants(restaurants) {
  restaurantsContainer.innerHTML = ""; // clear first
  restaurants.forEach((r) => {
    const card = document.createElement("div");
    card.className = "card mb-4 restaurant-card";
    card.dataset.cuisine = r.cuisine;
    card.dataset.wait = r.wait;
    card.dataset.location = r.location;
    card.style.maxWidth = "480px";
    card.style.width = "100%";

    card.innerHTML = `
      <img class="card-img-top" src="./images/${r.code}.jpg" alt="${r.name}" />
      <div class="card-body">
        <h5 class="card-title">${r.name}</h5>
        <p class="card-text">${r.description}</p>
        <span class="badge bg-success mb-2">Wait Time: ${r.wait} mins</span>
        <a href="eachRestaurant.html?docID=${r.id}" class="btn btn-primary see-menu-btn">See Menu</a>
      </div>
    `;
    restaurantsContainer.appendChild(card);
  });
}

// FILTER LOGIC
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const group = btn.dataset.filter;
    const value = btn.dataset.value;

    btn.classList.toggle("active");
    btn.classList.toggle("btn-dark");
    btn.classList.toggle("btn-outline-dark");

    if (selectedFilters[group].includes(value)) {
      selectedFilters[group] = selectedFilters[group].filter(
        (v) => v !== value,
      );
    } else {
      selectedFilters[group].push(value);
    }
    applyFilters();
  });
});

function applyFilters() {
  const cards = document.querySelectorAll(".restaurant-card");
  cards.forEach((card) => {
    const cuisineMatch =
      selectedFilters.cuisine.length === 0 ||
      selectedFilters.cuisine.includes(card.dataset.cuisine);
    const waitMatch =
      selectedFilters.wait.length === 0 ||
      selectedFilters.wait.includes(card.dataset.wait);
    const locationMatch =
      selectedFilters.location.length === 0 ||
      selectedFilters.location.includes(card.dataset.location);
    card.style.display =
      cuisineMatch && waitMatch && locationMatch ? "" : "none";
  });
}

clearBtn.addEventListener("click", () => {
  Object.keys(selectedFilters).forEach((key) => (selectedFilters[key] = []));
  filterButtons.forEach((btn) => {
    btn.classList.remove("active", "btn-dark");
    btn.classList.add("btn-outline-dark");
  });
  document
    .querySelectorAll(".restaurant-card")
    .forEach((card) => (card.style.display = ""));
});

// INIT
loadRestaurants();
