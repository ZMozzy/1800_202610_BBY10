// ================================
// Get references to Step 3 elements
// ================================
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const confirmPasswordInput = document.getElementById("confirmPasswordInput");
const phoneInput = document.getElementById("phoneInput");
const businessLicenseInput = document.getElementById("businessLicenseInput");
const businessLicensePreviewWrapper = document.getElementById("businessLicensePreviewWrapper");
const businessLicensePreviewList = document.getElementById("businessLicensePreviewList");
const submitBtn = document.getElementById("submitBtn");
const step3ErrorMsg = document.getElementById("step3ErrorMsg");

const DRAFT_DB_NAME = "restaurantSignupDraft";
const DRAFT_DB_VERSION = 1;
const DRAFT_STORE_NAME = "uploads";
const BUSINESS_LICENSE_FILES_KEY = "step3BusinessLicenseFiles";

let businessLicenseFiles = [];
let businessLicensePreviewUrls = [];

// Business license supports image uploads only.
function isImageFile(file) {
  return Boolean(file && file.type && file.type.startsWith("image/"));
}

function isAllowedBusinessLicenseFile(file) {
  return isImageFile(file);
}

function toFileSignature(file) {
  return `${file.name}__${file.size}__${file.lastModified}`;
}

// Appends new files while removing duplicates selected multiple times.
function mergeUniqueFiles(existingFiles, newFiles) {
  const merged = [...existingFiles];
  const existingSignatures = new Set(existingFiles.map(toFileSignature));

  newFiles.forEach((file) => {
    const signature = toFileSignature(file);
    if (!existingSignatures.has(signature)) {
      merged.push(file);
      existingSignatures.add(signature);
    }
  });

  return merged;
}

// Stores readable file names for review display in localStorage.
function updateStoredBusinessLicenseNames() {
  if (businessLicenseFiles.length > 0) {
    localStorage.setItem(
      "businessLicenseFileName",
      businessLicenseFiles.map((file) => file.name).join(", ")
    );
  } else {
    localStorage.removeItem("businessLicenseFileName");
  }
}

// Releases old object URLs before rerendering preview cards.
function clearBusinessLicensePreviewUrls() {
  businessLicensePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  businessLicensePreviewUrls = [];
}

// Opens/creates the draft IndexedDB store used by step2/step3 file staging.
function openDraftDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DRAFT_DB_NAME, DRAFT_DB_VERSION);

    request.onupgradeneeded = function () {
      const db = request.result;
      if (!db.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        db.createObjectStore(DRAFT_STORE_NAME);
      }
    };

    request.onsuccess = function () {
      resolve(request.result);
    };

    request.onerror = function () {
      reject(request.error);
    };
  });
}

async function saveDraftFiles(key, files) {
  const db = await openDraftDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE_NAME, "readwrite");
    const store = tx.objectStore(DRAFT_STORE_NAME);
    const request = store.put(files, key);

    request.onsuccess = function () {
      resolve();
    };

    request.onerror = function () {
      reject(request.error);
    };
  });
}

async function getDraftFiles(key) {
  const db = await openDraftDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DRAFT_STORE_NAME, "readonly");
    const store = tx.objectStore(DRAFT_STORE_NAME);
    const request = store.get(key);

    request.onsuccess = function () {
      const value = request.result;
      resolve(Array.isArray(value) ? value : []);
    };

    request.onerror = function () {
      reject(request.error);
    };
  });
}

// Creates one preview card for each selected business license file.
function createBusinessLicensePreviewItem(file, index) {
  const container = document.createElement("div");
  container.className = "border rounded p-2";
  container.style.width = "130px";

  const objectUrl = URL.createObjectURL(file);
  businessLicensePreviewUrls.push(objectUrl);

  const previewArea = document.createElement("div");
  previewArea.className = "mb-2";
  previewArea.style.height = "90px";
  previewArea.style.borderRadius = "6px";
  previewArea.style.overflow = "hidden";
  previewArea.style.display = "flex";
  previewArea.style.alignItems = "center";
  previewArea.style.justifyContent = "center";
  previewArea.style.background = "#f8f9fa";

  if (isImageFile(file)) {
    const image = document.createElement("img");
    image.src = objectUrl;
    image.alt = "Business license preview";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "cover";
    previewArea.appendChild(image);
  }

  const fileName = document.createElement("div");
  fileName.className = "small text-truncate mb-2";
  fileName.title = file.name;
  fileName.textContent = file.name;

  const openBtn = document.createElement("a");
  openBtn.className = "btn btn-sm btn-outline-secondary w-100 mb-2";
  openBtn.textContent = "Open";
  openBtn.href = objectUrl;
  openBtn.target = "_blank";
  openBtn.rel = "noopener noreferrer";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn btn-sm btn-outline-danger w-100";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", async function () {
    businessLicenseFiles.splice(index, 1);
    try {
      await saveDraftFiles(BUSINESS_LICENSE_FILES_KEY, businessLicenseFiles);
      updateStoredBusinessLicenseNames();
      renderBusinessLicensePreviews();
    } catch (error) {
      step3ErrorMsg.textContent = "Could not remove the selected file.";
      step3ErrorMsg.style.display = "block";
      console.error("Failed to remove business license file:", error);
    }
  });

  container.appendChild(previewArea);
  container.appendChild(fileName);
  container.appendChild(openBtn);
  container.appendChild(removeBtn);
  return container;
}

