// main.js — สุริยยาตร์ Ultimate N000 v13 (Calculus Edition)
// Calculation Router + Scripture Bit + UI Bridge
// Connects all 3 engine pairs to their UI windows and SVG plates

/* ============================================================
   A.  GLOBAL CONSTANTS & PLANET DEFINITIONS
   ============================================================ */

var RASI_TH = ['เมษ','พฤษภ','มิถุน','กรกฎ','สิงห์','กันย์','ตุลย์','พิจิก','ธนู','มกร','กุมภ์','มีน'];

var FUEK_TH = [
  'อัสวินี','ภรณี','กฤตติกา','โรหิณี','มฤคศิรา','อาร์ทรา',
  'ปุนรวสุ','ปุษยา','อาศเลษา','มฆา','บุรพผลคุนี','อุตตรผลคุนี',
  'หัสตา','จิตรา','สวาติ','วิศาขา','อนุราธา','เชษฐา',
  'มูลา','บุรพอาษาฒ','อุตตรอาษาฒ','ศรวณา','ธนิษฐา',
  'ศตภิษัก','บุรพภัทรปทา','อุตตรภัทรปทา','เรวตี'
];

var WAR_TH = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

var PLANET_DEF = [
  {key:'SUN',     sym:'๑', thName:'อาทิตย์',   col:'#f59e0b'},
  {key:'MOON',    sym:'๒', thName:'จันทร์',     col:'#94a3b8'},
  {key:'MARS',    sym:'๓', thName:'อังคาร',     col:'#ef4444'},
  {key:'MERCURY', sym:'๔', thName:'พุธ',        col:'#10b981'},
  {key:'JUPITER', sym:'๕', thName:'พฤหัสบดี',  col:'#fbbf24'},
  {key:'VENUS',   sym:'๖', thName:'ศุกร์',      col:'#ec4899'},
  {key:'SATURN',  sym:'๗', thName:'เสาร์',      col:'#64748b'},
  {key:'RAHU',    sym:'๘', thName:'ราหู',       col:'#a855f7'},
  {key:'KETU',    sym:'๙', thName:'เกตุ',       col:'#c084fc'},
  {key:'MRITYOU', sym:'๐', thName:'มฤตยู',     col:'#6366f1'}
];

var INTHA_RULER_SEQ   = ['เกตุ','ศุกร์','อาทิตย์','จันทร์','อังคาร','ราหู','พฤหัสบดี','เสาร์','พุธ'];
var INTHA_RULER_YEARS = [7,20,6,10,7,18,16,19,17];
var INTHA_RULER_COLS  = ['#c084fc','#ec4899','#f59e0b','#94a3b8','#ef4444','#a855f7','#fbbf24','#64748b','#10b981'];

var SVG_COORDS = [
  {x:0,y:-115},{x:-105,y:-125},{x:-140,y:-90},{x:-130,y:15},
  {x:-140,y:120},{x:-105,y:155},{x:0,y:145},{x:105,y:155},
  {x:140,y:120},{x:130,y:15},{x:140,y:-90},{x:105,y:-125}
];
var SVG_PATHS = [
  "M -60,-60 L -60,-201.25 A 210 210 0 0 1 60,-201.25 L 60,-60 Z",
  "M -60,-60 L -148.5,-148.5 A 210 210 0 0 1 -60,-201.25 Z",
  "M -60,-60 L -201.25,-60 A 210 210 0 0 1 -148.5,-148.5 Z",
  "M -60,-60 L -60,60 L -201.25,60 A 210 210 0 0 1 -201.25,-60 Z",
  "M -60,60 L -148.5,148.5 A 210 210 0 0 1 -201.25,60 Z",
  "M -60,60 L -60,201.25 A 210 210 0 0 1 -148.5,148.5 Z",
  "M -60,60 L 60,60 L 60,201.25 A 210 210 0 0 1 -60,201.25 Z",
  "M 60,60 L 148.5,148.5 A 210 210 0 0 1 60,201.25 Z",
  "M 60,60 L 201.25,60 A 210 210 0 0 1 148.5,148.5 Z",
  "M 60,-60 L 201.25,-60 A 210 210 0 0 1 201.25,60 L 60,60 Z",
  "M 60,-60 L 148.5,-148.5 A 210 210 0 0 1 201.25,-60 Z",
  "M 60,-60 L 60,-201.25 A 210 210 0 0 1 148.5,-148.5 Z"
];

/* ============================================================
   B.  SCRIPTURE_BIT — Single Source of Truth Global State Bus
   ============================================================ */

window.SCRIPTURE_BIT = {
  birth:{
    name:null,d:null,m:null,y:null,hr:null,mn:null,
    lng:100.527,province:null,district:null,
    lmtOffset:-18.9,adjHr:null,adjMn:null,
    calcResult:null,inthaResult:null,
    isManualOverride:false,manualPositions:null
  },
  transit:{
    d:null,m:null,y:null,hr:null,mn:null,
    lng:null,lmtOffset:null,
    calcResult:null,inthaResult:null,finalized:false
  },
  inthaphat:{natalOutput:null,transitOutput:null,scriptureResult:null},
  yam:{samta:null,wisetjinda:null,lastMinutes:null},
  menu9:{promptText:null}
};

/* ============================================================
   C.  InthaphatBrowserEngine — Browser-safe adapter (Pair 2)
       inthaphat_engine.js / inthaphat_batjan.js use Node.js
       require('fs') — this pure-browser replacement handles
       all calculations and fetches inthaphat_data_batjan.json
   ============================================================ */

window.InthaphatBrowserEngine = (function(){
  'use strict';
  var _cfg = null;
  var DEF = {
    chulaDivisor:108, layerDivisor:4, moonDivisor:700, minuteDivisor:13,
    TOTAL_RERK:27, TOTAL_RASI:12, CYCLE_SAKKARAT:108, BATH_PER_RERK:4,
    NAWANGSE_PER_RASI:9, DAYS_PER_YEAR:365, DAYS_PER_MONTH:30, BASE_RASI_OFFSET:0,
    mrittayu_ghat_offsets:{kala_mrittayu:10,withe_mrittayu:20,pathom_ghat:5,thutiya_ghat:14,tatiya_ghat:23},
    maxMatrixValues:{layer4_day:4,layer3_month:30,layer2_year:365,layer1_nakhat:27},
    matrixSubtractions:{layer4_day:4,layer3_month:30,layer2_year:365,layer1_nakhat:27}
  };
  function _mod(n,m){return ((n%m)+m)%m;}
  function _C(){return (_cfg&&_cfg.astronomical_constants)?_cfg.astronomical_constants:DEF;}
  function init(cfgData){_cfg=cfgData;console.log('[InthaphatBrowserEngine] ✅ init OK');}
  function _calcScriptureNakhat(cs,dow){
    var C=_C(), rem=_mod(cs,C.chulaDivisor||108);
    return {layer1_nakhat:Math.floor(rem/(C.layerDivisor||4)),layer2_year:_mod(rem,C.layerDivisor||4),layer3_month:10,layer4_day:dow};
  }
  function _calcMoonNakhat(rasi,deg,lipda){
    var C=_C(), totalLipda=(rasi*30*60)+(deg*60)+lipda;
    var mD=C.moonDivisor||700, miD=C.minuteDivisor||13;
    var mL1=Math.floor(totalLipda/mD), rem=totalLipda%mD;
    var mn=Math.floor(rem/miD), proc=mn*25;
    return {layer1_nakhat:mL1,layer2_year:Math.floor(proc/30),layer3_month:proc%30,layer4_day:0};
  }
  function _combine(mA,mB){
    var C=_C(), max=C.maxMatrixValues||DEF.maxMatrixValues, sub=C.matrixSubtractions||DEF.matrixSubtractions;
    var l4=mA.layer4_day+mB.layer4_day, l3=mA.layer3_month+mB.layer3_month;
    var l2=mA.layer2_year+mB.layer2_year, l1=mA.layer1_nakhat+mB.layer1_nakhat;
    if(l4>(max.layer4_day||4))  {l4-=(sub.layer4_day||4);  l3+=1;}
    if(l3>(max.layer3_month||30)){l3-=(sub.layer3_month||30);l2+=1;}
    if(l2>(max.layer2_year||365)){l2-=(sub.layer2_year||365);l1+=1;}
    if(l1>(max.layer1_nakhat||27)){l1-=(sub.layer1_nakhat||27);}
    return {layer1_nakhat:_mod(l1,27),layer2_year:l2,layer3_month:l3,layer4_day:l4};
  }
  function _hazards(base){
    var N=27,o=DEF.mrittayu_ghat_offsets;
    return {
      pathomMrytayu:_mod(base,N), kalMrytayu:_mod(base+(o.kala_mrittayu||10),N),
      withiMrytayu:_mod(base+(o.withe_mrittayu||20),N), pathomKhat:_mod(base+(o.pathom_ghat||5),N),
      thutiyaKhat:_mod(base+(o.thutiya_ghat||14),N), tatiyaKhat:_mod(base+(o.tatiya_ghat||23),N)
    };
  }
  function runBirthPipeline(cs,dow,mRasi,mDeg,mLipda){
    var sn=_calcScriptureNakhat(cs,dow), mn=_calcMoonNakhat(mRasi,mDeg,mLipda);
    var mat=_combine(sn,mn), hz=_hazards(mat.layer1_nakhat);
    return {matrix:mat,hazards:hz,targetNakhatIndex:mat.layer1_nakhat,nakhatName:FUEK_TH[mat.layer1_nakhat%27],scriptureLayers:{scripture:sn,moon:mn}};
  }
  function runTransitPipeline(natal,age,lagNak){
    var N=27, tn=_mod(natal.targetNakhatIndex+age,N), th=_hazards(tn);
    var isK=(th.kalMrytayu===lagNak||th.pathomKhat===lagNak||th.thutiyaKhat===lagNak||th.tatiyaKhat===lagNak||th.withiMrytayu===lagNak);
    return {transitInthaphatNakhat:tn,transitHazards:th,lakanaPosition:lagNak,isKhatCrisis:isK,
      statusText:isK?'⚠️ เตือนอันตราย: จุดฆาฏจรทับพิกัดฤกษ์ลัคนา — ตกเกณฑ์วิกฤต!':'✅ เกณฑ์ดวงชะตาทั่วไป — ปลอดภัยดี'};
  }
  function evaluateDestiny(lR,iR,bR){
    var dI=_mod(iR-lR,12), dB=_mod(bR-lR,12);
    var ok={col:'#10b981',label:'✅ วัฒนะ'}, bad={col:'#ef4444',label:'⚠️ หายนะ'};
    return {inthaphat_status:(dI%2===0)?ok:bad,batjan_status:(dB%2===0)?ok:bad};
  }
  function checkPlanetHazards(fuekIdx,hz){
    if(fuekIdx===hz.pathomMrytayu) return {label:'ปฐมมฤตยู',col:'#ef4444',severity:3};
    if(fuekIdx===hz.kalMrytayu)    return {label:'กาลมฤตยู',col:'#ef4444',severity:3};
    if(fuekIdx===hz.withiMrytayu)  return {label:'วิถีมฤตยู',col:'#f97316',severity:2};
    if(fuekIdx===hz.pathomKhat)    return {label:'ปฐมฆาต',col:'#f59e0b',severity:1};
    if(fuekIdx===hz.thutiyaKhat)   return {label:'ทุติยฆาต',col:'#f59e0b',severity:1};
    if(fuekIdx===hz.tatiyaKhat)    return {label:'ตติยฆาต',col:'#f59e0b',severity:1};
    return {label:'ปลอดภัย',col:'#10b981',severity:0};
  }
  return {init:init,runBirthPipeline:runBirthPipeline,runTransitPipeline:runTransitPipeline,evaluateDestiny:evaluateDestiny,checkPlanetHazards:checkPlanetHazards};
})();

/* ============================================================
   D.  ENGINE INITIALIZATION — Fetch JSON pairs
   ============================================================ */

(function _initEngines(){
  if(window.YamWisetJindaEngine){
    fetch('yam_wisetjinda.json').then(function(r){return r.json();})
      .then(function(cfg){window.YamWisetJindaEngine.init(cfg);console.log('[YamEngine] ✅ yam_wisetjinda.json loaded');})
      .catch(function(e){console.warn('[YamEngine] JSON load failed:',e.message);});
  }
  fetch('inthaphat_data_batjan.json').then(function(r){return r.json();})
    .then(function(cfg){window.InthaphatBrowserEngine.init(cfg);console.log('[InthaphatEngine] ✅ inthaphat_data_batjan.json loaded');})
    .catch(function(e){console.warn('[InthaphatEngine] Using hardcoded constants:',e.message);});
  if(window.SuriyayartCalculusEngine){
    var vfy=window.SuriyayartCalculusEngine.verifyEngine();
    console.log('[SuriyayartEngine] v'+window.SuriyayartCalculusEngine.version+' — '+vfy.message);
  } else {
    console.error('[SuriyayartEngine] ❌ Not found — add suriyayart_engine.js before main.js');
  }
})();

