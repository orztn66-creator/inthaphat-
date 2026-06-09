/**
 * IntaphatEngine.js
 * ============================================================
 * คัมภีร์อินทภาษบาทจันทร์ — Calculation Engine
 * อ้างอิง: ตำราอินทภาษบาทจันทร์ โดย หลวงวุฒิรณพัสดุ์
 *
 * สูตรทั้งหมดแสดงในรูปแคลคูลัส:
 *   f(x), limit, ln, log, integral เป็นต้น
 *   เพื่อความชัดเจนทางคณิตศาสตร์และการอ้างอิงสคริปต์
 *
 * การใช้งาน:
 *   const engine = new IntaphatEngine('./inthaphat_reference.json');
 *   await engine.init();
 *   const result = engine.calcAll({ ... });
 * ============================================================
 */

class IntaphatEngine {

  constructor(jsonPath = './inthaphat_reference.json') {
    this.jsonPath = jsonPath;
    this.ref = null;         // reference JSON loaded here
    this.ready = false;
  }

  // ── Init ────────────────────────────────────────────────────
  async init() {
    try {
      const res = await fetch(this.jsonPath);
      this.ref = await res.json();
      this.ready = true;
      console.log('[IntaphatEngine] Reference loaded:', this.ref.meta.title);
    } catch (e) {
      console.error('[IntaphatEngine] Cannot load reference JSON:', e);
    }
    return this;
  }

  /** Guard: ใช้ก่อนทุก public method */
  _guard() {
    if (!this.ready) throw new Error('[IntaphatEngine] Call init() first.');
  }

  // ════════════════════════════════════════════════════════════
  //  §1  ฟังก์ชันยูทิลิตี้พื้นฐาน
  // ════════════════════════════════════════════════════════════

  /**
   * แปลง ราศี-องศา-ลิบดา → ลิบดารวม
   * f_L(r, d, l) = r·1800 + d·60 + l
   */
  toLibda(rasi = 0, ongsa = 0, libda = 0) {
    return rasi * 1800 + ongsa * 60 + libda;
  }

  /**
   * แปลง ลิบดารวม → { rasi, ongsa, libda }
   * Inverse of toLibda — แบบ division algorithm
   * r = ⌊L / 1800⌋,  d = ⌊(L mod 1800) / 60⌋,  l = L mod 60
   */
  fromLibda(L) {
    L = ((L % 21600) + 21600) % 21600; // wrap [0, 21600)
    const rasi  = Math.floor(L / 1800);
    const ongsa = Math.floor((L % 1800) / 60);
    const libda = L % 60;
    return { rasi, ongsa, libda };
  }

  /**
   * บวก 2 ตำแหน่งทางดาราศาสตร์ (ราศี,องศา,ลิบดา)
   * addPos(a, b) = fromLibda( toLibda(a) + toLibda(b) )
   */
  addPos(a, b) {
    return this.fromLibda(this.toLibda(a.rasi, a.ongsa, a.libda)
                        + this.toLibda(b.rasi, b.ongsa, b.libda));
  }

  /**
   * ลบ 2 ตำแหน่งทางดาราศาสตร์
   * subPos(a, b) = fromLibda( toLibda(a) - toLibda(b) )
   */
  subPos(a, b) {
    return this.fromLibda(this.toLibda(a.rasi, a.ongsa, a.libda)
                        - this.toLibda(b.rasi, b.ongsa, b.libda));
  }

  /** แปลง นาที (0–59) เป็น ลิบดาทศนิยม */
  nathiToLibdaFraction(nathi) { return nathi / 60; }

  /**
   * Mod ที่ให้ผล [1, m] แทน [0, m-1]  (สำหรับฤกษ์ / ราศี 1-based)
   * mod1(n, m) = ((n-1) mod m) + 1
   */
  mod1(n, m) { return ((n - 1) % m + m) % m + 1; }

  // ════════════════════════════════════════════════════════════
  //  §2  สมผุส (Samphot) — แก้ไขตำแหน่งดาวเคราะห์
  // ════════════════════════════════════════════════════════════

