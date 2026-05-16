# 04 — Assets Inventory (Higgsfield 자산 16개)

> Jayden이 Higgsfield MCP로 직접 생성한 영상 8개 + 이미지 8개
> 본 채팅 AI가 페르소나 평가로 컨셉 결정 + 사용 위치 매핑

---

## 🎬 영상 8개

| #   | Job ID (첫 8자) | 컨셉                                                               | 영상 길이 | 비율 | 사용 위치 (Hesya Landing.html 섹션)     |
| --- | --------------- | ------------------------------------------------------------------ | --------- | ---- | --------------------------------------- |
| 1   | `6cf52549`      | **🥇 Hero — 명주 + cream-peach 작약 꽃잎** (slow motion mood film) | 10s       | 9:16 | Section 01 Hero 메인 배경 영상          |
| 2   | `f23c2693`      | Before/After 변신 (헤어 컬러 트랜지션)                             | 6s        | 1:1  | Section 04 Before/After 슬라이더        |
| 3   | `96f4ea1b`      | 글래스 스킨 매크로 (피부 close-up)                                 | 5s        | 16:9 | Section 02 백그라운드 또는 AIMatch 보조 |
| 4   | `f581b4ba`      | UGC Sakura 셀카 (일본 여행자 후기)                                 | 5s        | 9:16 | Section 06 UGCWall 후기 카드 #1         |
| 5   | `d0e61798`      | UGC Mei 셀카 (중국 여행자 후기)                                    | 5s        | 9:16 | Section 06 UGCWall 후기 카드 #2         |
| 6   | `523ba10a`      | UGC Linh 셀카 (베트남 여행자 후기)                                 | 5s        | 9:16 | Section 06 UGCWall 후기 카드 #3         |
| 7   | `606dfca0`      | 컬러링 매크로 (스타일리스트 손 + 머리카락)                         | 5s        | 9:16 | Section 05 살롱 카드 호버 효과          |
| 8   | `3011b64c`      | 로고 잉크 (Hesya 로고 잉크 번짐 애니메이션)                        | 8s        | 16:9 | Section 11 Final CTA 또는 Footer        |

---

## 🖼️ 이미지 8개

| #   | Job ID (첫 8자) | 컨셉                                     | 비율 | 사용 위치                                             |
| --- | --------------- | ---------------------------------------- | ---- | ----------------------------------------------------- |
| 1   | `0d613c47`      | Hero Poster (영상 fallback / LCP 포스터) | 3:4  | Hero 영상 `poster` 속성 + prefers-reduced-motion 대체 |
| 2   | `ab87c2eb`      | 살롱 1 — Stylista 홍대                   | 4K   | Section 05 살롱 카드 #1                               |
| 3   | `789fc877`      | 살롱 2 — 유리 살롱 압구정                | 4K   | Section 05 살롱 카드 #2                               |
| 4   | `f3952bc9`      | 살롱 3 — Mirror Glass Studio 성수        | 4K   | Section 05 살롱 카드 #3                               |
| 5   | `dd2fc5d2`      | 살롱 4 — Nail Atelier 청담               | 4K   | Section 05 살롱 카드 #4                               |
| 6   | `53492d82`      | 살롱 5 — Color Lab 홍대                  | 4K   | Section 05 살롱 카드 #5                               |
| 7   | `8bc31aba`      | 살롱 6 — Soohair 명동                    | 4K   | Section 05 살롱 카드 #6                               |
| 8   | `40aadcc6`      | Dashboard Mock (사업자 대시보드 모형)    | 16:9 | Section 08 B2B 사업자 섹션                            |

---

## 📁 자산 파일 시스템 위치

### 현재 위치 (사용자가 정리한 위치)

```
/Volumes/jayden-ssd/projects/hesya/web/public/
├── assets/
│   ├── videos/  (8개 mp4)
│   └── images/  (8개 png)
└── landingpage/  (Claude Design HTML reference)
```

⚠️ **주의**: `web/public/`은 Next.js가 정적 자산으로 인식하지 않는 위치. Phase A에서 `apps/web/public/` 폴더 충돌 여부 확인 후 이동 결정.

### 권장 최종 위치 (Phase A 검증 후 확정)

```
/Volumes/jayden-ssd/projects/hesya/apps/web/public/
└── assets/
    ├── videos/
    │   ├── hero-silk-petal.mp4
    │   ├── transformation.mp4
    │   ├── glass-skin-macro.mp4
    │   ├── ugc-sakura.mp4
    │   ├── ugc-mei.mp4
    │   ├── ugc-linh.mp4
    │   ├── coloring-macro.mp4
    │   └── logo-ink.mp4
    └── images/
        ├── hero-poster.png
        ├── salon-01-stylista.png
        ├── salon-02-yuri.png
        ├── salon-03-mirror-glass.png
        ├── salon-04-nail-atelier.png
        ├── salon-05-color-lab.png
        ├── salon-06-soohair.png
        └── dashboard-mock.png
```

### Next.js에서 참조 경로

