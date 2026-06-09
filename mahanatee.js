/**
 * ============================================================
 * mahanatee.js
 * เครื่องยนต์สับเวลาและขับลัคนาด้วย "มหานาที 5 ชั้น"
 * ทำงานเชื่อมต่อกับ AstroTimePipeline (รอรับค่า LAT)
 * ============================================================
 */

window.MahanateeEngine = (function () {
    'use strict';

    // ดึงฐานข้อมูลโครงสร้างและตารางบาทเทศาจากตรรกะอินทภาษ
    // (ในระบบจริง พี่สามารถใช้ fetch ดึงไฟล์ mahanatee.json มาใส่ตัวแปรนี้ได้ครับ)
    const mahanateeConfig = {
        "constants": { "solarToMahanateeFactor": 0.041666666666666664 },
        "rasiBathThesaTable": {
            0: 35, 1: 45, 2: 55, 3: 60, 4: 55, 5: 45,
            6: 45, 7: 55, 8: 60, 9: 55, 10: 45, 11: 35
        }
    };

    /**
     * 🔥 ฟังก์ชันขับลัคนามหานาที 5 ชั้น
     * @param {number} latMinutes - เวลาสุริยคติแท้ (LAT) ที่ส่งมาจากท่อแรก (Input Pipeline)
     * @param {number} sunRasi - ราศีที่ดาวอาทิตย์ (๑) สถิต ณ วันเกิด (0 = เมษ, 11 = มีน)
     * @param {number} sunDeg - องศาของดาวอาทิตย์ (๑) จากปฏิทินสุริยยาตร
     */
    function calculateLagna5Layers(latMinutes, sunRasi, sunDeg) {
        // [ชั้นที่ 1-2: แปลงเวลาสุริยะแท้ LAT ➡️ เป็นหน่วยมหานาที/นาทีโหร]
        // อ้างอิงจุดสตาร์ทจากจุดอุทัยกาลปานกลาง (06:00 น. หรือ 360 นาทีสากล)
        let timeOffsetFrom6 = latMinutes - 360.0;
        if (timeOffsetFrom6 < 0) {
            timeOffsetFrom6 += 1440; // กรณีเกิดก่อน 6 โมงเช้า ให้ทดเวลาข้ามวัน
        }

        // แปลงเป็นนาทีโหร (มหานาทีดิบ)
        let mahanateeRaw = timeOffsetFrom6 * mahanateeConfig.constants.solarToMahanateeFactor;

        // [ชั้นที่ 3: ซอยหน่วยลงเป็น "บาทเทศา"] 
        // 1 มหานาที = 4 บาทเทศา (หรือคิดตรงๆ คือ 1 บาทเทศา = 6 นาทีสากล)
        let totalBathThesa = mahanateeRaw * 4; 

        // [ชั้นที่ 4: ลูปสับเศษเวลาแปรผันย้อนพิกัดราศีจักร (เลียบลำดับราศี)]
        let currentRasi = sunRasi;
        
        // คำนวณหาบาทเทศาสะสมที่ดาวอาทิตย์เสวยไปแล้วในราศีเริ่มต้น (บัญญัติไตรยางศ์องศาอาทิตย์)
        let rasiLimit = mahanateeConfig.rasiBathThesaTable[currentRasi];
        let sunConsumedBathThesa = (sunDeg / 30.0) * rasiLimit;
        let remainingInFirstRasi = rasiLimit - sunConsumedBathThesa;

        let lagnaRasi = currentRasi;
        let finalRemainingBathThesa = totalBathThesa;

        // วิ่งลูปหักลบเศษเวลามหานาทีแปรผันรายราศี (ถ้าเศษเหลือเยอะจะขยับไปราศีถัดไป)
        if (finalRemainingBathThesa <= remainingInFirstRasi) {
            finalRemainingBathThesa = finalRemainingBathThesa;
        } else {
            finalRemainingBathThesa -= remainingInFirstRasi;
            lagnaRasi = (lagnaRasi + 1) % 12;

            while (finalRemainingBathThesa > mahanateeConfig.rasiBathThesaTable[lagnaRasi]) {
                finalRemainingBathThesa -= mahanateeConfig.rasiBathThesaTable[lagnaRasi];
                lagnaRasi = (lagnaRasi + 1) % 12;
            }
        }

        // [ชั้นที่ 5: อันตรภาคชั้นสกัดเศษท้ายสุดออกมาเป็น องศา และ ลิปดาลัคนา]
        let currentRasiMaxBathThesa = mahanateeConfig.rasiBathThesaTable[lagnaRasi];
        
        // อัตราส่วนแปลงจากบาทเทศาที่เหลือในราศีนั้น กลับมาเป็นพิกัด 30 องศาของราศี
        let exactDeg = (finalRemainingBathThesa / currentRasiMaxBathThesa) * 30.0;
        
        let lagnaDeg = Math.floor(exactDeg);
        let lagnaLipda = Math.floor((exactDeg - lagnaDeg) * 60);

        return {
            sourceLatMinutes: latMinutes,
            totalBathThesaUsed: totalBathThesa.toFixed(4),
            lagnaRasi: lagnaRasi,
            lagnaDeg: lagnaDeg,
            lagnaLipda: lagnaLipda,
            formatted: `ลัคนาสถิตราศี ${lagnaRasi} พิกัด ${lagnaDeg}° ${lagnaLipda}' (ระบบมหานาที 5 ชั้น)`
        };
    }

    return {
        calculateLagna5Layers
    };
})();

console.log('🚀 [Mahanatee 5-Layer Engine] ประกอบท่อขับลัคนาปลายน้ำเสร็จสมบูรณ์!');
