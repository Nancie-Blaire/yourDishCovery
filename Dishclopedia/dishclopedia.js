const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

// Function to toggle the sidebar
function toggleSidebar() {
    sidebar.classList.toggle('close');
    toggleButton.classList.toggle('rotate');
    closeAllDropdowns(); // Close all dropdowns when toggling the sidebar
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
            event.stopPropagation(); // Prevent the click from propagating to the document
            toggleDropdown(this);
        });
    });
});