/* ============================================================
   E.  UTILITY FUNCTIONS
   ============================================================ */

function _mod(n,m){return ((n%m)+m)%m;}
function _gv(id){var el=document.getElementById(id);return el?el.value:'';}
function _sv(id,val){var el=document.getElementById(id);if(el)el.value=(val!==undefined&&val!==null)?val:0;}
function _shtml(id,html){var el=document.getElementById(id);if(el)el.innerHTML=html;}
function _showBlock(id){var el=document.getElementById(id);if(el)el.style.display='block';}
var showToast=window.showToast||function(msg,t){console.log('[Toast]['+t+'] '+msg);};
var showLoading=window.showLoading||function(){};
var hideLoading=window.hideLoading||function(){};
function _getStatusStyle(s){
  if(!s)return {col:'#94a3b8',label:'⚪ —'};
  if(s.indexOf('เสริด')!==-1)return {col:'#10b981',label:'🟢 เสริด'};
  if(s.indexOf('พาล')!==-1)  return {col:'#ef4444',label:'🔴 วักรี'};
  if(s.indexOf('ช้า')!==-1)  return {col:'#f59e0b',label:'🟡 ช้า'};
  return {col:'#94a3b8',label:'⚪ มนต์'};
}
function _powerColor(p){if(p>=70)return '#10b981';if(p>=40)return '#f59e0b';return '#ef4444';}
function _tpad(n){return String(n).padStart(2,'0');}
function _thaiDate(d,m,y){var mo=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];return d+' '+mo[m-1]+' พ.ศ.'+y;}
function _applyLMT(hour,min,lng){
  var lmtOff=(lng-105.0)*4.0, total=hour*60+min-lmtOff;
  var norm=((total%1440)+1440)%1440;
  return {adjHr:Math.floor(norm/60),adjMn:Math.floor(norm%60),lmtOff:lmtOff};
}
function _scrollToEl(id,off){
  var el=document.getElementById(id);if(!el)return;
  setTimeout(function(){var top=el.getBoundingClientRect().top+window.pageYOffset-(off||80);window.scrollTo({top:top,behavior:'smooth'});},200);
}

/* ============================================================
   F.  HOME PAGE — Real-time Moon Nakshatra + Planet Bar
   ============================================================ */

function _updateRealtimeHome(){
  if(!window.SuriyayartCalculusEngine)return;
  try{
    var now=new Date();
    var r=window.SuriyayartCalculusEngine.calculatePlanets(now.getFullYear()+543,now.getMonth()+1,now.getDate(),now.getHours(),now.getMinutes(),true);
    var moonFuek=Math.floor(r.planets.MOON.fuek)%27;
    var mrEl=document.getElementById('moonRerk');
    if(mrEl)mrEl.textContent=FUEK_TH[moonFuek];
    var m1El=document.getElementById('m1RealtimePlanets');
    if(m1El){
      var sun=r.planets.SUN, moon=r.planets.MOON, lag=r.lagna, bv=r.baseVars;
      m1El.innerHTML='<div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:10px;padding:10px 12px;font-size:0.72rem;margin-top:10px;">'+
        '<div style="display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;">'+
        '<span style="color:#64748b;">HK <b style="color:#fbbf24;">'+bv.H+'</b></span>'+
        '<span style="color:#64748b;">วาร <b style="color:#94a3b8;">'+bv.warName+'</b></span>'+
        '<span style="color:#64748b;">จ.ศ. <b style="color:#38bdf8;">'+r.meta.csYear+'</b></span>'+
        '<span style="color:#64748b;">ดิถี <b style="color:#a78bfa;">'+bv.dithi.toFixed(1)+'</b></span>'+
        '</div>'+
        '<div style="display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:6px;">'+
        '<span>☉ <b style="color:#f59e0b;">'+sun.rasiName+' '+sun.degree+'°</b></span>'+
        '<span>☽ <b style="color:#94a3b8;">'+moon.rasiName+' '+moon.degree+'° ['+FUEK_TH[moonFuek]+']</b></span>'+
        '<span>ล <b style="color:#38bdf8;">'+lag.rasiName+' '+lag.degree+'°</b></span>'+
        '</div></div>';
    }
  }catch(e){}
}

/* ============================================================
   G.  SVG ZODIAC WHEEL BUILDER
   ============================================================ */

function _buildZodiacSVG(zodiacArr,labelTop,labelMid,labelHK,isTransit){
  var bc=isTransit?'#38bdf8':'#c9a227', tc=isTransit?'#38bdf8':'#fbbf24';
  var housesHTML='';
  for(var i=0;i<12;i++){
    var pText=zodiacArr[i]||'', lines=[], cx=SVG_COORDS[i].x, cy=SVG_COORDS[i].y;
    for(var c=0;c<pText.length;c+=3)lines.push(pText.slice(c,c+3));
    var textRows='';
    lines.forEach(function(ln,li){
      var dy=li===0?10:(li*17+10);
      textRows+='<text x="'+cx+'" y="'+(cy+dy)+'" font-family="Sarabun,sans-serif" font-size="19" font-weight="700" fill="#ffffff" text-anchor="middle">'+ln+'</text>';
    });
    housesHTML+='<g class="zodiac-house">'+
      '<path d="'+SVG_PATHS[i]+'" class="house-bg" fill="transparent" stroke="'+bc+'" stroke-width="1.5"/>'+
      '<text x="'+(cx-16)+'" y="'+(cy-10)+'" font-family="Sarabun,sans-serif" font-size="8" fill="#475569" text-anchor="middle">'+RASI_TH[i]+'</text>'+
      textRows+'</g>';
  }
  return '<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.6));">'+
    '<g transform="translate(250,250)">'+housesHTML+
    '<circle cx="0" cy="0" r="210" fill="none" stroke="'+bc+'" stroke-width="3.5"/>'+
    '<rect x="-60" y="-60" width="120" height="120" fill="'+(isTransit?'rgba(56,189,248,0.05)':'rgba(251,191,36,0.05)')+'" stroke="'+bc+'" stroke-width="2.5" rx="4"/>'+
    '<text x="0" y="-16" font-family="Sarabun,sans-serif" font-size="17" font-weight="700" fill="'+tc+'" text-anchor="middle">'+(labelTop||'ดวงอีแปะ')+'</text>'+
    '<text x="0" y="6" font-family="Sarabun,sans-serif" font-size="11" fill="#64748b" text-anchor="middle">'+(labelMid||'สุริยยาตร์')+'</text>'+
    '<text x="0" y="24" font-family="monospace" font-size="9" fill="#38bdf8" text-anchor="middle">'+(labelHK||'')+'</text>'+
    '</g></svg>';
}

function _resultToZodiacArr(result){
  var arr=[]; for(var i=0;i<12;i++)arr.push('');
  PLANET_DEF.forEach(function(pd){
    var p=result.planets[pd.key];if(!p)return;
    arr[((p.rasi%12)+12)%12]+=pd.sym;
  });
  arr[((result.lagna.rasi%12)+12)%12]+='ล';
  return arr;
}

/* ============================================================
   H.  MENU ๑ — ผูกดวงสุริยยาตร์ (Birth Chart)
   ============================================================ */

function calculateSuriyayartWithFeedback(){
  if(!window.SuriyayartCalculusEngine){showToast('❌ ไม่พบ SuriyayartCalculusEngine','error');return;}
  var name=_gv('pName')||'ไม่ระบุชื่อ';
  var day=parseInt(_gv('pDay'))||0, month=parseInt(_gv('pMonth'))||0, year=parseInt(_gv('pYear'))||0;
  var hour=parseInt(_gv('pHour'))||6, min=parseInt(_gv('pMin'))||0;
  var lng=parseFloat(_gv('pLng'))||100.527;
  if(!day||!month||!year){showToast('⚠️ กรุณากรอกวัน/เดือน/ปีเกิดให้ครบ','error');return;}
  showLoading('🔮 กำลังคำนวณดวงสุริยยาตร์...');
  setTimeout(function(){
    try{
      var lmt=_applyLMT(hour,min,lng);
      var result=window.SuriyayartCalculusEngine.calculatePlanets(year,month,day,lmt.adjHr,lmt.adjMn,true);
      var cs=result.meta.csYear, war=result.baseVars.war, moonP=result.planets.MOON;
      var inthaResult=window.InthaphatBrowserEngine.runBirthPipeline(cs,war,moonP.rasi,moonP.degree,moonP.lipda);
      window.SCRIPTURE_BIT.birth={
        name:name,d:day,m:month,y:year,hr:hour,mn:min,lng:lng,
        province:_gv('pProvince'),district:_gv('pDistrictInput'),
        lmtOffset:lmt.lmtOff,adjHr:lmt.adjHr,adjMn:lmt.adjMn,
        calcResult:result,inthaResult:inthaResult,isManualOverride:false,manualPositions:null
      };
      if(typeof window.currentAstroData!=='undefined')window.currentAstroData={name:name,result:result};
      if(typeof pushCalcResult==='function')pushCalcResult('menu4',{name:name,d:day,m:month,y:year,hr:hour,mn:min,lng:lng,hk:result.baseVars.H,cs:result.meta.csYear,dithi:result.baseVars.dithi,avman:result.baseVars.avman,war:result.baseVars.warName,suridin:result.baseVars.suridin});
      _renderBirthChartAll(result,inthaResult,name,{d:day,m:month,y:year,hr:hour,mn:min,lng:lng,lmtOff:lmt.lmtOff});
      _populateManualEditPanel(result);
      _showBlock('binderResult');
      hideLoading();
      showToast('✅ คำนวณดวงสุริยยาตร์สำเร็จ!','success');
      _scrollToEl('binderResult');
    }catch(e){hideLoading();console.error('[calculateSuriyayart]',e);showToast('❌ '+e.message,'error');}
  },50);
}

function _renderBirthChartAll(result,inthaResult,name,meta){
  _renderZodiacChart(result);
  _renderSomphutTable(result,inthaResult);
  _renderMadhyamCards(result);
  _renderAstroSummary(result,name,meta);
  _renderBinderGrid(result,inthaResult);
}

function _renderZodiacChart(result){
  var el=document.getElementById('zodiacChart');if(!el)return;
  var zodArr=_resultToZodiacArr(result);
  el.innerHTML='<div style="display:flex;justify-content:center;margin:0 auto;max-width:340px;">'+
    _buildZodiacSVG(zodArr,'ดวงกำเนิด','สุริยยาตร์','HK '+result.baseVars.H,false)+
    '</div>'+
    '<div style="margin-top:6px;font-size:0.68rem;text-align:center;color:#64748b;">'+
    '☉ '+result.planets.SUN.rasiName+' '+result.planets.SUN.degree+'° | '+
    '☽ '+result.planets.MOON.rasiName+' '+result.planets.MOON.degree+'° | '+
    'ล '+result.lagna.rasiName+' '+result.lagna.degree+'°</div>';
  if(typeof window.animateSVGEntrance==='function')window.animateSVGEntrance(el);
}

function _renderSomphutTable(result,inthaResult){
  var el=document.getElementById('somphutTable');if(!el)return;
  var hazards=inthaResult?inthaResult.hazards:null;
  var html='<div style="overflow-x:auto;"><table class="result-table" style="font-size:0.8rem;min-width:520px;">'+
    '<thead><tr><th>เลข</th><th>ชื่อ</th><th>ราศี</th><th>อง°</th><th>ลป.</th><th>ฤกษ์</th><th>สถานะ</th><th>กำลัง</th>'+
    (hazards?'<th>ฆาต</th>':'')+
    '</tr></thead><tbody>';
  PLANET_DEF.forEach(function(pd){
    var p=result.planets[pd.key];if(!p)return;
    var st=_getStatusStyle(p.statusTH), fi=Math.floor(p.fuek)%27;
    var ghat=hazards?window.InthaphatBrowserEngine.checkPlanetHazards(fi,hazards):null;
    html+='<tr>'+
      '<td><span style="color:'+pd.col+';font-weight:bold;font-size:1.05rem;">'+pd.sym+'</span></td>'+
      '<td style="color:'+pd.col+';font-weight:600;">'+pd.thName+'</td>'+
      '<td style="color:#38bdf8;font-weight:600;">'+p.rasiName+'</td>'+
      '<td>'+p.degree+'</td><td>'+p.lipda+'</td>'+
      '<td style="color:#64748b;font-size:0.7rem;">'+(FUEK_TH[fi]||'—')+'</td>'+
      '<td style="color:'+st.col+';font-size:0.78rem;">'+st.label+(p.isRetrograde?'<span style="color:#ef4444;font-size:0.65rem;margin-left:3px;">↩</span>':'')+'</td>'+
      '<td><div style="background:#0f172a;border-radius:3px;height:6px;width:50px;display:inline-block;overflow:hidden;vertical-align:middle;"><div style="background:'+_powerColor(p.planetPower)+';height:100%;width:'+p.planetPower+'%;"></div></div> <span style="font-size:0.65rem;color:#475569;">'+p.planetPower+'</span></td>'+
      (hazards?'<td style="color:'+ghat.col+';font-size:0.72rem;font-weight:bold;">'+ghat.label+'</td>':'')+
      '</tr>';
  });
  var l=result.lagna, lagFi=Math.floor(l.fuek)%27;
  html+='<tr style="border-top:2px solid #4f46e5;background:rgba(79,70,229,0.05);">'+
    '<td><span style="color:#38bdf8;font-weight:bold;font-size:1.05rem;">ล</span></td>'+
    '<td style="color:#38bdf8;font-weight:600;">ลัคนา</td>'+
    '<td style="color:#38bdf8;font-weight:600;">'+l.rasiName+'</td>'+
    '<td>'+l.degree+'</td><td>'+l.lipda_unit+'</td>'+
    '<td style="color:#64748b;font-size:0.7rem;">'+(FUEK_TH[lagFi]||'—')+'</td>'+
    '<td style="color:#38bdf8;">—</td><td>—</td>'+(hazards?'<td>—</td>':'')+
    '</tr>';
  html+='</tbody></table></div>';
  var bv=result.baseVars;
  html+='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:10px;font-size:0.75rem;">'+
    _kc6Row('หรคุณ',bv.H,'#fbbf24')+_kc6Row('อวมาน',bv.avman.toFixed(1),'#38bdf8')+
    _kc6Row('สุริทิน',bv.suridin.toFixed(2),'#94a3b8')+
    _kc6Row('จ.ศ.',result.meta.csYear,'#fbbf24')+_kc6Row('ดิถี',bv.dithi.toFixed(2),'#a78bfa')+
    _kc6Row('วาร',bv.warName,'#94a3b8')+'</div>';
  el.innerHTML=html;
  if(typeof window.flashTableRows==='function')window.flashTableRows('somphutTable');
}

