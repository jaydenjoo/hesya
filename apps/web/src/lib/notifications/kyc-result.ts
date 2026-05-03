/**
 * E9-9 + E9-13 KYC 결과 알림 (다국어 + actionable rejection).
 *
 * PRD § 5.4 KYC 5단계 흐름의 결정 시점 3종에 매장 사장에게 이메일 발송:
 *   - auto_rejected_nts: Step 1 NTS 진위확인 실패 (사업자번호/대표자명 mismatch)
 *   - auto_approved: 5단계 모두 통과 → K-Verified 골드 뱃지 부여
 *   - manual_review_queued: 일부 단계 fail / 매칭 점수 < 임계값 (Epic 12 admin 큐)
 *
 * `manual_rejected` (admin 큐 최종 거절)는 Epic 12 admin panel 시점에 추가 —
 * 지금 호출처 없어 미정의 (4원칙 2번 dead code 회피).
 *
 * E9-13: rejection kind에 한해 재신청 URL + FAQ URL을 본문에 직접 포함해 외국인
 * 사장님이 즉시 다음 행동을 취할 수 있게 함. DECISIONS § 1.11 (TTS는 모듈 4
 * Phase 1.5 통합) 정합 — 이번엔 텍스트 + URL만.
 *
 * 발송: Resend Free 3K/월 (DECISIONS § 1.5). 실패 시 console.error만 — Server
 * Action 응답에 영향 없음 (KYC 결과는 정상 반환되어야 함).
 *
 * 수신자: 현재 admin 가드라 admin 본인 email로 임시 발송. Epic 12 매장 owner
 * 가드 도입 시 매장 사장 email로 자연 교체 (signature 변경 없음).
 *
 * Locale 메시지는 in-line map (next-intl `getTranslations`는 RSC context 의존
 * → server action·cron route 양쪽에서 일관 사용 어려움. 3 kind × 6 locale = 18
 * 짧은 string은 in-line이 충분).
 */
import "server-only";
import { Resend } from "resend";
import { DEFAULT_LOCALE, type Locale } from "@hesya/translations";

export const KYC_RESULT_KINDS = [
  "auto_rejected_nts",
  "auto_approved",
  "manual_review_queued",
] as const;
export type KycResultKind = (typeof KYC_RESULT_KINDS)[number];

/**
 * 거절·검토 사유 객체. 모든 필드 optional — 호출처가 의미 있을 때만 전달.
 *  - summary: 사람이 읽는 한 줄 사유 (NTS valid 코드 등). 모든 kind에서 사용 가능.
 *  - retryUrl: 재신청 URL. `auto_rejected_nts`에서만 의미 (waiting인 manual_review는 X).
 *  - faqUrl:   도움말 URL. `auto_rejected_nts`에서만 의미.
 *
 * 호출처가 retryUrl/faqUrl을 안 넘기면 본문에서 해당 라인 자동 생략 (graceful).
 */
export interface RejectionDetail {
  summary?: string;
  retryUrl?: string;
  faqUrl?: string;
}

interface BuildInput {
  kind: KycResultKind;
  locale: Locale;
  storeName: string;
  reason?: RejectionDetail;
}

interface BuiltMessage {
  subject: string;
  body: string;
}

interface Labels {
  reason: string;
  retry: string;
  help: string;
  ops: string;
}

const LABELS: Record<Locale, Labels> = {
  ko: { reason: "사유", retry: "재신청", help: "도움말", ops: "Hesya 운영팀" },
  en: {
    reason: "Reason",
    retry: "Retry",
    help: "Help",
    ops: "Hesya Operations",
  },
  ja: {
    reason: "理由",
    retry: "再申請",
    help: "ヘルプ",
    ops: "Hesya 運営チーム",
  },
  "zh-CN": {
    reason: "原因",
    retry: "重新申请",
    help: "帮助",
    ops: "Hesya 运营团队",
  },
  "zh-TW": {
    reason: "原因",
    retry: "重新申請",
    help: "說明",
    ops: "Hesya 營運團隊",
  },
  vi: {
    reason: "Lý do",
    retry: "Đăng ký lại",
    help: "Trợ giúp",
    ops: "Đội ngũ vận hành Hesya",
  },
};

/**
 * rejection 본문에 들어가는 actionable 라인 빌더 (auto_rejected_nts 전용).
 * summary / retryUrl / faqUrl 각각 있으면 한 줄씩 추가, 없으면 생략.
 * 라인 하나도 없으면 빈 문자열 → 호출처가 그대로 concat 가능.
 */
