import Player from "./Player.js";
import Ground from "./Ground.js";
import FoodController from "./FoodController.js";
import Score from "./Score.js";

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

const FOODS_CONFIG = [
  { width: 110 / 1.5, height: 100 / 1.5, image: "images/adobo.jpg" },
  { width: 110 / 1.5, height: 100 / 1.5, image: "images/fried_chicken.jpg" },
  { width: 110 / 1.5, height: 100 / 1.5, image: "images/sinigang.jpg" },
  { width: 110 / 1.5, height: 100 / 1.5, image: "images/mcdo.png" },
  { width: 110 / 1.5, height: 100 / 1.5, image: "images/kfc.png" },
];

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

  const foodImages = FOODS_CONFIG.map((food) => {
    const image = new Image();
    image.src = food.image;
    return {
      image: image,
      width: food.width * scaleRatio,
      height: food.height * scaleRatio,
    };
  });

  foodController = new FoodController(
    ctx,
    foodImages,
    scaleRatio,
    GROUND_AND_FOOD_SPEED
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
      const foodName = getFoodNameFromImage(closestFood.image.src);
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
      const foodName = getFoodNameFromImage(collidedFood.image.src);
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

function getFoodNameFromImage(imageSrc) {
  // Extract the file name from the full image source path
  const fileName = imageSrc.split("/").pop();

  const foodMap = {
    "adobo.jpg": "Adobo",
    "fried_chicken.jpg": "Fried Chicken",
    "sinigang.jpg": "Sinigang",
    "mcdo.png": "McDo",
    "kfc.png": "KFC",
  };

  return foodMap[fileName] || "Unknown Food";
}

requestAnimationFrame(gameLoop);

window.addEventListener("keyup", reset, { once: true });
window.addEventListener("touchstart", reset, { once: true });
