import { describe, expect, it } from "vitest";
import { buildTopicTree, type QuestionListRow } from "./question-bank-types";

const row = (p: Partial<QuestionListRow>): QuestionListRow => ({
  id: 1,
  text: "",
  html: "",
  jenjang: "SMP",
  topic: "Matematika",
  subjectCode: "SMP-MTK",
  subtopicId: 1,
  subtopicCode: "SMP-MTK-D1-S1",
  subtopic: "Bilangan Real",
  difficulty: "easy",
  type: "pg",
  status: "draft",
  generatedBy: "manual",
  createdAt: "2026-09-26",
  stimulusCode: null,
  stimulusOrder: null,
  hasImage: false,
  ...p,
});

describe("buildTopicTree", () => {
  it("mengelompokkan jenjang → mata uji → subdomain dengan jumlah soal, urut SD/SMP/SMA", () => {
    const tree = buildTopicTree([
      row({ id: 1 }),
      row({ id: 2 }),
      row({ id: 3, jenjang: "SD", topic: "Bahasa Indonesia", subtopicId: 9, subtopic: "Ide Pokok" }),
      row({ id: 4, subtopicId: 2, subtopic: "Aljabar" }),
    ]);
    expect(tree.map((j) => j.jenjang)).toEqual(["SD", "SMP"]);
    expect(tree[1].topics[0].subtopics).toEqual([
      { id: 2, name: "Aljabar", count: 1 },
      { id: 1, name: "Bilangan Real", count: 2 },
    ]);
  });

  it("kosong bila belum ada soal", () => {
    expect(buildTopicTree([])).toEqual([]);
  });
});
