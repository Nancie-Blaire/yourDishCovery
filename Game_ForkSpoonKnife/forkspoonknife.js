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
let userScore = 0;
let systemScore = 0;
let round = 1;
let userCategory = null;
let userBudget = null;
let userFilters = [];
let allCategories = ["jollibee", "mcdo", "kfc", "home"]; // adjust as needed
let userHasOwnCategoryFood = true; // Track if user currently holds their category food

// UI elements for round and score
let roundDiv, scoreDiv;

// --- UI Setup ---
function setupUI() {
  // Remove old UI if exists
  if (document.getElementById("game-info-bar")) {
    document.getElementById("game-info-bar").remove();
  }
  // Remove old menu if exists (to avoid duplicates on restart)
  if (document.getElementById("game-menu-btn")) {
    document.getElementById("game-menu-btn").remove();
  }

  // Create info/menu bar (menu + round/score in one flex row)
  const infoBar = document.createElement("div");
  infoBar.id = "game-info-bar";
  infoBar.style.position = "fixed";
  infoBar.style.top = "0";
  infoBar.style.left = "0";
  infoBar.style.width = "100vw";
  infoBar.style.background = "#fffbe7";
  infoBar.style.color = "#614225";
  infoBar.style.fontWeight = "bold";
  infoBar.style.fontSize = "1.15rem";
  infoBar.style.display = "flex";
  infoBar.style.justifyContent = "flex-start";
  infoBar.style.alignItems = "center";
  infoBar.style.padding = "0";
  infoBar.style.zIndex = "1001";
  infoBar.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";

  // Menu button (top-left, flush to corner)
  const menuBtn = document.createElement("button");
  menuBtn.id = "game-menu-btn";
  menuBtn.innerHTML = "☰";
  menuBtn.style.background = "#fffbe7";
  menuBtn.style.border = "2px solid #c78456";
  menuBtn.style.borderRadius = "0 0 12px 0";
  menuBtn.style.fontSize = "1.7em";
  menuBtn.style.width = "48px";
  menuBtn.style.height = "48px";
  menuBtn.style.cursor = "pointer";
  menuBtn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
  menuBtn.style.display = "flex";
  menuBtn.style.alignItems = "center";
  menuBtn.style.justifyContent = "center";
  menuBtn.style.fontWeight = "bold";
  menuBtn.style.transition = "background 0.2s";
  menuBtn.title = "Menu";
  menuBtn.style.margin = "0";
  menuBtn.style.padding = "0";
  menuBtn.style.position = "static";

  // Info (round/score) container
  const infoFlex = document.createElement("div");
  infoFlex.style.display = "flex";
  infoFlex.style.alignItems = "center";
  infoFlex.style.justifyContent = "flex-end";
  infoFlex.style.flex = "1";
  infoFlex.style.height = "48px";
  infoFlex.style.marginLeft = "auto";
  infoFlex.style.gap = "32px";
  infoFlex.style.paddingRight = "32px";

  const roundSpan = document.createElement("span");
  roundSpan.id = "round-info";
  roundSpan.textContent = "Round: 1";
  roundSpan.style.marginRight = "24px";
  roundSpan.style.fontWeight = "bold";

  const scoreSpan = document.createElement("span");
  scoreSpan.id = "score-info";
  scoreSpan.textContent = "You: 0 | System: 0";
  scoreSpan.style.fontWeight = "bold";

  infoFlex.appendChild(roundSpan);
  infoFlex.appendChild(scoreSpan);

  infoBar.appendChild(menuBtn);
  infoBar.appendChild(infoFlex);

  document.body.appendChild(infoBar);
  roundDiv = document.getElementById("round-info");
  scoreDiv = document.getElementById("score-info");
  console.log("[Game] UI setup complete");

  // Always create or update the menu modal and button handler
  createGameMenu(window._currentCategory);
}

// --- Update round and score display ---
function updateUI() {
  if (roundDiv) {
    roundDiv.textContent = `Round: ${round}`;
  }
  if (scoreDiv) {
    scoreDiv.textContent = `You: ${userScore} | System: ${systemScore}`;
  }
}

