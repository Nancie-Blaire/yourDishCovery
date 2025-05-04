import Player from "./Player.js";
import Ground from "./Ground.js";
import FoodController from "./FoodController.js";
import Score from "./Score.js";
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

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GAME_SPEED_START = 0.8; // 1.0
const GAME_SPEED_INCREMENT = 0.00001;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;
const PLAYER_WIDTH = 88 / 1.5; //58
const PLAYER_HEIGHT = 94 / 1.5; //62
const MAX_JUMP_HEIGHT = GAME_HEIGHT;
const MIN_JUMP_HEIGHT = 150;
const GROUND_WIDTH = 2400;
const GROUND_HEIGHT = 24;
const GROUND_AND_FOOD_SPEED = 0.5;

//Game Objects
let player = null;
let ground = null;
let foodController = null;
let score = null;

let scaleRatio = null;
let previousTime = null;
let gameSpeed = GAME_SPEED_START;
let gameOver = false;
let hasAddedEventListenersForRestart = false;
let waitingToStart = true; // Define and initialize globally

// Ensure waitingToStart is accessible globally
window.waitingToStart = waitingToStart;

// Global mapping of placeholder IDs to food details
const foodMapping = {};

function createSprites() {
  const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
  const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;
  const minJumpHeightInGame = MIN_JUMP_HEIGHT * scaleRatio;
  const maxJumpHeightInGame = MAX_JUMP_HEIGHT * scaleRatio;

  const groundWidthInGame = GROUND_WIDTH * scaleRatio;
  const groundHeightInGame = GROUND_HEIGHT * scaleRatio;

  player = new Player(
    ctx,
    playerWidthInGame,
    playerHeightInGame,
    minJumpHeightInGame,
    maxJumpHeightInGame,
    scaleRatio
  );

  ground = new Ground(
    ctx,
    groundWidthInGame,
    groundHeightInGame,
    GROUND_AND_FOOD_SPEED,
    scaleRatio
  );

  score = new Score(ctx, scaleRatio);
}

document.getElementById("home").addEventListener("click", function () {
  window.location.href = "/index.html"; // Updated to absolute path
});

function setScreen() {
  scaleRatio = getScaleRatio();
  canvas.width = GAME_WIDTH * scaleRatio;
  canvas.height = GAME_HEIGHT * scaleRatio;
  createSprites();
}

setScreen();
//Use setTimeout on Safari mobile rotation otherwise works fine on desktop
window.addEventListener("resize", () => setTimeout(setScreen, 500));

if (screen.orientation) {
  screen.orientation.addEventListener("change", setScreen);
}

function getScaleRatio() {
  const screenHeight = Math.min(
    window.innerHeight,
    document.documentElement.clientHeight
  );

  const screenWidth = Math.min(
    window.innerWidth,
    document.documentElement.clientWidth
  );

  //window is wider than the game width
  if (screenWidth / screenHeight < GAME_WIDTH / GAME_HEIGHT) {
    return screenWidth / GAME_WIDTH;
  } else {
    return screenHeight / GAME_HEIGHT;
  }
}

function showGameOver() {
  const fontSize = 24 * scaleRatio; // Font size for the main text
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = "grey";
  const mainText = "Bam!! Look's like Dino's got something to eat now.";
  const xMain = (canvas.width - ctx.measureText(mainText).width) / 2; // Center horizontally
  const yMain = canvas.height / 2;

  // Main game over text
  ctx.fillText(mainText, xMain, yMain);

  // Smaller font size for the "Press Space Bar" text
  const smallerFontSize = 14 * scaleRatio; // Adjust for smaller text
  ctx.font = `${smallerFontSize}px Verdana`;
  const subText = "(Press Space Bar to repick.)";
  const xSub = (canvas.width - ctx.measureText(subText).width) / 2; // Center horizontally
  const ySub = yMain + 40; // Adjust spacing with y + 40

  // Subtext
  ctx.fillText(subText, xSub, ySub);
}

function setupGameReset() {
  if (!hasAddedEventListenersForRestart) {
    hasAddedEventListenersForRestart = true;

    setTimeout(() => {
      window.addEventListener("keydown", handleResetKey, { once: true });
      window.addEventListener("mousedown", reset, { once: true });
      window.addEventListener("touchstart", reset, { once: true });
    }, 1000);
  }
}

function handleResetKey(event) {
  if (event.code === "Space") {
    reset();
  }
}

function reset(event) {
  if (event && event.type === "keydown" && event.code !== "Space") {
    return; // Ignore non-Space key presses
  }

  if (!gameOver && !waitingToStart) {
    return; // Prevent reset if the game is already running
  }

  hasAddedEventListenersForRestart = false;
  gameOver = false;
  waitingToStart = false;
  ground.reset();
  foodController.reset();
  score.reset();
  gameSpeed = GAME_SPEED_START;

  // Clear the food name when the game resets
  const h2Element = document.querySelector("h2");
  if (h2Element) {
    h2Element.textContent = "";
  }
}

// Expose the reset function to the global scope
window.reset = reset;

// Ensure mouse click works on initial load
window.addEventListener("mousedown", reset, { once: true });
window.addEventListener("touchstart", reset, { once: true });