var _madhyamScrollIdx=0;
function _renderMadhyamCards(result){renderMadhyamCards(result);}
function renderMadhyamCards(result){
  var sc=document.getElementById('madhyamScroll'), ctr=document.getElementById('madhyamCounter');
  if(!sc)return;
  if(!result){sc.innerHTML='<div style="color:#475569;padding:30px;text-align:center;flex-shrink:0;">⏳ กรุณาคำนวณดวงก่อน</div>';return;}
  var cards='';
  var all=PLANET_DEF.concat([{key:'LAGNA',sym:'ล',thName:'ลัคนา',col:'#38bdf8'}]);
  all.forEach(function(pd){
    var p=pd.key==='LAGNA'?null:result.planets[pd.key], l=result.lagna;
    var st=_getStatusStyle(p?p.statusTH:'—');
    cards+='<div class="madhyam-card" style="flex-shrink:0;min-width:150px;max-width:155px;background:linear-gradient(160deg,#1e293b,#0f172a);border:1px solid '+pd.col+'44;border-radius:12px;padding:12px 10px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">'+
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">'+
      '<span style="font-size:1.4rem;font-weight:bold;color:'+pd.col+';">'+pd.sym+'</span>'+
      '<span style="font-size:0.85rem;font-weight:700;color:'+pd.col+';">'+pd.thName+'</span></div>';
    if(p){
      var fi=Math.floor(p.fuek)%27;
      cards+='<div style="font-size:0.7rem;color:#94a3b8;margin-bottom:4px;">มัธยม: <span style="color:#fbbf24;">'+p.meanLipda+' ลป</span></div>'+
        '<div style="font-size:0.7rem;color:#94a3b8;margin-bottom:4px;">สมผุส: <span style="color:#fff;">'+p.rasiName+' '+p.degree+'°'+p.lipda+'\'</span></div>'+
        '<div style="font-size:0.7rem;color:#94a3b8;margin-bottom:4px;">ฤกษ์: <span style="color:#64748b;font-size:0.65rem;">'+(FUEK_TH[fi]||'—')+'</span></div>'+
        '<div style="font-size:0.7rem;color:#94a3b8;margin-bottom:6px;">dθ/dt: <span style="color:'+st.col+';">'+p.dadt.toFixed(2)+'</span></div>'+
        '<div style="font-size:0.72rem;font-weight:bold;color:'+st.col+';margin-bottom:6px;">'+st.label+'</div>'+
        '<div style="background:#0f172a;border-radius:3px;height:5px;overflow:hidden;"><div style="background:'+_powerColor(p.planetPower)+';height:100%;width:'+p.planetPower+'%;"></div></div>'+
        '<div style="font-size:0.62rem;color:#475569;text-align:right;margin-top:2px;">กำลัง '+p.planetPower+'%</div>';
    } else {
      cards+='<div style="font-size:0.7rem;color:#94a3b8;margin-bottom:4px;">สมผุส: <span style="color:#38bdf8;">'+l.rasiName+' '+l.degree+'°'+l.lipda_unit+'\'</span></div>'+
        '<div style="font-size:0.7rem;color:#94a3b8;margin-bottom:4px;">ฤกษ์: <span style="color:#64748b;font-size:0.65rem;">'+(l.fuekName||'—')+'</span></div>'+
        '<div style="font-size:0.7rem;color:#38bdf8;font-weight:bold;">อินทภาส: '+l.indraphas.toFixed(3)+'</div>';
    }
    cards+='</div>';
  });
  sc.innerHTML=cards;
  _madhyamScrollIdx=0;
  if(ctr)ctr.textContent='1 / '+all.length;
}
function scrollMadhyam(dir){
  var el=document.getElementById('madhyamScroll'), ctr=document.getElementById('madhyamCounter');
  if(!el)return;
  el.scrollBy({left:dir*165,behavior:'smooth'});
  var cards=el.querySelectorAll('.madhyam-card');
  if(cards.length>0){
    _madhyamScrollIdx=Math.max(0,Math.min(cards.length-1,_madhyamScrollIdx+dir));
    if(ctr)ctr.textContent=(_madhyamScrollIdx+1)+' / '+cards.length;
  }
}

function _renderAstroSummary(result,name,meta){
  var el=document.getElementById('astroSummary');if(!el)return;
  var bv=result.baseVars, l=result.lagna;
  var retro=PLANET_DEF.filter(function(pd){var p=result.planets[pd.key];return p&&p.isRetrograde;}).map(function(pd){return pd.thName;});
  el.innerHTML='<div style="font-weight:bold;font-size:1rem;color:#0f172a;margin-bottom:8px;">⭐ '+name+'</div>'+
    '<div style="font-size:0.85rem;line-height:1.7;">'+
    '<b>วันเกิด:</b> '+_thaiDate(meta.d,meta.m,meta.y)+' เวลา '+_tpad(meta.hr)+':'+_tpad(meta.mn)+' น.'+
    ' (LMT '+(meta.lmtOff>=0?'+':'')+meta.lmtOff.toFixed(1)+' นาที)<br>'+
    '<b>จ.ศ.:</b> '+result.meta.csYear+' &nbsp; <b>หรคุณ:</b> '+bv.H+' &nbsp; <b>วาร:</b> '+bv.warName+'<br>'+
    '<b>ดิถี:</b> '+bv.dithi.toFixed(2)+' &nbsp; <b>อวมาน:</b> '+bv.avman.toFixed(1)+'<br>'+
    '<b>ลัคนา:</b> <span style="color:#4f46e5;">'+l.dms+' ฤกษ์'+(l.fuekName||'')+'</span><br>'+
    '<b>อาทิตย์:</b> '+result.planets.SUN.dms+'<br>'+
    '<b>จันทร์:</b> '+result.planets.MOON.dms+'<br>'+
    (retro.length>0?'<span style="color:#ef4444;">⚠️ ดาววักรี: '+retro.join(', ')+'</span>':'<span style="color:#10b981;">✅ ไม่มีดาววักรี</span>')+
    '</div>';
}

function _renderBinderGrid(result,inthaResult){
  var el=document.getElementById('binder-grid');if(!el)return;
  var cells=[];for(var i=0;i<12;i++)cells.push({syms:'',count:0});
  PLANET_DEF.forEach(function(pd){
    var p=result.planets[pd.key];if(!p)return;
    var ri=((p.rasi%12)+12)%12;
    cells[ri].syms+='<span style="color:'+pd.col+';font-weight:bold;">'+pd.sym+'</span>';
    cells[ri].count++;
  });
  var lagRi=((result.lagna.rasi%12)+12)%12;
  cells[lagRi].syms+='<span style="color:#38bdf8;font-weight:bold;">ล</span>';
  var sunRi=((result.planets.SUN.rasi%12)+12)%12, moonRi=((result.planets.MOON.rasi%12)+12)%12;
  var hazardRasis={};
  if(inthaResult&&inthaResult.hazards){
    var hz=inthaResult.hazards;
    [hz.pathomMrytayu,hz.kalMrytayu,hz.withiMrytayu].forEach(function(n){var ri=n%12;hazardRasis[ri]=(hazardRasis[ri]||0)+1;});
  }
  var html='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-top:12px;">';
  cells.forEach(function(cell,i){
    var bc='#334155',bg='transparent';
    if(i===lagRi){bc='#4f46e5';bg='rgba(79,70,229,0.07)';}
    if(i===sunRi){bc='#f59e0b';bg='rgba(245,158,11,0.05)';}
    if(i===moonRi){bc='#94a3b8';bg='rgba(148,163,184,0.05)';}
    if(hazardRasis[i]){bc='#ef4444';bg='rgba(239,68,68,0.05)';}
    html+='<div style="background:'+bg+';border:1px solid '+bc+';border-radius:8px;padding:6px 4px;min-height:52px;text-align:center;">'+
      '<div style="font-size:0.6rem;color:#475569;margin-bottom:3px;">'+RASI_TH[i]+'</div>'+
      '<div style="font-size:1.05rem;line-height:1.2;">'+(cell.syms||'<span style="color:#1e293b;">·</span>')+'</div></div>';
  });
  el.innerHTML=html+'</div>';
}

/* ========== Manual Edit Panel ========== */

function _populateManualEditPanel(result){
  var rasiRows=document.getElementById('planetEditRows');
  var lipdaRows=document.getElementById('planetEditRowsLipda');
  if(!rasiRows&&!lipdaRows)return;
  var rasiSel='';
  RASI_TH.forEach(function(r,i){rasiSel+='<option value="'+i+'">'+i+' '+r+'</option>';});
  var rasiHTML='', lipdaHTML='';
  PLANET_DEF.forEach(function(pd){
    var p=result.planets[pd.key];if(!p)return;
    var selStr=rasiSel.replace('value="'+p.rasi+'"','value="'+p.rasi+'" selected');
    rasiHTML+='<div class="planet-edit-row">'+
      '<div class="planet-id-badge" style="background:#1e293b;color:'+pd.col+';font-weight:bold;">'+pd.sym+'</div>'+
      '<select id="editRasi_'+pd.key+'" onchange="_updateEditTotal(\''+pd.key+'\')">'+selStr+'</select>'+
      '<input type="number" id="editDeg_'+pd.key+'" min="0" max="29" value="'+p.degree+'" onchange="_updateEditTotal(\''+pd.key+'\')">'+
      '<input type="number" id="editLipda_'+pd.key+'" min="0" max="59" value="'+p.lipda+'" onchange="_updateEditTotal(\''+pd.key+'\')">'+
      '<input type="number" id="editTotal_'+pd.key+'" value="'+p.totalLipda+'" readonly style="background:#0a0f1e;color:#38bdf8;">'+
      '</div>';
    lipdaHTML+='<div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;padding:6px 0;border-bottom:1px solid #1e293b;">'+
      '<div style="background:#1e293b;color:'+pd.col+';font-weight:bold;font-size:0.8rem;text-align:center;padding:6px 3px;border-radius:6px;">'+pd.sym+' '+pd.thName+'</div>'+
      '<input type="number" id="editLipdaTotal_'+pd.key+'" min="0" max="21599" value="'+p.totalLipda+'" style="padding:7px;font-size:0.85rem;background:#0f172a;border:1px solid #4f46e5;border-radius:7px;color:#a78bfa;font-weight:bold;">'+
      '</div>';
  });
  var lagSelStr=rasiSel.replace('value="'+result.lagna.rasi+'"','value="'+result.lagna.rasi+'" selected');
  rasiHTML+='<div class="planet-edit-row" style="border-top:2px solid #4f46e5;margin-top:4px;">'+
    '<div class="planet-id-badge" style="background:#1e293b;color:#38bdf8;font-weight:bold;">ล</div>'+
    '<select id="editRasi_LAGNA" onchange="_updateEditTotal(\'LAGNA\')">'+lagSelStr+'</select>'+
    '<input type="number" id="editDeg_LAGNA" min="0" max="29" value="'+result.lagna.degree+'" onchange="_updateEditTotal(\'LAGNA\')">'+
    '<input type="number" id="editLipda_LAGNA" min="0" max="59" value="'+result.lagna.lipda_unit+'" onchange="_updateEditTotal(\'LAGNA\')">'+
    '<input type="number" id="editTotal_LAGNA" value="'+result.lagna.lipda+'" readonly style="background:#0a0f1e;color:#38bdf8;">'+
    '</div>';
  lipdaHTML+='<div style="display:grid;grid-template-columns:80px 1fr;gap:6px;align-items:center;padding:6px 0;">'+
    '<div style="background:#1e293b;color:#38bdf8;font-weight:bold;font-size:0.8rem;text-align:center;padding:6px 3px;border-radius:6px;">ล ลัคนา</div>'+
    '<input type="number" id="editLipdaTotal_LAGNA" min="0" max="21599" value="'+result.lagna.lipda+'" style="padding:7px;font-size:0.85rem;background:#0f172a;border:1px solid #4f46e5;border-radius:7px;color:#38bdf8;font-weight:bold;">'+
    '</div>';
  if(rasiRows)rasiRows.innerHTML=rasiHTML;
  if(lipdaRows)lipdaRows.innerHTML=lipdaHTML;
}

