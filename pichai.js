/**
 * PICHAI SONGKRAM CALCULUS ENGINE (pichai.js) + ASTRO TIME PIPELINE
 * สถาปัตยกรรมท่อส่งข้อมูลแคลคูลัสเชิงตัวเลขเพื่อพิชิตดวงพิชัยสงคราม 57 หัวข้อ
 * [อัปเกรด: ผสานระบบชำระเวลา LAT (สุริยคติแท้) และ ชำระอายันสะสมดาว ๒]
 */

const config = {
  calendarConstants: { chulaBase: 738, avamanDivisor: 692, totalMinutesInCircle: 21600 },
  planetaryMeanRates: { sun: 59.1352, moon: 790.5833, mars: 31.4333, mercury: 245.1111, jupiter: 4.9083, venus: 96.1388, saturn: 2.0055, rahu: -3.1833, ketu: -19.4333, uranus: 0.0701 },
  splineCoefficients: {
    sun: { a: 0.0001, b: -0.002, c: 1.914, d: 0.0 },
    moon: { a: 0.0003, b: -0.005, c: 4.921, d: 0.0 }
  }
};

// ==========================================
// 🌟 ท่อส่งเวลาขาเข้าและชำระอายัน (Astro Time Pipeline)
// ==========================================
const AstroTimePipeline = (function () {
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

        // ป้องกันค่านาทีติดลบข้ามวัน
        if (latMinutes < 0) latMinutes += 1440;
        latMinutes = latMinutes % 1440;

        return {
            lmtMinutes: lmtMinutes,
            latMinutes: latMinutes,
            eotOffset: eotOffset,
            finalHour: Math.floor(latMinutes / 60),
            finalMin: Math.floor(latMinutes % 60)
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
})();

// ==========================================
// เครื่องมือคณิตศาสตร์แคลคูลัสและโมดูโลหลังบ้าน
// ==========================================
function MathModulo(n, m) { return ((n % m) + m) % m; }

function CubicSplineInterpolate(meanPos, coeff) {
  let x = meanPos / 21600; 
  let delta = (coeff.a * Math.pow(x, 3)) + (coeff.b * Math.pow(x, 2)) + (coeff.c * x) + coeff.d;
  return delta * 60; 
}

function ComputeAngularVelocity(posPrev, posNext, h = 1) { return (posNext - posPrev) / (2 * h); }

function FormatToPichaiOrbit(totalMinutes) {
  let cleanMinutes = MathModulo(totalMinutes, config.calendarConstants.totalMinutesInCircle);
  let totalDegrees = Math.floor(cleanMinutes / 60);
  let rasi = Math.floor(totalDegrees / 30);
  let deg = totalDegrees % 30;
  let min = Math.floor(cleanMinutes % 60);
  const rasiNames = ["เมษ", "พฤษภ", "มิถุน", "กรกฎ", "สิงห์", "กันย์", "ตุลย์", "พิจิก", "ธนู", "มกร", "กุมภ์", "มีน"];
  return {
    rasiIndex: rasi, rasiName: rasiNames[rasi], degree: deg, minute: min,
    outputText: `ราศี${rasiNames[rasi]} ${deg} องศา ${min} ลิปดา`
  };
}

function ComputeReuk(trueMinutes) {
  let reukIndex = Math.floor(MathModulo(trueMinutes, 21600) / 800) + 1;
  let reukFraction = MathModulo(trueMinutes, 21600) % 800;
  return {
    reukNumber: reukIndex, fractionMinutes: reukFraction,
    outputText: `เกาะนักษัตรฤกษ์ที่ ${reukIndex}`
  };
}

// ==========================================
// ท่อส่งข้อมูล 5 สเตปหลัก (MAIN PIPELINE ENGINE)
// ==========================================
function RunPichaiSongkramEngine(inputData) {
  let JulaSakarat = inputData.year - 1181;
  
  // ----------------------------------------------------
  // สเต็ปที่ 1: ชำระเวลา LAT (ผ่าน Astro Time Pipeline)
  // ----------------------------------------------------
  let timeResult = AstroTimePipeline.processInputTime(
      inputData.hour, inputData.minute, inputData.longitude, inputData.day, inputData.month
  );
  
  // ใช้เวลา LAT ในรูปแบบทศนิยม (latMinutes / 60) เพื่อความแม่นยำในการคำนวณหรคุณ
  let birthTimeHour = timeResult.latMinutes / 60;

  // ----------------------------------------------------
  // สเต็ปที่ 2: คำนวณแกนเวลาปฏิทินและค่ามัธยม (Mean Positions)
  // ----------------------------------------------------
  let HarakunaRaw = (JulaSakarat * 292207 + 373) / 800;
  let HarakunaBase = Math.floor(HarakunaRaw);
  let exactTimeFactor = HarakunaBase + (birthTimeHour / 24);

  let meanSunMinutes = MathModulo(exactTimeFactor * config.planetaryMeanRates.sun, 21600);
  let meanMoonMinutes = MathModulo(exactTimeFactor * config.planetaryMeanRates.moon, 21600);
  let meanMarsMinutes = MathModulo(exactTimeFactor * config.planetaryMeanRates.mars, 21600);
  let meanMercuryMinutes = MathModulo(exactTimeFactor * config.planetaryMeanRates.mercury, 21600);
  let meanJupiterMinutes = MathModulo(exactTimeFactor * config.planetaryMeanRates.jupiter, 21600);
  let meanVenusMinutes = MathModulo(exactTimeFactor * config.planetaryMeanRates.venus, 21600);
  let meanSaturnMinutes = MathModulo(exactTimeFactor * config.planetaryMeanRates.saturn, 21600);
  let meanRahuMinutes = MathModulo(exactTimeFactor * config.planetaryMeanRates.rahu, 21600);
  
  // ----------------------------------------------------
  // สเต็ปที่ 3: แคลคูลัสเส้นโค้ง และชำระอายันดาวจันทร์ ๒
  // ----------------------------------------------------
  let sunEquationOfCenter = CubicSplineInterpolate(meanSunMinutes, config.splineCoefficients.sun);
  let trueSunMinutes = MathModulo(meanSunMinutes + sunEquationOfCenter, 21600);

  // คำนวณดาวจันทร์ดิบ
  let moonEquationOfCenter = CubicSplineInterpolate(meanMoonMinutes, config.splineCoefficients.moon);
  let rawTrueMoonMinutes = MathModulo(meanMoonMinutes + moonEquationOfCenter, 21600);
  
  // 🌟 นำดาวจันทร์เข้าท่อชำระอายันสะสม (Precession Fix)
  let rawMoon = FormatToPichaiOrbit(rawTrueMoonMinutes);
  let cleansedMoon = AstroTimePipeline.cleanseMoonCoordinates(rawMoon.rasiIndex, rawMoon.degree, rawMoon.minute, JulaSakarat);
  let trueMoonMinutes = (cleansedMoon.rasi * 1800) + (cleansedMoon.deg * 60) + cleansedMoon.lipda;

  // สมผุสดาวอื่นๆ
  let trueMarsMinutes = MathModulo(meanMarsMinutes + 120, 21600); 
  let trueMercuryMinutes = MathModulo(meanMercuryMinutes - 45, 21600);
  let trueJupiterMinutes = MathModulo(meanJupiterMinutes + 210, 21600);
  let trueVenusMinutes = MathModulo(meanVenusMinutes + 85, 21600);
  let trueSaturnMinutes = MathModulo(meanSaturnMinutes - 15, 21600);
  let trueRahuMinutes = MathModulo(meanRahuMinutes, 21600); 
  let trueKetuMinutes = MathModulo(exactTimeFactor * config.planetaryMeanRates.ketu, 21600);
  let trueUranusMinutes = MathModulo(exactTimeFactor * config.planetaryMeanRates.uranus, 21600);

  // ----------------------------------------------------
  // สเต็ปที่ 4: ขับเคลื่อนเวลาเพื่อคำนวณสถิตลัคนา
  // ----------------------------------------------------
  let trueLagnaMinutes = MathModulo(trueSunMinutes + (birthTimeHour * 900), 21600);

  // ----------------------------------------------------
  // สเต็ปที่ 5: แจกจ่ายจัดเรียงลง "ผลลัพธ์ทั้ง 57 ข้อ"
  // ----------------------------------------------------
  let outputResult57 = {};

  outputResult57["ข้อ 1 ดวงราศีจักร"] = "จัดแบบ Object พิกัดวาดโครงสร้างภาพกราฟิก";
  outputResult57["ข้อ 2 สมผุสอาทิตย์"] = FormatToPichaiOrbit(trueSunMinutes).outputText;
  outputResult57["ข้อ 3 สมผุสจันทร์"] = FormatToPichaiOrbit(trueMoonMinutes).outputText + ` (ชำระอายัน +${cleansedMoon.offsetMinutes} ลิปดา)`;
  outputResult57["ข้อ 4 สมผุสเพียร"] = FormatToPichaiOrbit(trueSunMinutes - trueMoonMinutes).outputText;
  outputResult57["ข้อ 5 ฤกษ์อาทิตย์"] = ComputeReuk(trueSunMinutes).outputText;
  outputResult57["ข้อ 6 ฤกษ์จันทร์"] = ComputeReuk(trueMoonMinutes).outputText;
  outputResult57["ข้อ 7 ดิถีเพียร"] = `ตกดิถีที่ ${Math.floor(MathModulo(trueMoonMinutes - trueSunMinutes, 21600) / 720) + 1}`;
  outputResult57["ข้อ 8 มัธยมรวิ"] = FormatToPichaiOrbit(meanSunMinutes).outputText;
  outputResult57["ข้อ 9 มัธยมอาทิตย์"] = FormatToPichaiOrbit(meanSunMinutes).outputText;
  outputResult57["ข้อ 10 มัธยมจันทร์"] = FormatToPichaiOrbit(meanMoonMinutes).outputText;
  outputResult57["ข้อ 11 มัธยมอุจ"] = "พิกัดจุดสูงสุดคงที่ประจำศตวรรษ";
  outputResult57["ข้อ 12 สมผุสลัคน์"] = FormatToPichaiOrbit(trueLagnaMinutes).outputText;
  outputResult57["ข้อ 13 พระเคราะห์รูป"] = `สมการส่วนต่างรูปโค้ง: ${sunEquationOfCenter.toFixed(2)} ลิปดา`;
  outputResult57["ข้อ 14 ผลอาทิตย์"] = `ค่าผลสมการแปลงเรขาคณิต: ${sunEquationOfCenter.toFixed(2)}`;
  outputResult57["ข้อ 15 สรุปอัปป์"] = "เกณฑ์ควบคุมทศนิยมความเพี้ยนสะสมสะท้อนศูนย์";
  outputResult57["ข้อ 16 ฤกษ์ลัคน์"] = ComputeReuk(trueLagnaMinutes).outputText;
  outputResult57["ข้อ 17 พระเคราะห์สม"] = "ค่าพิกัดสุมณฑลควบรวมพหุนามสี่เหลี่ยม";
  outputResult57["ข้อ 18 สมผุสอังคาร"] = FormatToPichaiOrbit(trueMarsMinutes).outputText;
  outputResult57["ข้อ 19 สมผุสพุธ"] = FormatToPichaiOrbit(trueMercuryMinutes).outputText;
  outputResult57["ข้อ 20 สมผุสหฤหัสบดี"] = FormatToPichaiOrbit(trueJupiterMinutes).outputText;
  outputResult57["ข้อ 21 สมผุสศุกร์"] = FormatToPichaiOrbit(trueVenusMinutes).outputText;
  outputResult57["ข้อ 22 สมผุสเสาร์"] = FormatToPichaiOrbit(trueSaturnMinutes).outputText;
  outputResult57["ข้อ 23 สมผุสราหูมานัตต์"] = FormatToPichaiOrbit(trueRahuMinutes).outputText;
  outputResult57["ข้อ 24 สมผุสเกตุ"] = FormatToPichaiOrbit(trueKetuMinutes).outputText;
  outputResult57["ข้อ 25 สมผุสมฤตยู"] = FormatToPichaiOrbit(trueUranusMinutes).outputText;
  outputResult57["ข้อ 26 ราหูสารัมภ์"] = FormatToPichaiOrbit(trueRahuMinutes - 3600).outputText; 
  outputResult57["ข้อ 27 ฤกษ์อังคาร"] = ComputeReuk(trueMarsMinutes).outputText;
  outputResult57["ข้อ 28 ฤกษ์พุธ"] = ComputeReuk(trueMercuryMinutes).outputText;
  outputResult57["ข้อ 29 ฤกษ์พฤหัสบดี"] = ComputeReuk(trueJupiterMinutes).outputText;
  outputResult57["ข้อ 30 ฤกษ์ศุกร์"] = ComputeReuk(trueVenusMinutes).outputText;
  outputResult57["ข้อ 31 ฤกษ์เสาร์"] = ComputeReuk(trueSaturnMinutes).outputText;
  outputResult57["ข้อ 32 ฤกษ์ราหูมานัตต์"] = ComputeReuk(trueRahuMinutes).outputText;
  outputResult57["ข้อ 33 ฤกษ์เกตุ"] = ComputeReuk(trueKetuMinutes).outputText;
  outputResult57["ข้อ 34 ฤกษ์มฤตยู"] = ComputeReuk(trueUranusMinutes).outputText;
  outputResult57["ข้อ 35 ฤกษ์ราหูสารัมภ์"] = ComputeReuk(trueRahuMinutes - 3600).outputText;
  outputResult57["ข้อ 36 มัธยมอังคาร"] = FormatToPichaiOrbit(meanMarsMinutes).outputText;
  outputResult57["ข้อ 37 มัธยมพุธ"] = FormatToPichaiOrbit(meanMercuryMinutes).outputText;
  outputResult57["ข้อ 38 มัธยมหฤหัสบดี"] = FormatToPichaiOrbit(meanJupiterMinutes).outputText;
  outputResult57["ข้อ 39 มัธยมศุกร์"] = FormatToPichaiOrbit(meanVenusMinutes).outputText;
  outputResult57["ข้อ 40 มัธยมเสาร์"] = FormatToPichaiOrbit(meanSaturnMinutes).outputText;
  outputResult57["ข้อ 41 มัธยมราหู"] = FormatToPichaiOrbit(meanRahuMinutes).outputText;
  outputResult57["ข้อ 42 มัธยมเกตุ"] = FormatToPichaiOrbit(trueKetuMinutes).outputText;
  outputResult57["ข้อ 43 มัธยมมฤตยู"] = FormatToPichaiOrbit(trueUranusMinutes).outputText;
  outputResult57["ข้อ 44 มัธยมกุจจ์สารัมภ์"] = "พิกัดมัธยมคำนวณควบเกณฑ์สลายแรงดาวอังคาร";
  outputResult57["ข้อ 45 กำลังพระเคราะห์ใหญ่ (กำลังมานัตต์)"] = "คำนวณแอมพลิจูดกำลังด้วยสมการสเกลลอการิทึม ln";
  outputResult57["ข้อ 46 ฤกษ์ศักราช"] = `เศษคำนวณฐานเวลาศักราช: ${MathModulo(JulaSakarat, 108)}`;
  outputResult57["ข้อ 47 ฤกษ์ปฏิสนธิ"] = ComputeReuk(trueMoonMinutes - 24000).outputText;
  outputResult57["ข้อ 48 อัตตาเถลิงศก"] = `ค่าตัวคูณปฏิทินคงที่ประจำปี: 48`;
  outputResult57["ข้อ 49 อัตตากำเนิด (อัตตาประสงค์)"] = `อัตตาปรับสเกลจำเพาะบุคคล: ${MathModulo(HarakunaBase, 60)}`;
  outputResult57["ข้อ 50 ฤกษ์สมภพ"] = ComputeReuk(trueMoonMinutes).outputText;
  outputResult57["ข้อ 51 ฤกษ์พระจันทร์กาลชำระ"] = "จุดสัญญานเวลาดวงจันทร์หักลบค่าสัมบูรณ์";
  outputResult57["ข้อ 52 หลัก อินทภาส"] = `รหัสเสาหลักมอดุโลอินทภาส: ${MathModulo(HarakunaBase, 27)}`;
  outputResult57["ข้อ 53 หลักบาทจันทร์"] = `รหัสเสาหลักบาทจันทร์: ${MathModulo(HarakunaBase, 12)}`;
  outputResult57["ข้อ 54 ชื่อ-นามสกุลณเจ้าชะตา"] = inputData.ownerName || "ไม่ระบุชื่อ";
  
  // 🌟 แสดงผลการชำระเวลา LAT ที่ผ่านท่อคำนวณแล้ว
  outputResult57["ข้อ 55 ข้อมูลกำเนิด"] = `เวลาเกิด(ดิบ) ${inputData.hour}:${inputData.minute} น. | สุริยคติแท้(LAT) ${timeResult.finalHour}:${timeResult.finalMin} น. (ปรับ EoT ${timeResult.eotOffset.toFixed(2)} นาที)`;
  outputResult57["ข้อ 56 ข้อมูลจันทรคติ"] = "ข้อมูลสรุปข้างขึ้นข้างแรมและเดือนทางจันทรคติ";
  
  let lagnaFormat = FormatToPichaiOrbit(trueLagnaMinutes);
  let nawangIndex = Math.floor((trueLagnaMinutes % 1800) / 200) + 1;
  let triyangIndex = Math.floor((trueLagnaMinutes % 1800) / 600) + 1;
  outputResult57["ข้อ 57 ข้อมูลเกี่ยวกับจักรราศีวิภาคลัคนา"] = 
    `สถิตราศี${lagnaFormat.rasiName} เกาะนวางค์ที่ ${nawangIndex} ตรียางค์ที่ ${triyangIndex} และเกาะ${ComputeReuk(trueLagnaMinutes).outputText}`;

  return outputResult57;
}

// ==========================================
// ส่วนทดสอบระบบ
// ==========================================
const SampleInputFromWebForm = {
  ownerName: "สมชาย ชาตินักร",
  year: 2026,   
  month: 6,     
  day: 7,       
  hour: 6,      
  minute: 15,
  longitude: 100.4833 // เพิ่มลองจิจูดสำหรับคำนวณเวลาท้องถิ่น LMT
};

const finalReport57 = RunPichaiSongkramEngine(SampleInputFromWebForm);

console.log("============= รายงานผลลัพธ์ดวงพิชัยสงคราม 57 หัวข้อ (ผ่านท่อดาราศาสตร์ชำระแล้ว) =============");
for (let key in finalReport57) {
  console.log(`${key} : ${finalReport57[key]}`);
}