```tsx
// public/ 기준 절대 경로
<video src="/assets/videos/hero-silk-petal.mp4" poster="/assets/images/hero-poster.png" />
<Image src="/assets/images/salon-01-stylista.png" alt="Stylista 홍대" />
```

---

## 🛠️ Phase A에서 자산 검증 명령

```bash
# 현재 위치 검증
ls /Volumes/jayden-ssd/projects/hesya/web/public/assets/videos/ 2>/dev/null
ls /Volumes/jayden-ssd/projects/hesya/web/public/assets/images/ 2>/dev/null

# 권장 최종 위치 충돌 여부
ls /Volumes/jayden-ssd/projects/hesya/apps/web/public/assets/ 2>/dev/null

# 파일 크기 확인 (CLS / LCP 영향)
du -sh /Volumes/jayden-ssd/projects/hesya/web/public/assets/videos/*
du -sh /Volumes/jayden-ssd/projects/hesya/web/public/assets/images/*
```

---

## 📐 Hesya Landing.html 섹션별 placeholder 위치

본 채팅 AI가 grep으로 확인한 정적 HTML의 placeholder 위치 (Phase A에서 재검증 권장):

| Hesya Landing.html 줄번호                   | placeholder 형태                              | 통합할 자산                                                                        |
| ------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| 273 (`.hero-visual`)                        | `linear-gradient(160deg, ...)`                | `hero-silk-petal.mp4` + `hero-poster.png`                                          |
| 602-604 (Before/After 썸네일 3개)           | `linear-gradient(135deg, ...)` x3             | `transformation.mp4` (단일 영상 또는 분리 사용)                                    |
| 1410, 1420, 1430, 1438, 1448, 1458 (Salons) | `linear-gradient(160deg, ...)` x6             | `salon-01~06.png`                                                                  |
| 1484, 1504, 1519 (UGC)                      | `linear-gradient(135deg, ...)` x3             | `ugc-sakura/mei/linh.mp4`                                                          |
| (추가 발견 필요)                            | 글래스 스킨, 컬러링, 대시보드, 로고 잉크 자리 | `glass-skin-macro.mp4`, `coloring-macro.mp4`, `dashboard-mock.png`, `logo-ink.mp4` |

**Phase A 권장 명령**:

```bash
# 모든 gradient placeholder + 영상/이미지 자리 위치 찾기
grep -nE "linear-gradient|background-image|<video|<img" \
  "/Volumes/jayden-ssd/projects/hesya/web/public/landingpage/Hesya Landing.html"
```

---

## 🎯 자산 통합 원칙

### 1. CLS = 0 보장

- `<video width="..." height="..." poster="...">` 명시
- `<Image>` 컴포넌트 사용 (`width`/`height` 의무)
- `aspect-ratio` CSS 백업

### 2. 성능 최적화

- 영상: `preload="metadata"` (전체 다운로드 X, 메타데이터만)
- 영상: `autoplay muted loop playsinline` (모바일 자동재생)
- 이미지: Next.js `<Image>` 자동 WebP/AVIF
- LCP < 2.5s 목표 (Hero poster 우선 로드)

### 3. 접근성

- `<video aria-label="..." />` 또는 보조 텍스트
- `prefers-reduced-motion: reduce` 미디어 쿼리에서 영상 자동 일시정지
- 영상에 텍스트 오버레이 시 대비율 4.5:1+

### 4. 다국어 영향

- 영상은 다국어 영향 0 (텍스트 없음)
- 이미지의 alt 텍스트는 locale별로 다르게 (translations 활용)

---

## 🚨 자산 통합 시 주의

| 위험                               | 영향                      | 완화                                                                    |
| ---------------------------------- | ------------------------- | ----------------------------------------------------------------------- |
| 영상 자동재생 차단 (iOS Safari)    | hero 영상 미재생          | `muted` + `playsinline` + poster fallback                               |
| 영상 파일 크기 > 10MB              | 모바일 데이터 사용량 부담 | `preload="metadata"` + viewport lazy                                    |
| poster 이미지 LCP 지연             | Lighthouse 점수 하락      | `<link rel="preload" as="image" href="/assets/images/hero-poster.png">` |
| 6 locale x salon-card alt 텍스트   | 번역 부담                 | `translations.marketing.salons[N].alt`                                  |
| Vercel egress 무료 한도 (100GB/월) | 트래픽 폭증 시 비용       | Vercel Blob 또는 Cloudflare R2 마이그레이션 (Phase 2)                   |

---

## 📌 사용자(Jayden)에게 알려진 컨텍스트

- 모든 자산은 Higgsfield MCP `cinematic_studio_video_v2` Pro mode 또는 `kling3_0`로 생성
- Hero 영상은 4번째 시도에서 성공 (kling3_0 + 명주+꽃잎 컨셉)
- K-beauty 컬러링도 4번째 시도에서 성공 (kling3_0)
- 모든 자산은 Hesya 브랜드 컬러 팔레트 (cream / peach / amber / deep navy) 일치
- 자산 라이센스: Higgsfield Plus 플랜 (Jayden 보유, 상업적 사용 가능)