// --- Fetch food with filters, budget, and category ---
async function fetchRandomFood(category, minBudget, maxBudget, filters) {
  const foods = [];
  const snapshot = await get(ref(db, `recipes/${category}`));
  if (snapshot.exists()) {
    const recipes = snapshot.val();
    for (const key in recipes) {
      const recipe = recipes[key];
      const recipeFilters = recipe.filters ? recipe.filters.split(",").map(a => a.trim().toLowerCase()) : [];
      const hasExcludedFilters = filters.some(filter => recipeFilters.includes(filter.toLowerCase()));
      if (
        recipe.name &&
        recipe.image &&
        recipe.budget >= minBudget &&
        recipe.budget <= maxBudget &&
        !hasExcludedFilters
      ) {
        foods.push({ name: recipe.name, image: recipe.image });
      }
    }
  }
  if (foods.length === 0) {
    console.log(`[Game] No food found for category=${category}, budget=${minBudget}-${maxBudget}, filters=${filters}`);
    return null;
  }
  const chosen = foods[Math.floor(Math.random() * foods.length)];
  console.log(`[Game] Fetched food for category=${category}:`, chosen);
  return chosen;
}

// --- Main game logic ---
function startGame(category, budgetRange, filters) {
  userCategory = category;
  userBudget = budgetRange;
  userFilters = filters;
  userScore = 0;
  systemScore = 0;
  round = 1;
  userHasOwnCategoryFood = true; // Start with user's own category food
  console.log(`[Game] Starting game with category=${category}, budgetRange=${budgetRange}, filters=${filters}`);
  setupUI();
  nextRound();
}

async function nextRound(
  keepUserFood = null,
  userJustWon = null,
  userJustLost = null,
  keepSystemFood = null,
  systemNeedsNewFood = true
) {
  updateUI();
  const [minBudget, maxBudget] = userBudget.split("-").map(Number);

  let userFood;

  // Determine what food the user should have this round
  if (round === 1) {
    userFood = await fetchRandomFood(userCategory, minBudget, maxBudget, userFilters);
    userHasOwnCategoryFood = true;
    console.log(`[Game] Round 1: User gets food from own category`);
  } else if (userJustWon === true) {
    userFood = keepUserFood;
    userHasOwnCategoryFood = true;
    console.log(`[Game] User won last round, keeps their food (${userFood?.name})`);
  } else if (userJustLost === true) {
    userFood = keepUserFood;
    userHasOwnCategoryFood = false;
    console.log(`[Game] User lost last round, now has system's food (${userFood?.name})`);
  } else if (userHasOwnCategoryFood === false && userJustWon === false) {
    userFood = await fetchRandomFood(userCategory, minBudget, maxBudget, userFilters);
    userHasOwnCategoryFood = true;
    console.log(`[Game] User had system's food and won, gets new food from own category`);
  } else {
    userFood = keepUserFood;
    console.log(`[Game] Default: User keeps current food (${userFood?.name})`);
  }

  // --- SYSTEM FOOD LOGIC ---
  let systemFood;
  if (round === 1) {
    // Always fetch new system food on first round
    const systemCategories = allCategories.filter(cat => cat !== userCategory);
    let tries = 0;
    systemFood = null;
    while (!systemFood && tries < systemCategories.length) {
      const systemCategory = systemCategories[Math.floor(Math.random() * systemCategories.length)];
      systemFood = await fetchRandomFood(systemCategory, minBudget, maxBudget, userFilters);
      tries++;
    }
    if (systemFood) {
      console.log(`[Game] System gets food: ${systemFood.name}`);
    } else {
      console.log(`[Game] System could not find a food`);
    }
  } else if (systemNeedsNewFood) {
    // Only fetch new system food if needed (not on draw)
    const systemCategories = allCategories.filter(cat => cat !== userCategory);
    let tries = 0;
    systemFood = null;
    while (!systemFood && tries < systemCategories.length) {
      const systemCategory = systemCategories[Math.floor(Math.random() * systemCategories.length)];
      systemFood = await fetchRandomFood(systemCategory, minBudget, maxBudget, userFilters);
      tries++;
    }
    if (systemFood) {
      console.log(`[Game] System gets food: ${systemFood.name}`);
    } else {
      console.log(`[Game] System could not find a food`);
    }
  } else {
    // Keep previous system food
    systemFood = keepSystemFood;
    console.log(`[Game] System keeps current food (${systemFood?.name})`);
  }

  updateFoodImages(userFood, systemFood);

  window._currentUserFood = userFood;
  window._currentSystemFood = systemFood;
}

