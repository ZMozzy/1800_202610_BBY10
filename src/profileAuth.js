 import { auth, db } from "./firebaseConfig.js";
      import { onAuthStateChanged } from "firebase/auth";
      import { doc, getDoc } from "firebase/firestore";
 
 onAuthStateChanged(auth, async (user) => {

        if (user) {
        //gets name from firstore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        //makes button say create ad and goes to add.html
        document.getElementById("create-Ad").textContent = "Create an ad"
        document.getElementById("create-Ad").addEventListener("click", function() {
        window.location.href = "add_restaurant/add.html";})

        if (userSnap.exists()) {

            const username = userSnap.data().name;
            //display name changes to user name
            document.getElementById("user-name").textContent = username;
            
            //changes avatar to first letter of name
            const char = username.substring(0, 1).toUpperCase();
            document.getElementById("avatar").textContent = char;

        } 
        

    }else {
            //display name Guest
            document.getElementById("user-name").textContent = "Guest";

            //changes create ad to login
            document.getElementById("create-Ad").textContent = "Login"
        document.getElementById("create-Ad").addEventListener("click", function() {
        window.location.href = "login.html";})

}});
