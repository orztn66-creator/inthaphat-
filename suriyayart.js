/* ================================================================
   suriyayart.js — โครงสร้าง JavaScript หลัก
   สกัดจาก external_v12f.html เพื่อรองรับระบบคำนวณใหม่
   
   รวมถึง: Navigation, นาฬิกา, ข้อมูลพิกัด (locations.json),
           UI สำหรับเมนู ๑ (ผูกดวง), การนำทางแท็บ, Accordion
   
   ⚠️  สูตรการคำนวณสุริยยาตร์ทั้งหมดถูกถอดออก — พร้อมรับ Logic ใหม่
   ================================================================ */

// ============================================================
// [AI แก้ไข]: GLOBAL STATE — ตัวแปรสถานะหลักของระบบ
// ============================================================
var manualMode = false;
var currentPhase = 'ขึ้น';
var currentDay = 1;
var currentAstroData = null;
var currentTransitData = null;
var manualEditActive = false;
var manualEditPPos = null;
var selectedMode = 'Suryayart'; // [กฎข้อที่ 1]: ล็อคสุริยยาตร์บริสุทธิ์
var currentEditMode = 'rasi';
var originalCalculatedPPos = null;
var madhyamOverrides = {};

// Proxy สำหรับ window global
Object.defineProperty(window, 'currentTransitData', {
    get: function(){ return currentTransitData; },
    set: function(v){ currentTransitData = v; },
    configurable: true
});
Object.defineProperty(window, 'currentAstroData', {
    get: function(){ return currentAstroData; },
    set: function(v){ currentAstroData = v; },
    configurable: true
});

window.manualTransitData = null;

// ============================================================
// LAST_CALC_RESULTS — Global Store เมนู 9
// ============================================================
window.LAST_CALC_RESULTS = {
    menu4: null, menu5: null, menu6: null, menu7: null, menu8: null
};

function pushCalcResult(menu, data) {
    if (!window.LAST_CALC_RESULTS) window.LAST_CALC_RESULTS = {};
    window.LAST_CALC_RESULTS[menu] = Object.assign({}, data, {
        timestamp: new Date().toLocaleTimeString('th-TH', {hour12: false})
    });
    try { localStorage.setItem('lcr_' + menu, JSON.stringify(window.LAST_CALC_RESULTS[menu])); } catch(e) {}
}

function getCalcResult(menu) {
    if (window.LAST_CALC_RESULTS && window.LAST_CALC_RESULTS[menu]) return window.LAST_CALC_RESULTS[menu];
    try { var s = localStorage.getItem('lcr_' + menu); if (s) return JSON.parse(s); } catch(e) {}
    return null;
}

// kc6 state
var kc6ManualOverride = false;
var kc6ManualValues = {};
var kc6OpenSections = new Set(['s1']);
window.kc6FinalSnapshot = null;

// ============================================================
// [AI แก้ไข]: LOCATIONS — โหลดข้อมูลจังหวัด/อำเภอ จาก locations.json
// ============================================================
var _locationsData = null;

function loadLocations() {
    if (_locationsData) return Promise.resolve(_locationsData);
    return fetch('locations.json')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            _locationsData = data;
            // สร้าง lookup map: province → districts
            _locationsData._provinceMap = {};
            (data.provinces || []).forEach(function(pv) {
                _locationsData._provinceMap[pv.name] = pv;
            });
            return data;
        })
        .catch(function(e) {
            console.warn('[locations.json] โหลดไม่สำเร็จ — ใช้ค่า default แทน:', e);
            return null;
        });
}

// [AI แก้ไข]: onProvinceChange — โหลดอำเภอจาก locations.json
function onProvinceChange() {
    var pSelect = document.getElementById('pProvince');
    var provinceName = pSelect ? pSelect.value : '';
    var customRow = document.getElementById('customCoordRow');
    var districtRow = document.getElementById('districtRow');
    var datalist = document.getElementById('districtOptions');

    if (provinceName === 'custom') {
        if (customRow) customRow.style.display = 'block';
        if (districtRow) districtRow.style.display = 'none';
        return;
    }
    if (customRow) customRow.style.display = 'none';
    if (districtRow) districtRow.style.display = 'block';

    // clear datalist
    if (datalist) datalist.innerHTML = '';
    var lngEl = document.getElementById('pLng');

    loadLocations().then(function(data) {
        if (!data || !data._provinceMap) return;
        var pv = data._provinceMap[provinceName];
        if (!pv) return;

        // เติม datalist
        if (datalist) {
            (pv.districts || []).forEach(function(d) {
                var opt = document.createElement('option');
                opt.value = d.name;
                opt.setAttribute('data-lng', d.lng);
                datalist.appendChild(opt);
            });
        }

        // ตั้ง default lng = ศูนย์กลางจังหวัด
        if (lngEl) lngEl.value = pv.lng.toFixed(3);
        updateCoordDisplay();

        // บันทึก localStorage
        try { localStorage.setItem('astro_province', provinceName); } catch(e) {}
    });
}

