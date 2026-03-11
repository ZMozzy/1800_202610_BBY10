import { db } from "./firebaseConfig.js";
import { doc, getDoc } from "firebase/firstore";

const user = doc(db, "users", user.uid);

