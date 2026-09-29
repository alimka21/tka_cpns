// Bentuk data Bank Soal & Stimulus yang dikirim ke client (tanpa kunci jawaban).

import type { Difficulty, QuestionType } from "@/lib/validation/enums";

export type QuestionListRow = {
  id: number;
  text: string;
  jenjang: string;
  /** Nama mata uji. */
  topic: string;
  subtopicId: number;
  subtopicCode: string;
  /** Nama subdomain. */
  subtopic: string;
  difficulty: Difficulty;
  type: QuestionType;
  status: "draft" | "pending_review" | "published";
  generatedBy: "manual" | "ai" | "import";
  createdAt: string;
  stimulusCode: string | null;
  stimulusOrder: number | null;
};

/** Pohon filter: jenjang → mata uji → subdomain yang punya soal. */
export type TopicTreeNode = {
  jenjang: string;
  topics: { id: string; name: string; subtopics: { id: number; name: string; count: number }[] }[];
};

const JENJANG_ORDER = ["SD", "SMP", "SMA"];

export function buildTopicTree(rows: QuestionListRow[]): TopicTreeNode[] {
  const byJenjang = new Map<string, Map<string, Map<number, { name: string; count: number }>>>();
  for (const r of rows) {
    const subjects = byJenjang.get(r.jenjang) ?? new Map();
    byJenjang.set(r.jenjang, subjects);
    const subs = subjects.get(r.topic) ?? new Map();
    subjects.set(r.topic, subs);
    const sub = subs.get(r.subtopicId) ?? { name: r.subtopic, count: 0 };
    sub.count += 1;
    subs.set(r.subtopicId, sub);
  }
  return [...byJenjang]
    .sort(([a], [b]) => JENJANG_ORDER.indexOf(a) - JENJANG_ORDER.indexOf(b))
    .map(([jenjang, subjects]) => ({
      jenjang,
      topics: [...subjects]
        .sort(([a], [b]) => a.localeCompare(b, "id"))
        .map(([name, subs]) => ({
          id: `${jenjang}-${name}`,
          name,
          subtopics: [...subs]
            .map(([id, s]) => ({ id, ...s }))
            .sort((a, b) => a.name.localeCompare(b.name, "id")),
        })),
    }));
}

export type StimulusListItem = {
  id: number;
  code: string;
  title: string;
  content: string;
  status: "draft" | "published";
  createdAt: string;
  questions: { id: number; order: number | null; type: QuestionType; text: string; subtopic: string }[];
};

/** Data form Edit Soal (admin saja — memuat kunci jawaban). */
export type QuestionEditData = {
  id: number;
  subdomainCode: string;
  type: QuestionType;
  questionText: string;
  imageUrl: string | null;
  difficulty: Difficulty;
  cognitiveLevel: string | null;
  status: QuestionListRow["status"];
  categoryLabels: [string, string] | null;
  stimulusId: number | null;
  stimulusOrder: number | null;
  explanationText: string;
  options: { text: string; isCorrect: boolean; correctCategory: string | null }[];
  /** Jumlah paket yang memakai soal & jumlah jawaban siswa tersimpan. */
  usage: { packages: number; answers: number };
};
