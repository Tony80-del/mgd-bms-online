/* ==========================================================================================
   mr001.js — MR-001 "PROJECT INFORMATION FORM" · shared renderer
   ------------------------------------------------------------------------------------------
   Extracted from pfu-verify.html on 2026-10-07 (Tony approved plan C-1).

   WHY THIS FILE EXISTS
     The board approval page (approve.html) has to render the MR-001 sheet EXACTLY as the BMS
     does. One renderer is the only way to guarantee that. A copy would drift apart.

   WHO USES IT
     · pfu-verify.html  — the BMS "Project verification" tab (Step 5 · PIC form)
     · approve.html     — the board approval page (Phase 2)

   LOAD ORDER
     <script src="mr001.js"></script> must come BEFORE pfu-verify.html's inline <script>,
     because the inline code uses SEC / KO / esc / num / fm / g / sumSize / staff / renderPIC.

   GLOBALS THIS FILE DEFINES (same names the inline script always used, so nothing else changed)
     KO, SEC, g, esc, num, fm, sizeArea, sumSize, findItem, staff, LAST, PICB, picToday, pv,
     picBoxes, picComboBox, picVal, picNat, picStage, picBrows, picExtra, picC3, picVerdict,
     renderPIC, notePrint, mr001Compute
   Plus window.MR001 — a namespace handle for approve.html.

   ST IS NOT DEFINED HERE. It stays the page's own state: pfu-verify.html declares it and
   approve.html sets it from the stored snapshot. mr001Compute() takes it as an argument.
   ========================================================================================== */

/* ===== MR-001 step 1 · knock-out gates (labels) =========================================== */
var KO=[
 'Legal / land: ownership, 1/500 planning, construction permit or fire approval has no clear path',
 'Payment: no advance AND 90+ days payment AND no guarantee / no milestone payments',
 'Client credit: known late payments to contractors, blacklist, or funding rumours',
 'Capability: scope beyond our experience (cleanroom / process / heavy MEP) with no reliable partner',
 'Schedule: impossible completion date (e.g. 30,000 m2 in 4 months)',
 'Already locked: contractor pre-selected, we are only used to benchmark prices',
 'Capacity: no available PM / construction resource in that window'];

