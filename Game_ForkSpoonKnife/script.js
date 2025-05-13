import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCA2KS4aKwM5P4_et3wifB4sRg23tvaK04",
  authDomain: "dish-4be2b.firebaseapp.com",
  projectId: "dish-4be2b",
  storageBucket: "dish-4be2b.appspot.com",
  messagingSenderId: "479066048512",
  appId: "1:479066048512:web:7489944044adddc4c570e5",
  measurementId: "G-8D2QSMQWT2",
  databaseURL: "https://dish-4be2b-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Global variables to store food data
let foodData = [];

// Function to fetch data from Firebase
async function fetchData() {
  try {
    const dataRef = ref(db, "recipes"); // Adjust the path to include both "resto" and "recipe" if needed
    const snapshot = await get(dataRef);

    if (snapshot.exists()) {
      const recipes = snapshot.val();
      foodData = [];

      // Flatten the data from both "resto" and "recipe"
      for (const category in recipes) {
        for (const key in recipes[category]) {
          const recipe = recipes[category][key];
          if (recipe.name && recipe.image) {
            foodData.push({ name: recipe.name, image: recipe.image });
          } else {
            console.warn(`Skipped recipe without name or image:`, recipe);
          }
        }
      }

      console.log("Fetched food data:", foodData); // Debugging log
      displayRandomFoods(); // Display random foods after fetching data
    } else {
      console.log("No data available.");
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Call fetchData on page load
document.addEventListener("DOMContentLoaded", () => {
  fetchData();
  setupGame();
});

// Function to display two random foods
function displayRandomFoods() {
  if (foodData.length === 0) return;

  const userFoodContainer = document.querySelector(".user-food img");
  const systemFoodContainer = document.querySelector(".system-food img");

  const userFood = getRandomFood();
  const systemFood = getRandomFood();

  // Check if the image field exists and is valid
  if (userFood.image && systemFood.image) {
    userFoodContainer.src = `data:image/png;base64,${userFood.image}`;
    systemFoodContainer.src = `data:image/png;base64,${systemFood.image}`;
  } else {
    console.error("Invalid image data for user or system food.");
    userFoodContainer.src = "https://via.placeholder.com/150"; // Fallback placeholder
    systemFoodContainer.src = "https://via.placeholder.com/150"; // Fallback placeholder
  }

  userFoodContainer.dataset.foodName = userFood.name; // Store food name for later use
  systemFoodContainer.dataset.foodName = systemFood.name;

  // Ensure the fetched food containers are visible
  userFoodContainer.style.display = "block";
  systemFoodContainer.style.display = "block";

  console.log("User food:", userFood);
  console.log("System food:", systemFood);
}

// Function to get a random food
function getRandomFood() {
  const randomIndex = Math.floor(Math.random() * foodData.length);
  return foodData[randomIndex];
}

// Function to set up the game
function setupGame() {
  const buttons = document.querySelectorAll(".image-spoon img, .image-fork img, .image-knife img");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      if (foodData.length === 0) {
        alert("Food data is not loaded yet. Please wait.");
        return;
      }

      const userFoodContainer = document.querySelector(".user-food img");
      const systemFoodContainer = document.querySelector(".system-food img");

      const userChoice = button.id.replace("btn-game-", "").toLowerCase(); // Extract user choice (spoon, fork, knife)
      const systemChoice = getRandomChoice(); // Random choice for the system
      const result = determineWinner(userChoice, systemChoice);

      const userFoodName = userFoodContainer.dataset.foodName;
      const systemFoodName = systemFoodContainer.dataset.foodName;

      // Show the result
      showResult(result, userFoodName, systemFoodName);
    });
  });
}

// Function to get a random choice for the system
function getRandomChoice() {
  const choices = ["spoon", "fork", "knife"];
  return choices[Math.floor(Math.random() * choices.length)];
}

// Function to determine the winner
function determineWinner(userChoice, systemChoice) {
  if (userChoice === systemChoice) return "draw";

  if (
    (userChoice === "spoon" && systemChoice === "knife") || // Spoon beats Knife
    (userChoice === "fork" && systemChoice === "spoon") || // Fork beats Spoon
    (userChoice === "knife" && systemChoice === "fork")    // Knife beats Fork
  ) {
    return "user";
  }

  return "system";
}

// Function to show the result
function showResult(result, userFoodName, systemFoodName) {
  let message = "";

  if (result === "user") {
    message = `Congrats, You got "${userFoodName}"!`;
  } else if (result === "system") {
    message = `You lose, System got "${systemFoodName}".`;
  } else {
    message = "It's a draw!";
  }

  // Create a popup to display the result
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.backgroundColor = "#fff";
  popup.style.padding = "20px";
  popup.style.border = "2px solid #000";
  popup.style.textAlign = "center";
  popup.style.zIndex = "1000";

  popup.innerHTML = `
    <p>${message}</p>
    <button id="closePopup">Close</button>
  `;

  document.body.appendChild(popup);

  // Close popup on button click
  document.getElementById("closePopup").addEventListener("click", () => {
    document.body.removeChild(popup);
  });
}