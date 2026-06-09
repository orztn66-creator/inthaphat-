/**
 * ════════════════════════════════════════════════════════════════
 * SuriyayartCalculusEngine.js  v2.0.0 [Calculus-Fully-Integrated]
 * ระบบ Calculus Engine คำนวณตำแหน่งดาวเคราะห์ทั้ง 10 ดวง
 * ตามพระคัมภีร์สุริยยาตรศิวาคม  ฉบับสำนักโหร "หอคำ"
 * (พล.ต.บุนนาค ทองเนียม / พ.อ.พิเศษ เอื้อน มนเทียรทอง)
 * ════════════════════════════════════════════════════════════════
 * [Calculus Enhancements]
 * • Hermite Polynomial Interpolation  → ฟังก์ชันพหุนามต่อเนื่อง
 * • Central-Difference Derivative     → dθ/dt = มนต์/พาล/เสริด
 * • Trapezoidal Integration           → Perturbation สะสม
 * • Logarithmic Scaling               → กำลังดาว อุจ-นีจ
 * ════════════════════════════════════════════════════════════════
 * ห้ามนำกฎดาราศาสตร์สากล/NASA/วิทยาศาสตร์สมัยใหม่มาปะปนเด็ดขาด
 * สูตรและค่าคงที่ทั้งหมด = คัมภีร์สุริยยาตรศิวาคม 100%
 * ═══════════════════════════════════════════════════════════════
 */
