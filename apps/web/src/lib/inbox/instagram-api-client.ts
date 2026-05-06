import { env } from "@/shared/config/env";
import { ExternalApiError } from "@/shared/lib/errors";

/**
 * Instagram Graph API HTTP fetch 래퍼.
 *
 * 1A: instagram_business_basic + instagram_business_manage_messages 두 권한만.
 * messaging_postbacks 등 추가 webhook field는 1B에서.
 *
 * 어댑터(`createInstagramAdapter`)에 의존성 주입되어 단위 테스트 가능.
 *
 * @see docs/superpowers/specs/2026-05-04-epic-1a-inbox-instagram-design.md § 10 References
 */
export interface InstagramApiClient {
  exchangeShortLivedToken(input: {
    code: string;
    redirectUri: string;
    appId: string;
    appSecret: string;
  }): Promise<{ accessToken: string; userId: string }>;

  exchangeLongLivedToken(input: {
    shortLivedToken: string;
    appSecret: string;
  }): Promise<{ accessToken: string; expiresIn: number }>;

  getMe(accessToken: string): Promise<{ id: string; username: string }>;

  sendMessage(input: {
    recipientId: string;
    text: string;
    pageId: string;
    accessToken: string;
  }): Promise<{ messageId: string }>;

  subscribeWebhook(input: {
    pageId: string;
    accessToken: string;
  }): Promise<void>;

  /**
   * Epic Customer 확장 (CC-3) — IG 사용자 프로필 fetch.
   *
   * `instagram_business_manage_messages` 권한으로 24h 메시징 윈도우 안의
   * 고객 프로필 조회 가능 (Meta Graph API). privacy 정책으로 일부 필드는
   * 응답에서 누락될 수 있어 모두 nullable.
   *
   * @see https://developers.facebook.com/docs/messenger-platform/instagram/features/user-profile
   */
  fetchUserProfile(input: { igUserId: string; accessToken: string }): Promise<{
    name: string | null;
    profilePic: string | null;
    locale: string | null;
  }>;
}

// env로 override 가능. prod 기본값은 env.ts에 default로 보장.
function getBase(): string {
  return env.IG_API_BASE_URL;
}

export const fetchInstagramApiClient: InstagramApiClient = {
  async exchangeShortLivedToken({ code, redirectUri, appId, appSecret }) {
    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });
    const res = await fetch(`${getBase()}/oauth/access_token`, {
      method: "POST",
      body: params,
    });
    if (!res.ok) {
      throw new ExternalApiError("IG short-lived token 교환 실패", {
        status: res.status,
        body: await res.text(),
      });
    }
    const json = (await res.json()) as {
      access_token: string;
      user_id: string;
    };
    return { accessToken: json.access_token, userId: json.user_id };
  },

  async exchangeLongLivedToken({ shortLivedToken, appSecret }) {
    const url = `${getBase()}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortLivedToken)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new ExternalApiError("IG long-lived token 교환 실패", {
        status: res.status,
        body: await res.text(),
      });
    }
    const json = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    return { accessToken: json.access_token, expiresIn: json.expires_in };
  },

  async getMe(accessToken) {
    const res = await fetch(`${getBase()}/me?fields=id,username`, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new ExternalApiError("IG /me 조회 실패", {
        status: res.status,
        body: await res.text(),
      });
    }
    return (await res.json()) as { id: string; username: string };
  },

  async sendMessage({ recipientId, text, pageId, accessToken }) {
    const res = await fetch(`${getBase()}/${pageId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });
    if (!res.ok) {
      throw new ExternalApiError("IG sendMessage 실패", {
        status: res.status,
        body: await res.text(),
      });
    }
    const json = (await res.json()) as { message_id: string };
    return { messageId: json.message_id };
  },

  async fetchUserProfile({ igUserId, accessToken }) {
    const res = await fetch(
      `${getBase()}/${igUserId}?fields=name,profile_pic,locale`,
      {
        headers: { authorization: `Bearer ${accessToken}` },
      },
    );
    if (!res.ok) {
      throw new ExternalApiError("IG 사용자 프로필 조회 실패", {
        status: res.status,
        body: await res.text(),
      });
    }
    const json = (await res.json()) as {
      name?: string;
      profile_pic?: string;
      locale?: string;
    };
    return {
      name: json.name ?? null,
      profilePic: json.profile_pic ?? null,
      locale: json.locale ?? null,
    };
  },

  async subscribeWebhook({ pageId, accessToken }) {
    // 1A: messages만 구독 (messaging_postbacks는 1B 영역)
    const res = await fetch(
      `${getBase()}/${pageId}/subscribed_apps?subscribed_fields=messages`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}` },
      },
    );
    if (!res.ok) {
      throw new ExternalApiError("IG subscribed_apps 실패", {
        status: res.status,
        body: await res.text(),
      });
    }
  },
};