/* ===== MR-001 step 2 · the section / item schema ========================================== */
var SEC=[
 {t:'Project basics',lead:'What is being built, how big, what it needs — one line per building, everything else is calculated.',items:[
  {grp:'A. Identity'},
  {n:'Project name',h:'exactly as written on the IRC / contract',v:'HERCHANG PLASTIC INDUSTRY INTL. CO. LTD'},
  {n:'Investor / owner',h:'who signs the contract — company + parent',v:'Herchang Plastic (Taiwan)'},
  {n:'Location / address',h:'industrial park, district, province',v:'VSIP III, Binh Duong'},
  {n:'Land size',h:'from the land certificate / lease (m²)',v:'20,000',ty:'num',suf:'m²'},
  {grp:'B. Basic Construction'},
  {n:'Structure system',h:'tells the estimator which price list to use',v:'Steel factory + RC office',ty:'sel',opts:['Pre-engineered steel','RC frame / cast in place','Steel + RC office','Mixed / special']},
  {n:'Building type & scope',h:'drives the unit-cost benchmark',v:'Steel factory + metal wall',ty:'sel',opts:['Steel factory + metal wall','RC factory / warehouse','Office / admin','Mixed factory + office','Special (cleanroom / process)']},
  {n:'Clear height',h:'net height under the truss / beam (m)',v:'9',ty:'num',suf:'m'},
  {n:'Project stage now',h:'where the client is today',v:'Bidding',ty:'sel',opts:['Design & Legal','PQ','Bidding','Negotiation']},
  {n:'Planned start / handover',h:'the client expectation, not ours',v:'Oct 2026 / Jun 2027'},
  {grp:'C. Building schedule — one line per building (L × W × floors)',opt:1},
  {n:'Factory 1',h:'main production building',v:'55 x 100 x 1',ty:'size',opt:1},
  {n:'Factory 2',h:'second production building',v:'100 x 100 x 1',ty:'size',opt:1},
  {n:'Warehouse',h:'storage / finished goods',v:'',ty:'size',opt:1},
  {n:'Office building',h:'admin / office block',v:'24 x 24 x 3',ty:'size',opt:1},
  {n:'Dormitory',h:'worker housing, if any',v:'',ty:'size',opt:1},
  {n:'Canteen',h:'staff canteen',v:'40 x 36 x 1',ty:'size',opt:1},
  {n:'Motorbike / car parking',h:'open or covered parking area',v:'',ty:'size',opt:1},
  {n:'Utilities / technical area',h:'substation, pump, WWTP, chiller, tank',v:'20 x 20 x 1',ty:'size',opt:1},
  {n:'Guard house / gate',h:'security block + entrance',v:'6 x 6 x 1',ty:'size',opt:1},
  {n:'OTHER',h:'anything else the client lists',v:'',ty:'size',opt:1},
  {n:'Gross floor area',h:'auto = sum of the building schedule above',v:'',ty:'auto',af:'gross',opt:1},
  {grp:'D. Technical demand (for MEP, water, fire, cost)',opt:1},
  {n:'Total staff',h:'how many people work on site',v:'350',ty:'num',suf:'persons',opt:1},
  {n:'Working pattern',h:'shifts decide water, canteen and lighting load',v:'2 shifts',ty:'sel',opts:['1 shift','2 shifts','3 shifts','24 h continuous'],opt:1},
  {n:'Power consumption',h:'ask for the registered load, not the bill',v:'1,500',ty:'num',suf:'KVA',opt:1},
  {n:'Water demand',h:'auto ≈ staff × 60 L/day',v:'',ty:'auto',af:'water',opt:1},
  {n:'Wastewater',h:'auto ≈ 80% of water demand',v:'',ty:'auto',af:'ww',opt:1},
  {n:'Water source',h:'park supply or own well — affects connection cost',v:'Park supply',ty:'sel',opts:['Park supply','Own well / borehole','Both','TBC'],opt:1},
  {n:'Clean room required?',h:'grade decides the cleanroom price level',v:'No',ty:'sel',opts:['No','ISO 8 (Class 100,000)','ISO 7 (Class 10,000)','ISO 6 (Class 1,000)','ISO 5 (Class 100)'],opt:1},
  {n:'Clean room area',h:'only if clean room required (m²)',v:'',ty:'num',suf:'m²',opt:1},
  {n:'Fire system',h:'sprinkler / foam changes MEP cost',v:'Yes — sprinkler',ty:'sel',opts:['No / basic only','Yes — sprinkler','Yes — sprinkler + foam','TBC'],opt:1},
  {grp:'E. Investor & commercial — feeds the MR-001 PIC form (step 5)'},
  {n:'Investor nationality / origin',h:'goes to MR-001 block A',v:'Taiwan',ty:'sel',opts:['Taiwan','China','Hong Kong','Japan','Korea','Singapore','EU','USA','Vietnam','Other']},
  {n:'Investment type',h:'MR-001 block A — FDI / Domestic / Joint venture',v:'FDI',ty:'sel',opts:['FDI','Domestic (local investor)','Joint venture (JV)']},
  {n:'Main products',h:'what the factory will produce — MR-001 block B',v:'Plastic products — injection & molding'},
  {n:'Land ownership',h:'MR-001 block B',v:'Owned by the investor',ty:'sel',opts:['Owned by the investor','Leasing (industrial park)','To acquire / in progress']},
  {n:'Investor estimated budget',h:'the number the investor carries — MR-001 block D',v:'118,268,000,000',ty:'num',suf:'VND'},
  {n:'Estimated construction time',h:'months — MR-001 block D',v:'9',ty:'num',suf:'months'},
 ]},
 {t:'Relationship',lead:'Who decides, who influences, who we already know. A cold consultant or a weak relationship costs more than price.',items:[
  {grp:'A. Investor / owner (decision level)'},
  {n:'Owner representative',h:'the person who signs and approves budget',v:'Mr. Luo Yu Sheng (owner rep)'},
  {n:'Decision body',h:'single owner / board / committee — and the decision cycle',v:'Owner decides personally (Taiwan HQ)'},
  {n:'Our relationship with the owner',h:'warm or cold?',v:'Known — met, no contract yet',ty:'sel',opts:['Strong — worked together','Known — met, no contract yet','New — introduction only','No relationship'],rel:1},
  {n:'Introduced by',h:'broker / park / bank / direct BD',v:'Direct contact (BD)'},
  {n:'Investor PM team',h:'who we deal with on the investor side — name / role / phone',v:'Mr. Luo Yu Sheng (owner PM team)'},
  {grp:'B. Consultant(s)'},
  {n:'Design consultant firm',h:'company name to select',v:'UAD Design',ty:'sel',opts:['UAD Design','MGD design team','Owner in-house','A&D Vietnam','Not appointed yet','Other / unknown']},
  {n:'Supervision consultant (giám sát)',h:'who signs off the works',v:'Not appointed yet',ty:'sel',opts:['Not appointed yet','UAD Design','Owner in-house','Other / unknown']},
  {n:'Cost / QS consultant',h:'who checks our unit prices',v:'Owner side (TBC)'},
  {n:'Influence on specification',h:'they can favour or block our products',v:'Medium',ty:'sel',opts:['High — writes the spec','Medium','Low']},
  {n:'Our relationship with consultant',h:'warm or cold?',v:'Known — met, no contract yet',ty:'sel',opts:['Strong — worked together','Known — met, no contract yet','New — introduction only','No relationship'],rel:1},
  {n:'Consultant attitude to us',h:'do they favour or block us?',v:'Neutral',ty:'sel',opts:['Supporter','Neutral','Skeptic','Blocker','Unknown'],att:1},
 ]},
 {t:'Documents',lead:'Two blocks to fill: what documents the client already gave us, and the tender / vendor information.',items:[
  {grp:'Documents'},
  {n:'Concept design drawing',h:'layout / elevation — first thing to ask for',v:'received 12 Aug 2026'},
  {n:'Basic design (thiết kế cơ sở)',h:'stamped basic design',v:''},
  {n:'Technical / construction drawings',h:'architecture + structure + MEP',v:'structure only'},
  {n:'BOQ / cost estimate',h:'client or consultant BOQ',v:''},
  {n:'Survey & geotechnical (pile) report',h:'boreholes — pile type and depth',v:'told: 5 boreholes, report not sent'},
  {n:'Fire-fighting (PCCC) drawings',h:'design + approval drawings',v:''},
  {n:'Construction schedule (planned dates)',h:'master schedule with milestones',v:'9 months, no dates'},
  {n:'Site handover / land clearance',h:'can we start immediately?',v:'Existing building on site',ty:'sel',opts:['Handed over, flat','Partly cleared','Not cleared / to fill','Existing building on site']},
  {grp:'Tender, vendor & consultants'},
  {n:'Tender type',h:'how the winner is chosen',v:'Invited bid (3-5)',ty:'sel',opts:['Open bid','Invited bid (3-5)','Direct award','Single source / negotiated']},
  {n:'Number of bidders',h:'more bidders = more price pressure',v:'3',ty:'sel',opts:['1','2','3','4-6','7-8','8+']},
  {n:'Tender documents issued',h:'date the tender package was sent',v:'20 Aug 2026'},
  {n:'Site visit / clarification date',h:'walk-through + questions deadline',v:'28 Aug 2026 (told)'},
  {n:'Prequalification required?',h:'PQ step before tender',v:'Yes — documents',ty:'sel',opts:['No','Yes — documents','Yes — documents + site visit']},
  {n:'Submission date',h:'deadline for our price',v:'15 Sep 2026'},
  {n:'Expected award date',h:'when the client decides',v:'Oct 2026 (told)'},
  {n:'Technical partner needed?',h:'scope we would sub-contract',v:'No',ty:'sel',opts:['No','Yes — MEP','Yes — pile / ground','Yes — process']},
 ]},
];

