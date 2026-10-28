// 유물 그림 위에 눈과 입을 붙여 "유물 친구"를 그린다. 화면용(SVG)과 저장용(canvas)이 같은 모양이다.
// 얼굴 판은 가로 100, 세로 60 이고, content 의 face.x·y 가 얼굴 가운데, face.size 가 그림 너비 대비 얼굴 너비(%)다.

const NS = "http://www.w3.org/2000/svg";
const FONT = 'system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';
const INK = "#2b1d14";

function svgEl(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

export function faceSvg() {
  const svg = svgEl("svg", { viewBox: "0 0 100 60", class: "face", "aria-hidden": "true", focusable: "false" });
  for (const cx of [25, 75]) {
    const eye = svgEl("g", { class: "face__eye" });
    eye.append(
      svgEl("circle", { cx, cy: 24, r: 14, fill: "#fff", stroke: INK, "stroke-width": 3 }),
      svgEl("circle", { cx: cx + 2, cy: 26, r: 6, fill: INK }),
    );
    svg.append(eye);
  }
  svg.append(svgEl("path", { d: "M38 44 Q50 56 62 44", fill: "none", stroke: INK, "stroke-width": 4, "stroke-linecap": "round" }));
  return svg;
}

export function renderFriend(card, { small = false } = {}) {
  const figure = document.createElement("div");
  figure.className = small ? "friend friend--small" : "friend";
  const img = document.createElement("img");
  img.src = `/${card.image}`;
  img.alt = card.image_alt;
  img.decoding = "async";
  const face = faceSvg();
  face.style.left = `${card.face.x}%`;
  face.style.top = `${card.face.y}%`;
  face.style.width = `${card.face.size}%`;
  figure.append(img, face);
  return figure;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`그림을 불러오지 못했어요: ${src}`));
    img.src = src;
  });
}

function drawFace(ctx, cx, cy, width) {
  const s = width / 100;
  const ox = cx - 50 * s;
  const oy = cy - 30 * s;
  const at = (x, y) => [ox + x * s, oy + y * s];
  for (const ex of [25, 75]) {
    ctx.beginPath();
    ctx.arc(...at(ex, 24), 14 * s, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.lineWidth = 3 * s;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(...at(ex + 2, 26), 6 * s, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(...at(38, 44));
  ctx.quadraticCurveTo(...at(50, 56), ...at(62, 44));
  ctx.lineWidth = 4 * s;
  ctx.lineCap = "round";
  ctx.strokeStyle = INK;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    while (line.length > 1 && ctx.measureText(line).width > maxWidth) {
      let cut = line.length - 1;
      while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut -= 1;
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 모은 친구들을 세로로 늘어놓은 PNG 한 장을 만든다.
export async function exportBookImage(tour, progress) {
  const found = tour.cards.filter((card) => progress?.found?.[card.code]);
  const W = 1080;
  const PAD = 56;
  const HEAD = 220;
  const ROW = 400;
  const IMG = 320;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = HEAD + Math.max(found.length, 1) * ROW + PAD;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#fbf6ec";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#9c3d1f";
  ctx.fillRect(0, 0, W, 16);
  ctx.fillStyle = INK;
  ctx.font = `bold 56px ${FONT}`;
  ctx.fillText(tour.title, PAD, 108);
  ctx.fillStyle = "#6b5747";
  ctx.font = `32px ${FONT}`;
  ctx.fillText(`${new Date().toLocaleDateString("ko-KR")} · 만난 친구 ${found.length}명`, PAD, 162);

  for (const [i, card] of found.entries()) {
    const y = HEAD + i * ROW;
    ctx.fillStyle = "#fffdf8";
    roundRect(ctx, PAD, y, W - PAD * 2, ROW - 32, 28);
    ctx.fill();

    const img = await loadImage(`/${card.image}`);
    const scale = Math.min(IMG / img.naturalWidth, IMG / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = PAD + 24 + (IMG - dw) / 2;
    const dy = y + 24 + (IMG - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    drawFace(ctx, dx + (dw * card.face.x) / 100, dy + (dh * card.face.y) / 100, (dw * card.face.size) / 100);

    const tx = PAD + 24 + IMG + 40;
    const maxWidth = W - tx - PAD - 24;
    ctx.fillStyle = INK;
    ctx.font = `bold 44px ${FONT}`;
    ctx.fillText(card.name, tx, y + 90);
    ctx.font = `34px ${FONT}`;
    wrap(ctx, progress.found[card.code].line, maxWidth)
      .slice(0, 5)
      .forEach((line, j) => ctx.fillText(line, tx, y + 152 + j * 48));
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("이미지 만들기 실패"))), "image/png");
  });
}
