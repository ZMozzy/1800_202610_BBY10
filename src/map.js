import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { db } from "./firebaseConfig.js";
import { collection, getDocs } from "firebase/firestore";

// ------------------------------------------------------------
// Global state
// ------------------------------------------------------------
const appState = {
  restaurants: [],
  userLngLat: null,
};

const markers = [];
const downtownVancouver = [-123.1207, 49.2827];

// ------------------------------------------------------------
// Wait time color helper (inline — no longer imported from landing.js)
// ------------------------------------------------------------
function getWaitColor(waitTime) {
  const time = parseInt(waitTime);
  if (isNaN(time)) return { bg: "#9ca3af" };
  if (time <= 10) return { bg: "#16a34a" };
  if (time <= 30) return { bg: "#FCD12A" };
  if (time <= 60) return { bg: "#ea580c" };
  return { bg: "#dc2626" };
}

// ------------------------------------------------------------
// Firestore fetch
// ------------------------------------------------------------
async function getRestaurant() {
  const snapshot = await getDocs(collection(db, "Restaurant"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// ------------------------------------------------------------
// Show restaurant markers
// ------------------------------------------------------------
async function showRestaurants(map) {
  const restaurants = await getRestaurant();
  console.log("Fetched restaurants:", restaurants.length);

  restaurants.forEach((doc) => {
    let lat = doc.lat;
    let lng = doc.lng;

    if (lat == null && doc.location) {
      lat = doc.location.latitude;
      lng = doc.location.longitude;
    }

    if (lat == null || lng == null) return;

    appState.restaurants.push(doc);

    const restaurantName = doc.basicInfo?.restaurantName || "Restaurant";
    const address = doc.basicInfo?.address || "Address not available";
    const waitTime = doc.waitTime != null ? `${doc.waitTime} min` : "N/A";
    const waitColor = getWaitColor(waitTime);

    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = waitColor.bg;
    el.style.border = "2px solid white";

    const popupHtml = `
      <div class="card shadow-sm" style="width: 220px;">
        <div class="card-body p-2">
          <h6 class="card-title mb-1">${restaurantName}</h6>
          <p class="card-text small mb-2">${address}</p>
          <div class="d-flex justify-content-between align-items-center">
            <span class="badge fs-6" style="background-color: ${waitColor.bg}; color: white">
              Wait: ${waitTime}
            </span>
          </div>
        </div>
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml))
      .addTo(map);

    markers.push({
      name: restaurantName.toLowerCase(),
      displayName: restaurantName,
      marker: marker,
    });
  });
}

// ------------------------------------------------------------
// Search
// ------------------------------------------------------------
function goToRestaurant(map, match, resultsBox) {
  const lngLat = match.marker.getLngLat();
  map.flyTo({
    center: [lngLat.lng, lngLat.lat],
    zoom: 14,
    speed: 0.8,
    curve: 1.4,
  });
  match.marker.togglePopup();
  resultsBox.innerHTML = "";
}

function search(map) {
  const input = document.getElementById("restaurantSearch");
  const resultsBox = document.getElementById("searchResults");

  if (!input || !resultsBox) return;

  let selectedMatch = null;

  input.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();
    resultsBox.innerHTML = "";
    selectedMatch = null;

    if (query === "") return;

    const matches = markers.filter((m) => m.name.includes(query));

    matches.slice(0, 5).forEach((match) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "list-group-item list-group-item-action";
      item.textContent = match.displayName;

      item.addEventListener("click", () => {
        input.value = match.displayName;
        selectedMatch = match;
        goToRestaurant(map, match, resultsBox);
      });

      resultsBox.appendChild(item);
    });

    if (matches.length > 0) selectedMatch = matches[0];
  });

  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const query = input.value.toLowerCase().trim();
    if (query === "") return;

    const match = selectedMatch || markers.find((m) => m.name.includes(query));
    if (match) goToRestaurant(map, match, resultsBox);
  });
}

// ------------------------------------------------------------
// User location pin
// ------------------------------------------------------------
async function addUserPin(map) {
  if (!("geolocation" in navigator)) {
    console.warn("Geolocation is not available in this browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      appState.userLngLat = [pos.coords.longitude, pos.coords.latitude];

      map.addSource("userLngLat", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: appState.userLngLat },
              properties: { description: "Your location" },
            },
          ],
        },
      });

      map.addLayer({
        id: "userLngLat",
        type: "circle",
        source: "userLngLat",
        paint: {
          "circle-color": "#1E90FF",
          "circle-radius": 6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "userLngLat", (e) => {
        const [lng, lat] = e.features[0].geometry.coordinates;
        new maplibregl.Popup()
          .setLngLat([lng, lat])
          .setHTML("You are here")
          .addTo(map);
      });
    },
    (err) => {
      console.error("Geolocation error", err);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}

// ------------------------------------------------------------
// Init
// ------------------------------------------------------------
function showMap() {
  const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.00163752324765, 49.25324576104826],
    zoom: 10,
  });

  map.addControl(new maplibregl.NavigationControl(), "bottom-right");

  map.once("load", async () => {
    map.flyTo({
      center: downtownVancouver,
      zoom: 13,
      speed: 0.8,
      curve: 1.4,
      essential: true,
    });

    await showRestaurants(map);
    await addUserPin(map);
    search(map);

    console.log("map loaded, placed user pin and restaurant pins!");
  });
}

showMap();
