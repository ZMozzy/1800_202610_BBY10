import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getWaitColor } from "../restaurant_list/landing.js";

import "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";

// Add this to the top of your JS file
// Database initialized
import { db } from "./firebaseConfig.js";
// Functions needed to read from database
import { collection, getDocs } from "firebase/firestore";

// ------------------------------------------------------------
// Global variable to store user location, hike data - good practice
// ------------------------------------------------------------
const appState = {
  restaurants: [],
  userLngLat: null,
};

const markers = [];
const downtownVancouver = [-123.1207, 49.2827];

async function getRestaurant() {
  const snapshot = await getDocs(collection(db, "Restaurant"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function showRestaurants(map) {
  const restaurants = await getRestaurant();

  console.log("Fetched restaurants:", restaurants.length);
  restaurants.forEach((doc) => {
    console.log("---");
    console.log("Name:", doc.basicInfo?.restaurantName);
    console.log("doc.lat:", doc.lat, "| typeof:", typeof doc.lat);
    console.log("doc.lng:", doc.lng, "| typeof:", typeof doc.lng);
    console.log("doc.location:", doc.location);
    let lat = doc.lat;
    let lng = doc.lng;
    if (lat == null && doc.location) {
      lat = doc.location.latitude;
      lng = doc.location.longitude;
    }

    console.log("resolved lat:", lat, "resolved lng:", lng);
    if (lat == null || lng == null) return;

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

    //change the bootstrap here to make the pop html prettier
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
      .setLngLat([doc.lng, doc.lat])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(popupHtml))
      .addTo(map);

    markers.push({
      name: restaurantName.toLowerCase(),
      marker: marker,
    });
  });
}

// ------------------------------------------------------------
// This top level function initializes the MapLibre map, adds controls
// It waits for the map to load before trying to add sources/layers.
// ------------------------------------------------------------
function showMap() {
  // Initialize MapLibre
  // Centered at BCIT
  const map = new maplibregl.Map({
    container: "map",
    style: `https://api.maptiler.com/maps/streets/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`,
    center: [-123.00163752324765, 49.25324576104826],
    zoom: 10,
  });

  // Add controls (zoom, rotation, etc.) shown in top-right corner of map
  addControls(map);

  // Once the map loads, we can add the user location and hike markers, etc.
  // We wait for the "load" event to ensure the map is fully initialized before we try to add sources/layers.
  map.once("load", async () => {
    // Choose either the built-in geolocate control or the manual pin method
    // addGeolocationControl(map);
    map.flyTo({
      center: downtownVancouver,
      zoom: 12,
      speed: 0.8,
      curve: 1.4,
      essential: true,
    });

    await showRestaurants(map);
    await addUserPin(map);
    console.log("map loaded, placed user pin and restaurant pins!");
  });

  // Once the map loads, we can add the user location and hike markers, etc.
  // We wait for the "load" event to ensure the map is fully initialized before we try to add sources/layers.
  map.once("load", async () => {
    // Choose either the built-in geolocate control or the manual pin method
    // addGeolocationControl(map);
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

  function addControls(map) {
    // Zoom and rotation
    map.addControl(new maplibregl.NavigationControl(), "bottom-right");
  }
}

showMap();

function search(map) {
  const input = document.getElementById("restaurantSearch");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query == "") return;

    const match = markers.find((m) => m.name.includes(query));

    if (match) {
      const lngLat = match.marker.getLngLat();

      map.flyTo({
        center: [lngLat.lng, lngLat.lat],
        zoom: 14,
        speed: 0.8,
        curve: 1.4,
      });

      match.marker.togglePopup();
    }
  });
}

async function addUserPin(map) {
  if (!("geolocation" in navigator)) {
    console.warn("Geolocation is not available in this browser");
    return;
  }

  // Use the safe geolocation function that returns a Promise
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      // Store user location in global variable for later use (e.g., zooming to all points)
      appState.userLngLat = [pos.coords.longitude, pos.coords.latitude];

      // map.flyTo({
      //     center: appState.userLngLat,
      //     zoom: 14   //adjust this to how zoomed-in you want
      // });

      // Add a GeoJSON source
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

      // Add a simple circle layer
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

      // Optional: add a tooltip on hover or click
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