function _updateEditTotal(key){
  var rasi=parseInt(_gv('editRasi_'+key))||0, deg=parseInt(_gv('editDeg_'+key))||0, lipda=parseInt(_gv('editLipda_'+key))||0;
  var total=rasi*1800+deg*60+lipda;
  var te=document.getElementById('editTotal_'+key);if(te)te.value=total;
  var le=document.getElementById('editLipdaTotal_'+key);if(le)le.value=total;
}

function applyManualEdit(){
  var bit=window.SCRIPTURE_BIT.birth;
  if(!bit.calcResult){showToast('⚠️ คำนวณดวงก่อน','error');return;}
  var isLP=(typeof currentEditMode!=='undefined'&&currentEditMode==='lipda');
  var FC=21600, mFL=function(v){return ((Math.floor(v)%FC)+FC)%FC;};
  var l2p=window.SuriyayartCalculusEngine?window.SuriyayartCalculusEngine.lipdaToPos:function(L){L=mFL(L);var rs=Math.floor(L/1800),rm=L-rs*1800;return {rasi:rs,degree:Math.floor(rm/60),lipda:rm%60,rasiName:RASI_TH[rs],totalLipda:L};};
  var mp={};
  PLANET_DEF.forEach(function(pd){
    var total=isLP?parseInt(_gv('editLipdaTotal_'+pd.key))||0:parseInt(_gv('editTotal_'+pd.key))||(parseInt(_gv('editRasi_'+pd.key))||0)*1800+(parseInt(_gv('editDeg_'+pd.key))||0)*60+(parseInt(_gv('editLipda_'+pd.key))||0);
    total=mFL(total);
    var pos=l2p(total), orig=bit.calcResult.planets[pd.key]||{};
    mp[pd.key]=Object.assign({},orig,{totalLipda:total,rasi:pos.rasi,degree:pos.degree,lipda:pos.lipda,rasiName:pos.rasiName,dms:'ร'+pos.rasi+'('+pos.rasiName+') '+pos.degree+'°'+pos.lipda+'\''});
  });
  var lagT=isLP?parseInt(_gv('editLipdaTotal_LAGNA'))||0:parseInt(_gv('editTotal_LAGNA'))||(parseInt(_gv('editRasi_LAGNA'))||0)*1800+(parseInt(_gv('editDeg_LAGNA'))||0)*60+(parseInt(_gv('editLipda_LAGNA'))||0);
  lagT=mFL(lagT); var lagPos=l2p(lagT);
  var mr=Object.assign({},bit.calcResult,{planets:mp,lagna:Object.assign({},bit.calcResult.lagna,{lipda:lagT,rasi:lagPos.rasi,degree:lagPos.degree,lipda_unit:lagPos.lipda,rasiName:lagPos.rasiName,dms:'ร'+lagPos.rasi+'('+lagPos.rasiName+') '+lagPos.degree+'°'+lagPos.lipda+'\''})});
  bit.isManualOverride=true; bit.manualPositions=mr;
  _renderBirthChartAll(mr,bit.inthaResult,bit.name,{d:bit.d,m:bit.m,y:bit.y,hr:bit.hr,mn:bit.mn,lng:bit.lng,lmtOff:bit.lmtOffset});
  var badge=document.getElementById('manualOverrideBadge');if(badge)badge.style.display='inline-flex';
  var sEl=document.getElementById('manualEditStatus');
  if(sEl){sEl.style.color='#10b981';sEl.style.background='rgba(16,185,129,0.1)';sEl.textContent='✅ บันทึกค่า Manual Override เรียบร้อย';}
  showToast('✅ Manual Override ใช้งาน','success');
}

function resetManualEdit(){
  var bit=window.SCRIPTURE_BIT.birth;if(!bit.calcResult)return;
  bit.isManualOverride=false;bit.manualPositions=null;
  _populateManualEditPanel(bit.calcResult);
  _renderBirthChartAll(bit.calcResult,bit.inthaResult,bit.name,{d:bit.d,m:bit.m,y:bit.y,hr:bit.hr,mn:bit.mn,lng:bit.lng,lmtOff:bit.lmtOffset});
  var badge=document.getElementById('manualOverrideBadge');if(badge)badge.style.display='none';
  var sEl=document.getElementById('manualEditStatus');
  if(sEl){sEl.style.color='#f59e0b';sEl.style.background='rgba(245,158,11,0.1)';sEl.textContent='↩ คืนค่าอัตโนมัติ';}
  showToast('↩ คืนค่าอัตโนมัติเรียบร้อย','info');
}

function generateAllFromSun(){
  var bit=window.SCRIPTURE_BIT.birth;
  if(!bit.calcResult){showToast('⚠️ คำนวณดวงก่อน','error');return;}
  if(!window.SuriyayartCalculusEngine){showToast('❌ ไม่พบ Engine','error');return;}
  var isLP=(typeof currentEditMode!=='undefined'&&currentEditMode==='lipda');
  var mSL=isLP?parseInt(_gv('editLipdaTotal_SUN'))||0:parseInt(_gv('editTotal_SUN'))||(parseInt(_gv('editRasi_SUN'))||0)*1800+(parseInt(_gv('editDeg_SUN'))||0)*60+(parseInt(_gv('editLipda_SUN'))||0);
  var FC=21600, mFL=function(v){return ((Math.floor(v)%FC)+FC)%FC;};
  mSL=mFL(mSL);
  var shift=mSL-bit.calcResult.planets.SUN.totalLipda;
  PLANET_DEF.forEach(function(pd){
    var origP=bit.calcResult.planets[pd.key];if(!origP)return;
    var nt=mFL(origP.totalLipda+shift);
    var rs=Math.floor(nt/1800), rm=nt-rs*1800, dg=Math.floor(rm/60), lp=rm%60;
    _sv('editRasi_'+pd.key,rs);_sv('editDeg_'+pd.key,dg);_sv('editLipda_'+pd.key,lp);
    _sv('editTotal_'+pd.key,nt);_sv('editLipdaTotal_'+pd.key,nt);
  });
  var nLT=mFL(bit.calcResult.lagna.lipda+shift);
  var lR=Math.floor(nLT/1800), lRm=nLT-lR*1800;
  _sv('editRasi_LAGNA',lR);_sv('editDeg_LAGNA',Math.floor(lRm/60));_sv('editLipda_LAGNA',lRm%60);
  _sv('editTotal_LAGNA',nLT);_sv('editLipdaTotal_LAGNA',nLT);
  var sEl=document.getElementById('manualEditStatus');
  if(sEl){sEl.style.color='#38bdf8';sEl.style.background='rgba(56,189,248,0.1)';sEl.textContent='✨ Generate All สำเร็จ — shift='+shift+' ลป';}
  showToast('✨ คำนวณดาวทุกดวงจากอาทิตย์สำเร็จ','success');
}

/* ============================================================
   I.  MENU ๕ — ตั้งกาลชำระ / ดาวจร
   ============================================================ */

function autoCalculate(){
  if(!window.SuriyayartCalculusEngine){showToast('❌ ไม่พบ Engine','error');return;}
  var day=parseInt(_gv('tDay'))||0, month=parseInt(_gv('tMonth'))||0, year=parseInt(_gv('tYear'))||0;
  var hour=parseInt(_gv('tHour'))||6, min=parseInt(_gv('tMin'))||0;
  if(!day||!month||!year){showToast('⚠️ กรุณากรอกวัน/เดือน/ปีจร','error');return;}
  var lng=parseFloat(_gv('pLng'))||100.527, lmt=_applyLMT(hour,min,lng);
  showLoading('🔮 คำนวณดาวจร...');
  setTimeout(function(){
    try{
      var result=window.SuriyayartCalculusEngine.calculatePlanets(year,month,day,lmt.adjHr,lmt.adjMn,true);
      window.SCRIPTURE_BIT.transit={d:day,m:month,y:year,hr:hour,mn:min,lng:lng,lmtOffset:lmt.lmtOff,calcResult:result,inthaResult:null,finalized:false};
      var sun=result.planets.SUN, moon=result.planets.MOON, lag=result.lagna, bv=result.baseVars;
      var mrBox=document.getElementById('manualResultBox');
      if(mrBox){
        mrBox.style.display='block';
        mrBox.innerHTML='<div style="font-size:0.75rem;color:#a78bfa;font-weight:bold;margin-bottom:6px;">📅 ดาวจร '+_thaiDate(day,month,year)+' '+_tpad(hour)+':'+_tpad(min)+' น.</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:0.72rem;">'+
          '<span style="color:#64748b;">จ.ศ.:</span><span style="color:#fbbf24;">'+result.meta.csYear+'</span>'+
          '<span style="color:#64748b;">หรคุณ:</span><span style="color:#fbbf24;">'+bv.H+'</span>'+
          '<span style="color:#64748b;">ดิถี:</span><span style="color:#a78bfa;">'+bv.dithi.toFixed(2)+'</span>'+
          '<span style="color:#64748b;">วาร:</span><span style="color:#94a3b8;">'+bv.warName+'</span>'+
          '<span style="color:#64748b;">☉:</span><span style="color:#f59e0b;">'+sun.rasiName+' '+sun.degree+'°'+sun.lipda+'\'</span>'+
          '<span style="color:#64748b;">☽:</span><span style="color:#94a3b8;">'+moon.rasiName+' '+moon.degree+'°'+moon.lipda+'\'</span>'+
          '<span style="color:#64748b;">ล:</span><span style="color:#38bdf8;">'+lag.rasiName+' '+lag.degree+'°'+lag.lipda_unit+'\'</span>'+
          '</div>';
      }
      _buildM5PlanetEditor(result);
      var pe=document.getElementById('m5PlanetEditor');if(pe)pe.style.display='block';
      var bf=document.getElementById('btnFinalize');if(bf)bf.style.display='block';
      var rb=document.getElementById('inthaphatRes');
      if(rb){rb.style.display='block';rb.innerHTML='✅ คำนวณดาวจรเสร็จแล้ว — กรุณาตรวจสอบและกด <b>✅ ยืนยันและบันทึก</b>';}
      hideLoading();showToast('✅ คำนวณดาวจรสำเร็จ','success');
    }catch(e){hideLoading();console.error('[autoCalculate]',e);showToast('❌ '+e.message,'error');}
  },50);
}

function _buildM5PlanetEditor(result){
  var el=document.getElementById('m5PlanetRows');if(!el)return;
  var html='';
  PLANET_DEF.forEach(function(pd){
    var p=result.planets[pd.key];if(!p)return;
    var st=_getStatusStyle(p.statusTH);
    html+='<div style="display:grid;grid-template-columns:50px 1fr 90px;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid #0f172a;">'+
      '<div style="background:#1e293b;color:'+pd.col+';font-weight:bold;text-align:center;border-radius:6px;padding:5px 2px;font-size:0.85rem;">'+pd.sym+'</div>'+
      '<div style="font-size:0.72rem;"><div style="color:'+pd.col+';font-weight:600;">'+pd.thName+'</div>'+
      '<div style="color:#38bdf8;">'+p.rasiName+' '+p.degree+'°'+p.lipda+'\' ['+p.totalLipda+']</div>'+
      '<div style="color:'+st.col+';font-size:0.65rem;">'+st.label+(p.isRetrograde?' วักรี':'')+'</div></div>'+
      '<input class="m5-lp-input" type="number" id="m5lp_'+pd.key+'" min="0" max="21599" value="'+p.totalLipda+'">'+
      '</div>';
  });
  var lag=result.lagna;
  html+='<div style="display:grid;grid-template-columns:50px 1fr 90px;align-items:center;gap:6px;padding:5px 0;border-top:2px solid #4f46e5;">'+
    '<div style="background:#1e293b;color:#38bdf8;font-weight:bold;text-align:center;border-radius:6px;padding:5px 2px;">ล</div>'+
    '<div style="font-size:0.72rem;"><div style="color:#38bdf8;font-weight:600;">ลัคนา</div>'+
    '<div style="color:#38bdf8;">'+lag.rasiName+' '+lag.degree+'°'+lag.lipda_unit+'\' ['+lag.lipda+']</div></div>'+
    '<input class="m5-lp-input" type="number" id="m5lp_LAGNA" min="0" max="21599" value="'+lag.lipda+'">'+
    '</div>';
  el.innerHTML=html;
}

