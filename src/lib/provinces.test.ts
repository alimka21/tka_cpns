import { describe, expect, it } from "vitest";
import { requiredPhoneSchema } from "@/lib/identity";
import { PROVINCES, provinceSchema, schoolNameSchema } from "./provinces";
import { signUpInput } from "./validation/auth";

describe("data pendaftaran", () => {
  it("38 provinsi, tanpa duplikat", () => {
    expect(PROVINCES).toHaveLength(38);
    expect(new Set(PROVINCES).size).toBe(38);
    expect(provinceSchema.safeParse("Papua Pegunungan").success).toBe(true);
    expect(provinceSchema.safeParse("Jabar").success).toBe(false);
  });
  it("nama sekolah dirapikan, minimal 3 karakter", () => {
    expect(schoolNameSchema.parse("  SMP  Negeri 1 ")).toBe("SMP Negeri 1");
    expect(schoolNameSchema.safeParse("ab").success).toBe(false);
  });
  it("No. HP wajib & dinormalkan", () => {
    expect(requiredPhoneSchema.parse("0812-3456-7890")).toBe("6281234567890");
    expect(requiredPhoneSchema.safeParse("").success).toBe(false);
    expect(requiredPhoneSchema.safeParse("12345").success).toBe(false);
  });
  it("form daftar menolak tanpa provinsi/sekolah/HP", () => {
    const base = { name: "Rina", jenjang: "SMP", username: "rina.k", email: "", password: "rahasia123", confirmPassword: "rahasia123" };
    expect(signUpInput.safeParse({ ...base, phone: "081234567890", province: "Bali", schoolName: "SMP Negeri 2 Denpasar" }).success).toBe(true);
    const r = signUpInput.safeParse({ ...base, phone: "", province: "", schoolName: "" });
    expect(r.success).toBe(false);
    expect(new Set(r.error!.issues.map((i) => i.path[0]))).toEqual(new Set(["phone", "province", "schoolName"]));
  });
});