// [AI แก้ไข]: onDistrictSelect — ดึง lng จาก datalist
function onDistrictSelect() {
    var input = document.getElementById('pDistrictInput');
    var datalist = document.getElementById('districtOptions');
    var lngEl = document.getElementById('pLng');
    if (!input || !datalist || !lngEl) return;

    var val = input.value.trim();
    var options = datalist.querySelectorAll('option');
    for (var i = 0; i < options.length; i++) {
        if (options[i].value === val) {
            var lng = parseFloat(options[i].getAttribute('data-lng'));
            if (!isNaN(lng)) {
                lngEl.value = lng.toFixed(3);
                updateCoordDisplay();
                try {
                    localStorage.setItem('astro_district', val);
                    localStorage.setItem('astro_lng', lng.toFixed(3));
                } catch(e) {}
            }
            return;
        }
    }
    // ถ้าพิมพ์เองและไม่ match — ลองหาจาก data
    loadLocations().then(function(data) {
        if (!data) return;
        var prov = document.getElementById('pProvince');
        var pvName = prov ? prov.value : '';
        if (!pvName || !data._provinceMap) return;
        var pv = data._provinceMap[pvName];
        if (!pv) return;
        var found = (pv.districts || []).find(function(d){ return d.name === val; });
        if (found) {
            lngEl.value = found.lng.toFixed(3);
            updateCoordDisplay();
            try { localStorage.setItem('astro_district', val); localStorage.setItem('astro_lng', found.lng.toFixed(3)); } catch(e) {}
        }
    });
}

// [AI แก้ไข]: onCustomLngChange — กรอกลองจิจูดเอง
function onCustomLngChange() {
    var customEl = document.getElementById('pCustomLng');
    var lngEl = document.getElementById('pLng');
    if (!customEl || !lngEl) return;
    var v = parseFloat(customEl.value);
    if (!isNaN(v) && v >= 97 && v <= 106) {
        lngEl.value = v.toFixed(3);
        updateCoordDisplay();
    }
}

// [AI แก้ไข]: updateCoordDisplay — แสดง LMT offset และ sunrise โดยประมาณ
function updateCoordDisplay() {
    var lngEl = document.getElementById('pLng');
    if (!lngEl) return;
    var lng = parseFloat(lngEl.value) || 100.527;
    var lmtOff = (lng - 105.0) * 4.0; // นาที
    var displayLng = document.getElementById('displayLng');
    var displayLmt = document.getElementById('displayLmtOffset');
    var displaySR  = document.getElementById('displaySunrise');
    if (displayLng) displayLng.textContent = lng.toFixed(3) + '°E';
    if (displayLmt) displayLmt.textContent = (lmtOff >= 0 ? '+' : '') + lmtOff.toFixed(1) + ' นาที';
    // sunrise โดยประมาณ (เที่ยงคืน + 382 นาที - lmtOffset)
    var srMin = 382; // 6:22 LMT ≈ mean sunrise เวลาท้องถิ่น
    var srStdMin = ((srMin - lmtOff) % 1440 + 1440) % 1440;
    var srH = Math.floor(srStdMin / 60);
    var srM = Math.floor(srStdMin % 60);
    if (displaySR) displaySR.textContent = String(srH).padStart(2,'0') + ':' + String(srM).padStart(2,'0') + ' น.';
}

// ============================================================
// NAVIGATION — showSection, toggleMenu
// ============================================================
function showSection(id) {
    document.querySelectorAll('.app-section').forEach(function(el) {
        el.classList.remove('active');
    });
    var target = document.getElementById(id);
    if (target) target.classList.add('active');

    // update sidebar active
    document.querySelectorAll('.sidebar a').forEach(function(a) {
        a.classList.toggle('active', a.getAttribute('data-section') === id);
    });

    // close menu on mobile
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');

    // trigger section-specific render stubs
    if (id === 'binder') { renderSavedList(); }
    if (id === 'inthaphat') { m5SwitchPage(_m5CurrentPage || 1); }
    if (id === 'summary') { updateMenu9Stub(); }
    if (id === 'inthaphat_pro') { renderMenu6Stub(); }
}

