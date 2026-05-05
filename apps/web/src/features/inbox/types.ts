import type { conversations, customers, messages } from "@hesya/database";

/** DB row 형식. apps/web 내부에서 inbox 도메인 타입을 단일 import 경로로. */
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Customer = typeof customers.$inferSelect;

export type { WindowState, WindowStatus } from "./lib/window-utils";