  /**
   * คำนวณสมผุสอาทิตย์/จันทร์โดยอันตรา (Interpolation)
   *
   * สูตรแบบแคลคูลัส (Linear Interpolation / ลิมิต):
   *
   *   f(t) = P_before + [ (P_after - P_before) / Δt_day ] · Δt_birth
   *
   * ซึ่งเทียบเท่า limit ของ finite difference:
   *   lim_{Δt→0} [ΔP / Δt]  ≈  dP/dt  (อัตราเคลื่อนที่ต่อวัน)
   *
   * @param {Object} pBefore   { rasi, ongsa, libda } สมผุสก่อนวันเกิด
   * @param {Object} pAfter    { rasi, ongsa, libda } สมผุสหลังวันเกิด
   * @param {number} birthTimeNathi  เวลาเกิด หน่วยนาที (0–1439)
   * @param {boolean} bornBefore2Yam  เกิดก่อน ๒ ยาม (06:00–18:00) = true
   * @returns {Object} { rasi, ongsa, libda }
   */
  calcSamphot(pBefore, pAfter, birthTimeNathi, bornBefore2Yam = true) {
    this._guard();

    // Δ ระหว่างสมผุส 2 วัน (1 วัน = 1440 นาที)
    const delta_L  = this.toLibda(pAfter.rasi, pAfter.ongsa, pAfter.libda)
                   - this.toLibda(pBefore.rasi, pBefore.ongsa, pBefore.libda);

    // ฐานตั้ง: เกิดก่อน ๒ ยาม → ใช้สมผุสวันเกิด, ตรงกันข้ามใช้วันหลัง
    const base_L = bornBefore2Yam
      ? this.toLibda(pBefore.rasi, pBefore.ongsa, pBefore.libda)
      : this.toLibda(pAfter.rasi, pAfter.ongsa, pAfter.libda);

    // อินเตอร์โพเลต:  correction = delta_L * (birthTimeNathi / 1440)
    // ≡ ∫₀^t  (dP/dt) dt  ≈  delta_L · t/T
    const correction_L = (delta_L * birthTimeNathi) / 1440;

    return this.fromLibda(Math.round(base_L + correction_L));
  }

  // ════════════════════════════════════════════════════════════
  //  §3  ฤกษ์ (Nakhat) จากสมผุส
  // ════════════════════════════════════════════════════════════

  /**
   * คำนวณฤกษ์จากสมผุส
   *
   * สูตร: n(L) = ⌊ L / 800 ⌋ + 1         (ฤกษ์ 1–27)
   *   เศษ: rem = L mod 800
   *   นาทีฤกษ์: m(L) = ⌊ rem · 60 / 800 ⌋
   *   วินาทีฤกษ์: s(L) = ⌊ (rem·60 mod 800) · 60 / 800 ⌋
   *
   * @param {Object} pos  { rasi, ongsa, libda }
   * @returns {Object} { nakhat, nathi, winadee, name }
   */
  calcNakhat(pos) {
    this._guard();
    const L    = this.toLibda(pos.rasi, pos.ongsa, pos.libda);
    const nIdx = Math.floor(L / 800);          // 0-based index
    const rem  = L % 800;
    const nathi    = Math.floor(rem * 60 / 800);
    const winadee  = Math.floor((rem * 60 % 800) * 60 / 800);
    const nakhat   = (nIdx % 27) + 1;          // 1–27 circular
    const name     = this.ref.helpers.nakhat_names[nakhat - 1] || '';
    return { nakhat, nathi, winadee, name };
  }

  // ════════════════════════════════════════════════════════════
  //  §4  ฤกษ์ศักราช (Sakrat)
  // ════════════════════════════════════════════════════════════

  /**
   * คำนวณฤกษ์ศักราช 4 ฐาน
   *
   * f_sk(S, R_a, D_a) → { base1, base2, base3, base4 }
   *
   * ขั้นตอน:
   *   base1 = ⌊ S / 108 ⌋
   *   r₁    = S mod 108
   *   base2 = ⌊ r₁ / 4 ⌋
   *   r₂    = r₁ mod 4   (≡ เศษ 0–3 เป็น ปาด)
   *   base3 = R_a         (ราศีสมผุสอาทิตย์)
   *   base4 = D_a         (องศาสมผุสอาทิตย์)
   *
   * @param {number} sakrat  ศักราชจุดศักราชกำเนิด
   * @param {number} rasiAathit   ราศีสมผุสอาทิตย์
   * @param {number} ongsaAathit  องศาสมผุสอาทิตย์
   */
  calcSakrat(sakrat, rasiAathit, ongsaAathit) {
    this._guard();
    const base1 = Math.floor(sakrat / 108);
    const r1    = sakrat % 108;
    const base2 = Math.floor(r1 / 4);
    const r2    = r1 % 4;       // ปาด (ผลเหลือ 0–3)
    return {
      base1,        // ฤกษ์ (1–27)
      base2: r2,    // ปาด (0–3)
      base3: rasiAathit,
      base4: ongsaAathit,
      _note: 'base1=ปี(ฤกษ์), base2=ปาด, base3=ราศี, base4=องศา'
    };
  }