/* ===== small shared helpers =============================================================== */
function g(id){return document.getElementById(id);}
/* 2026-10-07 BUG FIX: this was a no-op (& -> &, < -> <), so no value was ever escaped.
   It never showed because the fields hold plain text, but the new free-text NOTE box is exactly
   where an ampersand or an angle bracket gets typed — a "</textarea>" in a note would have broken
   the whole sheet. Every call site passes data, never markup, so escaping here is strictly safer. */
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function num(s){s=String(s==null?'':s).replace(/[^0-9.\-]/g,'');var x=parseFloat(s);return isNaN(x)?0:x;}
function fm(x,d){d=d||0;var p=Math.pow(10,d);return (Math.round(x*p)/p).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});}

/* ===== sizes ============================================================================== */
function sizeArea(v){var p=String(v||'').split(/[x\u00d7]/);var a=num(p[0])*num(p[1]);var f=num(p[2])||1;return a? a*f : 0;}
function sumSize(S){S=S||ST;var t=0;SEC.forEach(function(sec,si){sec.items.forEach(function(it,ii){if(it.ty==='size'){var id=si+'_'+ii;var v=S[id]?S[id].v:it.v;t+=sizeArea(v);}});});return t;}
function findItem(af){for(var si=0;si<SEC.length;si++){for(var ii=0;ii<SEC.length*0+SEC[si].items.length;ii++){var it=SEC[si].items[ii];if(it.af===af)return si+'_'+ii;}}return null;}
function staff(S){S=S||ST;var id=findItem('water');for(var si=0;si<SEC.length;si++){var sec=SEC[si];for(var ii=0;ii<sec.items.length;ii++){if(sec.items[ii].n==='Total staff')return num(S[si+'_'+ii]?S[si+'_'+ii].v:'');}}return 0;}

