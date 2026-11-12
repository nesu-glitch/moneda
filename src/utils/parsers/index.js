import * as XLSX from "xlsx";
import { sanitizeCellValue } from "../sanitize.js";
import { categorise } from "../categories.js";

// ── Amount parser: handles European (1.234,56) and Anglo (1,234.56) formats ──
export function parseEuroAmount(raw) {
  if(raw===null||raw===undefined||raw==="")return NaN;
  let s=String(raw).trim().replace(/[€$£\s ]/g,"").replace(/[−–]/g,"-");
  s=s.replace(/EUR/gi,"");
  // Accounting negatives: (12,50) and 12,50-
  if(/^\(.*\)$/.test(s))s="-"+s.slice(1,-1);
  if(/^[\d.,]+-$/.test(s))s="-"+s.slice(0,-1);
  if(/\d\.\d{3},/.test(s))return parseFloat(s.replace(/\./g,"").replace(",","."));
  // 1.234 / 12.345.678 — money never has 3 decimals, so dots here are thousands separators
  if(/^-?\d{1,3}(\.\d{3})+$/.test(s))return parseFloat(s.replace(/\./g,""));
  if(/,\d{1,2}$/.test(s)&&!/\./.test(s))return parseFloat(s.replace(",","."));
  return parseFloat(s.replace(",",""));
}
// ── Date parser: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Date objects, datetime strings ──
export function parseFlexDate(raw) {
  if(!raw)return null;
  const p2=n=>String(n).padStart(2,"0");
  if(raw instanceof Date&&!isNaN(raw))return`${raw.getFullYear()}-${p2(raw.getMonth()+1)}-${p2(raw.getDate())}`;
  const s=String(raw).trim().split(" ")[0].split("T")[0];
  let m=s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4}|\d{2})$/);
  if(m)return`${m[3].length===2?"20"+m[3]:m[3]}-${p2(m[2])}-${p2(m[1])}`;
  m=s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if(m)return`${m[1]}-${p2(m[2])}-${p2(m[3])}`;
  return null;
}

// ── Workbook reader ──────────────────────────────────────────────────────────
// Real spreadsheets (.xlsx / .xls): date cells are rewritten to YYYY-MM-DD straight from the
// serial number, so they survive whatever display format the bank used (m/d/yy, d-mmm-yy…)
// and never go through a timezone conversion.
// Text files (.csv, HTML/XML saved as .xls): decoded here (UTF-8, falling back to
// Windows-1252, which Spanish banks still use) and read without value guessing, because
// guessing reads 09/11/2026 as September and "-3,5" as -35.
function readWorkbook(data) {
  const isZip=data[0]===0x50&&data[1]===0x4B, isOle=data[0]===0xD0&&data[1]===0xCF;
  if(!isZip&&!isOle){
    let text;
    try{text=new TextDecoder("utf-8",{fatal:true}).decode(data);}
    catch{text=new TextDecoder("windows-1252").decode(data);}
    return XLSX.read(text.replace(/^﻿/,""),{type:"string",raw:true});
  }
  const wb=XLSX.read(data,{type:"array",cellNF:true});
  const date1904=!!wb.Workbook?.WBProps?.date1904;
  for(const name of wb.SheetNames){
    const ws=wb.Sheets[name];
    for(const addr of Object.keys(ws)){
      if(addr[0]==="!")continue;
      const cell=ws[addr];
      if(cell.t!=="n"||!cell.z||!XLSX.SSF.is_date(cell.z))continue;
      const d=XLSX.SSF.parse_date_code(cell.v,{date1904});
      if(d&&d.y>1900)cell.w=`${d.y}-${p2w(d.m)}-${p2w(d.d)}`;
    }
  }
  return wb;
}
const p2w=n=>String(n).padStart(2,"0");

