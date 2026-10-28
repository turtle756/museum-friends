"""API 계약 (docs/plans 설계 문서 5장과 같다)

GET  /api/tour    투어 콘텐츠
POST /api/events  이름 없는 이용 기록 한 건
GET  /health      서버와 DB 상태
"""
from __future__ import annotations

import re

from flask import Blueprint, current_app, jsonify, request

from . import db

bp = Blueprint("api", __name__)

EVENT_TYPES = {"start", "found", "wrong_code", "observe_retry", "observe_ok", "complete"}
CARD_EVENTS = {"found", "wrong_code", "observe_retry", "observe_ok"}
VISIT_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")


def _error(message: str, status: int = 400):
    return jsonify(error=message), status


@bp.get("/api/tour")
def get_tour():
    response = jsonify(current_app.extensions["tour"]["public"])
    # 폰은 1분, Vercel CDN은 5분 보관한다. 그 뒤에도 하루 동안은 옛 내용을 먼저 주고 뒤에서 새로 받는다.
    response.headers["Cache-Control"] = "public, max-age=60, s-maxage=300, stale-while-revalidate=86400"
    return response


@bp.post("/api/events")
def post_event():
    data = request.get_json(force=True, silent=True)
    if not isinstance(data, dict):
        return _error("JSON 객체가 필요합니다")
    tour = current_app.extensions["tour"]
    if data.get("tour") != tour["id"]:
        return _error("알 수 없는 투어입니다")
    visit = data.get("visit")
    if not isinstance(visit, str) or not VISIT_RE.match(visit):
        return _error("visit 형식이 올바르지 않습니다")
    type_ = data.get("type")
    if type_ not in EVENT_TYPES:
        return _error("알 수 없는 이벤트입니다")
    code = data.get("code")
    if type_ in CARD_EVENTS:
        if code not in tour["codes"]:
            return _error("알 수 없는 유물 번호입니다")
    elif code is not None:
        return _error("이 이벤트에는 유물 번호를 넣지 않습니다")

    if db.mode() == "off":
        return "", 202
    try:
        db.insert_event(tour["id"], visit, type_, code)
    except Exception:
        current_app.logger.exception("이벤트 저장 실패")
        return _error("잠시 후 다시 시도해 주세요", 503)
    return "", 204


@bp.get("/health")
def health():
    status = db.ping()
    ok = status != "error"
    return jsonify(status="ok" if ok else "error", db=status), (200 if ok else 503)


@bp.app_errorhandler(413)
def too_large(_error_obj):
    return _error("요청이 너무 큽니다", 413)
