/**
 * ============================================================
 * kub_inthaphat.js
 * เครื่องยนต์คำนวณ "ผังดวงขับอินทภาษ" และวิเคราะห์ "บาท-ฤกษ์-ฆาต"
 * (เมนู 5: อินทภาษ-บาทจันทร์)
 * ทำงานร่วมกับ AstroTimePipeline และ MahanateeEngine
 * ============================================================
 */

window.InthaphatKubEngine = (function () {
    'use strict';

    // ตารางเกณฑ์บาทเทศาคงที่ประจำราศี (ดึงหลักการจากฐานข้อมูลอินทภาษ)
    const rasiBathThesaTable = {
        0: { name: "เมษ", limit: 35 },  1: { name: "พฤษภ", limit: 45 }, 2: { name: "เมถุน", limit: 55 },
        3: { name: "กรกฎ", limit: 60 }, 4: { name: "สิงห์", limit: 55 }, 5: { name: "กันย์", limit: 45 },
        6: { name: "ตุลย์", limit: 45 }, 7: { name: "พิจิก", limit: 55 }, 8: { name: "ธนู", limit: 60 },
        9: { name: "มังกร", limit: 55 }, 10: { name: "กุมภ์", limit: 45 }, 11: { name: "มีน", limit: 35 }
    };

    // มาตรฐานเกณฑ์ "ฆาตบาทฤกษ์" และ "ฆาตอินทภาษ" ประจำลัคนาชะตา
    const khatCriteria = {
        0: { rasiName: "เมษ", khatPlanet: 3, description: "ฆาตโสรพะ (ดาว ๓ ทำมุมร้าย)" },
        1: { rasiName: "พฤษภ", khatPlanet: 7, description: "ฆาตพฤหสปติ (ดาว ๗ ทำมุมหักลงภพ)" },
        2: { rasiName: "เมถุน", khatPlanet: 1, description: "ฆาตอัมพุช (ดาว ๑ เสวยบาทขาด)" },
        3: { rasiName: "กรกฎ", khatPlanet: 6, description: "ฆาตชิวหา (ดาว ๖ ตัดหน้ายาม)" },
        4: { rasiName: "สิงห์", khatPlanet: 5, description: "ฆาตคชสาร (ดาว ๕ ตกมหาฆาต)" },
        5: { rasiName: "กันย์", khatPlanet: 2, description: "ฆาตมหิสา (ดาว ๒ อายันตางค์เพี้ยน)" },
        6: { rasiName: "ตุลย์", khatPlanet: 3, description: "ฆาตมยุรา (ดาว ๓ ขับตกช่องมุมมืด)" },
        7: { rasiName: "พิจิก", khatPlanet: 7, description: "ฆาตนรินทร์ (ดาว ๗ ทับจุดกำเนิด)" },
        8: { rasiName: "ธนู", khatPlanet: 4, description: "ฆาตพยัคฆ์ (ดาว ๔ เสวยบาทฤกษ์แตก)" },
        9: { rasiName: "มังกร", khatPlanet: 1, description: "ฆาตมหาสมุทร (ดาว ๑ หลุดสายพานเวลา)" },
        10: { rasiName: "กุมภ์", khatPlanet: 5, description: "ฆาตเทวา (ดาว ๕ สลับยามร้าย)" },
        11: { rasiName: "มีน", khatPlanet: 6, description: "ฆาตพัทธยา (ดาว ๖ ตกอันตรภาคชั้นขาด)" }
    };

    /**
     * 🔥 ฟังก์ชันขับดาวเคราะห์ลงภพผังอินทภาษ 12 ช่อง (ไม่ใช่วางตามราศีจักรตรงๆ)
     * @param {Object} suriyayartPlanets - พิกัดดาวดั้งเดิมจากสุริยยาตร {1: {rasi, deg, lipda}, 2: ...}
     * @param {number} chulaSakarat - ปีจุลศักราชเกิดจริง สำหรับส่งไปชำระดาวจันทร์
     * @param {number} latMinutes - เวลาสุริยคติแท้ (LAT) จากท่อส่งเวลาแรก
     */
    function generateDrivingChart(suriyayartPlanets, chulaSakarat, latMinutes) {
        let drivenGrid = Array(12).fill().map(() => []);
        let processedPlanets = {};

        // นำดาวจันทร์ (๒) วิ่งผ่านท่อชำระอายันตางค์สะสมก่อนตามกฎอินทภาษ
        if (suriyayartPlanets[2] && window.AstroTimePipeline) {
            let p2 = suriyayartPlanets[2];
            let cleansedMoon = window.AstroTimePipeline.cleanseMoonCoordinates(p2.rasi, p2.deg, p2.lipda, chulaSakarat);
            suriyayartPlanets[2] = { rasi: cleansedMoon.rasi, deg: cleansedMoon.deg, lipda: cleansedMoon.lipda, isCleansed: true };
        }

        // วิ่งลูปประมวลผลดาวทั้ง 10 ดวง (๑ ถึง ๐) เข้าสู่ระบบบาทเทศาขับวนภพ
        for (let planetNum in suriyayartPlanets) {
            let p = suriyayartPlanets[planetNum];
            
            // สเต็ปที่ 1: คำนวณเศษลิปดาสะสมและแปลงเป็นสัดส่วนบาทฤกษ์ภายในราศี
            let currentRasi = p.rasi;
            let rasiLimit = rasiBathThesaTable[currentRasi].limit;
            let totalInRasiLipda = (p.deg * 60) + p.lipda;
            
            // คำนวณหา "กำลังมุมกวาดขับดาว" (สอยดาวลงช่องยามตามพหิรนาที)
            let planetConsumedBath = (totalInRasiLipda / 1800) * rasiLimit;
            
            // สเต็ปที่ 2: วิ่งลูปหักลบเศษเวลามหานาทีแปรผัน เพื่อดีดดาวไปตกช่องภพที่แท้จริง
            let targetChamber = currentRasi;
            let remainingForce = planetConsumedBath;
            let firstRasiSpace = rasiLimit - planetConsumedBath;

            if (remainingForce > firstRasiSpace) {
                remainingForce -= firstRasiSpace;
                targetChamber = (targetChamber + 1) % 12;

                while (remainingForce > rasiBathThesaTable[targetChamber].limit) {
                    remainingForce -= rasiBathThesaTable[targetChamber].limit;
                    targetChamber = (targetChamber + 1) % 12;
                }
            }

            // คำนวณหาพิกัดเสวย "บาทฤกษ์เศษย่อย" (อันตรภาคชั้นดาว)
            let exactBathPosition = (remainingForce / rasiBathThesaTable[targetChamber].limit) * 4.0;
            let finalBaht = Math.floor(exactBathPosition) + 1; // ได้บาทที่ 1, 2, 3 หรือ 4

            // บันทึกค่าผลลัพธ์ดาวที่ขับลงช่องเสร็จเรียบร้อย
            processedPlanets[planetNum] = {
                originalRasi: p.rasi,
                drivenChamber: targetChamber,
                bahtNum: finalBaht,
                isMoonCleansed: p.isCleansed || false
            };

            // โยนเลขดาวลงไปจัดวางในตารางกระดานขับ 12 ช่อง
            drivenGrid[targetChamber].push(Number(planetNum));
        }

        return {
            drivenGrid: drivenGrid, // กระดาน 12 ช่องพร้อมเอาไปวาดลงหน้าจอแอป
            processedPlanets: processedPlanets
        };
    }

    /**
     * ⚠️ ฟังก์ชันวิเคราะห์เกณฑ์ "บาท-ฤกษ์-ฆาต" ประจำดวงชะตา
     * @param {Object} processedPlanets - ข้อมูลดาวที่ผ่านการขับช่องภพมาแล้ว
     * @param {number} lagnaRasi - ราศีลัคนาที่ได้จากระบบมหานาที 5 ชั้น
     */
    function analyzeBahtRoekKhat(processedPlanets, lagnaRasi) {
        let analysisResults = [];
        let rule = khatCriteria[lagnaRasi];

        analysisResults.push(`[สถานะลัคนา] ลัคนาสถิตราศี${rule.rasiName} สตาร์ทตรวจฆาตอินทภาษ`);

        // 1. ตรวจสอบฆาตประจำตัวดาวเคราะห์
        let targetKhatPlanet = rule.khatPlanet;
        if (processedPlanets[targetKhatPlanet]) {
            let kp = processedPlanets[targetKhatPlanet];
            // ถ้าดาวฆาตตามตำรา ขับมาทับลัคนา หรือทำมุมหักล้างในช่องขับ
            if (kp.drivenChamber === lagnaRasi) {
                analysisResults.push(`⚠️ ติดเกณฑ์มหาฆาตเร่งด่วน: ${rule.description} ทับช่องลัคนาขับ!`);
            } else {
                analysisResults.push(`[ปกติ] ${rule.description} แยกตัวอยู่ในช่องขับที่ ${kp.drivenChamber}`);
            }
        }

        // 2. ตรวจสอบเกณฑ์ "บาทฤกษ์แตก/บาทฤกษ์ขาด" (บาทที่ 4 หรือเศษปลายราศีอันตราย)
        for (let planetNum in processedPlanets) {
            let p = processedPlanets[planetNum];
            if (p.bahtNum === 4) {
                analysisResults.push(`⚡ ดาว ${planetNum} เสวย "บาทฤกษ์ขาด" (บาทที่ 4) ในช่องขับที่ ${p.drivenChamber} ต้องระวังเกณฑ์ฆาตแทรกซ้อน`);
            }
        }

        return {
            lagnaRasi: lagnaRasi,
            khatTargetPlanet: targetKhatPlanet,
            reports: analysisResults
        };
    }

    return {
        generateDrivingChart,
        analyzeBahtRoekKhat
    };
})();

console.log('🎲 [Inthaphat Driving Chart Engine] ผูกท่อระบบขับดาวและตรวจบาทฤกษ์ฆาตเสร็จสิ้น!');