function toggleMenu() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('overlay');
    if (!sidebar) return;
    sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

// ============================================================
// HOME PAGE — นาฬิกา + ปฏิทินจันทรคติ (Manual Override)
// ============================================================
var _manualLunar = false;
var _manualOffset = 0; // วันที่ปรับจากปัจจุบัน

function updateClock() {
    var now = new Date();
    // ถ้า manual → ไม่เลื่อนเวลา แต่เลื่อนดิถีที่ offset
    var displayDate = new Date(now.getTime() + _manualOffset * 86400000);

    var timeEl = document.getElementById('realTime');
    if (timeEl) {
        var h = String(now.getHours()).padStart(2,'0');
        var m = String(now.getMinutes()).padStart(2,'0');
        var s = String(now.getSeconds()).padStart(2,'0');
        timeEl.textContent = h + ':' + m + ':' + s;
    }

    var dateEl = document.getElementById('realDate');
    if (dateEl) {
        var days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
        var months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        dateEl.textContent = 'วัน' + days[displayDate.getDay()] + 'ที่ ' + displayDate.getDate() + ' ' + months[displayDate.getMonth()] + ' พ.ศ.' + (displayDate.getFullYear() + 543);
    }

    // ดิถีและยามโดยประมาณ
    updateLunarDisplay(displayDate, now);
}

function updateLunarDisplay(displayDate, now) {
    var lunarEl = document.getElementById('lunarStatus');
    var yamEl   = document.getElementById('thaiYam');

    // ดิถีโดยประมาณจาก offset วันจันทร์คติ
    if (lunarEl) {
        var dayDisp = document.getElementById('displayDay');
        if (dayDisp) dayDisp.textContent = currentDay;
        lunarEl.textContent = currentPhase + ' ' + currentDay + ' ค่ำ';
    }

    // ยามอัฏฐกาล — แบ่งกลางวัน 6:00–18:00 เป็น 8 ยาม (ยามละ 90 นาที)
    if (yamEl && now) {
        var totalMin = now.getHours() * 60 + now.getMinutes();
        var yamNames = ['','ยามที่ ๑ (อาทิตย์)','ยามที่ ๒ (จันทร์)','ยามที่ ๓ (อังคาร)',
                        'ยามที่ ๔ (พุธ)','ยามที่ ๕ (พฤหัส)','ยามที่ ๖ (ศุกร์)',
                        'ยามที่ ๗ (เสาร์)','ยามที่ ๘ (ราหู)'];
        var yamIdx;
        if (totalMin >= 360 && totalMin < 1080) {
            yamIdx = Math.floor((totalMin - 360) / 90) + 1;
        } else if (totalMin < 360) {
            yamIdx = Math.floor((totalMin + 720) / 90) + 1;
        } else {
            yamIdx = Math.floor((totalMin - 1080) / 90) + 1;
        }
        yamIdx = Math.max(1, Math.min(8, yamIdx));
        yamEl.textContent = yamNames[yamIdx] || 'ยาม ' + yamIdx;
    }
}

function setPhase(phase) {
    currentPhase = phase;
    document.getElementById('modeKhun').classList.toggle('active', phase === 'ขึ้น');
    document.getElementById('modeRam').classList.toggle('active', phase === 'แรม');
    updateClock();
}

function adjustDay(delta) {
    currentDay = Math.max(1, Math.min(15, currentDay + delta));
    updateClock();
}

function resetAuto() {
    _manualLunar = false;
    _manualOffset = 0;
    currentDay = 1;
    currentPhase = 'ขึ้น';
    var btn = document.getElementById('modeKhun');
    if (btn) btn.classList.add('active');
    var btn2 = document.getElementById('modeRam');
    if (btn2) btn2.classList.remove('active');
    updateClock();
}

// ============================================================
// เมนู ๕ — 3-Page Tab Navigation
// ============================================================
var _m5CurrentPage = 1;

