import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { server } from "@/mocks/server";

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

beforeEach(() => {
  document.cookie = "csrf_token=test-csrf-token; path=/";
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  document.cookie = "csrf_token=; Max-Age=0; path=/";
});

afterAll(() => {
  server.close();
});
