// This Vite config file (vite.config.js) tells Rollup (production bundler) 
// to treat multiple HTML files as entry points so each becomes its own built page.

import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, "index.html"),
                landing: resolve(__dirname, "restaurant_list/landing.html"),
                editRestaurant: resolve(__dirname, "Edit-restaurant.html"),
                //footer: resolve(__dirname, "footer.html"),
                login: resolve(__dirname, "login.html"),
                map: resolve(__dirname, "map.html"),
                ownerProfile: resolve(__dirname, "owner-profile.html"),
                profileSetting: resolve(__dirname, "profile-settings.html"),
                restaurantTemp: resolve(__dirname, "restaurant-temp.html"),
                userProfile: resolve(__dirname, "user-profile.html"),
                eachRestaurant: resolve(__dirname, "restaurant_list/eachRestaurant.html"),
                addReview: resolve(__dirname, "add_restaurant/add-review.html"),
                addStep2: resolve(__dirname, "add_restaurant/add-step2.html"),
                addStep3: resolve(__dirname, "add_restaurant/add-step3.html"),
                addSuccess: resolve(__dirname, "add_restaurant/add-success.html"),
                add: resolve(__dirname, "add_restaurant/add.html"),



            }
        }
    }
});
