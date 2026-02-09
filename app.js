const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture");
const switchBtn = document.getElementById("switch");
const gallery = document.getElementById("gallery");
const contador = document.getElementById("contador");

const LIMITE_FOTOS = 5;
let fotosTomadas = Number(localStorage.getItem("fotosTomadas")) || 0;

let currentFacingMode = "user"; // "user" = frontal, "environment" = trasera
let currentStream = null;

actualizarContador();

async function startCamera() {
  if (currentStream) {
    // Detener cámara anterior
    currentStream.getTracks().forEach(track => track.stop());
  }

  try {
    const constraints = {
      video: { facingMode: currentFacingMode }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    currentStream = stream;
  } catch (err) {
    alert("No se pudo acceder a la cámara");
    console.error(err);
  }
}

function actualizarContador() {
  contador.textContent = `Fotos usadas: ${fotosTomadas} / ${LIMITE_FOTOS}`;

  if (fotosTomadas >= LIMITE_FOTOS) {
    captureBtn.disabled = true;
    captureBtn.textContent = "Límite alcanzado";
  }
}

function takePhoto() {
  if (fotosTomadas >= LIMITE_FOTOS) return;

  const context = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  context.drawImage(video, 0, 0);

  const imgData = canvas.toDataURL("image/png");

  const img = document.createElement("img");
  img.src = imgData;
  gallery.prepend(img);

  fotosTomadas++;
  localStorage.setItem("fotosTomadas", fotosTomadas);
  actualizarContador();
}

// Cambiar cámara
switchBtn.addEventListener("click", () => {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  startCamera();
});

captureBtn.addEventListener("click", takePhoto);

startCamera();