// Draws all selected business license previews.
function renderBusinessLicensePreviews() {
  clearBusinessLicensePreviewUrls();
  businessLicensePreviewList.innerHTML = "";

  if (businessLicenseFiles.length === 0) {
    businessLicensePreviewWrapper.style.display = "none";
    return;
  }

  businessLicenseFiles.forEach((file, index) => {
    businessLicensePreviewList.appendChild(createBusinessLicensePreviewItem(file, index));
  });

  businessLicensePreviewWrapper.style.display = "block";
}

// Loads previously staged files when user comes back to Step 3.
async function restoreBusinessLicenseDraftFiles() {
  try {
    const savedFiles = await getDraftFiles(BUSINESS_LICENSE_FILES_KEY);
    businessLicenseFiles = savedFiles.filter((file) => isAllowedBusinessLicenseFile(file));
    updateStoredBusinessLicenseNames();
    renderBusinessLicensePreviews();
  } catch (error) {
    console.error("Failed to restore business license draft files:", error);
  }
}

// ============================================
// Load saved Step 3 data from localStorage
// (Note: file inputs cannot be restored for security reasons)
// ============================================
const savedEmail = localStorage.getItem("ownerEmail");
const savedPassword = localStorage.getItem("ownerPassword");
const savedPhone = localStorage.getItem("ownerPhone");

if (savedEmail) emailInput.value = savedEmail;
if (savedPassword) passwordInput.value = savedPassword;
if (savedPhone) phoneInput.value = savedPhone;
restoreBusinessLicenseDraftFiles();

businessLicenseInput.addEventListener("change", async function () {
  const newFiles = Array.from(businessLicenseInput.files || []);
  if (newFiles.length === 0) return;

  const hasInvalidFile = newFiles.some((file) => !isAllowedBusinessLicenseFile(file));
  if (hasInvalidFile) {
    step3ErrorMsg.textContent = "Business license files must be image files.";
    step3ErrorMsg.style.display = "block";
    businessLicenseInput.value = "";
    return;
  }

  try {
    businessLicenseFiles = mergeUniqueFiles(businessLicenseFiles, newFiles);
    await saveDraftFiles(BUSINESS_LICENSE_FILES_KEY, businessLicenseFiles);
    updateStoredBusinessLicenseNames();
    renderBusinessLicensePreviews();
    step3ErrorMsg.style.display = "none";
  } catch (error) {
    step3ErrorMsg.textContent = "Could not save business license files. Please try again.";
    step3ErrorMsg.style.display = "block";
    console.error("Failed to save business license files:", error);
  } finally {
    businessLicenseInput.value = "";
  }
});

// ======================================================
// Password strength checker (common website-style rules)
// Rules:
// - At least 8 characters
// - At least 1 uppercase letter
// - At least 1 lowercase letter
// - At least 1 number
// - At least 1 special character
// ======================================================
function isStrongPassword(password) {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;
  return passwordRegex.test(password);
}

// ======================================================
// Validate required fields before final submit
// - If missing required fields: block navigation
// - If invalid password / mismatch: block navigation
// - If valid: save values to localStorage and continue
// ======================================================
submitBtn.addEventListener("click", async function (event) {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const phone = phoneInput.value.trim();

  const hasBusinessLicense = businessLicenseFiles.length > 0;

  // 1) Basic required-field validation
  if (!email || !password || !confirmPassword || !phone || !hasBusinessLicense) {
    step3ErrorMsg.textContent =
      "Please fill out all required fields before submitting.";
    step3ErrorMsg.style.display = "block";
    return;
  }

  // 2) Password strength validation
  if (!isStrongPassword(password)) {
    step3ErrorMsg.textContent =
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    step3ErrorMsg.style.display = "block";
    return;
  }

  // 3) Confirm password must match password
  if (password !== confirmPassword) {
    step3ErrorMsg.textContent =
      "Confirm Password must match Password.";
    step3ErrorMsg.style.display = "block";
    return;
  }

  // Hide error message if validation passes
  step3ErrorMsg.style.display = "none";
  step3ErrorMsg.textContent =
    "Please fill out all required fields before submitting.";

  // Save Step 3 values (for testing/debugging/future Firebase use)
  localStorage.setItem("ownerEmail", email);
  localStorage.setItem("ownerPassword", password);
  localStorage.setItem("ownerPhone", phone);
  updateStoredBusinessLicenseNames();

  try {
    await saveDraftFiles(BUSINESS_LICENSE_FILES_KEY, businessLicenseFiles);
  } catch (error) {
    step3ErrorMsg.textContent = "Could not save uploaded files. Please try again.";
    step3ErrorMsg.style.display = "block";
    console.error("Failed to save business license draft files before review:", error);
    return;
  }

  // Optional: mark flow as complete
  localStorage.setItem("restaurantSignupCompleted", "true");
  window.location.href = submitBtn.href;
});

window.addEventListener("beforeunload", function () {
  clearBusinessLicensePreviewUrls();
});
