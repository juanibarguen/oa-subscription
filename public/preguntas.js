document.addEventListener("DOMContentLoaded", function() {
    const preguntas = document.querySelectorAll(".pregunta-titulo");
  
    preguntas.forEach(pregunta => {
      pregunta.addEventListener("click", function() {
        this.nextElementSibling.classList.toggle("active");
      });
    });
  });
  
  