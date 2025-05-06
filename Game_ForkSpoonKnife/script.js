const clickableImages = document.querySelectorAll('.image-spoon img, .image-fork img, .image-knife img');

clickableImages.forEach(img => {
  img.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent the body click handler from firing
    // Remove 'clicked' from all, then add it to the clicked image
    clickableImages.forEach(i => i.classList.remove('clicked'));
    img.classList.add('clicked');
  });
});

// Deselect on clicking outside
document.body.addEventListener('click', () => {
  clickableImages.forEach(i => i.classList.remove('clicked'));
});