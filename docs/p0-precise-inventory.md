# P0 8 페이지 정밀 Inventory — Design Completion Epic Phase 1 (2026-05-15)

> **목적**: `docs/design-completion-epic-plan.md` Phase 1 정밀 inventory 결과. 4 subagent 병렬 위임으로 P0 8 페이지를 reference 디자인(`docs/design/reference/`)과 현재 코드 1:1 비교.
> **활용**: 다음 세션부터 페이지 batch 진행 시 본 doc 참조 → 누락 elements + 작업 순서 + 시간 추정 정확.
> **방법론**: 각 페이지 reference HTML/JSX/CSS 정독 + 현재 코드 정독 + 5 항목 비교 (일치 / 누락 / 차이점 / 데이터 wire / a11y·반응형·i18n).

---

## 종합 결과 — 정밀 일치도 vs Rough 추정

| 페이지                       | Rough (Phase 0) | **정밀 (Phase 1)** | 변화 | 작업 시간 정정    | 핵심 누락 1개                                                                 |
| ---------------------------- | --------------- | ------------------ | ---- | ----------------- | ----------------------------------------------------------------------------- |
| C2 Customer Chat             | 60% (C)         | **68%**            | +8   | ~4.25h            | Empty state (3 opener pills)                                                  |
| O9 Owner Store Login         | 75% (B)         | **62%**            | -13  | 5~6h              | floating-label 이메일·비번 입력                                               |
| C3 Customer MyPage           | 80% (B)         | **68%**            | -12  | ~9.5h             | Saved card rating/price/area (DAL 확장)                                       |
| C4 Customer Sign-in          | 75% (B)         | **45%**            | -30  | 9~12h             | Hesya wordmark + ink-motif SVG + 2-step flow                                  |
| C1 Customer Landing          | 85% (B)         | **72%**            | -13  | ~14h              | Tab bar (bottom nav) + lang-pill sheet                                        |
| C5 Customer Store Detail     | 65% (C)         | **52%**            | -13  | ~15.25h           | Info block (평점·언어 pills·설명) + Safety sheets                             |
| O2 Owner Inbox               | 75% (B)         | **73%**            | -2   | 3~4d (~28h)       | bubble audit 패널 + thread tags + keyboard shortcuts                          |
| **O1 Owner Store Dashboard** | 30% (D)         | **22%**            | -8   | **10~12d (~80h)** | 위젯 9종 중 6개 완전 미구현 (Timeline / AIInsight / Reviews / Toast stack 등) |

**P0 8 페이지 총 작업 시간**: ~165h = **약 4~5주** (단일 인력 기준).

⚠️ **모든 페이지 정밀 측정 후 일치도 하향 정정**. Rough 측정(line ratio + PR history)이 실제 reference 정합도를 과대 추정하는 경향 — UI element 수 단위로 측정 시 격차 큼.

---

## 페이지별 핵심 누락 + 권장 순서

### C2 Customer Chat — 68% / ~4.25h (가장 빠른 wins)

**핵심 누락 (4개)**:

1. **Empty state** — SVG 말풍선 일러스트 + opener pills 3개 + 토글 (1.5h)
2. **Time stamps** — 메시지 그룹 사이 13:48 등 (0.5h)
3. **Bubble entry animation** — `msgUp` opacity/translateY (0.5h)
4. **Audit overlay a11y** — `role="dialog"` `aria-modal` (0.25h)

**권장**: 본 페이지가 **가장 빠른 wins**. 단일 세션 5h 작업 + PR 1개 + 1 batch cadence 정착.

---

### O9 Owner Store Login — 62% / 5~6h

**핵심 누락 (5개)**:

