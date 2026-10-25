import { describe, expect, it } from "vitest";
import { isolateArabicRuns, isRtlHtml, isRtlText } from "./text-direction";

describe("arah teks Arab", () => {
  it("rtl hanya bila tidak ada huruf Latin", () => {
    expect(isRtlText("في مدرستنا مكتبة.")).toBe(true);
    expect(isRtlText("(1) المدرسة (2) إلى")).toBe(true);
    expect(isRtlText("«أستطيع» = saya mampu")).toBe(false);
    expect(isRtlText("Bacalah teks")).toBe(false);
    expect(isRtlHtml("<strong>الصيدلي:</strong> كيف أساعدكِ؟")).toBe(true);
  });
  it("potongan Arab beserta tanda baca penutup diisolasi", () => {
    expect(isolateArabicRuns("Kalimat «وهل أستطيع أن أذهب غدًا؟» adalah")).toBe('Kalimat «<bdi dir="rtl">وهل أستطيع أن أذهب غدًا؟</bdi>» adalah');
    expect(isolateArabicRuns("tanpa arab")).toBe("tanpa arab");
  });
  it("kata tebal di tengah kalimat Arab tetap satu potongan", () => {
    expect(isolateArabicRuns("«يعمل أبي <strong>مهندسًا</strong> في شركة» → <strong>مهندسًا</strong> = insinyur")).toBe(
      '«<bdi dir="rtl">يعمل أبي <strong>مهندسًا</strong> في شركة</bdi>» → <strong><bdi dir="rtl">مهندسًا</bdi></strong> = insinyur',
    );
  });
});
