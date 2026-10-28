"""content/tour.yaml 을 읽고 검사한다.

오류 메시지는 콘텐츠를 고치는 팀원이 바로 알아보도록 한국어로, 카드 번호와 항목 이름을 붙여 쓴다.
"""
from __future__ import annotations

import re
from pathlib import Path

import yaml

STATUSES = ("예시", "확정")
PARTICLES = ("을/를", "이/가", "은/는", "과/와", "아/야", "으로/로")
TOKENS = {"답", *PARTICLES}
IMAGE_EXT = {".svg", ".png", ".jpg", ".jpeg", ".webp"}
TOKEN_RE = re.compile(r"\{([^{}]*)\}")
ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,40}$")
CODE_RE = re.compile(r"^\d{3}$")


class ContentError(ValueError):
    def __init__(self, errors: list[str]):
        super().__init__("콘텐츠 오류\n- " + "\n- ".join(errors))
        self.errors = errors


def _text(errors, where, obj, key, max_len, required=True):
    value = obj.get(key) if isinstance(obj, dict) else None
    if value is None or (isinstance(value, str) and not value.strip()):
        if required:
            errors.append(f"{where}: '{key}' 칸을 채워 주세요")
        return ""
    if not isinstance(value, str):
        errors.append(f"{where}: '{key}' 칸은 글자로 써 주세요")
        return ""
    value = value.strip()
    if len(value) > max_len:
        errors.append(f"{where}: '{key}' 칸은 {max_len}자 이하로 써 주세요 (지금 {len(value)}자)")
    return value


def _number(errors, where, obj, key, low, high):
    value = obj.get(key) if isinstance(obj, dict) else None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        errors.append(f"{where}: '{key}' 칸은 숫자로 써 주세요")
        return 0
    if not low <= value <= high:
        errors.append(f"{where}: '{key}' 칸은 {low}~{high} 사이로 써 주세요 (지금 {value})")
    return value


def _code(errors, where, card):
    value = card.get("code")
    if isinstance(value, int) and not isinstance(value, bool):
        value = str(value)
    if not isinstance(value, str) or not CODE_RE.match(value.strip()):
        errors.append(f'{where}: \'code\'는 따옴표로 감싼 숫자 세 자리로 써 주세요. 예: "101"')
        return ""
    return value.strip()


def _line(errors, where, text, key, need_answer):
    tokens = TOKEN_RE.findall(text)
    unknown = sorted({t for t in tokens if t not in TOKENS})
    if unknown:
        allowed = ", ".join("{" + t + "}" for t in ("답", *PARTICLES))
        shown = ", ".join("{" + t + "}" for t in unknown)
        errors.append(f"{where}: '{key}'에 쓸 수 없는 칸이 있어요: {shown}. 쓸 수 있는 칸: {allowed}")
    if need_answer and "답" not in tokens:
        errors.append(f"{where}: '{key}'에 아이 대답이 들어갈 자리 {{답}} 을 넣어 주세요")
    if not need_answer and tokens:
        errors.append(f"{where}: '{key}'에는 {{ }} 칸을 쓰지 않아요")


