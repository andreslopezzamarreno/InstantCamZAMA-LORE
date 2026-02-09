const video = document.getElementById('video');
const contador = document.getElementById('contador');


const LIMITE_FOTOS = 5;


// Número de fotos tomadas por ESTE dispositivo
let fotosTomadas = Number(localStorage.getItem('fotosTomadas')) || 0;


actualizarContador();


async function startCamera() {
try {
const stream = await navigator.mediaDevices.getUserMedia({ video: true });
video.srcObject = stream;
} catch (err) {
alert('No se pudo acceder a la cámara');
console.error(err);
}
}


function actualizarContador() {
contador.textContent = `Fotos usadas: ${fotosTomadas} / ${LIMITE_FOTOS}`;


if (fotosTomadas >= LIMITE_FOTOS) {
captureBtn.disabled = true;
captureBtn.textContent = 'Límite alcanzado';
}
}


function takePhoto() {
if (fotosTomadas >= LIMITE_FOTOS) return;


const context = canvas.getContext('2d');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;


context.drawImage(video, 0, 0);


const imgData = canvas.toDataURL('image/png');


const img = document.createElement('img');
img.src = imgData;
gallery.prepend(img);


fotosTomadas++;
localStorage.setItem('fotosTomadas', fotosTomadas);


actualizarContador();
}


captureBtn.addEventListener('click', takePhoto);


startCamera();