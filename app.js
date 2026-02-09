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

// Inicializar WebGL
const gl = canvas.getContext("webgl");
const bufferInfo = twgl.primitives.createXYQuadBufferInfo(gl);

// Textura del video
let videoTexture = twgl.createTexture(gl, {
  width: 1,
  height: 1,
  min: gl.LINEAR,
  mag: gl.LINEAR,
  wrap: gl.CLAMP_TO_EDGE
});

actualizarContador();

// Vertex shader con flip horizontal + vertical
const vertexShader = `
attribute vec4 position;
varying vec2 v_texcoord;
uniform float u_flip;
void main() {
  gl_Position = position;
  vec2 uv = position.xy * 0.5 + 0.5;
  uv.x = u_flip > 0.5 ? 1.0 - uv.x : uv.x; // selfie horizontal
  uv.y = 1.0 - uv.y; // flip vertical para que no salga dada la vuelta
  v_texcoord = uv;
}
`;

// Fragment shader con HDR fake
const fragmentShader = `
precision mediump float;
uniform sampler2D u_texture;
varying vec2 v_texcoord;
void main() {
  vec4 color = texture2D(u_texture, v_texcoord);
  color.rgb = pow(color.rgb, vec3(1.1));
  color.rgb = mix(color.rgb, color.rgb*color.rgb, 0.1);
  float avg = (color.r + color.g + color.b)/3.0;
  color.rgb = mix(vec3(avg), color.rgb, 1.2);
  color.rgb += 0.05;
  gl_FragColor = color;
}
`;

const programInfoCustom = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);

// Iniciar cámara
async function startCamera() {
  if(currentStream) currentStream.getTracks().forEach(t => t.stop());
  try {
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    currentStream = stream;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      render();
    };
  } catch(err) {
    alert("No se pudo acceder a la cámara");
    console.error(err);
  }
}

// Contador de fotos
function actualizarContador() {
  contador.textContent = `Fotos usadas: ${fotosTomadas} / ${LIMITE_FOTOS}`;
  captureBtn.disabled = fotosTomadas >= LIMITE_FOTOS;
  captureBtn.textContent = fotosTomadas >= LIMITE_FOTOS ? "Límite alcanzado" : "Tomar foto";
}

// Función para enviar foto al servidor público
function enviarAlServidor(blob) {
  const formData = new FormData();
  formData.append("foto", blob, `foto_${Date.now()}.png`);

  fetch("http://192.168.1.185:3000/subir", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => console.log("Foto subida al servidor:", data))
  .catch(err => console.error(err));
}
function takePhoto() {
  if(fotosTomadas >= LIMITE_FOTOS) return;

  // Crear canvas temporal 2D con mismo tamaño que el WebGL
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const ctx = tempCanvas.getContext("2d");

  // Dibujar el video directamente en 2D para asegurarnos de que funciona
  ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

  // Generar blob a partir del canvas 2D
  tempCanvas.toBlob(blob => {
    if(!blob) {
      console.error("Error: blob vacío");
      return;
    }

    // Mostrar en galería
    const foto = document.createElement("img");
    foto.src = URL.createObjectURL(blob);
    gallery.prepend(foto);

    // Subir al servidor
    enviarAlServidor(blob);

    fotosTomadas++;
    localStorage.setItem("fotosTomadas", fotosTomadas);
    actualizarContador();
  }, "image/png");
}

// Cambiar cámara
switchBtn.addEventListener("click", () => {
  currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
  startCamera();
});

captureBtn.addEventListener("click", takePhoto);

// Render loop WebGL
function render() {
  if(video.readyState >= 2){
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

    const flip = currentFacingMode === "user" ? 1.0 : 0.0;
    gl.useProgram(programInfoCustom.program);
    twgl.setBuffersAndAttributes(gl, programInfoCustom, bufferInfo);
    twgl.setUniforms(programInfoCustom, { u_texture: videoTexture, u_flip: flip });
    twgl.drawBufferInfo(gl, bufferInfo);
  }

  requestAnimationFrame(render);
}

startCamera();