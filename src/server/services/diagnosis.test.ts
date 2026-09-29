import { describe, expect, it } from "vitest";
import { diagnose, practicePriorities, statusFor, type SubtopicRecord } from "./diagnosis";

const day = (n: number) => new Date(Date.UTC(2026, 8, n));
const rec = (subtopicId: number, correct: number, total: number, d: number): SubtopicRecord => ({ subtopicId, correct, total, at: day(d) });

describe("statusFor", () => {
  it("mengikuti ambang scoreTone dan minimal 3 soal", () => {
    expect(statusFor(100, 2)).toBe("insufficient");
    expect(statusFor(75, 3)).toBe("baik");
    expect(statusFor(74, 3)).toBe("cukup");
    expect(statusFor(50, 10)).toBe("cukup");
    expect(statusFor(49, 10)).toBe("perlu_latihan");
  });
});

describe("diagnose", () => {
  it("menghitung akurasi dari jendela soal terbaru, bukan seluruh riwayat", () => {
    // Dulu buruk (0/20), sekarang bagus (18/20) → jendela 20 soal hanya ambil yang terbaru.
    const [d] = diagnose([rec(1, 0, 20, 1), rec(1, 18, 20, 10)]);
    expect(d.accuracy).toBe(90);
    expect(d.windowQuestions).toBe(20);
    expect(d.totalQuestions).toBe(40);
    expect(d.status).toBe("baik");
    expect(d.previousAccuracy).toBe(0);
    expect(d.lastTestedAt).toEqual(day(10));
  });

  it("menggabungkan beberapa attempt kecil sampai jendela terpenuhi", () => {
    const [d] = diagnose([rec(1, 1, 5, 1), rec(1, 2, 5, 2), rec(1, 3, 5, 3), rec(1, 4, 5, 4), rec(1, 0, 5, 0)], 20);
    // 4 attempt terbaru = 20 soal: (4+3+2+1)/20 = 50%; attempt tertua tidak ikut.
    expect(d.accuracy).toBe(50);
    expect(d.windowQuestions).toBe(20);
    expect(d.history.map((h) => h.percentage)).toEqual([0, 20, 40, 60, 80]);
  });

  it("data belum cukup dan tanpa pembanding", () => {
    const [d] = diagnose([rec(2, 2, 2, 1)]);
    expect(d.status).toBe("insufficient");
    expect(d.previousAccuracy).toBeNull();
  });

  it("mengabaikan record tanpa soal", () => {
    expect(diagnose([rec(3, 0, 0, 1)])).toEqual([]);
  });
});

describe("practicePriorities", () => {
  it("hanya Perlu latihan/Cukup, akurasi terendah dulu, seri → soal lebih banyak", () => {
    const list = diagnose([
      rec(1, 9, 10, 1), // baik → tidak masuk
      rec(2, 3, 10, 1), // 30%
      rec(3, 6, 10, 1), // 60%
      rec(4, 6, 20, 1), // 30%, lebih banyak soal
      rec(5, 0, 2, 1), // belum cukup → tidak masuk
    ]);
    expect(practicePriorities(list).map((d) => d.subtopicId)).toEqual([4, 2, 3]);
    expect(practicePriorities(list, 1)).toHaveLength(1);
  });
});
