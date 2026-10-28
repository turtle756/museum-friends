// 화면 여섯 개(시작, 질문 카드, 찾기 확인, 관찰 질문, 친구 등장, 도감)를 오가는 흐름.
import { fillLine } from "./josa.js";
import { clearProgress, isComplete, loadProgress, markFound, newProgress, saveProgress } from "./progress.js";
import { cameraSupported, parseCode, startScanner } from "./scanner.js";
import { exportBookImage, renderFriend } from "./friend.js";
import { createEvents } from "./events.js";

const TOUR_CACHE_KEY = "mf:tour:v1";
const SCREENS = ["start", "card", "find", "observe", "friend", "book"];

// 사생활 보호 모드 등에서 localStorage 가 막혀도 화면은 계속 돈다.
const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* 저장 못 해도 진행은 된다 */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* 무시 */ }
  },
};

const $ = (id) => document.getElementById(id);
const state = { tour: null, progress: null, attempts: 0, stopCamera: null, bookImage: null, track: () => {} };

const total = () => state.tour.cards.length;
const currentCard = () => (state.progress ? state.tour.cards[state.progress.index] ?? null : null);

function uuid4() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function show(name) {
  if (name !== "find") stopCamera();
  for (const screen of SCREENS) $(`screen-${screen}`).hidden = screen !== name;
  window.scrollTo(0, 0);
  $(`screen-${name}`).querySelector("[tabindex='-1']")?.focus({ preventScroll: true });
}

function confirmReset() {
  return window.confirm("처음부터 다시 할까요? 지금까지 만난 친구 기록은 지워져요.");
}

/* ---------- 콘텐츠 불러오기 ---------- */

async function fetchTour() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("/api/tour", { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const tour = await response.json();
    store.set(TOUR_CACHE_KEY, JSON.stringify(tour));
    return tour;
  } finally {
    clearTimeout(timer);
  }
}

function cachedTour() {
  try { return JSON.parse(store.get(TOUR_CACHE_KEY) || "null"); } catch { return null; }
}

// 전시실 통신이 약할 수 있으니 입구에서 그림을 미리 받아 둔다.
function preloadImages(tour) {
  for (const card of tour.cards) {
    const img = new Image();
    img.src = `/${card.image}`;
  }
}

/* ---------- 1. 시작 ---------- */

function setStartButtons({ start = false, resume = false, book = false, restart = false, retry = false }) {
  $("btn-start").hidden = !start;
  $("btn-resume").hidden = !resume;
  $("btn-book-from-start").hidden = !book;
  $("btn-restart-from-start").hidden = !restart;
  $("btn-retry").hidden = !retry;
}

function renderStart() {
  const tour = state.tour;
  const progress = state.progress;
  const done = isComplete(progress, total());
  document.title = tour.title;
  $("start-title").textContent = tour.title;
  $("start-badge").hidden = tour.status !== "예시";
  $("start-meta").textContent = `친구 ${tour.cards.length}명 · 약 ${tour.minutes}분 · ${tour.age}`;
  $("start-status").textContent = "";
  setStartButtons({ start: !progress, resume: Boolean(progress) && !done, book: Boolean(progress), restart: Boolean(progress) });
}

async function boot() {
  const pending = parseCode(new URLSearchParams(window.location.search).get("a"));
  if (pending) window.history.replaceState(null, "", window.location.pathname);

  show("start");
  setStartButtons({});
  $("start-status").textContent = "불러오는 중…";
  try {
    state.tour = await fetchTour();
  } catch (err) {
    console.warn("콘텐츠를 새로 받지 못해 보관본을 씁니다", err);
    state.tour = cachedTour();
  }
  if (!state.tour) {
    $("start-status").textContent = "콘텐츠를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.";
    setStartButtons({ retry: true });
    return;
  }

  preloadImages(state.tour);
  state.progress = loadProgress(store, state.tour.id);
  state.track = createEvents(state.tour.id, () => state.progress?.visit);
  renderStart();

  // 휴대폰 기본 카메라로 유물 QR을 찍고 들어온 경우
  if (pending) {
    if (!state.progress) beginTour();
    handleCode(pending);
  }
}