  // ════════════════════════════════════════════════════════════
  //  §5  ฤกษ์จันทร์กาดชำระ (Jan Kaad Sara)
  // ════════════════════════════════════════════════════════════

  /**
   * คำนวณฤกษ์จันทร์กาดชำระ
   *
   * g(N_j, M_j) → { nakhat, nathi_pad, ongsa_rem }
   *
   * สูตร:
   *   q₁ = ⌊ N_j / 15 ⌋,   r₁ = N_j mod 15
   *   q₂ = ⌊ (r₁ · 24) / 30 ⌋,  r₂ = (r₁ · 24) mod 30
   *
   *   → ฤกษ์จันทร์กาดชำระ = { nakhat: q₁, nathi: q₂, libda_rem: r₂ }
   *
   * @param {number} nakhatJan  ฤกษ์จันทร์ (นาทีฤกษ์จันทร์ดิบ)
   */
  calcJanKaadSara(nakhatJan) {
    this._guard();
    const q1 = Math.floor(nakhatJan / 15);
    const r1 = nakhatJan % 15;
    const q2 = Math.floor((r1 * 24) / 30);
    const r2 = (r1 * 24) % 30;
    return { nakhat: q1, pad: q2, rem: r2 };
  }

  // ════════════════════════════════════════════════════════════
  //  §6  หลักปัฏฐนนิ / อินทภาษ / บาทจันทร์ (4-Base Pillar)
  // ════════════════════════════════════════════════════════════

  /**
   * คำนวณหลัก 4 ฐาน (ปัฏฐนนิ / อินทภาษ / บาทจันทร์)
   *
   * h(S, J) = carry_add(S, J)  with modular carry:
   *
   *   base4' = S.base4 + J.rem
   *   carry3 = ⌊ base4' / 30 ⌋,   base4 = base4' mod 30
   *
   *   base3' = S.base3 + J.nakhat + carry3
   *   carry2 = ⌊ base3' / 12 ⌋,   base3 = base3' mod 12
   *
   *   base2' = S.base2 + J.pad + carry2
   *   carry1 = ⌊ base2' / 4 ⌋,    base2 = base2' mod 4
   *
   *   base1  = S.base1 + carry1
   *   (base1 mod 27, ≥1)
   *
   * @param {Object} sakrat   { base1, base2, base3, base4 }
   * @param {Object} janKS    { nakhat, pad, rem }
   * @returns {Object} { base1, base2, base3, base4 }
   */
  calcPatjom(sakrat, janKS) {
    this._guard();
    let b4 = sakrat.base4 + janKS.rem;
    let c3 = Math.floor(b4 / 30); b4 = b4 % 30;

    let b3 = sakrat.base3 + janKS.nakhat + c3;
    let c2 = Math.floor(b3 / 12); b3 = b3 % 12;

    let b2 = sakrat.base2 + janKS.pad + c2;
    let c1 = Math.floor(b2 / 4);  b2 = b2 % 4;

    let b1 = sakrat.base1 + c1;
    b1 = this.mod1(b1, 27);  // wrap 1–27

    return { base1: b1, base2: b2, base3: b3, base4: b4 };
  }

  /**
   * calcIntaphat — เหมือน calcPatjom แต่ใช้ฤกษ์ศักราช + จันทร์กาดชำระ
   * (API เดียวกัน แยกชื่อเพื่อความชัดเจน)
   */
  calcIntaphat(sakrat, janKS) { return this.calcPatjom(sakrat, janKS); }

  /**
   * calcBatjan — คำนวณหลักบาทจันทร์
   * ใช้หลักจันทร์กาดชำระ (ฐาน ๒ เดิม) + ฤกษ์ศักราช
   * วิธีเดียวกับ calcIntaphat
   */
  calcBatjan(sakrat, janKS) { return this.calcPatjom(sakrat, janKS); }

  // ════════════════════════════════════════════════════════════
  //  §7  ฌาตมฤตยู 6 แห่ง (Matayud)
  // ════════════════════════════════════════════════════════════