// Update food images in UI
function updateFoodImages(userFood, systemFood) {
  const userFoodImg = document.querySelector(".user-food img");
  const systemFoodImg = document.querySelector(".system-food img");
  if (userFood && userFood.image) {
    userFoodImg.src = userFood.image.startsWith("data:") ? userFood.image : `data:image/png;base64,${userFood.image}`;
    userFoodImg.dataset.foodName = userFood.name;
    userFoodImg.style.display = "block";
    
  } else {
    userFoodImg.src = "";
    userFoodImg.dataset.foodName = "";
    userFoodImg.style.display = "none";
    userFoodImg.style.border = "2px solid #000";
  }
  if (systemFood && systemFood.image) {
    systemFoodImg.src = systemFood.image.startsWith("data:") ? systemFood.image : `data:image/png;base64,${systemFood.image}`;
    systemFoodImg.dataset.foodName = systemFood.name;
    systemFoodImg.style.display = "block";
  
  } else {
    systemFoodImg.src = "";
    systemFoodImg.dataset.foodName = "";
    systemFoodImg.style.display = "none";
    systemFoodImg.style.border = "2px solid #000";
  }
}

// --- Utensil click logic ---
function setupGame() {
  setupUI();
  console.log("[Game] Game setup complete, utensils ready for click");
  const buttons = document.querySelectorAll(".image-spoon img, .image-fork img, .image-knife img");
  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window._currentUserFood || !window._currentSystemFood) {
        alert("Food data is not loaded yet. Please wait.");
        return;
      }
      // Remove previous highlights
      document.querySelectorAll(".system-image-spoon img, .system-image-fork img, .system-image-knife img").forEach(img => {
        img.classList.remove("clicked", "system-highlight");
      });

      // User choice
      const userChoice = button.id.replace("btn-game-", "").toLowerCase();
      // System random choice
      const systemChoice = getRandomChoice();
      console.log(`[Game] User chose: ${userChoice}, System chose: ${systemChoice}`);

      // Highlight system's chosen utensil
      let sysSelector = "";
      if (systemChoice === "spoon") sysSelector = ".system-image-spoon img";
      if (systemChoice === "fork") sysSelector = ".system-image-fork img";
      if (systemChoice === "knife") sysSelector = ".system-image-knife img";
      const sysImg = document.querySelector(sysSelector);
      if (sysImg) sysImg.classList.add("clicked", "system-highlight");

      // Show "You chose: X, System chose: Y" text overlay
      showChoiceOverlay(userChoice, systemChoice);

      // Wait 1.2s, then show result popup and remove highlight/overlay
      setTimeout(() => {
        const result = determineWinner(userChoice, systemChoice);
        const userFoodName = window._currentUserFood.name;
        const systemFoodName = window._currentSystemFood.name;
        resolveRound(result, userChoice, systemChoice, userFoodName, systemFoodName);

        // Remove highlight and overlay after popup is closed
        setTimeout(() => {
          if (sysImg) sysImg.classList.remove("clicked", "system-highlight");
          removeChoiceOverlay();
        }, 100); // Remove highlight after popup appears
      }, 1200);
    });
  });
}