/* ===== the calculation ==================================================================== */
/* ------------------------------------------------------------------------------------------
   mr001Compute(S, koArr) — the whole MR-001 calculation with no DOM in it.
   This is the ONLY place the confidence rules live. paint() in pfu-verify.html is now a thin
   renderer over this, and approve.html calls it directly with a stored snapshot, so the board
   sees exactly the number the PIC saw.
     S       — the state map { 'si_ii': {s:'Verified'|'Told'|'N/A'|'', v:'...'} }
     koArr   — the knock-out gates as booleans (from the tick boxes, or from the snapshot)
   Returns everything renderPIC() needs: conf, items, V, T, M, N, gross, water, ww, miss, weak,
   ko, tot, OPTn, OPTf, optGroups, sec[].
   ------------------------------------------------------------------------------------------ */
function mr001Compute(S, koArr){
  S = S || ST || {};
  var OPTn=0,OPTf=0,tot=0,sum=0,V=0,T=0,M=0,N=0,miss=[],weak=[],secRows=[];
  SEC.forEach(function(sec,si){
    var sV=0,sT=0,sM=0,sN=0,cN=0,oF=0,oN=0;
    sec.items.forEach(function(it,ii){
      var rec=S[si+'_'+ii]||{},s=rec.s,v=rec.v;
      if(it.grp||it.ty==='auto')return;
      if(it.opt){OPTn++;oN++;if(s==='Verified'||s==='Told'){OPTf++;oF++;}return;}
      cN++;tot++;
      if(s==='Verified'){sum+=1;V++;sV++;}
      else if(s==='Told'){sum+=0.6;T++;sT++;}
      else if(s==='N/A'){N++;sN++;}
      else{M++;sM++;miss.push({sec:sec.t,n:it.n,h:it.h});}
      if(it.att&&/Blocker|Skeptic/.test(v))weak.push({n:it.n,why:'attitude: '+v,sec:sec.t});
      if(it.rel&&/No relationship|New \u2014 introduction only/.test(v))weak.push({n:it.n,why:'relationship: '+v,sec:sec.t});
    });
    secRows.push({v:sV,t:sT,m:sM,n:sN,c:cN,optF:oF,optTotal:oN});
  });
  var gross=sumSize(S),water=staff(S)*0.06,ww=water*0.8;
  var counted=tot-N,cp=counted>0?Math.round(sum/counted*100):0;
  var ol=[],curG=null;
  SEC.forEach(function(sec,si){sec.items.forEach(function(it,ii){
    if(it.grp){curG=it.opt?{t:it.grp,f:0,n:0}:null;if(curG)ol.push(curG);return;}
    if(it.ty==='auto'||!it.opt||!curG)return;
    curG.n++;var ss=(S[si+'_'+ii]||{}).s;if(ss==='Verified'||ss==='Told')curG.f++;});});
  return {conf:cp,items:counted,V:V,T:T,M:M,N:N,gross:gross,water:water,ww:ww,miss:miss,weak:weak,
          ko:(koArr||[]).map(function(b){return !!b;}),tot:tot,OPTn:OPTn,OPTf:OPTf,
          optGroups:ol,sec:secRows};
}

/* ===== the sheet ========================================================================== */
/* ================= Step 5 · PIC form (MR-001), auto-filled ================= */
var LAST={};
var PICB=[['Factory 1','0_12'],['Factory 2','0_13'],['Warehouse','0_14'],['Office building','0_15'],['Dormitory','0_16'],
 ['Canteen','0_17'],['Motorbike / car parking','0_18'],['Utilities / technical','0_19'],['Guard house / gate','0_20'],['OTHER','0_21']];