function finalizeData(){
  var bit=window.SCRIPTURE_BIT.transit;
  if(!bit.calcResult){showToast('⚠️ กรุณา Auto-Calculate ก่อน','error');return;}
  var FC=21600, mFL=function(v){return ((Math.floor(v)%FC)+FC)%FC;};
  var l2p=window.SuriyayartCalculusEngine?window.SuriyayartCalculusEngine.lipdaToPos:function(L){L=mFL(L);var rs=Math.floor(L/1800),rm=L-rs*1800;return {rasi:rs,degree:Math.floor(rm/60),lipda:rm%60,rasiName:RASI_TH[rs],totalLipda:L};};
  var op={}, anyOv=false;
  PLANET_DEF.forEach(function(pd){
    var inp=document.getElementById('m5lp_'+pd.key), orig=bit.calcResult.planets[pd.key];
    if(!inp||!orig){op[pd.key]=orig;return;}
    var iv=parseInt(inp.value);
    if(!isNaN(iv)&&iv!==orig.totalLipda){anyOv=true;var nt=mFL(iv),pos=l2p(nt);op[pd.key]=Object.assign({},orig,{totalLipda:nt,rasi:pos.rasi,degree:pos.degree,lipda:pos.lipda,rasiName:pos.rasiName,dms:'ร'+pos.rasi+'('+pos.rasiName+') '+pos.degree+'°'+pos.lipda+'\''})}
    else op[pd.key]=orig;
  });
  var li=document.getElementById('m5lp_LAGNA'), fl=bit.calcResult.lagna;
  if(li){var lv=parseInt(li.value);if(!isNaN(lv)&&lv!==fl.lipda){anyOv=true;var lp=l2p(mFL(lv));fl=Object.assign({},fl,{lipda:mFL(lv),rasi:lp.rasi,degree:lp.degree,lipda_unit:lp.lipda,rasiName:lp.rasiName,dms:'ร'+lp.rasi+'('+lp.rasiName+') '+lp.degree+'°'+lp.lipda+'\''});}}
  var fcr=Object.assign({},bit.calcResult,{planets:op,lagna:fl});
  bit.calcResult=fcr;bit.finalized=true;
  var bBit=window.SCRIPTURE_BIT.birth;
  if(bBit.inthaResult){
    var lagNak=Math.floor(fl.fuek||0)%27, age=(bit.y||2568)-(bBit.y||2500);
    var ti=window.InthaphatBrowserEngine.runTransitPipeline(bBit.inthaResult,age,lagNak);
    bit.inthaResult=ti;window.SCRIPTURE_BIT.inthaphat.transitOutput=ti;
  }
  if(typeof pushCalcResult==='function')pushCalcResult('menu5',{d:bit.d,m:bit.m,y:bit.y,hr:bit.hr,mn:bit.mn,hk:fcr.baseVars.H,cs:fcr.meta.csYear});
  _renderM5InthaphatSection(bit.calcResult,bBit.calcResult);
  var sEl=document.getElementById('m5FinalizeStatus');
  if(sEl){sEl.style.display='block';sEl.textContent='✅ บันทึกดาวจร '+_thaiDate(bit.d,bit.m,bit.y)+' เรียบร้อย'+(anyOv?' (Manual Override บางดาว)':'');}
  showToast('✅ Finalize ดาวจรสำเร็จ','success');
}

function _renderM5InthaphatSection(tr,br){
  var sEl=document.getElementById('m5InthaSection');if(!sEl)return;
  sEl.style.display='block';
  var svgEl=document.getElementById('intha_svg_container');
  if(svgEl&&tr){
    var za=_resultToZodiacArr(tr);
    svgEl.innerHTML='<div style="max-width:300px;margin:0 auto;padding:8px;">'+_buildZodiacSVG(za,'ดาวจร',tr.meta.csYear+'','HK '+tr.baseVars.H,true)+'</div>';
  }
  var tEl=document.getElementById('m5InthaphasTable');if(!tEl)return;
  var html='<div style="overflow-x:auto;"><table class="result-table" style="font-size:0.78rem;"><thead><tr><th>ดาว</th><th>กำเนิด</th><th>จร</th><th>ห่างกัน</th><th>สถานะ</th></tr></thead><tbody>';
  PLANET_DEF.forEach(function(pd){
    var bp=br?br.planets[pd.key]:null, tp=tr?tr.planets[pd.key]:null;if(!tp)return;
    var diffRasi=bp?_mod(tp.rasi-bp.rasi,12):'?';
    var dc=diffRasi===0?'#10b981':(diffRasi===6?'#ef4444':(diffRasi===1||diffRasi===11?'#f59e0b':'#94a3b8'));
    var st=_getStatusStyle(tp.statusTH);
    html+='<tr>'+
      '<td><span style="color:'+pd.col+';font-weight:bold;">'+pd.sym+'</span> '+pd.thName+'</td>'+
      '<td style="color:#94a3b8;">'+(bp?bp.rasiName+' '+bp.degree+'°':'—')+'</td>'+
      '<td style="color:#38bdf8;font-weight:600;">'+tp.rasiName+' '+tp.degree+'°</td>'+
      '<td style="color:'+dc+';font-weight:bold;">'+diffRasi+' ร.</td>'+
      '<td style="color:'+st.col+';font-size:0.72rem;">'+st.label+(tp.isRetrograde?' ↩':'')+'</td></tr>';
  });
  var tl=tr?tr.lagna:null,bl=br?br.lagna:null;
  if(tl){var ld=bl?_mod(tl.rasi-bl.rasi,12):'?';html+='<tr style="border-top:2px solid #4f46e5;"><td><span style="color:#38bdf8;font-weight:bold;">ล</span> ลัคนา</td><td style="color:#94a3b8;">'+(bl?bl.rasiName+' '+bl.degree+'°':'—')+'</td><td style="color:#38bdf8;font-weight:600;">'+tl.rasiName+' '+tl.degree+'°</td><td style="color:#a78bfa;font-weight:bold;">'+ld+' ร.</td><td>—</td></tr>';}
  var ti=window.SCRIPTURE_BIT.transit.inthaResult;
  if(ti)html+='<tr style="background:rgba(239,68,68,0.05);"><td colspan="5" style="padding:8px;"><b style="color:'+(ti.isKhatCrisis?'#ef4444':'#10b981')+';">'+ti.statusText+'</b></td></tr>';
  html+='</tbody></table></div>';
  tEl.innerHTML=html;
  if(typeof window.flashTableRows==='function')window.flashTableRows('m5InthaphasTable');
}

function spRunMasterEngine(){
  var logEl=document.getElementById('sp_engine_logs'), zodEl=document.getElementById('sp_zodiac_container');
  var starEl=document.getElementById('sp_star_analysis_table'), sumEl=document.getElementById('sp_summary_display');
  function log(msg,col){if(!logEl)return;var d=document.createElement('div');d.style.color=col||'#4ade80';d.textContent='> '+msg;logEl.appendChild(d);logEl.scrollTop=logEl.scrollHeight;}
  if(logEl)logEl.innerHTML='';
  log('[INIT] Scripture Processor v2.5 เริ่มต้น...','#38bdf8');
  var bdEl=document.getElementById('sp_birth_date'), btEl=document.getElementById('sp_birth_time'), tyEl=document.getElementById('sp_target_year');
  if(!bdEl||!bdEl.value){log('[ERROR] ไม่พบวันเกิด','#ef4444');return;}
  var pts=bdEl.value.split('-'), ceY=parseInt(pts[0]), beY=ceY+543, mon=parseInt(pts[1]), dy=parseInt(pts[2]);
  var tPts=btEl?(btEl.value||'06:00').split(':'):['6','0'], hr=parseInt(tPts[0])||6, mn=parseInt(tPts[1])||0;
  var tgtYear=parseInt(tyEl?tyEl.value:'2568')||2568;
  log('[STEP 1] วันเกิด: '+_thaiDate(dy,mon,beY)+' '+_tpad(hr)+':'+_tpad(mn));
  var result;
  if(window.SCRIPTURE_BIT.birth.calcResult&&window.SCRIPTURE_BIT.birth.d===dy&&window.SCRIPTURE_BIT.birth.m===mon&&window.SCRIPTURE_BIT.birth.y===beY){result=window.SCRIPTURE_BIT.birth.calcResult;log('[STEP 1] ✅ ใช้ผลลัพธ์จาก SCRIPTURE_BIT','#fbbf24');}
  else if(window.SuriyayartCalculusEngine){try{result=window.SuriyayartCalculusEngine.calculatePlanets(beY,mon,dy,hr,mn,true);log('[STEP 2] ✅ คำนวณด้วย SuriyayartCalculusEngine');}catch(e){log('[ERROR] '+e.message,'#ef4444');return;}}
  else{log('[ERROR] ไม่พบ SuriyayartCalculusEngine','#ef4444');return;}
  var cs=result.meta.csYear, war=result.baseVars.war, moonP=result.planets.MOON;
  var lagFi=Math.floor(result.lagna.fuek)%27;
  log('[STEP 3] จ.ศ.:'+cs+' | HK:'+result.baseVars.H+' | วาร:'+result.baseVars.warName);
  var natalOut=window.InthaphatBrowserEngine.runBirthPipeline(cs,war,moonP.rasi,moonP.degree,moonP.lipda);
  log('[STEP 4] ✅ ฤกษ์ปฏิสนธิ:'+natalOut.targetNakhatIndex+' — '+(natalOut.nakhatName||''));
  log('[STEP 4] ฆาต: ปฐม='+natalOut.hazards.pathomMrytayu+' กาล='+natalOut.hazards.kalMrytayu+' วิถี='+natalOut.hazards.withiMrytayu);
  var age=tgtYear-beY, ti=window.InthaphatBrowserEngine.runTransitPipeline(natalOut,age,lagFi);
  log('[STEP 5] ✅ ชันษาจร ปี '+tgtYear+' (อายุ '+age+' ปี)');
  log('[STEP 5] '+ti.statusText,ti.isKhatCrisis?'#ef4444':'#10b981');
  window.SCRIPTURE_BIT.inthaphat={natalOutput:natalOut,transitOutput:ti,scriptureResult:{natal:natalOut,transit:ti,year:tgtYear,age:age}};
  if(zodEl){var za=_resultToZodiacArr(result);zodEl.innerHTML='<div style="max-width:320px;margin:0 auto;">'+_buildZodiacSVG(za,'Scripture',cs+'','HK '+result.baseVars.H,false)+'</div><div style="text-align:center;margin-top:8px;font-size:0.72rem;color:#64748b;">ฤกษ์ปฏิสนธิ: <b style="color:#fbbf24;">'+natalOut.targetNakhatIndex+' — '+(natalOut.nakhatName||'')+'</b></div>';}
  if(starEl){
    var sh='<table class="result-table" style="font-size:0.75rem;"><thead><tr><th>ดาว</th><th>ราศี</th><th>ฤกษ์</th><th>จุดฆาต</th></tr></thead><tbody>';
    PLANET_DEF.forEach(function(pd){var p=result.planets[pd.key];if(!p)return;var fi=Math.floor(p.fuek)%27,g=window.InthaphatBrowserEngine.checkPlanetHazards(fi,natalOut.hazards);sh+='<tr><td><span style="color:'+pd.col+';font-weight:bold;">'+pd.sym+' '+pd.thName+'</span></td><td style="color:#38bdf8;">'+p.rasiName+' '+p.degree+'°</td><td style="color:#64748b;font-size:0.68rem;">'+(FUEK_TH[fi]||'?')+'</td><td style="color:'+g.col+';font-weight:bold;">'+g.label+'</td></tr>';});
    starEl.innerHTML=sh+'</tbody></table>';
  }
  if(sumEl){
    var rI=natalOut.targetNakhatIndex%9, rN=INTHA_RULER_SEQ[rI]||'?', rC=INTHA_RULER_COLS[rI]||'#94a3b8';
    var tRI=ti.transitInthaphatNakhat%9, tRN=INTHA_RULER_SEQ[tRI]||'?', tRC=INTHA_RULER_COLS[tRI]||'#94a3b8';
    sumEl.innerHTML='<div style="'+(ti.isKhatCrisis?'background:rgba(239,68,68,0.1);border-left:4px solid #ef4444;':'background:rgba(16,185,129,0.08);border-left:4px solid #10b981;')+'border-radius:8px;padding:12px;margin-bottom:10px;"><b style="color:'+(ti.isKhatCrisis?'#ef4444':'#10b981')+';">'+ti.statusText+'</b></div>'+
      '<div style="font-size:0.78rem;line-height:1.8;"><b>ฤกษ์ปฏิสนธิ:</b> '+natalOut.targetNakhatIndex+' <span style="color:#fbbf24;">'+(natalOut.nakhatName||'')+'</span><br><b>เจ้าของฤกษ์:</b> <span style="color:'+rC+';font-weight:bold;">'+rN+'</span><br><b>ฤกษ์จร (ปี '+tgtYear+'):</b> '+ti.transitInthaphatNakhat+' <span style="color:#38bdf8;">'+FUEK_TH[ti.transitInthaphatNakhat%27]+'</span><br><b>ดาวเสวยชันษา:</b> <span style="color:'+tRC+';font-weight:bold;">'+tRN+'</span><br><b>ลัคนาฤกษ์:</b> '+lagFi+' <span style="color:#a78bfa;">'+FUEK_TH[lagFi]+'</span></div>';
  }
  log('[DONE] Scripture Processor ประมวลผลเสร็จสมบูรณ์ 🔱','#fbbf24');
}

