/**
 * 환경변수 zod 검증 스키마 (v10.1 — zod v4 호환)
 *
 * ⚠️ zod 버전 안내:
 *   - 2026-04 기준 최신: zod 4.4.1
 *   - 이 파일은 zod v4 새 API 사용 (z.url(), z.uuid() 등)
 *   - v3 API 필요 시: import { z } from "zod/v3"
 *
 * v3 → v4 주요 변경:
 *   - z.string().url() → z.url()
 *   - z.string().uuid() → z.guid() (v3 호환) 또는 z.uuid() (v4 RFC 4122)
 *   - message → error 파라미터
 *   - z.number()는 Infinity 거부
 *
 * 규칙:
 * - 모든 환경변수는 여기서 검증
 * - 누락·오타 시 앱 시작 시점에 즉시 실패
 * - NEXT_PUBLIC_ 접두사 = 브라우저 노출됨 (주의)
 * - 민감 정보는 NEXT_PUBLIC_ 없이
 */
import { z } from "zod";

/**
 * Mock env flag helper (Plan v3, M1.1) — process.env string → boolean.
 *
 * `"true"` 또는 `"1"`만 truthy. `undefined` / 빈 문자열 / 기타 모두 false.
 * `z.coerce.boolean()`은 `"false"`도 truthy로 잘못 처리하므로 직접 transform.
 */
const mockFlag = z
  .string()
  .default("false")
  .transform((v) => v === "true" || v === "1");

