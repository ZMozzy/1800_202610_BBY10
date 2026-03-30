import { allRestaurants, displayRestaurants } from '../restaurant_list/landing.js';

export function runLocalSearch(term) {
    const query = term.toLowerCase().trim();

    if (query === "") {
        displayRestaurants(allRestaurants);
        return;
    }

    const filtered = allRestaurants.filter(r => {
        const name = r.basicInfo?.restaurantName?.toLowerCase() || "";
        return name.includes(query);
    });

    displayRestaurants(filtered);
}

console.log("search loaded.")

// --- Search Logic Integration ---
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("restaurantSearch");

    if (!searchInput) return;

    // 1. Check if we arrived with a search term in the URL
    const params = new URLSearchParams(window.location.search);
    const queryFromUrl = params.get("search") || "";

    if (queryFromUrl) {
        searchInput.value = queryFromUrl;
        // We wait a tiny bit for loadRestaurants to finish fetching
        setTimeout(() => runLocalSearch(queryFromUrl), 800);
    }

    // 2. Listen for typing
    searchInput.addEventListener("input", (e) => {
        runLocalSearch(e.target.value);
    });

    // 3. The Actual Filter Logic
    function runLocalSearch(term) {
        const query = term.toLowerCase().trim();

        // If search is empty, show everything again
        if (query === "") {
            displayRestaurants(allRestaurants);
            return;
        }

        // Filter your 'allRestaurants' array based on the name
        const filtered = allRestaurants.filter(r => {
            const name = r.basicInfo?.restaurantName?.toLowerCase() || "";
            return name.includes(query);
        });

        // Use your EXISTING function to redraw the cards with the filtered list
        displayRestaurants(filtered);
    }
});
