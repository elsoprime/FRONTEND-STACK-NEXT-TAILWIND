import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes and keeps the last conflicting utility", () => {
    const result = cn("p-2 text-sm", "p-4");

    expect(result).toContain("p-4");
    expect(result).toContain("text-sm");
    expect(result).not.toContain("p-2");
  });
});