  /**
   * คำนวณฌาตมฤตยู 6 แห่ง
   *
   * ฟังก์ชันจุดอันตราย M_k(n):
   *
   *   M₁ = n               (ปฐมมฤตยู — ฤกษ์ฐาน ๑ ของหลัก)
   *   M₂ = (M₁ + n - 1) mod 27 + 1   (กาดมฤตยู = M₁ + n)
   *   M₃ = (M₂ · 4 - 1) mod 27 + 1   (วิถมฤตยู = M₂ × 4)
   *   M₄ = (n · 4 - 1) mod 27 + 1     (ปฐมมฤตยู ชุด ๒)
   *   M₅ = (M₄ - n - 1 + 27) mod 27 + 1  (กาดมฤตยู ชุด ๒)
   *   M₆ = (M₅ · 4 - 1) mod 27 + 1   (วิถมฤตยู ชุด ๒)
   *
   * ทั้งหมดอยู่ในช่วง [1, 27] (circular mod 1-based)
   *
   * @param {number} nakhatBase1  ฤกษ์ฐาน ๑ (1–27)
   * @returns {Object} { M1..M6, names[] }
   */
  calcMatayud(nakhatBase1) {
    this._guard();
    const n  = nakhatBase1;
    const m1 = this.mod1(n, 27);
    const m2 = this.mod1(m1 + n, 27);
    const m3 = this.mod1(m2 * 4, 27);
    const m4 = this.mod1(n * 4, 27);
    const m5 = this.mod1(m4 - n + 27, 27);
    const m6 = this.mod1(m5 * 4, 27);
    const names = this.ref.helpers.nakhat_names;
    return {
      M1: m1, M1_name: names[m1-1],   // ปฐมมฤตยู
      M2: m2, M2_name: names[m2-1],   // กาดมฤตยู
      M3: m3, M3_name: names[m3-1],   // วิถมฤตยู
      M4: m4, M4_name: names[m4-1],   // ปฐมมฤตยู (ชุด 2)
      M5: m5, M5_name: names[m5-1],   // กาดมฤตยู (ชุด 2)
      M6: m6, M6_name: names[m6-1],   // วิถมฤตยู (ชุด 2)
      labels: this.ref.helpers.matayud_6_fields
    };
  }

  // ════════════════════════════════════════════════════════════
  //  §8  อุจวิเศษ (Uj Wisset) — Special Exaltation Point
  // ════════════════════════════════════════════════════════════

  /**
   * §8a  กัมมัจจุพล (Gammatjuphol)
   *
   * G(S, K, T) = (S · 800 + K) + ⌊ T · 4 / 8 ⌋
   *   + { 1 if (T·4 mod 8) ≥ 4 }   ← อาชาญิกรรมแก้ไข
   *
   * @param {number} suthin        สูทิน (จำนวนวัน)
   * @param {number} kamBirthNak   กัมมัจจุพลฤกษ์เกิด (ฤกษ์กำเนิด นาที 0–59)
   * @param {number} birthNathi    เวลาเกิด (นาที 0–59 ของเวลา)
   */
  calcGammatjuphol(suthin, kamBirthNak, birthNathi) {
    this._guard();
    const base = suthin * 800 + kamBirthNak;
    const frac_raw = birthNathi * 4;
    const correction = Math.floor(frac_raw / 8) + (frac_raw % 8 >= 4 ? 1 : 0);
    return base + correction;
  }

  /**
   * §8b  มัชยมอาทิตย์ (Matjayom Aathit)
   *
   * A(G) = ⌊ G / 146150 ⌋   → ราศี
   *   r₁  = G mod 146150
   *   ⌊ r₁ / 730 ⌋            → องศา
   *   r₂  = r₁ mod 730
   *   ⌊ r₂ / 24 ⌋             → ดิบตา (ลิบดา)
   *   r₃  = r₂ mod 24
   *   if (r₃ · 2 ≥ 24) → ดิบตา + 1   ← อาชาญิกรรม
   *
   * ที่มา: อาทิตย์โคจรครบรอบ 21600 ลิบดา ใน 365.25 วัน
   *   = 146100 ÷ 21600 ≈ ใช้ 146150 ตามตำรา
   *
   * @param {number} G  กัมมัจจุพล
   */
  calcMatjayomAathit(G) {
    this._guard();
    const rasi  = Math.floor(G / 146150);
    const r1    = G % 146150;
    const ongsa = Math.floor(r1 / 730);
    const r2    = r1 % 730;
    let   libda = Math.floor(r2 / 24);
    const r3    = r2 % 24;
    if (r3 * 2 >= 24) libda += 1;   // อาชาญิกรรม
    return this.fromLibda(this.toLibda(rasi % 12, ongsa % 30, libda % 60));
  }

