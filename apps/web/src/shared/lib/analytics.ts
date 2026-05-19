/**
 * Server-side PostHog event capture (ζ.5 — Plan v2 scenario-B).
 *
 * 별도 `posthog-node` 의존성 없이 fetch로 /capture 엔드포인트 호출. project
 * key·host는 client SDK와 동일한 `NEXT_PUBLIC_*` env 재사용 (client에 노출
 * 되는 정보 — server-only secret 아님).
 *
 * distinctId 패턴: userId / storeId 8자 short (Sentry tag 정책과 일관, S3
 * 풀 UUID 노출 금지). 익명 컨텍스트는 storeId short 또는 conversationId
 * short fallback.
 *
 * `NODE_ENV !== production`이면 no-op. dev 검증 필요 시
 * `POSTHOG_ENABLE_DEV=1` 토글로 강제 활성화.
 *
 * fail-silent: capture 실패가 비즈니스 로직 차단하면 안 됨. catch 후 무시.
 * AbortSignal.timeout(2000)으로 hang 방어.
 */

type PropValue = string | number | boolean | null;
type Props = Record<string, PropValue>;

const enabled =
  process.env.NODE_ENV === "production" ||
  process.env.POSTHOG_ENABLE_DEV === "1";

export async function track(
  event: string,
  distinctId: string,
  properties?: Props,
): Promise<void> {
  if (!enabled) return;
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!apiKey || !host) return;
  try {
    await fetch(`${host.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $source: "server" },
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // fail-silent
  }
}

/** PII 최소화용 — userId/storeId 8자 short. Sentry tag 정책과 일관. */
export function shortId(id: string): string {
  return id.slice(0, 8);
}
