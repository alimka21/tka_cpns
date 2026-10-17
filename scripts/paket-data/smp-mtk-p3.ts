// TKA SMP Matematika — Paket 3 (sumber: Warming Up PP TKA SMP/MTs, izin pemilik produk).
// 30 soal paket (12 MCMA/Kategori + 18 PG) + 10 soal khusus bank soal.
const r = String.raw;
const FONT = `font-family="Arial, Helvetica, sans-serif"`;
const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${FONT}><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
const text = (x: number, y: number, t: string, o: { size?: number; anchor?: string; weight?: string; fill?: string; italic?: boolean } = {}) =>
  `<text x="${x}" y="${y}" font-size="${o.size ?? 18}" text-anchor="${o.anchor ?? "middle"}" font-weight="${o.weight ?? "normal"}" fill="${o.fill ?? "#111"}"${o.italic ? ` font-style="italic"` : ""}>${t}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, o: { stroke?: string; w?: number; dash?: boolean; arrow?: boolean } = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke ?? "#111"}" stroke-width="${o.w ?? 2}"${o.dash ? ` stroke-dasharray="6 5"` : ""}${o.arrow ? ` marker-end="url(#ar)"` : ""}/>`;
const arrowDef = (color = "#111") =>
  `<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${color}"/></marker></defs>`;
const dot = (x: number, y: number, rr = 5, fill = "#111") => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${fill}"/>`;

// ---------- Gambar ----------

// No. 16 — timbangan
function balance(cx: number, baseY: number, left: string[], right: string[], label: string, sideLabels = false) {
  const panY = baseY - 70;
  let s = `<path d="M${cx - 45},${baseY} L${cx + 45},${baseY} L${cx + 12},${panY + 8} L${cx - 12},${panY + 8} z" fill="#b45f2a"/>`;
  s += line(cx - 120, panY, cx + 120, panY, { w: 5, stroke: "#7a4a1f" });
  s += `<rect x="${cx - 165}" y="${panY - 6}" width="90" height="8" rx="3" fill="#9ca3af"/><rect x="${cx + 75}" y="${panY - 6}" width="90" height="8" rx="3" fill="#9ca3af"/>`;
  const items = (list: string[], center: number) => {
    let out = "";
    const perRow = 4;
    list.forEach((it, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, list.length - row * perRow);
      const col = i % perRow;
      const x = center - ((inRow - 1) * 22) / 2 + col * 22;
      const y = panY - 18 - row * 22;
      if (it === "w") out += `<path d="M${x - 9},${y + 11} L${x + 9},${y + 11} L${x + 6},${y - 7} L${x - 6},${y - 7} z" fill="#6b7280" stroke="#374151"/><rect x="${x - 3}" y="${y - 12}" width="6" height="5" fill="#374151"/>`;
      else if (it === "a") out += `<circle cx="${x}" cy="${y}" r="10" fill="#dc2626" stroke="#7f1d1d"/><line x1="${x}" y1="${y - 10}" x2="${x + 2}" y2="${y - 15}" stroke="#14532d" stroke-width="2"/>`;
      else if (it === "m") out += `<ellipse cx="${x}" cy="${y}" rx="11" ry="9" fill="#f59e0b" stroke="#92400e" transform="rotate(-25 ${x} ${y})"/>`;
      else if (it === "?") out += text(x, y + 7, "?", { size: 26, weight: "bold" });
    });
    return out;
  };
  s += items(left, cx - 120) + items(right, cx + 120);
  s += text(cx, baseY + 26, label, { size: 17, weight: "bold" });
  if (sideLabels) s += text(cx - 120, panY + 30, "A", { weight: "bold" }) + text(cx + 120, panY + 30, "B", { weight: "bold" });
  return s;
}
const imgTimbangan = svg(
  860,
  470,
  balance(215, 180, ["w", "w"], ["a", "a", "a", "a", "a", "a", "a", "a"], "Gambar 1") +
    balance(645, 180, ["a", "a", "a", "a", "a", "a"], ["m", "m"], "Gambar 2") +
    balance(430, 400, ["w", "w", "w"], ["m", "m", "m", "a", "a", "?"], "Gambar 3", true) +
    `<circle cx="670" cy="440" r="10" fill="#dc2626"/>` + text(688, 446, "Apel", { anchor: "start", size: 16 }) +
    `<ellipse cx="760" cy="440" rx="11" ry="9" fill="#f59e0b"/>` + text(778, 446, "Mangga", { anchor: "start", size: 16 }) +
    `<path d="M66,449 L84,449 L81,431 L69,431 z" fill="#6b7280"/>` + text(92, 446, "Anak timbangan", { anchor: "start", size: 16 }),
);

// No. 18 — garis bilangan
function numberLine(y: number, label: string, from: number, dotAt: number, toRight: boolean) {
  const x0 = 90, step = 60;
  const xOf = (v: number) => x0 + 30 + (v - from) * step;
  let s = text(30, y + 6, label, { weight: "bold", size: 20 });
  s += line(x0, y, x0 + 7 * step, y, { w: 2 }) + `<path d="M${x0 + 7 * step + 12},${y} l-12,-7 v14 z" fill="#111"/><path d="M${x0 - 12},${y} l12,-7 v14 z" fill="#111"/>`;
  for (let v = from; v <= from + 6; v++) s += line(xOf(v), y - 8, xOf(v), y + 8, { w: 2 }) + text(xOf(v), y + 30, String(v).replace("-", "−"), { size: 16 });
  const d = xOf(dotAt);
  s += toRight
    ? `<line x1="${d}" y1="${y}" x2="${x0 + 7 * step + 4}" y2="${y}" stroke="#c026d3" stroke-width="7"/><path d="M${x0 + 7 * step + 16},${y} l-16,-10 v20 z" fill="#c026d3"/>`
    : `<line x1="${x0 - 4}" y1="${y}" x2="${d}" y2="${y}" stroke="#c026d3" stroke-width="7"/><path d="M${x0 - 16},${y} l16,-10 v20 z" fill="#c026d3"/>`;
  return s + dot(d, y, 8, "#c026d3");
}
const imgGarisBilangan = svg(
  640,
  420,
  numberLine(50, "A", -10, -7, false) + numberLine(150, "B", -10, -7, true) + numberLine(250, "C", 4, 7, false) + numberLine(350, "D", 4, 7, true),
);

// No. 19 — pola persegi
function grid(x: number, y: number, n: number, cell: number) {
  let s = "";
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      s += `<rect x="${x + j * cell}" y="${y + i * cell}" width="${cell}" height="${cell}" fill="#fff" stroke="#111" stroke-width="2"/>`;
      if (i + j === n - 1) s += text(x + j * cell + cell / 2, y + i * cell + cell / 2 + 9, "X", { size: 26, weight: "bold" });
    }
  return s;
}
const imgPola = svg(
  700,
  290,
  grid(30, 150, 2, 50) + text(80, 280, "Pola ke-1", { size: 17 }) +
    grid(200, 100, 3, 50) + text(275, 280, "Pola ke-2", { size: 17 }) +
    grid(430, 50, 4, 50) + text(530, 280, "Pola ke-3", { size: 17 }),
);

// No. 21 — diagram panah
function arrowDiagram(ox: number, title: string, pairs: [string, string][]) {
  const A = ["2", "4", "6", "8"], B = ["a", "b", "c", "d"];
  const ya = (i: number) => 95 + i * 45;
  let s = `<rect x="${ox}" y="20" width="260" height="290" fill="none" stroke="#111" stroke-width="2"/>`;
  s += text(ox + 70, 50, "A", { weight: "bold" }) + text(ox + 190, 50, "B", { weight: "bold" });
  s += `<ellipse cx="${ox + 70}" cy="162" rx="38" ry="100" fill="none" stroke="#1d4ed8" stroke-width="3"/><ellipse cx="${ox + 190}" cy="162" rx="38" ry="100" fill="none" stroke="#1d4ed8" stroke-width="3"/>`;
  A.forEach((v, i) => (s += dot(ox + 82, ya(i), 4) + text(ox + 64, ya(i) + 6, v, { size: 18, weight: "bold" })));
  B.forEach((v, i) => (s += dot(ox + 178, ya(i), 4) + text(ox + 198, ya(i) + 6, v, { size: 18, weight: "bold" })));
  for (const [a, b] of pairs) s += line(ox + 84, ya(A.indexOf(a)), ox + 174, ya(B.indexOf(b)), { stroke: "#dc2626", w: 2.5, arrow: true });
  return s + text(ox + 130, 298, title, { size: 17, weight: "bold" });
}
const imgDiagramPanah = svg(
  840,
  330,
  arrowDef("#dc2626") +
    arrowDiagram(10, "Diagram 1", [["2", "a"], ["4", "c"], ["4", "d"], ["8", "b"]]) +
    arrowDiagram(290, "Diagram 2", [["2", "a"], ["4", "c"], ["6", "d"], ["8", "b"]]) +
    arrowDiagram(570, "Diagram 3", [["2", "a"], ["4", "c"], ["8", "b"]]),
);

