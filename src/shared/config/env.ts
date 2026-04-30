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

const envSchema = z.object({
  // Node 환경
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // 앱 URL (zod v4: z.url() — v3 z.string().url()와 호환)
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),

  // ─── Supabase (사용 시 주석 해제) ───
  // NEXT_PUBLIC_SUPABASE_URL: z.url(),
  // NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  // SUPABASE_SERVICE_ROLE_KEY: z.string().min(20), // 서버 전용

  // ─── AI/외부 (사용 시 주석 해제) ───
  // ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-"),
  // OPENAI_API_KEY: z.string().startsWith("sk-"),
  // RESEND_API_KEY: z.string().startsWith("re_"),
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
