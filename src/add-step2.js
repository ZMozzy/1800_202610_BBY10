// ================================
// Get references to Step 2 elements
// ================================
const step2NextBtn = document.getElementById("step2NextBtn");
const step2ErrorMsg = document.getElementById("step2ErrorMsg");

const startDaySelect = document.getElementById("startDaySelect");
const endDaySelect = document.getElementById("endDaySelect");
const openTimeInput = document.getElementById("openTimeInput");
const closeTimeInput = document.getElementById("closeTimeInput");
const holidayOpenTimeInput = document.getElementById("holidayOpenTimeInput");
const holidayCloseTimeInput = document.getElementById("holidayCloseTimeInput");
const holidayClosedCheckbox = document.getElementById("holidayClosedCheckbox");
const photoInput = document.getElementById("photoInput");
const priceRangeSelect = document.getElementById("priceRangeSelect");
const menuInput = document.getElementById("menuInput");

const photoPreviewWrapper = document.getElementById("photoPreviewWrapper");
const photoPreviewList = document.getElementById("photoPreviewList");
const menuPreviewWrapper = document.getElementById("menuPreviewWrapper");
const menuPreviewList = document.getElementById("menuPreviewList");

const DRAFT_DB_NAME = "restaurantSignupDraft";
const DRAFT_DB_VERSION = 1;
const DRAFT_STORE_NAME = "uploads";
const PHOTO_FILES_KEY = "step2PhotoFiles";
const MENU_FILES_KEY = "step2MenuFiles";

let photoFiles = [];
let menuFiles = [];
const previewUrls = {
  photo: [],
  menu: [],
};

// Checks whether a file is an image (used for photo validation and rendering).
function isImageFile(file) {
  return Boolean(file && file.type && file.type.startsWith("image/"));
}

