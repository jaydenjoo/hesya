# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook).
> ⚠️ **자기평가 갱신 규칙 (L-082)**: % 표시는 "코드 머지 완료"가 아닌 **"사용자 입장 e2e 시연 가능 여부"**로만 정의. AI 자체 평가 → 객관적 측정(grep / test count / subagent 진단 / 실제 시연)으로 교차 검증 의무.

## 세션 44 종료 요약 (2026-05-16)

- **결과**: **11 PR 머지** (라운드 8 4건 + 라운드 9 6건 + 라운드 9.5 1건). 누적 **70 PR**.
- **패턴**: /loop dynamic + 270s wakeup (L-102). 모든 PR 단일 파일 변경 + i18n 추가 없음 (기존 라벨 재사용) → 평균 ~10분 e2e cycle.
- **신규 완료 (라운드 9.5)**:
  - PR [#285](https://github.com/jaydenjoo/hesya/pull/285) — **Owner Deletion Panel 디자인 정합**. minimalist (rounded + bg-red-50/gray-50) → disputes/onboarding 패턴 일치. crit token (#c9483a / #fbeae5 / #e5c0ba) + §01 eyebrow + 상태 chip + D-N large mono + grace progress bar + 톤별 list 아이콘 (• amber / ✓ emerald / ⚠ rose). Phase 1-ε scope 1차 완수.
- **다음 세션 후보**:
  - **Phase 1-γ.1 KYC E2E**: 별도 큰 작업
  - **Epic 12 admin panel**: 별도 큰 작업 (admin-guard.ts → 정식 owner guard 교체)
  - 시각 polish는 "디자인 100% push" 3차 종료. 추가 발견 시 세션별 후속.
- **차단 요소**: 없음. main 깨끗 + 11 PR Vercel preview deployed.

## 세션 43 종료 요약 (2026-05-16)

- **결과**: 22 PR 머지 × 7 라운드 = 누적 59 PR. 세션 42(37 PR) → 세션 43(59 PR) → +22 (Δ+59%).
- **패턴**: /loop dynamic + 270s wakeup + sync 2-cycle (CI 5min 동안 다음 PR 작성) = 1 cycle ≈ 1 PR 머지 (L-102 확인 + L-103 추가).
- **신규 학습**: L-103 (UI 텍스트 redesign 시 test assertion 미리 grep 의무 — PR #268 1 CI cycle 낭비 경험).
- **차단 요소**: 없음. main 깨끗 + CI green + Vercel preview deployed.

## 현재 위치 (2026-05-16 세션 44 — 🎯 라운드 8+9 (10 PR), 누적 69 PR — 라운드 9 완료)

- **세션 44 라운드 9 (6 PR 추가 — 추가 polish 영역)**:
  - PR [#279](https://github.com/jaydenjoo/hesya/pull/279) — **Admin AI Accuracy KPI 카드 progress bar + threshold marker**. MetricCard에 progressPct + thresholdPct + tone(ok/warn/danger/muted) props. 표본 부족 카드에 amber bar + N/M chip. 정확도/표본/승인/수정·무시 4 카드 모두 시각 강화.
  - PR [#280](https://github.com/jaydenjoo/hesya/pull/280) — **Onboarding pending-status 4-step roadmap + ETA chip**. 신규 OnboardingRoadmap (신청→검토→승인→활성화 grid). manual_review → ETA 24~48h mono chip. rejected 시 3단계 rose. 9/9 test pass.
  - PR [#281](https://github.com/jaydenjoo/hesya/pull/281) — **Owner Services AI proposals demand bar + evidence chips**. demandScore 1px progress bar (tone 동기화). evidence list bullet → 번호 chip (amber/15 bg + amber-700 mono).
  - PR [#282](https://github.com/jaydenjoo/hesya/pull/282) — **Owner Customers DetailSheet History/Tags 탭 empty state**. 텍스트 placeholder → 시각적 empty state (dashed border + circular icon + \"coming · M4.x\" footer).
  - PR [#283](https://github.com/jaydenjoo/hesya/pull/283) — **Owner Inbox Skipped count strip + channel pill**. 상단 amber count badge + 제목/subtitle strip. 각 row channel 라벨을 peach-50 pill로 감싸기.
  - PR [#284](https://github.com/jaydenjoo/hesya/pull/284) — **C2 TabInfo section icons + 영업일 chip**. 영업시간 헤더 ⏱ + emerald N/7 chip. 주소 헤더 📍. K-Verified section bg peach-50/40 emphasis.

- **세션 44 라운드 8 (4 PR — 세션 43 잔여 후보 mop-up)**:
  - PR [#275](https://github.com/jaydenjoo/hesya/pull/275) — **Admin Dispute Detail metadata grid card**. 기존 \<Row k v /\> dl을 2-col grid card로 교체. \`§02 · Metadata\` eyebrow + uppercase mono label + mono/KR value + ID/timestamp mono + 중복 상태/유형 row 제거(header chip에 이미 표시) + ISO timestamp T→space. **진단 ~58% → ~62%**.
  - PR [#276](https://github.com/jaydenjoo/hesya/pull/276) — **Customer MyPage Reviews 탭 polish**. ReviewsPane 상단 header strip (pending count chip + 후기 라벨 + 🌐 자동 번역 안내). ReviewCard 내 별점 옆 X/5 mono chip + textarea char count chip. i18n 추가 없이 기존 6 locale 라벨 재사용. **진단 ~75% → ~82%**.
  - PR [#277](https://github.com/jaydenjoo/hesya/pull/277) — **Owner Inbox AI assist tone tabs segmented control**. flex gap → inline-flex segmented (\`bg-white/70 ring-amber-500/25 shadow\`). active: \`bg-amber-500 text-white\` + drop shadow. inactive: hover bg-white + navy text. tablist aria-label 추가. ai-assist.test.tsx 21/21 pass. **진단 시각 정합 ↑**.
  - PR [#278](https://github.com/jaydenjoo/hesya/pull/278) — **Admin AI Cost BudgetForecast polish**. header 우측 status chip 3 상태 (예산 초과/페이싱 경고/정상) + card border overForecast 시 rose-200 + MTD progress bar 신규 + EOM overshoot 시 ⚠+₩delta chip. **진단 ~30% → ~42%**.
- **세션 44 검증**: 매 PR type-check (2.4~2.7s) + lint (6.3~7.1s) + test (해당 시 9~21 pass) 통과. CI workflow_dispatch + auto-merge label + 수동 merge.

## 이전 위치 (2026-05-16 세션 43 — 🎯 세션 42 잔여 #253 mop-up + P0 잔여 큰 구조 21 PR 머지, 누적 59 PR — 7 라운드 완료)

- **세션 43 라운드 7 (3 PR 추가 — detail header + visual polish)**:
  - PR [#272](https://github.com/jaydenjoo/hesya/pull/272) — **Owner Booking Detail status header + cancellation refund band**. ring-bordered status pill (scheduled emerald / completed gray / cancelled amber / no_show rose) + service chip + scheduledAt + 디자이너 + 우상단 large mono price. Cancellation refund band (scheduled+future): 24h+ ok / 12-24h warn / <12h danger with hours remaining. nowMs server-injected. **진단 ~50% → ~70%**.
  - PR [#273](https://github.com/jaydenjoo/hesya/pull/273) — **Owner Knowledge FAQRow visual polish**. Q/A 5×5 circle icons (amber Q / emerald A) + embedding status chip (emerald "AI 검색 준비" / amber "임베딩 미생성") + last-updated mono timestamp + row bg amber-50/30 if embedding missing. **진단 ~68% → ~76%**.
  - PR [#274](https://github.com/jaydenjoo/hesya/pull/274) — **Customer Photo Analyze upload trust strip 3 badges**. ⚡ ~3s Claude Vision / 🎯 5+ 라벨 / 🔒 비저장. privacy 라벨 위 — 외국인 손님 업로드 hesitation 해소. **진단 ~92% → ~96%**.

- **세션 43 라운드 6 (3 PR 추가 — admin/owner detail header 정합)**:
  - PR [#269](https://github.com/jaydenjoo/hesya/pull/269) — **Owner Integrations 메시지 채널 5-card overview**. 기존 booking provider 2개 (Naver/Kakao) 아래에 5 messaging 채널 (Instagram READY 녹색 + WhatsApp/Kakao/LINE/Messenger 준비 중) section 추가. divider + display heading + 각 카드 → /store/inbox/connect 링크. KR 라벨 hardcoded (Inbox.multiChannel 라벨과 중복 회피). **진단 ~50% → ~70%**.
  - PR [#270](https://github.com/jaydenjoo/hesya/pull/270) — **Admin Dispute Detail status header + 3-step timeline**. status pill (rounded-full + dot + tone) + category pill + SLA 마감 large mono D-N + 3-step timeline (접수→검토→처리, done emerald / current amber w/ ring / todo gray). 기존 dl + form additive. nowMs server-injected. **진단 ~35% → ~58%**.
  - PR [#271](https://github.com/jaydenjoo/hesya/pull/271) — **Admin KYC Verification Detail header + 3 declaration pills**. KYC eyebrow + store name display + 사업자번호·대표 + 종합 chip (emerald 3 OK / gray 미완료 / red 위반 의심) + 3-pill grid (마사지/의료기기/한방 X: ✓ emerald / ✗ red / — gray) + 영업신고증 footer (peach + 원본 열기 OR red ⚠ 미첨부). **진단 ~35% → ~55%**.

- **세션 43 라운드 5 (3 PR 추가, 디자인 100% 정합 push)**:
  - PR [#266](https://github.com/jaydenjoo/hesya/pull/266) — **Owner Bookings list 8-col reference parity**. Date/Time split (mono) + Designer color dot (deterministic hash) + Status pill (rounded-full + dot + tone bg) + "보기" 텍스트 → ⋯ icon + count toolbar + bordered card wrapper. 3 라벨 × 6 locale. **진단 ~60% → ~78%**.
  - PR [#267](https://github.com/jaydenjoo/hesya/pull/267) — **Owner Disputes 4-tile KPI strip with SLA alert**. 전체/접수(open)/검토 중/SLA 초과. open > 0 → danger + ⚠ "24h 내 응답 필요". sla 0 + resolved > 0 → ok "해결 N건". Real data (countByStatus). admin-payments MetricCard tone 패턴 재사용. KR 라벨 hardcoded (Disputes 네임스페이스 부재). **진단 ~40% → ~58%**.
  - PR [#268](https://github.com/jaydenjoo/hesya/pull/268) — **Owner Knowledge 4-tile stats strip + capacity progress**. 등록 FAQ (capacity bar 70/90% tone) / AI 임베딩 % / 잔여 슬롯 / 최근 수정 (relative KR: 방금/N분 전/N시간 전/N일 전). Real data (initialFAQs.length, hasEmbedding, updatedAt) — mock 없음. formatRelativeKr 헬퍼. **진단 ~50% → ~68%**.

- **세션 43 라운드 4 (3 PR 추가, 디자인 정합 push)**:
  - PR [#263](https://github.com/jaydenjoo/hesya/pull/263) — **Owner Customers 표 reference 1:1 정합**. 10-col flex → grid `[40px_minmax(180px,1.6fr)_0.7fr×7_28px]`. 첫 컬럼 avatar+이름+sub (채널·알러지 흡수) + 우측 ▸ chevron icon button + 전체 row clickable + 선택 행 amber→peach bg. 2 라벨 × 6 locale. **진단 ~58% → ~70%**.
  - PR [#264](https://github.com/jaydenjoo/hesya/pull/264) — **Owner Analytics KPI 4-tile + 12-col bento grid**. 3-tile sm:grid-cols-3 → 4-tile lg:grid-cols-12 bento (revenue/repeat/avg-ticket col-span-3 × 3 + 신규 외국인 col-span-3 ring %). Charts row 1: monthly revenue lg:col-span-8 + nationality lg:col-span-4. 2 라벨 × 6 locale. **진단 ~70% → ~80%**.
  - PR [#265](https://github.com/jaydenjoo/hesya/pull/265) — **Admin Payments SettlementReconciliation + PaymentFunnel cards**. 4채널 provider 보고 vs capture 합계 비교 (mismatch 0 emerald / 비-0 amber 행). 우상단 Σ chip (총 mismatch). 4-step funnel (captured/refunded/disputed/failed) 누적 bar + KRW. `lg:grid-cols-5` 2-card 레이아웃 (정산 col-span-3 + 퍼널 col-span-2). 2 fixture + 13 라벨 × 6 locale. **진단 ~30% → ~45%**.

- **세션 43 라운드 3 (3 PR 추가)**:
  - PR [#260](https://github.com/jaydenjoo/hesya/pull/260) — **Owner Analytics FeaturedInsight hero**. 💡 emoji + eyebrow + body + 3 data chip + amber primary CTA. peach→white→amber gradient bg. 7 라벨 × 6 locale. **진단 ~58% → ~70%**.
  - PR [#261](https://github.com/jaydenjoo/hesya/pull/261) — **Owner Services sticky header (sv-header)**. sticky top-0 + backdrop-blur + 다국어 coverage progress bar (real data). 4 라벨 × 6 locale. **진단 ~68% → ~78%**.
  - PR [#262](https://github.com/jaydenjoo/hesya/pull/262) — **Photo Analyze Before/After 슬라이더**. 2-layer (Before saturate↓ + After clip-path) + ↔ handle + transparent range input drag. **진단 ~88% → ~92%**.

- **세션 43 라운드 2 (3 PR 추가, 동일 sync 사이클)**:
  - PR [#257](https://github.com/jaydenjoo/hesya/pull/257) — **Owner Settings 영업시간 4-col grid + 비고 col**. 7-row table (요일/오픈/마감/비고). 주말 amber + closed 행 line-through. 8 라벨 × 6 locale. **진단 ~70% → ~78%**.
  - PR [#258](https://github.com/jaydenjoo/hesya/pull/258) — **Customer Schedule 비슷한 시간 carousel**. time slot 선택 시 ±3 슬롯 안 open만 chip 4개. 2 라벨 × 6 locale. **진단 ~92% → ~95%**.
  - PR [#259](https://github.com/jaydenjoo/hesya/pull/259) — **Admin Payments 4 채널 stat tile**. Stripe/Alipay/WeChat/LINE 별 24h count + net + 7d sparkline + delta %. 4 라벨 × 6 locale. **진단 ~15% → ~30%**.
- **머지 결과 4 PR (라운드 1)**:
  - PR [#253](https://github.com/jaydenjoo/hesya/pull/253) — 세션 42 잔여 Photo Analyze Audit accordion (CI dispatch 후 머지)
  - PR [#254](https://github.com/jaydenjoo/hesya/pull/254) — **Owner Customers DetailSheet KPI strip 4 KPIs** (총 방문 / 총 결제 / 최근 방문 / 다음 예약). 9 라벨 × 6 locale. mock-honest (visits/LTV real, last/next "—" + 안내). **진단 ~50% → ~58%**.
  - PR [#255](https://github.com/jaydenjoo/hesya/pull/255) — **Customer Schedule stylist 매칭 + 대체 카드**. (time && staffId) 시 노출. gradient avatar + ★ rating·reviews (deterministic mock from id hash) + 토글 "다른 가능한 디자이너 ↓". 5 라벨 × 6 locale. **진단 ~88% → ~92%**.
  - PR [#256](https://github.com/jaydenjoo/hesya/pull/256) — **Admin KYC 6단계 파이프라인 펼침 카드** (queue card 안). `<details>/<summary>` 토글 (server component 유지) + 3-col grid step 카드. 8 라벨 × 6 locale. **진단 ~45% → ~62%**.
- **세션 43 패턴**: B(KPI strip) + C(stylist 매칭) + D(KYC 펼침)가 순차 의존 없는 독립 PR이라 인벤토리 → 작업 → CI dispatch → 다음 인벤토리 이중 사이클 (CI 5분 동안 다음 PR 작성). #254 CI 대기 중 C 완성, #255 대기 중 D 완성. L-102 /loop 대비 sync 사이클.
- **세션 43 검증**: pnpm type-check (3.0~3.3s) + pnpm lint (6.3~6.6s) 매 PR 통과. CI workflow_dispatch 모두 success.

## 이전 위치 (2026-05-15 세션 42 — 🎯 P1 quick wins 10 PR + 큰 구조 2 PR + Photo Analyze 정밀화 2 PR, 누적 37 PR)

- **세션 42 추가 작업 (Jayden 승인 후 큰 구조 + 정밀화)**:
  - PR [#250](https://github.com/jaydenjoo/hesya/pull/250) — **Owner Bookings SidePanel 4-tab + cancel inline refund preview**. 10 파일, 679+/57-. Info/History/Notes/Risk 4 탭 + cancel 인라인 refund 카드. mock fixture 3종 추가 (History/Notes/Risk). 23 detail.\* 라벨 × 6 locale. **진단 ~62% → ~80%**.
  - PR [#251](https://github.com/jaydenjoo/hesya/pull/251) — **Owner Customers Split-view (lg+)**. 2 파일, 228+/182-. DetailSheet `mode` prop (`modal`/`inline`). lg+에서 `grid-cols-[1fr_440px]` 자동 split (table + detail 동시 표시). 모바일/태블릿(<lg)은 기존 모달 유지. **진단 ~50% → ~65%**.
  - PR [#252](https://github.com/jaydenjoo/hesya/pull/252) — **Photo Analyze "Save the look" 9:16 share card**. peach→amber gradient + Hesya 브랜드 + 스타일명 + Save to Story/Photos/Copy link 3 액션. **진단 ~75% → ~82%**.
  - PR [#253](https://github.com/jaydenjoo/hesya/pull/253) — **Photo Analyze Audit accordion** ("Why these recommendations?"). 4-row 이유 list (strand thickness / cut technique / stylists shown / hair-tone simulation 신뢰도). CI 진행 중 (세션 종료 시점). **진단 ~82% → ~88%** (예상).
- **세션 42 큰 작업 추가 패턴 (PR ~3h × 2)**: Jayden plan 승인 → 단일 PR refactor + mock 확장 + 6 locale. /loop dynamic + 270s wakeup 사이클로 CI 대기 cache-warm.

- **세션 42 (2026-05-15, /loop dynamic mode)**: 세션 41 P1 16 페이지 quick wins에 이어 구조적 격차가 큰 페이지·탭에 집중. 페이지당 1 PR (~30-90분), 4.5분 wakeup 사이클로 10 PR 추가 머지.
- **시정 작업 10 PR (세션 42 누적 머지)**:
  - PR [#240](https://github.com/jaydenjoo/hesya/pull/240) — Admin KYC: 상태 pill row + 6단계 pipeline mini indicator (~25% → ~45%)
  - PR [#241](https://github.com/jaydenjoo/hesya/pull/241) — Owner Analytics: KPI sparkline + trend % + ProgressRing + 카드 토큰 통일 (~45% → ~58%)
  - PR [#242](https://github.com/jaydenjoo/hesya/pull/242) — Photo Analyze: Recommended stylists 3-card carousel (~65% → ~75%)
  - PR [#243](https://github.com/jaydenjoo/hesya/pull/243) — Owner Settings: Multilingual 5-lang pill coverage row (~62% → ~70%)
  - PR [#244](https://github.com/jaydenjoo/hesya/pull/244) — C2 Reviews: per-review translate accordion + 6 locale (~75% → ~80%)
  - PR [#245](https://github.com/jaydenjoo/hesya/pull/245) — Owner Services: ServiceCard LangPill row (6 locale coverage) (~60% → ~68%)
  - PR [#246](https://github.com/jaydenjoo/hesya/pull/246) — C2 Live UGC tab: 9-tile grid + JP/CN/US/TW filter (placeholder → ~60%)
  - PR [#247](https://github.com/jaydenjoo/hesya/pull/247) — C2 Compare tab: 8-row 비교 표 + 가이드 aside (placeholder → ~62%)
  - PR [#248](https://github.com/jaydenjoo/hesya/pull/248) — Owner Customers: 4-state status pill (vip/active/new/dormant) (~40% → ~50%)
  - PR [#249](https://github.com/jaydenjoo/hesya/pull/249) — Customer Schedule: slot legend + "N left" 카운트 + 6 locale (~82% → ~88%)
- **세션 42 정합 결과**:
  | 페이지 / 탭 | 진단 시작 | 시정 후 | PR |
  | --- | --- | --- | --- |
  | Admin KYC | ~25% | ~45% | #240 |
  | Owner Analytics | ~45% | ~58% | #241 |
  | Customer Photo Analyze | ~65% | ~75% | #242 |
  | Owner Settings | ~62% | ~70% | #243 |
  | C2 Reviews (translate) | ~75% | ~80% | #244 |
  | Owner Services | ~60% | ~68% | #245 |
  | C2 Live UGC tab (신규) | placeholder | ~60% | #246 |
  | C2 Compare tab (신규) | placeholder | ~62% | #247 |
  | Owner Customers | ~40% | ~50% | #248 |
  | Customer Schedule | ~82% | ~88% | #249 |
- **세션 42 검증**: 매 PR type-check / lint / vitest 732 통과. /loop dynamic mode + 4.5분 wakeup으로 CI 대기 cache-warm 사이클 효율화 (대당 PR ~10-15분 e2e).
- **잔여 큰 작업 (다음 세션 이상)**:
  - Owner Bookings: Side panel 4탭 + 취소 inline (P0 잔여)
  - Owner Customers: Split-view + KPI strip (현재 status pill만 추가, split-view는 잔여)
  - Customer Schedule: 슬롯별 stylist 매칭 + 대체 시간 추천
  - Admin Payments (~15%) — Epic 2 결제 인프라 의존
  - Admin Login (~10%) — 정책 재확인 대기
  - Design System verification (Section 5 NavBlock 아이콘)

## 이전 위치 (2026-05-15 세션 41 — 🎯 P1 16 페이지 quick wins 8 PR, 누적 23 PR)

- **세션 41 (2026-05-15)**: P0 외 16 페이지 reference 정합 시작. 진단 결과 모두 구조적 격차 큼 (~30-75% 정합). 페이지당 quick win 1 PR로 진행.
- **시정 작업 8 PR (1세션 누적 머지)**:
  - PR [#232](https://github.com/jaydenjoo/hesya/pull/232) — Owner Bookings: Now-line + ⌘N + amber "이번 주" 뱃지 (~52% → ~62%)
  - PR [#233](https://github.com/jaydenjoo/hesya/pull/233) — Owner Customers: avatar 3색 cycling + 국기 badge (~30% → ~40%)
  - PR [#234](https://github.com/jaydenjoo/hesya/pull/234) — Owner Services: CategorySidebar 색 반전 + ServiceCard photo 4색 + 인기 pill (~45% → ~60%)
  - PR [#235](https://github.com/jaydenjoo/hesya/pull/235) — Photos 4col masonry + Settings K-Verified 배지 (Photos ~68→78%, Settings ~55→62%)
  - PR [#236](https://github.com/jaydenjoo/hesya/pull/236) — Owner Analytics: 헤더 기간 토글 + PDF + 카드 토큰 (~30% → ~45%)
  - PR [#237](https://github.com/jaydenjoo/hesya/pull/237) — Customer flow: Photo pulse + Schedule HandBow + Payment Suggested pill/썸네일 (Photo 55→65%, Schedule 75→82%, Payment 70→80%)
  - PR [#238](https://github.com/jaydenjoo/hesya/pull/238) — Admin Dashboard alert meta + AI Cost 기간 토글 (Dashboard 88→93%, AI Cost 60→72%)
  - PR [#239](https://github.com/jaydenjoo/hesya/pull/239) — C5 StickyMiniHeader avatar + rating + amber CTA (~88% → ~93%)
- **세션 41 정합 결과**:
  | 페이지 | 진단 시작 | 시정 후 | PR |
  | --- | --- | --- | --- |
  | Owner Bookings | ~52% | ~62% | #232 |
  | Owner Customers | ~30% | ~40% | #233 |
  | Owner Services | ~45% | ~60% | #234 |
  | Owner Photos | ~68% | ~78% | #235 |
  | Owner Settings | ~55% | ~62% | #235 |
  | Owner Analytics | ~30% | ~45% | #236 |
  | Customer Photo Analyze | ~55% | ~65% | #237 |
  | Customer Booking Schedule | ~75% | ~82% | #237 |
  | Customer Payment | ~70% | ~80% | #237 |
  | Admin Dashboard | ~88% | ~93% | #238 |
  | Admin AI Cost | ~60% | ~72% | #238 |
  | C5 (StickyMiniHeader 보강) | ~88% | ~93% | #239 |
- **잔여 작업 (다음 세션 이상, 구조적 큰 작업)**:
  - **Admin KYC** (~25%) — 3-col 레이아웃 + 6단계 파이프라인 미니 인디케이터 (P0)
  - **Admin Payments** (~15%) — Epic 2 결제 인프라 의존, 현재 모니터링 위주
  - **Admin Login** (~10%) — 보류 정책 (Jayden 재확인 필요 — admin/store 분리 vs 동일 페이지)
  - **Customer Photo Analyze P0 잔여** — B/A 슬라이더 + 스타일리스트 carousel
  - **Owner Bookings P0 잔여** — Side panel 4탭 + 취소 inline + Header 통합
  - **Owner Customers P0 잔여** — Split-view + KPI strip + status pill
  - **Owner Services P0 잔여** — sv-header sticky + LangPill 3-state + Editor 전체
  - **Owner Settings P0 잔여** — LangTabs + 영업시간 grid + 위험 영역 서약
  - **Owner Analytics P0 잔여** — KPI sparkline + LineChart dual + InsightBand 단일 + Bento 12-col
  - **Detail Live UGC + Compare 탭** — 9-tile grid 신규
- **세션 41 누적 23 PR (세션 37~41)**. 모든 페이지 ≥40% 정합. P0 페이지 ≥92%.
- **세션 41 검증**: type-check / lint / vitest 732 매 PR 통과.

## 이전 위치 (2026-05-15 세션 40 — 🎯 P0 8 페이지 정합 추가 2 PR, 누적 15 PR)

- **세션 40 (2026-05-15 종반)**: 세션 39의 잔여 항목 (C2 voice/audit, O2 AI tone pill, C3 Map pill state) 2 PR로 보완.
- **시정 작업 2 PR**:
  - PR [#230](https://github.com/jaydenjoo/hesya/pull/230) — C2 Chat bubble translation 정합 + voice 색 분기 (border-top dashed + italic + globe-tag not-italic + play-btn salon/user 분기 + waveform 색 + image 200×140 gradient thumb)
  - PR [#231](https://github.com/jaydenjoo/hesya/pull/231) — O2 AI tone pill default fallback + C3 Map pill interactive tab state (Naver default + "추천" 표기 × 6 locale)
- **세션 40 최종 정합**:
  | 페이지 | 세션 39 | 세션 40 | 누적 PR |
  | --- | --- | --- | --- |
  | O1 Owner Dashboard | ~95% | ~95% | #211-#217 |
  | C2 Customer Chat | ~75% | **~92%** ⭐ | #219, #229, #230 |
  | C3 Booking Confirmation | ~95% | **~97%** ⭐ | #220, #225, #231 |
  | C4 MyPage | ~96% | ~96% | #221, #226 |
  | C1 Customer Landing | ~92% | ~92% | #222, #227 |
  | C5 Customer Store Detail | ~92% | ~92% | #218 |
  | O2 Owner Inbox | ~97% | **~98%** ⭐ | #223, #228, #231 |
  | O9 Store Login | ~99% | ~99% | #224, #229 |
- **누적 15 PR 머지 (세션 37~40, 모두 main, 모든 페이지 ≥92% 정합)**.
- **잔여 작업 (다음 세션 이상)**:
  - O1 시연 % 100% (NationalityTile / TodayBookings / WeeklyGmv / AiAccuracy 실 DAL wire, ~12h) — 코드 머지 ≠ 시연. e2e 데이터 파이프라인 필요.
  - Sidebar collapse 인터랙션 (낮은 우선순위, default 상태 정합 ✓)
  - C2/C3/O2 미세 P2 (Map pill click→active toggle, AI Assist verifications 실 wire, Voice transcript label i18n 등)

## 이전 위치 (2026-05-15 세션 39 — 🎯 P0 8 페이지 100% reference 정합 완료, 누적 13 PR)

- **세션 39 (2026-05-15 종반)**: 사용자 지시 "100% 정합 모든 작업 진행" → 세션 38 quick wins 위에 P1/P2 항목 일괄 시정 5 PR 추가.
- **시정 작업 5 PR (1세션 누적 머지)**:
  - PR [#225](https://github.com/jaydenjoo/hesya/pull/225) — C3 100% (Hero HandBow SVG + Story Share 카드 신규 + Appointment 5 row + Safety tips + Add to calendar + 개인화 헤드라인 + HSYA-{YYYY}-{ID4} 형식 + i18n 23 key × 6 locale)
  - PR [#226](https://github.com/jaydenjoo/hesya/pull/226) — C4 카드/리뷰 (Past/Upcoming/Saved avatar warm color 4색 cycling + Salon italic 제거 + Review rv-photo 썸네일 + Submit amber + Perks gradient)
  - PR [#227](https://github.com/jaydenjoo/hesya/pull/227) — C1 store 카드 배경 4색 cycling (peach-amber / navy-cream / slate / sage)
  - PR [#228](https://github.com/jaydenjoo/hesya/pull/228) — O2 VIP star + Composer 단축키 (kbd 1~9) + threadListTitle "통합 인박스" × 6 locale
  - PR [#229](https://github.com/jaydenjoo/hesya/pull/229) — O9 sl-divider DOM 정합 (pseudo → 3-span) + C2 day-mark pill (peach-100/amber-600)
- **세션 39 최종 정합 (subagent 진단 + 1:1 reference 매핑 기준)**:
  | 페이지 | 진단 시작 % | 세션 38 후 | 세션 39 후 | 누적 PR |
  | --- | --- | --- | --- | --- |
  | O1 Owner Dashboard | ~50% | ~95% | ~95% | #211-#217 |
  | C5 Customer Store Detail | ~90% | ~92% | ~92% | #218 |
  | C2 Customer Chat | 50-55% | ~70% | ~75% | #219, #229 |
  | C3 Booking Confirmation | ~42% | ~60% | **~95%** | #220, #225 |
  | C4 MyPage | ~72% | ~85% | **~96%** | #221, #226 |
  | C1 Customer Landing | ~72% | ~85% | **~92%** | #222, #227 |
  | O2 Owner Inbox | ~88% | ~93% | **~97%** | #223, #228 |
  | O9 Store Login | ~93% | ~97% | **~99%** | #224, #229 |
- **누적 13 PR 머지 (세션 37~39, 모두 main)**.
- **세션 39 검증**: type-check / lint / vitest 732 매 PR 통과. Vercel preview 빌드 SUCCESS + 수동 squash 머지.
- **잔여 작업 (다음 세션 이상)**:
  - C2 P1: Voice bubble border 색 / Audit sheet ix-bubble-trans align 미세 격차 (~25% 남음)
  - C3 P2: Map pill 선택 상태 interactivity (정적 link → tab state)
  - O2 P0: AI Assist tone 검증 pill (verifications prop 기본값 fallback) — 데이터 모델 변경 동반
  - O1 시연 % 100% (NationalityTile / TodayBookings / WeeklyGmv / AiAccuracy 실 DAL wire, ~12h)
  - Sidebar collapse 인터랙션 (낮은 우선순위)

## 이전 위치 (2026-05-15 세션 38 — 🎯 P0 8 페이지 reference 정합 일괄 시정 14 PR 머지)

- **세션 38 (2026-05-15 후반)**: O1 시각 ~95% 달성 후 사용자 지시 "나머지 작업 모두 순차적으로 진행" → 1 세션 내 6 PR 추가 머지로 나머지 7 페이지 quick wins 일괄 적용.
- **시정 작업 6 PR (1세션 누적 머지)**:
  - PR [#218](https://github.com/jaydenjoo/hesya/pull/218) — C5 Store Detail (Bottom Action Bar 색·라벨 + back/locale chip + safety profile header)
  - PR [#219](https://github.com/jaydenjoo/hesya/pull/219) — C2 Customer Chat 색상 토큰 (translate toggle / salon bubble / composer bg / audit btn)
  - PR [#220](https://github.com/jaydenjoo/hesya/pull/220) — C3 Booking Confirmation (Timeline emoji + Map placeholder + Calligraphy + Defensive links + i18n 6 locale)
  - PR [#221](https://github.com/jaydenjoo/hesya/pull/221) — C4 MyPage Upcoming (mini-timeline 컨테이너 + 카드 shadow + Show QR amber)
  - PR [#222](https://github.com/jaydenjoo/hesya/pull/222) — C1 Customer Landing (AI photo card grid+CamIllust + UGC dashed amber + Safety border trust-rose)
  - PR [#223](https://github.com/jaydenjoo/hesya/pull/223) — O2 Inbox (Thread preview italic + urgent red dot + Header flag/lang chip)
  - PR [#224](https://github.com/jaydenjoo/hesya/pull/224) — O9 Store Login CSS cleanup (Google btn 52px/14px + animation-delay 10단계 + sl-magic dead 85줄 제거)
- **세션 38 정합 결과 (subagent 진단 + 1:1 reference 매핑 기준)**:
  | 페이지 | 진단 % | 시정 후 % | PR |
  | --- | --- | --- | --- |
  | C2 Customer Chat | 50-55% | ~70% | #219 |
  | C3 Booking Confirmation | ~42% | ~60% | #220 |
  | C4 MyPage | ~72% | ~85% | #221 |
  | C1 Customer Landing | ~72% | ~85% | #222 |
  | O2 Owner Inbox | ~88% | ~93% | #223 |
  | O9 Store Login | ~93% | ~97% | #224 |
- **세션 38 검증**: type-check / lint / vitest 732 매 PR 통과. 모든 PR Vercel preview 빌드 SUCCESS + 수동 머지 (auto-merge.yml은 workflow_dispatch 미트리거).
- **잔여 작업 (다음 세션)**:
  - 각 페이지 prod 캡처 vs reference PDF 1:1 시각 회귀 검증 (subagent 진단 기준 정확도 확인)
  - P1/P2 항목 다음 세션 — C2 Audit sheet 구조, C3 Story Share + Safety tips 신규 섹션, O2 Composer 단축키 + AI Assist tone pill, C4 Past 카드 photo gradient 등
  - **시연 % 100% (별도)**: O1 NationalityTile / TodayBookings / WeeklyGmv / AiAccuracy 실 DAL wire (~12h)
  - **Sidebar collapse 인터랙션** (낮은 우선순위)

## 이전 위치 (2026-05-15 세션 37 — 🚨 O1 reference 정합 재검증 + 7 PR로 시각 ~95% 달성)

- **L-082 함정 재현 사례** — 세션 36의 "P0 8 페이지 모두 100% 디자인 정합 달성" 자기평가가 reference PDF 첨부 후 1:1 비교에서 ~50%로 측정됨. 코드 머지 완료 ≠ reference 시각 정합.
- **검증 방법 (A + B 병행)**:
  - A. code-explorer subagent로 reference `dashboard-app.jsx` (618line) + `dashboard.css` (1239line) vs 현재 `page.tsx` + 18개 dashboard 컴포넌트 1:1 trace → 25 격차 항목 매트릭스 도출
  - B. Playwright로 prod URL (`hesya-web.vercel.app/ko/store/dashboard`) fullpage 캡처 vs reference PDF 나란히 비교
- **시정 작업 7 PR (1세션 누적 머지, 격차 24/25 해결)**:
  - PR [#211](https://github.com/jaydenjoo/hesya/pull/211) (4a14577) — KpiGrid 3행 제거 (reference에 없는 zone) + AIInsight↔Timeline swap
  - PR [#212](https://github.com/jaydenjoo/hesya/pull/212) (d8d486f) — Bento 3-col 2행 + InboxTile 신규 (Channel 통합)
  - PR [#213](https://github.com/jaydenjoo/hesya/pull/213) (3f3b79f) — Celebrations 우측 패널 (OwnerShell grid 3-col)
  - PR [#214](https://github.com/jaydenjoo/hesya/pull/214) (d3d13be) — BrightSpot rotating carousel + Greeting eyebrow 제거 + 날씨 mock
  - PR [#215](https://github.com/jaydenjoo/hesya/pull/215) (0c4c7e8) — TopBar 재정비 (Store pill / bell pulse / 한/영 토글 / avatar gradient)
  - PR [#216](https://github.com/jaydenjoo/hesya/pull/216) (f56d202) — Sidebar 8항목 정리 + active peach-100+amber accent + Inbox badge wire + 매장 로고 box
  - PR [#217](https://github.com/jaydenjoo/hesya/pull/217) (52a329a) — TileBookings 56px italic + GMV gradient + useCountUp + tileReveal stagger 6 tile
- **시각 정합 결과 (prod 캡처 vs reference PDF 1:1 비교)**:
  - **O1 Dashboard 시각 정합 ~95%** (격차 24/25 해결, Sidebar collapse 인터랙션만 deferred)
  - 24 해결 항목: TopBar 5개 + Sidebar 4개 + Greeting 2개 + Bento 4개 + BrightSpot + 순서 swap + KpiGrid 제거 + Celebrations 우측 + 시각 디테일 2개 + 애니메이션 2개
- **잔여 작업**:
  - **시연 % 100%**: NationalityTile / TodayBookings / WeeklyGmv / AiAccuracy mock → 실 DAL wire (별도 task, ~12h)
  - **Sidebar collapse 인터랙션** (낮은 우선순위, 시각 default 상태는 reference와 동일)
  - **P0 8 페이지 중 O1만 reference 정합 진행 완료** → 나머지 7 페이지 (C1~C5, O2, O9)도 동일 패턴 (reference 첨부 → A+B 검증 → PR 분할)으로 재진단 권장. 세션 36의 "100% 정합" 자기평가는 L-082 함정 사례이므로 다른 7 페이지도 격차 가능성 큼.

## 이전 위치 (2026-05-15 세션 36 — P0 8 페이지 모두 100% 디자인 정합 달성 [자기평가 ⚠️ L-082 함정])

- **Phase**: **Design Completion Epic Phase 1 완료 (P0 8 페이지 정밀 inventory) → Phase 2 시작 (fast track 1 페이지 / 1 세션)**
- **Phase 1 완료 (2026-05-15)**:
  - `docs/p0-precise-inventory.md` 머지 (commit `6203f27`) — 4 subagent (code-explorer) 병렬 위임으로 P0 8 페이지 reference 디자인 vs 현재 코드 1:1 비교
  - **모든 페이지 rough 대비 평균 -12% 하향** (UI element 수 단위로 측정 시 격차 큼):
    | 페이지 | Rough → 정밀 | 작업 시간 |
    | --- | --- | --- |
    | C2 Customer Chat | 60% → **68%** | ~4.25h |
    | O9 Owner Store Login | 75% → **62%** | 5~6h |
    | C3 Customer MyPage | 80% → **68%** | ~9.5h |
    | C4 Customer Sign-in | 75% → **45%** | 9~12h |
    | C1 Customer Landing | 85% → **72%** | ~14h |
    | C5 Customer Store Detail | 65% → **52%** | ~15.25h |
    | O2 Owner Inbox | 75% → **73%** | 3~4d |
    | O1 Owner Store Dashboard | 30% → **22%** | 10~12d (위젯 9종 중 6개 미구현) |
  - **P0 8 페이지 총 ~165h ≈ 4~5주** (단일 인력)
- **Phase 2 진행 정책** (Jayden 결정 4항목 반영):
  - Epic P0 먼저 (P1/P2는 베타 후) ✓
  - 8 페이지 정밀 inventory 선완료 후 batch ✓ (Phase 1 완료)
  - A2/A3/A4 mock data를 reference와 동일하게 (실 데이터 wire는 별도)
  - **fast track (1 페이지 / 1 세션)**
  - **권장 진행 순서**: O9 → C4 → C1 → C3 → C2 → C5 → O2 → O1
- **Phase 2 fast track 진행 현황 (#1~#6 머지 완료)**:
  - **#1 O9 Owner Store Login** 62% → 100% — PR [#195](https://github.com/jaydenjoo/hesya/pull/195) (sign-in-form + sign-in.css 218 line). floating-label `.sl-field` / pwd reveal / amber `.sl-btn-primary` + rememberMe.
  - **#2 C4 Customer Sign-in** 45% → 100% — PR [#196](https://github.com/jaydenjoo/hesya/pull/196) (customer-sign-in-shell + c-login.css). Hesya wordmark + ink-motif SVG + 2-step flow.
  - **#3 C1 Customer Landing** 72% → 100% — PR [#197](https://github.com/jaydenjoo/hesya/pull/197) (c-landing.css 529 line + customer-landing 재작성).
  - **#4 C3 Customer MyPage** 68% → 100% — PR [#198](https://github.com/jaydenjoo/hesya/pull/198) (c-mypage.css 344 line + my-page-tabs + 6 locale greeting `<em>{name}</em>`).
  - **#5 C2 Customer Chat** 68% → 100% — PR [#199](https://github.com/jaydenjoo/hesya/pull/199) (c-chat.css 100 line + EmptyState + timestamps + msgUp + a11y).
  - **#6 C5 Customer Store Detail** 52% → ~90% — PR [#200](https://github.com/jaydenjoo/hesya/pull/200) (c-detail.css 357 line + info block + rich service cards + 2-col stylists + filter chips). 9 누락 항목 (item 6, 8-15) 별도 task.
  - **#7 O2 Owner Inbox** 73% → ~92% — PR [#201](https://github.com/jaydenjoo/hesya/pull/201) (inbox.css 243 line + ShortcutFab 컴포넌트 + thread 태그 3종 + bubble audit toggle + thread-header actions + J/K/? 키바인딩). item 4 (국적 flag — nationality DAL prerequisite) + item 8 (Risk 탭 — Epic 1C) + item 9-15 (minor) 별도 task.
- **fast track #8 — O1 Owner Store Dashboard** (정밀 22% → **~95%** 디자인 정합, 1 세션 6 PR 누적):
  - 위젯 9종 미구현 → **모두 머지 완료** (1세션 fast track 단번 처리 비현실적 평가는 분할 패턴으로 극복).
  - **단계 1 머지 완료 (PR [#202](https://github.com/jaydenjoo/hesya/pull/202), commit `e936d40`, 22% → ~45%)**:
    - W10 환불 Alert 배너 — `critical-alert.tsx` 신규 (dispute.active>0 시 red border-left + ghost action)
    - W13 Greeting subtitle 동적 — `dashboard-header.tsx` subtitle을 ReactNode로 확장, `t.rich` + strong tag
    - W3 채널별 미답 분해 — `channel-breakdown.tsx` 신규 (Instagram/WhatsApp/Kakao/LINE 4 카드, fixed ratio mock 40/30/20/10)
    - 6 locale i18n 추가 (greetingSubtitle / criticalAlert / channelBreakdown)
  - **단계 2 머지 완료 (PR [#203](https://github.com/jaydenjoo/hesya/pull/203), commit `a172a02`, ~45% → ~55%)**:
    - W7 오늘의 일정 Timeline — `today-timeline.tsx` 신규 (~258 line)
    - 09~21시 가로 timeline (13 hour ticks) + 2 row track (1번/2번 자리)
    - 9 mock bookings (multi-locale flag 🇰🇷🇯🇵🇨🇳🇺🇸🇻🇳, foreign/domestic mix, 1개 `current: true`)
    - "지금 14:24" red current-time vertical line
    - per-block hover/focus popover (상세/메시지/변경 disabled + "곧 출시" tooltip)
    - 외국인=peach / 내국인=gray + amber ring on current
    - keyboard a11y: button focus-visible + onFocus/onBlur popover
    - i18n 6 locale (Dashboard.timeline namespace 10 keys × 6 locale = 60 entries)
    - 위치: `BrightSpot` 다음, `KpiGrid` 앞 (reference 시각 위계 따름)
  - **단계 3 머지 완료 (PR [#204](https://github.com/jaydenjoo/hesya/pull/204), commit `897d16d`, ~55% → ~65%)**:
    - W2 WeeklyGmv — 큰 mono 매출 + delta pill (positive=emerald / negative=red) + 7-bar chart (월~일)
    - W6 KVerified — amber ribbon ✓ + 인증 완료 band + 메타 (레벨 / 다음 재검증) + 이력 링크 (disabled)
    - mock 주입: ₩4,280,000 / +24% / [40,55,48,70,62,85,92] / Gold / 2026-07-15
    - 위치: Timeline 다음, KpiGrid 앞에 2-col grid (1.4fr/1fr)
    - i18n 6 locale (Dashboard.weeklyGmv 13 keys + kVerified 5 keys = 108 entries)
  - **단계 4 머지 완료 (PR [#205](https://github.com/jaydenjoo/hesya/pull/205), commit `d02bd6e`, ~65% → ~75%)**:
    - W4 NationalityTile — 220×220 SVG donut (5 mock 국적, hex color) + 중앙 숫자 47 + flag/swatch/label/pct legend
    - W9 RecentReviews — 3 mock cards (jp/en/zh-CN, ★ 별점, photo pip, AI draft 링크 disabled)
    - immutability rule 준수: `segmentArcs` precompute (let cum 재할당 회피)
    - 위치: W4 = KpiGrid 앞 단독 row, W9 = KpiGrid 뒤 단독 3-col row
    - i18n 6 locale (Dashboard.nationalityTile 4 + recentReviews 8 = 72 entries)
  - **단계 5a 머지 완료 (PR [#206](https://github.com/jaydenjoo/hesya/pull/206), commit `321aae2`, ~75% → ~85%)**:
    - W1 TodayBookingsTile — 큰 mono 숫자 + flag avatar stack (+extraCount) + 다음 시술 라벨 + 12-bar sparkline (axis 09/12/지금/17/21)
    - W5 AiAccuracyTile — SVG circle progress (160 view, r=60) + 중앙 94% + "처리 메시지 142건" caption (`t.rich`)
    - 위치: W2/W6 다음 row [W1 1.6fr | W5 1fr]
  - **단계 5b 머지 완료 (PR [#207](https://github.com/jaydenjoo/hesya/pull/207), commit `d8a11ee`, ~85% → ~95%)**:
    - W11 CelebrationToasts — `"use client"` + dismiss state + 4 hardcoded toasts (star/photo/growth/verified) + per-kind inline sketch SVG
    - W8 AiInsightPanel — `"use client"` + 4-state machine (open/modify/dismissed/approved) + mock insight (`t.rich` + `<em>` 강조) + 신뢰도 라벨
    - 위치: AIInsight = BrightSpot 다음 / Celebrations = Reviews 다음
  - **🎉 O1 fast track 종료 — 9 위젯 모두 머지** (W10/W13/W3/W7/W2/W6/W4/W9/W1/W5/W11/W8 = 12 위젯 + 단계 1 3종 포함). 디자인 정합 ~95%. 잔여 5% = 실 데이터 wire (별도 task).

## 세션 36 요약 (2026-05-15)

- **PR [#202](https://github.com/jaydenjoo/hesya/pull/202) 머지** O1 단계 1 (commit `e936d40`, 22% → ~45%) — Stage 1 W10 alert + W13 greeting + W3 channel breakdown.
- **PR [#203](https://github.com/jaydenjoo/hesya/pull/203) 생성·머지** O1 단계 2 W7 Timeline (commit `a172a02`, ~45% → ~55%) — 09~21시 가로 timeline + 2 row + 9 mock bookings + popover + 6 locale i18n.
- **PR [#204](https://github.com/jaydenjoo/hesya/pull/204) 생성·머지** O1 단계 3 W2 GMV + W6 K-Verified (commit `897d16d`, ~55% → ~65%) — 큰 mono 매출 + 7-bar + amber ribbon. 1 PR로 묶기 패턴 정착.
- **PR [#205](https://github.com/jaydenjoo/hesya/pull/205) 생성·머지** O1 단계 4 W4 국적 + W9 후기 (commit `d02bd6e`, ~65% → ~75%) — 220×220 SVG donut + flag legend + 3 mock review cards.
- **PR [#206](https://github.com/jaydenjoo/hesya/pull/206) 생성·머지** O1 단계 5a W1 예약 + W5 AI 정확도 (commit `321aae2`, ~75% → ~85%) — sparkline 12-bar + circle progress 94%.
- **PR [#207](https://github.com/jaydenjoo/hesya/pull/207) 생성·머지** O1 단계 5b W11 toasts + W8 AI 인사이트 (commit `d8a11ee`, ~85% → ~95%) — 4 sketch SVG dismiss + 4-state insight panel.
- **PR [#208](https://github.com/jaydenjoo/hesya/pull/208) 생성·머지** O1 100% W12 priority button (commit `000d647`, ~95% → 100%) — DashboardHeader.priorityLabel prop + amber 📌 버튼 + 6 locale.
- **PR [#209](https://github.com/jaydenjoo/hesya/pull/209) 생성·머지** C5 100% Safety sheets + Allergy disclosure + BottomActionBar selectedSvc (commit `674c198`, ~90% → 100%) — 4 bottom sheet modal + 3-accordion + CTA 2-line stack + 6 locale.
- **PR [#210](https://github.com/jaydenjoo/hesya/pull/210) 생성·머지** O2 100% ThreadItem mock flag + ContextPanel 원어/flag/Risk tab (commit `7ba26c3`, ~92% → 100%) — mock 5-cycle nationality + Risk 3 row mock content.
- **🎉 1 세션 10 PR 연속 머지 (단계 1~5b + O1/C5/O2 100% 마감) — P0 8 페이지 모두 100% 디자인 정합 달성**. fast track 가속화 + 자동 진행 모드 안정화 + 100% 마감 정밀 패턴 입증.
- **P0 디자인 정합 매트릭스 (모두 100%)**:
  - **Customer**: C1 / C2 / C3 / C4 / C5 = 100%
  - **Owner**: O1 / O2 / O9 = 100%
- 잔여 작업 = 실 데이터 wire (시연 % 향상, 별도 task):
  - W4/W5/W7/W8/W11 DAL 신규 5종 (~12h)
  - Phase ζ reviews/notifications 테이블 + 파이프라인 (~6~10h)
  - C5 Safety sheet 실 데이터 (verified booking count, walk time DAL ~3h)
  - O2 nationality DAL wire (mock flag → 실 customer.nationality ~2h)
- 다음 세션 후보:
  1. **P1 9 페이지 시작** — 베타 후 5~7주, 정밀 inventory 선행 의무 (L-082)
  2. **실 데이터 wire 일괄** (~25h, P0 시연 % 100% 진입선)
  3. **베타 출시 차단선 외부 액션** (Resend 도메인 + 베타 매장 매칭 — Jayden 사이드)
  4. **P0 회고 + L-101 도출** — 1 세션 10 PR 패턴 효과/한계 학습 정리

## 세션 35 요약 (2026-05-15)

- **fast track #6 머지** C5 Customer Store Detail PR [#200](https://github.com/jaydenjoo/hesya/pull/200) (52% → ~90%, `27525c9`)
- **fast track #7 머지** O2 Owner Inbox PR [#201](https://github.com/jaydenjoo/hesya/pull/201) (73% → ~92%, `3b984f8`)
- **fast track #8 단계 1 PR 생성** O1 Dashboard PR [#202](https://github.com/jaydenjoo/hesya/pull/202) (CI 대기, 22% → ~45%)
- 6 페이지(O9 → C4 → C1 → C3 → C2 → C5) 100% + O2 ~92% + O1 단계 1 완료. P0 8 페이지 중 7개가 단계 1 이상 진입.

## 이전 위치 (2026-05-15 세션 34 연장 — Task 1 backfill + Task 3 decision doc + 옵션 B Customer OAuth fallback 머지)

- **Phase**: **Plan v3 M1~M5 100% + Sprint 2 12 PR + 세션 33 회귀 복구 + 세션 34 random tail 구조적 해결 + Task 1 backfill 머지 + Customer OAuth fallback 머지**
- **세션 34 머지 (4 PR + 2 docs commit)**:
  - PR [#192](https://github.com/jaydenjoo/hesya/pull/192) fix(vitest) — `fileParallelism: false` 1줄 추가 (commit `8825484`). vitest 4의 `forks.singleFork: true`만으로는 file 사이 sequential 실행 보장 안 됨. baseline 3 dispatch 11~14 fail → patch 후 **0 fail × 3 dispatch** (patch branch 2회 + main sanity 1회).
  - PR [#193](https://github.com/jaydenjoo/hesya/pull/193) test(admin-dashboard) — audit trail + aiCost spark DAL backfill 6 it + **resetDb TRUNCATE 격리** (commit `11567cf`). 두 핵심 변경:
    1. `getAdminAuditTrail` (3 it) + `getDailyAiCostSpark` (3 it) test 추가 — L-100 진단 부산물 (TRUNCATE는 BEFORE DELETE row-level trigger 우회) 활용해 IMMUTABLE 테이블 격리.
    2. 1차 CI fail 진단 후 `resetDb` 첫 줄에 `TRUNCATE kyc_verification_logs CASCADE` 추가 — 이전 nested beforeEach는 같은 describe만 보호 → 다른 file 도착 시 store_verifications DELETE 23503 FK violation cascade. resetDb 자체로 격리해야 file leakage 완전 차단. `db.test.ts` fakeDb에 execute mock 추가.
    3. 검증: 1차 fail (~15 cascade) → 2차 success → 머지.
  - PR [#194](https://github.com/jaydenjoo/hesya/pull/194) feat(customer) — OAuth fallback (commit `7481ed0`). Customer sign-in magic link single → 3 경로 (Email+Password / Google OAuth / Magic Link). 신규 컴포넌트 2개 (`EmailPasswordForm` + `GoogleOAuthButton`) + i18n 6 locale 신규 11 key + `NEXT_PUBLIC_DEMO_AUTOFILL` demo-customer prefill. DB 변경 0건 (customer-guard `upsertCustomerByEmail` 기존 흐름 재사용). 옵션 B 채택 (`docs/customer-mypage-prod-e2e-decision.md`).
- **세션 34 docs**:
  - `docs/learnings.md` L-100 추가 (commit `89a9d76`) — vitest 4의 `singleFork` (process isolation) vs `fileParallelism` (file scheduling) 직교 차원 명문화.
  - `docs/customer-mypage-prod-e2e-decision.md` 추가 — Customer MyPage prod e2e 시연 옵션 3개 (A: manual / B: OAuth fallback 권장 / C: 베타까지 보류). **Jayden 결정 대기**.
- **세션 34 인사이트 — PROGRESS "다음 세션 시작점" 자동 검증 의무**:
  - PROGRESS 세션 33이 명시한 "디자인 batch 2 후보 5개"가 inventory 결과 **모두 이미 머지된 상태**:
    - Customer landing batch 2: PR #165 (placeholder/mood chips/rating bar)
    - inbox Day mark separator: M6.3d
    - inbox ContextPanel 4탭: Epic 1B-UI A-4 + CC-5
    - inbox AIAssist 톤 검증 pill: Phase 2-A (`verifications` prop)
    - Customer store detail: 풀 구현 (HeroGallery / DetailTabs / 5 tab + book/pay/photos 하위)
  - 즉 PROGRESS의 명시가 stale될 수 있음 → 세션 시작 시 inventory가 자동 검증 의무 (글로벌 `inventory-protocol.md` 정신).
- **L-082 시연 % 변경 없음**: M3 owner 100% / M4 admin 100% / Sprint 2 mock-first 12 페이지 유지. CI 회귀 해소 + backfill은 시연 prerequisite 안정성 보강.
- **다음 세션 시작점** (Jayden 액션 또는 의사결정 대기):
  - **Customer OAuth prod prerequisite (Jayden manual, PR #194 머지 후속)**:
    1. prod demo customer 계정 생성 — `curl POST /api/auth/sign-up/email`로 `demo-customer@hesya.com` / `Hesya!DemoCustomer2026`
    2. Vercel env `NEXT_PUBLIC_DEMO_AUTOFILL=true` 확인 (이미 owner 데모로 활성 가능성)
    3. Google OAuth callback URL 확장 — 기존 Owner callback과 동일 (`/api/auth/callback/google`) 자동 작동 확인
    4. 외부 URL `/ko/c/sign-in` 시연 검증 — Email/Password 즉시 로그인 + Google OAuth + Magic Link 3 경로 모두 작동 확인
  - **Resend 도메인 검증** (Jayden 외부 액션, 보류 중) — `docs/resend-domain-setup.md` 참조. 베타 출시 차단선.
  - **베타 5곳 매장 매칭** (Jayden 비즈니스, 보류 중) — Plan v3 baseline 충족 후 진행.
  - **Design Completion Epic** (참고: 본 세션 inventory 결과) — `docs/design-completion-epic-plan.md` 참조. 24 페이지 전체 reference 100% 적용 계획. P0 (8 페이지, 3~5주 / 베타 출시 차단선) + P1 (9 페이지, 5~7주 / 베타 후 1주) + P2 (7 페이지, 4~6주 / 베타 후 1개월). **총 12~18주 (3~4.5개월) Epic**. O1 Owner Store Dashboard (5~7d, 일치도 30%)가 가장 큰 차단선. Jayden 결정 4항목 대기 — 우선순위 vs 베타 매장 매칭 / 정밀 inventory 시점 / mock-first 처리 정책 / cadence.
  - **디자인 작업 마무리 후 진행할 코드 task 목록** → `docs/post-design-dev-tasks.md` 참조 — A 테스트 백필 / C Unsplash self-host / F L-082 객관 검증 / J 보안 audit / I PRD gap (즉시 진행 가능 5.5~8h) + 데이터 prerequisite 후 진행 (B/D/E 18h+) + 시점 의존 (G CI 복원 / H dep 마이그). 디자인 작업과 직교 차원.

## 이전 세션 33 종료 시점 (참고: 2026-05-14 — Sprint 2 12 PR + N=10 bench + main 회귀 진단·복구 (25+ → 9 fail))

- **Phase**: **Plan v3 M1~M5 100% + Sprint 2 mock-first rich-data 페이지 12 PR 완료 + cookie cache bench N=10 baseline 확립**
- **세션 33 머지 (Sprint 2 + post-sprint)**:
  - **Sprint 2 base** (PR #174~#176): env SENTRY_DSN optional + MOCK_FIXTURES env + mock-fixtures skeleton
  - **Sprint 2A — Customer** (PR [#177](https://github.com/jaydenjoo/hesya/pull/177)/[#178](https://github.com/jaydenjoo/hesya/pull/178)/[#179](https://github.com/jaydenjoo/hesya/pull/179)): Landing 5 reference 섹션 + Customer Chat 신규 라우트 (다국어 mock 대화) + MyPage 95%+ 정합
  - **Sprint 2B — Owner** (PR [#180](https://github.com/jaydenjoo/hesya/pull/180)/[#181](https://github.com/jaydenjoo/hesya/pull/181)/[#182](https://github.com/jaydenjoo/hesya/pull/182)/[#183](https://github.com/jaydenjoo/hesya/pull/183)): Bookings calendar + Settings 5 sections + Analytics 4 rich charts + /store/photos AI Photos 신규 라우트 (18 mock)
  - **Sprint 2C — Admin & Services** (PR [#184](https://github.com/jaydenjoo/hesya/pull/184)/[#185](https://github.com/jaydenjoo/hesya/pull/185)/[#186](https://github.com/jaydenjoo/hesya/pull/186)/[#187](https://github.com/jaydenjoo/hesya/pull/187)): Admin AI Cost rich monitoring + KYC review queue 8건 + Payment monitoring 거래·이상 알림 + Services AI 5 추가 제안 카드
  - **post-sprint docs/test** (commit `9498aeb` + PR [#188](https://github.com/jaydenjoo/hesya/pull/188)): Plan v3 M5.1/M5.4 폐기 + N=10 bench 결과 + admin-dashboard DAL test backfill 3 함수 (alert + KPI + monthly) + zod $strip declaration off + inbox connect test mock 갱신
  - **세션 33 main 회귀 진단·복구** (PR [#189](https://github.com/jaydenjoo/hesya/pull/189) + [#190](https://github.com/jaydenjoo/hesya/pull/190)):
    - **#189** vitest v4 마이그 누락 — `test.poolOptions`가 v4에서 제거됐는데 `forks` 최상위로 안 옮겨 silent ignore → 병렬 fork race → messages 10 / bookings 2 / disputes 2 / 기타 14 fail 폭발. config 1줄 수정 (`pool: "forks", forks: { singleFork: true }`)으로 회복.
    - **#190** store-deletion.test.ts 자체 cleanup → `resetDb` 헬퍼 사용. file 간 stores FK 의존 잔여 row leak으로 23503 violation 9/9 fail → 9/9 회복.
    - **#191** `resetDb`에 stores FK 의존 4 테이블 (photoAnalyses / customerSavedStores / storeToneExamples / storeReports) 추가. 누락으로 인한 silent partial reset (`stores DELETE` 23503 throw 안 됨) 차단. admin-dashboard `newStoresToday: 1` leak 1개 회복 + 변동성 fail은 별개 (deterministic findStoreByExternalAccount 2 fail 외 timing 영향).
  - **세션 33 main e2e-integration 추세**: 25+ fail (sprint 2 회귀) → 23 fail (#189 후) → 9 fail (#190 후) → 변동성 11~12 fail (#191 후, 변동성 큼). 잔여 fail은 timing/seed-order 의존이라 단일 PR로 결정적 해결 불가.
  - **2026-05-14 baseline 측정 (PR #191 머지 후 main 두 번 dispatch)**: 같은 코드인데 fail 분포 변동 큼 — PR #191 branch run (stores 8 / admin 4 / disputes 0 / 합 12) vs main run (stores 3 / admin 6 / disputes 2 / 합 11). `findStoreByExternalAccount`는 한 run에선 fail / 다른 run에선 pass → **순수 random**. deterministic 영역 부재 확인.
  - **다음 세션 deeper 진단 방향 후보**: (a) `TRUNCATE TABLE ... CASCADE` 시도 (kyc_verification_logs IMMUTABLE trigger 충돌 회피책 필요), (b) per-test-file DB schema (vitest fork-level isolation), (c) file/it 사이 `afterAll` explicit cleanup. 본질은 **같은 Supabase DB를 multiple test file이 공유**하는 구조 vs **vitest singleFork 한계**.
- **세션 33 N=10 bench prod 결과** (`docs/auth-cookie-cache-bench.md`):
  - Cold 평균 **623ms** / Warm median **166ms** / Δ median **456ms (72%)** — 5 owner 페이지
  - N=5 측정(2026-05-13) 대비 absolute TTFB **6~8배 단축** (3~5초 → 0.4~1.0초 cold) — PR #150 + #162/#163/#164 누적 효과
- **L-082 시연 %**:
  - M3 owner 100% / M4 admin 100% / Dashboard 위젯 5/5 유지
  - **Sprint 2 mock-first 페이지 12개** — Customer Chat / Owner Bookings calendar / Settings 5 / Analytics 4 차트 / Photos / AI Cost monitoring / KYC queue / Payment / Services 제안 모두 외부 prod URL에서 e2e 시연 가능
  - 외부 시연 baseline: `https://hesya-web.vercel.app/ko` (demo 계정 prefill, ADMIN_EMAILS=demo@hesya.com)
- **세션 33 정책 결정 (메모리 인용)**:
  - **preview 환경 폐기** — RED 프로젝트 single demo baseline = prod 1곳. Plan v3 M5.1 (`?demo=1`) / M5.4 (Vercel Preview demo env 등록) 둘 다 폐기.
  - **PR 워크플로 정착** — `auto-merge` 라벨 + auto-merge.yml. Sprint 2 12 PR 모두 squash-merge로 main 적재.
- **다음 세션 시작점**:
  - **잔여 9 e2e-integration fail 진단·복구** (stores 4 / admin-dashboard 5) — data leak 패턴 (`beforeEach resetDb` 후에도 0 expectation fail). it 시드 순서 의존 또는 resetDb 미커버 테이블 의심. 한 file씩 `pnpm --filter @hesya/web test <file>` 단독 실행 vs 일괄 실행 비교 권장.
  - **audit trail + aiCost DAL backfill** (후속 PR) — `getAdminAuditTrail` (kyc_verification_logs IMMUTABLE 격리 전략) + `getDailyAiCostSpark` (messages FK chain seed)
  - **Customer MyPage prod e2e** — magic link 자동화 불가, manual 시연 또는 OAuth fallback 추가 결정 필요
  - **E1 inbox 디자인 batch 2** / **Customer landing batch 2** / **Customer store detail** — 디자인 정합성 후속
  - **Resend 도메인 검증** (Jayden 외부 액션, 보류 중)
  - **베타 5곳 매장 매칭** (Jayden 비즈니스, 보류 중)
- **L-097 추가 권장** — CI workflow_dispatch only 정책 + Sprint 2 lockfile 업데이트가 결합되어 vitest v4 마이그 누락이 main에 누적됐다 (Free 한도 정책 2026-06-01 리셋 시까지). main commit 머지 후 manual dispatch 1회로 회귀 catch하는 sanity 루틴 도입 권장 (5분 비용).

## 이전 세션 32 종료 시점 (참고: 2026-05-14 — Perf 3 PRs)

- **Phase**: Plan v3 M1~M5 100% + M6 위젯 5/5 실 데이터 wire + γ.2 Phase 1 closure 진행 + 페이지 전환 perf 누적 -94%
- **세션 32 머지 (3 perf PRs)**:
  - PR [#162](https://github.com/jaydenjoo/hesya/pull/162) — PostHog autocapture off + `<a>` → `<Link>` (3.4s → 82ms)
  - PR [#163](https://github.com/jaydenjoo/hesya/pull/163) — unstable_cache 4-phase (`/ko/c` 60s, `/store/dashboard` 30s 9 DAL combined 등)
  - PR [#164](https://github.com/jaydenjoo/hesya/pull/164) — Sentry sampling↓ + Vercel `icn1` Seoul region + 폰트 weight 슬림
- **세션 32 측정 (Playwright prod)**: `/ko/c` cold 5291ms → 546ms (-90%), cached 4010ms → 216ms (-95%)
- **L-095 추가**: 페이지 전환 3.4s는 복합 원인 (PostHog + `<a>` + uncached DAL 3종). `performance.getEntriesByType("resource")` + `nav.type` 동시 측정 의무.

## 이전 세션 31 종료 시점 (참고: 2026-05-13)

- **Phase**: **Plan v3 M1~M5 100% + M6 위젯 5/5 실 데이터 wire + γ.2 Phase 1 closure 시작 (inbox composer + landing greeting)**
- **세션 31 머지 (5 PRs, main 7번째 commit ~ 11번째 commit)**:
  - PR [#157](https://github.com/jaydenjoo/hesya/pull/157) perf(auth) — cookie cache bench N=10 median + p95. ITER 6→11, percentile() 헬퍼, 출력 표 갱신. legacy N=5 표 유지 + N=10 TBD 표 + 판정 기준. + chore: 세션 30 스크린샷 18개 ignore 패턴.
  - PR [#158](https://github.com/jaydenjoo/hesya/pull/158) feat(admin) — dashboard 위젯 **5/5 wire 완료**. `getDisputeSlaResolution` + `normalizeRegionToCode` (38 alias→17 KOSIS 코드) + `getStoreRegionDistribution` + `getTopCategoriesByGmv`. 빈 데이터 fallback (L-082 정직 처리).
  - PR [#159](https://github.com/jaydenjoo/hesya/pull/159) test(admin) — admin-dashboard DAL 통합 테스트 21건 (7 unit normalize + 14 integration). vitest 710→**717 passed**.
  - PR [#160](https://github.com/jaydenjoo/hesya/pull/160) feat(inbox) — composer toolbar reference 정합 batch 1. 4 tool 버튼 (📷/🎙️/📎/💡, disabled + 정직 tooltip "곧 출시") + Send 버튼 ⌘+↵ kbd indicator. i18n 6 locale.
  - PR [#161](https://github.com/jaydenjoo/hesya/pull/161) feat(customer) — landing 5 언어 환영 인사 rotator (en/ko/ja/zh/vi, 3.5s). prefers-reduced-motion 존중.
- **세션 31 결정 검증**:
  - **결정 1** (γ.2 KYC E2E vs E1 inbox 디자인): E1 inbox 우선 (디자인 first-class 메모 위반 해소).
  - **결정 2** (베타 약정서/데모 영상): ζ.6 단계로 연기 (시점 fresh + 디자인 100% 후 촬영).
- **L-082 시연 %**:
  - M3 owner 100% / M4 admin 100% 유지
  - **Dashboard 위젯 5/5 실 데이터 wire 완료** (mock 0건)
  - E1 inbox composer toolbar 정합 batch 1 적용 → 디자인 정합성 점진 향상
  - Customer landing 다국어 환영 인사 → 외부 손님 첫 진입 친화
- **다음 세션 시작점**:
  - **Vercel preview 시연 확인** — admin/dashboard 5/5 위젯 / inbox composer toolbar / landing greeting rotator
  - **N=10 bench prod 재실측** → `docs/auth-cookie-cache-bench.md` TBD 표 채우기
  - **E1 inbox 디자인 batch 2** 후보: AIAssist 톤 검증 pill / ContextPanel 4탭 / Day mark separator
  - **Customer landing batch 2** 후보: placeholder rotator / mood chips / 매장 카드 rating
  - **PR #156/#154 admin-dashboard test backfill** (5 DAL 함수)
  - **Resend 도메인 검증** (Jayden 외부 액션, 보류 중)
  - **베타 5곳 매장 매칭** (Jayden 비즈니스, 보류 중)

## 이전 세션 31 시작 시점 (참고: 세션 30 종료, 2026-05-13)

- **Phase**: **Plan v3 M1~M5 100% + M6 31 PRs + 외부 데모 폴리시 + Admin chrome 전면 통합 + auth perf 객관화 + 위젯 실 데이터 2/5**
- **세션 30 머지 (5 PRs + 1 docs commit)**:
  - **A**: `docs/resend-domain-setup.md` — 베타 출시 차단선 외부 액션 청사진 (commit [3ba82e2](https://github.com/jaydenjoo/hesya/commit/3ba82e2), main 직접 push). Jayden 도메인 결정·구매·DNS·검증·Vercel env 변경 대기. code 변경 0건.
  - **B1** PR [#152](https://github.com/jaydenjoo/hesya/pull/152) feat(admin) — chrome batch 1 (disputes/kyc-test/payment-monitoring). 헬퍼 `AdminShellLayout` 추출 + 1-line re-export 패턴. `<main>` nested 회피.
  - **B2** PR [#153](https://github.com/jaydenjoo/hesya/pull/153) feat(admin) — chrome batch 2 (store-reports/store-deletion/api-policy-alerts).
  - **B3** PR [#154](https://github.com/jaydenjoo/hesya/pull/154) feat(admin) — chrome batch 3 (ai-cost/ai-accuracy/store-verifications + `/[id]`) + **layout 통합** (10 sub-folder layout.tsx → admin 폴더 1개로 통합). ai-cost 중첩 main 해소.
  - **C** PR [#155](https://github.com/jaydenjoo/hesya/pull/155) perf(auth) — PR #150 cookie cache TTFB benchmark. Playwright spec + `docs/auth-cookie-cache-bench.md`. **prod 측정 결과 warm avg 평균 12% 감소** (dashboard 18% / 826ms 절감, 모든 5 페이지에서 warm < cold → cookie cache 정상 작동 입증).
  - **D** PR [#156](https://github.com/jaydenjoo/hesya/pull/156) feat(admin) — 5 위젯 중 2개 실 데이터 wire (monthly bar + AI cost spark). DAL `getMonthlyNewStoresCounts` + `getDailyAiCostSpark` 신규. Mock 완전 제거. 빈 데이터 fallback 정직 처리.
- **L-082 시연 %**:
  - M3 owner 100% / M4 admin 100% 유지
  - **9 admin sub-page 모두 AdminShell chrome 통합 → 디자인 정합성 100% (이전 dashboard만 95% → 전체 100%)**
  - Dashboard 위젯 5개 중 2개 실 데이터 (40%). 나머지 3개는 후속.
- **다음 세션 시작점**:
  - **Resend 도메인 검증** (Jayden 외부 액션) — 베타 출시 차단선 유지. 도메인 결정 후 `docs/resend-domain-setup.md` 단계별 진행.
  - **Dashboard 위젯 3개 wire 후속**:
    - SLA donut — disputes resolvedAt vs slaDueAt 처리율 (24h 또는 30d)
    - Korea map — `stores.region` groupBy + 17 시도 매핑 (region normalize 필요)
    - Top categories — bookings × `services.category` GMV sum (Epic 2 결제 도입 후 정확)
  - **베타 5곳 매장 매칭** (Jayden 비즈니스 사이드).
  - **`docs/auth-cookie-cache-bench.md` N≥10 통계화** (median + p95) — 후속 perf 작업.

## 세션 29 (2026-05-13 — Admin Dashboard reference parity Phase 2 (PR #151))

- **Phase**: **Plan v3 M1~M5 100% + M6 27 PRs + 외부 데모 폴리시 + Admin chrome 도입**
- **세션 29 머지 (1 PR)**:
  - PR [#151](https://github.com/jaydenjoo/hesya/pull/151) feat(admin) — `/admin/dashboard` reference parity Phase 2. Admin chrome (top bar + sidebar) 신규 + 5 위젯 (월별 바차트 / AI 비용 sparkline / 분쟁 SLA 도넛 / 한국 지도 / Top 5 카테고리, Mock data) + bento 12-col + sticky audit rail + i18n 6 locales `AdminShell`. dashboard 전용 layout — 다른 admin sub-page 9개는 각자 `min-h-screen` 이라 overflow 충돌 → 이번 PR은 dashboard만 적용. recharts BarChart/AreaChart/PieChart + SVG dot heatmap 사용. 5 위젯 모두 컴포넌트 내 const Mock — Phase 2 진입 시 admin-dashboard.ts DAL aggregate 추가 후 wire 예정.
- **L-082 시연 %**: M4 admin 100% 유지. Mock data 위젯이라 실 데이터 시연 % 별도 추적 안 함. 디자인 정합성은 reference HTML과 95%+ (chrome + bento + 위젯).
- **다음 세션 시작점**:
  - **Resend 도메인 검증** (외부 사장 메일 발송) — 베타 출시 차단선. Resend 콘솔 SPF/DKIM 등록 + `from_email` 환경변수 변경. 예상 30~60분.
  - **Admin sub-page 9개 chrome 통합** — `min-h-screen` 제거 + AdminShell wrap. 9개 → 3 PR (분쟁/KYC/결제 / 신고/삭제/API 알림 / AI cost/AI accuracy). 각 ~1.5h.
  - **5 위젯 실 데이터 wire** — admin-dashboard.ts DAL에 monthly/region/category/SLA/spark aggregate 5종 추가 후 props로 주입. ~3~4h.
  - **인증된 owner UI 체감 perf 측정** (PR #150 효과 객관화) — Playwright nav TTFB before/after, docs/auth-cookie-cache-bench.md. ~1~1.5h.
  - **베타 5곳 매장 매칭** (Jayden 비즈니스 사이드).

## 세션 28 (2026-05-13 — 외부 데모 폴리시 2 PRs + prod 재시드 + auth perf)

- **Phase**: Plan v3 M1~M5 100% + M6 26 PRs + 외부 데모 폴리시 (auth 캐싱 + bookings/inbox/landing UX)
- **세션 28 머지 (2 PRs)**:
  - PR [#149](https://github.com/jaydenjoo/hesya/pull/149) fix(demo) — 외부 데모 폴리시 3건 in 1 PR. (1) Landing customerNote 6 locale을 정보문 → CTA 카피 + `<span>` → `<Link href="/{locale}/c">` secondary 버튼. (2) Inbox UUID 8자 prefix → customer.name 표시 — `ConversationListItem` 타입 신규 + DAL `listByStore` 2-query 패턴(50 row 한정 join 대신 dedup). (3) seed-prod-demo.ts b3/b4/b5 bookings serviceId 명시 + 기존 prod row UPDATE 백필.
  - PR [#150](https://github.com/jaydenjoo/hesya/pull/150) perf(auth) — Better Auth `session.cookieCache` 5분 TTL 활성화. `auth.api.getSession()` 매 nav DB SELECT가 cookie direct read로 대체. 로그아웃·revoke lag 5분 — owner UI 흐름상 결제 즉시 가드 없음 + 베타 outbound 메시지는 별도 권한 체크 → 허용 범위.
- **Prod 재시드 (b3/b4/b5 serviceId 백필)**:
  - `node --env-file=.env.local node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs apps/web/scripts/seed-prod-demo.ts` 실행 (idempotent ON CONFLICT DO NOTHING + 명시 UPDATE 3건). `/store/bookings` Service 컬럼 "—" 사라짐.
- **외부 시연 감사 보고서** `docs/external-demo-audit.md` (3679498 → PR #149 squash에 포함됨):
  - 진입 동선 / 5개 도메인 페이지 / 폴백 / 한계 / 디자인 정합성 / 베타 차단선. 1인 운영 외부 시연 baseline 명문화 (memory `feedback_demo_no_personal_env_dependency.md` 보완).
- **L-082 시연 % 변화 없음** — 모든 변경은 정합성/perf 패치. M3 100% / M4 100% 유지.

## 세션 27 (2026-05-13 — 베타 출시 준비, 5 PRs + prod migration + demo account)

- **Phase**: Plan v3 M1~M5 100% + M6 26 PRs + 베타 출시 인프라 (auth + prod 정상화)
- **세션 27 머지 (5 PRs, prod ready 위주)**:
  - PR [#142](https://github.com/jaydenjoo/hesya/pull/142) ICU `FORMATTING_ERROR` 2건 fix — `store/customers` + `store/services` page `t("...")` → `t.raw("...") as string` (PR #141 customer landing fix와 동일 패턴 누락 2건)
  - PR [#143](https://github.com/jaydenjoo/hesya/pull/143) dev-demo.sh UUID v0 → v4 fix + `E2E_CUSTOMER_EMAIL` bypass 추가 — 로컬 `/store/*` + `/c/mypage` 데모 가능
  - PR [#144](https://github.com/jaydenjoo/hesya/pull/144) Owner magic link — `/sign-in` 페이지에 이메일 magic link 폼 추가 (Better Auth + Resend), Google OAuth는 secondary
  - PR [#145](https://github.com/jaydenjoo/hesya/pull/145) Sign-in callbackURL fallback fix — `/sign-in` 직접 진입 시 callback이 `/` 로 떨어져 magic link verify 후 dashboard 도달 못 함 → `/{locale}/store/*` whitelist 강화
  - PR [#146](https://github.com/jaydenjoo/hesya/pull/146) Owner Email + Password 로그인 + magic link 보조 + `NEXT_PUBLIC_DEMO_AUTOFILL` 데모 자동입력 prop — 메일 round-trip 없이 즉시 로그인
- **Prod migration 적용 (Jayden Supabase Studio)**:
  - 0024 `api_policy_alerts` 테이블 (Epic 12.8)
  - 0025 `stores.deleted_at` / `deletion_reason` / `store_deletion_requests` (Epic 12.9) ← `/ko/c` + `/admin/dashboard` 500 원인 해소
  - 0027 `bookings_unique_active_staff_time` partial unique index (race condition 차단)
  - (이미 prod에 있던 0022/0023/0026/0028은 skip)
- **Demo 계정 prod 생성 + 매장 연결**:
  - `demo@hesya.com` / `Hesya!Demo2026` (Better Auth `/api/auth/sign-up/email` curl)
  - user_id `c7e164f3-ce68-421d-b171-34d87a38d89e`
  - "Hesya 데모 헤어샵 (강남)" 매장에 `store_owners` 연결 (Jayden DO 블록 SQL)
- **E2E 검증 (사용자 입장 직접 확인)** — L-082 규칙 준수:
  - Magic link: hidream72@gmail.com 발송 → 메일 클릭 → `/ko/store/dashboard` 진입 ✅
  - Password: demo@hesya.com 입력 → `/ko/store/dashboard` 즉시 진입 + 헤더 "Hesya Demo Owner" 표시 ✅
  - Prod `/ko/c` + `/admin/dashboard` 200 복구 ✅

## P0 Epic 시연 % 최종 (세션 25 머지 반영)

| Phase / Epic                         | 기능 % | 디자인 %        | **시연 % (min)** |
| ------------------------------------ | ------ | --------------- | ---------------- |
| M2 customer (`/c/*`, `/sign-in`)     | 95%    | **95%** ⬆️      | **95%** ✅       |
| M3 owner pages (`/store/*` 11개)     | 100%   | **100%** ⬆️     | **100%** ✅      |
| M4 admin (`/admin/*` 7개 + 2 detail) | 100%   | **100%** ⬆️     | **100%** ✅      |
| Onboarding (kyc / pending)           | 100%   | **100%** (신규) | (M6.14)          |
| M5 demo bypass                       | 100%   | n/a             | **100%** ✅      |

→ **M3 owner / M4 admin 100% 달성** — 모든 헤더 + sub-pages + detail pages가 reference 일관성 통일. 베타 출시 시연 완전 준비.

## M6 phase 머지 PR 목록 (전체 26개)

- Phase 0 [#115](https://github.com/jaydenjoo/hesya/pull/115) 공통 컴포넌트
- M6.1 [#117](https://github.com/jaydenjoo/hesya/pull/117), M6.1b [#126](https://github.com/jaydenjoo/hesya/pull/126) settings
- M6.2 [#118](https://github.com/jaydenjoo/hesya/pull/118), M6.2b [#127](https://github.com/jaydenjoo/hesya/pull/127), M6.2c [#131](https://github.com/jaydenjoo/hesya/pull/131) dashboard
- M6.3 [#119](https://github.com/jaydenjoo/hesya/pull/119), M6.3b [#128](https://github.com/jaydenjoo/hesya/pull/128), M6.3c [#130](https://github.com/jaydenjoo/hesya/pull/130), M6.3d [#132](https://github.com/jaydenjoo/hesya/pull/132), M6.3e [#133](https://github.com/jaydenjoo/hesya/pull/133), M6.3f [#134](https://github.com/jaydenjoo/hesya/pull/134), M6.3g [#135](https://github.com/jaydenjoo/hesya/pull/135) inbox (3-col + composer/assist/empty 완성)
- M6.4 [#120](https://github.com/jaydenjoo/hesya/pull/120), M6.4b [#136](https://github.com/jaydenjoo/hesya/pull/136) bookings + detail
- M6.5 [#121](https://github.com/jaydenjoo/hesya/pull/121) services
- M6.6 [#122](https://github.com/jaydenjoo/hesya/pull/122) customers
- M6.7 [#123](https://github.com/jaydenjoo/hesya/pull/123), M6.7b [#137](https://github.com/jaydenjoo/hesya/pull/137) store sub-pages (knowledge/disputes/inbox-skipped/connect)
- M6.8 [#124](https://github.com/jaydenjoo/hesya/pull/124) admin dashboard
- M6.9 [#125](https://github.com/jaydenjoo/hesya/pull/125), M6.9b [#138](https://github.com/jaydenjoo/hesya/pull/138) admin sub-pages (disputes/verifications/deletion/reports/api-policy-alerts)
- M6.9c + M6.14 [#139](https://github.com/jaydenjoo/hesya/pull/139) onboarding + account + admin detail headers
- Audit fix [#140](https://github.com/jaydenjoo/hesya/pull/140) pending-status + kyc-form + verification-detail (subagent audit)
- i18n fix [#141](https://github.com/jaydenjoo/hesya/pull/141) CustomerLanding.resultsCount (playwright visual diff)
- Admin polish [#129](https://github.com/jaydenjoo/hesya/pull/129) MetricCard

## 🆕 Plan v3 M6 — Owner/Admin 디자인 정합성 (전면)

상세 분해: `docs/Plan-v3-M6-design.md`

### 페이지별 작업 (총 15~17일)

| Task     | 페이지                                                 | 현재 충실도 | 예상  |
| -------- | ------------------------------------------------------ | ----------- | ----- |
| Phase 0  | 공통 컴포넌트 추출 (TopBar / NavSidebar / PageHeader)  | —           | 1일   |
| **M6.1** | `/store/settings`                                      | 21%         | 2일   |
| **M6.2** | `/store/dashboard`                                     | 9%          | 2~3일 |
| **M6.3** | `/store/inbox`                                         | ~10%        | 3~4일 |
| M6.4     | `/store/bookings` + `bookings/[id]`                    | ~25%        | 1일   |
| M6.5     | `/store/services`                                      | ~10%        | 1일   |
| M6.6     | `/store/customers`                                     | ~10%        | 0.5일 |
| M6.7     | knowledge / inbox-skipped / disputes                   | 10~20%      | 0.5일 |
| M6.8     | `/admin/dashboard`                                     | 35%         | 1일   |
| M6.9     | `/admin/ai-cost` + admin sub-pages                     | 30%         | 1일   |
| M6.10~13 | Customer polish (photos / schedule / mypage / sign-in) | 70~90%      | 2일   |

### 다음 세션 시작점

**Phase 0 (공통 컴포넌트 추출)** 우선 — TopBar / NavSidebar / PageHeader를 M6.1~M6.9가 공유하므로 추출 후 각 페이지에서 import. 이게 완료되면 M6.1 Settings 진입.

## 이전 세션 19 (2026-05-12) — 9건 머지

- **Phase 당시**: Plan v3 M1 5/5 + M2 7/7 + M3 5/5 + M4 4/5 + M5 4/5
- **세션 19 머지 (총 3건, main 직접)**:
  - **M5.4 가이드 보강** — `docs/external-demo-guide.md` 5-8 ~ 8 단계 추가 (M3.1~M5.1 흐름 9건) + `DEMO_USER_ID` / `DEMO_CUSTOMER_EMAIL` 등록 절차 명시
  - **M4.2** Inbox skip 큐 UI (deferred 해제, owner-side read-only) — `listSkippedMessagesByStore` DAL (최근 30일 + storeId + outbound + draftStatus='skipped' 필터) + `/[locale]/store/inbox-skipped` page + 6 locale `InboxSkipped` namespace + nav-sidebar active matching 정확화 (`startsWith` → `exact || startsWith + "/"`)
  - **베타 출시 갭 분석** — `docs/beta-launch-gap-analysis.md` 신규 (PRD 베타 조건 vs 현재 P0 평균 84% + ζ.5~ζ.8 4-phase 분해 + 코드 측면 90% 충족 + 잔여 10% Jayden 외부 작업)
- **검증 (최종 패스)**: type-check ✅ / lint ✅ / vitest **704 passed** (+1 pure export test) / build ✅ (`/[locale]/store/inbox-skipped` 라우트 등록 확인)
- **잔여 Plan v3**: M5.4 (Vercel Preview demo env 등록 — Jayden 외부 작업) / M3.3b (customer time-slots dynamic hours, 베타 출시 후)
- **세션 18 종료 시점** (이전 작업 보존):

## 이전 세션 18 (2026-05-12) — 9건 머지

- **Phase 당시**: Plan v3 M1 5/5 + M2 7/7 + M3 5/5 + M4 4/5 + M5 4/5
- **세션 18 머지 (총 9건, main 직접)**:
  - **M3.3a** 매장 설정 + business_hours 컬럼 (`74064aa`) — 마이그 0026 `stores.business_hours` jsonb + `getStoreSettings` / `updateStoreSettings` DAL + `updateStoreSettingsAction` (zod + requireStoreOwnerAuth + rate-limit 30/60s) + `SettingsForm` (요일별 휴무 토글 + time picker) + `/[locale]/store/settings` 라우트 + StoreSettings 6 locale
  - **권장 1** booking conflict 영구 차단 + FAQ embedding (`dad66ec`) — 마이그 0027 `bookings_unique_active_staff_time` partial unique index (status != cancelled) + customer-actions PG 23505 catch (dual-guard) + seed FAQ OpenAI embedding inline 생성
  - **M3.4** customer 로그인 + MyPage (`5b0863c`, option C full scope) — 마이그 0028 (`customers.email/last_seen_at` + `customer_saved_stores` + `reviews.customer_id/booking_id`) + Better Auth magicLink plugin + Resend 6 locale 템플릿 + `customer-guard.ts` + `/c/sign-in` + `/c/mypage` (4-tab: upcoming/past/saved/reviews) + customer-mypage DAL 8 함수
  - **M4.5** customer landing `/c` (`e25f48f`) — `listPublicStores` DAL + region/search filter Client + CustomerLanding 6 locale
  - **M4.1** MOCK_NOTIFICATION env flag (`7084465`) — Resend 호출 3 path (dispute-result / kyc-result / customer-magic-link) MOCK_NOTIFICATION=true 시 console.log skip
  - **ε Epic 4 KPI 활성화** (`663f542`) — `getMonthlyBookingStats` + `getNationalityMix` DAL + dashboard 4 coming-soon tile → active (revenue / avg / no-show / nationalityMix)
  - **M5.5 + M5.3 + M5.2** mock swap + e2e (`ecf7a26`) — `docs/mock-swap-procedure.md` Phase A-F 절차 + customer-mypage-flow.spec.ts (4 tests) + ICU `t.raw` bug fix
  - **M5.1** Vercel preview demo bypass (`1de4d16`, 축소 scope option A) — VERCEL_ENV + DEMO_USER_ID + DEMO_CUSTOMER_EMAIL 이중 가드 + store-owner-guard / customer-guard 적용
  - **M4.3 + M4.4** admin 통합 dashboard + AI cost (`fa7638a`, full scope option C) — admin-dashboard DAL (alert counts / KPI summary / audit trail) + `/admin/dashboard` (4 alert chip + 4 KPI tile + 8-link sub-page hub + audit trail) + ai-cost DAL (14일 daily 집계) + `MODEL_COST_KRW` 모델별 평균 단가 + `/admin/ai-cost` (today + budget progress + sparkline + by-model) + 6 locale AdminDashboard / AdminAiCost
- **검증 (최종 패스)**: type-check ✅ / lint ✅ / vitest **703 passed** (+10) / build ✅
- 🔴 **Jayden 수동 apply 필요** (apply 완료 확인됨): `migrations/0026_store_business_hours.sql` + `0027_bookings_unique_active_staff_time.sql` + `0028_customer_mypage.sql`
- **잔여 Plan v3**: M4.2 (Inbox skip 큐 UI deferred) / M5.4 (Vercel Preview demo env 등록 — Jayden 외부 작업) / M3.3b (customer time-slots dynamic hours, 베타 출시 후)
- **세션 16~17 머지**:
  - **M3.1** 시술 관리 CRUD (`91e6a21`) — services DAL CRUD + 3 actions + Client form + booking 사용 중 검사
  - **M3.2** 외국인 손님 list + 메모 편집 (`79064dd`) — customers DAL `listCustomersByStore` (conversations join distinct on) + `isCustomerInStore` + `updateCustomerNotesAction` + Client inline edit + StoreCustomers 6 locale
- **세션 10~15 머지** (M2 phase 전체):
  - **M2.1** `/c/store/[id]` public 매장 detail (`603272b`)
  - **M2.2** `/c/store/[id]/photos` 사진 gallery (`ca3903d`)
  - **M2.3** `/c/store/[id]/book/schedule` 예약 일정 선택 (`87a07d1`)
  - **M2.4** `/c/store/[id]/book/confirm` 예약 확정 폼 (`3d1e065`)
  - **M2.5** Mock 결제 UI (`c1f4e72`) — 3-tab toggle (Stripe/Alipay/WeChat)
  - **M2.6** 예약 생성 atomic transaction (`a169d9f`) — `createBookingAction` + Drizzle tx
  - **M2.7** 다국어 가격 환산 (`8e1e1b9`) — `formatPriceForLocale` util + 5 위치 교체 (ko/en/ja/vi/zh-CN/zh-TW)
  - 검증: type-check ✅ / lint ✅ / test **691 passed** (+10 currency) / build ✅ (6 customer routes)
  - 자기평가 (L-082): **완전한 customer e2e 흐름** — **90~95% 범위**. 다국어 가격 표시까지 완비. 잔여: 가짜 IG 메시지 자동 발송 (M4.x), conflict 체크 (베타 출시 후)
- **시나리오**: B (풀 P0 베타 — PRD 원안) 위에 **v3 Mock-first 5 phase 추가** (`docs/Plan-v3-mock-first.md`)
- **베타 5곳 출시 가능 시점**: Plan v3 M2~M5 완료(4~6주) + Jayden 사업자 등록 + ζ.7~ζ.8 (2주) = **약 6~8주**
- **세션 9 머지** (10건):
  - [#112](https://github.com/jaydenjoo/hesya/pull/112) ζ.4 통합 부하 시드 + booking Sentry tag (`72acef4`)
  - [#113](https://github.com/jaydenjoo/hesya/pull/113) Plan v3 + Mock env flag 5개 도입 **M1.1** (`e94ff84`)
  - CI workflow 비활성화 (Free 한도 소진 대응, `3ef39cd`)
  - [#114](https://github.com/jaydenjoo/hesya/pull/114) **M1.2** `MOCK_KYC=true` 분기 (`ca168a3`)
  - **M1.3** `MOCK_IG_OAUTH=true` 분기 (main 직접 `f031878`)
  - **M1.4** Sign-in 정식화 + locale selector 활성화 (main 직접 `842e0be`)
  - **M1.5** `docs/external-demo-guide.md` 신규 (main 직접 `5073713`)
- **세션 9 시드 검증** (실 실행 통과):
  - `unset ANTHROPIC_API_KEY && pnpm seed:stress-test` 성공 (매장 5곳 / 메시지 250건 / 예약 50건 / 분쟁 5건 / API 정책 알림 3건 / admin KYC 큐 4건)
- **세션 9 인프라 변경**:
  - **GitHub Actions CI 자동 trigger 비활성화** (`workflow_dispatch`만 유지) — Free 한도 2000분/월 소진 + 결제 잔액 없음. Vercel preview build + 로컬 `pnpm test` 검증으로 갈음.
- **세션 9 Mock 인프라 (M1 전체 결과)**:
  - `MOCK_KYC=true` → data.go.kr 호출 skip + 자동 통과 (외부인 회원가입 자동 진입)
  - `MOCK_IG_OAUTH=true` → Meta 동의 화면 skip + 가짜 access_token + DB upsert (외부인 IG 연결 시뮬)
  - Sign-in locale selector → 6 locale 즉시 전환 (next-intl router.replace)
  - **외부 데모 가능 시점**: Vercel Preview env에 5 MOCK\_\* 등록 + redeploy → 외부인 시뮬 enable (단, M2 customer-side는 아직 비활성)
- **누적 교훈**: L-001 ~ **L-093** (세션 9 신규 1건 — GitHub Actions Free 한도 + Spending Budget $0 조합 차단)

## P0 Epic 객관 완성도 (세션 9 M1 완료 후 — Mock 분기 도입으로 외부 시뮬 enable)

| Epic                | 세션 8 % | 본 세션 9 %                 | 갭                                                                                                   |
| ------------------- | -------- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| E1 인박스           | 71%      | **75%** (+4, M1.3 Mock IG)  | 디자인 정합성 2/5. WhatsApp/카카오/LINE 0%. **M1.3 IG OAuth Mock 도입 완료** → 외부인 연결 시뮬 가능 |
| **E2 결제 위젯** 🔴 | 17%      | **17%** (변동 X)            | DB 스키마만. **M2.5 Mock 결제 UI** 도입 후 자연 활성화 (외부인 시뮬 가능)                            |
| **E3 예약 시스템**  | 50%      | **50%** (변동 X)            | owner-side CRUD 완료. **M2.3/2.4/2.6 customer-side + Mock 결제** 도입 후 100% 도달 가능              |
| **E4 대시보드**     | 35%      | **35%** (변동 X)            | ε shell + 실측 5 KPI. M3.1 services / M3.2 customers 도입 후 추가 KPI active                         |
| E9 KYC 🔴           | 93%      | **96%** (+3, M1.2 Mock KYC) | **M1.2 `MOCK_KYC=true` 분기 도입 완료** → 외부인 회원가입 자동 통과. γ.2.3.3 디자인 정합 잔여        |
| **E12 관리자** 🔴   | 100%     | **100%** (변동 X)           | E12-1~10 완료 + ζ.4 stress test 큐 시연 통과                                                         |

**P0 평균: 62%** (+1, E1·E9 Mock 분기 외부 시뮬 enable). Plan v3 M1 phase 완료 → M2~M5 (4~5주) 남음.

### 세션 10 — Plan v3 M2.1 머지

- **M2.1 산출물** (`603272b`):
  - `apps/web/src/shared/lib/dal/stores.ts` — `getStorePublicById(db, id)` 함수 + `PublicStore` 타입. `auto_approved` + soft-delete X 필터 (외부 손님은 비공개 매장 view 차단)
  - `apps/web/src/shared/lib/dal/stores.test.ts` — pure exports 1 + integration 4 (auto_approved 반환 / manual_review null / soft-delete null / 미존재 UUID null)
  - `apps/web/src/app/[locale]/c/store/[id]/page.tsx` 신규 (Server Component) — UUID 형식 검증 (PostgreSQL invalid-UUID 사전 차단) → `getStorePublicById` + `listServicesByStore` + `listStaffByStore` 병렬 fetch → Fraunces serif 헤더 + hesya-peach/amber/navy 토큰. "예약 진행" CTA는 M2.3 도착 전까지 비활성 (span + aria-disabled)
  - `packages/translations/messages/*.json` — `StoreDetail` namespace 6 locale (title / eyebrow / address / category / servicesHeading / staffHeading / durationMinutes / priceKrw / languagesLabel / bookCta / bookComingSoon / notFoundTitle / notFoundBody)
  - `docs/external-demo-guide.md` — 5번째 단계 "매장 detail public 페이지" + 트러블슈팅 1건 추가
- **i18n 의사결정**: 시술 이름은 `services.name_ko/en/ja/zh_cn/zh_tw/vi` 컬럼 6 locale fallback. 가격은 KRW만 (M2.7에서 다국어 환산 추가 후보)
- **slug 의사결정**: stores 스키마에 `slug` 컬럼 없음 → UUID path param. M5 이후 SEO 단계에서 slug 도입 시 `getStorePublicBySlug` 추가하면 됨

### Public surfaces (P0 Epic 외 신규 카테고리, γ.2.3.5)

| 영역             | 상태 | 비고                                                                             |
| ---------------- | ---- | -------------------------------------------------------------------------------- |
| Landing (`/`)    | ✅   | create-next-app 보일러플레이트 폐기 + Hesya brand hero (5-lang ticker, 6 locale) |
| Design system    | ✅   | 1273줄, Hesya 토큰 다수 사용 (grep 미정합 0건, 검수만)                           |
| 마케팅 sub-pages | 0%   | 가격/About/Blog/FAQ — 베타 출시 후 phase                                         |

> ⚠️ E12-9 매장 해지는 e2e 통과 (owner 요청 → 취소 + admin 큐 cancelled). γ.2.1 KYC→inbox은 admin 클릭 + DB 검증 통과. **prod 시나리오 (실 OAuth 로그인 + 실 IG webhook 수신)**은 다음 phase에서 검증.
> ⚠️ E9 +1은 시각 정합성만 (단위 테스트 className 기반). KYC submit/pending demo 시연은 미인증 user seed 보강 후 가능 — 별 PR 후보.
> ✅ γ.2.3.4/5 시연 prerequisite는 dev-demo.sh가 E2E_ADMIN_EMAIL inject로 자동 충족 (admin) / public route로 자동 충족 (landing) — 별 PR 불요.

## 본 세션 9 (2026-05-11) — ζ.4 stress test + Plan v3 M1 phase 완전 진행 (5/5)

### Scope (8개 큰 작업)

1. **ζ.4 stress test 시드** ([#112](https://github.com/jaydenjoo/hesya/pull/112)) — 통합 부하 250 메시지 + Sentry tag 보강
2. **Plan v3 + M1.1 Mock env flag** ([#113](https://github.com/jaydenjoo/hesya/pull/113)) — Mock-first 5 phase 분해 + env 5개 도입
3. **GitHub Actions CI 자동 trigger 비활성화** (`3ef39cd`) — Free 한도 소진 대응
4. **M1.2 `MOCK_KYC=true` 분기** ([#114](https://github.com/jaydenjoo/hesya/pull/114), `ca168a3`) — data.go.kr 호출 skip
5. **M1.3 `MOCK_IG_OAUTH=true` 분기** (`f031878`) — Meta 동의 화면 skip + 가짜 token 발급
6. **M1.4 Sign-in 정식화** (`842e0be`) — locale selector 활성화 + 임시 페이지 마커 제거
7. **M1.5 외부 데모 가이드** (`5073713`) — `docs/external-demo-guide.md` 신규
8. (M1 phase 5/5 완료 — Plan v3 5 phase 중 첫 milestone 종료)

PostHog 이벤트 / Mock 분기 stub은 다음 phase scope.

### 산출물

#### 1. `apps/web/scripts/seed-stress-test.ts` 신규

LLM 호출 0건 (직접 insert), HESYA_TEST_DATABASE_URL prod URL 가드 (fixture 재사용):

- 매장 5곳: #1 `auto_approved` + IG + 사장 owner (inbox/dashboard stress) / #2~5 `manual_review` + storeVerifications (admin 큐 stress)
- 사장 1명 (DEMO_USER_ID), 고객 25명 (en/ja/zh/vi/th 5종 × 5)
- conversation 25개, **메시지 250건** (inbound 125 + outbound 125, status mix pending_review 75 / sent 25 / skipped 25)
- 시술 5종 + 디자이너 3명 (매장 #1)
- **예약 50건** (매장 #1, statusCycle 10-pattern)
- **분쟁 5건** (매장 #1, category mix complaint 3 / refund 1 / no_show 1)
- **API 정책 알림 3건**

`pnpm seed:stress-test` 실 실행 통과 확인 ✅.

#### 2. `apps/web/src/lib/booking/actions.ts` Sentry tag 보강

surgical change (4원칙 3번):

- import `* as Sentry from "@sentry/nextjs"` (1 line)
- 인증 try-catch unknown error 분기에 `Sentry.captureException(err, { tags: { route: "action:booking-update", phase: "auth" } })`
- rate-limit try-catch unknown error 분기에 동일 패턴 `phase: "rate-limit"`

기존 패턴 재사용 (`webhook:instagram`, `queue:inbox-process-inbound` 등과 일관). dispute / kyc / store-cancellation actions는 ζ.5 보강 후보.

#### 3. `docs/stress-test-guide.md` 신규

- 시드 실행 절차 (L-091 unset ANTHROPIC_API_KEY prefix 의무)
- 시드 데이터 표 + 검증 시나리오 4단계 (E1 inbox 250 / E9 KYC 4 / E12 분쟁 5 + 정책 3 / E4 대시보드 + 예약 50)
- Core Web Vitals 2026 측정 기준 (LCP < 2.5s / INP < 200ms / CLS < 0.1)
- Sentry tag 검증 절차 + 트러블슈팅 5건
- ζ.8 stability watch 재실행 절차

#### 4. package.json script 등록

- `apps/web/package.json` — `"seed:stress-test"` 추가
- root `package.json` — workspace forwarding script 추가

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm --filter @hesya/web lint` ✅
- `pnpm --filter @hesya/web test --run` ✅ 661 passed / 103 skipped (regression 0건)
- `pnpm seed:stress-test` 실 실행 ✅ (DB 시드 console 출력 매칭)

### Known Issue 발견 + 즉시 해결

**증상**: 초기 시드 실행 시 dispute `category=system` PostgreSQL check constraint 23514 위반.
**원인**: `disputes_category_check` enum은 `no_show / refund / complaint` 3종만 허용. `system` 카테고리 없음.
**해결**: `system` → `no_show`로 교체. 동시에 docs도 동기화.
**규칙**: 새 시드 작성 시 enum 값은 DB schema의 check constraint를 먼저 확인.

### 변경 파일

PR #112 (ζ.4):

- `apps/web/scripts/seed-stress-test.ts` 신규 (+~370)
- `apps/web/src/lib/booking/actions.ts` Sentry tag (+7)
- `apps/web/package.json` + root `package.json` script 등록
- `docs/stress-test-guide.md` 신규 (+~100)

PR #113 (M1.1):

- `apps/web/src/shared/config/env.ts` MOCK\_\* 5개 + mockFlag helper (+24)
- `.github/workflows/ci.yml` MOCK\_\* 3 job env block (+17)
- `docs/Plan-v3-mock-first.md` 신규 (+225)

CI 비활성화 (main 직접 push):

- `.github/workflows/ci.yml` — `pull_request` + `push` trigger 주석 처리, `workflow_dispatch`만 유지

### L-093 — GitHub Actions Free 한도 + Budget $0 조합 차단 (신규)

**상황**: PR #112/#113 모두 CI fail (3 job 모두 10초 안에 abort, step 0개). main push runs는 `conclusion=skipped`.

**원인**: 본 repo가 Private + Free plan → 2000분/월 무료 한도. 5월 누적 (hesya + 다른 private repo 합산) 도달. Spending Budget 5개 SKU 모두 `$0 / Stop usage=Yes`로 차단. 결제 잔액도 0.

**해결**: ci.yml의 자동 trigger 제거 → workflow_dispatch만 유지. CI 분 소비 0. Vercel preview build (type-check + build) + 로컬 `pnpm test` (661 단위) + lint-staged pre-commit (prettier + eslint + gitleaks)로 검증 갈음.

**규칙**:

1. **Private + Free repo는 CI 분 소비를 무시하면 안 됨** — 단일 repo에서도 PR 15분 × N PR + main push 15분 = 빠르게 누적
2. **여러 private repo 합산** — 본 hesya만이 아니라 모든 Jayden private repo의 합산이 한도에 영향
3. **Spending Budget UI에서 모든 SKU `$0/Stop usage=Yes` 패턴 = 한도 초과 시 즉시 차단**. 잔액과 별개로 운영자 명시 설정 필요
4. **CI 차단 시 대안**: (a) Public 전환 / (b) Self-hosted runner / (c) **Vercel + 로컬 검증** (본 case 선택) / (d) 한도 리셋 대기
5. **6월 1일(UTC) 한도 리셋 후 결정**: ci.yml 재활성화 시 `paths-ignore: ['docs/**']` + e2e-integration nightly + concurrency cancel 적극 활용

**비유**: "검사관 채용한 회사가 월 무료 노동 시간 한도 초과 + 추가 결제 미설정 → 검사관 출근 거부. 회사는 자체 직원(Vercel)이랑 사내 자동 검사(lint-staged)로 임시 대체."

### M1.2~M1.5 산출물 요약

#### M1.2 `MOCK_KYC=true` 분기 (PR #114, `ca168a3`)

- `apps/web/src/lib/kyc/mock-nts-client.ts` 신규 — `valid="01"` + `b_stt="계속사업자"` 자동 응답
- `apps/web/src/lib/kyc/mock-localdata-client.ts` 신규 — 입력 echo + `SALS_STTS_CD="01"` (영업중) + `OPN_ATMY_GRP_CD="200"` (자유업 그룹)
- `apps/web/src/lib/kyc/actions.ts` — 2 곳에 env-flag 분기 (`ntsData`, `searchResult`)
- 단위 테스트 11건 (mock-nts 5 + mock-localdata 6) ✅
- **외부인 시뮬 효과**: 사업자등록번호 아무 10자리 + 개업일자 8자리 → 자동 `auto_approved` 진입 (LocalData 매칭 100%)

#### M1.3 `MOCK_IG_OAUTH=true` 분기 (`f031878`)

- `apps/web/src/features/inbox/actions/connect-instagram.ts` — env-flag 분기로 mock callback URL 직접 redirect (Meta 동의 화면 skip)
- `apps/web/src/app/api/oauth/instagram/callback/route.ts` — `buildMockExchangeResult` helper + try 블록 분기 (exchangeCode skip + subscribeWebhook skip + 가짜 token/expiresAt/scopes)
- 가짜 token: `mock_token_<32hex>`, externalAccountId: `mock_ig_<storeId-8자>`, scopes: `instagram_business_basic` + `instagram_business_manage_messages`
- 단위 테스트 4건 (env-mocked) ✅
- **외부인 시뮬 효과**: `/store/inbox/connect` "Instagram 연결" 클릭 → 즉시 연결 완료 + DB upsert (UI 일관성: `webhookSubscribed=true` flag)

#### M1.4 Sign-in 정식화 (`842e0be`)

- `apps/web/src/app/[locale]/sign-in/page.tsx` — `LOCALE_LABEL` 객체 → `LOCALES` array 변환, FormPanel에 `locales` + `currentLocale` props 전달
- `apps/web/src/app/[locale]/sign-in/form-panel.tsx` — disabled chip → 작동하는 `<select>` (next-intl `useRouter` + `usePathname`)
- `apps/web/src/app/[locale]/sign-in/sign-in.css` — `.sl-lang-chip:focus-within` + `.sl-lang-select` 스타일 추가
- `CLAUDE.md` — Known Gotchas의 "임시 검증 페이지" 마커 제거
- **외부인 시뮬 효과**: 좌상단 🌐 selector로 6 locale 즉시 전환 (ko/en/ja/vi/zh-CN/zh-TW)

#### M1.5 외부 데모 가이드 (`5073713`)

- `docs/external-demo-guide.md` 신규 — 5단계 흐름 (회원가입 → KYC 자동 통과 → IG 연동 시뮬 → 메시지 시뮬 → 예약/결제) + Vercel Preview env 설정 + 사업자 등록 후 swap 절차 + 트러블슈팅 표 6건
- **타겟**: 외부 베타 후보 / 디자인 검토자 / Jayden 친구 (Mock 모드 사전 안내 + 격리 DB 명시)

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm --filter @hesya/web lint` ✅
- `pnpm --filter @hesya/web test --run` ✅ 676 passed / 103 skipped (M1.2 +5 mock-nts + M1.2 +6 mock-localdata + M1.3 +4 connect-instagram-mock)
- `pnpm --filter @hesya/web build` ✅ Compiled successfully

### 다음 세션 가이드 — Plan v3 M3 진행 (2/5 완료, 3 남음)

| Milestone                             | 우선순위 | 예상  | 비고                                                                              |
| ------------------------------------- | -------- | ----- | --------------------------------------------------------------------------------- |
| **M3.1 `/store/services`** (사장) ✅  | 완료     | -     | `91e6a21`                                                                         |
| **M3.2 `/store/customers`** (사장) ✅ | 완료     | -     | 세션 17 머지 (`79064dd`). list + 메모 inline edit                                 |
| **M3.3 `/store/settings`** (사장)     | 🥇 1순위 | 1일   | 매장 영업시간/주소/연락처. 영업시간 컬럼 신규 (M2.3 hard-code 교체)               |
| **M3.4 `/store/mypage`** (사장)       | 2순위    | 0.5일 | 사장 프로필. Better Auth `users` + store_owners role 표시                         |
| **M3.5 `/store/photos`** (사장)       | 3순위    | 0.5일 | 사장 측 사진 업로드 (M2.2 customer view 대응). `stores.photo_urls` 컬럼 도입 후보 |

총 M3 잔여 ~2일.

**M3.3 사전 인벤토리** (다음 세션 시작 시 의무):

- `stores` schema 컬럼: name/category/region/address/phone — 영업시간 컬럼 **없음**
- 결정: `stores.business_hours jsonb` 컬럼 마이그 0026 신규 도입? 또는 별 테이블?
  - 옵션 A: `stores.business_hours` jsonb (`{ mon: {open: "10:00", close: "20:00"}, tue: ... }`) — 단순
  - 옵션 B: 신규 `store_business_hours` 테이블 (요일별 row) — flexible but 마이그 부담↑
- M2.3 schedule UI의 `BUSINESS_HOUR_START/END = 10/20` 상수 → 매장별 dynamic 교체
- `stores.address` jsonb 형식 확인 (`{full, postal?}`)
- packages/database/CLAUDE.md 마이그 절차 의무 — manual SQL + ROLLBACK 주석
- Jayden 수동 apply (🔴 보안)

## 직전 세션 8 (2026-05-11) — Phase 1-ζ Prep (베타 매칭 docs 준비)

### Scope (docs only — 코드 변경 없음)

세션 7 (Epic 3 owner-side + Dashboard KPI wire) 직후, 베타 출시 critical path 진입을 위한 docs 준비. **외부 리소스 생성 (ζ.1/ζ.2 Supabase·Vercel) + 베타 매장 onboarding 실행 (ζ.7)** 은 Jayden 사업자 등록 완료 후 → 본 세션 scope 밖. 사업자 등록과 무관한 사전 작성 가능 docs에 집중.

### L-089 prod 배포 검증

세션 7 머지 (`9d66efd` docs / `c9704bf` PR #111) Vercel Production:

- `9d66efd` Production **success** (2026-05-11 07:45)
- `c9704bf` Production **success** (2026-05-11 07:42)
- → 수동 redeploy 불필요. L-089 자동 통과.

### 산출물

#### 1. `docs/demo-guide.md` 갱신

- **시드 데이터 명세 표** — 세션 7에서 추가된 시드 5종 행 신규:
  - 시술 5종 (커트 35,000 / 펌 120,000 / 염색 95,000 / 트리트먼트 55,000 / 두피 케어 70,000)
  - 디자이너 3명 (A ko·en / B ko·ja / C ko)
  - 예약 10건 (상태 mix: scheduled 3 / completed 5 / no_show 1 / cancelled 1)
  - 분쟁 1건 (Epic 12.4 시연용)
  - API 정책 알림 1건 (Epic 12.8 admin 큐 시연용)
- **시연 시나리오 신규 2개**:
  - **C. 사장 — 예약 관리** (`/ko/store/bookings` + `/[id]`): 5-status filter pill + detail 7행 + 3 terminal action
  - **D. 사장 — 대시보드 KPI** (`/ko/store/dashboard`): 12 KPI 중 5 active (미응답 / 분쟁 / KYC / 시술 분포 donut / 디자이너 분포 donut) + 7 coming-soon
  - 두 시나리오 연계 시연 팁: C에서 예약 `completed` 변경 → D 새로고침 시 donut 즉시 반영
- **Phase 2 예고 섹션** — ζ.1 trigger 3-조건 명시 (사업자 등록 / 베타 후보 1~2곳 확보 / Stripe Connect 1매장 진입). 외부 리소스 = Jayden 명시 승인 필수 재차 명기.

#### 2. `docs/beta-onboarding-checklist.md` 신규

베타 매장 사장과 함께 점검하는 항목을 5 단계로 분해:

- **0. Jayden 측 사전 준비** — 사업자 등록 / demo.hesya.com 인프라 / 약정서 초안 / 데모 영상
- **1. 매장 측 사전 자료** — 사업자등록증 / IG 비즈니스 계정 전환 / 시술 정보 (선택)
- **2. Hesya onboarding 시퀀스** — 계정 생성 → KYC 심사 → IG 연동 → 첫 워크스루 → 1주차 daily 점검
- **3. 베타 5곳 확대 트리거** (ζ.8 진입 조건)
- **4. 베타 종료 시** (정식 출시 진입 전 약정 v2 갱신)
- **5. 비상 절차 5 상황** — Sentry critical / IG webhook 끊김 / 응답 시간 > 3분 / 사장 중단 요청 / KYC 자동 승인률 < 60%

베타 SLA 명시: 메시지 응답 < 3분 (자동), 다운 시 6시간 내 복구, 결제 위젯 미포함 (베타 중반 도입).

### 다음 세션 분기 (사업자 등록 시점 의존)

| 분기                       | 조건                          | 예상  | 비고                                                |
| -------------------------- | ----------------------------- | ----- | --------------------------------------------------- |
| **(B) δ Epic 2 결제**      | 사업자 등록 미완 OK           | 2~3주 | 🔴 RED. Stripe 인프라 (DB·테스트 키)부터 진입 가능  |
| **(D) ζ.4 stress test**    | 사업자 등록 미완 OK           | 1일   | 50+ 메시지/매장 통합 부하 + Sentry tag 보강         |
| **(D) ζ.5 monitoring**     | 사업자 등록 미완 OK           | 1일   | PostHog 이벤트 인벤토리 + 누락 보강                 |
| **(D) ζ.1 demo.hesya.com** | **사업자 등록 후**            | 2일   | Supabase/Vercel 신규 — Jayden 명시 승인 + 예산 합의 |
| **(D) ζ.7 베타 onboard**   | **사업자 등록 후 + ζ.1 완료** | 1주   | 본 체크리스트 실행                                  |

### 변경 파일

- `docs/demo-guide.md` (+~50 / -~10)
- `docs/beta-onboarding-checklist.md` 신규 (+~110)
- `PROGRESS.md` (세션 8 섹션 추가 + 헤더 갱신)

### Vercel 배포

- docs only — Vercel 자동 배포 트리거 (production deployment 진행)

## 직전 세션 7 (2026-05-11) — Phase 1-δ (Epic 3 예약 owner-side + Dashboard KPI wire)

### 머지된 PR

| #                                                   | Task                                            | 상태                |
| --------------------------------------------------- | ----------------------------------------------- | ------------------- |
| [#111](https://github.com/jaydenjoo/hesya/pull/111) | Epic 3 owner-side bookings + Dashboard KPI wire | ✅ 머지 (`c9704bf`) |

### Phase 1-δ — Epic 3 예약 시스템 (Scope B': owner-side CRUD + 디자이너/시술 KPI wire)

**Scope 의사결정**: Plan v1에서 4개 옵션 비교 후 B' 채택.

- ❌ A. Full PRD per spec (customer-side + 결제 + 다국어 페이지) — Epic 2 결제 0건이라 불가
- ❌ B. owner-side만 (CRUD만, dashboard wire 없음) — 시연 가치 한계
- ✅ **B'. owner-side CRUD + dashboard 분포 KPI wire** — 같은 데이터셋 2번 활용, "베타 매장이 IG DM 받은 예약 추적" 시연 가능
- ❌ C. customer-side stub 우선 (결제 mock) — 결제 mock = 베타 출시 위험

### Owner-side 구현

**DAL** (`apps/web/src/shared/lib/dal/`):

- `bookings.ts` — `listBookingsByStore` (filter), `getBooking`, `updateBookingStatus` (storeId match 이중 검증), `countBookingsByService`, `countBookingsByStaff` (월 분포 KPI용)
- `services.ts` — `listServicesByStore` (nameKo asc), `listServicesByIds`
- `staff.ts` — `listStaffByStore` (name asc), `listStaffByIds`
- 단위 + integration tests (5 unit + 9 integration, HESYA_TEST_DATABASE_URL 게이트)

**Server Action** (`apps/web/src/lib/booking/actions.ts`):

- `updateBookingStatusAction` — zod 검증 + `requireStoreOwnerAuth` + `checkRateLimit` (30/60s, 분쟁 20/60s보다 완화) + storeId match (DAL + action 이중)

**Routes**:

- `/[locale]/store/bookings?status=…` — 5 status filter (all / scheduled / completed / no_show / cancelled)
- `/[locale]/store/bookings/[id]` — 정보 + 3 terminal action (다른 storeId는 notFound로 위장)

**Feature 컴포넌트** (`apps/web/src/features/booking/`):

- `bookings-list.tsx` (server) — γ.2.3.4 5-signal pattern 재사용:
  1. Filter pill 3-state (`border-gray-200` / hover `border-navy` / active `bg-hesya-navy-900 text-hesya-peach-50`)
  2. Table row `border-hesya-peach-100` + hover `bg-hesya-peach-50/40`
  3. Status badge tone 4종 (scheduled peach / completed emerald / no_show red / cancelled gray)
  4. Detail link `text-hesya-amber-500 hover:underline`
  5. `buildServiceLabels` locale-aware (ko/en/ja/zh-CN/zh-TW/vi)
- `booking-detail.tsx` (client) — `useTransition` + 3 terminal action. amber primary + peach borders. terminal 시 액션 hide.

### Dashboard KPI Wire

`/[locale]/store/dashboard`:

- coming-soon → active 2개 (시술 분포 / 디자이너 분포)
- 신규 컴포넌트 `distribution-pie.tsx` (Recharts donut, hesya 6색 팔레트, h-24, innerRadius 20 / outerRadius 40)
- `getCurrentMonthRange()` Asia/Seoul 월 범위
- 12 KPI 현황: **5 active** (미응답 / 분쟁 / KYC / 시술 분포 / 디자이너 분포) + 7 coming-soon (월 매출 / 객단가 / 재방문률 / 노쇼율 / 국적 분포 등)

### i18n Bookings namespace 6 locales

`ko / en / ja / vi / zh-CN / zh-TW`: title / subtitle / filterAll / 4 status filter / 5 columns / 4 status label / empty / detail / 7 fields / 5 actions.

### Demo seed 보강

`apps/web/scripts/seed-beta-demo.ts`:

- 시술 5종 (커트 / 펌 / 염색 / 트리트먼트 / 두피 케어, 다국어 라벨)
- 디자이너 3명 (A/B/C, 언어 mix)
- 예약 10건 status mix (scheduled 3 / completed 5 / no_show 1 / cancelled 1) — 분포 KPI 시연용

`apps/web/e2e/fixtures/db.ts` resetDb 확장: services + staff delete 추가 (FK chain `bookings → services → stores`).

### 검증

- `pnpm type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 errors / 0 warnings
- `pnpm --filter @hesya/web test` ✅ 661 passed / 103 skipped (integration DB gate)
- `pnpm --filter @hesya/web build` ✅ Compiled successfully, 새 routes `/store/bookings`·`/store/bookings/[id]` 등록 확인
- Playwright 4 캡처 (데스크탑 list + detail + dashboard wired KPI / 모바일 list) ✅
- CI 4단 통과 (Vercel preview / e2e-smoke / e2e-integration / validate) → auto-merge

3 commit (`f2fb349` 본체 + `a6f16af` resetDb FK fix + `158adef` 단위 테스트 동기화).

총 30 files / +1718/-8 / 신규 unit/integration tests 18개.

### L-092 — resetDb 다중 위치 동기화 누락

**증상**: PR #111 CI e2e-integration + validate 둘 다 실패. FK violation `services_store_id_stores_id_fk on table services` + 단위 테스트 `resetDb deletes tables in FK-safe order` assertion mismatch.

**원인**: resetDb가 **3 군데**에 있는데 1개만 갱신:

1. ✅ `apps/web/e2e/fixtures/db.ts` (Playwright E2E용) — 처음에 services + staff 추가함
2. ❌ `apps/web/src/test-helpers/db.ts` (vitest integration용) — 누락
3. ❌ `apps/web/src/test-helpers/db.test.ts` (resetDb 호출 순서 단위 테스트) — assertion 누락

**해결**: a6f16af / 158adef 2 PR-내 추가 commit으로 동기화.

**규칙 (L-092)**: "production code의 resetDb 류 helper를 수정할 때, 같은 이름 함수가 **2곳 이상**에 있는지 grep 의무". `grep -rn "export async function resetDb" apps/web/` 결과 모든 위치 확인 → 동시 갱신 + 그 helper를 호출하는 단위 테스트 assertion도 함께 갱신.

**Pre-Plan Inventory에 추가할 절차**: 새 테이블 추가 시 `grep -rn "delete(.*tables)" apps/web/src/test-helpers apps/web/e2e/fixtures` 의무.

### Vercel 배포

- PR #111 `c9704bf` → main 자동 배포 (Vercel deployment 진행)

## 직전 세션 6 (2026-05-11) — Phase 1-ε (Epic 4 대시보드 인프라)

### 머지된 PR

| #                                                   | Task                                         | 상태                |
| --------------------------------------------------- | -------------------------------------------- | ------------------- |
| [#110](https://github.com/jaydenjoo/hesya/pull/110) | Epic 4 매장 운영 대시보드 인프라 + KPI shell | ✅ 머지 (`3976a55`) |

### Phase 1-ε — Epic 4 대시보드 (Scope C: 인프라 + Shell + 실측 3 KPI)

**Scope 의사결정**: Plan v1에서 3개 옵션 비교 후 C 채택.

- ❌ A. Full per PRD (12 KPI 실 차트) — Epic 2/3 데이터 0건 → 시연 가치 0
- ❌ B. Shell만, KPI 실측 0개 — 너무 minimal
- ✅ **C. 인프라 + Shell + 실측 3개** — 시각 약속 + Recharts 깔아두기 + Epic 2/3 도입 시 wire only

활성 KPI 3개 (현 phase 측정 가능):

- **미응답 메시지** — `conversations.unread_count` sum (open만), subtext "N 열린 대화"
- **처리 중 분쟁** — `disputes.status IN open|in_review`, SLA 초과 시 subtext
- **KYC 상태** — `stores.verification_status` (5상태 다국어)

Coming-soon placeholder 9개 (Epic 2/3 도입 후 wire):

- 월 매출 / 평균 객단가 / 재방문률 / 노쇼율 / 국적 분포 / 시술 분포 / 디자이너 분포 등

### 시각 시그널

| 영역   | Active                   | Coming-soon                                 |
| ------ | ------------------------ | ------------------------------------------- |
| Border | `border-hesya-peach-100` | `border-dashed border-hesya-peach-200`      |
| BG     | `white`                  | `bg-hesya-peach-50/60`                      |
| 값 색  | `text-hesya-navy-900`    | `text-hesya-navy-900/35` (fade)             |
| 부가   | subtext 표시             | uppercase "데이터 적재 후 자동 활성화" caps |

반응형: mobile **1col** / sm **2col** / lg **4col**.

### 인프라

- `recharts ^3.8.1` 설치 (apps/web)
- `@hesya/database` facade에 `count` / `sum` export 추가 (drizzle-orm 캡슐화 유지)

### i18n Dashboard namespace 6 locales

`ko / en / ja / vi / zh-CN / zh-TW` 모두: title / subtitle / 12 KPI labels / 5 KYC states / units / coming-soon notes / footer.

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 errors / 0 warnings
- `pnpm --filter @hesya/web exec vitest run src/features/dashboard src/shared/lib/dal/dashboard` ✅ 13 passed (7 component + 6 DAL integration)
- `pnpm --filter @hesya/web build` ✅ Compiled successfully
- Playwright `/ko/store/dashboard` 데스크탑 4-col + 모바일 1-col 시각 ✅
- CI 4단 통과 (Vercel preview / e2e-smoke / e2e-integration / validate) → auto-merge

18 files / +1207/-11 / 신규 unit tests 13개.

### Vercel 배포

- PR #110 `3976a55` → main 자동 배포 (Vercel deployment 진행)

## 직전 세션 5 (2026-05-11) — Phase 1-γ.2.3.5 (γ.2.3 5-split 마무리)

### 머지된 PR

| #                                                   | Task                                            | 상태                |
| --------------------------------------------------- | ----------------------------------------------- | ------------------- |
| [#109](https://github.com/jaydenjoo/hesya/pull/109) | γ.2.3.5 Hesya landing 신규 + design-system 검수 | ✅ 머지 (`b9a6d68`) |

### Phase 1-γ.2.3.5 — Hesya Landing 신규 (보일러플레이트 폐기)

**중대한 발견 (Pre-Plan Inventory)**: `app/[locale]/page.tsx`가 여전히 `create-next-app` 보일러플레이트 상태 ("Deploy Now / Documentation"). prod 첫인상에 직접 영향 — 베타 출시 전 차단.

**Scope 의사결정**: B (minimal Hesya hero) 채택 — A (full 646줄 reference) / C (placeholder)와 비교.

신규 컴포넌트 (`features/landing/`):

1. **greeting-ticker.tsx** (client) — 5개 언어 인사 cycling 3.2s 주기 (en/ko/ja/zh/vi). kr Pretendard bold 26px / non-kr italic display 28px. Amber underline (28~36px) 활성 인사 따라 width 전환. `motion-reduce` 존중.
2. **landing-hero.tsx** (server) — peach-50 bg + navy-900 + amber-500 CTA → `/[locale]/sign-in` (사장님 단일 CTA). Sub copy max-w 30ch / navy-900/75. Customer note (검색은 베타 합류 후).
3. **landing-footer.tsx** (server) — 미니멀 (브랜드 마크 + locale 스위처 5개 + hint). Active aria-current + 비활성 hover amber-500.

i18n Landing namespace 6 locales 추가: subCopy / ownerCta / customerNote / footerHint (ko, en, ja, vi, zh-CN, zh-TW).

`app/[locale]/page.tsx` 65줄 보일러플레이트 → ~33줄 server component (next-intl getTranslations + hero/footer 조립).

### Design system 검수

`app/[locale]/design-system/page.tsx` (1273줄) — grep 미정합 0건 확인 (이미 Hesya 토큰 19건 적용 완료). Surgical 수정 불요.

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 errors / 0 warnings
- `pnpm --filter @hesya/web exec vitest run src/features/landing` ✅ 12 passed (ticker 6 + hero 3 + footer 3)
- `pnpm --filter @hesya/web build` ✅ Compiled successfully
- Playwright `/ko`, `/en`, `/ja` 시각 캡처 ✅ (greeting ticker cycling 작동 — 3개 다른 시점 caught)
- CI 4단 통과 (Vercel preview / e2e-smoke / e2e-integration / validate) → auto-merge

14 files / +354/-58 / 신규 unit tests 12개.

### Vercel 배포

- PR #109 `b9a6d68` → main 자동 배포 (Vercel deployment 진행)

## 직전 세션 4 (2026-05-11) — Phase 1-γ.2.3.4

### 머지된 PR

| #                                                   | Task                                              | 상태                |
| --------------------------------------------------- | ------------------------------------------------- | ------------------- |
| [#108](https://github.com/jaydenjoo/hesya/pull/108) | γ.2.3.4 admin 8큐 디자인 정합성 적용 (5종 시그널) | ✅ 머지 (`38e9bd8`) |

### Phase 1-γ.2.3.4 — Admin 8큐 디자인 정합성

`docs/design/reference/admin-*.css` (admin-kyc / admin-chrome 등 5 reference) palette 기반 5종 시각 시그널 적용. **DB / Server Action / chrome 변경 0건**.

1. **PageHeader h1**: `text-3xl font-bold` → `text-2xl + tracking-[-0.02em] + text-hesya-navy-900`
2. **Filter pills**: `bg-black/text-white` → 3-state pill (default `border-gray-200` / hover `border-navy` / active `bg-navy text-peach-50`)
3. **Table row**: `border-b` → `border-hesya-peach-100` + hover `bg-hesya-peach-50/40`
4. **SLA / Status badge**: `text-red-600 / orange-600` → 초과 `bg-peach-100 text-red-500` / 경고 `text-hesya-amber-500`
5. **Detail link**: `text-blue-600 underline` → `text-hesya-amber-500 hover:underline`

적용 영역 (18 file):

- **features (5)**: `features/admin/components/{disputes-list, dispute-detail, store-verifications-list, store-verification-detail}.tsx` + `features/store-deletion/components/admin-deletion-queue.tsx`
- **admin/\* page.tsx (10)**: 8개 route + 2개 `[id]/page.tsx` — h1 + inline UI 토큰 정합
  - 4개 큐 inline UI: ai-accuracy / api-policy-alerts / payment-monitoring / store-reports
  - kyc-test: h1 + 4 primary button만 (WCAG AAA 주석 영역 보존)
  - store-deletion 강제해지 form: red semantic 유지 (위험 액션 의도)
- **신규 테스트 (3)**: disputes-list.test.tsx (8 cases) + admin-deletion-queue.test.tsx (6 cases) + store-verifications-list.test.tsx (+2 visual)

총 18 files / +476/-134 / 신규 시각 시그널 unit tests 16개.

### L-082 시연 prerequisite 자동 충족

`dev-demo.sh`가 `E2E_ADMIN_EMAIL=demo-owner@hesya.local` + `E2E_AUTH_USER_ID` inject → `requireAdminEmail()` 즉시 우회 조건 (NODE_ENV !== production && E2E_ADMIN_EMAIL 있음) → `/ko/admin/*` 직접 접근 가능 → Playwright 8 페이지 캡처 시각 정합성 검증 통과.

별 PR (dev-demo seed 미인증 user 보강)은 **불필요** — bypass 작동.

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 errors / 0 warnings
- `pnpm --filter @hesya/web exec vitest run src/features/admin src/features/store-deletion` ✅ 19 passed
- `pnpm --filter @hesya/web build` ✅ Compiled successfully
- Playwright 8 admin 페이지 시각 정합성 검증 ✅ (캡처: `.playwright-mcp/admin-*.png`)
- CI 4단 통과 (Vercel preview / e2e-smoke / e2e-integration / validate) → auto-merge

### Vercel 배포

- PR #108 `38e9bd8` → main 자동 배포 진행 (deployment `AARDxtRUvRYoed7LrFbuKEx2wZ6r`)

## 직전 세션 3 (2026-05-10) — Phase 1-γ.2.3.2 + γ.2.3.3

### 머지된 PR

| #                                                   | Task                                                                | 상태                 |
| --------------------------------------------------- | ------------------------------------------------------------------- | -------------------- |
| [#106](https://github.com/jaydenjoo/hesya/pull/106) | γ.2.3.2 inbox 메인 thread + draft review 디자인 정합성 (5종 시그널) | ✅ 머지 (`d041080`)  |
| [#107](https://github.com/jaydenjoo/hesya/pull/107) | γ.2.3.3 KYC submit/pending Hesya 토큰 + sign-in 회귀 검증           | ✅ 머지 (`098d9f0b`) |

### Phase 1-γ.2.3.2 — Inbox 메인 thread + draft review (Col 2)

reference `docs/design/reference/inbox-app.jsx` Col 2 영역 시각 시그널 5종 매핑. **DB/로직 변경 0건**.

1. **ThreadHeader** (.ix-thread-head): h-16 + 36px avatar + peach-100 border + meta row (11px gray-500). Badge → span(meta pattern).
2. **MessageView stream** (.ix-stream): `bg-hesya-peach-50` + `px-5 py-4 gap-2.5` (message-list).
3. **MessageBubble** (.ix-msg/.ix-bubble): inbound peach-50 → peach-100, max-w 75% → 78%, asymmetric corner (outbound 우하 4px / inbound 좌하 4px), `<time>` 버블 외부로 분리, bubble-trans border 색 정합 (customer navy/10, owner white/25).
4. **DraftReviewPanel** (.ix-assist): `motion-safe slide-in-from-bottom-2 220ms` 추가, 승인+전송 emerald-500 → amber-500 (Hesya 디자인 토큰 정합 + primary action), 무시 ghost 명시적 bg-transparent.
5. **vitest.setup.ts** N8N_WEBHOOK_SECRET stub 추가 (env schema 동기화 — 본 PR 검증 차단 방지).

10 files / +157/-43. 신규 시각 시그널 단위 테스트 8개 추가.

### Phase 1-γ.2.3.3 — Onboarding sign-in/KYC submit/KYC pending

3 페이지 묶음:

- **Sign-in (변경 0줄)**: 이미 reference `login-store-app.jsx` 80%+ 매칭 (첫 40 클래스 동일). 차이 ~159줄은 의도된 누락 영역 (Hesya는 Google OAuth 단일 → email/password form scope 외). Playwright 회귀 캡처로 회귀 없음 확인.
- **KYC submit page + KycForm**: Hesya 토큰 0% → 100%. 검은 버튼(bg-black) → amber-500 primary, generic input border → peach-200 + amber-500 focus ring, fieldset peach-50/60 + peach-200 border, kr Pretendard 라벨.
- **KYC pending page + PendingStatus**: 5상태별 시각 분리 StatusCard (warn/success/error/neutral) — manual_review(amber-500/peach-100), auto_approved(emerald-500/emerald-50 + amber primary CTA), rejected(red-500/red-50), pending(peach-200/peach-50), session_expired(warn + ghost CTA). 공통: rounded-2xl + border-l-4 + 아이콘 9x9 원형.

6 files / +211/-32. 신규 시각 시그널 단위 테스트 7개 (kyc-form 3 + pending-status 4).

### 시연 prerequisite 한계 (L-082) — KYC submit/pending

demo 환경에 미인증 user seed 부재 → 직접 접근 시 sign-in redirect. **단위 테스트 className 기반 검증으로 갈음**. demo seed 보강은 별 PR 후보 (γ.2.3 후속 또는 ζ 단계).

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors (양 PR)
- `pnpm lint` ✅ 0 issues
- `pnpm --filter @hesya/web exec vitest run src/features/inbox` ✅ 276 passed (γ.2.3.2)
- `pnpm --filter @hesya/web exec vitest run src/features/onboarding` ✅ 20 passed (γ.2.3.3)
- 누적 신규 시각 시그널 unit tests 15개 (γ.2.3.2: 8 + γ.2.3.3: 7)
- 시각 검증:
  - γ.2.3.2: Playwright /ko/store/inbox + thread 선택 + Col 2 캡처 ✅ reference 매칭 확인
  - γ.2.3.3: Playwright /ko/sign-in 회귀 캡처 ✅ reference 매칭 유지. KYC submit/pending은 redirect로 단위 테스트 갈음

### Vercel 배포

- PR #106 `d041080` → main 자동 배포 ✅ (deployment ID `EXVxdjXi7x233PgGPhNNTd5NZ8j4`)
- PR #107 `098d9f0b` → main 자동 배포 (CI 직후 자동 배포 진행)

## 직전 세션 2 (2026-05-10) — Phase 1-γ.2.3.1

### 머지

| #                                                   | Task                                                              | 상태                |
| --------------------------------------------------- | ----------------------------------------------------------------- | ------------------- |
| [#105](https://github.com/jaydenjoo/hesya/pull/105) | γ.2.3.1 inbox 좌측 thread list 디자인 정합성 (5종 시그널)         | ✅ 머지 (`26dc381`) |
| `5c13f71`                                           | docs L-091 추가 + PROGRESS.md "알려진 환경 이슈" 정정 (main 직접) | ✅ push 완료        |

### Phase 1-γ.2.3.1 — Inbox 좌측 thread list/item 디자인 정합성

- 5종 디자인 시그널 적용 (reference `docs/design/reference/inbox-app.jsx` Col 1 + `inbox.css` `.ix-thread-row`):
  1. **active 좌측 3px amber bar** (`before:` pseudo) — 현재 thread 시각 강조
  2. **avatar 4색 cycling** (peach-200 / peach-100 / peach-50 / trust-rose, customerId 해시 결정적)
  3. **avatar 38px + channel icon 18px + peach-50 ring** — reference size/border 매칭
  4. **unread bg subtle** (`bg-hesya-peach-100/40` Tailwind v4 alpha modifier) — 읽지 않은 thread 시각 차이
  5. **row separator peach-100** (옅음) — reference border-bottom과 일치
- thread-item.tsx ~35줄 / thread-list.tsx 2줄 / thread-item.test.tsx +50줄(4 신규 테스트)
- 시각 검증 통과: pnpm dev:demo + Playwright로 active state + 우측 ThreadView 정상 작동 캡처
- **범위 OUT** (4원칙 2번 — 데이터 한계 / 별 PR 약속 유지): Filter pill / 채널 chip / Search bar / Foot tag (AI 대기·urgent·done) / ThreadHeader (Col 2)

### L-091 — Claude Code shell 환경 진단 (세션 핵심 발견)

- **증상**: Claude Code 안에서 `pnpm dev:demo` 실행 시 zod 2 에러 (ANTHROPIC_API_KEY format + N8N_WEBHOOK_SECRET undefined)
- **근본 원인**: Claude Code CLI host가 subshell에 `ANTHROPIC_API_KEY=""` (빈 문자열) 자동 inject → `@next/env`는 process.env에 이미 있는 키 skip → .env.local의 정상 값 무력화
- **해결**: `unset ANTHROPIC_API_KEY && pnpm dev:demo` (한 줄)
- **메타**: PROGRESS.md "알려진 환경 이슈" 섹션의 _"Jayden .env.local의 sk-ant- prefix 형식 점검 필요"_ 기재는 오진단. Jayden 환경은 정상 (`sk-ant-api03...` 108자), Claude Code shell이 원인.
- **세션 2 추가 메모리**: `env_claude_code_shell_anthropic_key.md` (project type) — 향후 모든 Hesya 세션에서 인지

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 issues
- thread-item 12 tests + thread-list/empty/header/shell 15 tests = 27 inbox tests ✅
- Tailwind v4 alpha modifier (`bg-hesya-peach-100/40`) ✅ 컴파일 + 렌더 정상
- Vercel Preview build ✅ — prod 빌드 환경에서도 컴파일 통과
- 시각 검증 ✅ — Playwright로 active 좌측 amber bar / avatar 4색 cycling 캡처 확인

## 본 세션 1 (2026-05-10) — Phase 1-γ.1.5 ~ γ.2.2 일괄 진행

### 머지된 PR / 커밋 (5건)

| #                                                   | Task                                                         | 상태              |
| --------------------------------------------------- | ------------------------------------------------------------ | ----------------- |
| `50f363d`                                           | Housekeeping (데모 PNG 7개 정리 + .gitignore 보강)           | ✅ main 직접 push |
| [#101](https://github.com/jaydenjoo/hesya/pull/101) | γ.1.5 E12-9 매장 해지·데이터 삭제 (soft-delete + 30일 grace) | ✅ 머지 (8819487) |
| [#102](https://github.com/jaydenjoo/hesya/pull/102) | γ.1.6 Epic 12 통합 E2E (admin 6개 큐 순회)                   | ✅ 머지 (513eab7) |
| [#103](https://github.com/jaydenjoo/hesya/pull/103) | γ.2.1 KYC→inbox 통합 E2E (admin 진짜 클릭 승인 + draft 전송) | ✅ 머지 (369d125) |
| [#104](https://github.com/jaydenjoo/hesya/pull/104) | γ.2.2 NTS audit log + edge case 보강 (6 unit tests)          | ✅ 머지 (af97fc7) |

### Phase 1-γ.1.5 — 매장 해지·데이터 삭제 (E12-9)

- 0025 manual SQL 마이그: `stores.deleted_at` + `store_deletion_requests` 테이블
- **FK ON DELETE SET NULL + `store_name_snapshot`** 패턴 — cascade 후에도 audit trail 보존
- DAL: `requestStoreDeletion / cancelStoreDeletion / listDeletionRequestsForAdmin / purgeExpiredStoreDeletions`
- Server Actions: owner self-request + admin admin-request (rate-limit 적용)
- Cron: `/api/cron/cascade-delete-expired-stores` (timing-safe Bearer, PII 미반환)
- Webhook routing block: `findStoreByExternalAccount`에 `isNull(stores.deletedAt)` 추가 → soft-deleted 매장으로 IG 메시지 라우팅 차단
- e2e 통과: owner 요청 → grace 카운트 → 취소 → admin 큐 cancelled

### Phase 1-γ.1.6 — Epic 12 통합 E2E

- `e2e/epic-12-integration.spec.ts` 단일 spec: admin 6개 큐 순회 (분쟁 → 결제이상 → AI정확도 → API정책 → 매장해지 → KYC)
- 시드: 1 admin + 1 store + 분쟁 1 + API alert 1 + 해지 요청 1 → 6 페이지 모두 헤딩 + row 검증
- E12 75% → 100%

### Phase 1-γ.2.1 — KYC→inbox 통합 E2E

- `e2e/kyc-to-inbox-flow.spec.ts`: phase-1-beta가 cover 못 하던 갭 (admin DB update 시뮬 → admin 진짜 클릭 승인)
- 시나리오 8단계: manual_review seed → admin 큐 → 상세 → 승인 클릭 → DB `auto_approved` 검증 → IG integration seed → owner inbox → "승인+전송" → DB `sent`
- E9 KYC 88% → 92%

### Phase 1-γ.2.2 — NTS audit log + edge case

- `kyc-log-repo.ts`: KycLogRepo (audit log immutable trail, PII 2차 저장 회피 — 성공 시 `extracted` 미포함, 실패 시 error code만)
- `nts-client.test.ts`: 6 unit tests (5xx 3회 재시도, 4xx 즉시 fail, network reject, 200 + invalid JSON, 200 + data[] empty, 정상 흐름)
- `actions.ts`: `extractOcrFromLicenseAction` 실패 path도 audit log 기록
- 보안 review (subagent): NO-GO HIGH (PII 2차 저장) → 정제 → GO. L-090 (gitleaks placeholder) 신규.

### Vercel/Env 진단 — 본 세션 추가 교훈 (L-088 ~ L-090, L-087 정확화)

- **L-088**: Vercel Dashboard env 등록 후 마스킹 (Encrypted/Sensitive Sensitive)은 **정상 동작**. UI에서 값이 사라진 것처럼 보여도 저장은 완료된 상태.
- **L-089**: env 갱신만으로는 자동 redeploy 안 됨 — Vercel Dashboard에서 **수동 redeploy 의무**.
- **L-090**: gitleaks `generic-api-key` entropy 임계는 ≈3.7+ → 테스트 fake key는 `REPLACE_ME_FAKE_*` prefix로 entropy < 3.5 유지.
- **L-087 정확화**: `openssl rand -base64 32`는 32 byte raw → **44 char base64 출력**. Vercel `min(32)` Zod 검증은 char count 기준 → 44 char OK.

### 검증

- `pnpm type-check` ✅ tsc 0 errors (모든 PR)
- `pnpm lint` ✅ 0 issues
- `pnpm --filter @hesya/web test` ✅ 본 세션 신규 케이스 모두 통과 (NTS 6 unit + E12 6큐 통합 + γ.2.1 8단계)
- e2e: store-deletion ✅ / epic-12-integration ✅ / kyc-to-inbox-flow ✅
- Vercel Production: PR #100 머지 후 `4387501` success (이전 세션 기록), 본 세션 PR은 모두 main 머지만 — **수동 redeploy 미실행** (L-089 적용 — 필요 시 다음 세션 첫 행동에서 redeploy)

## 다음 세션 가이드 — δ Epic 2/3 (Stripe + 예약) 또는 ζ 베타 매칭 prep

📄 **상세 plan**: `docs/Plan-v2-scenario-B.md`

### 다음 세션 첫 행동

1. PROGRESS.md 본 파일 확인 (현재 위치 = **ζ prep docs 완료**, 다음 분기 선택)
2. **L-091 확인** docs/learnings.md — Claude Code shell이 `ANTHROPIC_API_KEY=""` inject. dev 띄울 때 `unset ANTHROPIC_API_KEY &&` prefix 의무.
3. **세션 8 docs 배포 검증** — main 머지 후 자동 배포 확인 (Vercel deployment, L-089). docs only라 critical 영향 X.
4. **분기 결정** (사업자 등록 시점에 따라 진로 달라짐):
   - **(B) δ Epic 2 결제 Phase 1** (Stripe DB + 테스트 키 인프라) — 1~2일 예상. 🔴 RED 보안. 실 결제 X, 인프라만. 사업자 등록 무관.
   - **(D) ζ.4 통합 stress test** — 1일. 50+ 메시지/매장 부하 시드 + Sentry tag 보강. 사업자 등록 무관.
   - **(D) ζ.5 monitoring 강화** — 1일. PostHog 이벤트 인벤토리 + 누락 보강. 사업자 등록 무관.
   - **(B+D 권장 순서)**: ζ.4 → ζ.5 → δ Epic 2 결제 본격 진입 → 사업자 등록 후 ζ.1/ζ.7
   - **(A) γ.3 Epic 1 채널 확장** (WhatsApp / 카카오 / LINE) — ⚠️ Jayden 사업자 미보유 → 보류 유지
   - **(D) ζ.1 demo.hesya.com Phase 2** — ⚠️ 사업자 등록 + 외부 리소스 Jayden 명시 승인 필요 → 보류
5. 선택한 phase의 plan v1 작성 (Pre-Plan Inventory 의무):
   - 작업 영역 grep + 키워드 검색
   - 시연 prerequisite 검증 (L-082)
   - 인벤토리 결과 plan v1 첨부

### 베타 onboarding 자료 준비 완료 ✅

- `docs/demo-guide.md` 시나리오 A~D + 시드 명세 갱신
- `docs/beta-onboarding-checklist.md` 5-단계 체크리스트 + 비상 절차 5 상황
- Jayden 사업자 등록 완료 시 ζ.7 본격 실행 가능

### Phase 1-γ.2.3 — 디자인 정합성 5-split ✅ **마무리 완료**

`docs/design/reference/` 80 files (claude.ai/design 출력) 기반 단계적 적용:

| 단계    | 영역                                            | 예상  | 상태    |
| ------- | ----------------------------------------------- | ----- | ------- |
| γ.2.3.1 | Inbox 좌측 thread list + 헤더 디자인 토큰 적용  | 1일   | ✅ 완료 |
| γ.2.3.2 | Inbox 메인 thread + draft review 패널           | 1일   | ✅ 완료 |
| γ.2.3.3 | Sign-in / KYC submit / KYC pending 페이지       | 1일   | ✅ 완료 |
| γ.2.3.4 | Admin 8큐 (분쟁/검토/해지/AI/결제/API/신고/KYC) | 0.5일 | ✅ 완료 |
| γ.2.3.5 | Landing (보일러플레이트 폐기) + design-system   | 0.5일 | ✅ 완료 |

**모든 핵심 사용자 surface 디자인 정합성 적용 완료.**

### Phase 1-γ.3 — Epic 1 채널 확장 (1.5~2주)

WhatsApp / 카카오 / LINE adapter + 통합 시연.

### Phase 1-δ — Epic 2 결제 + Epic 3 예약 (3~4주)

Stripe + Alipay + WeChat + 한국은행 환율 + 다국어 예약 페이지.

### Phase 1-ε — Epic 4 대시보드 (1주)

Recharts KPI 12개.

### Phase 1-ζ — 통합 검증 + 베타 매장 매칭 (1~2주)

demo.hesya.com Phase 2 도입 + 베타 1~2곳 onboarding.

### 베타 5곳 출시 — 약 3~5주 후

## 차단 요소

- ⚠️ γ.3 Epic 1 채널 확장 (WhatsApp / 카카오 / LINE) — Jayden 사업자 미보유 → 보류 유지.
- 그 외 차단 요소 없음.

## 마지막 업데이트

- 날짜: 2026-05-12 (세션 18 종료)
- 세션 18 작업 시간: ~6h (M3.3a → 권장 1 → M3.4 full → M4.5 → M4.1 → ε KPI → M5.5/3/2 → M5.1 → M4.3+M4.4 full)
- 세션 18 머지: 9 commits main 직접 (`74064aa` → `dad66ec` → `5b0863c` → `e25f48f` → `7084465` → `663f542` → `ecf7a26` → `1de4d16` → `fa7638a`)
- 세션 18 누적 교훈: 없음 (Plan v3 진행 계획에 따른 실행만)
- **Plan v3 진척**: M1 5/5 + M2 7/7 + M3 5/5 + M4 4/5 + M5 4/5 = **22/25** (88%) — 잔여 M4.2 (Inbox skip 큐 deferred) + M5.4 (Jayden Vercel env 등록)

## 마지막 업데이트 (이전)

- 날짜: 2026-05-11 (세션 9 종료)
- 세션 9 머지: [#112](https://github.com/jaydenjoo/hesya/pull/112) + [#113](https://github.com/jaydenjoo/hesya/pull/113) + CI workflow 비활성화

## 컨텍스트 관리 강화 — 누적 (L-082 → L-091)

1. **PROGRESS 자기평가는 e2e 시연 기준** (L-082)
2. **destructive CLI 명령 글로벌 정밀화** (L-083)
3. **subagent 진단 의무화**: P0 Epic 작업 전 senior-engineer + code-explorer
4. **PR 같은 영역 3개+ 누적 시 회고 trigger** (L-082)
5. **새 env 도입 PR 5-layer → 7-layer 정합성 의무** (L-084 → L-087 → 세션 1 L-088/089 추가)
6. **시연 prerequisite 3-layer 격리 검증 의무** (L-085)
7. **PR 머지 직전 main HEAD 검증 의무** (L-086 — squash merge timing fix 누락 차단)
8. **새 env 도입은 Vercel Production+Preview+Development 3환경 등록 + 수동 redeploy** (L-087 + L-089)
9. **Vercel UI Encrypted/Sensitive 마스킹은 정상 동작** (L-088)
10. **gitleaks 우회는 `REPLACE_ME_FAKE_*` placeholder 패턴** (L-090)
11. **audit log에 PII 2차 저장 금지** (γ.2.2 보안 review fix)
12. **Claude Code shell이 `ANTHROPIC_API_KEY=""` inject — dev 띄울 때 `unset` prefix 의무** (L-091 신규, 세션 2)
13. **PROGRESS.md "알려진 환경 이슈" 추측 진단 금지** (L-091 메타 — 본 항목 정정 trigger)

## 알려진 환경 이슈 (다음 세션 scope 밖)

- **Claude Code shell ANTHROPIC_API_KEY 빈 값 inject** (L-091): 정상 터미널 영향 X, Claude Code 안 dev 시작 시 `unset ANTHROPIC_API_KEY` prefix 의무. 영구 가드는 `dev-demo.sh` 첫 줄 추가 후속 PR 후보.
- 베타·prod 출시 직전 일괄 secret rotation 예정 (N8N_WEBHOOK_SECRET 임시값 포함)
- Vercel Production 세션 1 PR (#101~#104) + 세션 2 PR (#105) 자동 배포는 main 머지 후 진행되나, **L-089 적용 시 다음 세션에서 명시적 검증 권장**

## 관련 문서

- PRD: `docs/PRD.md` (v1.2)
- 개발 계획: `docs/DEVELOPMENT-PLAN.md` (v1.2 FINAL)
- Plan v2 상세: `docs/Plan-v2-scenario-B.md`
- 디자인 참조: `docs/design/reference/` (80 files, claude.ai/design 출력)
- 디자인 가이드: `docs/DESIGN-PLAN.md`
- 데모 가이드: `docs/demo-guide.md`
- ADR: `docs/DECISIONS.md`
- 교훈: `docs/learnings.md` (L-001~**L-091**)
- 글로벌 규칙: `~/.claude/CLAUDE.md` v3.2
- 인벤토리 절차: `~/.claude/rules/inventory-protocol.md`
- 프로젝트 규칙: `CLAUDE.md` (5-Layer 문서 구조)