function beginTour() {
  clearProgress(store);
  state.progress = newProgress(state.tour.id, uuid4());
  saveProgress(store, state.progress);
  state.track("start");
  showCard();
}

/* ---------- 2. 질문 카드 ---------- */

function showCard() {
  const card = currentCard();
  if (!card) {
    showBook();
    return;
  }
  $("card-step").textContent = `친구 ${state.progress.index + 1} / ${total()}`;
  $("card-title").textContent = card.find;
  $("card-hint").textContent = card.hint;
  $("card-hint-box").open = false;
  show("card");
}

/* ---------- 3. 찾기 확인 ---------- */

function stopCamera() {
  if (state.stopCamera) {
    state.stopCamera();
    state.stopCamera = null;
  }
  $("camera").hidden = true;
}

function showFind(message = "") {
  const supported = cameraSupported();
  $("find-feedback").textContent = message;
  $("code-input").value = "";
  $("btn-camera").hidden = !supported;
  $("camera-note").hidden = supported;
  $("camera-note").textContent = supported ? "" : "이 브라우저에서는 카메라를 쓸 수 없어요. 번호를 입력해 주세요.";
  show("find");
}

async function openCamera() {
  const button = $("btn-camera");
  button.disabled = true;
  $("camera").hidden = false;
  try {
    state.stopCamera = await startScanner($("video"), (code) => {
      state.stopCamera = null;
      handleCode(code);
    });
    button.hidden = true;
  } catch (err) {
    console.warn("카메라를 켜지 못했어요", err);
    stopCamera();
    $("camera-note").hidden = false;
    $("camera-note").textContent = "카메라를 켜지 못했어요. 번호를 입력해 주세요.";
  } finally {
    button.disabled = false;
  }
}

function handleCode(code) {
  const card = currentCard();
  if (!card) {
    showBook();
    return;
  }
  if (code === card.code) {
    state.track("found", code);
    showObserve();
    return;
  }
  const other = state.tour.cards.find((c) => c.code === code);
  let message = "없는 번호예요. 유물 옆 번호를 다시 확인해 주세요.";
  if (other && state.progress.found[code]) message = "이미 만난 친구예요. 지금 질문의 유물을 찾아볼까요?";
  else if (other) message = "이 친구는 나중에 만나요. 질문을 다시 읽어 볼까요?";
  state.track("wrong_code", card.code);
  showFind(message);
}

/* ---------- 4. 관찰 질문 ---------- */

function showObserve() {
  const card = currentCard();
  state.attempts = 0;
  $("observe-title").textContent = card.observe.question;
  $("observe-feedback").textContent = "";
  $("choices").replaceChildren(
    ...card.observe.choices.map((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.textContent = choice;
      button.addEventListener("click", () => choose(button, choice, card));
      return button;
    }),
  );
  show("observe");
}

function choose(button, choice, card) {
  if (choice === card.observe.answer) {
    state.track("observe_ok", card.code);
    showFriend(card);
    return;
  }
  state.attempts += 1;
  button.disabled = true;
  button.classList.add("choice--no");
  $("observe-feedback").textContent = "다시 자세히 볼까?";
  state.track("observe_retry", card.code);
}

/* ---------- 5. 친구 등장 ---------- */

function showFriend(card) {
  $("friend-title").textContent = `${card.name} 친구를 만났어요!`;
  $("friend-stage").replaceChildren(renderFriend(card));
  $("friend-story").textContent = card.story;
  $("friend-credit").textContent = card.image_credit ? `그림: ${card.image_credit}` : "";
  $("imagine-question").textContent = card.imagine.question;
  $("imagine-input").value = "";
  $("imagine-input").placeholder = "아이의 대답";
  $("imagine-form").hidden = false;
  $("friend-result").hidden = true;
  show("friend");
}

function finishFriend(answer) {
  const card = currentCard();
  const clean = String(answer).trim().slice(0, 20);
  const line = clean ? fillLine(card.imagine.line, clean) : card.imagine.skip_line;
  state.progress = markFound(state.progress, card.code, { answer: clean, line, attempts: state.attempts }, total());
  saveProgress(store, state.progress);

  const done = isComplete(state.progress, total());
  if (done) state.track("complete");
  $("friend-line").textContent = line;
  $("btn-next").textContent = done ? "도감 보기" : "다음 친구 찾기";
  $("imagine-form").hidden = true;
  $("friend-result").hidden = false;
  $("friend-line").focus({ preventScroll: false });
}

