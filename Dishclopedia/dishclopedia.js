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

// --- Loading Indicator Utilities ---
function showGlobalLoading(msg = "Fetching data...") {
    const indicator = document.getElementById('global-loading-indicator');
    if (indicator) {
        indicator.style.display = 'block';
        indicator.innerHTML = `<span style="color:#c78456;font-weight:bold;">${msg}</span>`;
        indicator.style.pointerEvents = "none";
    }
    console.log(`[Dishclopedia] ${msg}`);
}
function hideGlobalLoading() {
    const indicator = document.getElementById('global-loading-indicator');
    if (indicator) indicator.style.display = 'none';
    console.log("[Dishclopedia] Done fetching data.");
}

// Helper to render cards for a given category with loading indicator
function renderCardsForCategoryWithLoading(category) {
    const cardContainer = document.querySelector('.card-container');
    showGlobalLoading("Fetching recipes...");
    cardContainer.innerHTML = ""; // Clear previous cards

    // Prevent duplicate cards by tracking names
    const shownRecipes = new Set();

    db.ref('recipes/' + category).once('value').then(snapshot => {
        let found = false;
        snapshot.forEach(childSnapshot => {
            const recipe = childSnapshot.val();
            // Only add if not already shown
            if (recipe.name && recipe.image && !shownRecipes.has(recipe.name.toLowerCase())) {
                found = true;
                shownRecipes.add(recipe.name.toLowerCase());
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <a href="../Food_info/food_info.html?food=${encodeURIComponent(recipe.name)}" class="card-link">
                        <img src="${recipe.image}" alt="${recipe.name}">
                        <div class="card-content">
                            <p class="recipe-name">${recipe.name}</p>
                        </div>
                    </a>
                `;
                cardContainer.appendChild(card);
            }
        });
        if (!found) {
            cardContainer.innerHTML = "<p style='color:#333;text-align:center;'>No recipes found for this category.</p>";
        }
    }).finally(() => {
        hideGlobalLoading();
    });
}

// Helper to set category title and UI state
function setCategoryUI(category) {
    const introText = document.getElementById('intro-text');
    const appTitle = document.getElementById('app-title');
    const categoryTitle = document.getElementById('category-title');
    if (introText) introText.style.display = 'none';
    if (appTitle) appTitle.style.display = 'none';
    if (categoryTitle) {
        let displayName = category.replace(/-/g, ' ');
        if (displayName === 'mcdo') displayName = 'MCDONALDS';
        else if (displayName === 'jollibee') displayName = 'JOLLIBEE';
        else if (displayName === 'kfc') displayName = 'KFC';
        else displayName = displayName.toUpperCase();
        categoryTitle.textContent = displayName;
        categoryTitle.style.display = 'block';
    }
}

// Initialize dropdown toggles
document.addEventListener('DOMContentLoaded', function () {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            toggleDropdown(this);
        });
    });

    // Attach sidebar handler only to sidebar links (not static cards)
    document.querySelectorAll('#sidebar a[data-category]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            // --- Fix: Show intro if Dishclopedia is clicked ---
            if (category === 'dishclopedia') {
                // Show intro and reset UI
                const introText = document.getElementById('intro-text');
                const appTitle = document.getElementById('app-title');
                const cardContainer = document.querySelector('.card-container');
                const categoryTitle = document.getElementById('category-title');
                if (introText) introText.style.display = '';
                if (appTitle) appTitle.style.display = '';
                if (categoryTitle) {
                    categoryTitle.style.display = 'none';
                    categoryTitle.textContent = '';
                }
                if (cardContainer) cardContainer.innerHTML = '';
                // Set sidebar active state
                document.querySelectorAll('#sidebar li').forEach(li => li.classList.remove('active'));
                const dishLi = document.getElementById('dishclopedia-link-li');
                if (dishLi) dishLi.classList.add('active');
                // Show static cards
                const staticCards = document.getElementById('home-static-cards');
                if (staticCards) staticCards.style.display = 'flex';
                return; // Do not fetch recipes for "dishclopedia"
            }
            const introText = document.getElementById('intro-text');
            const appTitle = document.getElementById('app-title');
            const cardContainer = document.querySelector('.card-container');
            const categoryTitle = document.getElementById('category-title');
            const staticCards = document.getElementById('home-static-cards'); // <-- add this line
            if (category === 'static-home' || category === 'home') {
                // Always fetch and show foods from "home" category in Firebase
                if (introText) introText.style.display = 'none';
                if (appTitle) appTitle.style.display = 'none';
                if (categoryTitle) {
                    categoryTitle.textContent = "HOME";
                    categoryTitle.style.display = 'block';
                }
                if (staticCards) staticCards.style.display = 'none'; // <-- hide static cards
                showGlobalLoading("Fetching data...");
                renderCardsForCategoryWithLoading('home');
            } else {
                // Hide intro and app title, show cards and category title
                if (introText) introText.style.display = 'none';
                if (appTitle) appTitle.style.display = 'none';
                if (categoryTitle) {
                    // Format category name for display
                    let displayName = category.replace(/-/g, ' ');
                    if (displayName === 'mcdo') displayName = 'MCDONALDS';
                    else if (displayName === 'jollibee') displayName = 'JOLLIBEE';
                    else if (displayName === 'kfc') displayName = 'KFC';
                    else displayName = displayName.toUpperCase();
                    categoryTitle.textContent = displayName;
                    categoryTitle.style.display = 'block';
                }
                // Hide static cards
                const staticCards = document.getElementById('home-static-cards');
                if (staticCards) staticCards.style.display = 'none';
                showGlobalLoading("Fetching data...");
                renderCardsForCategoryWithLoading(category);
            }
        });
    });

    // Attach static card handler only to static card links
    document.querySelectorAll('.static-card-container .card-link[data-category]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const category = this.getAttribute('data-category');
            // Hide static cards before rendering recipes
            const staticCards = document.getElementById('home-static-cards');
            if (staticCards) staticCards.style.display = 'none';
            // Hide intro and app title, show cards and category title
            const introText = document.getElementById('intro-text');
            const appTitle = document.getElementById('app-title');
            const categoryTitle = document.getElementById('category-title');
            if (introText) introText.style.display = 'none';
            if (appTitle) appTitle.style.display = 'none';
            if (categoryTitle) {
                let displayName = category.replace(/-/g, ' ');
                if (displayName === 'mcdo') displayName = 'MCDONALDS';
                else if (displayName === 'jollibee') displayName = 'JOLLIBEE';
                else if (displayName === 'kfc') displayName = 'KFC';
                else displayName = displayName.toUpperCase();
                categoryTitle.textContent = displayName;
                categoryTitle.style.display = 'block';
            }
            // Clear card container before rendering (fixes duplication)
            const cardContainer = document.querySelector('.card-container');
            if (cardContainer) cardContainer.innerHTML = '';
            // Render cards for the selected category
            renderCardsForCategoryWithLoading(category);
            // Highlight the correct sidebar link
            document.querySelectorAll('#sidebar li').forEach(li => li.classList.remove('active'));
            document.querySelectorAll(`#sidebar a[data-category="${category}"]`).forEach(a => {
                if (a.closest('li')) a.closest('li').classList.add('active');
            });
        });
    });

    // Search button handler (should only be added once)
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const suggestionsBox = document.getElementById('search-suggestions');
    const clearBtn = document.getElementById('clear-search');
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

            showGlobalLoading("Fetching recipes...");
            db.ref('recipes').once('value').then(snapshot => {
                let found = false;
                let foundCategory = null;
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
                            foundCategory = categorySnap.key;
                            shownRecipes.add(recipe.name.toLowerCase());
                            const card = document.createElement('div');
                            card.className = 'card';
                            card.innerHTML = `
                                <a href="../Food_info/food_info.html?food=${encodeURIComponent(recipe.name)}" class="card-link">
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
                if (found) {
                    setCategoryUI(foundCategory);
                } else {
                    cardContainer.innerHTML = "<p style='color:#333;text-align:center;'>No recipes found for your search.</p>";
                }
            }).finally(() => {
                hideGlobalLoading();
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
            showGlobalLoading("Fetching suggestions...");
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
            }).finally(() => {
                hideGlobalLoading();
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
                showGlobalLoading("Fetching recipe details...");
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
                                    <a href="../Food_info/food_info.html?food=${encodeURIComponent(recipe.name)}" class="card-link">
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
                }).finally(() => {
                    hideGlobalLoading();
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


