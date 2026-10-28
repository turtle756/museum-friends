"""이벤트 저장소.

- DATABASE_URL 이 있으면 Postgres(Neon)를 쓴다.
- Vercel 위인데 DATABASE_URL 이 없으면 저장을 끈다. Vercel 파일은 사라지기 때문이다.
- 그 밖(내 컴퓨터)에서는 instance/local.db SQLite 파일을 쓴다.

아이의 대답이나 이름은 여기에 오지 않는다. 무작위 방문 번호와 이벤트 종류, 유물 번호만 저장한다.
"""
from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path

import click
from flask import Flask, current_app

SCHEMA = {
    "sqlite": """
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            tour TEXT NOT NULL,
            visit TEXT NOT NULL,
            type TEXT NOT NULL,
            code TEXT
        )""",
    "postgres": """
        CREATE TABLE IF NOT EXISTS events (
            id BIGSERIAL PRIMARY KEY,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            tour TEXT NOT NULL,
            visit TEXT NOT NULL,
            type TEXT NOT NULL,
            code TEXT
        )""",
}

# 프로세스마다 표를 한 번만 만든다. 서버리스는 깨어날 때마다 새 프로세스라 가볍게 다시 확인한다.
_schema_ready: set[str] = set()


def resolve_mode(config) -> str:
    if config.get("DB_MODE"):
        return config["DB_MODE"]
    if config.get("DATABASE_URL"):
        return "postgres"
    if config.get("ON_VERCEL"):
        return "off"
    return "sqlite"


def mode() -> str:
    return current_app.config["DB_MODE"]


def _target() -> str:
    m = mode()
    return current_app.config["DATABASE_URL"] if m == "postgres" else current_app.config["SQLITE_PATH"]


@contextmanager
def connect():
    m = mode()
    if m == "postgres":
        import psycopg

        # Neon 풀러(PgBouncer)를 거치므로 prepared statement 를 쓰지 않는다.
        conn = psycopg.connect(
            current_app.config["DATABASE_URL"], autocommit=True, connect_timeout=5, prepare_threshold=None
        )
        try:
            yield conn
        finally:
            conn.close()
    elif m == "sqlite":
        path = Path(current_app.config["SQLITE_PATH"])
        path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(path)
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()
    else:
        raise RuntimeError("DB가 꺼져 있습니다")


def execute(sql: str, params: tuple = ()) -> list[tuple]:
    if mode() == "sqlite":
        sql = sql.replace("%s", "?")
    with connect() as conn:
        cur = conn.execute(sql, params)
        return cur.fetchall() if cur.description else []


def ensure_schema() -> None:
    key = f"{mode()}:{_target()}"
    if key in _schema_ready:
        return
    execute(SCHEMA[mode()])
    _schema_ready.add(key)


def insert_event(tour: str, visit: str, type_: str, code: str | None) -> None:
    ensure_schema()
    execute(
        "INSERT INTO events (tour, visit, type, code) VALUES (%s, %s, %s, %s)",
        (tour, visit, type_, code),
    )


def ping() -> str:
    if mode() == "off":
        return "off"
    try:
        ensure_schema()
        execute("SELECT 1")
        return "ok"
    except Exception:
        current_app.logger.exception("DB 연결 확인 실패")
        return "error"


def stats(tour: str) -> dict:
    ensure_schema()
    by_card = execute(
        "SELECT code, type, COUNT(*) FROM events WHERE tour = %s AND code IS NOT NULL "
        "GROUP BY code, type ORDER BY code, type",
        (tour,),
    )
    visits = execute(
        "SELECT type, COUNT(DISTINCT visit) FROM events WHERE tour = %s AND type IN ('start', 'complete') "
        "GROUP BY type",
        (tour,),
    )
    cards: dict[str, dict[str, int]] = {}
    for code, type_, count in by_card:
        cards.setdefault(code, {})[type_] = int(count)
    return {"visits": {t: int(c) for t, c in visits}, "cards": cards}


def init_app(app: Flask) -> None:
    app.config["DB_MODE"] = resolve_mode(app.config)

    @app.cli.command("init-db")
    def init_db_command():
        """이벤트 표를 만든다. 이미 있으면 그대로 둔다."""
        if mode() == "off":
            raise click.ClickException("DATABASE_URL 이 없어 DB가 꺼져 있습니다")
        ensure_schema()
        click.echo(f"events 표 준비 완료 ({mode()})")

    @app.cli.command("stats")
    def stats_command():
        """유물별로 찾기·다시 보기·성공 횟수를 보여 준다."""
        if mode() == "off":
            raise click.ClickException("DATABASE_URL 이 없어 DB가 꺼져 있습니다")
        tour = current_app.extensions["tour"]
        result = stats(tour["id"])
        click.echo(f"투어 {tour['id']} · 시작 {result['visits'].get('start', 0)}가족 · 완주 {result['visits'].get('complete', 0)}가족")
        click.echo("번호  이름            찾음  잘못찾음  관찰성공  다시보기")
        for card in tour["public"]["cards"]:
            c = result["cards"].get(card["code"], {})
            click.echo(
                f"{card['code']}   {card['name']:<12}  {c.get('found', 0):>4}  {c.get('wrong_code', 0):>8}"
                f"  {c.get('observe_ok', 0):>8}  {c.get('observe_retry', 0):>8}"
            )
