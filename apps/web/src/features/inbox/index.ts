// features/inbox public API.
// 페이지·라우트는 항상 이 진입점으로만 import.

// Components
export { ThreadList } from "./components/thread-list";
export { ThreadItem } from "./components/thread-item";
export { ThreadListEmpty } from "./components/thread-list-empty";
export { ThreadListConnectCTA } from "./components/thread-list-connect-cta";
export { MessageView } from "./components/message-view";
export { MessageViewEmpty } from "./components/message-view-empty";
export { MessageBubble } from "./components/message-bubble";
export { MessageList } from "./components/message-list";
export { ThreadHeader } from "./components/thread-header";
export { ReplyComposer } from "./components/reply-composer";
export { TokenExpiredBanner } from "./components/token-expired-banner";
export { WindowStatus } from "./components/window-status";
export { BotModeToggle } from "./components/bot-mode-toggle";
export { DraftReviewPanel } from "./components/draft-review-panel";
export { ShortcutFab } from "./components/shortcut-fab";

// Server Actions
export { sendOutbound } from "./actions/send-outbound";
export { getInstagramOAuthUrl } from "./actions/connect-instagram";
export { approveDraft } from "./actions/approve-draft";
export { editAndSend } from "./actions/edit-and-send";
export { skipDraft } from "./actions/skip-draft";
export { toggleBotMode } from "./actions/toggle-bot-mode";

// Types
export type {
  Conversation,
  ConversationListItem,
  Customer,
  Message,
  WindowState,
  WindowStatus as WindowStatusType,
} from "./types";

// Utilities
export { getWindowStatus } from "./lib/window-utils";