  /**
   * §8c  อวมานกำเนิด (Awaman)
   *
   * W(S, K, T) = [ (S·11 + K) + ⌊ T·11 / 25040 ⌋ ] mod 692
   *
   * หมายเหตุ: 25040 = 692 × ค่าคงที่อวมาน, เศษเป็นอวมาน
   *
   * @param {number} suthin
   * @param {number} awamBirthNak  อวมานฤกษ์เกิด
   * @param {number} birthNathi    เวลาเกิด (นาที 0–1439)
   */
  calcAwaman(suthin, awamBirthNak, birthNathi) {
    this._guard();
    const raw = suthin * 11 + awamBirthNak + Math.floor(birthNathi * 11 / 25040);
    return raw % 692;
  }

  /**
   * §8d  ติตกำเนิด (Tit Kamnerd)
   *
   * T(S, K, W) = ⌊ (S + K + W) / 30 ⌋
   *   + { 1 if born_before_2yam AND time ≥ 06:00 }
   *
   * เกิดตั้งแต่ ๒ ยามไปแล้วไม่ต้องเพิ่ม
   */
  calcTitKamnerd(suthin, gamKamNak, awaman, bornBefore2Yam = false) {
    this._guard();
    const base = Math.floor((suthin + gamKamNak + awaman) / 30);
    return bornBefore2Yam ? base + 1 : base;
  }

  /**
   * §8e  มัชยมจันทร์ (Matjayom Jan)
   *
   * J(W, T, A) = fromLibda( J_raw )  where:
   *
   *   J_raw = ⌊ (W + T) / 25 ⌋ · C_j  +  ⌊ birthNathi · C_j / 1440 ⌋
   *         + toLibda(A)
   *
   *   C_j = จันทร์โคจรต่อวัน ≈ 790.56 ลิบดา ≈ ใช้ 790 ตามตำรา
   *
   * สูตรนี้คือ ∫ (ดาวจันทร์เคลื่อน) dt  ≈ C_j · Δt
   *
   * @param {number} awaman
   * @param {number} tit
   * @param {Object} matjayomAathit  { rasi, ongsa, libda }
   * @param {number} birthNathi  เวลาเกิด (นาที 0–1439)
   */
  calcMatjayomJan(awaman, tit, matjayomAathit, birthNathi = 0) {
    this._guard();
    const C_j       = 790;    // จันทร์โคจรต่อวัน (ลิบดา ≈ ตามตำรา)
    const dayUnits  = Math.floor((awaman + tit) / 25);
    const timeCorr  = Math.floor(birthNathi * C_j / 1440);
    const aathit_L  = this.toLibda(matjayomAathit.rasi, matjayomAathit.ongsa, matjayomAathit.libda);
    const jan_raw   = dayUnits * C_j + timeCorr + aathit_L;

    // ทอนขึ้นองศา: ถ้าเกิน 40 ดิบตา ทอนขึ้น (ตามตำรา)
    let pos = this.fromLibda(jan_raw);
    if (pos.libda >= 40) { pos = this.fromLibda(jan_raw + (60 - pos.libda)); }
    return pos;
  }

  /**
   * §8f  มัชยมอุจ (Matjayom Uj)
   *
   * U(J, A) = J - A   (ลบตำแหน่ง, circular)
   *
   * ∆U = J - A  (mod 21600)
   */
  calcMatjayomUj(matjayomJan, matjayomAathit) {
    this._guard();
    return this.subPos(matjayomJan, matjayomAathit);
  }

  /**
   * §8g  อุจวิเศษ (Uj Wisset)
   *
   * V(J, U) = J - U   (ลบตำแหน่ง, circular)
   *
   * เทียบสูตร:
   *   V = J - U  →  เมื่อ U = J - A  →  V = J - (J - A) = A
   * แต่ในทางปฏิบัติให้คำนวณจาก J, U จริง (ไม่ใช้ shortcut)
   * จำนวนราศีของ V ใช้เป็นเกณฑ์ทำนาย
   */
  calcUjWisset(matjayomJan, matjayomUj) {
    this._guard();
    const v = this.subPos(matjayomJan, matjayomUj);
    const ujRasi = v.rasi;   // 0–11 → ใช้ตีความตาม ref.part2_prediction.section3_rasi_special
    return { ...v, ujRasi, meaning: this._getUjMeaning(ujRasi) };
  }

