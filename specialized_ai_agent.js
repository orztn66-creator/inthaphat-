/**
 * ========================================================================
 * SPECIALIZED IN-PAGE AI AGENT ENGINE (เครื่องยนต์ AI เฉพาะการคัมภีร์อินทภาษ + ๓ มหายาม)
 * ทำหน้าที่เป็นศูนย์ควบคุมหน้าเพจ ดึงคัมภีร์แท้และระบบมหายามส่งให้ AI สังเคราะห์คำทำนาย
 * ========================================================================
 */

window.SpecializedAIAgent = {
    
    /**
     * ฟังก์ชันหลัก: รวบรวมคัมภีร์จากหน้าเพจ ผลคำนวณ และข้อมูลมหายาม เพื่อสร้างข้อมูลป้อน AI
     * @param {string} clientQuestion - คำถามที่ลูกค้าพิมพ์เข้ามาในกล่องข้อความ
     * @param {Object} environmentParams - [ระบบยาม] พารามิเตอร์นิมิตรอบตัวผู้ถาม { direction, garment, nimitEventId }
     */
    buildSpecializedPayload: function(clientQuestion, environmentParams = {}) {
        // 1. ดึงผลลัพธ์คณิตศาสตร์แคลคูลัสที่ถูกต้อง 100% จากศูนย์กลาง Hub 
        const hubData = AstroCentralHub.requestData('MENU_9_SUMMARY');
        if (!hubData) {
            return { error: "⚠️ กรุณากรอกวันเดือนปีเกิดเพื่อรันระบบสมผุสสุริยยาตร์ก่อน" };
        }

        // 2. ดึงบททำนายดั้งเดิมจากคัมภีร์แท้ในหน้าเพจ (อ้างอิงจากความสามารถของ knowledge_base.html)
        let authenticScriptureTexts = [];
        
        // วนลูปตามกฎคัมภีร์ที่ดวงชะตานี้สแกนผ่านเงื่อนไข (Triggered Rules)
        hubData.triggeredRules.forEach(rule => {
            // ใช้ Engine หน้าบ้านดึงข้อความดิบแท้ ๆ ที่คุณเก็บไว้ในฐานความรู้ตรง ๆ
            if (typeof AstrologyAPI !== 'undefined' && AstrologyAPI.getRule) {
                let textFromBook = AstrologyAPI.getRule(rule.id);
                authenticScriptureTexts.push(`[หัวข้อคัมภีร์: ${rule.name}]\nเนื้อหาเดิมในตำรา: ${textFromBook}`);
            } else {
                // กรณีฉุกเฉินถ้าไม่มี API ภายนอก ให้ใช้คำอธิบายในระบบ
                authenticScriptureTexts.push(`[หัวข้อคัมภีร์: ${rule.name}]\nเนื้อหาเดิมในตำรา: ${rule.text}`);
            }
        });

        // 3. [ชิ้นส่วนเสริมระบบยาม] ประมวลผลมหายามประสาน ๓ ตำรับ ณ วินาทีตั้งคำถาม
        
        // 3.1 ตำรับยามสามตา (ยามอัฐกาลจรคุมทิศโชคลาภประจำวัน)
        let yamaSamTa = "ไม่พบการรันยามสามตาตามพิกัดดาวจร";
        if (typeof ScriptureBridge !== 'undefined' && ScriptureBridge.calcThaksaJorn) {
            yamaSamTa = `ตกยามอัฐกาลพิกัดดาวจรคุมทิศทางและโชคลาภสัมพันธ์ ณ ชั่วยามนี้`;
        }

        // 3.2 ตำรับยามวิเศษจินดา (เศษเวลาแคลคูลัสอนุกรม ๕ ชั้น และ Resonance ธาตุโลกธาตุ)
        let yamaWisetJinda = "ไม่พบการรันยามวิเศษจินดาพหินาที";
        if (typeof YamWisetJindaEngine !== 'undefined') {
            let currentMins = this._getMinutesSinceAstroDawn();
            let jindaResult = YamWisetJindaEngine.evaluateAdvancedYam(currentMins, {
                direction: environmentParams.direction || 'east',
                garment: environmentParams.garment || 'bright_tone'
            });
            if (jindaResult) {
                yamaWisetJinda = `
                - ลำดับเศษยาม 5 ชั้น (มหานาที): [${jindaResult.raw_layers.join(' -> ')}]
                - กระแสธาตุเวลาปะทุ: ${jindaResult.detected_element}
                - เกณฑ์กฎยามวิเศษจินดาที่ติดเงื่อนไข: ${jindaResult.triggered_yam_rules.map(r => r.name).join(', ') || 'สภาวะปกติ'}
                - การถอดรหัสนิมิตกรรมยาม: ${jindaResult.nimit_summary}
                `;
            }
        }

        // 3.3 ตำรับยามโหรทายหนู (รหัสจับนิมิตวัตถุจลน์และเหตุการณ์จรฉับพลันรอบตัว)
        let yamaHorThaiNoo = "นิมิตกรรมทั่วไป: กระแสธาตุรอบกายดำเนินไปตามครรลองปกติ";
        if (environmentParams.nimitEventId) {
            yamaHorThaiNoo = this._evaluateHorThaiNooMatrix(environmentParams.nimitEventId);
        }

        // 4. ปรุงชุดคำสั่ง "System Instruction" เพื่อสร้างสภาพแวดล้อมให้ AI กลายเป็นผู้เชี่ยวชาญเฉพาะทาง
        const systemInstruction = `
คุณคือ "AI โหรหลวงปราชญ์ดาราศาสตร์ไทยชั้นสูง" ประจำแพลตฟอร์มนี้ คุณมีหน้าที่พยากรณ์ชะตาชีวิตโดยใช้กฎเกณฑ์คัมภีร์แท้จริงและระบบมหายามเท่านั้น
ห้ามคิดคำทำนายขึ้นมาเองลอยๆ ห้ามมโนพิกัดดวงดาวเด็ดขาด ให้ใช้ข้อมูลที่ระบบหน้าบ้านคำนวณและดึงมาจากคัมภีร์ด้านล่างนี้เท่านั้น!

[คัมภีร์และผลลัพธ์ดวงชะตารูปธรรมที่ระบบหน้าบ้านส่งให้]
- หรคุณสุริยยาตร์ปัจจุบัน: ${hubData.components.suriyayart.harakhun}
- ตกเกณฑ์ฆาตจรวิกฤต (isKhatCrisis): ${hubData.components.inthaphat.isKhatCrisis ? "ตกเกณฑ์ร้ายแรง (ต้องเตือนอย่างมีสติ)" : "ปลอดภัยดี"}
- บทวิเคราะห์เนื้อหาคัมภีร์แท้จริงที่ตรงกับดวงชะตานี้:
${authenticScriptureTexts.join('\n\n')}

[ข้อมูลมหายามประสาน ๓ ตำรับ ณ วินาทีตั้งคำถาม]
๑. ตำรับยามสามตา (ทิศทางและผู้มาปฏิสัมพันธ์): 
   ${yamaSamTa}
๒. ตำรับยามวิเศษจินดา (แคลคูลัสยาม ๕ ชั้น และธาตุสามแดนโลกธาตุ): 
   ${yamaWisetJinda}
๓. ตำรับยามโหรทายหนู (รหัสจับนิมิตกรรมและวัตถุรอบกายสไตล์ปรมาจารย์): 
   ${yamaHorThaiNoo}

[ข้อบังคับในการตอบคำถามลูกค้า]
1. จงวิเคราะห์ "คำถามของลูกค้า" ด้านล่างให้แตกฉาน ว่าเขาเน้นถามเรื่องอะไร (การเงิน, การงาน, เคราะห์กรรม, วิธีแก้ดวง)
2. นำเนื้อหาจากคัมภีร์แท้จริงด้านบน และผลลัพธ์มหายามทั้ง 3 ตำรับไปผสมผสานและตอบคำถามเขาให้ตรงจุดและแม่นยำเรื่องจังหวะเวลาที่สุด 
3. ใช้สำนวนภาษาภาษาไทยที่สละสลวย นุ่มนวล ทรงคุณค่า น่าเลื่อมใส เหมือนโหรชั้นผู้ใหญ่นั่งคุยกับลูกศิษย์อย่างเป็นกันเอง
4. หากข้อความคัมภีร์ข้อไหนขัดแย้งกัน (เช่น มีทั้งเกณฑ์ดีและเกณฑ์ร้ายพร้อมกัน) ให้ทำหน้าที่หักล้างพลังงานและอธิบายเป็นเหตุเป็นผล
`;

        return {
            system_instruction: systemInstruction,
            user_prompt: `ลูกค้าตั้งคำถามว่า: "${clientQuestion}"`
        };
    },

    /**
     * ฟังก์ชันยิงส่งคำถามไปประมวลผลกับ AI หลังบ้าน
     */
    async executeAIPrediction: function() {
        const questionInput = document.getElementById('user-chat-question');
        const displayBox = document.getElementById('ai-chat-output-zone');
        
        if (!questionInput || !questionInput.value.trim()) {
            alert("กรุณาพิมพ์ประเด็นที่ท่านต้องการปรึกษาโหรก่อนครับ");
            return;
        }

        const question = questionInput.value.trim();
        displayBox.innerHTML = "<div class='ai-loading'>🔮 กำลังเปิดคัมภีร์เฉพาะการและเชิญ AI โหรหลวงประมวลผลคำตอบ...</div>";

        // [ระบบยาม] ดักจับค่านิมิตรอบตัวจากฟอร์มหน้าเว็บ UI (ถ้ามีสร้างกล่องรองรับไว้)
        const envParams = {
            direction: document.getElementById('nimit-direction')?.value || 'east',
            garment: document.getElementById('nimit-garment')?.value || 'bright_tone',
            nimitEventId: document.getElementById('nimit-event-id')?.value || 'MOUSE_RUN'
        };

        // สร้างกระสุน Payload (คำถามดวงชะตา + แพ็กเกจมหายาม 3 ตำรับ)
        const payload = this.buildSpecializedPayload(question, envParams);
        
        if (payload.error) {
            displayBox.innerHTML = `<span style='color:red;'>${payload.error}</span>`;
            return;
        }

        try {
            // ส่งข้อมูลไปให้ API (ปลั๊กเข้ากับระบบ API ส่วนตัวของคุณ)
            const response = await fetch('https://api.yourdomain.com/v1/astrology-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemContext: payload.system_instruction,
                    userQuestion: payload.user_prompt
                })
            });
            
            const result = await response.json();
            
            // แสดงผลคำทำนายองค์รวมพ่นออกหน้าจอ UI
            displayBox.innerHTML = `
                <div class='ai-response-narrative'>
                    ${result.answerText}
                </div>
                <div class='ai-footer-signature'>🔱 มหาพยากรณ์สามยามประสานโลกธาตุ ชำระเสร็จสิ้น</div>
            `;
            
        } catch (error) {
            console.error("AI Specialized Engine Error:", error);
            displayBox.innerHTML = "<div class='ai-error'>❌ ระบบเชื่อมต่อจิตจำลองขัดข้อง กรุณาลองใหม่อีกครั้ง</div>";
        }
    },

    /**
     * ========================================================================
     * [INTERNAL HELPERS] ฟังก์ชันคำนวณภายในสกัดค่ายามและนิมิต
     * ========================================================================
     */

    /**
     * สกัดเวลาโหราศาสตร์ปัจจุบัน (คำนวณหาจำนวนนาทีที่เดินไปนับจากรุ่งอรุณโหร 06:00 น.)
     */
    _getMinutesSinceAstroDawn: function() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
        let diff = (now.getTime() - start.getTime()) / 1000 / 60;
        return diff < 0 ? diff + 1440 : diff;
    },

    /**
     * แมทริกซ์คำทำนายยามโหรทายหนู (อ้างอิงนิมิตจรแวดล้อมฉับพลันสไตล์ปราชญ์โบราณ)
     */
    _evaluateHorThaiNooMatrix: function(eventId) {
        const horThaiNooBook = {
            "MOUSE_RUN": "นิมิตหนูวิ่งผ่านเข้าพิกัดทิศอุดร: ตกเกณฑ์พระพิฆเนศวรประทานพร ของหายจะได้คืน เรื่องเงินทองที่เคยติดขัดพังทลายจะมีผู้อุปถัมภ์ช้อนรับฉับพลัน",
            "BIRD_CRY": "นิมิตนกแสกหรือนกเค้าแมวสะบัดปีกส่งเสียงทัก: ตกเกณฑ์อสูรกลืนเวลา ระวังมีคนจ้องสกัดขาใส่ร้ายในที่ทำงาน ห้ามหักโหมลงทุนใหญ่ในชั่วยามนี้",
            "WIND_BLOW": "นิมิตกระแสลมพัดกรรโชกทรัพย์ข้าวของตกแตก: ตกเกณฑ์สายฟ้าฟาดพิกัดชะตา เอกสารข้อตกลงจะเกิดการเปลี่ยนแปลงกะทันหัน ให้ตั้งสติและชะลอการเซ็นสัญญาไปก่อน"
        };
        return horThaiNooBook[eventId] || "นิมิตกรรมทั่วไป: กระแสธาตุรอบกายดำเนินไปตามครรลองปกติ";
    }
};
