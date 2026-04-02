
import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from "firebase/firestore";
import { EmailAuthProvider, updateEmail, updatePassword, reauthenticateWithCredential, } from "firebase/auth";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Listen for Auth State to load data
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadUserInfo(user.uid);
        } else {
            console.log("No user logged in.");
            // Optional: window.location.href = "login.html";
        }
    });

    // 2. Handle Form Submission
    const form = document.getElementById("update-profile-form");
    if (form) {
        form.addEventListener("submit", saveUserInfo);
    }
});

async function loadUserInfo(uid) {
    try {
        // Direct fetch using the UID is much faster than a collection query
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            fillForm(userData);
        } else {
            console.log("No Firestore document found for this UID.");
        }
    } catch (error) {
        console.error("Error loading user info:", error);
    }
}

function fillForm(data) {
    const nameInput = document.getElementById("new-username");
    const emailInput = document.getElementById("new-email");

    // Use the keys from your Firestore document (e.g., data.username)
    if (nameInput) nameInput.value = data.name || ""; 
    if (emailInput) emailInput.value = data.email || "";
}

async function saveUserInfo(e) {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) return;

    const newName = document.getElementById("new-username").value;
    const newEmail = document.getElementById("new-email").value;
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value
    
    try {
        if (newEmail !== user.email) {
            await updateEmail(user, newEmail);
        }

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            name: newName,
            email: newEmail
        });
        if (newPassword) {
            try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            await updatePassword(user, newPassword);
            } catch (error) {
                console.error("incorrect credentials:", error);
            }
        }
        alert("Profile updated successfully!");
        window.location.href = "./restaurant_list/landing.html";
    } catch (error) {
        console.error("Error updating profile:", error);
    }
}

