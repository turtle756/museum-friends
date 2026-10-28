"""콘텐츠 검사 테스트. 실제 content/tour.yaml 도 여기서 검사하므로, 잘못 고친 콘텐츠는 PR 단계에서 막힌다."""
import copy
from pathlib import Path

import pytest

from museum_friends.content import ContentError, load_tour, validate_tour

ROOT = Path(__file__).resolve().parent.parent


def test_real_content_is_valid():
    try:
        tour = load_tour(ROOT / "content" / "tour.yaml", ROOT / "public")
    except ContentError as exc:
        pytest.fail("content/tour.yaml 을 고쳐 주세요\n" + "\n".join(exc.errors))
    assert tour["codes"]


@pytest.fixture
def public_dir(tmp_path):
    (tmp_path / "img").mkdir()
    (tmp_path / "img" / "a.svg").write_text("<svg/>", encoding="utf-8")
    return tmp_path


BASE = {
    "id": "test-tour",
    "title": "테스트 투어",
    "museum": "테스트 박물관",
    "status": "예시",
    "age": "6~9세",
    "minutes": 10,
    "cards": [
        {
            "code": "101",
            "name": "항아리",
            "find": "물을 담는 그릇을 찾아볼까?",
            "hint": "입구 옆에 있어요.",
            "observe": {"question": "줄무늬는 몇 줄?", "choices": ["2줄", "3줄"], "answer": "3줄"},
            "story": "옛날 부엌에서 썼어요.",
            "imagine": {
                "question": "무엇을 담고 싶어?",
                "line": "나는 {답}{을/를} 담고 싶어!",
                "skip_line": "나는 물을 담는 항아리야!",
            },
            "image": "img/a.svg",
            "image_alt": "항아리 그림",
            "face": {"x": 50, "y": 40, "size": 30},
            "source": "",
            "image_credit": "",
            "checked_by": "",
        }
    ],
}


def errors_for(public_dir, change):
    data = copy.deepcopy(BASE)
    change(data)
    _, errors = validate_tour(data, public_dir)
    return errors


def test_base_is_valid(public_dir):
    assert errors_for(public_dir, lambda d: None) == []


def test_number_code_is_accepted(public_dir):
    def change(d):
        d["cards"][0]["code"] = 101

    assert errors_for(public_dir, change) == []


def card(**fields):
    def change(d):
        d["cards"][0].update(fields)

    return change


def nested(key, **fields):
    def change(d):
        d["cards"][0][key].update(fields)

    return change


@pytest.mark.parametrize(
    ("change", "expected"),
    [
        (card(code="1a1"), "세 자리"),
        (nested("observe", answer="4줄"), "'answer'"),
        (nested("observe", choices=["2줄"]), "2~4개"),
        (nested("observe", choices=["2줄", "2줄"], answer="2줄"), "같은 보기"),
        (nested("imagine", line="나는 항아리야"), "{답}"),
        (nested("imagine", line="나는 {답}{를} 담고 싶어"), "쓸 수 없는 칸"),
        (nested("imagine", skip_line="나는 {답}이야"), "칸을 쓰지 않아요"),
        (card(image="img/none.svg"), "파일이 없어요"),
        (card(image="../secret.svg"), "public 폴더 안"),
        (card(image="img/a.gif"), "svg, png"),
        (nested("face", x=120), "0~100"),
        (card(name=""), "'name' 칸을 채워"),
        (card(story="가" * 121), "120자 이하"),
    ],
)
def test_card_rules(public_dir, change, expected):
    errors = errors_for(public_dir, change)
    assert any(expected in error for error in errors), errors


def test_missing_public_dir_skips_only_file_check(tmp_path):
    data = copy.deepcopy(BASE)
    _, errors = validate_tour(data, tmp_path / "no-public")
    assert errors == []


def test_duplicate_codes(public_dir):
    def change(d):
        d["cards"].append(copy.deepcopy(d["cards"][0]))

    assert any("겹쳐요" in e for e in errors_for(public_dir, change))


def test_confirmed_tour_needs_sources(public_dir):
    def change(d):
        d["status"] = "확정"

    errors = errors_for(public_dir, change)
    for key in ("source", "image_credit", "checked_by"):
        assert any(f"'{key}'" in e for e in errors), key


def test_bad_tour_fields(public_dir):
    def change(d):
        d["id"] = "Hwal Tour"
        d["status"] = "임시"
        d["cards"] = []

    errors = errors_for(public_dir, change)
    assert any("'id'" in e for e in errors)
    assert any("'status'" in e for e in errors)
    assert any("1~12장" in e for e in errors)


def test_yaml_syntax_error_points_to_line(tmp_path, public_dir):
    path = tmp_path / "tour.yaml"
    path.write_text("id: test\ncards:\n  - code: \"101\"\n   name: 들여쓰기 틀림\n", encoding="utf-8")
    with pytest.raises(ContentError) as exc:
        load_tour(path, public_dir)
    assert "줄 근처" in exc.value.errors[0]


def test_non_utf8_file(tmp_path, public_dir):
    path = tmp_path / "tour.yaml"
    path.write_bytes("id: 테스트".encode("cp949"))
    with pytest.raises(ContentError) as exc:
        load_tour(path, public_dir)
    assert "UTF-8" in exc.value.errors[0]
