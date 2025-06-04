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

// Get the food name from the URL
const urlParams = new URLSearchParams(window.location.search);
const foodName = urlParams.get("food");
console.log(`Fetching details for food: ${foodName}`);

// Add this near the top of your JS file
let preferredVoice = null;

function setPreferredVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;
  // Prefer Filipino/Tagalog voices
  const filipinoVoice = voices.find(
    v =>
      (v.lang && (v.lang.toLowerCase() === "fil-ph" || v.lang.toLowerCase() === "tl-ph" || v.lang.toLowerCase().startsWith("fil") || v.lang.toLowerCase().startsWith("tl"))) ||
      (v.name && /filipino|tagalog/i.test(v.name))
  );
  if (filipinoVoice) {
    preferredVoice = filipinoVoice;
    console.log("Preferred Filipino/Tagalog voice selected:", preferredVoice.name, preferredVoice.lang);
    return;
  }
  // Fallback: US English voices (Microsoft Francis, Google US, etc.)
  const fallbackVoice = voices.find(
    v =>
      v.name === "Microsoft Francis Online (Natural) - English (United States)" ||
      v.name === "Google US English" ||
      (v.lang && v.lang.toLowerCase() === "en-us")
  );
  if (fallbackVoice) {
    preferredVoice = fallbackVoice;
    console.log("Fallback English voice selected:", preferredVoice.name, preferredVoice.lang);
    return;
  }
  // If still not found, pick the default voice
  preferredVoice = voices.find(v => v.default) || voices[0] || null;
  if (preferredVoice) {
    console.log("Default voice selected:", preferredVoice.name, preferredVoice.lang);
  } else {
    console.warn("No suitable speech synthesis voice found.");
    // Optionally, log all voices for debugging
    voices.forEach((v, i) => {
      console.log(`[${i}] Name: "${v.name}", Lang: "${v.lang}", Default: ${v.default}`);
    });
  }
}

window.speechSynthesis.onvoiceschanged = setPreferredVoice;
setPreferredVoice();

// Then, in your speakInstructions and speakText functions:
function speakText(text) {
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  if (preferredVoice) utterance.voice = preferredVoice;
  speechIndicator.textContent = "Speaking...";
  speechSynthesis.speak(utterance);
  utterance.onend = () => {
    speechIndicator.textContent = "Enabled";
  };
}

// Fetch food details from Firebase
async function fetchFoodDetails(foodName) {
  const snapshot = await get(ref(db, `recipes`));
  if (snapshot.exists()) {
    const recipes = snapshot.val();
    for (const category in recipes) {
      for (const key in recipes[category]) {
        const recipe = recipes[category][key];
        if (recipe.name.toLowerCase() === foodName.toLowerCase()) {
          // Attach the found category to the recipe object
          recipe._category = category;
          return recipe;
        }
      }
    }
  }
  return null;
}

