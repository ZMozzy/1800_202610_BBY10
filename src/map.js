import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Add this to the top of your JS file
// Database initialized
import { db } from "./firebaseConfig.js";
// Functions needed to read from database
import { collection, getDocs } from "firebase/firestore";

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

            map.flyTo({
                center: appState.userLngLat,
                zoom: 14   //adjust this to how zoomed-in you want
            });

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


// ------------------------------------------------------------
// This function fetches hike data (converted to JSON)
// from Firestore and adds green pins to the map.
// It assumes each hike document has "lat" and "lng" fields.
// ------------------------------------------------------------
async function getHikes() {

    // Fetch all documents from the "hikes" collection in Firestore
    const snapshot = await getDocs(collection(db, "hikes"));

    // Convert Firestore documents to plain JavaScript objects
    // And returns a new array (list of the documents, json format)
    // Equivalent to doing this:
    //   const hikes = [];
    //   for (const doc of snapshot.docs) {
    //       hikes.push(doc.data());
    
    return snapshot.docs.map(doc => doc.data());
}


async function showHikes(map) {
    // Fetch hike data from Firestore
    const snapshot = await getHikes();

    // Loop through each hike document and add a green pin to the map
    snapshot.forEach(doc => {

        // Store hike data in global variable (array)
        // for later use (e.g., zooming to all points)
        appState.hikes.push(doc);  

        // create green pin
        const el = document.createElement("div");
        el.style.width = "16px";
        el.style.height = "16px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "green";
        el.style.border = "2px solid white";

        // new layer with markers, add to map
        new maplibregl.Marker({ element: el })
            .setLngLat([doc.lng, doc.lat])
            .addTo(map);
    });
}