// ── Header vocabulary ────────────────────────────────────────────────────────
// Column names as banks write them, normalised by normHeader (lowercase, no accents, no
// punctuation). Spanish, Catalan/Valencian, Basque and Galician — Spanish banks follow the
// language of the customer's online banking, so the same bank can export any of these —
// plus English, Portuguese, French, Italian and German for foreign banks used in Spain
// (Revolut, N26, Wise…). Earlier entries win when several columns match.
export const normHeader=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/\(.*?\)/g," ").replace(/[^a-z0-9]+/g," ").trim();
export const HEADER_KW={
  date:[
    "fecha operacion","fecha de operacion","fecha","f operacion","fecha contable",                        // es
    "data operacio","data d operacio","data de l operacio","data",                                        // ca · gl · pt · it
    "data operacion","data da operacion","data de operacion",                                             // gl
    "eragiketa data","eragiketaren data","data eragiketa","eguna",                                         // eu
    "date","transaction date","booking date","completed date","started date","posting date","date completed",
    "date operation","date de l operation","date d operation","datum","buchungstag","buchungsdatum","data movimento","data contabile",
    "fecha valor","f valor","data valor","balio data","value date","valuta","wertstellung","date de valeur",
  ],
  desc:[
    "concepto","descripcion","concepte","descripcio","descricion","descripcao","concepto da operacion",
    "kontzeptua","deskribapena","azalpena","mugimendua","xehetasunak",
    "movimiento","moviment","movemento","detalle","detall","detalles","observaciones",
    "description","details","merchant","partner name","payee","counterparty","reference","name","nombre","nom",
    "libelle","libelle operation","descrizione","causale","verwendungszweck","beschreibung","buchungstext",
  ],
  amount:[
    "importe","import","zenbatekoa","kopurua","cantidad","quantitat","cantidade","montante","monto",
    "amount","value","valor","balioa","montant","importo","betrag","umsatz",
  ],
  debit:["cargo","cargos","carrec","carrecs","debito","debitos","debit","debits","kargua","kargak","zorra","zordunketa",
    "gasto","gastos","despesa","despeses","money out","paid out","withdrawal","withdrawals","debit amount","addebiti","dare","soll","ausgang"],
  credit:["abono","abonos","abonament","abonaments","credito","creditos","credit","credits","abonua","abonuak","hartzekoa",
    "ingreso","ingresos","ingres","ingressos","money in","paid in","deposit","deposits","credit amount","accrediti","avere","haben","eingang"],
  // Never money-in or money-out: running balances
  ignore:["saldo","disponible","saldoa","balance","solde","kontostand","saldo disponible","saldo contable","running balance","saldo final"],
  category:["categoria","category","kategoria","categorie","kategorie","subcategoria"],
  state:["state","status","estado","estat","egoera","estado da operacion"],
};

// exact match → 3, keyword as whole words inside the cell → 1; lower rank = earlier keyword
function matchKw(cell,kws){
  if(!cell||cell.length>40)return null;
  for(let i=0;i<kws.length;i++)if(cell===kws[i])return{score:3,rank:i};
  const padded=` ${cell} `;
  for(let i=0;i<kws.length;i++)if(padded.includes(` ${kws[i]} `))return{score:1,rank:i};
  return null;
}
const isIgnored=c=>HEADER_KW.ignore.some(k=>c===k||c.startsWith(k+" "));
const looksDate=c=>!!matchKw(c,HEADER_KW.date);

// Picks a column for each role from one header row. Columns are never shared between roles.
export function resolveColumns(rawHeader){
  const hdr=rawHeader.map(normHeader),used=new Set();
  const pick=(role,exclude=()=>false)=>{
    let best=-1,bm=null;
    hdr.forEach((c,j)=>{
      if(used.has(j)||isIgnored(c)||exclude(c))return;
      const m=matchKw(c,HEADER_KW[role]);if(!m)return;
      if(!bm||m.score>bm.score||(m.score===bm.score&&m.rank<bm.rank)){bm=m;best=j;}
    });
    if(best>=0)used.add(best);
    return{col:best,score:bm?.score||0};
  };
  const date=pick("date");
  // Separate money-out / money-in columns first (BBVA, CaixaBank, Unicaja…), else one signed column
  const debit=pick("debit",looksDate),credit=pick("credit",looksDate);
  let amount={col:-1,score:0};
  if(debit.col<0||credit.col<0){
    if(debit.col>=0)used.delete(debit.col);
    if(credit.col>=0)used.delete(credit.col);
    amount=pick("amount",looksDate);
  }
  const pair=amount.col<0&&debit.col>=0&&credit.col>=0;
  const desc=pick("desc",looksDate);
  const find=role=>hdr.findIndex(c=>HEADER_KW[role].includes(c));
  return{
    date:date.col,desc:desc.col,amount:amount.col,
    debit:pair?debit.col:-1,credit:pair?credit.col:-1,
    category:find("category"),state:find("state"),
    score:date.score+desc.score+(pair?Math.max(debit.score,credit.score):amount.score),
    complete:date.col>=0&&(amount.col>=0||pair),
  };
}

const COL_LETTER=i=>{let s="";i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26);}return s;};

