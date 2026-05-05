import { describe, it, expectTypeOf } from "vitest";
import type { Conversation, Message, WindowState, WindowStatus } from "./types";

describe("inbox types", () => {
  it("Conversation re-export has id field", () => {
    expectTypeOf<Conversation>().toHaveProperty("id");
  });

  it("Message re-export has id field", () => {
    expectTypeOf<Message>().toHaveProperty("id");
  });

  it("WindowState union", () => {
    expectTypeOf<WindowState>().toEqualTypeOf<
      "no-inbound" | "open" | "closing-soon" | "expired"
    >();
  });

  it("WindowStatus shape", () => {
    expectTypeOf<WindowStatus>().toMatchObjectType<{
      state: WindowState;
      remainingMs: number | null;
    }>();
  });
});