function spResetEngine(){
  var ids=['sp_engine_logs','sp_zodiac_container','sp_star_analysis_table','sp_summary_display'];
  ids.forEach(function(id){var el=document.getElementById(id);if(el)el.innerHTML=id==='sp_engine_logs'?'<div style="color:#4ade80;">> Scripture Processor พร้อมใช้งาน...</div>':'';});
}

function hlikAutoFill(){
  var br=window.SCRIPTURE_BIT.birth.calcResult, tr=window.SCRIPTURE_BIT.transit.calcResult;
  function fill(result,prefix,lSuffix){
    if(!result)return;var p=result.planets,l=result.lagna;
    _sv(prefix+'y1r1',p.SUN.rasi);_sv(prefix+'y1r2',p.SUN.degree);
    _sv(prefix+'y1r3',p.MOON.rasi);_sv(prefix+'y1r4',p.MOON.degree);
    _sv(prefix+'y1r5',p.MARS.rasi);_sv(prefix+'y1r6',p.MARS.degree);
    _sv(prefix+'ygr1',p.MERCURY.rasi);_sv(prefix+'ygr2',p.MERCURY.degree);
    _sv(prefix+'ygr3',p.JUPITER.rasi);_sv(prefix+'ygr4',p.JUPITER.degree);
    _sv(prefix+'ygr5',p.VENUS.rasi);_sv(prefix+'ygr6',p.VENUS.degree);
    _sv(prefix+'y2r1',p.SATURN.rasi);_sv(prefix+'y2r2',p.SATURN.degree);
    _sv(prefix+'y2r3',p.RAHU.rasi);_sv(prefix+'y2r4',p.RAHU.degree);
    _sv(prefix+'y2r5',p.KETU.rasi);_sv(prefix+'y2r6',p.KETU.degree);
    _sv('hlik_l1'+lSuffix,l.rasi);_sv('hlik_l2'+lSuffix,l.degree);
  }
  fill(br,'hb_','_birth');fill(tr,'ht_','_transit');
  if(typeof hlikCalculate==='function')hlikCalculate();
}

/* ============================================================
   J.  MENU ๖ — กาลชำระ & อ้างอิงสุดท้าย
   ============================================================ */

function _kc6Row(label,value,col){
  return '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:8px;"><div style="color:#64748b;font-size:0.65rem;">'+label+'</div><div style="color:'+(col||'#fff')+';font-weight:bold;">'+value+'</div></div>';
}

function renderMenu6(){
  var pLbl=document.getElementById('kc6PersonLabel'), cont=document.getElementById('kc6Container'), ebody=document.getElementById('extraPlanetBody');
  var bit=window.SCRIPTURE_BIT.birth;
  if(!bit.calcResult){
    if(pLbl)pLbl.textContent='— กรุณาผูกดวงในเมนู ๑ ก่อน —';
    if(cont)cont.innerHTML='<div style="text-align:center;color:#475569;padding:40px 0;">⏳ กรุณาผูกดวงในเมนู ๑ ก่อน</div>';
    return;
  }
  var result=bit.isManualOverride&&bit.manualPositions?bit.manualPositions:bit.calcResult;
  var intha=bit.inthaResult, bv=result.baseVars, l=result.lagna;
  if(pLbl)pLbl.textContent='✅ '+(bit.name||'ไม่ระบุ')+' — '+_thaiDate(bit.d,bit.m,bit.y);
  var kc6='';
  kc6+='<div class="kc6-section"><div class="kc6-header open" onclick="this.classList.toggle(\'open\');var b=this.nextElementSibling;b.classList.toggle(\'open\');"><div class="kc6-header-left"><span class="kc6-step-badge">ปฏิทิน</span><div><div class="kc6-title">ข้อมูลดาราศาสตร์พื้นฐาน</div><div class="kc6-subtitle">หรคุณ · อวมาน · ดิถี · สุริทิน</div></div></div><span class="kc6-value-chip">จ.ศ.'+result.meta.csYear+'</span><span class="kc6-chevron">▼</span></div>'+
    '<div class="kc6-body open"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.8rem;">'+
    _kc6Row('หรคุณ (HK)',bv.H,'#fbbf24')+_kc6Row('จ.ศ.',result.meta.csYear,'#fbbf24')+
    _kc6Row('มาสเกณฑ์',bv.masaKendra.toFixed(4),'#a78bfa')+_kc6Row('ดิถี',bv.dithi.toFixed(4),'#a78bfa')+
    _kc6Row('อวมาน',bv.avman.toFixed(1),'#38bdf8')+_kc6Row('สุริทิน',bv.suridin.toFixed(4),'#38bdf8')+
    _kc6Row('วาร',bv.warName,'#94a3b8')+_kc6Row('ค.ศ.',result.meta.ceYear+'','#94a3b8')+
    _kc6Row('LMT Offset',(bit.lmtOffset>=0?'+':'')+((bit.lmtOffset||0).toFixed(1))+' นาที','#10b981')+
    _kc6Row('เวลา LMT',_tpad(bit.adjHr||6)+':'+_tpad(bit.adjMn||0)+' น.','#10b981')+
    '</div></div></div>';
  kc6+='<div class="kc6-section"><div class="kc6-header" onclick="this.classList.toggle(\'open\');var b=this.nextElementSibling;b.classList.toggle(\'open\');"><div class="kc6-header-left"><span class="kc6-step-badge">ดาวเคราะห์</span><div><div class="kc6-title">ตารางสมผุสสมบูรณ์</div><div class="kc6-subtitle">10 ดวง + ลัคนา</div></div></div><span class="kc6-value-chip">ล '+l.rasiName+'</span><span class="kc6-chevron">▼</span></div>'+
    '<div class="kc6-body"><div id="kc6PlanetTableInner"></div></div></div>';
  kc6+='<div class="kc6-section"><div class="kc6-header" onclick="this.classList.toggle(\'open\');var b=this.nextElementSibling;b.classList.toggle(\'open\');"><div class="kc6-header-left"><span class="kc6-step-badge">ลัคนา</span><div><div class="kc6-title">ลัคนาและอินทภาส</div><div class="kc6-subtitle">ฤกษ์สักกราว · ฤกษ์ลัคนา · ฆาตมฤตยู</div></div></div><span class="kc6-value-chip">ฤกษ์'+Math.floor(l.fuek)%27+'</span><span class="kc6-chevron">▼</span></div>'+
    '<div class="kc6-body"><div style="font-size:0.8rem;line-height:1.8;"><b style="color:#38bdf8;">ลัคนา:</b> '+l.dms+'<br><b>ฤกษ์ลัคนา:</b> '+(l.fuekName||FUEK_TH[Math.floor(l.fuek||0)%27]||'?')+' ('+((l.fuek||0).toFixed(3))+')<br>'+
    '<b>อินทภาส:</b> '+((l.indraphas||0).toFixed(4))+' ฤกษ์<br>'+
    (intha?'<b>ฤกษ์ปฏิสนธิ:</b> <span style="color:#fbbf24;">'+intha.targetNakhatIndex+' — '+(intha.nakhatName||'')+'</span><br>'+
    '<b>ฆาต:</b> ปฐม='+intha.hazards.pathomMrytayu+' กาล='+intha.hazards.kalMrytayu+' วิถี='+intha.hazards.withiMrytayu+'<br>':'')+
    '</div></div></div>';
  if(cont){
    cont.innerHTML=kc6;
    var ptEl=document.getElementById('kc6PlanetTableInner');
    if(ptEl){
      var ph='<div style="overflow-x:auto;"><table class="result-table" style="font-size:0.75rem;"><thead><tr><th>เลข</th><th>ชื่อ</th><th>ราศี</th><th>อง</th><th>ลป</th><th>ฤกษ์</th><th>สถานะ</th></tr></thead><tbody>';
      PLANET_DEF.forEach(function(pd){var p=result.planets[pd.key];if(!p)return;var st=_getStatusStyle(p.statusTH),fi=Math.floor(p.fuek)%27;ph+='<tr><td style="color:'+pd.col+';font-weight:bold;">'+pd.sym+'</td><td style="color:'+pd.col+';">'+pd.thName+'</td><td style="color:#38bdf8;">'+p.rasiName+'</td><td>'+p.degree+'</td><td>'+p.lipda+'</td><td style="color:#64748b;font-size:0.68rem;">'+(FUEK_TH[fi]||'?')+'</td><td style="color:'+st.col+';font-size:0.72rem;">'+st.label+(p.isRetrograde?'↩':'')+'</td></tr>';});
      ph+='<tr style="border-top:2px solid #4f46e5;"><td style="color:#38bdf8;font-weight:bold;">ล</td><td style="color:#38bdf8;">ลัคนา</td><td style="color:#38bdf8;font-weight:bold;">'+l.rasiName+'</td><td>'+l.degree+'</td><td>'+l.lipda_unit+'</td><td style="color:#64748b;font-size:0.68rem;">'+(l.fuekName||'')+'</td><td>—</td></tr>';
      ptEl.innerHTML=ph+'</tbody></table></div>';
    }
  }
  if(ebody&&intha){
    var eb='';
    PLANET_DEF.forEach(function(pd){var p=result.planets[pd.key];if(!p)return;var fi=Math.floor(p.fuek)%27,g=window.InthaphatBrowserEngine.checkPlanetHazards(fi,intha.hazards),st=_getStatusStyle(p.statusTH);eb+='<tr><td><span style="color:'+pd.col+';font-weight:bold;">'+pd.sym+' '+pd.thName+'</span></td><td style="color:#38bdf8;">'+p.dms+'</td><td style="color:#64748b;font-size:0.8em;">'+(FUEK_TH[fi]||'?')+' ('+fi+')</td><td style="color:'+g.col+';font-weight:bold;">'+g.label+'</td><td style="color:'+st.col+';font-size:0.85em;">'+st.label+(p.isRetrograde?' ↩':'')+'</td></tr>';});
    ebody.innerHTML=eb;
  }
}

/* ============================================================
   K.  MENU ๘ — จับยามสามตา / วิเศษจินดา
   ============================================================ */

function executeYam(){
  var sel=document.getElementById('yamSystem'), yamBox=document.getElementById('yamRes');
  if(!yamBox)return;
  var isJinda=sel&&sel.value==='jinda', now=new Date();
  if(isJinda)_executeYamJinda(now,yamBox); else _executeYamSamtah(now,yamBox);
  yamBox.style.display='block';_scrollToEl('yamRes');
}

function _executeYamSamtah(now,box){
  var h=now.getHours(), mn=now.getMinutes(), tot=h*60+mn;
  var yn=['','ยามอาทิตย์','ยามจันทร์','ยามอังคาร','ยามพุธ','ยามพฤหัสบดี','ยามศุกร์','ยามเสาร์','ยามราหู'];
  var yp=['','อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','ราหู'];
  var yi;
  if(tot>=360&&tot<1080)yi=Math.floor((tot-360)/90)+1;
  else if(tot<360)yi=Math.floor((tot+720)/90)+1;
  else yi=Math.floor((tot-1080)/90)+1;
  yi=Math.max(1,Math.min(8,yi));
  var dithi=1;
  if(window.SCRIPTURE_BIT.birth.calcResult)dithi=Math.floor(window.SCRIPTURE_BIT.birth.calcResult.baseVars.dithi||1);
  var fn=['กลาง','ชี้','นาง'];
  var te=[(dithi-1)%3,(yi-1)%3,(dithi+yi)%3].map(function(i){return fn[i];});
  var gb={good:'✅ นิ้วชี้ = เวลาดี โชคลาภ',bad:'⚠️ นิ้วนาง = ระวัง',neutral:'⚪ นิ้วกลาง = กลาง ๆ'};
  var rt=yi%3===1?'good':(yi%3===2?'neutral':'bad');
  var yc={1:'#f59e0b',2:'#94a3b8',3:'#ef4444',4:'#10b981',5:'#fbbf24',6:'#ec4899',7:'#64748b',8:'#a855f7'};
  window.SCRIPTURE_BIT.yam.samta={yamIdx:yi,yamName:yn[yi],threeEye:te,resultType:rt};
  box.innerHTML='<div style="font-size:1rem;font-weight:bold;color:'+(yc[yi]||'#94a3b8')+';margin-bottom:8px;text-align:center;">⏱ '+yn[yi]+'</div>'+
    '<div style="text-align:center;font-size:0.8rem;color:#64748b;margin-bottom:12px;">'+_tpad(h)+':'+_tpad(mn)+' น. — ยามที่ '+yi+' (ดาว: '+yp[yi]+')</div>'+
    '<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:10px;"><div style="color:#fbbf24;font-weight:bold;margin-bottom:6px;">🖐️ ยามสามตา</div>'+
    '<div style="font-size:0.85rem;line-height:1.8;"><b>ดิถี:</b> '+dithi+' → นิ้ว <b>'+te[0]+'</b><br><b>ยาม:</b> '+yi+' → นิ้ว <b>'+te[1]+'</b><br><b>ผลรวม:</b> นิ้ว <b>'+te[2]+'</b></div></div>'+
    '<div style="font-size:0.9rem;font-weight:bold;text-align:center;padding:10px;border-radius:8px;background:rgba(251,191,36,0.08);border:1px solid #fbbf2444;">'+gb[rt]+'</div>';
}