export function parseBankExport(data,opts={}) {
  const wb=readWorkbook(data),ws=wb.Sheets[wb.SheetNames[0]];
  // Ids must be unique across every file ever loaded: row numbers alone collide between files.
  const tok=Math.random().toString(36).slice(2,8);
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:false});
  if(!rows.length)return{txns:[],comments:{}};

  // ── Detect Moneda re-upload (our own export format) ──────────────────────
  const h0=rows[0].map(c=>String(c).toLowerCase().trim());
  const isMoneda=h0.includes("fecha")&&h0.includes("descripción")&&h0.includes("categoría")&&h0.includes("importe");
  if(isMoneda){
    const fI=h0.indexOf("fecha"),dI=h0.indexOf("descripción"),cI=h0.indexOf("categoría");
    const aI=h0.indexOf("importe"),cmI=h0.indexOf("comentario"),idI=h0.indexOf("id");
    const txns=[],comments={},usedIds=new Set();
    for(let i=1;i<rows.length;i++){
      const row=rows[i];if(!row||row.every(c=>!c))continue;
      const date=parseFlexDate(row[fI])||String(row[fI]||"").trim();
      const desc=sanitizeCellValue(String(row[dI]||"").trim());
      const cat=sanitizeCellValue(String(row[cI]||"").trim())||null;
      const rawAmt=String(row[aI]||"").trim();
      const comment=cmI>=0?sanitizeCellValue(String(row[cmI]||"").trim()):"";
      let amount=parseFloat(rawAmt.replace(/[€$£\s]/g,"").replace(/[−–]/g,"-").replace(",","."));
      if(isNaN(amount))continue;
      // Reuse the exported id so reimbursements and split links survive a save/restore cycle
      let id=idI>=0?String(row[idI]||"").trim():"";
      if(!id||usedIds.has(id))id=`${date}-${i}-${tok}`;
      usedIds.add(id);
      txns.push({id,date,desc,amount:+amount.toFixed(2),cat:cat||null});
      if(comment)comments[id]=comment;
    }
    // Parse extra sheets saved by doExport
    let savedAutoPayments=[],savedReminders=[],savedBudgets={},savedCustomCats=[],savedWidgetConfig=[];
    if(wb.SheetNames.includes("AutoPagos")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["AutoPagos"],{defval:""});savedAutoPayments=rows.map(r=>({id:Date.now()+Math.random(),name:sanitizeCellValue(String(r.Nombre||"").trim()),amount:parseFloat(r.Importe)||0,day:parseInt(r.Dia)||1,month:parseInt(r.Mes)||undefined,frequency:String(r.Frecuencia||"monthly").trim()})).filter(p=>p.name);}
    if(wb.SheetNames.includes("Recordatorios")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Recordatorios"],{defval:""});savedReminders=rows.map(r=>({id:Date.now()+Math.random(),text:sanitizeCellValue(String(r.Texto||"").trim()),done:String(r.Hecho||"").toLowerCase()==="si",repeat:String(r.Repetir||"once").trim()})).filter(r=>r.text);}
    if(wb.SheetNames.includes("Presupuestos")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Presupuestos"],{defval:""});rows.forEach(r=>{const cat=String(r.Categoria||"").trim(),limit=parseFloat(r.LimiteMensual)||0;if(cat&&limit>0)savedBudgets[cat]=limit;});}
    if(wb.SheetNames.includes("Config")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Config"],{defval:""});savedCustomCats=rows.map(r=>sanitizeCellValue(String(r.CategoriaPersonalizada||"").trim())).filter(Boolean);}
    if(wb.SheetNames.includes("Widgets")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Widgets"],{defval:""});savedWidgetConfig=rows.sort((a,b)=>(+a.Orden||0)-(+b.Orden||0)).map(r=>({id:String(r.Id||"").trim(),label:sanitizeCellValue(String(r.Etiqueta||"").trim()),visible:String(r.Visible||"").toLowerCase()==="si"})).filter(w=>w.id);}
    let savedProfile=null;
    if(wb.SheetNames.includes("_moneda_config")){try{const cell=wb.Sheets["_moneda_config"]["A1"];if(cell&&cell.v)savedProfile=JSON.parse(String(cell.v));}catch(_){}}
    let savedSplits=null;
    if(wb.SheetNames.includes("_splits")){try{const cell=wb.Sheets["_splits"]["A1"];if(cell&&cell.v)savedSplits=JSON.parse(String(cell.v));}catch(_){}}
    let savedState=null;
    if(wb.SheetNames.includes("_moneda_state")){try{const cell=wb.Sheets["_moneda_state"]["A1"];if(cell&&cell.v)savedState=JSON.parse(String(cell.v));}catch{/* ignore a corrupt sheet */}}
    return{txns,comments,isMonedaExport:true,savedAutoPayments,savedReminders,savedBudgets,savedCustomCats,savedWidgetConfig,savedProfile,savedSplits,savedState};
  }

  // ── Any bank ────────────────────────────────────────────────────────────────

  // 1. Bank name, only for display
  const topText=rows.slice(0,8).map(r=>r.map(c=>String(c)).join(" ")).join(" ").toLowerCase();
  const BANKS=[["bbva","BBVA"],["caixabank","CaixaBank"],["la caixa","CaixaBank"],["imagin","imagin"],["bankinter","Bankinter"],["sabadell","Sabadell"],
    ["ing direct","ING"],["ing españa","ING"],["unicaja","Unicaja"],["laboral kutxa","Laboral Kutxa"],["kutxabank","Kutxabank"],["kutxa","Kutxabank"],
    ["abanca","Abanca"],["ibercaja","Ibercaja"],["cajamar","Cajamar"],["caja rural","Caja Rural"],["openbank","Openbank"],["santander","Santander"],
    ["revolut","Revolut"],["n26","N26"],["wise","Wise"]];
  const detectedBank=(BANKS.find(([k])=>topText.includes(k))||[])[1]||(/\bing\b/.test(topText)?"ING":null);

  // 2. Header row = the best-scoring row among the first 30
  let headerRow=-1,cols=null;
  for(let i=0;i<Math.min(rows.length,30);i++){
    const r=resolveColumns(rows[i]);
    if(!r.complete)continue;
    // A real header is followed by a row whose date cell parses
    const next=rows.slice(i+1,i+4).some(n=>parseFlexDate(n?.[r.date]));
    const score=r.score+(next?3:0);
    if(!cols||score>cols.score){cols={...r,score};headerRow=i;}
  }

  // 3. Caller-supplied mapping (from the column picker) overrides detection
  const m=opts.mapping;
  if(m){
    cols={date:m.date,desc:m.desc??-1,amount:m.amount??-1,debit:m.debit??-1,credit:m.credit??-1,category:-1,state:-1};
    headerRow=-1; // the date check below skips header and title rows on its own
  }

  // Nothing convincing: hand the file back so the user can point at the columns
  const preview=()=>{
    const width=Math.max(...rows.slice(0,40).map(r=>r.length));
    const labelRow=headerRow>=0?rows[headerRow]:null;
    return{needsMapping:true,bank:detectedBank,preview:{
      columns:Array.from({length:width},(_,j)=>({index:j,label:String(labelRow?.[j]??"").trim()||`${COL_LETTER(j)}`,
        sample:rows.slice(headerRow+1).map(r=>String(r?.[j]??"").trim()).filter(Boolean).slice(0,3)})),
      guess:cols?{date:cols.date,desc:cols.desc,amount:cols.amount,debit:cols.debit,credit:cols.credit}:null,
    },txns:[],comments:{}};
  };
  if(!cols)return preview();

  // 4. Data rows
  const txns=[];
  const SKIP_RE=/^(total|saldo|saldoa|balance|subtotal|solde)\b/i;
  const DEAD_RE=/revert|declin|fail|cancel|rechaz|denega|anul|ezeztat/i;
  for(let i=headerRow+1;i<rows.length;i++){
    const row=rows[i];
    if(!row||row.every(c=>!String(c).trim()))continue;
    const date=parseFlexDate(row[cols.date]);
    if(!date)continue;
    const desc=cols.desc>=0?sanitizeCellValue(String(row[cols.desc]||"").trim()):"";
    if(SKIP_RE.test(desc))continue;
    // Revolut & co. also list failed card payments — those never left the account
    if(cols.state>=0&&DEAD_RE.test(String(row[cols.state]||"")))continue;

    let amount;
    if(cols.debit>=0&&cols.credit>=0){
      const dv=parseEuroAmount(row[cols.debit]),cv=parseEuroAmount(row[cols.credit]);
      if(isNaN(dv)&&isNaN(cv))continue;
      // Some banks already write money-out as negative, others as positive: sign comes from the column
      amount=(isNaN(cv)?0:Math.abs(cv))-(isNaN(dv)?0:Math.abs(dv));
      if(amount===0)continue;
    }else if(cols.amount>=0){
      amount=parseEuroAmount(row[cols.amount]);
      if(isNaN(amount))continue;
    }else continue;
    if(m?.invert)amount=-amount;
    if(!desc&&amount===0)continue;

    let cat=amount>0?"Income":categorise(desc);
    if(!cat&&cols.category>=0){
      const bankCat=sanitizeCellValue(String(row[cols.category]||"").trim());
      if(bankCat)cat=bankCat;
    }
    txns.push({id:`${date}-${i}-${tok}`,date,desc,amount:+amount.toFixed(2),cat});
  }
  // Headers matched but no row parsed (odd date or number format): let the user check the columns
  if(!txns.length&&!m)return preview();
  return{txns,comments:{},bank:detectedBank};
}
export function doExport(transactions,comments,{autoPayments=[],reminders=[],budgets={},customCats=[],widgetConfig=[],profile={},splitGroups=[],splitExpenses=[],settlements=[],reimbursed={},catGroups=[]}={}) {
  const wb=XLSX.utils.book_new();
  const data=transactions.map(t=>({Fecha:t.date,Descripción:t.desc,Categoría:t.cat||"",Importe:t.amount,Tipo:t.amount>=0?"Ingreso":"Gasto",Comentario:comments[t.id]||"",ID:t.id}));
  const ws=XLSX.utils.json_to_sheet(data);ws["!cols"]=[{wch:12},{wch:45},{wch:16},{wch:10},{wch:10},{wch:40},{wch:24}];
  XLSX.utils.book_append_sheet(wb,ws,"Transacciones");
  if(autoPayments.length>0){const d=autoPayments.map(p=>({Nombre:p.name,Importe:p.amount,Dia:p.day,Mes:p.month||"",Frecuencia:p.frequency}));const w=XLSX.utils.json_to_sheet(d);w["!cols"]=[{wch:20},{wch:10},{wch:6},{wch:6},{wch:12}];XLSX.utils.book_append_sheet(wb,w,"AutoPagos");}
  if(reminders.length>0){const d=reminders.map(r=>({Texto:r.text,Hecho:r.done?"Si":"No",Repetir:r.repeat}));const w=XLSX.utils.json_to_sheet(d);w["!cols"]=[{wch:40},{wch:8},{wch:12}];XLSX.utils.book_append_sheet(wb,w,"Recordatorios");}
  const budgetEntries=Object.entries(budgets).filter(([,v])=>v>0);
  if(budgetEntries.length>0){const d=budgetEntries.map(([cat,limit])=>({Categoria:cat,LimiteMensual:limit}));const w=XLSX.utils.json_to_sheet(d);w["!cols"]=[{wch:16},{wch:14}];XLSX.utils.book_append_sheet(wb,w,"Presupuestos");}
  if(customCats.length>0){const d=customCats.map(cat=>({CategoriaPersonalizada:cat}));const w=XLSX.utils.json_to_sheet(d);w["!cols"]=[{wch:22}];XLSX.utils.book_append_sheet(wb,w,"Config");}
  if(widgetConfig.length>0){const d=widgetConfig.map((wid,i)=>({Id:wid.id,Etiqueta:wid.label,Visible:wid.visible?"Si":"No",Orden:i+1}));const w=XLSX.utils.json_to_sheet(d);w["!cols"]=[{wch:16},{wch:28},{wch:8},{wch:7}];XLSX.utils.book_append_sheet(wb,w,"Widgets");}
  // _moneda_config — single-cell JSON profile snapshot (silent, not visible to user)
  const cfgWs=XLSX.utils.aoa_to_sheet([[JSON.stringify({userName:profile.userName||"",lang:profile.lang||"es",themeId:profile.themeId||"nature",avatar:profile.avatar||"",goal:profile.goal||"know",...(typeof profile.motion==="boolean"?{motion:profile.motion}:{})})]]);
  XLSX.utils.book_append_sheet(wb,cfgWs,"_moneda_config");
  // _splits — split groups, expenses and settlements as JSON
  const splitsWs=XLSX.utils.aoa_to_sheet([[JSON.stringify({splitGroups,splitExpenses,settlements})]]);
  XLSX.utils.book_append_sheet(wb,splitsWs,"_splits");
  // _moneda_state — reimbursements (keyed by transaction ID) and budget groups
  const stateWs=XLSX.utils.aoa_to_sheet([[JSON.stringify({reimbursed,catGroups})]]);
  XLSX.utils.book_append_sheet(wb,stateWs,"_moneda_state");
  XLSX.writeFile(wb,`moneda_${new Date().toISOString().split("T")[0]}.xlsx`);
}
