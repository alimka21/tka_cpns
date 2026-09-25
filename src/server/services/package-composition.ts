// Susunan soal paket tes (test_package_questions). Aturan soal grup:
// satu stimulus = satu blok — semua soal grup ikut, berdampingan, dan
// berurutan sesuai `stimulus_order` (docs/DECISIONS.md 2026-09-25).

export type ComposableQuestion = {
  id: number;
  stimulusId: number | null;
  stimulusOrder: number | null;
};

function groupsOf(questions: ComposableQuestion[]) {
  const groups = new Map<number, ComposableQuestion[]>();
  for (const q of questions) {
    if (q.stimulusId == null) continue;
    const list = groups.get(q.stimulusId) ?? [];
    list.push(q);
    groups.set(q.stimulusId, list);
  }
  for (const list of groups.values()) list.sort((a, b) => (a.stimulusOrder ?? 0) - (b.stimulusOrder ?? 0));
  return groups;
}

/**
 * Lengkapi pilihan admin: memilih satu soal grup = memasukkan seluruh
 * grupnya, di posisi kemunculan pertama, urut sesuai `stimulus_order`.
 * `bank` = semua soal yang relevan (minimal semua anggota grup terpilih).
 */
export function completeGroups(selectedIds: number[], bank: ComposableQuestion[]): number[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const groups = groupsOf(bank);
  const result: number[] = [];
  const seen = new Set<number>();
  for (const id of selectedIds) {
    const q = byId.get(id);
    if (!q || seen.has(id)) continue;
    const block = q.stimulusId != null ? groups.get(q.stimulusId)! : [q];
    for (const member of block) {
      if (!seen.has(member.id)) {
        seen.add(member.id);
        result.push(member.id);
      }
    }
  }
  return result;
}

/** Periksa susunan akhir paket; kembalikan pesan error (kosong = valid). */
export function validatePackageOrder(orderedIds: number[], bank: ComposableQuestion[]): string[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const groups = groupsOf(bank);
  const errors: string[] = [];

  const unknown = orderedIds.filter((id) => !byId.has(id));
  if (unknown.length > 0) errors.push(`Soal tidak ditemukan: ${unknown.join(", ")}`);
  if (new Set(orderedIds).size !== orderedIds.length) errors.push("Ada soal yang dimasukkan lebih dari sekali");

  const usedStimuli = new Set(orderedIds.map((id) => byId.get(id)?.stimulusId).filter((s): s is number => s != null));
  for (const stimulusId of usedStimuli) {
    const expected = groups.get(stimulusId)!.map((q) => q.id);
    const positions = orderedIds.flatMap((id, i) => (byId.get(id)?.stimulusId === stimulusId ? [i] : []));
    const actual = positions.map((i) => orderedIds[i]);
    if (actual.length !== expected.length) {
      errors.push(`Grup stimulus ${stimulusId} tidak lengkap (${actual.length} dari ${expected.length} soal)`);
      continue;
    }
    if (positions[positions.length - 1] - positions[0] !== positions.length - 1) {
      errors.push(`Soal grup stimulus ${stimulusId} harus berdampingan`);
    }
    if (actual.some((id, i) => id !== expected[i])) {
      errors.push(`Urutan soal grup stimulus ${stimulusId} harus mengikuti urutan di grup`);
    }
  }
  return errors;
}