function picToday(){return new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});}
function pv(id){var x=ST[id];return x?String(x.v==null?'':x.v).trim():'';}
function picBoxes(list){return list.map(function(x){return '<span class="cbo"><span class="bx'+(x[1]?' on':'')+'"></span>'+esc(x[0])+'</span>';}).join('');}
function picComboBox(v,pairs,hint){
  var out='',any=false;
  pairs.forEach(function(x){var on=x[1].test(String(v||''));if(on)any=true;
    out+='<span class="cbo"><span class="bx'+(on?' on':'')+'"></span>'+esc(x[0])+'</span>';});
  if(!String(v||'').trim())out+='<span class="val mut" style="font-size:9.5px">'+esc(hint||'not filled yet \u2014 set it in step 2')+'</span>';
  return out;}
function picVal(t,fb){t=String(t==null?'':t).trim();return t?'<span class="val">'+esc(t)+'</span>':'<span class="val mut">'+(fb||'&mdash;')+'</span>';}
function picNat(){var m=String(pv('0_2')+' '+pv('0_1')).match(/\(([^)]{2,20})\)/);return m?m[1]:'';}
function picStage(){var x=pv('0_9');return{dl:/design/i.test(x),pq:/pq|pre-?qualif/i.test(x),bid:/bidd/i.test(x),raw:x};}
function picBrows(){
  var r=[];
  PICB.forEach(function(b){
    var v=pv(b[1]);
    if(v){var p=String(v).split(/[x\u00d7*]/i).map(num);
      r.push({n:b[0],a:(p[0]||0)*(p[1]||0)*(p[2]||0),f:p[2]||0});return;}
    /* 2026-10-07 (option B): a building marked Verified but with no dimensions yet still gets a
       row, so C1 shows WHICH buildings were verified; the area stays blank ("—") until the
       L × W × floors boxes are filled. Untouched buildings (no value AND not Verified) are still
       skipped, so the schedule never fills up with rows nobody has verified.
       The total below is unaffected: it sums real dimensions only (sumSize). */
    var s=ST[b[1]]?ST[b[1]].s:'';
    if(s==='Verified')r.push({n:b[0],a:0,f:0});
  });
  return r;}
function picExtra(){
  var A=[['Survey & geotechnical report','2_5'],['Fire-fighting (PCCC) drawings','2_6'],['Construction schedule','2_7'],
         ['Site handover / land clearance','2_8'],['Basic design (thi\u1ebft k\u1ebf c\u01a1 s\u1edf)','2_2']];
  var B=[['Tender type','2_10'],['Bidders','2_11'],['Tender issued','2_12'],['Site visit','2_13'],
         ['Prequalification','2_14'],['Submission','2_15'],['Award expected','2_16'],['Technical partner','2_17']];
  var a=A.filter(function(x){return pv(x[1]);}),b=B.filter(function(x){return pv(x[1]);}),h='';
  if(a.length)h+='<tr><td class="sub" style="width:30%">Also recorded in steps 1\u20134</td><td>'+
    a.map(function(x){return '<div><b>'+esc(x[0])+':</b> '+esc(pv(x[1]))+'</div>';}).join('')+'</td></tr>';
  if(b.length)h+='<tr><td class="sub">Tender / vendor</td><td>'+
    b.map(function(x){return '<span style="margin-right:12px"><b>'+esc(x[0])+':</b> '+esc(pv(x[1]))+'</span>';}).join('')+'</td></tr>';
  return h;}
