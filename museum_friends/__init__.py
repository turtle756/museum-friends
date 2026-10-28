"""유물 친구 찾기 Flask 앱."""
from __future__ import annotations

import os
from pathlib import Path

from flask import Flask, send_from_directory

from . import db
from .api import bp as api_bp
from .content import load_tour

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT / "public"
CONTENT_PATH = ROOT / "content" / "tour.yaml"


def create_app(test_config: dict | None = None) -> Flask:
    # Vercel은 public/ 을 CDN으로 직접 내보낸다. 로컬 Flask도 같은 주소로 내보내도록 맞춘다.
    app = Flask(__name__, static_folder=str(PUBLIC_DIR), static_url_path="")
    app.config.update(
        CONTENT_PATH=str(CONTENT_PATH),
        PUBLIC_DIR=str(PUBLIC_DIR),
        DATABASE_URL=os.environ.get("DATABASE_URL", "").strip(),
        SQLITE_PATH=str(Path(app.instance_path) / "local.db"),
        ON_VERCEL=bool(os.environ.get("VERCEL")),
        MAX_CONTENT_LENGTH=4 * 1024,
    )
    if test_config:
        app.config.update(test_config)

    # 콘텐츠가 잘못되면 여기서 멈춘다. 잘못된 질문으로 서비스하지 않는다.
    app.extensions["tour"] = load_tour(app.config["CONTENT_PATH"], app.config["PUBLIC_DIR"])
    db.init_app(app)
    app.register_blueprint(api_bp)

    @app.get("/")
    def index():
        return send_from_directory(app.config["PUBLIC_DIR"], "index.html")

    return app