// No. 22 — grafik f(x) = px + q
function imgFungsiLinear() {
  const ox = 330, oy = 300, ux = 30, uy = 12; // f(x) = -2x + 5
  const X = (x: number) => ox + x * ux, Y = (y: number) => oy - y * uy;
  let s = arrowDef();
  s += line(40, oy, 620, oy, { arrow: true }) + line(ox, 420, ox, 25, { arrow: true });
  s += text(612, oy + 26, "x", { italic: true }) + text(ox + 16, 32, "y", { italic: true });
  s += `<line x1="${X(-8.2)}" y1="${Y(21.4)}" x2="${X(6.8)}" y2="${Y(-8.6)}" stroke="#dc2626" stroke-width="3"/>`;
  const pts: [number, number, string, string][] = [[-7, 19, "a", "19"], [-3, 11, "−3", "11"], [2, 1, "2", "b"], [5, -5, "5", "−5"]];
  for (const [x, y, lx, ly] of pts) {
    s += line(X(x), Y(y), X(x), oy, { dash: true, w: 1.5 }) + line(X(x), Y(y), ox, Y(y), { dash: true, w: 1.5 }) + dot(X(x), Y(y), 6);
    s += text(X(x), y >= 0 ? oy + 24 : oy - 10, lx, { italic: lx === "a", size: 17 });
    s += text(x < 0 ? ox + 22 : ox - 20, Y(y) + 6, ly, { italic: ly === "b", size: 17 });
  }
  s += text(150, 50, "f(x) = px + q", { italic: true, size: 18 }) + text(ox - 12, oy + 22, "0", { size: 15 });
  return svg(640, 440, s);
}

// No. 23 — grafik biaya PDAM
function imgPdam() {
  const ox = 120, oy = 400, ux = 9, uy = 13; // x: m³ (0–50), y: ribu rupiah 1.295–1.320
  const X = (x: number) => ox + x * ux, Y = (v: number) => oy - (v - 1295) * uy;
  let s = arrowDef();
  for (let x = 0; x <= 50; x += 5) s += line(X(x), Y(1320), X(x), oy, { stroke: "#d1d5db", w: 1 });
  for (let v = 1295; v <= 1320; v += 2.5) s += line(ox, Y(v), X(50), Y(v), { stroke: "#d1d5db", w: 1 });
  s += line(ox, oy, X(53), oy, { arrow: true }) + line(ox, oy, ox, Y(1322), { arrow: true });
  for (let x = 0; x <= 50; x += 10) s += text(X(x), oy + 24, String(x), { size: 16 });
  for (const v of [1300, 1305, 1310, 1315]) s += text(ox - 10, Y(v) + 6, `1.${v - 1000}`, { size: 16, anchor: "end", weight: "bold" });
  s += `<line x1="${X(0)}" y1="${Y(1300)}" x2="${X(35)}" y2="${Y(1317.5)}" stroke="#1d4ed8" stroke-width="3"/>`;
  for (const x of [10, 20, 30]) s += dot(X(x), Y(1300 + x / 2), 5, "#1d4ed8");
  s += text(X(25), oy + 50, "Banyak air (m³)", { size: 17, weight: "bold" });
  s += `<text transform="translate(28 ${Y(1307.5)}) rotate(-90)" font-size="17" font-weight="bold" text-anchor="middle">Biaya (ribu rupiah)</text>`;
  return svg(620, 470, s);
}

// No. 24 — grafik tarif ojek
function imgOjek() {
  const ox = 90, oy = 380, ux = 70, uy = 4; // tarif = 12x + 6 (ribu)
  const X = (x: number) => ox + x * ux, Y = (y: number) => oy - y * uy;
  let s = arrowDef();
  s += line(ox, oy, X(7.4), oy, { arrow: true }) + line(ox, oy, ox, Y(92), { arrow: true });
  s += `<line x1="${X(0)}" y1="${Y(6)}" x2="${X(7)}" y2="${Y(90)}" stroke="#111" stroke-width="3"/>`;
  for (const [x, y] of [[2, 30], [4, 54], [6, 78]]) {
    s += line(X(x), Y(y), X(x), oy, { dash: true, w: 1.5 }) + line(X(x), Y(y), ox, Y(y), { dash: true, w: 1.5 }) + dot(X(x), Y(y), 6);
    s += text(X(x), oy + 24, String(x), { size: 17, weight: "bold" }) + text(ox - 10, Y(y) + 6, String(y), { size: 17, anchor: "end", weight: "bold" });
  }
  s += text(X(7.1), oy + 26, "Jarak (km)", { size: 16 }) + text(ox + 6, 22, "Tarif (ribu rupiah)", { size: 16, anchor: "start" }) + text(ox - 10, oy + 22, "0", { size: 15, anchor: "end" });
  return svg(640, 420, s);
}

// No. 27 — mercusuar
function imgMercusuar() {
  const gx = 90, gy = 300, k = 10; // 1 m = 10 px
  const top: [number, number] = [gx, gy - 20 * k];
  let s = `<rect x="0" y="${gy}" width="720" height="60" fill="#bfdbfe"/>`;
  s += `<rect x="${gx - 22}" y="${top[1]}" width="44" height="${20 * k}" fill="#fff" stroke="#111" stroke-width="2"/>`;
  for (let i = 0; i < 5; i++) s += `<rect x="${gx - 22}" y="${top[1] + 20 + i * 38}" width="44" height="16" fill="#dc2626"/>`;
  s += `<path d="M${gx - 18},${top[1]} L${gx},${top[1] - 26} L${gx + 18},${top[1]} z" fill="#facc15" stroke="#111"/>`;
  s += line(gx - 40, top[1], gx - 40, gy, { w: 1.5 }) + text(gx - 48, (top[1] + gy) / 2, "20 m", { anchor: "end", size: 17, weight: "bold" });
  const ship = (x: number) => `<path d="M${x - 22},${gy - 12} L${x + 22},${gy - 12} L${x + 14},${gy} L${x - 14},${gy} z" fill="#f59e0b" stroke="#111"/><rect x="${x - 8}" y="${gy - 26}" width="16" height="14" fill="#60a5fa" stroke="#111"/>`;
  s += ship(gx + 15 * k) + ship(gx + 48 * k);
  s += line(top[0], top[1], gx + 15 * k, gy - 6, { w: 2.5 }) + line(top[0], top[1], gx + 48 * k, gy - 6, { w: 2.5 });
  s += text(gx + 120, top[1] + 105, "25 m", { size: 17, weight: "bold", anchor: "start" }) + text(gx + 300, top[1] + 70, "52 m", { size: 17, weight: "bold" });
  s += text(gx + 15 * k, gy + 30, "Kapal 1", { size: 15 }) + text(gx + 48 * k, gy + 30, "Kapal 2", { size: 15 });
  return svg(720, 360, s);
}

// No. 29 — persegi panjang dengan seperempat lingkaran di sudut
function imgArsir() {
  const k = 13, x0 = 80, y0 = 50, W = 30 * k, H = 24 * k, rr = 7 * k, x1 = x0 + W, y1 = y0 + H;
  let s = `<path d="M${x0 + rr},${y0} L${x1 - rr},${y0} A${rr},${rr} 0 0 0 ${x1},${y0 + rr} L${x1},${y1 - rr} A${rr},${rr} 0 0 0 ${x1 - rr},${y1} L${x0 + rr},${y1} A${rr},${rr} 0 0 0 ${x0},${y1 - rr} L${x0},${y0 + rr} A${rr},${rr} 0 0 0 ${x0 + rr},${y0} z" fill="#1d4ed8"/>`;
  s += `<rect x="${x0}" y="${y0}" width="${W}" height="${H}" fill="none" stroke="#1d4ed8" stroke-width="1.5" stroke-dasharray="5 4"/>`;
  s += text(x0 + rr / 2, y0 - 10, "7 cm", { size: 15, weight: "bold" }) + text(x1 - rr / 2, y0 - 10, "7 cm", { size: 15, weight: "bold" });
  s += text(x0 - 8, y0 + rr / 2 + 5, "7 cm", { size: 15, weight: "bold", anchor: "end" }) + text(x0 - 8, y1 - rr / 2 + 5, "7 cm", { size: 15, weight: "bold", anchor: "end" });
  s += text(x0 - 8, (y0 + y1) / 2 + 5, "10 cm", { size: 15, weight: "bold", anchor: "end" }) + text(x1 + 8, (y0 + y1) / 2 + 5, "10 cm", { size: 15, weight: "bold", anchor: "start" });
  s += arrowDef() + line((x0 + x1) / 2, y1 + 30, x0, y1 + 30, { arrow: true, w: 1.5 }) + line((x0 + x1) / 2, y1 + 30, x1, y1 + 30, { arrow: true, w: 1.5 });
  s += `<rect x="${(x0 + x1) / 2 - 32}" y="${y1 + 18}" width="64" height="24" fill="#fff"/>` + text((x0 + x1) / 2, y1 + 36, "30 cm", { size: 16, weight: "bold" });
  return svg(560, 430, s);
}

