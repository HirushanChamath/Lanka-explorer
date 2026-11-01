const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');

menuToggle.addEventListener('click', function () {
  nav.classList.toggle('open');
  const isOpen = nav.classList.contains('open');
  menuToggle.setAttribute('aria-expanded', isOpen);
});
