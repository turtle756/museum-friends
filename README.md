# 부천활박물관 부모 카드

부천활박물관에 온 가족을 위한 모바일 웹서비스입니다. 부모가 입구의 QR로 접속해 유물 사진을 고르면, 설명판 사실을 담은 짧은 이야기와 퀴즈를 카드로 보고 아이에게 들려줍니다. 아이에게는 코팅한 유물 카드 12장을 줍니다.
가톨릭대학교 웹프로그래밍 팀 프로젝트(IA-PBL)이며, 사진 사용 허락 전이라 검색 노출을 막아 두었습니다(noindex, robots.txt).

- 운영 주소: https://museum-friends.vercel.app

## 화면
| 주소 | 내용 |
|---|---|
| `/` | 들어가기 전 안내 → 유물 58점 사진 격자(가나다순, 이름 검색) → 유물 카드(이야기·퀴즈·아이가 더 물어보면) |

내용은 모두 `public/assets/data/stops.json` 한 곳에서 나옵니다. 사실은 현장 사진 속 설명판 원문만 쓰고, 학예사에게 다시 확인할 것은 `verify` 칸에 적습니다.

## 구조
```
public/            부모 앱(HTML·CSS·JS 모듈·사진·카드 그림). Vercel CDN이 바로 내보낸다
content/tour.yaml  이전 앱의 콘텐츠(서버 API가 아직 읽는다)
museum_friends/    Flask: API, 콘텐츠 검사, DB
tests/             pytest(서버·콘텐츠·페이지), node --test(데이터·렌더링·검색·카드 인쇄 배치)
tools/print_cards.mjs  아이 카드 + 입구 QR 인쇄 PDF 만들기
app.py             Vercel과 flask 명령이 찾는 진입점
```

| 주소 | 하는 일 |
|---|---|
| `GET /api/tour` | 투어 콘텐츠. CDN이 5분 보관 |
| `POST /api/events` | 이름 없는 이용 기록 한 건 (방문 번호, 종류, 유물 번호) |
| `GET /health` | 서버·DB 상태. Vercel 크론이 하루 한 번 부른다 |

## 로컬 실행
Python 3.12와 [uv](https://docs.astral.sh/uv/)가 필요합니다.
```bash
uv venv --python 3.12 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements-dev.txt
.venv/Scripts/python -m flask --app app run --port 5055
```
브라우저에서 `http://127.0.0.1:5055` 를 엽니다.

## 테스트
```bash
.venv/Scripts/python -m pytest -q
node --test "tests/js/*.test.mjs"
```
GitHub에 push하거나 PR을 올리면 같은 검사가 자동으로 돕니다(`.github/workflows/ci.yml`).

## 배포 (Vercel + Neon)
1. Vercel 프로젝트 `museum-friends`(함수 리전 icn1 서울)가 있습니다. 지금은 GitHub 자동 배포가 연결되지 않아 서버 담당이 명령줄로 배포합니다.
   `npx vercel@latest deploy --prod` (환경변수 `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` 필요)
   자동 배포를 원하면 Vercel 계정에 GitHub 로그인을 연결한 뒤 프로젝트 Settings, Git에서 이 저장소를 연결합니다.
2. Neon 프로젝트 `museum-friends`(싱가포르 리전)의 pooled 연결 주소가 Vercel 환경변수 `DATABASE_URL` 에 들어 있습니다.
3. 다시 배포한 뒤 `https://주소/health` 가 `{"db": "ok", "status": "ok"}` 인지 확인합니다. 표는 첫 요청 때 자동으로 만들어집니다.
4. 휴대폰 새 시크릿 창에서 첫 화면, 검색, 카드 하나와 퀴즈를 눌러 봅니다(스모크 테스트).

- **배포 권한**: Vercel 무료 요금제는 계정 주인만 배포할 수 있습니다. 팀원은 PR을 올리고, 서버 담당이 main에 합칩니다.
- **되돌리기**: Vercel 대시보드 Deployments에서 이전 정상 배포를 골라 Promote to Production 합니다.
- **DB 없이도 동작**: `DATABASE_URL` 이 없으면 이용 기록만 꺼지고(202 응답) 관람 흐름은 그대로 돕니다.
- **통계 보기**: `DATABASE_URL` 을 환경변수로 넣고 `.venv/Scripts/python -m flask --app app stats`

## 인쇄 (입구 QR + 아이 카드)
```bash
node tools/print_cards.mjs 유물카드_인쇄.pdf
```
A4 PDF가 나옵니다. 1쪽은 입구에 붙일 앱 접속 QR, 2쪽은 빈 쪽, 3쪽부터 카드 앞면과 뒷면이 번갈아 나옵니다(한 쪽에 9장, 실제 크기 63×88mm).
양면 인쇄(긴 쪽 넘김), 배율 100%(실제 크기)로 인쇄한 뒤 카드 둘레를 따라 자르고 코팅합니다. 크롬이나 엣지, 파이썬 `qrcode`가 필요합니다.

## 콘텐츠 운영
- 누가: 콘텐츠 담당 팀원이 GitHub 웹에서 `content/tour.yaml` 을 고쳐 PR을 올립니다.
- 출처와 승인: 카드마다 `source`(이야기 출처), `image_credit`(사진 출처·허락), `checked_by`(확인한 사람의 역할)를 적습니다.
  투어 `status` 를 `확정` 으로 바꾸면 이 세 칸이 빠진 카드는 검사를 통과하지 못합니다.
- 잘못된 콘텐츠는 자동 검사가 PR 단계에서 막고, 서버도 시작하지 않습니다.

## 개인정보
- 받지 않는 것: 이름, 사진, 연락처, 아이의 대답
- 서버에 저장하는 것: 무작위 방문 번호, 이벤트 종류, 유물 번호, 시각
- 휴대폰에만 남는 것: 진행 상황과 아이의 대답. 도감의 "기록 지우기"로 바로 지웁니다.

## 알려진 제한과 다음 작업
- 이야기는 설명판 사실에 상상 이야기를 붙인 것입니다. 숫자가 서로 다른 설명판(예: 대신기전 길이)과 흐리게 찍힌 설명판은 `verify` 칸에 적어 두었고, 학예사 확인이 필요합니다.
- 이용 기록 API는 누구나 부를 수 있어 숫자가 부풀려질 수 있습니다. 통계는 참고용입니다.
- 관리자 화면은 이번 학기 범위가 아닙니다. 콘텐츠는 GitHub로 고칩니다.

## AI 활용
[docs/ai-log.md](docs/ai-log.md)에 목적, 요청, 채택·수정 내용, 검증 방법을 기록합니다.


## 깃허브 연동됐는지 테스트좀 할게용 -태영