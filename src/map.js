import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";


import MaplibreGeocoder from "@maplibre/maplibre-gl-geocoder";
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
  userLngLat: null
};


const downtownVancouver = [-123.1207, 49.2827];

async function getRestaurant(){
    const snapshot = await getDocs(collection(db, "Restaurant"));
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

async function showRestaurants(map){
    const restaurants = await getRestaurant();

    restaurants.forEach(doc => {
        if(doc.lat == null || doc.lng == null) return;

        appState.restaurants.push(doc);

        const el = document.createElement("div");
        el.style.width = "16px";
        el.style.height = "16px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "green";
        el.style.border = "2px solid white";

        const restaurantName = doc.basicInfo?.restaurantName || "Restaurant";
        const address = doc.basicInfo?.address || "Address not available";
        const waitTime = doc.waitTime != null ? `${doc.waitTime} min` : "N/A";

        //change the bootstrap here to make the pop html prettier
        const popupHtml = `
             <div class="card shadow-sm" style="width: 220px;">
                <div class="card-body p-2">
                    <h6 class="card-title mb-1">${restaurantName}</h6>
                    <p class="card-text small mb-2">${address}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-success fs-6">Wait: ${waitTime} min</span>
                    </div>
                </div>
            </div>
        `;

        new maplibregl.Marker({ element: el})
            .setLngLat([doc.lng, doc.lat])
            .setPopup(new maplibregl.Popup({ offset: 25}).setHTML(popupHtml))
            .addTo(map);
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
        zoom: 10
    });

    // Add controls (zoom, rotation, etc.) shown in top-right corner of map
    addControls(map);
    addSearchControl(map);

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
            essential: true
        });

        await showRestaurants(map);
        await addUserPin(map);
	      console.log("map loaded, placed user pin and restaurant pins!");
    });

    function addControls(map) {
        // Zoom and rotation
        map.addControl(new maplibregl.NavigationControl(), "top-right");
    }
}

//------------------------------------------------------------
// This function adds a search control to the map using the MaplibreGeocoder plugin.
// It uses the Nominatim API for geocoding (forward geocoding only).
// When a search result is selected, it calls routeToPoint() to get and 
// display the route from user location to the searched location.
//------------------------------------------------------------- 
function addSearchControl(map) {
    const geocoderApi = {
        // This configuaration is used by the MaplibreGeocoder plugin when the user types a search query.
        forwardGeocode: async (config) => {
            console.log("Geocoder query:", config.query); // For debugging: check the search query is being received correctly
            const features = [];

            // Use the Nominatim API to perform forward geocoding based on the user's search query.
            const url =
                `https://nominatim.openstreetmap.org/search` +
                `?q=${encodeURIComponent(config.query)}` +
                `&format=geojson&limit=5`;

            // Make the API call to Nominatim and parse the response as JSON
            const response = await fetch(url);
            const geojson = await response.json();

            // For each feature in the Nominatim response, we extract the bounding box and calculate the center point.
            for (const feature of geojson.features) {
                const [minX, minY, maxX, maxY] = feature.bbox;
                const center = [
                    minX + (maxX - minX) / 2,
                    minY + (maxY - minY) / 2
                ];

                features.push({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: center
                    },
                    place_name: feature.properties.display_name,
                    text: feature.properties.display_name,
                    place_type: ["place"],
                    properties: feature.properties,
                    center
                });
            }

            return { features };
        }
    };

    // Initialize the MaplibreGeocoder control with our custom geocoder API and add it to the map.
    const geocoder = new MaplibreGeocoder(geocoderApi, {
        maplibregl,
        placeholder: "Search for a place",  // Placeholder text in the search box
        minLength: 2,                       // Minimum number of characters before search starts
        showResultsWhileTyping: true,       // Show results as the user types
        debounceSearch: 300                 // Wait 300ms after the user stops typing before performing the search (to reduce API calls)
    });

    // Add the geocoder control to the top-left corner of the map
    map.addControl(geocoder, "top-left");

    // Listen for the "result" event, which is triggered when the user selects a search result.
    // After the user selects a search result, we extract the coordinates of the selected location 
    // and call routeToPoint() to display the route from the user's current location to the selected location.
    geocoder.on("result", (e) => {
        const [lng, lat] = e.result.center;
        routeToPoint(lng, lat);
    });
}

showMap();

async function addUserPin(map) {
    if (!("geolocation" in navigator)) {
        console.warn("Geolocation is not available in this browser");
        return;
    }

    // Use the safe geolocation function that returns a Promise
    navigator.geolocation.getCurrentPosition(
        pos => {
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
                            properties: { description: "Your location" }
                        }
                    ]
                }
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
                    "circle-stroke-color": "#ffffff"
                }
            });

            // Optional: add a tooltip on hover or click
            map.on("click", "userLngLat", e => {
                const [lng, lat] = e.features[0].geometry.coordinates;
                new maplibregl.Popup().setLngLat([lng, lat]).setHTML("You are here").addTo(map);
            });
        },
        err => {
            console.error("Geolocation error", err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}


