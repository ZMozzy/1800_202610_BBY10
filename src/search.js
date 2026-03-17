
console.log("search loaded.")
document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("restaurantSearch");
    if (!searchInput) return;

    function goToSearchPage() {
        const query = searchInput.value.trim();
        if (!query) return;
console.log("typed:", searchInput.value);
        window.location.href = `landing.html?search=${encodeURIComponent(query)}`;
    }

    // Search from any page when Enter is pressed
    searchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            e.preventDefault();
            goToSearchPage();
        }
    });

    // Also search when the input loses focus and you want manual testing
    // comment this out later if you don't want it
    // searchInput.addEventListener("change", goToSearchPage);

    // Only filter cards if this page actually has restaurant cards
    const cards = document.querySelectorAll(".restaurant-card");

    if (cards.length > 0) {
        const params = new URLSearchParams(window.location.search);
        const queryFromUrl = params.get("search") || "";

        if (queryFromUrl) {
            searchInput.value = queryFromUrl;
            filterCards(queryFromUrl);
        }

        searchInput.addEventListener("input", function () {
            filterCards(searchInput.value);
        });

        function filterCards(searchValue) {
            const value = searchValue.toLowerCase();

            cards.forEach(function (card) {
                const titleEl = card.querySelector(".card-title");
                const title = titleEl ? titleEl.textContent.toLowerCase() : "";

                card.style.display = title.includes(value) ? "" : "none";
            });
        }
    }
});