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

const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spin-btn");
const finalValue = document.getElementById("final-value");

let rotationValues = []; // Stores segment ranges
let myChart; // Chart.js instance

// Function to fetch foods from the database
async function fetchFoods(category) {
  const foods = [];
  const snapshot = await get(ref(db, `recipes/${category}`));

  if (snapshot.exists()) {
    const recipes = snapshot.val();
    for (const key in recipes) {
      if (recipes[key].name) {
        foods.push(recipes[key].name); // Collect all food names
      } else {
        console.warn(`Skipped recipe without name in category ${category}:`, recipes[key]); // Debugging
      }
    }
  } else {
    console.warn(`No recipes found in category: ${category}`); // Debugging
  }

  // Remove duplicates (if any)
  const uniqueFoods = [...new Set(foods)];
  console.log("Fetched Foods (Unique):", uniqueFoods); // Debugging
  return uniqueFoods;
}

// Function to fetch foods and their images from the database
async function fetchFoodsWithImages(category) {
  const foods = [];
  const snapshot = await get(ref(db, `recipes/${category}`));

  if (snapshot.exists()) {
    const recipes = snapshot.val();
    for (const key in recipes) {
      if (recipes[key].name && recipes[key].image) {
        foods.push({ name: recipes[key].name, image: recipes[key].image }); // Collect food names and Base64 images
      } else {
        console.warn(`Skipped recipe without name or image in category ${category}:`, recipes[key]); // Debugging
      }
    }
  } else {
    console.warn(`No recipes found in category: ${category}`); // Debugging
  }

  console.log("Fetched Foods with Images:", foods); // Debugging
  return foods;
}

// Function to fetch foods and their images from the database, filtered by budget
async function fetchFoodsWithImagesAndBudget(category, budget) {
  const foods = [];
  const snapshot = await get(ref(db, `recipes/${category}`));

  if (snapshot.exists()) {
    const recipes = snapshot.val();
    for (const key in recipes) {
      const recipe = recipes[key];
      if (recipe.name && recipe.image && recipe.budget <= budget) {
        foods.push({ name: recipe.name, image: recipe.image }); // Collect food names and Base64 images
      } else if (recipe.budget > budget) {
        console.log(`Skipped recipe "${recipe.name}" due to budget limit: ${recipe.budget} > ${budget}`);
      }
    }
  } else {
    console.warn(`No recipes found in category: ${category}`);
  }

  console.log("Fetched Foods with Images and Budget Filter:", foods);
  return foods;
}

// Function to fetch foods and their images from the database, filtered by budget range
async function fetchFoodsWithImagesAndBudgetRange(category, minBudget, maxBudget) {
  const foods = [];
  const snapshot = await get(ref(db, `recipes/${category}`));

  if (snapshot.exists()) {
    const recipes = snapshot.val();
    for (const key in recipes) {
      const recipe = recipes[key];
      if (
        recipe.name &&
        recipe.image &&
        recipe.budget >= minBudget &&
        recipe.budget <= maxBudget
      ) {
        foods.push({ name: recipe.name, image: recipe.image }); // Collect food names and Base64 images
      } else if (recipe.budget < minBudget || recipe.budget > maxBudget) {
        console.log(
          `Skipped recipe "${recipe.name}" due to budget range: ${recipe.budget} not in range ${minBudget}-${maxBudget}`
        );
      }
    }
  } else {
    console.warn(`No recipes found in category: ${category}`);
  }

  console.log("Fetched Foods with Images and Budget Range Filter:", foods);
  return foods;
}

// Function to fetch foods and their images from the database, filtered by budget range and filters
async function fetchFoodsWithFilters(category, minBudget, maxBudget, excludedFilters) {
  const foods = [];
  const snapshot = await get(ref(db, `recipes/${category}`));

  if (snapshot.exists()) {
    const recipes = snapshot.val();
    for (const key in recipes) {
      const recipe = recipes[key];
      const recipeFilters = recipe.filters ? recipe.filters.split(",").map(a => a.trim().toLowerCase()) : [];

      // Check if the recipe meets the budget range and does not contain excluded filters
      const hasExcludedFilters = excludedFilters.some(filter => recipeFilters.includes(filter.toLowerCase()));
      if (
        recipe.name &&
        recipe.image &&
        recipe.budget >= minBudget &&
        recipe.budget <= maxBudget &&
        !hasExcludedFilters
      ) {
        foods.push({ name: recipe.name, image: recipe.image }); // Collect food names and Base64 images
      } else if (hasExcludedFilters) {
        console.log(
          `Skipped recipe "${recipe.name}" due to excluded filters: ${excludedFilters.join(", ")}`
        );
      } else if (recipe.budget < minBudget || recipe.budget > maxBudget) {
        console.log(
          `Skipped recipe "${recipe.name}" due to budget range: ${recipe.budget} not in range ${minBudget}-${maxBudget}`
        );
      }
    }
  } else {
    console.warn(`No recipes found in category: ${category}`);
  }

  console.log("Fetched Foods with Filters (Budget and Filters):", foods);
  return foods;
}

