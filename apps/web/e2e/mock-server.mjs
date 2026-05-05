/**
 * Instagram Graph API mock server for E2E tests.
 *
 * Playwright webServer로 실행. dev 서버는 IG_API_BASE_URL=http://localhost:4201로 시작.
 * fetchInstagramApiClient의 모든 endpoint를 1:1 매핑 — 시나리오에 필요한 최소 응답.
 *
 * 보안 노트: 요청 본문/URL을 로깅하지 않는다 (appSecret URL 파라미터 우려).
 *
 * .ts가 아닌 .mjs인 이유: tsx 의존성을 추가하지 않기 위해 plain Node ESM로 작성.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.IG_MOCK_PORT ?? 4201);

function jsonResponse(res, status, body) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === "GET" && path === "/health") {
    res.statusCode = 200;
    res.end("ok");
    return;
  }

  // POST /oauth/access_token (short-lived 교환)
  if (req.method === "POST" && path === "/oauth/access_token") {
    jsonResponse(res, 200, {
      access_token: "mock_short_token",
      user_id: "mock_ig_user_id",
    });
    return;
  }

  // GET /access_token?grant_type=ig_exchange_token (long-lived 교환)
  if (req.method === "GET" && path === "/access_token") {
    jsonResponse(res, 200, {
      access_token: "mock_long_token",
      expires_in: 60 * 60 * 24 * 60, // 60일
    });
    return;
  }

  // GET /me?fields=id,username
  if (req.method === "GET" && path === "/me") {
    jsonResponse(res, 200, { id: "mock_ig_user_id", username: "mock_user" });
    return;
  }

  // POST /:pageId/messages (sendMessage)
  if (req.method === "POST" && /\/[^/]+\/messages$/.test(path)) {
    jsonResponse(res, 200, {
      message_id: `mock_msg_${Date.now()}`,
    });
    return;
  }

  // POST /:pageId/subscribed_apps (subscribeWebhook)
  if (req.method === "POST" && /\/[^/]+\/subscribed_apps/.test(path)) {
    jsonResponse(res, 200, {});
    return;
  }

  res.statusCode = 404;
  res.end(`Not Found: ${req.method} ${path}`);
});

server.listen(PORT, () => {
  console.log(`[ig-mock] listening on http://localhost:${PORT}`);
});
