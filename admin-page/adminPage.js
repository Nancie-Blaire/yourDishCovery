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

// Ensure all DOM elements are correctly selected
const categorySelect = document.getElementById("category");
const nameField = document.getElementById("nameField");
const descField = document.getElementById("descField");
const ingredientsField = document.getElementById("ingredientsField");
const imageField = document.getElementById("imageField");
const recipeForm = document.getElementById("recipeForm");
const editRecipeId = document.getElementById("editRecipeId");
const submitButton = document.getElementById("submitButton");
const categoryTabs = document.querySelectorAll(".category-tab");

window.app = {
  editRecipe: function (category, id) {
    const recipeRef = ref(db, `recipes/${category}/${id}`);
    get(recipeRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const recipe = snapshot.val();
  
          // Set form fields
          categorySelect.value = category;
          categorySelect.dispatchEvent(new Event("change"));
  
          document.getElementById("name").value = recipe.name || "";
          document.getElementById("description").value = recipe.description || "";
          document.getElementById("ingredients").value = recipe.ingredients || "";
          document.getElementById("image").value = recipe.image || "";
          editRecipeId.value = id;
  
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

  deleteRecipe: function (id) {
    if (confirm("Are you sure you want to delete this recipe?")) {
      const activeTab = document.querySelector(".category-tab.active");
      if (!activeTab) return alert("No active category selected");
  
      const category = activeTab.getAttribute("data-category");
      const recipeRef = ref(db, `recipes/${category}/${id}`);
  
      remove(recipeRef)
        .then(() => {
          alert("Recipe deleted successfully!");
          loadRecipes(category);
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
  const value = categorySelect.value;

  // Hide all fields first
  nameField.classList.add("hidden");
  descField.classList.add("hidden");
  ingredientsField.classList.add("hidden");
  imageField.classList.add("hidden");

  // Show relevant fields based on category
  if (
    value === "jollibee" ||
    value === "mcdo" ||
    value === "kfc" ||
    value === "random"
  ) {
    nameField.classList.remove("hidden");
    imageField.classList.remove("hidden");
  } else if (value === "home") {
    nameField.classList.remove("hidden");
    descField.classList.remove("hidden");
    ingredientsField.classList.remove("hidden");
    imageField.classList.remove("hidden");
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
    document
      .getElementById(`${category}Section`)
      .classList.remove("hidden");

    // Load recipes for selected category
    loadRecipes(category);
  });
});

// Load recipes for a specific category
function loadRecipes(category) {
  const categoryRef = ref(db, `recipes/${category}`);
  get(categoryRef)
    .then((snapshot) => {
      const listElement = document.getElementById(`${category}List`);
      listElement.innerHTML = "";

      if (snapshot.exists()) {
        const recipes = snapshot.val();
        let foundRecipes = false;

        for (let id in recipes) {
          const recipe = recipes[id];
          foundRecipes = true;

          const recipeCard = document.createElement("div");
          recipeCard.classList.add("recipe-card");

          recipeCard.innerHTML = `
            <div class="recipe-card-header">
              <img src="${recipe.image}" alt="${recipe.name}" onerror="this.src='https://via.placeholder.com/80'">
              <div class="recipe-info">
                <h3>${recipe.name}</h3>
                ${recipe.description ? `<p>${recipe.description}</p>` : ""}
              </div>
            </div>
            <div class="button-group">
              <button onclick="window.app.editRecipe('${category}', '${id}')">Edit</button>
              <button onclick="window.app.deleteRecipe('${id}')">Delete</button>
            </div>
          `;

          listElement.appendChild(recipeCard);
        }

        if (!foundRecipes) {
          listElement.innerHTML = "<p>No recipes found in this category.</p>";
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

// Reset form
function resetForm() {
  recipeForm.reset();
  editRecipeId.value = "";
  submitButton.textContent = "Add Recipe";

  // Hide all fields
  nameField.classList.add("hidden");
  descField.classList.add("hidden");
  ingredientsField.classList.add("hidden");
  imageField.classList.add("hidden");
}

// Handle form submission (both add and edit)
recipeForm.addEventListener("submit", function (e) {
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
    ingredients: document.getElementById("ingredients").value || "",
    image: document.getElementById("image").value,
  };

  if (!recipeData.name || !recipeData.image) {
    alert("Name and Image URL are required");
    return;
  }

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
});

// Ensure recipes are loaded on page load
document.addEventListener("DOMContentLoaded", function () {
  // Show the first category's fields if a category is selected
  if (categorySelect.value) {
    categorySelect.dispatchEvent(new Event("change"));
  }

  // Load recipes for the default category (jollibee)
  loadRecipes("jollibee");
});