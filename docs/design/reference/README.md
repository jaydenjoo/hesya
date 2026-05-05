# Hesya Design Reference

> **출처**: claude.ai/design (Anthropic Labs)
> **수령일**: 2026-05-05 (Jayden 첨부 zip)
> **권위**: 모든 Hesya 페이지 디자인은 본 레퍼런스를 100% 따름. 변경은 새 디자인 시안 수령 시.

## 핵심 토큰 (`tokens.css`)

### 컬러

- 브랜드: `--hesya-peach-50/100/200`, `--hesya-amber-500/600`, `--hesya-navy-900`
- 시맨틱: `--semantic-success/warning/danger/info`
- 중립: `--gray-50/100/300/500/700/800/900`
- Trust: `--trust-rose`, `--share-glow`, `--kverified-gold`

### 타이포

- Display: Fraunces (italic 강조)
- 본문 EN: Source Sans 3
- 본문 KR: Pretendard Variable (`.kr` class — `word-break: keep-all`, `line-height: 1.8`)
- Mono: JetBrains Mono

### Radius / Shadow / Motion

- `--r-sm/md/lg/xl/2xl/full` (8/12/16/20/24/9999)
- `--shadow-1/2/3/4` (2-layer composite)
- `--duration-fast/normal/slow` (120/220/420ms)

## 인박스 (`inbox-app.jsx` + `inbox.css`)

### 레이아웃

- 3-column grid (320px + 1fr + 340px) — `.ix-main`
- TopHeader + Sidebar + 인박스 main

### 컴포넌트

- **ChannelRail** (col 1): 채널 6개 chip + 필터 4개 pill + 검색 + 스레드 리스트
- **ThreadCol** (col 2): ThreadHeader + MessageStream + AIAssist + Composer
- **ContextPanel** (col 3): 고객 정보 + Info/History/Notes/Risk 4탭
- **AIAssist**: AI 답변 준비 헤더 + 톤 검증 pill + draft 박스 + 톤 4탭 (warm/formal/short/friendly) + 액션 3개 (그대로 보내기 / 편집 후 보내기 / 거절하고 직접 작성)
- **MessageBubble**: 원문 + 번역본 + "원문 / 신뢰도 보기" audit 토글
- **Composer**: toolbar (photo/voice/attach/templates) + 단축키 + "내 매장 톤 학습" + 입력란 + 보내기 버튼
- **Shortcuts FAB**: 키보드 단축키 모달

## Hesya 프로젝트 통합 정책

### 단계적 적용 (2026-05-05~)

1. **B-3b** (현재): 디자인 토큰 도입 + AIAssist MVP (단순 draft + 액션 3개) + MessageBubble 번역본 토글. 레이아웃은 기존 2-col 유지.
2. **B-3d** 또는 별 Epic 1B-UI: 인박스 전체 재구성 (3-col + ChannelRail + ContextPanel + 톤 4탭 + FAB)
3. **다른 페이지**: 각 페이지의 jsx + css 파일을 본 레퍼런스에서 매핑하여 적용

### 디자인 일치 검증

- claude.ai/design 출력의 jsx/css와 1:1 매핑 확인
- 글로벌 design-system.md(`~/.claude/skills/design-system.md`) Hard Rules 통과 확인
- 디자인 변경 시 본 디렉토리의 파일을 수정하지 말고 **새 zip을 수령해 전체 교체**

## 파일 인덱스

각 파일은 디자인 시안 1페이지에 대응:

| 파일                                                                   | 페이지                                               |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| `Hesya Inbox.html` + `inbox-app.jsx` + `inbox.css`                     | 통합 인박스 (B-3b 진입 페이지)                       |
| `Hesya Chat.html` + `chat-app.jsx` + `chat.css`                        | 채팅 (인박스 sub)                                    |
| `Hesya Store Dashboard.html`                                           | 스토어 대시보드                                      |
| `Hesya Login.html` + `login-app.jsx` + `login.css`                     | 일반 로그인                                          |
| `Hesya Store Login.html` + `login-store-app.jsx` + `login-store.css`   | 스토어 로그인                                        |
| `Hesya Customers.html` + `customers-app.jsx` + `customers-detail.jsx`  | 고객 관리                                            |
| `Hesya Bookings.html` + `bookings-app.jsx` + `bookings-views.jsx`      | 예약 관리                                            |
| `Hesya Services.html` + `services-app.jsx` + `services-views.jsx`      | 시술/서비스                                          |
| `Hesya Analytics.html` + `analytics-app.jsx` + `analytics-charts*.jsx` | 분석                                                 |
| `Hesya Payment.html` + `payment-app.jsx` + `payment.css`               | 결제                                                 |
| `Hesya MyPage.html` + `mypage-app.jsx` + `mypage.css`                  | 마이페이지                                           |
| `Hesya AI Photo Analysis.html` + `ai-flow-app.jsx` + `ai-flow.css`     | AI 사진 분석                                         |
| `Hesya Booking Schedule.html` + `schedule-app.jsx` + `schedule.css`    | 예약 스케줄                                          |
| `Hesya Customer Landing.html` + `landing.css`                          | 고객 랜딩                                            |
| `Hesya Design System.html` + `tokens.css` + `components.css`           | 디자인 시스템 자체                                   |
| `Hesya Admin *.html` + `admin-*.css`                                   | 관리자 페이지 (KYC/Dashboard/Payments/AI Cost/Login) |
| `Hesya Store Settings.html` + `settings-app.jsx` + `settings.css`      | 스토어 설정                                          |
| `Hesya Store Photos.html` + `store-photos*.jsx` + `store-photos.css`   | 스토어 사진                                          |
| `Hesya Store Detail.html`                                              | 스토어 상세                                          |
| `tokens.css`                                                           | 디자인 토큰 (모든 페이지 공유)                       |
| `components.css`                                                       | 공통 컴포넌트 (모든 페이지 공유)                     |

## 변경 이력

- 2026-05-05: 초기 수령 (claude.ai/design zip), B-3b 진입 시 통합 시작
