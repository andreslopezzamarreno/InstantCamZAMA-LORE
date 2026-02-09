const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture");
const switchBtn = document.getElementById("switch");
const gallery = document.getElementById("gallery");
const contador = document.getElementById("contador");

const LIMITE_FOTOS = 5;
let fotosTomadas = Number(localStorage.getItem("fotosTomadas")) || 0;

let currentFacingMode = "user";
let currentStream = null;

actualizarContador();

// Función para iniciar la cámara
async function startCamera() {
  if (currentStream) {
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

// Actualizar contador de fotos
function actualizarContador() {
  contador.textContent = `Fotos usadas: ${fotosTomadas} / ${LIMITE_FOTOS}`;
  captureBtn.disabled = fotosTomadas >= LIMITE_FOTOS;
  captureBtn.textContent = fotosTomadas >= LIMITE_FOTOS ? "Límite alcanzado" : "Tomar foto";
}

// Tomar foto con procesado estilo Pixel
function takePhoto() {
  if (fotosTomadas >= LIMITE_FOTOS) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");

  // Si cámara frontal, reflejar (efecto espejo)
  if(currentFacingMode === "user") {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, 0, 0);
  ctx.setTransform(1,0,0,1,0,0); // Reset transformación

  // Aplicar filtros tipo Pixel (saturación, contraste, brillo)
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  for(let i = 0; i < data.length; i += 4){
    // data[i] = R, data[i+1] = G, data[i+2] = B
    // Aumentar contraste y saturación aproximada
    data[i] = Math.min(255, ((data[i]-128)*1.1)+128);    // R
    data[i+1] = Math.min(255, ((data[i+1]-128)*1.1)+128); // G
    data[i+2] = Math.min(255, ((data[i+2]-128)*1.1)+128); // B
    // brillo ligero
    data[i] = Math.min(255, data[i] + 10);
    data[i+1] = Math.min(255, data[i+1] + 10);
    data[i+2] = Math.min(255, data[i+2] + 10);
  }
  ctx.putImageData(imgData, 0, 0);

  const foto = document.createElement("img");
  foto.src = canvas.toDataURL("image/png");
  gallery.prepend(foto);

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