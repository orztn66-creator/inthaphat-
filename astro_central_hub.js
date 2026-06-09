/**
 * ========================================================================
 * ASTRO CENTRAL HUB (เวอร์ชันคณิตศาสตร์ประยุกต์ชั้นสูง & อนุกรมพลังงาน)
 * ระบบศูนย์กลางจัดการข้อมูล ท่อส่งอนุกรม และลูปสแกนกฎคัมภีร์ 100 หัวข้อ
 * ========================================================================
 */

window.AstroCentralHub = {
    // 1. ตัวแปรอินพุตตั้งต้น (Raw Input State)
    _rawInput: null,

    // 2. คลังเก็บผลลัพธ์เพื่อการประหยัดพลังงาน CPU (State Cache Store)
    _cache: {
        suriyayart: null, // ผลลัพธ์ เมนู 4 (สารตั้งต้น)
        inthaphat: null,  // ผลลัพธ์ เมนู 5 (อินทภาษบาทจันทร์)
        yama: null,       // ผลลัพธ์ เมนู 6 (ยามมหานาที)
        summary: null     // ผลลัพธ์ เมนู 9 (ยอดสรุป & ลูปสแกน 100 กฎ)
    },

    // 3. คลังสมการคณิตศาสตร์ประยุกต์ชั้นสูง (Calculus & Analytical Utilities)
    MathModels: {
        // มอดุโลพิกัดดาราศาสตร์รอบวงกลม (360 องศา / 12 ราศี / 27 ฤกษ์) รองรับค่าลบ
        mod: (n, m) => ((n % m) + m) % m,

        // ลอการิทึมฐานธรรมชาติ (Natural Logarithm) หาแอมพลิจูดความเข้มข้นของเคราะห์-โชค
        lnIntensity: (value) => Math.log(Math.abs(value) + 1),

        // Differentiation (f'(x)): หาอัตราการเปลี่ยนแปลง/อัตราเร่งชะตา ณ เสี้ยวเวลาใดๆ (d/dt)
        // ใช้ระบุวันเคราะห์พุ่งขึ้นจุดสูงสุด (Peak Point)
        derivative: function(f, x, h = 1e-5) {
            return (f(x + h) - f(x - h)) / (2 * h);
        },

        // Integration (∫ f(x) dx): หาพื้นที่ใต้กราฟมิติเวลาอดีต-อนาคต (ด้วยกฎคางหมูเชิงตัวเลข)
        // ใช้คำนวณหาเศษวันรวมปฏิสนธิลากผ่านเวลาชำระโดยไม่ปัดเศษทิ้ง
        integrate: function(f, a, b, steps = 100) {
            const h = (b - a) / steps;
            let sum = 0.5 * (f(a) + f(b));
            for (let i = 1; i < steps; i++) {
                sum += f(a + i * h);
            }
            return sum * h;
        }
    },

    /**
     * ฟังก์ชันเริ่มต้นระบบเมื่อผู้ใช้ป้อนวันเกิดคนใหม่ (Reset & Initialize)
     * @param {Object} birthData - ข้อมูลดิบ { year, month, day, time, lat, lng }
     */
    initializeNewDestiny: function(birthData) {
        console.log("[Hub 🔄] ได้รับข้อมูลชะตาชีวิตใหม่ -> ล้างแคชระบบอนุกรมเก่าทั้งหมด");
        this._rawInput = birthData;
        this._cache = { suriyayart: null, inthaphat: null, yama: null, summary: null };
        
        // สั่งอัปเดตหน้าแรก (ถ้ามี)
        this._triggerUIRefresh();
    },

    /**
     * [CORE GATEWAY] ประตูหลักที่ทุกเมนูจะมาเรียกใช้ข้อมูล
     * ระบบจะตรวจสอบคิวอนุกรมความพึ่งพา (Data Dependency) และเลือกคํานวณตามสั่งอัตโนมัติ
     */
    requestData: function(moduleName) {
        if (!this._rawInput) {
            console.warn("[Hub ⚠️] ยังไม่มีการเปิดดวงชะตา กรุณากรอกข้อมูลหน้าแรกก่อน");
            return null;
        }

        switch(moduleName) {
            case 'MENU_4_SURIYAYART':
                return this._resolveSuriyayart();

            case 'MENU_5_INTHAPHAT':
                return this._resolveInthaphat();

            case 'MENU_6_YAMA':
                return this._resolveYama();

            case 'MENU_9_SUMMARY':
                return this._resolveSummary();

            default:
                console.error("[Hub ❌] ไม่พบนามธรรมเมนูนี้ในระบบส่งกำลัง");
                return null;
        }
    },

    /* ========================================================================
       ระบบคำนวณแบบไหลเวียนอนุกรมภายใน (Internal Series Resolvers)
       ======================================================================== */

    // 🧠 ลำดับที่ 1: คำนวณสูตรสุริยยาตร์และพระมานัตต์ตัวใหม่ของท่าน (สารตั้งต้น)
    _resolveSuriyayart: function() {
        if (this._cache.suriyayart) return this._cache.suriyayart; // คืนค่าทันทีถ้ามีในแคช
        
        console.log("[Pipeline ⚡ 4] รันสูตรสุริยยาตร์แคลคูลัสหาค่าคงที่ทางดาราศาสตร์ดิบ...");
        
        // 📥 [จุดเสียบโค้ดของท่าน]: แทนที่สมการจำลองด้านล่างนี้ด้วยฟังก์ชันสุริยยาตร์ตัวใหม่ของท่านได้เลย
        let harakhun = 1286000; // ตัวอย่างหรคุณเชิงฟังก์ชัน
        let moonTotalLipda = 25420; // สมผุสจันทร์ดิบ
        let trueSunriseSeconds = (5 * 3600) + (54 * 60) + 12; // แสงแรกคำนวณจริงจากพิกัด (05:54:12)

        this._cache.suriyayart = {
            harakhun: harakhun,
            moonTotalLipda: moonTotalLipda,
            trueSunrise: trueSunriseSeconds,
            lagnRasi: 2, // สมมุติลัคนาตกราศีเมถุน
            lagnNakhat: 5
        };
        return this._cache.suriyayart;
    },

    // 🧠 ลำดับที่ 2: ขับเสาหลักอินทภาษบาทจันทร์ (พึ่งพา สุริยยาตร์)
    _resolveInthaphat: function() {
        if (this._cache.inthaphat) return this._cache.inthaphat;
        
        // 🔄 เรียกคิวก่อนหน้าอัตโนมัติแบบอนุกรม
        const suriyayart = this._resolveSuriyayart(); 

        console.log("[Pipeline ⚡ 5] นำสารตั้งต้นมาแตกตัวแปรเชิงเสาหลัก 6 เสา ด้วย Calculus Integration...");

        // 📥 [จุดเสียบโค้ดของท่าน]: ใส่สูตรดิฟ/อินทิเกรต เพื่อแปลงค่าดวงดาวเป็นเวกเตอร์เวลาอดีต-อนาคต
        // ตัวอย่างการใช้โมเดลคณิตศาสตร์ประยุกต์
        let intensityFactor = this.MathModels.lnIntensity(suriyayart.moonTotalLipda);
        
        let inthaphatRasi = this.MathModels.mod(suriyayart.lagnRasi + 4, 12);
        let batjanRasi = this.MathModels.mod(suriyayart.lagnRasi - 2, 12);

        this._cache.inthaphat = {
            inthaphatRasi: inthaphatRasi,
            inthaphatNawang: 4,
            batjanRasi: batjanRasi,
            batjanNawang: 7,
            futureDaysVector: [1, 4, 12], // คงเหลือปี, เดือน, วัน จากการอินทิเกรตมิติเวลา
            isKhatCrisis: suriyayart.lagnNakhat === 5 ? true : false // เกณฑ์ฆาตจร
        };
        return this._cache.inthaphat;
    },

    // 🧠 ลำดับที่ 3: ซอยยามมหานาที/พหินาที ๕ ชั้น (พึ่งพา สุริยยาตร์)
    _resolveYama: function() {
        if (this._cache.yama) return this._cache.yama;
        
        // 🔄 ดึงเวลาสว่างจริงจากสุริยยาตร์มาซอยยาม
        const suriyayart = this._resolveSuriyayart();

        console.log("[Pipeline ⚡ 6] ดึงเวลาอาทิตย์อุทัยพิกัดจริงมาคำนวณผ่าโครงสร้างยาม 5 ชั้น");

        // 📥 [จุดเสียบโค้ดของท่าน]: ใส่ลอจิกซอยเศษเวลาพหินาทีตามคัมภีร์พระยามจินดา
        this._cache.yama = {
            currentYamaLayer: 3,
            isGoldMinute: true
        };
        return this._cache.yama;
    },

    // 🧠 ลำดับที่ 4: มหาดวงพิชัยสงคราม และ "ระบบสแกนกฎคัมภีร์ 100 หัวข้อ" (รวบยอดทั้งหมด)
    _resolveSummary: function() {
        if (this._cache.summary) return this._cache.summary;

        // 🔄 บังคับลากผลลัพธ์จากทุกโมดูลต้นน้ำมาบรรจบกัน
        const suriyayart = this._resolveSuriyayart();
        const inthaphat = this._resolveInthaphat();
        const yama = this._resolveYama();

        console.log("[Pipeline ⚡ 9] ข้อมูลต้นน้ำสมบูรณ์ -> เปิดระบบลูปสแกนกฎคัมภีร์ 100 หัวข้อ");

        // 🎯 ตรรกะการทำงานแบบสลับทาง: เอาฐานความรู้/กฎ เป็นตัวตั้ง แล้วเอาดวงไปเทียบให้ครบ 100%
        const activeRules = this._run100RuleScanner(suriyayart, inthaphat, yama);

        this._cache.summary = {
            components: { suriyayart, inthaphat, yama },
            triggeredRules: activeRules
        };
        return this._cache.summary;
    },

    /**
     * 👁️ เครื่องยนต์ลูปสแกนกฎ 100 ข้อ (Rule-Based Matrix Scanner)
     * นำผลลัพธ์มาวิ่งผ่านตัวกรองเงื่อนไขของคัมภีร์ทุกหัวข้ออย่างละเอียด
     */
    _run100RuleScanner: function(s, i, y) {
        const matchedList = [];

        // ตัวอย่างทำเนียบกฎ 100 ข้อ (ทบทวนและสแกนทีละข้อ)
        // ในระบบจริง ท่านสามารถใส่เงื่อนไขให้ครบ 100 ข้อตามตำราได้เลยครับ
        const ScriptureRulesDB = [
            {
                id: "RULE_01",
                name: "เกณฑ์ฆาตมฤตยูการณ์ทับลัคนาเดิม",
                condition: (s, i, y) => i.isKhatCrisis === true,
                description: "⚠️ วิกฤตคอขาดบาดตาย: จุดฆาฏหมุนทับพิกัดฤกษ์เกิดแท้จริง"
            },
            {
                id: "RULE_02",
                name: "อินทภาษภาคคู่ราศีวัฒนะชะตา",
                condition: (s, i, y) => (i.inthaphatRasi % 2 === 0),
                description: "✨ ศุภผลเลิศคุณ: เสาหลักอินทภาษสถิตในเกณฑ์คู่ราศีแห่งความเจริญ"
            },
            {
                id: "RULE_03",
                name: "ยามมหานาทีทองปฏิสนธิ",
                condition: (s, i, y) => y.isGoldMinute === true,
                description: "🔱 นาทีฉัตรทองคำ: ห้วงเวลาแปรเปลี่ยนสอดรับกับเศษหรคุณสุริยยาตร์"
            }
            // ... เขียนขยายเงื่อนไขแบบนี้ไปจนครบกฎข้อที่ 100 ...
        ];

        // วนลูปสแกนแบบ Exhaustive ตรวจสอบดวงชะตากับคัมภีร์แบบ 100%
        ScriptureRulesDB.forEach(rule => {
            if (rule.condition(s, i, y) === true) {
                matchedList.push({
                    id: rule.id,
                    name: rule.name,
                    text: rule.description
                });
            }
        });

        return matchedList;
    },

    /**
     * 🖥️ ระบบดันข้อมูลไปแสดงผลบนหน้าจอ UI อัตโนมัติ (DOM Bridge Push)
     */
    renderModuleToUI: function(moduleName) {
        const data = this.requestData(moduleName);
        if (!data) return;

        if (moduleName === 'MENU_5_INTHAPHAT') {
            // ยัดค่าลงตารางและกล่องไฟเตือนสีแดงในหน้าจอเมนู 5 ทันทีตามที่เราออกแบบไว้
            const alertZone = document.getElementById('inthaphat-alert-zone');
            if (alertZone) {
                if (data.isKhatCrisis) {
                    alertZone.style.display = 'block';
                    alertZone.innerHTML = "⚠️ เตือนภัยวิกฤตคัมภีร์อินทภาษ: ปีนี้ตกเกณฑ์ฆาตมฤตยูร้ายแรง!";
                } else {
                    alertZone.style.display = 'none';
                }
            }
            
            // พ่นตัวเลขแคลคูลัสเวลาลง ID ตาราง
            if(document.getElementById('lbl-ori-in-rasi')) document.getElementById('lbl-ori-in-rasi').innerText = data.inthaphatRasi;
            if(document.getElementById('lbl-ori-in-naw')) document.getElementById('lbl-ori-in-naw').innerText = data.inthaphatNawang;
            if(document.getElementById('lbl-ori-bat-rasi')) document.getElementById('lbl-ori-bat-rasi').innerText = data.batjanRasi;
            if(document.getElementById('lbl-in-future')) document.getElementById('lbl-in-future').innerText = `${data.futureDaysVector[0]} ปี ${data.futureDaysVector[1]} เดือน ${data.futureDaysVector[2]} วัน`;
        }

        if (moduleName === 'MENU_9_SUMMARY') {
            // แสดงผลลัพธ์กฎทั้งหมดที่สแกนผ่านในเมนูสรุปดวงชะตา
            const container = document.getElementById('menu9-rules-container');
            if (container) {
                container.innerHTML = data.triggeredRules.map(r => `
                    <div class="rule-card-item">
                        <strong>[${r.id}] ${r.name}</strong>
                        <p>${r.text}</p>
                    </div>
                `).join('');
            }
        }
    },

    _triggerUIRefresh: function() {
        console.log("[Hub 🔄] แจ้งเตือนหน้า UI ให้เตรียมพร้อมรับข้อมูลดวงใหม่");
    }
};
