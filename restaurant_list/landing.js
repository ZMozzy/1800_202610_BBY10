import { db } from "../src/firebaseConfig.js";
import { collection, getDocs } from "firebase/firestore";

// DOM references
const restaurantsContainer = document.getElementById("restaurants-go-here");
const filterDropdown = document.getElementById("filterDropdown");

// Filters state
const selectedFilters = { cuisine: [], wait: [], location: [] };

// Store all unique filter values dynamically
const allFilters = { cuisine: new Set(), wait: new Set(), location: new Set() };

async function loadRestaurants() {
  try {
    const querySnapshot = await getDocs(collection(db, "Restaurant"));
    const restaurants = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("Restaurants fetched:", restaurants); // <--- ADD THIS

    // Display cards immediately
    displayRestaurants(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
  }
}

// Create filter buttons dynamically
function createFilterButtons() {
  const dropdownMenu = document.createElement("div");
  dropdownMenu.className = "p-3";

  // Helper to create filter section
  function createFilterSection(title, filterType, values) {
    const section = document.createElement("div");
    section.className = "mb-2";

    const strong = document.createElement("strong");
    strong.textContent = title;
    section.appendChild(strong);

    const container = document.createElement("div");
    container.className = "d-flex flex-wrap gap-1 mt-1";

    values.forEach((val) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-outline-dark btn-sm filter-btn";
      btn.dataset.filter = filterType;
      btn.dataset.value = val.toLowerCase();
      btn.textContent = val;
      container.appendChild(btn);
    });

    section.appendChild(container);
    return section;
  }

  dropdownMenu.appendChild(
    createFilterSection("Cuisine", "cuisine", Array.from(allFilters.cuisine)),
  );
  dropdownMenu.appendChild(
    createFilterSection("Price", "wait", Array.from(allFilters.wait)),
  );
  dropdownMenu.appendChild(
    createFilterSection(
      "Location",
      "location",
      Array.from(allFilters.location),
    ),
  );

  // Clear Filters button
  const clearBtn = document.createElement("button");
  clearBtn.id = "clearFilterBtn";
  clearBtn.className = "btn btn-outline-secondary btn-sm w-100 mt-3";
  clearBtn.textContent = "Clear Filters";
  dropdownMenu.appendChild(clearBtn);

  // Replace existing dropdown content
  const dropdownMenuEl = document.querySelector(".dropdown-menu");
  dropdownMenuEl.innerHTML = "";
  dropdownMenuEl.appendChild(dropdownMenu);

  // Re-bind DOM references after dynamic creation
  bindFilterEvents();
}

// Bind filter button and clear button events
function bindFilterEvents() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const clearBtn = document.getElementById("clearFilterBtn");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const group = btn.dataset.filter;
      const value = btn.dataset.value.toLowerCase();

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

  clearBtn.addEventListener("click", () => {
    Object.keys(selectedFilters).forEach((k) => (selectedFilters[k] = []));
    filterButtons.forEach((btn) => {
      btn.classList.remove("active", "btn-dark");
      btn.classList.add("btn-outline-dark");
    });
    document
      .querySelectorAll(".restaurant-card")
      .forEach((card) => (card.style.display = ""));
  });
}

// Display restaurant cards
function displayRestaurants(restaurants) {
  restaurantsContainer.innerHTML = "";

  restaurants.forEach((r) => {
    const card = document.createElement("div");
    card.className = "card restaurant-card mb-4";
    card.style.maxWidth = "480px";

    // Pull values from basicInfo for name/description
    const name = r.basicInfo?.restaurantName || "Unnamed";
    const description = r.basicInfo?.description || "No description";
    const price = r.hoursAndServices?.priceRange || "$";
    const cuisine = r.basicInfo?.businessType || "";
    const location = r.basicInfo?.state || "";

    const photoURL =
      r.photos?.[0]?.downloadURL?.trim() || "./images/default.png";

    card.innerHTML = `
      <img class="card-img-top card-image" src="${photoURL}" alt="Restaurant Image" />
      <div class="card-body">
        <h5 class="card-title">${name}</h5>
        <p class="card-text">${description}</p>
        <span class="badge bg-success mb-2 card-wait">Price: ${price}</span>
        <a href="eachRestaurant.html?docID=${r.id}" class="btn btn-primary see-menu-btn">See Menu</a>
      </div>
    `;

    // Add data attributes for filtering
    card.dataset.cuisine = cuisine.toLowerCase();
    card.dataset.wait = price;
    card.dataset.location = location.toLowerCase();

    restaurantsContainer.appendChild(card);
  });
}

// Filter logic
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

// Initialize
document.addEventListener("DOMContentLoaded", loadRestaurants);
