import { db } from "../src/firebaseConfig.js";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// ------------DOM references------------------
const restaurantsContainer = document.getElementById("restaurants-go-here");
const filterDropdown = document.getElementById("filterDropdown");

// ------------Filters variables------------------
const selectedFilters = { cuisine: [], price: [], wait: [], location: [] };

const allFilters = {
  cuisine: new Set(),
  price: new Set(),
  wait: new Set(),
  location: new Set(),
};

export let allRestaurants = [];

// ------------------- LOAD RESTAURANTS -------------------
export async function loadRestaurants() {
  try {
    const q = query(collection(db, "Restaurant"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    querySnapshot.docs.forEach((doc) => {
      const r = doc.data();
      allFilters.cuisine.add(r.basicInfo?.businessType || "Unknown");
      allFilters.price.add(r.hoursAndServices?.priceRange || "$");

      const wt = r.waitTime ?? r.hoursAndServices?.waitTime ?? 0;
      allFilters.wait.add(String(wt));
      allFilters.location.add(r.basicInfo?.state || "Unknown");
    });

    const restaurants = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    allRestaurants = restaurants;
    createFilterButtons();
    displayRestaurants(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
  }
}

// ------------------- FILTER BUTTONS -------------------
function createFilterButtons() {
  const dropdownMenu = document.createElement("div");
  dropdownMenu.className = "p-3";

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
    createFilterSection("Price", "price", Array.from(allFilters.price)),
  );
  dropdownMenu.appendChild(
    createFilterSection("Wait Time", "wait", [
      "0-10 min",
      "10-30 min",
      "30-60 min",
      "60+ min",
    ]),
  );

  const clearBtn = document.createElement("button");
  clearBtn.id = "clearFilterBtn";
  clearBtn.className = "btn btn-outline-secondary btn-sm w-100 mt-3";
  clearBtn.textContent = "Clear Filters";
  dropdownMenu.appendChild(clearBtn);

  const dropdownMenuEl = document.querySelector(".dropdown-menu");
  dropdownMenuEl.innerHTML = "";
  dropdownMenuEl.appendChild(dropdownMenu);

  bindFilterEvents();
}

// ------------------- FILTER EVENTS -------------------
function bindFilterEvents() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const clearBtn = document.getElementById("clearFilterBtn");

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

// ------------------- WAIT TIME COLORS -------------------
export function getWaitColor(waitTime) {
  const time = parseInt(waitTime);
  if (isNaN(time)) return { bg: "#9ca3af", label: "gray" };
  if (time <= 10) return { bg: "#16a34a", label: "green" };
  if (time <= 30) return { bg: "#FCD12A", label: "yellow" };
  if (time <= 60) return { bg: "#ea580c", label: "orange" };
  return { bg: "#dc2626", label: "red" };
}

function getWaitEmoji(waitTime) {
  const time = parseInt(waitTime);
  if (isNaN(time)) return "N/A";
  if (time <= 10) return "🟢";
  if (time <= 30) return "🟡";
  if (time <= 60) return "🟠";
  return "🔴";
}

// ------------------- DISPLAY CARDS -------------------
export function displayRestaurants(restaurants) {
  restaurantsContainer.innerHTML = "";

  if (restaurants.length === 0) {
    restaurantsContainer.innerHTML = `
      <div class="text-center py-5 text-muted">
        <p style="font-size:1.1rem">No restaurants found.</p>
      </div>`;
    return;
  }

  for (const r of restaurants) {
    console.log("restaurant ID:", r.id, "Name:", r.basicInfo?.restaurantName);
    const waitTime = r.waitTime ?? r.hoursAndServices?.waitTime ?? 0;
    const { bg: waitBg } = getWaitColor(waitTime);
    const waitEmoji = getWaitEmoji(waitTime);

    const name = r.basicInfo?.restaurantName || "Unnamed";
    const description = r.basicInfo?.description || "No description";
    const price = r.hoursAndServices?.priceRange || "$";
    const cuisine = r.basicInfo?.businessType || "";
    const location = r.basicInfo?.state || "";
    const rating = r.rating || 0;
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

    // Hours of operation - get this info from Yilong
    const openTime = r.hoursAndServices?.openTime || "";
    const closeTime = r.hoursAndServices?.closeTime || "";
    const hoursText = openTime && closeTime ? `${openTime} – ${closeTime}` : "";

    // Photo handling
    let photoURL = "./images/default.png";
    const photo = Array.isArray(r.uploads?.photos) ? r.uploads.photos[0] : null;

    if (photo) {
      if (photo.url) {
        // Use URL if available
        photoURL = photo.url;
      } else if (photo.base64Data) {
        // Fallback to Base64
        photoURL = `data:${photo.contentType || "image/png"};base64,${photo.base64Data.trim()}`;
      }
    }

    const card = document.createElement("div");
    card.className = "restaurant-card";
    card.dataset.cuisine = cuisine.toLowerCase();
    card.dataset.price = price;
    card.dataset.wait = String(waitTime);
    card.dataset.location = location.toLowerCase();

    card.innerHTML = `
      <a href="eachRestaurant.html?docID=${r.id}" class="card-link">
        <div class="rc-image-wrap">
          <img src="${photoURL}" alt="${name}" class="rc-image" />
          <div class="rc-wait-badge" style="background:${waitBg}">
            ${waitEmoji} ${waitTime} min
          </div>
        </div>
        <div class="rc-body">
          <div class="rc-top">
            <div>
              <h5 class="rc-name">${name}</h5>
              ${cuisine ? `<span class="rc-cuisine">${cuisine}</span>` : ""}
            </div>
            <span class="rc-price">${price}</span>
          </div>
          <p class="rc-desc">${description}</p>
          <div class="rc-footer">
            <div class="rc-meta">
              ${rating > 0 ? `<span class="rc-stars">${stars}</span>` : ""}
              ${hoursText ? `<span class="rc-hours">Hours of Operation: ${hoursText}</span>` : ""}
            </div>
            <span class="rc-cta">See More →</span>
          </div>
        </div>
      </a>
    `;

    restaurantsContainer.appendChild(card);
  }
}

// ------------------- APPLY FILTERS -------------------
function applyFilters() {
  const cards = document.querySelectorAll(".restaurant-card");
  cards.forEach((card) => {
    const cuisine = (card.dataset.cuisine || "").toLowerCase();
    const price = card.dataset.price || "";
    const wait = card.dataset.wait || "";
    const location = (card.dataset.location || "").toLowerCase();

    const cuisineMatch =
      selectedFilters.cuisine.length === 0 ||
      selectedFilters.cuisine.includes(cuisine);
    const priceMatch =
      selectedFilters.price.length === 0 ||
      selectedFilters.price.includes(price);
    const waitMatch =
      selectedFilters.wait.length === 0 ||
      selectedFilters.wait.some((f) => {
        const waitNum = parseInt(wait);
        if (f === "0-10 min") return waitNum >= 0 && waitNum <= 10;
        if (f === "10-30 min") return waitNum > 10 && waitNum <= 30;
        if (f === "30-60 min") return waitNum > 30 && waitNum <= 60;
        if (f === "60+ min") return waitNum > 60;
        return false;
      });
    const locationMatch =
      selectedFilters.location.length === 0 ||
      selectedFilters.location.includes(location);

    card.style.display =
      cuisineMatch && priceMatch && waitMatch && locationMatch ? "" : "none";
  });
}

// ------------------- INIT -------------------
document.addEventListener("DOMContentLoaded", loadRestaurants);
