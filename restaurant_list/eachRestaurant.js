import { db } from "../src/firebaseConfig.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

// ----------DOM references-----------
const restaurantNameEl = document.getElementById("restaurantName");
const restaurantDescriptionEl = document.getElementById(
  "restaurantDescription",
);
const restaurantImageEl = document.getElementById("restaurantImage");
const restaurantWaitEl = document.getElementById("restaurantWaitHero");
const waitDot = document.getElementById("waitDot");
const writeReviewBtn = document.getElementById("writeReviewBtn");
const reviewsContainer = document.getElementById("reviewsContainer");

const photoGallery = document.getElementById("photoGallery");
const menuGallery = document.getElementById("menuGallery");
const licenseGallery = document.getElementById("licenseGallery");

function getDocIdFromUrl() {
  const params = new URL(window.location.href).searchParams;
  return params.get("docID");
}

// ------- WAIT TIME COLORS-------------

function getWaitColor(waitTime) {
  const time = Number(waitTime);
  if (time <= 10) return { dot: "#22c55e", label: "success" };
  if (time <= 30) return { dot: "#f59e0b", label: "warning" };
  if (time <= 60) return { dot: "#f97316", label: "orange" };
  return { dot: "#ef4444", label: "danger" };
}

// --------------- PHOTO GALLERY ----------------------------

function createGallery(container, images) {
  container.innerHTML = "";
  if (!images || !images.length) {
    container.innerHTML =
      "<p class='text-muted small mb-0'>No images uploaded.</p>";
    return;
  }

  images.forEach((imgData) => {
    if (!imgData.base64Data) return;
    const img = document.createElement("img");
    const mimeType = imgData.contentType || "image/png";
    img.src = `data:${mimeType};base64,${imgData.base64Data.trim()}`;
    img.className = "gallery-thumb";
    img.alt = "Image";

    // Click to expand as main image
    img.addEventListener("click", () => {
      const modal = document.getElementById("imageModal");
      const modalImg = document.getElementById("modalImage");

      modal.style.display = "block";
      modalImg.src = img.src;

      modalImg.src = img.src;
    });

    container.appendChild(img);
  });
}

// ------------------ FORMAT TIME/HOURS OF OPERATION -----------------------------