/* ---------- 6. 도감 ---------- */

function bookItem(card, record) {
  const item = document.createElement("li");
  const name = document.createElement("p");
  name.className = "book__name";
  if (record) {
    item.className = "book__item";
    name.textContent = card.name;
    const line = document.createElement("p");
    line.className = "book__line";
    line.textContent = record.line;
    item.append(renderFriend(card, { small: true }), name, line);
  } else {
    item.className = "book__item book__item--locked";
    const lock = document.createElement("div");
    lock.className = "book__lock";
    lock.textContent = "?";
    lock.setAttribute("aria-hidden", "true");
    name.textContent = "아직 못 만났어요";
    item.append(lock, name);
  }
  return item;
}

function showBook() {
  const progress = state.progress;
  const found = progress ? Object.keys(progress.found).length : 0;
  const done = isComplete(progress, total());
  $("book-count").textContent = `만난 친구 ${found} / ${total()}`;
  $("book-done").hidden = !done;
  $("btn-continue").hidden = !progress || done;
  $("btn-save").hidden = found === 0;
  $("book-feedback").textContent = "";
  $("book-list").replaceChildren(...state.tour.cards.map((card) => bookItem(card, progress?.found[card.code])));
  // 휴대폰 공유 창은 버튼을 누른 직후에만 열린다. 누르기 전에 이미지를 미리 만들어 둔다.
  state.bookImage = found > 0 ? exportBookImage(state.tour, progress).catch(() => null) : null;
  show("book");
}

async function saveImage() {
  const button = $("btn-save");
  const feedback = $("book-feedback");
  button.disabled = true;
  feedback.textContent = "이미지를 만드는 중…";
  try {
    const blob = (await state.bookImage) ?? (await exportBookImage(state.tour, state.progress));
    const file = new File([blob], "유물친구도감.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: state.tour.title });
        feedback.textContent = "";
        return;
      } catch (err) {
        if (err.name === "AbortError") {
          feedback.textContent = "";
          return;
        }
      }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    feedback.textContent = "이미지를 저장했어요.";
  } catch (err) {
    console.error(err);
    feedback.textContent = "이미지를 만들지 못했어요. 화면을 캡처해 주세요.";
  } finally {
    button.disabled = false;
  }
}

/* ---------- 버튼 연결 ---------- */

$("btn-start").addEventListener("click", beginTour);
$("btn-resume").addEventListener("click", showCard);
$("btn-book-from-start").addEventListener("click", showBook);
$("btn-restart-from-start").addEventListener("click", () => confirmReset() && beginTour());
$("btn-retry").addEventListener("click", boot);
$("btn-found").addEventListener("click", () => showFind());
$("btn-book-from-card").addEventListener("click", showBook);
$("btn-camera").addEventListener("click", openCamera);
$("btn-back-to-card").addEventListener("click", showCard);
$("code-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const code = parseCode($("code-input").value);
  if (!code) {
    $("find-feedback").textContent = "숫자 세 자리를 입력해 주세요.";
    return;
  }
  handleCode(code);
});
$("imagine-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const value = $("imagine-input").value;
  if (!value.trim()) {
    $("imagine-input").placeholder = "대답을 적거나 건너뛰기를 눌러 주세요";
    $("imagine-input").focus();
    return;
  }
  finishFriend(value);
});
$("btn-skip").addEventListener("click", () => finishFriend(""));
$("btn-next").addEventListener("click", () => (isComplete(state.progress, total()) ? showBook() : showCard()));
$("btn-continue").addEventListener("click", showCard);
$("btn-save").addEventListener("click", saveImage);
$("btn-restart").addEventListener("click", () => confirmReset() && beginTour());
$("btn-clear").addEventListener("click", () => {
  if (!window.confirm("이 휴대폰에 저장된 기록을 모두 지울까요?")) return;
  clearProgress(store);
  state.progress = null;
  renderStart();
  show("start");
});

boot();