  /** หาความหมายอุจวิเศษจาก JSON */
  _getUjMeaning(ujRasi) {
    if (!this.ref) return '';
    const sec = this.ref.part2_prediction?.section3_rasi_special?.uj_wisset_values;
    if (!sec) return '';
    // ตำรา: ราศี ๑๐ = เกณฑ์บวก (สำคัญ)
    const key = ujRasi === 10 ? '10_intaphat_supreme_high'
              : ujRasi === 0  ? '0'
              : String(ujRasi);
    return sec[key]?.meaning || sec['even']?.meaning || '';
  }

  // ════════════════════════════════════════════════════════════
  //  §9  ตรวจบาทฤกษ์ร้าย (Bad Nakhat Detection)
  // ════════════════════════════════════════════════════════════

  /**
   * ตรวจว่าฤกษ์อยู่ในบาทฤกษ์ร้ายหรือไม่
   *
   * B(n) = {true iff n ∈ S_bad}
   *   S_bad = set ของฤกษ์ร้ายตามตาราง inthaphat_reference.json
   *
   * ฤกษ์ร้ายหลัก (ตามตำรา):
   *   เอกตรินิ:  ฤกษ์ 1, 9, 19  (ราศีไฟ นวางค์ที่ 5)
   *   ตรินิเอก:  ฤกษ์ 7, 16, 24 (ราศีน้ำ/ดิน นวางค์ที่ 2)
   *   คินฤกษ์:   ฤกษ์ 4, 11, 22
   *   พยะกริวัง: ฤกษ์ 1, 10, 19 (ราศีไฟ นวางค์ที่ 1)
   *   จัดตรัท:   ฤกษ์ 4, 16, 28
   *
   * @param {number} nakhat  ฤกษ์ 1–27
   * @returns {{ isBad, type, name }}
   */
  checkBadNakhat(nakhat) {
    this._guard();

    const BAD_NAKHAT_MAP = {
      // เอกตรินิ (โจโร)
      1: 'เอกตรินิ', 9: 'เอกตรินิ', 19: 'เอกตรินิ',
      // ตรินิเอก (เพชฌฆาต)
      7: 'ตรินิเอก', 16: 'ตรินิเอก', 24: 'ตรินิเอก',
      // คินฤกษ์ / ภินทุบาทว์ (เทศาตร์)
      4: 'คินฤกษ์', 11: 'คินฤกษ์', 22: 'คินฤกษ์',
      // พยะกริวัง (ทลิทโท)
      10: 'พยะกริวัง', 20: 'พยะกริวัง',
      // จัดตรัทฤกษ์ (สมโฬ)
      28: 'จัดตรัทฤกษ์'
    };

    const type = BAD_NAKHAT_MAP[nakhat] || null;
    return {
      isBad: !!type,
      nakhat,
      nakhat_name: this.ref.helpers.nakhat_names[nakhat - 1] || '',
      type: type || 'ปุณฤกษ์ (ดี)',
      danger_level: type ? (type === 'เอกตรินิ' || type === 'ตรินิเอก' ? 'สูง' : 'กลาง') : 'ไม่มี'
    };
  }

  /**
   * ตรวจ Crisis Detection: หลักอินทภาษ / บาทจันทร์จรทับฤกษ์ร้าย
   *
   * crisis(pillar_nakhat, matayud_set, transit_nakhat) → bool
   *
   * @param {Object} pillar    { base1 } หลักกำเนิด
   * @param {Object} matayud   ผลจาก calcMatayud()
   * @param {number} transitNakhat  ฤกษ์โจร (จร)
   */
  checkCrisis(pillar, matayud, transitNakhat) {
    this._guard();

    const matSet = new Set([
      matayud.M1, matayud.M2, matayud.M3,
      matayud.M4, matayud.M5, matayud.M6
    ]);

    const badInfo    = this.checkBadNakhat(transitNakhat);
    const inMatayud  = matSet.has(transitNakhat);
    const isCrisis   = inMatayud && badInfo.isBad;

    return {
      isCrisis,
      inMatayud,
      transitNakhat,
      transit_name: this.ref.helpers.nakhat_names[transitNakhat - 1] || '',
      badInfo,
      matayud_nakhat_set: [...matSet],
      severity: isCrisis ? (badInfo.danger_level === 'สูง' ? 'วิกฤต' : 'เฝ้าระวัง') : 'ปกติ'
    };
  }