def _card(errors, index, card, public_dir: Path, seen: set[str], confirmed: bool):
    where = f"{index}번째 카드"
    if not isinstance(card, dict):
        errors.append(f"{where}: 카드 형식이 올바르지 않아요")
        return None
    code = _code(errors, where, card)
    if code:
        where = f"{index}번째 카드({code})"
        if code in seen:
            errors.append(f"{where}: 'code'가 다른 카드와 겹쳐요")
        seen.add(code)

    out = {
        "code": code,
        "name": _text(errors, where, card, "name", 20),
        "find": _text(errors, where, card, "find", 80),
        "hint": _text(errors, where, card, "hint", 80),
        "story": _text(errors, where, card, "story", 120),
        "image_alt": _text(errors, where, card, "image_alt", 80),
        "source": _text(errors, where, card, "source", 120, required=confirmed),
        "image_credit": _text(errors, where, card, "image_credit", 80, required=confirmed),
    }
    _text(errors, where, card, "checked_by", 40, required=confirmed)

    observe = card.get("observe")
    if not isinstance(observe, dict):
        errors.append(f"{where}: 'observe' 묶음(question, choices, answer)이 필요해요")
        observe = {}
    question = _text(errors, where, observe, "question", 60)
    choices = observe.get("choices")
    clean_choices: list[str] = []
    if not isinstance(choices, list) or not 2 <= len(choices) <= 4:
        errors.append(f"{where}: 'choices'는 보기 2~4개를 목록으로 써 주세요. 예: [3줄, 5줄, 7줄]")
    else:
        for choice in choices:
            if isinstance(choice, bool) or not isinstance(choice, (str, int, float)) or not str(choice).strip():
                errors.append(f"{where}: 'choices'에 빈 보기가 있어요")
                continue
            text = str(choice).strip()
            if len(text) > 20:
                errors.append(f"{where}: 보기 '{text}'는 20자 이하로 써 주세요")
            clean_choices.append(text)
        if len(set(clean_choices)) != len(clean_choices):
            errors.append(f"{where}: 'choices'에 같은 보기가 두 번 있어요")
    answer = observe.get("answer")
    if isinstance(answer, bool) or not isinstance(answer, (str, int, float)):
        answer = ""
    answer = str(answer).strip()
    if clean_choices and answer not in clean_choices:
        errors.append(f"{where}: 'answer'는 choices 중 하나와 글자까지 똑같아야 해요 (지금 '{answer}')")
    out["observe"] = {"question": question, "choices": clean_choices, "answer": answer}

    imagine = card.get("imagine")
    if not isinstance(imagine, dict):
        errors.append(f"{where}: 'imagine' 묶음(question, line, skip_line)이 필요해요")
        imagine = {}
    line = _text(errors, where, imagine, "line", 60)
    skip_line = _text(errors, where, imagine, "skip_line", 60)
    if line:
        _line(errors, where, line, "line", need_answer=True)
    if skip_line:
        _line(errors, where, skip_line, "skip_line", need_answer=False)
    out["imagine"] = {
        "question": _text(errors, where, imagine, "question", 60),
        "line": line,
        "skip_line": skip_line,
    }

    image = _text(errors, where, card, "image", 120)
    if image:
        path = (public_dir / image).resolve()
        if ".." in Path(image).parts or public_dir.resolve() not in path.parents:
            errors.append(f"{where}: 'image'는 public 폴더 안의 경로로 써 주세요. 예: img/101.webp")
        elif path.suffix.lower() not in IMAGE_EXT:
            errors.append(f"{where}: 'image'는 svg, png, jpg, webp 파일만 쓸 수 있어요")
        elif not path.is_file():
            errors.append(f"{where}: 'image' 파일이 없어요: public/{image}")
    out["image"] = image

    face = card.get("face")
    if not isinstance(face, dict):
        errors.append(f"{where}: 'face' 묶음(x, y, size)이 필요해요")
        face = {}
    out["face"] = {
        "x": _number(errors, where, face, "x", 0, 100),
        "y": _number(errors, where, face, "y", 0, 100),
        "size": _number(errors, where, face, "size", 5, 100),
    }
    return out


def validate_tour(data, public_dir: str | Path) -> tuple[dict, list[str]]:
    """검사 결과로 (앱에 내보낼 투어, 오류 목록)을 돌려준다."""
    public_dir = Path(public_dir)
    errors: list[str] = []
    if not isinstance(data, dict):
        return {}, ["파일 맨 위는 id, title, cards 같은 항목으로 시작해야 해요"]

    where = "투어"
    tour_id = _text(errors, where, data, "id", 40)
    if tour_id and not ID_RE.match(tour_id):
        errors.append("투어: 'id'는 영어 소문자, 숫자, '-'만 써 주세요. 예: hwal-2026")
    status = _text(errors, where, data, "status", 4)
    if status and status not in STATUSES:
        errors.append("투어: 'status'는 예시 또는 확정 중 하나로 써 주세요")
    public = {
        "id": tour_id,
        "title": _text(errors, where, data, "title", 40),
        "museum": _text(errors, where, data, "museum", 40),
        "status": status,
        "age": _text(errors, where, data, "age", 20),
        "minutes": _number(errors, where, data, "minutes", 1, 120),
        "cards": [],
    }

    cards = data.get("cards")
    if not isinstance(cards, list) or not 1 <= len(cards) <= 12:
        errors.append("투어: 'cards'에 카드를 1~12장 넣어 주세요")
        cards = []
    seen: set[str] = set()
    for index, card in enumerate(cards, start=1):
        result = _card(errors, index, card, public_dir, seen, confirmed=(status == "확정"))
        if result:
            public["cards"].append(result)
    return public, errors


def load_tour(path: str | Path, public_dir: str | Path) -> dict:
    path = Path(path)
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise ContentError([f"{path.name}: UTF-8로 저장해 주세요"]) from exc
    try:
        data = yaml.safe_load(text)
    except yaml.YAMLError as exc:
        mark = getattr(exc, "problem_mark", None)
        line = f" ({mark.line + 1}번째 줄 근처)" if mark else ""
        raise ContentError([f"{path.name}: 들여쓰기나 따옴표를 확인해 주세요{line}"]) from exc
    public, errors = validate_tour(data, public_dir)
    if errors:
        raise ContentError(errors)
    return {
        "id": public["id"],
        "public": public,
        "codes": frozenset(card["code"] for card in public["cards"]),
    }
