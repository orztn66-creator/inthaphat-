// animation.js — สุริยยาตร์ Ultimate N000 v13 (Calculus Edition)
// UI Feedback Engine: Ripple · Glow · Transitions · Toast · Loading · Counters
// Exposes: window.showToast / window.showLoading / window.hideLoading

(function(){
  'use strict';

  /* ============================================================
     A. CSS INJECTION
     ============================================================ */
  var style = document.createElement('style');
  style.id = 'animation-js-styles';
  style.textContent =
    '@keyframes ripple-expand{0%{transform:scale(0);opacity:.7}100%{transform:scale(1);opacity:0}}' +
    '@keyframes btn-glow-pulse{0%{box-shadow:0 0 0 0 rgba(251,191,36,0);transform:scale(1)}35%{box-shadow:0 0 16px 5px rgba(251,191,36,.5);transform:scale(.955)}100%{box-shadow:0 0 0 0 rgba(251,191,36,0);transform:scale(1)}}' +
    '.anim-btn-clicked{animation:btn-glow-pulse .22s ease-out forwards!important}' +
    '@keyframes input-focus-glow{0%{box-shadow:0 0 0 0 rgba(56,189,248,0)}50%{box-shadow:0 0 10px 3px rgba(56,189,248,.4)}100%{box-shadow:0 0 6px 2px rgba(56,189,248,.2)}}' +
    'input:focus,select:focus,textarea:focus{animation:input-focus-glow .3s ease-out forwards!important;outline:none!important;border-color:#38bdf8!important}' +
    '@keyframes section-fadein{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}' +
    '.section-entering{animation:section-fadein .28s cubic-bezier(.22,1,.36,1) forwards!important}' +
    '@keyframes svg-entrance{0%{opacity:0;transform:scale(.82) rotate(-2deg)}60%{opacity:1;transform:scale(1.03) rotate(.5deg)}100%{opacity:1;transform:scale(1) rotate(0)}}' +
    '.svg-entering svg{animation:svg-entrance .55s cubic-bezier(.175,.885,.32,1.275) forwards!important}' +
    '@keyframes row-flash{0%{background:rgba(251,191,36,.18)}100%{background:transparent}}' +
    '.row-flashing{animation:row-flash .6s ease-out forwards!important}' +
    '@keyframes toast-in{0%{opacity:0;transform:translateX(-50%) translateY(40px) scale(.92)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}' +
    '@keyframes toast-out{0%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}100%{opacity:0;transform:translateX(-50%) translateY(20px) scale(.9)}}' +
    '.astro-toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;border:1px solid #334155;border-radius:12px;padding:11px 20px;font-size:.85rem;font-family:Sarabun,sans-serif;color:#f8fafc;z-index:99999;pointer-events:none;max-width:88vw;text-align:center;line-height:1.4;animation:toast-in .3s cubic-bezier(.22,1,.36,1) forwards;box-shadow:0 8px 24px rgba(0,0,0,.5)}' +
    '.astro-toast.toast-success{border-color:#10b981;color:#6ee7b7}' +
    '.astro-toast.toast-error{border-color:#ef4444;color:#fca5a5}' +
    '.astro-toast.toast-info{border-color:#38bdf8;color:#7dd3fc}' +
    '.astro-toast.toast-warning{border-color:#f59e0b;color:#fcd34d}' +
    '.astro-toast.toast-hiding{animation:toast-out .28s ease-in forwards}' +
    '#global-loading-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;z-index:99998;backdrop-filter:blur(3px)}' +
    '#global-loading-overlay .loading-inner{background:#1e293b;border:1px solid #334155;border-radius:16px;padding:28px 36px;text-align:center}' +
    '@keyframes spin-ring{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}' +
    '.loading-ring{width:44px;height:44px;border:4px solid #334155;border-top-color:#fbbf24;border-radius:50%;margin:0 auto 14px;animation:spin-ring .75s linear infinite}' +
    '.ripple-container{position:relative;overflow:hidden!important}' +
    '@keyframes num-count-up{0%{opacity:0;transform:translateY(6px)}30%{opacity:1;transform:translateY(-2px)}100%{opacity:1;transform:translateY(0)}}' +
    '.num-animating{animation:num-count-up .35s ease-out forwards}' +
    '@keyframes input-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}' +
    '.input-invalid-shake{animation:input-shake .35s ease-out!important;border-color:#ef4444!important}' +
    '@keyframes spin-ring-calc{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}' +
    '#anim-calc-progress{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,#4f46e5,#fbbf24,#10b981);z-index:100000;border-radius:0 2px 2px 0;transition:width .8s ease}' +
    '.madhyam-card{cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}' +
    '.madhyam-card:hover{transform:translateY(-3px)!important;box-shadow:0 8px 24px rgba(0,0,0,.4)!important}';
  document.head.appendChild(style);

  /* ============================================================
     B. TOAST NOTIFICATION
     ============================================================ */
  var _tQ=[], _tA=false;
  function _nextToast(){
    if(_tA||_tQ.length===0)return;
    _tA=true;
    var it=_tQ.shift();
    var el=document.createElement('div');
    el.className='astro-toast toast-'+(it.type||'info');
    el.textContent=it.msg;
    document.body.appendChild(el);
    var dur=it.duration||3000;
    setTimeout(function(){
      el.classList.add('toast-hiding');
      setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);_tA=false;_nextToast();},290);
    },dur);
  }
  function showToast(msg,type,duration){
    _tQ.push({msg:msg,type:type||'info',duration:duration||3000});
    _nextToast();
  }
  window.showToast=showToast;

  /* ============================================================
     C. LOADING OVERLAY
     ============================================================ */
  var _ldEl=null;
  function showLoading(text){
    if(_ldEl){var tEl=_ldEl.querySelector('.loading-text');if(tEl)tEl.textContent=text||'กำลังประมวลผล...';return;}
    _ldEl=document.createElement('div');
    _ldEl.id='global-loading-overlay';
    _ldEl.innerHTML='<div class="loading-inner"><div class="loading-ring"></div><div class="loading-text" style="color:#94a3b8;font-size:.85rem;font-family:Sarabun,sans-serif;">'+(text||'กำลังประมวลผล...')+'</div></div>';
    document.body.appendChild(_ldEl);
  }
  function hideLoading(){
    if(_ldEl){
      var el=_ldEl;_ldEl=null;
      el.style.opacity='0';el.style.transition='opacity .2s';
      setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},220);
    }
  }
  window.showLoading=showLoading;
  window.hideLoading=hideLoading;

  /* ============================================================
     D. CALC PROGRESS BAR
     ============================================================ */
  var _pbEl=null;
  function _showProgress(show){
    if(show&&!_pbEl){
      _pbEl=document.createElement('div');_pbEl.id='anim-calc-progress';_pbEl.style.width='0%';
      document.body.appendChild(_pbEl);
      setTimeout(function(){if(_pbEl)_pbEl.style.width='75%';},20);
    } else if(!show&&_pbEl){
      var el=_pbEl;_pbEl=null;
      el.style.width='100%';el.style.transition='width .2s ease,opacity .3s ease .2s';el.style.opacity='0';
      setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},550);
    }
  }

  /* Patch showLoading/hideLoading to also show progress bar */
  var _oSL=window.showLoading, _oHL=window.hideLoading;
  window.showLoading=function(t){_showProgress(true);_oSL(t);};
  window.hideLoading=function(){_showProgress(false);_oHL();};

  /* ============================================================
     E. RIPPLE ENGINE
     ============================================================ */
  function _createRipple(e,element){
    if(!element.classList.contains('ripple-container'))element.classList.add('ripple-container');
    var rect=element.getBoundingClientRect();
    var size=Math.max(rect.width,rect.height)*2.2;
    var cx=(e.clientX||(e.touches&&e.touches[0]?e.touches[0].clientX:rect.left+rect.width/2));
    var cy=(e.clientY||(e.touches&&e.touches[0]?e.touches[0].clientY:rect.top+rect.height/2));
    var rip=document.createElement('span');
    rip.style.cssText='position:absolute;pointer-events:none;border-radius:50%;width:'+size+'px;height:'+size+'px;left:'+(cx-rect.left-size/2)+'px;top:'+(cy-rect.top-size/2)+'px;background:rgba(251,191,36,.22);transform:scale(0);animation:ripple-expand .65s ease-out forwards;z-index:10;';
    element.appendChild(rip);
    setTimeout(function(){if(rip.parentNode)rip.parentNode.removeChild(rip);},700);
  }

  /* ============================================================
     F. BUTTON FEEDBACK (mouse + touch)
     ============================================================ */
  var BTN_SEL='button,.big-btn,.btn-lunar,.btn-toggle,.btn-edit-apply,.btn-edit-reset,.btn-edit-cancel,.btn-open-manual-edit,.ai-copy-btn,.page-nav button';
  document.addEventListener('mousedown',function(e){
    var btn=e.target.closest(BTN_SEL);if(!btn)return;
    _createRipple(e,btn);
    btn.classList.remove('anim-btn-clicked');void btn.offsetWidth;btn.classList.add('anim-btn-clicked');
    btn.addEventListener('animationend',function _rm(){btn.classList.remove('anim-btn-clicked');btn.removeEventListener('animationend',_rm);});
  },true);
  document.addEventListener('touchstart',function(e){
    var btn=e.target.closest(BTN_SEL);if(!btn)return;
    btn.style.filter='brightness(1.2)';btn.style.transform='scale(.96)';
  },{passive:true});
  document.addEventListener('touchend',function(e){
    var btn=e.target.closest(BTN_SEL);if(!btn)return;
    btn.style.filter='';btn.style.transform='';
    _createRipple(e,btn);
    btn.classList.remove('anim-btn-clicked');void btn.offsetWidth;btn.classList.add('anim-btn-clicked');
  },{passive:true});
  document.addEventListener('touchcancel',function(e){
    var btn=e.target.closest(BTN_SEL);if(btn){btn.style.filter='';btn.style.transform='';}
  },{passive:true});

  /* ============================================================
     G. SECTION FADE TRANSITION
     ============================================================ */
  function _patchSS(){
    var orig=window.showSection;if(!orig||orig._apatch)return;
    window.showSection=function(id){
      var cur=document.querySelector('.app-section.active');
      if(cur&&cur.id!==id){cur.style.opacity='0';cur.style.transition='opacity .14s ease';}
      setTimeout(function(){
        if(typeof orig==='function')orig(id);
        var next=document.getElementById(id);
        if(next){
          next.classList.remove('section-entering');void next.offsetWidth;next.classList.add('section-entering');
          next.style.opacity='';next.style.transition='';
          next.addEventListener('animationend',function _rm(){next.classList.remove('section-entering');next.removeEventListener('animationend',_rm);});
        }
      },140);
    };
    window.showSection._apatch=true;
  }

  /* ============================================================
     H. SVG ENTRANCE
     ============================================================ */
  function animateSVGEntrance(container){
    if(!container)return;
    container.classList.remove('svg-entering');void container.offsetWidth;container.classList.add('svg-entering');
    container.addEventListener('animationend',function _rm(){container.classList.remove('svg-entering');container.removeEventListener('animationend',_rm);},{once:true});
  }
  window.animateSVGEntrance=animateSVGEntrance;

  /* ============================================================
     I. TABLE ROW FLASH
     ============================================================ */
  function flashTableRows(containerId){
    var cont=document.getElementById(containerId);if(!cont)return;
    var rows=cont.querySelectorAll('tbody tr');
    rows.forEach(function(row,i){
      setTimeout(function(){
        row.classList.remove('row-flashing');void row.offsetWidth;row.classList.add('row-flashing');
        row.addEventListener('animationend',function _rm(){row.classList.remove('row-flashing');row.removeEventListener('animationend',_rm);},{once:true});
      },i*45);
    });
  }
  window.flashTableRows=flashTableRows;

  /* ============================================================
     J. NUMBER COUNTER
     ============================================================ */
  function animateCounter(el,targetVal,duration){
    if(!el)return;
    var st=null; duration=duration||800;
    function step(ts){
      if(!st)st=ts;
      var prog=Math.min((ts-st)/duration,1), ease=1-Math.pow(1-prog,3);
      el.textContent=Math.round(ease*targetVal).toLocaleString('th-TH');
      el.classList.add('num-animating');
      if(prog<1)requestAnimationFrame(step);
      else{el.textContent=targetVal.toLocaleString('th-TH');el.classList.remove('num-animating');}
    }
    requestAnimationFrame(step);
  }
  window.animateCounter=animateCounter;

  /* ============================================================
     K. TEXTAREA REVEAL
     ============================================================ */
  function animateTextReveal(ta){
    if(!ta)return;
    ta.style.opacity='0';ta.style.transition='opacity .35s ease';
    requestAnimationFrame(function(){ta.style.opacity='1';});
  }
  window.animateTextReveal=animateTextReveal;

  /* ============================================================
     L. INPUT SHAKE VALIDATION
     ============================================================ */
  function shakeInput(id){
    var el=document.getElementById(id);if(!el)return;
    el.classList.remove('input-invalid-shake');void el.offsetWidth;el.classList.add('input-invalid-shake');
    el.addEventListener('animationend',function _rm(){el.classList.remove('input-invalid-shake');el.removeEventListener('animationend',_rm);},{once:true});
  }
  window.shakeInput=shakeInput;

  /* ============================================================
     M. SCROLL-TO-TOP BUTTON
     ============================================================ */
  function _ensureScrollTop(){
    if(document.getElementById('anim-scroll-top-btn'))return;
    var btn=document.createElement('button');btn.id='anim-scroll-top-btn';btn.innerHTML='↑';
    btn.style.cssText='position:fixed;bottom:24px;right:18px;width:40px;height:40px;border-radius:50%;background:#334155;border:1px solid #475569;color:#94a3b8;font-size:1.1rem;cursor:pointer;z-index:500;opacity:0;transition:opacity .25s;box-shadow:0 2px 8px rgba(0,0,0,.4);font-family:sans-serif;display:flex;align-items:center;justify-content:center;';
    btn.onclick=function(){window.scrollTo({top:0,behavior:'smooth'});};
    document.body.appendChild(btn);
    window.addEventListener('scroll',function(){btn.style.opacity=window.pageYOffset>200?'1':'0';},{passive:true});
  }

  /* ============================================================
     N. SIDEBAR ENHANCE
     ============================================================ */
  function _enhanceSidebar(){
    var sb=document.getElementById('sidebar');
    if(!sb||sb.style.transition.indexOf('cubic-bezier')!==-1)return;
    sb.style.transition='left .28s cubic-bezier(.25,1,.5,1)';sb.style.willChange='left';
  }

  /* ============================================================
     O. CARD HOVER EFFECTS
     ============================================================ */
  function _addCardHovers(){
    document.querySelectorAll('.home-card,.kc6-section').forEach(function(card){
      if(card._hoverBound)return;card._hoverBound=true;
      card.addEventListener('mouseenter',function(){card.style.transform='translateY(-2px)';card.style.transition='transform .2s ease,box-shadow .2s ease';card.style.boxShadow='0 8px 24px rgba(0,0,0,.35)';});
      card.addEventListener('mouseleave',function(){card.style.transform='';card.style.boxShadow='';});
    });
  }

  /* ============================================================
     P. kc6 ACCORDION ANIMATION
     ============================================================ */
  document.addEventListener('click',function(e){
    var header=e.target.closest('.kc6-header');if(!header)return;
    var body=header.nextElementSibling;if(!body||!body.classList.contains('kc6-body'))return;
    var chevron=header.querySelector('.kc6-chevron');
    var isOpen=header.classList.contains('open');
    if(isOpen){
      body.style.maxHeight=body.scrollHeight+'px';body.style.overflow='hidden';body.style.transition='max-height .3s ease';
      requestAnimationFrame(function(){body.style.maxHeight='0';});
      body.addEventListener('transitionend',function _rm(){body.classList.remove('open');body.style.maxHeight='';body.style.overflow='';body.style.transition='';body.removeEventListener('transitionend',_rm);});
      header.classList.remove('open');if(chevron)chevron.style.transform='rotate(0deg)';
    } else {
      body.classList.add('open');body.style.maxHeight='0';body.style.overflow='hidden';body.style.transition='max-height .35s cubic-bezier(.4,0,.2,1)';
      requestAnimationFrame(function(){body.style.maxHeight=(body.scrollHeight+200)+'px';});
      body.addEventListener('transitionend',function _rm(){body.style.maxHeight='';body.style.overflow='';body.style.transition='';body.removeEventListener('transitionend',_rm);});
      header.classList.add('open');if(chevron)chevron.style.transform='rotate(180deg)';
    }
  },true);

  /* ============================================================
     Q. HLIK / M5 INPUT LIVE GLOW
     ============================================================ */
  document.addEventListener('input',function(e){
    var inp=e.target;if(!inp)return;
    if(inp.classList.contains('hlik-inp')||inp.classList.contains('hlik-l-inp')||inp.classList.contains('m5-lp-input')){
      var val=parseFloat(inp.value);
      inp.style.borderColor=((!isNaN(val)&&val>0)?'#10b981':'');
      inp.style.color=((!isNaN(val)&&val>0)?'#10b981':'');
    }
  });

  /* ============================================================
     R. RESULT DIV OBSERVER — animate when binderResult appears
     ============================================================ */
  var _obs=null;
  function _watchResult(){
    var target=document.getElementById('binderResult');if(!target||_obs)return;
    _obs=new MutationObserver(function(muts){
      muts.forEach(function(m){
        if(m.type==='attributes'&&m.attributeName==='style'){
          var d=target.style.display;
          if(d&&d!=='none'){
            target.classList.remove('section-entering');void target.offsetWidth;target.classList.add('section-entering');
            var svgEl=target.querySelector('#zodiacChart');if(svgEl)animateSVGEntrance(svgEl);
          }
        }
      });
    });
    _obs.observe(target,{attributes:true,attributeFilter:['style']});
  }

  /* ============================================================
     S. INIT
     ============================================================ */
  function _init(){
    _patchSS();_enhanceSidebar();_ensureScrollTop();_watchResult();_addCardHovers();
    var _chi=setInterval(function(){_addCardHovers();},2000);
    setTimeout(function(){clearInterval(_chi);},12000);
    console.log('[animation.js] ✅ UI Animation Engine โหลดสำเร็จ');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',_init);
  else _init();
})();