// Checks whether a file is a PDF (menu supports PDF uploads).
function isPdfFile(file) {
  return Boolean(file && (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")));
}

// Step 2 menu accepts image or PDF files.
function isAllowedMenuFile(file) {
  return isImageFile(file) || isPdfFile(file);
}

// ================================
// IndexedDB helpers for draft files
// ================================
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

function toFileSignature(file) {
  return `${file.name}__${file.size}__${file.lastModified}`;
}

// Merges newly selected files into existing draft list without duplicates.
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

function updateStoredFileNames() {
  if (photoFiles.length > 0) {
    localStorage.setItem(
      "photoFileName",
      photoFiles.map((file) => file.name).join(", ")
    );
  } else {
    localStorage.removeItem("photoFileName");
  }

  if (menuFiles.length > 0) {
    localStorage.setItem(
      "menuFileName",
      menuFiles.map((file) => file.name).join(", ")
    );
  } else {
    localStorage.removeItem("menuFileName");
  }
}

// Releases object URLs to avoid memory leaks when previews are rerendered.
function clearPreviewUrls(type) {
  previewUrls[type].forEach((url) => URL.revokeObjectURL(url));
  previewUrls[type] = [];
}

// Builds a single preview card (image or PDF) with Open/Remove controls.
function createPreviewItem(type, file, index) {
  const container = document.createElement("div");
  container.className = "border rounded p-2";
  container.style.width = "130px";

  const objectUrl = URL.createObjectURL(file);
  previewUrls[type].push(objectUrl);

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
    image.alt = `${type} preview`;
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "cover";
    previewArea.appendChild(image);
  } else if (isPdfFile(file)) {
    const pdfLabel = document.createElement("span");
    pdfLabel.className = "small fw-semibold text-secondary";
    pdfLabel.textContent = "PDF";
    previewArea.appendChild(pdfLabel);
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
  removeBtn.addEventListener("click", function () {
    removeFile(type, index);
  });

  container.appendChild(previewArea);
  container.appendChild(fileName);
  container.appendChild(openBtn);
  container.appendChild(removeBtn);
  return container;
}

// Renders all preview cards for either photo list or menu list.
function renderPreview(type) {
  const isPhoto = type === "photo";
  const files = isPhoto ? photoFiles : menuFiles;
  const wrapper = isPhoto ? photoPreviewWrapper : menuPreviewWrapper;
  const list = isPhoto ? photoPreviewList : menuPreviewList;

  clearPreviewUrls(type);
  list.innerHTML = "";

  if (files.length === 0) {
    wrapper.style.display = "none";
    return;
  }

  files.forEach((file, index) => {
    list.appendChild(createPreviewItem(type, file, index));
  });

  wrapper.style.display = "block";
}

// Persists current files in IndexedDB, then updates localStorage names and UI preview.
async function persistAndRender(type) {
  if (type === "photo") {
    await saveDraftFiles(PHOTO_FILES_KEY, photoFiles);
  } else {
    await saveDraftFiles(MENU_FILES_KEY, menuFiles);
  }

  updateStoredFileNames();
  renderPreview(type);
}

// Removes one selected file from the relevant list and persists the new state.
async function removeFile(type, index) {
  try {
    if (type === "photo") {
      photoFiles.splice(index, 1);
      await persistAndRender("photo");
    } else {
      menuFiles.splice(index, 1);
      await persistAndRender("menu");
    }
  } catch (error) {
    step2ErrorMsg.textContent = "Could not remove the selected file.";
    step2ErrorMsg.style.display = "block";
    console.error("Failed to remove file:", error);
  }
}

// ================================
// Helper: disable holiday time if holiday closed
// ================================
function toggleHolidayTimeInputs() {
  const isClosed = holidayClosedCheckbox.checked;
  holidayOpenTimeInput.disabled = isClosed;
  holidayCloseTimeInput.disabled = isClosed;
}

// ================================
// Load saved Step 2 data from localStorage
// ================================
const savedStartDay = localStorage.getItem("startDay");
const savedEndDay = localStorage.getItem("endDay");
const savedOpenTime = localStorage.getItem("openTime");
const savedCloseTime = localStorage.getItem("closeTime");
const savedHolidayHours = localStorage.getItem("holidayHours");
const savedPriceRange = localStorage.getItem("priceRange");

if (savedStartDay) startDaySelect.value = savedStartDay;
if (savedEndDay) endDaySelect.value = savedEndDay;
if (savedOpenTime) openTimeInput.value = savedOpenTime;
if (savedCloseTime) closeTimeInput.value = savedCloseTime;

if (savedHolidayHours === "Closed") {
  holidayClosedCheckbox.checked = true;
} else if (savedHolidayHours && savedHolidayHours.includes("-")) {
  const [savedHolidayOpen, savedHolidayClose] = savedHolidayHours.split("-");
  if (savedHolidayOpen) holidayOpenTimeInput.value = savedHolidayOpen;
  if (savedHolidayClose) holidayCloseTimeInput.value = savedHolidayClose;
}

if (savedPriceRange) priceRangeSelect.value = savedPriceRange;

toggleHolidayTimeInputs();
holidayClosedCheckbox.addEventListener("change", toggleHolidayTimeInputs);

async function restoreDraftFiles() {
  try {
    const [savedPhotos, savedMenus] = await Promise.all([
      getDraftFiles(PHOTO_FILES_KEY),
      getDraftFiles(MENU_FILES_KEY),
    ]);

    photoFiles = savedPhotos.filter((file) => isImageFile(file));
    menuFiles = savedMenus.filter((file) => isAllowedMenuFile(file));

    updateStoredFileNames();
    renderPreview("photo");
    renderPreview("menu");
  } catch (error) {
    console.error("Failed to restore draft files:", error);
  }
}

restoreDraftFiles();

function validatePhotoFiles(files) {
  return files.every((file) => isImageFile(file));
}

// Menu accepts mixed image/PDF uploads.
function validateMenuFiles(files) {
  return files.every((file) => isAllowedMenuFile(file));
}

// Handles photo picker changes (append, dedupe, persist, rerender).
photoInput.addEventListener("change", async function () {
  const newFiles = Array.from(photoInput.files || []);
  if (newFiles.length === 0) return;

  if (!validatePhotoFiles(newFiles)) {
    step2ErrorMsg.textContent = "Photos must be image files.";
    step2ErrorMsg.style.display = "block";
    photoInput.value = "";
    return;
  }

  try {
    photoFiles = mergeUniqueFiles(photoFiles, newFiles);
    await persistAndRender("photo");
    step2ErrorMsg.style.display = "none";
  } catch (error) {
    step2ErrorMsg.textContent = "Could not save selected photos. Please try again.";
    step2ErrorMsg.style.display = "block";
    console.error("Failed to save photo files:", error);
  } finally {
    photoInput.value = "";
  }
});

// Handles menu picker changes (append, dedupe, persist, rerender).
menuInput.addEventListener("change", async function () {
  const newFiles = Array.from(menuInput.files || []);
  if (newFiles.length === 0) return;

  if (!validateMenuFiles(newFiles)) {
    step2ErrorMsg.textContent = "Menu files must be image or PDF files.";
    step2ErrorMsg.style.display = "block";
    menuInput.value = "";
    return;
  }

  try {
    menuFiles = mergeUniqueFiles(menuFiles, newFiles);
    await persistAndRender("menu");
    step2ErrorMsg.style.display = "none";
  } catch (error) {
    step2ErrorMsg.textContent = "Could not save selected menu files. Please try again.";
    step2ErrorMsg.style.display = "block";
    console.error("Failed to save menu files:", error);
  } finally {
    menuInput.value = "";
  }
});

// ================================
// Validate required fields before going to Step 3
// ================================
step2NextBtn.addEventListener("click", async function (event) {
  event.preventDefault();

  const startDay = startDaySelect.value.trim();
  const endDay = endDaySelect.value.trim();
  const openTime = openTimeInput.value.trim();
  const closeTime = closeTimeInput.value.trim();
  const holidayHours = holidayClosedCheckbox.checked
    ? "Closed"
    : `${holidayOpenTimeInput.value.trim()}-${holidayCloseTimeInput.value.trim()}`;
  const priceRange = priceRangeSelect.value.trim();

  const hasPhoto = photoFiles.length > 0;
  const hasMenu = menuFiles.length > 0;

  if (!startDay || !endDay || !openTime || !closeTime || !hasPhoto || !priceRange || !hasMenu) {
    step2ErrorMsg.textContent = "Please fill out all required (*) fields before continuing.";
    step2ErrorMsg.style.display = "block";
    return;
  }

  try {
    await Promise.all([
      saveDraftFiles(PHOTO_FILES_KEY, photoFiles),
      saveDraftFiles(MENU_FILES_KEY, menuFiles),
    ]);
  } catch (error) {
    step2ErrorMsg.textContent = "Could not save uploaded files. Please try again.";
    step2ErrorMsg.style.display = "block";
    console.error("Failed to save draft files before Step 3:", error);
    return;
  }

  step2ErrorMsg.style.display = "none";

  localStorage.setItem("startDay", startDay);
  localStorage.setItem("endDay", endDay);
  localStorage.setItem("openTime", openTime);
  localStorage.setItem("closeTime", closeTime);
  localStorage.setItem("holidayHours", holidayHours);
  localStorage.setItem("priceRange", priceRange);
  updateStoredFileNames();

  window.location.href = step2NextBtn.href;
});

window.addEventListener("beforeunload", function () {
  clearPreviewUrls("photo");
  clearPreviewUrls("menu");
});
