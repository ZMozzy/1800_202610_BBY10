// ================================
// Get references to form elements
// ================================
const restaurantNameInput = document.getElementById("restaurantNameInput");
const addressInput = document.getElementById("addressInput");
const businessTypeSelect = document.getElementById("businessTypeSelect");
const websiteInput = document.getElementById("websiteInput");
const descriptionInput = document.getElementById("descriptionInput");
const step1NextBtn = document.getElementById("step1NextBtn");
const step1ErrorMsg = document.getElementById("step1ErrorMsg");

// ============================================
// Load saved Step 1 data from localStorage
// (This lets user return to the page without
// losing previously entered values)
// ============================================
const savedRestaurantName = localStorage.getItem("restaurantName");
const savedAddress = localStorage.getItem("restaurantAddress");
const savedBusinessType = localStorage.getItem("businessType");
const savedWebsite = localStorage.getItem("restaurantWebsite");
const savedDescription = localStorage.getItem("restaurantDescription");

// Restore saved values if they exist
if (savedRestaurantName) restaurantNameInput.value = savedRestaurantName;
if (savedAddress) addressInput.value = savedAddress;
if (savedBusinessType) businessTypeSelect.value = savedBusinessType;
if (savedWebsite) websiteInput.value = savedWebsite;
if (savedDescription) descriptionInput.value = savedDescription;

// ======================================================
// Validate required fields before going to Step 2
// - If missing required fields: block navigation
// - If valid: save values to localStorage and continue
// ======================================================
step1NextBtn.addEventListener("click", function (event) {
  // Read and trim user input values
  const restaurantName = restaurantNameInput.value.trim();
  const address = addressInput.value.trim();
  const businessType = businessTypeSelect.value;
  const website = websiteInput.value.trim();
  const description = descriptionInput.value.trim();

  // Check required fields (Restaurant Name, Address, Business Type, Description)
  if (!restaurantName || !address || !businessType || !description) {
    // Stop the link from moving to Step 2
    event.preventDefault();

    // Show error message
    step1ErrorMsg.style.display = "block";
    return;
  }

  // Hide error message if validation passes
  step1ErrorMsg.style.display = "none";

  // Save Step 1 values for use in Step 2 / Step 3
  localStorage.setItem("restaurantName", restaurantName);
  localStorage.setItem("restaurantAddress", address);
  localStorage.setItem("businessType", businessType);
  localStorage.setItem("restaurantWebsite", website);
  localStorage.setItem("restaurantDescription", description);
});