// --- YouTube API KEY ---
// (No key in frontend!)
// Fetch YouTube video title using backend API
async function fetchYouTubeTitle(videoId) {
  if (!videoId) return null;
  try {
    const apiUrl = `/api/youtube-title?videoId=${encodeURIComponent(videoId)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data && data.title) {
      return data.title;
    }
  } catch (e) {
    console.error("Failed to fetch YouTube title:", e);
  }
  return null;
}

// Get a nice label for non-YouTube links
function getLinkLabel(url) {
  try {
    const u = new URL(url);
    // Try to use the hostname, or fallback to "Visit Link"
    if (u.hostname.includes("mcdo") || u.hostname.includes("mcdonald")) {
      return "McDonald's Delivery";
    }
    if (u.hostname.includes("jollibee")) {
      return "Jollibee Delivery";
    }
    if (u.hostname.includes("kfc")) {
      return "KFC Delivery";
    }
    // Otherwise, show the hostname
    return u.hostname.replace("www.", "");
  } catch {
    return "Visit Link";
  }
}

let currentFoodDetails = null;
let defaultServings = 4; // Default servings per recipe

// Utility: Convert a fraction string to a float (e.g., "1/2" => 0.5, "2 1/2" => 2.5)
function parseFraction(str) {
  str = str.trim();
  // Match "2 1/2", "1/2", "2"
  const mixed = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  }
  const frac = str.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    return parseInt(frac[1]) / parseInt(frac[2]);
  }
  const num = str.match(/^\d+(\.\d+)?$/);
  if (num) {
    return parseFloat(str);
  }
  return null;
}

// Utility: Scale ingredient string (e.g., "2 cups rice" or "1/2 cup rice") by a factor
function scaleIngredient(ingredient, scale) {
  // Match leading quantity (supports "2 1/2", "1/2", "2")
  const match = ingredient.match(/^((\d+\s+\d+\/\d+)|(\d+\/\d+)|(\d+(\.\d+)?))(\s*)(.*)$/);
  if (match) {
    const qtyStr = match[1];
    const rest = match[7];
    const qty = parseFraction(qtyStr);
    if (qty !== null) {
      // Round to 2 decimal places, remove trailing .00
      let scaled = (qty * scale).toFixed(2).replace(/\.00$/, "");
      return `${scaled} ${rest}`;
    }
  }
  return ingredient; // No number to scale
}

// Add this helper to split text into sentences for queue-based speaking
function splitIntoSentences(text) {
  // Split by . ! ? but keep the punctuation
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(s => s.trim()).filter(Boolean) || [];
}

// Update UI for servings
function updateServingsUI(servings) {
  if (!currentFoodDetails) return;
  const scale = servings / defaultServings;
  // Update budget
  const budget = currentFoodDetails.budget || 0;
  document.getElementById("food-budget").textContent =
    `Estimated budget: ₱${Math.round(budget * scale)}`;
  // Update ingredients
  if (currentFoodDetails._category === "home") {
    const ingredientsList = document.getElementById("food-ingredients");
    ingredientsList.innerHTML = "";
    (currentFoodDetails.ingredients || []).forEach(ingredient => {
      const li = document.createElement("li");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.addEventListener("change", () => {
        li.classList.toggle("checked", checkbox.checked);
      });
      li.appendChild(checkbox);
      li.appendChild(document.createTextNode(scaleIngredient(ingredient, scale)));
      ingredientsList.appendChild(li);
    });
  }
}

// Display food details
async function displayFoodDetails() {
  const foodDetails = await fetchFoodDetails(foodName);
  currentFoodDetails = foodDetails;
  // Set default servings (from DB or fallback to 4)
  defaultServings = (foodDetails && foodDetails.servings) ? Number(foodDetails.servings) : 4;
  document.getElementById("servings-input").value = defaultServings;

  // Show/hide servings control based on category
  const servingsControl = document.getElementById("servings-control");
  if (foodDetails && foodDetails._category === "home") {
    if (servingsControl) servingsControl.style.display = "flex";
  } else {
    if (servingsControl) servingsControl.style.display = "none";
  }

  if (foodDetails) {
    document.getElementById("food-name").textContent = foodDetails.name;
    document.getElementById("food-budget").textContent = `Estimated budget: ₱${foodDetails.budget || "N/A"}`;
    document.getElementById("food-filters").textContent = `Filters included: ${foodDetails.filters || "none"}`;
    document.getElementById("food-allergens").textContent = `Allergens: ${foodDetails.allergens || "none"}`;
    if (foodDetails.image) {
      document.getElementById("food-image").src = foodDetails.image;
    }

    // Show description if available
    const descDiv = document.getElementById("food-description");
    const descText = document.getElementById("food-description-text");
    if (foodDetails.description && foodDetails.description.trim() !== "") {
      descText.textContent = " " + foodDetails.description;
      descDiv.style.display = "";
    } else {
      descText.textContent = "";
      descDiv.style.display = "none";
    }

    // Show history if available
    const historyDiv = document.getElementById("food-history");
    const historyText = document.getElementById("food-history-text");
    if (foodDetails.history && foodDetails.history.trim() !== "") {
      historyText.textContent = " " + foodDetails.history;
      historyDiv.style.display = "";
    } else {
      historyText.textContent = "";
      historyDiv.style.display = "none";
    }

    // Show link if available, with YouTube title if possible, otherwise use a smart label
    const foodLinkDiv = document.getElementById("food-link");
    if (foodDetails.link && foodDetails.link.trim() !== "") {
      const videoId = extractYouTubeVideoId(foodDetails.link);
      if (videoId) {
        foodLinkDiv.textContent = "Link: Loading...";
        try {
          const title = await fetchYouTubeTitle(videoId);
          foodLinkDiv.innerHTML = `Link: <a href="${foodDetails.link}" target="_blank" style="color:#1976d2;text-decoration:underline;font-weight:bold;">${title || "YouTube Video"}</a>`;
        } catch (e) {
          console.error("Error fetching YouTube title:", e);
          // Fallback if fetch fails
          foodLinkDiv.innerHTML = `Link: <a href="${foodDetails.link}" target="_blank" style="color:#1976d2;text-decoration:underline;font-weight:bold;">YouTube Video</a>`;
        }
      } else {
        // Not a YouTube link, use smart label
        const label = getLinkLabel(foodDetails.link);
        foodLinkDiv.innerHTML = `Link: <a href="${foodDetails.link}" target="_blank" style="color:#1976d2;text-decoration:underline;font-weight:bold;">${label}</a>`;
      }
    } else {
      foodLinkDiv.innerHTML = "";
    }

    // Show or hide ingredients/instructions based on category
    const detailsContent = document.getElementById("detailsContent");
    if (foodDetails._category === "home") {
      detailsContent.style.display = "";
      const ingredientsList = document.getElementById("food-ingredients");
      ingredientsList.innerHTML = "";
      (foodDetails.ingredients || []).forEach(ingredient => {
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.addEventListener("change", () => {
          li.classList.toggle("checked", checkbox.checked);
        });
        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(ingredient));
        ingredientsList.appendChild(li);
      });

      const instructionsList = document.getElementById("food-instructions");
      instructionsList.innerHTML = "";
      (foodDetails.instructions || []).forEach(instruction => {
        const li = document.createElement("li");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.addEventListener("change", () => {
          li.classList.toggle("checked", checkbox.checked);
        });
        li.appendChild(checkbox);
        li.appendChild(document.createTextNode(instruction));
        instructionsList.appendChild(li);
      });
    } else {
      detailsContent.style.display = "none";
    }
  } else {
    document.getElementById("food-name").textContent = "Food not found";
    document.getElementById("food-budget").textContent = "";
    document.getElementById("food-filters").textContent = "";
    document.getElementById("detailsContent").style.display = "none";
    document.getElementById("food-link").innerHTML = "";
    document.getElementById("food-description-text").textContent = "";
    document.getElementById("food-description").style.display = "none";
    document.getElementById("food-history-text").textContent = "";
    document.getElementById("food-history").style.display = "none";
    document.getElementById("food-allergens").textContent = "";
  }

  // After rendering, update for current servings
  updateServingsUI(Number(document.getElementById("servings-input").value));
}

// Listen for servings change (arrows and input)
document.addEventListener("DOMContentLoaded", () => {
  const servingsInput = document.getElementById("servings-input");
  const decreaseBtn = document.getElementById("servings-decrease");
  const increaseBtn = document.getElementById("servings-increase");

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  decreaseBtn.addEventListener("click", () => {
    let val = parseInt(servingsInput.value) || 1;
    val = clamp(val - 1, 1, 20);
    servingsInput.value = val;
    updateServingsUI(val);
  });

  increaseBtn.addEventListener("click", () => {
    let val = parseInt(servingsInput.value) || 1;
    val = clamp(val + 1, 1, 20);
    servingsInput.value = val;
    updateServingsUI(val);
  });

  servingsInput.addEventListener("input", () => {
    let val = parseInt(servingsInput.value) || 1;
    val = clamp(val, 1, 20);
    servingsInput.value = val;
    updateServingsUI(val);
  });
});

displayFoodDetails();

// --- Hugging Face Semantic Similarity API ---
// (No key in frontend!)
async function isSimilarIntent(userText, targetText) {
  try {
    const response = await fetch("/api/similarity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText, targetText })
    });
    if (!response.ok) {
      console.error("Backend returned error status:", response.status);
      return false;
    }
    const data = await response.json();
    return !!data.similar;
  } catch (e) {
    console.error("Backend similarity API error:", e);
  }
  return false;
}

// Speech API functionality
const speechIcon = document.getElementById("speechIcon");
const speechIndicator = document.getElementById("speechIndicator");
let speechEnabled = false;
let recognition;
let speechPausedByVoice = false; // Track if stopped by voice
let isRecognitionActive = false; // Track if recognition is running

// For pausing/resuming instructions
let instructionsQueue = [];
let instructionsIndex = 0;
let isSpeakingInstructions = false;

// Helper to safely start recognition
function safeStartRecognition() {
  if (recognition && !isRecognitionActive && speechEnabled) {
    try {
      recognition.start();
    } catch (e) {
      // Ignore InvalidStateError
    }
  }
}

// Helper to speak instructions step by step
function speakInstructions(steps, startIdx = 0) {
  if (!steps || steps.length === 0) return;
  isSpeakingInstructions = true;
  instructionsQueue = steps;
  instructionsIndex = startIdx;

  function speakNext() {
    if (!isSpeakingInstructions || speechPausedByVoice || instructionsIndex >= instructionsQueue.length) {
      isSpeakingInstructions = false;
      return;
    }
    const text = instructionsQueue[instructionsIndex];
    const utterance = new SpeechSynthesisUtterance(text);
    if (preferredVoice) utterance.voice = preferredVoice;
    speechIndicator.textContent = `Speaking... (${instructionsIndex + 1}/${instructionsQueue.length})`;
    utterance.onend = () => {
      instructionsIndex++;
      if (!speechPausedByVoice && instructionsIndex < instructionsQueue.length) {
        speakNext();
      } else {
        isSpeakingInstructions = false;
        if (!speechPausedByVoice) speechIndicator.textContent = "Enabled";
      }
    };
    utterance.onerror = () => {
      isSpeakingInstructions = false;
      speechIndicator.textContent = "Enabled";
    };
    window.speechSynthesis.speak(utterance);
  }
  speakNext();
}

// Initialize Speech Recognition
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isRecognitionActive = true;
    console.log("Speech recognition started");
    speechIndicator.textContent = "Listening...";
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript.trim().toLowerCase();
    console.log("Heard:", transcript);

    // --- CONTINUE/STOP LOGIC (unchanged) ---
    if (speechPausedByVoice && (transcript === "continue" || await isSimilarIntent(transcript, "continue"))) {
      speechPausedByVoice = false;
      speechIndicator.textContent = "Enabled";
      if (instructionsQueue.length > 0 && instructionsIndex < instructionsQueue.length && !isSpeakingInstructions) {
        speakInstructions(instructionsQueue, instructionsIndex);
      }
      return;
    }
    if (transcript === "stop" || await isSimilarIntent(transcript, "stop")) {
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      speechPausedByVoice = true;
      isSpeakingInstructions = false;
      speechIndicator.textContent = "Stopped by voice";
      return;
    }

    // --- INTENT DETECTION FOR VARIOUS COMMANDS ---
    // Helper to speak a string
    function speakText(text) {
      if (!text) return;
      const utterance = new SpeechSynthesisUtterance(text);
      speechIndicator.textContent = "Speaking...";
      speechSynthesis.speak(utterance);
      utterance.onend = () => {
        speechIndicator.textContent = "Enabled";
      };
    }

    // Instructions
    const instructionsIntent = await isSimilarIntent(transcript, "tell me the instructions");
    if (instructionsIntent || transcript.includes("instructions")) {
      const steps = Array.from(document.querySelectorAll("#food-instructions li"))
        .map(li => li.textContent.trim())
        .filter(Boolean);
      speechPausedByVoice = false;
      instructionsQueue = steps;
      instructionsIndex = 0;
      isSpeakingInstructions = false;
      if (steps.length > 0) {
        speakInstructions(steps, 0);
      } else {
        speakInstructions(["No instructions available."], 0);
      }
      if (!isRecognitionActive && speechEnabled) safeStartRecognition();
      return;
    }

    // Description
    const descriptionIntent = await isSimilarIntent(transcript, "what is the description of the food");
    if (descriptionIntent || transcript.includes("description")) {
      const desc = document.getElementById("food-description-text").textContent.trim();
      let text = desc ? "The description is: " + desc : "No description available.";
      speechPausedByVoice = false;
      instructionsQueue = splitIntoSentences(text);
      instructionsIndex = 0;
      isSpeakingInstructions = false;
      speakInstructions(instructionsQueue, 0);
      if (!isRecognitionActive && speechEnabled) safeStartRecognition();
      return;
    }

    // History
    const historyIntent = await isSimilarIntent(transcript, "what is the history of the food");
    if (historyIntent || transcript.includes("history")) {
      const hist = document.getElementById("food-history-text").textContent.trim();
      let text = hist ? "The history is: " + hist : "No history available.";
      speechPausedByVoice = false;
      instructionsQueue = splitIntoSentences(text);
      instructionsIndex = 0;
      isSpeakingInstructions = false;
      speakInstructions(instructionsQueue, 0);
      if (!isRecognitionActive && speechEnabled) safeStartRecognition();
      return;
    }

    // Ingredients
    const ingredientsIntent = await isSimilarIntent(transcript, "what are the ingredients");
    if (ingredientsIntent || transcript.includes("ingredients")) {
      const ingredients = Array.from(document.querySelectorAll("#food-ingredients li"))
        .map(li => li.textContent.trim())
        .filter(Boolean);
      let text = ingredients.length > 0
        ? "The ingredients are: " + ingredients.join(", ")
        : "No ingredients available.";
      speechPausedByVoice = false;
      instructionsQueue = splitIntoSentences(text);
      instructionsIndex = 0;
      isSpeakingInstructions = false;
      speakInstructions(instructionsQueue, 0);
      if (!isRecognitionActive && speechEnabled) safeStartRecognition();
      return;
    }

    // Budget
    const budgetIntent = await isSimilarIntent(transcript, "what is the budget of the food");
    if (budgetIntent || transcript.includes("budget")) {
      const budget = document.getElementById("food-budget").textContent.replace("Estimated budget:", "").trim();
      let text = budget
        ? "The estimated budget is " + budget
        : "No budget information available.";
      speechPausedByVoice = false;
      instructionsQueue = splitIntoSentences(text);
      instructionsIndex = 0;
      isSpeakingInstructions = false;
      speakInstructions(instructionsQueue, 0);
      if (!isRecognitionActive && speechEnabled) safeStartRecognition();
      return;
    }

    // Filters
    const filtersIntent = await isSimilarIntent(transcript, "what are the filters of the food");
    if (filtersIntent || transcript.includes("filter")) {
      const filters = document.getElementById("food-filters").textContent.replace("Category:", "").trim();
      let text = filters
        ? "The category is: " + filters
        : "No filters available.";
      speechPausedByVoice = false;
      instructionsQueue = splitIntoSentences(text);
      instructionsIndex = 0;
      isSpeakingInstructions = false;
      speakInstructions(instructionsQueue, 0);
      if (!isRecognitionActive && speechEnabled) safeStartRecognition();
      return;
    }

    // Allergens
    const allergensIntent = await isSimilarIntent(transcript, "what are the allergens of the food");
    if (allergensIntent || transcript.includes("allergen")) {
      const allergens = document.getElementById("food-allergens").textContent.replace("Allergens:", "").trim();
      let text = allergens
        ? "The allergens are: " + allergens
        : "No allergen information available.";
      speechPausedByVoice = false;
      instructionsQueue = splitIntoSentences(text);
      instructionsIndex = 0;
      isSpeakingInstructions = false;
      speakInstructions(instructionsQueue, 0);
      if (!isRecognitionActive && speechEnabled) safeStartRecognition();
      return;
    }

    // Fallback
    console.log("Unrecognized command:", transcript);
    speechIndicator.textContent = "Enabled";
    if (!isRecognitionActive && speechEnabled) safeStartRecognition();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    isRecognitionActive = false;
    if (!speechEnabled) {
      speechIndicator.textContent = "Disabled";
      return;
    }
    if (event.error === "no-speech") {
      // Just restart if not paused by voice
      if (!speechPausedByVoice) {
        speechIndicator.textContent = "Listening...";
        setTimeout(() => {
          if (!isRecognitionActive && speechEnabled && !speechPausedByVoice) safeStartRecognition();
        }, 300);
      }
    } else {
      speechIndicator.textContent = "Error";
      // Try to restart recognition if enabled and not paused
      if (speechEnabled && !isRecognitionActive && !speechPausedByVoice) {
        setTimeout(() => {
          if (!isRecognitionActive && speechEnabled && !speechPausedByVoice) safeStartRecognition();
        }, 500);
      }
    }
  };

  recognition.onend = () => {
    isRecognitionActive = false;
    console.log("Speech recognition ended.");
    if (speechEnabled && !speechPausedByVoice) {
      // Restart recognition to keep listening
      safeStartRecognition();
      speechIndicator.textContent = "Enabled";
    }
    if (!speechEnabled) {
      speechIndicator.textContent = "Disabled";
    }
    if (speechPausedByVoice) {
      speechIndicator.textContent = "Stopped by voice";
      // Optionally, restart recognition to keep listening for "continue"
      if (!isRecognitionActive && speechEnabled) safeStartRecognition();
    }
  };
} else {
  console.error("Web Speech API is not supported in this browser.");
  speechIndicator.textContent = "Not Supported";
}

// Toggle speech recognition
speechIcon.addEventListener("click", () => {
  speechEnabled = !speechEnabled;
  if (speechEnabled) {
    speechIcon.classList.add("enabled");
    console.log("speech enabled");
    speechIndicator.textContent = "Enabled";

    if (recognition) {
      if (!isRecognitionActive && !speechPausedByVoice) safeStartRecognition();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  } else {
    speechIcon.classList.remove("enabled");
    console.log("speech disabled");
    speechIndicator.textContent = "Disabled";

    if (recognition && isRecognitionActive) {
      recognition.stop();
    }
    // Stop any ongoing speech synthesis when disabling
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    // Also clear paused state
    speechPausedByVoice = false;
  }
});

// Stop speech synthesis when navigating away from the page
window.addEventListener("beforeunload", () => {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
});
 document.addEventListener("DOMContentLoaded", function() {
    const gamesLogo = document.getElementById("back-button");
    if (gamesLogo) {
      gamesLogo.addEventListener("click", function(e) {
        e.preventDefault();
        history.back();
      });
    }
  });

