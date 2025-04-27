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
  if (category === "random") {
    const categories = ["jollibee", "mcdo", "kfc", "home", "random"];
    for (const cat of categories) {
      const snapshot = await get(ref(db, `recipes/${cat}`));
      if (snapshot.exists()) {
        const recipes = snapshot.val();
        for (const key in recipes) {
          if (recipes[key].name) {
            foods.push(recipes[key].name); // Collect all food names
          } else {
            console.warn(`Skipped recipe without name in category ${cat}:`, recipes[key]); // Debugging
          }
        }
      } else {
        console.warn(`No recipes found in category: ${cat}`); // Debugging
      }
    }
  } else {
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
  }
  console.log("Fetched Foods:", foods); // Debugging
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

// Function to initialize the wheel
async function initializeWheel() {
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category") || "random";

  const foodNames = await fetchFoods(category);

  if (foodNames.length === 0) {
    finalValue.innerHTML = `<p>No foods available for this category.</p>`;
    spinBtn.disabled = true;
    return;
  }

  const data = Array(foodNames.length).fill(1); // Equal distribution for all foods
  const pieColors = foodNames.map(
    () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
  );

  const segmentSize = 360 / foodNames.length; // Size of each segment
  rotationValues = foodNames.map((name, index) => ({
    minDegree: segmentSize * index,
    maxDegree: segmentSize * (index + 1) - 0.001, // Avoid overlap
    value: name,
  }));

  // Ensure the last segment covers exactly 360 degrees
  rotationValues[rotationValues.length - 1].maxDegree = 360;

  // Log segment info for debugging
  console.log("Segments:", rotationValues);

  // Destroy the previous chart instance if it exists
  if (myChart) {
    myChart.destroy();
  }

  // Initialize the Chart.js instance
  myChart = new Chart(wheel, {
    plugins: [ChartDataLabels],
    type: "pie",
    data: {
      labels: foodNames,
      datasets: [{ backgroundColor: pieColors, data: data, borderColor: "#000" }],
    },
    options: {
      responsive: true,
      animation: { duration: 0 },
      rotation: -90, // Start with segments aligned to the top
      plugins: {
        tooltip: false,
        legend: { display: false },
        datalabels: {
          color: "#fff",
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