// Random Food Generator functionality
const speakButton = document.getElementById("speakButton");
const output = document.getElementById("output");
const button = document.getElementById("button1");
const result = document.querySelector("h2");
const foods = ["Adobo", "Sinigang", "Fried Chicken"];
const foodImages = {
  Adobo: "../images/adobo/adobo.jpg", // Corrected relative path
  Sinigang: "../images/sinigang/sinigang.jpg", // Corrected relative path
  "Fried Chicken": "../images/fried_chicken/fried_chicken.jpg", // Corrected relative path
};

document.getElementById("homeButton").addEventListener("click", function () {
  console.log("Button clicked!");
  window.location.href = "/index.html"; // Updated to absolute path
});

const recipeData = {
  Adobo: {
    ingredients: [
      "2 lbs. chicken cut into individual pieces",
      "0.67 tablespoon salt",
      "2 cups cooking oil",
      "0.67 cup all-purpose flour",
    ],
    batterIngredients: [
      "0.5 cup evaporated milk",
      "0.67 Knorr Chicken Cube",
      "1.33 eggs",
      "0.5 cups all-purpose flour",
      "0.67 teaspoon baking powder",
      "1.33 teaspoons garlic powder",
      "0.33 teaspoon salt",
      "0.17 teaspoon ground black pepper",
    ],
    instructions: [
      "Rub salt all over the chicken. Let it stay for 15 minutes.",
      "Heat the oil in a cooking pot.",
      "Prepare the batter. Start by pressing a fork on the chicken cube until it is completely squashed. Combine it with warm milk. Stir until well blended. Set aside.",
      "Combine flour, baking powder, garlic powder, salt, and ground black pepper. Mix well using a fork or a wire whisk. Set aside.",
      "Beat the eggs in a large mixing bowl. Add the milk mixture. Continue to beat until all the ingredients are all incorporated. Add half of flour mixture. Whisk. Add the remaining half and whisk until the texture of the batter becomes smooth.",
      "Dredge the chicken in flour and then dip in batter. Roll it again in flour until completely covered. Fry in medium heat for 7 minutes per side.",
      "Remove from the pot and put in a plate lined with paper towel. This will absorb the oil.",
      "Serve with ketchup or gravy.",
    ],
  },
  Sinigang: {
    ingredients: ["Pork", "Tamarind mix", "Kangkong", "Radish", "Tomatoes"],
    instructions: [
      "Boil pork with tamarind mix.",
      "Add vegetables like kangkong and radish.",
      "Simmer until cooked.",
    ],
  },
  "Fried Chicken": {
    ingredients: ["Chicken", "Flour", "Spices", "Oil"],
    instructions: [
      "Marinate chicken in spices.",
      "Coat with flour.",
      "Deep fry until golden brown.",
    ],
  },
};

// Ensure the "Anong ulam?" button functionality is restored
button.addEventListener("click", () => {
  const excludedIngredients = [];
  if (document.getElementById("filterRadish").checked)
    excludedIngredients.push("Radish");
  if (document.getElementById("filterSpices").checked)
    excludedIngredients.push("Spices");
  if (document.getElementById("filterEvaporatedMilk").checked)
    excludedIngredients.push("Evaporated Milk");

  const filteredFoods = foods.filter((food) => {
    const recipe = recipeData[food];
    return !recipe.ingredients.some((ingredient) =>
      excludedIngredients.includes(ingredient)
    );
  });

  if (filteredFoods.length === 0) {
    alert("No foods available with the selected filters.");
    return;
  }

  let animationInterval = setInterval(() => {
    const randomFood =
      filteredFoods[Math.floor(Math.random() * filteredFoods.length)];
    result.textContent = randomFood;
    document.getElementById("foodImage").src = foodImages[randomFood];
    document.getElementById("recipeSection").style.display = "none"; // Hide recipe during animation
  }, 300);

  setTimeout(() => {
    clearInterval(animationInterval);
    const finalFood =
      filteredFoods[Math.floor(Math.random() * filteredFoods.length)];
    result.textContent = finalFood;
    document.getElementById("foodImage").src = foodImages[finalFood];

    // Display the recipe
    const recipe = recipeData[finalFood];
    const recipeContent = document.getElementById("recipeContent");
    recipeContent.innerHTML = `
      <h3>Ingredients</h3>
      <ul>${recipe.ingredients.map((item) => `<li>${item}</li>`).join("")}</ul>
      <h3>Instructions</h3>
      <ol>${recipe.instructions.map((step) => `<li>${step}</li>`).join("")}</ol>
    `;
    document.getElementById("recipeSection").style.display = "block";
  }, 4000);
});

const synth = window.speechSynthesis;

speakButton.addEventListener("click", () => {
  const recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.lang = "en-US";

  recognition.onstart = () => {
    output.textContent = "Listening...";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log(`Captured speech: ${transcript}`); // Debugging log
    output.textContent = `You said: ${transcript}`;

    if (transcript === "start.") {
      let animationInterval = setInterval(() => {
        const randomFood = foods[Math.floor(Math.random() * foods.length)];
        result.textContent = randomFood;
        document.getElementById("foodImage").src = foodImages[randomFood];
        document.getElementById("recipeSection").style.display = "none"; // Hide recipe during animation
      }, 300);

      setTimeout(() => {
        clearInterval(animationInterval);
        const finalFood = foods[Math.floor(Math.random() * foods.length)];
        result.textContent = finalFood;
        document.getElementById("foodImage").src = foodImages[finalFood];

        // Display the recipe
        const recipe = recipeData[finalFood];
        const recipeContent = document.getElementById("recipeContent");
        recipeContent.innerHTML = `
          <h3>Ingredients</h3>
          <ul>${recipe.ingredients
            .map((item) => `<li>${item}</li>`)
            .join("")}</ul>
          <h3>Instructions</h3>
          <ol>${recipe.instructions
            .map((step) => `<li>${step}</li>`)
            .join("")}</ol>
        `;
        document.getElementById("recipeSection").style.display = "block";

        // Speak the final food name
        const utterance = new SpeechSynthesisUtterance(finalFood);
        synth.speak(utterance);
      }, 4000);
    }
  };

  recognition.onerror = (event) => {
    console.error(`Speech recognition error: ${event.error}`); // Log error details
    output.textContent = `Error: ${event.error}`;
  };

  recognition.onaudiostart = () => {
    console.log("Audio capturing started.");
  };

  recognition.onaudioend = () => {
    console.log("Audio capturing ended.");
  };

  recognition.start();
});
