const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

// Function to toggle the sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('close'); // Toggle the 'close' class on the sidebar
}

// Function to toggle dropdowns
function toggleDropdown(element) {
    const dropdownMenu = element.querySelector('.dropdown-menu');

    // Toggle the current dropdown
    if (dropdownMenu) {
        dropdownMenu.classList.toggle('show');
        element.classList.toggle('rotate'); // Rotate the arrow
    }
}

// Function to close all dropdowns
function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-menu');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('show');
    });

    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.classList.remove('rotate');
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function (event) {
    if (!sidebar.contains(event.target)) {
        closeAllDropdowns();
    }
});

// Initialize dropdown toggles
document.addEventListener('DOMContentLoaded', function () {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            toggleDropdown(this);
        });
    });

    // Static home cards click handler
    document.querySelectorAll('#home-static-cards .card-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            renderCardsForCategory(category);
        });
    });

    // Search button handler (should only be added once)
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    // ...existing code...
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function () {
            const query = searchInput.value.trim().toLowerCase();
            if (!query) return;
    
            const cardContainer = document.querySelector('.card-container');
            const staticCards = document.getElementById('home-static-cards');
            if (staticCards) staticCards.style.display = 'none';
            cardContainer.innerHTML = "<p style='color:#333;text-align:center;'>Searching...</p>";
    
            // Only search these categories
            const allowedCategories = ['home', 'jollibee', 'mcdo', 'kfc'];
            const shownRecipes = new Set();
    
            db.ref('recipes').once('value').then(snapshot => {
                let found = false;
                cardContainer.innerHTML = "";
                snapshot.forEach((categorySnap) => {
                    if (!allowedCategories.includes(categorySnap.key)) return;
                    categorySnap.forEach(childSnap => {
                        const recipe = childSnap.val();
                        if (
                            recipe.name &&
                            recipe.image &&
                            recipe.name.toLowerCase().includes(query) &&
                            !shownRecipes.has(recipe.name.toLowerCase())
                        ) {
                            found = true;
                            shownRecipes.add(recipe.name.toLowerCase());
                            const card = document.createElement('div');
                            card.className = 'card';
                            card.innerHTML = `
                                <a href="/food_info.html?food=${encodeURIComponent(recipe.name)}" class="card-link">
                                    <img src="${recipe.image}" alt="${recipe.name}">
                                    <div class="card-content">
                                        <p class="recipe-name">${recipe.name}</p>
                                    </div>
                                </a>
                            `;
                            cardContainer.appendChild(card);
                        }
                    });
                });
                if (!found) {
                    cardContainer.innerHTML = "<p style='color:#333;text-align:center;'>No recipes found for your search.</p>";
                }
            });
        });

          searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    }
});
    // ...existing code...