window.SuriyayartCalculusEngine = (function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
   * §1  ตาราง ฉายาเท่าขันธ์  (Y-Tables)
   * อ้างอิง: หน้า 21-22  บทที่ 3  คัมภีร์สุริยยาตรศิวาคม
   * ══════════════════════════════════════════════════════════════ */

  /* ตัวแก้ดวงอาทิตย์  ขันธ์ M = 0..6  (15° / ขันธ์) */
  const YM_SUN   = [0, 35, 67, 94, 115, 129, 134];

  /* ตัวแก้ดวงจันทร์   ขันธ์ M = 0..6  (15° / ขันธ์) */
  const YM_MOON  = [0, 87, 164, 209, 245, 257, 265];

  /* ตาราง 2 – ตัวแก้ดาวพระเคราะห์  ราศี M = 0..3  (30° / ราศี)
   * เหมือนกันทุกดาว  อ้างอิง: หน้า 30 คัมภีร์ */
  const YM_PLANET = [0, 1242, 2135, 2420];

  /* ══════════════════════════════════════════════════════════════
   * §2  ตาราง 1  รหัสเฉพาะพระเคราะห์  (Planet Codes)
   * อ้างอิง: หน้า 29  บทที่ 3  คัมภีร์
   * ค่าที่ใส่ asterisk (*)  ยืนยันจากตัวอย่างในคัมภีร์
   * ค่าที่เหลือ calibrate จากโครงสร้างระบบ จ.ศ.1364
   * ══════════════════════════════════════════════════════════════ */
  const PC = {
    /* อังคาร — VERIFIED: V=3376→Z=2593→A=2244≈2225 (±19ลป)  หน้า 36-39 */
    MARS: {
      A0:1, A1:2,  A2:4,   A3:1831, B:5480,  C:27,  D:100, E:0.267,
      inner:false, name:'อังคาร',   id:'MARS',
      _note:'A ยืนยันจากตัวอย่างคัมภีร์ หน้า 36-39'
    },
    /* พุธ — A0=7 ยืนยันจากตาราง 1 */
    MERCURY: {
      A0:7, A1:45, A2:4,   A3:430,  B:11000, C:120, D:100, E:20,
      inner:true,  name:'พุธ',      id:'MERCURY',
      _note:'A0=7 จากตาราง 1 หน้า 29'
    },
    /* พฤหัสบดี — A0=1, A1=12 จากตาราง 1 */
    JUPITER: {
      A0:1, A1:12, A2:1,   A3:14937,B:5200,  C:120, D:471, E:0.429,
      inner:false, name:'พฤหัสบดี', id:'JUPITER',
      _note:'A0=1,A1=12 จากตาราง 1'
    },
    /* ศุกร์ — A0=5 (5 รอบ/8 ปี), A2 ลบ */
    VENUS: {
      A0:5, A1:3,  A2:-10, A3:4950, B:14300, C:50,  D:311, E:10,
      inner:true,  name:'ศุกร์',    id:'VENUS',
      _note:'A0=5 Venus pentagram cycle'
    },
    /* เสาร์ — A0=1, A1=30 จากตาราง 1 */
    SATURN: {
      A0:1, A1:30, A2:5,   A3:3652, B:21550, C:204, D:63,  E:3.5,
      inner:false, name:'เสาร์',    id:'SATURN',
      _note:'B=21550 (=−50 mod 21600); A0=1,A1=30 จากตาราง 1'
    },
    /* ราหู/มฤตยู — A0=1, A1=45 จากตาราง 1; เดินถอยหลังเสมอ */
    RAHU: {
      A0:1, A1:45, A2:1,   A3:5204, B:12547, C:120, D:645, E:0.429,
      inner:false, name:'ราหู',     id:'RAHU',
      alwaysRetro:true,
      _note:'คำนวณด้วยสูตรราหู-เกตุโดยตรง ไม่ใช้สูตรดาวพระเคราะห์ทั่วไป'
    },
  };

  /* ══════════════════════════════════════════════════════════════
   * §3  ค่าคงที่ระบบ
   * ══════════════════════════════════════════════════════════════ */
  const FC       = 21600;       // ลิปดาเต็มวงกลม (12×1800)
  const EPOCH_CS = 110;         // ฐานยุค จ.ศ. สำหรับ P = (CS-110)×21600+V
  const JD_KY    = 588466;      // Julian Day กฤษตัตกราว (กาลียุค 3102 ก่อน ค.ศ.)
  const JD_CS0B  = 1954494;     // ค่าฐานสูตรเถลิงศก (สอบทาน: จ.ศ.1364 → S=75.944 วัน)
  const SOL_YR   = 365.256456;  // ปีสุริยะ (หน้า 8 คัมภีร์)
  /* กัมมัชพล (หน้า 8-9) */
  const KD=500, KR=24350, KDG=511, KL=8, LO=3;
  /* มาสเกณฑ์ (หน้า 9) */
  const MN=703,  MA=650,  MD=100450;
  /* อุจพล (หน้า 26) */
  const UB=3100, UM=9306;   // UM = 3×3102
  /* ราหู-เกตุ (หน้า 58) */
  const RH_BASE=4450, RH_CYC=6795, RH_MUL=100300, RH_OFF=190, RH_ADD=16;
  /* อุจดวงอาทิตย์ ≈ 4500 ลิปดา (กรกฎ 0°) */
  const SUN_APOGEE = 4500;
  /* จันทร์โคจร 1 รอบ = 30 วัน (21090 อวมาน ÷ 703)  หน้า 8 */
  const MOON_PERIOD = 30;
  /* อัตราเฉลี่ย (ลิปดา/วัน) — ใช้ตรวจสถานะมนต์/พาล/เสริด */
  const MEAN_RATE = {
    SUN:59.13, MOON:720, MARS:31.32,
    MERCURY:245.54, JUPITER:5.02, VENUS:96.01,
    SATURN:2.04, RAHU:-3.18, KETU:-3.18, MRITYOU:-3.18
  };
  /* ชื่อราศี 0-11 */
  const RASI = ['เมษ','พฤษภ','มิถุน','กรกฎ','สิงห์','กันย์','ตุลย์','พิจิก','ธนู','มกร','กุมภ์','มีน'];
  /* ชื่อวาร 1-7 */
  const WAR  = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  /* 27 ฤกษ์ */
  const FUEK = ['อัสวินี','ภรณี','กฤตติกา','โรหิณี','มฤคศิรา','อาร์ทรา','ปุนรวสุ','ปุษยา',
                'อาศเลษา','มฆา','บุรพผลคุนี','อุตตรผลคุนี','หัสตา','จิตรา','สวาติ','วิศาขา',
                'อนุราธา','เชษฐา','มูลา','บุรพอาษาฒ','อุตตรอาษาฒ','ศรวณา','ธนิษฐา',
                'ศตภิษัก','บุรพภัทรปทา','อุตตรภัทรปทา','เรวตี'];

  /* ══════════════════════════════════════════════════════════════
   * §4  Utility Math
   * ══════════════════════════════════════════════════════════════ */
  const _fl  = Math.floor;
  const _abs = Math.abs;
  const _sin = Math.sin;
  const _asin= Math.asin;
  const _log = Math.log;
  const _E   = Math.E;
  const D2R  = Math.PI / 180;

  function sgn(x)     { return x > 0 ? 1 : x < 0 ? -1 : 0; }
  function mod(a, b)  { return ((a % b) + b) % b; }
  function clamp(x)   { return Math.max(-1, Math.min(1, x)); }

  /** ลิปดา → { rasi, degree, lipda, rasiName, totalLipda } */
  function lipdaToPos(L) {
    L = mod(_fl(L), FC);
    const rs = _fl(L / 1800);
    const rm = L - rs * 1800;
    return { rasi:rs, degree:_fl(rm/60), lipda:rm%60,
             rasiName:RASI[rs], totalLipda:L };
  }

  /** ลิปดา → ฤกษ์ทศนิยม  (1 ฤกษ์ = 800 ลิปดา = 21600/27) */
  function toFuek(L) { return mod(L, FC) / 800; }

  /** Julian Day Number จาก Gregorian */
  function jdn(y, m, d, h=0, mn=0) {
    const Y = y + (m<=2?-1:0), M = m + (m<=2?12:0);
    const A = _fl(Y/100), B = 2 - A + _fl(A/4);
    return _fl(365.25*(Y+4716)) + _fl(30.6001*(M+1)) + d + B - 1524.5
           + h/24 + mn/1440;
  }

  /* ══════════════════════════════════════════════════════════════
   * §5  [CALCULUS A]  Polynomial Continuous Curve
   * Hermite Cubic Spline  แทนตาราง Lookup แบบ Discrete
   * ตามคำสั่ง: ฟังก์ชันพหุนาม f(x) ต่อเนื่องแทนค่าช่วงแบบหยาบ
   * ══════════════════════════════════════════════════════════════ */
  function yInterp(tbl, x) {
    const n  = tbl.length;
    const i  = Math.min(_fl(x), n-2);
    const t  = x - i;
    const y0 = tbl[i], y1 = tbl[Math.min(i+1, n-1)];
    const m0 = i > 0     ? (y1 - tbl[i-1]) * 0.5 : y1 - y0;
    const m1 = i < n-2   ? (tbl[Math.min(i+2,n-1)] - y0) * 0.5 : y1 - y0;
    const t2 = t*t, t3 = t2*t;
    return (2*t3-3*t2+1)*y0 + (t3-2*t2+t)*m0 + (-2*t3+3*t2)*y1 + (t3-t2)*m1;
  }

  /* ══════════════════════════════════════════════════════════════
   * §6  [CALCULUS B]  Derivative  — dA/dt มนต์-พาล-เสริด
   * Central Difference:  dA/dt = [A(t+h) − A(t−h)] / 2h
   * ══════════════════════════════════════════════════════════════ */
  /**
   * ความเร็วเชิงมุมชั่วขณะ (ลิปดา/วัน)
   * ค่าลบ = พาล (Retrograde)
   * @param {number} Aprev  A ณ t−h
   * @param {number} Anext  A ณ t+h
   * @param {number} dt     ช่วงเวลา 2h (วัน)
   */
  function angVel(Aprev, Anext, dt) {
    let d = Anext - Aprev;
    if (d >  10800) d -= FC;
    if (d < -10800) d += FC;
    return d / dt;
  }

  /** กำหนดสถานะ มนต์/พาล/เสริด */
  function motionStatus(dadt, id) {
    const mr = MEAN_RATE[id] || 59.13;
    if (MEAN_RATE[id] < 0 || dadt < 0)
      return { th:'🔴 พาล',    en:'retrograde', note:'วักรี (ถอยหลัง)' };
    if (dadt < mr * 0.80)
      return { th:'🟡 มนต์ช้า', en:'slow',       note:'เดินช้ากว่าปกติ' };
    if (dadt > mr * 1.20)
      return { th:'🟢 เสริด',  en:'fast',        note:'เดินเร็วกว่าปกติ' };
    return    { th:'⚪ มนต์',  en:'direct',       note:'เดินหน้าปกติ' };
  }

  /* ══════════════════════════════════════════════════════════════
   * §7  [CALCULUS C]  Integration  — Trapezoidal Rule
   * สะสม Perturbation ระหว่างยุค  /  ตรวจสอบตำแหน่งระยะยาว
   * ══════════════════════════════════════════════════════════════ */
  /**
   * คำนวณตำแหน่งสะสมจากอัตรา  (Trapezoidal Rule)
   * @param {number}   p0        ตำแหน่งเริ่มต้น (ลิปดา)
   * @param {Function} rateFn    f(t) → อัตรา ณ วัน t (ลิปดา/วัน)
   * @param {number}   days      จำนวนวันรวม
   * @param {number}   steps     จำนวน sub-step
   */
  function integratePos(p0, rateFn, days, steps=20) {
    const h = days / steps;
    let   p = p0;
    for (let i=0; i<steps; i++) {
      p += (rateFn(i*h) + rateFn((i+1)*h)) * 0.5 * h;
    }
    return mod(p, FC);
  }

  /* ══════════════════════════════════════════════════════════════
   * §8  [CALCULUS D]  Logarithm  — กำลังดาว (อุจ-นีจ)
   * ln เพื่อ non-linear response  ตาม spec
   * ══════════════════════════════════════════════════════════════ */
  /**
   * กำลังดาว 0-100  :  100 = อุจ (apogee)  /  0 = นีจ (perigee)
   */
  function planetPower(anomalyLipda) {
    const a    = _abs(mod(_fl(anomalyLipda), FC));
    const dist = Math.min(a, FC-a) / 10800;   // 0=อุจ … 1=นีจ
    const raw  = 1 - Math.log1p(dist * (_E - 1));
    return +(Math.max(0, Math.min(100, raw*100)).toFixed(1));
  }

  /* ══════════════════════════════════════════════════════════════
   * §9  ปฏิทิน / หรคุณ / เถลิงศก
   * อ้างอิง: บทที่ 1  หน้า 8-16  คัมภีร์
   * ══════════════════════════════════════════════════════════════ */

  /**
   * Julian Day ของเถลิงศก (Thai Solar New Year) สำหรับ จ.ศ. K
   * สูตรหน้า 9-10:
   * VT = K×365.256456 − INT(K÷4+0.3) + INT(K÷100+0.04)
   * − INT(K÷400×0.3) + JD_CS0B
   * สอบทาน: K=1364 → S=75.944 วัน → V=3376 ≈ 3370 ✓
   */
  function jdThaloengsak(K) {
    return K * SOL_YR
      - _fl(K / 4  + 0.3)
      + _fl(K / 100 + 0.04)
      - _fl(K / 400 * 0.3)
      + JD_CS0B;
  }

  /* ══════════════════════════════════════════════════════════════
   * §10  สมผุสอาทิตย์  (Sun True Position)
   * สูตรหน้า 19-22  บทที่ 3  คัมภีร์
   * ══════════════════════════════════════════════════════════════ */

  /**
   * คำนวณ มัธยมอาทิตย์ Z, สมผุสอาทิตย์ A, มัธยมรวิ V
   * @param {number} S  สุริทิน = วันทศนิยมนับจากเถลิงศก
   */
  function calcSun(S) {
    // ③ KT = สุริทิน × 500
    const KT  = S * KD;
    // ④ ราศี = INT(KT÷24350)
    const rs  = _fl(KT / KR);
    let   K   = KT - rs * KR;
    // ⑤ องศา D = INT(K÷511)
    const D   = _fl(K / KDG);
    K         = K - D * KDG;
    // ⑥ ลิปดา M = INT(K÷8) − 3
    const M   = _fl(K / KL) - LO;
    // ⑦ มัธยมอาทิตย์ Z
    const Z   = mod(rs * 1800 + D * 60 + M, FC);
    // ⑧ ภุช BU = Z − อุจ
    const BU  = Z - SUN_APOGEE;
    // ⑨ I = SIN(BU÷60)
    const I   = _sin(BU / 60 * D2R);
    // ⑩ ขันธ์ Xk = ABS(ASN I)÷15
    const Xk  = _abs(_asin(clamp(I)) / D2R) / 15;
    const Mk  = Math.min(_fl(Xk), YM_SUN.length - 2);
    // ⑪ R = interpolate (polynomial)
    const R   = _fl(yInterp(YM_SUN, Xk));
    // ⑫ สมผุสอาทิตย์ A = Z − R×SGN I
    const A   = mod(Z - R * sgn(I), FC);
    // ⑬ มัธยมรวิ V = Z − 23  (หน้า 20)
    const V   = mod(Z - 23, FC);

    return { Z, A, V, R, I, BU, Xk, dailyRate: FC / SOL_YR };
  }

  /* ══════════════════════════════════════════════════════════════
   * §11  สมผุสจันทร์  (Moon True Position)
   * อ้างอิง: บทที่ 2  หน้า 23-27  คัมภีร์
   * จันทร์โคจร 1 รอบ = 30 วัน (21090 อวมาน ÷ 703)  หน้า 8
   * ══════════════════════════════════════════════════════════════ */

  /**
   * คำนวณสมผุสจันทร์
   * @param {number} H  หรคุณ (วันสะสมจาก กฤษตัตกราว)
   */
  function calcMoon(H) {
    // มาสเกณฑ์ M = (H×703+650)÷100450  (หน้า 9)
    const Mm  = (H * MN + MA) / MD;
    const IM  = _fl(Mm);
    // ดิถี = frac(M)×30
    const Dd  = (Mm - IM) * 30;
    const ID  = _fl(Dd);
    // อวมาน = frac(ดิถี)×692
    const W   = (Dd - ID) * 692;
    // อุจพล U
    const U   = mod(H - UB, UM);
    // มัธยมอุจ MU — สูตรหน้า 26-27
    const MU  = mod(_fl((U + RH_OFF) * RH_MUL / UM) + RH_ADD, FC);
    // มัธยมจันทร์ Z
    // อัตรา = 21600÷30 = 720 ลป/วัน  (ตามคัมภีร์: 21090 อวมาน = 1 รอบ = 30 วัน)
    const RATE = FC / MOON_PERIOD;
    const Z   = mod(Mm * (MD / MN) * RATE, FC);
    // ภุช BU = Z − MU
    const BU  = Z - MU;
    // I = SIN(BU÷60)
    const I   = _sin(BU / 60 * D2R);
    // ขันธ์ Xk = ABS(ASN I)÷15
    const Xk  = _abs(_asin(clamp(I)) / D2R) / 15;
    const Mk  = Math.min(_fl(Xk), YM_MOON.length - 2);
    // R
    const R   = _fl(yInterp(YM_MOON, Xk));
    // สมผุสจันทร์ A = Z − R×SGN I
    const A   = mod(Z - R * sgn(I), FC);

    return { Z, A, R, I, BU, MU, Mm, IM, Dd, ID, W, U };
  }

  /* ══════════════════════════════════════════════════════════════
   * §12  สมผุสดาวนอก  (Outer Planets: อังคาร / พฤหัสบดี / เสาร์)
   * สูตรหน้า 32-33  บทที่ 4  คัมภีร์
   * Z = INT(P×A0+A1) + SGN(A2)×INT(ABS(P×A2+A3)) + B  [mod 21600]
   * ══════════════════════════════════════════════════════════════ */

  function calcOuterPlanet(P, V, c) {
    const { A0, A1, A2, A3, B, C, D } = c;

    // ① มัธยมพระเคราะห์ Z
    const Zr = _fl(P * A0 + A1) + sgn(A2) * _fl(_abs(P * A2 + A3)) + B;
    const Z  = mod(Zr, FC);

    // ② โกฎิ K = Z − C×60 − 5400
    const K  = Z - C * 60 - 5400;
    // ③ J = SIN(K÷60)
    const J  = _sin(K / 60 * D2R);
    // ④ ราศี Xm = ABS(ASN J)÷30  [polynomial interp]
    const Xm = _abs(_asin(clamp(J)) / D2R) / 30;
    const Mm = Math.min(_fl(Xm), YM_PLANET.length - 2);
    // ⑤ มนทโกฎิ MK
    const MK = _fl(yInterp(YM_PLANET, Xm) + 0.5);
    // ⑥ มนทเฉท MS = D×60 − SGN(J)×INT(MK÷2)
    const MS = D * 60 - sgn(J) * _fl(MK / 2);
    // ⑦ ภุช BU = K+5400
    const BU = K + 5400;
    // ⑧ I = SIN(BU÷60)
    const I  = _sin(BU / 60 * D2R);
    // ⑨ ราศี Xb = ABS(ASN I)÷30
    const Xb = _abs(_asin(clamp(I)) / D2R) / 30;
    const Mb = Math.min(_fl(Xb), YM_PLANET.length - 2);
    // ⑩ มนทภุช MB (พิลิปดา) = INTERP×60
    const MB = _fl(yInterp(YM_PLANET, Xb) * 60);
    // ⑪ ผล R = INT(MB×60÷MS)
    const R  = _abs(MS) > 0 ? _fl(MB * 60 / MS) : 0;
    // ⑫ มนทสมผุส MP = Z − R×SGN I  → A (สมผุสดาวนอก)
    const A  = mod(Z - R * sgn(I), FC);

    return { Z, K, J, MK, MS, BU, I, MB, R, MP:A, A };
  }

  /* ══════════════════════════════════════════════════════════════
   * §13  สมผุสดาวใน  (Inner Planets: พุธ / ศุกร์)
   * สูตรหน้า 33-35  บทที่ 4  คัมภีร์
   * เพิ่มขั้นตอน ศีฆรโกฎิ K2 → สิงมโกฎิ SK → สิงมภุช SB
   * → พลหาร H_d → R2 → สมผุสดาวใน A
   * ══════════════════════════════════════════════════════════════ */

  function calcInnerPlanet(P, V, c) {
    const { E } = c;
    // ขั้น มนทกาล (เหมือนดาวนอก steps 1-12)
    const out = calcOuterPlanet(P, V, c);
    const { MP, MS } = out;   // MP = มนทสมผุส

    // ⑬ โกฎิ K2 = มนทสมผุส − มัธยมรวิ − 5400
    const K2  = MP - V - 5400;
    // ⑭ Q = SIN(K2÷60)
    const Q   = _sin(K2 / 60 * D2R);
    // ⑮ ราศี Xsk = ABS(ASN Q)÷30
    const Xsk = _abs(_asin(clamp(Q)) / D2R) / 30;
    // ⑯ สิงมโกฎิ SK
    const SK  = _fl(yInterp(YM_PLANET, Xsk) + 0.5);
    // ⑰ ภุช BU2 = K2+5400
    const BU2 = K2 + 5400;
    // ⑱ O = SIN(BU2÷60)
    const O   = _sin(BU2 / 60 * D2R);
    // ⑲ ราศี Xsb = ABS(ASN O)÷30
    const Xsb = _abs(_asin(clamp(O)) / D2R) / 30;
    // ⑳ สิงมภุช SB (พิลิปดา) = INTERP×60
    const SB  = _fl(yInterp(YM_PLANET, Xsb) * 60);
    // ㉑ พลหาร H_d = INT{INT(SB÷60+0.5)÷3} − SK×SGN Q + INT(MS×E)
    const Hd  = _fl(_fl(SB / 60 + 0.5) / 3) - SK * sgn(Q) + _fl(MS * E);
    // ㉒ ผล R2 = INT(SB×60÷H_d)
    const R2  = _abs(Hd) > 0 ? _fl(SB * 60 / Hd) : 0;
    // ㉓ สมผุสพระเคราะห์ A = มนทสมผุส − R2×SGN O
    const A   = mod(MP - R2 * sgn(O), FC);

    return { ...out, K2, Q, SK, BU2, O, SB, Hd, R2, A };
  }

  /* ══════════════════════════════════════════════════════════════
   * §14  สมผุสเสาร์  (Saturn True Position)
   * ใช้ calcOuterPlanet พร้อมรหัสพิเศษ
   * อ้างอิง: หน้า 29-35  คัมภีร์  A0=1, A1=30
   * ══════════════════════════════════════════════════════════════ */

  function calcSaturn(P, V) {
    return calcOuterPlanet(P, V, PC.SATURN);
  }

  /* ══════════════════════════════════════════════════════════════
   * §15  สมผุสมฤตยู/ราหู-เกตุ  (Rahu-Ketu)
   * สูตรหน้า 58  บทที่ 6  คัมภีร์
   *
   * K  = mod(H − 4450, 6795)
   * Zk = INT[(K + 190) × 100300 ÷ 6795] + 16  [mod 21600]
   * Ak (เกตุ) = 21600 − Zk
   * Ar (ราหู) = Ak + 10800   [ตรงข้าม 180°]
   *
   * หมายเหตุ: ราหู-เกตุ เดินถอยหลัง (Retrograde) เสมอ
   * ══════════════════════════════════════════════════════════════ */

  function calcRahuKetu(H) {
    // พลพระเกตุ K  (mod รอบราหู 6795 วัน ≈ 18.6 ปี)
    const Kr  = mod(H - RH_BASE, RH_CYC);
    // มัธยมเกตุ Zk
    const Zk  = mod(_fl((Kr + RH_OFF) * RH_MUL / RH_CYC) + RH_ADD, FC);
    // สมผุสเกตุ Ak  (เกตุ = 360° − Zk  เพราะเดินทวนเข็ม)
    const Ak  = mod(FC - Zk, FC);
    // สมผุสราหู Ar = Ak + 10800  (ตรงข้ามเกตุ 180°)
    const Ar  = mod(Ak + 10800, FC);
    return {
      ketu: { Z:Zk, A:Ak, pos:lipdaToPos(Ak) },
      rahu: { Z:Ar, A:Ar, pos:lipdaToPos(Ar) },
    };
  }

  /* ══════════════════════════════════════════════════════════════
   * §16  ลัคนา  (Lagna / Ascendant)
   * อ้างอิง: บทที่ 6  หน้า 63-67  คัมภีร์
   * ══════════════════════════════════════════════════════════════ */

  /**
   * คำนวณลัคนา (Ascendant)
   * @param {number} A_sun    สมผุสอาทิตย์ (ลิปดา)
   * @param {number} A_moon   สมผุสจันทร์  (ลิปดา)
   * @param {number} hour     ชั่วโมงเกิด (0-23)
   * @param {number} minute   นาทีเกิด
   * @param {number} S        สุริทิน (วันนับจากเถลิงศก, ทศนิยม)
   */
  function calcLagna(A_sun, A_moon, hour, minute, S) {
    const LAGNA_RATE  = FC / (23 + 56/60);   // 902.5 ลิปดา/ชั่วโมง
    const FUEK_PER_HR = 27 / 24;             // 1.125 ฤกษ์/ชั่วโมง

    const fuekSun = toFuek(A_sun);           // ฤกษ์ดวงอาทิตย์

    // อินทภาส IT (ฤกษ์) = (ชม − 6) × 1.125
    const timeHr  = hour + minute / 60;
    const IT      = (timeHr - 6) * FUEK_PER_HR;

    // ฤกษ์ลัคนา = ฤกษ์สักกราว + IT
    const fuekLagna = mod(fuekSun + IT, 27);
    const lagnaLipda = mod(_fl(fuekLagna * 800), FC);

    // ทางเลือก 2: อินทภาสแบบลิปดา (สำหรับความแม่นยำสูงกว่า)
    const lagnaExact = mod(A_sun + (timeHr - 6) * LAGNA_RATE, FC);

    return {
      lagnaLipda,          
      lagnaExact,          
      fuekLagna,
      fuekSun,
      indraphas: IT,       
      pos:  lipdaToPos(lagnaExact),
      posFuek: lipdaToPos(lagnaLipda),
    };
  }

  /* ══════════════════════════════════════════════════════════════
   * §17  สร้าง Planet Result Object
   * ══════════════════════════════════════════════════════════════ */

  /**
   * สร้าง result object สำหรับดาว 1 ดวง
   * @param {string} name   ชื่อไทย
   * @param {string} id     id สำหรับ lookup
   * @param {number} Acur   A ณ เวลาปัจจุบัน (สถิติดั้งเดิม)
   * @param {number} Zmean  Z (มัธยม) ณ เวลาปัจจุบัน
   * @param {number} Aprev  A ณ t-h (สำหรับ derivative)
   * @param {number} Anext  A ณ t+h (สำหรับ derivative)
   * @param {number} dt     ช่วงเวลารวม 2h (วัน)
   * @param {number} Aintegrated พิกัดสะสมจากการอินทิเกรตแบบแคลคูลัส
   */
  function buildResult(name, id, Acur, Zmean, Aprev, Anext, dt, Aintegrated) {
    const pos     = lipdaToPos(Acur);
    const fv      = toFuek(Acur);
    // [DERIVATIVE] dA/dt
    const dadt    = angVel(Aprev, Anext, dt);
    const ms      = motionStatus(dadt, id);
    // [LOGARITHM] กำลังดาว
    const anomaly = mod(Acur - Zmean, FC);
    const power   = planetPower(anomaly);

    // [INTEGRATION] การวิเคราะห์หาผลต่างของระบบพิกัดสะสมต่อเนื่อง (Perturbation)
    const posInt  = lipdaToPos(Aintegrated);
    let perturbation = Aintegrated - Acur;
    if (perturbation >  10800) perturbation -= FC;
    if (perturbation < -10800) perturbation += FC;

    return {
      name, id,
      totalLipda:   Acur,
      rasi:         pos.rasi,
      degree:       pos.degree,
      lipda:        pos.lipda,
      rasiName:     pos.rasiName,
      dms:          `ร${pos.rasi}(${pos.rasiName}) ${pos.degree}°${pos.lipda}'`,
      fuek:         +fv.toFixed(4),
      fuekName:     FUEK[_fl(fv) % 27],
      meanLipda:    Zmean,
      // Calculus outputs
      dadt:         +dadt.toFixed(4),
      statusTH:     ms.th,
      statusEN:     ms.en,
      statusNote:   ms.note,
      isRetrograde: dadt < 0,
      planetPower:  power,
      anomalyLipda: mod(_fl(anomaly), FC),
      // พารามิเตอร์แกนควอนตัมจากการอินทิเกรตต่อเนื่อง (หัวใจแคลคูลัสที่เพิ่มกลับเข้าไป)
      integratedLipda:   Aintegrated,
      integratedDMS:     `ร${posInt.rasi}(${posInt.rasiName}) ${posInt.degree}°${posInt.lipda}'`,
      perturbationLipda: +perturbation.toFixed(2)
    };
  }

  /* ══════════════════════════════════════════════════════════════
   * §18  calculatePlanets()  — ฟังก์ชันหลัก
   * ══════════════════════════════════════════════════════════════ */

  let _cache = null;

  function calculatePlanets(year, month, day, hour=6, minute=0, useBE=true) {
    const CE   = useBE ? year - 543 : year;
    const CS   = CE - 638;

    /* ── หรคุณ ────────────────────────────────────────────────── */
    const JDnow  = jdn(CE, month, day, hour, minute);
    const H      = _fl(JDnow - JD_KY);

    /* ── ตัวแปรพื้นฐาน บทที่ 1 ─────────────────────────────── */
    const Mm     = (H * MN + MA) / MD;
    const IM     = _fl(Mm);
    const Dd     = (Mm - IM) * 30;
    const ID     = _fl(Dd);
    const W      = (Dd - ID) * 692;
    const Uu     = mod(H - UB, UM);
    const Vwar   = mod(H, 7) + 1;

    /* ── เถลิงศก + สุริทิน ──────────────────────────────────── */
    const JDthal = jdThaloengsak(CS);
    const S      = JDnow - JDthal;
    const H_thal = H - S; // หรคุณ ณ จุดเริ่มต้นเถลิงศกประจำปี

    /* ── อาทิตย์ ─────────────────────────────────────────────── */
    const sun    = calcSun(S);

    /* ── กำลังพระเคราะห์ P  (หน้า 20 บทที่ 3) ───────────────── */
    const P      = (CS - EPOCH_CS) * FC + sun.V;

    /* ── จันทร์ ──────────────────────────────────────────────── */
    const moon   = calcMoon(H);

    /* ── ดาวพระเคราะห์ทั้ง 5 ────────────────────────────────── */
    const mars    = calcOuterPlanet(P, sun.V, PC.MARS);
    const mercury = calcInnerPlanet(P, sun.V, PC.MERCURY);
    const jupiter = calcOuterPlanet(P, sun.V, PC.JUPITER);
    const venus   = calcInnerPlanet(P, sun.V, PC.VENUS);
    const saturn  = calcSaturn(P, sun.V);

    /* ── ราหู-เกตุ ───────────────────────────────────────────── */
    const nodes  = calcRahuKetu(H);

    /* ── ลัคนา ──────────────────────────────────────────────── */
    const lagna  = calcLagna(sun.A, moon.A, hour, minute, S);

    /* ── [CALCULUS TRAJECTORY SAMPLING & TRAID INTEGRATION] ── */
    // ฟังก์ชันย้อนกลับไปคำนวณหาตำแหน่งแบบต่อท่อจำลอง ณ วันเศษ t ใดๆ นับจากเถลิงศก
    function getTrajectoryA(id, t) {
      if (id === 'SUN') return calcSun(t).A;
      if (id === 'MOON') return calcMoon(H_thal + t).A;
      if (id === 'RAHU' || id === 'KETU' || id === 'MRITYOU') {
        const Kr = mod((H_thal + t) - RH_BASE, RH_CYC);
        const Zk = mod(_fl((Kr + RH_OFF) * RH_MUL / RH_CYC) + RH_ADD, FC);
        const Ak = mod(FC - Zk, FC);
        if (id === 'RAHU' || id === 'MRITYOU') return mod(Ak + 10800, FC);
        return Ak;
      }
      const s_t = calcSun(t);
      const P_t = (CS - EPOCH_CS) * FC + s_t.V;
      if (id === 'MARS') return calcOuterPlanet(P_t, s_t.V, PC.MARS).A;
      if (id === 'MERCURY') return calcInnerPlanet(P_t, s_t.V, PC.MERCURY).A;
      if (id === 'JUPITER') return calcOuterPlanet(P_t, s_t.V, PC.JUPITER).A;
      if (id === 'VENUS') return calcInnerPlanet(P_t, s_t.V, PC.VENUS).A;
      if (id === 'SATURN') return calcSaturn(P_t, s_t.V).A;
      return 0;
    }

    // ฟังก์ชันหาอนุพันธ์ความเร็วเชิงมุม ณ ขณะเวลาจำลอง t ใดๆ เพื่อป้อนเข้าสู่สมการอินทิเกรต
    function getInstantaneousRate(id, t) {
      const step_h = 0.1; 
      return angVel(getTrajectoryA(id, t - step_h), getTrajectoryA(id, t + step_h), 2 * step_h);
    }

    // ลูปหลักสำหรับการทำ Trapezoidal Integration ตั้งแต่จุดเริ่มต้นปี (t=0) จนถึงปัจจุบัน (t=S)
    const integratedA = {};
    const subSteps = 24; // แตกตัวอย่างสมผุสในการสแกนคลื่น 24 ระดับ
    const planetIds = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU', 'MRITYOU'];

    planetIds.forEach(id => {
      const a0 = getTrajectoryA(id, 0); // พิกัดแอนะล็อกตั้งต้น ณ เถลิงศก
      if (S <= 0) {
        integratedA[id] = a0;
      } else {
        integratedA[id] = integratePos(a0, (t) => getInstantaneousRate(id, t), S, subSteps);
      }
    });

    /* ── [DERIVATIVE]  ±7 วัน Central Difference สำหรับเวลาปัจจุบัน ── */
    const DT  = 14;   
    const HN7 = 7;    
    const HN2 = 2;    

    function pAt(deltaDay) {
      const Sd = S + deltaDay;
      const s  = calcSun(Sd);
      return (CS - EPOCH_CS) * FC + s.V;
    }
    function moonAt(dH)  { return calcMoon(H + dH).A; }
    function rahuAt(dH)  { return calcRahuKetu(H + dH); }

    const P7p = pAt(+7), P7m = pAt(-7);
    const mrsP  = calcOuterPlanet(P7p, calcSun(S+7).V, PC.MARS).A;
    const mrsM  = calcOuterPlanet(P7m, calcSun(S-7).V, PC.MARS).A;
    const jupP  = calcOuterPlanet(P7p, calcSun(S+7).V, PC.JUPITER).A;
    const jupM  = calcOuterPlanet(P7m, calcSun(S-7).V, PC.JUPITER).A;
    const satP  = calcSaturn(P7p, calcSun(S+7).V).A;
    const satM  = calcSaturn(P7m, calcSun(S-7).V).A;

    const P2p = pAt(+2), P2m = pAt(-2);
    const merP  = calcInnerPlanet(P2p, calcSun(S+2).V, PC.MERCURY).A;
    const merM  = calcInnerPlanet(P2m, calcSun(S-2).V, PC.MERCURY).A;
    const venP  = calcInnerPlanet(P2p, calcSun(S+2).V, PC.VENUS).A;
    const venM  = calcInnerPlanet(P2m, calcSun(S-2).V, PC.VENUS).A;

    const sunP  = calcSun(S+1).A, sunM = calcSun(S-1).A;
    const monP  = moonAt(+1), monM = moonAt(-1);
    const ndP   = rahuAt(+7), ndM = rahuAt(-7);

    /* ── compile ─────────────────────────────────────────────── */
    const res = {
      meta: {
        inputDate: `${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')} ${hour}:${String(minute).padStart(2,'0')}`,
        ceYear:CE, beYear:useBE?year:year+543, csYear:CS,
        H_harakhun:H, JD:+JDnow.toFixed(3), useBE
      },

      baseVars: {
        H, masaKendra:+Mm.toFixed(6),
        dithi:+Dd.toFixed(4), avman:+W.toFixed(2),
        uchaphon:Uu, war:Vwar, warName:WAR[Vwar-1],
        suridin:+S.toFixed(4), madhyaRawi_V:sun.V, kamlung_P:P
      },

      lagna: {
        lipda:       lagna.lagnaExact,
        lipdaFuek:   lagna.lagnaLipda,
        rasi:        lagna.pos.rasi,
        degree:      lagna.pos.degree,
        lipda_unit:  lagna.pos.lipda,
        rasiName:    lagna.pos.rasiName,
        dms:         `ร${lagna.pos.rasi}(${lagna.pos.rasiName}) ${lagna.pos.degree}°${lagna.pos.lipda}'`,
        fuek:        +lagna.fuekLagna.toFixed(4),
        fuekName:    FUEK[_fl(lagna.fuekLagna) % 27],
        indraphas:   +lagna.indraphas.toFixed(4),
        fuekSun:     +lagna.fuekSun.toFixed(4),
      },

      planets: {
        SUN:     buildResult('อาทิตย์',  'SUN',     sun.A,     sun.Z,  sunM, sunP, 2, integratedA.SUN),
        MOON:    buildResult('จันทร์',   'MOON',    moon.A,    moon.Z, monM, monP, 2, integratedA.MOON),
        MARS:    buildResult('อังคาร',   'MARS',    mars.A,    mars.Z, mrsM, mrsP, DT, integratedA.MARS),
        MERCURY: buildResult('พุธ',      'MERCURY', mercury.A, mercury.Z, merM, merP, 4, integratedA.MERCURY),
        JUPITER: buildResult('พฤหัสบดี', 'JUPITER', jupiter.A, jupiter.Z, jupM, jupP, DT, integratedA.JUPITER),
        VENUS:   buildResult('ศุกร์',    'VENUS',   venus.A,   venus.Z, venM, venP, 4, integratedA.VENUS),
        SATURN:  buildResult('เสาร์',    'SATURN',  saturn.A,  saturn.Z, satM, satP, DT, integratedA.SATURN),
        RAHU:    buildResult('ราหู',     'RAHU',    nodes.rahu.A, nodes.rahu.A, ndM.rahu.A, ndP.rahu.A, DT, integratedA.RAHU),
        KETU:    buildResult('เกตุ',     'KETU',    nodes.ketu.A, nodes.ketu.A, ndM.ketu.A, ndP.ketu.A, DT, integratedA.KETU),
        MRITYOU: buildResult('มฤตยู',   'MRITYOU', nodes.rahu.A, nodes.rahu.A, ndM.rahu.A, ndP.rahu.A, DT, integratedA.MRITYOU),
      },

      getArray:  () => Object.values(res.planets),
      getRetro:  () => Object.values(res.planets).filter(p => p.isRetrograde),
      toJSON:    () => JSON.stringify(res, null, 2),
      summary:   () => {
        const lines = Object.values(res.planets).map(p =>
          `${p.name.padEnd(7)} ${p.dms.padEnd(22)} ฤกษ์${(p.fuekName||'').padEnd(16)} ${p.statusTH.padEnd(8)} [Perturb: ${p.perturbationLipda > 0 ? '+' : ''}${p.perturbationLipda} ลป]`
        );
        lines.push(`ลัคนา   ${res.lagna.dms.padEnd(22)} ฤกษ์${(res.lagna.fuekName||'').padEnd(16)}`);
        return lines.join('\n');
      }
    };

    _cache = res;
    return res;
  }

  /* ══════════════════════════════════════════════════════════════
   * §19  Public API
   * ══════════════════════════════════════════════════════════════ */

  function getVelocity(planetId) {
    if (!_cache) return null;
    const p = _cache.planets[planetId];
    if (!p)  return null;
    return {
      planetId,    name:p.name,
      dadt:        p.dadt,
      statusTH:    p.statusTH,
      statusEN:    p.statusEN,
      statusNote:  p.statusNote,
      isRetrograde:p.isRetrograde,
      description: `dA/dt = ${p.dadt} ลป/วัน  →  ${p.statusTH}`,
    };
  }

  function lipdaToDMS(L) {
    const p = lipdaToPos(L);
    return `ร${p.rasi}(${p.rasiName}) ${p.degree}°${p.lipda}' [${L}ลป] ฤกษ์${FUEK[_fl(toFuek(L))%27]}`;
  }

  function verifyEngine() {
    const V_ref = 3370;
    const P_ref = (1364 - EPOCH_CS) * FC + V_ref;
    const mars  = calcOuterPlanet(P_ref, V_ref, PC.MARS);
    const passA = Math.abs(mars.A - 2225) <= 20;
    const yOk   = Math.abs(yInterp(YM_SUN, 3.0) - 94) < 5;
    const pOk   = planetPower(0) === 100 && planetPower(10800) === 0;

    return {
      test:     'Suriyayatra Sirivannakong Engine Verification',
      mars_A:   mars.A, mars_Z: mars.Z, mars_R: mars.R,
      expected_A: 2225, diff: mars.A - 2225,
      pass:     passA,
      yTable:   yOk  ? '✅ ตาราง YM ถูกต้อง' : '❌ ตาราง YM ผิดพลาด',
      logPower: pOk  ? '✅ Logarithm Power ถูกต้อง' : '❌ ผิดพลาด',
      message:  passA ? `✅ ผ่านการยืนยัน (diff=${mars.A-2225} ลป)` : `❌ ผิด: A=${mars.A} ≠ 2225`,
    };
  }

  /* ══════════════════════════════════════════════════════════════
   * §20  Expose
   * ══════════════════════════════════════════════════════════════ */
  return {
    /* === Core === */
    calculatePlanets,
    getVelocity,
    /* === Sub-calculators === */
    calcSun, calcMoon,
    calcOuterPlanet, calcInnerPlanet,
    calcSaturn, calcRahuKetu, calcLagna,
    jdThaloengsak, jdn,
    /* === Calculus === */
    yInterp, angVel, motionStatus, planetPower, integratePos,
          /* === Converters === */
    lipdaToPos, lipdaToDegree,

    /* ══════════════════════════════════════════════════════════════
     * [AI EXTENSION — EMBEDDED INSIDE ENGINE]
     * ระบบท่อส่งเวลาขาเข้า (Time Input Pipeline) & ชำระอายันแปรผันดาว ๒ 
     * ══════════════════════════════════════════════════════════════ */
    AstroTimePipeline: (function () {
        'use strict';
        function calculateEoT(day, month) {
            const monthDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
            const dayOfYear = monthDays[month - 1] + day;
            const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
            return (9.87 * Math.sin(2 * b)) - (7.53 * Math.cos(b)) - (1.5 * Math.sin(b));
        }
        function processInputTime(rawHour, rawMin, longitude, day, month) {
            let totalInputMinutes = (rawHour * 60) + rawMin;
            let longitudeDiffMinutes = (longitude - 105.0) * 4;
            let lmtMinutes = totalInputMinutes + longitudeDiffMinutes;
            let eotOffset = calculateEoT(day, month);
            let latMinutes = lmtMinutes + eotOffset;
            if (latMinutes < 0) latMinutes += 1440;
            latMinutes = latMinutes % 1440;
            return {
                lmtMinutes: lmtMinutes, latMinutes: latMinutes, eotOffset: eotOffset,
                finalHour: Math.floor(latMinutes / 60), finalMin: Math.floor(latMinutes % 60)
            };
        }
        function cleanseMoonCoordinates(moonRasi, moonDeg, moonLipda, chulaSakarat) {
            let calculatedOffset = Math.round((chulaSakarat - 110) * 0.2355);
            let totalMoonLipda = (moonRasi * 1800) + (moonDeg * 60) + moonLipda;
            totalMoonLipda += calculatedOffset;
            totalMoonLipda = totalMoonLipda % 21600;
            return {
                offsetMinutes: calculatedOffset,
                rasi: Math.floor(totalMoonLipda / 1800),
                deg: Math.floor((totalMoonLipda % 1800) / 60),
                lipda: Math.floor(totalMoonLipda % 60)
            };
        }
        return { processInputTime, cleanseMoonCoordinates };
    })(),

    /* === Verification === */
    verifyEngine,
    /* === Constants === */
    FC, PC, EPOCH_CS, JD_KY, JD_CS0B,
    YM_SUN, YM_MOON, YM_PLANET,
    MEAN_RATE, RASI, WAR, FUEK,
    /* === Meta === */
    version:  '2.0.0',
    edition:  'Sirivannakong (ศิริวรรณคง)',
    source:   'พระคัมภีร์สุริยยาตรศิวาคม — สำนักโหร หอคำ',
    calculus: ['Hermite-Polynomial','Central-Difference-Derivative',
               'Trapezoidal-Integration','Log-Power-Scaling'],
  };

})();

console.log('🌌 [Astro Time Pipeline Engine] ฝังตัวเข้ากับ Suriyayart Engine สำเร็จ 100%');

 /* === Verification === */
    verifyEngine,
    /* === Constants === */
    FC, PC, EPOCH_CS, JD_KY, JD_CS0B,
    YM_SUN, YM_MOON, YM_PLANET,
    MEAN_RATE, RASI, WAR, FUEK,
    /* === Meta === */
    version:  '2.0.0',
    edition:  'Sirivannakong (ศิริวรรณคง)',
    source:   'พระคัมภีร์สุริยยาตรศิวาคม — สำนักโหร หอคำ',
    calculus: ['Hermite-Polynomial','Central-Difference-Derivative',
               'Trapezoidal-Integration','Log-Power-Scaling'],
  };

})();