1. **floating-label 이메일·비번 입력** — `sl-field` 패턴 + CSS + height 56px (2h)
2. **비밀번호 reveal 버튼** — sl-field-reveal 토글 (30분)
3. **자동 로그인 체크박스 + 비밀번호 찾기 row** — sl-checkbox + 비번찾기 placeholder (45분)
4. **CTA 버튼 amber 교체** — 현재 navy → reference amber-500 + → arrow (30분)
5. **i18n 연결** — 에러 메시지 등 한국어 하드코딩 다수 (1h, Owner 한국어 전용 의도면 skip 가능)

**권장**: C2 다음 또는 평행. Owner 영역의 brand consistency 임팩트 큼.

---

### C3 Customer MyPage — 68% / ~9.5h

**핵심 누락 (12개, DAL 확장 포함)**:

1. **h1 name amber 강조** — `<em>` 색상 (0.25h, 임팩트 큼)
2. **Header peach-100 bg card** + border-bottom-radius 24px (0.5h)
3. **Settings cog button** (0.5h)
4. **Tab bar style** → pill → underline + alert badge amber-600 (1h)
5. **Saved card heart icon + area + rating/price** — **DAL 확장 (SavedStoreRow에 rating/price/area)** (2.5h)
6. **Past tab 별점 표시** — **DAL 확장 (CustomerBookingRow에 rating)** (1.5h)
7. **Tab scroll 독립 스크롤** (1h)
8. **"Tomorrow at _14:00_" italic heading** (0.5h)
   9~12. 나머지 minor (rv-note italic / Skip all reviews / "Book again" ghost-btn amber / Review textarea bg) — 각 0.25h

**Prerequisite**: DAL 확장 2건 (BookingRow rating + SavedStoreRow rating/price/area). schema 변경 필요 가능성.

---

### C4 Customer Sign-in — 45% / 9~12h ⚠️ 최저 일치도

**핵심 누락 (9개)**:

1. **Hesya wordmark + ink-motif SVG + 태그라인** (2.5h, 가장 임팩트 큼)
2. **iPhone notch DOM** (20분)
3. **2-step flow 리팩터** — 현재 3 폼 stack → social first + "Use email instead" 전환 (3h)
4. **버튼 border-radius 14px 통일** — 현재 rounded-full → reference 14px (30분)
5. **lang-switcher 드롭다운** (1.5h)
6. **Apple OAuth UI mock** (45분)
7. **Passkey UI mock** (30분)
8. **Compliance + GDPR/K-PIPA 배지 + footer** (45분)
9. **CustomerFrame 하단 radial-gradient** 추가 (15분)

⚠️ **PR #194 (OAuth fallback) 머지 후에도 일치도 45%**. reference의 visual signature(wordmark + ink-motif) 미구현이 가장 큰 격차.

---

### C1 Customer Landing — 72% / ~14h

**핵심 누락 (10개)**:

1. **Mood/Region chips → horizontal scroll** — 현재 wrap, 모바일 UX 차단선 (0.5h)
2. **Sticky topbar + blur** — backdrop-filter (0.5h)
3. **Greeting stack opacity crossfade** — 현재 텍스트 뚝뚝 바뀜 (0.5h)
4. **HeroMotif SVG + animated underline** (1h)
5. **Search input mic button** — peach circle (0.5h)
6. **lang-pill + language bottom sheet** — topbar 우측, 6 locale (3.5h)
7. **UGC "Show more" dashed card** (0.5h)
8. **verifiedBadge 조건 적용** — 현재 항상 표시 (0.25h)
9. **Tab bar (bottom nav)** — Search/Bookings/Chat/MyPage 4탭 (3h, CustomerFrame 구조 변경)
10. **"Loved by travelers from your country"** horizontal scroll 섹션 (3h)

---

### C5 Customer Store Detail — 52% / ~15.25h

**핵심 누락 (15개)**:

1. **Info block 완성** — 평점+리뷰수+거리 meta row + 언어 pills row + 설명 3줄 truncate (2h)
2. **TabServices 리치 카드** — 썸네일 + 카테고리 + 언어태그 + 선택 highlight + 환산가격 (2h)
3. **HeroGallery 높이 375px + overlay + glass 버튼/언어 pill** (1h)
4. **Info block → Hero 슬라이드업 overlap** (margin-top -10px + rounded-top) (0.5h)
5. **TabStylists 2컬럼 그리드** — 현재 세로 list (1.5h)
6. **Safety chip → bottom sheet 4종** — female-friendly 신뢰 신호 (3h)
7. **TabReviews 필터 chip + 번역 아코디언** (1.5h)
8. **Allergy/Safety disclosure 섹션** — 3개 아코디언 (2h)
9. **BottomActionBar 서비스 선택 연동** (1h)
   10~15. minor (StickyMiniHeader back+avatar+별점 / NEW 배지 / fadeUpD / Info tab 지도+전화+접근성 등 합 2h)

**데이터 prerequisite**: 평점/리뷰수 (Phase ζ baseline), 거리/staff 국적 breakdown (schema 확장).

---

### O2 Owner Inbox — 73% / 3~4d (~28h)

**핵심 누락 (15개)**:

1. **ThreadItem 태그 3종** — AI 대기/환불/완료(✓) — thread list 시각 완성도 최대 효과 (3h)
2. **MessageBubble bubble audit 패널** — 원문/신뢰도 토글 (5h, 핵심 차별화)
3. **ThreadHeader action 버튼 3종** — 처리 완료/VIP/더보기 (4h)
4. **ThreadItem 국적 flag + 원어 preview 2번째 줄** — nationality DAL wire 선행 (5h)
5. **Floating keyboard shortcut FAB + modal** — 11개 단축키 (4h)
6. **실제 keyboard binding** — J/K/R/A/E/M/✓/1-9/⌘↵/⌘F/? (6h)
7. **Day separator** + ContextPanel 헤더 원어 이름/국가 (3h)
8. **ContextPanel Risk 탭** — 별도 Epic 1C scope (1d)
   9~15. minor (Notes 카드 목록 / VIP star / urgent dot / Composer 1-9 단축키 / animations 등)

**i18n 범위**: Inbox는 사장 전용 한국어 (의도적 결정), 6 locale 불필요.

---

### O1 Owner Store Dashboard — 22% / 10~12d (~80h) ⚠️ **가장 큰 차단선**

**위젯 9종 누락 분류**:

| 위젯                                 | 작업                                                                     | 시간   | Prerequisite                       |
| ------------------------------------ | ------------------------------------------------------------------------ | ------ | ---------------------------------- |
| W10 환불 Alert 배너                  | dispute.active>0 alert                                                   | **1d** | ✅ `getDisputeLoad` 이미 있음      |
| W13 Greeting subtitle 숫자 wire      | 오늘 예약수 + 새 후기 (실시간)                                           | 1d     | bookings + reviews DAL             |
| W3 통합 인박스 채널별 분해           | 채널별 unread 집계                                                       | 1d     | conversations DAL 확장             |
| W7 오늘의 일정 Timeline              | 09~21시 가로 timeline + 2 row track + hover popover + 외국인/내국인 토글 | **3d** | bookings 오늘치 + staff + customer |
| W2 주간 GMV 타일                     | 전주 비교 % + 7-bar chart                                                | 2d     | 주간 집계 DAL                      |
| W9 최근 후기 3 cards                 | flag + 별점 + 다국어 + AI 답변 초안                                      | 2d     | reviews 테이블 (Phase ζ)           |
| W6 K-Verified Gold Tier 타일         | ribbon + tier + 재검증 날짜                                              | 1.5d   | kyc schema 확장 (tier + renewal)   |
| W4 국적 도넛 → 독립 대형 타일        | DistributionPie 재활용 + flag emoji + 한국어 라벨                        | 1d     | (현재 DistributionPie 있음)        |
| W1 오늘의 예약 타일                  | mini avatar flag + sparkline 12바 + 다음 시술                            | **3d** | nationality + 시간대별 집계        |
| W11 알림 Toast stack                 | 4종 toast + sketch SVG + dismiss                                         | 2d     | notifications 파이프라인           |
| W8 AI 인사이트 패널                  | Claude API 인사이트 생성 + 승인/수정/거절                                | 2d     | LLM API 파이프라인                 |
| W5 AI 응답 정확도 타일               | 원형 progress + 처리 메시지 수                                           | 2d     | AI 처리 통계 집계                  |
| W12 우선순위 보기 버튼 + 검색바·bell | shell UI                                                                 | 1d     | (별도 shell 작업)                  |

