// Loader kerangka asesmen TKA — "otak" struktur konten.
// Sumber: asesmen/tka-{sd,smp,sma}.json (transkripsi regulasi BSKAP,
// jangan ubah isinya tanpa rujukan). File divalidasi & dinormalisasi sekali
// saat modul dimuat; JSON yang rusak langsung gagal di build & `npm test`.

import sdJson from "../../../asesmen/tka-sd.json";
import smpJson from "../../../asesmen/tka-smp.json";
import smaJson from "../../../asesmen/tka-sma.json";
import { frameworkFileSchema, presetSchema, type RawCognitiveLevel } from "./schema";

export const JENJANG = ["SD", "SMP", "SMA"] as const;
export type Jenjang = (typeof JENJANG)[number];

export type CognitiveLevel = {
  code: string;
  level: number;
  name: string;
  nameEn: string | null;
  description: string | null;
  processes: { name: string; description: string }[];
};

export type Subdomain = {
  code: string;
  order: number;
  name: string;
  description: string | null;
  competencies: string[];
  scope: string[];
  limits: string | null;
};

export type Domain = {
  code: string;
  order: number;
  name: string;
  description: string | null;
  subdomains: Subdomain[];
};

export type Subject = {
  code: string;
  order: number;
  name: string;
  fullName: string;
  type: "wajib" | "pilihan";
  /** Penamaan asli di regulasi: kompetensi/subkompetensi (bahasa) atau elemen/subelemen. */
  structure: "kompetensi_subkompetensi" | "elemen_subelemen";
  description: string;
  /** Kosong untuk mata uji bahasa (memakai struktur kompetensi). */
  cognitiveLevels: CognitiveLevel[];
  domains: Domain[];
  /** Field deskriptif mentah (muatan, karakteristik teks, dll.) untuk konteks AI. */
  raw: Record<string, unknown>;
};

export type Framework = {
  jenjang: Jenjang;
  jenjangName: string;
  version: string;
  regulation: { number: string; title: string };
  questionForms: string[];
  subjects: Subject[];
  /** Hanya SMA: semua mata uji wajib + N pilihan. */
  selectionRule: { requiredCodes: string[]; electiveCount: number } | null;
};

export class FrameworkError extends Error {}

function normalizeLevel(l: RawCognitiveLevel): CognitiveLevel {
  return {
    code: l.kode,
    level: l.level,
    name: l.nama,
    nameEn: l.nama_en ?? null,
    description: l.deskripsi ?? l.definisi ?? null,
    processes:
      typeof l.proses_berpikir === "string"
        ? [{ name: l.nama, description: l.proses_berpikir }]
        : (l.proses_berpikir ?? l.proses_kognitif ?? []).map((p) => ({ name: p.nama, description: p.deskripsi })),
  };
}