function formatTime(time) {
  if (!time) return "—";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

// ─----------------- REVIEWS------------------

async function loadReviews(restaurantId) {
  reviewsContainer.innerHTML =
    "<p class='text-muted small'>Loading reviews...</p>";

  try {
    const reviewsRef = collection(db, "Restaurant", restaurantId, "reviews");
    const q = query(reviewsRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      reviewsContainer.innerHTML =
        "<p class='text-muted small'>No reviews yet. Be the first!</p>";
      return;
    }

    reviewsContainer.innerHTML = `<div class="section-label mb-2">Reviews</div>`;
    snapshot.forEach((docSnap) => {
      const r = docSnap.data();
      const stars = "★".repeat(r.rating || 0) + "☆".repeat(5 - (r.rating || 0));
      const date = r.timestamp?.toDate().toLocaleDateString() || "";

      const card = document.createElement("div");
      card.className = "review-card";
      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="reviewer-name">${r.authorName || "Anonymous"}</span>
          <span class="review-date">${date}</span>
        </div>
        <div class="review-stars">${stars}</div>
        ${r.reviewText ? `<p class="review-text">${r.reviewText}</p>` : ""}
      `;
      reviewsContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading reviews:", err);
    reviewsContainer.innerHTML =
      "<p class='text-danger small'>Failed to load reviews.</p>";
  }
}

// ----------------- MAIN CONTENT --------------------

async function loadRestaurant() {
  const id = getDocIdFromUrl();
  if (!id) {
    restaurantNameEl.textContent = "Restaurant not found.";
    return;
  }

  try {
    const restaurantRef = doc(db, "Restaurant", id);
    const restaurantSnap = await getDoc(restaurantRef);

    if (!restaurantSnap.exists()) {
      restaurantNameEl.textContent = "Restaurant not found.";
      return;
    }

    const restaurant = restaurantSnap.data();
    const basic = restaurant.basicInfo || {};
    const hours = restaurant.hoursAndServices || {};
    const uploads = restaurant.uploads || {};

    // ── Basic Info
    restaurantNameEl.textContent = basic.restaurantName || "Unnamed";
    restaurantDescriptionEl.textContent =
      basic.description || "No description available.";
    document.getElementById("businessType").textContent =
      basic.businessType || "—";
    document.getElementById("restaurantAddress").textContent =
      basic.address || "—";

    // ── Website
    if (basic.website) {
      const websiteWrap = document.getElementById("websiteWrap");
      const websiteLink = document.getElementById("restaurantWebsite");
      websiteWrap.style.display = "inline-flex";
      websiteLink.href = basic.website.startsWith("http")
        ? basic.website
        : `https://${basic.website}`;
    }

    // ── Price Range
    document.getElementById("priceRange").textContent = hours.priceRange || "—";

    // ── Hours
    const open = formatTime(hours.openTime);
    const close = formatTime(hours.closeTime);
    document.getElementById("regularHours").textContent = `${open} – ${close}`;
    document.getElementById("daysOpen").textContent =
      hours.startDay && hours.endDay
        ? `${hours.startDay} – ${hours.endDay}`
        : "—";

    const holiday = hours.holidayHours;
    if (holiday === "Closed") {
      document.getElementById("holidayHours").textContent = "Closed";
    } else if (holiday && holiday.includes("-")) {
      const [hOpen, hClose] = holiday.split("-");
      document.getElementById("holidayHours").textContent =
        `${formatTime(hOpen)} – ${formatTime(hClose)}`;
    } else {
      document.getElementById("holidayHours").textContent = "—";
    }

    // ── Wait Time
    const waitTime = hours.waitTime ?? restaurant.waitTime ?? 0;
    const { dot, label } = getWaitColor(waitTime);
    restaurantWaitEl.textContent = `${waitTime} min wait`;
    waitDot.style.background = dot;

    // ── Main Photo
    const mainPhoto = uploads.photos?.[0];
    if (mainPhoto?.base64Data) {
      const mimeType = mainPhoto.contentType || "image/png";
      restaurantImageEl.src = `data:${mimeType};base64,${mainPhoto.base64Data.trim()}`;
    }

    // ── Galleries
    createGallery(photoGallery, uploads.photos);
    createGallery(menuGallery, uploads.menus);
    createGallery(licenseGallery, uploads.businessLicenses);

    // ── Rating Stars (display)
    const rating = restaurant.rating || 0;
    const stars = document.querySelectorAll("#restaurantRating .star");
    stars.forEach((star, index) => {
      star.textContent = index < rating ? "star" : "star_outline";
      if (index < rating) star.classList.add("filled");
    });

    // ── Load Reviews
    await loadReviews(id);
  } catch (error) {
    console.error("Error loading restaurant:", error);
    restaurantNameEl.textContent = "Error loading restaurant.";
  }
}

// --------------- STARS (rate) --------------------

let userRating = 0;

function setupStars() {
  const stars = document.querySelectorAll("#restaurantRating .star");
  stars.forEach((star, index) => {
    star.addEventListener("mouseover", () => {
      stars.forEach((s, i) => {
        s.textContent = i <= index ? "star" : "star_outline";
      });
    });
    star.addEventListener("mouseout", () => {
      stars.forEach((s, i) => {
        s.textContent = i < userRating ? "star" : "star_outline";
      });
    });
    star.addEventListener("click", async () => {
      userRating = index + 1;
      const id = getDocIdFromUrl();
      if (id) await submitQuickRating(id, userRating);
    });
  });
}

async function submitQuickRating(restaurantId, rating) {
  try {
    const reviewsRef = collection(db, "Restaurant", restaurantId, "reviews");
    await addDoc(reviewsRef, {
      rating,
      reviewText: "",
      authorName: "Anonymous",
      timestamp: serverTimestamp(),
    });
    const snapshot = await getDocs(reviewsRef);
    const ratings = snapshot.docs.map((d) => d.data().rating).filter(Boolean);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    await updateDoc(doc(db, "Restaurant", restaurantId), {
      rating: Math.round(avg),
    });
    await loadReviews(restaurantId);
  } catch (err) {
    console.error("Error submitting quick rating:", err);
  }
}

// -------------------- WRITE REVIEW FORM ---------------------------

let formRating = 0;

function setupWriteReviewButton() {
  const reviewForm = document.getElementById("reviewForm");
  const cancelBtn = document.getElementById("cancelReviewBtn");
  const submitBtn = document.getElementById("submitReviewBtn");
  const feedback = document.getElementById("reviewFeedback");
  const formStars = document.querySelectorAll("#reviewFormStars .review-star");

  writeReviewBtn.addEventListener("click", () => {
    const isVisible = reviewForm.style.display === "block";
    reviewForm.style.display = isVisible ? "none" : "block";
    if (!isVisible)
      reviewForm.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  cancelBtn.addEventListener("click", () => {
    reviewForm.style.display = "none";
    resetForm();
  });

  formStars.forEach((star, index) => {
    star.addEventListener("click", () => {
      formRating = index + 1;
      formStars.forEach((s, i) => {
        s.textContent = i <= index ? "star" : "star_outline";
        s.style.color = i <= index ? "#f5a623" : "#ddd";
      });
    });
  });

  submitBtn.addEventListener("click", async () => {
    const id = getDocIdFromUrl();
    if (!id) return;

    const reviewText = document.getElementById("reviewText").value.trim();
    const authorName =
      document.getElementById("reviewAuthor").value.trim() || "Anonymous";

    if (!formRating) {
      alert("Please select a star rating.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const reviewsRef = collection(db, "Restaurant", id, "reviews");
      await addDoc(reviewsRef, {
        rating: formRating,
        reviewText,
        authorName,
        timestamp: serverTimestamp(),
      });

      const snapshot = await getDocs(reviewsRef);
      const ratings = snapshot.docs.map((d) => d.data().rating).filter(Boolean);
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      await updateDoc(doc(db, "Restaurant", id), { rating: Math.round(avg) });

      await loadReviews(id);

      feedback.style.display = "block";
      setTimeout(() => {
        reviewForm.style.display = "none";
        resetForm();
      }, 1500);
    } catch (err) {
      console.error("Full error:", err);
      alert("Failed to submit review. Please try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });
}

function resetForm() {
  formRating = 0;
  document.getElementById("reviewText").value = "";
  document.getElementById("reviewAuthor").value = "";
  document.getElementById("reviewFeedback").style.display = "none";
  document.querySelectorAll("#reviewFormStars .review-star").forEach((s) => {
    s.textContent = "star_outline";
    s.style.color = "#ddd";
  });
}

// -------------------- INIT ------------------------------

document.addEventListener("DOMContentLoaded", () => {
  loadRestaurant();
  setupStars();
  setupWriteReviewButton();

  const modal = document.getElementById("imageModal");
  const closeBtn = document.getElementById("closeModal");

  // CLOSE BUTTON
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    modal.style.display = "none";
  });

  // CLICK OUTSIDE IMAGE
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
  const modalImg = document.getElementById("modalImage");

  modalImg.addEventListener("click", (e) => {
    e.stopPropagation(); // prevents closing modal
    modalImg.classList.toggle("zoomed");
  });

  modalImg.addEventListener("dblclick", (e) => {
    e.stopPropagation();

    if (!document.fullscreenElement) {
      modalImg.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
});

document.getElementById("backButton").addEventListener("click", () => {
  // Go back to the previous page
  if (document.referrer) {
    window.history.back();
  } else {
    // fallback to landing page
    window.location.href = "./landing.html";
  }
});