function _executeYamJinda(now,box){
  var h=now.getHours(), mn=now.getMinutes();
  var ytEl=document.getElementById('yamTime');
  if(ytEl&&ytEl.value){var pts=ytEl.value.split(':');h=parseInt(pts[0])||h;mn=parseInt(pts[1])||mn;}
  var mins=(h*60+mn)-360;if(mins<0)mins+=1440;
  var yamQ=(_gv('yamQ')||''), yamName=(_gv('yamName')||'');
  if(!window.YamWisetJindaEngine||!window.YamWisetJindaEngine._config){
    box.innerHTML='<div style="text-align:center;color:#f59e0b;padding:16px;">⚠️ YamWisetJindaEngine ยังไม่โหลด yam_wisetjinda.json<br><small style="color:#475569;">ตรวจสอบไฟล์ yam_wisetjinda.json</small></div>';return;
  }
  var jr=window.YamWisetJindaEngine.evaluateAdvancedYam(mins,{direction:'east',garment:'bright_tone'});
  window.SCRIPTURE_BIT.yam.wisetjinda=jr;window.SCRIPTURE_BIT.yam.lastMinutes=mins;
  if(!jr){box.innerHTML='<div style="text-align:center;color:#ef4444;padding:16px;">❌ คำนวณยามวิเศษจินดาล้มเหลว</div>';return;}
  var lH=jr.raw_layers.map(function(v,i){return '<span style="background:#1e293b;border-radius:4px;padding:2px 7px;margin:2px;display:inline-block;"><span style="color:#64748b;font-size:0.65rem;">ชั้น'+(i+1)+' </span><span style="color:#fbbf24;font-weight:bold;">'+v+'</span></span>';}).join('');
  var rH=jr.triggered_yam_rules&&jr.triggered_yam_rules.length>0?jr.triggered_yam_rules.map(function(r){return '<div style="background:rgba(251,191,36,0.08);border-left:3px solid #fbbf24;border-radius:0 6px 6px 0;padding:6px 10px;margin-bottom:6px;font-size:0.75rem;"><b style="color:#fbbf24;">['+r.id+'] '+(r.name||'')+'</b><br><span style="color:#cbd5e1;">'+(r.inference_text||r.description||'')+'</span></div>';}).join(''):'<div style="color:#475569;font-size:0.8rem;text-align:center;padding:8px;">ไม่พบเกณฑ์ยามพิเศษ — สภาวะปกติ</div>';
  box.innerHTML='<div style="font-size:1rem;font-weight:bold;color:#a78bfa;margin-bottom:8px;text-align:center;">🔮 ยามวิเศษจินดา '+_tpad(h)+':'+_tpad(mn)+' น.</div>'+
    (yamQ?'<div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:8px;margin-bottom:8px;font-size:0.8rem;color:#94a3b8;">📌 คำถาม: <b style="color:#fff;">'+yamQ+'</b></div>':'')+
    '<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:10px;"><div style="color:#fbbf24;font-size:0.8rem;font-weight:bold;margin-bottom:6px;">เศษยามมหานาที ๕ ชั้น:</div>'+lH+'</div>'+
    '<div style="background:#0f172a;border-radius:8px;padding:10px;margin-bottom:10px;"><div style="font-size:0.75rem;"><b>ธาตุเวลา:</b> <span style="color:#38bdf8;">'+jr.detected_element+'</span><br><b>นิมิต:</b> <span style="color:#94a3b8;">'+jr.nimit_summary+'</span></div></div>'+
    rH;
}

/* ============================================================
   L.  MENU ๙ — สรุปผล & ส่งให้ AI
   ============================================================ */

function updateMenu9(){
  var lbl=document.getElementById('m9PersonLabel'), bit=window.SCRIPTURE_BIT.birth;
  if(!bit.calcResult){if(lbl)lbl.textContent='— กรุณาผูกดวงในเมนู ๑ ก่อน —';return;}
  if(lbl)lbl.textContent='✅ '+(bit.name||'ไม่ระบุ')+' — '+_thaiDate(bit.d,bit.m,bit.y);
  var result=bit.isManualOverride&&bit.manualPositions?bit.manualPositions:bit.calcResult;
  var tBit=window.SCRIPTURE_BIT.transit, yBit=window.SCRIPTURE_BIT.yam, bv=result.baseVars;
  _shtml('m9chip_s1',bit.name||'⭐');
  _shtml('m9chip_s2',tBit.calcResult?_thaiDate(tBit.d,tBit.m,tBit.y).split(' ')[0]+'/'+tBit.m:'📜');
  _shtml('m9chip_s3','HK '+bv.H);
  _shtml('m9chip_s5',yBit.samta?('ยาม '+yBit.samta.yamIdx):'🔮');
  var s4R=PLANET_DEF.map(function(pd){var p=result.planets[pd.key];if(!p)return '';var st=_getStatusStyle(p.statusTH);return '<div style="display:flex;gap:6px;align-items:center;padding:3px 0;border-bottom:1px solid #0f172a;"><span style="color:'+pd.col+';font-weight:bold;width:20px;">'+pd.sym+'</span><span style="color:#94a3b8;flex:1;font-size:0.75rem;">'+pd.thName+'</span><span style="color:#38bdf8;font-size:0.75rem;">'+p.rasiName+' '+p.degree+'°</span><span style="color:'+st.col+';font-size:0.68rem;margin-left:4px;">'+st.label+'</span></div>';}).join('');
  var l=result.lagna;s4R+='<div style="display:flex;gap:6px;align-items:center;padding:3px 0;border-top:2px solid #4f46e5;"><span style="color:#38bdf8;font-weight:bold;width:20px;">ล</span><span style="color:#94a3b8;flex:1;font-size:0.75rem;">ลัคนา</span><span style="color:#38bdf8;font-size:0.75rem;">'+l.rasiName+' '+l.degree+'°</span></div>';
  _shtml('m9area_s4','<div style="background:#0f172a;border-radius:8px;padding:10px;"><div style="font-size:0.75rem;color:#64748b;margin-bottom:6px;">'+bit.name+' | '+_thaiDate(bit.d,bit.m,bit.y)+' '+_tpad(bit.hr)+':'+_tpad(bit.mn)+' น.</div>'+s4R+'</div>');
  if(tBit.calcResult){
    var tR=PLANET_DEF.map(function(pd){var p=tBit.calcResult.planets[pd.key];if(!p)return '';var st=_getStatusStyle(p.statusTH);return '<div style="display:flex;gap:6px;align-items:center;padding:3px 0;border-bottom:1px solid #0f172a;"><span style="color:'+pd.col+';font-weight:bold;width:20px;">'+pd.sym+'</span><span style="color:#94a3b8;flex:1;font-size:0.75rem;">'+pd.thName+'</span><span style="color:#38bdf8;font-size:0.75rem;">'+p.rasiName+' '+p.degree+'°</span><span style="color:'+_getStatusStyle(p.statusTH).col+';font-size:0.68rem;">'+_getStatusStyle(p.statusTH).label+(p.isRetrograde?'↩':'')+'</span></div>';}).join('');
    var tl=tBit.calcResult.lagna;tR+='<div style="display:flex;gap:6px;align-items:center;padding:3px 0;border-top:2px solid #38bdf8;"><span style="color:#38bdf8;font-weight:bold;width:20px;">ล</span><span style="color:#94a3b8;flex:1;font-size:0.75rem;">ลัคนา</span><span style="color:#38bdf8;font-size:0.75rem;">'+tl.rasiName+' '+tl.degree+'°</span></div>';
    _shtml('m9area_s5','<div style="background:#0f172a;border-radius:8px;padding:10px;"><div style="font-size:0.75rem;color:#38bdf8;margin-bottom:6px;font-weight:bold;">ดาวจร '+_thaiDate(tBit.d,tBit.m,tBit.y)+' '+_tpad(tBit.hr)+':'+_tpad(tBit.mn)+' น.</div>'+tR+'</div>');
  } else _shtml('m9area_s5','<div style="color:#475569;text-align:center;padding:20px;">⏳ รอข้อมูลดาวจร (เมนู ๕)</div>');
  _shtml('m9area_s6','<div style="background:#0f172a;border-radius:8px;padding:10px;font-size:0.8rem;line-height:1.8;"><b>จ.ศ.:</b> '+result.meta.csYear+' <b>หรคุณ:</b> '+bv.H+'<br><b>มาสเกณฑ์:</b> '+bv.masaKendra.toFixed(4)+'<br><b>ดิถี:</b> '+bv.dithi.toFixed(4)+' <b>อวมาน:</b> '+bv.avman.toFixed(1)+'<br><b>สุริทิน:</b> '+bv.suridin.toFixed(4)+'<br><b>วาร:</b> '+bv.warName+' <b>LMT:</b> '+(bit.lmtOffset>=0?'+':'')+(bit.lmtOffset||0).toFixed(1)+' นาที<br>'+(bit.inthaResult?'<b>ฤกษ์ปฏิสนธิ:</b> <span style="color:#fbbf24;">'+bit.inthaResult.targetNakhatIndex+' — '+(bit.inthaResult.nakhatName||'')+'</span><br>':'')+'</div>');
  if(yBit.samta||yBit.wisetjinda){
    var yH='<div style="background:#0f172a;border-radius:8px;padding:10px;font-size:0.8rem;">';
    if(yBit.samta)yH+='<b style="color:#a78bfa;">ยามสามตา:</b> '+yBit.samta.yamName+' — ผล: <b>'+(yBit.samta.threeEye[2]||'?')+'</b><br>';
    if(yBit.wisetjinda)yH+='<b style="color:#a78bfa;">วิเศษจินดา:</b> ธาตุ: '+yBit.wisetjinda.detected_element+'<br>กฎ active: '+(yBit.wisetjinda.triggered_yam_rules.length>0?yBit.wisetjinda.triggered_yam_rules.map(function(r){return r.name;}).join(', '):'ปกติ')+'<br>';
    _shtml('m9area_s8',yH+'</div>');
  } else _shtml('m9area_s8','<div style="color:#475569;text-align:center;padding:20px;">⏳ รอผลการจับยาม (เมนู ๘)</div>');
  generateAIPrompt();
}

