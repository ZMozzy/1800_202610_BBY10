import { getAuth } from "firebase/auth";
import { db } from "./firebaseConfig.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
console.log("waitime loaded")
const auth = getAuth();

document.getElementById("waitTime").addEventListener("click", async () => {
    const user = auth.currentUser;
    
    if (!user) {
        alert("You must be logged in!");
        return;
    }

    try {
        // Get the restaurantId from the User's document
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.error("User document not found!");
            return;
        }

        // Pull the actual ID string from the field
        const restaurantId = userSnap.data().restaurantId; 

        if (!restaurantId) {
            alert("No restaurant linked to this account.");
            return;
        }

        // Ask for the new wait time
        const newWait = prompt("Enter new wait time (minutes):", "5");
        if (newWait === null) return; // User cancelled

        // Update the Restaurant collection
        const restaurantRef = doc(db, "Restaurant", restaurantId);
        
        await updateDoc(restaurantRef, {
            "waitTime": newWait
        });

        // Update the UI
        document.getElementById("wait-time-value").innerText = newWait;
        alert("Wait time updated!");

    } catch (error) {
        console.error("Update failed:", error);
        alert("Error: " + error.message);
    }
});