/** Validasi skema + invarian (kode unik, prefix, urutan, rujukan preset). */
export function loadFramework(input: unknown): Framework {
  const parsed = frameworkFileSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new FrameworkError(`Kerangka tidak valid di ${issue.path.join(".")}: ${issue.message}`);
  }
  const file = parsed.data;
  const jenjang = file.meta.kode_jenjang;
  const seen = new Set<string>();
  const claim = (code: string) => {
    if (seen.has(code)) throw new FrameworkError(`[${jenjang}] Kode ganda: ${code}`);
    seen.add(code);
  };
  const checkOrder = (items: { urutan: number; kode: string }[], parent: string) =>
    items.forEach((item, i) => {
      if (item.urutan !== i + 1) throw new FrameworkError(`[${jenjang}] Urutan ${item.kode} = ${item.urutan}, harus ${i + 1} (di ${parent})`);
    });

  const presets = new Map<string, CognitiveLevel[]>();
  for (const [key, value] of Object.entries(file.level_kognitif_preset ?? {})) {
    const preset = presetSchema.safeParse(value);
    // Entri tanpa daftar level (mis. "catatan", preset struktur bahasa) bukan skema level.
    if (preset.success) presets.set(key, preset.data.level.map(normalizeLevel));
  }

  checkOrder(file.mata_uji, jenjang);
  const subjects: Subject[] = file.mata_uji.map((m) => {
    claim(m.kode);
    let cognitiveLevels: CognitiveLevel[] = [];
    if (m.level_kognitif) cognitiveLevels = m.level_kognitif.map(normalizeLevel);
    else if (m.level_kognitif_ref) {
      const preset = presets.get(m.level_kognitif_ref);
      if (!preset) throw new FrameworkError(`[${jenjang}] ${m.kode}: preset ${m.level_kognitif_ref} tidak ditemukan`);
      cognitiveLevels = preset;
    }
    checkOrder(m.domain, m.kode);
    const domains: Domain[] = m.domain.map((d) => {
      claim(d.kode);
      if (!d.kode.startsWith(`${m.kode}-`)) throw new FrameworkError(`[${jenjang}] Domain ${d.kode} bukan turunan ${m.kode}`);
      checkOrder(d.subdomain, d.kode);
      return {
        code: d.kode,
        order: d.urutan,
        name: d.nama,
        description: d.deskripsi ?? null,
        subdomains: d.subdomain.map((s) => {
          claim(s.kode);
          if (!s.kode.startsWith(`${d.kode}-`)) throw new FrameworkError(`[${jenjang}] Subdomain ${s.kode} bukan turunan ${d.kode}`);
          return {
            code: s.kode,
            order: s.urutan,
            name: s.nama,
            description: s.deskripsi ?? null,
            competencies: s.kompetensi === undefined ? [] : [s.kompetensi].flat(),
            scope: s.cakupan ?? [],
            limits: s.batasan ?? null,
          };
        }),
      };
    });
    const raw: Record<string, unknown> = { ...m };
    delete raw.domain;
    return {
      code: m.kode,
      order: m.urutan,
      name: m.nama,
      fullName: m.nama_lengkap,
      type: m.tipe,
      structure: m.tipe_struktur,
      description: m.deskripsi,
      cognitiveLevels,
      domains,
      raw,
    };
  });

  let selectionRule: Framework["selectionRule"] = null;
  if (file.aturan_pemilihan_mata_uji) {
    const requiredCodes = file.aturan_pemilihan_mata_uji.mata_uji_wajib.daftar_kode;
    for (const c of requiredCodes) {
      if (!subjects.some((s) => s.code === c && s.type === "wajib")) {
        throw new FrameworkError(`[${jenjang}] Mata uji wajib ${c} tidak ada atau bukan tipe wajib`);
      }
    }
    selectionRule = { requiredCodes, electiveCount: file.aturan_pemilihan_mata_uji.mata_uji_pilihan.jumlah_dipilih };
  }

  return {
    jenjang,
    jenjangName: file.meta.nama_jenjang,
    version: file.meta.versi_file,
    regulation: { number: file.referensi_regulasi.nomor, title: file.referensi_regulasi.tentang },
    questionForms: file.bentuk_soal.map((b) => b.kode),
    subjects,
    selectionRule,
  };
}

export const FRAMEWORKS: Record<Jenjang, Framework> = {
  SD: loadFramework(sdJson),
  SMP: loadFramework(smpJson),
  SMA: loadFramework(smaJson),
};

for (const j of JENJANG) {
  if (FRAMEWORKS[j].jenjang !== j) throw new FrameworkError(`File ${j} berisi kode_jenjang ${FRAMEWORKS[j].jenjang}`);
}

export type SubdomainRef = { framework: Framework; subject: Subject; domain: Domain; subdomain: Subdomain };

const subdomainIndex = new Map<string, SubdomainRef>();
for (const framework of Object.values(FRAMEWORKS)) {
  for (const subject of framework.subjects) {
    for (const domain of subject.domains) {
      for (const subdomain of domain.subdomains) {
        if (subdomainIndex.has(subdomain.code)) throw new FrameworkError(`Kode subdomain ganda lintas jenjang: ${subdomain.code}`);
        subdomainIndex.set(subdomain.code, { framework, subject, domain, subdomain });
      }
    }
  }
}

/** Cari subdomain berdasarkan kode baku, mis. "SMP-MTK-D1-S1". Tidak peka huruf besar/kecil. */
export function findSubdomain(code: string): SubdomainRef | undefined {
  return subdomainIndex.get(code.trim().toUpperCase());
}

export function allSubdomains(): SubdomainRef[] {
  return [...subdomainIndex.values()];
}