**진행 권장 순서 (1~4단계만 완료해도 22% → 60%+ 도달 가능)**:

```
주 1: W10 환불 Alert (1d) + W13 Greeting 숫자 (1d) + W3 채널별 inbox (1d) ← 가장 저비용 + 최대 효과
주 2: W7 Timeline (3d) ← 가장 시각적 차이 큰 위젯
주 3: W2 주간 GMV (2d) + W9 최근 후기 (2d)
주 4: W6 K-Verified Gold (1.5d) + W4 국적 대형 타일 (1d)
주 5~6: W1 오늘 예약 + W11 알림 toast + W8 AI 인사이트 + W5 정확도 (각 2~3d, 데이터 prerequisite 충족 후)
```

---

## 발견 인사이트 (Phase 1)

### 1. Rough → 정밀 일치도 평균 -12% 하향

모든 페이지가 rough(line ratio + PR history) 측정보다 실제 element 비교 시 낮게 나옴. 즉 **PROGRESS L-082 자기평가 정신 적용 시 line ratio 기반 평가는 +10~15% 과대 추정 경향**. 향후 시연 % 평가는 element 단위 측정 권장.

### 2. 작업 시간 총량은 Rough 추정과 거의 일치

P0 합계 추정:

- Phase 0 rough: 17~25일 = ~136~200h
- Phase 1 정밀: ~165h
  → **rough가 정확한 총량 시그널 — 단지 페이지별 분배는 달라짐**.

### 3. O1 Owner Dashboard가 단독 P0 분량 절반

전체 165h 중 80h(48%)가 O1. **Dashboard 1개 단독으로 2~3 세션 분할 권장** (1~4단계 → 5~6단계 → 7단계).

### 4. C4 Customer Sign-in 45% — PR #194 후에도 최저

PR #194(OAuth fallback)는 **인증 경로 확장**이고 reference의 **visual signature**(wordmark + ink-motif)는 별개. 두 차원 직교. 다음 batch에서 visual signature 우선.

### 5. 데이터 prerequisite vs visual

여러 위젯이 데이터 prerequisite (예: O2 nationality, O1 reviews/notifications/AI 통계, C3 SavedStore rating). **mock fixtures 활용으로 시각 완성 후 베타 매장 매칭 시 실 데이터 swap**이 PROGRESS의 Sprint 2 mock-first 정책과 일치.

---

## 다음 세션 시작점

**권장: C2 Customer Chat (4.25h, 가장 빠른 wins, cadence 정착용)**

본 세션 34 패턴 차용:

1. Plan v1 (누락 4 elements 명확) + Jayden 승인
2. 코드 작업 (empty state + time stamps + animations + audit a11y)
3. CI dispatch + main sanity
4. PROGRESS + L-082 % 갱신 (68% → 95%+ 목표)
5. 머지 → 다음 페이지 (O9 또는 C3)

**대안: O9 Owner Store Login (5~6h)** — Owner 영역 brand consistency 임팩트 큼.

C5 / C1 / O1은 큰 페이지라 단일 세션 부분 완성 위험 — fast track 후순위.

---

## 참조

- 본 inventory subagent 4개 결과 (~600 line per subagent, total ~2400 line)
- `docs/design-completion-epic-plan.md` — 전체 24 페이지 plan
- `docs/design/reference/` 80 files
- 본 세션 머지 4 PR + docs 시점 baseline (commit `df014d6` main)