function formatRejectionLines(
  reason: RejectionDetail | undefined,
  labels: Labels,
): string {
  if (!reason) return "";
  const lines: string[] = [];
  if (reason.summary) lines.push(`${labels.reason}: ${reason.summary}`);
  if (reason.retryUrl) lines.push(`${labels.retry}: ${reason.retryUrl}`);
  if (reason.faqUrl) lines.push(`${labels.help}: ${reason.faqUrl}`);
  return lines.length > 0 ? `${lines.join("\n")}\n\n` : "";
}

/**
 * manual_review_queued 본문에 들어가는 summary 라인 (URL은 제외 — waiting 상태).
 */
function formatSummaryLine(
  reason: RejectionDetail | undefined,
  labels: Labels,
): string {
  if (!reason?.summary) return "";
  return `${labels.reason}: ${reason.summary}\n\n`;
}

interface KindTemplate {
  subject: (storeName: string) => string;
  body: (
    storeName: string,
    reason: RejectionDetail | undefined,
    labels: Labels,
  ) => string;
}

type Templates = Record<KycResultKind, KindTemplate>;

const MESSAGES: Record<Locale, Templates> = {
  ko: {
    auto_rejected_nts: {
      subject: (s) => `[Hesya] ${s} 가입 거절 — 사업자등록 진위확인 실패`,
      body: (s, r, labels) =>
        `안녕하세요. ${s} 매장의 KYC 첫 단계(국세청 사업자등록 진위확인)에서 거절되었습니다.\n\n사업자번호 또는 대표자명이 국세청 등록 정보와 일치하지 않습니다. 정보를 확인하신 후 다시 신청해주세요.\n\n${formatRejectionLines(r, labels)}- ${labels.ops}`,
    },
    auto_approved: {
      subject: (s) => `[Hesya] ${s} 가입 승인 완료 — K-Verified 매장`,
      body: (s, _r, labels) =>
        `안녕하세요. ${s} 매장의 KYC 5단계 검증이 모두 통과되었습니다.\n\n축하합니다 — 한국 정부 검증 완료 매장(K-Verified)으로 등록되어 외국인 손님이 보는 모든 진입점에 골드 뱃지가 노출됩니다.\n\n다음 단계: 디자이너 등록 → 채널 연동 → 결제 수단 등록 → 베타 출시.\n\n- ${labels.ops}`,
    },
    manual_review_queued: {
      subject: (s) => `[Hesya] ${s} KYC 매뉴얼 검토 진행 중 (1~2영업일)`,
      body: (s, r, labels) =>
        `안녕하세요. ${s} 매장의 KYC 자동 검증에서 일부 단계가 자동 통과 임계값에 도달하지 못해 운영팀 매뉴얼 검토 큐로 이동되었습니다.\n\n${formatSummaryLine(r, labels)}1~2영업일 내 검토 결과를 알려드립니다.\n\n- ${labels.ops}`,
    },
  },
  en: {
    auto_rejected_nts: {
      subject: (s) =>
        `[Hesya] ${s} registration rejected — NTS business verification failed`,
      body: (s, r, labels) =>
        `Hello. ${s}'s KYC first step (Korean NTS business registration verification) was rejected.\n\nThe business registration number or representative name does not match the NTS records. Please check the information and re-apply.\n\n${formatRejectionLines(r, labels)}- ${labels.ops}`,
    },
    auto_approved: {
      subject: (s) => `[Hesya] ${s} approved — K-Verified store`,
      body: (s, _r, labels) =>
        `Hello. ${s} has passed all 5 KYC verification steps.\n\nCongratulations — your store is now registered as a Korea Government-Verified (K-Verified) store and the gold badge will be displayed on all foreign-customer touchpoints.\n\nNext steps: register designers, connect channels, set up payment methods, launch beta.\n\n- ${labels.ops}`,
    },
    manual_review_queued: {
      subject: (s) =>
        `[Hesya] ${s} KYC under manual review (1-2 business days)`,
      body: (s, r, labels) =>
        `Hello. Some steps of ${s}'s KYC automated verification did not reach the auto-approval threshold and have been moved to the operations team's manual review queue.\n\n${formatSummaryLine(r, labels)}You will be notified of the result within 1-2 business days.\n\n- ${labels.ops}`,
    },
  },
  ja: {
    auto_rejected_nts: {
      subject: (s) => `[Hesya] ${s} 登録却下 — 国税庁事業者登録真偽確認失敗`,
      body: (s, r, labels) =>
        `${s} 店舗のKYC第1段階(韓国国税庁事業者登録真偽確認)で却下されました。\n\n事業者番号または代表者名が国税庁の登録情報と一致しません。情報を確認の上、再度申請してください。\n\n${formatRejectionLines(r, labels)}- ${labels.ops}`,
    },
    auto_approved: {
      subject: (s) => `[Hesya] ${s} 承認完了 — K-Verified 店舗`,
      body: (s, _r, labels) =>
        `${s} 店舗のKYC 5段階検証がすべて通過しました。\n\nおめでとうございます — 韓国政府検証完了店舗(K-Verified)として登録され、外国人のお客様が見るすべてのタッチポイントにゴールドバッジが表示されます。\n\n次のステップ: デザイナー登録 → チャンネル連携 → 決済手段登録 → ベータ公開。\n\n- ${labels.ops}`,
    },
    manual_review_queued: {
      subject: (s) => `[Hesya] ${s} KYC 手動レビュー中 (1〜2営業日)`,
      body: (s, r, labels) =>
        `${s} 店舗のKYC自動検証の一部段階が自動承認基準に達しなかったため、運営チームの手動レビューキューに移動されました。\n\n${formatSummaryLine(r, labels)}1〜2営業日以内にレビュー結果をお知らせします。\n\n- ${labels.ops}`,
    },
  },
  "zh-CN": {
    auto_rejected_nts: {
      subject: (s) => `[Hesya] ${s} 注册被拒绝 — 国税厅营业执照真伪确认失败`,
      body: (s, r, labels) =>
        `您好。${s} 店铺的 KYC 第一步(韩国国税厅营业执照真伪确认)被拒绝。\n\n营业执照号码或法定代表人姓名与国税厅登记信息不符。请确认信息后重新申请。\n\n${formatRejectionLines(r, labels)}- ${labels.ops}`,
    },
    auto_approved: {
      subject: (s) => `[Hesya] ${s} 审核通过 — K-Verified 认证店铺`,
      body: (s, _r, labels) =>
        `您好。${s} 店铺的 KYC 5 阶段验证全部通过。\n\n恭喜 — 您的店铺已注册为韩国政府认证店铺(K-Verified),金色徽章将在所有外国顾客可见的入口显示。\n\n下一步: 注册设计师 → 连接渠道 → 设置支付方式 → 测试上线。\n\n- ${labels.ops}`,
    },
    manual_review_queued: {
      subject: (s) => `[Hesya] ${s} KYC 人工审核中 (1-2 个工作日)`,
      body: (s, r, labels) =>
        `您好。${s} 店铺的 KYC 自动验证部分阶段未达到自动审核标准,已转入运营团队人工审核队列。\n\n${formatSummaryLine(r, labels)}1-2 个工作日内将告知审核结果。\n\n- ${labels.ops}`,
    },
  },
  "zh-TW": {
    auto_rejected_nts: {
      subject: (s) => `[Hesya] ${s} 註冊被拒絕 — 國稅廳營業執照真偽確認失敗`,
      body: (s, r, labels) =>
        `您好。${s} 店鋪的 KYC 第一步(韓國國稅廳營業執照真偽確認)被拒絕。\n\n營業執照號碼或法定代表人姓名與國稅廳登記資訊不符。請確認資訊後重新申請。\n\n${formatRejectionLines(r, labels)}- ${labels.ops}`,
    },
    auto_approved: {
      subject: (s) => `[Hesya] ${s} 審核通過 — K-Verified 認證店鋪`,
      body: (s, _r, labels) =>
        `您好。${s} 店鋪的 KYC 5 階段驗證全部通過。\n\n恭喜 — 您的店鋪已註冊為韓國政府認證店鋪(K-Verified),金色徽章將在所有外國顧客可見的入口顯示。\n\n下一步: 註冊設計師 → 連接管道 → 設定支付方式 → 測試上線。\n\n- ${labels.ops}`,
    },
    manual_review_queued: {
      subject: (s) => `[Hesya] ${s} KYC 人工審核中 (1-2 個工作天)`,
      body: (s, r, labels) =>
        `您好。${s} 店鋪的 KYC 自動驗證部分階段未達到自動審核標準,已轉入營運團隊人工審核佇列。\n\n${formatSummaryLine(r, labels)}1-2 個工作天內將告知審核結果。\n\n- ${labels.ops}`,
    },
  },
  vi: {
    auto_rejected_nts: {
      subject: (s) =>
        `[Hesya] ${s} đăng ký bị từ chối — Xác thực giấy phép kinh doanh NTS thất bại`,
      body: (s, r, labels) =>
        `Xin chào. Bước đầu tiên KYC của cửa hàng ${s} (xác thực giấy phép kinh doanh từ Cơ quan Thuế Hàn Quốc) đã bị từ chối.\n\nSố giấy phép kinh doanh hoặc tên đại diện không khớp với hồ sơ NTS. Vui lòng kiểm tra thông tin và đăng ký lại.\n\n${formatRejectionLines(r, labels)}- ${labels.ops}`,
    },
    auto_approved: {
      subject: (s) => `[Hesya] ${s} đã được phê duyệt — Cửa hàng K-Verified`,
      body: (s, _r, labels) =>
        `Xin chào. ${s} đã vượt qua toàn bộ 5 bước xác minh KYC.\n\nXin chúc mừng — cửa hàng của bạn đã được đăng ký là cửa hàng được chính phủ Hàn Quốc xác minh (K-Verified) và huy hiệu vàng sẽ được hiển thị trên tất cả các điểm tiếp xúc với khách hàng nước ngoài.\n\nBước tiếp theo: đăng ký nhà tạo mẫu → kết nối kênh → thiết lập phương thức thanh toán → ra mắt thử nghiệm.\n\n- ${labels.ops}`,
    },
    manual_review_queued: {
      subject: (s) =>
        `[Hesya] ${s} KYC đang trong quá trình xét duyệt thủ công (1-2 ngày làm việc)`,
      body: (s, r, labels) =>
        `Xin chào. Một số bước trong xác minh KYC tự động của ${s} không đạt ngưỡng phê duyệt tự động và đã được chuyển vào hàng đợi xét duyệt thủ công của đội ngũ vận hành.\n\n${formatSummaryLine(r, labels)}Bạn sẽ được thông báo kết quả trong vòng 1-2 ngày làm việc.\n\n- ${labels.ops}`,
    },
  },
};