// Create modal dynamically
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
modal.style.zIndex = "1000";

modal.innerHTML = `
  <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; width: 90%; max-width: 400px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
    <h2 style="color: #d88a40; margin-bottom: 15px; font-size: 24px;">You got:</h2>
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

const yesButton = document.getElementById("yes-button");
const noButton = document.getElementById("no-button");

// Function to show the modal
function showFoodInfoModal(foodName) {
  console.log("Modal is about to pop up for food:", foodName);

  // Fetch food details from Firebase to get the image
  get(ref(db, `recipes`)).then((snapshot) => {
    if (snapshot.exists()) {
      const recipes = snapshot.val();
      let foodDetails = null;

      // Search for the food in all categories
      for (const category in recipes) {
        for (const key in recipes[category]) {
          const recipe = recipes[category][key];
          if (recipe.name.toLowerCase() === foodName.toLowerCase()) {
            foodDetails = recipe;
            break;
          }
        }
        if (foodDetails) break;
      }

      if (foodDetails) {
        // Update modal content with food details
        const modalFoodImage = document.getElementById("modal-food-image");
        const modalFoodName = document.getElementById("modal-food-name");

        modalFoodImage.style.backgroundImage = `url(${foodDetails.image})`;
        modalFoodName.textContent = foodDetails.name;

        modal.style.display = "flex";

        yesButton.onclick = () => {
          console.log(`Redirecting to food_info.html for food: ${foodName}`);
          window.location.href = `/food_info.html?food=${encodeURIComponent(foodName)}`;
        };

        noButton.onclick = () => {
          console.log("User chose not to see food info.");
          modal.style.display = "none";
        };
      } else {
        console.error("Food details not found in Firebase for:", foodName);
      }
    } else {
      console.error("No recipes found in Firebase.");
    }
  }).catch((error) => {
    console.error("Error fetching food details from Firebase:", error);
  });
}

// Function to determine selected value based on final angle
const valueGenerator = (angleValue) => {
  const normalizedAngle = (angleValue + 90) % 360;
  console.log("Final Angle:", angleValue, "Normalized Angle:", normalizedAngle);

  for (let i of rotationValues) {
    if (normalizedAngle >= i.minDegree && normalizedAngle <= i.maxDegree) {
      console.log("Match found:", i.value, "Range:", i.minDegree, "-", i.maxDegree);
      finalValue.innerHTML = `<p>Selected: ${i.value}</p>`;
      spinBtn.disabled = false;

      // Show modal to ask if the user wants to see food info
      showFoodInfoModal(i.value);
      return;
    }
  }

  console.error("No match found for angle:", normalizedAngle);
  finalValue.innerHTML = `<p>Error: No value selected.</p>`;
};

// Function to refresh the wheel dynamically
async function refreshWheel() {
  console.log("Refreshing wheel with updated data..."); // Debugging
  await initializeWheel(); // Re-initialize the wheel with the latest data
}

// Custom plugin to draw images as section backgrounds
const imageBackgroundPlugin = {
  id: "imageBackgroundPlugin",
  beforeDraw(chart) {
    const ctx = chart.ctx;
    const dataset = chart.data.datasets[0];
    const meta = chart.getDatasetMeta(0);

    if (!dataset || !dataset.backgroundImages) return;

    const centerX = chart.width / 2 || 0;
    const centerY = chart.height / 2 || 0;
    const radius = chart.outerRadius || Math.min(chart.width, chart.height) / 2;

    console.log(`Chart Dimensions: centerX=${centerX}, centerY=${centerY}, radius=${radius}`); // Debugging

    meta.data.forEach((arc, index) => {
      const image = dataset.backgroundImages[index];
      const fallbackColor = dataset.backgroundColor[index];
      console.log(`Rendering segment ${index}:`, { image, fallbackColor }); // Debugging

      if (!image) {
        console.warn(`No image available for segment ${index}, using fallback color.`); // Debugging
      }

      const startAngle = arc.startAngle || 0;
      const endAngle = arc.endAngle || 0;
      const segmentAngle = endAngle - startAngle;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.clip();

      if (image) {
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2);
        ctx.rotate(Math.PI / 2);

        const imgWidth = radius * 2;
        const imgHeight = radius * 2;
        ctx.drawImage(
          image,
          -radius,
          -radius,
          imgWidth,
          imgHeight
        );

        ctx.rotate(-Math.PI / 2);
        ctx.rotate(-(startAngle + segmentAngle / 2));
        ctx.translate(-centerX, -centerY);
      } else {
        ctx.fillStyle = fallbackColor || "#FFFFFF";
        ctx.fill();
      }

      ctx.restore();
    });
  },
};

// Function to initialize the wheel
async function initializeWheel() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category") || "random";
  const budgetRange = urlParams.get("budgetRange") || "0-Infinity";
  const filters = urlParams.get("filters") ? urlParams.get("filters").split(",") : [];

  const [minBudget, maxBudget] = budgetRange.split("-").map(Number);
  console.log(`Initializing wheel with category: ${category}, budget range: ${minBudget}-${maxBudget}, and excluded filters: ${filters.join(", ") || "None"}`);

  if (isNaN(minBudget) || isNaN(maxBudget)) {
    console.error("Invalid budget range provided. Defaulting to show all foods.");
    finalValue.innerHTML = `<p>Invalid budget range. Showing all foods.</p>`;
    spinBtn.disabled = true;
    return;
  }

  const foodData = await fetchFoodsWithFilters(category, minBudget, maxBudget, filters);

  if (foodData.length === 0) {
    finalValue.innerHTML = `<p>No foods available for this category, budget range, and filter filters.</p>`;
    spinBtn.disabled = true;
    return;
  }

  const foodNames = foodData.map((food) => food.name);
  const fallbackColors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33A8"];

  const foodImages = await Promise.all(
    foodData.map((food) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = food.image;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    })
  );

  const backgroundColors = foodImages.map((img, index) =>
    img ? "transparent" : fallbackColors[index % fallbackColors.length]
  );

  const data = Array(foodNames.length).fill(1);

  const segmentSize = 360 / foodNames.length;
  rotationValues = foodNames.map((name, index) => ({
    minDegree: segmentSize * index,
    maxDegree: segmentSize * (index + 1) - 0.001,
    value: name,
  }));

  rotationValues[rotationValues.length - 1].maxDegree = 360;

  console.log("Segments:", rotationValues);

  if (myChart) {
    myChart.destroy();
  }

  myChart = new Chart(wheel, {
    plugins: [ChartDataLabels, imageBackgroundPlugin],
    type: "pie",
    data: {
      labels: foodNames,
      datasets: [
        {
          backgroundColor: backgroundColors,
          backgroundImages: foodImages,
          data: data,
          borderColor: "#000",
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 0 },
      rotation: -90,
      plugins: {
        tooltip: false,
        legend: { display: false },
        datalabels: {
          color: "#000",
          formatter: (_, context) => context.chart.data.labels[context.dataIndex],
          font: (context) => {
            const label = context.chart.data.labels[context.dataIndex];
            return { size: label.length > 10 ? 14 : 20 };
          },
        },
      },
    },
  });

  spinBtn.removeEventListener("click", spinWheel);
  spinBtn.addEventListener("click", spinWheel);
}

// Function to handle spinning
function spinWheel() {
  console.log("Spin button clicked.");
  spinBtn.disabled = true;
  finalValue.innerHTML = `<p>Spinning...</p>`;

  let randomDegree = Math.floor(Math.random() * 360);
  let totalRotation = 5 * 360 + randomDegree;

  let currentRotation = 0;
  let startTime = null;
  let spinDuration = 5000;

  function animateSpin(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = (timestamp - startTime) / spinDuration;

    if (progress < 1) {
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      currentRotation = easedProgress * totalRotation;

      myChart.options.rotation = -(currentRotation % 360);
      myChart.update();

      requestAnimationFrame(animateSpin);
    } else {
      myChart.options.rotation = -(totalRotation % 360);
      myChart.update();

      const finalAngle = (360 - (myChart.options.rotation % 360)) % 360;
      console.log("Spin completed. Final angle:", finalAngle);

      valueGenerator(finalAngle);
    }
  }

  requestAnimationFrame(animateSpin);
}

// Initialize wheel on page load
initializeWheel();

document.getElementById("home").addEventListener("click", function () {
  window.location.href = "/index.html";
});