import { auth, db } from "./firebaseConfig.js";
import { addDoc, collection, serverTimestamp, updateDoc } from "firebase/firestore";

const DRAFT_DB_NAME = "restaurantSignupDraft";
const DRAFT_DB_VERSION = 1;
const DRAFT_STORE_NAME = "uploads";

const STEP2_PHOTO_FILES_KEY = "step2PhotoFiles";
const STEP2_MENU_FILES_KEY = "step2MenuFiles";
const STEP3_BUSINESS_LICENSE_FILES_KEY = "step3BusinessLicenseFiles";

const finalSubmitBtn = document.getElementById("finalSubmitBtnBottom");
const reviewSubmitStatus = document.getElementById("reviewSubmitStatus");

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

function setSubmittingState(isSubmitting) {
  if (!finalSubmitBtn) return;
  finalSubmitBtn.classList.toggle("disabled", isSubmitting);
  finalSubmitBtn.setAttribute("aria-disabled", String(isSubmitting));
  finalSubmitBtn.textContent = isSubmitting ? "Submitting..." : "Confirm and Submit";
}

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

function fileToBase64String(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function () {
      const dataUrl = String(reader.result || "");
      const base64String = dataUrl.split(",")[1] || "";
      resolve(base64String);
    };

    reader.onerror = function () {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

async function mapFilesAsBase64(files) {
  return Promise.all(
    files.map(async (file) => {
      const base64Data = await fileToBase64String(file);

      return {
        fileName: file.name,
        contentType: file.type || "",
        size: file.size || 0,
        base64Data,
      };
    }),
  );
}

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
      state: "encoding_images",
    });

    const [photos, menus, businessLicenses] = await Promise.all([
      mapFilesAsBase64(photoFiles),
      mapFilesAsBase64(menuFiles),
      mapFilesAsBase64(businessLicenseFiles),
    ]);

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
    //new add start

    //Get the current user
    const user = auth.currentUser;

    if (user) {
      try {
        //Reference the user's document using their Auth UID
        const userRef = doc(db, "users", user.uid);

        //Update the fields
        await updateDoc(userRef, {
            restaurantId: submissionRef.id, 
            hasRestaurant: true      
        });

        console.log("User successfully linked to restaurant:", docRef.id);
      } catch (error) {
        console.error("Error linking user to restaurant:", error);
    }
}
//new add end

    await clearDraftUploads();
    clearDraftFormData();
    setSubmitStatus("Submitted successfully.", false);
    window.location.href =
      finalSubmitBtn.getAttribute("href") || "./add-success.html";
  } catch (error) {
    console.error("Failed to submit restaurant draft:", error);
    setSubmitStatus("Upload failed. Please try again.");
    setSubmittingState(false);
  }
}

if (finalSubmitBtn) {
  finalSubmitBtn.addEventListener("click", handleConfirmAndSubmit);
}