export function buildKycNotification(input: BuildInput): BuiltMessage {
  // Locale fallback — 정의 안 된 locale (LOCALES 추가 시점) 안전장치
  const locale: Locale = MESSAGES[input.locale] ? input.locale : DEFAULT_LOCALE;
  const labels = LABELS[locale] ?? LABELS[DEFAULT_LOCALE] ?? LABELS.en;
  const tmpl = MESSAGES[locale][input.kind];
  return {
    subject: tmpl.subject(input.storeName),
    body: tmpl.body(input.storeName, input.reason, labels),
  };
}

interface SendInput extends BuildInput {
  to: string;
}

// Lazy init — module load 시점에 env Zod parse가 trigger되면 단위 테스트가
// .env.local 없어 ZodError. 호출 시점에만 평가.
let _resend: Resend | null = null;
function getResend(apiKey: string): Resend {
  if (!_resend) _resend = new Resend(apiKey);
  return _resend;
}

/**
 * KYC 결과 이메일 발송. 실패는 throw X — console.error만 (Server Action 응답에
 * 영향 없음). 호출자는 await 하되 결과 무시 권장.
 */
export async function sendKycNotification(input: SendInput): Promise<void> {
  // env import는 함수 내부 lazy — 모듈 load 시점 env Zod parse trigger 회피.
  const { env } = await import("@/shared/config/env");
  const { subject, body } = buildKycNotification(input);
  try {
    const result = await getResend(env.RESEND_API_KEY).emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: input.to,
      subject,
      // text는 plain string. HTML 템플릿은 prod 도메인 검증 시점에 별 PR.
      text: body,
    });
    if (result.error) {
      console.error(
        `[notify-kyc] Resend send failed (${input.kind} → ${input.to}):`,
        result.error,
      );
      return;
    }
    console.info(
      `[notify-kyc] sent (${input.kind} → ${input.to}) id=${result.data?.id ?? "unknown"}`,
    );
  } catch (err) {
    console.error(
      `[notify-kyc] Resend SDK threw (${input.kind} → ${input.to}):`,
      err,
    );
  }
}