function m5SwitchPage(p) {
    // ปิด accordion ที่เปิดค้าง
    document.querySelectorAll('.kc6-header.open').forEach(function(el){ el.classList.remove('open'); });
    document.querySelectorAll('.kc6-body.open').forEach(function(el){ el.classList.remove('open'); });
    if (typeof kc6OpenSections !== 'undefined') kc6OpenSections.clear();

    _m5CurrentPage = p;
    document.querySelectorAll('.m5-page').forEach(function(el){
        el.style.display = 'none'; el.classList.remove('active');
    });
    var pg = document.getElementById('m5page' + p);
    if (pg) { pg.style.display = 'block'; pg.classList.add('active'); }

    // อัปเดตปุ่ม nav
    [1,2,3].forEach(function(n) {
        var bt = document.getElementById('m5nav' + n);
        var bb = document.getElementById('m5navb' + n);
        if (bt) bt.classList.toggle('active-pg', n === p);
        if (bb) bb.classList.toggle('active-pg', n === p);
    });

    // auto-fill page3 ถ้ามี
    if (p === 3 && typeof hlikAutoFill === 'function') hlikAutoFill();

    try { localStorage.setItem('m5_page', p); } catch(e) {}
}

// หลักอิน-จันทร์: คำนวณผลรวม (สูตรบวกอย่างเดียว ไม่ใช่สูตรโหราศาสตร์)
function hlikCalculate() {
    var g = function(id){ var el = document.getElementById(id); return el ? (parseFloat(el.value) || 0) : 0; };
    var s = function(id, v){ var el = document.getElementById(id); if(el){ el.value = v; el.style.color = '#10b981'; } };

    var by1 = g('hb_y1r1')+g('hb_y1r2')+g('hb_y1r3')+g('hb_y1r4')+g('hb_y1r5')+g('hb_y1r6');
    var byg = g('hb_ygr1')+g('hb_ygr2')+g('hb_ygr3')+g('hb_ygr4')+g('hb_ygr5')+g('hb_ygr6');
    var by2 = g('hb_y2r1')+g('hb_y2r2')+g('hb_y2r3')+g('hb_y2r4')+g('hb_y2r5')+g('hb_y2r6');
    var ty1 = g('ht_y1r1')+g('ht_y1r2')+g('ht_y1r3')+g('ht_y1r4')+g('ht_y1r5')+g('ht_y1r6');
    var tyg = g('ht_ygr1')+g('ht_ygr2')+g('ht_ygr3')+g('ht_ygr4')+g('ht_ygr5')+g('ht_ygr6');
    var ty2 = g('ht_y2r1')+g('ht_y2r2')+g('ht_y2r3')+g('ht_y2r4')+g('ht_y2r5')+g('ht_y2r6');

    s('hb_y1bot', by1); s('hb_ygbot', byg); s('hb_y2bot', by2);
    s('ht_y1bot', ty1); s('ht_ygbot', tyg); s('ht_y2bot', ty2);

    var bTotal = by1 + byg + by2 + g('hlik_l1_birth') + g('hlik_l2_birth');
    var tTotal = ty1 + tyg + ty2 + g('hlik_l1_transit') + g('hlik_l2_transit');
    var diff = Math.abs(bTotal - tTotal);

    var vColor, vText;
    if      (diff === 0)  { vColor='#10b981'; vText='✅ ยอดเท่ากัน — สมดุลสมบูรณ์'; }
    else if (diff <= 7)   { vColor='#fbbf24'; vText='⚡ ผลต่าง '+diff+' — ใกล้เคียง ดี'; }
    else if (diff <= 14)  { vColor='#f97316'; vText='⚠️ ผลต่าง '+diff+' — ควรระวัง'; }
    else                  { vColor='#ef4444'; vText='❌ ผลต่าง '+diff+' — ต้องชำระก่อน'; }

    var box = document.getElementById('hlikResult');
    if (box) {
        box.style.display = 'block';
        box.innerHTML =
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">'
            +'<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:10px;text-align:center;">'
            +'<div style="color:#64748b;font-size:0.7rem;">ยอดรวม กำเนิด</div>'
            +'<div style="font-size:1.5rem;font-weight:bold;color:#fbbf24;">'+bTotal+'</div>'
            +'<div style="font-size:0.65rem;color:#475569;">ยาม๑='+by1+' ยามง='+byg+' ยาม๒='+by2+'</div></div>'
            +'<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:10px;text-align:center;">'
            +'<div style="color:#64748b;font-size:0.7rem;">ยอดรวม จร</div>'
            +'<div style="font-size:1.5rem;font-weight:bold;color:#38bdf8;">'+tTotal+'</div>'
            +'<div style="font-size:0.65rem;color:#475569;">ยาม๑='+ty1+' ยามง='+tyg+' ยาม๒='+ty2+'</div></div>'
            +'</div>'
            +'<div style="text-align:center;font-size:1rem;font-weight:bold;padding:12px;border-radius:8px;'
            +'background:rgba(79,70,229,0.15);border:1px solid #4f46e5;color:'+vColor+';">'
            +vText+'</div>';
    }
}

