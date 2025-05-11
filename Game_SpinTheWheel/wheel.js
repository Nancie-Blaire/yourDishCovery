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

// Function to fetch foods and their images from the database, filtered by budget range and allergens
async function fetchFoodsWithFilters(category, minBudget, maxBudget, excludedAllergens) {
  const foods = [];
  const snapshot = await get(ref(db, `recipes/${category}`));

  if (snapshot.exists()) {
    const recipes = snapshot.val();
    for (const key in recipes) {
      const recipe = recipes[key];
      const recipeAllergens = recipe.allergens ? recipe.allergens.split(",").map(a => a.trim().toLowerCase()) : [];

      // Check if the recipe meets the budget range and does not contain excluded allergens
      const hasExcludedAllergens = excludedAllergens.some(allergen => recipeAllergens.includes(allergen.toLowerCase()));
      if (
        recipe.name &&
        recipe.image &&
        recipe.budget >= minBudget &&
        recipe.budget <= maxBudget &&
        !hasExcludedAllergens
      ) {
        foods.push({ name: recipe.name, image: recipe.image }); // Collect food names and Base64 images
      } else if (hasExcludedAllergens) {
        console.log(
          `Skipped recipe "${recipe.name}" due to excluded allergens: ${excludedAllergens.join(", ")}`
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

  console.log("Fetched Foods with Filters (Budget and Allergens):", foods);
  return foods;
}

// Function to determine selected value based on final angle
const valueGenerator = (angleValue) => {
  // Convert the chart rotation to the actual angle on the wheel
  // Add 90 degrees to adjust for the chart's initial -90 rotation
  // Then normalize to 0-360 range
  const normalizedAngle = (angleValue + 90) % 360;
  console.log("Final Angle:", angleValue, "Normalized Angle:", normalizedAngle);

  for (let i of rotationValues) {
    // Check if the angle falls within this segment
    if (normalizedAngle >= i.minDegree && normalizedAngle <= i.maxDegree) {
      console.log("Match found:", i.value, "Range:", i.minDegree, "-", i.maxDegree);
      finalValue.innerHTML = `<p>Selected: ${i.value}</p>`;
      spinBtn.disabled = false;
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

    // Ensure chart dimensions are valid
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
      ctx.moveTo(centerX, centerY); // Center of the wheel
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.clip();

      if (image) {
        // Rotate the canvas to align the image with the segment
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + segmentAngle / 2); // Rotate to the center of the segment

        // Adjust the image orientation to align properly
        ctx.rotate(Math.PI / 2); // Rotate 90 degrees to align the top of the image with the segment

        // Draw the image centered on the segment
        const imgWidth = radius * 2;
        const imgHeight = radius * 2;
        ctx.drawImage(
          image,
          -radius, // Top-left x-coordinate relative to the center
          -radius, // Top-left y-coordinate relative to the center
          imgWidth,
          imgHeight
        );

        // Restore the canvas state
        ctx.rotate(-Math.PI / 2); // Undo the additional rotation
        ctx.rotate(-(startAngle + segmentAngle / 2)); // Undo the segment rotation
        ctx.translate(-centerX, -centerY); // Undo translation
      } else {
        // Fill with fallback color if image is not available
        ctx.fillStyle = fallbackColor || "#FFFFFF"; // Default to white if no fallback color
        ctx.fill();
      }

      ctx.restore();
    });
  },
};

// Function to initialize the wheel
async function initializeWheel() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category") || "random"; // Default to "random" if no category is specified
  const budgetRange = urlParams.get("budgetRange") || "0-Infinity"; // Default to no budget limit if not specified
  const allergens = urlParams.get("allergens") ? urlParams.get("allergens").split(",") : []; // Parse allergens

  const [minBudget, maxBudget] = budgetRange.split("-").map(Number);
  console.log(`Initializing wheel with category: ${category}, budget range: ${minBudget}-${maxBudget}, and excluded allergens: ${allergens.join(", ") || "None"}`);

  if (isNaN(minBudget) || isNaN(maxBudget)) {
    console.error("Invalid budget range provided. Defaulting to show all foods.");
    finalValue.innerHTML = `<p>Invalid budget range. Showing all foods.</p>`;
    spinBtn.disabled = true;
    return;
  }

  const foodData = await fetchFoodsWithFilters(category, minBudget, maxBudget, allergens); // Fetch foods with filters

  if (foodData.length === 0) {
    finalValue.innerHTML = `<p>No foods available for this category, budget range, and allergen filters.</p>`;
    spinBtn.disabled = true;
    return;
  }

  const foodNames = foodData.map((food) => food.name);
  const fallbackColors = ["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33A8"]; // Example fallback colors

  const foodImages = await Promise.all(
    foodData.map((food) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = food.image; // Base64 image string
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // Fallback if the image fails to load
      });
    })
  );

  const backgroundColors = foodImages.map((img, index) =>
    img ? "transparent" : fallbackColors[index % fallbackColors.length]
  );

  const data = Array(foodNames.length).fill(1); // Equal distribution for all foods

  const segmentSize = 360 / foodNames.length; // Size of each segment
  rotationValues = foodNames.map((name, index) => ({
    minDegree: segmentSize * index,
    maxDegree: segmentSize * (index + 1) - 0.001, // Avoid overlap
    value: name,
  }));

  // Ensure the last segment covers exactly 360 degrees
  rotationValues[rotationValues.length - 1].maxDegree = 360;

  console.log("Segments:", rotationValues);

  // Destroy the previous chart instance if it exists
  if (myChart) {
    myChart.destroy();
  }

  // Initialize the Chart.js instance
  myChart = new Chart(wheel, {
    plugins: [ChartDataLabels, imageBackgroundPlugin],
    type: "pie",
    data: {
      labels: foodNames,
      datasets: [
        {
          backgroundColor: backgroundColors, // Use fallback color if image fails
          backgroundImages: foodImages, // Attach images to the dataset
          data: data,
          borderColor: "#000",
        },
      ],
    },
    options: {
      responsive: true,
      animation: { duration: 0 },
      rotation: -90, // Start with segments aligned to the top
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
  spinBtn.disabled = true;
  finalValue.innerHTML = `<p>Spinning...</p>`;

  // Generate a random final position - full rotations plus a random angle
  let randomDegree = Math.floor(Math.random() * 360);
  let totalRotation = 5 * 360 + randomDegree; // Multiple full spins plus random offset

  // Animation variables
  let currentRotation = 0;
  let startTime = null;
  let spinDuration = 5000; // 5 seconds spin

  // Create smooth easing animation
  function animateSpin(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = (timestamp - startTime) / spinDuration;

    if (progress < 1) {
      // Easing function for natural deceleration
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      currentRotation = easedProgress * totalRotation;

      // Update chart rotation
      myChart.options.rotation = -(currentRotation % 360);
      myChart.update();

      requestAnimationFrame(animateSpin);
    } else {
      // Finalize the spin
      myChart.options.rotation = -(totalRotation % 360);
      myChart.update();

      // Get the final position and determine the result
      const finalAngle = (360 - (myChart.options.rotation % 360)) % 360;
      valueGenerator(finalAngle);

      spinBtn.disabled = false;
    }
  }

  // Start the animation
  requestAnimationFrame(animateSpin);
}

// Initialize wheel on page load
initializeWheel();

document.getElementById("home").addEventListener("click", function () {
  window.location.href = "/index.html";
});