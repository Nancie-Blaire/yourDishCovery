// Admin credentials (for testing)
const adminUsername = "admin";
const adminPassword = "12345"; // Change this for extra security!

document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault(); // Prevent form from refreshing the page
  
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (username === adminUsername && password === adminPassword) {
    // Redirect to the admin dashboard page
    window.location.href = "../admin-page/adminPage.html";
  } else { 
    // Show error message if credentials are incorrect
    document.getElementById("error-message").style.display = "block";
  }
});


// Display food items on the dashboard
function displayFoodList() {
  const foodListContainer = document.getElementById("food-list");
  foodListContainer.innerHTML = "<h3>Food List</h3>";

  foodList.forEach((food, index) => {
    foodListContainer.innerHTML += `
      <div class="food-item">
        <span>${food.name} - ${food.category}</span>
        <button onclick="deleteFood(${index})">Delete</button>
      </div>
    `;
  });
}

// Add new food item from the form
document.getElementById("addFoodForm").addEventListener("submit", function(event) {
  event.preventDefault(); // Prevent page refresh on form submission

  const foodName = document.getElementById("foodName").value;
  const foodCategory = document.getElementById("foodCategory").value;

  if (foodName && foodCategory) {
    // Create new food object and add to the list
    const newFood = { name: foodName, category: foodCategory };
    foodList.push(newFood);

    // Clear the form inputs
    document.getElementById("foodName").value = "";
    document.getElementById("foodCategory").value = "";

    // Update the food list display
    displayFoodList();
  } else {
    alert("Please fill in both fields!");
  }
});

// Delete a food item
function deleteFood(index) {
  foodList.splice(index, 1);
  displayFoodList();
}

// Initial load of food list
displayFoodList();
