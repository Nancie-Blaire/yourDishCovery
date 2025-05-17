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


    // Search button handler (should only be added once)
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const suggestionsBox = document.getElementById('search-suggestions');
    const clearBtn = document.getElementById('clear-search');
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

    // Show/hide clear button based on input value
    if (searchInput && clearBtn) {
        searchInput.addEventListener('input', function () {
            clearBtn.style.display = searchInput.value ? 'block' : 'none';
        });
        clearBtn.addEventListener('click', function () {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            if (suggestionsBox) suggestionsBox.style.display = "none";
            // Optionally, restore static cards
            const staticCards = document.getElementById('home-static-cards');
            if (staticCards) staticCards.style.display = 'flex';
            const cardContainer = document.querySelector('.card-container');
            if (cardContainer) cardContainer.innerHTML = "";
        });
    }

    // --- Live search suggestions ---
    if (searchInput && suggestionsBox) {
        let lastQuery = "";
        let suggestions = [];
        let selectedIndex = -1;

        searchInput.addEventListener('input', function () {
            const query = searchInput.value.trim().toLowerCase();
            lastQuery = query;
            suggestionsBox.innerHTML = "";
            suggestionsBox.style.display = "none";
            selectedIndex = -1;
            if (!query) return;

            const allowedCategories = ['home', 'jollibee', 'mcdo', 'kfc'];
            const shownNames = new Set();
            db.ref('recipes').once('value').then(snapshot => {
                suggestions = [];
                snapshot.forEach(categorySnap => {
                    if (!allowedCategories.includes(categorySnap.key)) return;
                    categorySnap.forEach(childSnap => {
                        const recipe = childSnap.val();
                        if (
                            recipe.name &&
                            recipe.name.toLowerCase().includes(query) &&
                            !shownNames.has(recipe.name.toLowerCase())
                        ) {
                            shownNames.add(recipe.name.toLowerCase());
                            suggestions.push(recipe.name);
                        }
                    });
                });
                if (suggestions.length > 0) {
                    suggestionsBox.innerHTML = suggestions.map((name, idx) =>
                        `<div class="suggestion-item" data-index="${idx}">${name}</div>`
                    ).join('');
                    suggestionsBox.style.display = "block";
                }
            });
        });

        // Keyboard navigation for suggestions
        searchInput.addEventListener('keydown', function (e) {
            if (suggestionsBox.style.display === "block" && suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    selectedIndex = (selectedIndex + 1) % suggestions.length;
                    updateActiveSuggestion();
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    selectedIndex = (selectedIndex - 1 + suggestions.length) % suggestions.length;
                    updateActiveSuggestion();
                } else if (e.key === "Enter") {
                    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                        searchInput.value = suggestions[selectedIndex];
                        suggestionsBox.style.display = "none";
                        suggestions = [];
                        selectedIndex = -1;
                        // Auto-search for the selected suggestion
                        if (searchBtn) searchBtn.click();
                    }
                } else if (e.key === "Escape") {
                    suggestionsBox.style.display = "none";
                    suggestions = [];
                    selectedIndex = -1;
                }
            }
        });

        function updateActiveSuggestion() {
            const items = suggestionsBox.querySelectorAll('.suggestion-item');
            items.forEach((item, idx) => {
                item.classList.toggle('active', idx === selectedIndex);
            });
        }

        // Click on suggestion
        suggestionsBox.addEventListener('mousedown', function (e) {
            if (e.target.classList.contains('suggestion-item')) {
                const selectedName = e.target.textContent;
                searchInput.value = selectedName;
                suggestionsBox.style.display = "none";
                suggestions = [];
                selectedIndex = -1;
                // Show only the selected food as a card
                const cardContainer = document.querySelector('.card-container');
                const staticCards = document.getElementById('home-static-cards');
                if (staticCards) staticCards.style.display = 'none';
                cardContainer.innerHTML = "<p style='color:#333;text-align:center;'>Loading...</p>";
                const allowedCategories = ['home', 'jollibee', 'mcdo', 'kfc'];
                let found = false;
                db.ref('recipes').once('value').then(snapshot => {
                    cardContainer.innerHTML = "";
                    snapshot.forEach(categorySnap => {
                        if (!allowedCategories.includes(categorySnap.key)) return;
                        categorySnap.forEach(childSnap => {
                            const recipe = childSnap.val();
                            if (
                                recipe.name &&
                                recipe.image &&
                                recipe.name.toLowerCase() === selectedName.toLowerCase()
                            ) {
                                found = true;
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
                        cardContainer.innerHTML = "<p style='color:#333;text-align:center;'>No recipe found.</p>";
                    }
                });
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('mousedown', function (e) {
            if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
                suggestionsBox.style.display = "none";
                suggestions = [];
                selectedIndex = -1;
            }
        });
    }

});