// No. 30 — barisan murid
function imgBarisan() {
  const names = [
    ["Ali", "Abi", "Adi", "Aji", "Ani", "Avi", "Asti", "Ari"],
    ["Budi", "Banu", "Bedu", "Beri", "Bardi", "Beti", "Bima", "Bani"],
    ["Dedi", "Dani", "Deri", "Dian", "Dona", "Diva", "David", "Dina"],
    ["Citra", "Carli", "Celsi", "Chika", "Cilla", "Ceri", "Ciba", "Carla"],
    ["Fina", "Fani", "Fian", "Furi", "Fira", "Feni", "Feli", "Fita"],
    ["Mila", "Marco", "Messi", "Mita", "Miko", "Mona", "Meli", "Musa"],
  ];
  let s = "";
  names.forEach((row, i) =>
    row.forEach((n, j) => (s += `<rect x="${20 + j * 78}" y="${20 + i * 50}" width="68" height="36" fill="#fff" stroke="#111" stroke-width="1.5"/>` + text(54 + j * 78, 44 + i * 50, n, { size: 15 }))),
  );
  const cx = 830, cy = 170;
  s += `<path d="M${cx},${cy - 75} l-28,30 h16 v30 h-46 v-16 l-30,30 l30,30 v-16 h46 v30 h-16 l28,30 l28,-30 h-16 v-30 h46 v16 l30,-30 l-30,-30 v16 h-46 v-30 h16 z" fill="#fde047" stroke="#a16207" stroke-width="2"/>`;
  s += text(cx, cy - 86, "Depan", { weight: "bold" }) + text(cx, cy + 108, "Belakang", { weight: "bold" }) + text(cx - 108, cy + 6, "Kiri", { weight: "bold", anchor: "end" }) + text(cx + 108, cy + 6, "Kanan", { weight: "bold", anchor: "start" });
  return svg(1000, 330, s);
}

// No. 31 — puzzle segitiga (sudut dihitung agar konsisten: segitiga putih 40°, 65°, 75°)
function imgPuzzle() {
  const ox = 60, oy = 30, W = 327, H = 394, qy = 120, px = 257;
  const P = [ox + px, oy], Q = [ox, oy + qy], R = [ox + W, oy + H];
  let s = `<rect x="${ox}" y="${oy}" width="${W}" height="${H}" fill="#93c5fd" stroke="#111" stroke-width="3"/>`;
  s += `<path d="M${P[0]},${P[1]} L${Q[0]},${Q[1]} L${R[0]},${R[1]} z" fill="#fff" stroke="#111" stroke-width="3"/>`;
  s += text(P[0] + 28, P[1] + 30, "80°", { weight: "bold" }) + text(Q[0] + 30, Q[1] - 14, "65°", { weight: "bold" }) + text(Q[0] + 28, Q[1] + 30, "50°", { weight: "bold" });
  return svg(450, 460, s);
}

// No. 32 — dua segitiga sama kaki (ABE ~ DCE)
function imgSegitiga() {
  const k = 11, x0 = 50, yb = 230;
  const B = [x0, yb], C = [x0 + 32 * k, yb], E = [x0 + 48 * k, yb], A = [x0 + 24 * k, yb - 18 * k], D = [x0 + 40 * k, yb + 6 * k];
  let s = `<path d="M${B[0]},${B[1]} L${A[0]},${A[1]} L${E[0]},${E[1]} z" fill="none" stroke="#111" stroke-width="2.5"/>`;
  s += `<path d="M${C[0]},${C[1]} L${D[0]},${D[1]} L${E[0]},${E[1]}" fill="none" stroke="#111" stroke-width="2.5"/>`;
  for (const [x, y] of [[B[0] + 32, yb - 6], [E[0] - 32, yb - 6], [E[0] - 34, yb + 7], [C[0] + 32, yb + 7]]) s += dot(x, y, 5, "#2563eb");
  s += text(A[0], A[1] - 10, "A", { weight: "bold" }) + text(B[0] - 14, yb + 6, "B", { weight: "bold" }) + text(C[0] - 4, yb - 10, "C", { weight: "bold" });
  s += text(E[0] + 16, yb + 6, "E", { weight: "bold" }) + text(D[0], D[1] + 24, "D", { weight: "bold" });
  s += text((A[0] + E[0]) / 2 + 26, (A[1] + yb) / 2 - 4, "30 cm", { weight: "bold", italic: true });
  s += text((B[0] + C[0]) / 2, yb + 28, "32 cm", { weight: "bold", italic: true }) + text((C[0] + D[0]) / 2 - 12, (C[1] + D[1]) / 2 + 30, "10 cm", { weight: "bold", italic: true });
  return svg(640, 330, s);
}

// No. 34 — kotak susu
function imgKotakSusu() {
  const F1 = [60, 420], F2 = [220, 420], F3 = [220, 270], F4 = [140, 210], F5 = [60, 270], dv = [173, -100];
  const add = (p: number[]) => [p[0] + dv[0], p[1] + dv[1]];
  const B2 = add(F2), B3 = add(F3), B4 = add(F4);
  const T1 = [F4[0], F4[1] - 20], T2 = [B4[0], B4[1] - 20];
  const poly = (pts: number[][], fill: string) => `<path d="M${pts.map((p) => p.join(",")).join(" L")} z" fill="${fill}" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round"/>`;
  let s = poly([F2, B2, B3, F3], "#67e8f9") + poly([F3, B3, B4, F4], "#a5f3fc") + poly([F4, B4, T2, T1], "#5eead4");
  s += poly([F1, F2, F3, F4, F5], "#22d3ee");
  s += text(140, 330, "MILK", { size: 26, weight: "bold", fill: "#fff" });
  s += text(140, 448, "16 cm", { weight: "bold", italic: true }) + text(48, 350, "15 cm", { weight: "bold", italic: true, anchor: "end" });
  s += text(92, 228, "10 cm", { weight: "bold", italic: true, anchor: "end" }) + text(330, 398, "20 cm", { weight: "bold", italic: true, anchor: "start" });
  s += text(T2[0] + 12, T2[1] + 18, "2 cm", { weight: "bold", italic: true, anchor: "start" });
  return svg(520, 470, `<g transform="translate(50 0)">${s}</g>`);
}

// No. 36 — kue bertingkat (tabung + tabung + kerucut), 10 px = 1 cm
function imgKue() {
  const cx = 230, k = 10;
  const cyl = (rr: number, top: number, h: number, fill: string) =>
    `<path d="M${cx - rr},${top} L${cx - rr},${top + h} A${rr},${rr / 4} 0 0 0 ${cx + rr},${top + h} L${cx + rr},${top} z" fill="${fill}" stroke="#111" stroke-width="2"/><ellipse cx="${cx}" cy="${top}" rx="${rr}" ry="${rr / 4}" fill="${fill}" stroke="#111" stroke-width="2"/>`;
  const yBottomTop = 220, h1 = 5 * k * 2, h2 = 4 * k * 2, h3 = 4 * k * 2; // tinggi digambar 2× agar jelas
  let s = cyl(10 * k, yBottomTop, h1, "#fde68a") + cyl(8 * k, yBottomTop - h2, h2, "#fbcfe8");
  const apexY = yBottomTop - h2 - h3;
  s += `<path d="M${cx - 3 * k},${yBottomTop - h2} L${cx},${apexY} L${cx + 3 * k},${yBottomTop - h2} z" fill="#bbf7d0" stroke="#111" stroke-width="2"/>`;
  s += line(cx - 100, yBottomTop + h1 + 46, cx + 100, yBottomTop + h1 + 46, { dash: true, w: 1.5 }) + text(cx, yBottomTop + h1 + 70, "20 cm", { weight: "bold", italic: true });
  s += line(cx - 80, yBottomTop - 40, 40, yBottomTop - 40, { w: 1 }) + text(36, yBottomTop - 35, "d = 16 cm", { weight: "bold", italic: true, size: 16, anchor: "end" });
  s += line(cx - 15, yBottomTop - h2 - 20, 40, yBottomTop - h2 - 20, { w: 1 }) + text(36, yBottomTop - h2 - 15, "d = 6 cm", { weight: "bold", italic: true, size: 16, anchor: "end" });
  const rx = 400;
  s += arrowDef();
  const dim = (y1: number, y2: number, label: string) => line(rx, (y1 + y2) / 2, rx, y1 + 2, { arrow: true, w: 1.5 }) + line(rx, (y1 + y2) / 2, rx, y2 - 2, { arrow: true, w: 1.5 }) + text(rx + 12, (y1 + y2) / 2 + 6, label, { weight: "bold", italic: true, anchor: "start" });
  s += dim(apexY, yBottomTop - h2, "4 cm") + dim(yBottomTop - h2, yBottomTop, "4 cm") + dim(yBottomTop, yBottomTop + h1, "5 cm");
  return svg(560, 420, `<g transform="translate(90 0)">${s}</g>`);
}

// No. 38 — diagram lingkaran
function imgPie() {
  const cx = 250, cy = 210, rr = 160;
  const pt = (deg: number) => [cx + rr * Math.sin((deg * Math.PI) / 180), cy - rr * Math.cos((deg * Math.PI) / 180)];
  const sector = (a: number, b: number, fill: string) => {
    const [x1, y1] = pt(a), [x2, y2] = pt(b);
    return `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${rr},${rr} 0 ${b - a > 180 ? 1 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)} z" fill="${fill}" stroke="#fff" stroke-width="3"/>`;
  };
  let s = sector(0, 100, "#4472c4") + sector(100, 340, "#ed7d31") + sector(340, 360, "#a5a5a5");
  s += `<rect x="${cx - 32}" y="${cy + 20}" width="64" height="30" fill="#fff" stroke="#111"/>` + text(cx, cy + 42, "240°", { weight: "bold" });
  s += text(cx + 170, cy - 110, "Murid", { weight: "bold", anchor: "start" }) + text(cx + 170, cy - 88, "perempuan", { weight: "bold", anchor: "start" });
  s += text(cx - 160, cy + 170, "Murid laki-laki", { weight: "bold", anchor: "start" }) + text(cx - 30, cy - 172, "Guru", { weight: "bold" });
  return svg(560, 420, s);
}