// --- Show choice overlay ---
// Place overlay on the left side, below the info bar
function showChoiceOverlay(userChoice, systemChoice) {
  removeChoiceOverlay();
  const overlay = document.createElement("div");
  overlay.id = "choice-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "60px";
  overlay.style.left = "24px";
  overlay.style.transform = "none";
  overlay.style.background = "#fffbe7";
  overlay.style.color = "#614225";
  overlay.style.fontWeight = "bold";
  overlay.style.fontSize = "1.08rem";
  overlay.style.padding = "10px 18px";
  overlay.style.borderRadius = "10px";
  overlay.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
  overlay.style.zIndex = "1500";
  overlay.textContent = `You chose: ${capitalize(userChoice)}, System chose: ${capitalize(systemChoice)}`;
  document.body.appendChild(overlay);
}
function removeChoiceOverlay() {
  const overlay = document.getElementById("choice-overlay");
  if (overlay) overlay.remove();
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Add highlight style for system's utensil ---
(function injectHighlightStyle() {
  const style = document.createElement("style");
  style.innerHTML = `
    .system-highlight, .system-image-spoon img.clicked, .system-image-fork img.clicked, .system-image-knife img.clicked {
      box-shadow: 0 0 0 4px #fdcf3b, 0 0 16px 6px #ffe082;
      background: #fffde7;
      transform: scale(1.40) !important;
      transition: box-shadow 0.2s, background 0.2s, transform 0.2s;
    }
  `;
  document.head.appendChild(style);
})();

// --- System utensil random choice ---
function getRandomChoice() {
  const choices = ["spoon", "fork", "knife"];
  return choices[Math.floor(Math.random() * choices.length)];
}

// --- Determine winner ---
function determineWinner(userChoice, systemChoice) {
  if (userChoice === systemChoice) return "draw";
  if (
    (userChoice === "spoon" && systemChoice === "knife") ||
    (userChoice === "fork" && systemChoice === "spoon") ||
    (userChoice === "knife" && systemChoice === "fork")
  ) {
    return "user";
  }
  return "system";
}

// --- Handle round result and progress ---
function resolveRound(result, userChoice, systemChoice, userFoodName, systemFoodName) {
  let message = "";
  let keepUserFood = null;
  let userJustWon = null;
  let userJustLost = null;
  let keepSystemFood = window._currentSystemFood;
  let systemNeedsNewFood = true;

  if (result === "user") {
    userScore++;
    if (userHasOwnCategoryFood) {
      message = `You win this round!<br>You keep "${userFoodName}".`;
      keepUserFood = window._currentUserFood;
      userJustWon = true;
      userJustLost = false;
    } else {
      message = `You win this round!<br>You get a new food from your category next round.`;
      keepUserFood = window._currentUserFood;
      userJustWon = false;
      userJustLost = false;
    }
    systemNeedsNewFood = true; // System gets new food if user wins
    console.log(`[Game] Result: User wins round ${round-1}. User food: ${userFoodName}`);
  } else if (result === "system") {
    systemScore++;
    message = `System wins this round!<br>You get "${systemFoodName}".`;
    keepUserFood = window._currentSystemFood;
    userJustWon = false;
    userJustLost = true;
    systemNeedsNewFood = true; // System gets new food if system wins
    console.log(`[Game] Result: System wins round ${round-1}. System food: ${systemFoodName}`);
  } else {
    message = `It's a draw!<br>No one gets a new food.`;
    keepUserFood = window._currentUserFood;
    userJustWon = null;
    userJustLost = null;
    systemNeedsNewFood = false; // System keeps current food on draw
    keepSystemFood = window._currentSystemFood;
    console.log(`[Game] Result: Draw in round ${round-1}.`);
  }
  round++;
  updateUI();

  showResultPopup(message, () => {
    if (userScore === 3 || systemScore === 3) {
      showFinalResult();
    } else {
      nextRound(keepUserFood, userJustWon, userJustLost, keepSystemFood, systemNeedsNewFood);
    }
  });
}

// --- Show popup for round result ---
function showResultPopup(message, onClose) {
  // Remove existing popup if any
  const oldPopup = document.getElementById("forkspoonknife-popup");
  if (oldPopup) oldPopup.remove();

  const popup = document.createElement("div");
  popup.id = "forkspoonknife-popup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.backgroundColor = "#fff";
  popup.style.padding = "28px 30px";
  popup.style.border = "2px solid #c29339";
  popup.style.borderRadius = "12px";
  popup.style.textAlign = "center";
  popup.style.zIndex = "2000";
  popup.style.fontSize = "1.15rem";
  popup.style.boxShadow = "0 4px 16px rgba(0,0,0,0.13)";
  popup.innerHTML = `
    <div style="margin-bottom:18px;">${message}</div>
    <button id="closePopup" style="padding:8px 24px; background:#fdcf3b; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Continue</button>
  `;
  document.body.appendChild(popup);
  console.log("[Game] Showing result popup:", message.replace(/<br>/g, " "));

  document.getElementById("closePopup").addEventListener("click", () => {
    popup.remove();
    if (onClose) onClose();
  });
}

// --- Modal for food info at end of game (similar to wheel game) ---
function createFoodInfoModal() {
  if (document.getElementById("food-info-modal")) return;
  const modal = document.createElement("div");
  modal.id = "food-info-modal";
  modal.style.display = "none";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "3000";
  modal.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; width: 90%; max-width: 400px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
      <h2 style="color: #d88a40; margin-bottom: 15px; font-size: 24px;">Winning Food</h2>
      <div id="modal-food-image" style="width: 200px; height: 200px; border-radius: 8px; margin: 0 auto 15px; background-size: cover; background-position: center; border: 3px solid #fdcf3b;"></div>
      <h3 id="modal-food-name" style="margin-bottom: 20px; font-size: 22px; color: #333;"></h3>
      <p style="margin-bottom: 20px; color: #666;">Would you like to see more information about this dish?</p>
      <div style="display: flex; justify-content: center; gap: 15px;">
        <button id="yes-button" style="padding: 12px 24px; background-color: #fdcf3b; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s;">YES, TELL ME MORE</button>
        <button id="no-button" style="padding: 12px 24px; background-color: #f1f1f1; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s;">NO THANKS</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

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

// --- Show food info modal ---
function showFoodInfoModal(foodObj) {
  // Show loading overlay
  showLoadingOverlay();

  const modal = document.getElementById("food-info-modal");
  if (!modal) return;
  document.getElementById("modal-food-image").style.backgroundImage = `url(${foodObj.image.startsWith("data:") ? foodObj.image : `data:image/png;base64,${foodObj.image}`})`;
  document.getElementById("modal-food-name").textContent = foodObj.name;

  // Hide loading overlay before showing modal
  setTimeout(() => {
    hideLoadingOverlay();
    modal.style.display = "flex";
  }, 400); // Short delay for effect; remove if you want instant

  document.getElementById("yes-button").onclick = () => {
    window.location.href = `../Food_info/food_info.html?food=${encodeURIComponent(foodObj.name)}`;
  };
  document.getElementById("no-button").onclick = () => {
    modal.style.display = "none";
    window.location.reload();
  };
}

// --- Show final result ---
function showFinalResult() {
  let message = "";
  let winningFoodObj = null;
  if (userScore === 3) {
    message = `<span style="color:#388e3c;font-weight:bold;">Congratulations! You won the game!</span>`;
    winningFoodObj = window._currentUserFood;
  } else {
    message = `<span style="color:#d32f2f;font-weight:bold;">System wins the game! Better luck next time!</span>`;
    winningFoodObj = window._currentSystemFood;
  }
  console.log("[Game] Final result:", message.replace(/<[^>]+>/g, ""));
  showResultPopup(message, () => {
    setTimeout(() => {
      // Only show modal if food was fetched and has a name
      if (winningFoodObj && winningFoodObj.name) {
        showFoodInfoModal(winningFoodObj);
      } else {
        window.location.reload();
      }
    }, 200);
  });
}

// --- Menu UI ---
function createGameMenu(category) {
  // Create modal if not exists
  let menuModal = document.getElementById("game-menu-modal");
  if (!menuModal) {
    menuModal = document.createElement("div");
    menuModal.id = "game-menu-modal";
    menuModal.style.position = "fixed";
    menuModal.style.top = "0";
    menuModal.style.left = "0";
    menuModal.style.width = "100vw";
    menuModal.style.height = "100vh";
    menuModal.style.background = "rgba(0,0,0,0.18)";
    menuModal.style.display = "none";
    menuModal.style.zIndex = "3000";
    menuModal.style.justifyContent = "flex-start";
    menuModal.style.alignItems = "flex-start";
    menuModal.innerHTML = `
      <div style="
        margin: 32px 0 0 32px;
        background: #fffbe7;
        border: 2px solid #c78456;
        border-radius: 14px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.13);
        padding: 30px 36px 24px 36px;
        min-width: 220px;
        max-width: 90vw;
        display: flex;
        flex-direction: column;
        gap: 18px;
        font-family: 'Roboto Slab', serif;
      ">
        <button id="menu-help-btn" style="padding: 10px 0; font-size: 1.1em; background: none; border: none; color: #c78456; font-weight: bold; text-align: left; cursor: pointer;">Help</button>
        <button id="menu-resume-btn" style="padding: 10px 0; font-size: 1.1em; background: none; border: none; color: #614225; font-weight: bold; text-align: left; cursor: pointer;">Resume</button>
        <button id="menu-restart-btn" style="padding: 10px 0; font-size: 1.1em; background: none; border: none; color: #614225; font-weight: bold; text-align: left; cursor: pointer;">Restart</button>
        <button id="menu-exit-btn" style="padding: 10px 0; font-size: 1.1em; background: none; border: none; color: #d32f2f; font-weight: bold; text-align: left; cursor: pointer;">Exit</button>
      </div>
    `;
    document.body.appendChild(menuModal);

    // Modal button handlers (only set once)
    menuModal.querySelector("#menu-resume-btn").onclick = () => {
      menuModal.style.display = "none";
    };
    menuModal.querySelector("#menu-restart-btn").onclick = () => {
      window.location.reload();
    };
    menuModal.querySelector("#menu-exit-btn").onclick = () => {
      let cat = category || window._currentCategory || "home";
      window.location.href = `/listofgames.html?category=${encodeURIComponent(cat)}`;
    };
    menuModal.querySelector("#menu-help-btn").onclick = () => {
      showHelpModal();
    };
    menuModal.addEventListener("mousedown", function (e) {
      if (e.target === menuModal) menuModal.style.display = "none";
    });
  }

  // Always attach menu button handler to open the modal
  const menuBtn = document.getElementById("game-menu-btn");
  if (menuBtn) {
    menuBtn.onclick = () => {
      menuModal.style.display = "flex";
    };
  }
}

// --- Help Modal ---
function createHelpModal() {
  if (document.getElementById("forkspoonknife-help-modal")) return;
  const modal = document.createElement("div");
  modal.id = "forkspoonknife-help-modal";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100vw";
  modal.style.height = "100vh";
  modal.style.background = "rgba(0,0,0,0.28)";
  modal.style.display = "none";
  modal.style.zIndex = "4000";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.innerHTML = `
    <div style="
      background: #fffbe7;
      color: #614225;
      border-radius: 14px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.13);
      padding: 32px 24px 24px 24px;
      max-width: 480px;
      width: 92vw;
      max-height: 80vh;
      overflow-y: auto;
      font-family: 'Poppins', Arial, sans-serif;
      font-size: 1.08rem;
      position: relative;
      ">
      <button id="close-help-modal" style="
        position: absolute;
        top: 12px;
        right: 18px;
        background: none;
        border: none;
        font-size: 1.5em;
        color: #c78456;
        cursor: pointer;
        font-weight: bold;
      " title="Close">&times;</button>
      <div style="white-space: pre-line; text-align:left;">
🍴 <b>Fork, Spoon, Knife – Mini-Game Overview</b>
Fork, Spoon, Knife is a mini-game inside our Dishcovery project. It's a two-player turn-based game between the user and the system, combining simple combat mechanics with food preferences.

🎮 <b>Game Mechanics</b>
Players: User vs System

<b>Starting Point:</b>
- The user is assigned a random food based on their selected category and preferences.
- The system gets a food from any random category, excluding the user’s chosen one.

<b>Utensils:</b> The core of the game is a rock-paper-scissors-like mechanic using:
- Spoon
- Fork
- Knife

🥊 <b>Utensil Rules</b>
Each player selects a utensil, and the outcome is based on these rules:
- Spoon vs Knife → 🥄 Spoon wins
- Spoon vs Fork → 🍴 Fork wins
- Knife vs Fork → 🔪 Knife wins
- Same utensil → 🤝 Draw

🔄 <b>Game Rounds</b>
- The game continues in rounds until either the user or the system wins 3 rounds.
- After each round, the foods on each plate may change depending on the outcome.

🍽️ <b>Food Change Logic Per Round</b>
<b>Draw:</b>
- No change in food for both players.

<b>User Wins:</b>
- If the user’s current food is from their preferred category, it stays the same.
- If not, the user’s food changes to a random food from their preferred category.
- The system's food always changes when the user wins.

<b>User Loses:</b>
- The user’s food changes to the system's current food.
- The system's food changes again, becoming a new random dish.

🏁 <b>Winning Condition</b>
- The first to win 3 rounds is the overall winner.
- Score is tracked and updated each round.
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close logic
  modal.querySelector("#close-help-modal").onclick = () => {
    modal.style.display = "none";
  };
  modal.addEventListener("mousedown", function (e) {
    if (e.target === modal) modal.style.display = "none";
  });
}

function showHelpModal() {
  const modal = document.getElementById("forkspoonknife-help-modal");
  if (modal) modal.style.display = "flex";
}

// --- Entry point: get user preferences from URL and start game ---
document.addEventListener("DOMContentLoaded", async () => {
  // Get user preferences from URL
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category") || "jollibee";
  const budgetRange = urlParams.get("budgetRange") || "0-9999";
  const filters = urlParams.get("filters") ? urlParams.get("filters").split(",") : [];

  // Store category globally for exit
  window._currentCategory = category;

  // Start game with preferences
  startGame(category, budgetRange, filters);
  setupGame();
  createGameMenu(category);

  // Ensure help modal is created so it can be shown from menu
  createHelpModal();
});