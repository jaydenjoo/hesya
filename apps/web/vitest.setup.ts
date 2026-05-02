/**
 * Vitest 글로벌 setup.
 *
 * - jest-dom matchers extend (toBeInTheDocument 등)
 * - 각 테스트 후 RTL DOM cleanup (메모리 누수 방지)
 */
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