function hlikAutoFill() { /* stub — รอ Logic จาก Engine ใหม่ */ }

// Live-update ผลรวมยาม
document.addEventListener('input', function(e) {
    var t = e.target;
    if (t && (t.classList.contains('hlik-inp') || t.classList.contains('hlik-l-inp'))) {
        hlikCalculate();
    }
});

// ============================================================
// เมนู ๘ — Toggle UI
// ============================================================
function toggleYamUI() {
    var sel = document.getElementById('yamSystem');
    if (!sel) return;
    var samtah = document.getElementById('ui-samtah');
    var jinda  = document.getElementById('ui-jinda');
    if (samtah) samtah.style.display = sel.value === 'samtah' ? 'block' : 'none';
    if (jinda)  jinda.style.display  = sel.value === 'jinda'  ? 'block' : 'none';
}

// executeYam — stub รอ Logic
function executeYam() {
    var resEl = document.getElementById('yamRes');
    if (resEl) {
        resEl.style.display = 'block';
        resEl.innerHTML = '<div style="text-align:center;color:#fbbf24;padding:20px;">⏳ ระบบจับยามอยู่ระหว่างพัฒนา...</div>';
    }
}

// ============================================================
// เมนู ๙ — Accordion Toggle
// ============================================================
function toggleM9Section(id) {
    var header = document.getElementById('m9h_' + id);
    var body   = document.getElementById('m9b_' + id);
    if (!header || !body) return;
    var isOpen = header.classList.contains('open');
    header.classList.toggle('open', !isOpen);
    body.classList.toggle('open', !isOpen);
}

// stub รอ Logic
function updateMenu9Stub() {
    var label = document.getElementById('m9PersonLabel');
    if (label && currentAstroData) {
        label.textContent = '✅ ' + (currentAstroData.name || 'ไม่ระบุชื่อ');
    }
}

// copyToClipboard
function copyToClipboard() {
    var ta = document.getElementById('aiPromptText');
    if (!ta || !ta.value) { alert('ไม่มีข้อมูล'); return; }
    navigator.clipboard.writeText(ta.value).then(function() {
        var btn = document.querySelector('.ai-copy-btn');
        if (btn) { btn.textContent = '✅ คัดลอกแล้ว!'; btn.classList.add('copied'); }
        setTimeout(function() {
            if (btn) { btn.textContent = '📋 คัดลอก (รวมผัง ๕๗ ช่อง)'; btn.classList.remove('copied'); }
        }, 2000);
    }).catch(function() {
        ta.select(); document.execCommand('copy'); alert('คัดลอกแล้ว!');
    });
}

function generateAIPrompt() { /* stub */ }

// ============================================================
// เมนู ๖ — Accordion Toggle (kc6)
// ============================================================
function toggleKC6(sectionId) {
    var header = document.querySelector('[data-kc6="' + sectionId + '"]');
    var body   = document.getElementById('kc6_' + sectionId);
    if (!header || !body) return;
    var isOpen = header.classList.contains('open');
    header.classList.toggle('open', !isOpen);
    body.classList.toggle('open', !isOpen);
    if (!isOpen) kc6OpenSections.add(sectionId); else kc6OpenSections.delete(sectionId);
}

function renderMenu6Stub() {
    var label = document.getElementById('kc6PersonLabel');
    if (label && currentAstroData) label.textContent = '✅ ' + (currentAstroData.name || 'ไม่ระบุ');
}

