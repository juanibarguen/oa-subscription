let cambio = false;

let lastScrollTop = 0;
const navbar = document.getElementById('nav');
const navbarHeight = navbar.offsetHeight;

window.addEventListener('scroll', function() {
  if (!cambio) { // Verificar si cambio es false
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > lastScrollTop && scrollTop > navbarHeight) {
      // Scroll hacia abajo
      navbar.style.top = `-${navbarHeight}px`;
    } else {
      // Scroll hacia arriba
      navbar.style.top = `0`;
    }
  
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  }
});

document.getElementById('menu-responsive').addEventListener('click', function() {
  cambio = true;
  console.log(cambio);

  var navLinks = document.getElementById('navLinks');
  navLinks.classList.add('expand');

  // Deshabilitar el scroll
  document.body.style.overflow = 'hidden';
});

document.getElementById('menu-responsive-closed').addEventListener('click', function() {
  cambio = false;
  console.log(cambio);

  var navLinks = document.getElementById('navLinks');
  navLinks.classList.remove('expand');

  // Habilitar el scroll
  document.body.style.overflow = 'auto';
});