function picC3(){
  var P=[['1_1','Owner representative'],['1_2','Decision body'],['1_3','Our relationship with the owner'],['1_4','Introduced by'],
    ['1_5','Investor PM team'],['1_7','Design consultant'],['1_8','Supervision consultant'],['1_9','Cost / QS consultant'],
    ['1_10','Influence on specification'],['1_12','Consultant attitude to us'],['2_8','Site handover / land clearance'],
    ['2_17','Technical partner needed'],['0_8','Clear height'],['0_24','Total staff'],['0_25','Working pattern'],
    ['0_26','Power consumption'],['0_29','Water source'],['0_30','Clean room'],['0_31','Clean room area'],['0_32','Fire system']];
  var rows=[];P.forEach(function(x){var v=pv(x[0]);if(v)rows.push([x[1],v]);});
  if(LAST.water)rows.push(['Water demand',fm(LAST.water,1)+' m\u00b3/day (auto: staff \u00d7 0.06)']);
  if(LAST.ww)rows.push(['Wastewater',fm(LAST.ww,1)+' m\u00b3/day (auto: water \u00d7 0.8)']);
  var h='<table><tr class="sec"><td colspan="4">C3. REMARK / NOTES FROM STEPS 1\u20134 (auto)</td></tr>';
  if(!rows.length)h+='<tr><td colspan="4" class="val mut">nothing captured yet</td></tr>';
  for(var i=0;i<rows.length;i+=2){
    h+='<tr><td class="k" style="width:26%">'+esc(rows[i][0])+'</td><td style="width:24%">'+picVal(rows[i][1])+'</td>'+
      (rows[i+1]?'<td class="k" style="width:26%">'+esc(rows[i+1][0])+'</td><td>'+picVal(rows[i+1][1])+'</td>':'<td colspan="2"></td>')+'</tr>';}
  return h+'</table>';}
function picVerdict(){
  var conf=LAST.conf||0,miss=LAST.miss||[],ko=LAST.ko||[],hit=false;
  for(var i=0;i<ko.length;i++)if(ko[i])hit=true;
  var t,l,s;
  if(hit){t='bad';l='NO-BID';s='knock-out gate ticked';}
  else if(conf>=70&&!miss.length){t='ok';l='PASSED';s='firm price ready';}
  else{t='warn';l='CONDITIONAL PASS';s='below 70% or items missing';}
  return{tier:t,label:l,sub:s,conf:conf,items:LAST.items||0,V:LAST.V||0,T:LAST.T||0,M:LAST.M||0,miss:miss,hit:hit};}
