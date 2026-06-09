/**
 * ========================================================================
 * YAM WISETJINDA EXTENDED ENGINE (เครื่องยนต์วิชาจับยามวิเศษจินดาพิสดาร)
 * รองรับการคำนวณยาม 5 ชั้น เกณฑ์โลกธาตุประสาน และระบบวิเคราะห์นิมิตกรรมหน้าบ้าน
 * ========================================================================
 */

const YamWisetJindaEngine = {
    _config: null,

    /**
     * โหลดฐานข้อมูลข้อกำหนดคัมภีร์ยาม (ดึงข้อความจาก JSON)
     */
    init: function(configData) {
        this._config = configData;
        console.log(`[YamWisetJinda] 🔱 คัมภีร์ ${this._config.scripture_name} ติดตั้งเข้าระบบเรียบร้อย`);
    },

    /**
     * 🔥 CORE PIPELINE: คำนวณและคัดกรองเกณฑ์ยามย่อยวิเศษจินดา
     * @param {number} currentMinutes - เวลาปัจจุบันนับจาก 06:00 น. (หรือเวลาที่ผู้ใช้ตั้งคำถาม)
     * @param {Object} nimitContext - ข้อมูลนิมิตรอบตัวผู้ถาม { direction: 'east', garment: 'bright_tone' }
     */
    evaluateAdvancedYam: function(currentMinutes, nimitContext = {}) {
        if (!this._config) {
            console.error("กรุณาติดตั้งสเปคคัมภีร์ผ่านฟังก์ชัน init ก่อน");
            return null;
        }

        // 1. กลไกแคลคูลัสยาม: ซอยยามพหินาที 5 ชั้น (มหานาที)
        let layersResult = [];
        let remainingMin = currentMinutes;
        
        for (let i = 0; i < this._config.constants.yam_layers; i++) {
            // คำนวณหาค่าสเกลาร์ประจำชั้นยาม
            let layerWeight = Math.floor(remainingMin / (this._config.constants.minutes_per_layer / (i + 1)));
            let finalValue = (layerWeight % 7) + 1; // มอดุโลตามเกณฑ์เกณฑ์วันทั้ง ๗
            layersResult.push(finalValue);
        }

        // 2. สกัดพิกัดยามสำคัญเพื่อเช็คเงื่อนไข
        const y3 = layersResult[2]; // ชั้นแกนกลาง
        const y4 = layersResult[3]; // ชั้นกระแส
        const y5 = layersResult[4]; // ชั้นปฏิสนธิ (มหานาทีทอง)

        // 3. เครื่องยนต์คัดกรองกฎ ๑๐๐ ข้อหมวดยาม (Rule Matrix Scanner)
        let matchedRules = [];
        
        // กฎที่ 1: ฉัตรทองคำ
        if ((y5 === 1 || y5 === 4)) {
            let r = this._config.specialized_sub_rules.find(rule => rule.id === "YAM_JINDA_01");
            if (r) matchedRules.push(r);
        }
        // กฎที่ 2: นกเค้าแมวสะบัดปีก (ยามสูญตตา)
        if (Math.abs(y3 - y5) === 3) {
            let r = this._config.specialized_sub_rules.find(rule => rule.id === "YAM_JINDA_02");
            if (r) matchedRules.push(r);
        }
        // กฎที่ 3: ยามพรางตัวพยัคฆ์
        if (y4 === 0) { // สมมุติค่าสุดพิกัดทางคณิตศาสตร์
            let r = this._config.specialized_sub_rules.find(rule => rule.id === "YAM_JINDA_03");
            if (r) matchedRules.push(r);
        }

        // 4. ถอดรหัสระบบนิมิตสิ่งแวดล้อม (Nimit Interpreter)
        let nimitAnalysis = "";
        if (nimitContext.direction && this._config.nimit_matrix.directions[nimitContext.direction]) {
            nimitAnalysis += `[ทิศทางนิมิต] ${this._config.nimit_matrix.directions[nimitContext.direction]} `;
        }
        if (nimitContext.garment && this._config.nimit_matrix.garment_colors[nimitContext.garment]) {
            nimitAnalysis += `[พัสตราภรณ์ผู้ถาม] ${this._config.nimit_matrix.garment_colors[nimitContext.garment]}`;
        }

        // 5. หา Resonance ธาตุเวลาประจำนาทีนั้น
        const elementId = (y5 % 4) + 1;
        const currentElement = this._config.yam_definitions.element_resonance[elementId] || "ธาตุแปรปรวน";

        return {
            raw_layers: layersResult,
            detected_element: currentElement,
            triggered_yam_rules: matchedRules,
            nimit_summary: nimitAnalysis || "ไม่มีการระบุนิมิตภายนอก"
        };
    }
};

// Expose ออกไปให้ระบบศูนย์กลางเรียกใช้ได้ร่วมกัน
if (typeof window !== 'undefined') {
    window.YamWisetJindaEngine = YamWisetJindaEngine;
}
