/**
 * ============================================================
 * astro_datahub.js (Centralized Astro Data Hub)
 * ============================================================
 * โกดังเก็บข้อมูลสุริยยาตร/ดวงพิชัยสงครามส่วนกลาง และระบบกระจายข้อมูลอัตโนมัติ
 */

window.AstroDataHub = (function () {
    'use strict';

    // 📦 1. คลังเก็บความจริงหนึ่งเดียว (State Store)
    let state = {
        rawInput: {},     // วดป เวลา ลองจิจูด ที่ผู้ใช้กรอก
        timeLAT: {},      // เวลาสุริยคติแท้ที่ชำระแล้ว
        planets: {},      // พิกัดสมผุสดาว ๑ - ๐ แบบละเอียด (องศา, ลิปดา, สภาวะ)
        pichai57: {}      // ผลลัพธ์ดวงพิชัยสงครามทั้ง 57 ข้อ
    };

    // 🔔 2. ทะเบียนรายชื่อเมนูที่มาลงชื่อขอรับข้อมูล (Listeners/Subscribers)
    let listeners = [];

    /**
     * 📥 ฟังก์ชัน "ฝากข้อมูลเข้าคลัง" พร้อมสั่งกระจายผลลัพธ์ทันที
     */
    function updateState(category, newData) {
        // อัปเดตข้อมูลเข้าคลังส่วนกลาง
        state[category] = Object.assign({}, state[category], newData);
        console.log(`📥 [Data Hub] อัปเดตหมวด [${category}] เรียบร้อย`);

        // สั่งให้ทุกเมนูและกล่องข้อความอัปเดตตัวเองทันที
        broadcastToUI();
        notifySubscribers(category, state[category]);
    }

    /**
     * 📤 ฟังก์ชัน "ดึงข้อมูลจากคลัง" สำหรับเมนูที่ต้องการหยิบไปใช้ดื้อๆ
     */
    function getState(category) {
        return state[category];
    }

    /**
     * 📢 ฟังก์ชันกระจายผลลัพธ์ลงกล่องข้อความ (UI) ทั่วทั้งหน้าเว็บอัตโนมัติ
     * (ค้นหาแท็กที่มีคุณลักษณะ data-astro-hub แล้วยัดค่าลงไปทันที)
     */
    function broadcastToUI() {
        // ค้นหาทุกกล่องข้อมูลในหน้าเว็บที่ผูกไอดีไว้ ไม่ว่าจะอยู่เมนูไหน
        let elements = document.querySelectorAll('[data-astro-hub]');
        
        elements.forEach(el => {
            let path = el.getAttribute('data-astro-hub').split('.'); // เช่น "planets.sun" หรือ "pichai57.ข้อ 2"
            let category = path[0];
            let key = path[1];

            if (state[category] && state[category][key]) {
                let value = state[category][key];
                
                // ตรวจสอบประเภท Element เพื่อใส่ข้อมูลให้ถูกวิธี
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = value;
                } else {
                    el.innerText = value;
                }
            }
        });
    }

    /**
     * 📝 ฟังก์ชันให้ "เมนูอื่น" มาลงชื่อผูกตรรกะไว้ (Subscribe) 
     * เวลาคลังอัปเดต เมนูนั้นจะรันโค้ดตัวเองออโต้ทันที
     */
    function subscribe(callback) {
        listeners.push(callback);
    }

    function notifySubscribers(category, data) {
        listeners.forEach(callback => {
            try { callback(category, data); } catch (e) { console.error(e); }
        });
    }

    /**
     * 💾 แปลงคลังข้อมูลเป็น JSON เพื่อเซฟลงเครื่องหรือฐานข้อมูล
     */
    function exportToJSON() {
        return JSON.stringify(state, null, 2);
    }

    return {
        update: updateState,
        get: getState,
        subscribe: subscribe,
        export: exportToJSON
    };
})();

console.log('🚀 [Astro Data Hub] ระบบคลังข้อมูลและกระจายสายส่วนกลาง พร้อมทำงาน!');