function renderPIC(){
  var host=g('picHost');if(!host)return;
  var v=picVerdict(),stg=picStage(),rows=picBrows(),net=LAST.gross||0;
  var col=v.tier==='ok'?'#22c55e':(v.tier==='warn'?'#fbbf24':'#ef4444');
  var ico=v.tier==='ok'?'\u2705':(v.tier==='warn'?'\u26a0\ufe0f':'\u26d4');
  var h='';
  h+='<div class="panel hd"><div class="scorebox">'+
     '<div class="stamp t-'+v.tier+'" style="border-color:'+col+'"><b style="color:'+col+'">'+ico+' '+v.label+'</b><small class="small">verification \u00b7 '+v.sub+'</small></div>'+
     '<div><div class="small">DATA CONFIDENCE</div><div class="big">'+v.conf+'%</div><div class="small">verified 100% \u00b7 told 60% \u00b7 missing 0%</div></div>'+
     '<div><div class="small">ITEMS</div><div class="big">'+v.items+'</div><div class="small">verified '+v.V+' \u00b7 told '+v.T+' \u00b7 missing '+v.M+'</div></div>'+
     '<div style="flex:1;min-width:190px"><div class="small" style="margin-bottom:4px">CONFIDENCE</div><div class="meter"><i style="width:'+v.conf+'%"></i></div>'+
     '<div class="small" style="margin-top:6px">'+(v.tier==='ok'?'Complete enough for a <b>FIRM price</b>':(v.hit?'Knock-out condition \u2014 do not estimate':'Below 70% \u2192 price <b>RANGE</b> only \u00b7 '+v.M+' item(s) to collect'))+'</div></div></div>'+
     (v.miss.length?'<div class="note warn"><div>\ud83d\udccc</div><div><b>Still to collect ('+v.miss.length+'):</b> '+v.miss.map(function(m){return esc(m.n);}).join(' \u00b7 ')+'</div></div>':'<div class="note ok"><div>\u2705</div><div>Nothing missing \u2014 every essential item is verified or told.</div></div>')+
     '<div class="small" style="margin-top:6px">Form No: MR-001 \u00b7 Rev: 00 \u00b7 <b>Stage 1 only</b> \u00b7 filled automatically from steps 1\u20134 \u2014 printed for signature.</div></div>';

  h+='<div class="sheet"><div class="t1row">'+
   '<div class="t1">PROJECT INFORMATION FORM</div>'+
   /* 2026-10-07 (Tony): when printed, the PASSED box sits on THIS line, beside the form title.
      On screen it stays in the summary panel above, so this copy is hidden here (@media print). */
   '<div class="stampprint t-'+v.tier+'"><b>'+ico+' '+v.label+'</b><small>verification \u00b7 '+v.sub+'</small></div>'+
   '</div>'+
   '<div class="t2">'+esc(pv('0_1')||'(no project name)')+'</div>'+
   '<div class="meta">Form No: MR-001 \u00b7 Rev: 00 \u00b7 Date: '+picToday()+' \u00b7 Stage 1 \u00b7 generated from the verification steps</div>';

  /* A */
  h+='<table><tr class="sec"><td colspan="4">A. INVESTOR PROFILE</td></tr>'+
   '<tr><td class="k">Company Name</td><td colspan="3">'+picVal(pv('0_2'),'\u2014')+'</td></tr>'+
   '<tr><td class="k">Nationality</td><td>'+picVal(pv('0_34')||picNat(),'\u2014')+'</td>'+
   '<td class="k" style="width:22%">Investment Type</td><td>'+picComboBox(pv('0_35'),[['FDI',/fdi/i],['Domestic',/domestic/i],['Joint Venture',/joint|jv/i]])+'</td></tr></table>';
  /* B */
  h+='<table><tr class="sec"><td colspan="4">B. PROJECT INFORMATION</td></tr>'+
   '<tr><td class="k">Project Name</td><td colspan="3">'+picVal(pv('0_1'),'\u2014')+'</td></tr>'+
   '<tr><td class="k">Location</td><td colspan="3">'+picVal(pv('0_3'),'\u2014')+'</td></tr>'+
   '<tr><td class="k">Land Size (m\u00b2)</td><td>'+picVal(num(pv('0_4'))?fm(num(pv('0_4')))+' m\u00b2':'','\u2014')+'</td>'+
   '<td class="k">Products</td><td>'+picVal(pv('0_36'),'\u2014')+'</td></tr>'+
   '<tr><td class="k">Building / scope</td><td colspan="3">'+picVal([pv('0_7'),pv('0_6')].filter(Boolean).join(' \u00b7 '),'\u2014')+'</td></tr>'+
   '<tr><td class="k">Land Ownership</td><td colspan="3">'+picComboBox(pv('0_37'),[['Owned',/owned/i],['Leasing',/leas/i],['To Acquire',/acquire/i]])+'</td></tr>'+
   '<tr><td class="k">Project Stage</td><td colspan="3">'+picBoxes([['Design & Legal',stg.dl],['PQ',stg.pq],['Bidding',stg.bid]])+
   (stg.raw&&!stg.dl&&!stg.pq&&!stg.bid?'<span class="val" style="font-size:10px">stage: '+esc(stg.raw)+'</span>':'')+'</td></tr>'+
   '<tr><td class="k">Project Partners</td><td colspan="3">'+
   picBoxes([['Consultant',!!pv('1_7')],['Owner',!!pv('0_2')],['Industrial Park',/vsip|kcn|industrial park|\bip\b/i.test(pv('0_3'))],['Partners',false]])+
   (pv('1_7')?'<span class="val" style="font-size:10px">design: '+esc(pv('1_7'))+'</span>':'')+'</td></tr></table>';
  /* C1 */
  h+='<table><tr class="sec"><td colspan="3">C1. BUILDING AREA SCHEDULE (m\u00b2)</td></tr>'+
   '<tr><th style="width:46%">Building</th><th class="c">Area</th><th class="c">Floors</th></tr>';
  if(!rows.length)h+='<tr><td colspan="3" class="val mut" style="text-align:center">no building schedule entered yet (optional block)</td></tr>';
  rows.forEach(function(r){h+='<tr><td>'+esc(r.n)+'</td><td class="c">'+(r.a?fm(r.a):'\u2014')+'</td><td class="c">'+(r.f||'\u2014')+'</td></tr>';});
  h+='<tr><td class="tot">Total gross floor area</td><td class="c tot">'+fm(net)+'</td><td class="tot"></td></tr></table>';
  /* C2 */
  h+='<table><tr class="sec"><td colspan="2">C2. DOCUMENTATION RECEIVED</td></tr><tr><td colspan="2">'+
   picBoxes([['BOQ',!!pv('2_4')],['Design Drawing',!!pv('2_3')],['Concept Drawing',!!pv('2_1')],['PQ document',/^yes/i.test(pv('2_14'))]])+
   '</td></tr>'+picExtra()+'</table>';
  /* C3 */
  h+=picC3();
  /* D */
  var sch=num(pv('0_39'))||num(pv('2_7'));
  h+='<table><tr class="sec"><td colspan="2">D. SCHEDULE & BUDGET</td></tr>'+
   '<tr><td class="k" style="width:34%">Est. Budget (VND)</td><td>'+picVal(num(pv('0_38'))?fm(num(pv('0_38')))+' VND':'','\u2014')+'</td></tr>'+
   '<tr><td class="k">Est. Schedule (months)</td><td>'+picVal(sch?fm(sch):'','\u2014')+'</td></tr>'+
   '<tr><td class="k">Dates captured above</td><td>'+picVal([pv('0_10')?'planned start / handover: '+pv('0_10'):'',
     pv('2_15')?'submission: '+pv('2_15'):'',pv('2_16')?'award: '+pv('2_16'):''].filter(Boolean).join(' \u00b7 '),'\u2014')+'</td></tr></table>';
  /* E */
  var ec=v.tier==='ok'?'#0a7b3a':(v.tier==='warn'?'#8a5a00':'#a11');
  h+='<table><tr class="sec"><td colspan="2">E. POTENTIAL EVALUATION</td></tr><tr><td colspan="2">'+
   '<span class="val" style="color:'+ec+';font-weight:700">'+ico+' '+v.label+'</span>'+
   ' \u2014 data confidence <b>'+v.conf+'%</b> \u00b7 '+v.items+' items counted (verified '+v.V+' \u00b7 told '+v.T+' \u00b7 missing '+v.M+')'+
   (v.miss.length?'<div style="font-size:10px;color:#555;margin-top:3px">Still to collect: '+v.miss.map(function(m){return esc(m.n);}).join(' \u00b7 ')+'</div>':'')+
   '<div style="font-size:9.5px;color:#666;margin-top:4px">Rule: \u226570% and nothing missing \u2192 firm price. Below that \u2192 price <b>range</b> only. The A/B/C/D project grade comes from the scoring step, not from this form.</div>'+
   '</td></tr></table>';
  /* F. NOTE / REMARK — the one block on this sheet the PIC writes by hand (2026-10-07, Tony).
     renderPIC() rebuilds #picHost on every paint(), so the textarea must NOT repaint on input:
     setNote() updates the state and the local auto-save only, never paint(). When printing, the
     textarea is hidden and .noteprint is shown in its place (see the @media print rule above). */
  h+='<table><tr class="sec"><td colspan="2">F. NOTE / REMARK (written by the PIC)</td></tr><tr><td colspan="2">'+
   '<textarea id="vpNote" class="noteta" rows="4" placeholder="Anything important the blocks above do not capture \u2014 site conditions, owner promises, risks, next action\u2026" oninput="setNote(this.value)">'+esc(VP.note||'')+'</textarea>'+
   '<div id="vpNotePrint" class="noteprint">'+notePrint()+'</div>'+
   '<div class="notesig" id="vpNoteSig" style="display:'+((VP.note&&String(VP.note).trim())?'block':'none')+'">\u2014 Tony Cheong'+(VP.noteAt?' \u00b7 '+esc(VP.noteAt):'')+'</div>'+
   '</td></tr></table>';
  h+='<div class="foot">'+
   '<div><div class="line"></div><div class="who">Prepared by (PIC) \u2014 <b>Tony Cheong</b></div></div>'+
   '<div><div class="line"></div><div class="who">Checked \u2014 Stage 1 verification ('+v.conf+'%)</div></div>'+
   '<div><div class="line"></div><div class="who">Approved by \u2014 date: '+picToday()+'</div></div></div></div>';
  host.innerHTML=h;
}

/* ===== the F. NOTE / REMARK print twin ==================================================== */
/* VP.note is the single source of truth; pfu-verify.html's setNote() writes it and this reads it. */
function notePrint(){
  var t=String(VP.note==null?'':VP.note).replace(/\s+$/,'');
  if(!t)return '<span class="val mut">no note</span>';
  return esc(t).replace(/\r?\n/g,'<br>');
}

/* ===== namespace handle for approve.html ================================================== */
var MR001={
  SEC:SEC, KO:KO, PICB:PICB,
  compute:mr001Compute,
  render:renderPIC,
  notePrint:notePrint,
  picToday:picToday,
  get LAST(){return LAST;},
  set LAST(v){LAST=v;}
};
