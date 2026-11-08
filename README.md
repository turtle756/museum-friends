# 유물 친구 시안 갤러리

부천활박물관에 온 가족을 위한 "부모 큐레이터" 시안 모음입니다. 부모는 휴대폰 카드를 잠깐 보고 아이에게 이야기해 주고, 아이는 휴대폰 대신 종이 활동지를 들고 퀴즈와 도장을 모읍니다.
가톨릭대학교 웹프로그래밍 팀 프로젝트(IA-PBL) 회의용 시안이며, 사진 사용 허락 전이라 검색 노출을 막아 두었습니다(noindex, robots.txt).

- 운영 주소: https://museum-friends.vercel.app
- 이전 시험용 앱(유물 친구 찾기)은 git 태그 `v0-prototype` 에 보존되어 있습니다.

## 갤러리 구성
| 페이지 | 내용 |
|---|---|
| `/` | 컨셉, 회의 진행 순서, 현장 조사 결과, 팔레트 |
| `/strategies.html` | 큰 전략 A~F (누가 무엇을 들고 다니는가) |
| `/cards.html` | 부모 카드 C1~C8 (휴대폰 틀 안에서 눌러 보기) |
| `/sheets.html`, `/sheet.html?v=S1` | 아이 활동지 S1~S8 (A4 인쇄, `&r=R2` 로 동선에 맞춘 판) |
| `/stamps.html`, `/themes.html`, `/styles.html`, `/routes.html` | 도장 방식, 이야기 틀, 그림 스타일, 동선 |
| `/compare.html` | 전략 비교표 |
| `/proto.html?s=C&c=C8` | 처음부터 끝까지 흐름 체험 (새로고침해도 이어짐) |

내용은 모두 `public/assets/data/stops.json` 한 곳에서 나옵니다. 사실은 현장 사진 속 설명판 원문만 쓰고, 다시 확인할 것은 `verify` 칸에 적습니다.

## 구조
```
public/            시안 갤러리(HTML·CSS·JS 모듈·그림). Vercel CDN이 바로 내보낸다
content/tour.yaml  이전 앱의 콘텐츠(서버 API가 아직 읽는다)
museum_friends/    Flask: API, 콘텐츠 검사, DB
tests/             pytest(서버·콘텐츠·페이지), node --test(시안 데이터·렌더링)
tools/make_qr.py   QR 인쇄 페이지 만들기
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
4. 휴대폰 새 시크릿 창에서 갤러리 홈과 흐름 체험을 한 번 눌러 봅니다(스모크 테스트).

- **배포 권한**: Vercel 무료 요금제는 계정 주인만 배포할 수 있습니다. 팀원은 PR을 올리고, 서버 담당이 main에 합칩니다.
- **되돌리기**: Vercel 대시보드 Deployments에서 이전 정상 배포를 골라 Promote to Production 합니다.
- **DB 없이도 동작**: `DATABASE_URL` 이 없으면 이용 기록만 꺼지고(202 응답) 관람 흐름은 그대로 돕니다.
- **통계 보기**: `DATABASE_URL` 을 환경변수로 넣고 `.venv/Scripts/python -m flask --app app stats`

## QR 인쇄
```bash
.venv/Scripts/python tools/make_qr.py https://배포주소.vercel.app
```
`qr/print.html` 을 열어 A4로 인쇄합니다. 유물 QR에는 `https://주소/?a=번호` 가 들어 있어서, 휴대폰 기본 카메라로 찍어도 같은 화면으로 들어옵니다.

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
- 지금 카드 3장은 흐름 시험용 예시입니다. 그림과 관찰 질문의 정답은 예시 그림 기준입니다. 현장 방문 뒤 실제 유물 사진·질문으로 바꿉니다.
- 카카오톡·네이버 앱 안에서 연 브라우저는 카메라가 막힐 수 있습니다. 이때는 번호 입력을 씁니다. 현장 휴대폰으로 시험이 필요합니다.
- 이용 기록 API는 누구나 부를 수 있어 숫자가 부풀려질 수 있습니다. 통계는 참고용입니다.
- 관리자 화면은 이번 학기 범위가 아닙니다. 콘텐츠는 GitHub로 고칩니다.

## AI 활용
[docs/ai-log.md](docs/ai-log.md)에 목적, 요청, 채택·수정 내용, 검증 방법을 기록합니다.


## 깃허브 연동됐는지 테스트좀 할게용 -태영