// ============================================================
// เมนู ๑ (ผูกดวง) — Data Persistence Skeleton
// ============================================================
function renderSavedList() {
    var el = document.getElementById('dbList');
    if (!el) return;
    try {
        var list = JSON.parse(localStorage.getItem('astroDB') || '[]');
        if (!list.length) { el.innerHTML = '<div style="color:#475569;font-size:0.8rem;text-align:center;padding:10px;">ยังไม่มีรายชื่อที่บันทึก</div>'; return; }
        el.innerHTML = list.map(function(item, i) {
            return '<div class="data-row">'
                + '<span style="color:#94a3b8;font-size:0.8rem;">' + (item.name||'ไม่ระบุ') + ' ' + (item.d||'')+'/'+(item.m||'')+'/'+(item.y||'') + '</span>'
                + '<div>'
                + '<button class="btn-mini" style="background:#38bdf8;color:#000;margin-right:4px;" onclick="loadAstroData(' + i + ')">โหลด</button>'
                + '<button class="btn-mini" style="background:#ef4444;" onclick="deleteAstroData(' + i + ')">ลบ</button>'
                + '</div></div>';
        }).join('');
    } catch(e) { el.innerHTML = '<div style="color:#ef4444;font-size:0.8rem;">โหลดรายชื่อไม่สำเร็จ</div>'; }
}

function saveAstroData() {
    var name  = (document.getElementById('pName')  || {}).value || '';
    var day   = (document.getElementById('pDay')   || {}).value || '';
    var month = (document.getElementById('pMonth') || {}).value || '';
    var year  = (document.getElementById('pYear')  || {}).value || '';
    var hour  = (document.getElementById('pHour')  || {}).value || '';
    var min   = (document.getElementById('pMin')   || {}).value || '';
    var lng   = (document.getElementById('pLng')   || {}).value || '100.527';
    var prov  = (document.getElementById('pProvince') || {}).value || '';
    var dist  = (document.getElementById('pDistrictInput') || {}).value || '';

    if (!name || !day || !month || !year) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }

    var entry = { name:name, d:parseInt(day), m:parseInt(month), y:parseInt(year),
                  hr:parseInt(hour)||0, mn:parseInt(min)||0, lng:parseFloat(lng)||100.527,
                  province:prov, district:dist, savedAt:new Date().toISOString() };
    try {
        var list = JSON.parse(localStorage.getItem('astroDB') || '[]');
        // ถ้ามีชื่อซ้ำ → update
        var idx = list.findIndex(function(x){ return x.name === name; });
        if (idx !== -1) list[idx] = entry; else list.unshift(entry);
        localStorage.setItem('astroDB', JSON.stringify(list));
        renderSavedList();
        alert('บันทึก "' + name + '" เรียบร้อยแล้ว');
    } catch(e) { alert('บันทึกไม่สำเร็จ: ' + e.message); }
}

// saveAstroDataWithFeedback — alias พร้อม button feedback
function saveAstroDataWithFeedback() { saveAstroData(); }

function loadAstroData(idx) {
    try {
        var list = JSON.parse(localStorage.getItem('astroDB') || '[]');
        var item = list[idx];
        if (!item) return;
        var fields = { pName:item.name, pDay:item.d, pMonth:item.m, pYear:item.y, pHour:item.hr, pMin:item.mn };
        Object.keys(fields).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.value = fields[id];
        });
        // ตั้งจังหวัด
        if (item.province) {
            var pEl = document.getElementById('pProvince');
            if (pEl) { pEl.value = item.province; onProvinceChange(); }
        }
        setTimeout(function() {
            if (item.district) {
                var dEl = document.getElementById('pDistrictInput');
                if (dEl) { dEl.value = item.district; onDistrictSelect(); }
            }
            if (item.lng) {
                var lEl = document.getElementById('pLng');
                if (lEl) { lEl.value = parseFloat(item.lng).toFixed(3); updateCoordDisplay(); }
            }
        }, 200);
        alert('โหลดข้อมูล "' + item.name + '" แล้ว — กด "คำนวณดวง" เพื่อผูกดวง');
    } catch(e) { alert('โหลดไม่สำเร็จ'); }
}

function deleteAstroData(idx) {
    if (!confirm('ลบรายชื่อนี้?')) return;
    try {
        var list = JSON.parse(localStorage.getItem('astroDB') || '[]');
        list.splice(idx, 1);
        localStorage.setItem('astroDB', JSON.stringify(list));
        renderSavedList();
    } catch(e) {}
}

// ============================================================
// เมนู ๑ — Stubs รอ Logic คำนวณ (placeholder ป้องกัน error)
// ============================================================
function calculateSuriyayartWithFeedback() {
    /* [AI แก้ไข]: stub — Logic สูตรสุริยยาตร์จะถูกเขียนใส่ที่นี่ */
    var result = document.getElementById('binderResult');
    if (result) {
        result.style.display = 'block';
        result.innerHTML = '<div style="text-align:center;color:#fbbf24;padding:30px;">'
            + '⚙️ ระบบคำนวณดวงสุริยยาตร์อยู่ระหว่างเตรียมพร้อม<br>'
            + '<small style="color:#475569;">กรุณารอ Logic คำนวณใหม่</small></div>';
    }
}

