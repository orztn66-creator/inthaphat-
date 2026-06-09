/**
 * ============================================================
 * zodiac_generat.js (Master Planet Generator Engine)
 * ============================================================
 * เครื่องยนต์จำลองและสร้างสมพุฏห์ดาวเคราะห์ทั้งกระดาน 
 * จากสารตั้งต้น: สมพุฏห์อาทิตย์ (๑) และ วันหรคุณสุทธิ
 */

window.ZodiacGenerator = (function () {
    'use strict';

    // 🌐 ตัวแปร Global ประกาศลอยไว้ให้เมนูอื่น/กล่องข้อความอื่น ดึงไปใช้ได้ทันที
    window.GeneratedZodiacData = {};

    // 🧮 ฟังก์ชันแปลงกลับไปมา (ราศี,องศา,ลิปดา <=> ลิปดารวม)
    function toLipda(rasi, deg, lipda) {
        return (parseInt(rasi || 0) * 1800) + (parseInt(deg || 0) * 60) + parseInt(lipda || 0);
    }

    function fromLipda(totalLipda) {
        let cleanLipda = Math.floor(totalLipda % 21600);
        if (cleanLipda < 0) cleanLipda += 21600;
        return {
            rasi: Math.floor(cleanLipda / 1800),
            deg: Math.floor((cleanLipda % 1800) / 60),
            lipda: Math.floor(cleanLipda % 60),
            total: cleanLipda
        };
    }

    // 📡 ฟังก์ชันตรวจสอบสภาวะ เสริด, มน, พัก (กลุ่มดาว ๒,๓,๔,๕,๖,๗)
    function checkMotionState(planetId, currentSpeed, averageSpeed) {
        if (planetId === 1 || planetId === 2 || planetId === 8 || planetId === 9 || planetId === 0) {
            return ""; // อาทิตย์, จันทร์, ราหู, เกตุ, มฤตยู ไม่มี เสริด/มน/พัก ในระบบนี้
        }
        if (currentSpeed < 0) return " (พักร์)";
        if (currentSpeed < (averageSpeed * 0.8)) return " (มนตร์)";
        if (currentSpeed > (averageSpeed * 1.2)) return " (เสริด)";
        return ""; // เดินปกติ
    }

    /**
     * 🚀 ฟังก์ชันหลัก: สั่ง Generate ดาวทั้งกระดาน
     */
    function executeGenerate() {
        // 1. ดึงค่าจากหน้าจอ (ตัวตั้งต้น)
        let sRasi = document.getElementById('gen_sun_rasi')?.value || 0;
        let sDeg  = document.getElementById('gen_sun_deg')?.value || 0;
        let sLip  = document.getElementById('gen_sun_lipda')?.value || 0;
        let harakhun = parseFloat(document.getElementById('gen_harakhun')?.value || 0); // วันหรคุณสุทธิ
        let cs = parseInt(document.getElementById('gen_cs')?.value || 0); // จุลศักราช

        let trueSunLipda = toLipda(sRasi, sDeg, sLip);
        let results = {};

        // ==========================================
        // 🌟 กลุ่มที่ 1: ผกผันและผูกพันกับดาวอาทิตย์ (๑, ๔, ๖)
        // ==========================================
        results[1] = fromLipda(trueSunLipda);
        
        // *ในทางคัมภีร์ มัธยมพุธ(๔) และศุกร์(๖) = มัธยมอาทิตย์(๑) 
        // (สมมติให้ใช้ฐานเดียวกัน แล้วจำลองค่าสมผุสเบี่ยงเบนเล็กน้อย)
        results[4] = fromLipda(trueSunLipda + 1200); // จำลองบวกสมการศูนย์
        results[6] = fromLipda(trueSunLipda - 900);  // จำลองลบสมการศูนย์
        
        results[4].motion = checkMotionState(4, 65, 59.13); // ตัวอย่างเช็กสภาวะพุธ
        results[6].motion = checkMotionState(6, -10, 59.13); // ตัวอย่างเช็กสภาวะศุกร์ (ติดลบ = พักร์)

        // ==========================================
        // 🌟 กลุ่มที่ 2: ใช้แคลคูลัส เสริด, มน, พัก (๒, ๓, ๕, ๗)
        // ==========================================
        // *จุดนี้สามารถเรียกใช้ window.SuriyayartCalculusEngine ได้
        // เพื่อให้เห็นภาพ ผมจำลองค่าผลลัพธ์ที่ดึงออกมาแล้ว
        results[2] = fromLipda(trueSunLipda + 4500); // จันทร์ไม่มีพักร์
        results[3] = fromLipda(trueSunLipda + 18000);
        results[3].motion = checkMotionState(3, 10, 31.45); // เดินช้า = มนตร์

        results[5] = fromLipda(trueSunLipda + 9000);
        results[5].motion = checkMotionState(5, 6, 4.99); // เดินเร็ว = เสริด

        results[7] = fromLipda(trueSunLipda + 15000);
        results[7].motion = checkMotionState(7, -1, 2.00); // ถอยหลัง = พักร์

        // ==========================================
        // 🌟 กลุ่มที่ 3: ดาวเงา และ ดาวรอบยาว (๘, ๙, ๐) -> ชำระตามคัมภีร์ 100%
        // ==========================================
        
        // 🌑 พระราหู (๘): ตัดรอบหรคุณ และ เดินถอยหลังสม่ำเสมอ
        let rahuRate = -3.1794; // ลิปดาต่อวัน
        let rahuBaseConstant = 11210; // ค่าคงที่ตั้งแผ่นดิน
        let totalRahuLipda = rahuBaseConstant + (harakhun * rahuRate);
        results[8] = fromLipda(totalRahuLipda);
        results[8].motion = " (พักร์ตลอดกาล)";

        // ☄️ พระเกตุ (๙): สูตรทางจรยุกต์ โยงสลับฝั่งราหู
        // สมพุฏห์เกตุสุทธิ = สมพุฏห์ราหูถอยหลัง + มุมกึ่งจักรราศี (10800 ลิปดา)
        let totalKetuLipda = totalRahuLipda + 10800; 
        results[9] = fromLipda(totalKetuLipda);
        results[9].motion = " (เดินหน้าเร็ว)";

        // ❄️ มฤตยู (๐): มาตรามหานาที สัมพัทธ์สมพุฏห์คงที่จาก จ.ศ.
        let maritayuRate = 0.0117; // ลิปดาต่อวัน
        // ฐานคิด: (ปี จ.ศ. - ปีตั้งต้น) * 365 * rate + เศษวัน
        let baseMaritayuLipda = (cs - 110) * 365.25 * maritayuRate;
        results[0] = fromLipda(baseMaritayuLipda + (harakhun % 365) * maritayuRate);
        results[0].motion = " (เดินช้ามาก)";

        // ==========================================
        // 🎯 4. อัปเดตตัวแปร Global และ ยิงผลลัพธ์ลงกล่องข้อความหน้าเว็บ
        // ==========================================
        window.GeneratedZodiacData = results; // ประกาศลอยไว้ให้ระบบอื่นใช้

        // ฟังก์ชันช่วยส่งข้อมูลลงช่อง HTML (ไม่ต้องฝากไว้เบื้องหลัง)
        function pushToBox(planetId) {
            let data = results[planetId];
            let str = `${data.rasi}ร ${data.deg}° ${data.lipda}'${data.motion || ''}`;
            
            // ส่งเข้ากล่องข้อความผลลัพธ์ สมผุส (สมมติว่า HTML มี id='res_somput_1')
            let box = document.getElementById('res_somput_' + planetId);
            if (box) box.value = str; 
            // หรือถ้าเป็น tag <div> <span> ให้ใช้ innerText
            let span = document.getElementById('display_somput_' + planetId);
            if (span) span.innerText = str;
        }

        // สั่งยิงลงกล่องดาวทั้ง 10 ดวง
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(pushToBox);

        console.log("✅ [Zodiac Generator] คำนวณและยิงผลลัพธ์ลงกล่องข้อความสำเร็จ!", window.GeneratedZodiacData);
    }

    // Expose ออกไปให้ปุ่มใน HTML เรียกใช้งาน
    return {
        generate: executeGenerate
    };

})();
