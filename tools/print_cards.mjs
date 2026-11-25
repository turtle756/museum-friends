// 인쇄용 PDF: 1쪽 앱 접속 QR 포스터 · 2쪽 빈 쪽(양면 인쇄 때 포스터 뒤가 비게) · 3쪽부터 아이 카드 앞면/뒷면(A4에 9장, 실제 크기).
// 카드 모양은 앱과 같은 public/assets/js/cards.js·cards.css로 그린다. QR은 파이썬 qrcode, PDF는 크롬(또는 엣지) 헤드리스.
// 사용법(저장소 폴더): node tools/print_cards.mjs [출력.pdf] [주소]
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { sheets } from "../public/assets/js/cards.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUB = join(ROOT, "public");
const OUT = resolve(process.argv[2] || join(ROOT, "tools", "out", "유물카드_인쇄.pdf"));
const SITE = process.argv[3] || "https://museum-friends.vercel.app";

const data = JSON.parse(readFileSync(join(PUB, "assets/data/stops.json"), "utf8"));
const all = [...data.stops, ...(data.extras || [])].filter((s) => s.grid !== false);

// QR(SVG, 오류 정정 M — 코팅 반사나 작은 흠집에도 읽히게)
const QR_PY = [
  "import sys, qrcode, qrcode.image.svg",
  "q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)",
  "q.add_data(sys.argv[1]); q.make(fit=True)",
  "s = q.make_image(image_factory=qrcode.image.svg.SvgPathImage).to_string()",
  "sys.stdout.write(s.decode() if isinstance(s, bytes) else s)",
].join("\n");
const venvPy = join(ROOT, ".venv", "Scripts", "python.exe");
const qr = spawnSync(existsSync(venvPy) ? venvPy : "python", ["-c", QR_PY, SITE], { encoding: "utf8" });
if (qr.status !== 0 || !qr.stdout.includes("<svg")) throw new Error(`QR 생성 실패: ${qr.stderr}`);
const svg = qr.stdout.replace(/^<\?xml[^>]*>\s*/, "");

// file:// 로 여므로 "/assets/…"(사이트 기준 주소)를 public 폴더 기준 상대 주소로 바꾼다
const local = (h) => h.replaceAll('"/assets/', '"assets/');
const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>유물 카드 인쇄</title>
<base href="${pathToFileURL(PUB + "/").href}">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Noto+Serif+KR:wght@700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="assets/css/cards.css">
<style>
  body { margin: 0; background: #fff; font-family: var(--font); word-break: keep-all; }
  .poster { width: 210mm; height: 297mm; break-after: page; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20mm; text-align: center; color: #1b1b1b; }
  .poster__logo { height: 13mm; width: auto; }
  .poster__title { margin: 14mm 0 0; font-size: 34pt; font-weight: 800; line-height: 1.25; letter-spacing: -.01em; }
  .poster__qr { margin-top: 13mm; padding: 6mm; border: .6mm solid #1b1b1b; border-radius: 6mm; line-height: 0; }
  .poster__qr svg { width: 105mm; height: 105mm; }
  .poster__how { margin: 10mm 0 0; font-size: 18pt; font-weight: 700; }
  .poster__url { margin: 3mm 0 0; font-size: 13pt; color: #555; font-family: "Poppins", sans-serif; }
  .blank { width: 210mm; height: 297mm; break-after: page; }
  .sheet:last-child { break-after: auto; }
</style></head><body>
<section class="poster">
  <img class="poster__logo" src="assets/img/brand/bow-logo-light.png" alt="부천활박물관">
  <h1 class="poster__title">아이와 함께 보는<br>유물 이야기</h1>
  <div class="poster__qr">${svg}</div>
  <p class="poster__how">휴대폰 카메라로 비춰 보세요</p>
  <p class="poster__url">${SITE.replace(/^https?:\/\//, "")}</p>
</section>
<section class="blank"></section>
${local(sheets(all))}
</body></html>`;

mkdirSync(join(ROOT, "tools", "out"), { recursive: true });
mkdirSync(dirname(OUT), { recursive: true });
const page = join(ROOT, "tools", "out", "print.html");
writeFileSync(page, html, "utf8");

const browsers = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"];
const browser = browsers.find((b) => existsSync(b));
if (!browser) throw new Error("크롬이나 엣지를 찾지 못함");
// 글꼴(구글 폰트·Pretendard)을 받을 시간을 주고 인쇄한다
const r = spawnSync(browser, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files",
  "--virtual-time-budget=20000", `--print-to-pdf=${OUT}`, pathToFileURL(page).href], { encoding: "utf8" });
if (!existsSync(OUT)) throw new Error(`PDF 생성 실패: ${r.stderr}`);
console.log(OUT);
