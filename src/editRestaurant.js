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

let restaurantDocId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadRestaurantIntoForm();

    const form = document.getElementById("editRestaurantForm");
    if (form) {
        form.addEventListener("submit", saveRestaurantChanges);
    }
});

function loadRestaurantIntoForm() {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }

        try {
            const q = query(
                collection(db, "Restaurant"),
                where("userId", "==", user.uid)
            );

            const snap = await getDocs(q);

            if (snap.empty) {
                console.log("No restaurant found for this user.");
                return;
            }

            const restaurantDoc = snap.docs[0];
            restaurantDocId = restaurantDoc.id;

            const restaurant = restaurantDoc.data();
            console.log("Loaded restaurant:", restaurant);

            fillForm(restaurant);

        } catch (error) {
            console.error("Error loading restaurant:", error);
        }
    });
}

//fills form with current fields from db
function fillForm(restaurant) {
    const basicInfo = restaurant.basicInfo || {};
    const ownerAccount = restaurant.ownerAccount || {};

    const restaurantName = document.getElementById("restaurantName");
    const restaurantDescription = document.getElementById("restaurantDescription");
    const restaurantPhone = document.getElementById("restaurantPhone");
    const restaurantEmail = document.getElementById("restaurantEmail");
    const restaurantAddress = document.getElementById("restaurantAddress");
    const restaurantWebsite = document.getElementById("restaurantWebsite");

    if (restaurantName) {
        restaurantName.value = basicInfo.restaurantName || "";
    }

    if (restaurantDescription) {
        restaurantDescription.value = basicInfo.description || "";
    }

    if (restaurantPhone) {
        restaurantPhone.value = ownerAccount.phone || "";
    }

    if (restaurantEmail) {
        restaurantEmail.value = ownerAccount.email || "";
    }

    if (restaurantAddress) {
        restaurantAddress.value = basicInfo.address || "";
    }

    if (restaurantWebsite) {
        restaurantWebsite.value = basicInfo.website || "";
    }
}

//gets values from changes
async function saveRestaurantChanges(e) {
    e.preventDefault();

    if (!restaurantDocId) {
        console.log("No restaurant document loaded.");
        return;
    }

    try {
        const restaurantName = document.getElementById("restaurantName")?.value.trim() || "";
        const restaurantDescription = document.getElementById("restaurantDescription")?.value.trim() || "";
        const restaurantPhone = document.getElementById("restaurantPhone")?.value.trim() || "";
        const restaurantEmail = document.getElementById("restaurantEmail")?.value.trim() || "";
        const restaurantAddress = document.getElementById("restaurantAddress")?.value.trim() || "";
        const restaurantWebsite = document.getElementById("restaurantWebsite")?.value.trim() || "";
        const menuFile = document.getElementById("restaurantMenu")?.files[0];

        const restaurantRef = doc(db, "Restaurant", restaurantDocId);

        // build update object
        const updates = {
            "basicInfo.restaurantName": restaurantName,
            "basicInfo.description": restaurantDescription,
            "basicInfo.address": restaurantAddress,
            "basicInfo.website": restaurantWebsite,
            "ownerAccount.phone": restaurantPhone,
            "ownerAccount.email": restaurantEmail,
            updatedAt: new Date()
        };

        // If a new menu image is selected, update the menus array metadata
        // This does NOT upload the file anywhere yet — it only stores file info in Firestore.
        if (menuFile) {
            updates.menus = [
                {
                    contentType: menuFile.type || "",
                    downloadURL: "",
                    fileName: menuFile.name || "",
                    size: menuFile.size || 0,
                    storagePath: "",
                    uploadSkipped: true
                }
            ];
        }

        //updates db with changes
        await updateDoc(restaurantRef, updates);

        alert("Restaurant updated successfully.");
        console.log("Restaurant updated.");

    } catch (error) {
        console.error("Error updating restaurant:", error);
        alert("Failed to update restaurant.");
    }
}