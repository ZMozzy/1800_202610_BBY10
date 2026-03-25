import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ------------------------------------------------------------
// Global variable to store user location, hike data - good practice
// ------------------------------------------------------------
const appState = {
  hikes: [],
  userLngLat: null
};

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

    // Once the map loads, we can add the user location and hike markers, etc. 
    // We wait for the "load" event to ensure the map is fully initialized before we try to add sources/layers.
    map.once("load", async () => {
        // Choose either the built-in geolocate control or the manual pin method
        // addGeolocationControl(map);
        await addUserPin(map);
	      console.log("map loaded, placed user pin!");
    });

    function addControls(map) {
        // Zoom and rotation
        map.addControl(new maplibregl.NavigationControl(), "top-right");
    }
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