import { describe, expect, it } from "vitest";
import { completeGroups, validatePackageOrder, type ComposableQuestion } from "./package-composition";

// Soal 1–2 tunggal; stimulus 7 = soal 12 (urutan 2), 11 (urutan 1), 13 (urutan 3).
const bank: ComposableQuestion[] = [
  { id: 1, stimulusId: null, stimulusOrder: null },
  { id: 2, stimulusId: null, stimulusOrder: null },
  { id: 12, stimulusId: 7, stimulusOrder: 2 },
  { id: 11, stimulusId: 7, stimulusOrder: 1 },
  { id: 13, stimulusId: 7, stimulusOrder: 3 },
];

describe("completeGroups", () => {
  it("memilih satu soal grup memasukkan seluruh grup, urut sesuai stimulus_order", () => {
    expect(completeGroups([1, 12, 2], bank)).toEqual([1, 11, 12, 13, 2]);
  });

  it("tidak menggandakan soal grup yang dipilih lebih dari sekali", () => {
    expect(completeGroups([13, 11, 1], bank)).toEqual([11, 12, 13, 1]);
  });

  it("mengabaikan id yang tidak dikenal", () => {
    expect(completeGroups([99, 1], bank)).toEqual([1]);
  });
});

describe("validatePackageOrder", () => {
  it("susunan hasil completeGroups selalu valid", () => {
    expect(validatePackageOrder(completeGroups([2, 13, 1], bank), bank)).toEqual([]);
  });

  it("menolak grup tidak lengkap, terpisah, atau urutannya salah", () => {
    expect(validatePackageOrder([1, 11, 12], bank)).toEqual(["Grup stimulus 7 tidak lengkap (2 dari 3 soal)"]);
    expect(validatePackageOrder([11, 12, 1, 13], bank)).toEqual(["Soal grup stimulus 7 harus berdampingan"]);
    expect(validatePackageOrder([12, 11, 13], bank)).toEqual(["Urutan soal grup stimulus 7 harus mengikuti urutan di grup"]);
  });

  it("menolak soal ganda & soal tak dikenal", () => {
    expect(validatePackageOrder([1, 1, 99], bank)).toEqual(["Soal tidak ditemukan: 99", "Ada soal yang dimasukkan lebih dari sekali"]);
  });
});