  // ════════════════════════════════════════════════════════════
  //  §10  Transit Lookup — ทายนวางค์จร
  // ════════════════════════════════════════════════════════════

  /**
   * หาคำทำนายนวางค์อินทภาษจร (planet transit on Intaphat pillar)
   *
   * @param {string} planetName  ชื่อดาวเคราะห์จร
   * @param {string} transitType 'intaphat' | 'batjan'
   * @returns {Array} คำทำนายที่ตรงกัน
   */
  getTransitPrediction(planetName, transitType = 'intaphat') {
    this._guard();
    const sec = transitType === 'batjan'
      ? this.ref.part2_prediction?.section7_transit_batjan?.rules
      : this.ref.part2_prediction?.section6_transit_intaphat?.rules;
    if (!sec) return [];
    return sec.filter(r =>
      r.planet_transit?.includes(planetName) ||
      r.planet_transit_on?.includes(planetName)
    );
  }

  /**
   * หาคำทำนายตามราศีที่นวางค์จรเข้าเกาะ
   *
   * @param {number} rasiId   ราศี 0–11
   * @param {number} nwangNum นวางค์ที่ (1–9)
   */
  getSignTransitPrediction(rasiId, nwangNum) {
    this._guard();
    const rasiName = this.ref.helpers.rasi_names[rasiId] || '';
    const sec = this.ref.part2_prediction?.section8_transit_by_sign?.by_sign;
    if (!sec || !sec[rasiName]) return { rasi: rasiName, predictions: [] };

    const data = sec[rasiName];
    const key  = `nwang${nwangNum}`;
    return {
      rasi: rasiName,
      nwang: nwangNum,
      prediction: data[key] || data[`nwang${nwangNum}_alt`] || 'ไม่มีข้อมูลเฉพาะ'
    };
  }

  // ════════════════════════════════════════════════════════════
  //  §11  Master calcAll — คำนวณทั้งหมดในครั้งเดียว
  // ════════════════════════════════════════════════════════════

  /**
   * คำนวณทุกหัวข้อพร้อมกัน
   *
   * @param {Object} input
   *   input.sakrat          {number}  ศักราช
   *   input.samphot_aathit  {rasi,ongsa,libda} สมผุสอาทิตย์
   *   input.samphot_jan     {rasi,ongsa,libda} สมผุสจันทร์
   *   input.suthin          {number}  สูทิน
   *   input.birthNathi      {number}  เวลาเกิด (นาที 0–1439)
   *   input.bornBefore2Yam  {boolean} เกิดก่อน ๒ ยาม
   *   input.gamBirthNak     {number}  กัมมัจจุพลฤกษ์เกิด
   *   input.awamBirthNak    {number}  อวมานฤกษ์เกิด
   *
   * @returns {Object} ผลการคำนวณทั้งหมด
   */
  calcAll(input) {
    this._guard();
    const {
      sakrat, samphot_aathit, samphot_jan,
      suthin = 0, birthNathi = 0, bornBefore2Yam = true,
      gamBirthNak = 0, awamBirthNak = 0
    } = input;

    // ── ฤกษ์จากสมผุส ────────────────────────────────────────
    const nakhat_aathit = this.calcNakhat(samphot_aathit);
    const nakhat_jan    = this.calcNakhat(samphot_jan);

    // ── ฤกษ์ศักราช ─────────────────────────────────────────
    const sakratPillar  = this.calcSakrat(sakrat, samphot_aathit.rasi, samphot_aathit.ongsa);

    // ── จันทร์กาดชำระ ───────────────────────────────────────
    const janKS         = this.calcJanKaadSara(nakhat_jan.nathi);

    // ── อินทภาษ + บาทจันทร์ ────────────────────────────────
    const intaphat      = this.calcIntaphat(sakratPillar, janKS);
    const batjan        = this.calcBatjan(sakratPillar, janKS);

    // ── มฤตยู ──────────────────────────────────────────────
    const matayud       = this.calcMatayud(intaphat.base1);

    // ── อุจวิเศษ ────────────────────────────────────────────
    const G             = this.calcGammatjuphol(suthin, gamBirthNak, birthNathi);
    const matjAathit    = this.calcMatjayomAathit(G);
    const awaman        = this.calcAwaman(suthin, awamBirthNak, birthNathi);
    const tit           = this.calcTitKamnerd(suthin, gamBirthNak, awaman, bornBefore2Yam);
    const matjJan       = this.calcMatjayomJan(awaman, tit, matjAathit, birthNathi);
    const matjUj        = this.calcMatjayomUj(matjJan, matjAathit);
    const ujWisset      = this.calcUjWisset(matjJan, matjUj);

    // ── ตรวจบาทฤกษ์ร้าย ────────────────────────────────────
    const badCheck_intaphat = this.checkBadNakhat(intaphat.base1);
    const badCheck_batjan   = this.checkBadNakhat(batjan.base1);

    return {
      input,
      nakhat_aathit,
      nakhat_jan,
      sakrat_pillar:  sakratPillar,
      jan_kaad_sara:  janKS,
      intaphat,
      batjan,
      matayud,
      gammatjuphol:   G,
      matjayom_aathit: matjAathit,
      awaman,
      tit,
      matjayom_jan:   matjJan,
      matjayom_uj:    matjUj,
      uj_wisset:      ujWisset,
      bad_check: {
        intaphat: badCheck_intaphat,
        batjan:   badCheck_batjan
      },
      meta: {
        engine: 'IntaphatEngine v1.0.0',
        reference: this.ref?.meta?.title || '',
        timestamp: new Date().toISOString()
      }
    };
  }

