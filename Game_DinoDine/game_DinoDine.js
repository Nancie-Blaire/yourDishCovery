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
let paused = false; // Add paused state

// Ensure waitingToStart is accessible globally
window.waitingToStart = waitingToStart;

const bgImage = new Image();
bgImage.src = "images/gamebg.jpg";
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
  const fontSize = 22 * scaleRatio; // Font size for the main text
  ctx.font = `bold ${fontSize}px Verdana`;
  ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
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

let modalOpen = false; // Track if modal is open

// --- Add loading overlay to body ---
function ensureLoadingOverlay() {
  if (document.getElementById("food-loading-overlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "food-loading-overlay";
  overlay.style.display = "none";
  overlay.style.position = "fixed";
  overlay.style.zIndex = "3000";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(59,36,11,0.65)";
  overlay.style.backdropFilter = "blur(2px)";
  overlay.style.pointerEvents = "auto";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.innerHTML = `
    <div style="background:linear-gradient(135deg,#ecd8a7 60%,#fff8e1 100%);border-radius:18px;box-shadow:0 4px 32px rgba(59,36,11,0.18),0 1.5px 8px #c78456;padding:2.2em 2.5em;display:flex;flex-direction:column;align-items:center;font-family:'Poppins',Arial,sans-serif;color:#3b240b;font-size:1.25rem;font-weight:600;letter-spacing:0.01em;text-align:center;max-width:90vw;min-width:180px;min-height:60px;">
      <div style="border:4px solid #ecd8a7;border-top:4px solid #c78456;border-radius:50%;width:38px;height:38px;margin-bottom:18px;animation:spin 1s linear infinite;box-shadow:0 0 0 2px #fff8e1;"></div>
      Loading food...
    </div>
    <style>
      @keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}
      @media (max-width:600px){
        #food-loading-overlay div{padding:1.2em 0.7em;font-size:1rem;min-width:120px;}
        #food-loading-overlay div>div{width:28px;height:28px;margin-bottom:12px;}
      }
    </style>
  `;
  document.body.appendChild(overlay);
}
ensureLoadingOverlay();

function showLoadingOverlay() {
  const overlay = document.getElementById("food-loading-overlay");
  if (overlay) overlay.style.display = "flex";
}
function hideLoadingOverlay() {
  const overlay = document.getElementById("food-loading-overlay");
  if (overlay) overlay.style.display = "none";
}

function showFoodInfoModal(foodName, foodImage) {
  // Show loading overlay
  showLoadingOverlay();

  const modal = document.getElementById("food-info-modal");
  if (!modal) return;
  modalOpen = true;

  // Simulate async loading for consistency (in case foodImage is already loaded)
  setTimeout(() => {
    document.getElementById("modal-food-image").style.backgroundImage = `url(${foodImage.src})`;
    document.getElementById("modal-food-name").textContent = foodName;
    hideLoadingOverlay();
    modal.style.display = "flex";
    document.getElementById("yes-button").onclick = () => {
      modalOpen = false;
      modal.style.display = "none";
      window.location.href = `../Food_info/food_info.html?food=${encodeURIComponent(foodName)}`;
    };
    document.getElementById("no-button").onclick = () => {
      modalOpen = false;
      modal.style.display = "none";
      // Now allow reset after modal is closed
      setupGameReset();
    };
  }, 400); // Short delay for effect; remove if you want instant
}

function reset(event) {
  if (modalOpen) return;

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
  const fontSize = 22 * scaleRatio; // Font size for the main text
  ctx.font = `bold ${fontSize}px Verdana`;
  ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 1;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
}

function gameLoop(currentTime) {
  if (paused) {
    // Don't update or draw anything while paused, but keep previousTime in sync
    previousTime = currentTime;
    return;
  }
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
      score.setHighScore();

      // Update the <h2> element with the food name on collision
      const foodName = getFoodNameFromId(collidedFood.id);
      const h2Element = document.querySelector("h2");
      if (h2Element) {
        h2Element.classList.add("got-food");
        h2Element.textContent = `You got: ${foodName}`;
      }

      // Show modal popup for food info (only if not already open)
      const foodObj = foodController.foodImages.find(f => f.id === collidedFood.id);
      if (foodObj && !modalOpen) {
        showFoodInfoModal(foodName, foodObj.image);
      }
      // Do NOT call setupGameReset() here; only after modal closes
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

async function fetchFoods(category, minBudget, maxBudget, excludeFilters) {
  const foods = [];
  const snapshot = await get(ref(db, `recipes/${category}`));

  if (snapshot.exists()) {
    const recipes = snapshot.val();
    let idCounter = 1;
    for (const key in recipes) {
      const recipe = recipes[key];
      // Use 'budget' property (not 'price')
      const budget = Number(recipe.budget);
      // Parse filters as array
      const recipeFilters = recipe.filters
        ? recipe.filters.split(",").map(f => f.trim().toLowerCase())
        : [];
      // Check budget
      const inBudget = !isNaN(budget) && budget >= minBudget && budget <= maxBudget;
      // Check if any excluded filter is present
      const hasExcludedFilter = excludeFilters.some(f =>
        recipeFilters.includes(f.toLowerCase())
      );
      if (
        recipe.name &&
        recipe.image &&
        inBudget &&
        !hasExcludedFilter
      ) {
        const placeholderId = `id${idCounter++}`;
        foodMapping[placeholderId] = {
          name: recipe.name,
          image: recipe.image,
        };
        foods.push({
          id: placeholderId,
          name: recipe.name,
          image: recipe.image,
          width: 110 / 1.5,
          height: 100 / 1.5,
        });
      }
    }
  }
  return foods;
}

async function initializeGame() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category") || "random";
  // Parse budgetRange (e.g., "0-300")
  let minBudget = 0, maxBudget = Infinity;
  const budgetRange = urlParams.get("budgetRange");
  if (budgetRange && /^\d+-\d+$/.test(budgetRange)) {
    [minBudget, maxBudget] = budgetRange.split("-").map(Number);
  }
  // Parse filters (comma-separated)
  const filtersParam = urlParams.get("filters");
  const excludeFilters = filtersParam
    ? filtersParam.split(",").map(f => f.trim()).filter(f => f)
    : [];

  const fetchedFoods = await fetchFoods(category, minBudget, maxBudget, excludeFilters);

  if (fetchedFoods.length === 0) {
    alert("No foods available for this category and preferences.");
    return;
  }

  const foodImages = fetchedFoods.map((food) => {
    const image = new Image();
    image.src = food.image;
    return {
      id: food.id,
      image: image,
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

// --- Menu Pause/Resume Logic ---
function setupMenuPauseResume() {
  const menuBtn = document.getElementById("game-menu-btn");
  const menuModal = document.getElementById("game-menu-modal");
  const resumeBtn = document.getElementById("menu-resume-btn");

  if (!menuBtn || !menuModal || !resumeBtn) return;

  menuBtn.onclick = () => {
    paused = true;
    menuModal.style.display = "flex";
  };
  resumeBtn.onclick = () => {
    menuModal.style.display = "none";
    paused = false;
    previousTime = null; // Reset previousTime to avoid large frameTimeDelta
    requestAnimationFrame(gameLoop);
  };
  // Also pause if menu is opened by clicking outside
  menuModal.addEventListener("mousedown", function (e) {
    if (e.target === menuModal) {
      menuModal.style.display = "none";
      paused = false;
      previousTime = null; // Reset previousTime to avoid large frameTimeDelta
      requestAnimationFrame(gameLoop);
    }
  });
}

// Wait for DOMContentLoaded to ensure menu elements exist
document.addEventListener("DOMContentLoaded", () => {
  setupMenuPauseResume();
});
