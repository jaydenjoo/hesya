// features/onboarding public API.
// 페이지·라우트는 항상 이 진입점으로만 import.

// Components
export { KycForm } from "./components/kyc-form";
export { PendingStatus } from "./components/pending-status";

// Server Actions
export {
  submitKycApplication,
  type SubmitKycApplicationResult,
} from "./actions/submit-kyc-application";

// Schema
export { KycApplicationSchema, type KycApplication } from "./schema";
