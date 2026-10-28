// 화면 안 QR 카메라. QR 해석은 jsQR(Apache-2.0, public/vendor/jsqr)이 맡는다.
// QR 내용은 "https://주소/?a=101" 이거나 "101" 이다. 둘 다 번호 세 자리만 꺼내 쓴다.

let jsQRPromise = null;

function loadJsQR() {
  if (window.jsQR) return Promise.resolve(window.jsQR);
  if (!jsQRPromise) {
    jsQRPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/vendor/jsqr/jsQR.js";
      script.onload = () => (window.jsQR ? resolve(window.jsQR) : reject(new Error("jsQR 없음")));
      script.onerror = () => {
        jsQRPromise = null;
        reject(new Error("jsQR 불러오기 실패"));
      };
      document.head.append(script);
    });
  }
  return jsQRPromise;
}

export function parseCode(text) {
  const s = String(text ?? "").trim();
  if (/^\d{3}$/.test(s)) return s;
  try {
    const value = new URL(s).searchParams.get("a");
    if (value && /^\d{3}$/.test(value)) return value;
  } catch {
    // 주소가 아니면 번호도 아니다
  }
  return null;
}

export function cameraSupported() {
  return Boolean(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// 카메라를 켜고 QR을 찾으면 onCode(번호)를 부른다. 돌려주는 함수를 부르면 카메라가 꺼진다.
export async function startScanner(video, onCode) {
  const jsQR = await loadJsQR();
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false,
  });
  let stopped = false;
  let frame = 0;
  let lastScan = 0;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  };
  try {
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    stop();
    throw err;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const tick = (time) => {
    if (stopped) return;
    if (time - lastScan > 150 && video.readyState >= 2 && video.videoWidth) {
      lastScan = time;
      const scale = Math.min(1, 480 / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
      const code = found && parseCode(found.data);
      if (code) {
        stop();
        onCode(code);
        return;
      }
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return stop;
}
