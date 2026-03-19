import { auth, db, storage } from "./firebaseConfig.js";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

const DRAFT_DB_NAME = "restaurantSignupDraft";
const DRAFT_DB_VERSION = 1;
const DRAFT_STORE_NAME = "uploads";

const STEP2_PHOTO_FILES_KEY = "step2PhotoFiles";
const STEP2_MENU_FILES_KEY = "step2MenuFiles";
const STEP3_BUSINESS_LICENSE_FILES_KEY = "step3BusinessLicenseFiles";

// Temporary switch: keep upload logic in code, but disable actual Storage upload for now.
// Set to true later when your Firebase Storage plan/rules are ready.
const ENABLE_STORAGE_UPLOADS = false;

const finalSubmitBtn = document.getElementById("finalSubmitBtnBottom");
const reviewSubmitStatus = document.getElementById("reviewSubmitStatus");

// Shows/hides submission status text under the confirm button.
function setSubmitStatus(message, isError = true) {
  if (!reviewSubmitStatus) return;
  if (!message) {
    reviewSubmitStatus.style.display = "none";
    reviewSubmitStatus.textContent = "";
    return;
  }

  reviewSubmitStatus.textContent = message;
  reviewSubmitStatus.style.display = "block";
  reviewSubmitStatus.classList.toggle("text-danger", isError);
  reviewSubmitStatus.classList.toggle("text-success", !isError);
}

// Locks/unlocks submit button and updates button text during processing.
function setSubmittingState(isSubmitting) {
  if (!finalSubmitBtn) return;
  finalSubmitBtn.classList.toggle("disabled", isSubmitting);
  finalSubmitBtn.setAttribute("aria-disabled", String(isSubmitting));
  finalSubmitBtn.textContent = isSubmitting
    ? (ENABLE_STORAGE_UPLOADS ? "Uploading..." : "Submitting...")
    : "Confirm and Submit";
}

// Opens/creates IndexedDB store that holds staged uploads from Step 2/3.
function openDraftDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DRAFT_DB_NAME, DRAFT_DB_VERSION);

    request.onupgradeneeded = function () {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(DRAFT_STORE_NAME)) {
        dbInstance.createObjectStore(DRAFT_STORE_NAME);
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

// Reads a staged file array from IndexedDB by key.
async function getDraftFiles(key) {
  const dbInstance = await openDraftDb();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(DRAFT_STORE_NAME, "readonly");
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

// Clears staged upload blobs after successful submission.
async function clearDraftUploads() {
  const dbInstance = await openDraftDb();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(DRAFT_STORE_NAME, "readwrite");
    const store = tx.objectStore(DRAFT_STORE_NAME);
    store.delete(STEP2_PHOTO_FILES_KEY);
    store.delete(STEP2_MENU_FILES_KEY);
    store.delete(STEP3_BUSINESS_LICENSE_FILES_KEY);

    tx.oncomplete = function () {
      resolve();
    };
    tx.onerror = function () {
      reject(tx.error);
    };
  });
}

// Clears local draft form values once submission is complete.
function clearDraftFormData() {
  const keys = [
    "restaurantName",
    "restaurantAddress",
    "businessType",
    "restaurantWebsite",
    "restaurantDescription",
    "startDay",
    "endDay",
    "openTime",
    "closeTime",
    "holidayHours",
    "priceRange",
    "photoFileName",
    "menuFileName",
    "ownerEmail",
    "ownerPassword",
    "ownerPhone",
    "businessLicenseFileName",
    "restaurantSignupCompleted",
    "restaurantDocId",
  ];

  keys.forEach((key) => localStorage.removeItem(key));
}