function autoCalculate() { /* stub */ }
function finalizeData() { /* stub */ }
function calculateTransit() { /* stub */ }
function renderMenu6() { renderMenu6Stub(); }
function updateMenu9() { updateMenu9Stub(); }

// toggleManualEditPanel — แสดง/ซ่อน panel แก้ไขดาว
function toggleManualEditPanel() {
    var panel = document.getElementById('manualEditPanel');
    var btn   = document.getElementById('btnOpenManualEdit');
    if (!panel) return;
    var isOpen = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    if (btn) btn.textContent = isOpen ? '✏️ แก้ไขตำแหน่งดาวแบบแมนนวล (Manual Override)' : '✖ ปิดหน้าต่างแก้ไข';
}

function setEditMode(mode) {
    currentEditMode = mode;
    var rBtn = document.getElementById('editModeRasi');
    var lBtn = document.getElementById('editModeLipda');
    var rPanel = document.getElementById('editPanelRasi');
    var lPanel = document.getElementById('editPanelLipda');
    if (rBtn) rBtn.classList.toggle('active', mode === 'rasi');
    if (lBtn) lBtn.classList.toggle('active', mode === 'lipda');
    if (rPanel) rPanel.style.display = mode === 'rasi' ? 'block' : 'none';
    if (lPanel) lPanel.style.display = mode === 'lipda' ? 'block' : 'none';
}

function applyManualEdit() { /* stub */ }
function resetManualEdit() { /* stub */ }
function generateAllFromSun() { /* stub */ }
function renderMadhyamCards() { /* stub */ }
function scrollMadhyam(dir) { /* stub */ }

// ============================================================
// INIT — โหลดข้อมูลเริ่มต้น
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // โหลด locations.json ล่วงหน้า
    loadLocations().then(function() {
        // restore province จาก localStorage
        var savedProv = localStorage.getItem('astro_province');
        var fProv = document.getElementById('pProvince');
        if (fProv && savedProv) {
            fProv.value = savedProv;
            onProvinceChange();
        } else if (fProv) {
            onProvinceChange(); // ใช้ค่า default
        }
        // restore district + lng
        setTimeout(function() {
            var savedDist = localStorage.getItem('astro_district');
            var savedLng  = localStorage.getItem('astro_lng');
            var fDist = document.getElementById('pDistrictInput');
            var fLng  = document.getElementById('pLng');
            if (fDist && savedDist) fDist.value = savedDist;
            if (fLng  && savedLng)  fLng.value = savedLng;
            updateCoordDisplay();
        }, 200);
    });

    // fill default birth data
    var defaults = { pName:'ณัฐชัย สำราญจิตต์', pDay:11, pMonth:7, pYear:2527, pHour:6, pMin:22 };
    Object.keys(defaults).forEach(function(id) {
        var el = document.getElementById(id);
        if (el && !el.value) el.value = defaults[id];
    });

    // fill transit date/time with today
    var now = new Date();
    var tDay   = document.getElementById('tDay');
    var tMonth = document.getElementById('tMonth');
    var tYear  = document.getElementById('tYear');
    var tHour  = document.getElementById('tHour');
    var tMin   = document.getElementById('tMin');
    if (tDay   && !tDay.value)   tDay.value   = now.getDate();
    if (tMonth && !tMonth.value) tMonth.value = now.getMonth() + 1;
    if (tYear  && !tYear.value)  tYear.value  = now.getFullYear() + 543;
    if (tHour  && !tHour.value)  tHour.value  = now.getHours();
    if (tMin   && !tMin.value)   tMin.value   = now.getMinutes();

    // restore m5 page
    try {
        var savedPage = parseInt(localStorage.getItem('m5_page') || '1');
        if (savedPage >= 1 && savedPage <= 3) _m5CurrentPage = savedPage;
    } catch(e) {}

    renderSavedList();
    populateProvinceSelect();

    // start clock
    setInterval(updateClock, 1000);
    updateClock();
});