function generateAIPrompt(){
  var ta=document.getElementById('aiPromptText');if(!ta)return;
  var bit=window.SCRIPTURE_BIT.birth;
  if(!bit.calcResult){ta.value='⏳ กรุณาผูกดวงในเมนู ๑ ก่อน...';return;}
  var result=bit.isManualOverride&&bit.manualPositions?bit.manualPositions:bit.calcResult;
  var tBit=window.SCRIPTURE_BIT.transit, yBit=window.SCRIPTURE_BIT.yam, intha=bit.inthaResult;
  var bv=result.baseVars, l=result.lagna;
  var sep='═══════════════════════════════════════════';
  var p=sep+'\n  สุริยยาตร์ Ultimate N000 v13 — AI Prompt\n  ประมวลผล: '+new Date().toLocaleString('th-TH',{hour12:false})+'\n'+sep+'\n\n';
  p+='📋 ข้อมูลเจ้าชะตา\n──────────────────────────\n';
  p+='ชื่อ: '+(bit.name||'ไม่ระบุ')+'\n';
  p+='วันเกิด: '+_thaiDate(bit.d,bit.m,bit.y)+' เวลา '+_tpad(bit.hr)+':'+_tpad(bit.mn)+' น.\n';
  p+='จังหวัด: '+(bit.province||'ไม่ระบุ')+' ลองจิจูด: '+bit.lng.toFixed(3)+'°E\n';
  p+='LMT offset: '+(bit.lmtOffset>=0?'+':'')+(bit.lmtOffset||0).toFixed(1)+' นาที | เวลา LMT: '+_tpad(bit.adjHr||6)+':'+_tpad(bit.adjMn||0)+' น.\n\n';
  p+='📊 ข้อมูลปฏิทิน\n──────────────────────────\n';
  p+='จุลศักราช: '+result.meta.csYear+' | หรคุณ: '+bv.H+'\n';
  p+='มาสเกณฑ์: '+bv.masaKendra.toFixed(4)+' | ดิถี: '+bv.dithi.toFixed(4)+'\n';
  p+='อวมาน: '+bv.avman.toFixed(1)+' | สุริทิน: '+bv.suridin.toFixed(4)+'\n';
  p+='วาร: '+bv.warName+'\n\n';
  p+='🌟 ตำแหน่งดาวเคราะห์ ๑-๙ + ลัคนา\n──────────────────────────\n';
  PLANET_DEF.forEach(function(pd){var pp=result.planets[pd.key];if(!pp)return;var fi=Math.floor(pp.fuek)%27,st=_getStatusStyle(pp.statusTH);p+=pd.sym+' '+pd.thName.padEnd(8)+': ร'+pp.rasi+'('+pp.rasiName+') '+pp.degree+'°'+pp.lipda+'\' ['+pp.totalLipda+'ลป] ฤกษ์'+(FUEK_TH[fi]||'?').padEnd(12)+' '+st.label+(pp.isRetrograde?' วักรี↩':'')+'\n';});
  p+='ล ลัคนา        : ร'+l.rasi+'('+l.rasiName+') '+l.degree+'°'+l.lipda_unit+'\' ฤกษ์'+(l.fuekName||'')+'\n\n';
  if(tBit.calcResult){
    var tr=tBit.calcResult;p+='🔮 ดาวจร: '+_thaiDate(tBit.d,tBit.m,tBit.y)+' '+_tpad(tBit.hr)+':'+_tpad(tBit.mn)+' น.\n──────────────────────────\n';
    PLANET_DEF.forEach(function(pd){var pp=tr.planets[pd.key];if(!pp)return;var st=_getStatusStyle(pp.statusTH);p+=pd.sym+' '+pd.thName.padEnd(8)+': ร'+pp.rasi+'('+pp.rasiName+') '+pp.degree+'°'+pp.lipda+'\''+(pp.isRetrograde?' ↩':'')+'\n';});
    var tl=tr.lagna;p+='ล ลัคนา        : ร'+tl.rasi+'('+tl.rasiName+') '+tl.degree+'°'+tl.lipda_unit+'\'\n\n';
  }
  if(intha){
    p+='📜 อินทภาส-บาทจันทร์\n──────────────────────────\n';
    p+='ฤกษ์ปฏิสนธิ: '+intha.targetNakhatIndex+' — '+(intha.nakhatName||'')+'\n';
    p+='เจ้าของฤกษ์: '+INTHA_RULER_SEQ[intha.targetNakhatIndex%9]+'\n';
    var hz=intha.hazards;
    p+='ปฐมมฤตยู:'+hz.pathomMrytayu+'('+FUEK_TH[hz.pathomMrytayu]+') กาลมฤตยู:'+hz.kalMrytayu+'('+FUEK_TH[hz.kalMrytayu]+')\n';
    p+='วิถีมฤตยู:'+hz.withiMrytayu+'('+FUEK_TH[hz.withiMrytayu]+') ปฐมฆาต:'+hz.pathomKhat+'('+FUEK_TH[hz.pathomKhat]+')\n';
    p+='ทุติยฆาต:'+hz.thutiyaKhat+'('+FUEK_TH[hz.thutiyaKhat]+') ตติยฆาต:'+hz.tatiyaKhat+'('+FUEK_TH[hz.tatiyaKhat]+')\n';
    if(window.SCRIPTURE_BIT.inthaphat.transitOutput)p+='ผลจร: '+window.SCRIPTURE_BIT.inthaphat.transitOutput.statusText+'\n';
    p+='\n';
  }
  if(yBit.samta||yBit.wisetjinda){
    p+='⏱ จับยาม\n──────────────────────────\n';
    if(yBit.samta)p+='ยามสามตา: '+yBit.samta.yamName+'\nผลนิ้ว: '+(yBit.samta.threeEye||[]).join(' → ')+'\n';
    if(yBit.wisetjinda){p+='วิเศษจินดา ธาตุ: '+yBit.wisetjinda.detected_element+'\n';if(yBit.wisetjinda.triggered_yam_rules.length>0)yBit.wisetjinda.triggered_yam_rules.forEach(function(r){p+='  ['+r.id+'] '+(r.name||'')+': '+(r.inference_text||r.description||'')+'\n';});}
    p+='\n';
  }
  p+=sep+'\n📌 คำแนะนำ AI โหร\n──────────────────────────\n';
  p+='1. ใช้ข้อมูลดาวเคราะห์ทั้งหมด — ห้ามคิดเองโดยไม่มีฐาน\n';
  p+='2. ตรวจสอบดาววักรี/พาลเป็นพิเศษ\n';
  p+='3. เปรียบเทียบดาวกำเนิดกับดาวจร — หาจุดตัดสำคัญ\n';
  p+='4. ฤกษ์ที่ตกเกณฑ์ฆาตมฤตยู — แจ้งอย่างสุภาพและมีสติ\n';
  p+='5. ใช้สำนวนภาษาไทยที่สละสลวยและน่าเลื่อมใส\n'+sep+'\n';
  ta.value=p;window.SCRIPTURE_BIT.menu9.promptText=p;
  if(typeof window.animateTextReveal==='function')window.animateTextReveal(ta);
}

/* ============================================================
   M.  MENU ๑๑ — อินทภาสเต็มระบบ
   ============================================================ */

function renderFullIntha(){
  var cEl=document.getElementById('fullInthaContent'), tArea=document.getElementById('fullInthaTableArea');
  var ageEl=document.getElementById('ageDisplay'), tbody=document.getElementById('fullInthaBody');
  var pEl=document.getElementById('fullInthaPredict'), panEl=document.getElementById('m11RouamPanel');
  var bit=window.SCRIPTURE_BIT.birth, tBit=window.SCRIPTURE_BIT.transit;
  if(!bit.calcResult){if(cEl)cEl.innerHTML='<p style="text-align:center;color:#94a3b8;">กรุณาผูกดวง (เมนู ๑) ก่อน</p>';if(tArea)tArea.style.display='none';return;}
  if(!tBit.calcResult){if(cEl)cEl.innerHTML='<p style="text-align:center;color:#94a3b8;">กรุณาตั้งจร (เมนู ๕) ก่อน</p>';if(tArea)tArea.style.display='none';return;}
  if(cEl)cEl.innerHTML='';if(tArea)tArea.style.display='block';
  var intha=bit.inthaResult, bY=bit.y||2500, tY=tBit.y||2568, age=tY-bY;
  if(ageEl)ageEl.textContent='อายุ '+age+' ปี ณ พ.ศ.'+tY+' | จุลศักราช '+tBit.calcResult.meta.csYear;
  var baseNak=intha?intha.targetNakhatIndex:0, rows='', sAge=Math.max(0,age-3), eAge=age+5;
  for(var a=sAge;a<=eAge;a++){
    var y=bY+a, nak=_mod(baseNak+a,27), rI=nak%9, rN=INTHA_RULER_SEQ[rI]||'?', rC=INTHA_RULER_COLS[rI]||'#94a3b8';
    var sRI=_mod(nak+Math.floor(a/1),9), sRN=INTHA_RULER_SEQ[sRI]||'?', sRC=INTHA_RULER_COLS[sRI]||'#94a3b8';
    var lagN=intha?Math.floor(bit.calcResult.lagna.fuek||0)%27:0;
    var hzC={kalMrytayu:_mod(nak+10,27),pathomKhat:_mod(nak+5,27),thutiyaKhat:_mod(nak+14,27)};
    var isK=(hzC.kalMrytayu===lagN||hzC.pathomKhat===lagN||hzC.thutiyaKhat===lagN);
    var isCur=(y===tY);
    var pred=isK?'⚠️ ตกเกณฑ์ฆาตจร — ควรระวังสุขภาพและอุบัติเหตุ แนะนำชำระดวง':['🔮 ยามเกตุ — ชีวิตสงบ เจริญทางใน','💰 ยามศุกร์ — เจริญด้านความรัก ทรัพย์สิน','☀️ ยามอาทิตย์ — อำนาจ ชื่อเสียง หน้าที่การงาน','🌙 ยามจันทร์ — อารมณ์ขึ้นลง ครอบครัว','⚔️ ยามอังคาร — พลังงาน แต่ระวังความขัดแย้ง','🐉 ยามราหู — การเปลี่ยนแปลงใหญ่ โอกาสต่างถิ่น','🌟 ยามพฤหัสบดี — ปัญญา ธรรม โชคดี','⏳ ยามเสาร์ — ช้าแต่ชัวร์ ระวังสุขภาพ','📚 ยามพุธ — ปัญญา การสื่อสาร ธุรกิจ'][rI]||'—';
    var rStyle=isCur?'background:linear-gradient(90deg,rgba(56,189,248,0.12),rgba(79,70,229,0.08));border-left:3px solid #38bdf8;':(isK?'background:rgba(239,68,68,0.05);border-left:3px solid #ef4444;':'');
    rows+='<tr style="'+rStyle+'">'+
      '<td style="font-size:0.75rem;">'+(isCur?'<b style="color:#38bdf8;">▶ ':'')+'อายุ '+a+' / พ.ศ.'+y+(isCur?'</b>':'')+'</td>'+
      '<td style="color:'+rC+';font-weight:bold;">'+rN+'</td>'+
      '<td style="color:'+sRC+';">'+sRN+'</td>'+
      '<td style="font-size:0.72rem;color:'+(isK?'#ef4444':'#94a3b8')+';">'+pred+'</td></tr>';
  }
  if(tbody)tbody.innerHTML=rows;
  var cN=_mod(baseNak+age,27), cRI=cN%9, cRN=INTHA_RULER_SEQ[cRI]||'?', cRC=INTHA_RULER_COLS[cRI]||'#94a3b8';
  var lagNN=intha?Math.floor(bit.calcResult.lagna.fuek||0)%27:0;
  var hzCur={kalMrytayu:_mod(cN+10,27),pathomKhat:_mod(cN+5,27),thutiyaKhat:_mod(cN+14,27)};
  var isCurK=(hzCur.kalMrytayu===lagNN||hzCur.pathomKhat===lagNN||hzCur.thutiyaKhat===lagNN);
  if(pEl)pEl.innerHTML='<div style="font-weight:bold;font-size:0.9rem;margin-bottom:6px;">📅 พยากรณ์ปีปัจจุบัน (พ.ศ.'+tY+' อายุ '+age+' ปี)</div>'+
    '<div style="margin-bottom:8px;"><b>ดาวเสวย:</b> <span style="color:'+cRC+';font-weight:bold;">'+cRN+'</span> | ฤกษ์จร: <span style="color:#fbbf24;">'+cN+' — '+FUEK_TH[cN%27]+'</span></div>'+
    (isCurK?'<div style="color:#ef4444;font-weight:bold;font-size:0.85rem;">⚠️ ปีนี้จุดฆาตจรทับฤกษ์ลัคนา — ควรชำระดวงและระมัดระวัง</div>':'<div style="color:#10b981;font-size:0.85rem;">✅ ปีนี้ดวงชะตาปลอดจากเกณฑ์วิกฤต</div>');
  if(panEl){panEl.style.display='block';var tiI=window.SCRIPTURE_BIT.inthaphat.transitOutput;if(tiI)panEl.innerHTML='<div style="background:rgba(56,189,248,0.07);border:1px solid #38bdf844;border-radius:10px;padding:12px;font-size:0.78rem;"><b style="color:#38bdf8;">ผลจากระบบอินทภาสจร:</b><br><span style="color:'+(tiI.isKhatCrisis?'#ef4444':'#10b981')+';">'+tiI.statusText+'</span></div>';}
  if(typeof window.flashTableRows==='function')window.flashTableRows('fullInthaTableArea');
}

/* ============================================================
   N.  DOMContentLoaded INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded',function(){
  setTimeout(_updateRealtimeHome,2000);
  setInterval(_updateRealtimeHome,60000);
  window.updateMenu9=updateMenu9;window.renderMenu6=renderMenu6;
  window.spRunMasterEngine=spRunMasterEngine;window.spResetEngine=spResetEngine;
  var _origSS=window.showSection;
  window.showSection=function(id){
    if(typeof _origSS==='function')_origSS(id);
    if(id==='inthaphat_full')setTimeout(renderFullIntha,80);
    if(id==='summary')setTimeout(updateMenu9,80);
    if(id==='inthaphat_pro')setTimeout(renderMenu6,80);
  };
  window.calculateSuriyayartWithFeedback=calculateSuriyayartWithFeedback;
  window.autoCalculate=autoCalculate;window.finalizeData=finalizeData;
  window.executeYam=executeYam;window.generateAIPrompt=generateAIPrompt;
  window.applyManualEdit=applyManualEdit;window.resetManualEdit=resetManualEdit;
  window.generateAllFromSun=generateAllFromSun;
  window.renderMadhyamCards=renderMadhyamCards;window.scrollMadhyam=scrollMadhyam;
  window.hlikAutoFill=hlikAutoFill;window._updateEditTotal=_updateEditTotal;
  var _tp=0, _ti=setInterval(function(){
    if(window.showToast&&window.showToast!==showToast){showToast=window.showToast;showLoading=window.showLoading||showLoading;hideLoading=window.hideLoading||hideLoading;clearInterval(_ti);}
    if(++_tp>50)clearInterval(_ti);
  },100);
  console.log('[main.js] ✅ สุริยยาตร์ Ultimate N000 v13 — main.js โหลดสำเร็จ');
});
