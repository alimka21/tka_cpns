import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("menerima path relatif di situs ini", () => {
    expect(safeRedirectPath("/admin/soal?status=draft", "/x")).toBe("/admin/soal?status=draft");
  });

  it("menolak URL penuh, protocol-relative, dan karakter kontrol", () => {
    for (const bad of ["https://evil.test", "//evil.test", "/\\evil.test", "javascript:alert(1)", "/a\nb", "", null, undefined]) {
      expect(safeRedirectPath(bad, "/dashboard")).toBe("/dashboard");
    }
  });
});
