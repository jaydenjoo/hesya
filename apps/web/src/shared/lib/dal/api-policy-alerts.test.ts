import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  apiPolicyAlerts,
  createDbClient,
  type DbClient,
} from "@hesya/database";

import {
  insertApiPolicyAlert,
  listAlertsForAdmin,
  updateAlertStatus,
} from "./api-policy-alerts";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.api-policy-alerts (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    // resetDb는 본 테이블 미관리 — 본 test scope에서만 정리.
    await db.delete(apiPolicyAlerts);
  });

  it("insertApiPolicyAlert: 신규 entry → inserted=true + alert 반환", async () => {
    const result = await insertApiPolicyAlert(db, {
      source: "meta-blog",
      title: "Instagram API change",
      link: "https://example.com/post/1",
      guid: "post-1",
      pubDate: new Date("2026-05-10T00:00:00Z"),
    });

    expect(result.inserted).toBe(true);
    expect(result.alert).not.toBeNull();
    expect(result.alert?.title).toBe("Instagram API change");
    expect(result.alert?.status).toBe("new");
  });

  it("insertApiPolicyAlert: 중복 (source, guid) → inserted=false + 기존 alert 반환 (idempotent)", async () => {
    await insertApiPolicyAlert(db, {
      source: "meta-blog",
      title: "first",
      link: "https://example.com/post/1",
      guid: "post-1",
    });

    const second = await insertApiPolicyAlert(db, {
      source: "meta-blog",
      title: "second (different title, same guid)",
      link: "https://example.com/post/1",
      guid: "post-1",
    });

    expect(second.inserted).toBe(false);
    expect(second.alert).not.toBeNull();
    // 기존 row 그대로 — 첫 번째 title 유지 (덮어쓰기 안 함)
    expect(second.alert?.title).toBe("first");

    const all = await listAlertsForAdmin(db);
    expect(all).toHaveLength(1);
  });

  it("insertApiPolicyAlert: 다른 source + 같은 guid → 별개 row (UNIQUE는 (source, guid) 조합)", async () => {
    await insertApiPolicyAlert(db, {
      source: "meta-blog",
      title: "from meta",
      link: "https://meta.com/x",
      guid: "shared-guid",
    });
    const second = await insertApiPolicyAlert(db, {
      source: "whatsapp-business",
      title: "from whatsapp",
      link: "https://whatsapp.com/x",
      guid: "shared-guid",
    });

    expect(second.inserted).toBe(true);
    const all = await listAlertsForAdmin(db);
    expect(all).toHaveLength(2);
  });

  it("listAlertsForAdmin: status 필터 — new만", async () => {
    await insertApiPolicyAlert(db, {
      source: "meta-blog",
      title: "new entry",
      link: "https://example.com/1",
      guid: "g1",
    });
    const r2 = await insertApiPolicyAlert(db, {
      source: "meta-blog",
      title: "to be reviewed",
      link: "https://example.com/2",
      guid: "g2",
    });
    if (!r2.alert) throw new Error("seed failed");
    await updateAlertStatus(db, {
      id: r2.alert.id,
      nextStatus: "reviewed",
      reviewerId: "00000000-0000-4000-8000-0000000000aa",
    });

    const newOnly = await listAlertsForAdmin(db, { status: "new" });
    expect(newOnly).toHaveLength(1);
    expect(newOnly[0]?.title).toBe("new entry");

    const reviewedOnly = await listAlertsForAdmin(db, { status: "reviewed" });
    expect(reviewedOnly).toHaveLength(1);
    expect(reviewedOnly[0]?.title).toBe("to be reviewed");
  });

  it("listAlertsForAdmin: receivedAt desc 정렬", async () => {
    await insertApiPolicyAlert(db, {
      source: "meta-blog",
      title: "first",
      link: "https://example.com/1",
      guid: "g1",
    });
    // 명시적 timing — 두 번째 insert가 더 늦은 receivedAt
    await new Promise((r) => setTimeout(r, 10));
    await insertApiPolicyAlert(db, {
      source: "meta-blog",
      title: "second",
      link: "https://example.com/2",
      guid: "g2",
    });

    const list = await listAlertsForAdmin(db);
    expect(list).toHaveLength(2);
    expect(list[0]?.title).toBe("second");
    expect(list[1]?.title).toBe("first");
  });

  it("updateAlertStatus: reviewedAt + reviewedByUserId + notes 갱신", async () => {
    const r = await insertApiPolicyAlert(db, {
      source: "meta-blog",
      title: "x",
      link: "https://example.com/x",
      guid: "gx",
    });
    if (!r.alert) throw new Error("seed failed");

    const updated = await updateAlertStatus(db, {
      id: r.alert.id,
      nextStatus: "resolved",
      reviewerId: "00000000-0000-4000-8000-0000000000aa",
      notes: "응답 형식만 변경 — hesya 측 영향 없음",
    });

    expect(updated?.status).toBe("resolved");
    expect(updated?.reviewedAt).toBeInstanceOf(Date);
    expect(updated?.notes).toBe("응답 형식만 변경 — hesya 측 영향 없음");
  });
});
