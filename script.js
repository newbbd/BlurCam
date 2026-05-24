const video = document.getElementById("camera");
const canvas = document.getElementById("pixel-canvas");
const preview = document.querySelector(".preview-wrap");
const statusText = document.getElementById("status");
const startButton = document.getElementById("start-btn");
const stopButton = document.getElementById("stop-btn");
const blurButton = document.getElementById("blur-btn");
const pixelButton = document.getElementById("pixel-btn");
const mirrorButton = document.getElementById("mirror-btn");
const freezeButton = document.getElementById("freeze-btn");

const context = canvas.getContext("2d");
let stream = null;
let animationFrame = 0;
let isFrozen = false;

function setStatus(message) {
  statusText.textContent = message;
}

function setActive(button, value) {
  button.classList.toggle("is-active", value);
}

function resizeCanvas() {
  const width = video.videoWidth || preview.clientWidth;
  const height = video.videoHeight || preview.clientHeight;
  canvas.width = width;
  canvas.height = height;
}

function drawPixelFrame() {
  if (!stream || isFrozen) {
    animationFrame = requestAnimationFrame(drawPixelFrame);
    return;
  }

  if (preview.classList.contains("is-pixel") && video.readyState >= 2) {
    resizeCanvas();
    const scale = 0.08;
    const smallWidth = Math.max(1, Math.floor(canvas.width * scale));
    const smallHeight = Math.max(1, Math.floor(canvas.height * scale));

    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, smallWidth, smallHeight);
    context.drawImage(canvas, 0, 0, smallWidth, smallHeight, 0, 0, canvas.width, canvas.height);
  }

  animationFrame = requestAnimationFrame(drawPixelFrame);
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    video.srcObject = stream;
    preview.classList.add("is-live");
    setStatus("Camera started. Video stays local in your browser.");
    cancelAnimationFrame(animationFrame);
    drawPixelFrame();
  } catch (error) {
    setStatus("Camera permission denied or unavailable.");
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  stream = null;
  video.srcObject = null;
  preview.classList.remove("is-live", "is-blur", "is-pixel");
  setActive(blurButton, false);
  setActive(pixelButton, false);
  isFrozen = false;
  setActive(freezeButton, false);
  context.clearRect(0, 0, canvas.width, canvas.height);
  cancelAnimationFrame(animationFrame);
  setStatus("Camera stopped.");
}

function toggleBlur() {
  if (!stream) {
    setStatus("Start the camera first.");
    return;
  }

  preview.classList.toggle("is-blur");
  preview.classList.remove("is-pixel");
  setActive(blurButton, preview.classList.contains("is-blur"));
  setActive(pixelButton, false);
}

function togglePixel() {
  if (!stream) {
    setStatus("Start the camera first.");
    return;
  }

  preview.classList.toggle("is-pixel");
  preview.classList.remove("is-blur");
  setActive(pixelButton, preview.classList.contains("is-pixel"));
  setActive(blurButton, false);
}

function toggleMirror() {
  preview.classList.toggle("is-mirror");
  setActive(mirrorButton, preview.classList.contains("is-mirror"));
}

function toggleFreeze() {
  if (!stream) {
    setStatus("Start the camera first.");
    return;
  }

  isFrozen = !isFrozen;
  setActive(freezeButton, isFrozen);
  video.pause();

  if (!isFrozen) {
    video.play();
  }
}

startButton.addEventListener("click", startCamera);
stopButton.addEventListener("click", stopCamera);
blurButton.addEventListener("click", toggleBlur);
pixelButton.addEventListener("click", togglePixel);
mirrorButton.addEventListener("click", toggleMirror);
freezeButton.addEventListener("click", toggleFreeze);

window.addEventListener("beforeunload", stopCamera);