function showStartGameText() {
  const fontSize = 24 * scaleRatio; // Font size for the main text
  ctx.font = `${fontSize}px Verdana`;
  ctx.fillStyle = "grey";
  const mainText = "Help Dino pick what to eat—one leap at a time!";
  const xMain = (canvas.width - ctx.measureText(mainText).width) / 2;
  const yMain = canvas.height / 2;

  // Main game over text
  ctx.fillText(mainText, xMain, yMain);
  const smallerFontSize = 14 * scaleRatio; // Adjust for smaller text
  ctx.font = `${smallerFontSize}px Verdana`;
  const subText = "(Press Space Bar to repick.)";
  const xSub = (canvas.width - ctx.measureText(subText).width) / 2;
  const ySub = yMain + 40; // Adjust spacing with y + 40

  // Subtext
  ctx.fillText(subText, xSub, ySub);
}

function updateGameSpeed(frameTimeDelta) {
  gameSpeed += frameTimeDelta * GAME_SPEED_INCREMENT;
}

function clearScreen() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop(currentTime) {
  if (previousTime === null) {
    previousTime = currentTime;
    requestAnimationFrame(gameLoop);
    return;
  }
  const frameTimeDelta = currentTime - previousTime;
  previousTime = currentTime;

  clearScreen();

  if (!gameOver && !waitingToStart) {
    // Update game objects
    ground.update(gameSpeed, frameTimeDelta);
    foodController.update(gameSpeed, frameTimeDelta);
    player.update(gameSpeed, frameTimeDelta);
    score.update(frameTimeDelta);
    updateGameSpeed(frameTimeDelta);

    // Get the closest food and update the <h2> element
    const closestFood = foodController.getClosestFood(player.x);
    const h2Element = document.querySelector("h2");
    if (closestFood && h2Element) {
      const foodName = getFoodNameFromId(closestFood.id); // Use the placeholder ID to get the name
      h2Element.classList.remove("got-food");
      h2Element.textContent = `${foodName}`;
    } else if (h2Element) {
      h2Element.textContent = ""; // Clear if no food is close
    }
  }

  if (!gameOver && !waitingToStart) {
    const collidedFood = foodController.collideWith(player);
    if (collidedFood) {
      gameOver = true;
      setupGameReset();
      score.setHighScore();

      // Update the <h2> element with the food name on collision
      const foodName = getFoodNameFromId(collidedFood.id); // Use the placeholder ID to get the name
      const h2Element = document.querySelector("h2");
      if (h2Element) {
        h2Element.classList.add("got-food");
        h2Element.textContent = `You got: ${foodName}`;
      }
    }
  }

  // Draw game objects
  ground.draw();
  foodController.draw();
  player.draw();
  score.draw();

  if (gameOver) {
    showGameOver();
  }

  if (waitingToStart) {
    showStartGameText();
  }

  requestAnimationFrame(gameLoop);
}

function getFoodNameFromId(foodId) {
  console.log(`Looking for food with ID:`, foodId); // Log the ID

  // Retrieve the food name from the mapping
  const food = foodMapping[foodId];

  if (!food) {
    console.warn(`No match found for ID:`, foodId); // Log the missing ID
  }

  return food ? food.name : "Unknown Food";
}

async function fetchFoods(category) {
  const foods = [];
  const snapshot = await get(ref(db, `recipes/${category}`));

  if (snapshot.exists()) {
    const recipes = snapshot.val();
    console.log(`Fetched recipes for category "${category}":`, Object.keys(recipes)); // Log only keys for brevity

    let idCounter = 1; // Counter for generating placeholder IDs
    for (const key in recipes) {
      if (recipes[key].name && recipes[key].image) {
        const placeholderId = `id${idCounter++}`; // Generate placeholder ID (e.g., id1, id2)
        foodMapping[placeholderId] = {
          name: recipes[key].name,
          image: recipes[key].image,
        }; // Map placeholder ID to food details

        foods.push({
          id: placeholderId, // Use the placeholder ID
          name: recipes[key].name,
          image: recipes[key].image, // Base64 string
          width: 110 / 1.5, // Default width
          height: 100 / 1.5, // Default height
        });
      } else {
        console.warn(`Skipped recipe without name or image:`, key); // Log only the key
      }
    }
  } else {
    console.warn(`No recipes found in category: ${category}`);
  }

  console.log(`Fetched foods for category "${category}":`, foods.map(food => food.name)); // Log only names
  console.log(`Food mapping:`, foodMapping); // Log the mapping for debugging
  return foods;
}

async function initializeGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category") || "random"; // Default to "random" if no category is specified

  const fetchedFoods = await fetchFoods(category);

  if (fetchedFoods.length === 0) {
    alert("No foods available for this category.");
    return;
  }

  const foodImages = fetchedFoods.map((food) => {
    const image = new Image();
    image.src = food.image; // Set the Base64 string as the image source
    return {
      id: food.id, // Include the placeholder ID for matching
      image: image, // Image object
      name: food.name,
      width: food.width * scaleRatio,
      height: food.height * scaleRatio,
    };
  });

  foodController = new FoodController(ctx, foodImages, scaleRatio, GROUND_AND_FOOD_SPEED);
  requestAnimationFrame(gameLoop);
}

// Replace the static FOODS_CONFIG initialization with dynamic fetching
initializeGame();

window.addEventListener("keyup", reset, { once: true });
window.addEventListener("touchstart", reset, { once: true });
