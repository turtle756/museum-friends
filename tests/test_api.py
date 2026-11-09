"""API 계약 테스트 (설계 문서 5장)."""
import uuid

import pytest

from museum_friends import create_app, db
from museum_friends.content import ContentError

VISIT = str(uuid.uuid4())


def post_event(client, **changes):
    body = {"tour": "hwal-sample", "visit": VISIT, "type": "found", "code": "101"}
    body.update(changes)
    return client.post("/api/events", json=body)


def test_tour_is_public_content_with_cache_header(client):
    res = client.get("/api/tour")
    assert res.status_code == 200
    tour = res.get_json()
    assert tour["id"] == "hwal-sample"
    assert [card["code"] for card in tour["cards"]] == ["101", "102", "103"]
    assert "checked_by" not in tour["cards"][0]
    assert "note" not in tour["cards"][0]
    assert "s-maxage" in res.headers["Cache-Control"]


def test_event_is_stored_without_personal_data(app, client):
    assert post_event(client).status_code == 204
    with app.app_context():
        rows = db.execute("SELECT tour, visit, type, code FROM events")
    assert rows == [("hwal-sample", VISIT, "found", "101")]


@pytest.mark.parametrize("event_type", ["start", "complete"])
def test_visit_events_have_no_code(client, event_type):
    assert post_event(client, type=event_type, code=None).status_code == 204


@pytest.mark.parametrize(
    ("changes", "message"),
    [
        ({"type": "dance"}, "알 수 없는 이벤트"),
        ({"visit": "abc"}, "visit"),
        ({"visit": VISIT.upper()}, "visit"),
        ({"tour": "other-tour"}, "투어"),
        ({"code": "999"}, "유물 번호"),
        ({"code": None}, "유물 번호"),
        ({"type": "start", "code": "101"}, "넣지 않습니다"),
    ],
)
def test_bad_events_are_rejected(client, changes, message):
    res = post_event(client, **changes)
    assert res.status_code == 400
    assert message in res.get_json()["error"]


@pytest.mark.parametrize("body", ["[1, 2]", "not json", ""])
def test_body_must_be_json_object(client, body):
    res = client.post("/api/events", data=body, content_type="application/json")
    assert res.status_code == 400


def test_too_large_body_is_rejected(client):
    res = client.post("/api/events", data="x" * 5000, content_type="application/json")
    assert res.status_code == 413
    assert res.get_json()["error"]


def test_db_off_accepts_but_does_not_store(tmp_path):
    app = create_app({"TESTING": True, "DB_MODE": "off"})
    client = app.test_client()
    assert post_event(client).status_code == 202
    assert client.get("/health").get_json() == {"status": "ok", "db": "off"}


def test_vercel_without_database_url_turns_db_off():
    app = create_app({"TESTING": True, "DATABASE_URL": "", "ON_VERCEL": True})
    assert app.config["DB_MODE"] == "off"


def test_health_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json() == {"status": "ok", "db": "ok"}


def test_health_reports_db_error(client, monkeypatch):
    def broken(*_args, **_kwargs):
        raise RuntimeError("DB down")

    monkeypatch.setattr(db, "execute", broken)
    res = client.get("/health")
    assert res.status_code == 503
    assert res.get_json()["db"] == "error"


def test_event_returns_503_when_db_fails(client, monkeypatch):
    def broken(*_args, **_kwargs):
        raise RuntimeError("DB down")

    monkeypatch.setattr(db, "insert_event", broken)
    assert post_event(client).status_code == 503


def test_pages_and_static_files_are_served(client):
    page = client.get("/")
    assert page.status_code == 200
    home = page.get_data(as_text=True)
    assert 'id="app"' in home
    assert 'name="robots" content="noindex, nofollow"' in home
    pages = ["gallery", "pick-card", "pick-image", "pick-look", "structure", "content", "designs",
             "strategies", "themes", "cards", "sheets", "sheet", "stamps", "styles", "routes", "compare", "proto"]
    for name in pages:
        html = client.get(f"/{name}.html").get_data(as_text=True)
        assert 'content="noindex, nofollow"' in html, name
        assert 'rel="icon"' in html, name
    assets = ["/assets/css/g.css", "/assets/css/sheet.css", "/assets/data/stops.json", "/assets/js/core.js",
              "/assets/js/cards.js", "/assets/js/sheets.js", "/assets/js/options.js", "/assets/img/ref/met.jpg", "/assets/css/app.css", "/assets/css/decide.css",
              "/assets/js/app.js", "/assets/js/shell.js", "/assets/img/brand/bucheon-bow-museum.png", "/assets/img/cut/rest.png", "/robots.txt",
              "/img/sample-101.svg", "/vendor/jsqr/jsQR.js"]
    for path in assets:
        assert client.get(path).status_code == 200, path


def test_stats_command_counts_by_card(app, client):
    other = str(uuid.uuid4())
    post_event(client, type="start", code=None)
    post_event(client, type="found", code="101")
    post_event(client, type="observe_retry", code="101")
    post_event(client, visit=other, type="start", code=None)
    result = app.test_cli_runner().invoke(args=["stats"])
    assert result.exit_code == 0, result.output
    assert "시작 2가족" in result.output
    row = next(line for line in result.output.splitlines() if line.startswith("101"))
    assert row.split()[2:] == ["1", "0", "0", "1"]


def test_init_db_command(app):
    result = app.test_cli_runner().invoke(args=["init-db"])
    assert result.exit_code == 0, result.output
    assert "준비 완료" in result.output


def test_app_refuses_to_start_with_bad_content(tmp_path):
    bad = tmp_path / "tour.yaml"
    bad.write_text("id: hwal\ncards: []\n", encoding="utf-8")
    with pytest.raises(ContentError):
        create_app({"TESTING": True, "DB_MODE": "off", "CONTENT_PATH": str(bad)})
