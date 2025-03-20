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

const colores = [
  ['linear-gradient(to right, #4CAF50, #2E7D32)', '#4CAF50', '#2E7D32'],
  ['linear-gradient(to right, #FFEB3B, #FBC02D)', '#FFEB3B', '#FBC02D'],
  ['linear-gradient(to right, #FF5722, #E64A19)', '#FF5722', '#E64A19'],
  ['linear-gradient(to right, #9C27B0, #6A1B9A)', '#9C27B0', '#6A1B9A'],
  ['linear-gradient(to right, #2196F3, #1565C0)', '#2196F3', '#1565C0'],
  ['linear-gradient(to right, #FF5252, #D32F2F)', '#FF5252', '#D32F2F'],
  ['linear-gradient(to right, #03A9F4, #0288D1)', '#03A9F4', '#0288D1'],
  ['linear-gradient(to right, #E91E63, #C2185B)', '#E91E63', '#C2185B'],
  ['linear-gradient(to right, #8BC34A, #689F38)', '#8BC34A', '#689F38'],
  ['linear-gradient(to right, #009688, #00796B)', '#009688', '#00796B'],
  ['linear-gradient(to right, #CDDC39, #AFB42B)', '#CDDC39', '#AFB42B'],
  ['linear-gradient(to right, #FF5252, #D32F2F)', '#FF5252', '#D32F2F']
];
// Choose a random color


document.querySelector('.button').addEventListener('click', function() {
  console.log('button clicked');
  let randomColor = colores[Math.floor(Math.random() * colores.length)];
  
  // Create an array of ribbon elements
  document.querySelector('#ribbon-middle').style.background = randomColor[0]; // Change background for middle ribbon
  document.querySelector('#ribbon-left').style.borderLeftColor = randomColor[1]; 
  document.querySelector('#ribbon-right').style.borderRightColor = randomColor[2]; 
});    