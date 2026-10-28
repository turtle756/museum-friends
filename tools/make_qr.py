"""유물 옆에 붙일 QR 인쇄 페이지를 만든다.

사용법 (저장소 폴더에서):
    .venv/Scripts/python tools/make_qr.py https://배포주소.vercel.app

결과로 나온 qr/print.html 을 브라우저로 열어 A4로 인쇄한다. 입구용 1장과 유물마다 1장씩 나온다.
"""
from __future__ import annotations

import argparse
import html
import sys
from pathlib import Path

import qrcode
import qrcode.image.svg

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from museum_friends.content import load_tour  # noqa: E402

PAGE = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>{title} QR 인쇄</title>
<style>
  @page {{ size: A4; margin: 12mm; }}
  body {{ margin: 0; font-family: system-ui, "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; color: #2b1d14; }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }}
  .sign {{ border: 2px solid #2b1d14; border-radius: 6mm; padding: 6mm; text-align: center; break-inside: avoid; }}
  .sign svg {{ width: 55mm; height: 55mm; }}
  .big {{ margin: 2mm 0 0; font-size: 28pt; font-weight: 800; letter-spacing: 4pt; }}
  .small {{ margin: 1mm 0 0; font-size: 11pt; }}
</style>
</head>
<body>
<div class="grid">
{signs}
</div>
</body>
</html>
"""


def qr_svg(data: str) -> str:
    image = qrcode.make(data, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=2)
    return image.to_string(encoding="unicode")


def sign(data: str, big: str, small: str) -> str:
    return (
        f'<div class="sign">{qr_svg(data)}'
        f'<p class="big">{html.escape(big)}</p><p class="small">{html.escape(small)}</p></div>'
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="유물 QR 인쇄 페이지 만들기")
    parser.add_argument("base_url", help="배포 주소. 예: https://museum-friends.vercel.app")
    parser.add_argument("--out", default=str(ROOT / "qr" / "print.html"), help="결과 파일 경로")
    args = parser.parse_args()

    base = args.base_url.rstrip("/")
    if not base.startswith("https://"):
        parser.error("https:// 로 시작하는 주소를 넣어 주세요. 화면 안 카메라는 https 에서만 켜집니다")

    tour = load_tour(ROOT / "content" / "tour.yaml", ROOT / "public")["public"]
    signs = [sign(f"{base}/", "시작", f"{tour['title']} · 입구")]
    for card in tour["cards"]:
        signs.append(sign(f"{base}/?a={card['code']}", card["code"], f"유물 친구 QR · {card['name']}"))

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(PAGE.format(title=html.escape(tour["title"]), signs="\n".join(signs)), encoding="utf-8")
    print(f"만들었어요: {out}")


if __name__ == "__main__":
    main()