  // ════════════════════════════════════════════════════════════
  //  §12  Utility: สรุปผลเป็น Object พร้อมทำนาย
  // ════════════════════════════════════════════════════════════

  /**
   * สรุปคำทำนายจากผลคำนวณ calcAll()
   * @param {Object} calcResult  ผลจาก calcAll()
   */
  summarizePrediction(calcResult) {
    this._guard();
    const { intaphat, batjan, matayud, uj_wisset, bad_check } = calcResult;

    const rasi_int  = intaphat.base3;
    const rasi_bat  = batjan.base3;

    // ────────────────────────────────────────────────────────
    // คำทำนายตามราศีอุจวิเศษ
    const ujMeaning = uj_wisset.meaning || '(ไม่พบข้อมูล)';

    // ตรวจว่านวางค์ตรงกับบาทฤกษ์ร้ายหรือไม่
    const crisis_int = bad_check.intaphat;
    const crisis_bat = bad_check.batjan;

    // ตรวจ matayud
    const matSet = [
      matayud.M1_name, matayud.M2_name, matayud.M3_name,
      matayud.M4_name, matayud.M5_name, matayud.M6_name
    ];

    return {
      intaphat_rasi:    this.ref.helpers.rasi_names[rasi_int] || rasi_int,
      batjan_rasi:      this.ref.helpers.rasi_names[rasi_bat] || rasi_bat,
      uj_wisset_rasi:   this.ref.helpers.rasi_names[uj_wisset.rasi] || uj_wisset.rasi,
      uj_wisset_meaning: ujMeaning,
      matayud_nakhat:   matSet,
      intaphat_bad:     crisis_int,
      batjan_bad:       crisis_bat,
      overall_verdict: this._overallVerdict(crisis_int, crisis_bat, uj_wisset)
    };
  }

  _overallVerdict(ci, cb, uj) {
    const bothBad = ci.isBad && cb.isBad;
    const neitherBad = !ci.isBad && !cb.isBad;
    const ujRasi = uj.ujRasi;

    if (bothBad && ujRasi === 0)   return 'วิกฤต — บาทฤกษ์ทั้ง ๒ หลักร้าย + อุจวิเศษดับ';
    if (bothBad)                   return 'เฝ้าระวัง — บาทฤกษ์ทั้ง ๒ หลักร้าย';
    if (neitherBad && ujRasi === 10) return 'อุดม — อุจวิเศษ ๑๐ ราศี บริบูรณ์';
    if (neitherBad)                return 'ดี — บาทฤกษ์ทั้ง ๒ หลักดี';
    return 'ปานกลาง — หลักหนึ่งดีหนึ่งร้าย';
  }
}

// ── Export ─────────────────────────────────────────────────────
// รองรับทั้ง ES Module และ Browser Global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IntaphatEngine };
} else if (typeof window !== 'undefined') {
  window.IntaphatEngine = IntaphatEngine;
}