const envSchema = z.object({
  // Node 환경
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // 앱 URL (zod v4: z.url() — v3 z.string().url()와 호환)
  // dev 포트 4200 (apps/web/package.json scripts와 동기화)
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:4200"),

  // ─── Supabase (S-3에서 활성화) ───
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20), // 서버 전용 — 절대 클라이언트 노출 금지
  DATABASE_URL: z.string().startsWith("postgres"), // PostgreSQL connection string

  // ─── Better Auth (S-18 활성화) ───
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // ─── 운영 관측 (S-10 활성화) ───
  SENTRY_DSN: z.url(),
  NEXT_PUBLIC_SENTRY_DSN: z.url(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().startsWith("phc_"),
  NEXT_PUBLIC_POSTHOG_HOST: z.url(),

  // ─── Epic 9 KYC (data.go.kr Decoding 인증키, server-only) ───
  KOREA_NTS_API_KEY: z.string().min(20),
  KOREA_LOCALDATA_API_KEY: z.string().min(20),

  // ─── Admin 화이트리스트 (검증 페이지·KYC Server Action 접근 제어) ───
  // Better Auth user 테이블에 role 컬럼이 도입되기 전 임시 가드 (Epic 12 admin
  // panel 도입 시 role-based로 교체). 콤마 구분 이메일 목록.
  // 예: "jayden@example.com,ops@example.com"
  ADMIN_EMAILS: z.string().min(3),

  // ─── E9-10 cron 자동 재검증 ───
  // Vercel Cron이 호출 시 Authorization: Bearer ${CRON_SECRET} 헤더 검증.
  // 외부에서 임의로 cron endpoint 호출 차단. openssl rand -base64 32로 생성.
  CRON_SECRET: z.string().min(32),

  // ─── E9-9 KYC 결과 알림 (Resend Free 3K/월) ───
  // DECISIONS § 1.5. Resend Dashboard에서 발급한 API key (`re_...`).
  // RESEND_FROM_EMAIL: 발신자 이메일. 도메인 검증 전에는 `onboarding@resend.dev`
  // (Resend 기본 도메인) 사용 가능. prod 배포 시 hesya 도메인 검증 권장 (별 PR).
  RESEND_API_KEY: z.string().startsWith("re_"),
  RESEND_FROM_EMAIL: z.email(),

  // ─── E9-4 카테고리 자동 분류 (Anthropic Sonnet 4.6) ───
  // console.anthropic.com에서 발급한 API key (`sk-ant-...`).
  // 분류 1회당 ~$0.003 (input ~500 tokens + output ~100 tokens, Sonnet 4.6).
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),

  // ─── Epic 1-1B Phase B-4 RAG 임베딩 (OpenAI text-embedding-3-small) ───
  // platform.openai.com에서 발급한 API key (`sk-...` 또는 `sk-proj-...`).
  // 모델: text-embedding-3-small (1536차원, $0.02/M tokens, 한국어 양호).
  // FAQ 등록·수정 시 1회 + inbound 메시지당 1회 호출.
  OPENAI_API_KEY: z.string().startsWith("sk-"),

  // ─── Epic 1-1A Instagram (developers.facebook.com Meta App) ───
  // App Dashboard에서 발급한 App ID + App Secret + Webhook Verify Token.
  // IG_REDIRECT_URI는 Meta App에 등록된 OAuth redirect URI (ngrok 또는 prod 도메인).
  IG_APP_ID: z.string().min(1),
  IG_APP_SECRET: z.string().min(1),
  IG_WEBHOOK_VERIFY_TOKEN: z.string().min(8),
  IG_REDIRECT_URI: z.url(),
  // E2E 또는 self-hosted Meta 호환 환경에서 base URL override.
  // prod 기본값은 Instagram Graph API 공식 endpoint.
  IG_API_BASE_URL: z.url().default("https://graph.instagram.com/v24.0"),

  // ─── Phase 1C QStash (Vercel Marketplace integration prov, L-077) ───
  // Vercel Queue beta deployment pinning 결함으로 QStash(Upstash GA) 전환.
  // Marketplace integration 연결 시 환경변수 자동 prov.
  // - QSTASH_TOKEN: publish 인증 (server-only)
  // - QSTASH_CURRENT_SIGNING_KEY / QSTASH_NEXT_SIGNING_KEY: 서명 검증 (rotation 대비)
  QSTASH_TOKEN: z.string().min(20),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(20),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(20),

  // ─── Phase 1-γ.0 fix #1 Upstash Redis (rate-limit) ───
  // Vercel Marketplace 통합으로 hesya-rate-limit-prod (Tokyo, Free) 자동 prov.
  // 이름 패턴이 길지만 prefix `UPSTASH_REDIS` + 통합 자체 suffix(`KV_REST_API_*`)
  // 합성 결과. Standard `UPSTASH_REDIS_REST_*`와 다르므로 `Redis.fromEnv()` 자동
  // 인식 안 됨 → rate-limit.ts에서 직접 주입.
  // 사용 안 하는 변수 3개 (KV_URL / REDIS_URL / READ_ONLY_TOKEN)는 zod 등록 생략.
  UPSTASH_REDIS_KV_REST_API_URL: z.url(),
  UPSTASH_REDIS_KV_REST_API_TOKEN: z.string().min(20),

  // ─── Phase 1-γ.1.4 (E12-8) n8n RSS webhook secret ───
  // n8n 워크플로(api-policy-rss)가 본 hesya webhook으로 POST 시 X-Webhook-Secret
  // 헤더에 동일 값 전송. instagram webhook의 HMAC보다 단순화 (RSS 발신자 단일).
  // 길이 32+ enforce — 256bit 엔트로피 (openssl rand -base64 32 권장).
  // prod에선 secret manager로 rotate.
  N8N_WEBHOOK_SECRET: z.string().min(32),

  // ─── Mock-first (Plan v3, M1.1) — 외부 데모 환경용 ───
  // 사업자 등록 + 결제사 KYB 완료 전 외부인이 전 흐름 시뮬할 수 있도록 외부 연동 5종을
  // Mock으로 추상화. 각 모듈은 lib/<module>/{real,mock}-*.ts + index.ts (env 분기) 패턴.
  // - Production: 모두 false (실 운영)
  // - Vercel Preview: 모두 true (외부 데모 — PR/branch URL 공유)
  // - Local dev: 자유 toggle
  // process.env는 string만 받으므로 "true"/"1"만 truthy, 나머지 false.
  MOCK_KYC: mockFlag,
  MOCK_IG_OAUTH: mockFlag,
  MOCK_PAYMENT: mockFlag,
  MOCK_NOTIFICATION: mockFlag,
  MOCK_MULTI_CHANNEL: mockFlag,

  // ─── Plan v3 M5.1 — Vercel preview demo bypass ───
  // VERCEL_ENV는 Vercel 빌드 시 자동 주입 ('production'|'preview'|'development').
  // DEMO_USER_ID / DEMO_CUSTOMER_EMAIL은 preview 환경에서만 활성 → 인증 우회 가능.
  // prod에서 env 자체 미설정 + VERCEL_ENV 가드 두 겹으로 차단.
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  DEMO_USER_ID: z.uuid().optional(),
  DEMO_CUSTOMER_EMAIL: z.string().email().optional(),
});

/**
 * 파싱된 환경변수 (타입 안전)
 *
 * 사용:
 *   import { env } from "@/shared/config/env";
 *
 * 누락 시 앱 시작이 차단되므로 process.env.X 직접 참조 금지.
 */
export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
