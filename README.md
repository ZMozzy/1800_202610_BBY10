# Elmo Hikes


## Overview
FastPass is a client-side JavaScript web application that helps user discorver restaurants with wait times in the downtown area. This app displays a list of restaurant, each details such as name, raitng, pricing, address, operating hours/days, holiday hours, images of the restaurant, image of the menu and reviews. 

This app displays a map that shows restaurant color coded pins which indicate how long the wait is. Users are able to click on the pins to show a short description of the restaurants. Users are able to search restuarnts up on the map.

This app displays 3 different user profile page. Users can have a guest profile page. Users can register/login to have their own profile page. After resgistering/login users are able to submit a restaurant form to have a restaurant owner profile page.

This app allows users to upload their own restaurant information to create their restaurant page in our home page. 

Developed for the COMP 1800 course, this project applies User-Centred Design practices and agile project management, and demonstrates integration with Firebase backend services for storing user favorites.

---


## Features

- Responsive design for desktop and mobile
- Browse a list of restaurants with images and details
- Map which shows the restaurant location, wait times and short description
- Create own restaurant page through our in app form. 
- Leave reviews/ratings for restaurants

---


## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend**: Firebase for hosting
- **Database**: Firestore

---


## Usage

To run the application locally:

1.  **Clone** the repository.
2.  **Install dependencies** by running `npm install` in the project root directory.
3.  **Start the development server** by running the command: `npm run dev`.
4.  Open your browser and visit the local address shown in your terminal (usually `http://localhost:5173` or similar).

Once the application is running:

1. Click get started to start browsing restaurants or register/login to your account
2. Click see more to view more about the restaurant
3. Click on the map icon in the footer to navigate to the map tab
4. Clcik on the profile icon to navigate to the profile page

---


## Project Structure

1800_202610_BBY10/
├── .firebase/
├── add_restaurant/
│   ├── add-review.html
│   ├── add-step2.html
│   ├── add-step3.html
│   ├── add-success.html
│   └── add.html
├── dist/
├── images/
├── node_modules/
├── public/
│   ├── images/
│   └── footer.html
├── restaurant_list/
│   ├── eachRestaurant.html
│   ├── eachRestaurant.js
│   ├── landing.html
│   └── landing.js
├── src/
│   ├── add-review-submit.js
│   ├── add-step2.js
│   ├── add-step3.js
│   ├── add.js
│   ├── authentication.js
│   ├── editRestaurant.js
│   ├── firebaseConfig.js
│   ├── footer.js
│   ├── goToProfile.js
│   ├── loginSignup.js
│   ├── main.js
│   ├── map.js
│   ├── ownerProfile.js
│   ├── profileAuth.js
│   ├── profileSettings.js
│   ├── search.js
│   └── WaitTime.js
├── styles/
│   ├── map.css
│   ├── profile.css
│   └── style.css
├── .env
├── .env.example
├── .firebaserc
├── .gitignore
├── Edit-restaurant.html
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── index.html
├── login.html
├── map.html
├── owner-profile.html
├── package-lock.json
├── package.json
├── profile-settings.html
├── README.md
├── restaurant-temp.html
├── skeleton.html
├── user-profile.html
└── vite.config.js

---


## Contributors
- **YilongXu** - BCIT CST Student. I love video games, collect cards.
- **Annie Fan** - BCIT CST Studnet.
- **Sarah Palmer** - BCIT CST Student.
- **Zach Mosdell** - BCIT CST Student.
---


## Acknowledgments

- Code snippest were adapted from resources such as [ChatGPT] (https://chatgpt.com/)

---


## Limitations and Future Work
### Limitations

- Limited map features.
- Limited image uploading in restaurant creation form.
- Accessibility features can be further improved.

### Future Work

- Map navigation
- User report
- Wait time validation
- Restaurant validation

---


## License

This project is licensed under the MIT License. See the LICENSE file for details.
