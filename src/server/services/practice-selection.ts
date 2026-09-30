// Pemilihan soal Latihan Kelemahan dari bank (docs/AI_GENERATION.md §5).
// Fungsi murni supaya bisa dites tanpa DB.
//
// - Hanya soal di subdomain target (plus soal lain satu grup stimulus, karena
//   grup selalu diambil utuh & berurutan — aturan yang sama dengan paket).
// - Belum pernah dikerjakan siswa dulu (diacak), lalu yang paling lama
//   tidak dikerjakan.
// - Dibagi rata antar subdomain target (bergiliran sesuai urutan prioritas).

export type PracticeCandidate = {
  id: number;
  subtopicId: number;
  stimulusId: number | null;
  stimulusOrder: number | null;
};

type Unit = { questionIds: number[]; subtopicIds: Set<number>; lastSeen: number; tiebreak: number };

export function selectPracticeQuestions(
  targets: number[],
  candidates: PracticeCandidate[],
  lastSeen: ReadonlyMap<number, Date>,
  count: number,
  random: () => number = Math.random,
): number[] {
  const units: Unit[] = [];
  const groups = new Map<number, PracticeCandidate[]>();
  for (const c of candidates) {
    if (c.stimulusId == null) {
      units.push(makeUnit([c]));
    } else {
      const list = groups.get(c.stimulusId) ?? [];
      list.push(c);
      groups.set(c.stimulusId, list);
    }
  }
  for (const list of groups.values()) {
    units.push(makeUnit([...list].sort((a, b) => (a.stimulusOrder ?? 0) - (b.stimulusOrder ?? 0))));
  }

  function makeUnit(qs: PracticeCandidate[]): Unit {
    // Belum pernah dikerjakan = -1 → paling depan; grup memakai waktu terbaru anggotanya.
    const seen = qs.map((q) => lastSeen.get(q.id)?.getTime() ?? -1);
    return {
      questionIds: qs.map((q) => q.id),
      subtopicIds: new Set(qs.map((q) => q.subtopicId)),
      lastSeen: Math.max(...seen),
      tiebreak: random(),
    };
  }

  const queues = targets.map((t) =>
    units.filter((u) => u.subtopicIds.has(t)).sort((a, b) => a.lastSeen - b.lastSeen || a.tiebreak - b.tiebreak),
  );

  const used = new Set<Unit>();
  const picked: number[] = [];
  let progressed = true;
  while (picked.length < count && progressed) {
    progressed = false;
    for (const queue of queues) {
      if (picked.length >= count) break;
      // Unit berikutnya yang belum dipakai & masih muat (grup tidak boleh dipotong).
      const unit = queue.find((u) => !used.has(u) && picked.length + u.questionIds.length <= count);
      if (!unit) continue;
      used.add(unit);
      picked.push(...unit.questionIds);
      progressed = true;
    }
  }
  return picked;
}
