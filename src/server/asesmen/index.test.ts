import { describe, expect, it } from "vitest";
import sdJson from "../../../asesmen/tka-sd.json";
import { FRAMEWORKS, FrameworkError, allSubdomains, findSubdomain, loadFramework } from "./index";

const clone = <T>(v: T): T => structuredClone(v);

describe("kerangka asesmen", () => {
  it("ketiga jenjang termuat dengan mata uji wajibnya", () => {
    expect(FRAMEWORKS.SD.subjects.map((s) => s.code)).toEqual(["SD-BIND", "SD-MTK"]);
    expect(FRAMEWORKS.SMP.subjects.map((s) => s.code)).toEqual(["SMP-BIND", "SMP-MTK"]);
    expect(FRAMEWORKS.SMA.selectionRule).toEqual({
      requiredCodes: ["SMA-BIND", "SMA-MTK", "SMA-BING"],
      electiveCount: 2,
    });
  });

  it("setiap subdomain punya kode unik lintas jenjang", () => {
    const codes = allSubdomains().map((r) => r.subdomain.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBeGreaterThan(250);
  });

  it("mata uji non-bahasa punya level kognitif (langsung atau lewat preset)", () => {
    for (const fw of Object.values(FRAMEWORKS)) {
      for (const s of fw.subjects) {
        if (s.structure === "elemen_subelemen") expect(s.cognitiveLevels.length, s.code).toBeGreaterThan(0);
      }
    }
    // SMA-MTK memakai PRESET-MTK-SMA
    expect(FRAMEWORKS.SMA.subjects.find((s) => s.code === "SMA-MTK")!.cognitiveLevels.map((l) => l.code)).toEqual([
      "L1",
      "L2",
      "L3",
    ]);
  });

  it("findSubdomain mengembalikan jalur lengkap & tidak peka huruf", () => {
    const ref = findSubdomain(" smp-mtk-d1-s1 ");
    expect(ref?.subject.code).toBe("SMP-MTK");
    expect(ref?.domain.code).toBe("SMP-MTK-D1");
    expect(ref?.subdomain.name).toBe("Bilangan Real");
    expect(ref?.subdomain.scope.length).toBeGreaterThan(0);
    expect(findSubdomain("SMP-MTK-D9-S9")).toBeUndefined();
  });

  it("menolak kode ganda", () => {
    const bad = clone(sdJson);
    bad.mata_uji[0].domain[0].subdomain[1].kode = bad.mata_uji[0].domain[0].subdomain[0].kode;
    expect(() => loadFramework(bad)).toThrow(FrameworkError);
  });

  it("menolak subdomain yang bukan turunan domainnya", () => {
    const bad = clone(sdJson);
    bad.mata_uji[0].domain[0].subdomain[0].kode = "SD-MTK-D1-S99";
    expect(() => loadFramework(bad)).toThrow(/bukan turunan/);
  });

  it("menolak urutan yang loncat", () => {
    const bad = clone(sdJson);
    bad.mata_uji[0].domain[0].subdomain[0].urutan = 5;
    expect(() => loadFramework(bad)).toThrow(/Urutan/);
  });

  it("menolak rujukan preset yang tidak ada", () => {
    const bad = clone(sdJson) as Record<string, unknown> & typeof sdJson;
    const subject = bad.mata_uji[1] as Record<string, unknown>;
    delete subject.level_kognitif;
    subject.level_kognitif_ref = "PRESET-TIDAK-ADA";
    expect(() => loadFramework(bad)).toThrow(/preset/);
  });
});
