import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  remove,
  push,
  update,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCA2KS4aKwM5P4_et3wifB4sRg23tvaK04",
  authDomain: "dish-4be2b.firebaseapp.com",
  projectId: "dish-4be2b",
  storageBucket: "dish-4be2b.appspot.com",
  messagingSenderId: "479066048512",
  appId: "1:479066048512:web:7489944044adddc4c570e5",
  measurementId: "G-8D2QSMQWT2",
  databaseURL: "https://dish-4be2b-default-rtdb.firebaseio.com", // Added database URL
};

// Ensure goBack function is defined
document.getElementById("home").addEventListener("click", function () {
  window.location.href = "/index.html"; // Reverted to absolute path
});

// Ensure Firebase initialization is correct
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

document.addEventListener("DOMContentLoaded", () => {
  // Ensure all DOM elements are correctly selected
  const categorySelect = document.getElementById("category");
  const nameField = document.getElementById("nameField");
  const descField = document.getElementById("descField");
  const ingredientsField = document.getElementById("ingredientsField");
  const instructionsField = document.getElementById("instructionsField");
  const imageField = document.getElementById("imageField");
  const budgetField = document.getElementById("budgetField");
  const filterField = document.getElementById("filterField");
  const linkField = document.getElementById("linkField");
  const recipeForm = document.getElementById("recipeForm");
  const editRecipeId = document.getElementById("editRecipeId");
  const submitButton = document.getElementById("submitButton");
  const categoryTabs = document.querySelectorAll(".category-tab");
  const existingImageInput = document.getElementById("existingImage");
  const currentImagePreview = document.getElementById("currentImagePreview");
  const currentImage = document.getElementById("currentImage");
  const historyField = document.getElementById("historyField");
  const allergenField = document.getElementById("allergenField");

  window.app = {
    editRecipe: function (id, category) {
      const recipeRef = ref(db, `recipes/${category}/${id}`);
      get(recipeRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const recipe = snapshot.val();

            // Set form fields
            categorySelect.value = category;
            categorySelect.dispatchEvent(new Event("change")); // Trigger the change event

            document.getElementById("name").value = recipe.name || "";
            document.getElementById("description").value =
              recipe.description || "";
            document.getElementById("budget").value = recipe.budget || "";
            document.getElementById("filters").value = recipe.filters || "";
            document.getElementById("allergens").value = recipe.allergens || "";
            document.getElementById("link").value = recipe.link || "";
            editRecipeId.value = id;

            // Show current image if exists
            if (recipe.image) {
              existingImageInput.value = recipe.image;
              currentImage.src = recipe.image;
              currentImagePreview.style.display = "block";
            } else {
              existingImageInput.value = "";
              currentImagePreview.style.display = "none";
            }

            // Populate ingredients and instructions fields only for "home" category
            if (category === "home") {
              const ingredientsTextarea = document.getElementById("ingredients");
              const instructionsTextarea = document.getElementById("instructions");
              const historyTextarea = document.getElementById("history");
              // Join ingredients and instructions arrays into multi-line text
              if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
                ingredientsTextarea.value = recipe.ingredients.join("\n");
              }
              if (recipe.instructions && Array.isArray(recipe.instructions)) {
                instructionsTextarea.value = recipe.instructions.join("\n");
              }
              // Set history field
              if (historyTextarea) historyTextarea.value = recipe.history || "";
            }

            // Change button text
            submitButton.textContent = "Update Recipe";

            // Scroll to the form
            recipeForm.scrollIntoView({ behavior: "smooth" });
          } else {
            alert("Recipe not found.");
          }
        })
        .catch((error) => {
          console.error("Error getting recipe:", error);
          alert("Error getting recipe: " + error.message);
        });
    },

    deleteRecipe: function (id, category) {
      if (confirm("Are you sure you want to delete this recipe?")) {
        const recipeRef = ref(db, `recipes/${category}/${id}`);
        remove(recipeRef)
          .then(() => {
            alert("Recipe deleted successfully!");

            // Find active tab and reload its recipes
            const activeTab = document.querySelector(".category-tab.active");
            if (activeTab) {
              const activeCategory = activeTab.getAttribute("data-category");
              loadRecipes(activeCategory);
            }
          })
          .catch((error) => {
            console.error("Error deleting recipe:", error);
            alert("Error deleting recipe: " + error.message);
          });
      }
    },
  };

  // Show/hide inputs based on selected category
  categorySelect.addEventListener("change", () => {
    const value = categorySelect.value; // Get the selected category

    // Debugging log to verify the selected category
    console.log("Category changed:", value);

    // Hide all fields first
    if (nameField) nameField.classList.add("hidden");
    if (descField) descField.classList.add("hidden");
    if (ingredientsField) ingredientsField.classList.add("hidden");
    if (instructionsField) instructionsField.classList.add("hidden");
    if (imageField) imageField.classList.add("hidden");
    if (budgetField) budgetField.classList.add("hidden");
    if (filterField) filterField.classList.add("hidden");
    if (linkField) linkField.classList.add("hidden");
    if (historyField) historyField.classList.add("hidden");
    if (allergenField) allergenField.classList.add("hidden");

    // Show relevant fields based on category
    if (["jollibee", "mcdo", "kfc", "random"].includes(value)) {
      if (nameField) nameField.classList.remove("hidden");
      if (imageField) imageField.classList.remove("hidden");
      if (budgetField) budgetField.classList.remove("hidden");
      if (filterField) filterField.classList.remove("hidden");
      if (linkField) linkField.classList.remove("hidden");
      if (allergenField) allergenField.classList.remove("hidden");
      if (historyField) historyField.classList.add("hidden");
    } else if (value === "home") {
      if (nameField) nameField.classList.remove("hidden");
      if (descField) descField.classList.remove("hidden");
      if (ingredientsField) ingredientsField.classList.remove("hidden");
      if (instructionsField) instructionsField.classList.remove("hidden");
      if (imageField) imageField.classList.remove("hidden");
      if (budgetField) budgetField.classList.remove("hidden");
      if (filterField) filterField.classList.remove("hidden");
      if (linkField) linkField.classList.remove("hidden");
      if (historyField) historyField.classList.remove("hidden");
      if (allergenField) allergenField.classList.remove("hidden");
    }
  });

  // Tab switching functionality
  categoryTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Update active tab
      categoryTabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      // Get category
      const category = this.getAttribute("data-category");

      // Hide all sections
      document.querySelectorAll(".category-section").forEach((section) => {
        section.classList.add("hidden");
      });

      // Show selected section
      document.getElementById(`${category}Section`).classList.remove("hidden");

      // Load recipes for selected category
      loadRecipes(category);
    });
  });

  // Load recipes for a specific category
  function loadRecipes(category) {
    const listElement = document.getElementById(`${category}List`);
    listElement.innerHTML = "";

    if (category === "random") {
      // Fetch all foods from all categories
      const categories = ["jollibee", "mcdo", "kfc", "home"];
      const allRecipes = [];

      Promise.all(
        categories.map((cat) =>
          get(ref(db, `recipes/${cat}`)).then((snapshot) => {
            if (snapshot.exists()) {
              const recipes = snapshot.val();
              for (let id in recipes) {
                allRecipes.push({ id, ...recipes[id], category: cat });
              }
            }
          })
        )
      )
        .then(() => {
          if (allRecipes.length === 0) {
            listElement.innerHTML = "<p>No recipes found in any category.</p>";
          } else {
            allRecipes.forEach((recipe) => {
              const recipeCard = document.createElement("div");
              recipeCard.classList.add("recipe-card");

              recipeCard.innerHTML = `
                <div class="recipe-card-header">
                  <img src="${recipe.image}" alt="${recipe.name}" onerror="this.src='https://via.placeholder.com/80'">
                  <div class="recipe-info">
                    <h3>${recipe.name}</h3>
                    ${
                      recipe.description
                        ? `<p>${recipe.description}</p>`
                        : ""
                    }
                    <p><strong>Category:</strong> ${recipe.category}</p>
                  </div>
                </div>
                <div class="button-group">
                  <button onclick="window.app.editRecipe('${recipe.id}', '${recipe.category}')">Edit</button>
                  <button onclick="window.app.deleteRecipe('${recipe.id}', '${recipe.category}')">Delete</button>
                </div>
              `;

              listElement.appendChild(recipeCard);
            });
          }

          // Update the "random" category in Firebase
          updateRandomCategory(allRecipes);
        })
        .catch((error) => {
          console.error("Error loading recipes for random category:", error);
          alert("Error loading recipes: " + error.message);
        });
    } else {
      // Fetch recipes for the selected category
      const categoryRef = ref(db, `recipes/${category}`);
      get(categoryRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const recipes = snapshot.val();
            for (let id in recipes) {
              const recipe = recipes[id];

              const recipeCard = document.createElement("div");
              recipeCard.classList.add("recipe-card");

              recipeCard.innerHTML = `
                <div class="recipe-card-header">
                  <img src="${recipe.image}" alt="${recipe.name}" onerror="this.src='https://via.placeholder.com/80'">
                  <div class="recipe-info">
                    <h3>${recipe.name}</h3>
                    ${
                      recipe.description
                        ? `<p>${recipe.description}</p>`
                        : ""
                    }
                  </div>
                </div>
                <div class="button-group">
                  <button onclick="window.app.editRecipe('${id}', '${category}')">Edit</button>
                  <button onclick="window.app.deleteRecipe('${id}', '${category}')">Delete</button>
                </div>
              `;

              listElement.appendChild(recipeCard);
            }
          } else {
            listElement.innerHTML = "<p>No recipes found in this category.</p>";
          }
        })
        .catch((error) => {
          console.error("Error loading recipes:", error);
          alert("Error loading recipes: " + error.message);
        });
    }
  }

  // Function to update the "random" category in Firebase
  function updateRandomCategory(allRecipes) {
    const randomRef = ref(db, "recipes/random");
    const randomData = {};

    allRecipes.forEach((recipe) => {
      const randomId = `${recipe.category}_${recipe.id}`; // Unique ID for random category
      randomData[randomId] = {
        name: recipe.name,
        description: recipe.description || "",
        ingredients: recipe.ingredients || "",
        instructions: recipe.instructions || "",
        image: recipe.image || "",
        budget: recipe.budget || 0,
        filters: recipe.allergens || "", // Use new variable name
        link: recipe.link || "",
      };
    });

    set(randomRef, randomData)
      .then(() => {
        console.log("Random category updated successfully in Firebase.");
      })
      .catch((error) => {
        console.error("Error updating random category in Firebase:", error);
      });
  }

  // Reset form 
  function resetForm() {
    recipeForm.reset();
    editRecipeId.value = "";
    submitButton.textContent = "Add Recipe";
    existingImageInput.value = "";
    currentImagePreview.style.display = "none";

    // Hide all fields
    if (nameField) nameField.classList.add("hidden");
    if (descField) descField.classList.add("hidden");
    if (ingredientsField) ingredientsField.classList.add("hidden");
    if (instructionsField) instructionsField.classList.add("hidden");
    if (imageField) imageField.classList.add("hidden");
    if (budgetField) budgetField.classList.add("hidden");
    if (filterField) filterField.classList.add("hidden");
    if (linkField) linkField.classList.add("hidden");
    if (historyField) historyField.classList.add("hidden");
    if (allergenField) allergenField.classList.add("hidden");
    document.getElementById("link").value = "";
    document.getElementById("history") && (document.getElementById("history").value = "");
    document.getElementById("allergens") && (document.getElementById("allergens").value = "");
  }

  // Handle form submission (both add and edit)
  recipeForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const id = editRecipeId.value;
    const isEditing = id !== "";
    const category = categorySelect.value;

    if (!category) {
      alert("Please select a category");
      return;
    }

    const recipeData = {
      name: document.getElementById("name").value,
      description: document.getElementById("description").value || "",
      budget: parseInt(document.getElementById("budget").value) || 0,
      filters: document.getElementById("filters").value || "",
      allergens: document.getElementById("allergens").value || "",
      link: document.getElementById("link").value || "",
    };

    // Process ingredients and instructions for "home" category directly from textareas
    if (category === "home") {
      const ingredientsText = document.getElementById("ingredients").value.trim();
      const instructionsText = document.getElementById("instructions").value.trim();
      
      // Convert multi-line text to arrays
      recipeData.ingredients = ingredientsText ? 
        ingredientsText.split('\n').map(item => item.trim()).filter(item => item) : 
        [];
      
      recipeData.instructions = instructionsText ? 
        instructionsText.split('\n').map(item => item.trim()).filter(item => item) : 
        [];
      
      // Add history field
      recipeData.history = document.getElementById("history").value || "";
    }

    const imageFile = document.getElementById("imageUpload").files[0];
    const existingImage = existingImageInput.value;

    if (!recipeData.name || (!imageFile && !isEditing && !existingImage)) {
      alert("Name and Image are required");
      return;
    }

    if (imageFile) {
      try {
        // Convert the image file to Base64
        const reader = new FileReader();
        reader.onload = function () {
          recipeData.image = reader.result; // Store Base64 string in recipeData
          saveRecipeData(recipeData, id, isEditing, category);
        };
        reader.onerror = function (error) {
          console.error("Error reading image file:", error);
          alert("Error reading image file: " + error.message);
        };
        reader.readAsDataURL(imageFile); // Read the file as a Base64 string
      } catch (error) {
        console.error("Error processing image:", error);
        alert("Error processing image: " + error.message);
        return;
      }
    } else if (isEditing && existingImage) {
      // Use the existing image if no new image is uploaded
      recipeData.image = existingImage;
      saveRecipeData(recipeData, id, isEditing, category);
    } else if (!isEditing && !imageFile) {
      alert("Image is required for new recipes.");
    }
  });

  // Function to save recipe data to Firebase
  function saveRecipeData(recipeData, id, isEditing, category) {
    let savePromise;

    if (isEditing) {
      // Update existing recipe under the correct category
      const recipeRef = ref(db, `recipes/${category}/${id}`);
      savePromise = update(recipeRef, recipeData);
    } else {
      // Add new recipe under the selected category
      const categoryRef = ref(db, `recipes/${category}`);
      savePromise = push(categoryRef, recipeData);
    }

    savePromise
      .then(() => {
        alert(
          isEditing ? "Recipe updated successfully!" : "New recipe added!"
        );
        resetForm();

        // Find active tab and reload its recipes
        const activeTab = document.querySelector(".category-tab.active");
        if (activeTab) {
          const activeCategory = activeTab.getAttribute("data-category");
          loadRecipes(activeCategory);
        }
      })
      .catch((error) => {
        console.error("Error saving recipe:", error);
        alert("Error: " + error.message);
      });
  }

  // Ensure recipes are loaded on page load
  document.addEventListener("DOMContentLoaded", function () {
    // Show the first category's fields if a category is selected
    if (categorySelect.value) {
      categorySelect.dispatchEvent(new Event("change"));
    }

    // Load recipes for the default category (jollibee)
    loadRecipes("jollibee");
  });
});