let cameraStream = null;
let cameraVideo = null;

export function cameraAvailable() {
  return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export async function openCamera() {
  cameraStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1440 },
    },
    audio: false,
  });
  cameraVideo = document.getElementById('camera-video');
  cameraVideo.srcObject = cameraStream;
  await cameraVideo.play();
}

export function captureFrameCanvas() {
  const vw = cameraVideo.videoWidth;
  const vh = cameraVideo.videoHeight;
  const canvas = document.createElement('canvas');
  canvas.width = vw;
  canvas.height = vh;
  canvas.getContext('2d').drawImage(cameraVideo, 0, 0);
  return canvas;
}

export function closeCamera() {
  if (cameraStream) {
    for (const track of cameraStream.getTracks()) track.stop();
    cameraStream = null;
  }
  if (cameraVideo) {
    cameraVideo.srcObject = null;
    cameraVideo = null;
  }
}