// ---------- Soal ----------
type Row = {
  kode_subdomain: string;
  bentuk_soal: string;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d?: string;
  opsi_e?: string;
  kunci: string;
  kategori?: string;
  pembahasan: string;
  tingkat_kesulitan: string;
  level_kognitif: string;
  gambar?: string;
  bankOnly?: boolean;
};

const rows: Row[] = [
  {
    // 1
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Dalam babak final Lomba Olimpiade Matematika, setiap peserta mengerjakan 50 soal dalam waktu 120 menit dengan aturan skor berikut.

| Kriteria | Skor |
|---|---|
| Jawaban benar | 5 |
| Jawaban salah | −2 |
| Tidak menjawab (kosong) | 0 |

Hasil 4 peserta final:

| Nama peserta | Jawaban benar | Jawaban kosong |
|---|---|---|
| Candra | 41 | 3 |
| Zakki | 39 | 6 |
| Aan | 42 | 2 |
| Salwa | 40 | 4 |

Berdasarkan data tersebut, pilihlah **semua** pernyataan yang benar!`,
    opsi_a: "Aan mendapatkan skor 198.",
    opsi_b: "Skor Candra lebih tinggi daripada skor Aan.",
    opsi_c: "Selisih skor Candra dan Salwa adalah 6.",
    opsi_d: "Skor Zakki berada di bawah skor Salwa.",
    kunci: "A,D",
    pembahasan: r`Banyak jawaban salah = 50 − benar − kosong.

- Candra: salah 6 → $41 \times 5 - 6 \times 2 = 205 - 12 = 193$
- Zakki: salah 5 → $195 - 10 = 185$
- Aan: salah 6 → $210 - 12 = 198$
- Salwa: salah 6 → $200 - 12 = 188$

Pernyataan 1 benar (198). Pernyataan 2 salah (193 < 198). Pernyataan 3 salah (193 − 188 = 5). Pernyataan 4 benar (185 < 188).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 2
    kode_subdomain: "SMP-MTK-D2-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Diketahui $a = 8$, $b = -3$, dan $c = -4$. Hasil dari $4a + 3bc - \dfrac{2a}{c}$ adalah ....`,
    opsi_a: "27",
    opsi_b: "64",
    opsi_c: "72",
    opsi_d: "76",
    kunci: "C",
    pembahasan: r`$4a = 32$, $3bc = 3 \times (-3) \times (-4) = 36$, dan $\dfrac{2a}{c} = \dfrac{16}{-4} = -4$.

Jadi $4a + 3bc - \dfrac{2a}{c} = 32 + 36 - (-4) = 72$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 3
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Program Makan Bergizi Gratis (MBG) mengikuti pedoman Kementerian Kesehatan **"Isi Piringku"**: makanan pokok dan sayuran masing-masing $\frac{2}{3}$ dari setengah isi piring, sisanya untuk lauk pauk dan buah dengan bagian yang sama besar.

Kebutuhan kalori sekali makan seorang siswa SMP adalah 600 kkal dan dibagi menurut pedoman tersebut. Menu makan siang MBG di sebuah sekolah:

- nasi 150 gram (makanan pokok): 200 kkal
- ayam goreng (lauk pauk): 100 kkal
- sayuran: 180 kkal
- pisang ambon (buah): 120 kkal

Bagian menu yang **sudah memenuhi** pedoman "Isi Piringku" adalah .... (pilih semua jawaban yang benar)`,
    opsi_a: "Makanan pokok",
    opsi_b: "Sayuran",
    opsi_c: "Lauk pauk",
    opsi_d: "Buah",
    kunci: "A,C",
    pembahasan: r`Makanan pokok $= \frac{2}{3} \times \frac{1}{2} = \frac{1}{3}$ bagian → $\frac{1}{3} \times 600 = 200$ kkal. Sayuran juga $\frac{1}{3}$ bagian → 200 kkal.

Sisa $1 - \frac{2}{3} = \frac{1}{3}$ dibagi sama untuk lauk dan buah → masing-masing $\frac{1}{6} \times 600 = 100$ kkal.

Nasi 200 kkal (sesuai), ayam 100 kkal (sesuai), sayuran 180 kkal (kurang dari 200), pisang 120 kkal (lebih dari 100). Jadi yang memenuhi: makanan pokok dan lauk pauk.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 4
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Diketahui tiga bilangan 48, 60, dan 72. Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: r`Faktorisasi prima 60 adalah $2^2 \times 3 \times 5$.`,
    opsi_b: r`Faktorisasi prima 72 adalah $2^2 \times 3^2$.`,
    opsi_c: r`Salah satu faktor persekutuan ketiga bilangan itu adalah $2 \times 3$.`,
    opsi_d: r`Faktor persekutuan terbesar ketiga bilangan itu adalah $2^2 \times 3$.`,
    kunci: "A,C,D",
    pembahasan: r`$48 = 2^4 \times 3$, $60 = 2^2 \times 3 \times 5$, $72 = 2^3 \times 3^2$.

- Pernyataan 1 benar.
- Pernyataan 2 salah: $2^2 \times 3^2 = 36$, padahal $72 = 2^3 \times 3^2$.
- Pernyataan 3 benar: $6$ membagi 48, 60, dan 72.
- Pernyataan 4 benar: FPB = faktor sekutu dengan pangkat terkecil $= 2^2 \times 3 = 12$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 5
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Hasil dari $\dfrac{32^8 \times 12^7}{9^4 \times 16^{13}}$ adalah ....`,
    opsi_a: r`$1\frac{1}{3}$`,
    opsi_b: r`$1\frac{2}{3}$`,
    opsi_c: r`$-1\frac{1}{3}$`,
    opsi_d: r`$-1\frac{2}{3}$`,
    kunci: "A",
    pembahasan: r`Ubah ke bilangan pokok 2 dan 3: $32^8 = 2^{40}$, $12^7 = 2^{14} \times 3^7$, $9^4 = 3^8$, $16^{13} = 2^{52}$.

$$\frac{2^{40} \times 2^{14} \times 3^7}{3^8 \times 2^{52}} = 2^{54-52} \times 3^{7-8} = \frac{2^2}{3} = \frac{4}{3} = 1\tfrac{1}{3}$$`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 6 (bank)
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Hasil dari $\dfrac{3^0 + 3^1 + 3^2 + 3^3}{2^3 + 2^2 + 2^1 + 2^0}$ dapat ditulis sebagai pecahan campuran paling sederhana $a\frac{b}{c}$. Nilai $a + b - c$ adalah ....`,
    opsi_a: "−1",
    opsi_b: "0",
    opsi_c: "1",
    opsi_d: "2",
    kunci: "C",
    pembahasan: r`Pembilang $= 1 + 3 + 9 + 27 = 40$; penyebut $= 8 + 4 + 2 + 1 = 15$.

$\frac{40}{15} = \frac{8}{3} = 2\frac{2}{3}$, jadi $a = 2$, $b = 2$, $c = 3$ dan $a + b - c = 1$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 7
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Keliling segitiga PQR adalah $6\sqrt{32}$ cm, dengan panjang sisi $PQ = 3\sqrt{18}$ cm, $QR = 5\sqrt{8}$ cm, dan $PR = p\sqrt{q}$ cm ($q$ bilangan prima). Nilai $p + q$ adalah ....`,
    opsi_a: "5",
    opsi_b: "7",
    opsi_c: "9",
    opsi_d: "11",
    kunci: "B",
    pembahasan: r`Sederhanakan: $6\sqrt{32} = 24\sqrt{2}$, $3\sqrt{18} = 9\sqrt{2}$, $5\sqrt{8} = 10\sqrt{2}$.

$PR = 24\sqrt{2} - 9\sqrt{2} - 10\sqrt{2} = 5\sqrt{2}$, sehingga $p = 5$, $q = 2$, dan $p + q = 7$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 8
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pgk_kategori",
    pertanyaan: r`Ibu akan membuat 5 porsi Kue Q. Resep 1 porsi: tepung terigu 0,6 kg, gula pasir 0,3 kg, dan mentega 0,1 kg. Sebagian bahan sudah ada di dapur; kekurangannya dibeli di toko dalam kemasan utuh.

| Bahan | Persediaan di dapur | Ukuran kemasan di toko |
|---|---|---|
| Tepung | 0,8 kg | 1 kg/bungkus |
| Gula | 0,6 kg | 0,5 kg/bungkus |
| Mentega | 0,15 kg | 0,2 kg/bungkus |

Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Banyak tepung yang harus dibeli Ibu adalah 2 bungkus.",
    opsi_b: "Banyak gula yang harus dibeli Ibu adalah 1 bungkus.",
    opsi_c: "Banyak mentega yang harus dibeli Ibu adalah 2 bungkus.",
    kunci: "S,S,B",
    kategori: "Benar/Salah",
    pembahasan: r`Kebutuhan 5 porsi: tepung 3 kg, gula 1,5 kg, mentega 0,5 kg.

- Tepung kurang $3 - 0{,}8 = 2{,}2$ kg → perlu 3 bungkus (2 bungkus baru 2 kg). **Salah.**
- Gula kurang $1{,}5 - 0{,}6 = 0{,}9$ kg → perlu 2 bungkus (1 bungkus baru 0,5 kg). **Salah.**
- Mentega kurang $0{,}5 - 0{,}15 = 0{,}35$ kg → perlu 2 bungkus (0,4 kg). **Benar.**`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 9 (bank)
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Pada denah sebuah rumah, ruang tidur utama berbentuk persegi panjang berukuran 8,00 cm × 7,00 cm. Jika luas ruang tidur utama sebenarnya $14\text{ m}^2$, denah tersebut digambar dengan skala ....`,
    opsi_a: "1 : 40",
    opsi_b: "1 : 50",
    opsi_c: "1 : 200",
    opsi_d: "1 : 400",
    kunci: "B",
    pembahasan: r`Luas pada denah $= 8 \times 7 = 56\text{ cm}^2$. Luas sebenarnya $14\text{ m}^2 = 140.000\text{ cm}^2$.

Perbandingan luas = (skala)²: $\frac{140.000}{56} = 2.500 = 50^2$. Jadi skalanya 1 : 50 (cek: 8 cm → 4 m dan 7 cm → 3,5 m; $4 \times 3{,}5 = 14\text{ m}^2$).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 10 (bank)
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Seorang koki mencatat kebutuhan bahan untuk acara masak besar.

| Bahan | Jumlah | Harga satuan |
|---|---|---|
| Daging ayam | 15 kg | Rp32.000,00/kg |
| Beras | 25 kg | Rp15.850,00/kg |
| Minyak goreng | 8 L | Rp25.100,00/L |
| Sayuran campur | 10 pak | Rp18.750,00/pak |

Agar uang yang dibawa cukup, koki membulatkan setiap harga satuan ke ribuan terdekat. Banyak minimal lembar uang Rp100.000,00 yang harus disiapkan adalah ....`,
    opsi_a: "12 lembar",
    opsi_b: "13 lembar",
    opsi_c: "14 lembar",
    opsi_d: "15 lembar",
    kunci: "B",
    pembahasan: r`Pembulatan: ayam Rp32.000, beras Rp16.000, minyak Rp25.000, sayuran Rp19.000.

Total $= 15 \times 32.000 + 25 \times 16.000 + 8 \times 25.000 + 10 \times 19.000 = 480.000 + 400.000 + 200.000 + 190.000 = 1.270.000$.

$1.270.000 : 100.000 = 12{,}7$ → minimal 13 lembar.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 11
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Adik dan Kakak bercakap-cakap.

- Adik: "Umur saya sekarang 14 tahun."
- Kakak: "Perbandingan umur saya dan Adik enam tahun yang lalu adalah 3 : 2."

Jumlah umur Adik dan Kakak 2 tahun yang akan datang adalah ....`,
    opsi_a: "32 tahun",
    opsi_b: "34 tahun",
    opsi_c: "36 tahun",
    opsi_d: "38 tahun",
    kunci: "C",
    pembahasan: r`Enam tahun lalu umur Adik $14 - 6 = 8$ tahun. Umur Kakak saat itu $\frac{3}{2} \times 8 = 12$ tahun, jadi sekarang 18 tahun.

Dua tahun lagi: Adik 16 tahun dan Kakak 20 tahun. Jumlahnya 36 tahun.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 12 (bank)
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Dua perahu motor A dan B menempuh rute yang sama menuju garis finis. Perahu A melaju dengan kecepatan rata-rata 96 km/jam dan mencapai garis finis dalam 1 jam 10 menit. Jika perahu B melaju dengan kecepatan rata-rata 80 km/jam, waktu yang dibutuhkan perahu B untuk sampai di garis finis adalah ....`,
    opsi_a: "1 jam 12 menit",
    opsi_b: "1 jam 24 menit",
    opsi_c: "1 jam 36 menit",
    opsi_d: "1 jam 48 menit",
    kunci: "B",
    pembahasan: r`Jarak $= 96 \times 1\frac{1}{6} = 112$ km. Waktu perahu B $= \frac{112}{80} = 1{,}4$ jam $= 1$ jam 24 menit.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 13 (bank)
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Seorang peternak memiliki 10 ekor sapi dan menyediakan pakan yang cukup untuk 20 hari. Setelah 4 hari, 2 ekor sapi mati karena Penyakit Mulut dan Kuku (PMK). Jika setiap sapi makan dengan jumlah yang sama, pakan yang tersisa akan habis dalam waktu ....`,
    opsi_a: "18 hari",
    opsi_b: "20 hari",
    opsi_c: "22 hari",
    opsi_d: "24 hari",
    kunci: "B",
    pembahasan: r`Setelah 4 hari, sisa pakan cukup untuk 10 sapi selama 16 hari. Perbandingan berbalik nilai: $10 \times 16 = 8 \times t$, sehingga $t = 20$ hari.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 14
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Pak Ruli mengeluarkan modal Rp600.000,00 untuk berjualan 60 mangkuk bakso. Hari itu ia menjual 40 mangkuk dengan harga Rp12.000,00 per mangkuk. Sisanya ia jual kepada tetangganya dengan harga Rp8.000,00 per mangkuk.

Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: "Pendapatan yang diperoleh Pak Ruli sebesar Rp660.000,00.",
    opsi_b: "Pak Ruli untung sebesar Rp40.000,00.",
    opsi_c: "Persentase keuntungan Pak Ruli sebesar 6%.",
    opsi_d: "Modal untuk satu mangkuk bakso sebesar Rp10.000,00.",
    kunci: "B,D",
    pembahasan: r`Pendapatan $= 40 \times 12.000 + 20 \times 8.000 = 480.000 + 160.000 = 640.000$ (pernyataan 1 salah).

Untung $= 640.000 - 600.000 = 40.000$ (pernyataan 2 benar). Persentase untung $= \frac{40.000}{600.000} \times 100\% \approx 6{,}67\%$ (pernyataan 3 salah). Modal per mangkuk $= 600.000 : 60 = 10.000$ (pernyataan 4 benar).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 15
    kode_subdomain: "SMP-MTK-D1-S1",
    bentuk_soal: "pgk_kategori",
    pertanyaan: r`Sebuah baju berharga Rp400.000,00 ditawarkan oleh tiga toko:

- **Toko Sigma:** diskon 30%
- **Toko Delta:** diskon 20% + 10% (diskon 10% dihitung dari harga setelah diskon 20%)
- **Toko Gamma:** potongan harga Rp110.000,00

Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Harga baju setelah diskon di Toko Sigma adalah Rp220.000,00.",
    opsi_b: "Harga baju setelah diskon di Toko Delta adalah Rp288.000,00.",
    opsi_c: "Harga baju di Toko Sigma lebih murah daripada di Toko Gamma.",
    kunci: "S,B,B",
    kategori: "Benar/Salah",
    pembahasan: r`- Sigma: $400.000 - 30\% \times 400.000 = 280.000$ → pernyataan 1 **Salah**.
- Delta: $400.000 \times 0{,}8 = 320.000$, lalu $320.000 \times 0{,}9 = 288.000$ → **Benar**.
- Gamma: $400.000 - 110.000 = 290.000$. Sigma (280.000) lebih murah → **Benar**.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 16
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Perhatikan gambar timbangan berikut. Semua anak timbangan sama berat, semua apel sama berat, dan semua mangga sama berat. Pada Gambar 1 dan Gambar 2, timbangan dalam keadaan setimbang sempurna.

Banyak apel yang harus ditambahkan pada lengan B di Gambar 3 agar timbangan setimbang sempurna adalah ....`,
    opsi_a: "1 buah",
    opsi_b: "2 buah",
    opsi_c: "3 buah",
    opsi_d: "4 buah",
    kunci: "A",
    gambar: "timbangan",
    pembahasan: r`Gambar 1: 2 anak timbangan = 8 apel → 1 anak timbangan = 4 apel.
Gambar 2: 6 apel = 2 mangga → 1 mangga = 3 apel.

Gambar 3: lengan A = 3 anak timbangan = 12 apel. Lengan B = 3 mangga + 2 apel = 9 + 2 = 11 apel. Agar setimbang perlu tambahan $12 - 11 = 1$ apel.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 17 (bank)
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Diketahui $4(x + 3) - 3x = 5x + 20$. Jika $p$ adalah penyelesaian persamaan tersebut, nilai $5p - 3$ adalah ....`,
    opsi_a: "7",
    opsi_b: "17",
    opsi_c: "−13",
    opsi_d: "−23",
    kunci: "C",
    pembahasan: r`$4x + 12 - 3x = 5x + 20 \Rightarrow x + 12 = 5x + 20 \Rightarrow -4x = 8 \Rightarrow x = -2$.

Jadi $p = -2$ dan $5p - 3 = -10 - 3 = -13$.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
    bankOnly: true,
  },
  {
    // 18
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Penyelesaian pertidaksamaan $-7(x + 3) \le 28$ ditunjukkan oleh garis bilangan ....`,
    opsi_a: "Garis bilangan A",
    opsi_b: "Garis bilangan B",
    opsi_c: "Garis bilangan C",
    opsi_d: "Garis bilangan D",
    kunci: "B",
    gambar: "garis-bilangan",
    pembahasan: r`$-7(x + 3) \le 28$. Bagi kedua ruas dengan $-7$ (tanda pertidaksamaan **dibalik**): $x + 3 \ge -4$, sehingga $x \ge -7$.

Garis bilangannya: titik penuh di $-7$ dan arsiran ke kanan, yaitu garis bilangan B.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 19
    kode_subdomain: "SMP-MTK-D2-S4",
    bentuk_soal: "pgk_kategori",
    pertanyaan: r`Perhatikan pola persegi berikut. Setiap pola tersusun dari persegi satuan polos dan persegi satuan bertanda silang (X).

Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Banyak persegi satuan polos pada pola ke-7 adalah 56.",
    opsi_b: "Banyak persegi satuan polos selalu lebih banyak daripada persegi silang pada setiap pola.",
    opsi_c: "Selisih banyak persegi polos dan persegi silang pada pola ke-7 adalah 48.",
    kunci: "B,S,B",
    kategori: "Benar/Salah",
    gambar: "pola-persegi",
    pembahasan: r`Pola ke-$n$ berupa persegi $(n+1) \times (n+1)$ dengan $(n+1)$ persegi silang. Banyak persegi polos $= (n+1)^2 - (n+1) = n(n+1)$.

- Pola ke-7: polos $= 7 \times 8 = 56$ → **Benar**.
- Pola ke-1: polos 2 dan silang 2 (sama banyak) → **Salah**.
- Pola ke-7: silang 8, selisih $56 - 8 = 48$ → **Benar**.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 20
    kode_subdomain: "SMP-MTK-D2-S4",
    bentuk_soal: "pg",
    pertanyaan: r`Seorang pekerja mendapat kenaikan gaji yang besarnya tetap setiap tahun. Ia mulai bekerja pada tahun 2020 dengan gaji Rp1.800.000,00 per bulan, dan pada tahun 2026 gajinya menjadi Rp2.580.000,00 per bulan. Besar gaji per bulan pada tahun 2030 adalah ....`,
    opsi_a: "Rp2.970.000,00",
    opsi_b: "Rp3.000.000,00",
    opsi_c: "Rp3.100.000,00",
    opsi_d: "Rp3.230.000,00",
    kunci: "C",
    pembahasan: r`Dari 2020 ke 2026 terjadi 6 kali kenaikan: $b = \frac{2.580.000 - 1.800.000}{6} = 130.000$.

Tahun 2030 (4 kenaikan setelah 2026): $2.580.000 + 4 \times 130.000 = 3.100.000$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 21
    kode_subdomain: "SMP-MTK-D2-S3",
    bentuk_soal: "pgk_kategori",
    pertanyaan: r`Perhatikan tiga diagram panah dari himpunan A ke himpunan B berikut.

Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: "Diagram 1 merupakan fungsi.",
    opsi_b: "Diagram 2 merupakan fungsi.",
    opsi_c: "Diagram 3 bukan merupakan fungsi.",
    kunci: "S,B,B",
    kategori: "Benar/Salah",
    gambar: "diagram-panah",
    pembahasan: r`Fungsi: **setiap** anggota A dipasangkan dengan **tepat satu** anggota B.

- Diagram 1: 4 dipasangkan ke c dan d, dan 6 tidak punya pasangan → bukan fungsi (**Salah**).
- Diagram 2: 2, 4, 6, 8 masing-masing tepat satu pasangan → fungsi (**Benar**).
- Diagram 3: 6 tidak punya pasangan → bukan fungsi (**Benar**).`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 22
    kode_subdomain: "SMP-MTK-D2-S3",
    bentuk_soal: "pgk_kategori",
    pertanyaan: r`Grafik fungsi $f(x) = px + q$ ditunjukkan pada gambar berikut.

Tentukan **Benar** atau **Salah** setiap pernyataan berikut!`,
    opsi_a: r`Rumus fungsinya $f(x) = -2x + 3$.`,
    opsi_b: r`Nilai $p - q = -5$.`,
    opsi_c: r`Nilai $a + b = -6$.`,
    kunci: "S,S,B",
    kategori: "Benar/Salah",
    gambar: "grafik-fungsi",
    pembahasan: r`Grafik melalui $(-3, 11)$ dan $(5, -5)$: $p = \frac{-5 - 11}{5 - (-3)} = -2$. Dari $11 = -2(-3) + q$ diperoleh $q = 5$, jadi $f(x) = -2x + 5$ (pernyataan 1 **Salah**).

$p - q = -2 - 5 = -7$ (pernyataan 2 **Salah**).

$f(a) = 19 \Rightarrow -2a + 5 = 19 \Rightarrow a = -7$; $b = f(2) = 1$. Jadi $a + b = -6$ (**Benar**).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 23
    kode_subdomain: "SMP-MTK-D2-S3",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Biaya pemasangan awal sambungan air PDAM kategori A3 (luas bangunan rumah 36–70 m²) adalah Rp1.300.000,00. Grafik berikut menunjukkan total biaya bulan pertama (pemasangan awal + pemakaian air) berdasarkan banyak air yang digunakan; tarif pemakaian air per m³ tetap.

Pak Yanto memasang sambungan baru dan menghabiskan biaya Rp1.335.000,00 pada bulan pertama. Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: "Pemakaian air Pak Yanto mencapai 70 m³.",
    opsi_b: "Biaya pemakaian air Pak Yanto (tanpa biaya pemasangan) adalah Rp35.000,00.",
    opsi_c: "Jika pemakaian air 40 m³, biaya tanpa pemasangan baru adalah Rp1.320.000,00.",
    opsi_d: "Dengan pemasangan baru, biaya untuk pemakaian air paling banyak 20 m³ adalah paling besar Rp1.310.000,00.",
    kunci: "A,B,D",
    gambar: "grafik-pdam",
    pembahasan: r`Dari grafik, setiap 10 m³ menambah Rp5.000, jadi tarif pemakaian Rp500/m³: $B(x) = 1.300.000 + 500x$.

- $1.335.000 - 1.300.000 = 35.000 = 500x \Rightarrow x = 70$ m³ (pernyataan 1 dan 2 **benar**).
- 40 m³ tanpa pemasangan: $500 \times 40 = 20.000$, bukan 1.320.000 (pernyataan 3 **salah**).
- $x \le 20$: $B(x) \le 1.300.000 + 10.000 = 1.310.000$ (pernyataan 4 **benar**).`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 24
    kode_subdomain: "SMP-MTK-D2-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Grafik berikut menunjukkan tarif ojek daring berdasarkan jarak tempuh. Samsul akan berlibur ke rumah nenek yang berjarak 53 km dari rumahnya. Ia naik bus sejauh 35 km sampai terminal, lalu sisanya naik ojek daring. Jika tarif bus Rp35.000,00, total uang yang dikeluarkan Samsul untuk sampai di rumah nenek adalah ....`,
    opsi_a: "Rp216.000,00",
    opsi_b: "Rp222.000,00",
    opsi_c: "Rp251.000,00",
    opsi_d: "Rp257.000,00",
    kunci: "D",
    gambar: "grafik-ojek",
    pembahasan: r`Dari grafik, setiap 2 km tarif naik Rp24.000 → Rp12.000 per km. Dari titik $(2, 30)$: tarif $= 12x + 6$ (ribu rupiah).

Jarak ojek $= 53 - 35 = 18$ km → $12 \times 18 + 6 = 222$ ribu. Total $= 222.000 + 35.000 = 257.000$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 25
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Kantin kejujuran sebuah SMP menjual alat tulis. Harga 1 bolpen merek K sama dengan harga 2 buku merek B. Bondan membeli 2 bolpen merek K dan 3 buku merek B seharga Rp35.000,00. Monika membeli 1 bolpen merek K dan 4 buku merek B.

Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: "Harga 1 bolpen merek K adalah Rp10.000,00.",
    opsi_b: "Harga 1 buku merek B adalah Rp20.000,00.",
    opsi_c: "Harga 1 bolpen merek K dan 1 buku merek B adalah Rp15.000,00.",
    opsi_d: "Monika harus membayar Rp30.000,00.",
    kunci: "A,C,D",
    pembahasan: r`Misal harga buku $= b$, maka bolpen $= 2b$. Pembelian Bondan: $2(2b) + 3b = 7b = 35.000 \Rightarrow b = 5.000$, bolpen $= 10.000$.

- Pernyataan 1 benar; pernyataan 2 salah (buku Rp5.000).
- Bolpen + buku $= 15.000$ (benar).
- Monika: $10.000 + 4 \times 5.000 = 30.000$ (benar).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 26 (bank)
    kode_subdomain: "SMP-MTK-D2-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Diketahui sistem persamaan $\dfrac{1}{x} + \dfrac{1}{y} = 12$ dan $\dfrac{1}{x} - \dfrac{1}{y} = -2$ dengan $x, y$ bilangan real. Nilai $25x - 7y$ adalah ....`,
    opsi_a: "−2",
    opsi_b: "4",
    opsi_c: "18",
    opsi_d: "76",
    kunci: "B",
    pembahasan: r`Jumlahkan kedua persamaan: $\frac{2}{x} = 10 \Rightarrow x = \frac{1}{5}$. Kurangkan: $\frac{2}{y} = 14 \Rightarrow y = \frac{1}{7}$.

$25x - 7y = 5 - 1 = 4$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 27
    kode_subdomain: "SMP-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Dari puncak mercusuar setinggi 20 meter, jarak garis lurus ke kapal pertama 25 meter dan ke kapal kedua 52 meter, seperti pada gambar. Kaki mercusuar dan kedua kapal berada pada satu garis lurus. Jarak kedua kapal adalah ....`,
    opsi_a: "23 meter",
    opsi_b: "27 meter",
    opsi_c: "33 meter",
    opsi_d: "36 meter",
    kunci: "C",
    gambar: "mercusuar",
    pembahasan: r`Teorema Pythagoras:

- Kapal 1: $\sqrt{25^2 - 20^2} = \sqrt{225} = 15$ m dari kaki mercusuar.
- Kapal 2: $\sqrt{52^2 - 20^2} = \sqrt{2.304} = 48$ m.

Jarak kedua kapal $= 48 - 15 = 33$ m.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 28 (bank)
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Sebuah lingkaran berdiameter 14 cm memuat tiga juring: juring A dengan sudut pusat 70°, juring B dengan sudut pusat 90°, dan juring C dengan sudut pusat 35°. Pernyataan yang benar tentang panjang busur A, B, dan C adalah ....`,
    opsi_a: "Panjang busur B dua kali panjang busur C.",
    opsi_b: "Panjang busur C setengah dari panjang busur A.",
    opsi_c: "Panjang busur A tiga kali panjang busur B.",
    opsi_d: "Panjang busur B dua kali panjang busur A.",
    kunci: "B",
    pembahasan: r`Pada lingkaran yang sama, panjang busur sebanding dengan sudut pusatnya. Busur C : busur A $= 35° : 70° = 1 : 2$, jadi busur C setengah busur A.

Pilihan lain salah: $90 : 35 \ne 2 : 1$, $70 : 90 \ne 3 : 1$, $90 : 70 \ne 2 : 1$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 29
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Sebuah persegi panjang berukuran 30 cm × 24 cm. Pada keempat sudutnya dipotong seperempat lingkaran berjari-jari 7 cm sehingga terbentuk daerah yang diarsir seperti gambar. Keliling daerah yang diarsir adalah .... (gunakan $\pi = \frac{22}{7}$)`,
    opsi_a: "12 cm",
    opsi_b: "74 cm",
    opsi_c: "96 cm",
    opsi_d: "108 cm",
    kunci: "C",
    gambar: "daerah-arsir",
    pembahasan: r`Bagian lurus: sisi panjang $2 \times (30 - 14) = 32$ cm dan sisi lebar $2 \times (24 - 14) = 20$ cm.

Empat busur seperempat lingkaran = satu keliling lingkaran: $2 \times \frac{22}{7} \times 7 = 44$ cm.

Keliling $= 32 + 20 + 44 = 96$ cm.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 30
    kode_subdomain: "SMP-MTK-D3-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Beberapa murid berbaris sesuai denah nama berikut. Translasi $T\begin{pmatrix} a \\ b \end{pmatrix}$ berarti bergeser $a$ langkah ke kanan (jika $a$ negatif, ke kiri) dan $b$ langkah ke depan (jika $b$ negatif, ke belakang).

Jika posisi Fira ditranslasikan oleh $T\begin{pmatrix} -3 \\ 2 \end{pmatrix}$, posisi yang akan ditempati Fira adalah posisi ....`,
    opsi_a: "Banu",
    opsi_b: "Dedi",
    opsi_c: "Dani",
    opsi_d: "Bedu",
    kunci: "C",
    gambar: "barisan-murid",
    pembahasan: r`Fira ada di baris ke-5 kolom ke-5. Geser 3 langkah ke kiri → kolom ke-2 (Fani). Geser 2 langkah ke depan (ke atas) → baris ke-3 kolom ke-2, yaitu **Dani**.`,
    tingkat_kesulitan: "mudah",
    level_kognitif: "L1",
  },
  {
    // 31
    kode_subdomain: "SMP-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Sekar menyusun puzzle berbentuk persegi panjang dan kehilangan satu kepingan segitiga (berwarna putih) seperti gambar. Ukuran sudut yang tertulis adalah sudut antara sisi segitiga dan sisi persegi panjang.

Kepingan segitiga yang tepat untuk melengkapi puzzle tersebut memiliki sudut-sudut ....`,
    opsi_a: "40°, 65°, dan 75°",
    opsi_b: "45°, 65°, dan 70°",
    opsi_c: "50°, 60°, dan 70°",
    opsi_d: "50°, 65°, dan 65°",
    kunci: "A",
    gambar: "puzzle-segitiga",
    pembahasan: r`- Sudut segitiga di sisi kiri: $180° - 65° - 50° = 65°$.
- Segitiga siku-siku pojok kiri atas: sudutnya di sisi atas $= 90° - 65° = 25°$, sehingga sudut segitiga putih di sisi atas $= 180° - 25° - 80° = 75°$.
- Sudut ketiga $= 180° - 65° - 75° = 40°$.

Jadi sudut kepingannya 40°, 65°, dan 75°.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 32
    kode_subdomain: "SMP-MTK-D3-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Perhatikan dua segitiga sama kaki ABE dan CDE pada gambar ($AB = AE$ dan $DC = DE$). Titik B, C, dan E segaris. Sudut-sudut yang bertanda sama besar, sehingga kedua segitiga sebangun.

Luas gabungan kedua segitiga tersebut adalah ....`,
    opsi_a: r`$432\text{ cm}^2$`,
    opsi_b: r`$456\text{ cm}^2$`,
    opsi_c: r`$464\text{ cm}^2$`,
    opsi_d: r`$480\text{ cm}^2$`,
    kunci: "D",
    gambar: "segitiga-sebangun",
    pembahasan: r`Perbandingan kaki: $AE : DE = 30 : 10 = 3 : 1$, sehingga $BE = 3 \times CE$. Karena $BE = 32 + CE$: $3CE = 32 + CE \Rightarrow CE = 16$ cm dan $BE = 48$ cm.

- Segitiga ABE: alas 48, tinggi $\sqrt{30^2 - 24^2} = 18$ → luas $\frac{1}{2} \times 48 \times 18 = 432\text{ cm}^2$.
- Segitiga CDE: alas 16, tinggi $\sqrt{10^2 - 8^2} = 6$ → luas $48\text{ cm}^2$.

Luas gabungan $= 432 + 48 = 480\text{ cm}^2$.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 33 (bank)
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Sebuah bak mandi berbentuk balok berukuran 24 dm × 10 dm × 10 dm berisi penuh air. Seluruh airnya dibagi ke dua wadah berbentuk balok: wadah pertama beralas 15 dm × 12 dm dan tinggi 15 dm, wadah kedua beralas 6 dm × 10 dm dan tinggi 18 dm. Jika tinggi air di kedua wadah sama, tinggi air tersebut adalah ....`,
    opsi_a: "10 dm",
    opsi_b: "12 dm",
    opsi_c: "15 dm",
    opsi_d: "18 dm",
    kunci: "A",
    pembahasan: r`Volume air $= 24 \times 10 \times 10 = 2.400\text{ dm}^3$. Luas alas kedua wadah $= 15 \times 12 + 6 \times 10 = 240\text{ dm}^2$.

$240t = 2.400 \Rightarrow t = 10$ dm (masih di bawah tinggi kedua wadah).`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 34
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Andre membelikan adiknya sekotak susu dengan bentuk dan ukuran seperti gambar: bagian bawah berbentuk balok 20 cm × 16 cm × 15 cm, bagian atas berbentuk atap prisma segitiga dengan sisi miring 10 cm, dan di puncaknya terdapat lipatan (sirip) setinggi 2 cm sepanjang kotak. Luas permukaan wadah kotak susu tersebut (termasuk kedua sisi sirip) adalah ....`,
    opsi_a: r`$1.976\text{ cm}^2$`,
    opsi_b: r`$1.982\text{ cm}^2$`,
    opsi_c: r`$1.990\text{ cm}^2$`,
    opsi_d: r`$1.996\text{ cm}^2$`,
    kunci: "A",
    gambar: "kotak-susu",
    pembahasan: r`- Alas: $20 \times 16 = 320$
- Empat dinding: $2(20 \times 15) + 2(16 \times 15) = 1.080$
- Dua segitiga atap: alas 16, sisi miring 10 → tinggi $\sqrt{10^2 - 8^2} = 6$ → $2 \times \frac{1}{2} \times 16 \times 6 = 96$
- Dua persegi panjang atap: $2 \times 20 \times 10 = 400$
- Sirip (dua sisi): $2 \times 20 \times 2 = 80$

Total $= 320 + 1.080 + 96 + 400 + 80 = 1.976\text{ cm}^2$.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 35 (bank)
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Sebuah tandon air berbentuk tabung dengan diameter 1,4 meter dan tinggi 1,6 meter berisi air setinggi $\frac{5}{8}$ dari tingginya. Volume air di dalam tandon tersebut adalah .... (gunakan $\pi = \frac{22}{7}$)`,
    opsi_a: "1.540 liter",
    opsi_b: "1.450 liter",
    opsi_c: "1.640 liter",
    opsi_d: "1.460 liter",
    kunci: "A",
    pembahasan: r`Tinggi air $= \frac{5}{8} \times 1{,}6 = 1$ m dan jari-jari $= 0{,}7$ m.

$V = \frac{22}{7} \times 0{,}7^2 \times 1 = 1{,}54\text{ m}^3 = 1.540$ liter.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
    bankOnly: true,
  },
  {
    // 36
    kode_subdomain: "SMP-MTK-D3-S3",
    bentuk_soal: "pg",
    pertanyaan: r`Sebuah hiasan kue tersusun dari tabung bawah (diameter 20 cm, tinggi 5 cm), tabung atas (diameter 16 cm, tinggi 4 cm), dan kerucut di puncak (diameter 6 cm, tinggi 4 cm) seperti gambar. Luas permukaan bangun tersebut (termasuk alasnya) adalah ....`,
    opsi_a: r`$300\pi\text{ cm}^2$`,
    opsi_b: r`$350\pi\text{ cm}^2$`,
    opsi_c: r`$370\pi\text{ cm}^2$`,
    opsi_d: r`$390\pi\text{ cm}^2$`,
    kunci: "C",
    gambar: "kue-bertingkat",
    pembahasan: r`Bagian tutup yang terlihat dari atas jika dijumlahkan sama dengan luas lingkaran terbesar.

- Alas + seluruh bagian atas yang terlihat: $2 \times \pi \times 10^2 - \pi \times 3^2 = 191\pi$ (alas kerucut tertutup, diganti selimut kerucut)
- Selimut tabung bawah: $2\pi \times 10 \times 5 = 100\pi$
- Selimut tabung atas: $2\pi \times 8 \times 4 = 64\pi$
- Selimut kerucut: garis pelukis $\sqrt{3^2 + 4^2} = 5$ → $\pi \times 3 \times 5 = 15\pi$

Total $= 191\pi + 100\pi + 64\pi + 15\pi = 370\pi\text{ cm}^2$.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 37
    kode_subdomain: "SMP-MTK-D4-S1",
    bentuk_soal: "pgk_mcma",
    pertanyaan: r`Ana ingin melanjutkan ke SMA Negeri di Kota Yogyakarta pada tahun 2027 melalui jalur prestasi. Ia mengumpulkan data passing grade (nilai gabungan terendah yang diterima) jalur prestasi tiga tahun terakhir.

| Sekolah | 2024 | 2025 | 2026 |
|---|---|---|---|
| SMAN 1 | 363,6 | 351,2 | 343,7 |
| SMAN 2 | 334,8 | 322,1 | 318,6 |
| SMAN 3 | 372,9 | 372,8 | 340,2 |
| SMAN 4 | 275,6 | 270,8 | 271,5 |
| SMAN 6 | 346,2 | 356,9 | 335,7 |
| SMAN 7 | 328,1 | 332,3 | 328,6 |
| SMAN 8 | 361,8 | 362,7 | 347,8 |
| SMAN 9 | 311,9 | 351,0 | 314,2 |

Sebuah pilihan sekolah dianggap **aman** jika nilai gabungan Ana tidak kurang dari passing grade tertinggi sekolah itu selama tiga tahun terakhir. Pilihlah **semua** pernyataan yang benar!`,
    opsi_a: "Agar aman masuk SMAN 1, nilai gabungan Ana cukup minimal 360.",
    opsi_b: "Jika nilai gabungan Ana kurang dari 360, Ana masih mungkin diterima di SMA Negeri selain SMAN 1.",
    opsi_c: "Nilai gabungan 375 sudah aman untuk memilih SMA Negeri mana pun dalam tabel.",
    opsi_d: "Dengan nilai gabungan 350, pilihan aman Ana hanya SMAN 2, 4, 7, dan 9.",
    kunci: "B,C",
    pembahasan: r`Passing grade tertinggi tiap sekolah: SMAN 1 = 363,6; SMAN 2 = 334,8; SMAN 3 = 372,9; SMAN 4 = 275,6; SMAN 6 = 356,9; SMAN 7 = 332,3; SMAN 8 = 362,7; SMAN 9 = 351,0.

- Pernyataan 1 salah: aman masuk SMAN 1 perlu minimal 363,6.
- Pernyataan 2 benar: banyak sekolah ber-passing grade di bawah 360 (mis. SMAN 2, 4, 7).
- Pernyataan 3 benar: 375 > 372,9 (tertinggi).
- Pernyataan 4 salah: SMAN 9 pernah 351,0 > 350, jadi pilihan aman hanya SMAN 2, 4, dan 7.`,
    tingkat_kesulitan: "sulit",
    level_kognitif: "L3",
  },
  {
    // 38
    kode_subdomain: "SMP-MTK-D4-S1",
    bentuk_soal: "pg",
    pertanyaan: r`Diagram lingkaran berikut menunjukkan banyak murid dan guru di sebuah sekolah. Jika banyak murid perempuan lima kali banyak guru, besar sudut yang menyatakan banyak guru adalah ....`,
    opsi_a: "20°",
    opsi_b: "24°",
    opsi_c: "40°",
    opsi_d: "48°",
    kunci: "A",
    gambar: "diagram-lingkaran",
    pembahasan: r`Sudut murid perempuan + guru $= 360° - 240° = 120°$. Karena murid perempuan = 5 × guru, maka $6 \times \text{guru} = 120°$, sehingga sudut guru $= 20°$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 39
    kode_subdomain: "SMP-MTK-D4-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Sebuah paket berisi 30 kotak misteri. Setiap kotak berisi satu figur karakter: 12 kotak berisi kapibara dan 18 kotak berisi kelinci.

Ami mengambil 3 kotak secara acak tanpa pengembalian dan mendapat 1 kapibara dan 2 kelinci. Kemudian Shinta mengambil 2 kotak secara acak tanpa pengembalian dan keduanya kapibara. Jika Andre mengambil 1 kotak, peluang Andre mendapatkan kelinci adalah ....`,
    opsi_a: r`$\frac{8}{15}$`,
    opsi_b: r`$\frac{9}{15}$`,
    opsi_c: r`$\frac{9}{25}$`,
    opsi_d: r`$\frac{16}{25}$`,
    kunci: "D",
    pembahasan: r`Setelah Ami: kapibara 11, kelinci 16 (27 kotak). Setelah Shinta: kapibara 9, kelinci 16 (25 kotak).

Peluang Andre mendapat kelinci $= \frac{16}{25}$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
  {
    // 40
    kode_subdomain: "SMP-MTK-D4-S2",
    bentuk_soal: "pg",
    pertanyaan: r`Bibit kangkung hidroponik membutuhkan waktu semai 14 hari sebelum siap dipindahkan ke instalasi utama. Pak Ali mendata bibit di rak semai berdasarkan usianya saat ini.

| Usia semai saat ini | Jumlah netpot |
|---|---|
| 3 hari | 45 |
| 6 hari | 60 |
| 8 hari | 55 |
| 10 hari | 40 |

Pak Ali mengambil satu netpot secara acak untuk diperiksa. Peluang terambilnya bibit yang akan siap dipindahkan paling lambat 5 hari ke depan adalah ....`,
    opsi_a: "0,200",
    opsi_b: "0,275",
    opsi_c: "0,475",
    opsi_d: "0,525",
    kunci: "A",
    pembahasan: r`Siap paling lambat 5 hari lagi berarti usia sekarang minimal $14 - 5 = 9$ hari, yaitu hanya kelompok 10 hari (40 netpot). Bibit 8 hari masih butuh 6 hari.

Total netpot $= 45 + 60 + 55 + 40 = 200$. Peluang $= \frac{40}{200} = 0{,}200$.`,
    tingkat_kesulitan: "sedang",
    level_kognitif: "L2",
  },
];

export default {
  title: "TKA SMP Matematika — Paket 3",
  description: "30 soal: bilangan, aljabar & fungsi, geometri & pengukuran, serta data & peluang dalam konteks sehari-hari, dilengkapi grafik dan gambar.",
  jenjang: "SMP",
  subjectCode: "SMP-MTK",
  durationMinutes: 75,
  isPremium: true,
  isFullSimulation: true,
  createdByEmail: "kpbgalimka@gmail.com",
  stimuli: [],
  rows,
  images: {
    timbangan: { title: "Timbangan apel dan mangga", svg: imgTimbangan },
    "garis-bilangan": { title: "Garis bilangan A-D", svg: imgGarisBilangan },
    "pola-persegi": { title: "Pola persegi silang", svg: imgPola },
    "diagram-panah": { title: "Tiga diagram panah", svg: imgDiagramPanah },
    "grafik-fungsi": { title: "Grafik fungsi linear f(x)=px+q", svg: imgFungsiLinear() },
    "grafik-pdam": { title: "Grafik biaya PDAM", svg: imgPdam() },
    "grafik-ojek": { title: "Grafik tarif ojek daring", svg: imgOjek() },
    mercusuar: { title: "Mercusuar dan dua kapal", svg: imgMercusuar() },
    "daerah-arsir": { title: "Persegi panjang dengan seperempat lingkaran", svg: imgArsir() },
    "barisan-murid": { title: "Denah barisan murid", svg: imgBarisan() },
    "puzzle-segitiga": { title: "Puzzle segitiga hilang", svg: imgPuzzle() },
    "segitiga-sebangun": { title: "Dua segitiga sama kaki sebangun", svg: imgSegitiga() },
    "kotak-susu": { title: "Kotak susu", svg: imgKotakSusu() },
    "kue-bertingkat": { title: "Kue bertingkat tabung dan kerucut", svg: imgKue() },
    "diagram-lingkaran": { title: "Diagram lingkaran murid dan guru", svg: imgPie() },
  },
};
