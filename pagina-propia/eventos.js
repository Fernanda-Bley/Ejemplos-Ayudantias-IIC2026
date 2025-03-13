//Definimos cual es el punto que queremos mover
const retina = document.querySelectorAll(".eye-retina");

// Definimos el evento que queremos escuchar
//Escuchamos el movimiento del mouse 
window.addEventListener("mousemove", (e) => {
  e = e || window.event;

  //Recogemos la posicion del mouse
  const { pageX, pageY } = e;

  //Detectamos el tamaño de la pantalla
  const { innerWidth, innerHeight } = window;

  //Posicion del mouse X en porcentaje
  let left = (pageX / innerWidth) * 100;

  //Posicion del mouse Y en porcentaje
  let top = (pageY / innerHeight) * 100;

  //limites del movimiento del ojo.
  left = left < 25 ? 25 : left;
  left = left > 75 ? 75 : left;
  top = top < 25 ? 25 : top;
  top = top > 75 ? 75 : top;

  //movemos el ojo
  retina.forEach((f) => {
    //Si llegamos al centro, los ojos se quedan quietos
    f.style.left = `${left > 45 && left < 55 ? 50 : left}%`;
    f.style.top = `${top > 45 && top < 55 ? 50 : top}%`;
  });
});


//on click event
document.querySelector('.gigi').addEventListener('click', function() {
    const audio = document.getElementById('audio');
    audio.play().then(() => {
        console.log('Audio is playing');
    }).catch(error => {
        console.error('Error playing audio:', error);
    });
});