// Sanitizes file name for safe Firebase Storage paths.
function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Uploads a set of files to Storage and returns metadata + download URLs.
async function uploadFiles(fileCategory, files, submissionId) {
  if (!files.length) return [];

  const uploads = files.map(async (file, index) => {
    const sanitizedName = sanitizeFileName(file.name || `file_${index}`);
    const path = `restaurant-submissions/${submissionId}/${fileCategory}/${Date.now()}_${index}_${sanitizedName}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return {
      fileName: file.name,
      contentType: file.type || "",
      size: file.size || 0,
      storagePath: path,
      downloadURL: url,
    };
  });

  return Promise.all(uploads);
}

// Used when Storage upload is disabled; keeps file metadata only.
function mapFilesWithoutUpload(files) {
  return files.map((file) => ({
    fileName: file.name,
    contentType: file.type || "",
    size: file.size || 0,
    storagePath: "",
    downloadURL: "",
    uploadSkipped: true,
  }));
}

// Builds the final Firestore payload from localStorage + upload metadata.
function buildSubmissionPayload(userId, uploadsByType) {
  return {
    userId: userId || null,
    waitTime: 0,
    basicInfo: {
      restaurantName: localStorage.getItem("restaurantName") || "",
      address: localStorage.getItem("restaurantAddress") || "",
      businessType: localStorage.getItem("businessType") || "",
      website: localStorage.getItem("restaurantWebsite") || "",
      description: localStorage.getItem("restaurantDescription") || "",
    },
    hoursAndServices: {
      startDay: localStorage.getItem("startDay") || "",
      endDay: localStorage.getItem("endDay") || "",
      openTime: localStorage.getItem("openTime") || "",
      closeTime: localStorage.getItem("closeTime") || "",
      holidayHours: localStorage.getItem("holidayHours") || "",
      priceRange: localStorage.getItem("priceRange") || "",
    },
    ownerAccount: {
      email: localStorage.getItem("ownerEmail") || "",
      phone: localStorage.getItem("ownerPhone") || "",
    },
    uploads: uploadsByType,
    submittedAt: serverTimestamp(),
    status: "submitted",
  };
}

// Main submit flow: load staged files, write/update Firestore, optionally upload files.
async function handleConfirmAndSubmit(event) {
  event.preventDefault();

  if (finalSubmitBtn.classList.contains("disabled")) return;

  setSubmitStatus("");
  setSubmittingState(true);

  try {
    const userId = auth.currentUser?.uid || null;
    const [photoFiles, menuFiles, businessLicenseFiles] = await Promise.all([
      getDraftFiles(STEP2_PHOTO_FILES_KEY),
      getDraftFiles(STEP2_MENU_FILES_KEY),
      getDraftFiles(STEP3_BUSINESS_LICENSE_FILES_KEY),
    ]);

    const submissionRef = await addDoc(collection(db, "Restaurant"), {
      createdAt: serverTimestamp(),
      userId,
      state: ENABLE_STORAGE_UPLOADS ? "uploading_files" : "saving_metadata_only",
    });

    const submissionId = submissionRef.id;
    let photos = [];
    let menus = [];
    let businessLicenses = [];

    if (ENABLE_STORAGE_UPLOADS) {
      [photos, menus, businessLicenses] = await Promise.all([
        uploadFiles("photos", photoFiles, submissionId),
        uploadFiles("menus", menuFiles, submissionId),
        uploadFiles("business-licenses", businessLicenseFiles, submissionId),
      ]);
    } else {
      photos = mapFilesWithoutUpload(photoFiles);
      menus = mapFilesWithoutUpload(menuFiles);
      businessLicenses = mapFilesWithoutUpload(businessLicenseFiles);
    }

    const payload = buildSubmissionPayload(userId, {
      photos,
      menus,
      businessLicenses,
    });

    await updateDoc(submissionRef, {
      ...payload,
      state: "submitted",
      updatedAt: serverTimestamp(),
    });

    await clearDraftUploads();
    clearDraftFormData();
    setSubmitStatus("Submitted successfully.", false);
    window.location.href = finalSubmitBtn.getAttribute("href") || "./add-success.html";
  } catch (error) {
    console.error("Failed to submit restaurant draft:", error);
    setSubmitStatus("Upload failed. Please try again.");
    setSubmittingState(false);
  }
}

if (finalSubmitBtn) {
  finalSubmitBtn.addEventListener("click", handleConfirmAndSubmit);
}