// [AI แก้ไข]: populateProvinceSelect — สร้างตัวเลือกจังหวัดจาก locations.json
function populateProvinceSelect() {
    var sel = document.getElementById('pProvince');
    if (!sel) return;
    loadLocations().then(function(data) {
        if (!data || !data.provinces) return;
        // group by region order
        var regionMap = {
            'ภาคกลาง / กทม.': ['กรุงเทพมหานคร','นนทบุรี','ปทุมธานี','สมุทรปราการ','นครปฐม','สมุทรสาคร','พระนครศรีอยุธยา','สระบุรี','ลพบุรี','สุพรรณบุรี','ชัยนาท','อ่างทอง','สิงห์บุรี','นครสวรรค์','อุทัยธานี'],
            'ภาคเหนือ': ['เชียงใหม่','เชียงราย','ลำปาง','ลำพูน','แม่ฮ่องสอน','พะเยา','แพร่','น่าน','พิษณุโลก','เพชรบูรณ์','สุโขทัย','กำแพงเพชร','ตาก','พิจิตร','อุตรดิตถ์'],
            'ภาคตะวันออกเฉียงเหนือ': ['ขอนแก่น','นครราชสีมา','อุบลราชธานี','อุดรธานี','สกลนคร','ร้อยเอ็ด','มหาสารคาม','กาฬสินธุ์','บุรีรัมย์','สุรินทร์','ศรีสะเกษ','ชัยภูมิ','เลย','หนองคาย','หนองบัวลำภู','ยโสธร','อำนาจเจริญ','นครพนม','มุกดาหาร','บึงกาฬ'],
            'ภาคตะวันออก': ['ชลบุรี','ระยอง','จันทบุรี','ตราด','ฉะเชิงเทรา','ปราจีนบุรี','สระแก้ว','นครนายก'],
            'ภาคตะวันตก / ภาคใต้': ['กาญจนบุรี','ราชบุรี','เพชรบุรี','ประจวบคีรีขันธ์','สงขลา','ภูเก็ต','สุราษฎร์ธานี','นครศรีธรรมราช','ชุมพร','กระบี่','พังงา','ตรัง','พัทลุง','สตูล','นราธิวาส','ปัตตานี','ยะลา']
        };

        sel.innerHTML = '<option value="">-- เลือกจังหวัด --</option>';

        Object.keys(regionMap).forEach(function(region) {
            var grp = document.createElement('optgroup');
            grp.label = region;
            regionMap[region].forEach(function(pName) {
                var opt = document.createElement('option');
                opt.value = pName;
                opt.textContent = pName;
                if (pName === 'กรุงเทพมหานคร') opt.selected = true;
                grp.appendChild(opt);
            });
            sel.appendChild(grp);
        });

        // เพิ่มตัวเลือก custom
        var customOpt = document.createElement('option');
        customOpt.value = 'custom';
        customOpt.textContent = '📍 กำหนดพิกัดเอง...';
        sel.appendChild(customOpt);

        // restore saved province
        var savedProv = localStorage.getItem('astro_province');
        if (savedProv) { sel.value = savedProv; }
        onProvinceChange();
    });
}

// ============================================================
// BUTTON CLICK EFFECTS — Universal
// ============================================================
document.addEventListener('click', function(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    btn.classList.remove('btn-clicked');
    void btn.offsetWidth;
    btn.classList.add('btn-clicked');
    setTimeout(function() { btn.classList.remove('btn-clicked'); }, 220);
}, true);

document.addEventListener('touchstart', function(e) {
    var btn = e.target.closest('button');
    if (btn) btn.classList.add('btn-active');
}, {passive: true});

document.addEventListener('touchend', function(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    btn.classList.remove('btn-active');
    btn.classList.remove('btn-clicked');
    void btn.offsetWidth;
    btn.classList.add('btn-clicked');
    setTimeout(function() { btn.classList.remove('btn-clicked'); }, 220);
}, {passive: true});

document.addEventListener('touchcancel', function(e) {
    var btn = e.target.closest('button');
    if (btn) btn.classList.remove('btn-active');
}, {passive: true});

// syncWithClock — ดึงเวลาปัจจุบันเข้ากล่อง transit
function syncWithClock() {
    var now = new Date();
    var tDay   = document.getElementById('tDay');
    var tMonth = document.getElementById('tMonth');
    var tYear  = document.getElementById('tYear');
    var tHour  = document.getElementById('tHour');
    var tMin   = document.getElementById('tMin');
    if (tDay)   tDay.value   = now.getDate();
    if (tMonth) tMonth.value = now.getMonth() + 1;
    if (tYear)  tYear.value  = now.getFullYear() + 543;
    if (tHour)  tHour.value  = now.getHours();
    if (tMin)   tMin.value   = now.getMinutes();
}
